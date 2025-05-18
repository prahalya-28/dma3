document.addEventListener('DOMContentLoaded', () => {
    loadOrders();
    document.getElementById('statusFilter').addEventListener('change', filterOrders);
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

async function loadOrders() {
    const token = localStorage.getItem('token');
    if (!token) {
        showMessage('Please log in to view orders');
        return;
    }
    try {
        const response = await fetch('http://localhost:5000/api/orders/farmer-orders', {
            headers: { Authorization: `Bearer ${token}` }
        });
        if (response.ok) {
            const orders = await response.json();
            displayOrders(orders);
        } else {
            showMessage('Failed to load orders');
        }
    } catch (error) {
        console.error('Error loading orders:', error);
        showMessage('Server error');
    }
}

function displayOrders(orders) {
    const tableBody = document.getElementById('orderTable');
    tableBody.innerHTML = '';
    if (!orders || orders.length === 0) {
        tableBody.innerHTML = '<tr><td colspan="7">No orders found.</td></tr>';
        return;
    }
    orders.forEach(order => {
        const row = document.createElement('tr');
        row.dataset.status = order.status;
        row.innerHTML = `
            <td><a href="../order details/index.html?orderId=${order._id}">#${order._id.slice(-6)}</a></td>
            <td>${order.user.name}</td>
            <td>${order.product.name}</td>
            <td>${order.quantity}</td>
            <td>${order.deliveryMethod === 'pickup' ? 'Self-Pickup' : 'Home Delivery'}</td>
            <td class="status">${order.status}</td>
            <td>
                ${order.status === 'pending' ? `
                    <button onclick="updateOrderStatus('${order._id}', 'accepted')" class="accept-btn">Accept</button>
                    <button onclick="updateOrderStatus('${order._id}', 'rejected')" class="reject-btn">Reject</button>
                ` : order.status === 'accepted' ? `
                    <button onclick="updateOrderStatus('${order._id}', 'completed')" class="completed-btn">Mark Completed</button>
                ` : '—'}
            </td>
        `;
        tableBody.appendChild(row);
    });
    filterOrders();
}

function filterOrders() {
    const filter = document.getElementById('statusFilter').value;
    document.querySelectorAll('#orderTable tr').forEach(row => {
        row.style.display = filter === 'all' || row.dataset.status === filter ? '' : 'none';
    });
}

async function updateOrderStatus(orderId, status) {
    const token = localStorage.getItem('token');
    try {
        const response = await fetch(`http://localhost:5000/api/orders/${orderId}/status`, {
            method: 'PUT',
            headers: {
                'Content-Type': 'application/json',
                Authorization: `Bearer ${token}`
            },
            body: JSON.stringify({ status })
        });
        if (response.ok) {
            showMessage(`Order ${status} successfully! Customer notified.`, false);
            loadOrders();
        } else {
            const error = await response.json();
            showMessage(error.message || 'Failed to update order status');
        }
    } catch (error) {
        console.error('Error updating order status:', error);
        showMessage('Server error');
    }
}