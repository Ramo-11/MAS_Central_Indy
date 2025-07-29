// Future Events JavaScript
document.addEventListener('DOMContentLoaded', function() {
    initializeFutureEvents();
});

function initializeFutureEvents() {
    initializeCategoryFilter();
    initializeVideoModal();
    initializeLoadMore();
    initializeShareButtons();
    initializeAddToCalendar();
    initializeCopyLink();
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

// Video modal functionality
function initializeVideoModal() {
    const playButtons = document.querySelectorAll('.play-button');
    const videoModal = document.getElementById('videoModal');
    const videoFrame = document.getElementById('videoFrame');
    const closeButton = document.querySelector('.video-modal-close');
    const modalOverlay = document.querySelector('.video-modal-overlay');
    
    if (!videoModal) return;
    
    playButtons.forEach(button => {
        button.addEventListener('click', function() {
            const videoUrl = this.getAttribute('data-video-url');
            const videoId = this.getAttribute('data-video');
            
            if (videoUrl && videoUrl.trim()) {
                const embedUrl = convertToEmbedUrl(videoUrl);
                if (embedUrl) {
                    openVideoModal(embedUrl);
                    trackVideoPlay(videoId);
                } else {
                    showNotification('Invalid video URL', 'error');
                }
            } else {
                showNotification('Video not available', 'info');
            }
        });
    });
    
    if (closeButton) {
        closeButton.addEventListener('click', closeVideoModal);
    }
    
    if (modalOverlay) {
        modalOverlay.addEventListener('click', closeVideoModal);
    }
    
    document.addEventListener('keydown', function(e) {
        if (e.key === 'Escape' && videoModal.classList.contains('active')) {
            closeVideoModal();
        }
    });
    
    function openVideoModal(videoUrl) {
        if (videoFrame && videoModal) {
            videoFrame.src = videoUrl;
            videoModal.classList.add('active');
            document.body.style.overflow = 'hidden';
        }
    }
    
    function closeVideoModal() {
        if (videoModal && videoFrame) {
            videoModal.classList.remove('active');
            videoFrame.src = '';
            document.body.style.overflow = '';
        }
    }
}

// Copy Link functionality
function initializeCopyLink() {
    const copyLinkButtons = document.querySelectorAll('.copy-link-btn');
    
    copyLinkButtons.forEach(button => {
        button.addEventListener('click', function() {
            const eventUrl = this.getAttribute('data-url');
            const fullUrl = window.location.origin + eventUrl;
            
            copyToClipboard(fullUrl);
        });
    });
}

function copyToClipboard(url) {
    if (navigator.clipboard) {
        navigator.clipboard.writeText(url).then(() => {
            showNotification('Link copied to clipboard!', 'success');
        }).catch(() => {
            fallbackCopyToClipboard(url);
        });
    } else {
        fallbackCopyToClipboard(url);
    }
}

function fallbackCopyToClipboard(url) {
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
        showNotification('Link copied to clipboard!', 'success');
    } catch (err) {
        console.error('Fallback copy failed:', err);
        showNotification('Unable to copy link', 'error');
    }
    
    document.body.removeChild(textArea);
}

// Add to Calendar functionality
function initializeAddToCalendar() {
    const calendarButtons = document.querySelectorAll('.add-to-calendar-btn');
    
    calendarButtons.forEach(button => {
        button.addEventListener('click', function() {
            const title = this.getAttribute('data-title');
            const date = this.getAttribute('data-date');
            const startTime = this.getAttribute('data-start');
            const endTime = this.getAttribute('data-end');
            const description = this.getAttribute('data-description');
            const location = this.getAttribute('data-location');
            
            generateCalendarLink(title, date, startTime, endTime, description, location);
        });
    });
}

function generateCalendarLink(title, date, startTime, endTime, description, location) {
    try {
        // Create start and end datetime objects
        const eventDate = new Date(date);
        const [startHour, startMinute] = startTime.split(':');
        const [endHour, endMinute] = endTime.split(':');
        
        const startDateTime = new Date(eventDate);
        startDateTime.setHours(parseInt(startHour), parseInt(startMinute), 0, 0);
        
        const endDateTime = new Date(eventDate);
        endDateTime.setHours(parseInt(endHour), parseInt(endMinute), 0, 0);
        
        // Format for Google Calendar (YYYYMMDDTHHMMSSZ)
        const formatDateTime = (date) => {
            return date.toISOString().replace(/[-:]/g, '').replace(/\.\d{3}/, '');
        };
        
        const startFormatted = formatDateTime(startDateTime);
        const endFormatted = formatDateTime(endDateTime);
        
        // Create Google Calendar URL
        const calendarUrl = `https://calendar.google.com/calendar/render?action=TEMPLATE&text=${encodeURIComponent(title)}&dates=${startFormatted}/${endFormatted}&details=${encodeURIComponent(description || '')}&location=${encodeURIComponent(location || '')}&sf=true&output=xml`;
        
        // Open calendar in new window
        window.open(calendarUrl, '_blank', 'width=600,height=600');
        
        showNotification('Opening calendar...', 'success');
        
    } catch (error) {
        console.error('Error generating calendar link:', error);
        showNotification('Error adding to calendar', 'error');
    }
}

// Load more functionality
function initializeLoadMore() {
    const loadMoreBtn = document.querySelector('.load-more-btn');
    
    if (!loadMoreBtn) return;
    
    loadMoreBtn.addEventListener('click', function() {
        const page = parseInt(this.getAttribute('data-page'));
        const category = this.getAttribute('data-category');
        const type = this.getAttribute('data-type');
        
        loadMoreEvents(page, category, type, this);
    });
}

function loadMoreEvents(page, category, type, button) {
    button.classList.add('loading');
    button.disabled = true;
    
    const url = `/api/events/more?page=${page}&category=${category}&type=${type}&limit=6`;
    
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
                showNotification('Failed to load more events', 'error');
            }
        })
        .catch(error => {
            console.error('Error loading more events:', error);
            showNotification('Failed to load more events', 'error');
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
        
        setTimeout(() => {
            eventElement.style.opacity = '1';
            eventElement.style.transform = 'translateY(0)';
        }, 100);
    });
    
    initializeNewElements();
}

function createEventElement(event) {
    const article = document.createElement('article');
    article.className = 'event-item';
    article.setAttribute('data-category', getCategoryGroup(event.category));
    article.setAttribute('data-event-id', event._id);
    article.style.opacity = '0';
    article.style.transform = 'translateY(20px)';
    article.style.transition = 'all 0.4s ease';
    
    const hasVideo = event.media?.videos?.length > 0;
    const hasGallery = event.media?.gallery?.length > 0;
    const hasFeaturedImage = event.media?.featuredImage?.url;
    
    let thumbnailContent = '';
    
    if (hasVideo) {
        thumbnailContent = `
            <div class="video-placeholder">
                <svg width="60" height="60" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1">
                    <polygon points="5,3 19,12 5,21"></polygon>
                </svg>
            </div>
            <div class="play-overlay">
                <button class="play-button" data-video="${event._id}" data-video-url="${event.media.videos[0].url || ''}">
                    <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor">
                        <polygon points="5,3 19,12 5,21"></polygon>
                    </svg>
                </button>
            </div>
        `;
    } else if (hasGallery && event.media.gallery.length > 3) {
        thumbnailContent = `
            <div class="event-collage">
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
    
    const locationHtml = event.location?.venue ? `
        <div class="event-location">
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                <path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z"></path>
                <circle cx="12" cy="10" r="3"></circle>
            </svg>
            <span>${event.location.venue}</span>
        </div>
    ` : '';
    
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
                <div class="event-date-time">
                    <span class="event-date">${formatDate(event.eventDate)}</span>
                    <span class="event-time">${formatTime(event.startTime)}</span>
                </div>
                ${locationHtml}
            </div>
            <div class="event-actions">
                <div class="event-actions-inline">
                    <button class="add-to-calendar-btn" 
                            data-title="${event.title}" 
                            data-date="${event.eventDate}" 
                            data-start="${event.startTime}" 
                            data-end="${event.endTime}" 
                            data-description="${event.shortDescription || event.description}"
                            data-location="${event.location?.venue || ''}">
                        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                            <rect x="3" y="4" width="18" height="18" rx="2" ry="2"></rect>
                            <line x1="16" y1="2" x2="16" y2="6"></line>
                            <line x1="8" y1="2" x2="8" y2="6"></line>
                            <line x1="3" y1="10" x2="21" y2="10"></line>
                        </svg>
                        Add to Google Calendar
                    </button>
                    <button class="copy-link-btn" data-url="/events/${event.slug}">
                        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                            <path d="M10 13a5 5 0 0 0 7.54.54l3-3a5 5 0 0 0-7.07-7.07l-1.72 1.71"></path>
                            <path d="M14 11a5 5 0 0 0-7.54-.54l-3 3a5 5 0 0 0 7.07 7.07l1.71-1.71"></path>
                        </svg>
                        Copy Link
                    </button>
                </div>
                <a href="/events/${event.slug}" class="learn-more-btn">Learn More</a>
            </div>
        </div>
        <button class="share-btn" data-event-id="${event._id}" data-title="${event.title}" data-url="/events/${event.slug}">
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                <circle cx="18" cy="5" r="3"></circle>
                <circle cx="6" cy="12" r="3"></circle>
                <circle cx="18" cy="19" r="3"></circle>
                <line x1="8.59" y1="13.51" x2="15.42" y2="17.49"></line>
                <line x1="15.41" y1="6.51" x2="8.59" y2="10.49"></line>
            </svg>
        </button>
    `;
    
    return article;
}

function initializeNewElements() {
    // Reinitialize video modal for new elements
    const newPlayButtons = document.querySelectorAll('.play-button:not([data-initialized])');
    newPlayButtons.forEach(button => {
        button.setAttribute('data-initialized', 'true');
        button.addEventListener('click', function() {
            const videoUrl = this.getAttribute('data-video-url');
            const videoId = this.getAttribute('data-video');
            
            if (videoUrl && videoUrl.trim()) {
                const embedUrl = convertToEmbedUrl(videoUrl);
                if (embedUrl) {
                    const videoFrame = document.getElementById('videoFrame');
                    const videoModal = document.getElementById('videoModal');
                    
                    if (videoFrame && videoModal) {
                        videoFrame.src = embedUrl;
                        videoModal.classList.add('active');
                        document.body.style.overflow = 'hidden';
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
    
    // Reinitialize calendar buttons for new elements
    const newCalendarButtons = document.querySelectorAll('.add-to-calendar-btn:not([data-initialized])');
    newCalendarButtons.forEach(button => {
        button.setAttribute('data-initialized', 'true');
        button.addEventListener('click', function() {
            const title = this.getAttribute('data-title');
            const date = this.getAttribute('data-date');
            const startTime = this.getAttribute('data-start');
            const endTime = this.getAttribute('data-end');
            const description = this.getAttribute('data-description');
            const location = this.getAttribute('data-location');
            
            generateCalendarLink(title, date, startTime, endTime, description, location);
        });
    });
    
    // Reinitialize copy link buttons for new elements
    const newCopyLinkButtons = document.querySelectorAll('.copy-link-btn:not([data-initialized])');
    newCopyLinkButtons.forEach(button => {
        button.setAttribute('data-initialized', 'true');
        button.addEventListener('click', function() {
            const eventUrl = this.getAttribute('data-url');
            const fullUrl = window.location.origin + eventUrl;
            
            copyToClipboard(fullUrl);
        });
    });
    
    // Reinitialize share buttons for new elements
    const newShareButtons = document.querySelectorAll('.share-btn:not([data-initialized])');
    newShareButtons.forEach(button => {
        button.setAttribute('data-initialized', 'true');
        initializeShareButton(button);
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

function shareContent(title, url, eventId) {
    if (navigator.share) {
        navigator.share({
            title: title,
            url: url
        }).then(() => {
            trackEventShare(eventId, 'native');
            showNotification('Event shared successfully!', 'success');
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

// Helper functions
function convertToEmbedUrl(url) {
    try {
        if (url.includes('youtube.com/watch')) {
            const urlParams = new URLSearchParams(new URL(url).search);
            const videoId = urlParams.get('v');
            return videoId ? `https://www.youtube.com/embed/${videoId}?autoplay=1` : null;
        } else if (url.includes('youtu.be/')) {
            const videoId = url.split('youtu.be/')[1].split('?')[0];
            return videoId ? `https://www.youtube.com/embed/${videoId}?autoplay=1` : null;
        } else if (url.includes('vimeo.com/')) {
            const videoId = url.split('vimeo.com/')[1].split('?')[0];
            return videoId ? `https://player.vimeo.com/video/${videoId}?autoplay=1` : null;
        }
        return url;
    } catch (error) {
        console.error('Error converting video URL:', error);
        return null;
    }
}

function getCategoryGroup(category) {
    const eventCategories = ['cultural', 'social', 'religious', 'interfaith'];
    const newsCategories = ['educational', 'community-service', 'fundraising'];
    
    if (eventCategories.includes(category)) {
        return 'events';
    } else if (newsCategories.includes(category)) {
        return 'news';
    } else {
        return 'events';
    }
}

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

function formatTime(time) {
    if (!time) return '';
    try {
        const [hours, minutes] = time.split(':');
        const timeObj = new Date();
        timeObj.setHours(parseInt(hours), parseInt(minutes));
        return timeObj.toLocaleTimeString('en-US', { 
            hour: 'numeric', 
            minute: '2-digit',
            hour12: true 
        });
    } catch (error) {
        return time;
    }
}

// Analytics and tracking
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

// UI Helper functions
function showNoMoreMessage() {
    const container = document.querySelector('.load-more-container');
    if (container) {
        container.innerHTML = `
            <div class="no-more-content">
                <p>You've reached the end of our upcoming events.</p>
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
    
    setTimeout(() => {
        toast.style.transform = 'translateX(0)';
    }, 100);
    
    setTimeout(() => {
        toast.style.transform = 'translateX(100%)';
        setTimeout(() => {
            if (toast.parentNode) {
                toast.parentNode.removeChild(toast);
            }
        }, 300);
    }, 5000);
}