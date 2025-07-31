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
            purpose, 
            coverFees, 
            anonymous,
            firstName, 
            lastName, 
            email, 
            message,
            totalAmount
        } = req.body

        // Validate required fields
        if (!amount) {
            generalLogger.error("Missing amount for donation payment intent")
            return res.status(400).json({ 
                success: false, 
                message: "Donation amount is required" 
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
                donorName: anonymous ? 'Anonymous' : `${firstName || ''} ${lastName || ''}`.trim() || 'Not provided',
                donorEmail: email || 'not provided',
                purpose: purpose || 'general',
                coverFees: coverFees ? 'yes' : 'no',
                originalAmount: amount.toString(),
                message: message || '',
                anonymous: anonymous ? 'yes' : 'no'
            },
            automatic_payment_methods: {
                enabled: true,
            },
            description: anonymous ? 'Anonymous donation' : `Donation from ${firstName && lastName ? `${firstName} ${lastName}` : 'donor'}${email ? ` (${email})` : ''}`,
            receipt_email: anonymous ? undefined : email,
        })

        generalLogger.info(`Payment intent created for donation: ${paymentIntent.id}, Amount: $${donationAmount}, Donor: ${anonymous ? 'Anonymous' : (firstName && lastName ? `${firstName} ${lastName}` : 'Not provided')}`)
        
        res.json({
            success: true,
            clientSecret: paymentIntent.client_secret,
            paymentIntentId: paymentIntent.id
        })

    } catch (error) {
        generalLogger.error(`Error creating donation paymentintent: ${error.message}`)
        res.status(500).json({ 
            success: false, 
            message: "Unable to process donation. Please try again." 
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

module.exports = {
    createDonationPaymentIntent,
    confirmDonationPayment
}