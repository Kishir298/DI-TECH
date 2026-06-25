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
            if (contains(['degree', 'university', 'aeronautical', 'aerospace engineering', 'aviation degree', 'engineering degree', 'university requirement', 'backup career', 'without degree', 'without university', 'no degree'])) {
                if (contains(['without degree', 'without university', 'no degree'])) {
                    return 'You do not need a degree to become a pilot. Many trained directly through integrated programs. However, a degree provides flexibility and higher earnings. If you stop flying, work in aviation management or engineering.';
                }
                return 'A degree is not required but helps career progression. Popular options: Aeronautical Engineering, Aviation Management, Aerospace. Emirates Aviation University integrates degrees with flight training. Degrees offer backup careers in management or engineering.';
            }
            if (contains(['license', 'licenses', 'ppl', 'cpl', 'atpl', 'pilot license', 'airline transport', 'type rating', 'medical requirement', 'frozen atpl', 'instrument rating', 'multi engine', 'student pilot', 'medical certificate', 'class 1 medical', 'flight hour', 'training cost', 'how many hour', 'how long', 'how much cost', 'how difficult', 'fail', 'glasses', 'exam', 'start age'])) {
                if (contains(['how many hour', 'how long', 'how much cost', 'how difficult', 'how much does'])) {
                    return 'Integrated ATPL costs AED 400,000–650,000. CPL takes 6–12 months. ATPL requires 1500 hours (or 500–750 through integrated). Medical exams: AED 5,000–10,000. Start at 17 (PPL) or 18 (CPL). Training requires discipline but is achievable.';
                }
                if (contains(['fail', 'glasses', 'exam', 'start age'])) {
                    return 'If you fail a test, you retake it—many do once. You can wear corrected glasses (20/20 vision). Medical includes cardiovascular, hearing, psychological checks. Start training at age 17.';
                }
                return 'Licenses: PPL (private), CPL (commercial), ATPL (airline). Get Instrument Rating, Multi-Engine Rating, Type Rating. Path: PPL → CPL → ATPL. ATPL frozen before 1500 hours. Class 1 Medical required. Total: 3–5 years.';
            }
            if (contains(['subject', 'subjects', 'required subjects', 'required subject', 'math', 'physics', 'science', 'english', 'biology', 'take', 'study', 'focus', 'year 13', 'ib subject', 'high school', 'qualification', 'without physics', 'without chemistry', 'struggle mathematics', 'grades', 'extracurricular'])) {
                if (contains(['without physics', 'without chemistry', 'struggle mathematics'])) {
                    return 'Physics and mathematics are critical, but if you struggle, extra tutoring helps. Many pilots worked harder in these subjects. Chemistry is less important. Persistence and support matter most.';
                }
                    // Precise FAQ responses (rewritten from Aspiring Pilot FAQ Part 1)
                    const faq = {
                        q1: 'Mathematics, Physics, English, Geography, and Chemistry are useful subjects because they develop skills needed for navigation, communication, and understanding aircraft systems.',
                        q2: 'Yes. Mathematics helps pilots with navigation, fuel calculations, flight planning, and problem-solving.',
                        q3: 'Physics explains how aircraft fly through concepts such as lift, thrust, drag, and gravity.',
                        q4: 'Chemistry is not always required, but it helps pilots understand fuel, combustion, and aircraft materials.',
                        q5: 'Yes. Geography helps pilots understand maps, weather patterns, time zones, and global routes.',
                        q6: 'Airlines mainly focus on your licenses, training, and skills, but strong grades can help when applying for flight schools and universities.',
                        q7: 'Requirements vary by academy, but most flight schools expect satisfactory grades in Mathematics, English, and Science.',
                        q8: 'For IB, choose Mathematics, Physics, and English — these subjects are highly recommended for aviation careers.',
                        q9: 'Yes, you can become a pilot without studying physics, but studying physics provides a strong advantage during flight training.',
                        q10: 'In Year 13, focus on Mathematics, Physics, English, and any subjects required by your chosen university or flight academy.',
                        q11: 'Yes. English is the international language of aviation and is used for communication with air traffic control.',
                        q12: 'Advanced mathematics is not always required, but strong mathematical skills are beneficial.',
                        q13: 'Airlines prefer applicants who have completed secondary education and professional flight training.',
                        q14: 'Mathematics and Physics are often considered the most important subjects for aspiring pilots because they support many aviation concepts.',
                        q15: 'In school, study relevant subjects, develop leadership skills, and learn more about the aviation industry.',
                        q16: 'Yes. Activities demonstrating teamwork, leadership, and responsibility can strengthen pilot applications.',
                        q17: 'Yes. Many successful pilots improve their mathematical skills through practice and training.',
                        q18: 'Before flight school, study basic mathematics, physics, aviation terminology, and communication skills.',
                        q19: 'Many universities prefer Mathematics and Physics, but requirements vary by institution.',
                        q20: 'Develop communication, teamwork, problem-solving, leadership, and time management while in school.'
                    };

                    // Intent matching for specific FAQ items (prioritize explicit question forms)
                    if (normalized.includes('what subjects should') || normalized.includes('what subjects should i take') || normalized.includes('what subjects') || normalized.includes('which subjects')) return faq.q1;
                    if (normalized.includes('is mathematics important') || normalized.includes('is math important') || normalized.includes('math important')) return faq.q2;
                    if (normalized.includes('why do pilots need physics') || normalized.includes('why pilots need physics') || normalized.includes('why physics')) return faq.q3;
                    if (normalized.includes('do i need chemistry') || normalized.includes('need chemistry')) return faq.q4;
                    if (normalized.includes('is geography useful') || normalized.includes('geography useful') || normalized.includes('why geography')) return faq.q5;
                    if (normalized.includes('high school grades') || normalized.includes('do airlines care') || normalized.includes('airlines care about')) return faq.q6;
                    if (normalized.includes('minimum grade') || normalized.includes('minimum grades') || normalized.includes('minimum grade required')) return faq.q7;
                    if (normalized.includes('ib subject') || normalized.includes('which ib') || normalized.includes('which ib subjects')) return faq.q8;
                    if (normalized.includes('without physics') || normalized.includes('no physics')) return faq.q9;
                    if (normalized.includes('year 13') || normalized.includes('focus in year 13') || normalized.includes('what to focus in year 13')) return faq.q10;
                    if (normalized.includes('is english important') || normalized.includes('english important') || normalized.includes('english for pilots')) return faq.q11;
                    if (normalized.includes('advanced mathematics') || normalized.includes('advanced math') || normalized.includes('do i need advanced')) return faq.q12;
                    if (normalized.includes('school qualifications') || normalized.includes('what school qualifications') || normalized.includes('school qualification')) return faq.q13;
                    if (normalized.includes('most important subject') || normalized.includes('which subject is most important') || normalized.includes('most important')) return faq.q14;
                    if (normalized.includes('what can i do in school') || normalized.includes('prepare in school') || normalized.includes('what to do in school')) return faq.q15;
                    if (normalized.includes('extracurricular') || normalized.includes('activities important') || normalized.includes('extracurricular activities')) return faq.q16;
                    if (normalized.includes('struggle with mathematics') || normalized.includes('struggle with math') || normalized.includes('bad at math')) return faq.q17;
                    if (normalized.includes('what should i study before') || normalized.includes('study before flight school') || normalized.includes('before joining flight school')) return faq.q18;
                    if (normalized.includes('universities require') || normalized.includes('do universities require') || normalized.includes('university require subjects')) return faq.q19;
                    if (normalized.includes('skills should i develop') || normalized.includes('what skills') || normalized.includes('skills while in school')) return faq.q20;

                    // Default subject group answer
                    return faq.q1;
            }
            if (contains(['become a pilot', 'to become a pilot', 'what to do to become', 'how to become', 'steps to become', 'becoming a pilot', 'what should i do', 'what do i need to do'])) {
                return 'To become a pilot, start with the right academics: focus on mathematics, physics, English, and science. Then choose a training path such as an integrated ATPL program or modular CPL training, complete your PPL, CPL, and ATPL exams, obtain a Class 1 medical certificate, build flight hours, and secure a type rating for the aircraft you plan to fly.';
            }
            if (contains(['resource', 'resources', 'advice', 'salary', 'timeline', 'lifestyle', 'pilot experiences', 'study materials', 'career advice', 'preparation', 'mental preparation', 'beginner', 'starting', 'guidance', 'suitable', 'good pilot', 'skill', 'mistake', 'competitive', 'next step', 'prepare', 'interview', 'worth', 'advantage', 'backup', 'step by step', 'improve chance', 'experience', 'suitable for', 'right for me', 'cannot afford', 'expensive', 'cannot pay', 'avoid', 'biggest', 'am i'])) {
                if (contains(['suitable', 'suitable for', 'right for me', 'am i'])) {
                    return 'You fit piloting if you enjoy problem-solving, stay calm under pressure, have spatial awareness, and want learning. Communication, discipline, teamwork matter. If you love math, physics, and flying—pursue it.';
                }
                if (contains(['step by step', 'plan', 'next step', 'what should', 'start', 'how to start'])) {
                    return 'Step 1: Excel in school (maths, physics, English). Step 2: Get Class 1 Medical. Step 3: Choose academy (UAAA, Emirates Aviation, CAE). Step 4: Complete integrated ATPL (18–24 months). Step 5: Build hours. Step 6: Type rating. Step 7: Apply. Total: 3–5 years.';
                }
                if (contains(['cannot afford', 'expensive', 'cannot pay', 'afford'])) {
                    return 'Explore cadet sponsorship from Emirates/Etihad—they cover costs for 5-year service. Check academy payment plans and scholarships. Work part-time or seek family support to save.';
                }
                if (contains(['mistake', 'avoid', 'biggest'])) {
                    return 'Common mistakes: rushing, neglecting theory, weak English, poor CRM, isolation. Do not skip ATPL exams. Balance flying and theory. Practice English daily. Network. Take simulators seriously.';
                }
                return 'Key skills: discipline, problem-solving, communication, decision-making. For interviews: research airlines, practice ICAO English, show CRM understanding. Gain airport/aviation club experience. Piloting is competitive but rewarding.';
            }
            if (contains(['good airline', 'top airline', 'best airline', 'airline career', 'airline recruitment', 'get into airline', 'airline application', 'emirates', 'etihad', 'flydubai', 'airline cadet', 'airline', 'salary', 'earn', 'first officer', 'captain', 'career progression', 'career growth', 'demand', 'work schedule', 'benefit', 'challenge', 'how much', 'which airline', 'hire', 'future'])) {
                if (contains(['salary', 'earn', 'payment', 'cost', 'how much'])) {
                    return 'First officers start AED 28,000–42,000/month. Senior first officers: AED 48,000–65,000. Narrow-body captains: AED 85,000–120,000. Wide-body captains: AED 110,000–165,000+. Benefits: housing, education (AED 150,000/year), medical, 42–60 days leave, gratuity.';
                }
                if (contains(['which airline', 'best airline', 'hire', 'demand'])) {
                    return 'Emirates, Etihad, flydubai hire regularly with cadet programs. High demand globally and in UAE. Career: First Officer (2–5 years) → Senior → Captain. Emirates/Etihad offer structured progression and competitive pay.';
                }
                if (contains(['get into airline', 'good airline', 'airline recruitment'])) {
                    return 'Excel in flight training, maintain professional CV, pass ICAO English/medical, target cadet programs, demonstrate professionalism and CRM. Airlines value discipline, communication, and cultural fit.';
                }
                return 'Pilots earn well with stable careers and international opportunities. Irregular schedules and pressure are challenges. Benefits: high pay, education sponsorship, travel, prestige. Professionalism is essential.';
            }
            if (contains(['engineering college', 'aerospace engineering', 'university', 'college', 'aerospace college', 'aviation degree', 'mbzua', 'abu dhabi polytechnic'])) {
                return 'Top UAE institutions include Emirates Aviation University, Khalifa University Aerospace Engineering, American University of Sharjah, Mohamed Bin Zayed University of Artificial Intelligence, and Abu Dhabi Polytechnic. They offer aerospace, aviation management, and AI-related programs that support aviation careers.';
            }
            if (contains(['flight school', 'academy', 'uae aviation', 'emirates aviation', 'cae oxford', 'phoenix aviation', 'skyline', 'uaaa', 'sharjah', 'training center', 'best academy', 'reputation', 'employment rate', 'scholarship', 'entry requirement', 'apply', 'facility', 'cost', 'fee', 'price', 'international students'])) {
                if (contains(['best', 'reputation', 'highest', 'employment'])) {
                    return 'UAE Aviation Academy (UAAA) and Emirates Aviation University have top reputations. CAE Oxford partners with airlines for employment. Scholarships and cadet sponsorship from Emirates/Etihad available.';
                }
                if (contains(['cost', 'fee', 'price', 'afford'])) {
                    return 'Integrated ATPL costs AED 400,000–650,000 in UAE. Payment plans available. Cadet sponsorship from airlines reduces costs. Check Emirates Aviation and CAE Oxford for programs.';
                }
                return 'Top UAE schools: UAE Aviation Academy (Sharjah), Emirates Aviation University (Dubai), CAE Oxford (Al Maktoum), Phoenix Aviation (Ras Al Khaimah), Skyline University. Programs: 18–24 months. All have simulators, modern aircraft, international approvals.';
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