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
    // For demo, create a few sample orders
    const sampleOrders = [
      {
        id: "1001",
        customer: "John Doe",
        email: "john@example.com",
        phone: "+420 123 456 789",
        date: "2023-05-15",
        items: [
          {name: "Team Jersey", size: "L", gender: "Men"}
        ],
        status: "preordered"
      },
      {
        id: "1002",
        customer: "Jane Smith",
        email: "jane@example.com",
        phone: "+420 987 654 321",
        date: "2023-05-16",
        items: [
          {name: "Classic Jersey", size: "M", gender: "Women"},
          {name: "Race Bibs", size: "M", gender: "Women"}
        ],
        status: "added"
      }
    ];
    
    return {
      statusCode: 200,
      body: JSON.stringify({ orders: sampleOrders })
    };
  } catch (error) {
    console.log("Error retrieving orders:", error);
    return {
      statusCode: 500,
      body: JSON.stringify({ error: "Failed to retrieve orders" })
    };
  }
};
