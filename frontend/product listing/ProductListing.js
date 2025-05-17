document.addEventListener("DOMContentLoaded", () => {
    const productForm = document.getElementById("productForm");
    const productList = document.getElementById("productList");
    const successMessage = document.getElementById("successMessage");
    const imageUploadMessage = document.getElementById("imageUploadMessage");
    const imageInvalidMessage = document.getElementById("imageInvalidMessage");
    const priceInput = document.getElementById("productPrice");
    const productImageInput = document.getElementById("productImage");
    const quantityInput = document.getElementById("productQuantity");

    // Modal Elements
    const editProductModal = document.getElementById("editProductModal");
    const closeEditModal = document.getElementById("closeEditModal");
    const editProductForm = document.getElementById("editProductForm");
    const editProductMessage = document.getElementById("editProductMessage");
    const editImageUploadMessage = document.getElementById("editImageUploadMessage");

    // Fetch and display seller's products
    async function fetchProducts() {
        try {
            const token = localStorage.getItem("token");
            if (!token) {
                productList.innerHTML = '<p class="error">Please log in to view your products.</p>';
                return;
            }

            // Show loading state
            productList.innerHTML = '<p>Loading products...</p>';

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

                // Farmer profile details
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
                        <button class="edit-btn" data-id="${product._id}">Edit</button>
                        <button class="delete-btn" data-id="${product._id}">Delete</button>
                    </div>`;

                productList.appendChild(card);
                
                // Add event listener for edit button
                const editBtn = card.querySelector(".edit-btn");
                editBtn.addEventListener("click", () => openEditModal(product._id));
                
                // Add event listener for delete button
                const deleteBtn = card.querySelector(".delete-btn");
                deleteBtn.addEventListener("click", () => deleteProduct(product._id));
            });
        } catch (err) {
            console.error("Failed to fetch products", err);
            productList.innerHTML = `<p class="error">${err.message || 'Failed to load products. Please try again later.'}</p>`;
        }
    }

    // Initial fetch of products
    fetchProducts();

    // Function to delete a product
    async function deleteProduct(productId) {
        if (!confirm("Are you sure you want to delete this product?")) return;

        try {
            const token = localStorage.getItem("token");
            if (!token) {
                throw new Error("Please log in to delete a product.");
            }

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
    }

    // Make deleteProduct available globally
    window.deleteProduct = deleteProduct;

    // Function to open edit modal
    async function openEditModal(productId) {
        try {
            const token = localStorage.getItem("token");
            if (!token) {
                alert("Please log in to edit products.");
                return;
            }

            // Reset messages only (not the form, to preserve existing values)
            editProductMessage.textContent = "";
            editProductMessage.style.color = "black";
            editImageUploadMessage.textContent = "";

            // Show loading message
            editProductMessage.textContent = "Loading product details...";
            
            const response = await fetch(`http://localhost:5000/api/products/${productId}`, {
                headers: {
                    "Authorization": `Bearer ${token}`
                }
            });

            if (!response.ok) {
                throw new Error((await response.json()).message || "Failed to fetch product details");
            }

            const product = await response.json();
            
            // Clear loading message
            editProductMessage.textContent = "";

            // Populate the form with current product values
            document.getElementById("editProductId").value = product._id;
            document.getElementById("editProductName").value = product.name || "";
            document.getElementById("editProductPrice").value = product.price || "";
            document.getElementById("editProductCategory").value = product.category || "";
            document.getElementById("editProductDescription").value = product.description || "";
            document.getElementById("editProductQuantity").value = product.quantity || 1;
            
            // Store original values as data attributes for comparison later
            editProductForm.dataset.originalName = product.name || "";
            editProductForm.dataset.originalPrice = product.price || "";
            editProductForm.dataset.originalCategory = product.category || "";
            editProductForm.dataset.originalDescription = product.description || "";
            editProductForm.dataset.originalQuantity = product.quantity || 1;
            
            // Show the modal
            editProductModal.style.display = "flex";
        } catch (err) {
            console.error("Error fetching product for editing:", err);
            alert("Failed to retrieve product details. Please try again later.");
        }
    }

    // Make openEditModal available globally
    window.openEditModal = openEditModal;

    // Close modal when X is clicked
    if (closeEditModal) {
        closeEditModal.addEventListener("click", () => {
            editProductModal.style.display = "none";
        });
    }

    // Close modal when clicked outside
    window.addEventListener("click", (event) => {
        if (event.target === editProductModal) {
            editProductModal.style.display = "none";
        }
    });

    // Convert image to base64
    const toBase64 = file =>
        new Promise((resolve, reject) => {
            const reader = new FileReader();
            reader.onload = () => resolve(reader.result);
            reader.onerror = err => reject(err);
            reader.readAsDataURL(file);
        });

    // Handle edit form submission
    if (editProductForm) {
        editProductForm.addEventListener("submit", async (e) => {
            e.preventDefault();
            
            const id = document.getElementById("editProductId").value;
            const name = document.getElementById("editProductName").value.trim();
            const price = parseFloat(document.getElementById("editProductPrice").value.trim());
            const category = document.getElementById("editProductCategory").value.trim();
            const description = document.getElementById("editProductDescription").value.trim();
            const quantity = parseInt(document.getElementById("editProductQuantity").value.trim());
            const imageFile = document.getElementById("editProductImage").files[0];
            
            // Validate inputs
            if (!name || isNaN(price) || price <= 0 || !category || isNaN(quantity) || quantity <= 0) {
                editProductMessage.textContent = "Please fill all required fields correctly.";
                editProductMessage.style.color = "red";
                return;
            }
            
            // Get original values from data attributes
            const originalName = editProductForm.dataset.originalName;
            const originalPrice = parseFloat(editProductForm.dataset.originalPrice);
            const originalCategory = editProductForm.dataset.originalCategory;
            const originalDescription = editProductForm.dataset.originalDescription;
            const originalQuantity = parseInt(editProductForm.dataset.originalQuantity);
            
            // Only include fields that have changed in the update
            const productData = {};
            
            if (name !== originalName) productData.name = name;
            if (price !== originalPrice) productData.price = price;
            if (category !== originalCategory) productData.category = category;
            if (description !== originalDescription) productData.description = description;
            if (quantity !== originalQuantity) productData.quantity = quantity;
            
            // If no fields were changed and no new image was selected, inform the user
            if (Object.keys(productData).length === 0 && !imageFile) {
                editProductMessage.textContent = "No changes were made to the product.";
                editProductMessage.style.color = "blue";
                
                // Still close the modal after a delay
                setTimeout(() => {
                    editProductModal.style.display = "none";
                }, 1500);
                
                return;
            }
            
            // Add image if one was selected
            if (imageFile) {
                const allowedExtensions = /(\.jpg|\.jpeg|\.png)$/i;
                if (!allowedExtensions.exec(imageFile.name)) {
                    editProductMessage.textContent = "Please upload a JPG or PNG image only.";
                    editProductMessage.style.color = "red";
                    return;
                }
                
                try {
                    productData.image = await toBase64(imageFile);
                } catch (err) {
                    console.error("Error converting image:", err);
                    editProductMessage.textContent = "Error processing image. Please try again.";
                    editProductMessage.style.color = "red";
                    return;
                }
            }
            
            // If there are no changes, don't make the API call
            if (Object.keys(productData).length === 0) {
                editProductModal.style.display = "none";
                return;
            }
            
            // Update the product
            try {
                const token = localStorage.getItem("token");
                if (!token) {
                    throw new Error("Please log in to update a product.");
                }
                
                editProductMessage.textContent = "Updating product...";
                editProductMessage.style.color = "black";
                
                const response = await fetch(`http://localhost:5000/api/products/${id}`, {
                    method: "PUT",
                    headers: {
                        "Content-Type": "application/json",
                        "Authorization": `Bearer ${token}`
                    },
                    body: JSON.stringify(productData)
                });
                
                if (!response.ok) {
                    throw new Error((await response.json()).message || "Failed to update product");
                }
                
                const result = await response.json();
                
                editProductMessage.textContent = "Product updated successfully!";
                editProductMessage.style.color = "green";
                
                // Close modal after successful update
                setTimeout(() => {
                    editProductModal.style.display = "none";
                    fetchProducts(); // Refresh the list
                }, 1500);
            } catch (err) {
                console.error("Update error:", err);
                editProductMessage.textContent = err.message || "Failed to update product.";
                editProductMessage.style.color = "red";
            }
        });
    }

    // Preview valid image message for edit form
    const editProductImageInput = document.getElementById("editProductImage");
    if (editProductImageInput) {
        editProductImageInput.addEventListener("change", () => {
            const file = editProductImageInput.files[0];
            if (file && /\.(jpg|jpeg|png)$/i.test(file.name)) {
                editImageUploadMessage.textContent = "Image selected ✅";
                editImageUploadMessage.style.color = "green";
            } else if (file) {
                editImageUploadMessage.textContent = "Please select a JPG or PNG image";
                editImageUploadMessage.style.color = "red";
            } else {
                editImageUploadMessage.textContent = "";
            }
        });
    }

    // Handle product form submission (Add Product)
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

    // Preview valid image message for add product form
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