// Add debug logging at the top
console.log('Admin.js loaded');

/**
 * Admin functionality
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
            alert('Orders refreshed');
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

// Load orders from both serverless function and localStorage with improved error handling
async function loadAllOrders() {
    console.log('Loading all orders from both server and localStorage');
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
        
        // Attempt to fetch orders from Netlify function
        let serverOrders = [];
        const serverFetchFailed = { failed: false, reason: '' };
        
        try {
            const adminToken = sessionStorage.getItem('adminToken') || 'admin_token';
            
            // Debug information
            console.log('Current URL:', window.location.href);
            console.log('Hostname:', window.location.hostname);
            console.log('Is local:', window.location.hostname.includes('localhost') || window.location.hostname.includes('127.0.0.1'));
            
            // Try different function paths based on environment
            const functionUrls = [
                '/.netlify/functions/admin-orders',
                '/api/admin-orders'
            ];
            
            let response = null;
            let fetchError = null;
            
            console.log('Attempting to fetch server orders...');
            
            // Try each URL until one works
            for (const url of functionUrls) {
                try {
                    console.log(`Trying URL: ${url}`);
                    const controller = new AbortController();
                    const timeoutId = setTimeout(() => controller.abort(), 5000); // 5 second timeout
                    
                    response = await fetch(url, {
                        method: 'GET',
                        headers: {
                            'Authorization': `Bearer ${adminToken}`,
                            'Content-Type': 'application/json'
                        },
                        signal: controller.signal
                    });
                    
                    clearTimeout(timeoutId);
                    
                    console.log(`Response from ${url}:`, response.status);
                    
                    if (response.ok) {
                        console.log('Successful response received!');
                        break; // Exit loop on successful response
                    } else {
                        fetchError = `Status: ${response.status}`;
                        console.warn(`Failed with ${fetchError}`);
                    }
                } catch (err) {
                    console.warn(`Fetch error for ${url}:`, err);
                    fetchError = err.message;
                }
            }
            
            // If we have a good response, process it
            if (response && response.ok) {
                const result = await response.json();
                console.log('API response:', result);
                
                if (result.orders) {
                    serverOrders = result.orders;
                    console.log(`✅ Successfully fetched ${serverOrders.length} orders from server`);
                }
            } else {
                serverFetchFailed.failed = true;
                serverFetchFailed.reason = fetchError || 'Unknown error';
                throw new Error(serverFetchFailed.reason);
            }
        } catch (apiError) {
            console.error('API fetch error:', apiError);
            serverFetchFailed.failed = true;
            serverFetchFailed.reason = apiError.message || 'Network error';
        }
        
        // Get local orders from localStorage
        const localOrders = JSON.parse(localStorage.getItem('submittedOrders')) || [];
        console.log(`Found ${localOrders.length} orders in localStorage`);
        
        // Create test order in localStorage if none exist
        if (localOrders.length === 0) {
            const testOrder = {
                id: "LOCAL-" + Date.now().toString().substring(8),
                customer: "LOCAL TEST ORDER",
                email: "local@test.com",
                phone: "+420 TEST LOCAL",
                date: new Date().toISOString(),
                timestamp: Date.now(),
                items: [
                    { name: "Local Test Jersey", gender: "Test", size: "TEST" }
                ],
                status: "local-test",
                source: "local-test"
            };
            localOrders.push(testOrder);
            localStorage.setItem('submittedOrders', JSON.stringify(localOrders));
            console.log('Created test order in localStorage');
        }
        
        // Combine server and local orders using a Map to deduplicate
        const orderMap = new Map();
        
        // Add server orders to map
        serverOrders.forEach(order => {
            orderMap.set(String(order.id), {
                ...order,
                source: order.source || 'server'
            });
        });
        
        // Add local orders to map (will overwrite server orders with same ID)
        localOrders.forEach(order => {
            if (!orderMap.has(String(order.id))) {
                orderMap.set(String(order.id), {
                    ...order,
                    source: order.source || 'local'
                });
            }
        });
        
        // Convert map back to array
        const allOrders = Array.from(orderMap.values());
        console.log(`Combined total: ${allOrders.length} orders`);
        
        // Clear loading indicator
        ordersTableBody.innerHTML = '';
        
        // Show server fetch error if applicable
        if (serverFetchFailed.failed) {
            const errorRow = document.createElement('tr');
            errorRow.innerHTML = `
                <td colspan="6" class="server-error-message">
                    ⚠️ Server connection failed: ${serverFetchFailed.reason}
                    <br>Showing local orders only
                    <br><small>If you've just deployed the site, the functions may need a few minutes to activate.</small>
                </td>
            `;
            ordersTableBody.appendChild(errorRow);
        }
        
        if (allOrders.length === 0) {
            // Show no orders message
            ordersTableBody.innerHTML = `
                <tr>
                    <td colspan="6" class="no-orders-message">No orders have been submitted yet</td>
                </tr>
            `;
            return;
        }
        
        // Sort orders by timestamp (newest first)
        allOrders.sort((a, b) => {
            return (b.timestamp || 0) - (a.timestamp || 0);
        });
        
        // Add each order to the table
        allOrders.forEach(order => {
            const row = document.createElement('tr');
            
            // Generate a short ID if needed
            const shortId = order.id ? (typeof order.id === 'string' ? order.id.substring(0, 8) : order.id) : Math.floor(1000 + Math.random() * 9000);
            
            // Determine status class
            let statusClass = order.status || 'preordered';
            
            // Highlight the source for debugging
            const sourceClass = order.source === 'server' || order.source === 'server-test' ? 'server-source' : 'local-source';
            
            row.innerHTML = `
                <td class="${sourceClass}">#ORD-${shortId}</td>
                <td>${order.customer || 'Unknown'}</td>
                <td>${order.date ? new Date(order.date).toLocaleDateString() : 'N/A'}</td>
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
        
        // Add CSS to highlight sources
        const styleEl = document.createElement('style');
        styleEl.textContent = `
            .server-source { position: relative; }
            .server-source:after { 
                content: "Server"; 
                position: absolute; 
                top: 0; 
                right: 0;
                font-size: 8px; 
                background: #4a90e2; 
                color: white; 
                padding: 2px 4px;
                border-radius: 3px;
            }
            .local-source { position: relative; }
            .local-source:after { 
                content: "Local"; 
                position: absolute; 
                top: 0; 
                right: 0;
                font-size: 8px; 
                background: #888; 
                color: white; 
                padding: 2px 4px;
                border-radius: 3px;
            }
            .server-error-message {
                background-color: #fff3cd;
                color: #856404;
                padding: 15px;
                text-align: center;
            }
        `;
        document.head.appendChild(styleEl);
        
    } catch (error) {
        console.error('Error loading orders:', error);
        ordersTableBody.innerHTML = `
            <tr>
                <td colspan="6" class="error-message">Error loading orders: ${error.message}</td>
            </tr>
        `;
    }
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
                parentStatusOptions.querySelectorAll('.btn-status').forEach(b => {
                    b.classList.remove('active');
                });
                this.classList.add('active');
            }
        });
    });
}

// Add better handling for viewing server orders
function viewOrder(orderId) {
    console.log('Viewing order:', orderId);
    
    // Check both local and server orders
    const submittedOrders = JSON.parse(localStorage.getItem('submittedOrders')) || [];
    let order = submittedOrders.find(order => order.id == orderId);
    
    // If order is not in localStorage, it might be a server-only order
    if (!order) {
        // Try to fetch from server if not found locally
        const isServerOrder = orderId.toString().includes('SERVER-');
        
        if (isServerOrder) {
            alert('This order exists only on the server and full details may not be available.');
            // You could implement a server fetch for individual orders here
        } else {
            alert('Order not found');
            return;
        }
    }
    
    // Get the modal elements
    const orderModal = document.getElementById('orderModal');
    const orderDetails = document.getElementById('orderDetails');
    
    if (!orderModal || !orderDetails) {
        console.error('Order modal elements not found');
        return;
    }
    
    // Format the order date
    const orderDate = new Date(order.date);
    const formattedDate = orderDate.toLocaleDateString('en-US', {
        year: 'numeric', 
        month: 'long', 
        day: 'numeric'
    });
    
    // Build the HTML for order details
    let detailsHTML = `
        <div class="order-detail-header">
            <div class="order-info">
                <p><strong>Order ID:</strong> #ORD-${order.id}</p>
                <p><strong>Date:</strong> ${formattedDate}</p>
                <p><strong>Status:</strong> <span class="status-badge ${order.status || 'preordered'}">${order.status || 'Preordered'}</span></p>
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
    
    // Add each ordered item
    if (order.items && order.items.length > 0) {
        // Group items to calculate quantities
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
            <div class="order-status-options">
                <h4>Update Order Status:</h4>
                <div class="modal-status-buttons">
                    <button class="btn-status ${order.status === 'preordered' ? 'active' : ''}" data-id="${order.id}" data-status="preordered">Preordered</button>
                    <button class="btn-status ${order.status === 'added' ? 'active' : ''}" data-id="${order.id}" data-status="added">Added in Order</button>
                    <button class="btn-status ${order.status === 'paid' ? 'active' : ''}" data-id="${order.id}" data-status="paid">Paid</button>
                </div>
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

// Update order status on both localStorage and server
async function updateOrderStatus(orderId, status) {
    console.log('Updating order status:', orderId, status);
    
    try {
        // Update in localStorage first
        const submittedOrders = JSON.parse(localStorage.getItem('submittedOrders')) || [];
        const orderIndex = submittedOrders.findIndex(order => order.id == orderId);
        
        if (orderIndex !== -1) {
            submittedOrders[orderIndex].status = status;
            localStorage.setItem('submittedOrders', JSON.stringify(submittedOrders));
            console.log('Order status updated in localStorage');
        }
        
        // Try to update on server as well
        try {
            const adminToken = sessionStorage.getItem('adminToken') || 'admin_token';
            const response = await fetch('/.netlify/functions/update-order', {
                method: 'POST',
                headers: {
                    'Authorization': `Bearer ${adminToken}`,
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({
                    orderId: orderId,
                    status: status
                })
            });
            
            if (response.ok) {
                console.log('Order status updated on server');
            } else {
                console.warn('Server update failed, but local update succeeded');
            }
        } catch (apiError) {
            console.error('API error during status update:', apiError);
        }
        
        // Refresh the orders table
        setTimeout(() => loadAllOrders(), 500);
        
    } catch (error) {
        console.error('Error updating order status:', error);
        alert('Error updating order status: ' + error.message);
    }
}

function editOrder(orderId) {
    // Implementation will be added later
    console.log('Editing order:', orderId);
    alert('Order editing will be available in a future update');
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
    link.setAttribute('href', encodedUri);
    link.setAttribute('download', 'lavaredo-orders.csv');
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
}

// Make initialization function available globally
window.initAdminDashboard = initAdminDashboard;
