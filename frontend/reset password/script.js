async function requestResetToken() {
    const emailOrUsername = document.getElementById("emailOrUsername").value.trim();
    const errorElem = document.getElementById("requestResetError");
    const successElem = document.getElementById("requestResetSuccess");
    errorElem.textContent = "";
    successElem.textContent = "";
    if (!emailOrUsername) {
        errorElem.textContent = "Please enter your email or username.";
        return;
    }
    try {
        const response = await fetch("http://localhost:5000/api/users/request-password-reset", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ emailOrUsername })
        });
        const data = await response.json();
        if (!response.ok) {
            errorElem.textContent = data.message || "Failed to request reset token.";
            return;
        }
        // For demo: show token to user
        successElem.textContent = `Reset token: ${data.token}`;
        // Show reset password form
        document.getElementById("requestResetContainer").style.display = "none";
        document.getElementById("resetPasswordContainer").style.display = "block";
    } catch (err) {
        errorElem.textContent = "Server error. Please try again.";
    }
}

function validatePassword(password) {
    const minLength = 8;
    const hasUpperCase = /[A-Z]/.test(password);
    const hasLowerCase = /[a-z]/.test(password);
    const hasNumber = /\d/.test(password);
    const hasSpecialChar = /[!@#$%^&*(),.?":{}|<>]/.test(password);
    if (password.length < minLength) {
        return "Password must be at least 8 characters long.";
    }
    if (!hasUpperCase || !hasLowerCase) {
        return "Password must contain both uppercase and lowercase letters.";
    }
    if (!hasNumber) {
        return "Password must contain at least one number.";
    }
    if (!hasSpecialChar) {
        return "Password must contain at least one special character.";
    }
    return "";
}

async function resetPassword() {
    const token = document.getElementById("resetToken").value.trim();
    const newPassword = document.getElementById("newPassword").value;
    const confirmNewPassword = document.getElementById("confirmNewPassword").value;
    const passwordError = document.getElementById("passwordError");
    const confirmPasswordError = document.getElementById("confirmPasswordError");
    const resetPasswordError = document.getElementById("resetPasswordError");
    const resetPasswordSuccess = document.getElementById("resetPasswordSuccess");
    passwordError.textContent = "";
    confirmPasswordError.textContent = "";
    resetPasswordError.textContent = "";
    resetPasswordSuccess.textContent = "";
    passwordError.textContent = validatePassword(newPassword);
    if (passwordError.textContent) return;
    if (newPassword !== confirmNewPassword) {
        confirmPasswordError.textContent = "Passwords do not match.";
        return;
    }
    if (!token) {
        resetPasswordError.textContent = "Please enter the reset token.";
        return;
    }
    try {
        const response = await fetch("http://localhost:5000/api/users/reset-password", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ token, newPassword })
        });
        const data = await response.json();
        if (!response.ok) {
            resetPasswordError.textContent = data.message || "Failed to reset password.";
            return;
        }
        resetPasswordSuccess.textContent = "Password changed successfully! Redirecting to login...";
        setTimeout(() => {
            window.location.href = "../login/index.html";
        }, 2000);
    } catch (err) {
        resetPasswordError.textContent = "Server error. Please try again.";
    }
}
