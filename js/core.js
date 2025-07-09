/**
 * Core functionality and configuration for Lavaredo Cycling Gallery
 */

// IMPORTANT: Add this code immediately at the top of the file
// Execute immediately when script loads to remove blur ASAP
(function() {
    const pageContent = document.getElementById('pageContent');
    if (pageContent) {
        pageContent.classList.remove('blurred');
        console.log('Immediate blur removal executed');
    }
})();

// Site configuration settings
const config = {
    // Authentication settings
    auth: {
        // Set to false to disable the login system completely
        requireLogin: false,  // CHANGE THIS FROM true TO false
        
        // Automatic login for development (set to true to bypass login screen)
        devAutoLogin: false
    },
    
    // Site information
    site: {
        name: "Lavaredo",
        email: "info@lavaredo.com"
    }
};

// Make config accessible globally
window.siteConfig = config;

// Shared utility functions
const utils = {
    // Safely set localStorage with error handling
    safeSetItem: function(key, value) {
        try {
            localStorage.setItem(key, value);
            return true;
        } catch (e) {
            console.error('Failed to save to localStorage:', e);
            return false;
        }
    },
    
    // Get back view image path
    getBackImagePath: function(imagePath) {
        const lastDotIndex = imagePath.lastIndexOf('.');
        if (lastDotIndex === -1) return imagePath + '-back';
        return imagePath.substring(0, lastDotIndex) + '-back' + imagePath.substring(lastDotIndex);
    },
    
    // Debug localStorage contents
    debugStorage: function() {
        console.log('Current localStorage contents:');
        for(let i = 0; i < localStorage.length; i++) {
            const key = localStorage.key(i);
            console.log(`${key}: ${localStorage.getItem(key)}`);
        }
    }
};

// Make utils accessible globally
window.lavaUtils = utils;

// Debug function to reset the typewriter animation
window.resetTypewriterAnimation = function() {
    localStorage.removeItem('hasVisitedSite');
    console.log('Typewriter animation has been reset. Reload the page to see it.');
};

// Initialize core functionality when DOM is loaded
document.addEventListener('DOMContentLoaded', function() {
    console.log('Core functionality initialized');
    
    // Force remove blur again on DOM ready
    const pageContent = document.getElementById('pageContent');
    if (pageContent) {
        pageContent.classList.remove('blurred');
        console.log('Blur removed on DOMContentLoaded');
    }
    
    // Add typewriter effect for first visit
    function initTypewriterAnimation() {
        // Check if this is the first visit
        if (localStorage.getItem('hasVisitedSite')) {
            return; // Skip animation on subsequent visits
        }
        
        // Mark as visited
        localStorage.setItem('hasVisitedSite', 'true');
        
        // Get text elements
        const lineLeft = document.querySelector('.hero h1 .line-left');
        const lineCenter = document.querySelector('.hero h1 .line-center');
        const lineRight = document.querySelector('.hero h1 .line-right');
        
        if (!lineLeft || !lineCenter || !lineRight) {
            console.error('Hero text elements not found');
            return;
        }
        
        // Store original text and clear elements
        const textLeft = lineLeft.textContent;
        const textCenter = lineCenter.textContent;
        const textRight = lineRight.textContent;
        
        // Clear and prepare elements for animation
        lineLeft.textContent = '';
        lineCenter.textContent = '';
        lineRight.textContent = '';
        
        // Add typewriter class to each line
        lineLeft.classList.add('typewriter', 'line-1');
        lineCenter.classList.add('typewriter', 'line-2');
        lineRight.classList.add('typewriter', 'line-3');
        
        // Animate first line
        setTimeout(() => {
            lineLeft.textContent = textLeft;
            
            // Animate second line after delay
            setTimeout(() => {
                lineCenter.textContent = textCenter;
                
                // Animate third line after another delay
                setTimeout(() => {
                    lineRight.textContent = textRight;
                }, 3500);
            }, 3500);
        }, 500);
    }
    
    // Initialize typewriter animation
    initTypewriterAnimation();
    
    // Add emergency blur removal if site doesn't require login
    if (window.siteConfig && !window.siteConfig.auth.requireLogin) {
        const pageContent = document.getElementById('pageContent');
        if (pageContent) {
            pageContent.classList.remove('blurred');
        }
    }
    
    // Add smooth scrolling for navigation
    const navLinks = document.querySelectorAll('nav a');
    
    navLinks.forEach(link => {
        link.addEventListener('click', e => {
            // Only apply to links that point to sections on the same page
            if (link.getAttribute('href').startsWith('#')) {
                e.preventDefault();
                
                const targetId = link.getAttribute('href');
                const targetSection = document.querySelector(targetId);
                
                if (targetSection) {
                    window.scrollTo({
                        top: targetSection.offsetTop,
                        behavior: 'smooth'
                    });
                }
            }
        });
    });
});

// FIX: Add a fallback blur removal that triggers after a delay 
// in case the auth scripts fail
setTimeout(function() {
    const pageContent = document.getElementById('pageContent');
    if (pageContent && pageContent.classList.contains('blurred')) {
        console.log('Core fallback: removing blur');
        pageContent.classList.remove('blurred');
    }
}, 2000);
