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

        const fromEmail = contactForm.querySelector('[name="from_email"]');
        const replyTo = contactForm.querySelector('[name="reply_to"]');
        const toEmail = contactForm.querySelector('[name="to_email"]');

        if (fromEmail && replyTo) {
            replyTo.value = fromEmail.value;
        }

        if (fromEmail && toEmail) {
            toEmail.value = fromEmail.value;
        }

        emailjs.sendForm('service_ofv4nqp', 'template_jzeh64c', contactForm)
            .then(function() {
                return emailjs.sendForm('service_ofv4nqp', 'template_l5ozl76', contactForm);
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