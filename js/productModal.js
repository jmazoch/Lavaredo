/**
 * Additional functionality for product modal
 */

// This file exists to provide additional functionality for the product modal
// The main implementation is in products.js

console.log('ProductModal module loaded');

// Add a debugging function to verify size chart functionality
document.addEventListener('DOMContentLoaded', function() {
    // Check if size chart functions are available
    console.log('Size chart functions available:', {
        openSizeChartModal: typeof window.openSizeChartModal === 'function',
        closeSizeChartModal: typeof window.closeSizeChartModal === 'function'
    });
    
    // Add a global debug helper
    window.debugSizeChart = function() {
        console.log('Debugging size chart:');
        console.log('Size chart modal element:', document.getElementById('sizeChartModal'));
        console.log('Size chart button element:', document.getElementById('sizeChartBtn'));
        console.log('openSizeChartModal function:', typeof window.openSizeChartModal);
        
        // Test the function if it exists
        if (typeof window.openSizeChartModal === 'function') {
            console.log('Attempting to open size chart modal for "jerseys"...');
            window.openSizeChartModal('jerseys');
        }
    };
    
    // Update the size chart button text to Czech
    const sizeChartBtn = document.getElementById('sizeChartBtn');
    if (sizeChartBtn) {
        sizeChartBtn.textContent = 'Tabulka velikostí';
    }
    
    // Add event listener to the size chart button as a backup
    if (sizeChartBtn) {
        sizeChartBtn.addEventListener('click', function() {
            console.log('Size chart button clicked (from backup handler)');
            if (typeof window.openSizeChartModal === 'function') {
                window.openSizeChartModal('jerseys'); // Default to jerseys
            } else {
                console.error('openSizeChartModal function not available');
                alert('Size chart functionality is not available. Please try refreshing the page.');
            }
        });
    }
});
