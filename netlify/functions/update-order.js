const corsHelpers = require('./utils/cors-headers');
const orderDb = require('./utils/order-database');

exports.handler = async function(event, context) {
  // Handle OPTIONS requests
  if (event.httpMethod === 'OPTIONS') {
    return corsHelpers.handleOptions();
  }
  
  // Only allow POST requests
  if (event.httpMethod !== "POST") {
    return corsHelpers.createResponse(405, { error: "Method Not Allowed" });
  }
  
  // Check authorization
  const authHeader = event.headers.authorization || '';
  if (!authHeader.startsWith('Bearer ')) {
    return corsHelpers.createResponse(401, { error: "Unauthorized" });
  }
  
  try {
    // Parse request body
    const data = JSON.parse(event.body);
    
    // Validate required fields
    if (!data.orderId || !data.status) {
      return corsHelpers.createResponse(400, { error: "Missing required fields" });
    }
    
    console.log(`Order status update: ID ${data.orderId} to ${data.status}`);
    
    // Try to update the order in our database
    const updatedOrder = orderDb.updateOrderStatus(data.orderId, data.status);
    
    if (updatedOrder) {
      console.log(`Order ${data.orderId} status updated to ${data.status}`);
      return corsHelpers.createResponse(200, { 
        success: true,
        message: "Order status updated",
        orderId: data.orderId,
        status: data.status,
        order: updatedOrder
      });
    } else {
      console.log(`Order ${data.orderId} not found for status update`);
      return corsHelpers.createResponse(404, { 
        error: "Order not found", 
        message: `Order ${data.orderId} not found` 
      });
    }
  } catch (error) {
    console.log("Error updating order:", error);
    return corsHelpers.createResponse(500, { 
      error: "Failed to update order", 
      details: error.message 
    });
  }
};
