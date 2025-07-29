class EventDetailsManager {
    constructor() {
        this.currentGalleryIndex = 0;
        this.galleryImages = [];
        this.init();
    }

    init() {
        this.bindEvents();
        this.initializeGallery();
        this.initializeVideoPlayer();
    }

    bindEvents() {
        // Share button
        const shareBtn = document.querySelector('.share-btn-hero');
        if (shareBtn) {
            shareBtn.addEventListener('click', (e) => {
                this.shareEvent(e.target.closest('.share-btn-hero'));
            });
        }

        // Copy button
        const copyBtn = document.querySelector('.copy-btn-hero');
        if (copyBtn) {
            copyBtn.addEventListener('click', (e) => {
                this.copyEventLink(e.target.closest('.copy-btn-hero'));
            });
        }

        // Video play button
        const playBtn = document.querySelector('.play-button-large');
        if (playBtn) {
            playBtn.addEventListener('click', (e) => {
                this.playVideo(e.target.closest('.play-button-large'));
            });
        }

        // Gallery items
        const galleryItems = document.querySelectorAll('.gallery-item:not(.view-more)');
        galleryItems.forEach((item, index) => {
            item.addEventListener('click', () => {
                this.openGallery(index);
            });
        });

        // View all gallery button
        const viewAllBtn = document.querySelector('.view-all-btn');
        if (viewAllBtn) {
            viewAllBtn.addEventListener('click', () => {
                this.openGallery(0);
            });
        }

        // Video modal close
        const videoModalClose = document.querySelector('.video-modal-close');
        if (videoModalClose) {
            videoModalClose.addEventListener('click', () => {
                this.closeVideoModal();
            });
        }

        // Gallery modal close
        const galleryModalClose = document.querySelector('.gallery-modal-close');
        if (galleryModalClose) {
            galleryModalClose.addEventListener('click', () => {
                this.closeGalleryModal();
            });
        }

        // Gallery navigation
        const galleryPrev = document.querySelector('.gallery-prev');
        const galleryNext = document.querySelector('.gallery-next');
        
        if (galleryPrev) {
            galleryPrev.addEventListener('click', () => {
                this.previousImage();
            });
        }
        
        if (galleryNext) {
            galleryNext.addEventListener('click', () => {
                this.nextImage();
            });
        }

        // Modal overlay clicks
        const videoOverlay = document.querySelector('.video-modal-overlay');
        if (videoOverlay) {
            videoOverlay.addEventListener('click', () => {
                this.closeVideoModal();
            });
        }

        const galleryOverlay = document.querySelector('.gallery-modal-overlay');
        if (galleryOverlay) {
            galleryOverlay.addEventListener('click', () => {
                this.closeGalleryModal();
            });
        }

        // Keyboard navigation
        document.addEventListener('keydown', (e) => {
            this.handleKeyboard(e);
        });

        // Touch/swipe support for gallery on mobile
        this.initializeSwipeSupport();
    }

    initializeGallery() {
        // Collect all gallery images
        const galleryItems = document.querySelectorAll('.gallery-item:not(.view-more) .gallery-image');
        this.galleryImages = Array.from(galleryItems).map(img => ({
            src: img.src,
            alt: img.alt
        }));
    }

    initializeVideoPlayer() {
        // Pre-load video information if available
        const playBtn = document.querySelector('.play-button-large');
        if (playBtn) {
            const videoUrl = playBtn.dataset.videoUrl;
            if (videoUrl) {
                this.prepareVideoEmbed(videoUrl);
            }
        }
    }

    shareEvent(shareBtn) {
        const eventId = shareBtn.dataset.eventId;
        const title = shareBtn.dataset.title;
        const url = window.location.origin + shareBtn.dataset.url;

        // Show share modal with different social media options
        this.showShareModal(url, title);

        // Track share event
        this.trackEvent('share', eventId);
    }

    copyEventLink(copyBtn) {
        const eventId = copyBtn.dataset.eventId;
        const title = copyBtn.dataset.title;
        const url = window.location.origin + copyBtn.dataset.url;

        // Copy to clipboard directly
        this.copyToClipboard(url, title);

        // Track copy event
        this.trackEvent('copy_link', eventId);
    }

    copyToClipboard(url, title) {
        // Copy to clipboard
        if (navigator.clipboard) {
            navigator.clipboard.writeText(url).then(() => {
                this.showToast('Event link copied to clipboard!');
            }).catch(() => {
                this.fallbackCopyToClipboard(url);
            });
        } else {
            this.fallbackCopyToClipboard(url);
        }
    }

    fallbackCopyToClipboard(url) {
        // Fallback method for older browsers
        const textArea = document.createElement('textarea');
        textArea.value = url;
        textArea.style.position = 'fixed';
        textArea.style.left = '-999999px';
        textArea.style.top = '-999999px';
        document.body.appendChild(textArea);
        textArea.focus();
        textArea.select();
        
        try {
            document.execCommand('copy');
            this.showToast('Event link copied to clipboard!');
        } catch (err) {
            this.showToast('Unable to copy link. Please copy manually.', 'error');
        }
        
        document.body.removeChild(textArea);
    }

    showShareModal(url, title) {
        const shareOptions = [
            {
                name: 'Facebook',
                url: `https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(url)}`,
                icon: 'fab fa-facebook-f'
            },
            {
                name: 'Twitter',
                url: `https://twitter.com/intent/tweet?url=${encodeURIComponent(url)}&text=${encodeURIComponent(title)}`,
                icon: 'fab fa-twitter'
            },
            {
                name: 'LinkedIn',
                url: `https://www.linkedin.com/sharing/share-offsite/?url=${encodeURIComponent(url)}`,
                icon: 'fab fa-linkedin-in'
            },
            {
                name: 'Email',
                url: `mailto:?subject=${encodeURIComponent(title)}&body=${encodeURIComponent('Check out this event: ' + url)}`,
                icon: 'fas fa-envelope'
            }
        ];

        const modal = document.createElement('div');
        modal.className = 'share-modal';
        modal.innerHTML = `
            <div class="share-modal-overlay"></div>
            <div class="share-modal-content">
                <div class="share-modal-header">
                    <h3>Share Event</h3>
                    <button class="share-modal-close">&times;</button>
                </div>
                <div class="share-options">
                    ${shareOptions.map(option => `
                        <a href="${option.url}" target="_blank" class="share-option">
                            <i class="${option.icon}"></i>
                            <span>${option.name}</span>
                        </a>
                    `).join('')}
                </div>
                <div class="share-url">
                    <input type="text" value="${url}" readonly class="share-url-input">
                    <button class="copy-url-btn">Copy Link</button>
                </div>
            </div>
        `;

        document.body.appendChild(modal);

        // Bind modal events
        modal.querySelector('.share-modal-close').addEventListener('click', () => {
            this.closeShareModal(modal);
        });

        modal.querySelector('.share-modal-overlay').addEventListener('click', () => {
            this.closeShareModal(modal);
        });

        modal.querySelector('.copy-url-btn').addEventListener('click', () => {
            const input = modal.querySelector('.share-url-input');
            input.select();
            this.copyToClipboard(url, title);
        });

        // Close modal on escape key
        const handleEscape = (e) => {
            if (e.key === 'Escape') {
                this.closeShareModal(modal);
                document.removeEventListener('keydown', handleEscape);
            }
        };
        document.addEventListener('keydown', handleEscape);

        // Show modal
        setTimeout(() => modal.classList.add('active'), 10);
    }

    closeShareModal(modal) {
        modal.classList.remove('active');
        setTimeout(() => {
            if (document.body.contains(modal)) {
                document.body.removeChild(modal);
            }
        }, 300);
    }

    playVideo(playBtn) {
        const videoUrl = playBtn.dataset.videoUrl;
        const eventId = playBtn.dataset.video;

        if (!videoUrl) {
            console.error('No video URL found');
            return;
        }

        const embedUrl = this.getVideoEmbedUrl(videoUrl);
        if (!embedUrl) {
            // Fallback: open in new window
            window.open(videoUrl, '_blank');
            return;
        }

        const videoFrame = document.getElementById('videoFrame');
        const videoModal = document.getElementById('videoModal');

        videoFrame.src = embedUrl;
        videoModal.classList.add('active');
        document.body.style.overflow = 'hidden';

        // Track video play event
        this.trackEvent('video_play', eventId);
    }

    getVideoEmbedUrl(url) {
        // YouTube
        if (url.includes('youtube.com') || url.includes('youtu.be')) {
            const videoId = this.extractYouTubeId(url);
            return videoId ? `https://www.youtube.com/embed/${videoId}?autoplay=1` : null;
        }

        // Vimeo
        if (url.includes('vimeo.com')) {
            const videoId = this.extractVimeoId(url);
            return videoId ? `https://player.vimeo.com/video/${videoId}?autoplay=1` : null;
        }

        // Direct video files
        if (url.match(/\.(mp4|webm|ogg)$/i)) {
            return url;
        }

        return null;
    }

    extractYouTubeId(url) {
        const match = url.match(/(?:youtube\.com\/watch\?v=|youtu\.be\/)([^&\n?#]+)/);
        return match ? match[1] : null;
    }

    extractVimeoId(url) {
        const match = url.match(/vimeo\.com\/(\d+)/);
        return match ? match[1] : null;
    }

    prepareVideoEmbed(url) {
        // Pre-generate embed URL for faster loading
        this.videoEmbedUrl = this.getVideoEmbedUrl(url);
    }

    closeVideoModal() {
        const videoModal = document.getElementById('videoModal');
        const videoFrame = document.getElementById('videoFrame');

        videoModal.classList.remove('active');
        videoFrame.src = '';
        document.body.style.overflow = 'auto';
    }

    openGallery(startIndex = 0) {
        if (this.galleryImages.length === 0) return;

        this.currentGalleryIndex = startIndex;
        const galleryModal = document.getElementById('galleryModal');
        
        this.updateGalleryImage();
        galleryModal.classList.add('active');
        document.body.style.overflow = 'hidden';
    }

    closeGalleryModal() {
        const galleryModal = document.getElementById('galleryModal');
        galleryModal.classList.remove('active');
        document.body.style.overflow = 'auto';
    }

    nextImage() {
        if (this.currentGalleryIndex < this.galleryImages.length - 1) {
            this.currentGalleryIndex++;
            this.updateGalleryImage();
        }
    }

    previousImage() {
        if (this.currentGalleryIndex > 0) {
            this.currentGalleryIndex--;
            this.updateGalleryImage();
        }
    }

    updateGalleryImage() {
        const galleryImage = document.getElementById('galleryImage');
        const galleryCounter = document.getElementById('galleryCounter');
        const prevBtn = document.querySelector('.gallery-prev');
        const nextBtn = document.querySelector('.gallery-next');

        if (this.galleryImages[this.currentGalleryIndex]) {
            const currentImage = this.galleryImages[this.currentGalleryIndex];
            galleryImage.src = currentImage.src;
            galleryImage.alt = currentImage.alt;
            
            if (galleryCounter) {
                galleryCounter.textContent = `${this.currentGalleryIndex + 1} of ${this.galleryImages.length}`;
            }

            // Update navigation button states
            if (prevBtn) {
                prevBtn.style.opacity = this.currentGalleryIndex === 0 ? '0.5' : '1';
                prevBtn.style.pointerEvents = this.currentGalleryIndex === 0 ? 'none' : 'auto';
            }

            if (nextBtn) {
                nextBtn.style.opacity = this.currentGalleryIndex === this.galleryImages.length - 1 ? '0.5' : '1';
                nextBtn.style.pointerEvents = this.currentGalleryIndex === this.galleryImages.length - 1 ? 'none' : 'auto';
            }
        }
    }

    initializeSwipeSupport() {
        const galleryViewer = document.querySelector('.gallery-viewer');
        if (!galleryViewer) return;

        let startX = 0;
        let startY = 0;

        galleryViewer.addEventListener('touchstart', (e) => {
            startX = e.touches[0].clientX;
            startY = e.touches[0].clientY;
        }, { passive: true });

        galleryViewer.addEventListener('touchend', (e) => {
            if (!startX || !startY) return;

            const endX = e.changedTouches[0].clientX;
            const endY = e.changedTouches[0].clientY;
            
            const diffX = startX - endX;
            const diffY = startY - endY;

            // Check if it's a horizontal swipe
            if (Math.abs(diffX) > Math.abs(diffY) && Math.abs(diffX) > 50) {
                if (diffX > 0) {
                    // Swipe left - next image
                    this.nextImage();
                } else {
                    // Swipe right - previous image
                    this.previousImage();
                }
            }

            startX = 0;
            startY = 0;
        }, { passive: true });
    }

    handleKeyboard(e) {
        // Only handle keyboard when modals are open
        const videoModal = document.getElementById('videoModal');
        const galleryModal = document.getElementById('galleryModal');

        if (videoModal && videoModal.classList.contains('active')) {
            if (e.key === 'Escape') {
                this.closeVideoModal();
            }
        }

        if (galleryModal && galleryModal.classList.contains('active')) {
            switch (e.key) {
                case 'Escape':
                    this.closeGalleryModal();
                    break;
                case 'ArrowLeft':
                    e.preventDefault();
                    this.previousImage();
                    break;
                case 'ArrowRight':
                    e.preventDefault();
                    this.nextImage();
                    break;
            }
        }
    }

    trackEvent(action, eventId) {
        // Track analytics events
        try {
            // Update view/share count via API
            fetch(`/api/events/${eventId}/analytics`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({ action })
            }).catch(err => {
                console.log('Analytics tracking failed:', err);
            });

            // Google Analytics tracking if available
            if (typeof gtag !== 'undefined') {
                gtag('event', action, {
                    event_category: 'event',
                    event_label: eventId
                });
            }
        } catch (error) {
            console.log('Error tracking event:', error);
        }
    }

    showToast(message, type = 'success') {
        // Create toast notification
        const toast = document.createElement('div');
        toast.className = `toast toast-${type}`;
        toast.innerHTML = `
            <div class="toast-content">
                <span>${message}</span>
                <button class="toast-close">&times;</button>
            </div>
        `;

        document.body.appendChild(toast);

        // Show toast
        setTimeout(() => toast.classList.add('show'), 100);

        // Auto-hide after 3 seconds
        setTimeout(() => {
            toast.classList.remove('show');
            setTimeout(() => {
                if (document.body.contains(toast)) {
                    document.body.removeChild(toast);
                }
            }, 300);
        }, 3000);

        // Close button
        toast.querySelector('.toast-close').addEventListener('click', () => {
            toast.classList.remove('show');
            setTimeout(() => {
                if (document.body.contains(toast)) {
                    document.body.removeChild(toast);
                }
            }, 300);
        });
    }

    // Utility method to preload images for better gallery performance
    preloadGalleryImages() {
        this.galleryImages.forEach(image => {
            const img = new Image();
            img.src = image.src;
        });
    }

    // Method to lazy load images as user scrolls
    initializeLazyLoading() {
        const images = document.querySelectorAll('img[loading="lazy"]');
        
        if ('IntersectionObserver' in window) {
            const imageObserver = new IntersectionObserver((entries, observer) => {
                entries.forEach(entry => {
                    if (entry.isIntersecting) {
                        const img = entry.target;
                        img.src = img.dataset.src || img.src;
                        img.classList.remove('lazy');
                        imageObserver.unobserve(img);
                    }
                });
            });

            images.forEach(img => imageObserver.observe(img));
        }
    }
}

// Initialize when DOM is loaded
document.addEventListener('DOMContentLoaded', () => {
    window.eventDetailsManager = new EventDetailsManager();
});