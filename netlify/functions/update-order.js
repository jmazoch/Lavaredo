const corsHelpers = require('./utils/cors-headers');

exports.handler = async function(event, context) {
  // Zpracování OPTIONS requestů
  if (event.httpMethod === 'OPTIONS') {
    return corsHelpers.handleOptions();
  }
  
  // Pouze povolit POST requesty
  if (event.httpMethod !== "POST") {
    return corsHelpers.createResponse(405, { error: "Method Not Allowed" });
  }
  
  // Kontrola autorizace
  const authHeader = event.headers.authorization || '';
  if (!authHeader.startsWith('Bearer ')) {
    return corsHelpers.createResponse(401, { error: "Unauthorized" });
  }
  
  try {
    // Parsování těla requestu
    const data = JSON.parse(event.body);
    
    // Validace povinných polí
    if (!data.orderId || !data.status) {
      return corsHelpers.createResponse(400, { error: "Missing required fields" });
    }
    
    console.log(`Order status update: ID ${data.orderId} to ${data.status}`);
    
    // V produkčním systému bychom aktualizovali objednávku v databázi
    // Zatím jen vrátíme úspěšnou odpověď
    
    return corsHelpers.createResponse(200, { 
      success: true,
      message: "Order status updated",
      orderId: data.orderId,
      status: data.status
    });
  } catch (error) {
    console.log("Error updating order:", error);
    return corsHelpers.createResponse(500, { 
      error: "Failed to update order", 
      details: error.message 
    });
  }
};
