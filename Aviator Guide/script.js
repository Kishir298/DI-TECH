// Security utilities
function sanitizeForDisplay(input) {
    if (typeof input !== 'string') return '';
    return input
        .replace(/&/g, '&amp;')
        .replace(/</g, '&lt;')
        .replace(/>/g, '&gt;')
        .replace(/"/g, '&quot;')
        .replace(/'/g, '&#x27;');
}

// Security: Disable right-click context menu to prevent easy content theft
document.addEventListener('contextmenu', function(e) {
    if (e.target.tagName === 'IMG') {
        e.preventDefault();
    }
});

// Security: Prevent console access (basic obfuscation)
(function() {
    const originalConsole = console.log;
    console.log = function() {
        if (arguments[0] && typeof arguments[0] === 'string' && 
            (arguments[0].includes('token') || arguments[0].includes('password') || 
             arguments[0].includes('key') || arguments[0].includes('secret'))) {
            return;
        }
        return originalConsole.apply(console, arguments);
    };
})();

// Security: Protect against clickjacking
if (window.self !== window.top) {
    window.top.location = window.location;
}

// Security: Disable drag and drop for images to prevent data theft
document.addEventListener('dragstart', function(e) {
    if (e.target.tagName === 'IMG') {
        e.preventDefault();
    }
});

// Security: Keyboard input sanitization for forms
document.addEventListener('keydown', function(e) {
    if (e.target.tagName === 'INPUT' || e.target.tagName === 'TEXTAREA') {
        if (e.ctrlKey && (e.key === 'v' || e.key === 'V')) {
            setTimeout(function() {
                if (e.target.value) {
                    e.target.value = sanitizeForDisplay(e.target.value);
                }
            }, 1);
        }
    }
});

// Security: Prevent XSS via innerHTML (override dangerous methods)
const originalInnerHTML = Object.getOwnPropertyDescriptor(Element.prototype, 'innerHTML');
Object.defineProperty(Element.prototype, 'innerHTML', {
    set: function(value) {
        if (typeof value === 'string' && (value.includes('<script') || value.includes('javascript:'))) {
            console.warn('Blocked potentially dangerous innerHTML assignment');
            return;
        }
        originalInnerHTML.set.call(this, value);
    },
    get: function() {
        return originalInnerHTML.get.call(this);
    }
});

// Security: Content Security Policy violation reporting
document.addEventListener('securitypolicyviolation', function(e) {
    console.warn('CSP Violation:', e.blockedURI, e.violatedDirective);
});

// Security: Detect DevTools using timing attack
(function devtoolsDetector() {
    const start = new Date().getTime();
    debugger;
    const end = new Date().getTime();
    if (end - start > 100) {
        console.warn('Developer tools detected. Please close for optimal experience.');
    }
})();

// Security: Disable F12 and other dev tool shortcuts

// Wait for page to load
// Toggle mobile menu
// Close menu when clicking nav link
// Close menu when clicking outside
// Form submission handling
document.addEventListener('DOMContentLoaded', function() {
    const navToggle = document.querySelector('.nav-toggle');
    const navLinks = document.querySelector('.nav-container');
    const navLinksItems = document.querySelectorAll('.nav-link');
    
    if (navToggle && navLinks) {
        navToggle.addEventListener('click', function() {
            navLinks.classList.toggle('active');
            navToggle.textContent = navLinks.classList.contains('active') ? '✕' : '☰';
        });
    }
    
    navLinksItems.forEach(function(link) {
        link.addEventListener('click', function() {
            if (navLinks.classList.contains('active')) {
                navLinks.classList.remove('active');
                navToggle.textContent = '☰';
            }
        });
    });
    
    document.addEventListener('click', function(event) {
        const isClickInsideNav = event.target.closest('nav');
        if (!isClickInsideNav && navLinks.classList.contains('active')) {
            navLinks.classList.remove('active');
            navToggle.textContent = '☰';
        }
    });
    
    document.querySelectorAll('a[href^="#"]').forEach(function(anchor) {
        anchor.addEventListener('click', function(e) {
            e.preventDefault();
            const target = document.querySelector(this.getAttribute('href'));
            if (target) {
                target.scrollIntoView({
                    behavior: 'smooth',
                    block: 'start'
                });
            }
        });
    });
    
    const currentPath = window.location.pathname;
    const pageName = currentPath.substring(currentPath.lastIndexOf('/') + 1);
    
    navLinksItems.forEach(function(link) {
        const linkPath = link.getAttribute('href');
        if (linkPath === pageName || (pageName === '' && linkPath === 'index.html')) {
            link.classList.add('active');
        }
    });

    function createChatbotWidget() {
        const widget = document.createElement('div');
        widget.className = 'chatbot-widget';
        widget.innerHTML = `
            <button class="chatbot-button" aria-label="Open chat">💬</button>
            <div class="chatbot-modal" role="dialog" aria-modal="true" aria-label="Chatbot window">
                <div class="chatbot-header">
                    <h4>Site Chat</h4>
                    <button class="chatbot-close" aria-label="Close chat">×</button>
                </div>
                <div class="chatbot-body">
                    <div class="chatbot-message bot">Hello! Ask me about this Aviator Guide website and its content.</div>
                </div>
                <div class="chatbot-input-row">
                    <input class="chatbot-input" type="text" placeholder="Ask a question..." aria-label="Type your question here">
                    <button class="chatbot-send">Send</button>
                </div>
            </div>
        `;
        document.body.appendChild(widget);

        const button = widget.querySelector('.chatbot-button');
        const modal = widget.querySelector('.chatbot-modal');
        const close = widget.querySelector('.chatbot-close');
        const send = widget.querySelector('.chatbot-send');
        const input = widget.querySelector('.chatbot-input');
        const body = widget.querySelector('.chatbot-body');

        function appendMessage(text, sender) {
            const message = document.createElement('div');
            message.className = 'chatbot-message ' + sender;
            message.textContent = text;
            body.appendChild(message);
            body.scrollTop = body.scrollHeight;
        }

        function getResponse(userText) {
            const normalized = userText.toLowerCase().replace(/[^a-z0-9\s]/g, ' ').replace(/\s+/g, ' ').trim();
            const tokens = normalized.split(' ');
            const contains = keywords => keywords.some(keyword => normalized.includes(keyword));

            if (contains(['training center', 'training centers', 'pilot training', 'flight school', 'pilot academy', 'aviation academy', 'pilot training center', 'training academy'])) {
                return 'The website lists UAE Aviation Academy (UAAA), Emirates Aviation University, CAE Oxford Aviation Academy - Dubai, Phoenix Aviation Academy, and Skyline University Aviation Academy as key pilot training centers. It also mentions aerospace colleges like Khalifa University and Abu Dhabi Polytechnic.';
            }
            if (contains(['license', 'licenses', 'ppl', 'cpl', 'atpl', 'pilot license', 'airline transport', 'type rating', 'medical requirement'])) {
                return 'The Aviator Guide explains pilot licenses: PPL for recreational flying, CPL for commercial flying, and ATPL for airline command. It also covers license progression, medical requirements, and type ratings.';
            }
            if (contains(['resource', 'resources', 'advice', 'salary', 'timeline', 'lifestyle', 'pilot experiences', 'study materials', 'career advice', 'preparation', 'mental preparation'])) {
                return 'The Resources and Advice page covers pilot experience guidance, study resources, salary expectations in the UAE, training timelines, and lifestyle preparation for aviation careers.';
            }
            if (contains(['engineering college', 'aerospace engineering', 'university', 'college', 'aerospace college', 'aviation degree', 'mbzua', 'middlewares', 'abu dhabi polytechnic'])) {
                return 'The website covers UAE institutions including Emirates Aviation University, Khalifa University Aerospace Engineering, American University of Sharjah, Mohamed Bin Zayed University of Artificial Intelligence, and Abu Dhabi Polytechnic.';
            }
            if (contains(['contact', 'get in touch', 'reach out', 'email', 'phone', 'office location', 'contact page'])) {
                return 'The Contact page provides email, phone, and office location details for aspiring pilots seeking help with training programs, career advice, and next steps.';
            }
            if (contains(['website about', 'what is this website', 'what can i learn', 'guide website', 'about this website'])) {
                return 'This Aviator Guide website helps aspiring pilots in the UAE by describing subjects, licenses, training centers, engineering colleges, and resources needed to start a pilot career.';
            }
            if (contains(['hello', 'hi', 'hey', 'greetings'])) {
                return 'Hello! Ask me anything about the Aviator Guide website: training centers, licenses, engineering colleges, resources, or contact information.';
            }
            if (contains(['thanks', 'thank you', 'thankyou'])) {
                return 'You’re welcome! Ask me another question about the Aviator Guide website or its aviation career guidance content.';
            }
            if (tokens.length > 0) {
                return 'I’m here to answer questions about the Aviator Guide website. Try asking about training centers, licenses, engineering colleges, resources, or contact details.';
            }
            return 'Please type a question about the Aviator Guide website content.';
        }

        function sendMessage() {
            const text = input.value.trim();
            if (!text) return;
            appendMessage(text, 'user');
            input.value = '';
            setTimeout(function() {
                appendMessage(getResponse(text), 'bot');
            }, 300);
        }

        button.addEventListener('click', function() {
            modal.classList.toggle('open');
        });

        close.addEventListener('click', function() {
            modal.classList.remove('open');
        });

        send.addEventListener('click', sendMessage);
        input.addEventListener('keydown', function(event) {
            if (event.key === 'Enter') {
                event.preventDefault();
                sendMessage();
            }
        });
    }

    createChatbotWidget();
});

const forms = document.querySelectorAll('form');
forms.forEach(function(form) {
    form.addEventListener('submit', function(e) {
        if (form.id === 'contact-form') {
            return;
        }

        if (this.getAttribute('action') === '' || this.getAttribute('action') === undefined) {
            e.preventDefault();
            alert('Thank you for your message! We will get back to you soon.');
            this.reset();
        }
    });
});