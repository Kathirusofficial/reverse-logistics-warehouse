document.getElementById('loginForm').addEventListener('submit', async (e) => {
    e.preventDefault();
    const email = document.getElementById('email').value;
    const password = document.getElementById('password').value;
    const errorBox = document.getElementById('error-box');

    if (errorBox) errorBox.style.display = 'none';

    try {
        const response = await fetch('http://127.0.0.1:5000/api/auth/login', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ email, password })
        });

        const data = await response.json();

        if (response.ok) {
            localStorage.setItem('userEmail', data.email);
            localStorage.setItem('userName', data.name);
            localStorage.setItem('userRole', data.role);
            localStorage.setItem('userId', data.id);
            localStorage.setItem('userToken', data.token);
            window.location.href = 'dashboard.html';
        } else {
            if(errorBox) {
                errorBox.innerText = data.message || 'Login failed';
                errorBox.style.display = 'block';
            } else {
                alert(data.message || 'Login failed');
            }
        }
    } catch (err) {
        alert('Could not connect to server.');
    }
});

if (localStorage.getItem('userEmail')) {
    window.location.href = 'dashboard.html';
}

