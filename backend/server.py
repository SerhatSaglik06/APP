from fastapi import FastAPI, APIRouter, HTTPException, Depends, status
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials
from dotenv import load_dotenv
from starlette.middleware.cors import CORSMiddleware
from motor.motor_asyncio import AsyncIOMotorClient
import os
import logging
from pathlib import Path
from pydantic import BaseModel, Field, EmailStr
from typing import List, Optional
import uuid
from datetime import datetime, timedelta
from passlib.context import CryptContext
from jose import JWTError, jwt
from openai import OpenAI
import base64
import json

ROOT_DIR = Path(__file__).parent
load_dotenv(ROOT_DIR / '.env')

# MongoDB connection
mongo_url = os.environ['MONGO_URL']
client = AsyncIOMotorClient(mongo_url)
db = client[os.environ.get('DB_NAME', 'food_tracker_db')]

# Security
pwd_context = CryptContext(schemes=["bcrypt"], deprecated="auto")
security = HTTPBearer()
JWT_SECRET = os.environ.get('JWT_SECRET', 'your-secret-key-change-in-production')
JWT_ALGORITHM = os.environ.get('JWT_ALGORITHM', 'HS256')
JWT_EXPIRATION_HOURS = int(os.environ.get('JWT_EXPIRATION_HOURS', 168))

# OpenAI API Key
OPENAI_API_KEY = os.environ.get('OPENAI_API_KEY', '')

app = FastAPI()
api_router = APIRouter(prefix="/api")

# ==================== MODELS ====================

class UserRegister(BaseModel):
    email: EmailStr
    username: str
    password: str

class UserLogin(BaseModel):
    email: EmailStr
    password: str

class UserResponse(BaseModel):
    id: str
    email: str
    username: str
    daily_calorie_goal: int
    created_at: datetime

class TokenResponse(BaseModel):
    access_token: str
    token_type: str
    user: UserResponse

class UpdateGoal(BaseModel):
    daily_calorie_goal: int

class MealAnalyzeRequest(BaseModel):
    image_base64: str
    meal_type: Optional[str] = "snack"

class MealResponse(BaseModel):
    id: str
    user_id: str
    food_name: str
    calories: float
    protein: float
    carbs: float
    image_base64: str
    meal_type: str
    timestamp: datetime

class DailySummary(BaseModel):
    total_calories: float
    total_protein: float
    total_carbs: float
    goal: int
    meals_count: int

class WeeklyStats(BaseModel):
    avg_calories: float
    avg_protein: float
    avg_carbs: float
    total_meals: int
    days_tracked: int

# ==================== AUTH UTILS ====================

def verify_password(plain_password: str, hashed_password: str) -> bool:
    return pwd_context.verify(plain_password, hashed_password)

def get_password_hash(password: str) -> str:
    return pwd_context.hash(password)

def create_access_token(data: dict) -> str:
    to_encode = data.copy()
    expire = datetime.utcnow() + timedelta(hours=JWT_EXPIRATION_HOURS)
    to_encode.update({"exp": expire})
    encoded_jwt = jwt.encode(to_encode, JWT_SECRET, algorithm=JWT_ALGORITHM)
    return encoded_jwt

async def get_current_user(credentials: HTTPAuthorizationCredentials = Depends(security)):
    token = credentials.credentials
    try:
        payload = jwt.decode(token, JWT_SECRET, algorithms=[JWT_ALGORITHM])
        user_id: str = payload.get("sub")
        if user_id is None:
            raise HTTPException(status_code=401, detail="Invalid authentication credentials")
    except JWTError:
        raise HTTPException(status_code=401, detail="Invalid authentication credentials")
    
    user = await db.users.find_one({"_id": user_id})
    if user is None:
        raise HTTPException(status_code=401, detail="User not found")
    return user

# ==================== AUTH ENDPOINTS ====================

@api_router.post("/auth/register", response_model=TokenResponse)
async def register(user_data: UserRegister):
    # Check if user exists
    existing_user = await db.users.find_one({"email": user_data.email})
    if existing_user:
        raise HTTPException(status_code=400, detail="Email already registered")
    
    existing_username = await db.users.find_one({"username": user_data.username})
    if existing_username:
        raise HTTPException(status_code=400, detail="Username already taken")
    
    # Create user
    user_id = str(uuid.uuid4())
    user_dict = {
        "_id": user_id,
        "email": user_data.email,
        "username": user_data.username,
        "password_hash": get_password_hash(user_data.password),
        "daily_calorie_goal": 2000,
        "created_at": datetime.utcnow()
    }
    
    await db.users.insert_one(user_dict)
    
    # Create token
    access_token = create_access_token(data={"sub": user_id})
    
    user_response = UserResponse(
        id=user_id,
        email=user_dict["email"],
        username=user_dict["username"],
        daily_calorie_goal=user_dict["daily_calorie_goal"],
        created_at=user_dict["created_at"]
    )
    
    return TokenResponse(
        access_token=access_token,
        token_type="bearer",
        user=user_response
    )

@api_router.post("/auth/login", response_model=TokenResponse)
async def login(user_data: UserLogin):
    user = await db.users.find_one({"email": user_data.email})
    if not user:
        raise HTTPException(status_code=401, detail="Invalid email or password")
    
    if not verify_password(user_data.password, user["password_hash"]):
        raise HTTPException(status_code=401, detail="Invalid email or password")
    
    access_token = create_access_token(data={"sub": user["_id"]})
    
    user_response = UserResponse(
        id=user["_id"],
        email=user["email"],
        username=user["username"],
        daily_calorie_goal=user.get("daily_calorie_goal", 2000),
        created_at=user["created_at"]
    )
    
    return TokenResponse(
        access_token=access_token,
        token_type="bearer",
        user=user_response
    )

# ==================== USER ENDPOINTS ====================

@api_router.get("/user/profile", response_model=UserResponse)
async def get_profile(current_user: dict = Depends(get_current_user)):
    return UserResponse(
        id=current_user["_id"],
        email=current_user["email"],
        username=current_user["username"],
        daily_calorie_goal=current_user.get("daily_calorie_goal", 2000),
        created_at=current_user["created_at"]
    )

@api_router.put("/user/goal", response_model=UserResponse)
async def update_goal(goal_data: UpdateGoal, current_user: dict = Depends(get_current_user)):
    await db.users.update_one(
        {"_id": current_user["_id"]},
        {"$set": {"daily_calorie_goal": goal_data.daily_calorie_goal}}
    )
    
    updated_user = await db.users.find_one({"_id": current_user["_id"]})
    
    return UserResponse(
        id=updated_user["_id"],
        email=updated_user["email"],
        username=updated_user["username"],
        daily_calorie_goal=updated_user["daily_calorie_goal"],
        created_at=updated_user["created_at"]
    )

@api_router.delete("/user/delete")
async def delete_account(current_user: dict = Depends(get_current_user)):
    """
    Delete user account and all associated data (meals).
    This is required by Apple App Store guidelines for account deletion.
    """
    user_id = current_user["_id"]
    
    # Delete all user's meals
    await db.meals.delete_many({"user_id": user_id})
    
    # Delete user account
    result = await db.users.delete_one({"_id": user_id})
    
    if result.deleted_count == 0:
        raise HTTPException(status_code=404, detail="User not found")
    
    return {"message": "Account successfully deleted", "deleted": True}

# ==================== MEAL ANALYSIS ====================

@api_router.post("/meals/analyze", response_model=MealResponse)
async def analyze_meal(meal_data: MealAnalyzeRequest, current_user: dict = Depends(get_current_user)):
    try:
        # Initialize OpenAI client
        client = OpenAI(api_key=OPENAI_API_KEY)
        
        # Create message with image for GPT-4 Vision
        response = client.chat.completions.create(
            model="gpt-4o",
            messages=[
                {
                    "role": "system",
                    "content": "You are a nutrition expert. Analyze food images and provide accurate nutritional information in JSON format only."
                },
                {
                    "role": "user",
                    "content": [
                        {
                            "type": "text",
                            "text": """Analyze this food image and provide nutritional information in the following JSON format ONLY (no extra text):
{
  "food_name": "name of the food",
  "calories": estimated calories (number),
  "protein": estimated protein in grams (number),
  "carbs": estimated carbohydrates in grams (number)
}
Be as accurate as possible based on typical serving sizes."""
                        },
                        {
                            "type": "image_url",
                            "image_url": {
                                "url": f"data:image/jpeg;base64,{meal_data.image_base64}"
                            }
                        }
                    ]
                }
            ],
            max_tokens=500
        )
        
        # Get response text
        response_text = response.choices[0].message.content.strip()
        
        # Parse JSON response
        try:
            if "```json" in response_text:
                response_text = response_text.split("```json")[1].split("```")[0].strip()
            elif "```" in response_text:
                response_text = response_text.split("```")[1].split("```")[0].strip()
            
            nutrition_data = json.loads(response_text)
        except:
            raise HTTPException(status_code=500, detail="Failed to parse nutrition data from AI response")
        
        # Store meal in database
        meal_id = str(uuid.uuid4())
        meal_dict = {
            "_id": meal_id,
            "user_id": current_user["_id"],
            "food_name": nutrition_data.get("food_name", "Unknown Food"),
            "calories": float(nutrition_data.get("calories", 0)),
            "protein": float(nutrition_data.get("protein", 0)),
            "carbs": float(nutrition_data.get("carbs", 0)),
            "image_base64": meal_data.image_base64,
            "meal_type": meal_data.meal_type,
            "timestamp": datetime.utcnow()
        }
        
        await db.meals.insert_one(meal_dict)
        
        return MealResponse(
            id=meal_id,
            user_id=current_user["_id"],
            food_name=meal_dict["food_name"],
            calories=meal_dict["calories"],
            protein=meal_dict["protein"],
            carbs=meal_dict["carbs"],
            image_base64=meal_dict["image_base64"],
            meal_type=meal_dict["meal_type"],
            timestamp=meal_dict["timestamp"]
        )
        
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error analyzing meal: {str(e)}")
        raise HTTPException(status_code=500, detail=f"Error analyzing meal: {str(e)}")

# ==================== MEAL HISTORY ====================

@api_router.get("/meals/today", response_model=DailySummary)
async def get_today_meals(current_user: dict = Depends(get_current_user)):
    # Get today's start and end
    today_start = datetime.utcnow().replace(hour=0, minute=0, second=0, microsecond=0)
    today_end = today_start + timedelta(days=1)
    
    meals = await db.meals.find({
        "user_id": current_user["_id"],
        "timestamp": {"$gte": today_start, "$lt": today_end}
    }).to_list(1000)
    
    total_calories = sum(meal.get("calories", 0) for meal in meals)
    total_protein = sum(meal.get("protein", 0) for meal in meals)
    total_carbs = sum(meal.get("carbs", 0) for meal in meals)
    
    return DailySummary(
        total_calories=total_calories,
        total_protein=total_protein,
        total_carbs=total_carbs,
        goal=current_user.get("daily_calorie_goal", 2000),
        meals_count=len(meals)
    )

@api_router.get("/meals/history", response_model=List[MealResponse])
async def get_meal_history(limit: int = 50, current_user: dict = Depends(get_current_user)):
    meals = await db.meals.find(
        {"user_id": current_user["_id"]}
    ).sort("timestamp", -1).limit(limit).to_list(limit)
    
    return [
        MealResponse(
            id=meal["_id"],
            user_id=meal["user_id"],
            food_name=meal["food_name"],
            calories=meal["calories"],
            protein=meal["protein"],
            carbs=meal["carbs"],
            image_base64=meal["image_base64"],
            meal_type=meal["meal_type"],
            timestamp=meal["timestamp"]
        )
        for meal in meals
    ]

# ==================== STATISTICS ====================

@api_router.get("/stats/weekly", response_model=WeeklyStats)
async def get_weekly_stats(current_user: dict = Depends(get_current_user)):
    # Get last 7 days
    week_start = datetime.utcnow() - timedelta(days=7)
    
    meals = await db.meals.find({
        "user_id": current_user["_id"],
        "timestamp": {"$gte": week_start}
    }).to_list(1000)
    
    if not meals:
        return WeeklyStats(
            avg_calories=0,
            avg_protein=0,
            avg_carbs=0,
            total_meals=0,
            days_tracked=0
        )
    
    total_calories = sum(meal.get("calories", 0) for meal in meals)
    total_protein = sum(meal.get("protein", 0) for meal in meals)
    total_carbs = sum(meal.get("carbs", 0) for meal in meals)
    
    # Count unique days
    unique_days = len(set(meal["timestamp"].date() for meal in meals))
    
    return WeeklyStats(
        avg_calories=total_calories / unique_days if unique_days > 0 else 0,
        avg_protein=total_protein / unique_days if unique_days > 0 else 0,
        avg_carbs=total_carbs / unique_days if unique_days > 0 else 0,
        total_meals=len(meals),
        days_tracked=unique_days
    )

@api_router.get("/stats/monthly", response_model=WeeklyStats)
async def get_monthly_stats(current_user: dict = Depends(get_current_user)):
    # Get last 30 days
    month_start = datetime.utcnow() - timedelta(days=30)
    
    meals = await db.meals.find({
        "user_id": current_user["_id"],
        "timestamp": {"$gte": month_start}
    }).to_list(1000)
    
    if not meals:
        return WeeklyStats(
            avg_calories=0,
            avg_protein=0,
            avg_carbs=0,
            total_meals=0,
            days_tracked=0
        )
    
    total_calories = sum(meal.get("calories", 0) for meal in meals)
    total_protein = sum(meal.get("protein", 0) for meal in meals)
    total_carbs = sum(meal.get("carbs", 0) for meal in meals)
    
    unique_days = len(set(meal["timestamp"].date() for meal in meals))
    
    return WeeklyStats(
        avg_calories=total_calories / unique_days if unique_days > 0 else 0,
        avg_protein=total_protein / unique_days if unique_days > 0 else 0,
        avg_carbs=total_carbs / unique_days if unique_days > 0 else 0,
        total_meals=len(meals),
        days_tracked=unique_days
    )

# ==================== HEALTH CHECK ====================

@api_router.get("/")
async def root():
    return {"message": "Food Tracker API", "status": "healthy"}

# Include router
app.include_router(api_router)

app.add_middleware(
    CORSMiddleware,
    allow_credentials=True,
    allow_origins=["*"],
    allow_methods=["*"],
    allow_headers=["*"],
)

logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(name)s - %(levelname)s - %(message)s'
)
logger = logging.getLogger(__name__)

@app.on_event("shutdown")
async def shutdown_db_client():
    client.close()
