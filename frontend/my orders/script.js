document.addEventListener('DOMContentLoaded', () => {
    loadOrderDetails();
});

function showMessage(message, isError = true) {
    const messageDiv = document.getElementById('message');
    messageDiv.textContent = message;
    messageDiv.className = `message ${isError ? 'error' : 'success'}`;
}

async function loadOrderDetails() {
    const token = localStorage.getItem('token');
    if (!token) {
        showMessage('Please log in to view order details');
        return;
    }
    const urlParams = new URLSearchParams(window.location.search);
    const orderId = urlParams.get('orderId');
    if (!orderId) {
        showMessage('Invalid order ID');
        return;
    }
    try {
        const response = await fetch(`https://dma-qhwn.onrender.com/api/orders/${orderId}`, {
            headers: { Authorization: `Bearer ${token}` }
        });
        if (response.ok) {
            const order = await response.json();
            document.getElementById('orderId').textContent = order._id.slice(-6);
            document.getElementById('productName').textContent = order.product.name;
            document.getElementById('quantity').textContent = order.quantity;
            document.getElementById('totalPrice').textContent = order.totalPrice.toFixed(2);
            document.getElementById('productImage').src = order.product.image || 'placeholder.jpg';
            document.getElementById('customerName').textContent = order.user.name;
            document.getElementById('customerEmail').textContent = order.user.email;
            document.getElementById('deliveryMethod').textContent = order.deliveryMethod === 'pickup' ? 'Self-Pickup' : 'Home Delivery';
            if (order.deliveryMethod === 'pickup') {
                document.getElementById('pickupTime').style.display = 'block';
                document.getElementById('pickupTimeValue').textContent = order.deliveryDetails.pickupTime || 'N/A';
            } else {
                document.getElementById('address').style.display = 'block';
                document.getElementById('phone').style.display = 'block';
                document.getElementById('addressValue').textContent = order.deliveryDetails.address || 'N/A';
                document.getElementById('phoneValue').textContent = order.deliveryDetails.phone || 'N/A';
            }
            if (order.specialInstructions) {
                document.getElementById('instructionsSection').style.display = 'block';
                document.getElementById('instructions').textContent = order.specialInstructions;
            }
            document.getElementById('status').textContent = order.status;
            document.getElementById('status').className = `status ${order.status}`;
            const actions = document.getElementById('actions');
            if (order.status === 'pending') {
                actions.innerHTML = `
                    <button onclick="updateOrderStatus('${order._id}', 'accepted')" class="accept-btn">Accept</button>
                    <button onclick="updateOrderStatus('${order._id}', 'rejected')" class="reject-btn">Reject</button>
                `;
            } else if (order.status === 'accepted') {
                actions.innerHTML = `
                    <button onclick="updateOrderStatus('${order._id}', 'completed')" class="completed-btn">Mark Completed</button>
                    <button disabled class="reject-btn">Reject</button>
                `;
            }
        } else {
            showMessage((await response.json()).message || 'Failed to load order details');
        }
    } catch (error) {
        console.error('Error loading order details:', error);
        showMessage('Server error');
    }
}

async function updateOrderStatus(orderId, status) {
    const token = localStorage.getItem('token');
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
            showMessage(`Order ${status} successfully! Customer notified.`, false);
            loadOrderDetails();
        } else {
            showMessage((await response.json()).message || 'Failed to update order status');
        }
    } catch (error) {
        console.error('Error updating order status:', error);
        showMessage('Server error');
    }
}