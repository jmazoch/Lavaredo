// Simplified serverless function to handle admin order retrieval
exports.handler = async function(event, context) {
  console.log('Admin-orders function called with method:', event.httpMethod);
  
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
  
  try {
    // Generate response with current timestamp but no test orders
    const currentTime = new Date().toISOString();
    console.log('Function executed at:', currentTime);
    
    // Clean response without test data
    const response = {
      message: "Admin orders function is working!",
      timestamp: currentTime,
      orders: [] // Return empty orders array - real orders will come from database
    };
    
    return {
      statusCode: 200,
      headers,
      body: JSON.stringify(response)
    };
  } catch (error) {
    console.error("Error in admin-orders function:", error);
    return {
      statusCode: 500,
      headers,
      body: JSON.stringify({ error: "Server error", details: error.message })
    };
  }
};
