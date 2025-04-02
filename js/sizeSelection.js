/**
 * Size selection functionality for product modal
 * Handles gender selection and showing appropriate sizes
 */

document.addEventListener('DOMContentLoaded', function() {
    // Set up gender selection functionality
    setupSizeSelection();
    
    // Listen for product modal opening
    document.addEventListener('productModalOpened', resetSizeSelection);
});

function setupSizeSelection() {
    // Get all gender buttons
    const genderButtons = document.querySelectorAll('.gender-btn');
    const sizesContainer = document.querySelector('.sizes-container');
    const sizeButtons = document.querySelectorAll('.size-btn');
    const addToCartBtn = document.getElementById('addToCartBtn');
    
    // Selected options
    let selectedGender = null;
    let selectedSize = null;
    
    // Disable add to cart button initially
    if (addToCartBtn) {
        addToCartBtn.classList.add('disabled');
        addToCartBtn.disabled = true;
    }
    
    // Add click event to gender buttons
    genderButtons.forEach(button => {
        button.addEventListener('click', function() {
            // Remove active class from all gender buttons
            genderButtons.forEach(btn => btn.classList.remove('selected'));
            
            // Add active class to clicked button
            this.classList.add('selected');
            
            // Store selected gender
            selectedGender = this.dataset.gender;
            
            // Show sizes container with animation
            sizesContainer.style.display = 'block';
            sizesContainer.classList.add('fade-in');
            
            // Clear any previously selected sizes
            sizeButtons.forEach(btn => btn.classList.remove('selected'));
            selectedSize = null;
            
            // You could also show different size options based on gender if needed
            // For example, if women's sizes are different
            showSizesForGender(selectedGender);
            
            // Track selection in data attribute for the add-to-cart button
            const addToCartBtn = document.getElementById('addToCartBtn');
            if (addToCartBtn) {
                addToCartBtn.dataset.selectedGender = selectedGender;
                // We need to disable the button again as size needs to be selected
                addToCartBtn.classList.add('disabled');
                addToCartBtn.disabled = true;
            }
        });
    });
    
    // Add click event to size buttons
    sizeButtons.forEach(button => {
        button.addEventListener('click', function() {
            // Remove active class from all size buttons
            sizeButtons.forEach(btn => btn.classList.remove('selected'));
            
            // Add active class to clicked button
            this.classList.add('selected');
            
            // Store selected size
            selectedSize = this.dataset.size;
            
            // Track selection in data attribute for the add-to-cart button
            const addToCartBtn = document.getElementById('addToCartBtn');
            if (addToCartBtn) {
                addToCartBtn.dataset.selectedSize = selectedSize;
                
                // Enable add to cart button when both gender and size are selected
                if (selectedGender && selectedSize) {
                    addToCartBtn.classList.remove('disabled');
                    addToCartBtn.disabled = false;
                }
            }
        });
    });
}

function showSizesForGender(gender) {
    // This function can be extended if you want to show different 
    // size options based on gender selection
    
    // For now, we'll just log the selection
    console.log(`Showing sizes for ${gender}`);
    
    // Example of showing different sizes (if needed):
    /*
    const sizeButtons = document.querySelectorAll('.size-btn');
    if (gender === 'women') {
        // Show women-specific sizes
        sizeButtons.forEach(btn => {
            // Maybe hide XXL for women or show different sizes
        });
    } else {
        // Show men's sizes
    }
    */
}

function resetSizeSelection() {
    // Reset selections when modal opens
    const genderButtons = document.querySelectorAll('.gender-btn');
    const sizeButtons = document.querySelectorAll('.size-btn');
    const sizesContainer = document.querySelector('.sizes-container');
    
    // Clear selections
    genderButtons.forEach(btn => btn.classList.remove('selected'));
    sizeButtons.forEach(btn => btn.classList.remove('selected'));
    
    // Hide size container
    if (sizesContainer) {
        sizesContainer.style.display = 'none';
        sizesContainer.classList.remove('fade-in');
    }
    
    // Clear data attributes and disable add to cart button
    const addToCartBtn = document.getElementById('addToCartBtn');
    if (addToCartBtn) {
        addToCartBtn.removeAttribute('data-selected-gender');
        addToCartBtn.removeAttribute('data-selected-size');
        addToCartBtn.classList.add('disabled');
        addToCartBtn.disabled = true;
    }
}

// Add to global scope for access from other scripts
window.resetSizeSelection = resetSizeSelection;
