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
    console.log('Fetching orders from Google Sheets API');
    
    // Add action parameter to specify you want orders
    const url = `${GOOGLE_SCRIPT_URL}?action=getOrders`;
    console.log(`Fetching from: ${url}`);
    
    // Create a fetch request with timeout
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 10000); // 10 second timeout
    
    const response = await fetch(url, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json'
      },
      signal: controller.signal
    });
    
    clearTimeout(timeoutId);
    
    if (!response.ok) {
      throw new Error(`Google Sheets API returned status ${response.status}`);
    }
    
    // Parse the response from Google Apps Script
    const data = await response.json();
    console.log(`Received data from Google Sheets with ${data.rows ? data.rows.length : 0} rows`);
    
    if (!data.rows || !Array.isArray(data.rows)) {
      console.warn('Unexpected response format from Google Sheets');
      return corsHelpers.createResponse(200, {
        success: true,
        message: "No orders found or empty response from Google Sheets",
        orders: []
      });
    }
    
    // Transform the Sheet rows into order objects
    const orders = data.rows.map(row => ({
      id: row.ID,
      customer: row.Name,
      email: row.Email,
      phone: row.Phone || '',
      items: parseItems(row.Items),
      timestamp: row.Timestamp ? new Date(row.Timestamp).getTime() : Date.now(),
      date: row.Timestamp || new Date().toISOString(),
      status: extractStatus(row.Items) || 'preordered',
      source: 'googlesheets'
    }));
    
    // Return the formatted response
    return corsHelpers.createResponse(200, {
      success: true,
      message: "Orders retrieved successfully",
      orders: orders,
      stats: generateStats(orders)
    });
  } catch (error) {
    console.error("Error retrieving orders:", error);
    return corsHelpers.createResponse(500, { 
      error: "Failed to retrieve orders", 
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
    const items = JSON.parse(itemsStr);
    return Array.isArray(items) ? items : [items];
  } catch (e) {
    // If not valid JSON, return as a single item
    return [{
      name: itemsStr || 'Unknown Item',
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
    const data = JSON.parse(itemsStr);
    
    // Check various locations where status might be stored
    if (data.status) return data.status;
    if (data.metadata?.status) return data.metadata.status;
    if (data.order_status) return data.order_status;
    
    return null;
  } catch (e) {
    return null;
  }
}

/**
 * Generate order statistics
 */
function generateStats(orders) {
  return {
    totalOrders: orders.length,
    statuses: orders.reduce((acc, order) => {
      const status = order.status || 'unknown';
      acc[status] = (acc[status] || 0) + 1;
      return acc;
    }, {})
  };
}
