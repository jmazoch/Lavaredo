const corsHelpers = require('./utils/cors-headers');
const orderDb = require('./utils/order-database');
const fs = require('fs');
const path = require('path');

exports.handler = async function(event, context) {
  console.log('Admin-orders function called with method:', event.httpMethod);
  console.log('Headers:', JSON.stringify(event.headers).substring(0, 200));
  
  // Handle OPTIONS requests
  if (event.httpMethod === 'OPTIONS') {
    return corsHelpers.handleOptions();
  }
  
  // Only allow GET requests
  if (event.httpMethod !== "GET") {
    return corsHelpers.createResponse(405, { error: "Method Not Allowed" });
  }
  
  // Accept any Bearer token for now
  const authHeader = event.headers.authorization || '';
  if (!authHeader.startsWith('Bearer ')) {
    console.log('Missing or invalid Authorization header');
    return corsHelpers.createResponse(401, { 
      error: "Unauthorized", 
      message: "Valid Bearer token required" 
    });
  }
  
  try {
    console.log('Loading orders from database...');
    
    // Direct check of the file system for debugging
    const tmpPaths = ['/tmp', './.netlify/tmp', './.netlify/data'];
    
    for (const tmpPath of tmpPaths) {
      try {
        const ordersPath = path.join(tmpPath, 'orders.json');
        if (fs.existsSync(ordersPath)) {
          console.log(`Found orders.json at ${ordersPath}`);
          try {
            const rawData = fs.readFileSync(ordersPath, 'utf8');
            const fileOrders = JSON.parse(rawData);
            console.log(`File contains ${fileOrders.length} orders`);
          } catch (readError) {
            console.error(`Error reading file: ${readError.message}`);
          }
        } else {
          console.log(`No orders.json found at ${tmpPath}`);
        }
      } catch (e) {
        console.log(`Error checking ${tmpPath}: ${e.message}`);
      }
    }
    
    // Force reload from storage
    if (orderDb.resetCache) {
      console.log('Resetting cache to force reload from storage');
      orderDb.resetCache();
    }
    
    // Get all orders from the database
    const orders = orderDb.getAllOrders();
    console.log(`Retrieved ${orders.length} orders from database`);
    
    // Get database statistics
    const stats = orderDb.getStats ? orderDb.getStats() : { totalOrders: orders.length, statuses: {} };
    
    // Get the current timestamp
    const currentTime = new Date().toISOString();
    
    // Create the response with orders and stats
    const response = {
      message: "Orders retrieved successfully",
      timestamp: currentTime,
      stats: stats,
      orders: orders,
      debug: {
        functionPath: __dirname,
        cwd: process.cwd(),
        isArray: Array.isArray(orders),
        ordersSample: orders.length > 0 ? JSON.stringify(orders[0]).substring(0, 100) + '...' : 'No orders'
      }
    };
    
    return corsHelpers.createResponse(200, response);
  } catch (error) {
    console.error("Error retrieving orders:", error);
    return corsHelpers.createResponse(500, { 
      error: "Failed to retrieve orders", 
      details: error.message,
      stack: error.stack
    });
  }
};
