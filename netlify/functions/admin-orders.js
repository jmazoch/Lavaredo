// Netlify serverless function to handle admin order retrieval
exports.handler = async function(event, context) {
  console.log('Admin-orders function called with method:', event.httpMethod);
  
  // Set up CORS headers for API response
  const headers = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Headers': 'Content-Type, Authorization',
    'Access-Control-Allow-Methods': 'GET, OPTIONS',
    'Content-Type': 'application/json'
  };
  
  // Handle OPTIONS requests (pre-flight)
  if (event.httpMethod === 'OPTIONS') {
    console.log('Handling OPTIONS pre-flight request');
    return {
      statusCode: 200,
      headers,
      body: ''
    };
  }
  
  // Only allow GET requests
  if (event.httpMethod !== "GET") {
    console.log('Rejecting non-GET request');
    return { 
      statusCode: 405, 
      headers,
      body: JSON.stringify({ error: "Method Not Allowed" })
    };
  }
  
  console.log('Admin orders function processing GET request');
  
  try {
    // Basic authorization check (improve in production)
    const authHeader = event.headers.authorization || '';
    console.log('Authorization header present:', !!authHeader);
    
    // In a production system, we would fetch orders from a database
    // For now, return a sample order list that simulates what would be stored
    
    // Simulated orders from a database - add current timestamp to show freshness
    const currentTime = new Date().toISOString();
    console.log('Generating sample orders with timestamp:', currentTime);
    
    const orders = [
      {
        id: "SERVER-9876",
        customer: "Remote Customer",
        email: "remote@example.com",
        phone: "+420 777 888 999",
        date: currentTime,
        timestamp: Date.now() - 86400000, // 1 day ago
        items: [
          { name: "Remote Jersey", gender: "Men", size: "L" },
          { name: "Remote Bibs", gender: "Men", size: "L" }
        ],
        status: "preordered",
        source: "server"
      },
      {
        id: "SERVER-9875",
        customer: "Another Remote User",
        email: "another@example.com",
        phone: "+420 666 777 888",
        date: new Date(Date.now() - 172800000).toISOString(), // 2 days ago
        timestamp: Date.now() - 172800000,
        items: [
          { name: "Online Jersey", gender: "Women", size: "M" }
        ],
        status: "added",
        source: "server"
      },
      {
        id: "SERVER-" + Date.now().toString().substring(5),
        customer: "Dynamic Server Order",
        email: "dynamic@example.com",
        phone: "+420 123 456 789",
        date: currentTime,
        timestamp: Date.now(),
        items: [
          { name: "Dynamic Jersey", gender: "Men", size: "XL" }
        ],
        status: "paid",
        source: "server"
      }
    ];
    
    console.log('Returning sample orders:', orders.length);
    
    return {
      statusCode: 200,
      headers,
      body: JSON.stringify({ 
        success: true,
        timestamp: currentTime,
        orders: orders
      })
    };
  } catch (error) {
    console.log("Error processing admin orders request:", error);
    return {
      statusCode: 500,
      headers,
      body: JSON.stringify({ error: "Failed to retrieve orders", details: error.message })
    };
  }
};
