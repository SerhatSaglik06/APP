"""
Falyn - AI Günlük Burç & Fal Uygulaması - Backend API
"""
from fastapi import FastAPI, HTTPException, Request
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel, Field, EmailStr
from typing import Optional, List
from datetime import datetime, timedelta
from bson import ObjectId
from motor.motor_asyncio import AsyncIOMotorClient
from dotenv import load_dotenv
from passlib.context import CryptContext
import os
import uuid
import re
from emergentintegrations.llm.chat import LlmChat, UserMessage

load_dotenv()

# Password hashing
pwd_context = CryptContext(schemes=["bcrypt"], deprecated="auto")

def hash_password(password: str) -> str:
    return pwd_context.hash(password)

def verify_password(plain_password: str, hashed_password: str) -> bool:
    return pwd_context.verify(plain_password, hashed_password)

# MongoDB Setup
MONGO_URL = os.getenv("MONGO_URL", "mongodb://localhost:27017")
DB_NAME = os.getenv("DB_NAME", "falyn_db")
EMERGENT_LLM_KEY = os.getenv("EMERGENT_LLM_KEY")

client = AsyncIOMotorClient(MONGO_URL)
db = client[DB_NAME]
users_collection = db["users"]
readings_collection = db["readings"]

app = FastAPI(title="Falyn - AI Günlük Burç & Fal API")

# CORS
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Pydantic Models
class UserRegister(BaseModel):
    email: str
    username: str
    password: str
    device_id: str

class UserLogin(BaseModel):
    email: str
    password: str
    device_id: str

class UserUpdate(BaseModel):
    zodiac_sign: Optional[str] = None
    preferred_tone: Optional[str] = None
    notification_enabled: Optional[bool] = None
    notification_time: Optional[str] = None

class ReadingRequest(BaseModel):
    device_id: str
    focus: str  # "relationships", "work_money", "decisions", "general"
    tone: str  # "realistic", "motivational"
    zodiac_sign: Optional[str] = None

class ExpandReadingRequest(BaseModel):
    reading_id: str
    device_id: str

class UserResponse(BaseModel):
    id: str
    device_id: str
    email: str
    username: str
    zodiac_sign: Optional[str]
    preferred_tone: Optional[str]
    notification_enabled: bool
    notification_time: str
    free_readings_today: int
    last_reading_date: Optional[str]

class ReadingResponse(BaseModel):
    id: str
    user_id: str
    focus: str
    tone: str
    zodiac_sign: Optional[str]
    daily_energy: str
    focus_comment: str
    fortune_message: str
    daily_advice: str
    detailed_content: Optional[str]
    is_expanded: bool
    created_at: str

# Helper Functions
def serialize_doc(doc) -> dict:
    if doc is None:
        return None
    doc["id"] = str(doc.pop("_id"))
    if "last_reading_date" in doc and doc["last_reading_date"]:
        doc["last_reading_date"] = doc["last_reading_date"].isoformat()
    if "created_at" in doc and doc["created_at"]:
        doc["created_at"] = doc["created_at"].isoformat()
    return doc

def get_today_start():
    """Get the start of today in UTC"""
    now = datetime.utcnow()
    return datetime(now.year, now.month, now.day)

def validate_email(email: str) -> bool:
    """Simple email validation"""
    pattern = r'^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$'
    return re.match(pattern, email) is not None

# Turkish translations for focus areas
FOCUS_TRANSLATIONS = {
    "relationships": "İlişkiler",
    "work_money": "İş ve Para",
    "decisions": "Kendi Kararları",
    "general": "Genel Bakış"
}

TONE_TRANSLATIONS = {
    "realistic": "Daha Gerçekçi",
    "motivational": "Daha Motive Edici"
}

ZODIAC_TURKISH = {
    "aries": "Koç",
    "taurus": "Boğa",
    "gemini": "İkizler",
    "cancer": "Yengeç",
    "leo": "Aslan",
    "virgo": "Başak",
    "libra": "Terazi",
    "scorpio": "Akrep",
    "sagittarius": "Yay",
    "capricorn": "Oğlak",
    "aquarius": "Kova",
    "pisces": "Balık"
}

async def generate_reading_content(focus: str, tone: str, zodiac_sign: Optional[str] = None, username: Optional[str] = None, is_detailed: bool = False):
    """Generate AI-powered horoscope reading"""
    
    focus_text = FOCUS_TRANSLATIONS.get(focus, "Genel Bakış")
    tone_text = TONE_TRANSLATIONS.get(tone, "Daha Motive Edici")
    zodiac_text = ZODIAC_TURKISH.get(zodiac_sign, None) if zodiac_sign else None
    
    today = datetime.now().strftime("%d %B %Y")
    
    word_count = "180-250" if is_detailed else "120-180"
    
    name_part = f"Kullanıcının adı: {username}. Yorumda adını kullanabilirsin." if username else ""
    
    system_message = f"""Sen Falyn uygulamasının deneyimli astroloji ve fal yorumcususun. Türkçe olarak kişiselleştirilmiş, dengeli ve pozitif burç/fal yorumları üretiyorsun.

KURALLAR (ÇOK ÖNEMLİ):
- Asla korkutucu, negatif veya endişe verici içerik üretme
- Kesin gelecek vaatleri yapma, olasılıklardan ve enerjilerden bahset
- Agresif veya baskıcı dil kullanma
- Her zaman rehberlik hissi ver, yönlendir ama zorla değil
- Umut verici ve destekleyici ol
- Türkçe dilbilgisi kurallarına dikkat et, akıcı ve doğal yaz
{name_part}

TON:
- "Daha Gerçekçi": Net, objektif, daha az duygusal ama yine pozitif
- "Daha Motive Edici": Destekleyici, yumuşak, umut verici, cesaret veren

ÇIKTI FORMATI (JSON):
{{
    "daily_energy": "Günün enerjisi hakkında 2-3 cümle",
    "focus_comment": "Seçilen odak alanına özel yorum, 3-4 cümle",
    "fortune_message": "Kısa ve etkileyici fal mesajı, 1-2 cümle",
    "daily_advice": "Günün tavsiyesi, pratik ve uygulanabilir, 2 cümle"
}}

Sadece JSON formatında yanıt ver, başka bir şey ekleme."""

    zodiac_part = f"\n- Kullanıcının burcu: {zodiac_text}" if zodiac_text else "\n- Kullanıcı burcunu belirtmedi, genel enerji üzerinden yorum yap"
    detail_part = "\n- Bu DETAYLI bir yorum, daha derin içgörüler ve öneriler ekle" if is_detailed else ""
    
    user_prompt = f"""Bugün: {today}
- Odak alanı: {focus_text}
- İstenen ton: {tone_text}{zodiac_part}{detail_part}

Lütfen bu parametrelere göre kişiselleştirilmiş bir günlük burç/fal yorumu üret. {word_count} kelime civarında olsun."""

    try:
        chat = LlmChat(
            api_key=EMERGENT_LLM_KEY,
            session_id=f"reading-{uuid.uuid4()}",
            system_message=system_message
        ).with_model("openai", "gpt-4o")
        
        user_message = UserMessage(text=user_prompt)
        response = await chat.send_message(user_message)
        
        # Parse JSON response
        import json
        # Clean up the response - remove markdown code blocks if present
        cleaned_response = response.strip()
        if cleaned_response.startswith("```json"):
            cleaned_response = cleaned_response[7:]
        if cleaned_response.startswith("```"):
            cleaned_response = cleaned_response[3:]
        if cleaned_response.endswith("```"):
            cleaned_response = cleaned_response[:-3]
        
        content = json.loads(cleaned_response.strip())
        return content
    except Exception as e:
        print(f"AI generation error: {e}")
        # Fallback content
        return {
            "daily_energy": "Bugün evrenin enerjisi seninle birlikte akıyor. İçindeki gücü hisset ve ona güven.",
            "focus_comment": f"'{focus_text}' alanında bugün önemli fırsatlar seni bekliyor. Dikkatli ol ve fırsatları değerlendir.",
            "fortune_message": "Yolun açık, kalbin temiz. Güzel şeyler yolda.",
            "daily_advice": "Bugün küçük adımlarla büyük değişimler yaratabilirsin. Kendine zaman ayır ve içsel sesini dinle."
        }

# API Endpoints

@app.get("/api/health")
async def health_check():
    return {"status": "healthy", "service": "Falyn - AI Günlük Burç & Fal API"}

@app.post("/api/auth/register")
async def register_user(user_data: UserRegister):
    """Register a new user with email, username and password"""
    
    # Validate email
    if not validate_email(user_data.email):
        raise HTTPException(status_code=400, detail="Geçersiz email formatı")
    
    # Check if email already exists
    existing_email = await users_collection.find_one({"email": user_data.email.lower()})
    if existing_email:
        raise HTTPException(status_code=400, detail="Bu email adresi zaten kayıtlı")
    
    # Check username length
    if len(user_data.username.strip()) < 2:
        raise HTTPException(status_code=400, detail="Kullanıcı adı en az 2 karakter olmalı")
    
    # Check password length
    if len(user_data.password) < 6:
        raise HTTPException(status_code=400, detail="Şifre en az 6 karakter olmalı")
    
    # Create new user with hashed password
    new_user = {
        "email": user_data.email.lower(),
        "username": user_data.username.strip(),
        "password_hash": hash_password(user_data.password),
        "device_id": user_data.device_id,
        "zodiac_sign": None,
        "preferred_tone": "motivational",
        "notification_enabled": True,
        "notification_time": "09:00",
        "free_readings_today": 0,
        "last_reading_date": None,
        "created_at": datetime.utcnow()
    }
    
    result = await users_collection.insert_one(new_user)
    new_user["_id"] = result.inserted_id
    # Don't return password hash
    del new_user["password_hash"]
    return serialize_doc(new_user)

@app.post("/api/auth/login")
async def login_user(user_data: UserLogin):
    """Login user with email and password"""
    
    user = await users_collection.find_one({"email": user_data.email.lower()})
    
    if not user:
        raise HTTPException(status_code=404, detail="Bu email ile kayıtlı kullanıcı bulunamadı")
    
    # Verify password
    if not user.get("password_hash") or not verify_password(user_data.password, user["password_hash"]):
        raise HTTPException(status_code=401, detail="Şifre yanlış")
    
    # Update device_id
    await users_collection.update_one(
        {"_id": user["_id"]},
        {"$set": {"device_id": user_data.device_id}}
    )
    user["device_id"] = user_data.device_id
    
    # Check and reset daily readings if it's a new day
    today_start = get_today_start()
    last_reading = user.get("last_reading_date")
    
    if last_reading and last_reading < today_start:
        await users_collection.update_one(
            {"_id": user["_id"]},
            {"$set": {"free_readings_today": 0}}
        )
        user["free_readings_today"] = 0
    
    # Don't return password hash
    if "password_hash" in user:
        del user["password_hash"]
    
    return serialize_doc(user)

@app.post("/api/auth/check")
async def check_user(data: dict):
    """Check if user exists by device_id or email"""
    device_id = data.get("device_id")
    email = data.get("email")
    
    user = None
    if device_id:
        user = await users_collection.find_one({"device_id": device_id})
    if not user and email:
        user = await users_collection.find_one({"email": email.lower()})
    
    if user:
        # Check and reset daily readings if it's a new day
        today_start = get_today_start()
        last_reading = user.get("last_reading_date")
        
        if last_reading and last_reading < today_start:
            await users_collection.update_one(
                {"_id": user["_id"]},
                {"$set": {"free_readings_today": 0}}
            )
            user["free_readings_today"] = 0
        
        return {"exists": True, "user": serialize_doc(user)}
    
    return {"exists": False, "user": None}

@app.put("/api/users/{device_id}")
async def update_user(device_id: str, user_data: UserUpdate):
    """Update user preferences"""
    update_data = {k: v for k, v in user_data.model_dump().items() if v is not None}
    
    if not update_data:
        raise HTTPException(status_code=400, detail="No data to update")
    
    result = await users_collection.find_one_and_update(
        {"device_id": device_id},
        {"$set": update_data},
        return_document=True
    )
    
    if not result:
        raise HTTPException(status_code=404, detail="User not found")
    
    return serialize_doc(result)

@app.get("/api/users/{device_id}")
async def get_user(device_id: str):
    """Get user by device ID"""
    user = await users_collection.find_one({"device_id": device_id})
    
    if not user:
        raise HTTPException(status_code=404, detail="User not found")
    
    # Check and reset daily readings if it's a new day
    today_start = get_today_start()
    last_reading = user.get("last_reading_date")
    
    if last_reading and last_reading < today_start:
        await users_collection.update_one(
            {"_id": user["_id"]},
            {"$set": {"free_readings_today": 0}}
        )
        user["free_readings_today"] = 0
    
    return serialize_doc(user)

@app.get("/api/readings/check-daily/{device_id}")
async def check_daily_reading(device_id: str):
    """Check if user has already used their free daily reading"""
    user = await users_collection.find_one({"device_id": device_id})
    
    if not user:
        return {"has_free_reading": True, "readings_used": 0}
    
    today_start = get_today_start()
    last_reading = user.get("last_reading_date")
    
    # Reset if it's a new day
    if last_reading and last_reading < today_start:
        return {"has_free_reading": True, "readings_used": 0}
    
    readings_used = user.get("free_readings_today", 0)
    return {
        "has_free_reading": readings_used < 1,
        "readings_used": readings_used
    }

@app.post("/api/readings/generate")
async def generate_reading(request: ReadingRequest):
    """Generate a new horoscope reading"""
    
    # Get user
    user = await users_collection.find_one({"device_id": request.device_id})
    if not user:
        raise HTTPException(status_code=404, detail="Kullanıcı bulunamadı. Lütfen önce giriş yapın.")
    
    # Check daily limit
    today_start = get_today_start()
    last_reading = user.get("last_reading_date")
    
    if last_reading and last_reading < today_start:
        # Reset for new day
        await users_collection.update_one(
            {"_id": user["_id"]},
            {"$set": {"free_readings_today": 0}}
        )
        user["free_readings_today"] = 0
    
    readings_used = user.get("free_readings_today", 0)
    is_free_reading = readings_used < 1
    
    # Generate AI content
    content = await generate_reading_content(
        focus=request.focus,
        tone=request.tone,
        zodiac_sign=request.zodiac_sign,
        username=user.get("username"),
        is_detailed=False
    )
    
    # Create reading document
    reading = {
        "user_id": str(user["_id"]),
        "device_id": request.device_id,
        "focus": request.focus,
        "tone": request.tone,
        "zodiac_sign": request.zodiac_sign,
        "daily_energy": content["daily_energy"],
        "focus_comment": content["focus_comment"],
        "fortune_message": content["fortune_message"],
        "daily_advice": content["daily_advice"],
        "detailed_content": None,
        "is_expanded": False,
        "is_free": is_free_reading,
        "created_at": datetime.utcnow()
    }
    
    result = await readings_collection.insert_one(reading)
    reading["_id"] = result.inserted_id
    
    # Update user's reading count
    await users_collection.update_one(
        {"_id": user["_id"]},
        {
            "$set": {
                "last_reading_date": datetime.utcnow(),
                "zodiac_sign": request.zodiac_sign or user.get("zodiac_sign"),
                "preferred_tone": request.tone
            },
            "$inc": {"free_readings_today": 1}
        }
    )
    
    serialized = serialize_doc(reading)
    serialized["is_free"] = is_free_reading
    
    return serialized

@app.post("/api/readings/expand")
async def expand_reading(request: ExpandReadingRequest):
    """Expand a reading with more detailed content (after watching ad)"""
    
    reading = await readings_collection.find_one({"_id": ObjectId(request.reading_id)})
    
    if not reading:
        raise HTTPException(status_code=404, detail="Reading not found")
    
    if reading["device_id"] != request.device_id:
        raise HTTPException(status_code=403, detail="Unauthorized")
    
    if reading.get("is_expanded"):
        # Already expanded, return existing
        return serialize_doc(reading)
    
    # Get user for username
    user = await users_collection.find_one({"device_id": request.device_id})
    username = user.get("username") if user else None
    
    # Generate detailed content
    detailed_content = await generate_reading_content(
        focus=reading["focus"],
        tone=reading["tone"],
        zodiac_sign=reading["zodiac_sign"],
        username=username,
        is_detailed=True
    )
    
    # Combine into detailed text
    detailed_text = f"""🌟 Detaylı Analiz

{detailed_content['daily_energy']}

{detailed_content['focus_comment']}

✨ {detailed_content['fortune_message']}

💫 {detailed_content['daily_advice']}"""
    
    # Update reading
    await readings_collection.update_one(
        {"_id": ObjectId(request.reading_id)},
        {"$set": {
            "detailed_content": detailed_text,
            "is_expanded": True
        }}
    )
    
    reading["detailed_content"] = detailed_text
    reading["is_expanded"] = True
    
    return serialize_doc(reading)

@app.get("/api/readings/history/{device_id}")
async def get_reading_history(device_id: str, limit: int = 10):
    """Get user's reading history"""
    
    readings = await readings_collection.find(
        {"device_id": device_id}
    ).sort("created_at", -1).limit(limit).to_list(length=limit)
    
    result = []
    for reading in readings:
        result.append(serialize_doc(reading))
    
    return result

@app.get("/api/readings/today/{device_id}")
async def get_today_reading(device_id: str):
    """Get today's reading if exists"""
    today_start = get_today_start()
    
    reading = await readings_collection.find_one({
        "device_id": device_id,
        "created_at": {"$gte": today_start}
    }, sort=[("created_at", -1)])
    
    if not reading:
        return {"has_reading": False, "reading": None}
    
    return {"has_reading": True, "reading": serialize_doc(reading)}

# Legacy endpoint for backward compatibility
@app.post("/api/users/register")
async def legacy_register(data: dict):
    """Legacy registration - redirect to check"""
    device_id = data.get("device_id")
    if device_id:
        user = await users_collection.find_one({"device_id": device_id})
        if user:
            return serialize_doc(user)
    return {"error": "Please use /api/auth/register or /api/auth/login"}

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8001)
