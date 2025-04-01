const corsHelpers = require('./utils/cors-headers');

exports.handler = async function(event, context) {
  // Zpracování OPTIONS requestů
  if (event.httpMethod === 'OPTIONS') {
    return corsHelpers.handleOptions();
  }
  
  // Pouze povolit GET requesty
  if (event.httpMethod !== "GET") {
    return corsHelpers.createResponse(405, { error: "Method Not Allowed" });
  }
  
  // Kontrola autorizace
  const token = event.headers.authorization;
  if (!token || !token.startsWith('Bearer ')) {
    return corsHelpers.createResponse(401, { error: "Unauthorized" });
  }
  
  try {
    // Získání ID objednávky z parametrů dotazu
    const orderId = event.queryStringParameters?.orderId;
    
    if (!orderId) {
      return corsHelpers.createResponse(400, { error: "Missing order ID" });
    }
    
    console.log(`Fetching order details for ID: ${orderId}`);
    
    // Zpracování známých vzorů serverových objednávek (začínajících SERVER-)
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
      
      return corsHelpers.createResponse(200, { order });
    }
    
    // Pro objednávky, které nejsou SERVER-, vrátí 404
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
