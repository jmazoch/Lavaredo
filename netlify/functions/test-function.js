// Simple test function with enhanced debugging
exports.handler = async function(event, context) {
  // Log detailed information about the request
  console.log('==== TEST FUNCTION INVOKED ====');
  console.log('HTTP Method:', event.httpMethod);
  console.log('Path:', event.path);
  console.log('Headers:', JSON.stringify(event.headers));
  
  // Set up CORS headers
  const headers = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Headers': 'Content-Type',
    'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
    'Content-Type': 'application/json'
  };
  
  // Handle OPTIONS preflight requests
  if (event.httpMethod === 'OPTIONS') {
    console.log('Responding to OPTIONS request');
    return {
      statusCode: 200,
      headers,
      body: ''
    };
  }
  
  // Generate test response with debug info
  const responseData = {
    message: 'Test function working!',
    timestamp: new Date().toISOString(),
    environment: process.env.NODE_ENV || 'unknown',
    deployID: process.env.DEPLOY_ID || 'unknown',
    functionName: process.env.AWS_LAMBDA_FUNCTION_NAME || 'unknown',
    path: event.path,
    httpMethod: event.httpMethod,
    headers: {
      host: event.headers.host,
      referer: event.headers.referer,
      // Don't include all headers for security
    }
  };
  
  console.log('Sending response:', JSON.stringify(responseData));
  
  return {
    statusCode: 200,
    headers,
    body: JSON.stringify(responseData)
  };
};
