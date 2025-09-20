// Admin Panel JavaScript

let currentSection = 'dashboard';
let currentPage = 1;
let usersPerPage = 20;
let token = localStorage.getItem('admin_token');

// Initialize admin panel
document.addEventListener('DOMContentLoaded', function () {
    // Check if user is authenticated as admin
    if (!token) {
        window.location.href = '/';
        return;
    }

    // Load dashboard data
    loadStats();
    loadUsers();
    loadClients();

    // Setup form handlers
    setupFormHandlers();
});

// Authentication functions
function logout() {
    localStorage.removeItem('admin_token');
    localStorage.removeItem('admin_user');
    window.location.href = '/';
}

// Navigation functions
function showSection(sectionName) {
    // Update menu active state
    document.querySelectorAll('.menu-item').forEach(item => {
        item.classList.remove('active');
        item.classList.add('border-transparent');
        item.classList.remove('bg-blue-50', 'text-cyan-500', 'border-l-cyan-500', 'font-semibold');
    });
    const activeLink = document.querySelector(`[onclick="showSection('${sectionName}')"]`);
    activeLink.classList.add('active', 'bg-blue-50', 'text-cyan-500', 'border-l-cyan-500', 'font-semibold');
    activeLink.classList.remove('border-transparent');

    // Hide all sections
    document.querySelectorAll('[id$="-section"]').forEach(section => {
        section.classList.add('hidden');
        section.classList.remove('block');
    });

    // Show selected section
    const activeSection = document.getElementById(`${sectionName}-section`);
    activeSection.classList.remove('hidden');
    activeSection.classList.add('block');
    currentSection = sectionName;

    // Load section-specific data if needed
    if (sectionName === 'users') {
        loadUsers();
    } else if (sectionName === 'clients') {
        loadClients();
    } else if (sectionName === 'dashboard') {
        loadStats();
    }
}

// Stats functions
async function loadStats() {
    try {
        const response = await fetch('/api/v1/admin/stats', {
            headers: {
                'Authorization': `Bearer ${token}`
            }
        });

        if (response.ok) {
            const stats = await response.json();
            updateStatsDisplay(stats);
        } else {
            showNotification('Не удалось загрузить статистику', 'error');
        }
    } catch (error) {
        console.error('Error loading stats:', error);
        showNotification('Ошибка при загрузке статистики', 'error');
    }
}

function updateStatsDisplay(stats) {
    document.getElementById('total-users').textContent = stats.total_users || 0;
    document.getElementById('verified-users').textContent = stats.total_verified_users || 0;
    document.getElementById('total-clients').textContent = stats.total_clients || 0;
    document.getElementById('new-users-today').textContent = stats.new_users_today || 0;
}

// Users functions
async function loadUsers(page = 1) {
    try {
        const offset = (page - 1) * usersPerPage;
        const response = await fetch(`/api/v1/admin/users?limit=${usersPerPage}&offset=${offset}`, {
            headers: {
                'Authorization': `Bearer ${token}`
            }
        });

        if (response.ok) {
            const data = await response.json();
            updateUsersTable(data.users);
            updatePagination('users', page, data.count, usersPerPage);
        } else {
            showNotification('Не удалось загрузить пользователей', 'error');
        }
    } catch (error) {
        console.error('Error loading users:', error);
        showNotification('Ошибка при загрузке пользователей', 'error');
    }
}

function updateUsersTable(users) {
    const tbody = document.getElementById('users-table-body');
    tbody.innerHTML = '';

    users.forEach(user => {
        const row = document.createElement('tr');
        row.innerHTML = `
            <td>${user.id}</td>
            <td>${user.username}</td>
            <td>${user.email}</td>
            <td><span class="badge ${user.role === 'admin' ? 'badge-info' : 'badge-secondary'}">${user.role}</span></td>
            <td><span class="badge ${user.email_verified ? 'badge-success' : 'badge-danger'}">${user.email_verified ? 'Да' : 'Нет'}</span></td>
            <td>${formatDate(user.created_at)}</td>
            <td>
                <button class="btn btn-sm btn-warning" onclick="editUser('${user.id}')">Изменить</button>
                <button class="btn btn-sm btn-danger" onclick="deleteUser('${user.id}', '${user.username}')" 
                        ${user.role === 'admin' ? 'disabled' : ''}>Удалить</button>
            </td>
        `;
        tbody.appendChild(row);
    });
}

// Clients functions
async function loadClients() {
    try {
        const response = await fetch('/api/v1/admin/clients', {
            headers: {
                'Authorization': `Bearer ${token}`
            }
        });

        if (response.ok) {
            const clients = await response.json();
            updateClientsTable(clients);
        } else {
            showNotification('Не удалось загрузить клиентов', 'error');
        }
    } catch (error) {
        console.error('Error loading clients:', error);
        showNotification('Ошибка при загрузке клиентов', 'error');
    }
}

function updateClientsTable(clients) {
    const tbody = document.getElementById('clients-table-body');
    tbody.innerHTML = '';

    clients.forEach(client => {
        const row = document.createElement('tr');
        row.innerHTML = `
            <td>${client.id}</td>
            <td>${client.name}</td>
            <td>${client.username}</td>
            <td>${client.email}</td>
            <td>${client.redirect_uris.join('<br>')}</td>
            <td>${formatDate(client.created_at)}</td>
            <td>
                <button class="btn btn-sm btn-danger" onclick="deleteClient('${client.id}', '${client.name}')">Удалить</button>
            </td>
        `;
        tbody.appendChild(row);
    });
}

// Modal functions
function showCreateUserModal() {
    document.getElementById('createUserModal').classList.remove('hidden');
    document.getElementById('createUserModal').classList.add('flex');
}

function showCreateClientModal() {
    document.getElementById('createClientModal').classList.remove('hidden');
    document.getElementById('createClientModal').classList.add('flex');
}

function closeModal(modalId) {
    const modal = document.getElementById(modalId);
    modal.classList.add('hidden');
    modal.classList.remove('flex');
    // Reset form
    const form = modal.querySelector('form');
    if (form) {
        form.reset();
    }
}

async function editUser(userId) {
    try {
        const response = await fetch(`/api/v1/admin/users/${userId}`, {
            headers: {
                'Authorization': `Bearer ${token}`
            }
        });

        if (response.ok) {
            const user = await response.json();
            populateEditUserForm(user);
            const modal = document.getElementById('editUserModal');
            modal.classList.remove('hidden');
            modal.classList.add('flex');
        } else {
            showNotification('Не удалось загрузить данные пользователя', 'error');
        }
    } catch (error) {
        console.error('Error loading user:', error);
        showNotification('Ошибка при загрузке данных пользователя', 'error');
    }
}

function populateEditUserForm(user) {
    document.getElementById('edit-user-id').value = user.id;
    document.getElementById('edit-username').value = user.username;
    document.getElementById('edit-email').value = user.email;
    document.getElementById('edit-role').value = user.role;
    document.getElementById('edit-email-verified').checked = user.email_verified;
    document.getElementById('edit-password').value = ''; // Always empty for security
}

// CRUD operations
async function createUser(formData) {
    try {
        const response = await fetch('/api/v1/admin/users', {
            method: 'POST',
            headers: {
                'Authorization': `Bearer ${token}`,
                'Content-Type': 'application/json'
            },
            body: JSON.stringify(formData)
        });

        if (response.ok) {
            showNotification('Пользователь создан успешно', 'success');
            closeModal('createUserModal');
            if (currentSection === 'users') {
                loadUsers();
            }
            loadStats(); // Update stats
        } else {
            const error = await response.json();
            showNotification(error.error || 'Ошибка при создании пользователя', 'error');
        }
    } catch (error) {
        console.error('Error creating user:', error);
        showNotification('Ошибка при создании пользователя', 'error');
    }
}

async function updateUser(userId, formData) {
    try {
        // Remove empty fields
        Object.keys(formData).forEach(key => {
            if (formData[key] === '' || formData[key] === null || formData[key] === undefined) {
                delete formData[key];
            }
        });

        const response = await fetch(`/api/v1/admin/users/${userId}`, {
            method: 'PUT',
            headers: {
                'Authorization': `Bearer ${token}`,
                'Content-Type': 'application/json'
            },
            body: JSON.stringify(formData)
        });

        if (response.ok) {
            showNotification('Пользователь обновлен успешно', 'success');
            closeModal('editUserModal');
            if (currentSection === 'users') {
                loadUsers();
            }
        } else {
            const error = await response.json();
            showNotification(error.error || 'Ошибка при обновлении пользователя', 'error');
        }
    } catch (error) {
        console.error('Error updating user:', error);
        showNotification('Ошибка при обновлении пользователя', 'error');
    }
}

async function deleteUser(userId, username) {
    if (!confirm(`Вы уверены, что хотите удалить пользователя "${username}"?`)) {
        return;
    }

    try {
        const response = await fetch(`/api/v1/admin/users/${userId}`, {
            method: 'DELETE',
            headers: {
                'Authorization': `Bearer ${token}`
            }
        });

        if (response.ok) {
            showNotification('Пользователь удален успешно', 'success');
            if (currentSection === 'users') {
                loadUsers();
            }
            loadStats(); // Update stats
        } else {
            const error = await response.json();
            showNotification(error.error || 'Ошибка при удалении пользователя', 'error');
        }
    } catch (error) {
        console.error('Error deleting user:', error);
        showNotification('Ошибка при удалении пользователя', 'error');
    }
}

async function createClient(formData) {
    try {
        // Convert redirect_uris from textarea to array
        formData.redirect_uris = formData.redirect_uris.split('\n')
            .map(uri => uri.trim())
            .filter(uri => uri.length > 0);

        const response = await fetch('/api/v1/admin/clients', {
            method: 'POST',
            headers: {
                'Authorization': `Bearer ${token}`,
                'Content-Type': 'application/json'
            },
            body: JSON.stringify(formData)
        });

        if (response.ok) {
            const client = await response.json();
            showNotification('Клиент создан успешно', 'success');
            // Show client secret once
            alert(`Клиент создан!\nID: ${client.id}\nSecret: ${client.secret}\n\nСОХРАНИТЕ SECRET - он больше не будет показан!`);
            closeModal('createClientModal');
            if (currentSection === 'clients') {
                loadClients();
            }
            loadStats(); // Update stats
        } else {
            const error = await response.json();
            showNotification(error.error || 'Ошибка при создании клиента', 'error');
        }
    } catch (error) {
        console.error('Error creating client:', error);
        showNotification('Ошибка при создании клиента', 'error');
    }
}

async function deleteClient(clientId, clientName) {
    if (!confirm(`Вы уверены, что хотите удалить клиента "${clientName}"?`)) {
        return;
    }

    try {
        const response = await fetch(`/api/v1/admin/clients/${clientId}`, {
            method: 'DELETE',
            headers: {
                'Authorization': `Bearer ${token}`
            }
        });

        if (response.ok) {
            showNotification('Клиент удален успешно', 'success');
            if (currentSection === 'clients') {
                loadClients();
            }
            loadStats(); // Update stats
        } else {
            const error = await response.json();
            showNotification(error.error || 'Ошибка при удалении клиента', 'error');
        }
    } catch (error) {
        console.error('Error deleting client:', error);
        showNotification('Ошибка при удалении клиента', 'error');
    }
}

// Form handlers
function setupFormHandlers() {
    // Create user form
    document.getElementById('createUserForm').addEventListener('submit', function (e) {
        e.preventDefault();
        const formData = new FormData(this);
        const data = Object.fromEntries(formData);
        createUser(data);
    });

    // Edit user form
    document.getElementById('editUserForm').addEventListener('submit', function (e) {
        e.preventDefault();
        const formData = new FormData(this);
        const data = Object.fromEntries(formData);
        const userId = data.user_id;
        delete data.user_id;

        // Handle checkbox
        data.email_verified = document.getElementById('edit-email-verified').checked;

        updateUser(userId, data);
    });

    // Create client form
    document.getElementById('createClientForm').addEventListener('submit', function (e) {
        e.preventDefault();
        const formData = new FormData(this);
        const data = Object.fromEntries(formData);
        createClient(data);
    });

    // Close modal when clicking outside
    window.onclick = function (event) {
        if (event.target.classList.contains('modal')) {
            event.target.style.display = 'none';
        }
    };
}

// Utility functions
function formatDate(dateString) {
    const date = new Date(dateString);
    return date.toLocaleDateString('ru-RU') + ' ' + date.toLocaleTimeString('ru-RU', {
        hour: '2-digit',
        minute: '2-digit'
    });
}

function updatePagination(type, currentPage, totalItems, itemsPerPage) {
    const totalPages = Math.ceil(totalItems / itemsPerPage);
    const paginationContainer = document.getElementById(`${type}-pagination`);

    if (totalPages <= 1) {
        paginationContainer.innerHTML = '';
        return;
    }

    let paginationHTML = '';

    // Previous button
    paginationHTML += `<button ${currentPage === 1 ? 'disabled' : ''} 
                               onclick="loadUsers(${currentPage - 1})">‹ Предыдущая</button>`;

    // Page numbers
    for (let i = 1; i <= totalPages; i++) {
        if (i === currentPage) {
            paginationHTML += `<button class="active">${i}</button>`;
        } else {
            paginationHTML += `<button onclick="loadUsers(${i})">${i}</button>`;
        }
    }

    // Next button
    paginationHTML += `<button ${currentPage === totalPages ? 'disabled' : ''} 
                               onclick="loadUsers(${currentPage + 1})">Следующая ›</button>`;

    paginationContainer.innerHTML = paginationHTML;
}

function showNotification(message, type = 'error') {
    // Create notification element
    const notification = document.createElement('div');
    notification.className = `admin-notification ${type}`;
    notification.innerHTML = `
        <span>${message}</span>
        <button onclick="this.parentElement.remove()">×</button>
    `;

    // Add notification styles if not present
    if (!document.getElementById('admin-notification-styles')) {
        const styles = document.createElement('style');
        styles.id = 'admin-notification-styles';
        styles.textContent = `
            .admin-notification {
                position: fixed;
                top: 20px;
                right: 20px;
                padding: 1rem 1.5rem;
                border-radius: 5px;
                color: white;
                font-weight: 500;
                z-index: 1100;
                display: flex;
                align-items: center;
                gap: 1rem;
                animation: slideInRight 0.3s ease;
            }
            .admin-notification.success {
                background: #28a745;
            }
            .admin-notification.error {
                background: #dc3545;
            }
            .admin-notification button {
                background: none;
                border: none;
                color: white;
                font-size: 1.2rem;
                cursor: pointer;
                padding: 0;
                width: 20px;
                height: 20px;
                display: flex;
                align-items: center;
                justify-content: center;
            }
            @keyframes slideInRight {
                from { transform: translateX(100%); opacity: 0; }
                to { transform: translateX(0); opacity: 1; }
            }
        `;
        document.head.appendChild(styles);
    }

    document.body.appendChild(notification);

    // Auto remove after 5 seconds
    setTimeout(() => {
        if (notification.parentElement) {
            notification.remove();
        }
    }, 5000);
}