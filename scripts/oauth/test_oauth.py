import requests
import webbrowser
import urllib.parse
import time

BASE_URL = "http://localhost:3000"

client_id = "2009bbe3-b5d1-4f0c-a032-b2d299eebbaa"
client_secret = "NSx5m9eaqn-Po_Av16erEdD7ay7EZlsX2-TqV2SIDZ4="
redirect_uri = "https://www.google.com"


def oauth_full_flow():
    """Полный OAuth поток через frontend"""
    # 1. Открываем браузер на странице авторизации
    auth_params = {
        "client_id": client_id,
        "redirect_uri": redirect_uri,
        "response_type": "code",
        "scope": "read",
        "state": "oauth_test"
    }
    
    auth_url = f"{BASE_URL}/oauth/authorize?" + urllib.parse.urlencode(auth_params)
    webbrowser.open(auth_url)
    
    # 2. Пользователь вручную копирует код из URL после авторизации
    code = input("Введите authorization code из URL после авторизации: ").strip()
    
    if not code:
        return None
    
    # 3. Обменяем authorization code на токены
    token_data = {
        "grant_type": "authorization_code",
        "code": code,
        "redirect_uri": redirect_uri,
        "client_id": client_id,
        "client_secret": client_secret
    }
    
    token_response = requests.post(f"{BASE_URL}/api/v1/oauth/token", data=token_data)
    
    if token_response.status_code != 200:
        return None
    
    tokens = token_response.json()
    access_token = tokens["access_token"]
    refresh_token = tokens["refresh_token"]
    
    # 4. Проверяем токен через userinfo
    userinfo_headers = {"Authorization": f"Bearer {access_token}"}
    userinfo_response = requests.get(f"{BASE_URL}/api/v1/oauth/userinfo", headers=userinfo_headers)
    
    if userinfo_response.status_code == 200:
        userinfo = userinfo_response.json()
    else:
        userinfo = None
    
    return {
        "access_token": access_token,
        "refresh_token": refresh_token,
        "user_info": userinfo
    }


if __name__ == "__main__":
    result = oauth_full_flow()
    
    if result:
        print("SUCCESS!")
        print(f"Access Token: {result['access_token']}")
        print(f"Refresh Token: {result['refresh_token']}")
        if result['user_info']:
            print(f"User: {result['user_info']}")
    else:
        print("FAILED!")