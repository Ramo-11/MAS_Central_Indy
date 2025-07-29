// Show/hide card form functions (defined first)
function showCardForm() {
    console.log('showCardForm called'); // Debug line
    const cardFormSection = document.getElementById('cardFormSection');
    if (cardFormSection) {
        cardFormSection.style.display = 'flex';
        cardFormSection.style.alignItems = 'center';
        cardFormSection.style.justifyContent = 'center';
        document.body.style.overflow = 'hidden';
        console.log('Form should be visible now'); // Debug line
    } else {
        console.error('cardFormSection not found');
    }
}

function hideCardForm() {
    const cardFormSection = document.getElementById('cardFormSection');
    if (cardFormSection) {
        cardFormSection.style.display = 'none';
        document.body.style.overflow = 'auto';
    }
}

// Copy email to clipboard
function copyEmail() {
    const email = 'mascentralindy@gmail.com';
    navigator.clipboard.writeText(email).then(() => {
        showMessage('Email copied to clipboard!', 'success');
    }).catch(() => {
        // Fallback for older browsers
        const textArea = document.createElement('textarea');
        textArea.value = email;
        document.body.appendChild(textArea);
        textArea.select();
        document.execCommand('copy');
        document.body.removeChild(textArea);
        showMessage('Email copied to clipboard!', 'success');
    });
}

// Donate Page JavaScript
document.addEventListener('DOMContentLoaded', function() {
    console.log('DOM loaded, initializing donate page'); // Debug line
    initializeDonationForm();
    initializeAmountButtons();
    initializeCardFormatting();
    initializeFeeCalculation();
    
    // Attach event listener to the donate button
    const showFormBtn = document.getElementById('showFormBtn');
    if (showFormBtn) {
        showFormBtn.addEventListener('click', function(e) {
            e.preventDefault();
            console.log('Donate button clicked'); // Debug line
            showCardForm();
        });
    } else {
        console.error('Show form button not found');
    }
    
    // Attach event listener to close button
    const closeBtn = document.querySelector('.close-form-btn');
    if (closeBtn) {
        closeBtn.addEventListener('click', function(e) {
            e.preventDefault();
            hideCardForm();
        });
    }
});

// Copy email to clipboard
function copyEmail() {
    const email = 'mascentralindy@gmail.com';
    navigator.clipboard.writeText(email).then(() => {
        showMessage('Email copied to clipboard!', 'success');
    }).catch(() => {
        // Fallback for older browsers
        const textArea = document.createElement('textarea');
        textArea.value = email;
        document.body.appendChild(textArea);
        textArea.select();
        document.execCommand('copy');
        document.body.removeChild(textArea);
        showMessage('Email copied to clipboard!', 'success');
    });
}

// Initialize donation form
function initializeDonationForm() {
    const form = document.getElementById('donationForm');
    
    form.addEventListener('submit', function(e) {
        e.preventDefault();
        handleFormSubmit();
    });
}

// Handle amount button selection
function initializeAmountButtons() {
    const amountButtons = document.querySelectorAll('.amount-btn');
    const customAmountInput = document.getElementById('customAmount');
    
    amountButtons.forEach(btn => {
        btn.addEventListener('click', function() {
            // Remove active class from all buttons
            amountButtons.forEach(b => b.classList.remove('active'));
            
            // Add active class to clicked button
            this.classList.add('active');
            
            const amount = this.getAttribute('data-amount');
            
            if (amount === 'custom') {
                customAmountInput.classList.add('show');
                customAmountInput.focus();
                customAmountInput.value = '';
            } else {
                customAmountInput.classList.remove('show');
                customAmountInput.value = amount;
                calculateTotal();
            }
        });
    });
    
    // Handle custom amount input
    customAmountInput.addEventListener('input', function() {
        if (this.value) {
            calculateTotal();
        }
    });
}

// Initialize card number formatting
function initializeCardFormatting() {
    const cardNumber = document.getElementById('cardNumber');
    const expiry = document.getElementById('expiry');
    const cvv = document.getElementById('cvv');
    
    // Format card number (add spaces every 4 digits)
    cardNumber.addEventListener('input', function(e) {
        let value = e.target.value.replace(/\s/g, '').replace(/[^0-9]/gi, '');
        let formattedValue = value.match(/.{1,4}/g)?.join(' ') || value;
        if (formattedValue !== e.target.value) {
            e.target.value = formattedValue;
        }
    });
    
    // Format expiry date (MM/YY)
    expiry.addEventListener('input', function(e) {
        let value = e.target.value.replace(/\D/g, '');
        if (value.length >= 2) {
            value = value.substring(0, 2) + '/' + value.substring(2, 4);
        }
        e.target.value = value;
    });
    
    // Limit CVV to 4 digits
    cvv.addEventListener('input', function(e) {
        e.target.value = e.target.value.replace(/\D/g, '').substring(0, 4);
    });
}

// Initialize fee calculation
function initializeFeeCalculation() {
    const coverFeesCheckbox = document.getElementById('coverFees');
    const feeInfo = document.getElementById('feeInfo');
    
    coverFeesCheckbox.addEventListener('change', function() {
        if (this.checked) {
            feeInfo.style.display = 'block';
            calculateTotal();
        } else {
            feeInfo.style.display = 'none';
            calculateTotal();
        }
    });
}

// Calculate total with fees
function calculateTotal() {
    const amountInput = document.getElementById('customAmount');
    const coverFeesCheckbox = document.getElementById('coverFees');
    const feeAmountSpan = document.getElementById('feeAmount');
    const totalAmountSpan = document.getElementById('totalAmount');
    
    const baseAmount = parseFloat(amountInput.value) || 0;
    
    if (baseAmount > 0) {
        const feeAmount = coverFeesCheckbox.checked ? baseAmount * 0.025 : 0;
        const totalAmount = baseAmount + feeAmount;
        
        feeAmountSpan.textContent = feeAmount.toFixed(2);
        totalAmountSpan.textContent = totalAmount.toFixed(2);
    }
}

// Handle form submission
async function handleFormSubmit() {
    const form = document.getElementById('donationForm');
    const submitBtn = document.getElementById('submitBtn');
    
    // Basic validation
    if (!validateForm()) {
        return;
    }
    
    // Show loading state
    setSubmitButtonLoading(true);
    
    try {
        // Collect form data
        const formData = new FormData(form);
        const data = {
            amount: formData.get('amount'),
            recurring: formData.get('recurring') === 'on',
            purpose: formData.get('purpose'),
            coverFees: formData.get('coverFees') === 'on',
            firstName: formData.get('firstName'),
            lastName: formData.get('lastName'),
            email: formData.get('email'),
            cardNumber: formData.get('cardNumber').replace(/\s/g, ''),
            expiry: formData.get('expiry'),
            cvv: formData.get('cvv'),
            message: formData.get('message')
        };
        
        // Calculate total amount
        const baseAmount = parseFloat(data.amount);
        const feeAmount = data.coverFees ? baseAmount * 0.025 : 0;
        data.totalAmount = baseAmount + feeAmount;
        
        console.log('Donation data to send to backend:', data);
        
        // TODO: Replace with actual API call
        // const response = await fetch('/donate', {
        //     method: 'POST',
        //     headers: {
        //         'Content-Type': 'application/json',
        //     },
        //     body: JSON.stringify(data)
        // });
        
        // Simulate API call for now
        await new Promise(resolve => setTimeout(resolve, 2000));
        
        // Show success message
        showMessage('Thank you for your donation! You will receive a confirmation email shortly.', 'success');
        
        // Reset form and hide modal
        form.reset();
        hideCardForm();
        
        // Reset amount buttons
        document.querySelectorAll('.amount-btn').forEach(btn => btn.classList.remove('active'));
        document.getElementById('customAmount').classList.remove('show');
        document.getElementById('feeInfo').style.display = 'none';
        
    } catch (error) {
        console.error('Donation error:', error);
        showMessage('Sorry, there was an error processing your donation. Please try again.', 'error');
    } finally {
        setSubmitButtonLoading(false);
    }
}

// Form validation
function validateForm() {
    const requiredFields = [
        'customAmount',
        'firstName',
        'lastName',
        'email',
        'cardNumber',
        'expiry',
        'cvv'
    ];
    
    let isValid = true;
    
    requiredFields.forEach(fieldId => {
        const field = document.getElementById(fieldId);
        if (!field.value.trim()) {
            field.style.borderColor = '#dc2626';
            isValid = false;
        } else {
            field.style.borderColor = '';
        }
    });
    
    // Validate amount
    const amount = parseFloat(document.getElementById('customAmount').value);
    if (!amount || amount < 1) {
        document.getElementById('customAmount').style.borderColor = '#dc2626';
        showMessage('Please enter a valid donation amount.', 'error');
        return false;
    }
    
    // Validate email
    const email = document.getElementById('email').value;
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
        document.getElementById('email').style.borderColor = '#dc2626';
        showMessage('Please enter a valid email address.', 'error');
        return false;
    }
    
    // Validate card number (basic check)
    const cardNumber = document.getElementById('cardNumber').value.replace(/\s/g, '');
    if (cardNumber.length < 13 || cardNumber.length > 19) {
        document.getElementById('cardNumber').style.borderColor = '#dc2626';
        showMessage('Please enter a valid card number.', 'error');
        return false;
    }
    
    // Validate expiry date
    const expiry = document.getElementById('expiry').value;
    if (!/^\d{2}\/\d{2}$/.test(expiry)) {
        document.getElementById('expiry').style.borderColor = '#dc2626';
        showMessage('Please enter a valid expiry date (MM/YY).', 'error');
        return false;
    }
    
    // Validate CVV
    const cvv = document.getElementById('cvv').value;
    if (cvv.length < 3 || cvv.length > 4) {
        document.getElementById('cvv').style.borderColor = '#dc2626';
        showMessage('Please enter a valid CVV.', 'error');
        return false;
    }
    
    if (!isValid) {
        showMessage('Please fill in all required fields.', 'error');
        return false;
    }
    
    return true;
}

// Set submit button loading state
function setSubmitButtonLoading(isLoading) {
    const submitBtn = document.getElementById('submitBtn');
    const btnText = submitBtn.querySelector('.btn-text');
    const btnLoading = submitBtn.querySelector('.btn-loading');
    
    if (isLoading) {
        btnText.style.display = 'none';
        btnLoading.style.display = 'flex';
        submitBtn.disabled = true;
    } else {
        btnText.style.display = 'inline';
        btnLoading.style.display = 'none';
        submitBtn.disabled = false;
    }
}

// Show message
function showMessage(message, type) {
    // Remove existing message
    const existingMessage = document.getElementById('formMessage');
    if (existingMessage.style.display !== 'none') {
        existingMessage.style.display = 'none';
    }
    
    // Show new message
    const messageElement = document.getElementById('formMessage');
    const messageText = messageElement.querySelector('.message-text');
    
    messageText.textContent = message;
    messageElement.className = `form-message ${type}`;
    messageElement.style.display = 'block';
    
    // Auto-hide after 5 seconds
    setTimeout(() => {
        messageElement.style.display = 'none';
    }, 5000);
}

// Close form when clicking outside
document.addEventListener('click', function(e) {
    const cardFormSection = document.getElementById('cardFormSection');
    const formContainer = document.querySelector('.form-container');
    
    if (cardFormSection.style.display === 'block' && 
        !formContainer.contains(e.target) && 
        e.target !== cardFormSection) {
        hideCardForm();
    }
});

// Close form with Escape key
document.addEventListener('keydown', function(e) {
    if (e.key === 'Escape') {
        const cardFormSection = document.getElementById('cardFormSection');
        if (cardFormSection.style.display === 'block') {
            hideCardForm();
        }
    }
});

// Clear field errors when user starts typing
document.addEventListener('DOMContentLoaded', function() {
    const formInputs = document.querySelectorAll('.form-input, .form-select, .form-textarea');
    
    formInputs.forEach(input => {
        input.addEventListener('input', function() {
            this.style.borderColor = '';
        });
    });
});