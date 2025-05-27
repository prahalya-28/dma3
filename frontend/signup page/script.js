document.addEventListener('DOMContentLoaded', () => {
    const signupForm = document.getElementById('signupForm');

    // Update country code
    function updateCountryCode() {
        let countrySelect = document.getElementById('country');
        let selectedOption = countrySelect.options[countrySelect.selectedIndex];
        let countryCode = selectedOption.getAttribute('data-code') || '';
        let mobileInput = document.getElementById('mobile');
        mobileInput.value = countryCode + mobileInput.value.replace(/^\+\d+/, '');
    }

    // Validate email format
    function isValidEmail(email) {
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        return emailRegex.test(email);
    }

    // Validate phone format
    function isValidPhone(phone) {
        return /^\+\d{10,15}$/.test(phone);
    }

    // Validate username
    function isValidUsername(username) {
       return username.length >= 3 && username.length <= 10 ;
    }

    // Validate password
    function isValidPassword(password) {
        const passwordRegex = /^(?=.*[a-zA-Z])(?=.*\d)[a-zA-Z\d]{8,}$/;
        return passwordRegex.test(password);
    }

    // Clear error messages
    function clearErrors() {
        document.getElementById('firstNameError').textContent = '';
        document.getElementById('lastNameError').textContent = '';
        document.getElementById('countryError').textContent = '';
        document.getElementById('mobileError').textContent = '';
        document.getElementById('emailError').textContent = '';
        document.getElementById('usernameError').textContent = '';
        document.getElementById('passwordError').textContent = '';
        document.getElementById('confirmPasswordError').textContent = '';
    }

    // Form submission
    signupForm.addEventListener('submit', async (event) => {
        event.preventDefault();
        clearErrors();

        const role = 'buyer';  // Always set role to buyer (which is the default customer role)
        const firstName = document.getElementById('firstName').value;
        const lastName = document.getElementById('lastName').value;
        const country = document.getElementById('country').value;
        const mobile = document.getElementById('mobile').value;
        const email = document.getElementById('email').value;
        const username = document.getElementById('username').value;
        const password = document.getElementById('password').value;
        const confirmPassword = document.getElementById('confirmPassword').value;

        // Client-side validations
        if (!firstName || !lastName || !country || !mobile || !email || !username || !password || !confirmPassword) {
            alert('All fields are required');
            return;
        }

        if (!isValidEmail(email)) {
            document.getElementById('emailError').textContent = 'Invalid email format';
            return;
        }

        if (!isValidPhone(mobile)) {
            document.getElementById('mobileError').textContent = 'Invalid mobile number (include country code)';
            return;
        }

        if (!isValidUsername(username)) {
            document.getElementById('usernameError').textContent = 'Username must be within 3 to 10 characters';
            return;
        }

        if (!isValidPassword(password)) {
            document.getElementById('passwordError').textContent = 'Password must be alphanumeric and at least 8 characters';
            return;
        }

        if (password !== confirmPassword) {
            document.getElementById('confirmPasswordError').textContent = 'Passwords do not match';
            return;
        }

        const userData = {
            role,
            name: `${firstName} ${lastName}`, // <--- Add this line back
            address: country,
            mobile,
            email,
            username,
            password
        };

        try {
            const response = await fetch('https://dma-qhwn.onrender.com/api/users/register', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(userData)
            });

            const data = await response.json();
            if (response.ok) {
                localStorage.setItem('userVerified', data.verified ? 'true' : 'false');
                document.getElementById('otpMessage').style.display = 'block';
                document.getElementById('otpMessage').innerHTML = `
                    <p>Registration successful! Please check your email for the verification OTP.</p>
                    <p><a href="verify.html">Verify Email</a></p>
                `;
            } else {
                if (data.message.includes('Email')) {
                    document.getElementById('emailError').textContent = data.message;
                } else if (data.message.includes('Username')) {
                    document.getElementById('usernameError').textContent = data.message;
                } else {
                    alert(data.message || 'Registration failed');
                }
            }
        } catch (error) {
            console.error('Registration error:', error);
            alert('Server error, try again later');
        }
    });

    // Expose updateCountryCode globally
    window.updateCountryCode = updateCountryCode;
});