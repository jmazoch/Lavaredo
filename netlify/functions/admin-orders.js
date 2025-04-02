const corsHelpers = require('./utils/cors-headers');
const orderDb = require('./utils/order-database');

exports.handler = async function(event, context) {
  console.log('Admin-orders function called with method:', event.httpMethod);
  console.log('Request headers:', JSON.stringify(event.headers));
  
  // Handle OPTIONS requests
  if (event.httpMethod === 'OPTIONS') {
    return corsHelpers.handleOptions();
  }
  
  // Only allow GET requests
  if (event.httpMethod !== "GET") {
    return corsHelpers.createResponse(405, { error: "Method Not Allowed" });
  }
  
  // More flexible authentication check - accept any Bearer token for now
  const authHeader = event.headers.authorization || '';
  if (!authHeader.startsWith('Bearer ')) {
    console.log('Missing or invalid Authorization header:', authHeader);
    return corsHelpers.createResponse(401, { 
      error: "Unauthorized", 
      message: "Valid Bearer token required" 
    });
  }
  
  try {
    console.log('Loading orders from database...');
    
    // Force a fresh load from persistent storage
    orderDb.resetCache && orderDb.resetCache();
    
    // Get all orders from the database
    const orders = orderDb.getAllOrders();
    console.log(`Found ${orders.length} orders in database`);
    
    // Log some basic info about the orders for debugging
    if (orders.length > 0) {
      orders.forEach((order, index) => {
        console.log(`Order ${index+1}: ID=${order.id}, Customer=${order.customer}, Source=${order.source || 'unknown'}`);
      });
    }
    
    // Get database statistics
    const stats = orderDb.getStats ? orderDb.getStats() : { totalOrders: orders.length };
    
    // Get the current timestamp
    const currentTime = new Date().toISOString();
    
    // Create the response with orders and stats
    const response = {
      message: "Orders retrieved successfully",
      timestamp: currentTime,
      stats: stats,
      orders: orders,
      debug: {
        functionPath: __dirname,
        isArray: Array.isArray(orders),
        ordersSample: orders.length > 0 ? JSON.stringify(orders[0]).substring(0, 100) + '...' : 'No orders'
      }
    };
    
    return corsHelpers.createResponse(200, response);
  } catch (error) {
    console.error("Error retrieving orders:", error);
    return corsHelpers.createResponse(500, { 
      error: "Failed to retrieve orders", 
      details: error.message,
      stack: error.stack
    });
  }
};
