require('dotenv').config()

// Set up Stripe key based on environment
if (process.env.NODE_ENV !== "production") {
    process.env.STRIPE_SECRET_KEY = process.env.STRIPE_SECRET_KEY_TEST
} else {
    process.env.STRIPE_SECRET_KEY = process.env.STRIPE_SECRET_KEY_PROD
}

const stripe = require('stripe')(process.env.STRIPE_SECRET_KEY)
const { generalLogger } = require('../generalLogger')

// ADD THESE IMPORTS AND EMAIL SETUP
const nodemailer = require('nodemailer')

// Create transporter for sending emails
const createTransporter = () => {
    return nodemailer.createTransport({
        service: 'gmail',
        auth: {
            user: process.env.CONTACT_EMAIL,
            pass: process.env.CONTACT_EMAIL_PASSWORD
        },
        tls: {
            rejectUnauthorized: false
        }
    })
}

// ADD THIS HELPER FUNCTION
const sendDonationEmails = async (donationData, paymentIntent) => {
    try {
        const transporter = createTransporter()
        await transporter.verify()

        const {
            donorName,
            donorEmail,
            purpose,
            coverFees,
            originalAmount,
            message,
            anonymous
        } = paymentIntent.metadata

        const amount = paymentIntent.amount / 100
        const donationDate = new Date().toLocaleString('en-US', {
            timeZone: 'America/New_York',
            year: 'numeric',
            month: 'long',
            day: 'numeric',
            hour: '2-digit',
            minute: '2-digit'
        })

        // Email to organization
        const organizationEmailHtml = `
            <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
                <div style="background: #0f4f9f; color: white; padding: 20px; border-radius: 8px 8px 0 0;">
                    <h2 style="margin: 0; text-align: center;">New Donation Received! 🎉</h2>
                </div>
                
                <div style="border: 1px solid #e5e7eb; border-top: none; padding: 30px; border-radius: 0 0 8px 8px;">
                    <div style="text-align: center; margin-bottom: 30px;">
                        <div style="background: #10b981; color: white; display: inline-block; padding: 15px 30px; border-radius: 8px; font-size: 18px; font-weight: bold;">
                            $${amount.toFixed(2)}
                        </div>
                    </div>
                    
                    <div style="margin-bottom: 25px;">
                        <h3 style="color: #374151; margin-bottom: 15px;">Donation Details</h3>
                        <table style="width: 100%; border-collapse: collapse;">
                            <tr>
                                <td style="padding: 8px 0; font-weight: bold; color: #6b7280; width: 140px;">Donor:</td>
                                <td style="padding: 8px 0; color: #374151;">${donorName}</td>
                            </tr>
                            <tr>
                                <td style="padding: 8px 0; font-weight: bold; color: #6b7280;">Email:</td>
                                <td style="padding: 8px 0; color: #374151;">${donorEmail}</td>
                            </tr>
                            <tr>
                                <td style="padding: 8px 0; font-weight: bold; color: #6b7280;">Amount:</td>
                                <td style="padding: 8px 0; color: #374151;">$${amount.toFixed(2)}</td>
                            </tr>
                            <tr>
                                <td style="padding: 8px 0; font-weight: bold; color: #6b7280;">Original Amount:</td>
                                <td style="padding: 8px 0; color: #374151;">$${parseFloat(originalAmount).toFixed(2)}</td>
                            </tr>
                            <tr>
                                <td style="padding: 8px 0; font-weight: bold; color: #6b7280;">Processing Fees:</td>
                                <td style="padding: 8px 0; color: #374151;">${coverFees === 'yes' ? 'Covered by donor' : 'Not covered'}</td>
                            </tr>
                            <tr>
                                <td style="padding: 8px 0; font-weight: bold; color: #6b7280;">Purpose:</td>
                                <td style="padding: 8px 0; color: #374151;">${getPurposeDisplay(purpose)}</td>
                            </tr>
                            <tr>
                                <td style="padding: 8px 0; font-weight: bold; color: #6b7280;">Anonymous:</td>
                                <td style="padding: 8px 0; color: #374151;">${anonymous === 'yes' ? 'Yes' : 'No'}</td>
                            </tr>
                            <tr>
                                <td style="padding: 8px 0; font-weight: bold; color: #6b7280;">Payment ID:</td>
                                <td style="padding: 8px 0; color: #374151; font-family: monospace; font-size: 12px;">${paymentIntent.id}</td>
                            </tr>
                        </table>
                    </div>
                    
                    ${message ? `
                    <div style="margin-bottom: 25px;">
                        <h3 style="color: #374151; margin-bottom: 15px;">Donor Message</h3>
                        <div style="background: #f9fafb; padding: 20px; border-radius: 6px; border-left: 4px solid #0f4f9f;">
                            <p style="margin: 0; line-height: 1.6; color: #374151; white-space: pre-line;">${message}</p>
                        </div>
                    </div>
                    ` : ''}
                    
                    <div style="margin-top: 30px; padding-top: 20px; border-top: 1px solid #e5e7eb; text-align: center;">
                        <p style="margin: 0; color: #6b7280; font-size: 14px;">
                            Donation received through the MAS Central Indy website.
                        </p>
                        <p style="margin: 5px 0 0 0; color: #6b7280; font-size: 14px;">
                            Received: ${donationDate}
                        </p>
                    </div>
                </div>
            </div>
        `

        // Send notification to organization
        const organizationMailOptions = {
            from: `"MAS Central Indy Website" <${process.env.CONTACT_EMAIL}>`,
            to: process.env.CONTACT_EMAIL,
            subject: `New Donation: $${amount.toFixed(2)} from ${donorName}`,
            html: organizationEmailHtml
        }

        await transporter.sendMail(organizationMailOptions)
        generalLogger.info(`Donation notification email sent to organization for payment ${paymentIntent.id}`)

        // Send confirmation email to donor (only if email provided and not anonymous)
        if (donorEmail && donorEmail !== 'not provided' && anonymous !== 'yes') {
            const donorEmailHtml = `
                <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
                    <div style="background: #0f4f9f; color: white; padding: 20px; border-radius: 8px 8px 0 0;">
                        <h2 style="margin: 0; text-align: center;">Thank You for Your Donation! 🙏</h2>
                    </div>
                    
                    <div style="border: 1px solid #e5e7eb; border-top: none; padding: 30px; border-radius: 0 0 8px 8px;">
                        <p style="margin: 0 0 20px 0; color: #374151; line-height: 1.6;">
                            Dear ${donorName.replace('Anonymous', 'Valued Supporter')},
                        </p>
                        
                        <p style="margin: 0 0 25px 0; color: #374151; line-height: 1.6;">
                            Thank you so much for your generous donation to MAS Central Indy! Your support means the world to us and helps us continue serving our community.
                        </p>
                        
                        <div style="background: #f0f9ff; border: 2px solid #0ea5e9; padding: 20px; border-radius: 8px; margin: 25px 0;">
                            <h3 style="margin: 0 0 15px 0; color: #0369a1; text-align: center;">Donation Receipt</h3>
                            <table style="width: 100%; border-collapse: collapse;">
                                <tr>
                                    <td style="padding: 5px 0; font-weight: bold; color: #374151;">Donation Amount:</td>
                                    <td style="padding: 5px 0; color: #374151; text-align: right; font-weight: bold;">$${amount.toFixed(2)}</td>
                                </tr>
                                <tr>
                                    <td style="padding: 5px 0; color: #6b7280;">Date:</td>
                                    <td style="padding: 5px 0; color: #6b7280; text-align: right;">${donationDate}</td>
                                </tr>
                                <tr>
                                    <td style="padding: 5px 0; color: #6b7280;">Purpose:</td>
                                    <td style="padding: 5px 0; color: #6b7280; text-align: right;">${getPurposeDisplay(purpose)}</td>
                                </tr>
                                <tr>
                                    <td style="padding: 5px 0; color: #6b7280;">Transaction ID:</td>
                                    <td style="padding: 5px 0; color: #6b7280; text-align: right; font-family: monospace; font-size: 12px;">${paymentIntent.id}</td>
                                </tr>
                            </table>
                        </div>
                        
                        ${message ? `
                        <div style="background: #fef3c7; padding: 15px; border-radius: 6px; margin: 20px 0;">
                            <p style="margin: 0; color: #92400e; font-style: italic;">
                                Your message: "${message}"
                            </p>
                        </div>
                        ` : ''}
                        
                        <p style="margin: 20px 0; color: #374151; line-height: 1.6;">
                            Your donation will be put to good use supporting our mission and programs. We are truly grateful for supporters like you who make our work possible.
                        </p>
                        
                        <div style="background: #f9fafb; padding: 15px; border-radius: 6px; margin: 20px 0;">
                            <p style="margin: 0; color: #6b7280; font-size: 14px; text-align: center;">
                                <strong>Tax Information:</strong> Please keep this email as your donation receipt. 
                                MAS Central Indy is a 501(c)(3) organization. Your donation may be tax-deductible.
                            </p>
                        </div>
                        
                        <div style="margin-top: 30px; padding-top: 20px; border-top: 1px solid #e5e7eb;">
                            <p style="margin: 0 0 10px 0; color: #374151; font-weight: bold;">
                                MAS Central Indy
                            </p>
                            <p style="margin: 0 0 5px 0; color: #6b7280; font-size: 14px;">
                                📧 mascentralindy@gmail.com
                            </p>
                            <p style="margin: 0 0 5px 0; color: #6b7280; font-size: 14px;">
                                📞 (917) 957-6104
                            </p>
                            <p style="margin: 0; color: #6b7280; font-size: 14px;">
                                📍 123 Community Drive, Indianapolis, IN 46240
                            </p>
                        </div>
                    </div>
                </div>
            `

            const donorMailOptions = {
                from: `"MAS Central Indy" <${process.env.CONTACT_EMAIL}>`,
                to: donorEmail,
                subject: 'Thank you for your donation to MAS Central Indy',
                html: donorEmailHtml
            }

            await transporter.sendMail(donorMailOptions)
            generalLogger.info(`Donation confirmation email sent to donor ${donorEmail} for payment ${paymentIntent.id}`)
        }

    } catch (error) {
        generalLogger.error(`Error sending donation emails: ${error.message}`)
        // Don't throw error - donation was successful even if email fails
    }
}

// ADD THIS HELPER FUNCTION
const getPurposeDisplay = (purpose) => {
    const purposeMap = {
        'general': 'General Fund',
        'education': 'Education Programs',
        'social-services': 'Social Services',
        'youth': 'Youth Programs',
        'events': 'Community Events',
        'facility': 'Facility Maintenance',
        'emergency': 'Emergency Relief',
        'other': 'Other'
    }
    return purposeMap[purpose] || 'General Fund'
}

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
            
            // SEND DONATION EMAILS
            await sendDonationEmails(req.body, paymentIntent)
            
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