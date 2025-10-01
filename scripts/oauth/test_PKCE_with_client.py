import requests
import hashlib
import base64
import secrets
import webbrowser
import urllib.parse
from unittest.mock import patch

class PKCETestClient:
    def __init__(self, client_id, redirect_uri, auth_server_url):
        self.client_id = client_id
        self.redirect_uri = redirect_uri
        self.auth_server_url = auth_server_url
        self.code_verifier = None
        self.code_challenge = None
    
    def generate_pkce_codes(self):
        """Генерация code_verifier и code_challenge"""
        # Генерация cryptographically secure random string:cite[8]
        self.code_verifier = self._generate_code_verifier()
        
        # Расчет code_challenge методом S256:cite[2]
        sha256_hash = hashlib.sha256(self.code_verifier.encode('utf-8')).digest()
        self.code_challenge = base64.urlsafe_b64encode(sha256_hash).decode('utf-8')
        self.code_challenge = self.code_challenge.replace('=', '')
        
        return self.code_verifier, self.code_challenge
    
    def _generate_code_verifier(self):
        """Генерация code_verifier длиной 43-128 символов:cite[8]"""
        length = secrets.choice(range(43, 65))  # Случайная длина в допустимом диапазоне
        random_bytes = secrets.token_bytes(length)
        code_verifier = base64.urlsafe_b64encode(random_bytes).decode('utf-8')
        return code_verifier[:length]
    
    def start_authorization_flow(self):
        """Начало Authorization Code Flow с PKCE:cite[4]"""
        verifier, challenge = self.generate_pkce_codes()
        
        # Параметры запроса авторизации:cite[9]
        auth_params = {
            "response_type": "code",
            "client_id": self.client_id,
            "redirect_uri": self.redirect_uri,
            "code_challenge": challenge,
            "code_challenge_method": "S256",
            "state": secrets.token_urlsafe(16),  # CSRF protection
            "scope": "openid profile email"
        }
        
        auth_url = f"{self.auth_server_url}/authorize?{urllib.parse.urlencode(auth_params)}"
        
        print(f"Code Verifier: {verifier}")
        print(f"Code Challenge: {challenge}")
        print(f"Auth URL: {auth_url}")
        
        # Открытие браузера для авторизации
        webbrowser.open(auth_url)
        
        return verifier
    
    def exchange_code_for_tokens(self, authorization_code, code_verifier):
        """Обмен authorization code на access token:cite[2]"""
        token_data = {
            "grant_type": "authorization_code",
            "code": authorization_code,
            "redirect_uri": self.redirect_uri,
            "client_id": self.client_id,
            "code_verifier": code_verifier
        }
        
        response = requests.post(
            f"{self.auth_server_url}/token",
            data=token_data,
            headers={"Content-Type": "application/x-www-form-urlencoded"}
        )
        
        if response.status_code == 200:
            return response.json()
        else:
            raise Exception(f"Token exchange failed: {response.text}")

# Пример использования
def test_pkce_client():
    client = PKCETestClient(
        client_id="your-client-id",
        redirect_uri="http://localhost:8080/callback",
        auth_server_url="http://localhost:5001"
    )
    
    # Начало потока авторизации
    code_verifier = client.start_authorization_flow()
    
    # Пользователь вручную вводит authorization code из URL
    auth_code = input("Введите authorization code из URL: ")
    
    # Обмен кода на токены
    try:
        tokens = client.exchange_code_for_tokens(auth_code, code_verifier)
        print("Успешная авторизация!")
        print(f"Access Token: {tokens['access_token']}")
        return tokens
    except Exception as e:
        print(f"Ошибка: {e}")
        return None

if __name__ == "__main__":
    test_pkce_client()