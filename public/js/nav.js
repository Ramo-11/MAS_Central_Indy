// Navigation JavaScript
document.addEventListener('DOMContentLoaded', function() {
    const navToggle = document.querySelector('.nav-toggle');
    const navMenu = document.querySelector('.nav-menu');
    const navLinks = document.querySelectorAll('.nav-link');
    const dropdowns = document.querySelectorAll('.dropdown');
    const navbar = document.querySelector('.navbar');
    const body = document.body;
    let scrollPosition = 0;

    // Mobile menu toggle functionality
    if (navToggle && navMenu) {
        navToggle.addEventListener('click', function() {
            const isExpanded = navToggle.getAttribute('aria-expanded') === 'true';
            
            if (!isExpanded) {
                openMobileMenu();
            } else {
                closeMobileMenu();
            }
        });
    }

    function openMobileMenu() {
        // Store current scroll position
        scrollPosition = window.pageYOffset;
        
        // Add classes
        navMenu.classList.add('active');
        navToggle.classList.add('active');
        body.classList.add('menu-open');
        
        // Update ARIA attributes
        navToggle.setAttribute('aria-expanded', 'true');
        
        // Set body position to prevent scroll jumping
        body.style.top = `-${scrollPosition}px`;
    }

    function closeMobileMenu() {
        // Remove classes
        navMenu.classList.remove('active');
        navToggle.classList.remove('active');
        body.classList.remove('menu-open');
        
        // Close any open dropdowns
        dropdowns.forEach(dropdown => {
            dropdown.classList.remove('active');
        });
        
        // Update ARIA attributes
        navToggle.setAttribute('aria-expanded', 'false');
        
        // Restore scroll position
        body.style.top = '';
        window.scrollTo(0, scrollPosition);
    }

    // Mobile dropdown functionality
    dropdowns.forEach(dropdown => {
        const dropdownToggle = dropdown.querySelector('.dropdown-toggle');
        
        if (dropdownToggle) {
            dropdownToggle.addEventListener('click', function(e) {
                // Only handle click on mobile
                if (window.innerWidth <= 991) {
                    e.preventDefault();
                    
                    // Close other dropdowns
                    dropdowns.forEach(otherDropdown => {
                        if (otherDropdown !== dropdown) {
                            otherDropdown.classList.remove('active');
                        }
                    });
                    
                    // Toggle current dropdown
                    dropdown.classList.toggle('active');
                }
            });
        }
    });

    // Close mobile menu when clicking nav links
    navLinks.forEach(link => {
        link.addEventListener('click', function() {
            if (navMenu.classList.contains('active')) {
                closeMobileMenu();
            }
        });
    });

    // Close dropdown links on mobile
    document.querySelectorAll('.dropdown-link').forEach(link => {
        link.addEventListener('click', function() {
            if (navMenu.classList.contains('active')) {
                closeMobileMenu();
            }
        });
    });

    // Close mobile menu when clicking outside
    document.addEventListener('click', function(event) {
        const isClickInsideNav = navToggle.contains(event.target) || navMenu.contains(event.target);
        
        if (!isClickInsideNav && navMenu.classList.contains('active')) {
            closeMobileMenu();
        }
    });

    // Close mobile menu on window resize
    window.addEventListener('resize', function() {
        if (window.innerWidth > 991 && navMenu.classList.contains('active')) {
            closeMobileMenu();
        }
        
        // Reset dropdowns on resize
        if (window.innerWidth > 991) {
            dropdowns.forEach(dropdown => {
                dropdown.classList.remove('active');
            });
        }
    });

    // Handle escape key to close mobile menu
    document.addEventListener('keydown', function(event) {
        if (event.key === 'Escape') {
            if (navMenu.classList.contains('active')) {
                closeMobileMenu();
                navToggle.focus(); // Return focus to toggle button
            }
            
            // Close dropdowns on escape
            dropdowns.forEach(dropdown => {
                dropdown.classList.remove('active');
            });
        }
    });

    // Set active navigation link based on current page
    function setActiveNavLink() {
        const currentPath = window.location.pathname;
        
        navLinks.forEach(link => {
            link.classList.remove('active');
            
            // Check if link href matches current path
            const linkPath = new URL(link.href).pathname;
            
            // Handle exact matches and path starts
            if (linkPath === currentPath || 
                (currentPath === '/' && linkPath === '/') ||
                (currentPath !== '/' && linkPath !== '/' && currentPath.startsWith(linkPath))) {
                link.classList.add('active');
            }
            
            // Special handling for Events dropdown
            if (linkPath === '/events' && (currentPath.startsWith('/events') || currentPath === '/media-hub')) {
                link.classList.add('active');
            }
        });
        
        // Handle dropdown links
        document.querySelectorAll('.dropdown-link').forEach(link => {
            const linkPath = new URL(link.href).pathname;
            if (linkPath === currentPath) {
                link.classList.add('active');
                // Also mark parent dropdown as active
                const parentDropdown = link.closest('.dropdown');
                if (parentDropdown) {
                    const parentLink = parentDropdown.querySelector('.dropdown-toggle');
                    if (parentLink) {
                        parentLink.classList.add('active');
                    }
                }
            }
        });
    }

    // Set active link on page load
    setActiveNavLink();

    // Smooth scroll for anchor links (if any)
    navLinks.forEach(link => {
        if (link.getAttribute('href').startsWith('#')) {
            link.addEventListener('click', function(e) {
                e.preventDefault();
                const targetId = this.getAttribute('href').substring(1);
                const targetElement = document.getElementById(targetId);
                
                if (targetElement) {
                    const navHeight = navbar.offsetHeight;
                    const targetPosition = targetElement.offsetTop - navHeight - 20;
                    
                    window.scrollTo({
                        top: targetPosition,
                        behavior: 'smooth'
                    });
                }
            });
        }
    });

    // Navbar scroll effect with improved mobile handling
    let lastScrollTop = 0;
    let ticking = false;

    function updateNavbarOnScroll() {
        const scrollTop = window.pageYOffset || document.documentElement.scrollTop;
        
        // Only apply scroll effects if mobile menu is not open
        if (!body.classList.contains('menu-open')) {
            // Add shadow and backdrop blur when scrolled
            if (scrollTop > 10) {
                navbar.classList.add('scrolled');
            } else {
                navbar.classList.remove('scrolled');
            }
        }
        
        lastScrollTop = scrollTop;
        ticking = false;
    }

    function requestTick() {
        if (!ticking) {
            requestAnimationFrame(updateNavbarOnScroll);
            ticking = true;
        }
    }

    // Use passive event listener for better scroll performance
    window.addEventListener('scroll', requestTick, { passive: true });

    // Handle orientation change on mobile
    window.addEventListener('orientationchange', function() {
        // Small delay to let the orientation change complete
        setTimeout(function() {
            if (navMenu.classList.contains('active')) {
                // Recalculate positions after orientation change
                const vh = window.innerHeight * 0.01;
                document.documentElement.style.setProperty('--vh', `${vh}px`);
            }
        }, 100);
    });

    // Desktop hover effects for dropdowns (prevent accidental triggers)
    let hoverTimeout;
    
    dropdowns.forEach(dropdown => {
        dropdown.addEventListener('mouseenter', function() {
            if (window.innerWidth > 991) {
                clearTimeout(hoverTimeout);
            }
        });
        
        dropdown.addEventListener('mouseleave', function() {
            if (window.innerWidth > 991) {
                hoverTimeout = setTimeout(() => {
                    // Optional: Add any cleanup here
                }, 100);
            }
        });
    });

    // Keyboard navigation for dropdowns
    document.addEventListener('keydown', function(event) {
        if (event.key === 'Enter' || event.key === ' ') {
            const activeElement = document.activeElement;
            
            if (activeElement.classList.contains('dropdown-toggle')) {
                event.preventDefault();
                
                if (window.innerWidth <= 991) {
                    const dropdown = activeElement.closest('.dropdown');
                    dropdown.classList.toggle('active');
                }
            }
        }
    });
});