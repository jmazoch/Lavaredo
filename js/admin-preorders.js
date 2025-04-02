/**
 * Admin Dashboard for Lavaredo Preorders
 * This script handles fetching, processing, and displaying order data from Google Sheets
 */

// Configuration
const CONFIG = {
    // Google Sheets API endpoint (update this with your actual URL)
    API_URL: 'https://script.google.com/macros/s/AKfycbzM_OOO2LIYgLl9RqdRJFVsayk1-h0uH-zKFDIn2tj92ODWCSXsOvxy9GdKDyldOaTM/exec',
    // Netlify Function fallback
    FALLBACK_URL: '/.netlify/functions/get-orders',
    // Refresh interval in milliseconds (5 minutes)
    REFRESH_INTERVAL: 300000,
    // Date format options
    DATE_FORMAT_OPTIONS: {
        year: 'numeric',
        month: 'short', 
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit'
    }
};

// Main dashboard controller
class DashboardController {
    constructor() {
        this.orders = [];
        this.filteredOrders = [];
        this.productSummary = {};
        this.ordersTableBody = document.getElementById('ordersTableBody');
        this.summaryContainer = document.getElementById('summarySections');
        this.errorMessageElement = document.getElementById('errorMessage');
        
        // Initialize the dashboard
        this.initialize();
    }
    
    // Set up the dashboard and event listeners
    initialize() {
        console.log('Initializing admin dashboard...');
        
        // Set up event listeners
        document.getElementById('refreshButton').addEventListener('click', () => this.loadData());
        document.getElementById('searchInput').addEventListener('input', () => this.filterOrders());
        document.getElementById('filterSelect').addEventListener('change', () => this.filterOrders());
        document.getElementById('exportCsvButton').addEventListener('click', () => this.exportToCsv());
        document.getElementById('toggleSummary').addEventListener('click', () => this.toggleSummarySection());
        
        // Load initial data
        this.loadData();
        
        // Set up auto-refresh
        setInterval(() => this.loadData(true), CONFIG.REFRESH_INTERVAL);
    }
    
    // Toggle summary section visibility
    toggleSummarySection() {
        const summaryContent = document.getElementById('summaryContent');
        if (summaryContent.style.display === 'none') {
            summaryContent.style.display = 'block';
        } else {
            summaryContent.style.display = 'none';
        }
    }
    
    // Fetch data from the API
    async loadData(silent = false) {
        if (!silent) {
            // Show loading spinner
            this.ordersTableBody.innerHTML = `
                <tr>
                    <td colspan="8" class="loading-spinner">
                        <div class="spinner-border text-primary" role="status">
                            <span class="visually-hidden">Loading...</span>
                        </div>
                    </td>
                </tr>
            `;
            
            document.getElementById('summarySpinner').style.display = 'flex';
        }
        
        try {
            // Get API URL from localStorage if available (allows user to configure)
            const savedApiUrl = localStorage.getItem('googleSheetsApiUrl');
            const apiUrl = savedApiUrl || CONFIG.API_URL;
            
            // Try to fetch data from Google Sheets via Apps Script
            console.log('Fetching orders from API:', apiUrl + '?action=getOrders');
            const response = await fetch(apiUrl + '?action=getOrders');
            
            if (!response.ok) {
                console.error(`API error: ${response.status} ${response.statusText}`);
                throw new Error(`API returned status ${response.status}`);
            }
            
            // Get the raw text for debugging
            const responseText = await response.text();
            console.log('API raw response:', responseText.substring(0, 200) + '...');
            
            // Try to parse as JSON
            let data;
            try {
                data = JSON.parse(responseText);
            } catch (e) {
                console.error('JSON parse error:', e);
                throw new Error('Invalid JSON from API');
            }
            
            // Check for unauthorized error - special handling for this case
            if (data.error === "Unauthorized access") {
                throw new Error('Unauthorized access to Google Sheets API. Please verify your deployment settings.');
            }
            
            console.log('Parsed API response:', data);
            
            // Check for rows data (or try to use the data directly if it's an array)
            let rows = data.rows;
            if (!rows) {
                if (Array.isArray(data)) {
                    console.log('API returned direct array, using that instead');
                    rows = data;
                } else {
                    console.error('No rows property found in API response');
                    throw new Error('Invalid data format from API');
                }
            }
            
            if (!Array.isArray(rows)) {
                console.error('Rows is not an array');
                throw new Error('Invalid data format from API');
            }
            
            console.log(`Fetched ${rows.length} orders from API`);
            
            // Process the orders
            this.orders = this.processOrderData(rows);
            this.filteredOrders = [...this.orders];
            
            // Hide error message if it was shown
            this.errorMessageElement.style.display = 'none';
            
            // Update the UI
            this.updateOrdersTable();
            this.updateSummarySection();
            this.updateStatCards();
            
        } catch (error) {
            console.error('Error loading data:', error);
            
            // Special handling for unauthorized errors
            if (error.message.includes('Unauthorized access')) {
                this.showError(`${error.message} <br><br>
                    <div style="text-align: left; background: #f8f8f8; padding: 10px; border-radius: 4px;">
                        <strong>How to fix:</strong><br>
                        1. Visit the <a href="test-sheets-api.html" target="_blank">API test page</a> to set up your Google Apps Script<br>
                        2. Make sure your script is deployed with "Anyone" access<br>
                        3. Check the deployment URL is correct
                    </div>`);
                
                // Show setup instructions
                this.ordersTableBody.innerHTML = `
                    <tr>
                        <td colspan="8" class="text-center">
                            <div style="padding: 20px;">
                                <h5>Google Sheets API Setup Required</h5>
                                <p>You need to properly set up the Google Apps Script to access your orders.</p>
                                <a href="test-sheets-api.html" class="btn btn-primary" target="_blank">
                                    Setup API Connection
                                </a>
                            </div>
                        </td>
                    </tr>
                `;
                
                document.getElementById('summarySpinner').style.display = 'none';
                this.summaryContainer.innerHTML = '';
                return;
            }
            
            // Try fallback method if available
            try {
                console.log('Trying fallback method...');
                const adminToken = `admin_${Date.now()}_${Math.random().toString(36).substring(2, 15)}`;
                
                const response = await fetch(CONFIG.FALLBACK_URL, {
                    headers: {
                        'Authorization': `Bearer ${adminToken}`
                    }
                });
                
                if (!response.ok) {
                    throw new Error(`Fallback API returned status ${response.status}`);
                }
                
                const data = await response.json();
                
                if (!data.orders || !Array.isArray(data.orders)) {
                    throw new Error('Invalid data format from fallback API');
                }
                
                console.log(`Fetched ${data.orders.length} orders from fallback API`);
                
                // Process the orders from fallback
                this.orders = data.orders;
                this.filteredOrders = [...this.orders];
                
                // Hide error message if it was shown
                this.errorMessageElement.style.display = 'none';
                
                // Update the UI
                this.updateOrdersTable();
                this.updateSummarySection();
                this.updateStatCards();
                
            } catch (fallbackError) {
                console.error('Fallback also failed:', fallbackError);
                if (!silent) {
                    this.showError(`Failed to load data: ${error.message}. Fallback also failed: ${fallbackError.message}`);
                    
                    // Show empty tables
                    this.ordersTableBody.innerHTML = `
                        <tr>
                            <td colspan="8" class="text-center">Failed to load orders. Please try again.</td>
                        </tr>
                    `;
                    
                    document.getElementById('summarySpinner').style.display = 'none';
                    this.summaryContainer.innerHTML = `
                        <div class="col-12">
                            <div class="alert alert-warning">Failed to load product summary data.</div>
                        </div>
                    `;
                }
            }
        }
    }
    
    // Process raw order data from the API
    processOrderData(rows) {
        console.log('Raw rows from API:', rows);
        
        return rows.map(row => {
            // Generate an ID if missing - your sheet doesn't have an ID column
            const generatedId = `ORD-${Date.now()}-${Math.floor(Math.random() * 10000)}`;
            
            // Parse Items JSON if it's a string
            let items = [];
            if (row.Items) {
                try {
                    items = typeof row.Items === 'string' ? JSON.parse(row.Items) : row.Items;
                    if (!Array.isArray(items)) {
                        items = [items]; // Convert to array if it's a single object
                    }
                } catch (e) {
                    console.warn('Error parsing Items JSON:', e);
                    items = [{ name: 'Unknown item', error: 'Invalid JSON' }];
                }
            }
            
            // Create standardized order object - match your sheet's column names
            return {
                id: row.ID || generatedId,
                customer: row.Name || 'Unknown',  // Your sheet has "Name" not "Customer"
                email: row.Email || '',
                phone: row.Phone || '',
                items: items,
                timestamp: row.Timestamp ? new Date(row.Timestamp) : new Date(),
                status: this.extractStatus(row.Items) || 'preordered'
            };
        });
    }
    
    // Extract status from Items field if available
    extractStatus(itemsStr) {
        if (!itemsStr) return null;
        
        try {
            // If itemsStr is already an object (parsed JSON)
            if (typeof itemsStr === 'object') {
                if (itemsStr.status) return itemsStr.status;
                if (itemsStr.metadata?.status) return itemsStr.metadata.status;
                return null;
            }
            
            // Try to parse as JSON if it's a string
            const data = JSON.parse(itemsStr);
            
            // Check various places where status might be stored
            if (data.status) return data.status;
            if (data.metadata?.status) return data.metadata.status;
            
            return null;
        } catch (e) {
            // Try regex as a fallback for string
            if (typeof itemsStr === 'string') {
                const statusMatch = /["`']?status["`']?\s*[:=]\s*["`']?([^"'`,}\]]+)/i.exec(itemsStr);
                return statusMatch ? statusMatch[1].trim().toLowerCase() : null;
            }
            return null;
        }
    }
    
    // Update the orders table with filtered orders
    updateOrdersTable() {
        if (this.filteredOrders.length === 0) {
            this.ordersTableBody.innerHTML = `
                <tr>
                    <td colspan="8" class="text-center">No orders found</td>
                </tr>
            `;
            return;
        }
        
        this.ordersTableBody.innerHTML = this.filteredOrders.map(order => `
            <tr>
                <td>${order.id}</td>
                <td>${this.escapeHtml(order.customer)}</td>
                <td>${this.escapeHtml(order.email)}</td>
                <td>${this.escapeHtml(order.phone)}</td>
                <td>${order.items ? order.items.length : 0}</td>
                <td>${order.timestamp.toLocaleString(undefined, CONFIG.DATE_FORMAT_OPTIONS)}</td>
                <td><span class="status-badge ${order.status}">${order.status}</span></td>
                <td>
                    <button class="btn btn-sm btn-outline-primary view-details" data-order-id="${order.id}">
                        <i class="fas fa-eye"></i> View
                    </button>
                </td>
            </tr>
        `).join('');
        
        // Add event listeners to view buttons
        document.querySelectorAll('.view-details').forEach(button => {
            button.addEventListener('click', (event) => {
                const orderId = event.currentTarget.getAttribute('data-order-id');
                this.showOrderDetails(orderId);
            });
        });
    }
    
    // Show order details in modal
    showOrderDetails(orderId) {
        const order = this.orders.find(o => o.id === orderId);
        if (!order) {
            console.error('Order not found:', orderId);
            return;
        }
        
        const modalTitle = document.getElementById('orderDetailModalLabel');
        const modalContent = document.getElementById('orderDetailContent');
        
        modalTitle.textContent = `Order: ${order.id}`;
        
        modalContent.innerHTML = `
            <div class="row mb-4">
                <div class="col-md-6">
                    <h6>Customer Information</h6>
                    <p><strong>Name:</strong> ${this.escapeHtml(order.customer)}</p>
                    <p><strong>Email:</strong> ${this.escapeHtml(order.email)}</p>
                    <p><strong>Phone:</strong> ${this.escapeHtml(order.phone)}</p>
                </div>
                <div class="col-md-6">
                    <h6>Order Information</h6>
                    <p><strong>Date:</strong> ${order.timestamp.toLocaleString(undefined, CONFIG.DATE_FORMAT_OPTIONS)}</p>
                    <p><strong>Status:</strong> <span class="status-badge ${order.status}">${order.status}</span></p>
                    <p><strong>Items:</strong> ${order.items ? order.items.length : 0}</p>
                </div>
            </div>
            
            <h6>Ordered Items</h6>
            <div class="table-responsive">
                <table class="table table-striped">
                    <thead>
                        <tr>
                            <th>#</th>
                            <th>Product</th>
                            <th>Gender</th>
                            <th>Size</th>
                        </tr>
                    </thead>
                    <tbody>
                        ${order.items && order.items.length ? order.items.map((item, index) => `
                            <tr>
                                <td>${index + 1}</td>
                                <td>${this.escapeHtml(item.name || 'Unknown')}</td>
                                <td>${this.escapeHtml(item.gender || 'Unisex')}</td>
                                <td>${this.escapeHtml(item.size || 'One Size')}</td>
                            </tr>
                        `).join('') : `
                            <tr>
                                <td colspan="4" class="text-center">No items found</td>
                            </tr>
                        `}
                    </tbody>
                </table>
            </div>
            
            <div class="mt-4">
                <h6>Raw JSON Data</h6>
                <div class="bg-light p-3 rounded">
                    <pre class="mb-0">${JSON.stringify(order.items, null, 2)}</pre>
                </div>
            </div>
        `;
        
        const modal = new bootstrap.Modal(document.getElementById('orderDetailModal'));
        modal.show();
    }
    
    // Update summary section with product counts
    updateSummarySection() {
        // Calculate product summary
        this.calculateProductSummary();
        
        // Hide spinner
        document.getElementById('summarySpinner').style.display = 'none';
        
        // Create summary cards
        const summaryByProduct = this.generateProductSummary();
        const summaryByGender = this.generateGenderSummary();
        const summaryBySize = this.generateSizeSummary();
        
        this.summaryContainer.innerHTML = `
            <div class="col-md-12 mb-4">
                <div class="card">
                    <div class="card-header">
                        <h5 class="mb-0">Overall Product Summary</h5>
                    </div>
                    <div class="card-body">
                        ${summaryByProduct}
                    </div>
                </div>
            </div>
            
            <div class="col-md-6 mb-4">
                <div class="card">
                    <div class="card-header">
                        <h5 class="mb-0">Summary by Gender</h5>
                    </div>
                    <div class="card-body">
                        ${summaryByGender}
                    </div>
                </div>
            </div>
            
            <div class="col-md-6 mb-4">
                <div class="card">
                    <div class="card-header">
                        <h5 class="mb-0">Summary by Size</h5>
                    </div>
                    <div class="card-body">
                        ${summaryBySize}
                    </div>
                </div>
            </div>
            
            <div class="col-md-12">
                <div class="card">
                    <div class="card-header">
                        <h5 class="mb-0">Detailed Product Summary</h5>
                    </div>
                    <div class="card-body table-responsive">
                        ${this.generateDetailedSummaryTable()}
                    </div>
                </div>
            </div>
        `;
    }
    
    // Calculate product summary based on all orders
    calculateProductSummary() {
        // Reset product summary
        this.productSummary = {};
        
        // Process all orders
        this.orders.forEach(order => {
            if (!order.items || !order.items.length) return;
            
            order.items.forEach(item => {
                const name = item.name || 'Unknown';
                const gender = item.gender || 'Unisex';
                const size = item.size || 'One Size';
                const key = `${name} - ${gender} - ${size}`;
                
                if (!this.productSummary[key]) {
                    this.productSummary[key] = {
                        name,
                        gender,
                        size,
                        count: 0
                    };
                }
                
                this.productSummary[key].count++;
            });
        });
    }
    
    // Generate HTML for product summary table
    generateProductSummary() {
        const products = {};
        
        // Count total by product name
        Object.values(this.productSummary).forEach(item => {
            if (!products[item.name]) {
                products[item.name] = 0;
            }
            products[item.name] += item.count;
        });
        
        // Convert to array and sort by count
        const sortedProducts = Object.entries(products)
            .map(([name, count]) => ({ name, count }))
            .sort((a, b) => b.count - a.count);
        
        // Calculate total
        const totalCount = sortedProducts.reduce((sum, item) => sum + item.count, 0);
        
        // Generate HTML table
        return `
            <div class="table-responsive">
                <table class="table product-summary-table">
                    <thead>
                        <tr>
                            <th>Product</th>
                            <th class="text-end">Count</th>
                            <th class="text-end">Percentage</th>
                        </tr>
                    </thead>
                    <tbody>
                        ${sortedProducts.map(item => `
                            <tr>
                                <td>${this.escapeHtml(item.name)}</td>
                                <td class="text-end">${item.count}</td>
                                <td class="text-end">${Math.round((item.count / totalCount) * 100)}%</td>
                            </tr>
                        `).join('')}
                        <tr class="total-summary">
                            <td>Total</td>
                            <td class="text-end">${totalCount}</td>
                            <td class="text-end">100%</td>
                        </tr>
                    </tbody>
                </table>
            </div>
        `;
    }
    
    // Generate HTML for gender summary table
    generateGenderSummary() {
        const genders = {};
        
        // Count total by gender
        Object.values(this.productSummary).forEach(item => {
            if (!genders[item.gender]) {
                genders[item.gender] = 0;
            }
            genders[item.gender] += item.count;
        });
        
        // Convert to array and sort by count
        const sortedGenders = Object.entries(genders)
            .map(([gender, count]) => ({ gender, count }))
            .sort((a, b) => b.count - a.count);
        
        // Calculate total
        const totalCount = sortedGenders.reduce((sum, item) => sum + item.count, 0);
        
        // Generate HTML table
        return `
            <div class="table-responsive">
                <table class="table product-summary-table">
                    <thead>
                        <tr>
                            <th>Gender</th>
                            <th class="text-end">Count</th>
                            <th class="text-end">Percentage</th>
                        </tr>
                    </thead>
                    <tbody>
                        ${sortedGenders.map(item => `
                            <tr>
                                <td>${this.escapeHtml(item.gender)}</td>
                                <td class="text-end">${item.count}</td>
                                <td class="text-end">${Math.round((item.count / totalCount) * 100)}%</td>
                            </tr>
                        `).join('')}
                        <tr class="total-summary">
                            <td>Total</td>
                            <td class="text-end">${totalCount}</td>
                            <td class="text-end">100%</td>
                        </tr>
                    </tbody>
                </table>
            </div>
        `;
    }
    
    // Generate HTML for size summary table
    generateSizeSummary() {
        const sizes = {};
        
        // Count total by size
        Object.values(this.productSummary).forEach(item => {
            if (!sizes[item.size]) {
                sizes[item.size] = 0;
            }
            sizes[item.size] += item.count;
        });
        
        // Convert to array and sort by count
        const sortedSizes = Object.entries(sizes)
            .map(([size, count]) => ({ size, count }))
            .sort((a, b) => b.count - a.count);
        
        // Calculate total
        const totalCount = sortedSizes.reduce((sum, item) => sum + item.count, 0);
        
        // Generate HTML table
        return `
            <div class="table-responsive">
                <table class="table product-summary-table">
                    <thead>
                        <tr>
                            <th>Size</th>
                            <th class="text-end">Count</th>
                            <th class="text-end">Percentage</th>
                        </tr>
                    </thead>
                    <tbody>
                        ${sortedSizes.map(item => `
                            <tr>
                                <td>${this.escapeHtml(item.size)}</td>
                                <td class="text-end">${item.count}</td>
                                <td class="text-end">${Math.round((item.count / totalCount) * 100)}%</td>
                            </tr>
                        `).join('')}
                        <tr class="total-summary">
                            <td>Total</td>
                            <td class="text-end">${totalCount}</td>
                            <td class="text-end">100%</td>
                        </tr>
                    </tbody>
                </table>
            </div>
        `;
    }
    
    // Generate detailed summary table with all combinations
    generateDetailedSummaryTable() {
        // Convert to array and sort by count
        const sortedItems = Object.values(this.productSummary)
            .sort((a, b) => {
                // Sort by name first
                if (a.name !== b.name) return a.name.localeCompare(b.name);
                // Then by gender
                if (a.gender !== b.gender) return a.gender.localeCompare(b.gender);
                // Then by size
                return a.size.localeCompare(b.size);
            });
        
        // Calculate total
        const totalCount = sortedItems.reduce((sum, item) => sum + item.count, 0);
        
        // Generate HTML table
        return `
            <table class="table table-striped product-summary-table">
                <thead>
                    <tr>
                        <th>Product</th>
                        <th>Gender</th>
                        <th>Size</th>
                        <th class="text-end">Count</th>
                    </tr>
                </thead>
                <tbody>
                    ${sortedItems.map(item => `
                        <tr>
                            <td>${this.escapeHtml(item.name)}</td>
                            <td>${this.escapeHtml(item.gender)}</td>
                            <td>${this.escapeHtml(item.size)}</td>
                            <td class="text-end">${item.count}</td>
                        </tr>
                    `).join('')}
                    <tr class="total-summary">
                        <td colspan="3">Total</td>
                        <td class="text-end">${totalCount}</td>
                    </tr>
                </tbody>
            </table>
        `;
    }
    
    // Update stat cards
    updateStatCards() {
        const totalOrdersElement = document.getElementById('totalOrdersCount');
        const totalProductsElement = document.getElementById('totalProductsCount');
        const lastOrderTimeElement = document.getElementById('lastOrderTime');
        
        // Count orders
        totalOrdersElement.textContent = this.orders.length;
        
        // Count total products
        const totalProducts = this.orders.reduce((sum, order) => {
            return sum + (order.items ? order.items.length : 0);
        }, 0);
        totalProductsElement.textContent = totalProducts;
        
        // Find last order
        if (this.orders.length > 0) {
            // Sort by timestamp descending
            const sortedOrders = [...this.orders].sort((a, b) => b.timestamp - a.timestamp);
            const lastOrder = sortedOrders[0];
            lastOrderTimeElement.textContent = lastOrder.timestamp.toLocaleString(undefined, CONFIG.DATE_FORMAT_OPTIONS);
        } else {
            lastOrderTimeElement.textContent = 'No orders yet';
        }
    }
    
    // Filter orders based on search and filter criteria
    filterOrders() {
        const searchTerm = document.getElementById('searchInput').value.toLowerCase();
        const filterValue = document.getElementById('filterSelect').value;
        
        this.filteredOrders = this.orders.filter(order => {
            // Filter by status
            if (filterValue !== 'all' && order.status !== filterValue) {
                return false;
            }
            
            // Filter by search term
            if (searchTerm) {
                const searchFields = [
                    order.id,
                    order.customer,
                    order.email,
                    order.phone
                ];
                
                // Also search in item names
                if (order.items && order.items.length) {
                    order.items.forEach(item => {
                        if (item.name) searchFields.push(item.name);
                    });
                }
                
                return searchFields.some(field => 
                    field && field.toString().toLowerCase().includes(searchTerm)
                );
            }
            
            return true;
        });
        
        this.updateOrdersTable();
    }
    
    // Display error message
    showError(message) {
        this.errorMessageElement.innerHTML = message;
        this.errorMessageElement.style.display = 'block';
    }
    
    // Export orders and summary to CSV
    exportToCsv() {
        // Create orders CSV
        const ordersHeaders = ['Order ID', 'Customer', 'Email', 'Phone', 'Items Count', 'Date', 'Status'];
        const ordersRows = this.orders.map(order => [
            order.id,
            order.customer.replace(/,/g, ' '), // Escape commas
            order.email.replace(/,/g, ' '),
            order.phone.replace(/,/g, ' '),
            order.items ? order.items.length : 0,
            order.timestamp.toLocaleString(),
            order.status
        ]);
        
        const ordersCsv = this.generateCsvContent([ordersHeaders, ...ordersRows]);
        this.downloadCsv('lavaredo_orders.csv', ordersCsv);
        
        // Create summary CSV
        const summaryHeaders = ['Product', 'Gender', 'Size', 'Count'];
        const summaryRows = Object.values(this.productSummary).map(item => [
            item.name.replace(/,/g, ' '),
            item.gender.replace(/,/g, ' '),
            item.size.replace(/,/g, ' '),
            item.count
        ]);
        
        const summaryCsv = this.generateCsvContent([summaryHeaders, ...summaryRows]);
        this.downloadCsv('lavaredo_summary.csv', summaryCsv);
    }
    
    // Generate CSV content from data
    generateCsvContent(rows) {
        return rows.map(row => 
            row.map(cell => 
                typeof cell === 'string' ? `"${cell.replace(/"/g, '""')}"` : cell
            ).join(',')
        ).join('\n');
    }
    
    // Download CSV file
    downloadCsv(filename, content) {
        const blob = new Blob([content], { type: 'text/csv;charset=utf-8;' });
        const link = document.createElement('a');
        
        if (navigator.msSaveBlob) { // IE 10+
            navigator.msSaveBlob(blob, filename);
        } else {
            const url = URL.createObjectURL(blob);
            link.href = url;
            link.download = filename;
            document.body.appendChild(link);
            link.click();
            document.body.removeChild(link);
        }
    }
    
    // Helper to escape HTML in strings
    escapeHtml(text) {
        if (text === null || text === undefined) return '';
        const div = document.createElement('div');
        div.textContent = text;
        return div.innerHTML;
    }
}

// Initialize the dashboard when the DOM is ready
document.addEventListener('DOMContentLoaded', () => {
    new DashboardController();
});
