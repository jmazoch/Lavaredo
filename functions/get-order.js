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
    
    // Handle known server order patterns (starting with SERVER-)
    if (orderId.startsWith('SERVER-')) {
      // Parse any numeric information from the ID to create deterministic but varied data
      const idNumber = parseInt(orderId.replace('SERVER-', '')) || Date.now();
      const seedValue = idNumber % 10000; // Get a consistent seed value for this order
      
      // Create sample order with the requested ID using seedValue to vary data
      const order = {
        id: orderId,
        customer: `Customer ${seedValue % 100}`,
        email: `customer${seedValue % 100}@example.com`,
        phone: `+420 ${(seedValue % 900) + 100} ${(seedValue % 900) + 100} ${(seedValue % 900) + 100}`,
        date: new Date(Date.now() - (seedValue * 60000)).toISOString(), // Vary the date
        timestamp: Date.now() - (seedValue * 60000),
        status: ["preordered", "added", "paid"][seedValue % 3], // Vary the status
        source: "server",
        items: [
          { 
            name: ["Jersey Classic", "Jersey Pro", "Jersey Elite"][seedValue % 3], 
            gender: ["Men", "Women", "Unisex"][seedValue % 3], 
            size: ["S", "M", "L", "XL"][seedValue % 4] 
          },
          { 
            name: ["Bibs Basic", "Bibs Pro", "Bibs Elite"][seedValue % 3], 
            gender: ["Men", "Women", "Unisex"][(seedValue + 1) % 3], 
            size: ["S", "M", "L", "XL"][(seedValue + 1) % 4] 
          }
        ]
      };
      
      // Add random third item sometimes
      if (seedValue % 5 === 0) {
        order.items.push({
          name: "Cycling Cap",
          gender: "Unisex",
          size: "One Size"
        });
      }
      
      return {
        statusCode: 200,
        headers,
        body: JSON.stringify({ order })
      };
    }
    
    // For non-SERVER orders, return a 404
    return {
      statusCode: 404,
      headers,
      body: JSON.stringify({ error: "Order not found", message: "Order ID not recognized" })
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
