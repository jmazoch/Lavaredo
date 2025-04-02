document.addEventListener('DOMContentLoaded', function() {
    const burgerToggle = document.querySelector('.mobile-menu-toggle');
    const navLinks = document.querySelector('.nav-links');
    const navItems = document.querySelectorAll('.nav-links li a');
    
    // Toggle mobile menu
    burgerToggle.addEventListener('click', function() {
        burgerToggle.classList.toggle('active');
        navLinks.classList.toggle('active');
        
        // Toggle between menu and close icon
        const menuIcon = burgerToggle.querySelector('i');
        if (burgerToggle.classList.contains('active')) {
            menuIcon.classList.remove('fa-bars');
            menuIcon.classList.add('fa-times');
        } else {
            menuIcon.classList.remove('fa-times');
            menuIcon.classList.add('fa-bars');
        }
    });
    
    // Close mobile menu when clicking on a link
    navItems.forEach(item => {
        item.addEventListener('click', function() {
            burgerToggle.classList.remove('active');
            navLinks.classList.remove('active');
            
            // Reset icon to hamburger
            const menuIcon = burgerToggle.querySelector('i');
            menuIcon.classList.remove('fa-times');
            menuIcon.classList.add('fa-bars');
        });
    });
    
    // Close menu when clicking outside
    document.addEventListener('click', function(event) {
        const isClickInsideMenu = navLinks.contains(event.target);
        const isClickOnBurger = burgerToggle.contains(event.target);
        
        if (!isClickInsideMenu && !isClickOnBurger && navLinks.classList.contains('active')) {
            burgerToggle.classList.remove('active');
            navLinks.classList.remove('active');
            
            // Reset icon to hamburger
            const menuIcon = burgerToggle.querySelector('i');
            menuIcon.classList.remove('fa-times');
            menuIcon.classList.add('fa-bars');
        }
    });
});
