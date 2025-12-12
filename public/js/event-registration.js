// Event Registration Page JavaScript

class RegistrationManager {
    constructor() {
        this.form = document.getElementById('registrationForm');
        this.submitBtn = document.getElementById('submitBtn');
        this.successModal = document.getElementById('successModal');
        this.isSubmitting = false;

        if (this.form) {
            this.init();
        }
    }

    init() {
        this.bindEvents();
        this.initializePhoneFormatting();
        this.initializeWaiver();
    }

    bindEvents() {
        // Form submission
        this.form.addEventListener('submit', (e) => this.handleSubmit(e));

        // Real-time validation
        this.form.querySelectorAll('input, textarea, select').forEach(field => {
            field.addEventListener('blur', () => this.validateField(field));
            field.addEventListener('input', () => this.clearFieldError(field));
        });

        // Checkbox group validation
        this.form.querySelectorAll('.checkbox-group').forEach(group => {
            group.querySelectorAll('input[type="checkbox"]').forEach(checkbox => {
                checkbox.addEventListener('change', () => this.validateCheckboxGroup(group));
            });
        });

        // Close success modal
        const modalOverlay = document.querySelector('.success-modal-overlay');
        if (modalOverlay) {
            modalOverlay.addEventListener('click', () => this.closeSuccessModal());
        }

        // Keyboard escape to close modal
        document.addEventListener('keydown', (e) => {
            if (e.key === 'Escape' && this.successModal?.classList.contains('active')) {
                this.closeSuccessModal();
            }
        });
    }

    initializePhoneFormatting() {
        this.form.querySelectorAll('input[type="tel"]').forEach(phoneInput => {
            phoneInput.addEventListener('input', (e) => {
                let value = e.target.value.replace(/\D/g, '');

                if (value.length > 0) {
                    if (value.length <= 3) {
                        value = `(${value}`;
                    } else if (value.length <= 6) {
                        value = `(${value.slice(0, 3)}) ${value.slice(3)}`;
                    } else {
                        value = `(${value.slice(0, 3)}) ${value.slice(3, 6)}-${value.slice(6, 10)}`;
                    }
                }

                e.target.value = value;
            });
        });
    }

    initializeWaiver() {
        // Signature type toggle
        const sigTypeBtns = this.form.querySelectorAll('.sig-type-btn');
        sigTypeBtns.forEach(btn => {
            btn.addEventListener('click', () => this.switchSignatureType(btn.dataset.type));
        });

        // Typed signature preview
        const typedInput = this.form.querySelector('#signatureTyped');
        if (typedInput) {
            const preview = this.form.querySelector('.signature-preview');
            typedInput.addEventListener('input', () => {
                if (preview) {
                    preview.textContent = typedInput.value;
                }
            });
        }

        // Initialize signature canvas
        this.initializeSignatureCanvas();
    }

    initializeSignatureCanvas() {
        const canvas = document.getElementById('signatureCanvas');
        if (!canvas) return;

        const ctx = canvas.getContext('2d');
        let isDrawing = false;
        let lastX = 0;
        let lastY = 0;

        // Set canvas size to match display size
        const resizeCanvas = () => {
            const rect = canvas.getBoundingClientRect();
            canvas.width = rect.width;
            canvas.height = rect.height;
            ctx.strokeStyle = '#1e3a5f';
            ctx.lineWidth = 2;
            ctx.lineCap = 'round';
            ctx.lineJoin = 'round';
        };

        resizeCanvas();
        window.addEventListener('resize', resizeCanvas);

        const getCoords = (e) => {
            const rect = canvas.getBoundingClientRect();
            if (e.touches) {
                return {
                    x: e.touches[0].clientX - rect.left,
                    y: e.touches[0].clientY - rect.top
                };
            }
            return {
                x: e.clientX - rect.left,
                y: e.clientY - rect.top
            };
        };

        const startDrawing = (e) => {
            isDrawing = true;
            const coords = getCoords(e);
            lastX = coords.x;
            lastY = coords.y;
        };

        const draw = (e) => {
            if (!isDrawing) return;
            e.preventDefault();

            const coords = getCoords(e);
            ctx.beginPath();
            ctx.moveTo(lastX, lastY);
            ctx.lineTo(coords.x, coords.y);
            ctx.stroke();
            lastX = coords.x;
            lastY = coords.y;

            // Save signature data
            this.updateSignatureData();
        };

        const stopDrawing = () => {
            isDrawing = false;
        };

        // Mouse events
        canvas.addEventListener('mousedown', startDrawing);
        canvas.addEventListener('mousemove', draw);
        canvas.addEventListener('mouseup', stopDrawing);
        canvas.addEventListener('mouseout', stopDrawing);

        // Touch events
        canvas.addEventListener('touchstart', startDrawing);
        canvas.addEventListener('touchmove', draw);
        canvas.addEventListener('touchend', stopDrawing);

        // Clear button
        const clearBtn = document.getElementById('clearSignature');
        if (clearBtn) {
            clearBtn.addEventListener('click', () => {
                ctx.clearRect(0, 0, canvas.width, canvas.height);
                const signatureData = document.getElementById('signatureData');
                if (signatureData) signatureData.value = '';
            });
        }

        // Store canvas reference for later
        this.signatureCanvas = canvas;
        this.signatureCtx = ctx;
    }

    updateSignatureData() {
        const canvas = this.signatureCanvas;
        const signatureData = document.getElementById('signatureData');
        if (canvas && signatureData) {
            signatureData.value = canvas.toDataURL('image/png');
        }
    }

    switchSignatureType(type) {
        // Update toggle buttons
        this.form.querySelectorAll('.sig-type-btn').forEach(btn => {
            btn.classList.toggle('active', btn.dataset.type === type);
        });

        // Show/hide appropriate input
        const typeInput = this.form.querySelector('.signature-type-input');
        const drawInput = this.form.querySelector('.signature-draw-input');

        if (typeInput) typeInput.classList.toggle('active', type === 'type');
        if (drawInput) drawInput.classList.toggle('active', type === 'draw');

        // Update hidden field
        const signatureTypeField = document.getElementById('signatureType');
        if (signatureTypeField) signatureTypeField.value = type;

        // Clear signature error
        const sigError = this.form.querySelector('.signature-error');
        if (sigError) sigError.style.display = 'none';

        // Re-initialize canvas when switching to draw mode (canvas needs to be visible for proper sizing)
        if (type === 'draw') {
            setTimeout(() => this.resizeSignatureCanvas(), 50);
        }
    }

    resizeSignatureCanvas() {
        const canvas = this.signatureCanvas;
        if (!canvas) return;

        const ctx = canvas.getContext('2d');
        const rect = canvas.getBoundingClientRect();

        // Only resize if canvas is visible and has dimensions
        if (rect.width > 0 && rect.height > 0) {
            canvas.width = rect.width;
            canvas.height = rect.height;
            ctx.strokeStyle = '#1e3a5f';
            ctx.lineWidth = 2;
            ctx.lineCap = 'round';
            ctx.lineJoin = 'round';
        }
    }

    async handleSubmit(e) {
        e.preventDefault();

        if (this.isSubmitting) return;

        // Validate all fields
        if (!this.validateForm()) {
            this.scrollToFirstError();
            return;
        }

        this.setSubmitting(true);

        try {
            const formData = this.getFormData();
            const slug = this.form.dataset.eventSlug;

            const response = await fetch(`/events/${slug}/register`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify(formData),
            });

            const result = await response.json();

            if (result.success) {
                this.showSuccessModal(result);
            } else {
                this.showError(result.message || 'Registration failed. Please try again.');

                // Show field-specific errors if provided
                if (result.errors && Array.isArray(result.errors)) {
                    result.errors.forEach(error => {
                        this.showNotification(error, 'error');
                    });
                }
            }
        } catch (error) {
            console.error('Registration error:', error);
            this.showError('An error occurred. Please try again.');
        } finally {
            this.setSubmitting(false);
        }
    }

    getFormData() {
        const formData = {};
        const formElements = this.form.elements;

        for (let i = 0; i < formElements.length; i++) {
            const element = formElements[i];
            const name = element.name;

            if (!name || element.type === 'submit') continue;

            if (element.type === 'checkbox') {
                if (element.checked) {
                    if (formData[name]) {
                        if (Array.isArray(formData[name])) {
                            formData[name].push(element.value);
                        } else {
                            formData[name] = [formData[name], element.value];
                        }
                    } else {
                        formData[name] = element.value;
                    }
                }
            } else if (element.type === 'radio') {
                if (element.checked) {
                    formData[name] = element.value;
                }
            } else {
                formData[name] = element.value;
            }
        }

        // Add waiver data
        const waiverData = this.getWaiverData();
        if (waiverData) {
            formData.waiver = waiverData;
        }

        return formData;
    }

    getWaiverData() {
        const waiverSection = this.form.querySelector('.waiver-section');
        if (!waiverSection) return null;

        const waiver = {
            acknowledged: true,
            acknowledgments: [],
            signature: null
        };

        // Collect acknowledgments
        const acknowledgmentCheckboxes = waiverSection.querySelectorAll('.acknowledgment-item input[type="checkbox"]');
        acknowledgmentCheckboxes.forEach(checkbox => {
            waiver.acknowledgments.push({
                text: checkbox.value,
                accepted: checkbox.checked,
                acceptedAt: checkbox.checked ? new Date().toISOString() : null
            });
        });

        // Collect signature
        const signatureSection = this.form.querySelector('.signature-section');
        if (signatureSection) {
            const signatureType = document.getElementById('signatureType')?.value || 'type';

            if (signatureType === 'type') {
                const typedValue = document.getElementById('signatureTyped')?.value || '';
                waiver.signature = {
                    type: 'type',
                    value: typedValue,
                    signedAt: new Date().toISOString()
                };
            } else if (signatureType === 'draw') {
                const drawValue = document.getElementById('signatureData')?.value || '';
                waiver.signature = {
                    type: 'draw',
                    value: drawValue,
                    signedAt: new Date().toISOString()
                };
            }
        }

        return waiver;
    }

    validateForm() {
        let isValid = true;
        const elements = this.form.elements;

        for (let i = 0; i < elements.length; i++) {
            const element = elements[i];
            if (!this.validateField(element)) {
                isValid = false;
            }
        }

        // Validate checkbox groups
        this.form.querySelectorAll('.checkbox-group').forEach(group => {
            if (!this.validateCheckboxGroup(group)) {
                isValid = false;
            }
        });

        // Validate waiver acknowledgments
        if (!this.validateWaiverAcknowledgments()) {
            isValid = false;
        }

        // Validate signature
        if (!this.validateSignature()) {
            isValid = false;
        }

        return isValid;
    }

    validateWaiverAcknowledgments() {
        const waiverSection = this.form.querySelector('.waiver-section');
        if (!waiverSection) return true;

        let isValid = true;
        const acknowledgments = waiverSection.querySelectorAll('.acknowledgment-item input[type="checkbox"]');

        acknowledgments.forEach(checkbox => {
            if (checkbox.dataset.required === 'true' && !checkbox.checked) {
                isValid = false;
                const item = checkbox.closest('.acknowledgment-item');
                if (item) {
                    item.classList.add('error');
                }
            } else {
                const item = checkbox.closest('.acknowledgment-item');
                if (item) {
                    item.classList.remove('error');
                }
            }
        });

        return isValid;
    }

    validateSignature() {
        const signatureSection = this.form.querySelector('.signature-section');
        if (!signatureSection) return true;

        const signatureType = document.getElementById('signatureType')?.value || 'type';
        const sigError = this.form.querySelector('.signature-error');
        let isValid = true;

        if (signatureType === 'type') {
            const typedInput = document.getElementById('signatureTyped');
            if (typedInput && !typedInput.value.trim()) {
                isValid = false;
                if (sigError) {
                    sigError.textContent = 'Please type your full legal name to sign.';
                    sigError.style.display = 'block';
                }
            }
        } else if (signatureType === 'draw') {
            const signatureData = document.getElementById('signatureData');
            if (!signatureData || !signatureData.value) {
                isValid = false;
                if (sigError) {
                    sigError.textContent = 'Please draw your signature.';
                    sigError.style.display = 'block';
                }
            }
        }

        if (isValid && sigError) {
            sigError.style.display = 'none';
        }

        return isValid;
    }

    validateField(field) {
        if (!field.name || field.type === 'submit') return true;

        const formGroup = field.closest('.form-group');
        if (!formGroup) return true;

        let isValid = true;
        let errorMessage = '';

        // Required validation
        if (field.required) {
            if (field.type === 'checkbox' && !field.checked) {
                isValid = false;
                errorMessage = 'This field is required.';
            } else if (field.type === 'radio') {
                const radioGroup = this.form.querySelectorAll(`input[name="${field.name}"]`);
                const anyChecked = Array.from(radioGroup).some(r => r.checked);
                if (!anyChecked) {
                    isValid = false;
                    errorMessage = 'Please select an option.';
                }
            } else if (!field.value.trim()) {
                isValid = false;
                errorMessage = 'This field is required.';
            }
        }

        // Type-specific validation
        if (isValid && field.value) {
            switch (field.type) {
                case 'email':
                    if (!this.isValidEmail(field.value)) {
                        isValid = false;
                        errorMessage = 'Please enter a valid email address.';
                    }
                    break;

                case 'tel':
                    if (!this.isValidPhone(field.value)) {
                        isValid = false;
                        errorMessage = 'Please enter a valid phone number.';
                    }
                    break;

                case 'number':
                    const min = field.min ? parseFloat(field.min) : null;
                    const max = field.max ? parseFloat(field.max) : null;
                    const value = parseFloat(field.value);

                    if (min !== null && value < min) {
                        isValid = false;
                        errorMessage = `Value must be at least ${min}.`;
                    } else if (max !== null && value > max) {
                        isValid = false;
                        errorMessage = `Value must be no more than ${max}.`;
                    }
                    break;
            }

            // Length validation (check > 0 because HTML elements return -1 when not set)
            if (isValid && field.minLength > 0 && field.value.length < field.minLength) {
                isValid = false;
                errorMessage = `Must be at least ${field.minLength} characters.`;
            }

            if (isValid && field.maxLength > 0 && field.value.length > field.maxLength) {
                isValid = false;
                errorMessage = `Must be no more than ${field.maxLength} characters.`;
            }

            // Pattern validation
            if (isValid && field.pattern) {
                const regex = new RegExp(field.pattern);
                if (!regex.test(field.value)) {
                    isValid = false;
                    errorMessage = 'Please enter a valid format.';
                }
            }
        }

        // Show/hide error
        this.setFieldError(formGroup, isValid, errorMessage);

        return isValid;
    }

    validateCheckboxGroup(group) {
        const formGroup = group.closest('.form-group');
        const checkboxes = group.querySelectorAll('input[type="checkbox"]');
        const label = formGroup?.querySelector('.form-label');
        const isRequired = label?.querySelector('.required');

        if (!isRequired) return true;

        const anyChecked = Array.from(checkboxes).some(cb => cb.checked);

        if (!anyChecked) {
            this.setFieldError(formGroup, false, 'Please select at least one option.');
            return false;
        }

        this.setFieldError(formGroup, true, '');
        return true;
    }

    setFieldError(formGroup, isValid, message) {
        const input = formGroup.querySelector('input, textarea, select');
        const errorElement = formGroup.querySelector('.form-error');

        if (isValid) {
            input?.classList.remove('error');
            if (errorElement) {
                errorElement.style.display = 'none';
                errorElement.textContent = '';
            }
        } else {
            input?.classList.add('error');
            if (errorElement) {
                errorElement.style.display = 'block';
                errorElement.textContent = message;
            }
        }
    }

    clearFieldError(field) {
        const formGroup = field.closest('.form-group');
        if (formGroup) {
            field.classList.remove('error');
            const errorElement = formGroup.querySelector('.form-error');
            if (errorElement) {
                errorElement.style.display = 'none';
            }
        }
    }

    scrollToFirstError() {
        const firstError = this.form.querySelector('.form-group .error, .form-error[style*="block"]');
        if (firstError) {
            const formGroup = firstError.closest('.form-group');
            formGroup?.scrollIntoView({ behavior: 'smooth', block: 'center' });
        }
    }

    isValidEmail(email) {
        const re = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        return re.test(email);
    }

    isValidPhone(phone) {
        const digits = phone.replace(/\D/g, '');
        return digits.length >= 10;
    }

    setSubmitting(submitting) {
        this.isSubmitting = submitting;

        const btnText = this.submitBtn.querySelector('.btn-text');
        const btnLoading = this.submitBtn.querySelector('.btn-loading');

        if (submitting) {
            this.submitBtn.disabled = true;
            btnText.style.display = 'none';
            btnLoading.style.display = 'flex';
        } else {
            this.submitBtn.disabled = false;
            btnText.style.display = 'flex';
            btnLoading.style.display = 'none';
        }
    }

    showSuccessModal(result) {
        const titleEl = document.getElementById('successTitle');
        const messageEl = document.getElementById('successMessage');
        const confirmationEl = document.getElementById('confirmationNumber');

        if (result.isWaitlisted) {
            titleEl.textContent = 'Added to Waitlist';
        } else {
            titleEl.textContent = 'Registration Successful!';
        }

        messageEl.textContent = result.message;
        confirmationEl.textContent = result.confirmationNumber;

        this.successModal.classList.add('active');
        document.body.style.overflow = 'hidden';
    }

    closeSuccessModal() {
        this.successModal.classList.remove('active');
        document.body.style.overflow = '';
    }

    showError(message) {
        this.showNotification(message, 'error');
    }

    showNotification(message, type = 'info') {
        const notification = document.createElement('div');
        notification.className = `notification notification-${type}`;
        notification.style.cssText = `
            position: fixed;
            top: 20px;
            right: 20px;
            background: ${type === 'success' ? '#10b981' : type === 'error' ? '#ef4444' : '#3b82f6'};
            color: white;
            padding: 16px 24px;
            border-radius: 8px;
            box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
            z-index: 10000;
            font-weight: 500;
            max-width: 400px;
            transform: translateX(120%);
            transition: transform 0.3s ease;
        `;
        notification.textContent = message;

        document.body.appendChild(notification);

        // Animate in
        setTimeout(() => {
            notification.style.transform = 'translateX(0)';
        }, 100);

        // Remove after delay
        setTimeout(() => {
            notification.style.transform = 'translateX(120%)';
            setTimeout(() => {
                if (notification.parentNode) {
                    notification.parentNode.removeChild(notification);
                }
            }, 300);
        }, 5000);
    }
}

// Initialize when DOM is loaded
document.addEventListener('DOMContentLoaded', () => {
    window.registrationManager = new RegistrationManager();
});
