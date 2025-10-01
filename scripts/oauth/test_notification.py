import unittest
from unittest.mock import patch, MagicMock
from datetime import datetime
import json

class TestLoginNotifications(unittest.TestCase):
    
    def setUp(self):
        self.mock_security_repo = MagicMock()
        self.mock_user_repo = MagicMock()
        self.mock_notification_service = MagicMock()
        
    def test_successful_login_creates_notification(self):
        """Тест: Успешный вход создает уведомление"""
        # Создание тестовых данных
        test_user = MagicMock()
        test_user.id = "user123"
        test_user.email = "test@example.com"
        
        test_attempt = MagicMock()
        test_attempt.id = "attempt123"
        test_attempt.IPAddress = "192.168.1.1"
        test_attempt.GeoLocation = "Moscow, Russia"
        test_attempt.DeviceInfo = "Chrome on Windows"
        
        # Mock вызовов
        self.mock_user_repo.GetUserByEmail.return_value = test_user
        self.mock_notification_service.CreateLoginNotification.return_value = MagicMock()
        
        # Вызов тестируемого метода
        # ... ваш код обработки входа ...
        
        # Проверки
        self.mock_security_repo.CreateLoginAttempt.assert_called_once()
        self.mock_notification_service.CreateLoginNotification.assert_called_once()
        
    def test_failed_login_creates_security_alert(self):
        """Тест: Неудачный вход создает предупреждение безопасности"""
        # Тестирование после 3 неудачных попыток
        failed_attempts = [
            {"timestamp": datetime.now(), "IPAddress": "192.168.1.1"},
            {"timestamp": datetime.now(), "IPAddress": "192.168.1.1"},
            {"timestamp": datetime.now(), "IPAddress": "192.168.1.1"}
        ]
        
        # Проверка блокировки аккаунта
        self.mock_security_repo.GetRecentFailedAttempts.return_value = failed_attempts
        
        # Должен быть вызван метод блокировки
        self.mock_security_repo.BlockAccount.assert_called_once()
        
    def test_suspicious_location_notification(self):
        """Тест: Уведомление о входе с подозрительного местоположения"""
        test_attempt = MagicMock()
        test_attempt.GeoLocation = "Unknown Location"
        test_attempt.IPAddress = "8.8.8.8"  # Google DNS - подозрительно
        
        # Проверка создания уведомления о подозрительной активности
        self.mock_notification_service.CreateSuspiciousActivityNotification.assert_called_once()

if __name__ == '__main__':
    unittest.main()