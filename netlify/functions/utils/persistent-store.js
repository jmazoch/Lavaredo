/**
 * Persistent storage utility for Netlify Functions
 * Allows data to be stored in environment variables between function executions
 */

const fs = require('fs');
const path = require('path');

// Define a storage path in /tmp which is writable in Netlify Functions
const STORAGE_PATH = '/tmp';
const ORDERS_FILE = path.join(STORAGE_PATH, 'orders.json');

/**
 * Ensures the storage directory exists
 */
function ensureStorageDir() {
  try {
    if (!fs.existsSync(STORAGE_PATH)) {
      fs.mkdirSync(STORAGE_PATH, { recursive: true });
    }
  } catch (error) {
    console.error('Error creating storage directory:', error);
  }
}

/**
 * Save data to a file
 * @param {Array} data - The data to save
 */
exports.saveOrders = function(data) {
  try {
    ensureStorageDir();
    fs.writeFileSync(ORDERS_FILE, JSON.stringify(data));
    console.log(`Saved ${data.length} orders to persistent storage`);
    return true;
  } catch (error) {
    console.error('Error saving to persistent storage:', error);
    return false;
  }
};

/**
 * Load data from file
 * @returns {Array} The loaded data
 */
exports.loadOrders = function() {
  try {
    ensureStorageDir();
    if (fs.existsSync(ORDERS_FILE)) {
      const data = fs.readFileSync(ORDERS_FILE, 'utf8');
      const orders = JSON.parse(data);
      console.log(`Loaded ${orders.length} orders from persistent storage`);
      return orders;
    }
  } catch (error) {
    console.error('Error loading from persistent storage:', error);
  }
  return [];
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
