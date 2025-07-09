const corsHelpers = require('./utils/cors-headers');

// Configuration
const GOOGLE_SCRIPT_URL = process.env.GOOGLE_SHEETS_API_URL || 
  'https://script.google.com/macros/s/AKfycbzM_OOO2LIYgLl9RqdRJFVsayk1-h0uH-zKFDIn2tj92ODWCSXsOvxy9GdKDyldOaTM/exec';

exports.handler = async function(event, context) {
  // Handle OPTIONS requests
  if (event.httpMethod === 'OPTIONS') {
    return corsHelpers.handleOptions();
  }
  
  // Only allow POST requests
  if (event.httpMethod !== "POST") {
    return corsHelpers.createResponse(405, { error: "Method Not Allowed" });
  }
  
  // Check authorization
  const authHeader = event.headers.authorization || '';
  if (!authHeader.startsWith('Bearer ')) {
    return corsHelpers.createResponse(401, { error: "Unauthorized" });
  }
  
  try {
    // Parse request body
    const data = JSON.parse(event.body);
    
    // Validate required fields
    if (!data.orderId || !data.status) {
      return corsHelpers.createResponse(400, { error: "Missing required fields" });
    }
    
    console.log(`Order status update: ID ${data.orderId} to ${data.status}`);
    
    // Send update to Google Apps Script
    const response = await fetch(GOOGLE_SCRIPT_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        action: 'updateOrderStatus',
        id: data.orderId,
        status: data.status
      })
    });
    
    if (!response.ok) {
      console.error(`Google Sheets API error: ${response.status}`);
      throw new Error(`Google Sheets API responded with status ${response.status}`);
    }
    
    const result = await response.json();
    
    if (result.success) {
      console.log(`Order ${data.orderId} status updated to ${data.status}`);
      return corsHelpers.createResponse(200, { 
        success: true,
        message: "Order status updated",
        orderId: data.orderId,
        status: data.status
      });
    } else {
      console.log(`Failed to update order ${data.orderId}: ${result.message}`);
      return corsHelpers.createResponse(400, { 
        error: "Update failed", 
        message: result.message || "Could not update order status" 
      });
    }
  } catch (error) {
    console.log("Error updating order:", error);
    return corsHelpers.createResponse(500, { 
      error: "Failed to update order", 
      details: error.message 
    });
  }
};
