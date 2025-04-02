const corsHelpers = require('./utils/cors-headers');
const fs = require('fs');
const path = require('path');

exports.handler = async function(event, context) {
  // Handle OPTIONS preflight requests
  if (event.httpMethod === 'OPTIONS') {
    return corsHelpers.handleOptions();
  }
  
  try {
    // Check commonly used storage paths
    const storagePaths = [
      '/tmp',
      './.netlify/data',
      './.netlify/temp',
      path.join(__dirname, '../../../.data'),
      process.env.TEMP || process.env.TMP,
      process.cwd()
    ];
    
    // Results will contain info about each directory
    const results = {};
    
    for (const dir of storagePaths) {
      try {
        // Skip undefined paths
        if (!dir) continue;
        
        let dirExists = false;
        let isWritable = false;
        let files = [];
        let filesCount = 0;
        
        // Check if directory exists
        if (fs.existsSync(dir)) {
          dirExists = true;
          
          // Try to read files in directory
          try {
            const filesList = fs.readdirSync(dir);
            filesCount = filesList.length;
            files = filesList.slice(0, 10); // List first 10 files only
          } catch (readError) {
            files = [`Error reading directory: ${readError.message}`];
          }
          
          // Test if writable
          try {
            const testFile = path.join(dir, '.netlify-write-test');
            fs.writeFileSync(testFile, 'test');
            fs.unlinkSync(testFile);
            isWritable = true;
          } catch (writeError) {
            // Not writable, that's ok
          }
        }
        
        // Store results for this path
        results[dir] = {
          exists: dirExists,
          writable: isWritable,
          filesCount,
          files
        };
        
        // Look for orders.json specifically
        const ordersPath = path.join(dir, 'orders.json');
        if (fs.existsSync(ordersPath)) {
          try {
            const stats = fs.statSync(ordersPath);
            const fileContent = fs.readFileSync(ordersPath, 'utf8');
            
            let parsedOrders = [];
            try {
              parsedOrders = JSON.parse(fileContent);
            } catch (e) {
              // Invalid JSON
            }
            
            results[dir].ordersFile = {
              exists: true,
              size: stats.size,
              modified: stats.mtime,
              ordersCount: Array.isArray(parsedOrders) ? parsedOrders.length : 'Not an array',
              validJson: Array.isArray(parsedOrders)
            };
          } catch (error) {
            results[dir].ordersFile = {
              exists: true,
              error: error.message
            };
          }
        } else {
          results[dir].ordersFile = {
            exists: false
          };
        }
      } catch (error) {
        results[dir] = {
          error: error.message
        };
      }
    }
    
    // Get environment info
    const envInfo = {
      nodeVersion: process.version,
      platform: process.platform,
      arch: process.arch,
      env: process.env.NODE_ENV || 'unknown',
      netlifyFunctionDir: process.env.NETLIFY_FUNCTION_DIR || 'unknown',
      cwd: process.cwd(),
      thisFile: __filename
    };
    
    return corsHelpers.createResponse(200, {
      success: true,
      message: 'Storage paths checked successfully',
      timestamp: new Date().toISOString(),
      environment: envInfo,
      storagePaths: results
    });
  } catch (error) {
    console.error('Error checking storage paths:', error);
    return corsHelpers.createResponse(500, {
      error: 'Failed to check storage paths',
      details: error.message,
      stack: error.stack
    });
  }
};
