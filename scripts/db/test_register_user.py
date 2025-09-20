#!/usr/bin/env python3
"""
Test script for user registration
"""

import requests
import json
import sys

BASE_URL = "http://localhost:8080/api/v1"

def test_register_user():
    """Test user registration"""
    url = f"{BASE_URL}/auth/register"

    # Test data
    user_data = {
        "username": "testuser",
        "email": "test@example.com",
        "password": "TestPassword123!"
    }

    print("Testing user registration...")
    print(f"URL: {url}")
    print(f"Data: {json.dumps(user_data, indent=2)}")

    try:
        response = requests.post(url, json=user_data, headers={"Content-Type": "application/json"})

        print(f"Status Code: {response.status_code}")
        print(f"Response: {response.text}")

        if response.status_code == 200:
            print("✅ User registration successful!")
            return True
        else:
            print("❌ User registration failed!")
            return False

    except requests.exceptions.RequestException as e:
        print(f"❌ Request failed: {e}")
        return False

if __name__ == "__main__":
    success = test_register_user()
    sys.exit(0 if success else 1)