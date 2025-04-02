/**
 * Enhanced navigation bar functionality
 */

document.addEventListener('DOMContentLoaded', function() {
    console.log('Navbar module loaded - checking cart visibility');
    
    // Debug cart icon presence
    const cartIcon = document.querySelector('.cart-icon');
    console.log('Cart icon found in DOM:', cartIcon ? 'Yes' : 'No');
    
    if (cartIcon) {
        // Force display style by default
        cartIcon.style.display = 'block';
        console.log('Initial cart icon display style set to block');
    }
    
    // Enhanced function to manage cart icon visibility
    function manageCartVisibility() {
        try {
            const userData = localStorage.getItem('loggedInUser');
            const cartIconElement = document.querySelector('.cart-icon');
            
            if (!cartIconElement) {
                console.error('Cart icon element not found in the DOM');
                return;
            }
            
            // Force visibility - default state should be visible
            cartIconElement.style.display = 'block';
            
            // ONLY hide for admin users, everyone else should see it
            if (userData) {
                const user = JSON.parse(userData);
                if (user && user.isAdmin) {
                    console.log('Admin user detected - hiding cart icon');
                    cartIconElement.style.display = 'none';
                } else {
                    // Force non-admin cart visibility
                    console.log('Non-admin user - ensuring cart is visible');
                    cartIconElement.style.display = 'block';
                }
            } else {
                // No user logged in - ensure cart is visible
                console.log('No user logged in - ensuring cart is visible');
                cartIconElement.style.display = 'block';
            }
        } catch (e) {
            console.error('Error in cart visibility management:', e);
            // In case of error, make cart visible by default
            const cartIconElement = document.querySelector('.cart-icon');
            if (cartIconElement) cartIconElement.style.display = 'block';
        }
    }
    
    // Initialize cart dropdown behavior
    if (cartIcon) {
        const cartDropdown = document.querySelector('.cart-dropdown');
        if (cartDropdown) {
            // Show dropdown on hover for desktop
            if (window.innerWidth > 768) {
                cartIcon.addEventListener('mouseenter', function() {
                    cartDropdown.style.display = 'block';
                });
                
                cartIcon.addEventListener('mouseleave', function() {
                    cartDropdown.style.display = 'none';
                });
            } 
            // For mobile, toggle on click
            else {
                const cartBtn = document.getElementById('cartBtn');
                if (cartBtn) {
                    cartBtn.addEventListener('click', function(e) {
                        if (cartDropdown.style.display === 'block') {
                            cartDropdown.style.display = 'none';
                        } else {
                            cartDropdown.style.display = 'block';
                            e.preventDefault(); // Prevent navigation on first click
                        }
                    });
                }
            }
        }
    }
    
    // Update cart count from localStorage on page load
    function updateCartCountOnLoad() {
        try {
            const cart = JSON.parse(localStorage.getItem('shopping_cart')) || [];
            const cartCountElements = document.querySelectorAll('.cart-count');
            const cartTotalItems = document.getElementById('cartTotalItems');
            
            cartCountElements.forEach(element => {
                if (element) element.textContent = cart.length;
            });
            
            if (cartTotalItems) cartTotalItems.textContent = cart.length;
        } catch (e) {
            console.error('Error updating cart count:', e);
        }
    }
    
    // Initialize count on page load
    updateCartCountOnLoad();
    
    // Manage cart icon visibility immediately
    manageCartVisibility();
    
    // And again after a slight delay to ensure it's applied after other scripts
    setTimeout(manageCartVisibility, 500);
    
    // Add to global scope for access from other scripts
    window.manageCartVisibility = manageCartVisibility;
});
