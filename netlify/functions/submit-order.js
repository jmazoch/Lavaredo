const corsHelpers = require('./utils/cors-headers');

// Konfigurační proměnné
const CONFIG = {
  // Toto URL později získáte po publikování Google Apps Scriptu
  WEBHOOK_URL: process.env.GOOGLE_SHEETS_WEBHOOK_URL || 'https://script.google.com/macros/s/AKfycbzM_OOO2LIYgLl9RqdRJFVsayk1-h0uH-zKFDIn2tj92ODWCSXsOvxy9GdKDyldOaTM/exec',
  // Volitelný API klíč pro zabezpečení
  API_KEY: process.env.GOOGLE_SHEETS_API_KEY || 'your-secret-key-here'
};

exports.handler = async function(event, context) {
  // Obsluha OPTIONS požadavků pro CORS
  if (event.httpMethod === 'OPTIONS') {
    return corsHelpers.handleOptions();
  }
  
  // Pouze POST požadavky jsou povoleny
  if (event.httpMethod !== "POST") {
    return corsHelpers.createResponse(405, { error: "Method Not Allowed" });
  }
  
  console.log('Submit order function called');
  
  try {
    // Parsování příchozího requestu
    const data = JSON.parse(event.body);
    console.log('Received order data:', JSON.stringify(data).substring(0, 200) + '...');
    
    // Validace povinných polí
    if (!data.customer || !data.email || !data.items) {
      console.log('Missing required fields');
      return corsHelpers.createResponse(400, { error: "Chybí povinná pole: jméno, email, nebo položky" });
    }
    
    // Příprava dat pro odeslání do Google Sheets
    const orderId = data.id || `ORD-${Date.now()}-${Math.floor(1000 + Math.random() * 9000)}`;
    
    const orderData = {
      id: orderId,
      name: data.customer,
      email: data.email,
      phone: data.phone || '',
      // Převod pole položek na string (Google Sheets bude uchovávat jako text)
      items: JSON.stringify(data.items),
      timestamp: new Date().toISOString(),
      // Volitelný API klíč pro zabezpečení - pokud je nastaven v Google Apps Scriptu
      apiKey: CONFIG.API_KEY
    };
    
    // Odeslání dat do Google Sheets přes Apps Script Webhook
    console.log('Sending data to Google Sheets webhook');
    const response = await fetch(CONFIG.WEBHOOK_URL, {
      method: 'POST',
      headers: { 
        'Content-Type': 'application/json',
        'X-Api-Key': CONFIG.API_KEY
      },
      body: JSON.stringify(orderData)
    });
    
    // Zpracování odpovědi
    if (!response.ok) {
      const errorText = await response.text();
      console.error('Google Sheets webhook error:', response.status, errorText);
      throw new Error(`Google Sheets responded with status ${response.status}`);
    }
    
    const result = await response.json();
    console.log('Google Sheets response:', result);
    
    // Úspěšná odpověď klientovi
    return corsHelpers.createResponse(200, { 
      success: true,
      message: "Objednávka byla úspěšně odeslána",
      orderId: orderId,
      timestamp: orderData.timestamp,
      sheetResponse: result
    });
  } catch (error) {
    console.error("Error processing order:", error);
    return corsHelpers.createResponse(500, { 
      error: "Nepodařilo se zpracovat objednávku", 
      details: error.message 
    });
  }
};
