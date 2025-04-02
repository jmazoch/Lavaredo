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
  console.log('Request origin:', event.headers.origin || 'No origin header');
  console.log('Request referer:', event.headers.referer || 'No referer header');
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
    
    // Prepare the order object with a guaranteed ID format
    const orderId = data.id || `ORD-${Date.now()}-${Math.floor(1000 + Math.random() * 9000)}`;
    
    const orderData = {
      id: orderId,
      customer: data.customer,
      email: data.email,
      phone: data.phone || '',
      text: data.text || '', // Add text field explicitly for test messages
      date: new Date().toISOString(),
      timestamp: Date.now(),
      items: data.items,
      status: 'preordered',
      source: 'website',
      deviceId: data.deviceId || 'unknown',
      sourceInfo: {
        ip: event.headers['client-ip'] || 'unknown',
        userAgent: event.headers['user-agent'] || 'unknown',
        origin: event.headers.origin || 'unknown',
        referer: event.headers.referer || 'unknown'
      }
    };
    
    // Save the order to our database with improved error handling
    try {
      console.log('Attempting to save order to database:', orderData.id);
      const savedOrder = orderDb.saveOrder(orderData);
      console.log(`New order saved: #${savedOrder.id} by ${savedOrder.customer}`);
      
      // Store orders count in console for debugging
      const allOrders = orderDb.getAllOrders();
      console.log(`Current orders in database: ${allOrders.length}`);
      
      return corsHelpers.createResponse(200, { 
        success: true,
        message: "Order submitted successfully",
        orderId: savedOrder.id,
        timestamp: savedOrder.timestamp
      });
    } catch (dbError) {
      console.error('Database error saving order:', dbError);
      throw new Error(`Failed to save order: ${dbError.message}`);
    }
  } catch (error) {
    console.error("Error processing order:", error);
    return corsHelpers.createResponse(500, { 
      error: "Failed to process order", 
      details: error.message 
    });
  }
};
