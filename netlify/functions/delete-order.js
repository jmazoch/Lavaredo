// Netlify serverless function to handle order deletion
exports.handler = async function(event, context) {
  // Set up CORS headers
  const headers = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Headers': 'Content-Type, Authorization',
    'Access-Control-Allow-Methods': 'POST, OPTIONS, DELETE',
    'Content-Type': 'application/json'
  };
  
  // Handle OPTIONS requests (pre-flight)
  if (event.httpMethod === 'OPTIONS') {
    return {
      statusCode: 200,
      headers,
      body: ''
    };
  }
  
  // Only allow POST or DELETE requests
  if (event.httpMethod !== "POST" && event.httpMethod !== "DELETE") {
    return { 
      statusCode: 405, 
      headers,
      body: JSON.stringify({ error: "Method Not Allowed" }) 
    };
  }
  
  // Check authorization (simple token check for demo)
  const authHeader = event.headers.authorization || '';
  if (!authHeader.startsWith('Bearer admin_')) {
    return {
      statusCode: 401,
      headers,
      body: JSON.stringify({ error: "Unauthorized" })
    };
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
      return {
        statusCode: 400,
        headers,
        body: JSON.stringify({ error: "Missing order ID" })
      };
    }
    
    console.log(`Request to delete order: ${orderId}`);
    
    // Special handling for SERVER- prefixed orders (mock orders)
    if (orderId.startsWith('SERVER-')) {
      // Store this ID in a "deleted orders" list
      // We'll use environment variables to simulate a database
      // In a real app, you would store this in a database
      try {
        // This is risky in production, but for demo purposes to track deleted orders
        // Note: This approach only works in development, as prod functions are immutable
        // A real solution would use a database or some other persistent storage
        console.log('Adding server order to deleted list');
        
        // In a real implementation, you would add this ID to a database
        // For demo purposes, we just acknowledge the deletion
        
        return {
          statusCode: 200,
          headers,
          body: JSON.stringify({
            success: true,
            message: `Server mock order ${orderId} has been marked as deleted`,
            orderId: orderId,
            orderType: 'server-mock'
          })
        };
      } catch (storageError) {
        console.error('Error storing deleted order ID:', storageError);
        // Continue with normal response even if storage fails
      }
    }
    
    // In a real implementation, you would delete the order from your database here
    
    return {
      statusCode: 200,
      headers,
      body: JSON.stringify({
        success: true,
        message: `Order ${orderId} has been deleted successfully`,
        orderId: orderId
      })
    };
  } catch (error) {
    console.error("Error deleting order:", error);
    return {
      statusCode: 500,
      headers,
      body: JSON.stringify({ error: "Failed to delete order", details: error.message })
    };
  }
};
