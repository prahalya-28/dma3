document.addEventListener('DOMContentLoaded', () => {
    updateTotal();
    toggleDeliveryDetails();
    document.getElementById('quantity').addEventListener('input', updateTotal);
    document.getElementById('delivery-method').addEventListener('change', toggleDeliveryDetails);
});

function showMessage(message, isError = true) {
    const messageDiv = document.getElementById('message');
    messageDiv.textContent = message;
    messageDiv.className = `message ${isError ? 'error' : 'success'}`;
}

function clearMessage() {
    document.getElementById('message').textContent = '';
    document.getElementById('message').className = 'message';
}

function updateTotal() {
    const quantity = parseInt(document.getElementById('quantity').value) || 1;
    const pricePerKg = parseFloat(document.getElementById('pricePerKg').textContent);
    const stock = parseInt(document.getElementById('stock').textContent);
    if (quantity > stock) {
        showMessage('Requested quantity exceeds available stock');
        document.getElementById('quantity').value = stock;
        return;
    }
    document.getElementById('total-price').textContent = (quantity * pricePerKg).toFixed(2);
    clearMessage();
}

function toggleDeliveryDetails() {
    const deliveryMethod = document.getElementById('delivery-method').value;
    document.getElementById('pickup-section').style.display = deliveryMethod === 'pickup' ? 'block' : 'none';
    document.getElementById('address-section').style.display = deliveryMethod === 'home' ? 'block' : 'none';
}

async function placeOrder() {
    const token = localStorage.getItem('token');
    if (!token) {
        showMessage('Please log in to place an order');
        return;
    }
    const quantity = parseInt(document.getElementById('quantity').value);
    const deliveryMethod = document.getElementById('delivery-method').value;
    const pickupTime = document.getElementById('pickup-time').value;
    const address = document.getElementById('address').value.trim();
    const phone = document.getElementById('phone').value.trim();
    const instructions = document.getElementById('instructions').value.trim();
    const stock = parseInt(document.getElementById('stock').textContent);
    if (!quantity || quantity <= 0) {
        showMessage('Please enter a valid quantity');
        return;
    }
    if (quantity > stock) {
        showMessage('Product is out of stock');
        return;
    }
    if (stock === 0) {
        showMessage('Product is out of stock');
        return;
    }
    if (deliveryMethod === 'home' && (!address || !phone)) {
        showMessage('Please provide delivery address and phone number');
        return;
    }
    const deliveryDetails = deliveryMethod === 'pickup' ? { pickupTime } : { address, phone };
    const orderData = {
        productId: 'mockProductId123', // Replace with actual product ID
        quantity,
        deliveryMethod,
        deliveryDetails,
        specialInstructions: instructions
    };
    try {
        const response = await fetch('http://localhost:5000/api/orders', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                Authorization: `Bearer ${token}`
            },
            body: JSON.stringify(orderData)
        });
        const result = await response.json();
        if (response.ok) {
            showMessage('Order placed successfully! You will be notified of status updates.', false);
            document.getElementById('stock').textContent = stock - quantity;
            updateTotal();
        } else {
            showMessage(result.message || 'Failed to place order');
        }
    } catch (error) {
        console.error('Error placing order:', error);
        showMessage('Server error');
    }
}