const corsHelpers = require('./utils/cors-headers');
const orderDb = require('./utils/order-database');

exports.handler = async function(event, context) {
  // Handle OPTIONS requests
  if (event.httpMethod === 'OPTIONS') {
    return corsHelpers.handleOptions();
  }
  
  // Only allow POST requests
  if (event.httpMethod !== "POST") {
    return corsHelpers.createResponse(405, { error: "Method Not Allowed" });
  }
  
  // More flexible authentication - accept any bearer token for now
  const authHeader = event.headers.authorization || '';
  if (!authHeader.startsWith('Bearer ')) {
    console.log('Missing or invalid Authorization header:', authHeader);
    return corsHelpers.createResponse(401, { 
      error: "Unauthorized", 
      message: "Valid Bearer token required"
    });
  }
  
  // Log the auth header for debugging
  console.log('Auth header received:', authHeader.substring(0, 20) + '...');
  
  try {
    // Parse the request body
    let data = {};
    let count = 5; // Default count
    
    try {
      data = JSON.parse(event.body);
      if (data.count && typeof data.count === 'number') {
        count = Math.min(Math.max(data.count, 1), 20); // Limit between 1-20
      }
    } catch (e) {
      console.log('No valid JSON body found, using defaults');
    }
    
    console.log(`Generating ${count} test orders`);
    
    // Generate test orders
    const orders = [];
    const statuses = ['preordered', 'added', 'paid'];
    const products = [
      { name: 'Jersey Classic', gender: 'Men', sizes: ['S', 'M', 'L', 'XL'] },
      { name: 'Jersey Pro', gender: 'Women', sizes: ['S', 'M', 'L'] },
      { name: 'Bibs Basic', gender: 'Men', sizes: ['S', 'M', 'L', 'XL'] },
      { name: 'Bibs Elite', gender: 'Women', sizes: ['S', 'M', 'L'] },
      { name: 'Cycling Cap', gender: 'Unisex', sizes: ['One Size'] }
    ];
    
    for (let i = 0; i < count; i++) {
      const now = Date.now();
      const randomDaysAgo = Math.floor(Math.random() * 30);
      const timestamp = now - (randomDaysAgo * 24 * 60 * 60 * 1000);
      
      const orderItems = [];
      // Add 1-3 random items
      const itemCount = Math.floor(Math.random() * 3) + 1;
      for (let j = 0; j < itemCount; j++) {
        const product = products[Math.floor(Math.random() * products.length)];
        orderItems.push({
          name: product.name,
          gender: product.gender,
          size: product.sizes[Math.floor(Math.random() * product.sizes.length)]
        });
      }
      
      const order = {
        id: `TEST-${Date.now()}-${i}`,
        customer: `Test Customer ${i + 1}`,
        email: `test${i + 1}@example.com`,
        phone: `+420 ${Math.floor(100 + Math.random() * 900)} ${Math.floor(100 + Math.random() * 900)} ${Math.floor(100 + Math.random() * 900)}`,
        date: new Date(timestamp).toISOString(),
        timestamp: timestamp,
        status: statuses[Math.floor(Math.random() * statuses.length)],
        source: 'test',
        items: orderItems
      };
      
      // Save to database
      const savedOrder = orderDb.saveOrder(order);
      orders.push(savedOrder);
    }
    
    return corsHelpers.createResponse(200, {
      success: true,
      message: `Generated ${orders.length} test orders`,
      count: orders.length,
      orders: orders
    });
  } catch (error) {
    console.error('Error generating test orders:', error);
    return corsHelpers.createResponse(500, {
      error: 'Failed to generate test orders',
      details: error.message
    });
  }
};
