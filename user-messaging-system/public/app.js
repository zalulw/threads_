const API_BASE = 'http://localhost:3000/api';

let token = localStorage.getItem('token');
let currentUserId = localStorage.getItem('userId');

if (token) {
    if (window.location.pathname.includes('index.html') || window.location.pathname === '/') {
        window.location.href = 'users.html';
    }
} else {
    if (!window.location.pathname.includes('index.html') && window.location.pathname !== '/') {
        window.location.href = 'index.html';
    }
}

document.addEventListener('DOMContentLoaded', () => {
    if (document.getElementById('auth-form')) {
        setupAuth();
    }
    if (document.getElementById('users-list')) {
        loadUsers();
    }
    if (document.getElementById('messages-list')) {
        loadMessages();
    }
    if (document.getElementById('thread-list')) {
        loadThread();
    }
});

function setupAuth() {
    let isLogin = true;
    const form = document.getElementById('auth-form');
    const title = document.getElementById('form-title');
    const toggleText = document.getElementById('toggle-text');
    const toggleLink = document.getElementById('toggle-link');
    const usernameField = document.getElementById('username');

    toggleLink.addEventListener('click', (e) => {
        e.preventDefault();
        isLogin = !isLogin;
        title.textContent = isLogin ? 'Login' : 'Register';
        usernameField.style.display = isLogin ? 'none' : 'block';
        toggleText.innerHTML = isLogin ? "Don't have an account? <a href='#' id='toggle-link'>Register</a>" : "Already have an account? <a href='#' id='toggle-link'>Login</a>";
        document.getElementById('toggle-link').addEventListener('click', setupAuth);
    });

    form.addEventListener('submit', async (e) => {
        e.preventDefault();
        const email = document.getElementById('email').value;
        const password = document.getElementById('password').value;
        const username = document.getElementById('username').value;

        const endpoint = isLogin ? '/auth/login' : '/auth/register';
        const body = isLogin ? { email, password } : { username, email, password };

        const response = await fetch(`${API_BASE}${endpoint}`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(body)
        });

        const data = await response.json();
        if (response.ok) {
            token = data.token;
            currentUserId = data.userId;
            localStorage.setItem('token', token);
            localStorage.setItem('userId', currentUserId);
            window.location.href = 'users.html';
        } else {
            alert(data.error);
        }
    });
}

async function loadUsers() {
    const response = await fetch(`${API_BASE}/users`, {
        headers: { 'Authorization': `Bearer ${token}` }
    });
    const users = await response.json();
    const list = document.getElementById('users-list');
    list.innerHTML = users.map(user => `
        <div class="col-md-4 mb-3">
            <div class="card">
                <div class="card-body">
                    <h5 class="card-title">${user.username}</h5>
                    <p class="card-text">${user.email}</p>
                    <button class="btn btn-primary" onclick="sendMessage(${user.id})">Send Message</button>
                </div>
            </div>
        </div>
    `).join('');
}

function sendMessage(recipientId) {
    const content = prompt('Enter message:');
    if (content) {
        fetch(`${API_BASE}/messages`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${token}`
            },
            body: JSON.stringify({ recipient_id: recipientId, content })
        }).then(() => {
            window.location.href = 'messages.html';
        });
    }
}

async function loadMessages() {
    const response = await fetch(`${API_BASE}/messages`, {
        headers: { 'Authorization': `Bearer ${token}` }
    });
    const messages = await response.json();
    const list = document.getElementById('messages-list');
    list.innerHTML = messages.map(msg => `
        <div class="col-md-6 mb-3">
            <div class="card">
                <div class="card-body">
                    <h5 class="card-title">${msg.senderUsername}</h5>
                    <p class="card-text">${msg.content}</p>
                    <p class="card-text"><small class="text-muted">${new Date(msg.createdAt).toLocaleString()}</small></p>
                    <button class="btn btn-info me-2" onclick="viewThread(${msg.id})">View Thread</button>
                    <button class="btn btn-success" onclick="reply(${msg.id})">Reply</button>
                </div>
            </div>
        </div>
    `).join('');
}

function viewThread(messageId) {
    window.location.href = `thread.html?id=${messageId}`;
}

async function reply(messageId) {
    const content = prompt('Enter reply:');
    if (content) {
        // Fetch the original message to get the sender
        const response = await fetch(`${API_BASE}/messages/thread/${messageId}`, {
            headers: { 'Authorization': `Bearer ${token}` }
        });
        const thread = await response.json();
        const originalMessage = thread[0]; // First message in thread
        const recipientId = originalMessage.senderId === parseInt(currentUserId) ? originalMessage.recipientId : originalMessage.senderId;

        fetch(`${API_BASE}/messages`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${token}`
            },
            body: JSON.stringify({ recipient_id: recipientId, content, parent_id: messageId })
        }).then(() => {
            loadMessages();
        });
    }
}

async function loadThread() {
    const urlParams = new URLSearchParams(window.location.search);
    const id = urlParams.get('id');
    const response = await fetch(`${API_BASE}/messages/thread/${id}`, {
        headers: { 'Authorization': `Bearer ${token}` }
    });
    const thread = await response.json();
    const list = document.getElementById('thread-list');
    list.innerHTML = thread.map(msg => `
        <div class="card mb-3">
            <div class="card-body">
                <h5 class="card-title">${msg.senderUsername}</h5>
                <p class="card-text">${msg.content}</p>
                <p class="card-text"><small class="text-muted">${new Date(msg.createdAt).toLocaleString()}</small></p>
            </div>
        </div>
    `).join('');
}

async function sendReply() {
    const urlParams = new URLSearchParams(window.location.search);
    const id = urlParams.get('id');
    const content = document.getElementById('reply-content').value;
    if (!content.trim()) return;

    // Fetch the thread to determine recipient
    const response = await fetch(`${API_BASE}/messages/thread/${id}`, {
        headers: { 'Authorization': `Bearer ${token}` }
    });
    const thread = await response.json();
    const originalMessage = thread[0]; // First message in thread
    const recipientId = originalMessage.senderId === parseInt(currentUserId) ? originalMessage.recipientId : originalMessage.senderId;

    fetch(`${API_BASE}/messages`, {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({ recipient_id: recipientId, content, parent_id: parseInt(id) })
    }).then(() => {
        loadThread();
        document.getElementById('reply-content').value = '';
    });
}

function logout() {
    localStorage.removeItem('token');
    localStorage.removeItem('userId');
    window.location.href = 'index.html';
}

function newMessage() {
    window.location.href = 'users.html';
}