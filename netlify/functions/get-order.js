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
    
    console.log(`Fetching order details for ID: ${orderId}`);
    
    // In a real implementation, you would fetch this from your database
    // For now, return a sample order with the requested ID
    const order = {
      id: orderId,
      customer: "Server Order Customer",
      email: "server-order@example.com",
      phone: "+1 555-SERVER",
      date: new Date().toISOString(),
      timestamp: Date.now(),
      status: "preordered",
      source: "server",
      items: [
        { 
          name: "Jersey from Server DB", 
          gender: "Unisex", 
          size: "L" 
        },
        { 
          name: "Bibs from Server DB", 
          gender: "Unisex", 
          size: "M" 
        }
      ]
    };
    
    return {
      statusCode: 200,
      headers,
      body: JSON.stringify({ order })
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
