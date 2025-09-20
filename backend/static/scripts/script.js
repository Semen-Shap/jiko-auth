document.addEventListener('DOMContentLoaded', function () {
    // Tab switching
    const tabButtons = document.querySelectorAll('.tab-button');
    const authForms = document.querySelectorAll('.auth-form');

    tabButtons.forEach(button => {
        button.addEventListener('click', () => {
            const tab = button.getAttribute('data-tab');

            // Update active tab
            tabButtons.forEach(btn => {
                btn.classList.remove('active', 'text-white', 'border-cyan-400');
                btn.classList.add('text-gray-400', 'border-transparent');
            });
            button.classList.add('active', 'text-white', 'border-cyan-400');
            button.classList.remove('text-gray-400', 'border-transparent');

            // Show corresponding form
            authForms.forEach(form => {
                form.classList.add('hidden');
                form.classList.remove('block');
                if (form.id === `${tab}-form`) {
                    form.classList.remove('hidden');
                    form.classList.add('block');
                }
            });
        });
    });

    // Form validation
    const loginForm = document.getElementById('login-form');
    const registerForm = document.getElementById('register-form');

    if (loginForm) {
        loginForm.addEventListener('submit', function (e) {
            console.log('Login form submit event triggered');
            e.preventDefault();
            console.log('Calling validateLoginForm');
            if (validateLoginForm()) {
                console.log('Validation passed, calling submitForm');
                submitForm(this, '/api/v1/auth/login');
            } else {
                console.log('Validation failed');
            }
        });
    }

    if (registerForm) {
        registerForm.addEventListener('submit', function (e) {
            e.preventDefault();
            if (validateRegisterForm()) {
                submitForm(this, '/api/v1/auth/register');
            }
        });
    }

    // Password validation
    const passwordInput = document.getElementById('register-password');
    const confirmPasswordInput = document.getElementById('register-confirm-password');

    if (passwordInput && confirmPasswordInput) {
        passwordInput.addEventListener('input', validatePassword);
        confirmPasswordInput.addEventListener('input', validateConfirmPassword);
    }

    // User dropdown
    const userButton = document.querySelector('.user-button');
    const userDropdown = document.querySelector('.user-dropdown');

    if (userButton && userDropdown) {
        userButton.addEventListener('click', function (e) {
            e.stopPropagation();
            userDropdown.classList.toggle('show');
        });

        // Close dropdown when clicking outside
        document.addEventListener('click', function () {
            userDropdown.classList.remove('show');
        });

        // Prevent dropdown from closing when clicking inside
        userDropdown.addEventListener('click', function (e) {
            e.stopPropagation();
        });
    }
});

function validateLoginForm() {
    console.log('validateLoginForm called');
    let isValid = true;
    const identifier = document.getElementById('login-identifier');
    const password = document.getElementById('login-password');
    const identifierError = document.getElementById('login-identifier-error');
    const passwordError = document.getElementById('login-password-error');

    console.log('Identifier value:', identifier.value);
    console.log('Password value:', password.value);

    // Reset errors
    identifierError.style.display = 'none';
    passwordError.style.display = 'none';

    // Validate identifier (email or username)
    if (!identifier.value) {
        console.log('Identifier is empty');
        identifierError.textContent = 'Email или имя пользователя обязательно';
        identifierError.style.display = 'block';
        isValid = false;
    } else if (identifier.value.includes('@')) {
        // If it contains @, validate as email
        if (!isValidEmail(identifier.value)) {
            console.log('Invalid email format');
            identifierError.textContent = 'Введите корректный email';
            identifierError.style.display = 'block';
            isValid = false;
        } else {
            console.log('Email validation passed');
        }
    } else {
        // Validate as username (basic validation)
        if (identifier.value.length < 3) {
            console.log('Username too short');
            identifierError.textContent = 'Имя пользователя должно содержать не менее 3 символов';
            identifierError.style.display = 'block';
            isValid = false;
        } else {
            console.log('Username validation passed');
        }
    }

    // Validate password
    if (!password.value) {
        console.log('Password is empty');
        passwordError.textContent = 'Пароль обязателен';
        passwordError.style.display = 'block';
        isValid = false;
    } else {
        console.log('Password validation passed');
    }

    console.log('Validation result:', isValid);
    return isValid;
}

function validateRegisterForm() {
    let isValid = true;
    const username = document.getElementById('register-username');
    const email = document.getElementById('register-email');
    const password = document.getElementById('register-password');
    const confirmPassword = document.getElementById('register-confirm-password');
    const terms = document.getElementById('terms');

    const usernameError = document.getElementById('register-username-error');
    const emailError = document.getElementById('register-email-error');
    const passwordError = document.getElementById('register-password-error');
    const confirmPasswordError = document.getElementById('register-confirm-password-error');

    // Reset errors
    usernameError.style.display = 'none';
    emailError.style.display = 'none';
    passwordError.style.display = 'none';
    confirmPasswordError.style.display = 'none';

    // Validate username
    if (!username.value) {
        usernameError.textContent = 'Имя пользователя обязательно';
        usernameError.style.display = 'block';
        isValid = false;
    } else if (username.value.length < 3) {
        usernameError.textContent = 'Имя пользователя должно содержать не менее 3 символов';
        usernameError.style.display = 'block';
        isValid = false;
    }

    // Validate email
    if (!email.value) {
        emailError.textContent = 'Email обязателен';
        emailError.style.display = 'block';
        isValid = false;
    } else if (!isValidEmail(email.value)) {
        emailError.textContent = 'Введите корректный email';
        emailError.style.display = 'block';
        isValid = false;
    }

    // Validate password
    if (!validatePassword()) {
        isValid = false;
    }

    // Validate confirm password
    if (!validateConfirmPassword()) {
        isValid = false;
    }

    // Validate terms
    if (!terms.checked) {
        showNotification('Необходимо принять условия использования', 'error');
        isValid = false;
    }

    return isValid;
}

function validatePassword() {
    const password = document.getElementById('register-password');
    const passwordError = document.getElementById('register-password-error');

    passwordError.style.display = 'none';

    if (!password.value) {
        passwordError.textContent = 'Пароль обязателен';
        passwordError.style.display = 'block';
        return false;
    }

    if (password.value.length < 8) {
        passwordError.textContent = 'Пароль должен содержать не менее 8 символов';
        passwordError.style.display = 'block';
        return false;
    }

    if (!hasUpperCase(password.value) || !hasLowerCase(password.value) ||
        !hasNumber(password.value) || !hasSpecialChar(password.value)) {
        passwordError.textContent = 'Пароль должен содержать заглавные и строчные буквы, цифры и специальные символы';
        passwordError.style.display = 'block';
        return false;
    }

    return true;
}

function validateConfirmPassword() {
    const password = document.getElementById('register-password');
    const confirmPassword = document.getElementById('register-confirm-password');
    const confirmPasswordError = document.getElementById('register-confirm-password-error');

    confirmPasswordError.style.display = 'none';

    if (!confirmPassword.value) {
        confirmPasswordError.textContent = 'Подтверждение пароля обязательно';
        confirmPasswordError.style.display = 'block';
        return false;
    }

    if (password.value !== confirmPassword.value) {
        confirmPasswordError.textContent = 'Пароли не совпадают';
        confirmPasswordError.style.display = 'block';
        return false;
    }

    return true;
}

function showNotification(message, type = 'error') {
    const notification = document.getElementById('notification');
    const notificationMessage = document.getElementById('notification-message');

    notificationMessage.textContent = message;

    // Reset classes
    notification.classList.remove('opacity-0', 'opacity-100', 'translate-y-[-100%]', 'translate-y-0', 'bg-red-500', 'bg-green-500');

    // Set base classes
    notification.classList.add('fixed', 'top-5', 'right-5', 'px-4', 'py-2', 'rounded-lg', 'text-white', 'font-medium', 'shadow-lg', 'z-50', 'transition-all', 'duration-300', 'opacity-100', 'translate-y-0');

    // Set type-specific classes
    if (type === 'success') {
        notification.classList.add('bg-green-500');
    } else {
        notification.classList.add('bg-red-500');
    }

    // Hide after 3 seconds
    setTimeout(() => {
        notification.classList.remove('opacity-100', 'translate-y-0');
        notification.classList.add('opacity-0', 'translate-y-[-100%]');
    }, 3000);
}

function isValidEmail(email) {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
}

function hasUpperCase(str) {
    return /[A-Z]/.test(str);
}

function hasLowerCase(str) {
    return /[a-z]/.test(str);
}

function hasNumber(str) {
    return /\d/.test(str);
}

function hasSpecialChar(str) {
    return /[!@#$%^&*()_+\-=\[\]{};':"\\|,.<>\/?]/.test(str);
}

function submitForm(form, url) {
    console.log('submitForm called with URL:', url);
    const formData = new FormData(form);
    const data = Object.fromEntries(formData);
    console.log('Form data:', data);

    fetch(url, {
        method: 'POST',
        body: JSON.stringify(data),
        headers: {
            'Content-Type': 'application/json'
        }
    })
        .then(response => {
            console.log('Response status:', response.status);
            return response.json().then(data => ({ status: response.status, body: data }));
        })
        .then(({ status, body }) => {
            console.log('Response body:', body);
            if (status === 200) {
                showNotification(body.message || 'Успешно!', 'success');
                if (url.includes('login')) {
                    // Проверяем, является ли пользователь админом
                    if (body.user && body.user.role === 'admin') {
                        // Сохраняем токен админа и перенаправляем на админ панель
                        localStorage.setItem('admin_token', body.access_token);
                        localStorage.setItem('admin_user', JSON.stringify(body.user));
                        showNotification('Добро пожаловать в админ панель!', 'success');
                        setTimeout(() => {
                            window.location.href = '/admin';
                        }, 1000);
                    } else {
                        // Обычный пользователь - перенаправляем на главную
                        setTimeout(() => {
                            window.location.href = '/';
                        }, 1000);
                    }
                } else if (url.includes('register')) {
                    // Switch to login tab after successful registration
                    document.querySelector('[data-tab="login"]').click();
                    form.reset();
                }
            } else {
                showNotification(body.error || 'Произошла ошибка', 'error');
            }
        })
        .catch(error => {
            console.error('Error:', error);
            showNotification('Произошла ошибка при отправке формы', 'error');
        });
}

function submitAdminForm(form, url) {
    console.log('submitAdminForm called with URL:', url);
    const formData = new FormData(form);
    const data = Object.fromEntries(formData);
    console.log('Admin form data:', data);

    fetch(url, {
        method: 'POST',
        body: JSON.stringify(data),
        headers: {
            'Content-Type': 'application/json'
        }
    })
        .then(response => {
            console.log('Admin response status:', response.status);
            return response.json().then(data => ({ status: response.status, body: data }));
        })
        .then(({ status, body }) => {
            console.log('Admin response body:', body);
            if (status === 200) {
                // Store admin token and redirect to admin panel
                localStorage.setItem('admin_token', body.access_token);
                localStorage.setItem('admin_user', JSON.stringify(body.user));
                showNotification('Успешный вход в админ панель!', 'success');
                setTimeout(() => {
                    window.location.href = '/admin';
                }, 1000);
            } else {
                showNotification(body.error || 'Неверные данные админа', 'error');
            }
        })
        .catch(error => {
            console.error('Admin login error:', error);
            showNotification('Произошла ошибка при входе в админ панель', 'error');
        });
}