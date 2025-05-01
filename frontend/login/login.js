document.addEventListener('DOMContentLoaded', () => {
    const loginBtn = document.getElementById('loginBtn');

    // First, test server connectivity
    async function testServerConnection() {
        try {
            const response = await fetch('http://localhost:5000/test');
            const data = await response.json();
            console.log('Server test response:', data);
            return true;
        } catch (error) {
            console.error('Server connection test failed:', error);
            return false;
        }
    }

    loginBtn.addEventListener('click', async () => {
        const username = document.getElementById('username').value;
        const password = document.getElementById('password').value;

        if (!username || !password) {
            alert("Please enter both email and password.");
            return;
        }

        // Test server connection first
        const isServerUp = await testServerConnection();
        if (!isServerUp) {
            alert("Cannot connect to server. Please make sure the backend server is running.");
            return;
        }
      
        try {
            console.log('Attempting login with:', { username });
            const response = await fetch('http://localhost:5000/api/users/login', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Accept': 'application/json'
                },
                body: JSON.stringify({ username, password })
            });

            console.log('Login response status:', response.status);
            
            if (!response.ok) {
                const errorData = await response.json();
                console.error('Login error response:', errorData);
                throw new Error(errorData.message || 'Login failed');
            }

            const data = await response.json();
            console.log('Login successful:', data);

            if (data.token) {
                const formattedUser = {
                    name: data.name || data.username,
                    email: data.email,
                    username: data.username,
                    role: data.role
                };
            
                localStorage.setItem('token', data.token);
                localStorage.setItem('user', JSON.stringify(formattedUser));
                
                // Redirect based on role
                if (data.role === 'farmer') {
                    window.location.href = "../farmer dashboard/index.html";
                } else {
                    window.location.href = "../registered_user homepage/index.html";
                }
            } else {
                throw new Error('No token received from server');
            }
        } catch (error) {
            console.error('Login error:', error);
            alert(error.message || 'Server error, try again later');
        }
    });
});
