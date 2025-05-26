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
        const response = await fetch('https://dma-qhwn.onrender.com/api/orders/farmer-orders', {
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

    // Define the valid statuses that farmers can set via this interface
    const farmerEditableStatuses = ['shipped', 'out_for_delivery', 'delivered', 'delayed'];

    orders.forEach(order => {
        const row = document.createElement('tr');
        row.dataset.status = order.status;

        // Generate status dropdown
        let statusDropdown = '<select onchange="updateOrderStatus(\''+order._id+'\', this.value)">';
        
        // Add the current status as the first option if it's not farmer editable
        if (!farmerEditableStatuses.includes(order.status)) {
             statusDropdown += `<option value="${order.status}" selected disabled>${order.status.replace(/_/g, ' ').charAt(0).toUpperCase() + order.status.replace(/_/g, ' ').slice(1)} (Automatic)</option>`;
        }

        const deliverySpecificStatuses = ['shipped', 'out_for_delivery', 'delivered'];

        validStatuses.forEach(status => { // validStatuses includes all possible statuses
            let disabled = false;
            let hidden = false;

            // Disable or hide statuses not relevant to the delivery method
            if (deliverySpecificStatuses.includes(status) && order.deliveryMethod !== 'home') {
                disabled = true;
                 // Optionally, hide these for pickup orders if they clutter the UI
                // hidden = true;
            }

            // Existing logic to determine if a status is selectable based on the current status
            switch (order.status) {
                case 'pending':
                case 'accepted':
                case 'processing':
                    // Can only go to shipped or delayed from processing for home delivery
                    // Need to consider pickup flow here later if necessary
                    if (status !== 'shipped' && status !== 'delayed') disabled = true;
                     break;
                case 'shipped': // Can go to out_for_delivery or delayed
                    if (status !== 'out_for_delivery' && status !== 'delayed') disabled = true;
                    break;
                case 'out_for_delivery': // Can go to delivered or delayed
                     if (status !== 'delivered' && status !== 'delayed') disabled = true;
                     break;
                case 'delivered': // Final state
                case 'rejected': // Final state
                case 'cancelled': // Final state
                     disabled = true; // Cannot change from final states
                     hidden = true; // Hide the dropdown for final states
                    break;
                 case 'delayed': // Can go to shipped, out_for_delivery, or delivered
                      // Need to consider delivery method here
                       if(order.deliveryMethod === 'home'){
                           if (status !== 'shipped' && status !== 'out_for_delivery' && status !== 'delivered') disabled = true;
                       } else { // Assuming delayed pickup orders can only go to picked up (if that status exists)
                            disabled = true; // Disable other delivery statuses for delayed pickup
                       }
                     break;
                default:
                    // If current status is unexpected, disable all editable statuses
                    disabled = true;
                    break;
            }

            // Ensure the currently selected status (if farmer editable) is enabled
             if (farmerEditableStatuses.includes(order.status) && status === order.status) {
                 disabled = false;
                 hidden = false; // Ensure current editable status is visible
             }

            // Ensure automatic statuses are disabled in the dropdown
             if (!farmerEditableStatuses.includes(status)) {
                 disabled = true;
             }

            if (!hidden) {
                statusDropdown += `<option value="${status}" ${order.status === status ? 'selected' : ''} ${disabled ? 'disabled' : ''}>${status.replace(/_/g, ' ').charAt(0).toUpperCase() + status.replace(/_/g, ' ').slice(1)}</option>`;
            }
        });

         // If the current status is one the farmer *cannot* edit and is a final state, just show the status text
         const nonEditableFinalStates = ['delivered', 'rejected', 'cancelled'];
         if (nonEditableFinalStates.includes(order.status)) {
              statusDropdown = order.status.replace(/_/g, ' ').charAt(0).toUpperCase() + order.status.replace(/_/g, ' ').slice(1);
         } else { // For editable and other non-editable states, close the select tag
             statusDropdown += '</select>';
         }

        row.innerHTML = `
            <td><a href="../order details/index.html?orderId=${order._id}">#${order._id.slice(-6)}</a></td>
            <td>${order.user.name}</td>
            <td>${order.product.name}</td>
            <td>${order.quantity}</td>
            <td>${order.deliveryMethod === 'pickup' ? 'Self-Pickup' : 'Home Delivery'}</td>
            <td class="status">${order.status}</td>
            <td>
                ${statusDropdown}
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