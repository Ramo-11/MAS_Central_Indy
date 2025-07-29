// Media Hub JavaScript - Professional and Clean
document.addEventListener('DOMContentLoaded', function() {
    initializeMediaHub();
});

function initializeMediaHub() {
    initializeCategoryFilter();
    initializeVideoModal();
    initializeLoadMore();
    initializeShareButtons();
    initializeCopyButtons();
    initializeLazyLoading();
}

// Category filtering functionality
function initializeCategoryFilter() {
    const filterButtons = document.querySelectorAll('.category-filter-btn');
    
    filterButtons.forEach(button => {
        button.addEventListener('click', function() {
            const category = this.getAttribute('data-category');
            const currentCategory = getCurrentCategory();
            
            if (category === currentCategory) return;
            
            // Update URL with new category filter
            const url = new URL(window.location);
            url.searchParams.set('category', category);
            url.searchParams.delete('page'); // Reset to first page
            
            // Navigate to new URL
            window.location.href = url.toString();
        });
    });
}

function getCurrentCategory() {
    const urlParams = new URLSearchParams(window.location.search);
    return urlParams.get('category') || 'all';
}

// Global variable to store current video URL for fallback
let currentVideoUrl = '';

// Video modal functionality
function initializeVideoModal() {
    const playButtons = document.querySelectorAll('.play-button');
    const videoModal = document.getElementById('videoModal');
    const videoFrame = document.getElementById('videoFrame');
    const videoLoading = document.getElementById('videoLoading');
    const videoError = document.getElementById('videoError');
    const closeButton = document.querySelector('.video-modal-close');
    const modalOverlay = document.querySelector('.video-modal-overlay');
    
    if (!videoModal) return;
    
    // Play button handlers
    playButtons.forEach(button => {
        button.addEventListener('click', function(e) {
            e.preventDefault();
            e.stopPropagation();
            
            const videoUrl = this.getAttribute('data-video-url');
            const videoId = this.getAttribute('data-video');
            
            console.log('Play button clicked, video URL:', videoUrl);
            
            if (videoUrl && videoUrl.trim()) {
                currentVideoUrl = videoUrl; // Store for fallback
                const embedUrl = convertToEmbedUrl(videoUrl);
                console.log('Converted embed URL:', embedUrl);
                
                if (embedUrl) {
                    openVideoModal(embedUrl, videoUrl);
                    trackVideoPlay(videoId);
                } else {
                    showNotification('Invalid video URL', 'error');
                }
            } else {
                showNotification('Video not available', 'info');
            }
        });
    });
    
    // Close modal handlers
    if (closeButton) {
        closeButton.addEventListener('click', closeVideoModal);
    }
    
    if (modalOverlay) {
        modalOverlay.addEventListener('click', closeVideoModal);
    }
    
    // Close on escape key
    document.addEventListener('keydown', function(e) {
        if (e.key === 'Escape' && videoModal.classList.contains('active')) {
            closeVideoModal();
        }
    });
    
    function openVideoModal(embedUrl, originalUrl) {
        console.log('Opening video modal with URL:', embedUrl);
        
        if (videoFrame && videoModal) {
            // Show loading state
            if (videoLoading) videoLoading.classList.add('active');
            if (videoError) videoError.classList.remove('active');
            
            // Open modal
            videoModal.classList.add('active');
            document.body.style.overflow = 'hidden';
            
            // Set iframe src
            videoFrame.src = embedUrl;
            
            // Handle iframe load events
            videoFrame.onload = function() {
                console.log('Video iframe loaded successfully');
                if (videoLoading) videoLoading.classList.remove('active');
            };
            
            videoFrame.onerror = function() {
                console.error('Error loading video iframe');
                handleVideoError(originalUrl);
            };
            
            // Fallback timeout for embedding issues
            setTimeout(() => {
                // Check if iframe is still loading or failed
                try {
                    const iframeDoc = videoFrame.contentDocument || videoFrame.contentWindow.document;
                    if (!iframeDoc || iframeDoc.readyState === 'loading') {
                        console.warn('Video may be blocked, showing fallback');
                        handleVideoError(originalUrl);
                    }
                } catch (e) {
                    // Cross-origin error is expected, but if we get here after timeout,
                    // the video might be blocked
                    console.warn('Cross-origin iframe, checking for embedding restrictions');
                }
                
                if (videoLoading && videoLoading.classList.contains('active')) {
                    handleVideoError(originalUrl);
                }
            }, 5000);
        }
    }
    
    function handleVideoError(originalUrl) {
        if (videoLoading) videoLoading.classList.remove('active');
        if (videoError) videoError.classList.add('active');
        
        // Update the error button to open original URL
        const errorButton = videoError.querySelector('button');
        if (errorButton) {
            errorButton.onclick = function() {
                window.open(originalUrl, '_blank');
                closeVideoModal();
            };
        }
        
        showNotification('Video cannot be embedded. Click to watch on YouTube.', 'warning');
    }
    
    function closeVideoModal() {
        if (videoModal && videoFrame) {
            videoModal.classList.remove('active');
            
            // Clear states
            if (videoLoading) videoLoading.classList.remove('active');
            if (videoError) videoError.classList.remove('active');
            
            // Clear the iframe src after animation
            setTimeout(() => {
                videoFrame.src = '';
                currentVideoUrl = '';
            }, 300);
            
            document.body.style.overflow = '';
        }
    }
}

// Global function for opening video in new tab (called from error button)
function openVideoInNewTab() {
    if (currentVideoUrl) {
        window.open(currentVideoUrl, '_blank');
        const videoModal = document.getElementById('videoModal');
        if (videoModal) {
            videoModal.classList.remove('active');
            document.body.style.overflow = '';
        }
    }
}

// Load more functionality
function initializeLoadMore() {
    const loadMoreBtn = document.querySelector('.load-more-btn');
    
    if (!loadMoreBtn) return;
    
    loadMoreBtn.addEventListener('click', function() {
        const page = parseInt(this.getAttribute('data-page'));
        const category = this.getAttribute('data-category');
        
        loadMoreEvents(page, category, this);
    });
}

function loadMoreEvents(page, category, button) {
    // Show loading state
    button.classList.add('loading');
    button.disabled = true;
    
    // Make API call
    const url = `/api/events/more?page=${page}&category=${category}&limit=6`;
    
    fetch(url)
        .then(response => response.json())
        .then(data => {
            if (data.success && data.events) {
                appendNewEvents(data.events);
                
                if (data.hasMore) {
                    button.setAttribute('data-page', page + 1);
                    button.classList.remove('loading');
                    button.disabled = false;
                } else {
                    button.style.display = 'none';
                    showNoMoreMessage();
                }
            } else {
                showNotification('Failed to load more content', 'error');
            }
        })
        .catch(error => {
            console.error('Error loading more events:', error);
            showNotification('Failed to load more content', 'error');
        })
        .finally(() => {
            button.classList.remove('loading');
            button.disabled = false;
        });
}

function appendNewEvents(events) {
    const eventsGrid = document.getElementById('eventsGrid');
    
    events.forEach(event => {
        const eventElement = createEventElement(event);
        eventsGrid.appendChild(eventElement);
        
        // Animate in
        setTimeout(() => {
            eventElement.style.opacity = '1';
            eventElement.style.transform = 'translateY(0)';
        }, 100);
    });
    
    // Reinitialize functionality for new elements
    initializeNewElements();
}

function createEventElement(event) {
    const article = document.createElement('article');
    article.className = 'event-card';
    article.setAttribute('data-event-id', event._id);
    article.style.opacity = '0';
    article.style.transform = 'translateY(20px)';
    article.style.transition = 'all 0.4s ease';
    
    const hasVideo = event.media?.videos?.length > 0;
    const hasGallery = event.media?.gallery?.length > 0;
    const hasFeaturedImage = event.media?.featuredImage?.url;
    
    let thumbnailContent = '';
    
    if (hasVideo) {
        const videoId = extractVideoId(event.media.videos[0].url);
        const thumbnailUrl = videoId && event.media.videos[0].url.includes('youtube') ? 
            getYouTubeThumbnail(videoId) : 
            (videoId && event.media.videos[0].url.includes('vimeo') ? 
                getVimeoThumbnail(videoId) : null);
        
        thumbnailContent = `
            <div class="video-thumbnail" style="background-image: url('${thumbnailUrl || ''}');">
                ${thumbnailUrl ? `<img src="${thumbnailUrl}" alt="${event.title}" class="video-thumbnail-img" loading="lazy">` : `
                    <div class="video-placeholder">
                        <svg width="60" height="60" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1">
                            <polygon points="5,3 19,12 5,21"></polygon>
                        </svg>
                    </div>
                `}
                <div class="play-overlay">
                    <button class="play-button" data-video="${event._id}" data-video-url="${event.media.videos[0].url || ''}">
                        <svg width="24" height="24" viewBox="0 0 24 24" fill="currentColor">
                            <polygon points="5,3 19,12 5,21"></polygon>
                        </svg>
                    </button>
                </div>
            </div>
        `;
    } else if (hasGallery && event.media.gallery.length > 3) {
        thumbnailContent = `
            <div class="media-collage">
                <img src="${event.media.gallery[0].url}" alt="${event.media.gallery[0].alt || event.title}" class="collage-image main" loading="lazy">
                <img src="${event.media.gallery[1].url}" alt="${event.media.gallery[1].alt || event.title}" class="collage-image small-1" loading="lazy">
                <img src="${event.media.gallery[2].url}" alt="${event.media.gallery[2].alt || event.title}" class="collage-image small-2" loading="lazy">
                <div class="gallery-overlay">+${event.media.gallery.length - 3} more</div>
            </div>
            <div class="gallery-indicator">
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                    <rect x="3" y="3" width="18" height="18" rx="2" ry="2"></rect>
                    <circle cx="8.5" cy="8.5" r="1.5"></circle>
                    <polyline points="21,15 16,10 5,21"></polyline>
                </svg>
            </div>
        `;
    } else if (hasFeaturedImage) {
        thumbnailContent = `
            <img src="${event.media.featuredImage.url}" alt="${event.media.featuredImage.alt || event.title}" class="event-image" loading="lazy">
            ${hasGallery ? `
                <div class="gallery-indicator">
                    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                        <rect x="3" y="3" width="18" height="18" rx="2" ry="2"></rect>
                        <circle cx="8.5" cy="8.5" r="1.5"></circle>
                        <polyline points="21,15 16,10 5,21"></polyline>
                    </svg>
                </div>
            ` : ''}
        `;
    } else {
        thumbnailContent = `
            <div class="event-placeholder">
                <svg width="60" height="60" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                    <rect x="3" y="3" width="18" height="18" rx="2" ry="2"></rect>
                    <circle cx="8.5" cy="8.5" r="1.5"></circle>
                    <polyline points="21,15 16,10 5,21"></polyline>
                </svg>
            </div>
        `;
    }
    
    const description = event.shortDescription || 
                       (event.description?.length > 120 ? 
                        event.description.substring(0, 120) + '...' : 
                        event.description || 'No description available');
    
    const metaContent = hasVideo ? 
        `<span class="event-date">${formatDate(event.eventDate)}</span>
         <span class="media-type">Video</span>` :
        hasGallery ?
        `<span class="event-date">${formatDate(event.eventDate)}</span>
         <span class="media-count">${event.media.gallery.length} Photos</span>` :
        `<span class="event-date">${formatDate(event.eventDate)}</span>
         <a href="/events/${event.slug}" class="event-link">Learn More</a>`;
    
    article.innerHTML = `
        <div class="event-thumbnail">
            ${thumbnailContent}
        </div>
        <div class="event-content">
            <span class="event-category">${formatCategory(event.category)}</span>
            <h3 class="event-title">
                <a href="/events/${event.slug}" class="event-title-link">${event.title}</a>
            </h3>
            <p class="event-description">${description}</p>
            <div class="event-meta">
                ${metaContent}
            </div>
        </div>
        <div class="event-actions">
            <button class="share-btn" data-event-id="${event._id}" data-title="${event.title}" data-url="/events/${event.slug}">
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                    <circle cx="18" cy="5" r="3"></circle>
                    <circle cx="6" cy="12" r="3"></circle>
                    <circle cx="18" cy="19" r="3"></circle>
                    <line x1="8.59" y1="13.51" x2="15.42" y2="17.49"></line>
                    <line x1="15.41" y1="6.51" x2="8.59" y2="10.49"></line>
                </svg>
            </button>
            <button class="copy-btn" data-event-id="${event._id}" data-title="${event.title}" data-url="/events/${event.slug}">
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                    <rect width="14" height="14" x="8" y="8" rx="2" ry="2"></rect>
                    <path d="M4 16c-1.1 0-2-.9-2-2V4c0-1.1.9-2 2-2h10c1.1 0 2 .9 2 2"></path>
                </svg>
            </button>
        </div>
    `;
    
    return article;
}

function initializeNewElements() {
    // Reinitialize video modal for new elements
    const newPlayButtons = document.querySelectorAll('.play-button:not([data-initialized])');
    newPlayButtons.forEach(button => {
        button.setAttribute('data-initialized', 'true');
        button.addEventListener('click', function(e) {
            e.preventDefault();
            e.stopPropagation();
            
            const videoUrl = this.getAttribute('data-video-url');
            const videoId = this.getAttribute('data-video');
            
            console.log('New play button clicked, video URL:', videoUrl); // Debug log
            
            if (videoUrl && videoUrl.trim()) {
                const embedUrl = convertToEmbedUrl(videoUrl);
                console.log('New button converted embed URL:', embedUrl); // Debug log
                
                if (embedUrl) {
                    const videoFrame = document.getElementById('videoFrame');
                    const videoModal = document.getElementById('videoModal');
                    
                    if (videoFrame && videoModal) {
                        videoFrame.src = embedUrl;
                        videoModal.classList.add('active');
                        document.body.style.overflow = 'hidden';
                        
                        // Ensure iframe loads properly
                        videoFrame.onload = function() {
                            console.log('New video iframe loaded successfully');
                        };
                    }
                    
                    trackVideoPlay(videoId);
                } else {
                    showNotification('Invalid video URL', 'error');
                }
            } else {
                showNotification('Video not available', 'info');
            }
        });
    });
    
    // Reinitialize share and copy buttons for new elements
    const newShareButtons = document.querySelectorAll('.share-btn:not([data-initialized])');
    newShareButtons.forEach(button => {
        button.setAttribute('data-initialized', 'true');
        initializeShareButton(button);
    });
    
    const newCopyButtons = document.querySelectorAll('.copy-btn:not([data-initialized])');
    newCopyButtons.forEach(button => {
        button.setAttribute('data-initialized', 'true');
        initializeCopyButton(button);
    });
}

// Share functionality
function initializeShareButtons() {
    const shareButtons = document.querySelectorAll('.share-btn');
    shareButtons.forEach(button => {
        initializeShareButton(button);
    });
}

function initializeShareButton(button) {
    button.addEventListener('click', function(e) {
        e.stopPropagation();
        const eventId = this.getAttribute('data-event-id');
        const title = this.getAttribute('data-title');
        const url = window.location.origin + this.getAttribute('data-url');
        
        shareContent(title, url, eventId);
    });
}

// Copy functionality
function initializeCopyButtons() {
    const copyButtons = document.querySelectorAll('.copy-btn');
    copyButtons.forEach(button => {
        initializeCopyButton(button);
    });
}

function initializeCopyButton(button) {
    button.addEventListener('click', function(e) {
        e.stopPropagation();
        const eventId = this.getAttribute('data-event-id');
        const title = this.getAttribute('data-title');
        const url = window.location.origin + this.getAttribute('data-url');
        
        copyToClipboard(url, title, eventId);
    });
}

function copyToClipboard(url, title, eventId) {
    if (navigator.clipboard) {
        navigator.clipboard.writeText(url).then(() => {
            showNotification('Event link copied to clipboard!', 'success');
            trackEventCopy(eventId);
        }).catch(() => {
            fallbackCopyToClipboard(url, eventId);
        });
    } else {
        fallbackCopyToClipboard(url, eventId);
    }
}

function fallbackCopyToClipboard(url, eventId) {
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
        showNotification('Event link copied to clipboard!', 'success');
        trackEventCopy(eventId);
    } catch (err) {
        showNotification('Unable to copy link. Please copy manually.', 'error');
    }
    
    document.body.removeChild(textArea);
}

function shareContent(title, url, eventId) {
    if (navigator.share) {
        navigator.share({
            title: title,
            url: url
        }).then(() => {
            trackEventShare(eventId, 'native');
            showNotification('Content shared successfully!', 'success');
        }).catch(err => {
            if (err.name !== 'AbortError') {
                fallbackShare(url, eventId);
            }
        });
    } else {
        fallbackShare(url, eventId);
    }
}

function fallbackShare(url, eventId) {
    if (navigator.clipboard) {
        navigator.clipboard.writeText(url).then(() => {
            trackEventShare(eventId, 'clipboard');
            showNotification('Link copied to clipboard!', 'success');
        }).catch(() => {
            showCopyPrompt(url);
        });
    } else {
        showCopyPrompt(url);
    }
}

function showCopyPrompt(url) {
    const input = prompt('Copy this link:', url);
    if (input !== null) {
        showNotification('Link ready to copy', 'info');
    }
}

// Lazy loading for images
function initializeLazyLoading() {
    if ('IntersectionObserver' in window) {
        const imageObserver = new IntersectionObserver((entries, observer) => {
            entries.forEach(entry => {
                if (entry.isIntersecting) {
                    const img = entry.target;
                    if (img.dataset.src) {
                        img.src = img.dataset.src;
                        img.removeAttribute('data-src');
                        observer.unobserve(img);
                    }
                }
            });
        }, {
            rootMargin: '50px 0px',
            threshold: 0.01
        });
        
        document.querySelectorAll('img[data-src]').forEach(img => {
            imageObserver.observe(img);
        });
    }
}

// Analytics and tracking functions
function trackVideoPlay(videoId) {
    if (typeof gtag !== 'undefined') {
        gtag('event', 'video_play', {
            'video_id': videoId,
            'page_location': window.location.href
        });
    }
    
    console.log(`Video played: ${videoId}`);
}

function trackEventShare(eventId, platform) {
    if (typeof gtag !== 'undefined') {
        gtag('event', 'share', {
            'method': platform,
            'content_type': 'event',
            'content_id': eventId
        });
    }
    
    fetch(`/api/events/${eventId}/share`, {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
        },
        body: JSON.stringify({ platform })
    }).catch(error => {
        console.error('Error tracking share:', error);
    });
}

function trackEventCopy(eventId) {
    if (typeof gtag !== 'undefined') {
        gtag('event', 'copy_link', {
            'content_type': 'event',
            'content_id': eventId
        });
    }
    
    fetch(`/api/events/${eventId}/copy`, {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
        },
        body: JSON.stringify({ action: 'copy_link' })
    }).catch(error => {
        console.error('Error tracking copy:', error);
    });
}

// Helper functions
function formatCategory(category) {
    const categoryMap = {
        'community-service': 'Community Service',
        'educational': 'Educational',
        'religious': 'Religious',
        'cultural': 'Cultural',
        'youth': 'Youth Program',
        'interfaith': 'Interfaith',
        'fundraising': 'Fundraising',
        'health-wellness': 'Health & Wellness',
        'social': 'Social Event',
        'workshop': 'Workshop',
        'conference': 'Conference',
        'meeting': 'Meeting',
        'other': 'Other'
    };
    return categoryMap[category] || 'Event';
}

function formatDate(dateString) {
    if (!dateString) return 'Date TBA';
    try {
        const options = { 
            year: 'numeric', 
            month: 'long', 
            day: 'numeric' 
        };
        return new Date(dateString).toLocaleDateString('en-US', options);
    } catch (error) {
        return 'Date TBA';
    }
}

function convertToEmbedUrl(url) {
    try {
        if (url.includes('youtube.com/watch')) {
            const urlParams = new URLSearchParams(new URL(url).search);
            const videoId = urlParams.get('v');
            return videoId ? `https://www.youtube-nocookie.com/embed/${videoId}?autoplay=1&rel=0&modestbranding=1&fs=1&cc_load_policy=0&iv_load_policy=3&enablejsapi=1&origin=${window.location.origin}` : null;
        } else if (url.includes('youtu.be/')) {
            const videoId = url.split('youtu.be/')[1].split('?')[0];
            return videoId ? `https://www.youtube-nocookie.com/embed/${videoId}?autoplay=1&rel=0&modestbranding=1&fs=1&cc_load_policy=0&iv_load_policy=3&enablejsapi=1&origin=${window.location.origin}` : null;
        } else if (url.includes('vimeo.com/')) {
            const videoId = url.split('vimeo.com/')[1].split('?')[0];
            return videoId ? `https://player.vimeo.com/video/${videoId}?autoplay=1&title=0&byline=0&portrait=0&dnt=1` : null;
        }
        // If it's already an embed URL or other video format, return as-is
        return url;
    } catch (error) {
        console.error('Error converting video URL:', error);
        return null;
    }
}

// Helper function to extract video ID from URL
function extractVideoId(url) {
    try {
        if (url.includes('youtube.com/watch')) {
            const urlParams = new URLSearchParams(new URL(url).search);
            return urlParams.get('v');
        } else if (url.includes('youtu.be/')) {
            return url.split('youtu.be/')[1].split('?')[0];
        } else if (url.includes('vimeo.com/')) {
            return url.split('vimeo.com/')[1].split('?')[0];
        }
        return null;
    } catch (error) {
        console.error('Error extracting video ID:', error);
        return null;
    }
}

// Helper function to get YouTube thumbnail URL
function getYouTubeThumbnail(videoId) {
    return `https://img.youtube.com/vi/${videoId}/maxresdefault.jpg`;
}

// Helper function to get Vimeo thumbnail URL (requires API call)
function getVimeoThumbnail(videoId) {
    // For now, return a placeholder. In production, you'd want to fetch from Vimeo API
    return `https://vumbnail.com/${videoId}.jpg`;
}

// UI Helper functions
function showNoMoreMessage() {
    const container = document.querySelector('.load-more-container');
    if (container) {
        container.innerHTML = `
            <div class="no-more-content">
                <p>You've reached the end of our events.</p>
            </div>
        `;
    }
}

function showNotification(message, type = 'info') {
    const toast = document.createElement('div');
    toast.className = `notification notification-${type}`;
    toast.textContent = message;
    
    const colors = {
        'error': '#dc2626',
        'success': '#16a34a',
        'info': '#0f4f9f',
        'warning': '#f59e0b'
    };
    
    toast.style.cssText = `
        position: fixed;
        top: 2rem;
        right: 2rem;
        background: ${colors[type] || colors.info};
        color: white;
        padding: 1rem 1.5rem;
        border-radius: 0.5rem;
        box-shadow: 0 10px 25px rgba(0, 0, 0, 0.1);
        z-index: 2500;
        transform: translateX(100%);
        transition: transform 0.3s ease;
        max-width: 300px;
        word-wrap: break-word;
        font-size: 0.875rem;
        font-weight: 500;
    `;
    
    document.body.appendChild(toast);
    
    // Animate in
    setTimeout(() => {
        toast.style.transform = 'translateX(0)';
    }, 100);
    
    // Remove after 5 seconds
    setTimeout(() => {
        toast.style.transform = 'translateX(100%)';
        setTimeout(() => {
            if (toast.parentNode) {
                toast.parentNode.removeChild(toast);
            }
        }, 300);
    }, 5000);
}