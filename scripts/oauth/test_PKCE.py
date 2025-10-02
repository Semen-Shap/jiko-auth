import requests
import webbrowser
import urllib.parse
import secrets
import hashlib
import base64

BASE_URL = "http://localhost:3000"

client_id = "f58d6529-f338-4f95-b737-8f6d14292235"
client_secret = "yNR7bYERZ98M0e5HeUggnIUGVfwSRc-I-BUUwPczg9Y="
redirect_uri = "https://www.google.com"


def generate_pkce():
    """Генерирует code_verifier и code_challenge для PKCE"""
    code_verifier = secrets.token_urlsafe(32)  # Генерируем случайный verifier (около 43 символов)
    
    # Вычисляем code_challenge: base64url(sha256(code_verifier))
    code_challenge = base64.urlsafe_b64encode(hashlib.sha256(code_verifier.encode()).digest()).decode().rstrip('=')
    
    return code_verifier, code_challenge


def oauth_full_flow_with_pkce():
    """Полный OAuth поток с PKCE через frontend"""
    # 1. Генерируем PKCE параметры
    code_verifier, code_challenge = generate_pkce()
    code_challenge_method = "S256"
    
    print(f"Generated code_verifier: {code_verifier}")
    print(f"Generated code_challenge: {code_challenge}")
    
    # 2. Открываем браузер на странице авторизации с PKCE
    auth_params = {
        "client_id": client_id,
        "redirect_uri": redirect_uri,
        "response_type": "code",
        "scope": "read",
        "state": "oauth_test",
        "code_challenge": code_challenge,
        "code_challenge_method": code_challenge_method
    }
    
    auth_url = f"{BASE_URL}/oauth/authorize?" + urllib.parse.urlencode(auth_params)
    webbrowser.open(auth_url)
    
    # 3. Пользователь вручную копирует код из URL после авторизации
    code = input("Введите authorization code из URL после авторизации: ").strip()
    
    if not code:
        return None
    
    # 4. Обменяем authorization code на токены с code_verifier
    token_data = {
        "grant_type": "authorization_code",
        "code": code,
        "redirect_uri": redirect_uri,
        "client_id": client_id,
        "client_secret": client_secret,
        "code_verifier": code_verifier
    }
    
    print(f"Exchanging authorization code for tokens with data: {token_data}")

    token_response = requests.post(f"{BASE_URL}/api/v1/oauth/token", data=token_data)
    
    if token_response.status_code != 200:
        print(f"Token exchange failed: {token_response.status_code} - {token_response.text}")
        return None
    
    tokens = token_response.json()
    access_token = tokens["access_token"]
    refresh_token = tokens["refresh_token"]
    
    # 5. Проверяем токен через userinfo
    userinfo_headers = {"Authorization": f"Bearer {access_token}"}
    userinfo_response = requests.get(f"{BASE_URL}/api/v1/oauth/userinfo", headers=userinfo_headers)
    
    if userinfo_response.status_code == 200:
        userinfo = userinfo_response.json()
    else:
        userinfo = None
        print(f"Userinfo failed: {userinfo_response.status_code} - {userinfo_response.text}")
    
    return {
        "access_token": access_token,
        "refresh_token": refresh_token,
        "user_info": userinfo
    }


if __name__ == "__main__":
    result = oauth_full_flow_with_pkce()
    
    if result:
        print("SUCCESS!")
        print(f"Access Token: {result['access_token']}")
        print(f"Refresh Token: {result['refresh_token']}")
        if result['user_info']:
            print(f"User: {result['user_info']}")
    else:
        print("FAILED!")