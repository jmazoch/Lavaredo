// Serverless function to get a single order by ID
exports.handler = async function(event, context) {
  // Set up CORS headers
  const headers = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Headers': 'Content-Type, Authorization',
    'Access-Control-Allow-Methods': 'GET, OPTIONS',
    'Content-Type': 'application/json'
  };
  
  // Handle OPTIONS requests
  if (event.httpMethod === 'OPTIONS') {
    return { statusCode: 200, headers, body: '' };
  }
  
  // Only allow GET requests
  if (event.httpMethod !== "GET") {
    return { statusCode: 405, headers, body: JSON.stringify({ error: "Method Not Allowed" }) };
  }
  
  // Check authorization
  const token = event.headers.authorization;
  if (!token || !token.startsWith('Bearer ')) {
    return { 
      statusCode: 401, 
      headers, 
      body: JSON.stringify({ error: "Unauthorized" }) 
    };
  }
  
  try {
    // Get order ID from query parameters
    const orderId = event.queryStringParameters?.orderId;
    
    if (!orderId) {
      return { 
        statusCode: 400, 
        headers, 
        body: JSON.stringify({ error: "Missing order ID" }) 
      };
    }
    
    console.log(`Attempting to fetch real order for ID: ${orderId}`);
    
    // Return 404 instead of mock data
    return {
      statusCode: 404,
      headers,
      body: JSON.stringify({ error: "Order not found", message: "No order exists with this ID" })
    };
  } catch (error) {
    console.error("Error fetching order:", error);
    return {
      statusCode: 500,
      headers,
      body: JSON.stringify({ error: "Failed to fetch order", details: error.message })
    };
  }
};
