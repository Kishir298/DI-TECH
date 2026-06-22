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

    contactForm.addEventListener('submit', function(event) {
        event.preventDefault();

        const fromName = contactForm.querySelector('[name="from_name"]')?.value || '';
        const fromEmail = contactForm.querySelector('[name="from_email"]')?.value || '';
        const subject = contactForm.querySelector('[name="subject"]')?.value || 'Contact Request';
        const message = contactForm.querySelector('[name="message"]')?.value || '';

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

        emailjs.send('service_y0bysqf', 'template_jzeh64c', adminParams)
            .then(function() {
                return emailjs.send('service_y0bysqf', 'template_l5ozl76', autoReplyParams);
            })
            .then(function() {
                alert('Your message has been sent successfully.');
                contactForm.reset();
            })
            .catch(function(error) {
                console.error('EmailJS error:', error);
                alert('Sorry, something went wrong while sending your message. Please try again later.');
            });
    });
});