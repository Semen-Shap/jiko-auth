@echo off
echo 🚀 Запуск JIKO Auth системы...

echo 📦 Запуск backend...
start cmd /k "cd backend && mkdir tmp 2>nul && CompileDaemon -build="go build -o ./tmp/main.exe ./cmd" -command="./tmp/main.exe" -directory="." -exclude="*_test.go""

timeout /t 3 /nobreak > nul

echo ⚛️  Запуск frontend...
start cmd /k "cd frontend && npm run dev"

echo.
echo ✅ Система запущена!
echo 🌐 Frontend: http://localhost:3000
echo 🔧 Backend API: http://localhost:8080
echo 🗄️  Database: localhost:5432
echo.
echo Для остановки закройте окна терминалов
echo.
pause