// Netlify serverless function to handle order submission
exports.handler = async function(event, context) {
  // Set up CORS headers
  const headers = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Headers': 'Content-Type',
    'Access-Control-Allow-Methods': 'POST, OPTIONS'
  };
  
  // Handle OPTIONS requests (pre-flight)
  if (event.httpMethod === 'OPTIONS') {
    return {
      statusCode: 200,
      headers,
      body: ''
    };
  }
  
  // Only allow POST requests
  if (event.httpMethod !== "POST") {
    return { 
      statusCode: 405, 
      headers,
      body: JSON.stringify({ error: "Method Not Allowed" })
    };
  }
  
  console.log('Submit order function called');
  
  try {
    // Parse the incoming request body
    const data = JSON.parse(event.body);
    console.log('Received data:', JSON.stringify(data).substring(0, 200) + '...');
    
    // Validate required fields
    if (!data.customer || !data.email || !data.items) {
      console.log('Missing required fields');
      return { 
        statusCode: 400,
        headers,
        body: JSON.stringify({ error: "Missing required fields" })
      };
    }
    
    // Generate a unique order ID if not provided
    const orderId = data.id || Math.floor(1000 + Math.random() * 9000);
    const timestamp = new Date().toISOString();
    
    // Create the order object with complete data
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
    
    // Log the order details (will appear in Netlify function logs)
    console.log(`New order submitted: #ORD-${orderId} by ${orderData.customer}`);
    
    // Here you would typically save the order to a database
    // For now, just return success
    
    return {
      statusCode: 200,
      headers,
      body: JSON.stringify({ 
        success: true,
        message: "Order submitted successfully",
        orderId: orderId
      })
    };
  } catch (error) {
    console.log("Error processing order:", error);
    return {
      statusCode: 500,
      headers,
      body: JSON.stringify({ error: "Failed to process order", details: error.message })
    };
  }
};
