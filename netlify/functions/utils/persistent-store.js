/**
 * Persistent storage utility for Netlify Functions
 * Enhanced with more detailed logging and fallbacks
 */

const fs = require('fs');
const path = require('path');

// Define multiple potential storage paths with fallbacks
const STORAGE_PATHS = [
    '/tmp',
    './.netlify/data', // Some Netlify configs might use this
    './.netlify/temp', // Another possible location
    path.join(__dirname, '../../../.data') // Local development fallback
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
    // Always update in-memory store
    MEMORY_STORE.orders = [...data];
    console.log(`In-memory store updated with ${data.length} orders`);
    
    // Attempt to save to file system if we have a storage directory
    if (STORAGE_DIR) {
        try {
            const filePath = path.join(STORAGE_DIR, ORDERS_FILE);
            const jsonData = JSON.stringify(data);
            
            // Log key information about what we're saving - FIX THE SYNTAX ERROR HERE
            console.log(`Saving ${data.length} orders to ${filePath}, data size: ${jsonData.length} bytes`);
            
            fs.writeFileSync(filePath, jsonData);
            
            // Verify the file was saved correctly
            if (fs.existsSync(filePath)) {
                const stats = fs.statSync(filePath);
                console.log(`Save successful. File size: ${stats.size} bytes`);
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
    // Try to load from file system first
    if (STORAGE_DIR) {
        try {
            const filePath = path.join(STORAGE_DIR, ORDERS_FILE);
            
            console.log(`Attempting to load orders from ${filePath}`);
            
            if (fs.existsSync(filePath)) {
                const stats = fs.statSync(filePath);
                console.log(`Found orders file. Size: ${stats.size} bytes, Modified: ${stats.mtime}`);
                
                const data = fs.readFileSync(filePath, 'utf8');
                
                if (!data || data.trim() === '') {
                    console.log('Orders file is empty, returning empty array');
                    return [];
                }
                
                const orders = JSON.parse(data);
                console.log(`Successfully parsed ${orders.length} orders from file`);
                
                // Update memory store
                MEMORY_STORE.orders = [...orders];
                
                return orders;
            } else {
                console.log('Orders file does not exist, returning empty array');
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
    return MEMORY_STORE.orders;
};

/**
 * Add a single order to storage
 * @param {Object} order - The order to add
 * @returns {Boolean} Success status
 */
exports.addOrder = function(order) {
  const orders = this.loadOrders();
  // Check if order with this ID already exists
  const exists = orders.some(o => o.id === order.id);
  
  if (!exists) {
    orders.push(order);
    return this.saveOrders(orders);
  }
  return false;
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
