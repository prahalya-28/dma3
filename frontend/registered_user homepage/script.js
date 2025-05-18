// Configuration
const API_BASE_URL = "http://localhost:5000";

// Add placeholder image as base64 data URL at the top of the file
const PLACEHOLDER_IMAGE = 'data:image/jpeg;base64,/9j/4AAQSkZJRgABAQEAYABgAAD//gA7Q1JFQVRPUjogZ2QtanBlZyB2MS4wICh1c2luZyBJSkcgSlBFRyB2NjIpLCBxdWFsaXR5ID0gOTAK/9sAQwADAgIDAgIDAwMDBAMDBAUIBQUEBAUKBwcGCAwKDAwLCgsLDQ4SEA0OEQ4LCxAWEBETFBUVFQwPFxgWFBgSFBUU/9sAQwEDBAQFBAUJBQUJFA0LDRQUFBQUFBQUFBQUFBQUFBQUFBQUFBQUFBQUFBQUFBQUFBQUFBQUFBQUFBQUFBQUFBQU/8AAEQgAZABkAwEiAAIRAQMRAf/EAB8AAAEFAQEBAQEBAAAAAAAAAAABAgMEBQYHCAkKC//EALUQAAIBAwMCBAMFBQQEAAABfQECAwAEEQUSITFBBhNRYQcicRQygZGhCCNCscEVUtHwJDNicoIJChYXGBkaJSYnKCkqNDU2Nzg5OkNERUZHSElKU1RVVldYWVpjZGVmZ2hpanN0dXZ3eHl6g4SFhoeIiYqSk5SVlpeYmZqio6Slpqeoqaqys7S1tre4ubrCw8TFxsfIycrS09TV1tfY2drh4uPk5ebn6Onq8fLz9PX29/j5+v/EAB8BAAMBAQEBAQEBAQEAAAAAAAABAgMEBQYHCAkKC//EALURAAIBAgQEAwQHBQQEAAECdwABAgMRBAUhMQYSQVEHYXETIjKBCBRCkaGxwQkjM1LwFWJy0QoWJDThJfEXGBkaJicoKSo1Njc4OTpDREVGR0hJSlNUVVZXWFlaY2RlZmdoaWpzdHV2d3h5eoKDhIWGh4iJipKTlJWWl5iZmqKjpKWmp6ipqrKztLW2t7i5usLDxMXGx8jJytLT1NXW19jZ2uLj5OXm5+jp6vLz9PX29/j5+v/aAAwDAQACEQMRAD8A+t6KKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigA//2Q==';

document.addEventListener("DOMContentLoaded", () => {
  const userString = localStorage.getItem("user");
  const token = localStorage.getItem("token");
  let user = null;

  if (!token) {
    window.location.href = "../login/index.html";
    return;
  }

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

  // Initialize role check
  checkUserRole();
  viewProducts(); // Show products by default

  // Modal close (cross) buttons for all modals
  document.querySelectorAll('.modal .close').forEach(btn => {
    btn.onclick = function() {
      const modal = btn.closest('.modal');
      if (modal) modal.style.display = 'none';
    };
  });
});

function fetchProducts() {
  const spinner = document.getElementById("globalLoadingSpinner");
  const errorMsg = document.getElementById("globalErrorMessage");
  const container = document.getElementById("product-container");

  spinner.style.display = "block";
  errorMsg.style.display = "none";
  container.innerHTML = "";

  fetch(`${API_BASE_URL}/api/products`)
    .then(res => {
      if (!res.ok) throw new Error(`HTTP error! status: ${res.status}`);
      return res.json();
    })
    .then(products => {
      spinner.style.display = "none";
      
      if (!products || products.length === 0) {
        container.innerHTML = "<p>No products available at the moment.</p>";
        return;
      }

      products.forEach(product => {
        const card = document.createElement("div");
        card.className = "card";
        card.dataset.productId = product._id;
        card.dataset.product = JSON.stringify(product);

        card.innerHTML = `
          <img src="${product.image || PLACEHOLDER_IMAGE}" alt="${product.name}"
               onerror="this.src='${PLACEHOLDER_IMAGE}'">
          <p><strong>${product.name}</strong></p>
          <p>Price: ₹${product.price}</p>
          <p>Quantity: ${product.quantity || 0} kg</p>
          <button class="view-details" onclick="viewProduct('${product._id}')">View Details</button>
        `;
        container.appendChild(card);
      });
    })
    .catch(err => {
      spinner.style.display = "none";
      errorMsg.textContent = "Failed to load products. Please try again later.";
      errorMsg.style.display = "block";
      console.error("Error fetching products:", err);
    });
}

function logout() {
  localStorage.removeItem("user");
  localStorage.removeItem("token");
  window.location.href = "../login/index.html";
}

function placeOrder() {
  const token = localStorage.getItem("token");
  if (!token) return alert("Please log in again");

  // Role check: prevent farmers from placing orders
  const user = JSON.parse(localStorage.getItem("user") || "{}");
  if (user.role === "farmer") {
    alert("You are currently in seller mode. Please switch to customer view to place orders.");
    return;
  }

  // Get productId from window.currentProduct
  const productId = window.currentProduct?._id;
  if (!productId) {
    alert("Product information not found. Please try again.");
    return;
  }

  // Get values from the order modal
  const quantity = parseFloat(document.getElementById("orderQuantity").value);
  const deliveryMethod = document.querySelector('input[name="deliveryMethod"]:checked')?.value;
  let deliveryDetails = {};
  if (deliveryMethod === "pickup") {
    deliveryDetails = { pickupTime: document.getElementById("pickupTime").value };
  } else if (deliveryMethod === "home") {
    deliveryDetails = {
      address: document.getElementById("orderAddress").value,
      phone: document.getElementById("deliveryPhone").value
    };
  }

  fetch("http://localhost:5000/api/orders", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${token}`
    },
    body: JSON.stringify({ productId, quantity, deliveryMethod, deliveryDetails })
  })
    .then(res => res.json())
    .then(data => {
      if (data._id) {
        alert("Order placed successfully!");
      } else {
        alert("Something went wrong while ordering");
      }
    })
    .catch(err => {
      console.error("Order error", err);
    });
}

async function goToFarmerRegistration() {
  const token = localStorage.getItem("token");
  if (!token) {
    window.location.href = "../login/index.html";
    return;
  }

  try {
    // Check user's current role and profile
    const response = await fetch("http://localhost:5000/api/users/profile", {
      headers: {
        Authorization: `Bearer ${token}`
      }
    });

    if (response.ok) {
      const userData = await response.json();
      
      // Check both role and farmer profile
      if (userData.role === "farmer" || userData.farmerProfile) {
        alert("You are already registered as a farmer! You can use the 'Switch to Seller View' button to access your farmer dashboard.");
        return;
      }

      // If not a farmer and no farmer profile, proceed to registration
      window.location.href = "../farmer registration/index.html";
    } else {
      const errorData = await response.json();
      console.error("Failed to check user status:", errorData);
      alert("Failed to check user status. Please try again.");
    }
  } catch (error) {
    console.error("Error checking user role:", error);
    alert("An error occurred. Please try again.");
  }
}

function searchProducts() {
  const keyword = document.getElementById("search-bar").value.toLowerCase();
  const cards = document.querySelectorAll(".card");

  cards.forEach(card => {
    const name = card.querySelector("p strong").textContent.toLowerCase();
    card.style.display = name.includes(keyword) ? "block" : "none";
  });
}

// Function to check if user is a farmer and update UI accordingly
async function checkUserRole() {
  const token = localStorage.getItem("token");
  if (!token) {
    window.location.href = "../login/index.html";
    return;
  }

  try {
    console.log("Checking user role...");
    const response = await fetch("http://localhost:5000/api/users/profile", {
      headers: {
        Authorization: `Bearer ${token}`
      }
    });

    if (response.ok) {
      const userData = await response.json();
      console.log("User data received:", userData);
      
      // Get button references
      const becomeSellerBtn = document.getElementById("becomeSellerBtn");
      const toggleRoleBtn = document.getElementById("toggleRoleBtn");

      // Validate button existence
      if (!becomeSellerBtn || !toggleRoleBtn) {
        console.error("Required buttons not found in the DOM");
        return;
      }

      // Update localStorage user data with complete user info
      localStorage.setItem("user", JSON.stringify(userData));

      console.log("Current role:", userData.role);
      console.log("Has farmer profile:", userData.farmerProfile);
      
      // Determine which dashboard we're on
      const isOnFarmerDashboard = window.location.pathname.includes('farmer dashboard');
      // Update UI based on role and farmer profile
      if (userData.role === "farmer" || userData.farmerProfile) {
        console.log("User is a farmer or has farmer profile...");
        becomeSellerBtn.style.display = "none";
        toggleRoleBtn.style.display = "block";
        // Set button text based on current view
        if (isOnFarmerDashboard) {
          toggleRoleBtn.textContent = "Switch to Customer View";
        } else {
          toggleRoleBtn.textContent = "Switch to Seller View";
        }
      } else {
        console.log("User is a customer...");
        becomeSellerBtn.style.display = "block";
        toggleRoleBtn.style.display = "none";
      }
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

  // Get button reference first
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
    const response = await fetch("http://localhost:5000/api/users/toggle-role", {
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

// Get modal elements
const productViewModal = document.getElementById('productViewModal');
const modalClose = document.querySelector('.close');

// Close modal when clicking the X
if (modalClose) {
  modalClose.onclick = function() {
    productViewModal.style.display = "none";
    //window.currentProduct = null;
  }
}

// Close modal when clicking outside
window.onclick = function(event) {
  if (event.target == productViewModal) {
    productViewModal.style.display = "none";
  }
}

// Function to view product details
async function viewProduct(productId) {
  const modal = document.getElementById("productViewModal");
  const spinner = document.getElementById("productLoadingSpinner");
  const errorMsg = document.getElementById("productErrorMessage");
  
  try {
    spinner.style.display = "block";
    errorMsg.style.display = "none";
    
    // First try to find the product in the existing cards
    const productCard = document.querySelector(`[data-product-id="${productId}"]`);
    let product;
    
    if (productCard) {
      // Get product data from the card's dataset
      try {
        product = JSON.parse(productCard.dataset.product);
      } catch (e) {
        console.error("Error parsing product data from card:", e);
      }
    }
    
    if (!product) {
      // If we couldn't get the product from the card, try the API
      const response = await fetch(`${API_BASE_URL}/api/products/${productId}`, {
        headers: {
          Authorization: `Bearer ${getToken()}`
        }
      });
      
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      
      product = await response.json();
    }
    
    // Store product data for order process
    window.currentProduct = product;
    
    // Update modal with product details
    document.getElementById("modalProductImage").src = product.image || PLACEHOLDER_IMAGE;
    document.getElementById("modalProductName").textContent = product.name;
    document.getElementById("modalProductPrice").textContent = `₹${product.price}/kg`;
    document.getElementById("modalProductStock").textContent = `Available Stock: ${product.quantity} kg`;
    document.getElementById("modalProductFarmer").textContent = `Sold by: ${product.farmerName || 'Unknown Farmer'}`;
    document.getElementById("modalProductLocation").textContent = `Location: ${product.location || 'Not specified'}`;
    document.getElementById("modalProductDescription").textContent = product.description || 'No description available';
    
    // Set max quantity to available stock
    document.getElementById("modalQuantity").max = product.quantity;
    document.getElementById("modalQuantity").value = 1;
    
    modal.style.display = "block";
  } catch (error) {
    console.error("Error fetching product details:", error);
    errorMsg.textContent = "Error fetching product details. Please try again.";
    errorMsg.style.display = "block";
  } finally {
    spinner.style.display = "none";
  }
}

function buyNow() {
  const modal = document.getElementById("productViewModal");
  const orderModal = document.getElementById("orderRequestModal");
  const product = window.currentProduct;
  
  if (!product) {
    showError("productErrorMessage", "Product information not found");
    return;
  }
  
  // Initialize order form with product details
  document.getElementById("orderProductImage").src = product.image || PLACEHOLDER_IMAGE;
  document.getElementById("orderProductName").textContent = product.name;
  document.getElementById("orderFarmerName").textContent = product.farmerName;
  document.getElementById("orderProductPrice").textContent = product.price;
  document.getElementById("orderFarmerLocation").textContent = product.location || 'Not specified';
  document.getElementById("orderAvailableStock").textContent = product.quantity;
  
  // Set max quantity and initialize total
  const quantityInput = document.getElementById("orderQuantity");
  quantityInput.max = product.quantity;
  quantityInput.value = 1;
  updateOrderTotal();
  
  // Reset step indicators
  document.querySelectorAll('.step').forEach(step => step.classList.remove('active'));
  document.getElementById('step1').classList.add('active');
  
  // Show first step, hide others
  document.getElementById('step1-content').style.display = 'block';
  document.getElementById('step2-content').style.display = 'none';
  document.getElementById('step3-content').style.display = 'none';
  
  // Close product modal and show order modal
  modal.style.display = "none";
  orderModal.style.display = "block";
}

function updateOrderTotal() {
  const quantity = parseFloat(document.getElementById("orderQuantity").value) || 0;
  const price = parseFloat(window.currentProduct?.price) || 0;
  const total = quantity * price;
  
  document.getElementById("orderTotalPrice").textContent = total.toFixed(2);
  document.getElementById("confirmTotalPrice").textContent = total.toFixed(2);
}

function goToDeliveryStep() {
  // Validate quantity
  const quantity = parseFloat(document.getElementById("orderQuantity").value);
  const availableStock = parseFloat(document.getElementById("orderAvailableStock").textContent);
  
  if (!quantity || quantity <= 0 || quantity > availableStock) {
    showError("orderErrorMessage", "Please enter a valid quantity");
    return;
  }
  
  // Update step indicators
  document.querySelectorAll('.step').forEach(step => step.classList.remove('active'));
  document.getElementById('step2').classList.add('active');
  
  // Show delivery step, hide others
  document.getElementById('step1-content').style.display = 'none';
  document.getElementById('step2-content').style.display = 'block';
  document.getElementById('step3-content').style.display = 'none';
}

function goToReviewStep() {
  // Update step indicators
  document.querySelectorAll('.step').forEach(step => step.classList.remove('active'));
  document.getElementById('step1').classList.add('active');
  
  // Show review step, hide others
  document.getElementById('step1-content').style.display = 'block';
  document.getElementById('step2-content').style.display = 'none';
  document.getElementById('step3-content').style.display = 'none';
}

// Function to toggle delivery details based on selected method
function toggleDeliveryDetails() {
  const deliveryMethod = document.querySelector('input[name="deliveryMethod"]:checked')?.value;
  const deliveryDetails = document.getElementById('deliveryDetails');
  const pickupDetails = document.getElementById('pickupDetails');
  const deliveryAddressDetails = document.getElementById('deliveryAddressDetails');
  
  if (!deliveryMethod) {
    deliveryDetails.style.display = 'none';
    return;
  }

  // Show the parent container
  deliveryDetails.style.display = 'block';

  // Clear error message if any
  document.getElementById('orderErrorMessage').style.display = 'none';
  
  if (deliveryMethod === 'pickup') {
    pickupDetails.style.display = 'block';
    deliveryAddressDetails.style.display = 'none';
    
    // Clear delivery address fields
    document.getElementById('orderAddress').value = '';
    document.getElementById('deliveryPhone').value = '';

    // Set farmer's address if available
    const farmerLocation = document.getElementById('orderFarmerLocation').textContent;
    document.getElementById('farmerAddress').textContent = farmerLocation;
  } else {
    pickupDetails.style.display = 'none';
    deliveryAddressDetails.style.display = 'block';
    
    // Clear pickup time
    document.getElementById('pickupTime').value = '';
  }
}

// Function to validate delivery details before continuing
function validateDeliveryDetails() {
  const deliveryMethod = document.querySelector('input[name="deliveryMethod"]:checked')?.value;
  
  if (!deliveryMethod) {
    showError('orderErrorMessage', 'Please select a delivery method');
    return false;
  }

  if (deliveryMethod === 'pickup') {
    if (!document.getElementById('pickupTime').value) {
      showError('orderErrorMessage', 'Please select a pickup time');
      return false;
    }
  } else {
    const address = document.getElementById('orderAddress').value;
    const phone = document.getElementById('deliveryPhone').value;
    
    if (!address || !phone) {
      showError('orderErrorMessage', 'Please fill in all delivery details');
      return false;
    }
    
    // Basic phone number validation
    if (!/^\d{10}$/.test(phone.replace(/[\s-]/g, ''))) {
      showError('orderErrorMessage', 'Please enter a valid 10-digit phone number');
      return false;
    }
  }
  
  return true;
}

// Update goToConfirmStep to use the validation
function goToConfirmStep() {
  // Clear any previous error messages
  const errorMsg = document.getElementById('orderErrorMessage');
  if (errorMsg && errorMsg.style) errorMsg.style.display = 'none';
  
  // Validate delivery details
  if (!validateDeliveryDetails()) {
    return;
  }
  
  const deliveryMethod = document.querySelector('input[name="deliveryMethod"]:checked').value;
  
  // Update confirmation details
  const product = window.currentProduct;
  const confirmProductName = document.getElementById("confirmProductName");
  if (confirmProductName) confirmProductName.textContent = product.name;
  const confirmQuantity = document.getElementById("confirmQuantity");
  if (confirmQuantity) confirmQuantity.textContent = document.getElementById("orderQuantity").value;
  const confirmPrice = document.getElementById("confirmPrice");
  if (confirmPrice) confirmPrice.textContent = product.price;
  const confirmDeliveryMethod = document.getElementById("confirmDeliveryMethod");
  if (confirmDeliveryMethod) confirmDeliveryMethod.textContent = deliveryMethod === 'pickup' ? 'Self Pickup' : 'Home Delivery';
  
  if (deliveryMethod === 'home') {
    const confirmAddressSection = document.getElementById("confirmAddressSection");
    if (confirmAddressSection && confirmAddressSection.style) confirmAddressSection.style.display = 'block';
    const confirmAddress = document.getElementById("confirmAddress");
    if (confirmAddress) confirmAddress.textContent = document.getElementById("orderAddress").value;
  } else {
    const pickupTime = document.getElementById("pickupTime").value;
    const confirmAddressSection = document.getElementById("confirmAddressSection");
    if (confirmAddressSection && confirmAddressSection.style) confirmAddressSection.style.display = 'block';
    const confirmAddress = document.getElementById("confirmAddress");
    if (confirmAddress) confirmAddress.textContent = `Self pickup at: ${pickupTime}`;
  }
  
  // Update step indicators
  document.querySelectorAll('.step').forEach(step => step.classList.remove('active'));
  const step3 = document.getElementById('step3');
  if (step3) step3.classList.add('active');
  
  // Show confirmation step, hide others
  const step1Content = document.getElementById('step1-content');
  if (step1Content && step1Content.style) step1Content.style.display = 'none';
  const step2Content = document.getElementById('step2-content');
  if (step2Content && step2Content.style) step2Content.style.display = 'none';
  const step3Content = document.getElementById('step3-content');
  if (step3Content && step3Content.style) step3Content.style.display = 'block';
}

async function sendOrderRequest() {
  const spinner = document.getElementById("orderLoadingSpinner");
  const errorMsg = document.getElementById("orderErrorMessage");
  const successMsg = document.getElementById("orderSuccessMessage");
  
  try {
    spinner.style.display = "block";
    errorMsg.style.display = "none";
    successMsg.style.display = "none";
    
    const product = window.currentProduct;
    const deliveryMethod = document.querySelector('input[name="deliveryMethod"]:checked').value;
    
    const orderData = {
      productId: product._id,
      quantity: parseFloat(document.getElementById("orderQuantity").value),
      deliveryMethod: deliveryMethod,
      specialInstructions: document.getElementById("orderInstructions").value,
      deliveryDetails: deliveryMethod === 'pickup' ? {
        pickupTime: document.getElementById("pickupTime").value
      } : {
        address: document.getElementById("orderAddress").value,
        phone: document.getElementById("deliveryPhone").value
      }
    };
    
    const response = await fetch(`${API_BASE_URL}/api/orders`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${getToken()}`
      },
      body: JSON.stringify(orderData)
    });
    
    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }
    
    const order = await response.json();
    
    // Close order modal and show confirmation
    document.getElementById("orderRequestModal").style.display = "none";
    showOrderConfirmation(order);
    // Refresh product list to show updated stock
    fetchProducts();
    
  } catch (error) {
    console.error("Error sending order request:", error);
    showError("orderErrorMessage", "Failed to send order request. Please try again.");
  } finally {
    spinner.style.display = "none";
  }
}

// Function to show order confirmation
function showOrderConfirmation(order) {
  // Hide other modals
  document.getElementById('orderRequestModal').style.display = "none";
  document.getElementById('cartModal').style.display = "none";

  // Show confirmation modal
  const modal = document.getElementById('orderConfirmationModal');
  modal.style.display = "block";

  // Update confirmation details
  document.getElementById('confirmOrderId').textContent = order._id;
  document.getElementById('confirmProductName').textContent = order.product.name;
  document.getElementById('confirmQuantity').textContent = order.quantity;
  document.getElementById('confirmTotalPrice').textContent = order.totalPrice;
  document.getElementById('confirmDeliveryMethod').textContent = 
    order.deliveryMethod === 'pickup' ? 'Self-Pickup' : 'Home Delivery';
  document.getElementById('confirmOrderStatus').textContent = 'Pending Farmer Approval';
  
  document.getElementById('confirmationMessage').textContent = 
    "Your order request has been sent to the farmer. You will be notified once they respond.";
}

// Function to contact farmer
async function contactFarmer() {
  const token = getToken();
  if (!token) {
    window.location.href = "../login/index.html";
    return;
  }

  const productId = productViewModal.dataset.productId;
  const spinner = document.getElementById('productLoadingSpinner');
  const errorMsg = document.getElementById('productErrorMessage');
  
  spinner.style.display = "block";
  errorMsg.style.display = "none";
  
  try {
    const response = await fetch(`${API_BASE_URL}/api/chat/start`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`
      },
      body: JSON.stringify({ 
        productId,
        message: "Hi, I'm interested in your product!" // Initial message
      })
    });

    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(errorData.message || `HTTP error! status: ${response.status}`);
    }

    const data = await response.json();
    spinner.style.display = "none";

    // Redirect to chat page with the chat ID
    window.location.href = `../chat/index.html?chatId=${data.chatId}`;
  } catch (err) {
    spinner.style.display = "none";
    errorMsg.textContent = "Failed to start chat. Please try again.";
    errorMsg.style.display = "block";
    console.error("Error starting chat:", err);
  }
}

// Function to chat with farmer from confirmation
function chatWithFarmer() {
  const spinner = document.getElementById('orderLoadingSpinner');
  const errorMsg = document.getElementById('orderErrorMessage');
  
  spinner.style.display = "block";
  errorMsg.style.display = "none";
  
  // Reuse the contact farmer function but handle any errors
  contactFarmer().catch(err => {
    spinner.style.display = "none";
    errorMsg.textContent = "Failed to start chat. Please try again.";
    errorMsg.style.display = "block";
    console.error("Error in chatWithFarmer:", err);
  });
}

// Function to proceed to payment
function proceedToPayment() {
  // Implement payment gateway integration
  alert("Payment gateway integration coming soon!");
}

// Function to close confirmation modal
function closeConfirmationModal() {
  document.getElementById('orderConfirmationModal').style.display = "none";
}

// Token management
function getToken() {
  const token = localStorage.getItem("token");
  if (!token) return null;
  
  try {
    // Basic JWT expiration check
    const payload = JSON.parse(atob(token.split('.')[1]));
    if (payload.exp && payload.exp < Date.now() / 1000) {
      localStorage.removeItem("token");
      return null;
    }
    return token;
  } catch (e) {
    console.error("Invalid token format:", e);
    localStorage.removeItem("token");
    return null;
  }
}

// Error handling utility
function handleApiError(error, userMessage = "An error occurred") {
  console.error(error);
  if (error.response?.status === 401) {
    localStorage.removeItem("token");
    window.location.href = "../login/index.html";
    return;
  }
  alert(userMessage);
}

// Function to view orders
function viewOrders() {
  const productsSection = document.getElementById('productsSection');
  const ordersSection = document.getElementById('ordersSection');
  
  // Toggle visibility
  productsSection.style.display = 'none';
  ordersSection.style.display = 'block';
  
  // Load orders
  loadUserOrders();
}

// Function to view products
function viewProducts() {
  const productsSection = document.getElementById('productsSection');
  const ordersSection = document.getElementById('ordersSection');
  
  // Toggle visibility
  productsSection.style.display = 'block';
  ordersSection.style.display = 'none';
  
  // Load products
  fetchProducts();
}

// Function to load user's orders
async function loadUserOrders() {
  const token = localStorage.getItem("token");
  if (!token) return;

  try {
    const response = await fetch("http://localhost:5000/api/orders/myorders", {
      headers: {
        Authorization: `Bearer ${token}`
      }
    });

    if (response.ok) {
      const orders = await response.json();
      displayUserOrders(orders);
    } else {
      console.error("Failed to load orders:", await response.text());
    }
  } catch (error) {
    console.error("Error loading orders:", error);
  }
}

// Payment handling
let currentPaymentOrder = null;

async function showPaymentModal(orderId) {
    try {
        const response = await fetch(`${API_BASE_URL}/api/orders/${orderId}`, {
            headers: {
                'Authorization': `Bearer ${localStorage.getItem('token')}`
            }
        });
        
        if (!response.ok) {
            throw new Error('Failed to fetch order details');
        }
        
        const order = await response.json();
        
        // Update modal content
        document.getElementById('paymentOrderId').textContent = order._id;
        document.getElementById('paymentAmount').textContent = `₹${order.totalPrice}`;
        
        // Show modal
        document.getElementById('paymentModal').style.display = 'block';
        
        // Store order ID for payment
        document.getElementById('paymentModal').dataset.orderId = order._id;
    } catch (error) {
        console.error('Error:', error);
        showError('Failed to load payment details. Please try again.');
    }
}

function closePaymentModal() {
    document.getElementById('paymentModal').style.display = 'none';
}

async function initiatePayment() {
    try {
        const orderId = document.getElementById('paymentModal').dataset.orderId;
        
        // Create payment order
        const response = await fetch(`${API_BASE_URL}/api/payments/create-order`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${localStorage.getItem('token')}`
            },
            body: JSON.stringify({ orderId })
        });

        if (!response.ok) {
            throw new Error('Failed to create payment order');
        }

        const data = await response.json();

        // Initialize Razorpay
        const options = {
            key: data.key_id,
            amount: data.amount,
            currency: data.currency,
            name: "Farm Fresh",
            description: "Payment for your order",
            order_id: data.order_id,
            handler: async function (response) {
                try {
                    // Verify payment
                    const verifyResponse = await fetch(`${API_BASE_URL}/api/payments/verify`, {
                        method: 'POST',
                        headers: {
                            'Content-Type': 'application/json',
                            'Authorization': `Bearer ${localStorage.getItem('token')}`
                        },
                        body: JSON.stringify({
                            orderId, // internal order id
                            razorpayOrderId: response.razorpay_order_id, // Razorpay order id
                            paymentId: response.razorpay_payment_id,
                            signature: response.razorpay_signature
                        })
                    });

                    if (!verifyResponse.ok) {
                        throw new Error('Payment verification failed');
                    }

                    // No need to update order status to 'paid' here
                    // Just close modal, show success, and refresh orders
                    closePaymentModal();
                    showSuccess('Payment successful! Your order has been confirmed.');
                    fetchUserOrders();
                } catch (error) {
                    console.error('Error:', error);
                    showError('Payment verification failed. Please contact support.');
                }
            },
            prefill: {
                name: "Customer Name",
                email: "customer@example.com"
            },
            theme: {
                color: "#4CAF50"
            }
        };

        const rzp = new Razorpay(options);
        rzp.open();
    } catch (error) {
        console.error('Error:', error);
        showError('Failed to initiate payment. Please try again.');
    }
}

// Update displayUserOrders to show payment button for accepted orders
/*function displayUserOrders(orders) {
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
    
    let paymentButton = '';
    if (order.status === 'accepted') {
      paymentButton = `
        <button class="primary-btn" onclick="showPaymentModal('${order._id}')">
          Pay Now
        </button>
      `;
    }
    // Add Chat with Farmer button
    let chatButton = '';
    if (order.farmer && order.farmer._id) {
      chatButton = `
        <button class="secondary-btn" onclick="startChatWithFarmer('${order.farmer._id}', '${order._id}')">
          Chat with Farmer
        </button>
      `;
    }
    
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
        <div class="farmer-info">
          <p><strong>Farmer:</strong> ${order.farmer && order.farmer.name ? order.farmer.name : 'Unknown Farmer'}</p>
          <p><strong>Location:</strong> ${order.farmer && order.farmer.location ? order.farmer.location : 'Not specified'}</p>
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
        ${paymentButton}
        ${chatButton}
      </div>
    `;
    container.appendChild(card);
  });
}*/

function displayUserOrders(orders) {
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

    let paymentButton = '';
    if (order.status === 'accepted') {
      paymentButton = `
        <button class="primary-btn" onclick="showPaymentModal('${order._id}')">
          Pay Now
        </button>
      `;
    }
    let chatButton = '';
    if (order.farmer && order.farmer._id) {
      chatButton = `
        <button class="secondary-btn" onclick="startChatWithFarmer('${order.farmer._id}', '${order._id}')">
          Chat with Farmer
        </button>
      `;
    }

    // Handle case where order.product is null (e.g., product was deleted)
    const productImage = order.product && order.product.image ? order.product.image : PLACEHOLDER_IMAGE;
    const productName = order.product && order.product.name ? order.product.name : 'Product Deleted';

    card.innerHTML = `
      <div class="order-header">
        <h3>Order #${order._id.slice(-6)}</h3>
        <span class="status-badge ${order.status}">${order.status}</span>
      </div>
      <div class="order-details">
        <div class="product-info">
          <img src="${productImage}" alt="${productName}">
          <div>
            <h4>${productName}</h4>
            <p>Quantity: ${order.quantity}</p>
            <p>Total: ₹${order.totalPrice}</p>
          </div>
        </div>
        <div class="farmer-info">
          <p><strong>Farmer:</strong> ${order.farmer && order.farmer.name ? order.farmer.name : 'Unknown Farmer'}</p>
          <p><strong>Location:</strong> ${order.farmer && order.farmer.location ? order.farmer.location : 'Not specified'}</p>
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
        ${paymentButton}
        ${chatButton}
      </div>
    `;
    container.appendChild(card);
  });
}

// Add the chat function
window.startChatWithFarmer = async function(farmerId, orderId) {
  if (!farmerId || !orderId) {
    alert("Could not start chat: missing farmer or order information.");
    return;
  }
  const token = localStorage.getItem("token");
  if (!token) {
    alert("Please log in to start a chat.");
    return;
  }
  try {
    const response = await fetch(`${API_BASE_URL}/api/chat/start`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`
      },
      body: JSON.stringify({ farmerId, orderId })
    });
    if (!response.ok) {
      const data = await response.json();
      throw new Error(data.message || "Failed to start chat");
    }
    const data = await response.json();
    // Redirect to chat page (update path as needed)
    window.location.href = `../chat/index.html?chatId=${data.chatId}`;
  } catch (err) {
    alert("Could not start chat with farmer. Please try again later.\n" + (err.message || ""));
  }
};
