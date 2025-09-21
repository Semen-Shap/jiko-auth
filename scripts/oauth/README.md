# OAuth Tests

Тесты для проверки OAuth 2.0 flow в приложении jiko-auth.

## Установка зависимостей

```bash
pip install -r requirements.txt
```

## Запуск тестов

Убедитесь, что backend запущен на `http://localhost:8080`.

```bash
pytest test_oauth.py -v
```

## Описание тестов

- `test_oauth_authorize_redirect`: Проверяет перенаправление на логин при отсутствии авторизации
- `test_oauth_full_flow`: Полный OAuth flow: authorize -> token -> userinfo
- `test_oauth_refresh_token`: Проверка обновления токена
- `test_invalid_client`: Тест с неверным client_id
- `test_invalid_redirect_uri`: Тест с неверным redirect_uri
- `test_expired_code`: Тест истекшего authorization code

## Конфигурация

Тесты используют предопределенный Client ID и Secret. Убедитесь, что клиент создан в базе данных с redirect_uri `http://localhost:3000/callback`.

Админ credentials: username/email: `admin`, password: `admin`