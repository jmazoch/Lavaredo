const corsHelpers = require('./utils/cors-headers');

exports.handler = async function(event, context) {
  // Zpracování OPTIONS requestů
  if (event.httpMethod === 'OPTIONS') {
    return corsHelpers.handleOptions();
  }
  
  // Pouze povolit POST nebo DELETE requesty
  if (event.httpMethod !== "POST" && event.httpMethod !== "DELETE") {
    return corsHelpers.createResponse(405, { error: "Method Not Allowed" });
  }
  
  // Kontrola autorizace
  const authHeader = event.headers.authorization || '';
  if (!authHeader.startsWith('Bearer admin_')) {
    return corsHelpers.createResponse(401, { error: "Unauthorized" });
  }
  
  try {
    let orderId;
    
    // Získání ID objednávky z těla requestu nebo parametrů
    if (event.httpMethod === "POST") {
      const data = JSON.parse(event.body);
      orderId = data.orderId;
    } else {
      // Pro DELETE request, získat z queryStringParameters
      orderId = event.queryStringParameters?.orderId;
    }
    
    if (!orderId) {
      return corsHelpers.createResponse(400, { error: "Missing order ID" });
    }
    
    console.log(`Request to delete order: ${orderId}`);
    
    // Speciální zpracování pro objednávky s prefixem SERVER- (mock objednávky)
    if (orderId.startsWith('SERVER-')) {
      return corsHelpers.createResponse(200, {
        success: true,
        message: `Server mock order ${orderId} has been marked as deleted`,
        orderId: orderId,
        orderType: 'server-mock'
      });
    }
    
    // V reálné implementaci byste objednávku smazali z databáze
    
    return corsHelpers.createResponse(200, {
      success: true,
      message: `Order ${orderId} has been deleted successfully`,
      orderId: orderId
    });
  } catch (error) {
    console.error("Error deleting order:", error);
    return corsHelpers.createResponse(500, { 
      error: "Failed to delete order", 
      details: error.message 
    });
  }
};
