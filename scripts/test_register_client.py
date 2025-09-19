#!/usr/bin/env python3
"""
Test script for OAuth client registration
"""

import requests
import json
import sys

BASE_URL = "http://localhost:8080/api/v1"

def login_user(email, password):
    """Login user and return access token"""
    url = f"{BASE_URL}/auth/login"

    login_data = {
        "email": email,
        "password": password
    }

    print("Logging in user...")
    response = requests.post(url, json=login_data, headers={"Content-Type": "application/json"})

    if response.status_code == 200:
        data = response.json()
        token = data.get("access_token")
        print("✅ Login successful!")
        return token
    else:
        print(f"❌ Login failed: {response.text}")
        return None

def register_user():
    """Register a test user"""
    url = f"{BASE_URL}/auth/register"

    user_data = {
        "username": "testuser_app",
        "email": "testapp@example.com",
        "password": "TestPassword123!"
    }

    print("Registering test user...")
    response = requests.post(url, json=user_data, headers={"Content-Type": "application/json"})

    if response.status_code == 200:
        print("✅ User registration successful!")
        return user_data["email"], user_data["password"]
    else:
        print(f"❌ User registration failed: {response.text}")
        return None, None

def test_register_client():
    """Test OAuth client registration"""
    # First register a user
    email, password = register_user()
    if not email or not password:
        return False

    # Login to get token
    token = login_user(email, password)
    if not token:
        return False

    # Now register client
    url = f"{BASE_URL}/clients"
    headers = {
        "Content-Type": "application/json",
        "Authorization": f"Bearer {token}"
    }

    client_data = {
        "name": "Test Application",
        "redirect_uris": ["http://localhost:3000/callback"]
    }

    print("Testing OAuth client registration...")
    print(f"URL: {url}")
    print(f"Data: {json.dumps(client_data, indent=2)}")

    try:
        response = requests.post(url, json=client_data, headers=headers)

        print(f"Status Code: {response.status_code}")
        print(f"Response: {response.text}")

        if response.status_code == 201:  # Created
            print("✅ OAuth client registration successful!")
            return True
        else:
            print("❌ OAuth client registration failed!")
            return False

    except requests.exceptions.RequestException as e:
        print(f"❌ Request failed: {e}")
        return False

if __name__ == "__main__":
    success = test_register_client()
    sys.exit(0 if success else 1)