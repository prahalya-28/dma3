document.addEventListener("DOMContentLoaded", () => {
    const productForm = document.getElementById("productForm");
    const productList = document.getElementById("productList");
    const successMessage = document.getElementById("successMessage");
    const imageUploadMessage = document.getElementById("imageUploadMessage");
    const imageInvalidMessage = document.getElementById("imageInvalidMessage");
    const priceInput = document.getElementById("productPrice");
    const productImageInput = document.getElementById("productImage");
    const quantityInput = document.getElementById("productQuantity");

    // Fetch and display products
    async function fetchProducts() {
      try {
        const response = await fetch("http://localhost:5000/api/products");
        const products = await response.json();

        productList.innerHTML = ""; // Clear existing

        // Filter out products with zero or negative quantity
        const availableProducts = products.filter(product => {
          const quantity = parseInt(product.quantity);
          return quantity && quantity > 0; // Ensures quantity is a positive number
        });

        if (availableProducts.length === 0) {
          productList.innerHTML = '<p class="no-products">No products available at the moment.</p>';
          return;
        }

        availableProducts.forEach(product => {
          const card = document.createElement("div");
          card.classList.add("product-card");

          // Format farmer details
          const farmerName = product.farmer?.name || 'Unknown Farmer';
          const farmerLocation = product.farmer?.location || 'Location not specified';

          card.innerHTML = 
            `<h3 class="product-name">${product.name}</h3>
            <p class="product-price">₹${product.price}</p>
            <p class="product-category">${product.category || 'Uncategorized'}</p>
            <p class="product-description">${product.description || 'No description available'}</p>
            <p class="product-quantity">In Stock: ${product.quantity} units</p>
            <p class="farmer-info">Sold by: ${farmerName}</p>
            <p class="farmer-location">Location: ${farmerLocation}</p>
            <img src="${product.image}" style="width: 100px;" alt="${product.name}" />
            <button class="view-details-btn">View Details</button>`;

          // Add click handler for the view details button
          card.querySelector('.view-details-btn').addEventListener('click', () => {
            // Store product details in localStorage for the view page
            localStorage.setItem('viewProduct', JSON.stringify({
              ...product,
              farmer: {
                name: farmerName,
                location: farmerLocation
              }
            }));
            // Navigate to view product page
            window.location.href = '../view aproduct cust_side/index.html';
          });

          productList.appendChild(card);
        });
      } catch (err) {
        console.error("Failed to fetch products", err);
        productList.innerHTML = '<p class="error">Failed to load products. Please try again later.</p>';
      }
    }

    fetchProducts(); // Initial fetch

    // Convert image to base64
    const toBase64 = file =>
      new Promise((resolve, reject) => {
        const reader = new FileReader();
        reader.onload = () => resolve(reader.result);
        reader.onerror = err => reject(err);
        reader.readAsDataURL(file);
      });

    // Handle product form submission
    productForm.addEventListener("submit", async (e) => {
      e.preventDefault();

      const name = document.getElementById("productName").value.trim();
      const price = parseFloat(priceInput.value.trim());
      const category = document.getElementById("productCategory").value.trim();
      const description = document.getElementById("productDescription").value.trim();
      const imageFile = productImageInput.files[0];
      const quantity = quantityInput.value.trim();

      if (!name || !price || !imageFile || !quantity) {
        successMessage.textContent = "Please fill required fields!";
        successMessage.style.color = "red";
        successMessage.style.display = "block";
        return;
      }

      const allowedExtensions = /(\.jpg|\.jpeg|\.png)$/i;
      if (!allowedExtensions.exec(imageFile.name)) {
        imageInvalidMessage.textContent = "Upload JPG or PNG only!";
        imageInvalidMessage.style.color = "red";
        productImageInput.value = "";
        return;
      }

      const base64Image = await toBase64(imageFile);

      const productData = {
        name,
        price,
        category,
        description,
        image: base64Image,
        quantity: parseInt(quantity)  // Add quantity
      };

      try {
        const token = localStorage.getItem("token");
      
        const response = await fetch("http://localhost:5000/api/products", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            "Authorization": `Bearer ${token}`
          },
          body: JSON.stringify(productData)
        });
      
        const result = await response.json();
      
        if (response.ok) {
          successMessage.textContent = "Product listed successfully!";
          successMessage.style.color = "green";
          successMessage.style.display = "block";
          productForm.reset();
          imageUploadMessage.textContent = "";
          fetchProducts(); // Refresh the list
        } else {
          successMessage.textContent = result.message;
          successMessage.style.color = "red";
          successMessage.style.display = "block";
        }
      }  catch (err) {
        console.error("Upload error", err);
        successMessage.textContent = "Server error. Try again later.";
        successMessage.style.color = "red";
        successMessage.style.display = "block";
      }
    });

    // Preview valid image message
    productImageInput.addEventListener("change", () => {
      const file = productImageInput.files[0];
      if (file && /\.(jpg|jpeg|png)$/i.test(file.name)) {
        imageUploadMessage.textContent = "Image uploaded ✅";
        imageUploadMessage.style.color = "green";
      } else {
        imageUploadMessage.textContent = "";
      }
    });

    // Validate numeric price input
    priceInput.addEventListener("input", () => {
      if (isNaN(priceInput.value)) {
        successMessage.textContent = "Price must be a number";
        successMessage.style.color = "red";
        priceInput.value = "";
      }
    });
});
