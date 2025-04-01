const corsHelpers = require('./utils/cors-headers');
const orderDb = require('./utils/order-database');

exports.handler = async function(event, context) {
  // Handle OPTIONS requests
  if (event.httpMethod === 'OPTIONS') {
    return corsHelpers.handleOptions();
  }
  
  // Only allow POST or DELETE requests
  if (event.httpMethod !== "POST" && event.httpMethod !== "DELETE") {
    return corsHelpers.createResponse(405, { error: "Method Not Allowed" });
  }
  
  // Check authorization
  const authHeader = event.headers.authorization || '';
  if (!authHeader.startsWith('Bearer admin_')) {
    return corsHelpers.createResponse(401, { error: "Unauthorized" });
  }
  
  try {
    let orderId;
    
    // Get order ID from request body or parameters
    if (event.httpMethod === "POST") {
      const data = JSON.parse(event.body);
      orderId = data.orderId;
    } else {
      // For DELETE request, get from queryStringParameters
      orderId = event.queryStringParameters?.orderId;
    }
    
    if (!orderId) {
      return corsHelpers.createResponse(400, { error: "Missing order ID" });
    }
    
    console.log(`Request to delete order: ${orderId}`);
    
    // Special handling for SERVER- prefixed orders
    if (orderId.startsWith('SERVER-')) {
      return corsHelpers.createResponse(200, {
        success: true,
        message: `Server mock order ${orderId} has been marked as deleted`,
        orderId: orderId,
        orderType: 'server-mock'
      });
    }
    
    // Try to delete from database
    const deleted = orderDb.deleteOrder(orderId);
    
    if (deleted) {
      console.log(`Order ${orderId} deleted successfully from database`);
    } else {
      console.log(`Order ${orderId} not found in database`);
    }
    
    // Return success regardless if we found it or not
    return corsHelpers.createResponse(200, {
      success: true,
      message: deleted 
        ? `Order ${orderId} has been deleted successfully` 
        : `Order ${orderId} was not found but operation completed`,
      orderId: orderId
    });
  } catch (error) {
    console.error("Error deleting order:", error);
    return corsHelpers.createResponse(500, { 
      error: "Failed to delete order", 
      details: error.message 
    });
  }
};
