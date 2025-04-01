/**
 * Simple order database handler
 * In production, you would replace this with a real database like MongoDB, Firebase, etc.
 */

// In-memory orders storage (for demo purposes)
// Note: This will reset when the function is redeployed or cold starts
let ordersDatabase = [];

/**
 * Add an order to the database
 * @param {Object} order - The order data
 * @returns {Object} The saved order with ID
 */
exports.saveOrder = function(order) {
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
  
  // Add the order to our "database"
  ordersDatabase.push(order);
  console.log(`Order saved to database: ${order.id}`);
  
  // Log the current number of orders for debugging
  console.log(`Database now contains ${ordersDatabase.length} orders`);
  
  return order;
};

/**
 * Get all orders from the database
 * @returns {Array} All orders
 */
exports.getAllOrders = function() {
  return ordersDatabase;
};

/**
 * Get an order by ID
 * @param {String} orderId - The order ID to find
 * @returns {Object|null} The order or null if not found
 */
exports.getOrderById = function(orderId) {
  const order = ordersDatabase.find(o => o.id === orderId);
  return order || null;
};

/**
 * Delete an order by ID
 * @param {String} orderId - The order ID to delete
 * @returns {Boolean} True if order was deleted, false if not found
 */
exports.deleteOrder = function(orderId) {
  const initialCount = ordersDatabase.length;
  ordersDatabase = ordersDatabase.filter(o => o.id !== orderId);
  return ordersDatabase.length < initialCount;
};

/**
 * Update an order's status
 * @param {String} orderId - The order ID to update
 * @param {String} status - The new status
 * @returns {Object|null} The updated order or null if not found
 */
exports.updateOrderStatus = function(orderId, status) {
  const order = ordersDatabase.find(o => o.id === orderId);
  if (order) {
    order.status = status;
    return order;
  }
  return null;
};

/**
 * Reset the database (for testing)
 */
exports.resetDatabase = function() {
  ordersDatabase = [];
  return { success: true, message: 'Database reset' };
};

/**
 * Get database stats
 */
exports.getStats = function() {
  return {
    totalOrders: ordersDatabase.length,
    statuses: ordersDatabase.reduce((acc, order) => {
      acc[order.status] = (acc[order.status] || 0) + 1;
      return acc;
    }, {})
  };
};
