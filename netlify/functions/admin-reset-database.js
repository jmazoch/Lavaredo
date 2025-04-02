const corsHelpers = require('./utils/cors-headers');
const orderDb = require('./utils/order-database');

exports.handler = async function(event, context) {
  // Handle OPTIONS requests
  if (event.httpMethod === 'OPTIONS') {
    return corsHelpers.handleOptions();
  }
  
  // Only allow POST requests
  if (event.httpMethod !== "POST") {
    return corsHelpers.createResponse(405, { error: "Method Not Allowed" });
  }
  
  // More flexible authentication - accept any bearer token
  const authHeader = event.headers.authorization || '';
  if (!authHeader.startsWith('Bearer ')) {
    console.log('Missing or invalid Authorization header:', authHeader);
    return corsHelpers.createResponse(401, { 
      error: "Unauthorized", 
      message: "Valid Bearer token required" 
    });
  }
  
  // Log the auth header for debugging
  console.log('Auth header received:', authHeader.substring(0, 20) + '...');
  
  try {
    // Parse request body to check for confirmation
    let confirmed = false;
    try {
      const data = JSON.parse(event.body);
      confirmed = data.confirm === true;
    } catch (e) {
      console.log('No valid JSON body found');
    }
    
    if (!confirmed) {
      return corsHelpers.createResponse(400, {
        error: "Confirmation required",
        message: "Please confirm the database reset by sending {\"confirm\": true}"
      });
    }
    
    // Reset the database
    console.log('Resetting order database');
    const result = orderDb.resetDatabase();
    
    return corsHelpers.createResponse(200, {
      success: true,
      message: "Order database has been reset",
      details: result
    });
  } catch (error) {
    console.error('Error resetting database:', error);
    return corsHelpers.createResponse(500, {
      error: 'Failed to reset database',
      details: error.message
    });
  }
};
