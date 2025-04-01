document.addEventListener('DOMContentLoaded', function() {
    console.log('RidersKlan module loaded');
    
    // Show login modal function to expose to global scope
    function showLoginModal() {
        const loginOverlay = document.getElementById('loginOverlay');
        const loginPopup = document.getElementById('loginPopup');
        
        // Display login overlay
        if (loginOverlay) {
            loginOverlay.classList.add('active');
            setTimeout(() => {
                if (loginPopup) {
                    loginPopup.classList.add('active');
                }
            }, 10);
        }
        
        // Blur main content
        const pageContent = document.getElementById('pageContent');
        if (pageContent) {
            pageContent.classList.add('blurred');
        }
    }
    
    // Initialize Netlify Identity widget if available
    if (window.netlifyIdentity) {
        netlifyIdentity.on('login', user => {
            console.log('Login event from main site');
            
            try {
                // Check if user has admin role (or use email as fallback)
                const isAdmin = (user.app_metadata && 
                              user.app_metadata.roles && 
                              user.app_metadata.roles.includes('admin')) ||
                              user.email === process.env.ADMIN_EMAIL;
                
                if (isAdmin) {
                    // Store admin user data
                    const adminUser = {
                        name: user.user_metadata.full_name || user.email,
                        email: user.email,
                        isAdmin: true,
                        role: 'admin',
                        auth: Date.now()
                    };
                    
                    localStorage.setItem('loggedInUser', JSON.stringify(adminUser));
                    sessionStorage.setItem('isLoggedIn', 'true');
                    sessionStorage.setItem('isAdmin', 'true');
                    sessionStorage.setItem('adminToken', user.token.access_token);
                    
                    // Close the modal
                    netlifyIdentity.close();
                    
                    // Show success message
                    showLoginSuccess('Admin login successful. Redirecting to admin panel...');
                    
                    // Redirect to admin dashboard after a short delay
                    setTimeout(function() {
                        window.location.href = 'admin-dashboard.html';
                    }, 1000);
                } else {
                    // Not an admin
                    const errorMessage = document.getElementById('errorMessage');
                    errorMessage.textContent = 'You do not have admin privileges';
                    errorMessage.classList.add('active');
                    animateFormError();
                    netlifyIdentity.close();
                }
            } catch (error) {
                console.error('Error processing login:', error);
            }
        });
    }
    
    // Handle login form submission
    const loginForm = document.getElementById('loginForm');
    if (loginForm) {
        loginForm.addEventListener('submit', function(e) {
            e.preventDefault();
            
            // Clear previous errors
            const errorMessage = document.getElementById('errorMessage');
            errorMessage.textContent = '';
            errorMessage.classList.remove('active');
            
            // Try to use Netlify Identity if available
            if (window.netlifyIdentity) {
                netlifyIdentity.open('login');
            } else {
                // Fallback if Netlify Identity is not available
                errorMessage.textContent = 'Authentication service not available';
                errorMessage.classList.add('active');
                animateFormError();
            }
        });
    }
    
    function animateFormError() {
        // Add shake animation to the form
        const loginForm = document.getElementById('loginForm');
        if (loginForm && loginForm.parentNode) {
            loginForm.parentNode.classList.add('shake');
            
            // Remove the animation class after animation completes
            setTimeout(() => {
                loginForm.parentNode.classList.remove('shake');
            }, 500);
        }
    }
    
    // Helper function to show login success message
    function showLoginSuccess(message) {
        const errorMessage = document.getElementById('errorMessage');
        errorMessage.textContent = message;
        errorMessage.style.color = '#4CAF50';
        errorMessage.classList.add('active');
        
        // Add success class to login popup
        const loginPopup = document.querySelector('.login-popup');
        if (loginPopup) {
            loginPopup.classList.add('login-success');
        }
    }
    
    // Expose the login modal function globally
    window.showAdminLogin = showLoginModal;
});