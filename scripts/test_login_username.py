#!/usr/bin/env python3
"""
Test script for user login by username
"""

import requests
import json
import sys

BASE_URL = "http://localhost:8080/api/v1"

def test_login_by_username():
    """Test user login by username"""
    url = f"{BASE_URL}/auth/login"

    # Test data - login by username
    login_data = {
        "identifier": "testuser",
        "password": "TestPassword123!"
    }

    print("Testing user login by username...")
    print(f"URL: {url}")
    print(f"Data: {json.dumps(login_data, indent=2)}")

    try:
        response = requests.post(url, json=login_data, headers={"Content-Type": "application/json"})

        print(f"Status Code: {response.status_code}")
        print(f"Response: {response.text}")

        if response.status_code == 200:
            print("✅ Login by username successful!")
            return True
        else:
            print("❌ Login by username failed!")
            return False

    except requests.exceptions.RequestException as e:
        print(f"❌ Request failed: {e}")
        return False

def test_login_by_email():
    """Test user login by email"""
    url = f"{BASE_URL}/auth/login"

    # Test data - login by email
    login_data = {
        "identifier": "test@example.com",
        "password": "TestPassword123!"
    }

    print("Testing user login by email...")
    print(f"URL: {url}")
    print(f"Data: {json.dumps(login_data, indent=2)}")

    try:
        response = requests.post(url, json=login_data, headers={"Content-Type": "application/json"})

        print(f"Status Code: {response.status_code}")
        print(f"Response: {response.text}")

        if response.status_code == 200:
            print("✅ Login by email successful!")
            return True
        else:
            print("❌ Login by email failed!")
            return False

    except requests.exceptions.RequestException as e:
        print(f"❌ Request failed: {e}")
        return False

def test_duplicate_username():
    """Test duplicate username registration"""
    url = f"{BASE_URL}/auth/register"

    # Test data - duplicate username
    user_data = {
        "username": "testuser",  # Same username as existing user
        "email": "different@example.com",
        "password": "TestPassword123!"
    }

    print("Testing duplicate username registration...")
    print(f"URL: {url}")
    print(f"Data: {json.dumps(user_data, indent=2)}")

    try:
        response = requests.post(url, json=user_data, headers={"Content-Type": "application/json"})

        print(f"Status Code: {response.status_code}")
        print(f"Response: {response.text}")

        if response.status_code == 400 and "username" in response.text.lower():
            print("✅ Duplicate username check successful!")
            return True
        else:
            print("❌ Duplicate username check failed!")
            return False

    except requests.exceptions.RequestException as e:
        print(f"❌ Request failed: {e}")
        return False

if __name__ == "__main__":
    print("Running login tests...\n")

    success1 = test_login_by_username()
    print()
    success2 = test_login_by_email()
    print()
    success3 = test_duplicate_username()

    overall_success = success1 and success2 and success3
    print(f"\nOverall test result: {'✅ All tests passed!' if overall_success else '❌ Some tests failed!'}")
    sys.exit(0 if overall_success else 1)