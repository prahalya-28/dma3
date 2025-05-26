document.addEventListener('DOMContentLoaded', () => {
    // Get tracking ID from URL parameters
    const urlParams = new URLSearchParams(window.location.search);
    const trackingId = urlParams.get('trackingId');
    const orderId = urlParams.get('orderId');

    if (!trackingId && !orderId) {
        showError('No tracking ID or order ID provided');
        return;
    }

    // TC1: Track order with valid tracking ID
    loadOrderDetails(trackingId || orderId);
});

async function loadOrderDetails(id) {
    const token = localStorage.getItem('token');
    if (!token) {
        window.location.href = '../login/index.html';
        return;
    }

    try {
        // TC2: Handle invalid tracking ID
        const response = await fetch(`https://dma-qhwn.onrender.com/api/orders/${id}`, {
            headers: {
                'Authorization': `Bearer ${token}`
            }
        });

        if (response.ok) {
            const order = await response.json();
            displayOrderDetails(order);
            updateTimeline(order);
            displayDeliveryInfo(order);
        } else {
            const error = await response.json();
            showError(error.message || 'Invalid Tracking ID');
        }
    } catch (error) {
        console.error('Error loading order details:', error);
        showError('Server error. Please try again later.');
    }
}

function displayOrderDetails(order) {
    document.getElementById('trackingId').textContent = order.trackingId;
    document.getElementById('orderId').textContent = order._id;
    document.getElementById('productName').textContent = order.product.name;
    document.getElementById('farmerName').textContent = order.farmer.name;
    document.getElementById('quantity').textContent = order.quantity;
    document.getElementById('totalAmount').textContent = `$${order.totalPrice.toFixed(2)}`;
    document.getElementById('deliveryMethod').textContent = 
        order.deliveryMethod === 'pickup' ? 'Self Pickup' : 'Home Delivery';
    
    // TC4: Display estimated delivery date
    document.getElementById('estimatedDelivery').textContent = 
        formatDate(order.estimatedDeliveryDate);
}

function updateTimeline(order) {
    // TC3: Update timeline based on order status
    const timelineItems = document.querySelectorAll('.timeline-item');
    timelineItems.forEach(item => item.classList.remove('active', 'completed'));

    // Update status history
    order.statusHistory.forEach(status => {
        const item = document.getElementById(status.status);
        if (item) {
            item.classList.add('completed');
            const timeElement = document.getElementById(`${status.status}Time`);
            if (timeElement) {
                timeElement.textContent = formatDate(status.timestamp);
            }
        }
    });

    // Set current status as active
    const currentStatus = document.getElementById(order.status);
    if (currentStatus) {
        currentStatus.classList.add('active');
    }

    // TC6: Handle delivered status
    if (order.status === 'delivered' && order.actualDeliveryDate) {
        document.getElementById('deliveredTime').textContent = 
            formatDate(order.actualDeliveryDate);
    }
}

function displayDeliveryInfo(order) {
    const deliveryInfo = document.getElementById('deliveryInfo');
    const deliveryDetails = document.getElementById('deliveryDetails');
    const delayInfo = document.getElementById('delayInfo');

    // Display delivery details
    if (order.deliveryMethod === 'pickup') {
        deliveryDetails.innerHTML = `
            <p><strong>Pickup Time:</strong> ${order.deliveryDetails.pickupTime || 'Not specified'}</p>
            <p><strong>Location:</strong> ${order.farmer.location || 'Not specified'}</p>
        `;
    } else {
        deliveryDetails.innerHTML = `
            <p><strong>Delivery Address:</strong> ${order.deliveryDetails.address || 'Not specified'}</p>
            <p><strong>Contact Phone:</strong> ${order.deliveryDetails.phone || 'Not specified'}</p>
        `;
    }

    if (order.specialInstructions) {
        deliveryDetails.innerHTML += `
            <p><strong>Special Instructions:</strong> ${order.specialInstructions}</p>
        `;
    }

    // TC5: Display delay information if order is delayed
    if (order.status === 'delayed') {
        delayInfo.style.display = 'block';
        document.getElementById('delayReason').textContent = order.delayReason || 'Delivery delayed due to unforeseen circumstances';
        document.getElementById('newDeliveryDate').textContent = 
            `New estimated delivery date: ${formatDate(order.estimatedDeliveryDate)}`;
    } else {
        delayInfo.style.display = 'none';
    }
}

function formatDate(dateString) {
    const date = new Date(dateString);
    return date.toLocaleString('en-US', {
        year: 'numeric',
        month: 'short',
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit'
    });
}

function showError(message) {
    const container = document.querySelector('.container');
    container.innerHTML = `
        <div class="error-message">
            <h2>Error</h2>
            <p>${message}</p>
            <button onclick="goToOrdersSection()" class="back-btn">Back to Orders</button>
        </div>
    `;
}

function goToOrdersSection() {
    window.location.href = '../registered_user homepage/index.html#orders';
} 