document.getElementById('register-form').addEventListener('submit', async (e) => {
    e.preventDefault();
    const name = document.getElementById('name').value;
    const email = document.getElementById('email').value;
    const password = document.getElementById('password').value;
    const role = document.getElementById('role').value;
    const errorBox = document.getElementById('error-box');

    errorBox.style.display = 'none';

    try {
        const response = await fetch('http://127.0.0.1:5000/api/auth/register', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ name, email, password, role })
        });

        const data = await response.json();

        if (response.ok) {
            alert('Registration successful! Please login.');
            window.location.href = 'login.html';
        } else {
            errorBox.innerText = data.message || 'Registration failed';
            errorBox.style.display = 'block';
        }
    } catch (err) {
        errorBox.innerText = 'Server error';
        errorBox.style.display = 'block';
    }
});

