/**
 * Scroll-aware navigation functionality
 * Makes the navigation bar stick to the top and changes its appearance on scroll
 */

document.addEventListener('DOMContentLoaded', function() {
    const nav = document.querySelector('nav');
    const logo = document.querySelector('.logo');
    
    // Function to update navigation appearance based on scroll position
    function updateNavOnScroll() {
        if (window.scrollY > 100) {
            // When scrolled down
            nav.classList.add('scrolled');
            
            // Additional code for any JavaScript-based adjustments
            // We'll use CSS for most transitions, but we can add custom logic here if needed
        } else {
            // When at the top
            nav.classList.remove('scrolled');
        }
    }
    
    // Initial check in case the page is loaded scrolled down
    updateNavOnScroll();
    
    // Add scroll event listener with slight performance optimization
    let scrollTimeout;
    window.addEventListener('scroll', function() {
        if (!scrollTimeout) {
            scrollTimeout = setTimeout(function() {
                updateNavOnScroll();
                scrollTimeout = null;
            }, 10);
        }
    });
    
    // For mobile/responsive layouts
    function updateNavMode() {
        if (window.innerWidth <= 768) {
            nav.classList.add('mobile');
            
            // If on mobile, we might want to adjust the scroll behavior
            // For example, we might use less extreme positioning changes
        } else {
            nav.classList.remove('mobile');
        }
    }
    
    // Set initial state
    updateNavMode();
    
    // Update on window resize
    window.addEventListener('resize', updateNavMode);
    
    // Add debug function for easy testing
    window.testNavScroll = function(scrolled) {
        if (scrolled) {
            nav.classList.add('scrolled');
        } else {
            nav.classList.remove('scrolled');
        }
    };
});
