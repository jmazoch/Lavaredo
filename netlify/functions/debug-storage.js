const corsHelpers = require('./utils/cors-headers');
const orderDb = require('./utils/order-database');
const persistentStore = require('./utils/persistent-store');

exports.handler = async function(event, context) {
  // Handle OPTIONS requests
  if (event.httpMethod === 'OPTIONS') {
    return corsHelpers.handleOptions();
  }
  
  try {
    // Get environment info
    const envInfo = {
      nodeVersion: process.version,
      platform: process.platform,
      arch: process.arch,
      env: process.env.NODE_ENV || 'unknown',
      tempDir: process.env.TEMP || process.env.TMP || '/tmp',
      cwd: process.cwd(),
      netlifyDir: process.env.NETLIFY_FUNCTION_DIR || 'unknown'
    };

    // Get storage status
    const storageInfo = persistentStore.getStorageInfo();
    
    // Attempt to save and load a test order
    const testOrder = {
      id: `DEBUG-${Date.now()}`,
      customer: "Debug Test",
      email: "debug@test.com",
      items: [{name: "Debug Item", gender: "Test", size: "One"}],
      timestamp: Date.now(),
      test: true
    };
    
    // Save test order
    const saveResult = orderDb.saveOrder(testOrder);
    
    // Get all orders
    const allOrders = orderDb.getAllOrders();
    
    // Create response with all diagnostic info
    const response = {
      success: true,
      message: "Storage diagnostic complete",
      timestamp: new Date().toISOString(),
      environment: envInfo,
      storage: storageInfo,
      testSave: {
        saved: Boolean(saveResult),
        orderId: testOrder.id
      },
      orders: {
        count: allOrders.length,
        ids: allOrders.map(order => order.id).slice(0, 50), // Get first 50 order IDs
        latest: allOrders.length > 0 ? allOrders[allOrders.length - 1] : null
      }
    };
    
    return corsHelpers.createResponse(200, response);
  } catch (error) {
    console.error("Error in debug-storage function:", error);
    return corsHelpers.createResponse(500, { 
      error: "Failed to get storage diagnostics", 
      details: error.message,
      stack: error.stack
    });
  }
};
