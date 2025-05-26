document.addEventListener('DOMContentLoaded', () => {
    const verifyForm = document.getElementById('verifyForm');

    // Clear error messages
    function clearErrors() {
        document.getElementById('identifierError').textContent = '';
        document.getElementById('otpError').textContent = '';
    }

    verifyForm.addEventListener('submit', async (event) => {
        event.preventDefault();
        clearErrors();

        const identifier = document.getElementById('identifier').value;
        const otp = document.getElementById('otp').value;

        if (!identifier || !otp) {
            document.getElementById('identifierError').textContent = 'Please enter both identifier and OTP';
            return;
        }

        try {
            const response = await fetch('https://dma-qhwn.onrender.com/api/users/verify', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ identifier, otp })
            });

            const data = await response.json();
            if (response.ok) {
                localStorage.setItem('userVerified', 'true');
                alert('Verification successful! You can now log in.');
                window.location.href = '../login/index.html';
            } else {
                document.getElementById('otpError').textContent = data.message || 'Verification failed';
            }
        } catch (error) {
            console.error('Verification error:', error);
            document.getElementById('otpError').textContent = 'Server error, try again later';
        }
    });
});