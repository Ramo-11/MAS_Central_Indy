require('dotenv').config()

// Set up Stripe key based on environment
if (process.env.NODE_ENV !== "production") {
    process.env.STRIPE_SECRET_KEY = process.env.STRIPE_SECRET_KEY_TEST
} else {
    process.env.STRIPE_SECRET_KEY = process.env.STRIPE_SECRET_KEY_PROD
}

const stripe = require('stripe')(process.env.STRIPE_SECRET_KEY)
const { generalLogger } = require('../generalLogger')

// Create payment intent for one-time donation
async function createDonationPaymentIntent(req, res) {
    try {
        const { 
            amount, 
            recurring, 
            purpose, 
            coverFees, 
            firstName, 
            lastName, 
            email, 
            message,
            totalAmount
        } = req.body

        // Validate required fields
        if (!amount || !firstName || !lastName || !email) {
            generalLogger.error("Missing required fields for donation payment intent")
            return res.status(400).json({ 
                success: false, 
                message: "Missing required fields" 
            })
        }

        // Validate amount
        const donationAmount = parseFloat(totalAmount || amount)
        if (donationAmount < 1) {
            generalLogger.error("Donation amount must be at least $1")
            return res.status(400).json({ 
                success: false, 
                message: "Donation amount must be at least $1" 
            })
        }

        // Convert to cents for Stripe
        const amountInCents = Math.round(donationAmount * 100)

        // Create payment intent
        const paymentIntent = await stripe.paymentIntents.create({
            amount: amountInCents,
            currency: 'usd',
            metadata: {
                donorName: `${firstName} ${lastName}`,
                donorEmail: email,
                purpose: purpose || 'general',
                recurring: recurring ? 'yes' : 'no',
                coverFees: coverFees ? 'yes' : 'no',
                originalAmount: amount.toString(),
                message: message || ''
            },
            automatic_payment_methods: {
                enabled: true,
            },
            description: `Donation from ${firstName} ${lastName} (${email})`,
            receipt_email: email,
        })

        generalLogger.info(`Payment intent created for donation: ${paymentIntent.id}, Amount: $${donationAmount}, Donor: ${firstName} ${lastName}`)
        
        res.json({
            success: true,
            clientSecret: paymentIntent.client_secret,
            paymentIntentId: paymentIntent.id
        })

    } catch (error) {
        generalLogger.error(`Error creating donation payment intent: ${error.message}`)
        res.status(500).json({ 
            success: false, 
            message: "Unable to process donation. Please try again." 
        })
    }
}

// Create subscription for recurring donations
async function createRecurringDonation(req, res) {
    try {
        const { 
            amount, 
            purpose, 
            coverFees, 
            firstName, 
            lastName, 
            email, 
            message,
            totalAmount,
            paymentMethodId
        } = req.body

        // Validate required fields
        if (!amount || !firstName || !lastName || !email || !paymentMethodId) {
            generalLogger.error("Missing required fields for recurring donation")
            return res.status(400).json({ 
                success: false, 
                message: "Missing required fields" 
            })
        }

        // Validate amount
        const donationAmount = parseFloat(totalAmount || amount)
        if (donationAmount < 1) {
            generalLogger.error("Donation amount must be at least $1")
            return res.status(400).json({ 
                success: false, 
                message: "Donation amount must be at least $1" 
            })
        }

        // Convert to cents for Stripe
        const amountInCents = Math.round(donationAmount * 100)

        // Create or retrieve customer
        let customer
        const existingCustomers = await stripe.customers.list({
            email: email,
            limit: 1
        })

        if (existingCustomers.data.length > 0) {
            customer = existingCustomers.data[0]
            generalLogger.info(`Using existing customer: ${customer.id} for ${email}`)
        } else {
            customer = await stripe.customers.create({
                email: email,
                name: `${firstName} ${lastName}`,
                metadata: {
                    firstName: firstName,
                    lastName: lastName,
                    purpose: purpose || 'general'
                }
            })
            generalLogger.info(`Created new customer: ${customer.id} for ${email}`)
        }

        // Attach payment method to customer
        await stripe.paymentMethods.attach(paymentMethodId, {
            customer: customer.id,
        })

        // Set as default payment method
        await stripe.customers.update(customer.id, {
            invoice_settings: {
                default_payment_method: paymentMethodId,
            },
        })

        // Create product for this donation purpose
        const productName = purpose && purpose !== 'general' 
            ? `Monthly Donation - ${purpose.charAt(0).toUpperCase() + purpose.slice(1).replace('-', ' ')}`
            : 'Monthly Donation - General Fund'

        const product = await stripe.products.create({
            name: productName,
            metadata: {
                type: 'recurring_donation',
                purpose: purpose || 'general'
            }
        })

        // Create price for the product
        const price = await stripe.prices.create({
            unit_amount: amountInCents,
            currency: 'usd',
            recurring: {
                interval: 'month',
            },
            product: product.id,
            metadata: {
                donorName: `${firstName} ${lastName}`,
                purpose: purpose || 'general',
                coverFees: coverFees ? 'yes' : 'no',
                originalAmount: amount.toString()
            }
        })

        // Create subscription
        const subscription = await stripe.subscriptions.create({
            customer: customer.id,
            items: [{
                price: price.id,
            }],
            default_payment_method: paymentMethodId,
            metadata: {
                donorName: `${firstName} ${lastName}`,
                donorEmail: email,
                purpose: purpose || 'general',
                coverFees: coverFees ? 'yes' : 'no',
                originalAmount: amount.toString(),
                message: message || ''
            },
            expand: ['latest_invoice.payment_intent'],
        })

        generalLogger.info(`Recurring donation subscription created: ${subscription.id}, Amount: $${donationAmount}/month, Donor: ${firstName} ${lastName}`)
        
        res.json({
            success: true,
            subscriptionId: subscription.id,
            clientSecret: subscription.latest_invoice.payment_intent.client_secret
        })

    } catch (error) {
        generalLogger.error(`Error creating recurring donation: ${error.message}`)
        res.status(500).json({ 
            success: false, 
            message: "Unable to set up recurring donation. Please try again." 
        })
    }
}

// Confirm donation payment
async function confirmDonationPayment(req, res) {
    try {
        const { paymentIntentId } = req.body

        if (!paymentIntentId) {
            generalLogger.error("Payment intent ID is required to confirm donation")
            return res.status(400).json({ 
                success: false, 
                message: "Payment intent ID is required" 
            })
        }

        // Retrieve payment intent to get details
        const paymentIntent = await stripe.paymentIntents.retrieve(paymentIntentId)
        
        if (paymentIntent.status === 'succeeded') {
            const { metadata } = paymentIntent
            const amount = paymentIntent.amount / 100

            generalLogger.info(`Donation payment confirmed: ${paymentIntentId}, Amount: $${amount}, Donor: ${metadata.donorName}`)
            
            // Here you could add logic to:
            // - Send confirmation email
            // - Update database records
            // - Trigger webhooks
            
            res.json({
                success: true,
                message: "Donation processed successfully",
                amount: amount,
                donorName: metadata.donorName
            })
        } else {
            generalLogger.error(`Payment intent not completed: ${paymentIntentId}, Status: ${paymentIntent.status}`)
            res.status(400).json({ 
                success: false, 
                message: "Payment not completed" 
            })
        }

    } catch (error) {
        generalLogger.error(`Error confirming donation payment: ${error.message}`)
        res.status(500).json({ 
            success: false, 
            message: "Unable to confirm payment" 
        })
    }
}

// Handle Stripe webhooks
async function handleStripeWebhook(req, res) {
    generalLogger.debug("Received Stripe webhook event")
    const sig = req.headers['stripe-signature']
    const endpointSecret = process.env.STRIPE_WEBHOOK_SECRET

    let event

    try {
        generalLogger.debug("Verifying Stripe webhook signature")
        event = stripe.webhooks.constructEvent(req.body, sig, endpointSecret)
        generalLogger.info(`Webhook signature verified successfully for event type: ${event.type}`)
    } catch (err) {
        generalLogger.error(`Webhook signature verification failed: ${err.message}`)
        return res.status(400).send(`Webhook Error: ${err.message}`)
    }

    // Handle the event
    switch (event.type) {
        case 'payment_intent.succeeded':
            const paymentIntent = event.data.object
            generalLogger.info(`Donation payment succeeded via webhook: ${paymentIntent.id}`)
            // Handle successful one-time donation
            break
            
        case 'invoice.payment_succeeded':
            const invoice = event.data.object
            if (invoice.subscription) {
                generalLogger.info(`Recurring donation payment succeeded: ${invoice.subscription}`)
                // Handle successful recurring donation payment
            }
            break
            
        case 'invoice.payment_failed':
            const failedInvoice = event.data.object
            if (failedInvoice.subscription) {
                generalLogger.error(`Recurring donation payment failed: ${failedInvoice.subscription}`)
                // Handle failed recurring donation payment
                // You might want to notify the donor or retry
            }
            break
            
        case 'customer.subscription.deleted':
            const deletedSubscription = event.data.object
            generalLogger.info(`Recurring donation cancelled: ${deletedSubscription.id}`)
            // Handle subscription cancellation
            break
            
        default:
            generalLogger.info(`Unhandled event type: ${event.type}`)
    }

    res.json({ received: true })
}

// Cancel recurring donation
async function cancelRecurringDonation(req, res) {
    try {
        const { subscriptionId } = req.body

        if (!subscriptionId) {
            return res.status(400).json({ 
                success: false, 
                message: "Subscription ID is required" 
            })
        }

        const subscription = await stripe.subscriptions.cancel(subscriptionId)
        
        generalLogger.info(`Recurring donation cancelled: ${subscriptionId}`)
        
        res.json({
            success: true,
            message: "Recurring donation cancelled successfully"
        })

    } catch (error) {
        generalLogger.error(`Error cancelling recurring donation: ${error.message}`)
        res.status(500).json({ 
            success: false, 
            message: "Unable to cancel recurring donation" 
        })
    }
}

module.exports = {
    createDonationPaymentIntent,
    createRecurringDonation,
    confirmDonationPayment,
    handleStripeWebhook,
    cancelRecurringDonation
}