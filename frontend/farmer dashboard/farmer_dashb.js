
  document.addEventListener("DOMContentLoaded", () => {
    const user = JSON.parse(localStorage.getItem("user"));
    const toggleBtn = document.getElementById("toggleRoleBtn");

    // Show button only if the user is a farmer
    if (user && user.role === "farmer") {
      toggleBtn.style.display = "inline-block";
      toggleBtn.innerText = "Switch to Customer View";
    }

    toggleBtn.addEventListener("click", async () => {
      try {
        const res = await fetch("http://localhost:5000/api/users/toggle-role", {
          method: "PATCH",
          headers: {
            "Content-Type": "application/json"
          },
          body: JSON.stringify({ userId: user._id })
        });

        const data = await res.json();

        if (res.ok) {
          alert(data.message);

          // Update user role in localStorage
          user.role = data.role;
          localStorage.setItem("user", JSON.stringify(user));

          // Optionally reload to reflect change
          location.reload();
        } else {
          alert(data.message || "Role switch failed");
        }
      } catch (err) {
        console.error("Toggle error", err);
        alert("Server error during toggle");
      }
    });
  });

  function logout() {
    localStorage.clear();
    window.location.href = "../login/index.html";
  }

  document.addEventListener("DOMContentLoaded", () => {
    const userString = localStorage.getItem("user");
  
    if (userString) {
      try {
        const user = JSON.parse(userString);
        document.getElementById("seller-greeting").innerText =
          `Welcome, ${user.name || user.username}!`;
      } catch (e) {
        console.error("Failed to parse user data:", e);
      }
    }
  });
  

