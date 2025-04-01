// Netlify serverless function to retrieve orders for admin
exports.handler = async function(event, context) {
  // Only allow GET requests
  if (event.httpMethod !== "GET") {
    return { statusCode: 405, body: "Method Not Allowed" };
  }
  
  try {
    // Check authentication
    const token = event.headers.authorization;
    if (!token || !token.startsWith('Bearer ')) {
      return { 
        statusCode: 401, 
        body: JSON.stringify({ error: "Unauthorized" }) 
      };
    }
    
    const adminToken = token.split('Bearer ')[1];
    
    // For now, we'll validate the token in a simple way
    // In a real app, use secure token validation
    // This is just a placeholder validation for this example
    if (!adminToken.startsWith('admin_')) {
      return { 
        statusCode: 401, 
        body: JSON.stringify({ error: "Invalid token" })
      };
    }
    
    // In a real app, fetch orders from database
    // Return empty orders array (removed sample orders)
    const orders = [];
    
    return {
      statusCode: 200,
      body: JSON.stringify({ orders: orders })
    };
  } catch (error) {
    console.log("Error retrieving orders:", error);
    return {
      statusCode: 500,
      body: JSON.stringify({ error: "Failed to retrieve orders" })
    };
  }
};
