/**
 * Size Chart functionality for Lavaredo products
 */

console.log('SizeChart module loading...');

// Size chart data
const sizeChartData = {
    // Women's Cycling Jerseys
    womensJerseys: {
        Size: ["XS", "S", "M", "L", "XL"],
        Chest: ["77-85", "81-89", "85-93", "89-97", "93-101"],
        Waist: ["63-68", "67-72", "71-76", "75-80", "79-84"],
        Hips: ["79-87", "83-91", "87-95", "91-99", "95-103"]
    },
    
    // Women's Cycling Shorts
    womensShorts: {
        Size: ["XS", "S", "M", "L", "XL"],
        Waist: ["62-70", "66-74", "70-78", "74-82", "78-86"],
        Hips: ["80-89", "84-93", "88-97", "92-101", "96-105"],
        LegOpening: ["33-36", "34-37", "35-38", "36-39", "37-40"]
    },
    
    // Men's Cycling Jerseys
    mensJerseys: {
        Size: ["XS", "S", "M", "L", "XL"],
        Chest: ["83-92", "87-96", "91-100", "95-104", "100-109"],
        Waist: ["73-82", "77-86", "81-90", "85-94", "90-99"],
        Hips: ["81-90", "85-94", "89-98", "93-102", "98-107"]
    },
    
    // Men's Cycling Shorts
    mensShorts: {
        Size: ["XS", "S", "M", "L", "XL"],
        Waist: ["77-82", "81-86", "85-90", "89-94", "93-98"],
        Hips: ["84-91", "88-95", "92-99", "96-103", "100-107"],
        LegOpening: ["37-40", "38-41", "39-42", "40-43", "41-44"]
    }
};

// Current product type (jersey or bibs) for the size chart
let currentProductType = '';

document.addEventListener('DOMContentLoaded', function() {
    // Get modal elements
    const sizeChartModal = document.getElementById('sizeChartModal');
    const closeSizeChart = document.querySelector('.close-size-chart');
    const mensTab = document.getElementById('mensTab');
    const womensTab = document.getElementById('womensTab');
    const sizeChartTitle = document.getElementById('sizeChartTitle');
    const sizeChartTableContainer = document.getElementById('sizeChartTableContainer');
    const sizeChartBtn = document.getElementById('sizeChartBtn');
    
    // Add event listener for size chart button
    if (sizeChartBtn) {
        sizeChartBtn.addEventListener('click', function() {
            openSizeChartModal(currentProductType || 'jerseys');
        });
    }
    
    // Close modal when clicking close button
    if (closeSizeChart) {
        closeSizeChart.addEventListener('click', closeSizeChartModal);
    }
    
    // Close modal when clicking outside the modal
    window.addEventListener('click', (event) => {
        if (event.target === sizeChartModal) {
            closeSizeChartModal();
        }
    });
    
    // Escape key closes modal
    document.addEventListener('keydown', (event) => {
        if (event.key === 'Escape' && sizeChartModal && sizeChartModal.style.display === 'block') {
            closeSizeChartModal();
        }
    });
    
    // Tab switching functionality
    if (mensTab && womensTab) {
        mensTab.addEventListener('click', () => {
            setActiveTab(mensTab, womensTab);
            renderSizeChart('men');
        });
        
        womensTab.addEventListener('click', () => {
            setActiveTab(womensTab, mensTab);
            renderSizeChart('women');
        });
    }
    
    // Listen for the product modal being opened
    document.addEventListener('productModalOpened', function(event) {
        const product = event.detail.product;
        if (product) {
            // Update the product type for size chart
            if (product.category === 'bibs') {
                currentProductType = 'shorts';
            } else {
                currentProductType = 'jerseys';
            }
        }
    });

    // Execute check on load
    console.log("Size chart module loaded and ready");

    console.log('SizeChart DOM loaded, elements check:', {
        sizeChartModal: document.getElementById('sizeChartModal') ? 'exists' : 'missing',
        sizeChartBtn: document.getElementById('sizeChartBtn') ? 'exists' : 'missing',
        mensTab: document.getElementById('mensTab') ? 'exists' : 'missing',
        womensTab: document.getElementById('womensTab') ? 'exists' : 'missing'
    });
});

// Set active tab styling
function setActiveTab(activeTab, inactiveTab) {
    activeTab.classList.add('active');
    inactiveTab.classList.remove('active');
}

// Open the size chart modal
function openSizeChartModal(productType) {
    const sizeChartModal = document.getElementById('sizeChartModal');
    const sizeChartTitle = document.getElementById('sizeChartTitle');
    const mensTab = document.getElementById('mensTab');
    
    if (!sizeChartModal) return;
    
    // Set product type (jerseys or shorts)
    if (productType) {
        currentProductType = productType;
    }
    
    // Update the title based on product type
    if (sizeChartTitle) {
        sizeChartTitle.textContent = `Tabulka velikostí: ${currentProductType === 'shorts' ? 'Cyklistické kraťasy' : 'Cyklistické dresy'}`;
    }
    
    // Show modal
    sizeChartModal.style.display = 'block';
    document.body.style.overflow = 'hidden'; // Prevent scrolling behind modal
    
    // Activate men's tab by default and render the chart
    if (mensTab) {
        mensTab.classList.add('active');
        document.getElementById('womensTab').classList.remove('active');
        renderSizeChart('men');
    }
}

// Close the size chart modal
function closeSizeChartModal() {
    const sizeChartModal = document.getElementById('sizeChartModal');
    if (!sizeChartModal) return;
    
    sizeChartModal.style.display = 'none';
    document.body.style.overflow = ''; // Restore scrolling
}

// Render the size chart table based on gender and product type
function renderSizeChart(gender) {
    const tableContainer = document.getElementById('sizeChartTableContainer');
    if (!tableContainer) return;
    
    // Determine which data to use
    let chartData;
    if (gender === 'men') {
        chartData = currentProductType === 'shorts' ? sizeChartData.mensShorts : sizeChartData.mensJerseys;
    } else {
        chartData = currentProductType === 'shorts' ? sizeChartData.womensShorts : sizeChartData.womensJerseys;
    }
    
    // Get headers (property names)
    const headers = Object.keys(chartData);
    const numRows = chartData.Size.length;
    
    // Create table
    let tableHTML = '<table class="size-chart-table">';
    
    // Create header row with Czech translations
    tableHTML += '<tr>';
    headers.forEach(header => {
        let translatedHeader;
        switch(header) {
            case 'Size': translatedHeader = 'Velikost'; break;
            case 'Chest': translatedHeader = 'Hrudník'; break;
            case 'Waist': translatedHeader = 'Pas'; break;
            case 'Hips': translatedHeader = 'Boky'; break;
            case 'LegOpening': translatedHeader = 'Obvod nohy'; break;
            default: translatedHeader = header;
        }
        tableHTML += `<th>${translatedHeader}</th>`;
    });
    tableHTML += '</tr>';
    
    // Create data rows
    for (let i = 0; i < numRows; i++) {
        tableHTML += '<tr>';
        headers.forEach(header => {
            tableHTML += `<td>${chartData[header][i]}</td>`;
        });
        tableHTML += '</tr>';
    }
    
    tableHTML += '</table>';
    
    // Add footnote in Czech
    tableHTML += '<div class="size-chart-footnote">';
    tableHTML += '<p>Všechny míry jsou v centimetrech. Hodnoty představují rozměry těla, nikoliv oděvu.</p>';
    tableHTML += '<p>Pro nejlepší střih doporučujeme vzít si vlastní míry a porovnat je s tabulkou.</p>';
    
    tableHTML += '</div>';
    
    tableContainer.innerHTML = tableHTML;
}

// Make functions available globally - add console logging
window.openSizeChartModal = openSizeChartModal;
window.closeSizeChartModal = closeSizeChartModal;
console.log('Size chart functions exposed to window:', {
    openSizeChartModal: typeof window.openSizeChartModal === 'function',
    closeSizeChartModal: typeof window.closeSizeChartModal === 'function'
});

// Add debug function to check if size chart functionality is available
window.checkSizeChartAvailable = function() {
    console.log({
        openSizeChartModal: typeof window.openSizeChartModal === 'function',
        closeSizeChartModal: typeof window.closeSizeChartModal === 'function',
        currentProductType: currentProductType,
        sizeChartModal: document.getElementById('sizeChartModal') ? 'exists' : 'missing',
        sizeChartData: Object.keys(sizeChartData)
    });
};

// Add a forced open method for debugging
window.forceSizeChartOpen = function(type) {
    const sizeChartModal = document.getElementById('sizeChartModal');
    if (!sizeChartModal) {
        console.error('Size chart modal element not found');
        return;
    }
    
    currentProductType = type || 'jerseys';
    sizeChartModal.style.display = 'block';
    document.body.style.overflow = 'hidden';
    
    const mensTab = document.getElementById('mensTab');
    if (mensTab) {
        mensTab.classList.add('active');
        document.getElementById('womensTab').classList.remove('active');
        renderSizeChart('men');
    }
    
    console.log('Size chart modal forced open for:', currentProductType);
};
