/**
 * Authentication and user account management
 */

console.log('Authentication module loaded');

// Hardcoded demo credentials
const riders = [
    { name: 'admin', password: 'admin123', isAdmin: true },
    { name: 'rider', password: 'rider123', isAdmin: false }
];

document.addEventListener('DOMContentLoaded', function() {
    console.log('Auth: DOM Content Loaded');
    
    // FIX: Remove blur immediately if login is not required
    const pageContent = document.getElementById('pageContent');
    if (window.siteConfig && !window.siteConfig.auth.requireLogin) {
        console.log('Login not required - removing blur');
        if (pageContent) {
            pageContent.classList.remove('blurred');
        }
        
        // Also hide login overlay if it exists
        const loginOverlay = document.getElementById('loginOverlay');
        if (loginOverlay) {
            loginOverlay.classList.remove('active');
        }
    }
    
    // Account management elements
    const loginForm = document.getElementById('loginForm');
    const accountInfo = document.getElementById('accountInfo');
    const accountActions = document.getElementById('accountActions');
    const cartIcon = document.querySelector('.cart-icon');
    const loginOverlay = document.getElementById('loginOverlay');
    
    // Add delayed login popup functionality
    function showLoginWithDelay(delay = 800) {
        // Check if user is already logged in
        const loggedInUser = JSON.parse(localStorage.getItem('loggedInUser'));
        
        // Only show login if login is required by config and user is not logged in
        if (window.siteConfig && window.siteConfig.auth.requireLogin && !loggedInUser) {
            // Blur page content immediately
            const pageContent = document.getElementById('pageContent');
            if (pageContent) {
                pageContent.classList.add('blurred');
            }
            
            // Show login overlay after delay
            setTimeout(function() {
                if (loginOverlay) {
                    loginOverlay.classList.add('active');
                    
                    // Add a class for animation
                    const loginPopup = document.getElementById('loginPopup');
                    if (loginPopup) {
                        loginPopup.classList.add('active');
                    }
                }
            }, delay);
        }
    }
    
    // Check if user is logged in
    function checkLoginStatus() {
        const loggedInUser = JSON.parse(localStorage.getItem('loggedInUser'));
        
        if (loggedInUser) {
            // User is logged in
            if (accountInfo) {
                accountInfo.innerHTML = `
                    <p>Welcome, <strong>${loggedInUser.name}</strong></p>
                    <p>${loggedInUser.isAdmin ? 'Admin Account' : 'Rider Account'}</p>
                `;
            }
            
            // Show/hide cart icon based on user role
            if (cartIcon) {
                if (loggedInUser.isAdmin) {
                    cartIcon.style.display = 'none'; // Hide cart for admin
                } else {
                    cartIcon.style.display = 'block'; // Show cart for riders
                }
            }
            
            // Show account page link and logout button
            if (accountActions) {
                if (loggedInUser.isAdmin) {
                    accountActions.innerHTML = `
                        <a href="admin.html">Admin Dashboard</a>
                        <a href="account.html">My Account</a>
                        <a href="#" id="logoutBtn">Logout</a>
                    `;
                } else {
                    accountActions.innerHTML = `
                        <a href="account.html">My Account</a>
                        <a href="#" id="logoutBtn">Logout</a>
                    `;
                }
                
                // Add event listener to logout button
                const logoutBtn = document.getElementById('logoutBtn');
                if (logoutBtn) {
                    logoutBtn.addEventListener('click', function(e) {
                        e.preventDefault();
                        logout();
                    });
                }
            }
            
            // Remove blur from page content
            const pageContent = document.getElementById('pageContent');
            if (pageContent) {
                pageContent.classList.remove('blurred');
            }
            
            // Hide login overlay
            if (loginOverlay) {
                loginOverlay.classList.remove('active');
            }
            
            // Set session flag for authentication persistence
            sessionStorage.setItem('isLoggedIn', 'true');
            
            // Additional handling for admin status
            if (loggedInUser.isAdmin) {
                window.lavaUtils.safeSetItem('adminAuthenticated', 'true');
                sessionStorage.setItem('adminAuthenticated', 'true');
            }
        } else {
            // User is not logged in
            if (accountInfo) {
                accountInfo.innerHTML = `<p>Not logged in</p>`;
            }
            
            // Show login link
            if (accountActions) {
                accountActions.innerHTML = `<a href="#" id="loginLink">Login</a>`;
                
                // Add event listener to login link
                const loginLink = document.getElementById('loginLink');
                if (loginLink) {
                    loginLink.addEventListener('click', function(e) {
                        e.preventDefault();
                        if (loginOverlay) {
                            loginOverlay.classList.add('active');
                        }
                    });
                }
            }
            
            // Hide cart icon when not logged in
            if (cartIcon) {
                cartIcon.style.display = 'none';
            }
            
            // Remove auth flags
            sessionStorage.removeItem('isLoggedIn');
        }
    }
    
    // Handle logout
    function logout() {
        // Get current user before removing from localStorage
        const loggedInUser = JSON.parse(localStorage.getItem('loggedInUser'));
        
        // Remove user info from localStorage and sessionStorage
        localStorage.removeItem('loggedInUser');
        sessionStorage.removeItem('isLoggedIn');
        sessionStorage.removeItem('adminAuthenticated');
        localStorage.removeItem('adminAuthenticated');
        
        // Update UI
        checkLoginStatus();
        
        // Show login overlay
        if (loginOverlay) {
            loginOverlay.classList.add('active');
        }
        
        // Add blur to page content
        const pageContent = document.getElementById('pageContent');
        if (pageContent) {
            pageContent.classList.add('blurred');
        }
    }
    
    // Initialize login form
    if (loginForm) {
        loginForm.addEventListener('submit', function(e) {
            e.preventDefault();
            
            // Get input values and trim whitespace
            const riderName = document.getElementById('riderName').value.trim();
            const password = document.getElementById('password').value;
            
            // Check credentials - case sensitive match
            let rider = null;
            let loginErrorMessage = '';
            
            // Detailed validation checks
            if (!riderName || !password) {
                loginErrorMessage = 'Please enter both rider name and password';
                console.log('Login error: Empty fields');
            } else {
                // Find rider with matching credentials
                rider = riders.find(r => {
                    return r.name === riderName && r.password === password;
                });
                
                if (!rider) {
                    loginErrorMessage = 'Invalid rider name or password';
                    console.log('Login failed: No matching rider');
                }
            }
            
            // Clear any previous messages
            const errorContainer = document.querySelector('.error-container');
            if (errorContainer) {
                errorContainer.innerHTML = '<p id="errorMessage" class="error-message"></p>';
            }
            
            // Get elements needed for visual feedback
            const loginPopup = document.getElementById('loginPopup');
            
            // Handle login success or failure
            if (rider) {
                // Add success class to login popup
                if (loginPopup) {
                    // Show success state
                    loginPopup.classList.add('login-success');
                    
                    // Display success message
                    if (errorContainer) {
                        errorContainer.innerHTML = `
                            <p class="success-message active">Login successful! Welcome ${rider.name}...</p>
                        `;
                    }
                }
                
                console.log('Login successful for:', rider.name);
                
                // Store user info in localStorage and sessionStorage
                const userData = JSON.stringify({
                    name: rider.name,
                    isAdmin: rider.isAdmin
                });
                
                window.lavaUtils.safeSetItem('loggedInUser', userData);
                sessionStorage.setItem('isLoggedIn', 'true');
                
                if (rider.isAdmin) {
                    sessionStorage.setItem('adminAuthenticated', 'true');
                }
                
                // Initialize user's cart if needed
                if (!rider.isAdmin) {
                    const userCartKey = `cart_${rider.name}`;
                    if (!localStorage.getItem(userCartKey)) {
                        localStorage.setItem(userCartKey, JSON.stringify([]));
                    }
                }
                
                // DELAY before hiding login overlay - gives user time to see success
                setTimeout(function() {
                    // Update UI
                    checkLoginStatus();
                    
                    // Reset success class
                    if (loginPopup) {
                        loginPopup.classList.remove('login-success');
                    }
                    
                    // Update cart display if applicable
                    if (typeof window.updateCartUI === 'function' && !rider.isAdmin) {
                        window.updateCartUI();
                    }
                    
                    // Redirect admin if needed
                    if (rider.isAdmin && window.location.pathname.includes('admin')) {
                        window.location.reload();
                    }
                }, 1500); // 1.5 second delay to show success before closing
                
            } else {
                // Show error message that stays visible
                const errorMessage = document.getElementById('errorMessage');
                if (errorMessage) {
                    errorMessage.textContent = loginErrorMessage;
                    errorMessage.classList.add('active');
                    
                    // Focus on the username field for correction
                    document.getElementById('riderName').focus();
                    
                    // Shake the form
                    if (loginPopup) {
                        loginPopup.classList.add('shake');
                        setTimeout(() => {
                            loginPopup.classList.remove('shake');
                        }, 500);
                    }
                }
            }
        });
    }
    
    // Auto-login for development if enabled in config
    if (window.siteConfig && window.siteConfig.auth.devAutoLogin) {
        console.log('Auto-login enabled for development');
        if (!localStorage.getItem('loggedInUser')) {
            // Auto-login as a rider
            const userData = JSON.stringify({
                name: 'rider',
                isAdmin: false
            });
            window.lavaUtils.safeSetItem('loggedInUser', userData);
            sessionStorage.setItem('isLoggedIn', 'true');
        }
    }
    
    // Initialize authentication based on config
    if (window.siteConfig && window.siteConfig.auth.requireLogin) {
        // Show login overlay with delay
        showLoginWithDelay();
    }
    
    // Check login status on page load
    checkLoginStatus();
    
    // Make functions globally available
    window.checkLoginStatus = checkLoginStatus;
    window.logout = logout;
});

// FIX: Add an emergency function to force remove blur 
// (can be called from browser console if needed)
window.removeBlur = function() {
    console.log('Emergency blur removal executed');
    const pageContent = document.getElementById('pageContent');
    if (pageContent) {
        pageContent.classList.remove('blurred');
    }
    
    // Hide login overlay too
    const loginOverlay = document.getElementById('loginOverlay');
    if (loginOverlay) {
        loginOverlay.classList.remove('active');
    }
};

// Auto-execute the emergency fix if loaded after 3 seconds and still blurred
setTimeout(function() {
    const pageContent = document.getElementById('pageContent');
    if (pageContent && pageContent.classList.contains('blurred')) {
        console.log('Auto-fixing blur after timeout');
        window.removeBlur();
    }
}, 3000);
