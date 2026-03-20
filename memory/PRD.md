# Food AI Scanner (CalorieSnap) - PRD

## Project Overview
A React Native/Expo mobile app that allows users to photograph food and get AI-powered nutritional analysis including calories, protein, and carbohydrates.

## Tech Stack
- **Frontend**: React Native with Expo
- **Backend**: FastAPI (Python)
- **Database**: MongoDB
- **AI**: OpenAI GPT-4o for food image analysis
- **Auth**: JWT-based authentication

## Core Features
1. **User Authentication**: Register/Login with email
2. **Food Scanning**: Camera/gallery image capture for food analysis
3. **Nutritional Analysis**: AI-powered calorie, protein, carbs estimation
4. **Meal History**: View past scanned meals
5. **Daily/Weekly/Monthly Stats**: Track nutritional intake
6. **Profile Management**: Update calorie goals, account settings
7. **Account Deletion**: Full account and data deletion (Apple compliance)

## Apple App Store Compliance - COMPLETED (March 20, 2026)

### Fixed Issues:
1. ✅ **Guideline 5 - China Legal**: User removed China from App Store Connect
2. ✅ **Guideline 2.3.8 - App Name**: Changed device name from "CalorieSnap" to "Food AI Scanner"
3. ✅ **Guideline 5.1.1(ii) - Privacy Strings**: Updated camera and photo library descriptions
4. ✅ **Guideline 5.1.1(v) - Account Deletion**: Added full account deletion feature in Profile screen

### Privacy Strings (iOS):
- NSCameraUsageDescription: "Food AI Scanner uses your camera to photograph meals and analyze their nutritional content including calories, protein, and carbohydrates."
- NSPhotoLibraryUsageDescription: "Food AI Scanner needs access to your photo library to select existing meal photos for nutritional analysis."

## API Endpoints
- POST /api/auth/register - User registration
- POST /api/auth/login - User login
- GET /api/user/profile - Get user profile
- PUT /api/user/goal - Update daily calorie goal
- DELETE /api/user/delete - Delete user account and all data
- POST /api/meals/analyze - Analyze food image
- GET /api/meals/today - Get today's meals summary
- GET /api/meals/history - Get meal history
- GET /api/stats/weekly - Get weekly statistics
- GET /api/stats/monthly - Get monthly statistics

## File Structure
```
/app
├── backend/
│   └── server.py          # FastAPI backend with all endpoints
├── frontend/
│   ├── app.json           # Expo config (app name, iOS infoPlist)
│   ├── app/
│   │   ├── (auth)/
│   │   │   ├── login.tsx
│   │   │   └── register.tsx
│   │   └── (tabs)/
│   │       ├── profile.tsx  # Profile with account deletion
│   │       ├── home.tsx
│   │       ├── scan.tsx
│   │       ├── history.tsx
│   │       └── stats.tsx
│   └── contexts/
│       └── AuthContext.tsx
└── memory/
    └── PRD.md
```

## Next Steps / Backlog
- P0: Submit to App Store for re-review
- P1: Add fat tracking to nutritional analysis
- P2: Add meal reminders/notifications
- P2: Add data export feature
- P3: Social sharing of meals
