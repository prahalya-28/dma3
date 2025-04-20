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
                console.log("🔁 Response data:", data);  // Add this line for debugging

                alert("Login successful!");
            
                if (data.user && data.token) {
                    const formattedUser = {
                        name: data.user.name || data.user.username,  // fallback if name is missing
                        email: data.user.email,
                        username: data.user.username
                    };
            
                    localStorage.setItem('token', data.token);
                    localStorage.setItem('user', JSON.stringify(formattedUser));
                } else {
                    console.warn("⚠️ Login succeeded but user or token is missing!");
                }
            
                window.location.href = "../registered_user homepage/index.html";
            }
            
             else {
                alert(data.message || 'Login failed');
            }
        } catch (error) {
            console.error('Error:', error);
            alert('Server error, try again later');
        }
    });
});
