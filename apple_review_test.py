#!/usr/bin/env python3
"""
Food AI Scanner Backend API Testing - Apple App Store Review
Testing specific auth flow including account deletion as requested
"""

import requests
import json
import sys
from datetime import datetime

# Backend URL from environment
BACKEND_URL = "https://calorie-snap-204.preview.emergentagent.com/api"

# Test credentials from test_credentials.md
TEST_EMAIL = "reviewer@test.com"
TEST_USERNAME = "reviewer"
TEST_PASSWORD = "TestReview123!"

def log_test(test_name, status, details=""):
    """Log test results with timestamp"""
    timestamp = datetime.now().strftime("%Y-%m-%d %H:%M:%S")
    status_symbol = "✅" if status == "PASS" else "❌" if status == "FAIL" else "⚠️"
    print(f"[{timestamp}] {status_symbol} {test_name}")
    if details:
        print(f"    Details: {details}")
    print()

def test_user_registration():
    """Test user registration endpoint"""
    print("=" * 60)
    print("TESTING USER REGISTRATION")
    print("=" * 60)
    
    url = f"{BACKEND_URL}/auth/register"
    payload = {
        "email": TEST_EMAIL,
        "username": TEST_USERNAME,
        "password": TEST_PASSWORD
    }
    
    try:
        response = requests.post(url, json=payload, timeout=30)
        
        if response.status_code == 200:
            data = response.json()
            if "access_token" in data and "user" in data:
                log_test("User Registration", "PASS", 
                        f"User created successfully. Token: {data['access_token'][:20]}...")
                return data["access_token"]
            else:
                log_test("User Registration", "FAIL", 
                        f"Missing access_token or user in response: {data}")
                return None
        elif response.status_code == 400:
            # User might already exist, try to continue with login
            log_test("User Registration", "SKIP", 
                    f"User already exists (400): {response.text}")
            return "USER_EXISTS"
        else:
            log_test("User Registration", "FAIL", 
                    f"HTTP {response.status_code}: {response.text}")
            return None
            
    except requests.exceptions.RequestException as e:
        log_test("User Registration", "FAIL", f"Request error: {str(e)}")
        return None

def test_user_login():
    """Test user login endpoint"""
    print("=" * 60)
    print("TESTING USER LOGIN")
    print("=" * 60)
    
    url = f"{BACKEND_URL}/auth/login"
    payload = {
        "email": TEST_EMAIL,
        "password": TEST_PASSWORD
    }
    
    try:
        response = requests.post(url, json=payload, timeout=30)
        
        if response.status_code == 200:
            data = response.json()
            if "access_token" in data and "user" in data:
                log_test("User Login", "PASS", 
                        f"Login successful. Token: {data['access_token'][:20]}...")
                return data["access_token"]
            else:
                log_test("User Login", "FAIL", 
                        f"Missing access_token or user in response: {data}")
                return None
        else:
            log_test("User Login", "FAIL", 
                    f"HTTP {response.status_code}: {response.text}")
            return None
            
    except requests.exceptions.RequestException as e:
        log_test("User Login", "FAIL", f"Request error: {str(e)}")
        return None

def test_account_deletion(access_token):
    """Test account deletion endpoint"""
    print("=" * 60)
    print("TESTING ACCOUNT DELETION")
    print("=" * 60)
    
    if not access_token:
        log_test("Account Deletion", "SKIP", "No access token available")
        return False
    
    url = f"{BACKEND_URL}/user/delete"
    headers = {
        "Authorization": f"Bearer {access_token}",
        "Content-Type": "application/json"
    }
    
    try:
        response = requests.delete(url, headers=headers, timeout=30)
        
        if response.status_code == 200:
            data = response.json()
            expected_response = {"message": "Account successfully deleted", "deleted": True}
            
            if data == expected_response:
                log_test("Account Deletion", "PASS", 
                        f"Account deleted successfully: {data}")
                return True
            else:
                log_test("Account Deletion", "FAIL", 
                        f"Unexpected response format: {data}")
                return False
        else:
            log_test("Account Deletion", "FAIL", 
                    f"HTTP {response.status_code}: {response.text}")
            return False
            
    except requests.exceptions.RequestException as e:
        log_test("Account Deletion", "FAIL", f"Request error: {str(e)}")
        return False

def test_login_after_deletion():
    """Test that login fails after account deletion"""
    print("=" * 60)
    print("TESTING LOGIN AFTER DELETION")
    print("=" * 60)
    
    url = f"{BACKEND_URL}/auth/login"
    payload = {
        "email": TEST_EMAIL,
        "password": TEST_PASSWORD
    }
    
    try:
        response = requests.post(url, json=payload, timeout=30)
        
        if response.status_code == 401:
            log_test("Login After Deletion", "PASS", 
                    f"Login correctly failed with 401: {response.text}")
            return True
        elif response.status_code == 200:
            log_test("Login After Deletion", "FAIL", 
                    "Login succeeded when it should have failed after deletion")
            return False
        else:
            log_test("Login After Deletion", "FAIL", 
                    f"Unexpected HTTP {response.status_code}: {response.text}")
            return False
            
    except requests.exceptions.RequestException as e:
        log_test("Login After Deletion", "FAIL", f"Request error: {str(e)}")
        return False

def main():
    """Run all tests in sequence"""
    print("🚀 Starting Food AI Scanner Backend API Tests")
    print(f"Backend URL: {BACKEND_URL}")
    print(f"Test User: {TEST_EMAIL}")
    print()
    
    # Test results tracking
    results = {
        "registration": False,
        "login": False,
        "deletion": False,
        "verify_deletion": False
    }
    
    # Step 1: Try to register user
    token = test_user_registration()
    if token == "USER_EXISTS":
        # User already exists, proceed with login
        token = test_user_login()
        results["login"] = token is not None
    elif token:
        # Registration successful
        results["registration"] = True
        results["login"] = True
    else:
        # Registration failed, try login anyway
        token = test_user_login()
        results["login"] = token is not None
    
    # Step 2: Test account deletion
    if token:
        results["deletion"] = test_account_deletion(token)
        
        # Step 3: Verify deletion by trying to login again
        if results["deletion"]:
            results["verify_deletion"] = test_login_after_deletion()
    
    # Final summary
    print("=" * 60)
    print("FINAL TEST SUMMARY")
    print("=" * 60)
    
    total_tests = len(results)
    passed_tests = sum(1 for result in results.values() if result)
    
    for test_name, result in results.items():
        status = "✅ PASS" if result else "❌ FAIL"
        print(f"{test_name.replace('_', ' ').title()}: {status}")
    
    print(f"\nOverall: {passed_tests}/{total_tests} tests passed")
    
    if passed_tests == total_tests:
        print("🎉 All tests passed! Auth flow working correctly.")
        return 0
    else:
        print("⚠️  Some tests failed. Check details above.")
        return 1

if __name__ == "__main__":
    sys.exit(main())