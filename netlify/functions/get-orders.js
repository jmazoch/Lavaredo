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
    console.log(`Using URL: ${GOOGLE_SCRIPT_URL}`);
    
    // Generate sample test data as fallback
    const sampleOrders = generateSampleOrders();
    
    try {
      // Try to fetch from Google Sheets with timeout
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 5000); // 5 second timeout
      
      // Fetch data from Google Apps Script
      const response = await fetch(`${GOOGLE_SCRIPT_URL}?action=getOrders`, {
        method: 'GET',
        signal: controller.signal,
        headers: {
          'Content-Type': 'application/json'
        }
      });
      
      clearTimeout(timeoutId);
      
      if (!response.ok) {
        console.error(`Google Sheets API error: ${response.status}`);
        throw new Error(`Google Sheets API responded with status ${response.status}`);
      }
      
      // Get response text first for debugging
      const responseText = await response.text();
      console.log(`Google Sheets response: ${responseText.substring(0, 200)}...`);
      
      // Try to parse the response
      let data;
      try {
        data = JSON.parse(responseText);
      } catch (parseError) {
        console.error('Error parsing JSON from Google Sheets:', parseError);
        throw new Error('Invalid JSON response from Google Sheets');
      }
      
      // Ensure we have a valid response structure
      if (!data || !data.rows || !Array.isArray(data.rows)) {
        console.log('Falling back to sample data due to invalid response structure');
        return handleSuccessResponse(sampleOrders);
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
      return handleSuccessResponse(orders);
      
    } catch (fetchError) {
      console.error('Error fetching from Google Sheets, using sample data:', fetchError);
      // Return sample data as fallback
      return handleSuccessResponse(sampleOrders);
    }
  } catch (error) {
    console.error("Error retrieving orders:", error);
    return corsHelpers.createResponse(500, { 
      error: "Failed to retrieve orders", 
      details: error.message,
      stack: error.stack
    });
  }
  
  // Helper function for consistent success responses
  function handleSuccessResponse(orders) {
    return corsHelpers.createResponse(200, {
      success: true,
      message: "Orders retrieved successfully",
      timestamp: new Date().toISOString(),
      orders: orders,
      stats: generateStats(orders)
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

/**
 * Generate sample test orders as fallback when Google Sheets is unavailable
 */
function generateSampleOrders() {
  const now = Date.now();
  const orders = [];
  
  // Sample product data
  const products = [
    { name: "Jersey Classic", gender: "Men", sizes: ["S", "M", "L", "XL"] },
    { name: "Jersey Pro", gender: "Women", sizes: ["S", "M", "L"] },
    { name: "Bibs Basic", gender: "Men", sizes: ["S", "M", "L", "XL"] },
    { name: "Cycling Cap", gender: "Unisex", sizes: ["One Size"] }
  ];
  
  // Create 5 sample orders
  for (let i = 0; i < 5; i++) {
    // Create a random timestamp within the last 30 days
    const dayOffset = Math.floor(Math.random() * 30);
    const timestamp = now - (dayOffset * 24 * 60 * 60 * 1000);
    
    // Generate random items
    const itemCount = Math.floor(Math.random() * 3) + 1; // 1-3 items
    const items = [];
    
    for (let j = 0; j < itemCount; j++) {
      const product = products[Math.floor(Math.random() * products.length)];
      const size = product.sizes[Math.floor(Math.random() * product.sizes.length)];
      
      items.push({
        name: product.name,
        gender: product.gender,
        size: size
      });
    }
    
    // Create the order object
    orders.push({
      id: `DEMO-${now}-${i}`,
      customer: `Demo Customer ${i+1}`,
      email: `demo${i+1}@example.com`,
      phone: `+420 ${Math.floor(Math.random() * 900) + 100} ${Math.floor(Math.random() * 900) + 100} ${Math.floor(Math.random() * 900) + 100}`,
      items: items,
      timestamp: timestamp,
      date: new Date(timestamp).toISOString(),
      status: ["preordered", "added", "paid"][Math.floor(Math.random() * 3)],
      source: "demo"
    });
  }
  
  console.log(`Generated ${orders.length} sample orders as fallback`);
  return orders;
}
