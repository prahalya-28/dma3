// Configuration
const API_BASE_URL = "https://dma-qhwn.onrender.com";

// Define the order of statuses for comparison
const statusOrder = ['pending', 'accepted', 'rejected', 'completed', 'cancelled'];

// Add placeholder image as base64 data URL
const PLACEHOLDER_IMAGE = 'data:image/jpeg;base64,/9j/4AAQSkZJRgABAQEAYABgAAD//gA7Q1JFQVRPUjogZ2QtanBlZyB2MS4wICh1c2luZyBJSkcgSlBFRyA2VikpLCBxdWFsaXR5ID0gOTAK/9sAQwADAgIDAgIDAwMDBAMDBAUIBQUEBAUKBwcGCAwKDAwLCgsLDQ4SEA0OEQ4LCxAWEBETFBUVFQwPFxgWFBgSFBUU/9sAQwEDBAQFBAUJBQUJFA0LDRQUFBQUFBQUFBQUFBQUFBQUFBQUFBQUFBQUFBQUFBQUFBQUFBQUFBQUFBQUFBQU/8AAEQgAZABkAwEiAAIRAQMRAf/EAB8AAAEFAQEBAQEBAAAAAAAAAAABAgMEBQYHCAkKC//EALUQAAIBAwMCBAMFBQQEAAABfQECAwAEEQUSITFBBhNRYQcicRQygZGhCCNCscEVUtHwJDNicoIJChYXGBkaJSYnKCkqNDU2Nzg5OkNERUZHSElKU1RVVldYWVpjZGVmZ2hpanN0dXZ3eHl6g4SFhoeIiYqSk5SVlpeYmZqio6Slpqeoqaqys7S1tre4ubrCw8TFxsfIycrS09TV1ldYWVpjZGVmZ2hpanNzdXZ3eHl6goSFhoeIiYqSk5SVl5iZmqKjpKWmp6ipqrKztLW2tre4ubrCw8TFxsfIycrS09TV1tfY2drh4uPk5ebn6Onq8fLz9PX29/j5+v/EAB8BAAMBAQEBAQEBAQEAAAAAAAABAgMEBQYHCAkKC//EALURAAIBAgQEAwQHBQQEAAECdwABAgMRBAUhMQYSQVEHYXETIjKBCBRCkaGxwQkjM1LwFWJy0QoWJDThJfEXGBkaJicoKSo2Nzg5OkNERUZHSElKU1RVVldYWVpjZGVmZ2hpanNzdXZ3eHl6goSFhoeIiYqSk5SVl5iZmqKjpKWmp6ipqrKztLW2tre4ubrCw8TFxsfIycrS09TV1tfY2drh4uPk5ebn6Onq8fLz9PX29/j5+v/aAAwDAQACEAMBAD8A+r6KKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigD//2Q==';

document.addEventListener('DOMContentLoaded', async () => {
  // Check session and user role on page load
  const isAuthenticated = await checkSessionAndRole();
  if (!isAuthenticated) {
      // checkSessionAndRole will handle the redirect to login
      return;
  }
  
  // If authenticated as farmer, proceed to set up the page
  // Initially show products section
  showProductsSection();
  loadFarmerOrders(); // Load orders data (but don't show the section by default)
  loadFarmerProducts(); // Load farmer's products and display them
});

// Function to check session validity and user role
async function checkSessionAndRole() {
  const token = localStorage.getItem("token");
  const userString = localStorage.getItem('user');
  let user = null;

  if (!token || !userString) {
    console.log('checkSessionAndRole: No token or user data found, redirecting to login.');
    localStorage.removeItem("token");
    localStorage.removeItem("user");
    window.location.href = "../login/index.html";
    return false;
  }

  try {
    user = JSON.parse(userString);
    console.log('checkSessionAndRole: User data from localStorage parsed successfully:', user);
  } catch (e) {
    console.error('checkSessionAndRole: Invalid JSON in localStorage for \'user\'', e);
    localStorage.removeItem("token");
    localStorage.removeItem("user");
    window.location.href = "../login/index.html";
    return false;
  }

  // Validate token with backend
  console.log('checkSessionAndRole: Validating token with backend...');
  try {
    const response = await fetch(`${API_BASE_URL}/api/users/validate-token`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`
      }
    });

    console.log('checkSessionAndRole: Validate token API response status:', response.status);

    if (!response.ok) {
      console.log('checkSessionAndRole: Token validation failed (response not ok), redirecting to login.');
      localStorage.removeItem("token");
      localStorage.removeItem("user");
      window.location.href = "../login/index.html";
      return false;
    }

    const data = await response.json();
    console.log('checkSessionAndRole: Validate token API success data:', data);

    if (!data.valid) {
      console.log('checkSessionAndRole: Backend reported token as invalid, redirecting to login.');
      localStorage.removeItem("token");
      localStorage.removeItem("user");
      window.location.href = "../login/index.html";
      return false;
    }
    
    console.log('checkSessionAndRole: Token validated successfully.');

    // Check if user has farmer role or farmer profile
    console.log('checkSessionAndRole: Fetching user profile for role check...');
    const profileResponse = await fetch(`${API_BASE_URL}/api/users/profile`, {
      headers: {
        Authorization: `Bearer ${token}`
      }
    });

    console.log("checkSessionAndRole: User profile API response status:", profileResponse.status);

    if (!profileResponse.ok) {
       console.error("checkSessionAndRole: Failed to fetch user profile for role check:", profileResponse.status);
       // Depending on policy, could redirect here. For now, log and proceed with localStorage data.
       // If strict role enforcement is needed, uncomment the redirect below:
       // console.log('checkSessionAndRole: Profile fetch failed, redirecting to login (strict mode).');
       // localStorage.removeItem("token");
       // localStorage.removeItem("user");
       // window.location.href = "../login/index.html";
       // return false;
    }

    const profileData = profileResponse.ok ? await profileResponse.json() : null;
    console.log("checkSessionAndRole: User profile data (from API or null):", profileData);

    // Use the role and farmerProfile from the fetched profile data if available, otherwise fallback to local storage
    const currentRole = profileData?.role || user.role;
    const hasFarmerProfile = profileData?.farmerProfile || user.farmerProfile;

    console.log("checkSessionAndRole: Determined current role:", currentRole);
    console.log("checkSessionAndRole: Determined hasFarmerProfile:", hasFarmerProfile);

    if (currentRole !== 'farmer' && !hasFarmerProfile) {
        console.log('checkSessionAndRole: User is not a farmer and has no farmer profile, redirecting to customer view.');
        localStorage.removeItem("token");
        localStorage.removeItem("user");
        window.location.href = "../registered_user homepage/index.html";
        return false;
    }
    
    console.log('checkSessionAndRole: User is authenticated and is a farmer. Proceeding to load dashboard.');

    // Display user info (using profileData if successful, else user from local storage)
    const userToDisplay = profileData || user;
    if (userToDisplay) {
        const name = userToDisplay.name || userToDisplay.username || "User";
        const email = userToDisplay.email || "";
        const username = userToDisplay.username || "";
        document.getElementById("greeting").innerText = `Welcome back, ${name}!`;
        const userNameElement = document.getElementById("farmerName");
        const userEmailElement = document.getElementById("farmerEmail");

        if (userNameElement) {
             userNameElement.innerHTML = `<strong>Username:</strong> ${username}`;
        }
        if (userEmailElement) {
             userEmailElement.innerHTML = `<strong>Email:</strong> ${email}`;
        }

         // Always update local storage with the latest profile data if successfully fetched
        if (profileData) {
             localStorage.setItem("user", JSON.stringify(profileData));
        }
    }

    // Session is valid and user is a farmer
    console.log('checkSessionAndRole: Check completed successfully.');
    return true;

  } catch (error) {
    console.error('checkSessionAndRole failed:', error);
    localStorage.removeItem("token");
    localStorage.removeItem("user");
    window.location.href = "../login/index.html";
    return false;
  }
}

// Auto-refresh orders every 30 seconds - Start this only after successful auth
// setInterval(loadFarmerOrders, 30000);

// Function to load farmer's orders
async function loadFarmerOrders() {
  const token = localStorage.getItem("token");
  if (!token) {
    return;
  }

  const container = document.getElementById("orders-container");
  if (!container) {
    console.error("Orders container not found in DOM");
    return;
  }

  container.innerHTML = "<p>Loading orders...</p>";

  try {
    const response = await fetch("https://dma-qhwn.onrender.com/api/orders/farmer-orders", {
      headers: {
        Authorization: `Bearer ${token}`
      }
    });

    if (!response.ok) {
      if (response.status === 401) {
        alert("Session expired. Please log in again.");
        localStorage.removeItem("token");
        window.location.href = "../login/index.html";
        return;
      }
      throw new Error(`Failed to fetch orders: ${response.status}`);
    }

    const orders = await response.json();
    console.log("Orders retrieved:", orders);
    if (!Array.isArray(orders)) {
      throw new Error("Invalid orders data received from server");
    }

    displayOrders(orders);
  } catch (error) {
    console.error("Error loading farmer orders:", error);
    container.innerHTML = `<p>Error: ${error.message}. Please try again or contact support.</p>`;
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
    console.log("Attempting to switch role...");
    // In the farmer dashboard, the toggle button should always switch to buyer (customer view)
    const newRole = "buyer"; 

    const response = await fetch(`${API_BASE_URL}/api/users/toggle-role`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`
      },
      body: JSON.stringify({ role: newRole })
    });

    console.log("Toggle role API response status:", response.status);

    if (!response.ok) {
       try {
           const errorData = await response.json();
           console.error("Toggle role API error data:", errorData);
           throw new Error(errorData.message || "Failed to switch role");
       } catch (jsonError) {
           console.error("Failed to parse toggle role error response:", jsonError);
           throw new Error(`Failed to switch role: HTTP status ${response.status}`);
       }
    }

    const data = await response.json();
    console.log("Toggle role API success data:", data);

    // Update localStorage with new role and potential new token
    const user = JSON.parse(localStorage.getItem("user") || "{}");
    user.role = data.role; // Should be 'buyer'
     if (data.token) {
        localStorage.setItem("token", data.token);
    }
    localStorage.setItem("user", JSON.stringify(user));

    // Redirect to the customer homepage
    window.location.href = "../registered_user homepage/index.html";

  } catch (error) {
    console.error("Error toggling role:", error);
    alert("An error occurred while switching roles. Please try again.");
    
    // Reset button state
    toggleRoleBtn.disabled = false;
    toggleRoleBtn.textContent = originalButtonText;
  }
}

// Function to display products - This seems related to farmer's own products, not general listing
function displayProducts(products) {
  const container = document.getElementById("product-container");
  container.innerHTML = "";

  if (!products || products.length === 0) {
    container.innerHTML = "<p>No products found. Click 'Add New Product' to add your first product.</p>";
    return;
  }

  //edit button modified
  products.forEach(product => {
    const card = document.createElement("div");
    card.className = "product-card";
    card.innerHTML = `
      <img src="${product.image || product.imageUrl}" alt="${product.name}">
      <h3>${product.name}</h3>
      <p>${product.description}</p>
      <p>Price: ₹${product.price}</p>
      <p>Stock: ${product.quantity !== undefined ? product.quantity : 0}</p>
      <button onclick="editProduct('${product._id}')">Edit</button>
      <button onclick="deleteProduct('${product._id}')">Delete</button>
    `;
    //card.querySelector('.edit-btn').onclick = () => openEditModal(product);
    container.appendChild(card);
  });
}

// Function to edit product ADDED AT NIGHT
async function editProduct(productId) {
  // Implement edit product functionality
  const token = localStorage.getItem("token");
  if (!token) {
      window.location.href = "../login/index.html";
      return;
  }

  // Fetch product data
  try {
      const response = await fetch(`${API_BASE_URL}/api/products/${productId}`, {
          headers: {
              "Authorization": `Bearer ${token}`
          }
      });

      if (!response.ok) {
          throw new Error(`Failed to fetch product: ${response.status}`);
      }

      const product = await response.json();

      // Populate modal or form for editing
      openEditModal(product);

  } catch (error) {
      console.error("Error fetching product for edit:", error);
      alert("Failed to load product for editing.");
  }
}

async function deleteProduct(productId) {
  const token = localStorage.getItem("token");
  if (!token) {
      window.location.href = "../login/index.html";
      return;
  }

  if (!confirm("Are you sure you want to delete this product?")) {
      return;
  }

  try {
      const response = await fetch(`${API_BASE_URL}/api/products/${productId}`, {
          method: "DELETE",
          headers: {
              "Authorization": `Bearer ${token}`
          }
      });

      if (!response.ok) {
          throw new Error(`Failed to delete product: ${response.status}`);
      }

      alert("Product deleted successfully!");
      loadFarmerProducts(); // Refresh product list

  } catch (error) {
      console.error("Error deleting product:", error);
      alert("Failed to delete product.");
  }
}

function logout() {
  localStorage.removeItem("user");
  localStorage.removeItem("token");
  window.location.href = "../login/index.html";
}

// Function to open edit product modal ADDED AT NIGHT
function openEditModal(product) {
    const modal = document.getElementById('editProductModal');
    if (!modal) {
        console.error("Edit product modal not found");
        return;
    }

    // Populate form fields with existing product data
    document.getElementById('editProductId').value = product._id;
    document.getElementById('editProductName').value = product.name;
    document.getElementById('editProductPrice').value = product.price;
    document.getElementById('editProductCategory').value = product.category;
    document.getElementById('editProductDescription').value = product.description;
    document.getElementById('editProductQuantity').value = product.quantity;
    // Image handling might be more complex, you might show a preview
    // and allow uploading a new image, or just keep the old one if not updated.

    modal.style.display = 'block';

    // Handle modal close
    const span = modal.querySelector('.close');
     if (span) {
        span.onclick = function() {
            modal.style.display = "none";
        }
    }

    // Handle form submission
    const editForm = document.getElementById('editProductForm');
    if (editForm) {
        editForm.onsubmit = async function(e) {
            e.preventDefault();

            const productId = document.getElementById('editProductId').value;
            const updatedProductData = {
                name: document.getElementById('editProductName').value,
                price: parseFloat(document.getElementById('editProductPrice').value),
                category: document.getElementById('editProductCategory').value,
                description: document.getElementById('editProductDescription').value,
                quantity: parseInt(document.getElementById('editProductQuantity').value),
                // Handle image update if implemented
            };

             const token = localStorage.getItem("token");
             if (!token) { 
                 alert("Please log in again.");
                 window.location.href = "../login/index.html";
                 return;
             }

            try {
                const response = await fetch(`${API_BASE_URL}/api/products/${productId}`, {
                    method: 'PUT',
                    headers: {
                        'Content-Type': 'application/json',
                         "Authorization": `Bearer ${token}`
                    },
                    body: JSON.stringify(updatedProductData)
                });

                if (!response.ok) {
                     const error = await response.json();
                     throw new Error(error.message || `Failed to update product: ${response.status}`);
                }

                alert('Product updated successfully!');
                modal.style.display = 'none';
                loadFarmerProducts(); // Refresh list

            } catch (error) {
                console.error('Error updating product:', error);
                alert('Failed to update product.');
            }
        }
    }
}

// Function to display farmer's orders
function displayOrders(orders) {
    const container = document.getElementById('orders-container');
    container.innerHTML = ''; // Clear previous orders

    if (!orders || orders.length === 0) {
        container.innerHTML = '<p>No orders received yet.</p>';
        return;
    }

    // Define the valid statuses that farmers can set via this interface
    const farmerEditableStatuses = ['shipped', 'out_for_delivery', 'delivered', 'delayed'];
    // Include statuses that are automatic but should be shown as the current state
    const allDisplayStatuses = ['pending', 'accepted', 'processing', 'shipped', 'out_for_delivery', 'delivered', 'delayed', 'rejected'];

    orders.forEach(order => {
        // Add a check to ensure the order object is valid and has a product
        if (!order || !order._id) {
            console.warn('Skipping invalid order object:', order);
            return; // Skip to the next iteration if order is invalid
        }

        const productName = order.product ? order.product.name : 'Unknown Product';
        const productImage = order.product ? order.product.image || order.product.imageUrl || PLACEHOLDER_IMAGE : PLACEHOLDER_IMAGE;
        const productAltText = order.product ? order.product.name : 'Unknown Product Image';
        const customerName = order.user ? order.user.name : 'Unknown Customer';
        const customerEmail = order.user ? order.user.email : 'N/A';

        const orderElement = document.createElement('div');
        orderElement.classList.add('order-card');
        orderElement.dataset.orderId = order._id; // Add order ID as data attribute

        // Generate status dropdown or display status text
        let statusContent;
        const isFarmerEditableStatus = farmerEditableStatuses.includes(order.status);
        const isFinalState = ['delivered', 'rejected', 'cancelled'].includes(order.status);

        if (order.status === 'pending') {
            // For pending orders, show accept/reject buttons
            statusContent = `
                <div class="order-actions">
                    <button onclick="updateOrderStatus('${order._id}', 'accepted')" class="accept-btn">Accept</button>
                    <button onclick="updateOrderStatus('${order._id}', 'rejected')" class="reject-btn">Reject</button>
                </div>
            `;
        } else if (isFarmerEditableStatus && !isFinalState) {
            // For other editable statuses, show dropdown
            let statusDropdown = '<select onchange="updateOrderStatus(\'' + order._id + '\', this.value)">';
            allDisplayStatuses.forEach(status => {
                let disabled = false;
                // Disable statuses that come before the current status
                if (statusOrder.indexOf(status) < statusOrder.indexOf(order.status)) {
                    disabled = true;
                }
                // Ensure the current status is always selectable (unless it's a final state)
                if (status === order.status && !isFinalState) {
                    disabled = false;
                }
                // Ensure only farmer editable statuses are actually selectable by farmer if not in final state
                if (!farmerEditableStatuses.includes(status) && status !== order.status && !isFinalState) {
                    disabled = true;
                }
                statusDropdown += `<option value="${status}" ${order.status === status ? 'selected' : ''} ${disabled ? 'disabled' : ''}>${status.replace(/_/g, ' ').charAt(0).toUpperCase() + status.replace(/_/g, ' ').slice(1)}</option>`;
            });
            statusDropdown += '</select>';
            statusContent = statusDropdown;
        } else {
            // For non-editable statuses, just display the status
            statusContent = `<span class="status-badge ${order.status}">${order.status.replace(/_/g, ' ').charAt(0).toUpperCase() + order.status.replace(/_/g, ' ').slice(1)}</span>`;
        }

        orderElement.innerHTML = `
            <div class="order-header">
                <h3>Order #${order._id.slice(-6)}</h3>
                ${statusContent}
            </div>
            <div class="order-details">
                <div class="product-info">
                    <img src="${productImage}" alt="${productAltText}">
                    <div>
                        <h4>${productName}</h4>
                        <p>Quantity: ${order.quantity} kg</p>
                        <p>Total: ₹${order.totalPrice}</p>
                    </div>
                </div>
                <div class="customer-info">
                    <p><strong>Customer:</strong> ${customerName}</p>
                    <p><strong>Email:</strong> ${customerEmail}</p>
                    <p><strong>Delivery Method:</strong> ${order.deliveryMethod === 'pickup' ? 'Self Pickup' : 'Home Delivery'}</p>
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
        `;
        container.appendChild(orderElement);
    });
}

// Function to show orders - wrapper for loadFarmerOrders
function showOrders() {
  // Get references to the sections
  const productsSection = document.getElementById('productsSection');
  const ordersSection = document.getElementById('ordersSection');

  if (!productsSection || !ordersSection) {
    console.error('Products or Orders section not found in DOM');
    return;
  }

  // Hide products section and show orders section
  productsSection.style.display = 'none';
  ordersSection.style.display = 'block'; // Or 'flex', depending on your CSS

  // Load the orders data
  loadFarmerOrders();
}

// Function to load farmer's products
async function loadFarmerProducts() {
  const token = localStorage.getItem("token");
  if (!token) {
    return;
  }

  const container = document.getElementById("product-container");
  if (!container) {
    console.error("Product container not found in DOM");
    return;
  }

  container.innerHTML = "<p>Loading products...</p>";

  try {
    const response = await fetch(`${API_BASE_URL}/api/products/my-products`, {
      headers: {
        Authorization: `Bearer ${token}`
      }
    });

    if (!response.ok) {
      if (response.status === 401) {
        alert("Session expired. Please log in again.");
        localStorage.removeItem("token");
        window.location.href = "../login/index.html";
        return;
      }
      throw new Error(`Failed to fetch products: ${response.status}`);
    }

    const products = await response.json();
    console.log("Products retrieved:", products);
    if (!Array.isArray(products)) {
      throw new Error("Invalid products data received from server");
    }

    displayProducts(products);
  } catch (error) {
    console.error("Error loading farmer products:", error);
    container.innerHTML = `<p>Error: ${error.message}. Please try again or contact support.</p>`;
  }
}

// Function to explicitly show the products section
function showProductsSection() {
  const productsSection = document.getElementById('productsSection');
  const ordersSection = document.getElementById('ordersSection');
  if (productsSection) productsSection.style.display = 'block'; // Or 'flex'
  if (ordersSection) ordersSection.style.display = 'none';
}

// Make functions needed for HTML onclick/event listeners global
window.toggleRole = toggleRole;
window.logout = logout;
window.showOrders = showOrders;
window.editProduct = editProduct;
window.deleteProduct = deleteProduct;
window.updateOrderStatus = updateOrderStatus;
window.contactCustomer = contactCustomer;
window.openEditModal = openEditModal;

// Function to update order status
async function updateOrderStatus(orderId, status) {
    const token = localStorage.getItem('token');
    if (!token) {
        alert('Session expired. Please log in again.');
        window.location.href = '../login/index.html';
        return;
    }

    try {
        const response = await fetch(`${API_BASE_URL}/api/orders/${orderId}/status`, {
            method: 'PUT',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${token}`
            },
            body: JSON.stringify({ status })
        });

        if (!response.ok) {
            const error = await response.json();
            throw new Error(error.message || `Failed to update order status: ${response.status}`);
        }

        const updatedOrder = await response.json();
        alert(`Order ${orderId.slice(-6)} status updated to ${updatedOrder.status}`);

        // Refresh the orders list after updating status
        loadFarmerOrders();

    } catch (error) {
        console.error('Error updating order status:', error);
        alert(`Failed to update order status: ${error.message}`);
    }
}

// Function to chat with a customer for a specific order
async function contactCustomer(orderId, customerId) {
    const token = localStorage.getItem('token');
    if (!token) {
        alert('Session expired. Please log in again.');
        window.location.href = '../login/index.html';
        return;
    }

    try {
        // Assuming the backend /api/chat/start endpoint can take orderId and customerId
        const response = await fetch(`${API_BASE_URL}/api/chat/start`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${token}`
            },
            body: JSON.stringify({ orderId: orderId, customerId: customerId })
        });

        const data = await response.json();

        if (!response.ok) {
             throw new Error(data.message || 'Failed to start chat');
        }

        // Redirect to chat page with the new or existing chat ID
        window.location.href = `../chat/index.html?chatId=${data.chatId}`;

    } catch (error) {
        console.error('Error starting chat:', error);
        alert(`Failed to start chat: ${error.message}`);
    }
}