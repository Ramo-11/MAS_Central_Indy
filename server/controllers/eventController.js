const Event = require("../../models/Event");
const { generalLogger } = require("../generalLogger");

// Get future events
const getFutureEvents = async (req, res) => {
    try {
        const { category = 'all', page = 1, limit = 12 } = req.query;
        const skip = (page - 1) * limit;
        
        // Build base query for future events
        let query = {
            status: 'published',
            isPublic: true,
            isArchived: { $ne: true },
            eventDate: { $gte: new Date() }
        };

        // Apply category filters
        if (category && category !== 'all') {
            switch (category) {
                case 'videos':
                    query['media.videos.0'] = { $exists: true };
                    break;
                case 'gallery':
                    query['media.gallery.0'] = { $exists: true };
                    break;
                case 'news':
                    query.category = { $in: ['educational', 'community-service', 'fundraising'] };
                    break;
                case 'events':
                    query.category = { $in: ['cultural', 'social', 'religious', 'interfaith'] };
                    break;
                default:
                    query.category = category;
            }
        }

        let events = [];
        let totalEvents = 0;
        let featuredEvents = [];

        try {
            // Execute database queries
            const queries = [
                Event.find(query)
                    .sort({ eventDate: 1 }) // Changed from startDate to eventDate
                    .skip(skip)
                    .limit(parseInt(limit))
                    .lean(),
                Event.countDocuments(query)
            ];

            generalLogger.info(`Fetching future events for category: ${category}, page: ${page}, limit: ${limit}`);

            // Add featured events query if on first page
            if (page == 1) {
                queries.push(
                    Event.find({
                        status: 'published',
                        isPublic: true,
                        featured: true,
                        isArchived: { $ne: true },
                        eventDate: { $gte: new Date() } // Changed from startDate to eventDate
                    })
                    .sort({ eventDate: 1 }) // Changed from startDate to eventDate
                    .limit(2)
                    .lean()
                );
            }

            const results = await Promise.all(queries);
            events = results[0] || [];
            totalEvents = results[1] || 0;
            featuredEvents = results[2] || [];

            generalLogger.info(`Fetched ${events.length} future events and ${featuredEvents.length} featured events for category: ${category}`);

        } catch (dbError) {
            generalLogger.error(`Database query error in getFutureEvents: ${dbError.message}`);
            // Continue with empty arrays to avoid breaking the page
        }

        const hasMore = skip + events.length < totalEvents;
        const totalPages = Math.ceil(totalEvents / parseInt(limit));

        // Render the future events page
        res.render("events-future", {
            title: "Future Events",
            description: "Discover our upcoming events and activities at MAS Central Indy",
            additionalCSS: ["events-future.css"],
            additionalJS: ["events-future.js"],
            layout: "layout",
            events,
            featuredEvents,
            currentCategory: category,
            hasMore,
            currentPage: parseInt(page),
            totalPages
        });

    } catch (error) {
        generalLogger.error(`Error in getFutureEvents: ${error.message}`);
        
        // Render error state
        res.render("events-future", {
            title: "Future Events", 
            description: "Discover our upcoming events and activities at MAS Central Indy",
            additionalCSS: ["events-future.css"],
            additionalJS: ["events-future.js"],
            layout: "layout",
            events: [],
            featuredEvents: [],
            currentCategory: 'all',
            hasMore: false,
            currentPage: 1,
            totalPages: 0,
            error: "Unable to load events at this time. Please try again later."
        });
    }
};
// Get past events
const getPastEvents = async (req, res) => {
    try {
        const { category = 'all', page = 1, limit = 12 } = req.query;
        const skip = (page - 1) * limit;
        
        // Build base query for past events
        let query = {
            status: 'published',
            isPublic: true,
            isArchived: { $ne: true },
            eventDate: { $lt: new Date() } // Since you only use eventDate now
        };

        // Apply category filters
        if (category && category !== 'all') {
            switch (category) {
                case 'videos':
                    query['media.videos.0'] = { $exists: true };
                    break;
                case 'gallery':
                    query['media.gallery.0'] = { $exists: true };
                    break;
                case 'news':
                    query.category = { $in: ['educational', 'community-service', 'fundraising'] };
                    break;
                case 'events':
                    query.category = { $in: ['cultural', 'social', 'religious', 'interfaith'] };
                    break;
                default:
                    query.category = category;
            }
        }

        let events = [];
        let totalEvents = 0;
        let featuredEvents = [];

        try {
            // Execute database queries
            const queries = [
                Event.find(query)
                    .sort({ eventDate: -1 }) // Sort by eventDate only
                    .skip(skip)
                    .limit(parseInt(limit))
                    .lean(),
                Event.countDocuments(query)
            ];

            generalLogger.info(`Fetching past events for category: ${category}, page: ${page}, limit: ${limit}`);

            // Add featured events query if on first page
            if (page == 1) {
                queries.push(
                    Event.find({
                        status: 'published',
                        isPublic: true,
                        featured: true,
                        isArchived: { $ne: true },
                        eventDate: { $lt: new Date() }
                    })
                    .sort({ eventDate: -1 })
                    .limit(2)
                    .lean()
                );
            }

            const results = await Promise.all(queries);
            events = results[0] || [];
            totalEvents = results[1] || 0;
            featuredEvents = results[2] || [];

            generalLogger.info(`Fetched ${events.length} past events and ${featuredEvents.length} featured events for category: ${category}`);

        } catch (dbError) {
            generalLogger.error(`Database query error in getPastEvents: ${dbError.message}`);
        }

        const hasMore = skip + events.length < totalEvents;
        const totalPages = Math.ceil(totalEvents / parseInt(limit));

        res.render("events-past", {
            title: "Past Events",
            description: "View our previous events and community activities",
            additionalCSS: ["events-past.css"],
            additionalJS: ["events-past.js"],
            layout: "layout",
            events,
            featuredEvents,
            currentCategory: category,
            hasMore,
            currentPage: parseInt(page),
            totalPages
        });

    } catch (error) {
        generalLogger.error(`Error in getPastEvents: ${error.message}`);
        
        res.render("events-past", {
            title: "Past Events", 
            description: "View our previous events and community activities",
            additionalCSS: ["events-past.css"],
            additionalJS: ["events-past.js"],
            layout: "layout",
            events: [],
            featuredEvents: [],
            currentCategory: 'all',
            hasMore: false,
            currentPage: 1,
            totalPages: 0,
            error: "Unable to load events at this time. Please try again later."
        });
    }
};

// Get more events for AJAX loading
const getMoreEvents = async (req, res) => {
    try {
        const { category = 'all', page = 1, limit = 6, type = 'future' } = req.query;
        const skip = (page - 1) * limit;
        
        // Build query based on event type (future or past)
        let query = {
            status: 'published',
            isPublic: true,
            isArchived: { $ne: true }
        };

        // Add date filter based on type
        if (type === 'future') {
            query.startDate = { $gte: new Date() };
        } else {
            query.startDate = { $lt: new Date() };
        }

        // Apply category filters
        if (category && category !== 'all') {
            switch (category) {
                case 'videos':
                    query['media.videos.0'] = { $exists: true };
                    break;
                case 'gallery':
                    query['media.gallery.0'] = { $exists: true };
                    break;
                case 'news':
                    query.category = { $in: ['educational', 'community-service', 'fundraising'] };
                    break;
                case 'events':
                    query.category = { $in: ['cultural', 'social', 'religious', 'interfaith'] };
                    break;
                default:
                    query.category = category;
            }
        }

        // Sort based on type
        const sortOrder = type === 'future' ? { startDate: 1 } : { startDate: -1 };

        const [events, totalEvents] = await Promise.all([
            Event.find(query)
                .sort(sortOrder)
                .skip(skip)
                .limit(parseInt(limit))
                .lean(),
            Event.countDocuments(query)
        ]);

        const hasMore = skip + events.length < totalEvents;
        const totalPages = Math.ceil(totalEvents / parseInt(limit));

        return res.status(200).json({
            success: true,
            events: events || [],
            hasMore,
            currentPage: parseInt(page),
            totalPages
        });

    } catch (error) {
        generalLogger.error(`Error in getMoreEvents: ${error.message}`);
        return res.status(500).json({ 
            success: false, 
            message: "Unable to load more events" 
        });
    }
};

// Get single event details
const getEventDetails = async (req, res) => {
    try {
        const { slug } = req.params;
        
        const event = await Event.findOne({ 
            slug, 
            status: 'published', 
            isPublic: true 
        }).lean();

        if (!event) {
            generalLogger.warn(`Event not found with slug: ${slug}`);
            return res.status(404).render("error", { 
                status: 404,
                message: "Event not found",
                title: "Event Not Found",
                layout: "layout"
            });
        }

        // Increment view count (fire and forget)
        Event.findByIdAndUpdate(event._id, {
            $inc: { 'analytics.views': 1 }
        }).catch(error => {
            generalLogger.error(`Error updating view count: ${error.message}`);
        });

        res.render("event-details", {
            title: event.title,
            description: event.shortDescription || event.description,
            additionalCSS: ["event-details.css"],
            additionalJS: ["event-details.js"],
            layout: "layout",
            event
        });

    } catch (error) {
        generalLogger.error(`Error in getEventDetails: ${error.message}`);
        return res.status(500).render("error", { 
            status: 500,
            message: "Unable to load event details",
            title: "Server Error",
            layout: "layout"
        });
    }
};

// Get upcoming events (API endpoint)
const getUpcomingEvents = async (req, res) => {
    try {
        const { limit = 10 } = req.query;
        
        const events = await Event.find({
            status: 'published',
            isPublic: true,
            isArchived: { $ne: true },
            startDate: { $gte: new Date() }
        })
        .sort({ startDate: 1 })
        .limit(parseInt(limit))
        .lean();
        
        return res.status(200).json({ 
            success: true, 
            events: events || []
        });

    } catch (error) {
        generalLogger.error(`Error in getUpcomingEvents: ${error.message}`);
        return res.status(500).json({ 
            success: false, 
            message: "Unable to fetch upcoming events" 
        });
    }
};

// Track event sharing
const trackEventShare = async (req, res) => {
    try {
        const { eventId } = req.params;
        const { platform = 'unknown' } = req.body;

        if (!eventId) {
            return res.status(400).json({
                success: false,
                message: "Event ID is required"
            });
        }

        // Update share count (fire and forget)
        Event.findByIdAndUpdate(eventId, {
            $inc: { 'analytics.shares': 1 }
        }).catch(error => {
            generalLogger.error(`Error updating share count: ${error.message}`);
        });

        generalLogger.info(`Event ${eventId} shared on ${platform}`);
        
        return res.status(200).json({ 
            success: true, 
            message: "Share tracked successfully" 
        });

    } catch (error) {
        generalLogger.error(`Error in trackEventShare: ${error.message}`);
        return res.status(500).json({ 
            success: false, 
            message: "Unable to track share" 
        });
    }
};

// Get events by category (API endpoint)
const getEventsByCategory = async (req, res) => {
    try {
        const { category } = req.params;
        const { limit = 10, page = 1, type = 'future' } = req.query;
        const skip = (page - 1) * limit;

        let query = {
            status: 'published',
            isPublic: true,
            isArchived: { $ne: true }
        };

        // Add date filter based on type
        if (type === 'future') {
            query.startDate = { $gte: new Date() };
        } else {
            query.startDate = { $lt: new Date() };
        }

        if (category !== 'all') {
            switch (category) {
                case 'videos':
                    query['media.videos.0'] = { $exists: true };
                    break;
                case 'gallery':
                    query['media.gallery.0'] = { $exists: true };
                    break;
                case 'news':
                    query.category = { $in: ['educational', 'community-service', 'fundraising'] };
                    break;
                case 'events':
                    query.category = { $in: ['cultural', 'social', 'religious', 'interfaith'] };
                    break;
                default:
                    query.category = category;
            }
        }

        // Sort based on type
        const sortOrder = type === 'future' ? { startDate: 1 } : { startDate: -1 };

        const [events, totalEvents] = await Promise.all([
            Event.find(query)
                .sort(sortOrder)
                .skip(skip)
                .limit(parseInt(limit))
                .lean(),
            Event.countDocuments(query)
        ]);

        const hasMore = skip + events.length < totalEvents;

        return res.status(200).json({
            success: true,
            events,
            hasMore,
            currentPage: parseInt(page),
            totalPages: Math.ceil(totalEvents / parseInt(limit))
        });

    } catch (error) {
        generalLogger.error(`Error in getEventsByCategory: ${error.message}`);
        return res.status(500).json({
            success: false,
            message: "Unable to fetch events by category"
        });
    }
};

module.exports = {
    getFutureEvents,
    getPastEvents,
    getMoreEvents,
    getEventDetails,
    getUpcomingEvents,
    trackEventShare,
    getEventsByCategory
};