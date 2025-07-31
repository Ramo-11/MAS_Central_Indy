// ********** Imports **************
const expressLayouts = require('express-ejs-layouts');
const express = require('express');
const cookieParser = require("cookie-parser")
const bodyParser = require("body-parser")

const router = require("./server/router")
const { generalLogger } = require("./server/generalLogger")
const connectDB = require('./server/controllers/dbController');
const { userMiddleware } = require("./server/controllers/sessionController")
// ********** End Imports **********

// ********** Initialization **************
const app = express()
require('dotenv').config()
generalLogger.debug("Running in " + process.env.NODE_ENV + " mode")
connectDB()
app.set('view engine', 'ejs');
app.set('views', './views');
app.use(expressLayouts);
app.set('layout', 'layout');
app.set('layout extractScripts', true);
app.set('layout extractStyles', true);

// IMPORTANT: Stripe webhook needs raw body, so handle it BEFORE other body parsers
app.use('/webhooks/stripe', express.raw({type: 'application/json'}));

// Now add the regular body parsers for all other routes
app.use(bodyParser.json())
app.use(bodyParser.urlencoded({ extended: true }))
app.use(express.json())
app.use(express.static("public"))
app.use(cookieParser())
// app.use(sessionMiddleware);
app.use(userMiddleware);
// ********** End Initialization **********

app.use("/", router)

// app.set("view engine", "ejs")

app.listen(process.env.PORT, () => generalLogger.info(`server running on port: http://localhost:${process.env.PORT}`))