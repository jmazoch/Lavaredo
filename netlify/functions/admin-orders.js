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
