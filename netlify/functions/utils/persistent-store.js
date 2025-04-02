/**
 * Persistent storage utility for Netlify Functions
 */

const fs = require('fs');
const path = require('path');

// Define multiple potential storage paths with fallbacks
const STORAGE_PATHS = [
    '/tmp',
    './.netlify/tmp',
    './.netlify/data',
    path.join(__dirname, '../../../.tmp'),
    path.join(__dirname, '../../../.data')
];
const ORDERS_FILE = 'orders.json';
const MEMORY_STORE = { orders: [] }; // In-memory fallback

/**
 * Finds the first writable storage directory
 */
function findWritableStorageDir() {
    for (const dir of STORAGE_PATHS) {
        try {
            if (!fs.existsSync(dir)) {
                fs.mkdirSync(dir, { recursive: true });
            }
            
            // Test if we can write to this directory
            const testFile = path.join(dir, '.write-test');
            fs.writeFileSync(testFile, 'test');
            fs.unlinkSync(testFile);
            
            console.log(`Found writable storage directory: ${dir}`);
            return dir;
        } catch (error) {
            console.log(`Directory ${dir} is not writable: ${error.message}`);
        }
    }
    
    console.warn('No writable directory found, using in-memory storage only');
    return null;
}

// Find writable directory at module load time
const STORAGE_DIR = findWritableStorageDir();

/**
 * Save data to a file with better error handling
 * @param {Array} data - The data to save
 */
exports.saveOrders = function(data) {
    // Always update in-memory store first
    MEMORY_STORE.orders = [...data];
    console.log(`In-memory store updated with ${data.length} orders`);
    
    // Attempt to save to file system if we have a storage directory
    if (STORAGE_DIR) {
        try {
            const filePath = path.join(STORAGE_DIR, ORDERS_FILE);
            const jsonData = JSON.stringify(data);
            
            // Log key information about what we're saving
            console.log(`Saving ${data.length} orders to ${filePath}, data size: ${jsonData.length} bytes`);
            
            // Write to file
            fs.writeFileSync(filePath, jsonData);
            
            // Double-check the file was created
            if (fs.existsSync(filePath)) {
                const stats = fs.statSync(filePath);
                console.log(`Save successful. File size: ${stats.size} bytes`);
                
                // List directory contents for debugging
                try {
                    const dirContents = fs.readdirSync(STORAGE_DIR);
                    console.log(`Directory ${STORAGE_DIR} contents: ${dirContents.join(', ')}`);
                } catch (e) {
                    console.error(`Error listing directory: ${e.message}`);
                }
                
                return true;
            } else {
                console.error('File does not exist after save attempt');
                return false;
            }
        } catch (error) {
            console.error('Error saving to persistent storage:', error);
            return false;
        }
    } else {
        console.log('Using in-memory storage only (no filesystem available)');
        return false;
    }
};

/**
 * Load data from file with enhanced error handling
 * @returns {Array} The loaded data
 */
exports.loadOrders = function() {
    console.log('loadOrders called, storage dir:', STORAGE_DIR);
    
    // Try to load from file system first
    if (STORAGE_DIR) {
        try {
            const filePath = path.join(STORAGE_DIR, ORDERS_FILE);
            
            console.log(`Attempting to load orders from ${filePath}`);
            
            // First check if file exists
            if (fs.existsSync(filePath)) {
                const stats = fs.statSync(filePath);
                console.log(`Found orders file. Size: ${stats.size} bytes, Modified: ${stats.mtime}`);
                
                // Read the file
                const data = fs.readFileSync(filePath, 'utf8');
                
                if (!data || data.trim() === '') {
                    console.log('Orders file is empty, returning empty array');
                    return [];
                }
                
                // Try to parse the JSON
                try {
                    const orders = JSON.parse(data);
                    console.log(`Successfully parsed ${orders.length} orders from file`);
                    
                    // Update memory store
                    MEMORY_STORE.orders = [...orders];
                    
                    return orders;
                } catch (parseError) {
                    console.error(`Failed to parse orders JSON: ${parseError.message}`);
                    // Continue to fallback
                }
            } else {
                console.log('Orders file does not exist, returning empty array');
                
                // Create an empty file for future use
                try {
                    fs.writeFileSync(filePath, '[]');
                    console.log(`Created empty orders file at ${filePath}`);
                } catch (writeError) {
                    console.error(`Failed to create empty orders file: ${writeError.message}`);
                }
                
                return [];
            }
        } catch (error) {
            console.error('Error loading from persistent storage:', error);
            console.log('Falling back to in-memory store');
        }
    } else {
        console.log('No storage directory available, using in-memory store');
    }
    
    // Fall back to in-memory store
    console.log(`Falling back to memory store with ${MEMORY_STORE.orders.length} orders`);
    return MEMORY_STORE.orders;
};

/**
 * Add a single order to storage
 * This is a more direct approach that doesn't require loading all orders first
 */
exports.addOrder = function(order) {
    if (!order || !order.id) {
        console.log('Cannot add invalid order');
        return false;
    }
    
    console.log(`Direct addOrder called for ${order.id}`);
    
    // Always update in-memory store
    const memoryOrders = MEMORY_STORE.orders.filter(o => o.id !== order.id);
    memoryOrders.push(order);
    MEMORY_STORE.orders = memoryOrders;
    
    // Try to write to file system if available
    if (!STORAGE_DIR) {
        return false;
    }
    
    try {
        const filePath = path.join(STORAGE_DIR, ORDERS_FILE);
        
        // Read existing orders or start with empty array
        let orders = [];
        try {
            if (fs.existsSync(filePath)) {
                const data = fs.readFileSync(filePath, 'utf8');
                if (data && data.trim() !== '') {
                    orders = JSON.parse(data);
                }
            }
        } catch (readError) {
            console.error(`Error reading orders file: ${readError.message}`);
        }
        
        // Filter out any existing order with same ID
        orders = orders.filter(o => o.id !== order.id);
        
        // Add the new order
        orders.push(order);
        
        // Write back to file
        fs.writeFileSync(filePath, JSON.stringify(orders));
        console.log(`Direct save of order ${order.id} successful`);
        
        return true;
    } catch (error) {
        console.error(`Error in direct order save: ${error.message}`);
        return false;
    }
};

/**
 * Delete an order from storage
 * @param {String} orderId - The ID of the order to delete
 * @returns {Boolean} Success status
 */
exports.deleteOrder = function(orderId) {
  const orders = this.loadOrders();
  const initialCount = orders.length;
  const filteredOrders = orders.filter(order => order.id !== orderId);
  
  if (filteredOrders.length !== initialCount) {
    return this.saveOrders(filteredOrders);
  }
  return false;
};

/**
 * Find an order by ID
 * @param {String} orderId - The ID of the order to find
 * @returns {Object|null} The order or null if not found
 */
exports.findOrder = function(orderId) {
  const orders = this.loadOrders();
  return orders.find(order => order.id === orderId) || null;
};

/**
 * Update an order's status
 * @param {String} orderId - The ID of the order to update
 * @param {String} status - The new status
 * @returns {Boolean} Success status
 */
exports.updateOrderStatus = function(orderId, status) {
  const orders = this.loadOrders();
  const order = orders.find(order => order.id === orderId);
  
  if (order) {
    order.status = status;
    return this.saveOrders(orders);
  }
  return false;
};

/**
 * Clear all orders from storage
 * @returns {Boolean} Success status
 */
exports.clearOrders = function() {
  return this.saveOrders([]);
};

// Add diagnostic function 
exports.getStorageInfo = function() {
    const info = {
        storageLocation: STORAGE_DIR || 'In-memory only',
        writable: Boolean(STORAGE_DIR),
        inMemoryOrderCount: MEMORY_STORE.orders.length
    };
    
    // Add file info if available
    if (STORAGE_DIR) {
        const filePath = path.join(STORAGE_DIR, ORDERS_FILE);
        if (fs.existsSync(filePath)) {
            const stats = fs.statSync(filePath);
            info.fileExists = true;
            info.fileSize = stats.size;
            info.lastModified = stats.mtime;
        } else {
            info.fileExists = false;
        }
    }
    
    return info;
};

// Export in-memory store for direct access in extreme cases
exports.MEMORY_STORE = MEMORY_STORE;
