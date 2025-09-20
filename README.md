# JIKO Auth

Современная платформа для управления аутентификацией и авторизацией с OAuth2 поддержкой.

## 🚀 Быстрый запуск

### Полный запуск (Frontend + Backend + Database)

**Windows:**
```bash
./scripts/dev-full.bat
```

**Linux/Mac:**
```bash
./scripts/dev-full.sh
```

### Ручной запуск

1. **Запуск Database:**
```bash
docker-compose up -d postgres
```

2. **Запуск Backend:**
```bash
cd backend
CompileDaemon -build="go build -o ./tmp/main.exe ./cmd" -command="./tmp/main.exe"
```

3. **Запуск Frontend:**
```bash
cd frontend
npm install
npm run dev
```

## 🌐 Доступ к сервисам

- **Frontend:** http://localhost:3000
- **Backend API:** http://localhost:8080
- **Database:** localhost:5432

## 📁 Структура проекта

```
jiko-auth/
├── backend/          # Go backend с REST API
├── frontend/         # Next.js React приложение
├── scripts/          # Скрипты для запуска
└── docker-compose.yml # Конфигурация Docker
```

## 🔧 API Endpoints

### Аутентификация
- `POST /api/v1/auth/register` - Регистрация
- `POST /api/v1/auth/login` - Вход
- `GET /api/v1/auth/verify-email` - Верификация email

### OAuth2
- `GET /api/v1/oauth/authorize` - Авторизация
- `POST /api/v1/oauth/token` - Получение токена

### Админ панель
- `GET /api/v1/admin/stats` - Статистика
- `GET /api/v1/admin/users` - Список пользователей
- `POST /api/v1/admin/users` - Создание пользователя
- `GET /api/v1/admin/clients` - Список OAuth клиентов

## 🛠 Технологии

- **Backend:** Go, Gin, PostgreSQL, JWT
- **Frontend:** Next.js, React, TypeScript, Tailwind CSS
- **Database:** PostgreSQL
- **Containerization:** Docker, Docker Compose

## 📧 Настройка Email

Для работы email верификации настройте переменные окружения в `.env`:

```env
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_USERNAME=your-email@gmail.com
SMTP_PASSWORD=your-app-password
SMTP_FROM_EMAIL=your-email@gmail.com
```

## 🔐 Переменные окружения

Создайте файл `.env` в корне проекта:

```env
# Database
POSTGRES_DB=jiko_auth
POSTGRES_USER=jiko_user
POSTGRES_PASSWORD=your_password

# JWT
JWT_SECRET=your-jwt-secret

# App
APP_ENV=development
APP_URL=http://localhost:8080
APP_USER=admin
APP_PASSWORD=admin123

# Email (опционально)
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_USERNAME=your-email@gmail.com
SMTP_PASSWORD=your-app-password
SMTP_FROM_EMAIL=your-email@gmail.com
```

## 🤝 Contributing

1. Fork the repository
2. Create your feature branch (`git checkout -b feature/AmazingFeature`)
3. Commit your changes (`git commit -m 'Add some AmazingFeature'`)
4. Push to the branch (`git push origin feature/AmazingFeature`)
5. Open a Pull Request