const nodemailer = require('nodemailer');
const { generalLogger } = require('../generalLogger');
require('dotenv').config();

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
    });
};

// Render contact page
const getContactPage = (req, res) => {
    try {
        res.render('contact', {
            title: 'Contact Us',
            description: 'Get in touch with MAS Central Indy - we\'d love to hear from you',
            additionalCSS: ['contact.css'],
            additionalJS: ['contact.js'],
            layout: 'layout'
        });
    } catch (error) {
        generalLogger.error(`Error rendering contact page: ${error.message}`);
        res.status(500).render('error', {
            status: 500,
            message: 'Unable to load contact page',
            title: 'Server Error',
            layout: 'layout'
        });
    }
};

// Handle contact form submission
const submitContactForm = async (req, res) => {
    try {
        const { firstName, lastName, email, phone, subject, message } = req.body;
        
        // Validate required fields
        if (!firstName || !lastName || !email || !subject || !message) {
            return res.status(400).json({
                success: false,
                message: 'Please fill in all required fields'
            });
        }
        
        // Validate email format
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        if (!emailRegex.test(email)) {
            return res.status(400).json({
                success: false,
                message: 'Please enter a valid email address'
            });
        }
        
        // Sanitize inputs
        const sanitizedData = {
            firstName: firstName.trim(),
            lastName: lastName.trim(),
            email: email.trim().toLowerCase(),
            phone: phone ? phone.trim() : '',
            subject: subject.trim(),
            message: message.trim()
        };
        
        // Create transporter
        const transporter = createTransporter();
        
        // Verify transporter configuration
        await transporter.verify();
        
        // Format subject for email
        const subjectMap = {
            'general': 'General Inquiry',
            'membership': 'Membership Information',
            'events': 'Events & Programs',
            'volunteer': 'Volunteer Opportunities',
            'donations': 'Donations & Support',
            'media': 'Media & Press',
            'other': 'Other'
        };
        
        const emailSubject = `Website Contact: ${subjectMap[sanitizedData.subject] || 'General Inquiry'}`;
        
        // Email content for organization
        const organizationEmailHtml = `
            <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
                <div style="background: #0f4f9f; color: white; padding: 20px; border-radius: 8px 8px 0 0;">
                    <h2 style="margin: 0; text-align: center;">New Contact Form Submission</h2>
                </div>
                
                <div style="border: 1px solid #e5e7eb; border-top: none; padding: 30px; border-radius: 0 0 8px 8px;">
                    <div style="margin-bottom: 20px;">
                        <h3 style="color: #374151; margin-bottom: 15px;">Contact Details</h3>
                        <table style="width: 100%; border-collapse: collapse;">
                            <tr>
                                <td style="padding: 8px 0; font-weight: bold; color: #6b7280; width: 120px;">Name:</td>
                                <td style="padding: 8px 0; color: #374151;">${sanitizedData.firstName} ${sanitizedData.lastName}</td>
                            </tr>
                            <tr>
                                <td style="padding: 8px 0; font-weight: bold; color: #6b7280;">Email:</td>
                                <td style="padding: 8px 0; color: #374151;">${sanitizedData.email}</td>
                            </tr>
                            ${sanitizedData.phone ? `
                            <tr>
                                <td style="padding: 8px 0; font-weight: bold; color: #6b7280;">Phone:</td>
                                <td style="padding: 8px 0; color: #374151;">${sanitizedData.phone}</td>
                            </tr>
                            ` : ''}
                            <tr>
                                <td style="padding: 8px 0; font-weight: bold; color: #6b7280;">Subject:</td>
                                <td style="padding: 8px 0; color: #374151;">${subjectMap[sanitizedData.subject] || 'Other'}</td>
                            </tr>
                        </table>
                    </div>
                    
                    <div>
                        <h3 style="color: #374151; margin-bottom: 15px;">Message</h3>
                        <div style="background: #f9fafb; padding: 20px; border-radius: 6px; border-left: 4px solid #0f4f9f;">
                            <p style="margin: 0; line-height: 1.6; color: #374151; white-space: pre-line;">${sanitizedData.message}</p>
                        </div>
                    </div>
                    
                    <div style="margin-top: 30px; padding-top: 20px; border-top: 1px solid #e5e7eb; text-align: center;">
                        <p style="margin: 0; color: #6b7280; font-size: 14px;">
                            This message was sent from the MAS Central Indy website contact form.
                        </p>
                        <p style="margin: 5px 0 0 0; color: #6b7280; font-size: 14px;">
                            Received: ${new Date().toLocaleString('en-US', { 
                                timeZone: 'America/New_York',
                                year: 'numeric',
                                month: 'long',
                                day: 'numeric',
                                hour: '2-digit',
                                minute: '2-digit'
                            })}
                        </p>
                    </div>
                </div>
            </div>
        `;
        
        // Auto-reply email content
        const autoReplyHtml = `
            <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
                <div style="background: #0f4f9f; color: white; padding: 20px; border-radius: 8px 8px 0 0;">
                    <h2 style="margin: 0; text-align: center;">Thank You for Contacting MAS Central Indy</h2>
                </div>
                
                <div style="border: 1px solid #e5e7eb; border-top: none; padding: 30px; border-radius: 0 0 8px 8px;">
                    <p style="margin: 0 0 20px 0; color: #374151; line-height: 1.6;">
                        Dear ${sanitizedData.firstName},
                    </p>
                    
                    <p style="margin: 0 0 20px 0; color: #374151; line-height: 1.6;">
                        Thank you for reaching out to MAS Central Indy! We have received your message regarding 
                        <strong>${subjectMap[sanitizedData.subject] || 'your inquiry'}</strong> and will respond 
                        within 24 hours.
                    </p>
                    
                    <div style="background: #f9fafb; padding: 20px; border-radius: 6px; margin: 20px 0;">
                        <h3 style="margin: 0 0 15px 0; color: #374151; font-size: 16px;">Your Message Summary:</h3>
                        <p style="margin: 0; color: #6b7280; font-size: 14px; line-height: 1.5; white-space: pre-line;">${sanitizedData.message}</p>
                    </div>
                    
                    <p style="margin: 20px 0; color: #374151; line-height: 1.6;">
                        If you have any urgent questions, please don't hesitate to call us at 
                        <a href="tel:+15551234567" style="color: #0f4f9f; text-decoration: none;">(917) 957-6104</a>.
                    </p>
                    
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
        `;
        
        // Send email to organization
        const organizationMailOptions = {
            from: `"${sanitizedData.firstName} ${sanitizedData.lastName}" <${process.env.CONTACT_EMAIL}>`,
            to: process.env.CONTACT_EMAIL,
            replyTo: sanitizedData.email,
            subject: emailSubject,
            html: organizationEmailHtml
        };
        
        // Send auto-reply to user
        const autoReplyOptions = {
            from: `"MAS Central Indy" <${process.env.CONTACT_EMAIL}>`,
            to: sanitizedData.email,
            subject: 'Thank you for contacting MAS Central Indy',
            html: autoReplyHtml
        };
        
        // Send both emails
        await Promise.all([
            transporter.sendMail(organizationMailOptions),
            transporter.sendMail(autoReplyOptions)
        ]);
        
        // Log successful submission
        generalLogger.info(`Contact form submitted successfully by ${sanitizedData.email} - Subject: ${sanitizedData.subject}`);
        
        // Return success response
        res.status(200).json({
            success: true,
            message: 'Your message has been sent successfully! We\'ll get back to you soon.'
        });
        
    } catch (error) {
        generalLogger.error(`Contact form submission error: ${error.message}`);
        
        // Check if it's an email configuration error
        if (error.code === 'EAUTH' || error.responseCode === 535) {
            return res.status(500).json({
                success: false,
                message: 'Email service temporarily unavailable. Please try again later or contact us directly.'
            });
        }
        
        return res.status(500).json({
            success: false,
            message: 'There was an error sending your message. Please try again or contact us directly.'
        });
    }
};

module.exports = {
    getContactPage,
    submitContactForm
};