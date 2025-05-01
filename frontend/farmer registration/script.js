document.addEventListener('DOMContentLoaded', () => {
  const form = document.querySelector('.registration-form');

  form.addEventListener('submit', async (e) => {
    e.preventDefault();

    const token = localStorage.getItem("token"); // from login
    if (!token) {
      alert("Please log in first");
      return;
    }

    const idProofInput = document.getElementById("id-proof");
    const idProofFile = idProofInput.files[0]; // Get the selected file

    if (!idProofFile) {
      alert("Please upload your ID proof.");
      return;
    }

    // Convert the file to Base64 using FileReader
    const reader = new FileReader();
    reader.onloadend = () => {
      const data = {
        location: document.getElementById("location").value,
        idProofUrl: reader.result, // This is the Base64 string
        accountHolder: document.getElementById("account-name").value,
        accountNumber: document.getElementById("account-number").value,
        ifsc: document.getElementById("ifsc").value,
        upi: document.getElementById("upi").value
      };

      // Proceed with the POST request to the backend
      submitFormData(data, token);
    };

    // Read the file as Base64
    reader.readAsDataURL(idProofFile);
  });

  // Function to send the form data to the server
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
        alert("Farmer registration successful!");
        window.location.href = "../farmer dashboard/index.html";
        
      } else {
        alert(result.message || 'Unknown error occurred');
      }
    } catch (err) {
      console.error("Error registering farmer:", err);
      alert("Server error");
    }
  }


});
