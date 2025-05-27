document.addEventListener('DOMContentLoaded', () => {
    const sendOtpBtn = document.getElementById('sendOtpBtn');
    const resetPasswordBtn = document.getElementById('resetPasswordBtn');

    // Clear error messages
    function clearErrors() {
        document.getElementById('emailError').textContent = '';
        document.getElementById('otpError').textContent = '';
        document.getElementById('passwordError').textContent = '';
        document.getElementById('confirmPasswordError').textContent = '';
        document.getElementById('successMessage').textContent = '';
    }

    // Validate password
    function isValidPassword(password) {
        return /^(?=.*[a-zA-Z])(?=.*\d)[a-zA-Z\d]{8,}$/.test(password);
    }

    sendOtpBtn.addEventListener('click', async () => {
        clearErrors();
        const resetEmail = document.getElementById('resetEmail').value;
        const emailError = document.getElementById('emailError');
        const successMessageElem = document.getElementById('successMessage');

        if (!resetEmail) {
            emailError.textContent = 'Please enter your email or username';
            return;
        }

        try {
            const response = await fetch('https://dma-qhwn.onrender.com/api/users/request-password-reset', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ emailOrUsername: resetEmail })
            });

            const data = await response.json();

            if (response.ok) {
                successMessageElem.textContent = data.message;
                successMessageElem.style.color = 'green';
                document.getElementById('otp').style.display = 'block';
                document.getElementById('newPassword').style.display = 'block';
                document.getElementById('confirmNewPassword').style.display = 'block';
                document.getElementById('resetPasswordBtn').style.display = 'block';
                document.getElementById('sendOtpBtn').style.display = 'none';
            } else {
                emailError.textContent = data.message || 'Failed to request password reset.';
                emailError.style.color = 'red';
            }
        } catch (error) {
            console.error('Forgot password request error:', error);
            emailError.textContent = 'Server error. Please try again later.';
            emailError.style.color = 'red';
        }
    });

    resetPasswordBtn.addEventListener('click', async () => {
        clearErrors();
        const resetEmail = document.getElementById('resetEmail').value;
        const otp = document.getElementById('otp').value;
        const newPassword = document.getElementById('newPassword').value;
        const confirmNewPassword = document.getElementById('confirmNewPassword').value;

        if (!otp) {
            document.getElementById('otpError').textContent = 'Please enter the OTP';
            return;
        }

        if (!newPassword || !confirmNewPassword) {
            document.getElementById('passwordError').textContent = 'Please enter and confirm your new password';
            return;
        }

        if (!isValidPassword(newPassword)) {
            document.getElementById('passwordError').textContent = 'Password must be alphanumeric and at least 8 characters';
            return;
        }

        if (newPassword !== confirmNewPassword) {
            document.getElementById('confirmPasswordError').textContent = 'Passwords do not match';
            return;
        }

        try {
            const response = await fetch('https://dma-qhwn.onrender.com/api/users/verify-otp', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ identifier: resetEmail, otp, newPassword })
            });

            if (!response.ok) {
                const errorData = await response.json();
                document.getElementById('otpError').textContent = errorData.message || 'Invalid OTP';
                return;
            }

            alert('Password reset successful! Redirecting to login...');
            localStorage.setItem('failedAttempts', 0); // Reset failed attempts
            window.location.href = 'index.html';
        } catch (error) {
            console.error('Password reset error:', error);
            alert('Server error, try again later');
        }
    });
});