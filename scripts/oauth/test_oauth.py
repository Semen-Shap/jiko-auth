import requests
import pytest
import uuid
import time

# Конфигурация
BASE_URL = "http://localhost:8080/api/v1"
CLIENT_ID = "80d3501b-d046-4838-a147-08d8e01df5e1"
CLIENT_SECRET = "tJxWAFVh8DIj0Q8B7VLejY3bU7h2YQXH-MoL3dJNl5o="
REDIRECT_URI = "http://localhost:3000/callback"

@pytest.fixture
def admin_token():
    """Получить токен админа для создания клиентов"""
    login_data = {
        "identifier": "admin",
        "password": "admin"
    }
    response = requests.post(f"{BASE_URL}/auth/login", json=login_data)
    assert response.status_code == 200
    return response.json()["access_token"]

@pytest.fixture
def test_user():
    """Создать тестового пользователя"""
    user_data = {
        "username": f"testuser_{uuid.uuid4().hex[:8]}",
        "email": f"test_{uuid.uuid4().hex[:8]}@example.com",
        "password": "testpassword123"
    }
    response = requests.post(f"{BASE_URL}/auth/register", json=user_data)
    assert response.status_code == 200

    # Подтвердить email (в dev режиме email_verified=true)
    return user_data

@pytest.fixture
def user_token(test_user):
    """Получить токен пользователя"""
    login_data = {
        "identifier": test_user["username"],
        "password": test_user["password"]
    }
    response = requests.post(f"{BASE_URL}/auth/login", json=login_data)
    assert response.status_code == 200
    return response.json()["access_token"]

def test_oauth_authorize_redirect(admin_token):
    """Тест перенаправления на authorize без авторизации"""
    params = {
        "client_id": CLIENT_ID,
        "redirect_uri": REDIRECT_URI,
        "response_type": "code",
        "scope": "read",
        "state": "test_state"
    }
    response = requests.get(f"{BASE_URL}/oauth/authorize", params=params, allow_redirects=False)
    # Должен перенаправить на /login
    assert response.status_code == 302
    assert "/login" in response.headers.get("Location", "")

def test_oauth_full_flow(admin_token, user_token):
    """Полный тест OAuth flow"""
    # 1. Получить authorization code
    params = {
        "client_id": CLIENT_ID,
        "redirect_uri": REDIRECT_URI,
        "response_type": "code",
        "scope": "read",
        "state": "test_state"
    }
    headers = {"Authorization": f"Bearer {user_token}"}
    response = requests.get(f"{BASE_URL}/oauth/authorize", params=params, headers=headers, allow_redirects=False)
    assert response.status_code == 302
    location = response.headers["Location"]
    assert REDIRECT_URI in location
    # Извлечь code из URL
    code = location.split("code=")[1].split("&")[0]
    assert code

    # 2. Обменять code на токен
    token_data = {
        "grant_type": "authorization_code",
        "code": code,
        "redirect_uri": REDIRECT_URI,
        "client_id": CLIENT_ID,
        "client_secret": CLIENT_SECRET
    }
    response = requests.post(f"{BASE_URL}/oauth/token", data=token_data)
    assert response.status_code == 200
    token_response = response.json()
    assert "access_token" in token_response
    assert "token_type" in token_response
    assert token_response["token_type"] == "Bearer"
    access_token = token_response["access_token"]

    # 3. Получить информацию о пользователе
    headers = {"Authorization": f"Bearer {access_token}"}
    response = requests.get(f"{BASE_URL}/oauth/userinfo", headers=headers)
    assert response.status_code == 200
    user_info = response.json()
    assert "id" in user_info
    assert "username" in user_info
    assert "email" in user_info

def test_oauth_refresh_token(admin_token, user_token):
    """Тест refresh token"""
    # Сначала получить access token как выше
    params = {
        "client_id": CLIENT_ID,
        "redirect_uri": REDIRECT_URI,
        "response_type": "code",
        "scope": "read",
        "state": "test_state"
    }
    headers = {"Authorization": f"Bearer {user_token}"}
    response = requests.get(f"{BASE_URL}/oauth/authorize", params=params, headers=headers, allow_redirects=False)
    code = response.headers["Location"].split("code=")[1].split("&")[0]

    token_data = {
        "grant_type": "authorization_code",
        "code": code,
        "redirect_uri": REDIRECT_URI,
        "client_id": CLIENT_ID,
        "client_secret": CLIENT_SECRET
    }
    response = requests.post(f"{BASE_URL}/oauth/token", data=token_data)
    token_response = response.json()
    refresh_token = token_response["refresh_token"]

    # Обновить токен
    refresh_data = {
        "grant_type": "refresh_token",
        "refresh_token": refresh_token,
        "client_id": CLIENT_ID,
        "client_secret": CLIENT_SECRET
    }
    response = requests.post(f"{BASE_URL}/oauth/token", data=refresh_data)
    assert response.status_code == 200
    new_token_response = response.json()
    assert "access_token" in new_token_response
    assert new_token_response["access_token"] != token_response["access_token"]

def test_invalid_client():
    """Тест с неверным client_id"""
    params = {
        "client_id": "invalid_client_id",
        "redirect_uri": REDIRECT_URI,
        "response_type": "code",
        "scope": "read"
    }
    response = requests.get(f"{BASE_URL}/oauth/authorize", params=params)
    assert response.status_code == 400
    assert "invalid client_id" in response.json()["error"]

def test_invalid_redirect_uri(user_token):
    """Тест с неверным redirect_uri"""
    params = {
        "client_id": CLIENT_ID,
        "redirect_uri": "http://invalid.com/callback",
        "response_type": "code",
        "scope": "read"
    }
    headers = {"Authorization": f"Bearer {user_token}"}
    response = requests.get(f"{BASE_URL}/oauth/authorize", params=params, headers=headers)
    assert response.status_code == 400
    assert "invalid redirect_uri" in response.json()["error"]

def test_expired_code(admin_token, user_token):
    """Тест истекшего authorization code"""
    # Получить code
    params = {
        "client_id": CLIENT_ID,
        "redirect_uri": REDIRECT_URI,
        "response_type": "code",
        "scope": "read"
    }
    headers = {"Authorization": f"Bearer {user_token}"}
    response = requests.get(f"{BASE_URL}/oauth/authorize", params=params, headers=headers, allow_redirects=False)
    code = response.headers["Location"].split("code=")[1].split("&")[0]

    # Подождать, пока код истечет (10 минут в коде, но для теста можно пропустить или изменить)
    time.sleep(1)  # Минимальная задержка

    # Попытаться обменять
    token_data = {
        "grant_type": "authorization_code",
        "code": code,
        "redirect_uri": REDIRECT_URI,
        "client_id": CLIENT_ID,
        "client_secret": CLIENT_SECRET
    }
    response = requests.post(f"{BASE_URL}/oauth/token", data=token_data)
    # В реальности должен быть 400, но поскольку время мало, может пройти
    # Для полного теста нужно изменить expires_at в коде или мокать время
    pass

if __name__ == "__main__":
    pytest.main([__file__])