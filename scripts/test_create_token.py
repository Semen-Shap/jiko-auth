#!/usr/bin/env python3
"""
Test script for creating token from OAuth client
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
        "username": "testuser_token",
        "email": "testtoken@example.com",
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

def create_client(token):
    """Create OAuth client and return client ID"""
    url = f"{BASE_URL}/clients"
    headers = {
        "Content-Type": "application/json",
        "Authorization": f"Bearer {token}"
    }

    client_data = {
        "name": "Test Application for Token",
        "redirect_uris": ["http://localhost:3000/callback"]
    }

    print("Creating OAuth client...")
    response = requests.post(url, json=client_data, headers=headers)

    if response.status_code == 201:
        data = response.json()
        client_id = data.get("id")
        print("✅ OAuth client created successfully!")
        return client_id
    else:
        print(f"❌ Client creation failed: {response.text}")
        return None

def test_create_token():
    """Test creating token from OAuth client"""
    # Register user
    email, password = register_user()
    if not email or not password:
        return False

    # Login
    token = login_user(email, password)
    if not token:
        return False

    # Create client
    client_id = create_client(token)
    if not client_id:
        return False

    # Create token from client
    url = f"{BASE_URL}/clients/{client_id}/tokens"
    headers = {
        "Content-Type": "application/json",
        "Authorization": f"Bearer {token}"
    }

    print("Testing token creation from OAuth client...")
    print(f"URL: {url}")

    try:
        response = requests.post(url, headers=headers)

        print(f"Status Code: {response.status_code}")
        print(f"Response: {response.text}")

        if response.status_code == 201:  # Created
            print("✅ Token creation successful!")
            return True
        else:
            print("❌ Token creation failed!")
            return False

    except requests.exceptions.RequestException as e:
        print(f"❌ Request failed: {e}")
        return False

if __name__ == "__main__":
    success = test_create_token()
    sys.exit(0 if success else 1)