import requests
BASE_URL = "http://localhost:3000/api/v1"

username = "Semyon"
password = "TestPassword123!"
client_id = "6a18a860-4466-406e-aa2c-b9f27b5b602a"
client_secret = "sdZDG2WHQWZnz5Lc5xRakn9uCV9NVdZUGd3vagJdlXE="
redirect_uri = "https://www.google.com/"


def test_create_token_for_semyon():
    """Тест создания токена для пользователя Semyon"""
    # Получить JWT токен пользователя
    login_data = {
        "identifier": username,
        "password": password
    }
    login_response = requests.post(f"{BASE_URL}/auth/login", json=login_data)
    assert login_response.status_code == 200
    user_token = login_response.json()["access_token"]

    # Получить authorization code
    authorize_params = {
        "client_id": client_id,
        "redirect_uri": redirect_uri,
        "response_type": "code",
        "scope": "read",
        "state": "test_state"
    }
    headers = {"Authorization": f"Bearer {user_token}"}
    authorize_response = requests.get(f"{BASE_URL}/oauth/authorize",
                                    params=authorize_params,
                                    headers=headers,
                                    allow_redirects=False)
    print(f"Authorize response status: {authorize_response.status_code}")
    print(f"Authorize response headers: {authorize_response.headers}")
    print(f"Authorize response body: {authorize_response.text[:200]}")
    assert authorize_response.status_code == 302
    location = authorize_response.headers["Location"]
    print(f"Location: {location}")
    assert redirect_uri in location
    code = location.split("code=")[1].split("&")[0]
    assert code

    # Обменять code на access token
    token_data = {
        "grant_type": "authorization_code",
        "code": code,
        "redirect_uri": redirect_uri,
        "client_id": client_id,
        "client_secret": client_secret
    }
    token_response = requests.post(f"{BASE_URL}/oauth/token", data=token_data)
    assert token_response.status_code == 200
    token_json = token_response.json()
    assert "access_token" in token_json
    assert "refresh_token" in token_json
    access_token = token_json["access_token"]

    # Проверить userinfo
    userinfo_headers = {"Authorization": f"Bearer {access_token}"}
    userinfo_response = requests.get(f"{BASE_URL}/oauth/userinfo", headers=userinfo_headers)
    assert userinfo_response.status_code == 200
    userinfo = userinfo_response.json()
    assert userinfo["username"] == username

    print(f"Access Token: {access_token}")
    print(f"Refresh Token: {token_json['refresh_token']}")
    print(f"User Info: {userinfo}")

    return access_token


if __name__ == "__main__":
    test_create_token_for_semyon()