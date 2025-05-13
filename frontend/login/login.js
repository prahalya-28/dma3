document.addEventListener('DOMContentLoaded', () => {
    const loginBtn = document.getElementById('loginBtn');
    const googleLogin = document.getElementById('googleLogin');
    const facebookLogin = document.getElementById('facebookLogin');
    let failedAttempts = localStorage.getItem('failedAttempts') ? parseInt(localStorage.getItem('failedAttempts')) : 0;

    // Clear error messages
    function clearErrors() {
        document.getElementById('usernameError').textContent = '';
        document.getElementById('passwordError').textContent = '';
    }

    // Test server connectivity
    async function testServerConnection() {
        try {
            const response = await fetch('http://localhost:5000/test');
            await response.json();
            return true;
        } catch (error) {
            console.error('Server connection test failed:', error);
            return false;
        }
    }

    // Validate session token
    async function validateToken(token) {
        try {
            const response = await fetch('http://localhost:5000/api/users/validate-token', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` }
            });
            return response.ok;
        } catch (error) {
            console.error('Token validation failed:', error);
            return false;
        }
    }

    // Check if user is verified (from signup page)
    function isUserVerified() {
        return localStorage.getItem('userVerified') === 'true';
    }

    // Handle login
    async function handleLogin(username, password) {
        if (failedAttempts >= 3) {
            alert('Too many failed attempts. Your account has been locked. Try again later or reset your password.');
            return;
        }

        if (!isUserVerified()) {
            alert('Please verify your email/phone before logging in');
            return;
        }

        const isServerUp = await testServerConnection();
        if (!isServerUp) {
            alert('Cannot connect to server. Please make sure the backend server is running.');
            return;
        }

        try {
            const response = await fetch('http://localhost:5000/api/users/login', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json', 'Accept': 'application/json' },
                body: JSON.stringify({ username, password })
            });

            if (!response.ok) {
                const errorData = await response.json();
                failedAttempts++;
                localStorage.setItem('failedAttempts', failedAttempts);
                if (failedAttempts >= 3) {
                    alert('Too many failed attempts. Your account has been locked. Try again later or reset your password.');
                    return;
                }
                if (errorData.message.includes('deactivated')) {
                    alert('Your account has been deactivated. Contact support for assistance.');
                } else {
                    document.getElementById('usernameError').textContent = 'Invalid username or password';
                }
                throw new Error(errorData.message || 'Login failed');
            }

            const data = await response.json();
            failedAttempts = 0;
            localStorage.setItem('failedAttempts', failedAttempts);

            if (data.token) {
                const formattedUser = {
                    name: data.name || data.username,
                    email: data.email,
                    username: data.username,
                    role: data.role
                };
                localStorage.setItem('token', data.token);
                localStorage.setItem('user', JSON.stringify(formattedUser));

                if (data.role === 'farmer') {
                    window.location.href = '../farmer dashboard/index.html';
                } else {
                    window.location.href = '../registered_user homepage/index.html';
                }
            } else {
                throw new Error('No token received from server');
            }
        } catch (error) {
            console.error('Login error:', error);
            alert(error.message || 'Server error, try again later');
        }
    }

    // Handle session timeout
    async function checkSession() {
        const token = localStorage.getItem('token');
        if (token && !(await validateToken(token))) {
            alert('Session expired. Please log in again.');
            localStorage.removeItem('token');
            localStorage.removeItem('user');
        }
    }

    // Social login (simulated)
    function handleSocialLogin(provider) {
        alert(`Simulated ${provider} login. Redirecting to dashboard...`);
        // Simulate successful login
        const token = 'simulated-token';
        const formattedUser = { name: 'Social User', email: 'social@example.com', username: 'socialuser', role: 'buyer' };
        localStorage.setItem('token', token);
        localStorage.setItem('user', JSON.stringify(formattedUser));
        window.location.href = '../registered_user homepage/index.html';
    }

    loginBtn.addEventListener('click', async () => {
        clearErrors();
        const username = document.getElementById('username').value;
        const password = document.getElementById('password').value;
        const termsChecked = document.getElementById('termsCheckbox').checked;

        if (!username || !password) {
            document.getElementById('usernameError').textContent = 'Please enter both username and password';
            return;
        }

        if (!termsChecked) {
            alert('You must accept the Terms and Services');
            return;
        }

        await handleLogin(username, password);
    });

    googleLogin.addEventListener('click', () => handleSocialLogin('Google'));
    facebookLogin.addEventListener('click', () => handleSocialLogin('Facebook'));

    // Check session on load
    checkSession();
});