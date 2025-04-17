document.addEventListener('DOMContentLoaded', () => {
    const loginBtn = document.getElementById('loginBtn');

    loginBtn.addEventListener('click', async () => {
        const username = document.getElementById('username').value;
        const password = document.getElementById('password').value;

        if (!username || !password) {
            alert("Please enter both email and password.");
            return;
        }

        try {
            const response = await fetch('http://localhost:5000/api/users/login', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({ username, password })
            });

            const data = await response.json();
            console.log('Response:', data);

            if (response.ok) {
                alert("Login successful!");

                // ✅ Save token & user data to localStorage
                localStorage.setItem('token', data.token);
                localStorage.setItem('user', JSON.stringify(data.user));

                // ✅ Redirect
                window.location.href = '../dashboard/dashboard.html';
            } else {
                alert(data.message || 'Login failed');
            }
        } catch (error) {
            console.error('Error:', error);
            alert('Server error, try again later');
        }
    });
});
