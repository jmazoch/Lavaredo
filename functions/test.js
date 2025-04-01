// Simple test function to verify Netlify Functions deployment
exports.handler = async function(event, context) {
  return {
    statusCode: 200,
    body: JSON.stringify({ 
      message: "Netlify Functions are working!",
      timestamp: new Date().toISOString()
    })
  };
};
