const corsHelpers = require('./utils/cors-headers');

// Konfigurační proměnné
const CONFIG = {
  // Toto URL později získáte po publikování Google Apps Scriptu
  API_URL: process.env.GOOGLE_SHEETS_API_URL || 'https://script.google.com/macros/s/AKfycbzM_OOO2LIYgLl9RqdRJFVsayk1-h0uH-zKFDIn2tj92ODWCSXsOvxy9GdKDyldOaTM/exec',
  // Volitelný admin API klíč pro zabezpečení
  ADMIN_API_KEY: process.env.GOOGLE_SHEETS_ADMIN_KEY || 'your-admin-key-here'
};

exports.handler = async function(event, context) {
  // Obsluha OPTIONS požadavků pro CORS
  if (event.httpMethod === 'OPTIONS') {
    return corsHelpers.handleOptions();
  }
  
  // Pouze GET požadavky jsou povoleny
  if (event.httpMethod !== "GET") {
    return corsHelpers.createResponse(405, { error: "Method Not Allowed" });
  }
  
  // Kontrola autorizačního tokenu
  const authHeader = event.headers.authorization || '';
  if (!authHeader.startsWith('Bearer ')) {
    console.log('Missing or invalid Authorization header');
    return corsHelpers.createResponse(401, { 
      error: "Unauthorized", 
      message: "Valid Bearer token required" 
    });
  }
  
  console.log('Admin-orders function called');
  
  // V této verzi zatím pouze vrací prázdné pole objednávek
  // Později bude implementováno načítání z Google Sheets
  return corsHelpers.createResponse(200, {
    message: "Orders retrieved successfully",
    timestamp: new Date().toISOString(),
    orders: [],
    info: "Načítání dat z Google Sheets bude implementováno později"
  });
  
  /* 
  // Kód pro budoucí implementaci načítání z Google Sheets:
  
  try {
    // Sestavení URL pro získání objednávek z Google Sheets
    const apiUrl = new URL(CONFIG.API_URL);
    apiUrl.searchParams.append('action', 'getOrders');
    
    // Odeslání požadavku na Google Sheets
    const response = await fetch(apiUrl.toString(), {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${CONFIG.ADMIN_API_KEY}`
      }
    });
    
    if (!response.ok) {
      throw new Error(`Google Sheets API responded with status ${response.status}`);
    }
    
    const data = await response.json();
    
    return corsHelpers.createResponse(200, {
      message: "Orders retrieved successfully",
      timestamp: new Date().toISOString(),
      orders: data.orders || []
    });
  } catch (error) {
    console.error("Error retrieving orders:", error);
    return corsHelpers.createResponse(500, { 
      error: "Failed to retrieve orders", 
      details: error.message
    });
  }
  */
};
