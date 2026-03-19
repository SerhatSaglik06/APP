#!/usr/bin/env python3
"""
Backend API Tests for AI Günlük Burç & Fal Uygulaması
Tests all backend endpoints with realistic Turkish horoscope app data
"""

import requests
import json
import time
import sys
from datetime import datetime
import os

# Get the backend URL from frontend environment
def get_backend_url():
    try:
        with open('/app/frontend/.env', 'r') as f:
            for line in f:
                if line.startswith('EXPO_PUBLIC_BACKEND_URL='):
                    base_url = line.split('=')[1].strip()
                    return f"{base_url}/api"
    except:
        pass
    return "http://localhost:8001/api"

BASE_URL = get_backend_url()
print(f"Testing backend at: {BASE_URL}")

# Test device ID - using realistic format
TEST_DEVICE_ID = "test-device-backend-001"

def make_request(method, endpoint, data=None, params=None):
    """Make HTTP request with error handling"""
    url = f"{BASE_URL}{endpoint}"
    try:
        if method.upper() == "GET":
            response = requests.get(url, params=params, timeout=30)
        elif method.upper() == "POST":
            response = requests.post(url, json=data, timeout=30)
        elif method.upper() == "PUT":
            response = requests.put(url, json=data, timeout=30)
        
        print(f"{method.upper()} {endpoint}")
        print(f"Status: {response.status_code}")
        
        if response.headers.get('content-type', '').startswith('application/json'):
            response_data = response.json()
            print(f"Response: {json.dumps(response_data, indent=2, ensure_ascii=False)}")
            return response.status_code, response_data
        else:
            print(f"Response (text): {response.text[:200]}...")
            return response.status_code, {"error": "Non-JSON response", "content": response.text}
            
    except requests.exceptions.RequestException as e:
        print(f"Request failed: {e}")
        return None, {"error": str(e)}
    except json.JSONDecodeError as e:
        print(f"JSON decode error: {e}")
        return response.status_code, {"error": "Invalid JSON", "content": response.text}

def test_health_check():
    """Test the health check endpoint"""
    print("\n" + "="*50)
    print("TESTING: Health Check Endpoint")
    print("="*50)
    
    status, data = make_request("GET", "/health")
    
    if status == 200:
        print("✅ Health check PASSED")
        return True
    else:
        print("❌ Health check FAILED")
        return False

def test_user_registration():
    """Test user registration endpoint"""
    print("\n" + "="*50) 
    print("TESTING: User Registration Endpoint")
    print("="*50)
    
    user_data = {"device_id": TEST_DEVICE_ID}
    status, data = make_request("POST", "/users/register", data=user_data)
    
    if status == 200 and data and "device_id" in data:
        print("✅ User registration PASSED")
        return True, data
    else:
        print("❌ User registration FAILED")
        return False, None

def test_get_user(device_id):
    """Test get user endpoint"""
    print("\n" + "="*50)
    print("TESTING: Get User Details Endpoint") 
    print("="*50)
    
    status, data = make_request("GET", f"/users/{device_id}")
    
    if status == 200 and data and "device_id" in data:
        print("✅ Get user details PASSED")
        return True
    else:
        print("❌ Get user details FAILED")
        return False

def test_check_daily_reading(device_id):
    """Test daily reading check endpoint"""
    print("\n" + "="*50)
    print("TESTING: Check Daily Reading Endpoint")
    print("="*50)
    
    status, data = make_request("GET", f"/readings/check-daily/{device_id}")
    
    if status == 200 and data and "has_free_reading" in data:
        print("✅ Daily reading check PASSED")
        return True
    else:
        print("❌ Daily reading check FAILED")
        return False

def test_generate_reading(device_id):
    """Test AI reading generation endpoint"""
    print("\n" + "="*50)
    print("TESTING: AI Reading Generation Endpoint")
    print("="*50)
    
    reading_data = {
        "device_id": device_id,
        "focus": "relationships",  
        "tone": "motivational",
        "zodiac_sign": "leo"
    }
    
    status, data = make_request("POST", "/readings/generate", data=reading_data)
    
    if status == 200 and data:
        # Check if all required fields are present
        required_fields = ["daily_energy", "focus_comment", "fortune_message", "daily_advice"]
        has_all_fields = all(field in data for field in required_fields)
        
        if has_all_fields:
            print("✅ AI Reading generation PASSED")
            print(f"🔍 Generated reading ID: {data.get('id', 'N/A')}")
            
            # Check if content is in Turkish
            sample_content = data.get("daily_energy", "")
            if any(char in sample_content for char in "çğıöşüÇĞIÖŞÜ"):
                print("✅ Turkish content detected")
            else:
                print("⚠️  Turkish characters not clearly visible in content")
                
            return True, data.get("id")
        else:
            print("❌ AI Reading generation FAILED - Missing required fields")
            print(f"Missing fields: {[f for f in required_fields if f not in data]}")
            return False, None
    else:
        print("❌ AI Reading generation FAILED")
        return False, None

def test_expand_reading(device_id, reading_id):
    """Test reading expansion endpoint"""
    print("\n" + "="*50)
    print("TESTING: Reading Expansion Endpoint")
    print("="*50)
    
    if not reading_id:
        print("❌ Cannot test expansion - no reading ID from previous test")
        return False
    
    expand_data = {
        "reading_id": reading_id,
        "device_id": device_id
    }
    
    status, data = make_request("POST", "/readings/expand", data=expand_data)
    
    if status == 200 and data:
        has_detailed = "detailed_content" in data and data["detailed_content"]
        is_expanded = data.get("is_expanded", False)
        
        if has_detailed and is_expanded:
            print("✅ Reading expansion PASSED")
            print(f"🔍 Detailed content length: {len(data['detailed_content'])} characters")
            return True
        else:
            print("❌ Reading expansion FAILED - Missing detailed content")
            return False
    else:
        print("❌ Reading expansion FAILED")
        return False

def test_reading_history(device_id):
    """Test reading history endpoint"""
    print("\n" + "="*50)
    print("TESTING: Reading History Endpoint")
    print("="*50)
    
    status, data = make_request("GET", f"/readings/history/{device_id}")
    
    if status == 200 and isinstance(data, list):
        print(f"✅ Reading history PASSED - Found {len(data)} readings")
        
        if len(data) > 0:
            # Check if readings have proper structure
            first_reading = data[0]
            required_fields = ["id", "daily_energy", "focus_comment", "created_at"]
            if all(field in first_reading for field in required_fields):
                print("✅ Reading structure validation PASSED")
            else:
                print("⚠️  Reading structure incomplete")
        
        return True
    else:
        print("❌ Reading history FAILED")
        return False

def test_today_reading(device_id):
    """Test today's reading endpoint"""
    print("\n" + "="*50)
    print("TESTING: Today's Reading Endpoint")
    print("="*50)
    
    status, data = make_request("GET", f"/readings/today/{device_id}")
    
    if status == 200 and data and "has_reading" in data:
        print("✅ Today's reading endpoint PASSED")
        
        if data["has_reading"]:
            print("✅ User has a reading for today")
        else:
            print("ℹ️  User has no reading for today")
        
        return True
    else:
        print("❌ Today's reading endpoint FAILED")
        return False

def run_comprehensive_test():
    """Run all backend tests in sequence"""
    print("🚀 Starting Comprehensive Backend API Tests")
    print(f"⏰ Test started at: {datetime.now().isoformat()}")
    
    test_results = {}
    user_data = None
    reading_id = None
    
    # Test 1: Health Check
    test_results["health_check"] = test_health_check()
    
    # Test 2: User Registration
    success, user_data = test_user_registration()
    test_results["user_registration"] = success
    
    if not success:
        print("\n❌ CRITICAL: User registration failed - cannot proceed with user-dependent tests")
        return test_results
    
    device_id = user_data.get("device_id", TEST_DEVICE_ID)
    
    # Test 3: Get User Details  
    test_results["get_user"] = test_get_user(device_id)
    
    # Test 4: Check Daily Reading
    test_results["check_daily_reading"] = test_check_daily_reading(device_id)
    
    # Test 5: Generate AI Reading (Critical test)
    success, reading_id = test_generate_reading(device_id)
    test_results["generate_reading"] = success
    
    # Test 6: Expand Reading
    test_results["expand_reading"] = test_expand_reading(device_id, reading_id)
    
    # Test 7: Reading History
    test_results["reading_history"] = test_reading_history(device_id)
    
    # Test 8: Today's Reading
    test_results["today_reading"] = test_today_reading(device_id)
    
    # Summary
    print("\n" + "="*70)
    print("TEST SUMMARY")
    print("="*70)
    
    passed = sum(1 for result in test_results.values() if result)
    total = len(test_results)
    
    for test_name, result in test_results.items():
        status = "✅ PASSED" if result else "❌ FAILED"
        print(f"{test_name:<25}: {status}")
    
    print("-" * 70)
    print(f"OVERALL RESULT: {passed}/{total} tests passed")
    print(f"Success rate: {(passed/total)*100:.1f}%")
    
    if passed == total:
        print("🎉 ALL TESTS PASSED!")
    else:
        print(f"⚠️  {total-passed} tests failed - needs attention")
    
    print(f"⏰ Test completed at: {datetime.now().isoformat()}")
    
    return test_results

if __name__ == "__main__":
    results = run_comprehensive_test()
    
    # Exit with appropriate code
    failed_tests = [name for name, result in results.items() if not result]
    
    if failed_tests:
        print(f"\n❌ Failed tests: {', '.join(failed_tests)}")
        sys.exit(1)
    else:
        print("\n✅ All tests completed successfully!")
        sys.exit(0)