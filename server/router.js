const express = require("express")
require('dotenv').config()
const {
    getAllEvents,
    getEventsAPI,
    getCalendarEvents,
    getEventDetails,
    trackEventShare
} = require("./controllers/eventController");

const {
    getRegistrationPage,
    submitRegistration,
    getRegistrationStatus
} = require("./controllers/registrationController");

const { getContactPage, submitContactForm } = require("./controllers/contactController");

const { 
    createDonationPaymentIntent,
    confirmDonationPayment
} = require("./controllers/stripeController");

const isProd = process.env.NODE_ENV === "production"
process.env.STRIPE_PUBLIC_KEY = isProd ? process.env.STRIPE_PUBLIC_KEY_PROD : process.env.STRIPE_PUBLIC_KEY_TEST

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

// *********** EVENTS ROUTES **********

// Main unified events page
route.get("/events", getAllEvents);

// Individual event details
route.get("/events/:slug", getEventDetails);

// Event registration page
route.get("/events/:slug/register", getRegistrationPage);

// *********** API ROUTES FOR EVENTS **********

// Main API endpoint for getting events
route.get("/api/events", getEventsAPI);

// Calendar-specific events API
route.get("/api/events/calendar", getCalendarEvents);

// *********** OTHER ROUTES **********

route.get("/contact", getContactPage);

route.get("/donate", (req, res) => {
    res.render("donate", {
        title: "Donate",
        description: "Support our mission with a donation to MAS Central Indy",
        additionalCSS: ["donate.css"],
        additionalJS: ["donate.js"],
        stripePublicKey: process.env.STRIPE_PUBLIC_KEY,
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
route.post("/events/:slug/register", submitRegistration);

// *********** REGISTRATION API ROUTES **********
route.get("/api/events/:eventId/registration-status", getRegistrationStatus);
route.post("/contact", submitContactForm);

// *********** DONATION/STRIPE ROUTES **********
route.post("/api/donations/create-payment-intent", createDonationPaymentIntent);
route.post("/api/donations/confirm-payment", confirmDonationPayment);

module.exports = route