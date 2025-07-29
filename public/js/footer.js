// Footer JavaScript - Footer-specific functionality
document.addEventListener('DOMContentLoaded', function() {
    
    // Initialize footer functionality
    initializeFooter();
    
    // Handle newsletter signup (if you add it later)
    initializeNewsletterSignup();
    
    // Social media link tracking
    initializeSocialTracking();
    
    // Dynamic copyright year
    updateCopyrightYear();
});

// Initialize footer functionality
function initializeFooter() {
    const footer = document.querySelector('.footer');
    if (!footer) return;
    
    // Add animation when footer comes into view
    if ('IntersectionObserver' in window) {
        const footerObserver = new IntersectionObserver((entries) => {
            entries.forEach(entry => {
                if (entry.isIntersecting) {
                    entry.target.classList.add('footer-visible');
                }
            });
        }, {
            threshold: 0.1,
            rootMargin: '0px 0px -50px 0px'
        });
        
        footerObserver.observe(footer);
    }
    
    // Smooth hover effects for footer links
    const footerLinks = footer.querySelectorAll('.footer-link, .social-link');
    footerLinks.forEach(link => {
        link.addEventListener('mouseenter', function() {
            this.classList.add('hovered');
        });
        
        link.addEventListener('mouseleave', function() {
            this.classList.remove('hovered');
        });
    });
}

// Newsletter signup functionality (placeholder for future implementation)
function initializeNewsletterSignup() {
    const newsletterForm = document.querySelector('.newsletter-form');
    if (!newsletterForm) return;
    
    newsletterForm.addEventListener('submit', function(e) {
        e.preventDefault();
        
        const emailInput = this.querySelector('input[type="email"]');
        const email = emailInput.value.trim();
        
        if (!isValidEmail(email)) {
            showFooterMessage('Please enter a valid email address.', 'error');
            return;
        }
        
        // Show loading state
        const submitButton = this.querySelector('button[type="submit"]');
        const originalText = submitButton.textContent;
        submitButton.textContent = 'Subscribing...';
        submitButton.disabled = true;
        
        // Simulate API call (replace with actual implementation)
        setTimeout(() => {
            showFooterMessage('Thank you for subscribing to our newsletter!', 'success');
            emailInput.value = '';
            submitButton.textContent = originalText;
            submitButton.disabled = false;
        }, 1500);
    });
}

// Social media link tracking
function initializeSocialTracking() {
    const socialLinks = document.querySelectorAll('.social-link');
    
    socialLinks.forEach(link => {
        link.addEventListener('click', function(e) {
            const platform = getSocialPlatform(this.href);
            
            // Track social media clicks (replace with your analytics)
            if (typeof gtag !== 'undefined') {
                gtag('event', 'social_click', {
                    'social_network': platform,
                    'social_action': 'click',
                    'social_target': this.href
                });
            }
            
            // Optional: Add a small delay to ensure tracking
            if (platform) {
                e.preventDefault();
                setTimeout(() => {
                    window.open(this.href, '_blank', 'noopener,noreferrer');
                }, 100);
            }
        });
        
        // Add keyboard support
        link.addEventListener('keydown', function(e) {
            if (e.key === 'Enter' || e.key === ' ') {
                e.preventDefault();
                this.click();
            }
        });
    });
}

// Update copyright year automatically
function updateCopyrightYear() {
    const copyrightElement = document.querySelector('.footer-copyright');
    if (!copyrightElement) return;
    
    const currentYear = new Date().getFullYear();
    const copyrightText = copyrightElement.textContent;
    
    // Replace any 4-digit year with current year
    const updatedText = copyrightText.replace(/\b\d{4}\b/, currentYear);
    copyrightElement.textContent = updatedText;
}

// Utility functions
function isValidEmail(email) {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
}

function getSocialPlatform(url) {
    if (url.includes('facebook.com')) return 'Facebook';
    if (url.includes('twitter.com') || url.includes('x.com')) return 'Twitter';
    if (url.includes('linkedin.com')) return 'LinkedIn';
    if (url.includes('instagram.com')) return 'Instagram';
    if (url.includes('youtube.com')) return 'YouTube';
    if (url.includes('tiktok.com')) return 'TikTok';
    return 'Unknown';
}

function showFooterMessage(message, type = 'info') {
    // Remove any existing messages
    const existingMessage = document.querySelector('.footer-message');
    if (existingMessage) {
        existingMessage.remove();
    }
    
    // Create new message
    const messageElement = document.createElement('div');
    messageElement.className = `footer-message footer-message-${type}`;
    messageElement.textContent = message;
    messageElement.style.cssText = `
        position: fixed;
        bottom: 2rem;
        left: 50%;
        transform: translateX(-50%) translateY(100px);
        background: var(--${type === 'error' ? 'red' : type === 'success' ? 'green' : 'primary'}-color, var(--primary-color));
        color: white;
        padding: 1rem 2rem;
        border-radius: var(--border-radius-md);
        box-shadow: var(--shadow-lg);
        z-index: var(--z-modal);
        transition: transform var(--transition-normal);
        max-width: 90vw;
        text-align: center;
    `;
    
    document.body.appendChild(messageElement);
    
    // Animate in
    setTimeout(() => {
        messageElement.style.transform = 'translateX(-50%) translateY(0)';
    }, 100);
    
    // Remove after 5 seconds
    setTimeout(() => {
        messageElement.style.transform = 'translateX(-50%) translateY(100px)';
        setTimeout(() => {
            if (messageElement.parentNode) {
                messageElement.parentNode.removeChild(messageElement);
            }
        }, 300);
    }, 5000);
}

// Contact information click handlers
function initializeContactInfo() {
    // Make phone numbers clickable
    const phoneNumbers = document.querySelectorAll('.footer-contact [href^="tel:"]');
    phoneNumbers.forEach(phone => {
        phone.addEventListener('click', function() {
            // Track phone clicks if analytics is available
            if (typeof gtag !== 'undefined') {
                gtag('event', 'phone_click', {
                    'phone_number': this.href.replace('tel:', '')
                });
            }
        });
    });
    
    // Make email addresses clickable
    const emailLinks = document.querySelectorAll('.footer-contact [href^="mailto:"]');
    emailLinks.forEach(email => {
        email.addEventListener('click', function() {
            // Track email clicks if analytics is available
            if (typeof gtag !== 'undefined') {
                gtag('event', 'email_click', {
                    'email_address': this.href.replace('mailto:', '')
                });
            }
        });
    });
}

// Add CSS for footer animations
function addFooterStyles() {
    const style = document.createElement('style');
    style.textContent = `
        .footer {
            opacity: 0;
            transform: translateY(30px);
            transition: all 0.6s ease-out;
        }
        
        .footer.footer-visible {
            opacity: 1;
            transform: translateY(0);
        }
        
        .social-link.hovered {
            transform: translateY(-3px) scale(1.05);
        }
        
        .footer-link.hovered {
            padding-left: 4px;
        }
        
        @media (prefers-reduced-motion: reduce) {
            .footer {
                opacity: 1;
                transform: none;
                transition: none;
            }
            
            .social-link.hovered {
                transform: none;
            }
            
            .footer-link.hovered {
                padding-left: 0;
            }
        }
    `;
    document.head.appendChild(style);
}

// Call initialization functions
initializeContactInfo();
addFooterStyles();