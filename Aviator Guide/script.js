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

        let lastUserQuestion = '';
        function appendMessage(text, sender, options = {}) {
            const message = document.createElement('div');
            message.className = 'chatbot-message ' + sender;

            const textNode = document.createElement('span');
            textNode.textContent = text;
            message.appendChild(textNode);

            if (sender === 'bot' && options.showSave) {
                const saveBtn = document.createElement('button');
                saveBtn.className = 'chatbot-save';
                saveBtn.type = 'button';
                saveBtn.textContent = 'Save';
                saveBtn.title = 'Save this answer to the site FAQ';
                saveBtn.addEventListener('click', function() {
                    if (!lastUserQuestion) return;
                    saveKnowledge(lastUserQuestion, text);
                    saveBtn.textContent = 'Saved';
                    saveBtn.disabled = true;
                });
                message.appendChild(saveBtn);
            }

            body.appendChild(message);
            body.scrollTop = body.scrollHeight;
        }

        function getResponse(userText) {
            const normalized = userText.toLowerCase().replace(/[^a-z0-9\s]/g, ' ').replace(/\s+/g, ' ').trim();
            const tokens = normalized.split(' ').filter(Boolean);

            // Base FAQ dataset (hard-coded)
            let faq = [
                {
                    question: 'What subjects should I take if I want to become a pilot?',
                    answer: 'Mathematics, Physics, English, Geography, and Chemistry are useful subjects because they develop skills needed for navigation, communication, and understanding aircraft systems.',
                    keywords: ['subjects', 'math', 'mathematics', 'physics', 'english', 'geography', 'chemistry', 'study']
                },
                {
                    question: 'Is mathematics important for pilots?',
                    answer: 'Yes. Mathematics helps pilots with navigation, fuel calculations, flight planning, and problem-solving.',
                    keywords: ['mathematics', 'math', 'important']
                },
                {
                    question: 'Why do pilots need physics?',
                    answer: 'Physics explains how aircraft fly through concepts such as lift, thrust, drag, and gravity.',
                    keywords: ['physics', 'lift', 'thrust', 'drag', 'gravity', 'why']
                },
                {
                    question: 'Do I need chemistry to become a pilot?',
                    answer: 'Chemistry is not always required, but it helps pilots understand fuel, combustion, and aircraft materials.',
                    keywords: ['chemistry', 'fuel', 'combustion', 'materials']
                },
                {
                    question: 'Is geography useful for pilots?',
                    answer: 'Yes. Geography helps pilots understand maps, weather patterns, time zones, and global routes.',
                    keywords: ['geography', 'maps', 'weather', 'time zones', 'routes', 'useful']
                },
                {
                    question: 'Do airlines care about my high school grades?',
                    answer: 'Airlines mainly focus on your licenses, training, and skills, but strong grades can help when applying for flight schools and universities.',
                    keywords: ['high school grades', 'grades', 'airlines', 'flight schools', 'universities']
                },
                {
                    question: 'What is the minimum grade required to become a pilot?',
                    answer: 'Requirements vary by academy, but most flight schools expect satisfactory grades in Mathematics, English, and Science.',
                    keywords: ['minimum grade', 'grade required', 'requirements']
                },
                {
                    question: 'Which IB subjects should I choose for aviation?',
                    answer: 'For IB, choose Mathematics, Physics, and English — these subjects are highly recommended for aviation careers.',
                    keywords: ['ib subjects', 'ib', 'aviation', 'choose subjects']
                },
                {
                    question: 'Can I become a pilot without studying physics?',
                    answer: 'Yes, you can become a pilot without studying physics, but studying physics provides a strong advantage during flight training.',
                    keywords: ['without physics', 'no physics', 'physics']
                },
                {
                    question: 'What subjects should I focus on in Year 13?',
                    answer: 'In Year 13, focus on Mathematics, Physics, English, and any subjects required by your chosen university or flight academy.',
                    keywords: ['year 13', 'focus', 'subjects', 'year13']
                },
                {
                    question: 'Is English important for pilots?',
                    answer: 'Yes. English is the international language of aviation and is used for communication with air traffic control.',
                    keywords: ['english', 'communication', 'air traffic control']
                },
                {
                    question: 'Do I need advanced mathematics?',
                    answer: 'Advanced mathematics is not always required, but strong mathematical skills are beneficial.',
                    keywords: ['advanced mathematics', 'advanced math', 'strong math']
                },
                {
                    question: 'What school qualifications do airlines prefer?',
                    answer: 'Airlines prefer applicants who have completed secondary education and professional flight training.',
                    keywords: ['school qualifications', 'airlines prefer', 'secondary education', 'flight training']
                },
                {
                    question: 'Which subject is most important for aspiring pilots?',
                    answer: 'Mathematics and Physics are often considered the most important subjects for aspiring pilots because they support many aviation concepts.',
                    keywords: ['most important subject', 'important subject', 'mathematics', 'physics']
                },
                {
                    question: 'What can I do in school to prepare for aviation?',
                    answer: 'In school, study relevant subjects, develop leadership skills, and learn more about the aviation industry.',
                    keywords: ['prepare in school', 'aviation', 'leadership', 'study']
                },
                {
                    question: 'Are extracurricular activities important for pilot applications?',
                    answer: 'Yes. Activities demonstrating teamwork, leadership, and responsibility can strengthen pilot applications.',
                    keywords: ['extracurricular', 'activities', 'teamwork', 'leadership']
                },
                {
                    question: 'Can I become a pilot if I struggle with mathematics?',
                    answer: 'Yes. Many successful pilots improve their mathematical skills through practice and training.',
                    keywords: ['struggle with mathematics', 'struggle with math', 'math struggle']
                },
                {
                    question: 'What should I study before joining flight school?',
                    answer: 'Before flight school, study basic mathematics, physics, aviation terminology, and communication skills.',
                    keywords: ['before joining flight school', 'study before', 'flight school', 'aviation terminology', 'communication skills']
                },
                {
                    question: 'Do universities require specific subjects for aviation degrees?',
                    answer: 'Many universities prefer Mathematics and Physics, but requirements vary by institution.',
                    keywords: ['universities require', 'aviation degrees', 'specific subjects', 'requirements']
                },
                {
                    question: 'What skills should I develop while in school?',
                    answer: 'Develop communication, teamwork, problem-solving, leadership, and time management while in school.',
                    keywords: ['skills', 'school', 'develop', 'communication', 'teamwork', 'problem solving', 'leadership', 'time management']
                }
                ,
                {
                    question: 'Do I need a degree to become a pilot?',
                    answer: 'No. A degree is not always required, but it can improve career opportunities and provide a backup career option.',
                    keywords: ['degree', 'need a degree', 'require a degree', 'university', 'college']
                },
                {
                    question: 'Which degree is best for aspiring pilots?',
                    answer: 'Aeronautical Engineering, Aerospace Engineering, Aviation Management, and Aviation Science are popular choices.',
                    keywords: ['which degree', 'best degree', 'aeronautical', 'aerospace', 'aviation management', 'aviation science']
                },
                {
                    question: 'Is aeronautical engineering a good degree?',
                    answer: 'Yes. It provides knowledge of aircraft systems and offers an alternative career path if you become medically unfit to fly.',
                    keywords: ['aeronautical engineering', 'is aeronautical', 'good degree']
                },
                {
                    question: 'Should I study aviation or engineering?',
                    answer: 'Both are valuable. Aviation focuses on pilot training, while engineering provides technical knowledge and broader career options.',
                    keywords: ['study aviation or engineering', 'aviation or engineering', 'which to study']
                },
                {
                    question: 'What are the benefits of an aviation degree?',
                    answer: 'It develops aviation knowledge, industry awareness, and can improve employment opportunities.',
                    keywords: ['benefits of aviation degree', 'aviation degree benefits', 'advantages']
                },
                {
                    question: 'Which universities in the UAE offer aviation-related degrees?',
                    answer: 'Several institutions offer aviation-related programs, including universities that specialize in aerospace and aviation studies.',
                    keywords: ['universities in the uae', 'uae universities', 'aviation-related degrees', 'which universities']
                },
                {
                    question: 'Can I become a pilot without going to university?',
                    answer: 'Yes. Many pilots enter flight schools directly after secondary education.',
                    keywords: ['without university', 'no university', 'become a pilot without university']
                },
                {
                    question: 'What engineering degrees help pilots?',
                    answer: 'Aeronautical Engineering, Aerospace Engineering, Mechanical Engineering, and Electrical Engineering are useful options.',
                    keywords: ['engineering degrees', 'mechanical engineering', 'electrical engineering', 'aerospace engineering']
                },
                {
                    question: 'Is aerospace engineering useful for pilots?',
                    answer: 'Yes. It provides knowledge about aircraft design, systems, and aerodynamics.',
                    keywords: ['aerospace engineering', 'useful for pilots']
                },
                {
                    question: 'What degree should I choose as a backup career?',
                    answer: 'Aeronautical Engineering is often recommended because it remains closely connected to aviation.',
                    keywords: ['backup degree', 'backup career', 'aeronautical engineering']
                },
                {
                    question: 'Can I work in aviation if I stop flying?',
                    answer: 'Yes. Pilots can move into management, training, engineering, safety, or aviation operations roles.',
                    keywords: ['work in aviation', 'stop flying', 'career after flying']
                },
                {
                    question: 'What careers can an aeronautical engineer pursue?',
                    answer: 'They can work in aircraft design, maintenance, manufacturing, research, and aviation management.',
                    keywords: ['aeronautical engineer careers', 'careers in aeronautical']
                },
                {
                    question: 'Is an aviation management degree useful?',
                    answer: 'Yes. It prepares students for leadership and operational roles within the aviation industry.',
                    keywords: ['aviation management', 'aviation management degree', 'useful']
                },
                {
                    question: 'Which degree gives the best career flexibility?',
                    answer: 'Engineering degrees generally provide the greatest flexibility because they can be used inside and outside aviation.',
                    keywords: ['best career flexibility', 'flexible degree', 'engineering flexibility']
                },
                {
                    question: 'What university requirements are needed for aviation courses?',
                    answer: 'Requirements vary, but Mathematics, Physics, and English are commonly required.',
                    keywords: ['university requirements', 'requirements for aviation', 'entry requirements']
                },
                {
                    question: 'What licenses do I need to become a pilot?',
                    answer: 'Most pilots progress through the Class 1 Medical Certificate, SPL, PPL, IR, CPL, Multi-Engine Rating, Type Rating, and ATPL.',
                    keywords: ['licenses', 'what licenses', 'spl', 'ppl', 'cpl', 'atpl', 'class 1 medical']
                },
                {
                    question: 'What is a Class 1 Medical Certificate?',
                    answer: 'It confirms that you meet the medical standards required for commercial aviation.',
                    keywords: ['class 1 medical', 'medical certificate', 'what is class 1']
                },
                {
                    question: 'What is a Student Pilot License?',
                    answer: 'It allows you to begin official flight training and perform supervised solo flights.',
                    keywords: ['student pilot license', 'spl', 'what is spl']
                },
                {
                    question: 'What is a Private Pilot License?',
                    answer: 'It allows you to fly aircraft privately but not for payment.',
                    keywords: ['private pilot license', 'ppl', 'what is ppl']
                },
                {
                    question: 'What is an Instrument Rating?',
                    answer: 'It allows pilots to fly using aircraft instruments in poor weather or low-visibility conditions.',
                    keywords: ['instrument rating', 'ir', 'what is ir']
                }
            ];

            // Load any user-saved FAQ entries from localStorage (learned Q&A)
            let learned = [];
            try {
                learned = JSON.parse(localStorage.getItem('aviator_learned') || '[]');
                if (!Array.isArray(learned)) learned = [];
            } catch (e) {
                learned = [];
            }

            const combinedFaq = faq.concat(learned);

            // Levenshtein distance for fuzzy similarity
            const levenshtein = (a, b) => {
                if (a === b) return 0;
                const al = a.length, bl = b.length;
                if (al === 0) return bl;
                if (bl === 0) return al;
                const matrix = Array.from({ length: al + 1 }, () => new Array(bl + 1));
                for (let i = 0; i <= al; i++) matrix[i][0] = i;
                for (let j = 0; j <= bl; j++) matrix[0][j] = j;
                for (let i = 1; i <= al; i++) {
                    for (let j = 1; j <= bl; j++) {
                        const cost = a[i - 1] === b[j - 1] ? 0 : 1;
                        matrix[i][j] = Math.min(
                            matrix[i - 1][j] + 1,
                            matrix[i][j - 1] + 1,
                            matrix[i - 1][j - 1] + cost
                        );
                    }
                }
                return matrix[al][bl];
            };

            const getMatchScore = (item) => {
                let score = 0;
                const q = (item.question || '').toLowerCase();
                // keyword matches
                if (Array.isArray(item.keywords)) {
                    item.keywords.forEach(k => {
                        if (normalized.includes(k)) score += 2;
                    });
                }
                // token overlap with question text
                tokens.forEach(t => { if (q.includes(t)) score += 1; });
                // fuzzy similarity between user query and stored question
                const qnorm = q.replace(/[^a-z0-9\s]/g, ' ').replace(/\s+/g, ' ').trim();
                if (qnorm.length > 0) {
                    const dist = levenshtein(normalized, qnorm);
                    const maxLen = Math.max(normalized.length, qnorm.length);
                    const similarity = maxLen > 0 ? (1 - dist / maxLen) : 0;
                    score += Math.round(similarity * 3);
                }
                return score;
            };

            const bestMatch = combinedFaq.reduce((best, item) => {
                const score = getMatchScore(item);
                if (score > best.score) {
                    return { item, score };
                }
                return best;
            }, { item: null, score: 0 });

            if (bestMatch.score >= 2) {
                return bestMatch.item.answer;
            }

            const contains = keywords => keywords.some(keyword => normalized.includes(keyword));

            if (contains(['training center', 'training centers', 'pilot training', 'flight school', 'pilot academy', 'aviation academy', 'pilot training center', 'training academy'])) {
                return 'In the UAE, key pilot training centers include UAE Aviation Academy (UAAA), Emirates Aviation University, CAE Oxford Aviation Academy – Dubai, Phoenix Aviation Academy, and Skyline University Aviation Academy. These centers offer integrated ATPL, modular CPL/IR training, and airline cadet pathways.';
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

        function saveKnowledge(question, answer) {
            try {
                const key = 'aviator_learned';
                const stored = JSON.parse(localStorage.getItem(key) || '[]');
                const list = Array.isArray(stored) ? stored : [];
                const q = (question || '').trim();
                const a = (answer || '').trim();
                if (!q || !a) return;
                // avoid exact duplicates
                if (!list.some(item => item.question === q && item.answer === a)) {
                    list.push({ question: q, answer: a, keywords: q.toLowerCase().split(/\s+/).slice(0,8) });
                    localStorage.setItem(key, JSON.stringify(list));
                    appendMessage('Saved this helpful answer to local memory.', 'bot');
                } else {
                    appendMessage('This answer is already saved.', 'bot');
                }
            } catch (e) {
                console.warn('Failed to save knowledge', e);
            }
        }

        function sendMessage() {
            const text = input.value.trim();
            if (!text) return;
            lastUserQuestion = text;
            appendMessage(text, 'user');
            input.value = '';
            setTimeout(function() {
                appendMessage(getResponse(text), 'bot', { showSave: true });
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