import unittest
from unittest.mock import patch, MagicMock
import hashlib
import base64
import secrets

class TestPKCEFlow(unittest.TestCase):
    
    def test_code_verifier_generation(self):
        """Тест: Генерация code_verifier соответствует стандарту PKCE"""
        # Длина должна быть 43-128 символов
        code_verifier = self.generate_code_verifier()
        self.assertTrue(43 <= len(code_verifier) <= 128)
        
        # Допустимые символы
        allowed_chars = set("ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789-._~")
        self.assertTrue(set(code_verifier).issubset(allowed_chars))
    
    def test_code_challenge_calculation(self):
        """Тест: Расчет code_challenge по спецификации S256"""
        code_verifier = "test_verifier_1234567890_abcdefghijklmnopqrstuvwxyz"
        
        # Расчет challenge
        code_challenge = self.calculate_code_challenge(code_verifier)
        
        # Проверка что challenge - это base64url(sha256(verifier))
        expected_hash = hashlib.sha256(code_verifier.encode('utf-8')).digest()
        expected_challenge = base64.urlsafe_b64encode(expected_hash).decode('utf-8').replace('=', '')
        
        self.assertEqual(code_challenge, expected_challenge)
    
    def test_pkce_flow_integration(self):
        """Тест: Полная интеграция PKCE flow"""
        with patch('requests.post') as mock_post:
            # Mock успешного ответа токенов
            mock_response = MagicMock()
            mock_response.status_code = 200
            mock_response.json.return_value = {
                "access_token": "test_access_token",
                "refresh_token": "test_refresh_token", 
                "token_type": "Bearer",
                "expires_in": 3600
            }
            mock_post.return_value = mock_response
            
            # Выполнение полного потока
            result = self.execute_pkce_flow()
            
            # Проверки
            self.assertIsNotNone(result['access_token'])
            self.assertIsNotNone(result['refresh_token'])
            mock_post.assert_called_once()
    
    def test_pkce_code_verifier_validation(self):
        """Тест: Валидация code_verifier сервером авторизации"""
        # Сервер должен отклонять неверные verifier
        valid_verifier = self.generate_code_verifier()
        invalid_verifier = "invalid_verifier"
        
        # Попытка с неверным verifier должна вызывать ошибку
        with self.assertRaises(Exception):
            self.exchange_code_for_token("auth_code", invalid_verifier)
    
    def generate_code_verifier(self):
        """Генерация code_verifier согласно PKCE"""
        random_bytes = secrets.token_bytes(64)
        code_verifier = base64.urlsafe_b64encode(random_bytes).decode('utf-8')
        return code_verifier.replace('=', '')[:128]
    
    def calculate_code_challenge(self, code_verifier):
        """Расчет code_challenge методом S256"""
        sha256_hash = hashlib.sha256(code_verifier.encode('utf-8')).digest()
        code_challenge = base64.urlsafe_b64encode(sha256_hash).decode('utf-8')
        return code_challenge.replace('=', '')

if __name__ == '__main__':
    unittest.main()