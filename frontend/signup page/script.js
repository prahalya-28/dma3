// Function to update country code when selecting a country
function updateCountryCode() {
    let countrySelect = document.getElementById("country");
    let selectedOption = countrySelect.options[countrySelect.selectedIndex];
    let countryCode = selectedOption.getAttribute("data-code");
    console.log("Selected Country Code:", countryCode);
}

// Form Submission Handler
document.getElementById("signupForm").addEventListener("submit", async function(event) {
    event.preventDefault(); // Prevent page refresh

    // Check privacy policy
    const privacyCheckbox = document.getElementById("privacyPolicy");
    if (privacyCheckbox && !privacyCheckbox.checked) {
        alert("You must agree to the Privacy Policy to sign up.");
        return;
    }

    let userData = {
         // Combine first & last name
         name: document.getElementById("firstName").value + " " + document.getElementById("lastName").value, // Combine first & last name
         address: document.getElementById("country").value, // Change 'country' to 'address'
        mobile: document.getElementById("mobile").value,
        email: document.getElementById("email").value,
        username: document.getElementById("username").value,
        password: document.getElementById("password").value,
    };

    if (userData.password !== document.getElementById("confirmPassword").value) {
        alert("Passwords do not match!");
        return;
    }

    try {
        let response = await fetch("http://localhost:5000/api/users/register", { // Correct API Route
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify(userData),
        });

        let data = await response.json();
        if (response.ok) {
            alert("Sign-up successful! Redirecting to login page...");
            window.location.href = "../login/index.html";
        } else {
            alert(data.message || "Error signing up");
        }
    } catch (error) {
        alert("Server error, try again later");
    }
});

// Social signup buttons
const googleBtn = document.querySelector('.social-btn.google');
if (googleBtn) googleBtn.onclick = () => alert('Google signup is not implemented in this demo.');
const facebookBtn = document.querySelector('.social-btn.facebook');
if (facebookBtn) facebookBtn.onclick = () => alert('Facebook signup is not implemented in this demo.');

// Contact Us popup
const contactLink = document.querySelector('a[href="#"]');
if (contactLink) contactLink.onclick = function(e) {
    e.preventDefault();
    alert('Contact us at: support@farmfresh.com or call +91-1234567890');
};
