const corsHelpers = require('./utils/cors-headers');

exports.handler = async function(event, context) {
  // Log detailed information about the request
  console.log('==== TEST FUNCTION INVOKED ====');
  console.log('HTTP Method:', event.httpMethod);
  console.log('Path:', event.path);
  console.log('Headers:', JSON.stringify(event.headers));
  
  // Handle OPTIONS preflight requests
  if (event.httpMethod === 'OPTIONS') {
    return corsHelpers.handleOptions();
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
      authorization: event.headers.authorization ? 'Present (starts with: ' + 
                     event.headers.authorization.substring(0, 10) + '...)' : 'Missing'
    }
  };
  
  // If there's an authorization header, provide some analysis
  if (event.headers.authorization) {
    const authHeader = event.headers.authorization;
    responseData.authAnalysis = {
      type: authHeader.startsWith('Bearer ') ? 'Bearer token' : 'Unknown auth type',
      tokenLength: authHeader.startsWith('Bearer ') ? 
                   authHeader.substring(7).length : authHeader.length,
      validity: authHeader.startsWith('Bearer ') && authHeader.length > 10 ? 
                'Looks valid' : 'May be invalid'
    };
  }
  
  console.log('Sending response:', JSON.stringify(responseData));
  
  return corsHelpers.createResponse(200, responseData);
};
