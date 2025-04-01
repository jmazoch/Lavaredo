// Netlify serverless function to handle order status updates
exports.handler = async function(event, context) {
  // Set up CORS headers
  const headers = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Headers': 'Content-Type, Authorization',
    'Access-Control-Allow-Methods': 'POST, OPTIONS'
  };
  
  // Handle OPTIONS requests (pre-flight)
  if (event.httpMethod === 'OPTIONS') {
    return {
      statusCode: 200,
      headers,
      body: ''
    };
  }
  
  // Only allow POST requests
  if (event.httpMethod !== "POST") {
    return { 
      statusCode: 405, 
      headers,
      body: JSON.stringify({ error: "Method Not Allowed" })
    };
  }
  
  // Check authorization (should be more robust in production)
  const authHeader = event.headers.authorization || '';
  if (!authHeader.startsWith('Bearer ')) {
    return {
      statusCode: 401,
      headers,
      body: JSON.stringify({ error: "Unauthorized" })
    };
  }
  
  try {
    // Parse request body
    const data = JSON.parse(event.body);
    
    // Validate required fields
    if (!data.orderId || !data.status) {
      return {
        statusCode: 400,
        headers,
        body: JSON.stringify({ error: "Missing required fields" })
      };
    }
    
    console.log(`Order status update: ID ${data.orderId} to ${data.status}`);
    
    // In a production system, we would update the order in a database
    // For now, just return a success response
    
    return {
      statusCode: 200,
      headers,
      body: JSON.stringify({ 
        success: true,
        message: "Order status updated",
        orderId: data.orderId,
        status: data.status
      })
    };
  } catch (error) {
    console.log("Error updating order:", error);
    return {
      statusCode: 500,
      headers,
      body: JSON.stringify({ error: "Failed to update order", details: error.message })
    };
  }
};
