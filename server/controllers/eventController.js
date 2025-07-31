const Event = require("../../models/Event");
const { generalLogger } = require("../generalLogger");

// Get all events (unified page)
const getAllEvents = async (req, res) => {
    try {
        // Render the unified events page
        res.render("events", {
            title: "Events",
            description: "Discover our community events, activities, and programs at MAS Central Indy",
            additionalCSS: ["events.css"],
            additionalJS: ["events.js"],
            layout: "layout"
        });

    } catch (error) {
        generalLogger.error(`Error in getAllEvents: ${error.message}`);
        
        // Render error state
        res.render("events", {
            title: "Events", 
            description: "Discover our community events, activities, and programs at MAS Central Indy",
            additionalCSS: ["events.css"],
            additionalJS: ["events.js"],
            layout: "layout",
            error: "Unable to load events at this time. Please try again later."
        });
    }
};

// API endpoint to get events based on filters
const getEventsAPI = async (req, res) => {
    try {
        const { 
            category = 'all', 
            page = 1, 
            limit = 12, 
            period = 'upcoming',
            featured = false 
        } = req.query;
        
        const skip = (page - 1) * limit;
        
        // Build base query
        let query = {
            status: { $ne: 'draft' },
            isPublic: true,
            isArchived: { $ne: true }
        };

        // Add date filter based on period
        if (period === 'upcoming') {
            query.eventDate = { $gte: new Date() };
        } else if (period === 'past') {
            query.eventDate = { $lt: new Date() };
        }

        // Add featured filter
        if (featured === 'true') {
            query.featured = true;
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

        let events = [];
        let totalEvents = 0;

        try {
            // Sort based on period
            const sortOrder = period === 'upcoming' ? { eventDate: 1 } : { eventDate: -1 };

            generalLogger.debug(`Fetching events with query: ${JSON.stringify(query)}, sort: ${JSON.stringify(sortOrder)}, page: ${page}, limit: ${limit}`);
            // Execute database queries
            const [eventResults, countResults] = await Promise.all([
                Event.find(query)
                    .sort(sortOrder)
                    .skip(skip)
                    .limit(parseInt(limit))
                    .lean(),
                Event.countDocuments(query)
            ]);

            events = eventResults || [];
            totalEvents = countResults || 0;

            generalLogger.info(`Fetched ${events.length} events for period: ${period}, category: ${category}, page: ${page}`);

        } catch (dbError) {
            generalLogger.error(`Database query error in getEventsAPI: ${dbError.message}`);
            // Continue with empty arrays to avoid breaking the API
        }

        const hasMore = skip + events.length < totalEvents;
        const totalPages = Math.ceil(totalEvents / parseInt(limit));

        return res.status(200).json({
            success: true,
            events: events || [],
            hasMore,
            currentPage: parseInt(page),
            totalPages,
            totalEvents
        });

    } catch (error) {
        generalLogger.error(`Error in getEventsAPI: ${error.message}`);
        return res.status(500).json({ 
            success: false, 
            message: "Unable to load events" 
        });
    }
};

// Get events for calendar view
const getCalendarEvents = async (req, res) => {
    try {
        const { 
            month, 
            year, 
            category = 'all'
            // period = 'upcoming' 
        } = req.query;

        // Build base query
        let query = {
            status: { $ne: 'draft' },
            isPublic: true,
            isArchived: { $ne: true }
        };

        // Add date range filter for the specific month/year if provided
        if (month && year) {
            const startDate = new Date(parseInt(year), parseInt(month), 1);
            const endDate = new Date(parseInt(year), parseInt(month) + 1, 0);
            query.eventDate = { $gte: startDate, $lte: endDate };
        } else {
            // Default to current period filter
            if (period === 'upcoming') {
                query.eventDate = { $gte: new Date() };
            } else if (period === 'past') {
                query.eventDate = { $lt: new Date() };
            }
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

        const events = await Event.find(query)
            .sort({ eventDate: 1 })
            .limit(100) // Limit to avoid too much data
            .lean();

        return res.status(200).json({
            success: true,
            events: events || []
        });

    } catch (error) {
        generalLogger.error(`Error in getCalendarEvents: ${error.message}`);
        return res.status(500).json({
            success: false,
            message: "Unable to load calendar events"
        });
    }
};

// Get single event details
const getEventDetails = async (req, res) => {

    generalLogger.info(`Fetching details for event with slug: ${req.params.slug}`);
    try {
        const { slug } = req.params;
        
        const event = await Event.findOne({ 
            slug, 
            status: { $ne: 'draft' }, 
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

module.exports = {
    getAllEvents,
    getEventsAPI,
    getCalendarEvents,
    getEventDetails,
    trackEventShare
};