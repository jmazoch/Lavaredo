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
    
    // Fetch data from Google Apps Script
    const response = await fetch(GOOGLE_SCRIPT_URL + '?action=getOrders', {
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
    
    // Ensure we have an array of rows
    if (!data.rows || !Array.isArray(data.rows)) {
      console.error('Invalid data format from Google Sheets API');
      return corsHelpers.createResponse(500, { 
        error: "Invalid data format from Google Sheets API",
        received: data
      });
    }
    
    // Transform rows into order objects
    const orders = data.rows.map(row => ({
      id: row.ID || `ORD-${Date.now()}-${Math.floor(Math.random() * 1000)}`,
      customer: row.Name || 'Unknown',
      email: row.Email || '',
      phone: row.Phone || '',
      items: parseItems(row.Items),
      timestamp: row.Timestamp ? new Date(row.Timestamp).getTime() : Date.now(),
      date: row.Timestamp || new Date().toISOString(),
      status: extractStatus(row.Items) || 'preordered',
      source: 'googlesheets'
    }));
    
    console.log(`Processed ${orders.length} orders from Google Sheets`);
    
    // Return the processed orders
    return corsHelpers.createResponse(200, {
      success: true,
      message: "Orders retrieved successfully",
      timestamp: new Date().toISOString(),
      orders: orders,
      stats: generateStats(orders)
    });
    
  } catch (error) {
    console.error("Error retrieving orders:", error);
    return corsHelpers.createResponse(500, { 
      error: "Failed to retrieve orders", 
      details: error.message,
      stack: error.stack
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
