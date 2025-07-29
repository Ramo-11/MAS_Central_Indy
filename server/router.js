const express = require("express")
require('dotenv').config()
const { 
    getFutureEvents,
    getPastEvents,
    getMoreEvents, 
    getEventDetails,  
    trackEventShare,
    getUpcomingEvents 
} = require("./controllers/eventController");

const { getContactPage, submitContactForm } = require("./controllers/contactController");


const { generalLogger } = require("./generalLogger")
if (process.env.NODE_ENV !== "production") {
    process.env.STRIPE_PUBLIC_KEY = process.env.STRIPE_PUBLIC_KEY_TEST
} else {
    process.env.STRIPE_PUBLIC_KEY = process.env.STRIPE_PUBLIC_KEY_PROD
}

const route = express.Router()

// *********** GET requests **********
route.get("/", (req, res) => {
    res.render("index", {
        title: "Home",
        description: "Welcome to MAS Central Indy - Making a positive impact in our community",
        additionalCSS: ["index.css"],
        layout: "layout"
    });
});

route.get("/about", (req, res) => {
    res.render("about", {
        title: "About Us", 
        description: "Learn more about our mission, vision, and the team behind MAS Central Indy",
        additionalCSS: ["about.css"],
        additionalJS: ["about.js"],
        layout: "layout"
    });
});

// Events routes
route.get("/events", (req, res) => {
    res.redirect("/events/future");
});

route.get("/events/future", getFutureEvents);
route.get("/events/past", getPastEvents);
route.get("/events/:slug", getEventDetails);

// API routes for events
route.get("/api/events/more", getMoreEvents);
route.get("/api/events/upcoming", getUpcomingEvents);

route.get("/contact", getContactPage);

// Additional routes
route.get("/donate", (req, res) => {
    res.render("donate", {
        title: "Donate",
        description: "Support our mission with a donation to MAS Central Indy",
        additionalCSS: ["donate.css"],
        additionalJS: ["donate.js"],
        layout: "layout"
    });
});

route.get("/privacy-policy", (req, res) => {
    res.render("privacy-policy", {
        title: "Privacy Policy",
        description: "MAS Central Indy's commitment to protecting your privacy",
        additionalCSS: ["legal.css"],
        layout: "layout"
    });
});

route.get("/terms-of-service", (req, res) => {
    res.render("terms-of-service", {
        title: "Terms of Service",
        description: "Terms and conditions for using MAS Central Indy's services",
        additionalCSS: ["legal.css"],
        layout: "layout"
    });
});

// *********** POST requests **********
route.post("/api/events/:eventId/share", trackEventShare);
route.post("/contact", submitContactForm);

module.exports = route