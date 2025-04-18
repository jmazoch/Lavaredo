// Add debug logging at the top
console.log('Admin.js loaded');

/**
 * Admin functionality for order management
 */

console.log('Admin.js loaded');

// Initialize the admin dashboard functionality
function initAdminDashboard() {
    console.log('Initializing admin dashboard');
    
    // Set up event listeners
    setupAdminEventListeners();
    
    // Update time display
    updateCurrentTime();
    setInterval(updateCurrentTime, 60000); // Update every minute
    
    // Generate and store admin token if it doesn't exist
    if (!sessionStorage.getItem('adminToken')) {
        const adminUser = JSON.parse(localStorage.getItem('loggedInUser')) || {};
        if (adminUser.isAdmin) {
            // Generate a simple token based on timestamp and random string
            const adminToken = `admin_${Date.now()}_${Math.random().toString(36).substring(2, 15)}`;
            sessionStorage.setItem('adminToken', adminToken);
            console.log('New admin token generated');
        }
    }
    
    // Load initial data
    loadAllOrders();
}

document.addEventListener('DOMContentLoaded', function() {
    console.log('Admin module loaded and DOM ready');
    
    // Initialize dashboard - we've already verified auth in the HTML file
    initAdminDashboard();
    
    // Setup admin logout button
    const adminLogoutBtn = document.getElementById('adminLogoutBtn');
    if (adminLogoutBtn) {
        adminLogoutBtn.addEventListener('click', function() {
            console.log('Admin logout clicked');
            localStorage.removeItem('loggedInUser');
            sessionStorage.clear();
            window.location.href = 'index.html';
        });
    }

    // Remove test order button

    // Add the clear server orders button
    addClearButtonCSS();
    addClearServerOrdersButton();
});

// Updates the current time display in the admin header
function updateCurrentTime() {
    const currentTimeElement = document.getElementById('currentTime');
    if (currentTimeElement) {
        const now = new Date();
        const options = {
            weekday: 'long',
            year: 'numeric',
            month: 'long',
            day: 'numeric',
            hour: '2-digit',
            minute: '2-digit'
        };
        currentTimeElement.textContent = now.toLocaleDateString('en-US', options);
    }
}

// Setup admin event listeners
function setupAdminEventListeners() {
    // Refresh orders button
    const refreshOrdersBtn = document.getElementById('refreshOrdersBtn');
    if (refreshOrdersBtn) {
        refreshOrdersBtn.addEventListener('click', function() {
            loadAllOrders();
            showToast('Orders refreshed', 'success');
        });
    }
    
    // Admin menu navigation
    const menuItems = document.querySelectorAll('.admin-menu a');
    if (menuItems.length > 0) {
        menuItems.forEach(item => {
            item.addEventListener('click', function(e) {
                e.preventDefault();
                
                const targetId = this.getAttribute('href').substring(1);
                
                // Hide all sections
                document.querySelectorAll('.admin-section').forEach(section => {
                    section.classList.remove('active');
                });
                
                // Show the target section
                document.getElementById(targetId).classList.add('active');
                
                // Update active menu item
                document.querySelectorAll('.admin-menu li').forEach(li => {
                    li.classList.remove('active');
                });
                this.parentElement.classList.add('active');
            });
        });
    }

    // Search functionality
    const searchInput = document.querySelector('.search-input');
    if (searchInput) {
        searchInput.addEventListener('input', function() {
            const searchTerm = this.value.toLowerCase();
            filterOrders(searchTerm);
        });
    }
    
    // Status filter
    const statusFilter = document.querySelector('.filter-select');
    if (statusFilter) {
        statusFilter.addEventListener('change', function() {
            const selectedStatus = this.value;
            filterOrdersByStatus(selectedStatus);
        });
    }
}

// Filter orders by search term
function filterOrders(searchTerm) {
    const rows = document.querySelectorAll('#ordersTableBody tr');
    
    rows.forEach(row => {
        const text = row.textContent.toLowerCase();
        row.style.display = text.includes(searchTerm) ? '' : 'none';
    });
}

// Filter orders by status
function filterOrdersByStatus(status) {
    const rows = document.querySelectorAll('#ordersTableBody tr');
    
    rows.forEach(row => {
        if (status === 'all') {
            row.style.display = '';
            return;
        }
        
        const statusCell = row.querySelector('.status-badge');
        if (statusCell && statusCell.classList.contains(status)) {
            row.style.display = '';
        } else {
            row.style.display = 'none';
        }
    });
}

// Load orders from serverless function
async function loadAllOrders() {
    console.log('Loading orders from server');
    const ordersTableBody = document.getElementById('ordersTableBody');
    
    if (!ordersTableBody) {
        console.error('Orders table body not found');
        return;
    }
    
    // Clear existing rows
    ordersTableBody.innerHTML = '';
    
    try {
        // Create a loading indicator
        ordersTableBody.innerHTML = `
            <tr>
                <td colspan="6" class="loading-message">
                    <i class="fas fa-spinner fa-spin"></i> Loading orders...
                </td>
            </tr>
        `;
        
        // Fetch orders from the API
        const adminToken = sessionStorage.getItem('adminToken') || 
                           `admin_${Date.now()}_${Math.random().toString(36).substring(2, 15)}`;
        
        const response = await fetch('/.netlify/functions/get-orders', {
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${adminToken}`
            }
        });
        
        if (!response.ok) {
            throw new Error(`Server returned ${response.status}`);
        }
        
        const data = await response.json();
        const orders = data.orders || [];
        
        console.log(`Received ${orders.length} orders from server`);
        
        // Clear loading indicator
        ordersTableBody.innerHTML = '';
        
        // Update stats display if available
        if (data.stats && document.getElementById('databaseStats')) {
            updateStatsDisplay(data.stats);
        }
        
        if (orders.length === 0) {
            // Show no orders message
            ordersTableBody.innerHTML = `
                <tr>
                    <td colspan="6" class="no-orders-message">No orders have been submitted yet</td>
                </tr>
            `;
            return;
        }
        
        // Sort orders by timestamp (newest first)
        orders.sort((a, b) => {
            return (b.timestamp || 0) - (a.timestamp || 0);
        });
        
        // Add each order to the table
        orders.forEach(order => {
            const row = document.createElement('tr');
            
            // Generate a short ID if needed
            const shortId = order.id ? (typeof order.id === 'string' ? order.id.substring(0, 8) : order.id) : Math.floor(1000 + Math.random() * 9000);
            
            // Determine status class
            let statusClass = order.status || 'preordered';
            
            // Enhanced date-time formatting
            let dateTimeFormatted = 'N/A';
            try {
                const orderDate = new Date(order.timestamp || order.date);
                dateTimeFormatted = orderDate.toLocaleString();
            } catch (dateError) {
                console.error('Error formatting date:', dateError);
                dateTimeFormatted = order.date || 'Unknown Date';
            }
            
            row.innerHTML = `
                <td>#ORD-${shortId}</td>
                <td>${order.customer || 'Unknown'}</td>
                <td class="order-datetime">${dateTimeFormatted}</td>
                <td>${order.items ? order.items.length : 0}</td>
                <td><span class="status-badge ${statusClass}">${order.status || 'preordered'}</span></td>
                <td>
                    <button class="btn-view" data-id="${order.id}"><i class="fas fa-eye"></i></button>
                    <div class="status-options">
                        <button class="btn-status ${statusClass === 'preordered' ? 'active' : ''}" data-id="${order.id}" data-status="preordered">Preordered</button>
                        <button class="btn-status ${statusClass === 'added' ? 'active' : ''}" data-id="${order.id}" data-status="added">Added in order</button>
                        <button class="btn-status ${statusClass === 'paid' ? 'active' : ''}" data-id="${order.id}" data-status="paid">Paid</button>
                    </div>
                </td>
            `;
            ordersTableBody.appendChild(row);
        });
        
        // Add event listeners to buttons
        setupOrderButtons();
        
    } catch (error) {
        console.error('Error loading orders:', error);
        ordersTableBody.innerHTML = `
            <tr>
                <td colspan="6" class="error-message">Error loading orders: ${error.message}</td>
            </tr>
        `;
    }
}

// Helper function to update stats display
function updateStatsDisplay(stats) {
    const statsDisplay = document.getElementById('databaseStats');
    if (!statsDisplay) return;
    
    let html = `<strong>Total Orders:</strong> ${stats.totalOrders}`;
    
    if (stats.statuses) {
        html += '<div class="status-breakdown">';
        for (const [status, count] of Object.entries(stats.statuses)) {
            html += `<span class="status-badge ${status}">${status}: ${count}</span>`;
        }
        html += '</div>';
    }
    
    statsDisplay.innerHTML = html;
}

function setupOrderButtons() {
    // View buttons
    document.querySelectorAll('.btn-view').forEach(btn => {
        btn.addEventListener('click', function() {
            const orderId = this.getAttribute('data-id');
            viewOrder(orderId);
        });
    });
    
    // Status buttons
    document.querySelectorAll('.btn-status').forEach(btn => {
        btn.addEventListener('click', function() {
            const orderId = this.getAttribute('data-id');
            const status = this.getAttribute('data-status');
            updateOrderStatus(orderId, status);
            
            // Update active status on buttons
            const parentStatusOptions = this.closest('.status-options');
            if (parentStatusOptions) {
                parentStatusOptions.querySelectorAll('.btn-status').forEach(b => b.classList.remove('active'));
                this.classList.add('active');
            }
        });
    });
    
    // Delete buttons - Enhanced with better confirmation dialog
    document.querySelectorAll('.btn-delete').forEach(btn => {
        btn.addEventListener('click', function() {
            const orderId = this.getAttribute('data-id');
            const orderRow = this.closest('tr');
            const customerName = orderRow.querySelector('td:nth-child(2)').textContent;
            showDeleteConfirmation(orderId, customerName);
        });
    });
}

// New function to show a better delete confirmation
function showDeleteConfirmation(orderId, customerName) {
    // Check if modal already exists
    let modal = document.getElementById('deleteConfirmModal');
    
    if (!modal) {
        // Create modal if it doesn't exist
        modal = document.createElement('div');
        modal.id = 'deleteConfirmModal';
        modal.className = 'delete-confirm-modal';
        modal.innerHTML = `
            <div class="confirm-dialog">
                <h3>Delete Order</h3>
                <p>Are you sure you want to delete order <strong>#${orderId}</strong>?</p>
                <p class="customer-info">Customer: <strong>${customerName}</strong></p>
                <p class="warning">This action cannot be undone!</p>
                <div class="confirm-actions">
                    <button class="cancel-btn">Cancel</button>
                    <button class="confirm-btn">Delete Order</button>
                </div>
            </div>
        `;
        
        document.body.appendChild(modal);
        
        // Add event listeners to the buttons
        modal.querySelector('.cancel-btn').addEventListener('click', () => {
            modal.classList.remove('show');
            setTimeout(() => { modal.style.display = 'none'; }, 300);
        });
        
        modal.querySelector('.confirm-btn').addEventListener('click', () => {
            deleteOrder(orderId);
            modal.classList.remove('show');
            setTimeout(() => { modal.style.display = 'none'; }, 300);
        });
        
        // Close when clicking outside the dialog
        modal.addEventListener('click', (e) => {
            if (e.target === modal) {
                modal.classList.remove('show');
                setTimeout(() => { modal.style.display = 'none'; }, 300);
            }
        });
    } else {
        // Update existing modal with new order details
        modal.querySelector('p').innerHTML = `Are you sure you want to delete order <strong>#${orderId}</strong>?`;
        modal.querySelector('.customer-info').innerHTML = `Customer: <strong>${customerName}</strong>`;
        
        // Update the confirm button's event listener
        const confirmBtn = modal.querySelector('.confirm-btn');
        const newConfirmBtn = confirmBtn.cloneNode(true);
        confirmBtn.parentNode.replaceChild(newConfirmBtn, confirmBtn);
        newConfirmBtn.addEventListener('click', () => {
            deleteOrder(orderId);
            modal.classList.remove('show');
            setTimeout(() => { modal.style.display = 'none'; }, 300);
        });
    }
    
    // Show the modal
    modal.style.display = 'flex';
    setTimeout(() => { modal.classList.add('show'); }, 10);
}

// Enhanced delete order function with better feedback and server order handling
async function deleteOrder(orderId, showToasts = true) {
    console.log('Deleting order:', orderId);
    
    // Show loading state
    if (showToasts) {
        showToast('Deleting order...', 'info');
    }
    
    try {
        // For server mock orders, store in a deleted list to prevent them from reappearing
        if (orderId.startsWith('SERVER-')) {
            // Track this in localStorage so we don't show it again
            const deletedServerOrders = JSON.parse(localStorage.getItem('deletedServerOrders') || '[]');
            if (!deletedServerOrders.includes(orderId)) {
                deletedServerOrders.push(orderId);
                localStorage.setItem('deletedServerOrders', JSON.stringify(deletedServerOrders));
                console.log(`Added ${orderId} to deleted server orders list`);
            }
        }
        
        // Delete from localStorage first
        let localDeleted = false;
        const submittedOrders = JSON.parse(localStorage.getItem('submittedOrders')) || [];
        const updatedOrders = submittedOrders.filter(order => order.id != orderId);
        
        if (updatedOrders.length !== submittedOrders.length) {
            localStorage.setItem('submittedOrders', JSON.stringify(updatedOrders));
            localDeleted = true;
            console.log('Order deleted from localStorage');
        }
        
        // Try to delete from server using API utils
        let serverDeleted = false;
        try {
            console.log('Calling delete-order function via API utils');
            
            const result = await window.apiUtils.callFunction('delete-order', {
                method: 'POST',
                body: JSON.stringify({ orderId })
            });
            
            if (result && result.success) {
                serverDeleted = true;
                console.log('Order deleted from server');
            } else {
                console.warn('Server deletion response did not indicate success:', result);
            }
        } catch (apiError) {
            console.error('API error during order deletion:', apiError);
        }
        
        // Show feedback based on result
        if (localDeleted || serverDeleted || orderId.startsWith('SERVER-')) {
            // Success - refresh order list
            setTimeout(() => loadAllOrders(), 300);
            
            // Show a success toast notification
            if (showToasts) {
                showToast(`Order #${orderId} deleted successfully`, 'success');
            }
        } else {
            // Error - nothing was deleted
            if (showToasts) {
                showToast('Failed to delete order. Order not found.', 'error');
            }
        }
    } catch (error) {
        console.error('Error deleting order:', error);
        if (showToasts) {
            showToast(`Error: ${error.message}`, 'error');
        }
    }
}

// Add better handling for viewing server orders
async function viewOrder(orderId) {
    console.log('Viewing order:', orderId);
    
    // Check both local and server orders
    const submittedOrders = JSON.parse(localStorage.getItem('submittedOrders')) || [];
    let order = submittedOrders.find(order => order.id == orderId);
    
    // Get the modal elements
    const orderModal = document.getElementById('orderModal');
    const orderDetails = document.getElementById('orderDetails');
    
    if (!orderModal || !orderDetails) {
        console.error('Order modal elements not found');
        return;
    }
    
    // If order is not in localStorage, try to fetch from server
    if (!order) {
        console.log('Order not found in localStorage, trying server fetch...');
        
        // Show loading state in modal
        orderModal.style.display = 'block';
        orderDetails.innerHTML = `
            <div class="loading-indicator">
                <div class="spinner"></div>
                <p>Loading order details from server...</p>
                <p class="endpoint-info">Order ID: ${orderId}</p>
            </div>
        `;
        
        // Try to fetch from server using API utils
        try {
            console.log('Fetching order via API utils');
            
            const result = await window.apiUtils.callFunction('get-order', {}, { orderId });
            
            if (result && result.order) {
                order = result.order;
                console.log('Successfully fetched order from server:', order);
            } else {
                throw new Error('Order not found on server');
            }
        } catch (error) {
            console.error('Error fetching order from server:', error);
            orderDetails.innerHTML = `
                <div class="error-message">
                    <p><strong>Error loading order:</strong> ${error.message}</p>
                    <div class="diagnostic-info">
                        <p>Server Endpoints Tried:</p>
                        <ul>
                            ${window.apiUtils.getFunctionUrl('get-order', { orderId })
                                .map(url => `<li>${url}</li>`).join('')}
                        </ul>
                        <p>To fix this issue:</p>
                        <ul>
                            <li>Make sure your serverless functions are deployed</li>
                            <li>Check Netlify function logs for errors</li>
                            <li>Verify the get-order.js function exists in both directories</li>
                            <li>Check CORS configuration in your Netlify functions</li>
                        </ul>
                    </div>
                    <button class="close-btn" onclick="document.getElementById('orderModal').style.display='none'">Close</button>
                </div>
            `;
            return;
        }
    }
    
    // If still no order after trying to fetch, show a fallback UI with order ID
    if (!order) {
        console.log('Failed to fetch order data - showing fallback UI');
        
        order = {
            id: orderId,
            customer: 'Unknown Customer',
            email: 'Not available',
            phone: 'Not available',
            date: new Date().toISOString(),
            status: 'unknown',
            source: 'server',
            items: []
        };
        
        // Show a warning in the modal
        const warningDiv = document.createElement('div');
        warningDiv.className = 'server-warning';
        warningDiv.innerHTML = `
            <p style="padding: 10px 15px; background-color: #fff3cd; color: #856404; border-left: 4px solid #ffeeba; margin-bottom: 20px;">
                <strong>Limited data available:</strong> This order could not be fully loaded from the server.
            </p>
        `;
        
        orderDetails.innerHTML = '';
        orderDetails.appendChild(warningDiv);
    }
    
    // Format the order date with time
    const orderDate = new Date(order.date);
    const formattedDate = orderDate.toLocaleString('en-US', {
        year: 'numeric', 
        month: 'long', 
        day: 'numeric',
        hour: '2-digit', 
        minute: '2-digit',
        second: '2-digit'
    });
    
    // Build the HTML for order details
    let detailsHTML = `
        <div class="order-detail-header">
            <div class="order-info">
                <p><strong>Order ID:</strong> #ORD-${order.id}</p>
                <p><strong>Date:</strong> ${formattedDate}</p>
                <p><strong>Status:</strong> <span class="status-badge ${order.status || 'preordered'}">${order.status || 'Preordered'}</span></p>
                <p><strong>Source:</strong> <span class="source-tag ${order.source || 'server'}-source">${order.source || 'Server'}</span></p>
            </div>
            <div class="customer-info">
                <h3>Customer Information</h3>
                <p><strong>Name:</strong> ${order.customer || 'Not provided'}</p>
                <p><strong>Email:</strong> ${order.email || 'Not provided'}</p>
                <p><strong>Phone:</strong> ${order.phone || 'Not provided'}</p>
            </div>
        </div>
        
        <div class="order-items">
            <h3>Ordered Items</h3>
            <table class="order-items-table">
                <thead>
                    <tr>
                        <th>Product</th>
                        <th>Gender</th>
                        <th>Size</th>
                        <th>Quantity</th>
                    </tr>
                </thead>
                <tbody>
    `;
    
    // Group items by product name, gender and size to calculate quantities
    const itemGroups = {};
    
    if (order.items && order.items.length > 0) {
        order.items.forEach(item => {
            const key = `${item.name}-${item.gender}-${item.size}`;
            if (!itemGroups[key]) {
                itemGroups[key] = {
                    name: item.name,
                    gender: item.gender || 'Not specified',
                    size: item.size,
                    quantity: 0
                };
            }
            itemGroups[key].quantity++;
        });
        
        // Add rows to the table for each unique item
        Object.values(itemGroups).forEach(item => {
            detailsHTML += `
                <tr>
                    <td>${item.name}</td>
                    <td>${item.gender}</td>
                    <td>${item.size}</td>
                    <td>${item.quantity}</td>
                </tr>
            `;
        });
    } else {
        detailsHTML += `
            <tr>
                <td colspan="4">No items in this order</td>
            </tr>
        `;
    }
    
    detailsHTML += `
                </tbody>
            </table>
        </div>
        <div class="order-actions">
            <h4>Update Order Status:</h4>
            <div class="modal-status-buttons">
                <button class="btn-status ${order.status === 'preordered' ? 'active' : ''}" data-id="${order.id}" data-status="preordered">Preordered</button>
                <button class="btn-status ${order.status === 'added' ? 'active' : ''}" data-id="${order.id}" data-status="added">Added in Order</button>
                <button class="btn-status ${order.status === 'paid' ? 'active' : ''}" data-id="${order.id}" data-status="paid">Paid</button>
            </div>
        </div>
    `;
    
    // Set the HTML and show modal
    orderDetails.innerHTML = detailsHTML;
    orderModal.style.display = 'block';
    
    // Add action button event listeners
    setupModalStatusButtons(orderModal, order.id);
    
    // Close modal when clicking X
    const closeBtn = orderModal.querySelector('.close-modal');
    if (closeBtn) {
        closeBtn.addEventListener('click', function() {
            orderModal.style.display = 'none';
        });
    }
    
    // Close when clicking outside the modal
    window.addEventListener('click', function(e) {
        if (e.target === orderModal) {
            orderModal.style.display = 'none';
        }
    });
}

function setupModalStatusButtons(modal, orderId) {
    // Status buttons in modal
    const statusButtons = modal.querySelectorAll('.btn-status');
    if (statusButtons) {
        statusButtons.forEach(btn => {
            btn.addEventListener('click', function() {
                const status = this.getAttribute('data-status');
                updateOrderStatus(orderId, status);
                
                // Update active status on buttons
                statusButtons.forEach(b => {
                    b.classList.remove('active');
                });
                this.classList.add('active');
                
                // Update status badge in modal
                const statusBadge = modal.querySelector('.status-badge');
                if (statusBadge) {
                    statusBadge.className = `status-badge ${status}`;
                    statusBadge.textContent = status.charAt(0).toUpperCase() + status.slice(1);
                }
            });
        });
    }
}

// Update order status via API
async function updateOrderStatus(orderId, status) {
    console.log('Updating order status:', orderId, status);
    
    try {
        const adminToken = sessionStorage.getItem('adminToken') || 
                          `admin_${Date.now()}_${Math.random().toString(36).substring(2, 15)}`;
        
        const response = await fetch('/.netlify/functions/update-order', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${adminToken}`
            },
            body: JSON.stringify({
                orderId: orderId,
                status: status
            })
        });
        
        if (!response.ok) {
            throw new Error(`Server returned ${response.status}`);
        }
        
        const result = await response.json();
        
        if (result.success) {
            showToast(`Order status updated to ${status}`, 'success');
            // Refresh the orders list
            setTimeout(() => loadAllOrders(), 500);
        } else {
            showToast(result.message || 'Status update failed', 'error');
        }
    } catch (error) {
        console.error('Error updating order status:', error);
        showToast(`Error: ${error.message}`, 'error');
    }
}

// Toast notification function
function showToast(message, type = 'info') {
    const toast = document.createElement('div');
    toast.className = `toast toast-${type}`;
    toast.innerHTML = `
        <div class="toast-content">
            <i class="fas ${type === 'success' ? 'fa-check-circle' : type === 'error' ? 'fa-exclamation-circle' : 'fa-info-circle'}"></i>
            <span>${message}</span>
        </div>
        <span class="toast-close">&times;</span>
    `;
    document.body.appendChild(toast);
    
    // Show toast with animation
    setTimeout(() => {
        toast.classList.add('show');
    }, 10);
    
    // Auto-hide after 3 seconds
    setTimeout(() => {
        toast.classList.remove('show');
        setTimeout(() => {
            document.body.removeChild(toast);
        }, 300);
    }, 3000);
    
    // Close on click
    const closeBtn = toast.querySelector('.toast-close');
    if (closeBtn) {
        closeBtn.addEventListener('click', function() {
            toast.classList.remove('show');
            setTimeout(() => {
                document.body.removeChild(toast);
            }, 300);
        });
    }
}

// Add export functionality
function exportOrders() {
    const allOrders = Array.from(document.querySelectorAll('#ordersTableBody tr'))
        .map(row => {
            const columns = row.querySelectorAll('td');
            if (columns.length < 5) return null;
            return {
                id: columns[0].textContent.replace('#ORD-', ''),
                customer: columns[1].textContent,
                date: columns[2].textContent,
                items: columns[3].textContent,
                status: columns[4].querySelector('.status-badge').textContent
            };
        })
        .filter(order => order !== null);
    
    // Create CSV
    const csvContent = 'data:text/csv;charset=utf-8,' 
        + 'Order ID,Customer,Date,Items,Status\n'
        + allOrders.map(order => 
            `${order.id},${order.customer},${order.date},${order.items},${order.status}`
        ).join('\n');
    
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('download', 'lavaredo-orders.csv');
    link.setAttribute('href', encodedUri);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
}

// Bulk delete orders function
async function bulkDeleteOrders() {
    const input = document.createElement('input');
    input.type = 'file';
    input.accept = '.csv';
    
    input.addEventListener('change', async function(e) {
        if (!this.files || !this.files[0]) return;
        
        const file = this.files[0];
        const reader = new FileReader();
        
        reader.onload = async function(event) {
            try {
                const csvContent = event.target.result;
                const rows = csvContent.split('\n');
                
                // Skip header row
                const orderIds = rows.slice(1)
                    .filter(row => row.trim())  // Skip empty rows
                    .map(row => row.split(',')[0].trim());
                
                if (!orderIds.length) {
                    alert('No valid orders found in CSV file');
                    return;
                }
                
                const confirmDelete = confirm(`Are you sure you want to delete these ${orderIds.length} orders?\n\n${orderIds.join(', ')}`);
                
                if (!confirmDelete) return;
                
                // Show loading modal
                const loadingModal = document.createElement('div');
                loadingModal.className = 'loading-overlay';
                loadingModal.innerHTML = `
                    <div class="spinner"></div>
                    <p>Deleting <strong>${orderIds.length}</strong> orders...</p>
                    <div id="deleteProgress">0/${orderIds.length} completed</div>
                `;
                document.body.appendChild(loadingModal);
                
                // Process each order
                let successCount = 0;
                let failCount = 0;
                
                for (let i = 0; i < orderIds.length; i++) {
                    try {
                        const orderId = orderIds[i];
                        await deleteOrder(orderId, false); // Don't show individual toasts
                        successCount++;
                    } catch (err) {
                        console.error('Error deleting order:', err);
                        failCount++;
                    }
                    
                    // Update progress
                    const progress = document.getElementById('deleteProgress');
                    if (progress) {
                        progress.textContent = `${i+1}/${orderIds.length} completed`;
                    }
                }
                
                // Remove loading modal
                document.body.removeChild(loadingModal);
                
                // Refresh the orders list
                loadAllOrders();
                
                // Show completion message
                showToast(`Deleted ${successCount} orders. ${failCount > 0 ? `${failCount} failed.` : ''}`, 
                    failCount > 0 ? 'warning' : 'success');
                
            } catch (error) {
                console.error('Error processing CSV:', error);
                alert('Error processing CSV file: ' + error.message);
            }
        };
        
        reader.readAsText(file);
    });
    
    input.click();
}

// Make initialization function available globally
window.initAdminDashboard = initAdminDashboard;

// Function to clear all server orders
async function clearAllServerOrders() {
    // Confirm first
    if (!confirm("Are you sure you want to hide all SERVER- demo orders? This cannot be undone.")) {
        return;
    }
    
    try {
        // Show a loading toast
        showToast('Processing...', 'info');
        
        // Get all orders from the table
        const orderRows = document.querySelectorAll('#ordersTableBody tr');
        const serverOrderIds = [];
        
        // Find all server order IDs
        orderRows.forEach(row => {
            const orderIdCell = row.querySelector('td:first-child');
            if (orderIdCell && orderIdCell.textContent.includes('SERVER-')) {
                // Extract the order ID
                const orderId = orderIdCell.textContent.trim().replace('#ORD-', '');
                serverOrderIds.push(orderId);
            }
        });
        
        if (serverOrderIds.length === 0) {
            showToast('No server orders found to clear', 'info');
            return;
        }
        
        console.log(`Found ${serverOrderIds.length} server orders to clear`);
        
        // Store all these IDs in the deleted list
        const deletedServerOrders = JSON.parse(localStorage.getItem('deletedServerOrders') || '[]');
        let newCount = 0;
        
        serverOrderIds.forEach(id => {
            if (!deletedServerOrders.includes(id)) {
                deletedServerOrders.push(id);
                newCount++;
            }
        });
        
        localStorage.setItem('deletedServerOrders', JSON.stringify(deletedServerOrders));
        
        // Refresh the orders list
        await loadAllOrders();
        
        // Show success message
        showToast(`Cleared ${newCount} server demo orders`, 'success');
        
    } catch (error) {
        console.error('Error clearing server orders:', error);
        showToast(`Error: ${error.message}`, 'error');
    }
}

// Add a "Clear All Server Orders" button
function addClearServerOrdersButton() {
    // Check if button already exists
    if (document.getElementById('clearServerOrdersBtn')) {
        return;
    }
    
    const adminActions = document.querySelector('.admin-actions');
    if (adminActions) {
        const clearBtn = document.createElement('button');
        clearBtn.id = 'clearServerOrdersBtn';
        clearBtn.className = 'btn-clear-server';
        clearBtn.innerHTML = '<i class="fas fa-broom"></i> Clear Demo Orders';
        clearBtn.addEventListener('click', clearAllServerOrders);
        
        // Insert before logout button
        const logoutBtn = document.getElementById('adminLogoutBtn');
        if (logoutBtn) {
            adminActions.insertBefore(clearBtn, logoutBtn);
        } else {
            adminActions.appendChild(clearBtn);
        }
    }
}

// Add CSS for the Clear Server Orders button
function addClearButtonCSS() {
    const style = document.createElement('style');
    style.textContent = `
        .btn-clear-server {
            display: flex;
            align-items: center;
            gap: 8px;
            padding: 10px 15px;
            border-radius: 5px;
            border: none;
            font-weight: 500;
            cursor: pointer;
            transition: all 0.3s ease;
            background-color: #ff9800;
            color: white;
        }
        
        .btn-clear-server:hover {
            background-color: #f57c00;
            opacity: 0.95;
            transform: translateY(-2px);
        }
    `;
    document.head.appendChild(style);
}

// Update the document ready function to add our initialization
const originalDocReady = document.addEventListener;
document.addEventListener = function(event, callback) {
    if (event === 'DOMContentLoaded') {
        const enhancedCallback = function() {
            // Call the original callback
            callback.apply(this, arguments);
            
            // Add our enhancements
            setTimeout(() => {
                console.log('Adding server order management features');
                addClearButtonCSS();
                addClearServerOrdersButton();
                updateLoadAllOrdersFunction();
            }, 500);
        };
        
        // Call the original addEventListener with our enhanced callback
        return originalDocReady.call(this, event, enhancedCallback);
    } else {
        // For all other events, proceed normally
        return originalDocReady.apply(this, arguments);
    }
};

// Make the functions globally available
window.clearAllServerOrders = clearAllServerOrders;
window.addClearServerOrdersButton = addClearServerOrdersButton;

// New function to synchronize local orders with the server
async function syncLocalOrders() {
    console.log('Synchronizing local orders with server');
    
    try {
        // Get locally stored orders
        const localOrders = JSON.parse(localStorage.getItem('submittedOrders')) || [];
        
        // Filter to find orders that haven't been server confirmed
        const unconfirmedOrders = localOrders.filter(order => !order.serverConfirmed);
        
        if (unconfirmedOrders.length === 0) {
            console.log('No local orders to sync');
            return { success: true, synced: 0 };
        }
        
        console.log(`Found ${unconfirmedOrders.length} local orders to sync`);
        
        // Call the sync function
        const response = await window.apiUtils.callFunction('sync-local-orders', {
            method: 'POST',
            body: JSON.stringify({ orders: unconfirmedOrders })
        });
        
        if (response && response.success) {
            console.log(`Sync completed: ${response.results.successful} orders synced`);
            
            // Update local storage to mark orders as synced
            if (response.results.successful > 0) {
                const updatedLocalOrders = localOrders.map(order => {
                    const syncResult = response.results.details.find(detail => detail.id === order.id);
                    if (syncResult && syncResult.success) {
                        return { ...order, serverConfirmed: true };
                    }
                    return order;
                });
                
                localStorage.setItem('submittedOrders', JSON.stringify(updatedLocalOrders));
                console.log('Updated local storage after successful sync');
            }
            
            // Refresh orders list
            loadAllOrders();
            
            return {
                success: true,
                synced: response.results.successful,
                failed: response.results.failed
            };
        } else {
            console.error('Sync API returned error:', response);
            return { success: false, error: 'API returned error' };
        }
    } catch (error) {
        console.error('Error synchronizing local orders:', error);
        return { success: false, error: error.message };
    }
}

// Add functions to initialize and call functions - place this at end of file
document.addEventListener('DOMContentLoaded', function() {
    // Add sync button to admin interface
    const adminActions = document.querySelector('.admin-actions');
    if (adminActions) {
        const syncBtn = document.createElement('button');
        syncBtn.id = 'syncOrdersBtn';
        syncBtn.className = 'btn-sync';
        syncBtn.innerHTML = '<i class="fas fa-exchange-alt"></i> Sync Orders';
        syncBtn.addEventListener('click', async function() {
            const result = await syncLocalOrders();
            if (result.success) {
                showToast(`Sync completed: ${result.synced} orders synced`, 'success');
            } else {
                showToast(`Sync failed: ${result.error}`, 'error');
            }
        });
        
        // Insert before logout button
        const logoutBtn = document.getElementById('adminLogoutBtn');
        if (logoutBtn) {
            adminActions.insertBefore(syncBtn, logoutBtn);
        } else {
            adminActions.appendChild(syncBtn);
        }
    }
    
    // Add CSS for the Sync button
    const style = document.createElement('style');
    style.textContent = `
        .btn-sync {
            display: flex;
            align-items: center;
            gap: 8px;
            padding: 10px 15px;
            border-radius: 5px;
            border: none;
            font-weight: 500;
            cursor: pointer;
            transition: all 0.3s ease;
            background-color: #9C27B0;
            color: white;
        }
        
        .btn-sync:hover {
            background-color: #7B1FA2;
            opacity: 0.95;
            transform: translateY(-2px);
        }
        
        .btn-sync i {
            animation: pulse 2s infinite;
        }
        
        @keyframes pulse {
            0% { opacity: 0.5; }
            50% { opacity: 1; }
            100% { opacity: 0.5; }
        }
    `;
    document.head.appendChild(style);
    
    // Perform sync on load
    setTimeout(async () => {
        try {
            await syncLocalOrders();
        } catch (e) {
            console.error('Error during initial sync:', e);
        }
    }, 2000);
});

// Make sync function globally available
window.syncLocalOrders = syncLocalOrders;
window.loadAllOrders = loadAllOrders;
window.showToast = showToast;