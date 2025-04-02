/**
 * Shared utilities for the test card and dashboard
 */

const TestUtils = {
    // Generate a consistent device ID and store it
    initDeviceId: function() {
        const storedDeviceId = localStorage.getItem('testDeviceId');
        const deviceId = storedDeviceId || `DEV-${Math.random().toString(36).substring(2, 8)}`;
        
        // Store in localStorage for persistence
        localStorage.setItem('testDeviceId', deviceId);
        
        return deviceId;
    },
    
    // Format date/time consistently
    formatDateTime: function(timestamp) {
        if (!timestamp) return 'N/A';
        
        const date = new Date(timestamp);
        return date.toLocaleString();
    },
    
    // Generate a mock order with random data
    generateMockOrder: function(deviceId) {
        const sampleProducts = [
            { name: 'Jersey Classic', gender: 'Men', sizes: ['S', 'M', 'L', 'XL'] },
            { name: 'Jersey Pro', gender: 'Women', sizes: ['S', 'M', 'L'] },
            { name: 'Bibs Basic', gender: 'Men', sizes: ['S', 'M', 'L', 'XL'] },
            { name: 'Bibs Elite', gender: 'Women', sizes: ['S', 'M', 'L'] },
            { name: 'Cycling Cap', gender: 'Unisex', sizes: ['One Size'] }
        ];
        
        const sampleNames = [
            'John Doe', 'Jane Smith', 'Michael Brown', 'Emma Wilson', 
            'David Miller', 'Sarah Johnson', 'James Taylor', 'Lisa Davis'
        ];
        
        const randomProduct = this.randomArrayItem(sampleProducts);
        
        return {
            id: `TEST-${deviceId}-${Date.now()}`,
            customer: this.randomArrayItem(sampleNames),
            email: `test-${Math.floor(Math.random() * 1000)}@example.com`,
            phone: `+420 ${Math.floor(100 + Math.random() * 900)} ${Math.floor(100 + Math.random() * 900)} ${Math.floor(100 + Math.random() * 900)}`,
            items: [
                {
                    name: randomProduct.name,
                    gender: randomProduct.gender,
                    size: this.randomArrayItem(randomProduct.sizes),
                    image: 'img/jerseys/jersey1.jpg' // Placeholder image
                }
            ],
            date: new Date().toISOString(),
            timestamp: Date.now(),
            status: 'preordered',
            source: 'test-card',
            deviceId
        };
    },
    
    // Helper to get a random item from an array
    randomArrayItem: function(array) {
        return array[Math.floor(Math.random() * array.length)];
    },
    
    // Submit order to Netlify function
    submitOrder: async function(orderData) {
        const response = await fetch('/.netlify/functions/submit-order', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify(orderData)
        });
        
        if (!response.ok) {
            throw new Error(`Failed to submit order: ${response.statusText}`);
        }
        
        return await response.json();
    },
    
    // Get all orders with admin token
    getAllOrders: async function() {
        // Generate admin token for authorization
        const adminToken = `admin_${Date.now()}_${Math.random().toString(36).substring(2, 15)}`;
        
        const response = await fetch('/.netlify/functions/admin-orders', {
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${adminToken}`
            }
        });
        
        if (!response.ok) {
            throw new Error(`Failed to fetch orders: ${response.statusText}`);
        }
        
        const data = await response.json();
        return data.orders || [];
    }
};

// Make available globally if needed
window.TestUtils = TestUtils;
