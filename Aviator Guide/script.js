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
                return 'In the UAE, key pilot training centers include UAE Aviation Academy (UAAA), Emirates Aviation University, CAE Oxford Aviation Academy – Dubai, Phoenix Aviation Academy, and Skyline University Aviation Academy. These centers offer integrated ATPL, modular CPL/IR training, and airline cadet pathways.';
            }
            if (contains(['license', 'licenses', 'ppl', 'cpl', 'atpl', 'pilot license', 'airline transport', 'type rating', 'medical requirement'])) {
                return 'Pilot licenses progress from PPL to CPL and then ATPL. PPL is for private flying, CPL is required to fly commercially, and ATPL is needed to become an airline captain. You also need medical certification and a type rating for the specific aircraft you will fly.';
            }
            if (contains(['subject', 'subjects', 'required subjects', 'required subject', 'math', 'physics', 'science', 'english', 'biology'])) {
                return 'The most important subjects are mathematics, physics, English, and science. Mathematics and physics help with navigation and aircraft performance, while English is required for international air traffic communication and ICAO proficiency.';
            }
            if (contains(['become a pilot', 'to become a pilot', 'what to do to become', 'how to become', 'steps to become', 'becoming a pilot', 'what should i do', 'what do i need to do'])) {
                return 'To become a pilot, start with the right academics: focus on mathematics, physics, English, and science. Then choose a training path such as an integrated ATPL program or modular CPL training, complete your PPL, CPL, and ATPL exams, obtain a Class 1 medical certificate, build flight hours, and secure a type rating for the aircraft you plan to fly.';
            }
            if (contains(['resource', 'resources', 'advice', 'salary', 'timeline', 'lifestyle', 'pilot experiences', 'study materials', 'career advice', 'preparation', 'mental preparation', 'beginner', 'starting', 'advice', 'guidance'])) {
                return 'For a beginner, focus on strong academics, build flight hours steadily, and use trusted study resources. Practice English, learn meteorology, attend simulators seriously, and network with pilots. Avoid rushing training and balance technical knowledge with Crew Resource Management and decision-making skills.';
            }
            if (contains(['good airline', 'top airline', 'best airline', 'airline career', 'airline recruitment', 'get into airline', 'airline application', 'emirates', 'etihad', 'flydubai', 'airline cadet'])) {
                return 'To get into a good airline, focus on strong flight training, good academic records, and a professional CV. Build hours through a recognized training program, pass ICAO English and medical requirements, target cadet or sponsorship programs, and demonstrate strong CRM, professionalism, and airline culture fit.';
            }
            if (contains(['engineering college', 'aerospace engineering', 'university', 'college', 'aerospace college', 'aviation degree', 'mbzua', 'abu dhabi polytechnic'])) {
                return 'Top UAE institutions include Emirates Aviation University, Khalifa University Aerospace Engineering, American University of Sharjah, Mohamed Bin Zayed University of Artificial Intelligence, and Abu Dhabi Polytechnic. They offer aerospace, aviation management, and AI-related programs that support aviation careers.';
            }
            if (contains(['contact', 'get in touch', 'reach out', 'email', 'phone', 'office location', 'contact page', 'contact details'])) {
                return 'You can contact the Aviator Guide team by email at rishik.patil78@gmail.com or by phone at +971 4 XXX XXXX. The office is located in Dubai Aviation Hub, Building B, Level 3, Dubai, UAE, and is open Sunday to Thursday from 9am to 6pm GST.';
            }
            if (contains(['website about', 'what is this website', 'what can i learn', 'guide website', 'about this website'])) {
                return 'This Aviator Guide website helps aspiring pilots in the UAE by explaining the subjects, licenses, training centers, colleges, and practical advice needed to start and grow a pilot career.';
            }
            if (contains(['hello', 'hi', 'hey', 'greetings'])) {
                return 'Hello! Ask me a direct question about pilot subjects, licenses, training centers, colleges, advice, or contact details for the Aviator Guide website.';
            }
            if (contains(['thanks', 'thank you', 'thankyou'])) {
                return 'You’re welcome! Ask me another question about pilot training, academic requirements, or UAE aviation career guidance.';
            }
            if (tokens.length > 0) {
                return 'Ask me a specific question about pilot training, required subjects, UAE aviation colleges, career advice, or contact details from the Aviator Guide.';
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