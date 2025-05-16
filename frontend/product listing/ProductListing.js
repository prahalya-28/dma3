document.addEventListener("DOMContentLoaded", () => {
    const productForm = document.getElementById("productForm");
    const productList = document.getElementById("productList");
    const successMessage = document.getElementById("successMessage");
    const imageUploadMessage = document.getElementById("imageUploadMessage");
    const imageInvalidMessage = document.getElementById("imageInvalidMessage");
    const priceInput = document.getElementById("productPrice");
    const productImageInput = document.getElementById("productImage");
    const quantityInput = document.getElementById("productQuantity");

    // Fetch and display seller's products
    async function fetchProducts() {
        try {
            const token = localStorage.getItem("token");
            if (!token) {
                productList.innerHTML = '<p class="error">Please log in to view your products.</p>';
                return;
            }

            const response = await fetch("http://localhost:5000/api/products/my-products", {
                headers: {
                    "Authorization": `Bearer ${token}`
                }
            });

            if (!response.ok) {
                throw new Error((await response.json()).message || "Failed to fetch products");
            }

            const products = await response.json();

            productList.innerHTML = ""; // Clear existing

            if (products.length === 0) {
                productList.innerHTML = '<p class="no-products">No products listed. Add a product above.</p>';
                return;
            }

            products.forEach(product => {
                const card = document.createElement("div");
                card.classList.add("product-card");

                // Farmer profile details (not needed here since it's the seller's view, but keeping structure for consistency)
                const farmer = product.farmer || {};
                const farmerProfile = farmer.farmerProfile || {};
                const farmName = farmerProfile.farmName || farmer.name || 'Farm name not specified';
                const farmLocation = farmerProfile.location || 'Location not specified';

                card.innerHTML = 
                    `<h3 class="product-name">${product.name}</h3>
                    <img src="${product.image}" style="width: 100px;" alt="${product.name}" />
                    <div style="display:flex;align-items:center;gap:10px;margin:8px 0;">
                        <div>
                            <div style="font-weight:bold;">${farmName}</div>
                            <div style="color:#666;">${farmLocation}</div>
                        </div>
                    </div>
                    <p class="product-price">₹${product.price}</p>
                    <p class="product-category">${product.category || 'Uncategorized'}</p>
                    <p class="product-description">${product.description || 'No description available'}</p>
                    <p class="product-quantity">In Stock: ${product.quantity} units</p>
                    <div class="product-actions">
                        <button class="delete-btn" onclick="deleteProduct('${product._id}')">Delete</button>
                    </div>`;

                productList.appendChild(card);
            });
        } catch (err) {
            console.error("Failed to fetch products", err);
            productList.innerHTML = `<p class="error">${err.message || 'Failed to load products. Please try again later.'}</p>`;
        }
    }

    fetchProducts(); // Initial fetch

    // Function to delete a product
    window.deleteProduct = async (productId) => {
        if (!confirm("Are you sure you want to delete this product?")) return;

        try {
            const token = localStorage.getItem("token");
            const response = await fetch(`http://localhost:5000/api/products/${productId}`, {
                method: "DELETE",
                headers: {
                    "Authorization": `Bearer ${token}`
                }
            });

            if (!response.ok) {
                throw new Error((await response.json()).message || "Failed to delete product");
            }

            const result = await response.json();
            successMessage.textContent = result.message; // "Product deleted successfully"
            successMessage.style.color = "green";
            successMessage.style.display = "block";
            fetchProducts(); // Refresh the list
        } catch (err) {
            console.error("Delete error", err);
            successMessage.textContent = err.message || "Failed to delete product.";
            successMessage.style.color = "red";
            successMessage.style.display = "block";
        }
    };

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
            quantity: parseInt(quantity)
        };

        try {
            const token = localStorage.getItem("token");
            if (!token) {
                successMessage.textContent = "Please log in to add a product.";
                successMessage.style.color = "red";
                successMessage.style.display = "block";
                return;
            }

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
                successMessage.textContent = result.message; // Handles "Product with this name already exists" for TC10
                successMessage.style.color = "red";
                successMessage.style.display = "block";
            }
        } catch (err) {
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