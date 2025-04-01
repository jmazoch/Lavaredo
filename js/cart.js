/**
 * Cart functionality: handles shopping cart and pre-orders
 */

console.log('Cart module loaded');

document.addEventListener('DOMContentLoaded', function() {
    console.log('Cart: DOM Content Loaded');
    
    // Check if user is logged in if login is required
    const isLoggedIn = sessionStorage.getItem('isLoggedIn') === 'true';
    if (window.siteConfig && window.siteConfig.auth.requireLogin && !isLoggedIn) {
        console.log('User not logged in - skipping cart initialization');
        return;
    }
    
    // Hide order submission for admin users
    function handleAdminView() {
        const isAdmin = sessionStorage.getItem('adminViewingCart') === 'true';
        if (isAdmin) {
            console.log('Admin view mode - hiding order controls');
            const preorderBtn = document.getElementById('preorderBtn');
            const customerInfoForm = document.querySelector('.customer-info-form');
            
            if (preorderBtn) {
                preorderBtn.style.display = 'none';
            }
            
            if (customerInfoForm) {
                customerInfoForm.style.display = 'none';
            }
            
            // Add an admin notice
            const summaryNote = document.querySelector('.summary-note');
            if (summaryNote) {
                const adminNotice = document.createElement('div');
                adminNotice.className = 'admin-notice';
                adminNotice.innerHTML = '<p><strong>Admin View Mode</strong><br>You are viewing the cart as an admin.</p>';
                summaryNote.prepend(adminNotice);
            }
        }
    }
    
    // Cart UI elements
    const cartCount = document.querySelector('.cart-count');
    const cartItems = document.querySelector('.cart-items');
    const cartTotalItems = document.getElementById('cartTotalItems');
    const addToCartBtn = document.getElementById('addToCartBtn');
    const sizeBtns = document.querySelectorAll('.size-btn');
    
    // Cart page specific elements
    const cartItemsList = document.getElementById('cartItemsList');
    const summaryTotalItems = document.getElementById('summaryTotalItems');
    const preorderBtn = document.getElementById('preorderBtn');
    const continueShoppingBtn = document.getElementById('continueShoppingBtn');
    const successModal = document.getElementById('successModal');
    const orderNumber = document.getElementById('orderNumber');
    const returnToShopBtn = document.getElementById('returnToShopBtn');
    const closeModalBtn = document.querySelector('.close-modal');
    
    // Customer information form fields
    const customerName = document.getElementById('customerName');
    const customerEmail = document.getElementById('customerEmail');
    const customerPhone = document.getElementById('customerPhone');
    
    // Get current user's cart
    function getCurrentUserCart() {
        // For now, allow anonymous shopping (no login required)
        let cart = JSON.parse(localStorage.getItem('shopping_cart')) || [];
        return cart;
    }
    
    // Save cart to localStorage
    function saveUserCart(cart) {
        localStorage.setItem('shopping_cart', JSON.stringify(cart));
        console.log('Cart saved:', cart);
    }

    // Update cart UI for dropdown cart
    function updateCartUI() {
        const cart = getCurrentUserCart();
        console.log('Updating cart UI, cart contains:', cart.length, 'items');
        
        // Update cart count badge in all places
        const cartCountElements = document.querySelectorAll('.cart-count');
        cartCountElements.forEach(element => {
            if (element) element.textContent = cart.length;
        });
        
        // Update total items text if element exists
        if (cartTotalItems) cartTotalItems.textContent = cart.length;
        
        // Clear cart items dropdown
        if (cartItems) {
            cartItems.innerHTML = '';
            
            if (cart.length === 0) {
                cartItems.innerHTML = '<div class="empty-cart">Your cart is empty</div>';
            } else {
                // Add each item to cart dropdown
                cart.forEach((item, index) => {
                    const cartItem = document.createElement('div');
                    cartItem.classList.add('cart-item');
                    cartItem.innerHTML = `
                        <img src="${item.image}" alt="${item.name}" class="cart-item-image">
                        <div class="cart-item-details">
                            <div class="cart-item-name">${item.name}</div>
                            <div class="cart-item-size">${item.gender || ''} ${item.size}</div>
                        </div>
                        <div class="cart-item-remove" data-index="${index}">×</div>
                    `;
                    cartItems.appendChild(cartItem);
                });
            }
            
            // Add event listeners to remove buttons
            document.querySelectorAll('.cart-item-remove').forEach(btn => {
                btn.addEventListener('click', function(e) {
                    e.stopPropagation(); // Prevent event from bubbling to parent elements
                    const index = parseInt(this.getAttribute('data-index'));
                    const cart = getCurrentUserCart();
                    cart.splice(index, 1);
                    saveUserCart(cart);
                    updateCartUI();
                    
                    // If we're on the cart page, update that too
                    if (cartItemsList) {
                        renderCartPage();
                    }
                });
            });
        }
    }
    
    // Render cart page items
    function renderCartPage() {
        console.log('renderCartPage called');
        if (!cartItemsList) {
            console.log('Not on cart page - skipping cart page render');
            return; // Not on cart page
        }
        
        const cart = getCurrentUserCart();
        console.log('Rendering cart with items:', cart);
        
        // Update summary
        if (summaryTotalItems) {
            summaryTotalItems.textContent = cart.length;
        }
        
        // Clear cart items list
        cartItemsList.innerHTML = '';
        
        if (cart.length === 0) {
            // Show empty cart message
            cartItemsList.innerHTML = '<div class="cart-empty-message">Your pre-order list is empty.</div>';
            
            // Disable pre-order button
            if (preorderBtn) {
                preorderBtn.disabled = true;
                preorderBtn.classList.add('disabled');
            }
        } else {
            // Enable pre-order button
            if (preorderBtn) {
                preorderBtn.disabled = false;
                preorderBtn.classList.remove('disabled');
            }
            
            // Add each item to cart page
            cart.forEach((item, index) => {
                const cartItem = document.createElement('div');
                cartItem.classList.add('cart-item');
                cartItem.innerHTML = `
                    <div class="cart-item-details">
                        <img src="${item.image}" alt="${item.name}" class="cart-item-image">
                        <div class="cart-item-info">
                            <h3>${item.name}</h3>
                            <p>Added to pre-order: ${item.date || 'Today'}</p>
                        </div>
                    </div>
                    <div class="cart-item-size">${item.size}</div>
                    <div class="cart-item-actions">
                        <button class="remove-item" data-index="${index}">Remove</button>
                    </div>
                `;
                cartItemsList.appendChild(cartItem);
            });
            
            // Add event listeners to remove buttons
            cartItemsList.querySelectorAll('.remove-item').forEach(btn => {
                btn.addEventListener('click', function() {
                    const index = parseInt(this.getAttribute('data-index'));
                    const cart = getCurrentUserCart();
                    cart.splice(index, 1);
                    saveUserCart(cart);
                    updateCartUI();
                    renderCartPage();
                });
            });
        }
    }
    
    // Submit pre-order to Netlify Function with improved error handling for production
    async function submitPreorder(customerInfo) {
        const cart = getCurrentUserCart();
        
        if (!cart.length) {
            console.error('Cannot submit empty cart');
            return null;
        }
        
        try {
            // Generate order ID and timestamp
            const orderId = Math.floor(1000 + Math.random() * 9000);
            const timestamp = new Date().toISOString();
            
            // Prepare order data
            const orderData = {
                id: orderId,
                customer: customerInfo.name,
                email: customerInfo.email,
                phone: customerInfo.phone || '',
                date: timestamp,
                timestamp: Date.now(),
                items: cart,
                status: 'preordered'
            };
            
            console.log('Odesílám objednávku do Netlify funkcí...');
            console.log('Data objednávky:', JSON.stringify(orderData).substring(0, 100) + '...');
            
            try {
                // Zkusíme zavolat funkci na různých URL (pro případ odlišného nasazení)
                const urls = [
                    '/.netlify/functions/submit-order',
                    '/api/submit-order'
                ];
                
                let response = null;
                let error = null;
                
                // Zkusíme každou URL dokud některá nefunguje
                for (const url of urls) {
                    try {
                        console.log(`Zkouším odeslat na: ${url}`);
                        response = await fetch(url, {
                            method: 'POST',
                            headers: {
                                'Content-Type': 'application/json'
                            },
                            body: JSON.stringify(orderData)
                        });
                        
                        if (response.ok) {
                            console.log(`Úspěch! URL ${url} funguje.`);
                            break;
                        } else {
                            console.warn(`URL ${url} vrátila status: ${response.status}`);
                            error = `Status: ${response.status}`;
                        }
                    } catch (fetchError) {
                        console.warn(`Chyba při volání ${url}:`, fetchError);
                        error = fetchError.message;
                    }
                }
                
                // Pokud máme úspěšnou odpověď
                if (response && response.ok) {
                    const result = await response.json();
                    console.log('Objednávka odeslána úspěšně:', result);
                    
                    // Uložíme také do localStorage jako zálohu
                    const existingOrders = JSON.parse(localStorage.getItem('submittedOrders')) || [];
                    existingOrders.push(orderData);
                    localStorage.setItem('submittedOrders', JSON.stringify(existingOrders));
                    
                    // Vyčistíme košík
                    localStorage.setItem('shopping_cart', JSON.stringify([]));
                    
                    // Add analytics tracking if needed
                    if (window.gtag) {
                        window.gtag('event', 'order_submitted', {
                            'event_category': 'ecommerce',
                            'event_label': orderData.id
                        });
                    }
                    
                    return orderData.id;
                } else {
                    // Pokud server selhal, ale máme data, uložíme je lokálně
                    console.error('Serverová část selhala:', error || 'Neznámá chyba');
                    console.log('Ukládám do localStorage jako zálohu');
                    
                    // Uložíme do localStorage
                    const existingOrders = JSON.parse(localStorage.getItem('submittedOrders')) || [];
                    existingOrders.push(orderData);
                    localStorage.setItem('submittedOrders', JSON.stringify(existingOrders));
                    
                    // Vyčistíme košík
                    localStorage.setItem('shopping_cart', JSON.stringify([]));
                    
                    // Add more visible feedback to user about the fallback
                    alert('We saved your pre-order locally. Our team will get in touch soon.');
                    
                    return orderData.id;
                }
            } catch (serverError) {
                console.error('Chyba při odesílání na server:', serverError);
                
                // Záloha do localStorage
                const existingOrders = JSON.parse(localStorage.getItem('submittedOrders')) || [];
                existingOrders.push(orderData);
                localStorage.setItem('submittedOrders', JSON.stringify(existingOrders));
                
                // Vyčistíme košík
                localStorage.setItem('shopping_cart', JSON.stringify([]));
                
                // Add more visible feedback to user about the fallback
                alert('We saved your pre-order locally. Our team will get in touch soon.');
                
                return orderData.id;
            }
        } catch (error) {
            console.error('Chyba v procesu odesílání objednávky:', error);
            return null;
        }
    }
    
    // Helper function to save order to localStorage
    function saveOrderToLocalStorage(orderData) {
        try {
            const existingOrders = JSON.parse(localStorage.getItem('submittedOrders')) || [];
            existingOrders.push(orderData);
            localStorage.setItem('submittedOrders', JSON.stringify(existingOrders));
            
            // Clear the cart
            localStorage.setItem('shopping_cart', JSON.stringify([]));
            
            console.log('Order saved to localStorage with ID:', orderData.id);
            return orderData.id;
        } catch (error) {
            console.error('Error saving to localStorage:', error);
            return null;
        }
    }

    // Initialize cart UI
    updateCartUI();
    
    // Initialize cart page if we're on it
    if (cartItemsList) {
        console.log('Cart page detected - rendering cart');
        renderCartPage();
        handleAdminView(); // Apply admin-specific changes if needed
        
        // Add event listeners for cart page buttons
        if (preorderBtn) {
            preorderBtn.addEventListener('click', async function() { // Make this function async
                console.log('Submit pre-order button clicked');
                // Validate customer information form first
                if (!validateCustomerForm()) {
                    return; // Stop if validation fails
                }
                
                // Get customer information
                const customerInfo = {
                    name: customerName.value.trim(),
                    email: customerEmail.value.trim(),
                    phone: customerPhone ? customerPhone.value.trim() : ''
                };
                
                console.log('Customer info:', customerInfo);
                
                try {
                    // Use await to wait for the promise to resolve
                    const orderId = await submitPreorder(customerInfo);
                    
                    if (orderId) {
                        // Show success modal
                        if (successModal) {
                            if (orderNumber) {
                                orderNumber.textContent = `#ORD-${orderId}`;
                            }
                            successModal.style.display = 'block';
                        }
                        // Update cart UI
                        updateCartUI();
                        // Re-render cart page (which will now be empty)
                        renderCartPage();
                    } else {
                        console.error('Order submission failed');
                        alert('There was an error submitting your pre-order. Please try again.');
                    }
                } catch (error) {
                    console.error('Error submitting order:', error);
                    alert('There was an error submitting your pre-order. Please try again.');
                }
            });
        }
        
        // Validate customer information form
        function validateCustomerForm() {
            let isValid = true;
            
            // Reset previous errors
            const errorFields = document.querySelectorAll('.error');
            errorFields.forEach(field => field.classList.remove('error'));
            
            // Validate customer name (required)
            if (!customerName || customerName.value.trim() === '') {
                isValid = false;
                customerName.classList.add('error');
                showFieldError(customerName, 'Please enter your full name');
            }
            
            // Validate email (required and format)
            if (!customerEmail || customerEmail.value.trim() === '') {
                isValid = false;
                customerEmail.classList.add('error');
                showFieldError(customerEmail, 'Please enter your email address');
            } else if (!isValidEmail(customerEmail.value)) {
                isValid = false;
                customerEmail.classList.add('error');
                showFieldError(customerEmail, 'Please enter a valid email address');
            }
            
            // Phone is optional, but validate format if provided
            if (customerPhone && customerPhone.value.trim() !== '' && !isValidPhone(customerPhone.value)) {
                isValid = false;
                customerPhone.classList.add('error');
                showFieldError(customerPhone, 'Please enter a valid phone number');
            }
            
            return isValid;
        }
        
        // Helper to show field error message
        function showFieldError(field, message) {
            // Check if error element already exists
            let errorElement = field.parentNode.querySelector('.form-error');
            
            // Create error element if it doesn't exist
            if (!errorElement) {
                errorElement = document.createElement('div');
                errorElement.className = 'form-error';
                field.parentNode.appendChild(errorElement);
            }
            
            // Set error message and show
            errorElement.textContent = message;
            errorElement.classList.add('active');
        }
        
        // Email validation helper
        function isValidEmail(email) {
            const re = /^(([^<>()\[\]\\.,;:\s@"]+(\.[^<>()\[\]\\.,;:\s@"]+)*)|(".+"))@((\[[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\])|(([a-zA-Z\-0-9]+\.)+[a-zA-Z]{2,}))$/;
            return re.test(String(email).toLowerCase());
        }
        
        // Phone validation helper (basic)
        function isValidPhone(phone) {
            // Allow various formats with optional country code
            return /^(\+?[0-9\s\-()]{8,})$/.test(phone);
        }
        
        if (continueShoppingBtn) {
            continueShoppingBtn.addEventListener('click', function() {
                window.location.href = 'index.html#gallery';
            });
        }
        
        if (returnToShopBtn) {
            returnToShopBtn.addEventListener('click', function() {
                window.location.href = 'index.html#gallery';
            });
        }
        
        if (closeModalBtn) {
            closeModalBtn.addEventListener('click', function() {
                successModal.style.display = 'none';
            });
        }
        
        // Close modal by clicking outside
        window.addEventListener('click', function(e) {
            if (e.target === successModal) {
                successModal.style.display = 'none';
            }
        });
    }
    
    // Handle size selection
    sizeBtns.forEach(btn => {
        btn.addEventListener('click', function() {
            // Remove selected class from all buttons
            sizeBtns.forEach(b => b.classList.remove('selected'));
            
            // Add selected class to clicked button
            this.classList.add('selected');
            
            // Store selected size
            selectedSize = this.getAttribute('data-size');
        });
    });
    
    // Handle add to cart
    if (addToCartBtn) {
        console.log('Add to cart button found, adding click handler');
        
        addToCartBtn.addEventListener('click', function() {
            console.log('Add to cart button clicked');
            
            const selectedGender = this.getAttribute('data-selected-gender');
            const selectedSize = this.getAttribute('data-selected-size');
            
            console.log('Selected gender:', selectedGender);
            console.log('Selected size:', selectedSize);
            
            if (!selectedGender || !selectedSize) {
                alert('Please select both gender and size');
                return;
            }
            
            const productName = document.getElementById('modalProductName').textContent;
            const productImage = document.getElementById('modalMainImage').src;
            
            console.log('Product name:', productName);
            console.log('Product image:', productImage);
            
            // Get current cart and add the new item
            const cart = getCurrentUserCart();
            
            // Create new item with all necessary details
            const newItem = {
                name: productName,
                image: productImage,
                gender: selectedGender,
                size: selectedSize,
                date: new Date().toISOString().split('T')[0]
            };
            
            console.log('Adding item to cart:', newItem);
            cart.push(newItem);
            
            // Save updated cart
            saveUserCart(cart);
            
            // Update cart UI
            updateCartUI();
            
            // Remove alert message - no notification needed
            // Close the modal after adding to cart
            const productModal = document.getElementById('productModal');
            if (productModal) {
                productModal.style.display = 'none';
            }
        });
    } else {
        console.error('Add to cart button not found!');
    }
    
    // Ensure localStorage is cleared of any stale admin sessions
    function clearStaleAdminData() {
        try {
            const userData = localStorage.getItem('loggedInUser');
            if (userData) {
                // Check if session storage still has the admin marker
                const isSessionAdmin = sessionStorage.getItem('isAdmin') === 'true';
                
                if (!isSessionAdmin) {
                    // Session data is gone but localStorage still has admin data - clear it
                    console.log('Found stale admin data in localStorage - clearing it');
                    localStorage.removeItem('loggedInUser');
                }
            }
        } catch (e) {
            console.error('Error clearing stale admin data:', e);
        }
    }

    // Enhanced cart navigation - updated to not require login for regular users
    function fixCartNavigation() {
        // First clear any stale admin data
        clearStaleAdminData();
        
        // Get all cart links
        const cartButtons = [
            document.getElementById('cartBtn'),                     // Cart icon
            document.querySelector('.view-cart-btn'),               // View cart button in dropdown
            document.querySelector('.cart-dropdown .view-cart-btn')  // Another possible selector
        ];
        
        // Add enhanced handling to all cart links
        cartButtons.forEach(btn => {
            if (!btn) return;
            
            // Replace existing click handlers
            const newBtn = btn.cloneNode(true);
            if (btn.parentNode) {
                btn.parentNode.replaceChild(newBtn, btn);
            }
            
            // Add reliable navigation handler
            newBtn.addEventListener('click', function(e) {
                console.log('Cart button clicked');
                e.preventDefault();
                
                try {
                    // Check for active admin session (not just localStorage)
                    const isSessionAdmin = sessionStorage.getItem('isAdmin') === 'true';
                    
                    if (isSessionAdmin) {
                        console.log('Active admin session detected - showing message');
                        alert('Admin accounts do not use the shopping cart');
                        return;
                    }
                    
                    // For all non-admin users, allow cart access
                    console.log('Not an admin session - allowing cart access');
                    window.location.href = 'cart.html';
                } catch (error) {
                    console.error('Error in cart navigation:', error);
                    // On any error, default to allowing cart access
                    window.location.href = 'cart.html';
                }
            });
        });
        
        // Debug cart button functionality
        console.log('Cart navigation fixed with improved admin check');
    }

    // Fix cart navigation on main page
    if (window.location.pathname.includes('index.html') || 
        window.location.pathname.endsWith('/')) {
        fixCartNavigation();
    }
    
    // Special handling for the cart page
    if (window.location.pathname.includes('cart.html')) {
        console.log('On cart page, ensuring proper initialization');
        
        // Force render the cart again after a small delay
        setTimeout(renderCartPage, 500);
    }
    
    // Debug cart data on page load
    window.addEventListener('load', function() {
        clearStaleAdminData();
        const loggedInUser = JSON.parse(localStorage.getItem('loggedInUser'));
        if (loggedInUser && !loggedInUser.isAdmin) {
            const cart = getCurrentUserCart();
            console.log(`Current cart for ${loggedInUser.name}:`, cart);
            
            // Force cart rendering on the cart page
            if (window.location.pathname.includes('cart.html')) {
                console.log('Forcing cart page render on load');
                setTimeout(renderCartPage, 100);
            }
        }
    });
    
    // Make functions available globally
    window.updateCartUI = updateCartUI;
    window.getCurrentUserCart = getCurrentUserCart;
    window.renderCartPage = renderCartPage;
    window.saveUserCart = saveUserCart;
});
