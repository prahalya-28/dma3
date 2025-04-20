document.addEventListener("DOMContentLoaded", () => {
  
  // Initialize the user key in local storage to an empty object
  
  
  if (!localStorage.getItem("user")) {
    localStorage.setItem("user", JSON.stringify({}));
  }

  const userString = localStorage.getItem("user");

  let user = null;
  if (userString) {
    try {
      user = JSON.parse(userString);
    } catch (e) {
      console.error("Invalid JSON in localStorage for 'user'", e);
      localStorage.removeItem("user"); // Optionally clear it
    }
  } else {
    console.warn("No user data found in localStorage.");
  }

  const greeting = document.getElementById("greeting");
  if (user && (user.name ||user.username) && greeting) {
    greeting.innerText = `Welcome back, ${user.name}!`;
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
          const div = document.createElement("div");
          div.className = "product-card";
          div.innerHTML = `
            <img src="${product.images?.[0] || 'placeholder.jpg'}" alt="${product.name}" />
            <h3>${product.name}</h3>
            <p>${product.description || 'No description available.'}</p>
            <p><strong>Price:</strong> ₹${product.price}</p>
            <p><strong>Quantity:</strong> ${product.quantity}</p>
            <button onclick="placeOrder('${product._id}')">Order Now</button>
          `;
          container.appendChild(div);
        });
      })
      .catch(err => {
        console.error("Error fetching products", err);
      });
  }
  
  function searchProducts() {
    const keyword = document.getElementById("search-bar").value.toLowerCase();
    const cards = document.querySelectorAll(".product-card");
  
    cards.forEach(card => {
      const name = card.querySelector("h3").textContent.toLowerCase();
      card.style.display = name.includes(keyword) ? "block" : "none";
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
      body: JSON.stringify({ productId, quantity: 1 }) // Default 1 for now
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
  