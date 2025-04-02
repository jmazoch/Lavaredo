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
  
  console.log('Sync local orders function called');
  
  try {
    // Parse the incoming request body which should contain an array of orders
    const data = JSON.parse(event.body);
    
    if (!data.orders || !Array.isArray(data.orders)) {
      console.log('Missing orders array');
      return corsHelpers.createResponse(400, { error: "Missing orders array" });
    }
    
    const orders = data.orders;
    console.log(`Received ${orders.length} orders to sync`);
    
    // Track successful and failed syncs
    const results = {
      total: orders.length,
      successful: 0,
      failed: 0,
      details: []
    };
    
    // Process each order
    for (const order of orders) {
      try {
        // Basic validation
        if (!order.id || !order.customer || !order.email || !Array.isArray(order.items)) {
          results.failed++;
          results.details.push({
            id: order.id || 'unknown',
            success: false,
            error: 'Invalid order data'
          });
          continue;
        }
        
        // Save order to database
        const savedOrder = orderDb.saveOrder(order);
        
        results.successful++;
        results.details.push({
          id: savedOrder.id,
          success: true
        });
        
        console.log(`Synced order: ${savedOrder.id}`);
      } catch (orderError) {
        console.error(`Error syncing order:`, orderError);
        results.failed++;
        results.details.push({
          id: order.id || 'unknown',
          success: false,
          error: orderError.message
        });
      }
    }
    
    // Return summary of results
    return corsHelpers.createResponse(200, {
      success: true,
      message: `Sync completed: ${results.successful} orders synced, ${results.failed} failed`,
      results
    });
  } catch (error) {
    console.error("Error syncing orders:", error);
    return corsHelpers.createResponse(500, { 
      error: "Failed to sync orders", 
      details: error.message 
    });
  }
};
