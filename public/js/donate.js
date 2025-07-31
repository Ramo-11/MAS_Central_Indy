const stripe = Stripe(window.STRIPE_CONFIG.publicKey);
let elements;
let cardElement;

// Show/hide card form functions (defined first)
function showCardForm() {
    const cardFormSection = document.getElementById('cardFormSection');
    if (cardFormSection) {
        cardFormSection.style.display = 'flex';
        cardFormSection.style.alignItems = 'center';
        cardFormSection.style.justifyContent = 'center';
        document.body.style.overflow = 'hidden';
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
    initializeStripeElements();
    initializeDonationForm();
    initializeAmountButtons();
    initializeFeeCalculation();
    initializeAnonymousToggle();
    
    // Attach event listener to the donate button
    const showFormBtn = document.getElementById('showFormBtn');
    if (showFormBtn) {
        showFormBtn.addEventListener('click', function(e) {
            e.preventDefault();
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

async function initializeStripeElements() {
  // Create Elements instance
  elements = stripe.elements();
  
  // Create card element
  cardElement = elements.create('card', {
    style: {
      base: {
        fontSize: '16px',
        color: '#424770',
        '::placeholder': {
          color: '#aab7c4',
        },
      },
      invalid: {
        color: '#9e2146',
      },
    },
  });

  cardElement.mount('#card-element');
    cardElement.on('change', ({error}) => {
    const displayError = document.getElementById('card-errors');
    if (error) {
        displayError.textContent = error.message;
    } else {
        displayError.textContent = '';
    }
    });
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

// Initialize anonymous donation toggle
function initializeAnonymousToggle() {
    const anonymousCheckbox = document.getElementById('anonymous');
    const firstNameGroup = document.getElementById('firstName').closest('.form-group');
    const lastNameGroup = document.getElementById('lastName').closest('.form-group');
    const emailGroup = document.getElementById('email').closest('.form-group');
    
    anonymousCheckbox.addEventListener('change', function() {
        if (this.checked) {
            firstNameGroup.style.display = 'none';
            lastNameGroup.style.display = 'none';
            emailGroup.style.display = 'none';
        } else {
            firstNameGroup.style.display = 'block';
            lastNameGroup.style.display = 'block';
            emailGroup.style.display = 'block';
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
        const feeAmount = coverFeesCheckbox.checked ? (baseAmount * 0.029) + 0.3 : 0;
        const totalAmount = baseAmount + feeAmount;
        
        feeAmountSpan.textContent = feeAmount.toFixed(2);
        totalAmountSpan.textContent = totalAmount.toFixed(2);
    }
}

// Handle form submission
async function handleFormSubmit() {
    const form = document.getElementById('donationForm');
    
    // Basic validation
    if (!validateForm()) {
        return;
    }
    
    // Show loading state
    setSubmitButtonLoading(true);
    
    try {
        // Collect form data
        const formData = new FormData(form);
        const donationData = {
            amount: formData.get('amount'),
            purpose: formData.get('purpose'),
            coverFees: formData.get('coverFees') === 'on',
            anonymous: formData.get('anonymous') === 'on',
            firstName: formData.get('anonymous') === 'on' ? '' : formData.get('firstName'),
            lastName: formData.get('anonymous') === 'on' ? '' : formData.get('lastName'),
            email: formData.get('anonymous') === 'on' ? '' : formData.get('email'),
            message: formData.get('message')
        };
        
        // Calculate total amount
        const baseAmount = parseFloat(donationData.amount);
        const feeAmount = donationData.coverFees ? baseAmount * 0.025 : 0;
        donationData.totalAmount = baseAmount + feeAmount;
        
        await handleOneTimeDonation(donationData);
        
    } catch (error) {
        console.error('Donation error:', error);
        showMessage('Sorry, there was an error processing your donation. Please try again.', 'error');
        setSubmitButtonLoading(false);
    }
}

// Handle one-time donation
async function handleOneTimeDonation(donationData) {
  try {
    // Create payment intent
    const response = await fetch('/api/donations/create-payment-intent', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(donationData)
    });

    const result = await response.json();
    if (!result.success) {
      throw new Error(result.message || 'Failed to create payment intent');
    }

    // Confirm payment with Stripe Elements
    const { error, paymentIntent } = await stripe.confirmCardPayment(result.clientSecret, {
      payment_method: {
        card: cardElement,
        billing_details: {
          name: `${donationData.firstName} ${donationData.lastName}`,
          email: donationData.email,
        }
      }
    });

    if (error) {
      console.error('Payment failed:', error);
      showMessage(error.message || 'Payment failed. Please try again.', 'error');
      setSubmitButtonLoading(false);
      return;
    }

    if (paymentIntent.status === 'succeeded') {
      // Confirm payment on server
      await fetch('/api/donations/confirm-payment', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ 
          paymentIntentId: paymentIntent.id 
        })
      });

      // Show success message
      showMessage('Thank you for your donation! You will receive a confirmation email shortly.', 'success');

      // Reset form and hide modal
      resetFormAndModal();
    }

  } catch (error) {
    console.error('Donation error:', error);
    showMessage('An error occurred. Please try again.', 'error');
    throw error;
  } finally {
    setSubmitButtonLoading(false);
  }
}

// Reset form and modal
function resetFormAndModal() {
    const form = document.getElementById('donationForm');
    form.reset();
    hideCardForm();
    
    // Reset amount buttons
    document.querySelectorAll('.amount-btn').forEach(btn => btn.classList.remove('active'));
    document.getElementById('customAmount').classList.remove('show');
    document.getElementById('feeInfo').style.display = 'none';
}

// Form validation
function validateForm() {
    const amount = parseFloat(document.getElementById('customAmount').value);
    if (!amount || amount < 1) {
        showMessage('Please enter a valid donation amount.', 'error');
        return false;
    }
    
    // Only validate name/email if not anonymous
    const isAnonymous = document.getElementById('anonymous').checked;
    if (!isAnonymous) {
        const email = document.getElementById('email').value.trim();
        if (email) {
            const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
            if (!emailRegex.test(email)) {
                showMessage('Please enter a valid email address.', 'error');
                return false;
            }
        }
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