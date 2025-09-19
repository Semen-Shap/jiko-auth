document.addEventListener('DOMContentLoaded', function () {
    // Tab switching
    const tabButtons = document.querySelectorAll('.tab-button');
    const authForms = document.querySelectorAll('.auth-form');

    tabButtons.forEach(button => {
        button.addEventListener('click', () => {
            const tab = button.getAttribute('data-tab');

            // Update active tab
            tabButtons.forEach(btn => btn.classList.remove('active'));
            button.classList.add('active');

            // Show corresponding form
            authForms.forEach(form => {
                form.classList.remove('active');
                if (form.id === `${tab}-form`) {
                    form.classList.add('active');
                }
            });
        });
    });

    // Form validation
    const loginForm = document.getElementById('login-form');
    const registerForm = document.getElementById('register-form');

    if (loginForm) {
        loginForm.addEventListener('submit', function (e) {
            e.preventDefault();
            if (validateLoginForm()) {
                submitForm(this, '/api/v1/auth/login');
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
    let isValid = true;
    const email = document.getElementById('login-email');
    const password = document.getElementById('login-password');
    const emailError = document.getElementById('login-email-error');
    const passwordError = document.getElementById('login-password-error');

    // Reset errors
    emailError.style.display = 'none';
    passwordError.style.display = 'none';

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
    if (!password.value) {
        passwordError.textContent = 'Пароль обязателен';
        passwordError.style.display = 'block';
        isValid = false;
    }

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
    const formData = new FormData(form);

    fetch(url, {
        method: 'POST',
        body: JSON.stringify(Object.fromEntries(formData)),
        headers: {
            'Content-Type': 'application/json'
        }
    })
        .then(response => response.json().then(data => ({ status: response.status, body: data })))
        .then(({ status, body }) => {
            if (status === 200) {
                showNotification(body.message || 'Успешно!', 'success');
                if (url.includes('login')) {
                    // Redirect to main page after successful login
                    setTimeout(() => {
                        window.location.href = '/';
                    }, 1000);
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

function showNotification(message, type = 'error') {
    const notification = document.getElementById('notification');
    const notificationMessage = document.getElementById('notification-message');

    notificationMessage.textContent = message;
    notification.className = 'notification';

    if (type === 'success') {
        notification.classList.add('success');
    }

    notification.classList.add('show');

    setTimeout(() => {
        notification.classList.remove('show');
    }, 3000);
}