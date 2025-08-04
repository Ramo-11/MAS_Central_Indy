// Events Page JavaScript

class EventsManager {
    constructor() {
        this.currentView = 'card';
        this.currentPeriod = 'upcoming';
        this.currentCategory = 'all';
        this.currentPage = 1;
        this.hasMore = true;
        this.loading = false;
        this.events = [];
        this.currentMonth = new Date().getMonth();
        this.currentYear = new Date().getFullYear();
        this.calendarClickHandler = null; // Store the event handler
        
        this.init();
    }

    init() {
        this.bindEvents();
        this.loadInitialEvents();
        this.initializeCalendar();
    }

    bindEvents() {
        // View toggle
        document.querySelectorAll('.view-btn').forEach(btn => {
            btn.addEventListener('click', () => this.switchView(btn.dataset.view));
        });

        // Period toggle
        document.querySelectorAll('.period-btn').forEach(btn => {
            btn.addEventListener('click', () => this.switchPeriod(btn.dataset.period));
        });

        // Category filter
        document.querySelectorAll('.category-btn').forEach(btn => {
            btn.addEventListener('click', () => this.filterByCategory(btn.dataset.category));
        });

        // Load more button
        const loadMoreBtn = document.getElementById('loadMoreBtn');
        if (loadMoreBtn) {
            loadMoreBtn.addEventListener('click', () => this.loadMoreEvents());
        }

        // Calendar navigation
        document.getElementById('prevMonth')?.addEventListener('click', () => this.previousMonth());
        document.getElementById('nextMonth')?.addEventListener('click', () => this.nextMonth());

        // Modal close events
        document.querySelectorAll('.video-modal-overlay, .video-modal-close').forEach(el => {
            el.addEventListener('click', () => this.closeVideoModal());
        });

        document.querySelectorAll('.event-modal-overlay, .event-modal-close').forEach(el => {
            el.addEventListener('click', () => this.closeEventModal());
        });

        // Prevent modal close when clicking inside content
        document.querySelector('.video-modal-content')?.addEventListener('click', (e) => e.stopPropagation());
        document.querySelector('.event-modal-content')?.addEventListener('click', (e) => e.stopPropagation());
    }

    switchView(view) {
        this.currentView = view;
        
        // Update active state
        document.querySelectorAll('.view-btn').forEach(btn => {
            btn.classList.toggle('active', btn.dataset.view === view);
        });

        // Show/hide appropriate sections
        const cardView = document.getElementById('eventsGridSection');
        const calendarView = document.getElementById('calendarView');
        const controlsSection = document.querySelector('.events-controls');

        if (view === 'calendar') {
            cardView.style.display = 'none';
            calendarView.style.display = 'block';
            controlsSection.classList.add('calendar-mode');
            this.renderCalendar();
        } else {
            cardView.style.display = 'block';
            calendarView.style.display = 'none';
            controlsSection.classList.remove('calendar-mode');
        }
    }

    switchPeriod(period) {
        if (this.currentPeriod === period) return;
        
        this.currentPeriod = period;
        this.currentPage = 1;
        this.hasMore = true;
        
        // Update active state
        document.querySelectorAll('.period-btn').forEach(btn => {
            btn.classList.toggle('active', btn.dataset.period === period);
        });

        this.loadEvents(true);
        
        if (this.currentView === 'calendar') {
            this.renderCalendar();
        }
    }

    filterByCategory(category) {
        if (this.currentCategory === category) return;
        
        this.currentCategory = category;
        this.currentPage = 1;
        this.hasMore = true;
        
        // Update active state
        document.querySelectorAll('.category-btn').forEach(btn => {
            btn.classList.toggle('active', btn.dataset.category === category);
        });

        this.loadEvents(true);
        
        if (this.currentView === 'calendar') {
            this.renderCalendar();
        }
    }

    async loadInitialEvents() {
        await this.loadEvents(true);
    }

    async loadEvents(reset = false) {
        if (this.loading) return;
        
        this.loading = true;
        
        if (reset) {
            this.currentPage = 1;
            this.events = [];
            document.getElementById('eventsGrid').innerHTML = '';
        }

        try {
            const params = new URLSearchParams({
                period: this.currentPeriod,
                category: this.currentCategory,
                page: this.currentPage,
                limit: 12
            });

            const response = await fetch(`/api/events?${params}`);
            const data = await response.json();

            if (data.success) {
                if (reset) {
                    this.events = data.events;
                } else {
                    this.events = [...this.events, ...data.events];
                }
                
                this.hasMore = data.hasMore;
                this.renderEvents();
                this.updateLoadMoreButton();
            } else {
                this.showError('Failed to load events');
            }
        } catch (error) {
            console.error('Error loading events:', error);
            this.showError('Failed to load events');
        } finally {
            this.loading = false;
        }
    }

    async loadCalendarEvents() {
    try {
        const params = new URLSearchParams({
            month: this.currentMonth,
            year: this.currentYear,
            category: this.currentCategory
        });

        const response = await fetch(`/api/events/calendar?${params}`);
        const data = await response.json();

        if (data.success) {
            // Store calendar events separately to avoid interference with grid events
            this.calendarEvents = data.events;
            return Promise.resolve();
        } else {
            this.showError('Failed to load calendar events');
            return Promise.reject(new Error('Failed to load calendar events'));
        }
    } catch (error) {
        console.error('Error loading calendar events:', error);
        this.showError('Failed to load calendar events');
        return Promise.reject(error);
    }
}
    renderEvents() {
        const grid = document.getElementById('eventsGrid');
        const noEvents = document.getElementById('noEvents');
        
        if (this.events.length === 0) {
            grid.innerHTML = '';
            noEvents.style.display = 'block';
            return;
        }
        
        noEvents.style.display = 'none';
        
        if (this.currentPage === 1) {
            grid.innerHTML = '';
        }
        
        this.events.slice((this.currentPage - 1) * 12).forEach(event => {
            const eventCard = this.createEventCard(event);
            grid.appendChild(eventCard);
        });
    }

    createEventCard(event) {
        const card = document.createElement('article');
        card.className = 'event-item';
        card.setAttribute('data-event-id', event._id);
        
        const thumbnail = this.createThumbnail(event);
        const content = this.createEventContent(event);
        
        card.appendChild(thumbnail);
        card.appendChild(content);
        
        return card;
    }

    createThumbnail(event) {
        const thumbnail = document.createElement('div');
        thumbnail.className = 'event-thumbnail';
        
        if (event.media?.videos?.length > 0) {
            thumbnail.innerHTML = `
                <div class="video-placeholder">
                    <svg width="60" height="60" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1">
                        <polygon points="5,3 19,12 5,21"></polygon>
                    </svg>
                </div>
                <div class="play-overlay">
                    <button class="play-button" data-video-url="${event.media.videos[0].url || ''}">
                        <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor">
                            <polygon points="5,3 19,12 5,21"></polygon>
                        </svg>
                    </button>
                </div>
            `;
            
            const playBtn = thumbnail.querySelector('.play-button');
            playBtn.addEventListener('click', () => this.openVideoModal(event.media.videos[0].url));
        } else if (event.media?.featuredImage?.url) {
            thumbnail.innerHTML = `
                <img src="${event.media.featuredImage.url}" alt="${event.media.featuredImage.alt || event.title}" class="event-image" loading="lazy">
                ${event.media?.gallery?.length > 0 ? `
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
            thumbnail.innerHTML = `
                <div class="event-placeholder">
                    <svg width="60" height="60" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                        <rect x="3" y="3" width="18" height="18" rx="2" ry="2"></rect>
                        <circle cx="8.5" cy="8.5" r="1.5"></circle>
                        <polyline points="21,15 16,10 5,21"></polyline>
                    </svg>
                </div>
            `;
        }
        
        return thumbnail;
    }

    createEventContent(event) {
        const content = document.createElement('div');
        content.className = 'event-content';
        
        const category = this.formatCategory(event.category);
        const date = this.formatDate(event.eventDate, event.timezone);
        const time = this.formatTime(event.startTime);
        const description = event.shortDescription || (event.description ? event.description.substring(0, 150) + '...' : '');
        
        content.innerHTML = `
            <span class="event-category">${category}</span>
            <h3 class="event-title">
                <a href="/events/${event.slug}" class="event-title-link">${event.title}</a>
            </h3>
            <p class="event-description">${description}</p>
            <div class="event-meta">
                <div class="event-date-time">
                    <span class="event-date">${date}</span>
                    ${time ? `<span class="event-time">${time}</span>` : ''}
                </div>
                ${event.location?.venue ? `
                    <div class="event-location">
                        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                            <path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z"></path>
                            <circle cx="12" cy="10" r="3"></circle>
                        </svg>
                        <span>${event.location.venue}</span>
                    </div>
                ` : ''}
            </div>
            <div class="event-actions">
                <div class="event-actions-inline">
                    ${this.currentPeriod === 'upcoming' ? `
                        <button class="add-to-calendar-btn" data-tooltip="Add to Calendar" data-event='${JSON.stringify({
                            title: event.title,
                            date: event.eventDate,
                            start: event.startTime || '',
                            end: event.endTime || '',
                            description: event.shortDescription || event.description,
                            location: event.location?.venue || ''
                        })}'>
                            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                                <rect x="3" y="4" width="18" height="18" rx="2" ry="2"></rect>
                                <line x1="16" y1="2" x2="16" y2="6"></line>
                                <line x1="8" y1="2" x2="8" y2="6"></line>
                                <line x1="3" y1="10" x2="21" y2="10"></line>
                            </svg>
                        </button>
                    ` : ''}
                    <button class="copy-link-btn" data-tooltip="Copy Link" data-url="/events/${event.slug}">
                        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                            <path d="M10 13a5 5 0 0 0 7.54.54l3-3a5 5 0 0 0-7.07-7.07l-1.72 1.71"></path>
                            <path d="M14 11a5 5 0 0 0-7.54-.54l-3 3a5 5 0 0 0 7.07 7.07l1.71-1.71"></path>
                        </svg>
                    </button>
                    <button class="share-btn" data-tooltip="Share Event" data-event-id="${event._id}" data-title="${event.title}" data-url="/events/${event.slug}">
                        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                            <circle cx="18" cy="5" r="3"></circle>
                            <circle cx="6" cy="12" r="3"></circle>
                            <circle cx="18" cy="19" r="3"></circle>
                            <line x1="8.59" y1="13.51" x2="15.42" y2="17.49"></line>
                            <line x1="15.41" y1="6.51" x2="8.59" y2="10.49"></line>
                        </svg>
                    </button>
                </div>
                <a href="/events/${event.slug}" class="learn-more-btn">Learn More</a>
            </div>
        `;
        
        // Bind action events
        const calendarBtn = content.querySelector('.add-to-calendar-btn');
        if (calendarBtn) {
            calendarBtn.addEventListener('click', () => {
                const eventData = JSON.parse(calendarBtn.dataset.event);
                this.addToGoogleCalendar(eventData);
            });
        }
        
        const copyBtn = content.querySelector('.copy-link-btn');
        if (copyBtn) {
            copyBtn.addEventListener('click', () => this.copyLink(copyBtn.dataset.url));
        }

        const shareBtn = content.querySelector('.share-btn');
        if (shareBtn) {
            shareBtn.addEventListener('click', () => this.shareEvent(event));
        }
        
        return content;
    }

    // Remove createShareButton method since share button is now integrated into event actions
    // createShareButton method removed

    async loadMoreEvents() {
        if (!this.hasMore || this.loading) return;
        
        this.currentPage++;
        await this.loadEvents();
    }

    updateLoadMoreButton() {
        const container = document.getElementById('loadMoreContainer');
        const noMoreContent = document.getElementById('noMoreContent');
        
        if (this.hasMore && this.events.length > 0) {
            container.style.display = 'block';
            noMoreContent.style.display = 'none';
        } else if (this.events.length > 0) {
            container.style.display = 'none';
            noMoreContent.style.display = 'block';
        } else {
            container.style.display = 'none';
            noMoreContent.style.display = 'none';
        }
    }

    // Calendar Methods
    initializeCalendar() {
        this.renderCalendar();
    }

    renderCalendar() {
        const title = document.getElementById('calendarTitle');
        const grid = document.getElementById('calendarGrid');
        
        if (!title || !grid) return;
        
        const monthNames = [
            'January', 'February', 'March', 'April', 'May', 'June',
            'July', 'August', 'September', 'October', 'November', 'December'
        ];
        
        title.textContent = `${monthNames[this.currentMonth]} ${this.currentYear}`;
        
        // Load events for current month before rendering calendar
        this.loadCalendarEvents().then(() => {
            this.renderCalendarGrid();
        }).catch(() => {
            // Still render calendar even if events fail to load
            this.renderCalendarGrid();
        });
    }

    renderCalendarGrid() {
    const grid = document.getElementById('calendarGrid');
    if (!grid) return;

    const firstDay = new Date(this.currentYear, this.currentMonth, 1);
    const lastDay = new Date(this.currentYear, this.currentMonth + 1, 0);
    const startDate = new Date(firstDay);
    startDate.setDate(startDate.getDate() - firstDay.getDay());
    
    let calendarHTML = `
        <div class="calendar-header-row">
            <div class="calendar-header-cell">Sun</div>
            <div class="calendar-header-cell">Mon</div>
            <div class="calendar-header-cell">Tue</div>
            <div class="calendar-header-cell">Wed</div>
            <div class="calendar-header-cell">Thu</div>
            <div class="calendar-header-cell">Fri</div>
            <div class="calendar-header-cell">Sat</div>
        </div>
        <div class="calendar-body">
    `;
    
    const currentDate = new Date(startDate);
    const today = new Date();
    
    for (let i = 0; i < 42; i++) {
        const isCurrentMonth = currentDate.getMonth() === this.currentMonth;
        const isToday = currentDate.toDateString() === today.toDateString();
        const dayEvents = this.getEventsForDate(currentDate);
        
        calendarHTML += `
            <div class="calendar-day ${!isCurrentMonth ? 'other-month' : ''} ${isToday ? 'today' : ''}">
                <div class="calendar-day-number">${currentDate.getDate()}</div>
                <div class="calendar-events">
                    ${dayEvents.slice(0, 3).map(event => `
                        <div class="calendar-event ${this.isEventPast(event) ? 'past' : ''}" 
                             data-event-slug="${event.slug}" 
                             title="${event.title}">
                            ${event.title.length > 15 ? event.title.substring(0, 15) + '...' : event.title}
                        </div>
                    `).join('')}
                    ${dayEvents.length > 3 ? `<div class="calendar-event-more">+${dayEvents.length - 3} more</div>` : ''}
                </div>
            </div>
        `;
        
        currentDate.setDate(currentDate.getDate() + 1);
    }
    
    calendarHTML += '</div>';
    grid.innerHTML = calendarHTML;
    
    // Remove any existing event listeners
    if (this.calendarClickHandler) {
        grid.removeEventListener('click', this.calendarClickHandler);
    }
    
    // Create new event handler
    this.calendarClickHandler = (e) => {
        const calendarEvent = e.target.closest('.calendar-event');
        if (calendarEvent && calendarEvent.dataset.eventSlug) {
            e.preventDefault();
            e.stopPropagation();
            const url = `/events/${calendarEvent.dataset.eventSlug}`;
            window.open(url, '_blank');
        }
    };
    
    // Add the event listener
    grid.addEventListener('click', this.calendarClickHandler, true);
}

    getEventsForDate(date) {
        const dateString = date.toISOString().split('T')[0];
        // Use calendarEvents instead of events for calendar view
        const eventsToCheck = this.calendarEvents || this.events;
        return eventsToCheck.filter(event => {
            const eventDate = new Date(event.eventDate).toISOString().split('T')[0];
            return eventDate === dateString;
        });
    }

    isEventPast(event) {
        const eventDate = new Date(event.eventDate);
        const today = new Date();
        today.setHours(0, 0, 0, 0);
        return eventDate < today;
    }

    previousMonth() {
        if (this.currentMonth === 0) {
            this.currentMonth = 11;
            this.currentYear--;
        } else {
            this.currentMonth--;
        }
        this.renderCalendar();
    }

    nextMonth() {
        if (this.currentMonth === 11) {
            this.currentMonth = 0;
            this.currentYear++;
        } else {
            this.currentMonth++;
        }
        this.renderCalendar();
    }

    // Modal Methods
    openVideoModal(videoUrl) {
        const modal = document.getElementById('videoModal');
        const iframe = document.getElementById('videoFrame');
        
        if (!modal || !iframe || !videoUrl) return;
        
        // Convert YouTube URLs to embed format
        let embedUrl = videoUrl;
        if (videoUrl.includes('youtube.com/watch?v=')) {
            const videoId = videoUrl.split('v=')[1].split('&')[0];
            embedUrl = `https://www.youtube.com/embed/${videoId}`;
        } else if (videoUrl.includes('youtu.be/')) {
            const videoId = videoUrl.split('youtu.be/')[1].split('?')[0];
            embedUrl = `https://www.youtube.com/embed/${videoId}`;
        }
        
        iframe.src = embedUrl;
        modal.classList.add('active');
        document.body.style.overflow = 'hidden';
    }

    closeVideoModal() {
        const modal = document.getElementById('videoModal');
        const iframe = document.getElementById('videoFrame');
        
        if (modal) {
            modal.classList.remove('active');
            document.body.style.overflow = '';
        }
        
        if (iframe) {
            iframe.src = '';
        }
    }

    showEventModal(event) {
        const modal = document.getElementById('eventModal');
        const body = document.getElementById('eventModalBody');
        
        if (!modal || !body) return;
        
        const category = this.formatCategory(event.category);
        const date = this.formatDate(event.eventDate);
        const time = this.formatTime(event.startTime);
        const endTime = this.formatTime(event.endTime);
        
        body.innerHTML = `
            <div class="event-modal-header">
                <span class="event-category">${category}</span>
                <h2 class="event-title">${event.title}</h2>
                <div class="event-date-time">
                    <span class="event-date">${date}</span>
                    ${time ? `<span class="event-time">${time}${endTime ? ` - ${endTime}` : ''}</span>` : ''}
                </div>
                ${event.location?.venue ? `
                    <div class="event-location">
                        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                            <path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z"></path>
                            <circle cx="12" cy="10" r="3"></circle>
                        </svg>
                        <span>${event.location.venue}</span>
                    </div>
                ` : ''}
            </div>
            
            ${event.media?.featuredImage?.url ? `
                <div class="event-modal-image">
                    <img src="${event.media.featuredImage.url}" alt="${event.media.featuredImage.alt || event.title}" loading="lazy">
                </div>
            ` : ''}
            
            <div class="event-modal-content">
                <p class="event-description">${event.description || event.shortDescription || 'No description available.'}</p>
                
                <div class="event-modal-actions">
                    ${this.currentPeriod === 'upcoming' ? `
                        <button class="add-to-calendar-btn" onclick="eventsManager.addToGoogleCalendar(${JSON.stringify({
                            title: event.title,
                            date: event.eventDate,
                            start: event.startTime,
                            end: event.endTime,
                            description: event.shortDescription || event.description,
                            location: event.location?.venue || ''
                        }).replace(/"/g, '&quot;')})">
                            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                                <rect x="3" y="4" width="18" height="18" rx="2" ry="2"></rect>
                                <line x1="16" y1="2" x2="16" y2="6"></line>
                                <line x1="8" y1="2" x2="8" y2="6"></line>
                                <line x1="3" y1="10" x2="21" y2="10"></line>
                            </svg>
                            Add to Calendar
                        </button>
                    ` : ''}
                    <button class="copy-link-btn" onclick="eventsManager.copyLink('/events/${event.slug}')">
                        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                            <path d="M10 13a5 5 0 0 0 7.54.54l3-3a5 5 0 0 0-7.07-7.07l-1.72 1.71"></path>
                            <path d="M14 11a5 5 0 0 0-7.54-.54l-3 3a5 5 0 0 0 7.07 7.07l1.71-1.71"></path>
                        </svg>
                        Copy Link
                    </button>
                    <a href="/events/${event.slug}" class="learn-more-btn">View Full Details</a>
                </div>
            </div>
        `;
        
        modal.classList.add('active');
        document.body.style.overflow = 'hidden';
    }

    closeEventModal() {
        const modal = document.getElementById('eventModal');
        
        if (modal) {
            modal.classList.remove('active');
            document.body.style.overflow = '';
        }
    }

    // Utility Methods
    addToGoogleCalendar(eventData) {
        if (!eventData.date || !eventData.title) return;
        
        const startDate = new Date(eventData.date);
        if (eventData.start) {
            const [hours, minutes] = eventData.start.split(':');
            startDate.setHours(parseInt(hours), parseInt(minutes));
        }
        
        const endDate = new Date(startDate);
        if (eventData.end) {
            const [hours, minutes] = eventData.end.split(':');
            endDate.setHours(parseInt(hours), parseInt(minutes));
        } else {
            endDate.setHours(startDate.getHours() + 1);
        }
        
        const formatDate = (date) => {
            return date.toISOString().replace(/[-:]/g, '').replace(/\.\d{3}/, '');
        };
        
        const params = new URLSearchParams({
            action: 'TEMPLATE',
            text: eventData.title,
            dates: `${formatDate(startDate)}/${formatDate(endDate)}`,
            details: eventData.description || '',
            location: eventData.location || ''
        });
        
        window.open(`https://calendar.google.com/calendar/render?${params}`, '_blank');
    }

    async copyLink(url) {
        const fullUrl = `${window.location.origin}${url}`;
        
        if (navigator.clipboard) {
            try {
                await navigator.clipboard.writeText(fullUrl);
                this.showNotification('Link copied to clipboard!', 'success');
            } catch (err) {
                this.fallbackCopyTextToClipboard(fullUrl);
            }
        } else {
            this.fallbackCopyTextToClipboard(fullUrl);
        }
    }

    fallbackCopyTextToClipboard(text) {
        const textArea = document.createElement('textarea');
        textArea.value = text;
        textArea.style.position = 'fixed';
        textArea.style.left = '-999999px';
        textArea.style.top = '-999999px';
        document.body.appendChild(textArea);
        textArea.focus();
        textArea.select();
        
        try {
            document.execCommand('copy');
            this.showNotification('Link copied to clipboard!', 'success');
        } catch (err) {
            this.showNotification('Failed to copy link', 'error');
        }
        
        document.body.removeChild(textArea);
    }

    async shareEvent(event) {
        const url = `${window.location.origin}/events/${event.slug}`;
        const text = `Check out this event: ${event.title}`;
        
        if (navigator.share) {
            try {
                await navigator.share({
                    title: event.title,
                    text: text,
                    url: url
                });
                
                // Track share
                this.trackEventShare(event._id, 'native');
            } catch (err) {
                if (err.name !== 'AbortError') {
                    this.fallbackShare(event, url);
                }
            }
        } else {
            this.fallbackShare(event, url);
        }
    }

    fallbackShare(event, url) {
        // Create simple share options
        const shareOptions = [
            {
                name: 'Copy Link',
                action: () => this.copyLink(`/events/${event.slug}`)
            },
            {
                name: 'Share on Facebook',
                action: () => {
                    window.open(`https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(url)}`, '_blank');
                    this.trackEventShare(event._id, 'facebook');
                }
            },
            {
                name: 'Share on Twitter',
                action: () => {
                    const text = `Check out this event: ${event.title}`;
                    window.open(`https://twitter.com/intent/tweet?text=${encodeURIComponent(text)}&url=${encodeURIComponent(url)}`, '_blank');
                    this.trackEventShare(event._id, 'twitter');
                }
            }
        ];
        
        // Simple alert-based share (in a real app, you'd want a proper modal)
        const choice = prompt('Share this event:\n1. Copy Link\n2. Facebook\n3. Twitter\nEnter choice (1-3):');
        
        if (choice >= 1 && choice <= 3) {
            shareOptions[choice - 1].action();
        }
    }

    async trackEventShare(eventId, platform) {
        try {
            await fetch(`/api/events/${eventId}/share`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({ platform })
            });
        } catch (error) {
            console.error('Error tracking share:', error);
        }
    }

    showNotification(message, type = 'info') {
        // Create notification element
        const notification = document.createElement('div');
        notification.className = `notification notification-${type}`;
        notification.textContent = message;
        notification.style.cssText = `
            position: fixed;
            top: 20px;
            right: 20px;
            background: ${type === 'success' ? '#10b981' : type === 'error' ? '#ef4444' : '#3b82f6'};
            color: white;
            padding: 12px 24px;
            border-radius: 8px;
            box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
            z-index: 10000;
            font-weight: 500;
            transform: translateX(100%);
            transition: transform 0.3s ease;
        `;
        
        document.body.appendChild(notification);
        
        // Animate in
        setTimeout(() => {
            notification.style.transform = 'translateX(0)';
        }, 100);
        
        // Remove after 3 seconds
        setTimeout(() => {
            notification.style.transform = 'translateX(100%)';
            setTimeout(() => {
                if (notification.parentNode) {
                    notification.parentNode.removeChild(notification);
                }
            }, 300);
        }, 3000);
    }

    showError(message) {
        console.error(message);
        this.showNotification(message, 'error');
    }

    formatCategory(category) {
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

    formatDate(date, timezone = 'America/Indiana/Indianapolis') {
        if (!date) return 'Date TBA';
        try {
            const options = { 
                year: 'numeric', 
                month: 'long', 
                day: 'numeric',
                timeZone: timezone
            };
            return new Date(date).toLocaleDateString('en-US', options);
        } catch (error) {
            return 'Date TBA';
        }
    }

    formatTime(time) {
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
}

// Initialize the events manager when the DOM is loaded
document.addEventListener('DOMContentLoaded', () => {
    window.eventsManager = new EventsManager();
});

// Handle browser back/forward buttons
window.addEventListener('popstate', (event) => {
    if (event.state) {
        window.eventsManager.currentView = event.state.view || 'card';
        window.eventsManager.currentPeriod = event.state.period || 'upcoming';
        window.eventsManager.currentCategory = event.state.category || 'all';
        window.eventsManager.loadEvents(true);
    }
});

// Handle keyboard shortcuts
document.addEventListener('keydown', (event) => {
    // Escape key closes modals
    if (event.key === 'Escape') {
        window.eventsManager.closeVideoModal();
        window.eventsManager.closeEventModal();
    }
    
    // Arrow keys for calendar navigation (when calendar is visible)
    if (window.eventsManager.currentView === 'calendar') {
        if (event.key === 'ArrowLeft' && event.ctrlKey) {
            event.preventDefault();
            window.eventsManager.previousMonth();
        } else if (event.key === 'ArrowRight' && event.ctrlKey) {
            event.preventDefault();
            window.eventsManager.nextMonth();
        }
    }
});