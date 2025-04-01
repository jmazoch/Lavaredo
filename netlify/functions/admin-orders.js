const corsHelpers = require('./utils/cors-headers');

exports.handler = async function(event, context) {
  console.log('Admin-orders function called with method:', event.httpMethod);
  
  // Zpracování OPTIONS requestů
  if (event.httpMethod === 'OPTIONS') {
    return corsHelpers.handleOptions();
  }
  
  // Pouze povolit GET requesty
  if (event.httpMethod !== "GET") {
    return corsHelpers.createResponse(405, { error: "Method Not Allowed" });
  }
  
  // Základní autentizace
  const authHeader = event.headers.authorization || '';
  if (!authHeader.startsWith('Bearer ')) {
    return corsHelpers.createResponse(401, { error: "Unauthorized" });
  }
  
  try {
    // Generování odpovědi s aktuálním časovým razítkem
    const currentTime = new Date().toISOString();
    console.log('Function executed at:', currentTime);
    
    // Čistá odpověď bez testovacích dat
    const response = {
      message: "Admin orders function is working!",
      timestamp: currentTime,
      orders: [] // Prázdné pole objednávek - skutečné objednávky budou z databáze
    };
    
    return corsHelpers.createResponse(200, response);
  } catch (error) {
    console.error("Error in admin-orders function:", error);
    return corsHelpers.createResponse(500, { 
      error: "Server error", 
      details: error.message 
    });
  }
};
