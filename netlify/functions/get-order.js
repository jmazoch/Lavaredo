const corsHelpers = require('./utils/cors-headers');

// Configuration
const GOOGLE_SCRIPT_URL = process.env.GOOGLE_SHEETS_API_URL || 
  'https://script.google.com/macros/s/AKfycbzM_OOO2LIYgLl9RqdRJFVsayk1-h0uH-zKFDIn2tj92ODWCSXsOvxy9GdKDyldOaTM/exec';

exports.handler = async function(event, context) {
  // Handle OPTIONS preflight requests
  if (event.httpMethod === 'OPTIONS') {
    return corsHelpers.handleOptions();
  }
  
  // Only allow GET requests
  if (event.httpMethod !== "GET") {
    return corsHelpers.createResponse(405, { error: "Method Not Allowed" });
  }
  
  // Check authorization
  const authHeader = event.headers.authorization || '';
  if (!authHeader.startsWith('Bearer ')) {
    return corsHelpers.createResponse(401, { 
      error: "Unauthorized",
      message: "Valid Bearer token required" 
    });
  }
  
  try {
    // Get order ID from query parameters
    const orderId = event.queryStringParameters?.orderId;
    
    if (!orderId) {
      return corsHelpers.createResponse(400, { error: "Missing order ID" });
    }
    
    console.log(`Fetching order details for ID: ${orderId}`);
    
    // Fetch from Google Apps Script with the order ID
    const response = await fetch(`${GOOGLE_SCRIPT_URL}?action=getOrder&id=${encodeURIComponent(orderId)}`, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json'
      }
    });
    
    if (!response.ok) {
      console.error(`Google Sheets API error: ${response.status}`);
      throw new Error(`Google Sheets API responded with status ${response.status}`);
    }
    
    // Parse the response
    const data = await response.json();
    
    if (!data.order) {
      return corsHelpers.createResponse(404, { 
        error: "Order not found", 
        message: "Order ID not recognized" 
      });
    }
    
    // Process the order
    const row = data.order;
    const order = {
      id: row.ID || orderId,
      customer: row.Name || 'Unknown',
      email: row.Email || '',
      phone: row.Phone || '',
      items: parseItems(row.Items),
      timestamp: row.Timestamp ? new Date(row.Timestamp).getTime() : Date.now(),
      date: row.Timestamp || new Date().toISOString(),
      status: extractStatus(row.Items) || 'preordered',
      source: 'googlesheets'
    };
    
    return corsHelpers.createResponse(200, { order });
  } catch (error) {
    console.error("Error fetching order:", error);
    return corsHelpers.createResponse(500, { 
      error: "Failed to fetch order", 
      details: error.message 
    });
  }
};

/**
 * Parse Items JSON string from Google Sheets
 */
function parseItems(itemsStr) {
  if (!itemsStr) return [];
  
  try {
    // Try to parse as JSON
    const items = JSON.parse(itemsStr);
    return Array.isArray(items) ? items : [items];
  } catch (e) {
    // If not valid JSON, return as a single item
    return [{
      name: itemsStr,
      gender: 'Unknown',
      size: 'Unknown'
    }];
  }
}

/**
 * Extract status from Items if available
 */
function extractStatus(itemsStr) {
  if (!itemsStr) return null;
  
  try {
    // Try to find status in the JSON
    const data = JSON.parse(itemsStr);
    
    // If it's directly in the parsed object
    if (data.status) return data.status;
    
    // If it's in metadata
    if (data.metadata && data.metadata.status) return data.metadata.status;
    
    // If we have an order_status field
    if (data.order_status) return data.order_status;
    
    return null;
  } catch (e) {
    // Try regex as a fallback
    const statusMatch = /["`']?status["`']?\s*[:=]\s*["`']?([^"'`,}\]]+)/i.exec(itemsStr);
    return statusMatch ? statusMatch[1].trim().toLowerCase() : null;
  }
}
