const corsHelpers = require('./utils/cors-headers');
const orderDb = require('./utils/order-database');

exports.handler = async function(event, context) {
  console.log('Admin-orders function called with method:', event.httpMethod);
  
  // Handle OPTIONS requests
  if (event.httpMethod === 'OPTIONS') {
    return corsHelpers.handleOptions();
  }
  
  // Only allow GET requests
  if (event.httpMethod !== "GET") {
    return corsHelpers.createResponse(405, { error: "Method Not Allowed" });
  }
  
  // Basic authentication
  const authHeader = event.headers.authorization || '';
  if (!authHeader.startsWith('Bearer ')) {
    return corsHelpers.createResponse(401, { error: "Unauthorized" });
  }
  
  try {
    // Get all orders from the database
    const orders = orderDb.getAllOrders();
    console.log(`Returning ${orders.length} orders from database`);
    
    // Get database statistics
    const stats = orderDb.getStats();
    
    // Get the current timestamp
    const currentTime = new Date().toISOString();
    
    // Create the response with orders and stats
    const response = {
      message: "Orders retrieved successfully",
      timestamp: currentTime,
      stats: stats,
      orders: orders
    };
    
    return corsHelpers.createResponse(200, response);
  } catch (error) {
    console.error("Error retrieving orders:", error);
    return corsHelpers.createResponse(500, { 
      error: "Failed to retrieve orders", 
      details: error.message 
    });
  }
};
