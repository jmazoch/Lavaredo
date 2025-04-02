const corsHelpers = require('./utils/cors-headers');
const fs = require('fs');
const path = require('path');

exports.handler = async function(event, context) {
  // Handle OPTIONS preflight requests
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
      functionDir: __dirname,
    };

    // Test locations
    const testLocations = [
      '/tmp',
      '/tmp/orders.json',
      './.netlify/data',
      './.netlify/data/orders.json',
      path.join(__dirname, '../../../.data'),
      path.join(process.cwd(), 'orders.json')
    ];

    // Test each location
    const testResults = {};
    for (const location of testLocations) {
      try {
        const exists = fs.existsSync(location);
        testResults[location] = {
          exists,
          isDirectory: exists ? fs.statSync(location).isDirectory() : null,
          isFile: exists ? fs.statSync(location).isFile() : null
        };
        
        if (exists) {
          if (fs.statSync(location).isFile()) {
            try {
              const content = fs.readFileSync(location, 'utf8');
              testResults[location].fileSize = content.length;
              testResults[location].peek = content.substring(0, 50) + '...';
              
              try {
                const parsed = JSON.parse(content);
                testResults[location].isValidJson = true;
                testResults[location].objectType = Array.isArray(parsed) ? 'array' : 'object';
                testResults[location].itemCount = Array.isArray(parsed) ? parsed.length : Object.keys(parsed).length;
              } catch (e) {
                testResults[location].isValidJson = false;
              }
            } catch (e) {
              testResults[location].readError = e.message;
            }
          }
          else if (fs.statSync(location).isDirectory()) {
            try {
              const files = fs.readdirSync(location);
              testResults[location].files = files.slice(0, 10); // First 10 files
              testResults[location].fileCount = files.length;
            } catch (e) {
              testResults[location].readDirError = e.message;
            }
          }
        }
      } catch (e) {
        testResults[location] = {
          error: e.message
        };
      }
    }

    // Write a test file
    const writeTestResults = {};
    try {
      const testFile = '/tmp/test-write-' + Date.now() + '.txt';
      fs.writeFileSync(testFile, 'Test content ' + new Date().toISOString());
      writeTestResults[testFile] = {
        success: true,
        exists: fs.existsSync(testFile)
      };
    } catch (e) {
      writeTestResults.error = e.message;
    }

    // Return all the info
    return corsHelpers.createResponse(200, {
      message: "File system test complete",
      timestamp: new Date().toISOString(),
      environment: envInfo,
      locations: testResults,
      writeTest: writeTestResults
    });
  } catch (error) {
    console.error("Error in test-files function:", error);
    return corsHelpers.createResponse(500, { 
      error: "Failed to test file system", 
      details: error.message,
      stack: error.stack
    });
  }
};
