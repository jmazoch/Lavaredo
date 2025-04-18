/**
 * Order database handler with persistent storage
 */
const persistentStore = require('./persistent-store');

// In-memory cache of orders (for faster access)
let ordersCache = null;

/**
 * Reset the cache to force a fresh load from persistent storage
 */
exports.resetCache = function() {
  console.log('Resetting order cache - next access will load from persistent storage');
  ordersCache = null;
};

/**
 * Get all orders, combining persistent storage with in-memory cache
 * @returns {Array} All orders
 */
function getAllOrdersInternal() {
  if (!ordersCache) {
    // Load from persistent storage on first access
    ordersCache = persistentStore.loadOrders();
    console.log(`Loaded ${ordersCache.length} orders into cache from persistent storage`);
  }
  return ordersCache;
}

/**
 * Save orders to both cache and persistent storage
 * @param {Array} orders - The orders to save
 */
function saveOrdersInternal(orders) {
  ordersCache = orders; // Update cache
  return persistentStore.saveOrders(orders); // Save to persistent storage
}

/**
 * Add an order to the database
 * @param {Object} order - The order data
 * @returns {Object} The saved order with ID
 */
exports.saveOrder = function(order) {
  // Log the operation for debugging
  console.log(`Attempting to save order: ${order.id}`);
  
  // Ensure order has an ID and timestamp
  if (!order.id) {
    order.id = `ORD-${Date.now()}-${Math.floor(1000 + Math.random() * 9000)}`;
  }
  
  if (!order.timestamp) {
    order.timestamp = Date.now();
  }
  
  if (!order.date) {
    order.date = new Date().toISOString();
  }
  
  // Add source property if not set
  if (!order.source) {
    order.source = 'api';
  }
  
  // Get existing orders
  const orders = getAllOrdersInternal();
  
  // Make sure we don't add duplicate orders
  if (!orders.some(o => o.id === order.id)) {
    // Add the order to our database
    orders.push(order);
    const saveResult = saveOrdersInternal(orders);
    console.log(`Order saved to database: ${order.id}, save result: ${saveResult}`);
    
    // Also directly save to persistent store as a backup method
    try {
      persistentStore.addOrder(order);
      console.log(`Order also directly saved to persistent store: ${order.id}`);
    } catch (err) {
      console.error(`Failed direct save to persistent store: ${err.message}`);
    }
  } else {
    console.log(`Order ${order.id} already exists in database`);
  }
  
  // Log the current number of orders for debugging
  console.log(`Database now contains ${orders.length} orders`);
  
  return order;
};

/**
 * Get all orders from the database
 * @returns {Array} All orders
 */
exports.getAllOrders = function() {
  // Log the call for debugging
  console.log('getAllOrders called');
  
  // Force a reset of the cache to ensure fresh data
  ordersCache = null;
  
  // Get orders from persistent store
  const orders = getAllOrdersInternal();
  console.log(`Retrieved ${orders.length} orders from database`);
  
  // Print the first few orders for debugging
  if (orders.length > 0) {
    console.log(`First order: ${JSON.stringify(orders[0]).substring(0, 100)}...`);
  }
  
  return orders;
};

/**
 * Get an order by ID
 * @param {String} orderId - The order ID to find
 * @returns {Object|null} The order or null if not found
 */
exports.getOrderById = function(orderId) {
  const orders = getAllOrdersInternal();
  const order = orders.find(o => o.id === orderId);
  return order || null;
};

/**
 * Delete an order by ID
 * @param {String} orderId - The order ID to delete
 * @returns {Boolean} True if order was deleted, false if not found
 */
exports.deleteOrder = function(orderId) {
  const orders = getAllOrdersInternal();
  const initialCount = orders.length;
  const newOrders = orders.filter(o => o.id !== orderId);
  
  if (newOrders.length !== initialCount) {
    saveOrdersInternal(newOrders);
    return true;
  }
  return false;
};

/**
 * Update an order's status
 * @param {String} orderId - The order ID to update
 * @param {String} status - The new status
 * @returns {Object|null} The updated order or null if not found
 */
exports.updateOrderStatus = function(orderId, status) {
  const orders = getAllOrdersInternal();
  const order = orders.find(o => o.id === orderId);
  
  if (order) {
    order.status = status;
    saveOrdersInternal(orders);
    return order;
  }
  return null;
};

/**
 * Reset the database (for testing)
 */
exports.resetDatabase = function() {
  saveOrdersInternal([]);
  return { success: true, message: 'Database reset' };
};

/**
 * Get database stats
 */
exports.getStats = function() {
  const orders = getAllOrdersInternal();
  return {
    totalOrders: orders.length,
    statuses: orders.reduce((acc, order) => {
      const status = order.status || 'unknown';
      acc[status] = (acc[status] || 0) + 1;
      return acc;
    }, {})
  };
};
