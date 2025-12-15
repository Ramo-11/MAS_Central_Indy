const Event = require('../../models/Event');
const Registration = require('../../models/Registration');
const { generalLogger } = require('../generalLogger');

// Get registration page for an event
const getRegistrationPage = async (req, res) => {
    try {
        const { slug } = req.params;

        const event = await Event.findOne({
            slug,
            status: { $ne: 'draft' },
            isPublic: true,
        }).lean();

        if (!event) {
            generalLogger.warn(`Event not found with slug: ${slug}`);
            return res.status(404).render('error', {
                status: 404,
                message: 'Event not found',
                title: 'Event Not Found',
                layout: 'layout',
            });
        }

        // Check if registration is required
        if (!event.registration || !event.registration.isRequired) {
            return res.redirect(`/events/${slug}`);
        }

        // Check if registration is open
        const now = new Date();
        let registrationStatus = 'open';
        let statusMessage = '';

        if (!event.registration.isOpen) {
            registrationStatus = 'closed';
            statusMessage = 'Registration is currently closed for this event.';
        } else if (
            event.registration.registrationDeadline &&
            now > new Date(event.registration.registrationDeadline)
        ) {
            registrationStatus = 'closed';
            statusMessage = 'The registration deadline has passed.';
        } else if (event.eventDate && now > new Date(event.eventDate)) {
            registrationStatus = 'closed';
            statusMessage = 'This event has already occurred.';
        }

        // Get current registration count
        const currentCount = await Registration.getEventRegistrationCount(event._id);
        const maxAttendees = event.registration.maxAttendees;
        let spotsRemaining = maxAttendees ? maxAttendees - currentCount : null;

        if (maxAttendees && currentCount >= maxAttendees) {
            if (event.registration.waitlistEnabled) {
                registrationStatus = 'waitlist';
                statusMessage = 'This event is full. You can join the waitlist.';
            } else {
                registrationStatus = 'full';
                statusMessage = 'This event is fully booked.';
            }
        }

        // Sort fields by order - only show fields defined in the event's registration.fields
        const fields = (event.registration.fields || []).sort((a, b) => (a.order || 0) - (b.order || 0));

        res.render('event-registration', {
            title: `Register - ${event.title}`,
            description: `Register for ${event.title}`,
            additionalCSS: ['event-registration.css'],
            additionalJS: ['event-registration.js'],
            layout: 'layout',
            event,
            fields,
            registrationStatus,
            statusMessage,
            spotsRemaining,
            isWaitlist: registrationStatus === 'waitlist',
        });
    } catch (error) {
        generalLogger.error(`Error in getRegistrationPage: ${error.message}`);
        return res.status(500).render('error', {
            status: 500,
            message: 'Unable to load registration page',
            title: 'Server Error',
            layout: 'layout',
        });
    }
};

// Submit registration
const submitRegistration = async (req, res) => {
    try {
        const { slug } = req.params;
        const formData = req.body;

        const event = await Event.findOne({
            slug,
            status: { $ne: 'draft' },
            isPublic: true,
            'registration.isRequired': true,
        });

        if (!event) {
            return res.status(404).json({
                success: false,
                message: 'Event not found or registration is not available.',
            });
        }

        // Validate registration is open
        const now = new Date();

        if (!event.registration.isOpen) {
            return res.status(400).json({
                success: false,
                message: 'Registration is currently closed for this event.',
            });
        }

        if (
            event.registration.registrationDeadline &&
            now > new Date(event.registration.registrationDeadline)
        ) {
            return res.status(400).json({
                success: false,
                message: 'The registration deadline has passed.',
            });
        }

        if (event.eventDate && now > new Date(event.eventDate)) {
            return res.status(400).json({
                success: false,
                message: 'This event has already occurred.',
            });
        }

        // Find email field - check custom fields first, then common field names
        const emailField = event.registration.fields.find((f) => f.type === 'email');
        let email = emailField ? formData[emailField.name] : null;

        // If no email found from custom field, check common field names
        if (!email) {
            email = formData.Email || formData.email || formData['E-mail'] || formData['e-mail'];
        }

        if (!email) {
            return res.status(400).json({
                success: false,
                message: 'Email is required.',
            });
        }

        // Check if already registered
        const alreadyRegistered = await Registration.isAlreadyRegistered(event._id, email);
        if (alreadyRegistered) {
            return res.status(400).json({
                success: false,
                message: 'You have already registered for this event with this email address.',
            });
        }

        // Validate required fields
        const fields = event.registration.fields || [];
        const errors = [];

        for (const field of fields) {
            const value = formData[field.name];

            if (field.required && (!value || (Array.isArray(value) && value.length === 0))) {
                errors.push(`${field.name} is required.`);
                continue;
            }

            if (value && field.validation) {
                if (field.validation.minLength && value.length < field.validation.minLength) {
                    errors.push(
                        `${field.name} must be at least ${field.validation.minLength} characters.`
                    );
                }
                if (field.validation.maxLength && value.length > field.validation.maxLength) {
                    errors.push(
                        `${field.name} must be no more than ${field.validation.maxLength} characters.`
                    );
                }
                if (field.validation.pattern) {
                    const regex = new RegExp(field.validation.pattern);
                    if (!regex.test(value)) {
                        errors.push(`${field.name} format is invalid.`);
                    }
                }
            }
        }

        if (errors.length > 0) {
            return res.status(400).json({
                success: false,
                message: errors.join(' '),
                errors,
            });
        }

        // Validate waiver acknowledgments and signature if enabled
        if (event.registration.waiver?.enabled) {
            const waiver = event.registration.waiver;

            // Check required acknowledgments
            if (waiver.acknowledgments && waiver.acknowledgments.length > 0) {
                const submittedWaiver = formData.waiver;
                if (!submittedWaiver || !submittedWaiver.acknowledgments) {
                    errors.push('Please accept all required acknowledgments.');
                } else {
                    waiver.acknowledgments.forEach((ack, index) => {
                        if (ack.required) {
                            const submitted = submittedWaiver.acknowledgments[index];
                            if (!submitted || !submitted.accepted) {
                                errors.push('Please accept all required acknowledgments.');
                            }
                        }
                    });
                }
            }

            // Check required signature
            if (waiver.signature?.required) {
                const submittedSig = formData.waiver?.signature;
                if (!submittedSig || !submittedSig.value) {
                    errors.push('Please provide your signature.');
                }
            }

            if (errors.length > 0) {
                return res.status(400).json({
                    success: false,
                    message: errors.join(' '),
                    errors,
                });
            }
        }

        // Check capacity
        const currentCount = await Registration.getEventRegistrationCount(event._id);
        const maxAttendees = event.registration.maxAttendees;
        let isWaitlisted = false;

        if (maxAttendees && currentCount >= maxAttendees) {
            if (event.registration.waitlistEnabled) {
                isWaitlisted = true;
            } else {
                return res.status(400).json({
                    success: false,
                    message: 'This event is fully booked.',
                });
            }
        }

        // Process waiver data if present
        let waiverData = null;
        if (formData.waiver && event.registration.waiver?.enabled) {
            waiverData = {
                acknowledged: true,
                acknowledgments: formData.waiver.acknowledgments || [],
                signature: formData.waiver.signature
                    ? {
                          type: formData.waiver.signature.type,
                          value: formData.waiver.signature.value,
                          signedAt: new Date(formData.waiver.signature.signedAt),
                          ipAddress: req.ip,
                      }
                    : null,
            };
        }

        // Create registration
        const registration = new Registration({
            event: event._id,
            email: email.toLowerCase(),
            registrationData: new Map(Object.entries(formData)),
            status: isWaitlisted ? 'waitlisted' : 'confirmed',
            isWaitlisted,
            waiver: waiverData,
            metadata: {
                userAgent: req.get('User-Agent'),
                ipAddress: req.ip,
                referrer: req.get('Referer'),
            },
        });

        await registration.save();

        // Update event attendee count
        if (!isWaitlisted) {
            await Event.findByIdAndUpdate(event._id, {
                $inc: { 'registration.currentAttendees': 1 },
            });
        }

        generalLogger.info(
            `New registration for event ${event.title}: ${email} (${
                isWaitlisted ? 'waitlisted' : 'confirmed'
            })`
        );

        const confirmationMessage = isWaitlisted
            ? 'You have been added to the waitlist. We will contact you if a spot becomes available.'
            : event.registration.confirmationMessage ||
              'Thank you for registering! You will receive a confirmation email shortly.';

        return res.status(201).json({
            success: true,
            message: confirmationMessage,
            confirmationNumber: registration.confirmationNumber,
            isWaitlisted,
        });
    } catch (error) {
        generalLogger.error(`Error in submitRegistration: ${error.message}`);

        if (error.code === 11000) {
            return res.status(400).json({
                success: false,
                message: 'You have already registered for this event with this email address.',
            });
        }

        return res.status(500).json({
            success: false,
            message: 'Unable to process registration. Please try again.',
        });
    }
};

// Get registration status for an event (API)
const getRegistrationStatus = async (req, res) => {
    try {
        const { eventId } = req.params;

        const event = await Event.findById(eventId).select('registration title').lean();

        if (!event) {
            return res.status(404).json({
                success: false,
                message: 'Event not found',
            });
        }

        const currentCount = await Registration.getEventRegistrationCount(eventId);
        const waitlistCount = await Registration.getWaitlistCount(eventId);
        const maxAttendees = event.registration?.maxAttendees;

        return res.status(200).json({
            success: true,
            registrationRequired: event.registration?.isRequired || false,
            isOpen: event.registration?.isOpen || false,
            currentAttendees: currentCount,
            maxAttendees: maxAttendees || null,
            spotsRemaining: maxAttendees ? Math.max(0, maxAttendees - currentCount) : null,
            waitlistEnabled: event.registration?.waitlistEnabled || false,
            waitlistCount,
            isFull: maxAttendees ? currentCount >= maxAttendees : false,
        });
    } catch (error) {
        generalLogger.error(`Error in getRegistrationStatus: ${error.message}`);
        return res.status(500).json({
            success: false,
            message: 'Unable to get registration status',
        });
    }
};

module.exports = {
    getRegistrationPage,
    submitRegistration,
    getRegistrationStatus,
};
