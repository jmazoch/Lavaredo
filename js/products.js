/**
 * Product gallery and product modal functionality
 */

console.log('Products module loaded');

document.addEventListener('DOMContentLoaded', function() {
    console.log('Products: DOM Content Loaded');
    
    // FIX: Always initialize gallery regardless of login status
    // Comment out or remove this check
    /*
    const isLoggedIn = sessionStorage.getItem('isLoggedIn') === 'true';
    if (window.siteConfig && window.siteConfig.auth.requireLogin && !isLoggedIn) {
        console.log('User not logged in - skipping gallery initialization');
        return;
    }
    */
    
    // Sample jersey data
    const jerseys = [
        {
            id: 1,
            name: 'Mauve Jersey',
            czechName: 'Krátký dres Mauve',
            description: 'Opera mauve růžový dres dostupný v pánských i dámských velikostech. Lehký letní materiál s reflexními prvky na bocích a zadní kapse pro lepší viditelnost.',
            image: 'gallery/jersey1.webp',
            category: 'jersey',
            price: '999 Kč'
        },
        {
            id: 2,
            name: 'Dark navy Jersey',
            czechName: 'Krátký dres Dark Navy',
            description: 'Tmavě modrý dres s reflexními prvky. Stejný design jako u dlouhého dresu, ideální volba jako hlavní dres sezóny. Kvalitní prodyšný materiál vhodný i pro náročné výkony.',
            image: 'gallery/jersey2.webp',
            category: 'jersey',
            price: '999 Kč'
        },      
        {
            id: 3,
            name: 'Limited Jersey',
            czechName: 'Krátký dres Limited Edition',
            description: 'Limitovaná edice. Unikátní design. Doporučujeme jako doplňkový dres k tmavě modrým nebo růžovým variantám.',
            image: 'gallery/jersey3.webp',
            category: 'jersey',
            price: '1299 Kč'
        },    
        {
            id: 6,
            name: 'Dark navy Long Jersey',
            czechName: 'Dlouhý dres Dark Navy',
            description: 'Dlouhý dres z letně-podzimního materiálu s reflexními prvky na boku a zadní kapse. Osvědčený model vhodný pro chladnější dny, oblíbený pro svou univerzálnost.',
            image: 'gallery/long_jersey1.webp',
            category: 'long_sleeve',
            price: '1299 Kč'
        },
        {
            id: 7,
            name: 'Classic black Bib Shorts',
            czechName: 'Classic black Bib Shorts',
            description: 'Klasické černé kratasy s gumou, upravené designem se světlými reflexními prvky. Osvědčený model z předchozí sezóny, s italskou vložkou.',
            image: 'gallery/bib1.webp',
            category: 'bibs',
            price: '1399 Kč'
        },
        {
            id: 8,
            name: 'Classic dark blue Bib Shorts',
            czechName: 'Classic dark blue Bib Shorts',
            description: 'Tmavě modrá varianta kratasů s reflexními prvky a kvalitní italskou vložkou. Designově podobné černé variantě, ale v nové barevné kombinaci.',
            image: 'gallery/bib2.webp',
            category: 'bibs',
            price: '1399 Kč'
        },
        {
            id: 9,
            name: 'Mocha Bib Shorts without rubber bands',
            czechName: 'Mocha Bib Shorts bez lemu',
            description: 'Mocha barva kratasů, které nemají na konci nohavic klasický lem s gumou, zakončení je hladké a plynule přechází do látky – tzv. „do ztracena“. Premium materiál testovaný minulou sezónu s jemnými reflexními detaily. Lehce kompresní efekt podobný S-lab Salamon.',
            image: 'gallery/bib3.webp',
            category: 'bibs',
            price: '1499 Kč'
        },
        {
            id: 10,
            name: 'Antartica grey Vest',
            czechName: 'Vesta Antarctica Grey',
            description: 'Antarctica Grey vesta s novým reflexním prvkem vzadu. Lehká a větruodolná. Osvědčený model z předchozí sezóny.',
            image: 'gallery/vest1.webp',
            category: 'vests',
            price: '1199 Kč'
        },
        {
            id: 11,
            name: 'Black Vest',
            czechName: 'Vesta Black',
            description: 'Černá vesta s reflexními prvky. Větruodolná a prodyšná, ideální pro proměnlivé počasí. Strategické větrání a snadné skladování.',
            image: 'gallery/vest2.webp',
            category: 'vests',
            price: '1199 Kč'
        }
    ];

    // Function to populate gallery
    function populateGallery(items) {
        const galleryGrid = document.querySelector('.gallery-grid');
        if (!galleryGrid) return;
        
        galleryGrid.innerHTML = '';

        items.forEach(jersey => {
            const jerseyElement = document.createElement('div');
            jerseyElement.className = 'jersey-item';
            jerseyElement.dataset.category = jersey.category;
            jerseyElement.dataset.productId = jersey.id;
            
            // Create image element with front view
            const imgElement = document.createElement('img');
            imgElement.src = jersey.image;
            imgElement.alt = jersey.name;
            imgElement.className = 'jersey-image';
            
            // Store both image paths as data attributes
            imgElement.dataset.frontImage = jersey.image;
            imgElement.dataset.backImage = window.lavaUtils.getBackImagePath(jersey.image);
            
            // Create info div
            const infoDiv = document.createElement('div');
            infoDiv.className = 'jersey-info';
            infoDiv.innerHTML = `
                <h3>${jersey.czechName || jersey.name}</h3>
                <p class="jersey-description">${jersey.description}</p>
                <p class="jersey-price"><strong>${jersey.price}</strong></p>
            `;
            
            // Add hover functionality
            jerseyElement.addEventListener('mouseenter', function() {
                imgElement.src = imgElement.dataset.backImage;
            });
            
            jerseyElement.addEventListener('mouseleave', function() {
                imgElement.src = imgElement.dataset.frontImage;
            });
            
            // Add click functionality to open the product modal
            jerseyElement.addEventListener('click', function() {
                openProductModal(jersey);
            });
            
            // Append elements to jersey item
            jerseyElement.appendChild(imgElement);
            jerseyElement.appendChild(infoDiv);
            
            galleryGrid.appendChild(jerseyElement);
        });

        // Dispatch a custom event to notify that gallery items were updated
        document.dispatchEvent(new CustomEvent('galleryUpdated'));
    }

    // FIX: Force gallery initialization
    console.log('Initializing gallery...');
    const galleryGrid = document.querySelector('.gallery-grid');
    if (galleryGrid) {
        console.log('Gallery grid found, populating...');
        populateGallery(jerseys);
    } else {
        console.error('Gallery grid element not found! Check HTML structure');
    }

    // Filter functionality
    const filterButtons = document.querySelectorAll('.filter-btn');
    
    filterButtons.forEach(button => {
        button.addEventListener('click', () => {
            // Update active button
            const activeBtn = document.querySelector('.filter-btn.active');
            if (activeBtn) activeBtn.classList.remove('active');
            button.classList.add('active');
            
            const filterValue = button.dataset.filter;
            
            // Filter jerseys
            if (filterValue === 'all') {
                populateGallery(jerseys);
            } else {
                const filteredJerseys = jerseys.filter(jersey => jersey.category === filterValue);
                populateGallery(filteredJerseys);
            }
        });
    });

    // PRODUCT MODAL FUNCTIONALITY
    // Get modal elements
    const productModal = document.getElementById('productModal');
    const modalMainImage = document.getElementById('modalMainImage');
    const modalProductName = document.getElementById('modalProductName');
    const modalProductDescription = document.getElementById('modalProductDescription');
    const modalProductCategory = document.getElementById('modalProductCategory');
    const imageThumbnails = document.getElementById('imageThumbnails');
    const similarProductsContainer = document.getElementById('similarProductsContainer');
    const closeModal = document.querySelector('.close-modal');
    
    // Format category name for display
    function formatCategoryName(category) {
        return category.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase());
    }
    
    // Function to create similar product item
    function createSimilarProductItem(product) {
        const item = document.createElement('div');
        item.classList.add('similar-product-item');
        
        const image = document.createElement('img');
        image.src = product.image;
        image.alt = product.name;
        image.classList.add('similar-product-image');
        
        const name = document.createElement('div');
        name.textContent = product.name;
        name.classList.add('similar-product-name');
        
        item.appendChild(image);
        item.appendChild(name);
        
        // Add click event to open this product
        item.addEventListener('click', () => {
            openProductModal(product);
        });
        
        return item;
    }
    
    // Function to update active thumbnail
    function updateActiveThumbnail(selectedThumb) {
        document.querySelectorAll('.thumbnail').forEach(thumb => {
            thumb.classList.remove('active');
        });
        selectedThumb.classList.add('active');
    }
    
    // Function to open modal with product details
    function openProductModal(product) {
        if (!productModal) return;
        
        // Set main product details
        modalMainImage.src = product.image;
        modalMainImage.alt = product.name;
        modalProductName.textContent = product.czechName || product.name;
        modalProductDescription.textContent = product.description;
        modalProductCategory.textContent = formatCategoryName(product.category);
        
        // Add price to the modal
        const priceElement = document.getElementById('modalProductPrice');
        if (priceElement) {
            priceElement.textContent = product.price;
        }
        
        // Create thumbnails
        imageThumbnails.innerHTML = '';
        
        // Add front image thumbnail
        const frontThumb = document.createElement('img');
        frontThumb.src = product.image;
        frontThumb.alt = 'Front view';
        frontThumb.classList.add('thumbnail', 'active');
        frontThumb.addEventListener('click', () => {
            modalMainImage.src = product.image;
            updateActiveThumbnail(frontThumb);
        });
        imageThumbnails.appendChild(frontThumb);
        
        // Add back image thumbnail
        const backImagePath = window.lavaUtils.getBackImagePath(product.image);
        const backThumb = document.createElement('img');
        backThumb.src = backImagePath;
        backThumb.alt = 'Back view';
        backThumb.classList.add('thumbnail');
        backThumb.addEventListener('click', () => {
            modalMainImage.src = backImagePath;
            updateActiveThumbnail(backThumb);
        });
        imageThumbnails.appendChild(backThumb);
        
        // Get similar products (same category)
        const similarProducts = jerseys.filter(item => 
            item.category === product.category && item.id !== product.id
        );
        
        // Populate similar products
        similarProductsContainer.innerHTML = '';
        similarProducts.forEach(similarProduct => {
            const similarItem = createSimilarProductItem(similarProduct);
            similarProductsContainer.appendChild(similarItem);
        });
        
        // Initialize size chart button - ADD THIS CODE
        const sizeChartBtn = document.getElementById('sizeChartBtn');
        if (sizeChartBtn) {
            // Determine product type for size chart
            const productType = product.category === 'bibs' ? 'shorts' : 'jerseys';
            
            // Set up click handler with direct function call
            sizeChartBtn.onclick = function() {
                console.log('Size chart button clicked for:', productType);
                window.openSizeChartModal(productType);
            };
        }
        
        // Dispatch event for other modules
        document.dispatchEvent(new CustomEvent('productModalOpened', {
            detail: { product: product }
        }));
        
        // Show modal
        productModal.style.display = 'block';
        document.body.style.overflow = 'hidden'; // Prevent scrolling behind modal
    }
    
    // Function to close modal
    function closeProductModal() {
        if (!productModal) return;
        productModal.style.display = 'none';
        document.body.style.overflow = ''; // Restore scrolling
    }
    
    // Close modal when clicking close button
    if (closeModal) {
        closeModal.addEventListener('click', closeProductModal);
    }
    
    // Close modal when clicking outside the modal
    window.addEventListener('click', (event) => {
        if (event.target === productModal) {
            closeProductModal();
        }
    });
    
    // Escape key closes modal
    document.addEventListener('keydown', (event) => {
        if (event.key === 'Escape' && productModal && productModal.style.display === 'block') {
            closeProductModal();
        }
    });
    
    // Make jerseys and functions available globally
    window.jerseys = jerseys;
    window.openProductModal = openProductModal;
    window.populateGallery = populateGallery;
    window.galleryLoaded = true;
});

// Add this outside the DOM ready event to debug
window.debugGallery = function() {
    console.log('Debugging gallery');
    const galleryGrid = document.querySelector('.gallery-grid');
    console.log('Gallery grid element:', galleryGrid);
    if (galleryGrid && window.jerseys) {
        console.log('Manual gallery population...');
        window.populateGallery(window.jerseys);
    } else {
        console.error('Cannot populate gallery - missing elements or data');
    }
};
