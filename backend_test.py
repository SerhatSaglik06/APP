#!/usr/bin/env python3
"""
Food Tracker API Backend Testing Script
Tests authentication, user management, and meal tracking functionality
"""

import requests
import json
import sys
from datetime import datetime

# Use the backend URL from frontend .env
BASE_URL = "https://calorie-snap-204.preview.emergentagent.com/api"

# Test data
TEST_USER = {
    "email": "foodtracker.test@example.com", 
    "username": "foodtester2024",
    "password": "SecurePass123!"
}

# Global variable to store auth token
auth_token = None

def log_test(test_name, success, details=""):
    """Log test results"""
    status = "✅ PASS" if success else "❌ FAIL" 
    print(f"{status} {test_name}")
    if details:
        print(f"   {details}")

def make_request(method, endpoint, data=None, auth_required=False):
    """Make HTTP request with proper headers"""
    url = f"{BASE_URL}{endpoint}"
    headers = {"Content-Type": "application/json"}
    
    if auth_required and auth_token:
        headers["Authorization"] = f"Bearer {auth_token}"
    
    try:
        if method == "GET":
            response = requests.get(url, headers=headers)
        elif method == "POST":
            response = requests.post(url, headers=headers, json=data)
        elif method == "PUT":
            response = requests.put(url, headers=headers, json=data)
        else:
            raise ValueError(f"Unsupported method: {method}")
            
        return response
    except requests.exceptions.RequestException as e:
        print(f"Request error: {e}")
        return None

def test_health_check():
    """Test API health endpoint"""
    print("\n=== Testing Health Check ===")
    
    response = make_request("GET", "/")
    
    if response and response.status_code == 200:
        data = response.json()
        if data.get("status") == "healthy":
            log_test("Health Check", True, f"API is healthy: {data}")
            return True
        else:
            log_test("Health Check", False, f"Unexpected response: {data}")
    else:
        log_test("Health Check", False, f"Status code: {response.status_code if response else 'No response'}")
    
    return False

def test_user_registration():
    """Test user registration"""
    print("\n=== Testing User Registration ===")
    global auth_token
    
    response = make_request("POST", "/auth/register", TEST_USER)
    
    if response and response.status_code == 200:
        data = response.json()
        if "access_token" in data and "user" in data:
            auth_token = data["access_token"]
            user_data = data["user"]
            log_test("User Registration", True, 
                    f"User created: {user_data['username']} ({user_data['email']})")
            return True
        else:
            log_test("User Registration", False, f"Missing token/user in response: {data}")
    else:
        status_code = response.status_code if response else "No response"
        error_detail = ""
        if response:
            try:
                error_data = response.json()
                error_detail = error_data.get("detail", "")
            except:
                error_detail = response.text
        log_test("User Registration", False, 
                f"Status: {status_code}, Error: {error_detail}")
    
    return False

def test_user_login():
    """Test user login"""
    print("\n=== Testing User Login ===")
    global auth_token
    
    login_data = {
        "email": TEST_USER["email"],
        "password": TEST_USER["password"]
    }
    
    response = make_request("POST", "/auth/login", login_data)
    
    if response and response.status_code == 200:
        data = response.json()
        if "access_token" in data and "user" in data:
            auth_token = data["access_token"]
            user_data = data["user"]
            log_test("User Login", True,
                    f"Login successful for: {user_data['username']}")
            return True
        else:
            log_test("User Login", False, f"Missing token/user in response: {data}")
    else:
        status_code = response.status_code if response else "No response"
        error_detail = ""
        if response:
            try:
                error_data = response.json()
                error_detail = error_data.get("detail", "")
            except:
                error_detail = response.text
        log_test("User Login", False, 
                f"Status: {status_code}, Error: {error_detail}")
    
    return False

def test_get_user_profile():
    """Test getting user profile"""
    print("\n=== Testing Get User Profile ===")
    
    response = make_request("GET", "/user/profile", auth_required=True)
    
    if response and response.status_code == 200:
        data = response.json()
        expected_fields = ["id", "email", "username", "daily_calorie_goal", "created_at"]
        if all(field in data for field in expected_fields):
            log_test("Get User Profile", True,
                    f"Profile retrieved: {data['username']} - Goal: {data['daily_calorie_goal']} cal")
            return True
        else:
            missing = [f for f in expected_fields if f not in data]
            log_test("Get User Profile", False, f"Missing fields: {missing}")
    else:
        status_code = response.status_code if response else "No response"
        log_test("Get User Profile", False, f"Status code: {status_code}")
    
    return False

def test_update_daily_goal():
    """Test updating daily calorie goal"""
    print("\n=== Testing Update Daily Goal ===")
    
    goal_data = {"daily_calorie_goal": 2500}
    response = make_request("PUT", "/user/goal", goal_data, auth_required=True)
    
    if response and response.status_code == 200:
        data = response.json()
        if data.get("daily_calorie_goal") == 2500:
            log_test("Update Daily Goal", True,
                    f"Goal updated to: {data['daily_calorie_goal']} calories")
            return True
        else:
            log_test("Update Daily Goal", False,
                    f"Goal not updated correctly: {data.get('daily_calorie_goal')}")
    else:
        status_code = response.status_code if response else "No response"
        log_test("Update Daily Goal", False, f"Status code: {status_code}")
    
    return False

def test_get_today_summary():
    """Test getting today's meal summary"""
    print("\n=== Testing Get Today's Summary ===")
    
    response = make_request("GET", "/meals/today", auth_required=True)
    
    if response and response.status_code == 200:
        data = response.json()
        expected_fields = ["total_calories", "total_protein", "total_carbs", "goal", "meals_count"]
        if all(field in data for field in expected_fields):
            log_test("Get Today's Summary", True,
                    f"Summary: {data['meals_count']} meals, {data['total_calories']} cal, Goal: {data['goal']}")
            return True
        else:
            missing = [f for f in expected_fields if f not in data]
            log_test("Get Today's Summary", False, f"Missing fields: {missing}")
    else:
        status_code = response.status_code if response else "No response"
        log_test("Get Today's Summary", False, f"Status code: {status_code}")
    
    return False

def test_get_weekly_stats():
    """Test getting weekly statistics"""
    print("\n=== Testing Get Weekly Stats ===")
    
    response = make_request("GET", "/stats/weekly", auth_required=True)
    
    if response and response.status_code == 200:
        data = response.json()
        expected_fields = ["avg_calories", "avg_protein", "avg_carbs", "total_meals", "days_tracked"]
        if all(field in data for field in expected_fields):
            log_test("Get Weekly Stats", True,
                    f"Stats: {data['total_meals']} meals, {data['days_tracked']} days tracked")
            return True
        else:
            missing = [f for f in expected_fields if f not in data]
            log_test("Get Weekly Stats", False, f"Missing fields: {missing}")
    else:
        status_code = response.status_code if response else "No response"
        log_test("Get Weekly Stats", False, f"Status code: {status_code}")
    
    return False

def test_get_monthly_stats():
    """Test getting monthly statistics"""
    print("\n=== Testing Get Monthly Stats ===")
    
    response = make_request("GET", "/stats/monthly", auth_required=True)
    
    if response and response.status_code == 200:
        data = response.json()
        expected_fields = ["avg_calories", "avg_protein", "avg_carbs", "total_meals", "days_tracked"]
        if all(field in data for field in expected_fields):
            log_test("Get Monthly Stats", True,
                    f"Stats: {data['total_meals']} meals, {data['days_tracked']} days tracked")
            return True
        else:
            missing = [f for f in expected_fields if f not in data]
            log_test("Get Monthly Stats", False, f"Missing fields: {missing}")
    else:
        status_code = response.status_code if response else "No response"
        log_test("Get Monthly Stats", False, f"Status code: {status_code}")
    
    return False

def test_get_meal_history():
    """Test getting meal history"""
    print("\n=== Testing Get Meal History ===")
    
    response = make_request("GET", "/meals/history", auth_required=True)
    
    if response and response.status_code == 200:
        data = response.json()
        if isinstance(data, list):
            log_test("Get Meal History", True,
                    f"History retrieved: {len(data)} meals")
            return True
        else:
            log_test("Get Meal History", False, f"Expected list, got: {type(data)}")
    else:
        status_code = response.status_code if response else "No response"
        log_test("Get Meal History", False, f"Status code: {status_code}")
    
    return False

def main():
    """Run all tests"""
    print("=" * 60)
    print("FOOD TRACKER API BACKEND TESTING")
    print(f"Base URL: {BASE_URL}")
    print(f"Test User: {TEST_USER['email']}")
    print("=" * 60)
    
    # Track test results
    tests = [
        ("Health Check", test_health_check),
        ("User Registration", test_user_registration),
        ("User Login", test_user_login),
        ("Get User Profile", test_get_user_profile),
        ("Update Daily Goal", test_update_daily_goal),
        ("Get Today's Summary", test_get_today_summary),
        ("Get Weekly Stats", test_get_weekly_stats),
        ("Get Monthly Stats", test_get_monthly_stats),
        ("Get Meal History", test_get_meal_history),
    ]
    
    passed = 0
    total = len(tests)
    
    # Run tests
    for test_name, test_func in tests:
        try:
            success = test_func()
            if success:
                passed += 1
        except Exception as e:
            log_test(test_name, False, f"Exception: {e}")
    
    # Summary
    print("\n" + "=" * 60)
    print("TESTING SUMMARY")
    print("=" * 60)
    print(f"Tests Passed: {passed}/{total}")
    print(f"Success Rate: {(passed/total)*100:.1f}%")
    
    if passed == total:
        print("🎉 All tests passed! Backend API is working correctly.")
    else:
        print(f"⚠️  {total - passed} test(s) failed. Check the details above.")
    
    return passed == total

if __name__ == "__main__":
    success = main()
    sys.exit(0 if success else 1)