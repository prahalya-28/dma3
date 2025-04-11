document.addEventListener('DOMContentLoaded', () => {
    const loginBtn = document.querySelector('button');

    loginBtn.addEventListener('click', async () => {
        const username = document.querySelector('input[type="text"]').value;
        const password = document.querySelector('input[type="password"]').value;

        console.log('Sending:', { username, password }); // ✅ Debugging line

        try {
            const response = await fetch('http://localhost:5000/api/auth/login', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({ username, password })
            });

            const data = await response.json();

            console.log('Response:', data); // ✅ Debugging line

            if (response.ok) {
                alert(data.message); // Show success message
                window.location.href = '/dashboard.html'; // Redirect to dashboard
            } else {
                alert(data.message); // Show error message
            }
        } catch (error) {
            console.error('Error:', error); // ✅ Debugging line
            alert('Something went wrong');
        }
    });
});
