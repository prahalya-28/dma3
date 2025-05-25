document.addEventListener('DOMContentLoaded', () => {
  checkUserRole();
  showProducts(); // Show products by default
  setupProductForm();
});

// Function to check if user is a farmer
async function checkUserRole() {
  const token = localStorage.getItem("token");
  if (!token) {
    window.location.href = "../login/index.html";
    return;
  }

  try {
    const response = await fetch("https://dma-qhwn.onrender.com/api/users/profile", {
      headers: {
        Authorization: `Bearer ${token}`
      }
    });

    if (response.ok) {
      const userData = await response.json();
      console.log("User data received:", userData);

      // Update localStorage with complete user info
      localStorage.setItem("user", JSON.stringify(userData));

      // Set user info in the UI
      document.getElementById("farmerName").textContent = userData.name || '';
      document.getElementById("farmerEmail").textContent = userData.email || '';

      // Get toggle button reference
      const toggleRoleBtn = document.getElementById("toggleRoleBtn");
      if (!toggleRoleBtn) {
        console.error("Toggle role button not found");
        return;
      }

      // Determine which dashboard we're on
      const isOnFarmerDashboard = window.location.pathname.includes('farmer dashboard');
      
      // Update button text based on current view
      if (isOnFarmerDashboard) {
        toggleRoleBtn.textContent = "Switch to Customer View";
      } else {
        toggleRoleBtn.textContent = "Switch to Seller View";
      }

      // Check if user should be on this page
      if (userData.role !== "farmer" && !userData.farmerProfile) {
        console.log("User is not a farmer, redirecting to customer dashboard...");
        window.location.href = "../registered_user homepage/index.html";
        return;
      }

      // If we're here, user is a farmer, update the greeting
      document.getElementById("greeting").textContent = `Welcome, ${userData.name}!`;
      
    } else {
      const errorData = await response.json();
      console.error("Failed to fetch user data:", errorData);
      alert("Failed to load user profile. Please refresh the page.");
    }
  } catch (error) {
    console.error("Error checking user role:", error);
    alert("An error occurred while checking user role. Please refresh the page.");
  }
}

// Function to toggle between customer and farmer roles
async function toggleRole() {
  const token = localStorage.getItem("token");
  if (!token) {
    window.location.href = "../login/index.html";
    return;
  }

  // Get button reference
  const toggleRoleBtn = document.getElementById("toggleRoleBtn");
  if (!toggleRoleBtn) {
    console.error("Toggle role button not found");
    alert("An error occurred. Please refresh the page and try again.");
    return;
  }

  // Store the original text and disable button
  const originalButtonText = toggleRoleBtn.textContent;
  toggleRoleBtn.disabled = true;
  toggleRoleBtn.textContent = "Switching...";

  try {
    console.log("Attempting to toggle role...");
    const response = await fetch("https://dma-qhwn.onrender.com/api/users/toggle-role", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`
      }
    });

    const data = await response.json();
    console.log("Toggle role response:", data);

    if (response.ok) {
      // Update localStorage with new role
      const user = JSON.parse(localStorage.getItem("user") || "{}");
      user.role = data.role;
      if (data.farmerProfile) {
        user.farmerProfile = data.farmerProfile;
      }
      localStorage.setItem("user", JSON.stringify(user));

      // Show success message
      alert(`Successfully switched to ${data.role} role`);

      // Redirect based on new role
      if (data.role === "farmer") {
        window.location.href = "../farmer dashboard/index.html";
      } else {
        window.location.href = "../registered_user homepage/index.html";
      }
    } else {
      // Handle specific error cases
      if (data.requiresRegistration) {
        if (confirm("You need to complete farmer registration first. Would you like to register now?")) {
          window.location.href = "../farmer registration/index.html";
        }
      } else {
        alert(data.message || "Failed to switch roles. Please try again.");
      }
      
      // Reset button state since we're staying on the page
      toggleRoleBtn.disabled = false;
      toggleRoleBtn.textContent = originalButtonText;
    }
  } catch (error) {
    console.error("Error toggling role:", error);
    alert("An error occurred while switching roles. Please try again.");
    
    // Reset button state
    toggleRoleBtn.disabled = false;
    toggleRoleBtn.textContent = originalButtonText;
  }
}

// Function to navigate to product listing page
function goToProductListing() {
  window.location.href = "../product listing/ProductListing.html";
}

// Function to load farmer's products
async function loadFarmerProducts() {
  const token = localStorage.getItem("token");
  if (!token) return;

  try {
    const response = await fetch("https://dma-qhwn.onrender.com/api/products/my-products", {
      headers: {
        Authorization: `Bearer ${token}`
      }
    });

    if (response.ok) {
      const products = await response.json();
      displayProducts(products);
    } else {
      console.error("Failed to load products:", await response.text());
    }
  } catch (error) {
    console.error("Error loading products:", error);
  }
}

// Function to display products
function displayProducts(products) {
  const container = document.getElementById("product-container");
  container.innerHTML = "";

  if (!products || products.length === 0) {
    container.innerHTML = "<p>No products found. Click 'Add New Product' to add your first product.</p>";
    return;
  }

  products.forEach(product => {
    const card = document.createElement("div");
    card.className = "product-card";
    card.innerHTML = `
      <img src="${product.image || product.imageUrl}" alt="${product.name}">
      <h3>${product.name}</h3>
      <p>${product.description}</p>
      <p>Price: ₹${product.price}</p>
      <p>Stock: ${product.quantity || product.stock}</p>
      <button class="edit-btn">Edit</button>
      <button onclick="deleteProduct('${product._id}')">Delete</button>
    `;
    card.querySelector('.edit-btn').onclick = () => openEditModal(product);
    container.appendChild(card);
  });
}

// Function to setup product form
function setupProductForm() {
  const productForm = document.getElementById("productForm");
  if (!productForm) return;

  productForm.addEventListener("submit", async (e) => {
    e.preventDefault();

    const name = document.getElementById("productName").value.trim();
    const price = parseFloat(document.getElementById("productPrice").value.trim());
    const category = document.getElementById("productCategory").value.trim();
    const description = document.getElementById("productDescription").value.trim();
    const imageFile = document.getElementById("productImage").files[0];
    const quantity = document.getElementById("productQuantity").value.trim();

    if (!name || !price || !imageFile || !quantity) {
      alert("Please fill in all required fields!");
      return;
    }

    try {
      const base64Image = await toBase64(imageFile);
      const token = localStorage.getItem("token");

      const productData = {
        name,
        price,
        category,
        description,
        image: base64Image,
        quantity: parseInt(quantity)
      };

      const response = await fetch("https://dma-qhwn.onrender.com/api/products", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${token}`
        },
        body: JSON.stringify(productData)
      });

      if (response.ok) {
        alert("Product added successfully!");
        productForm.reset();
        loadFarmerProducts();
      } else {
        const error = await response.json();
        alert(error.message || "Failed to add product");
      }
    } catch (error) {
      console.error("Error adding product:", error);
      alert("An error occurred while adding the product");
    }
  });
}

// Helper function to convert image to base64
function toBase64(file) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.readAsDataURL(file);
    reader.onload = () => resolve(reader.result);
    reader.onerror = error => reject(error);
  });
}

// Function to edit product
function editProduct(productId) {
  // Implement edit product functionality
  window.location.href = `edit-product.html?id=${productId}`;
}

// Function to delete product
async function deleteProduct(productId) {
  if (!confirm("Are you sure you want to delete this product?")) return;

  const token = localStorage.getItem("token");
  if (!token) return;

  try {
    const response = await fetch(`https://dma-qhwn.onrender.com/api/products/${productId}`, {
      method: "DELETE",
      headers: {
        Authorization: `Bearer ${token}`
      }
    });

    if (response.ok) {
      loadFarmerProducts();
    } else {
      alert("Failed to delete product. Please try again.");
    }
  } catch (error) {
    console.error("Error deleting product:", error);
    alert("Error deleting product. Please try again.");
  }
}

// Function to handle logout
function logout() {
  localStorage.removeItem("token");
  window.location.href = "../login/index.html";
}

// Modal logic for editing products
const editProductModal = document.getElementById('editProductModal');
const closeEditModal = document.getElementById('closeEditModal');
const editProductForm = document.getElementById('editProductForm');
const editProductMessage = document.getElementById('editProductMessage');

function openEditModal(product) {
  document.getElementById('editProductId').value = product._id;
  document.getElementById('editProductName').value = product.name;
  document.getElementById('editProductPrice').value = product.price;
  document.getElementById('editProductCategory').value = product.category || '';
  document.getElementById('editProductDescription').value = product.description || '';
  document.getElementById('editProductQuantity').value = product.quantity || product.stock || 1;
  document.getElementById('editProductImage').value = '';
  editProductMessage.textContent = '';
  editProductModal.style.display = 'flex';
}

if (closeEditModal) {
  closeEditModal.onclick = () => {
    editProductModal.style.display = 'none';
  };
}

window.onclick = function(event) {
  if (event.target === editProductModal) {
    editProductModal.style.display = 'none';
  }
};

// Handle edit form submission
if (editProductForm) {
  editProductForm.onsubmit = async function(e) {
    e.preventDefault();
    const id = document.getElementById('editProductId').value;
    const name = document.getElementById('editProductName').value.trim();
    const price = parseFloat(document.getElementById('editProductPrice').value.trim());
    const category = document.getElementById('editProductCategory').value.trim();
    const description = document.getElementById('editProductDescription').value.trim();
    const quantity = document.getElementById('editProductQuantity').value.trim();
    const imageFile = document.getElementById('editProductImage').files[0];
    let image;
    if (imageFile) {
      image = await toBase64(imageFile);
    }
    const token = localStorage.getItem('token');
    const body = { name, price, category, description, quantity };
    if (image) body.image = image;
    try {
      const response = await fetch(`https://dma-qhwn.onrender.com/api/products/${id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify(body)
      });
      if (response.ok) {
        editProductMessage.style.color = 'green';
        editProductMessage.textContent = 'Product updated!';
        setTimeout(() => {
          editProductModal.style.display = 'none';
          loadFarmerProducts();
        }, 800);
      } else {
        const err = await response.json();
        editProductMessage.style.color = 'red';
        editProductMessage.textContent = err.message || 'Failed to update product.';
      }
    } catch (error) {
      editProductMessage.style.color = 'red';
      editProductMessage.textContent = 'Server error.';
    }
  };
}

// Function to load farmer's orders
async function loadFarmerOrders() {
  const token = localStorage.getItem("token");
  if (!token) return;

  try {
    const response = await fetch("https://dma-qhwn.onrender.com/api/orders/farmer-orders", {
      headers: {
        Authorization: `Bearer ${token}`
      }
    });

    if (response.ok) {
      const orders = await response.json();
      displayOrders(orders);
    } else {
      console.error("Failed to load orders:", await response.text());
    }
  } catch (error) {
    console.error("Error loading orders:", error);
  }
}

// Function to display orders
function displayOrders(orders) {
  const container = document.getElementById("orders-container");
  if (!container) return;
  
  container.innerHTML = "";

  if (!orders || orders.length === 0) {
    container.innerHTML = "<p>No orders found.</p>";
    return;
  }

  orders.forEach(order => {
    const card = document.createElement("div");
    card.className = "order-card";
    card.innerHTML = `
      <div class="order-header">
        <h3>Order #${order._id.slice(-6)}</h3>
        <span class="status-badge ${order.status}">${order.status}</span>
      </div>
      <div class="order-details">
        <div class="product-info">
          <img src="${order.product.image}" alt="${order.product.name}">
          <div>
            <h4>${order.product.name}</h4>
            <p>Quantity: ${order.quantity}</p>
            <p>Total: ₹${order.totalPrice}</p>
          </div>
        </div>
        <div class="customer-info">
          <p><strong>Customer:</strong> ${order.user.name}</p>
          <p><strong>Email:</strong> ${order.user.email}</p>
          <p><strong>Delivery:</strong> ${order.deliveryMethod === 'pickup' ? 'Self Pickup' : 'Home Delivery'}</p>
          ${order.deliveryMethod === 'pickup' ? 
            `<p><strong>Pickup Time:</strong> ${order.deliveryDetails.pickupTime}</p>` :
            `<p><strong>Address:</strong> ${order.deliveryDetails.address}</p>
             <p><strong>Phone:</strong> ${order.deliveryDetails.phone}</p>`
          }
        </div>
        ${order.specialInstructions ? 
          `<div class="special-instructions">
            <p><strong>Special Instructions:</strong> ${order.specialInstructions}</p>
          </div>` : ''
        }
      </div>
      <div class="order-actions">
        ${order.status === 'pending' ? `
          <button onclick="updateOrderStatus('${order._id}', 'accepted')" class="accept-btn">Accept</button>
          <button onclick="updateOrderStatus('${order._id}', 'rejected')" class="reject-btn">Reject</button>
        ` : order.status === 'accepted' ? `
          <button onclick="updateOrderStatus('${order._id}', 'completed')" class="complete-btn">Mark as Completed</button>
        ` : ''}
      </div>
    `;
    container.appendChild(card);
  });
}

// Function to update order status
async function updateOrderStatus(orderId, status) {
  const token = localStorage.getItem("token");
  if (!token) return;

  try {
    const response = await fetch(`https://dma-qhwn.onrender.com/api/orders/${orderId}/status`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${token}`
      },
      body: JSON.stringify({ status })
    });

    if (response.ok) {
      // Reload orders to show updated status
      loadFarmerOrders();
    } else {
      const error = await response.json();
      alert(error.message || "Failed to update order status");
    }
  } catch (error) {
    console.error("Error updating order status:", error);
    alert("An error occurred while updating the order status");
  }
}

// Function to show orders section
function showOrders() {
  const productsSection = document.getElementById('productsSection');
  const ordersSection = document.getElementById('ordersSection');
  
  // Toggle visibility
  productsSection.style.display = 'none';
  ordersSection.style.display = 'block';
  
  // Load orders
  loadFarmerOrders();
}

// Function to show products section
function showProducts() {
  const productsSection = document.getElementById('productsSection');
  const ordersSection = document.getElementById('ordersSection');
  
  // Toggle visibility
  productsSection.style.display = 'block';
  ordersSection.style.display = 'none';
  
  // Load products
  loadFarmerProducts();
} 