const corsHelpers = require('./utils/cors-headers');
const orderDb = require('./utils/order-database');

exports.handler = async function(event, context) {
  // Handle OPTIONS preflight requests
  if (event.httpMethod === 'OPTIONS') {
    return corsHelpers.handleOptions();
  }
  
  // Only allow POST requests
  if (event.httpMethod !== "POST") {
    return corsHelpers.createResponse(405, { error: "Method Not Allowed" });
  }
  
  console.log('Submit order function called');
  console.log('Headers:', JSON.stringify(event.headers));
  
  try {
    // Parse the incoming request body
    const data = JSON.parse(event.body);
    console.log('Received data:', JSON.stringify(data).substring(0, 200) + '...');
    
    // Validate required fields
    if (!data.customer || !data.email || !data.items) {
      console.log('Missing required fields');
      return corsHelpers.createResponse(400, { error: "Missing required fields" });
    }
    
    // Prepare the order object
    const orderData = {
      id: data.id || `ORD-${Date.now()}-${Math.floor(1000 + Math.random() * 9000)}`,
      customer: data.customer,
      email: data.email,
      phone: data.phone || '',
      date: new Date().toISOString(),
      timestamp: Date.now(),
      items: data.items,
      status: 'preordered'
    };
    
    // Save the order to our database
    const savedOrder = orderDb.saveOrder(orderData);
    console.log(`New order saved: #${savedOrder.id} by ${savedOrder.customer}`);
    
    return corsHelpers.createResponse(200, { 
      success: true,
      message: "Order submitted successfully",
      orderId: savedOrder.id
    });
  } catch (error) {
    console.log("Error processing order:", error);
    return corsHelpers.createResponse(500, { 
      error: "Failed to process order", 
      details: error.message 
    });
  }
};
