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
        let response = await fetch("https://dma-qhwn.onrender.com/api/users/register", { // Correct API Route
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
