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
  
  console.log('Submit order function called');
  
  try {
    // Parsování těla příchozího requestu
    const data = JSON.parse(event.body);
    console.log('Received data:', JSON.stringify(data).substring(0, 200) + '...');
    
    // Validace povinných polí
    if (!data.customer || !data.email || !data.items) {
      console.log('Missing required fields');
      return corsHelpers.createResponse(400, { error: "Missing required fields" });
    }
    
    // Vygenerování unikátního ID objednávky, pokud není poskytnuto
    const orderId = data.id || Math.floor(1000 + Math.random() * 9000);
    const timestamp = new Date().toISOString();
    
    // Vytvoření objektu objednávky s kompletními daty
    const orderData = {
      id: orderId,
      customer: data.customer,
      email: data.email,
      phone: data.phone || '',
      date: timestamp,
      timestamp: Date.now(),
      items: data.items,
      status: 'preordered'
    };
    
    // Logování detailů objednávky (objeví se v Netlify function logs)
    console.log(`New order submitted: #ORD-${orderId} by ${orderData.customer}`);
    
    // V reálné aplikaci byste zde uložili objednávku do databáze
    // Zatím jen vrátíme úspěšnou odpověď
    
    return corsHelpers.createResponse(200, { 
      success: true,
      message: "Order submitted successfully",
      orderId: orderId
    });
  } catch (error) {
    console.log("Error processing order:", error);
    return corsHelpers.createResponse(500, { 
      error: "Failed to process order", 
      details: error.message 
    });
  }
};
