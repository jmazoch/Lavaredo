const corsHelpers = require('./utils/cors-headers');
const orderDb = require('./utils/order-database');

exports.handler = async function(event, context) {
  // Handle OPTIONS requests
  if (event.httpMethod === 'OPTIONS') {
    return corsHelpers.handleOptions();
  }
  
  // Only allow GET requests
  if (event.httpMethod !== "GET") {
    return corsHelpers.createResponse(405, { error: "Method Not Allowed" });
  }
  
  // Check authorization
  const token = event.headers.authorization;
  if (!token || !token.startsWith('Bearer ')) {
    return corsHelpers.createResponse(401, { error: "Unauthorized" });
  }
  
  try {
    // Get order ID from query parameters
    const orderId = event.queryStringParameters?.orderId;
    
    if (!orderId) {
      return corsHelpers.createResponse(400, { error: "Missing order ID" });
    }
    
    console.log(`Fetching order details for ID: ${orderId}`);
    
    // First try to get the order from our database
    let order = orderDb.getOrderById(orderId);
    
    // If found in database, return it
    if (order) {
      console.log(`Order ${orderId} found in database`);
      return corsHelpers.createResponse(200, { order });
    }
    
    // If not found but starts with SERVER-, generate mock data
    if (orderId.startsWith('SERVER-')) {
      // Use the existing code to generate a mock server order
      const idNumber = parseInt(orderId.replace('SERVER-', '')) || Date.now();
      const seedValue = idNumber % 10000;
      
      order = {
        id: orderId,
        customer: `Customer ${seedValue % 100}`,
        email: `customer${seedValue % 100}@example.com`,
        phone: `+420 ${(seedValue % 900) + 100} ${(seedValue % 900) + 100} ${(seedValue % 900) + 100}`,
        date: new Date(Date.now() - (seedValue * 60000)).toISOString(),
        timestamp: Date.now() - (seedValue * 60000),
        status: ["preordered", "added", "paid"][seedValue % 3],
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
      
      return corsHelpers.createResponse(200, { order });
    }
    
    // Order not found
    return corsHelpers.createResponse(404, { 
      error: "Order not found", 
      message: "Order ID not recognized" 
    });
  } catch (error) {
    console.error("Error fetching order:", error);
    return corsHelpers.createResponse(500, { 
      error: "Failed to fetch order", 
      details: error.message 
    });
  }
};
