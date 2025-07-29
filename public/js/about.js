// About Page JavaScript
document.addEventListener('DOMContentLoaded', function() {
    initializeAboutPage();
});

function initializeAboutPage() {
    initializeFAQs();
    initializeScrollAnimations();
    initializeImageLazyLoading();
    addMemberPhotoFallbacks();
}

// FAQ Functionality
function initializeFAQs() {
    const faqItems = document.querySelectorAll('.faq-item');
    
    faqItems.forEach(item => {
        const question = item.querySelector('.faq-question');
        const toggle = item.querySelector('.faq-toggle');
        
        question.addEventListener('click', function() {
            toggleFAQ(item);
        });
        
        // Keyboard accessibility
        question.addEventListener('keydown', function(e) {
            if (e.key === 'Enter' || e.key === ' ') {
                e.preventDefault();
                toggleFAQ(item);
            }
        });
        
        // Make the question focusable
        question.setAttribute('tabindex', '0');
        question.setAttribute('role', 'button');
        question.setAttribute('aria-expanded', 'false');
    });
}

function toggleFAQ(faqItem) {
    const isActive = faqItem.classList.contains('active');
    const question = faqItem.querySelector('.faq-question');
    
    // Close all other FAQs
    document.querySelectorAll('.faq-item.active').forEach(item => {
        if (item !== faqItem) {
            item.classList.remove('active');
            item.querySelector('.faq-question').setAttribute('aria-expanded', 'false');
        }
    });
    
    // Toggle current FAQ
    if (isActive) {
        faqItem.classList.remove('active');
        question.setAttribute('aria-expanded', 'false');
    } else {
        faqItem.classList.add('active');
        question.setAttribute('aria-expanded', 'true');
        
        // Scroll FAQ into view if needed
        setTimeout(() => {
            const rect = faqItem.getBoundingClientRect();
            const navbar = document.querySelector('.navbar');
            const navbarHeight = navbar ? navbar.offsetHeight : 0;
            
            if (rect.top < navbarHeight + 20) {
                window.scrollTo({
                    top: window.scrollY + rect.top - navbarHeight - 20,
                    behavior: 'smooth'
                });
            }
        }, 300);
    }
    
    // Track FAQ interactions (if analytics is available)
    if (typeof gtag !== 'undefined') {
        const faqId = faqItem.getAttribute('data-faq');
        gtag('event', 'faq_interaction', {
            'faq_id': faqId,
            'action': isActive ? 'close' : 'open'
        });
    }
}

// Scroll Animations
function initializeScrollAnimations() {
    if ('IntersectionObserver' in window) {
        const observerOptions = {
            threshold: 0.1,
            rootMargin: '0px 0px -50px 0px'
        };
        
        const observer = new IntersectionObserver((entries) => {
            entries.forEach(entry => {
                if (entry.isIntersecting) {
                    entry.target.classList.add('animate-in');
                    
                    // Stagger animations for grid items
                    if (entry.target.classList.contains('board-member') || 
                        entry.target.classList.contains('committee-card') || 
                        entry.target.classList.contains('involvement-card')) {
                        staggerGridAnimations(entry.target);
                    }
                }
            });
        }, observerOptions);
        
        // Observe elements for animation
        const animateElements = document.querySelectorAll(`
            .key-point,
            .mission-card,
            .vision-card,
            .board-member,
            .committee-card,
            .faq-item,
            .involvement-card,
            .event-type
        `);
        
        animateElements.forEach(el => {
            el.classList.add('animate-on-scroll');
            observer.observe(el);
        });
    }
}

function staggerGridAnimations(triggerElement) {
    const container = triggerElement.closest('.board-grid, .committees-grid, .involvement-grid');
    if (!container) return;
    
    const items = container.querySelectorAll('.board-member, .committee-card, .involvement-card');
    items.forEach((item, index) => {
        setTimeout(() => {
            item.classList.add('animate-in');
        }, index * 100);
    });
}

// Image Lazy Loading (fallback for older browsers)
function initializeImageLazyLoading() {
    if ('IntersectionObserver' in window) {
        const imageObserver = new IntersectionObserver((entries) => {
            entries.forEach(entry => {
                if (entry.isIntersecting) {
                    const img = entry.target;
                    if (img.dataset.src) {
                        img.src = img.dataset.src;
                        img.removeAttribute('data-src');
                        img.classList.remove('lazy');
                        imageObserver.unobserve(img);
                    }
                }
            });
        });
        
        document.querySelectorAll('img[data-src]').forEach(img => {
            img.classList.add('lazy');
            imageObserver.observe(img);
        });
    }
}

// Add fallback images for board member photos
function addMemberPhotoFallbacks() {
    const memberImages = document.querySelectorAll('.member-image');
    
    memberImages.forEach(img => {
        img.addEventListener('error', function() {
            // Create a placeholder with initials
            const memberName = this.closest('.board-member').querySelector('.member-name').textContent;
            const initials = memberName.split(' ').map(name => name.charAt(0)).join('');
            
            // Create a canvas with initials
            const canvas = document.createElement('canvas');
            canvas.width = 120;
            canvas.height = 120;
            const ctx = canvas.getContext('2d');
            
            // Background
            ctx.fillStyle = getComputedStyle(document.documentElement).getPropertyValue('--primary-color');
            ctx.fillRect(0, 0, 120, 120);
            
            // Text
            ctx.fillStyle = 'white';
            ctx.font = 'bold 32px sans-serif';
            ctx.textAlign = 'center';
            ctx.textBaseline = 'middle';
            ctx.fillText(initials, 60, 60);
            
            // Replace image with canvas
            this.src = canvas.toDataURL();
        });
    });
}

// Utility function to handle committee card interactions
function initializeCommitteeCards() {
    const committeeCards = document.querySelectorAll('.committee-card');
    
    committeeCards.forEach(card => {
        card.addEventListener('mouseenter', function() {
            this.style.transform = 'translateY(-8px)';
        });
        
        card.addEventListener('mouseleave', function() {
            this.style.transform = 'translateY(-5px)';
        });
    });
}

// Add smooth scrolling to anchor links within the page
function initializeSmoothScrolling() {
    const anchorLinks = document.querySelectorAll('a[href^="#"]');
    
    anchorLinks.forEach(link => {
        link.addEventListener('click', function(e) {
            const targetId = this.getAttribute('href').substring(1);
            
            if (!targetId) return;
            
            const targetElement = document.getElementById(targetId);
            
            if (targetElement) {
                e.preventDefault();
                
                const navbar = document.querySelector('.navbar');
                const navbarHeight = navbar ? navbar.offsetHeight : 0;
                const offsetTop = targetElement.offsetTop - navbarHeight - 20;
                
                window.scrollTo({
                    top: offsetTop,
                    behavior: 'smooth'
                });
            }
        });
    });
}

// Initialize additional features
document.addEventListener('DOMContentLoaded', function() {
    initializeCommitteeCards();
    initializeSmoothScrolling();
});

// Add CSS for animations
const style = document.createElement('style');
style.textContent = `
    .animate-on-scroll {
        opacity: 0;
        transform: translateY(30px);
        transition: all 0.6s ease-out;
    }
    
    .animate-on-scroll.animate-in {
        opacity: 1;
        transform: translateY(0);
    }
    
    .lazy {
        opacity: 0;
        transition: opacity 0.3s;
    }
    
    .lazy:not([data-src]) {
        opacity: 1;
    }
    
    /* Board member hover effects */
    .board-member:hover .member-image {
        transform: scale(1.05);
        transition: transform var(--transition-fast);
    }
    
    /* FAQ animation improvements */
    .faq-answer {
        transition: max-height 0.3s ease-out, padding 0.3s ease-out;
    }
    
    .faq-item.active .faq-answer {
        animation: fadeInContent 0.4s ease-out 0.1s both;
    }
    
    @keyframes fadeInContent {
        from {
            opacity: 0;
            transform: translateY(-10px);
        }
        to {
            opacity: 1;
            transform: translateY(0);
        }
    }
    
    /* Stagger animation delays */
    .board-member:nth-child(1) { transition-delay: 0s; }
    .board-member:nth-child(2) { transition-delay: 0.1s; }
    .board-member:nth-child(3) { transition-delay: 0.2s; }
    .board-member:nth-child(4) { transition-delay: 0.3s; }
    
    .committee-card:nth-child(1) { transition-delay: 0s; }
    .committee-card:nth-child(2) { transition-delay: 0.1s; }
    .committee-card:nth-child(3) { transition-delay: 0.2s; }
    .committee-card:nth-child(4) { transition-delay: 0.3s; }
    .committee-card:nth-child(5) { transition-delay: 0.4s; }
    .committee-card:nth-child(6) { transition-delay: 0.5s; }
    
    .involvement-card:nth-child(1) { transition-delay: 0s; }
    .involvement-card:nth-child(2) { transition-delay: 0.1s; }
    .involvement-card:nth-child(3) { transition-delay: 0.2s; }
    .involvement-card:nth-child(4) { transition-delay: 0.3s; }
    .involvement-card:nth-child(5) { transition-delay: 0.4s; }
    .involvement-card:nth-child(6) { transition-delay: 0.5s; }
    
    /* Reduced motion preferences */
    @media (prefers-reduced-motion: reduce) {
        .animate-on-scroll {
            opacity: 1;
            transform: none;
            transition: none;
        }
        
        .board-member:hover .member-image {
            transform: none;
        }
        
        .faq-answer {
            transition: max-height 0.1s ease-out;
        }
        
        .committee-card,
        .board-member,
        .involvement-card {
            transition-delay: 0s;
        }
    }
    
    /* Focus styles for accessibility */
    .faq-question:focus {
        outline: 2px solid var(--primary-color);
        outline-offset: 2px;
    }
    
    .committee-card:focus-within,
    .board-member:focus-within,
    .involvement-card:focus-within {
        box-shadow: 0 0 0 3px rgba(15, 79, 159, 0.2);
    }
`;
document.head.appendChild(style);

// Track page interactions for analytics
function trackPageInteractions() {
    // Track section views
    if ('IntersectionObserver' in window && typeof gtag !== 'undefined') {
        const sectionObserver = new IntersectionObserver((entries) => {
            entries.forEach(entry => {
                if (entry.isIntersecting) {
                    const sectionName = entry.target.className.split(' ')[0];
                    gtag('event', 'section_view', {
                        'section_name': sectionName,
                        'page': 'about'
                    });
                }
            });
        }, {
            threshold: 0.5
        });
        
        document.querySelectorAll('section').forEach(section => {
            sectionObserver.observe(section);
        });
    }
    
    // Track button clicks
    document.querySelectorAll('.btn').forEach(btn => {
        btn.addEventListener('click', function() {
            if (typeof gtag !== 'undefined') {
                gtag('event', 'button_click', {
                    'button_text': this.textContent.trim(),
                    'button_url': this.href || 'none',
                    'page': 'about'
                });
            }
        });
    });
}

// Initialize tracking
document.addEventListener('DOMContentLoaded', function() {
    trackPageInteractions();
});

// Export functions for potential external use
window.AboutPage = {
    toggleFAQ: toggleFAQ,
    initializeFAQs: initializeFAQs,
    initializeScrollAnimations: initializeScrollAnimations
};