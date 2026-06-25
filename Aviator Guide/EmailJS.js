document.addEventListener('DOMContentLoaded', function() {
    if (typeof emailjs === 'undefined') {
        console.error('EmailJS library not loaded.');
        return;
    }

    emailjs.init('66dBGH4OSxm3Q5jb0');

    const contactForm = document.getElementById('contact-form');
    if (!contactForm) {
        return;
    }

    function sanitizeInput(input) {
        const div = document.createElement('div');
        div.textContent = input;
        return div.innerHTML
            .replace(/&/g, '&amp;')
            .replace(/</g, '&lt;')
            .replace(/>/g, '&gt;')
            .replace(/"/g, '&quot;')
            .replace(/'/g, '&#x27;');
    }

    function validateEmail(email) {
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        return emailRegex.test(email);
    }

    function validateName(name) {
        return name.length >= 2 && name.length <= 100 && /^[a-zA-Z\s\-']+$/.test(name);
    }

    function validateForm(fromName, fromEmail, subject, message) {
        if (!validateName(fromName)) {
            alert('Please enter a valid name (2-100 characters, letters only).');
            return false;
        }
        if (!validateEmail(fromEmail)) {
            alert('Please enter a valid email address.');
            return false;
        }
        if (!subject || subject.length > 200) {
            alert('Please select a valid subject.');
            return false;
        }
        if (!message || message.length < 10 || message.length > 2000) {
            alert('Message must be between 10 and 2000 characters.');
            return false;
        }
        return true;
    }

    let lastSubmitTime = 0;
    const SUBMIT_COOLDOWN = 30000;

    contactForm.addEventListener('submit', function(event) {
        event.preventDefault();

        const now = Date.now();
        if (now - lastSubmitTime < SUBMIT_COOLDOWN) {
            alert('Please wait 30 seconds before submitting another message.');
            return;
        }

        const fromName = sanitizeInput(contactForm.querySelector('[name="from_name"]')?.value.trim() || '');
        const fromEmail = sanitizeInput(contactForm.querySelector('[name="from_email"]')?.value.trim() || '');
        const subject = sanitizeInput(contactForm.querySelector('[name="subject"]')?.value || '');
        const message = sanitizeInput(contactForm.querySelector('[name="message"]')?.value.trim() || '');

        if (!validateForm(fromName, fromEmail, subject, message)) {
            return;
        }

        const adminParams = {
            from_name: fromName,
            from_email: fromEmail,
            subject: subject,
            message: message,
            reply_to: fromEmail,
            to_email: 'dia250380@diaestudents.com'
        };

        const autoReplyParams = {
            from_name: fromName,
            from_email: fromEmail,
            subject: subject,
            message: message,
            reply_to: fromEmail,
            to_email: fromEmail
        };

        const submitButton = contactForm.querySelector('button[type="submit"]');
        const originalText = submitButton.textContent;
        submitButton.disabled = true;
        submitButton.textContent = 'Sending...';

        emailjs.send('service_ofv4nqp', 'template_jzeh64c', adminParams)
            .then(function() {
                lastSubmitTime = Date.now();
                return emailjs.send('service_ofv4nqp', 'template_l5ozl76', autoReplyParams);
            })
            .then(function() {
                alert('Your message has been sent successfully.');
                contactForm.reset();
            })
            .catch(function(error) {
                console.error('EmailJS error:', error);
                alert('Sorry, something went wrong while sending your message. Please try again later.');
            })
            .finally(function() {
                submitButton.disabled = false;
                submitButton.textContent = originalText;
            });
    });
});