document.addEventListener("DOMContentLoaded", () => {
  const userString = localStorage.getItem("user");
  let user = null;

  if (userString) {
    try {
      user = JSON.parse(userString);
    } catch (e) {
      console.error("Invalid JSON in localStorage for 'user'", e);
      localStorage.removeItem("user");
    }
  }

  if (user && user.name) {
    document.getElementById("greeting").innerText = `Welcome back, ${user.name}!`;
    document.getElementById("userName").innerHTML = `<strong>Name:</strong> ${user.name}`;
    document.getElementById("userEmail").innerHTML = `<strong>Email:</strong> ${user.email}`;
  }

  fetchProducts();
});

function fetchProducts() {
  fetch("http://localhost:5000/api/products")
    .then(res => res.json())
    .then(products => {
      const container = document.getElementById("product-container");
      container.innerHTML = "";

      products.forEach(product => {
        const card = document.createElement("div");
        card.className = "card";

        card.innerHTML = `
          <img src="${product.images?.[0] || 'placeholder.jpg'}" alt="${product.name}">
          <p><strong>${product.name}</strong></p>
          <p>Price: ₹${product.price}</p>
          <p>Quantity: ${product.quantity}</p>
          <button class="add-to-cart" onclick="placeOrder('${product._id}')">Order Now</button>
        `;
        container.appendChild(card);
      });
    })
    .catch(err => {
      console.error("Error fetching products", err);
    });
}

function logout() {
  localStorage.removeItem("user");
  localStorage.removeItem("token");
  window.location.href = "../login/index.html";
}

function placeOrder(productId) {
  const token = localStorage.getItem("token");
  if (!token) return alert("Please log in again");

  fetch("http://localhost:5000/api/orders", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${token}`
    },
    body: JSON.stringify({ productId, quantity: 1 })
  })
    .then(res => res.json())
    .then(data => {
      if (data.message) {
        alert("Order placed successfully!");
      } else {
        alert("Something went wrong while ordering");
      }
    })
    .catch(err => {
      console.error("Order error", err);
    });
}

function goToFarmerRegistration() {
  window.location.href = "../farmer registration/index.html";
}

function searchProducts() {
  const keyword = document.getElementById("search-bar").value.toLowerCase();
  const cards = document.querySelectorAll(".card");

  cards.forEach(card => {
    const name = card.querySelector("p strong").textContent.toLowerCase();
    card.style.display = name.includes(keyword) ? "block" : "none";
  });
}
