document.addEventListener('DOMContentLoaded', () => {
  // Display message in the UI
  function showMessage(message, isError = true) {
    const messageDiv = document.getElementById('message');
    messageDiv.textContent = message;
    messageDiv.className = `message ${isError ? 'error' : 'success'}`;
  }

  // Clear previous error messages and styles
  function clearErrors() {
    const messageDiv = document.getElementById('message');
    messageDiv.textContent = '';
    messageDiv.className = 'message';
    document.querySelectorAll('.registration-form input').forEach(input => {
      input.classList.remove('invalid');
    });
  }

  // Validate bank details (client-side)
  function validateBankDetails(accountNumber, ifsc) {
    const accountNumberRegex = /^[0-9]+$/;
    const ifscRegex = /^[A-Z]{4}0[A-Z0-9]{6}$/;
    if (!accountNumberRegex.test(accountNumber)) {
      return 'Valid Bank Account Number is required';
    }
    if (!ifscRegex.test(ifsc)) {
      return 'Valid IFSC Code is required (e.g., SBIN0001234)';
    }
    return null;
  }

  // Validate form fields
  function validateForm(event) {
    event.preventDefault();
    clearErrors();

    const token = localStorage.getItem("token");
    if (!token) {
      showMessage("Please log in first");
      return false;
    }

    const inputs = document.querySelectorAll('.registration-form input[required]');
    let hasError = false;

    // TC6: Check for blank form
    let allEmpty = true;
    inputs.forEach(input => {
      if (input.value.trim()) {
        allEmpty = false;
      }
      if (!input.value.trim()) {
        input.classList.add('invalid');
        showMessage(input.dataset.error);
        hasError = true;
      }
    });

    if (allEmpty) {
      showMessage("Please fill in all required fields");
      return false;
    }

    // TC2: Check for government ID proof
    const idProofInput = document.getElementById("id-proof");
    const idProofFile = idProofInput.files[0];
    if (!idProofFile) {
      idProofInput.classList.add('invalid');
      showMessage("Government ID Proof is required for seller registration");
      return false;
    }

    // TC4: Check for farm location
    const location = document.getElementById("location").value.trim();
    if (!location) {
      document.getElementById("location").classList.add('invalid');
      showMessage("Farm location is required");
      return false;
    }

    // TC3: Validate bank details
    const accountNumber = document.getElementById("account-number").value.trim();
    const ifsc = document.getElementById("ifsc").value.trim();
    const bankError = validateBankDetails(accountNumber, ifsc);
    if (bankError) {
      document.getElementById("account-number").classList.add('invalid');
      document.getElementById("ifsc").classList.add('invalid');
      showMessage(bankError);
      return false;
    }

    // TC1: If all validations pass, proceed with form submission
    const reader = new FileReader();
    reader.onloadend = () => {
      const data = {
        fname: document.getElementById("fname").value.trim(),
        lname: document.getElementById("lname").value.trim(),
        mobile: document.getElementById("mobile").value.trim(),
        email: document.getElementById("email").value.trim(),
        location: location,
        idProofUrl: reader.result,
        accountHolder: document.getElementById("account-name").value.trim(),
        accountNumber: accountNumber,
        ifsc: ifsc,
        upi: document.getElementById("upi").value.trim()
      };

      submitFormData(data, token);
    };

    reader.readAsDataURL(idProofFile);
    return false; // Prevent default form submission
  }

  // Submit form data to the server
  async function submitFormData(data, token) {
    try {
      const response = await fetch("http://localhost:5000/api/users/become-farmer", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify(data)
      });

      const result = await response.json();
      if (response.ok) {
        // TC1, TC5: Show success message and redirect to dashboard
        showMessage("Farmer registration successful! Please log in to continue.", false);
        setTimeout(() => {
          window.location.href = "../login/index.html";
        }, 2000);
      } else {
        // TC3: Handle invalid bank details from backend
        if (result.message.includes("bank details")) {
          document.getElementById("account-number").classList.add('invalid');
          document.getElementById("ifsc").classList.add('invalid');
          showMessage("Invalid bank details. Please check your account number and IFSC code.");
        } else {
          showMessage(result.message || 'Unknown error occurred');
        }
      }
    } catch (err) {
      console.error("Error registering farmer:", err);
      showMessage("Server error");
    }
  }

  // Expose validateForm globally for form onsubmit
  window.validateForm = validateForm;
});