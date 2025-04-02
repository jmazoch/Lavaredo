const corsHelpers = require('./utils/cors-headers');

exports.handler = async function(event, context) {
  // Handle OPTIONS preflight requests
  if (event.httpMethod === 'OPTIONS') {
    return corsHelpers.handleOptions();
  }
  
  // Generate response with debug information
  return corsHelpers.createResponse(200, {
    message: "Test function is working!",
    timestamp: new Date().toISOString(),
    headers: {
      userAgent: event.headers['user-agent'] || 'unknown',
      contentType: event.headers['content-type'] || 'not provided',
      authorization: event.headers.authorization ? 'Present (begins with: ' + 
                    event.headers.authorization.substring(0, 10) + '...)' : 'Not provided'
    }
  });
};
