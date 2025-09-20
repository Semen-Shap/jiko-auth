#!/bin/bash

# Запуск backend и frontend одновременно
echo "🚀 Запуск JIKO Auth системы..."

# Функция для запуска backend
start_backend() {
    echo "📦 Запуск backend..."
    cd backend
    mkdir -p tmp
    CompileDaemon -build="go build -o ./tmp/main.exe ./cmd" -command="./tmp/main.exe" -directory="." -exclude="*_test.go"
}

# Функция для запуска frontend
start_frontend() {
    echo "⚛️  Запуск frontend..."
    cd frontend
    npm run dev
}

# Запуск в фоне
start_backend &
BACKEND_PID=$!

start_frontend &
FRONTEND_PID=$!

echo "✅ Система запущена!"
echo "🌐 Frontend: http://localhost:3000"
echo "🔧 Backend API: http://localhost:8080"
echo "🗄️  Database: localhost:5432"
echo ""
echo "Для остановки нажмите Ctrl+C"

# Ожидание завершения
wait $BACKEND_PID $FRONTEND_PID