async function requestResetToken() {
  const emailOrUsername = document.getElementById("emailOrUsername").value.trim();
  const errorElem = document.getElementById("requestResetError");
  const successElem = document.getElementById("requestResetSuccess");
  errorElem.textContent = "";
  successElem.textContent = "";
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  const usernameRegex = /^[a-zA-Z0-9]{1,10}$/;
  if (!emailRegex.test(emailOrUsername) && !usernameRegex.test(emailOrUsername)) {
    errorElem.textContent = "Please enter a valid email or username";
    return;
  }
  try {
    const response = await fetch("https://dma-qhwn.onrender.com/api/users/request-password-reset", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ emailOrUsername }),
    });
    const data = await response.json();
    if (!response.ok) {
      errorElem.textContent = data.message || "Failed to request reset token.";
      return;
    }
    successElem.textContent = "Reset token sent to your email/phone. Check and enter it below.";
    document.getElementById("requestResetContainer").style.display = "none";
    document.getElementById("resetPasswordContainer").style.display = "block";
  } catch (err) {
    errorElem.textContent = "Cannot connect to server. Please try again.";
  }
}

function validatePassword(password) {
  if (!/^(?=.*[a-zA-Z])(?=.*\d)[a-zA-Z\d]{8,}$/.test(password)) {
    return "Password must be alphanumeric and at least 8 characters.";
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
    const response = await fetch("https://dma-qhwn.onrender.com/api/users/reset-password-token", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ token, newPassword }),
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
    resetPasswordError.textContent = "Cannot connect to server. Please try again.";
  }
}