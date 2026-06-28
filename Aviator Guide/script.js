// Security utilities
function sanitizeForDisplay(input) {
    if (typeof input !== 'string') return '';
    return input
        .replace(/&/g, '&')
        .replace(/</g, '<')
        .replace(/>/g, '>')
        .replace(/"/g, '"')
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

// Wait for page to load
document.addEventListener('DOMContentLoaded', function() {
    // ====== NAVIGATION ======
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

    // ====== CHATBOT AI ENGINE ======

    // ----- TF-IDF Vector Space Model -----
    class TfidfVectorizer {
        constructor() {
            this.documents = [];
            this.vocabulary = {};
            this.vocabSize = 0;
            this.idfCache = null;
        }

        tokenize(text) {
            return text.toLowerCase()
                .replace(/[^a-z0-9\s]/g, ' ')
                .replace(/\s+/g, ' ')
                .trim()
                .split(' ')
                .filter(t => t.length > 1 && !STOP_WORDS.has(t));
        }

        fit(documents) {
            this.documents = documents.map(d => this.tokenize(d));
            const df = {}; // document frequency
            this.documents.forEach(tokens => {
                const seen = new Set();
                tokens.forEach(t => {
                    if (!seen.has(t)) {
                        df[t] = (df[t] || 0) + 1;
                        seen.add(t);
                    }
                    if (!(t in this.vocabulary)) {
                        this.vocabulary[t] = this.vocabSize++;
                    }
                });
            });
            const N = this.documents.length;
            this.idfCache = {};
            for (const [term, freq] of Object.entries(df)) {
                this.idfCache[term] = Math.log((N + 1) / (freq + 1)) + 1;
            }
        }

        transform(text) {
            const tokens = this.tokenize(text);
            const vec = new Array(this.vocabSize).fill(0);
            const tf = {};
            tokens.forEach(t => { tf[t] = (tf[t] || 0) + 1; });
            const maxTf = Math.max(...Object.values(tf), 1);
            for (const [term, count] of Object.entries(tf)) {
                const idx = this.vocabulary[term];
                if (idx !== undefined) {
                    const tfNorm = 0.5 + (0.5 * count / maxTf);
                    const idf = this.idfCache[term] || Math.log((this.documents.length + 1) / 2) + 1;
                    vec[idx] = tfNorm * idf;
                }
            }
            return vec;
        }

        cosineSimilarity(vecA, vecB) {
            let dot = 0, normA = 0, normB = 0;
            for (let i = 0; i < this.vocabSize; i++) {
                dot += vecA[i] * vecB[i];
                normA += vecA[i] * vecA[i];
                normB += vecB[i] * vecB[i];
            }
            if (normA === 0 || normB === 0) return 0;
            return dot / (Math.sqrt(normA) * Math.sqrt(normB));
        }
    }

    const STOP_WORDS = new Set([
        'the','a','an','and','or','but','in','on','at','to','for','of','by','with','from','as',
        'is','was','are','were','be','been','being','have','has','had','do','does','did','will',
        'would','could','should','may','might','shall','can','need','dare','used','ought',
        'i','me','my','myself','we','our','ours','ourselves','you','your','yours','yourself',
        'he','him','his','himself','she','her','hers','herself','it','its','itself','they',
        'them','their','theirs','themselves','this','that','these','those','what','which','who',
        'whom','this','that','these','those','am','if','then','else','when','where','why',
        'how','all','each','every','both','few','more','most','some','any','no','not','only',
        'own','same','so','than','too','very','just','about','also','now','here','there',
        'get','got','gets','make','made','makes','take','took','takes','like','said','well',
        'back','even','still','much','many','really','already','please','tell','does','doing'
    ]);

    // ----- Full FAQ Dataset (80+ entries covering all pages) -----
    const FAQ = [
        // === SUBJECTS (page1) ===
        {
            question: 'What subjects should I take if I want to become a pilot?',
            answer: 'Mathematics, Physics, English, Geography, and Chemistry are useful subjects because they develop skills needed for navigation, communication, and understanding aircraft systems.',
            tags: ['subjects', 'required subjects', 'school subjects', 'academic subjects', 'study', 'high school']
        },
        {
            question: 'Is mathematics important for pilots?',
            answer: 'Yes. Mathematics helps pilots with navigation, fuel calculations, flight planning, and problem-solving.',
            tags: ['mathematics', 'math', 'important', 'maths']
        },
        {
            question: 'Why do pilots need physics?',
            answer: 'Physics explains how aircraft fly through concepts such as lift, thrust, drag, and gravity.',
            tags: ['physics', 'aerodynamics', 'lift', 'thrust', 'drag', 'gravity']
        },
        {
            question: 'Do I need chemistry to become a pilot?',
            answer: 'Chemistry is not always required, but it helps pilots understand fuel, combustion, and aircraft materials.',
            tags: ['chemistry', 'fuel', 'combustion', 'materials']
        },
        {
            question: 'Is geography useful for pilots?',
            answer: 'Yes. Geography helps pilots understand maps, weather patterns, time zones, and global routes.',
            tags: ['geography', 'maps', 'weather', 'time zones', 'routes']
        },
        {
            question: 'Is English important for pilots?',
            answer: 'Yes. English is the international language of aviation and is used for communication with air traffic control. ICAO Level 4 English proficiency is mandatory for all pilots.',
            tags: ['english', 'communication', 'air traffic control', 'icao', 'language']
        },
        {
            question: 'Do airlines care about my high school grades?',
            answer: 'Airlines mainly focus on your licenses, training, and skills, but strong grades can help when applying for flight schools and universities.',
            tags: ['high school', 'grades', 'marks', 'academic record', 'importance']
        },
        {
            question: 'What is the minimum grade required to become a pilot?',
            answer: 'Requirements vary by academy, but most flight schools expect satisfactory grades in Mathematics, English, and Science.',
            tags: ['minimum grade', 'grade required', 'requirements', 'passing']
        },
        {
            question: 'Which IB subjects should I choose for aviation?',
            answer: 'For IB, choose Mathematics, Physics, and English — these subjects are highly recommended for aviation careers.',
            tags: ['ib subjects', 'ib', 'international baccalaureate', 'diploma']
        },
        {
            question: 'Can I become a pilot without studying physics?',
            answer: 'Yes, you can become a pilot without studying physics, but studying physics provides a strong advantage during flight training.',
            tags: ['without physics', 'no physics', 'alternative subjects']
        },
        {
            question: 'What school qualifications do airlines prefer?',
            answer: 'Airlines prefer applicants who have completed secondary education and professional flight training.',
            tags: ['school qualifications', 'airlines prefer', 'secondary education']
        },
        {
            question: 'Which subject is most important for aspiring pilots?',
            answer: 'Mathematics and Physics are often considered the most important subjects for aspiring pilots because they support many aviation concepts.',
            tags: ['most important', 'important subject', 'key subject']
        },
        {
            question: 'What skills should I develop while in school?',
            answer: 'Develop communication, teamwork, problem-solving, leadership, and time management while in school.',
            tags: ['skills', 'soft skills', 'development', 'extracurricular']
        },
        {
            question: 'Are extracurricular activities important for pilot applications?',
            answer: 'Yes. Activities demonstrating teamwork, leadership, and responsibility can strengthen pilot applications.',
            tags: ['extracurricular', 'activities', 'clubs', 'sports', 'volunteering']
        },

        // === LICENSES & MEDICAL (page1) ===
        {
            question: 'What licenses do I need to become a pilot?',
            answer: 'Most pilots progress through: Class 1 Medical Certificate → SPL (Student Pilot License) → PPL (Private Pilot License) → IR (Instrument Rating) → CPL (Commercial Pilot License) → Multi-Engine Rating → ATPL (Airline Transport Pilot License) → Type Rating. The full path from zero to airline pilot typically takes 3-6 years.',
            tags: ['licenses', 'progress', 'pathway', 'certification', 'ratings']
        },
        {
            question: 'What is a Class 1 Medical Certificate?',
            answer: 'It confirms that you meet the medical standards required for commercial aviation. It includes cardiovascular, vision, hearing, neurological, and psychological evaluations. Valid for 12 months (under 40) or 6 months (over 40).',
            tags: ['class 1 medical', 'medical certificate', 'medical exam', 'health']
        },
        {
            question: 'What is a Student Pilot License (SPL)?',
            answer: 'It allows you to begin official flight training and perform supervised solo flights. You need to be at least 16 years old and hold a Class 1 or Class 2 Medical Certificate.',
            tags: ['student pilot license', 'spl', 'student license', 'beginner']
        },
        {
            question: 'What is a Private Pilot License (PPL)?',
            answer: 'It allows you to fly aircraft privately but not for payment. Requires minimum 40 hours of flight time. It is the first step for many aspiring pilots and opens the door to advanced training.',
            tags: ['private pilot license', 'ppl', 'private', 'recreational flying']
        },
        {
            question: 'What is a Commercial Pilot License (CPL)?',
            answer: 'Required to fly for hire or reward. Minimum 250 hours total flight time. Includes advanced instrument flying and multi-engine ratings. Opens doors to charter operations and flight instruction.',
            tags: ['commercial pilot license', 'cpl', 'commercial', 'professional flying']
        },
        {
            question: 'What is an Airline Transport Pilot License (ATPL)?',
            answer: 'The highest level of aircraft pilot license. Required to captain commercial airliners. Minimum 1500 hours flight time (reduced to 500-750 hours through integrated programs). Includes comprehensive theoretical knowledge exams in 14 subjects.',
            tags: ['airline transport pilot license', 'atpl', 'frozen atpl', 'highest license']
        },
        {
            question: 'What is an Instrument Rating (IR)?',
            answer: 'It allows pilots to fly using aircraft instruments in poor weather or low-visibility conditions. Essential for commercial operations and required for CPL and ATPL.',
            tags: ['instrument rating', 'ir', 'instrument flying', 'poor weather']
        },
        {
            question: 'What are Type Ratings?',
            answer: 'After obtaining your ATPL, you need specific type ratings for the aircraft you will fly. Airlines typically sponsor this training for new hires. Common types include Boeing 737, 777, 787 and Airbus A320, A330, A350, A380.',
            tags: ['type rating', 'aircraft type', 'boeing', 'airbus', 'sponsored training']
        },
        {
            question: 'What medical requirements do pilots need?',
            answer: 'All pilots must maintain valid medical certificates. UAE requires Class 1 Medical for commercial operations: valid 12 months (under 40) / 6 months (over 40). Includes cardiovascular exam, vision testing, hearing assessment, neurological evaluation, and drug/alcohol screening.',
            tags: ['medical', 'health', 'vision', 'hearing', 'physical', 'medical standards']
        },

        // === DEGREES & UNIVERSITY (page1) ===
        {
            question: 'Do I need a degree to become a pilot?',
            answer: 'No. A degree is not always required, but it can improve career opportunities and provide a backup career option if you become medically unfit to fly.',
            tags: ['degree', 'university', 'education', 'mandatory', 'optional']
        },
        {
            question: 'Which degree is best for aspiring pilots?',
            answer: 'Aeronautical Engineering, Aerospace Engineering, Aviation Management, and Aviation Science are popular choices that complement a pilot career.',
            tags: ['best degree', 'recommended degree', 'aviation degree', 'popular choices']
        },
        {
            question: 'Is aeronautical engineering a good degree for pilots?',
            answer: 'Yes. It provides knowledge of aircraft systems and offers an alternative career path if you become medically unfit to fly. It is often the top recommendation for aspiring pilots.',
            tags: ['aeronautical engineering', 'engineer', 'backup', 'fallback']
        },
        {
            question: 'Should I study aviation or engineering?',
            answer: 'Both are valuable. Aviation focuses on pilot training, while engineering provides technical knowledge and broader career options. Many successful pilots have engineering backgrounds.',
            tags: ['aviation vs engineering', 'which pathway', 'comparison']
        },
        {
            question: 'What are the benefits of an aviation degree?',
            answer: 'It develops aviation knowledge, industry awareness, and can improve employment opportunities with airlines.',
            tags: ['benefits', 'aviation degree', 'advantages', 'career boost']
        },
        {
            question: 'Can I become a pilot without going to university?',
            answer: 'Yes. Many pilots enter flight schools directly after secondary education. University is optional but recommended as a backup.',
            tags: ['without university', 'no university', 'direct path', 'flight school only']
        },
        {
            question: 'What degree should I choose as a backup career?',
            answer: 'Aeronautical Engineering is often recommended because it remains closely connected to aviation. Other options include Aerospace Engineering, Mechanical Engineering, or Aviation Management.',
            tags: ['backup degree', 'backup career', 'plan b', 'alternative career']
        },
        {
            question: 'Can I work in aviation if I stop flying?',
            answer: 'Yes. Pilots can move into management, training, engineering, safety, or aviation operations roles within the industry.',
            tags: ['stop flying', 'career change', 'alternative roles', 'aviation jobs']
        },
        {
            question: 'What university requirements are needed for aviation courses?',
            answer: 'Requirements vary, but Mathematics, Physics, and English are commonly required for aviation-related university programs.',
            tags: ['university requirements', 'entry requirements', 'admission']
        },
        {
            question: 'What engineering degrees help pilots?',
            answer: 'Aeronautical Engineering, Aerospace Engineering, Mechanical Engineering, and Electrical Engineering are useful options that provide strong technical foundations.',
            tags: ['engineering', 'mechanical', 'electrical', 'technical degree']
        },

        // === TRAINING CENTERS (page2) ===
        {
            question: 'What are the best pilot training centers in the UAE?',
            answer: 'Top training centers include: UAE Aviation Academy (UAAA) in Sharjah, Emirates Aviation University in Dubai, CAE Oxford Aviation Academy at Al Maktoum Airport (DWC), Phoenix Aviation Academy in Ras Al Khaimah, and Skyline University Aviation Academy in Sharjah.',
            tags: ['training centers', 'flight schools', 'aviation academies', 'best schools', 'top rated']
        },
        {
            question: 'What is UAE Aviation Academy (UAAA)?',
            answer: 'Located at Sharjah International Airport, UAAA is one of the most prestigious flight schools in the Middle East. Offers integrated ATPL programs, modular training, and type ratings. Fleet includes Cessna 172, Piper Seminole, Diamond DA40/42.',
            tags: ['uaaa', 'uae aviation academy', 'sharjah', 'prestigious']
        },
        {
            question: 'What is Emirates Aviation University?',
            answer: 'Located in Dubai Academic City. Offers Bachelor of Science degrees in Aviation Management, Aeronautical Engineering, and Aviation Maintenance with integrated flight training. Provides a direct pathway to Emirates Airlines careers.',
            tags: ['emirates aviation university', 'emirates', 'dubai academic city', 'degree programs']
        },
        {
            question: 'What is CAE Oxford Aviation Academy?',
            answer: 'Located at Al Maktoum International Airport (DWC). Part of the global CAE network, one of the world\'s largest aviation training providers. Offers integrated ATPL, modular CPL/IR, MCC/JOC courses, and type ratings.',
            tags: ['cae oxford', 'cae', 'al maktoum', 'dwc', 'global network']
        },
        {
            question: 'What is Phoenix Aviation Academy?',
            answer: 'Located at Ras Al Khaimah International Airport. Specializes in professional pilot training, airline cadet programs, and helicopter training. Known for personalized training with smaller class sizes.',
            tags: ['phoenix aviation', 'ras al khaimah', 'helicopter training', 'small classes']
        },
        {
            question: 'What is Skyline University Aviation Academy?',
            answer: 'Located at Sharjah Airport. Offers commercial pilot training, private pilot licenses, and aviation management degrees. Known for academic excellence combined with practical flight experience.',
            tags: ['skyline', 'sharjah airport', 'academic excellence', 'practical training']
        },
        {
            question: 'How much does pilot training cost in the UAE?',
            answer: 'Estimated costs: PPL AED 35,000-50,000, CPL AED 180,000-250,000, Integrated ATPL AED 400,000-650,000, Type Rating AED 80,000-150,000, Bachelor Degree AED 120,000-200,000/year. Cadet programs often available with airline sponsorship.',
            tags: ['cost', 'fees', 'tuition', 'price', 'expenses', 'training cost']
        },
        {
            question: 'What are the admission requirements for flight training?',
            answer: 'High school diploma with Mathematics and Physics, minimum age 17 for PPL / 18 for CPL, Class 1 Medical Certificate, ICAO English Level 4 or higher, pass entrance exams (math, physics, aptitude), and personal interview.',
            tags: ['admission', 'entry requirements', 'eligibility', 'prerequisites']
        },
        {
            question: 'What training facilities and simulators are available in the UAE?',
            answer: 'UAE training centers feature Level D Full Flight Simulators for Boeing 777, 787, Airbus A380, A350; FNPT II and FTD trainers for instrument procedures; and VR systems for cockpit familiarization and emergency procedures.',
            tags: ['simulators', 'facilities', 'equipment', 'training devices', 'vr']
        },

        // === AEROSPACE ENGINEERING COLLEGES (page2) ===
        {
            question: 'Which universities in the UAE offer aerospace engineering?',
            answer: 'Top institutions include: Khalifa University (Abu Dhabi) offering BSc, MSc, and PhD in Aerospace Engineering; American University of Sharjah (AUS) with mechanical engineering with aerospace concentration; Mohamed Bin Zayed University of AI focusing on AI in aerospace; and Abu Dhabi Polytechnic with practical aerospace engineering technology.',
            tags: ['aerospace engineering', 'engineering colleges', 'universities', 'khalifa university', 'aus']
        },
        {
            question: 'What does Khalifa University offer for aerospace?',
            answer: 'Khalifa University is the top engineering university in UAE/Middle East. Offers BSc, MSc, and PhD in Aerospace Engineering with specializations in aerodynamics, propulsion, structures, space systems, and UAVs. Has state-of-the-art wind tunnels and satellite programs.',
            tags: ['khalifa university', 'abu dhabi', 'aerospace', 'top ranked', 'phd']
        },
        {
            question: 'What does American University of Sharjah offer?',
            answer: 'AUS offers BS in Mechanical Engineering with aerospace concentration and MS in Mechanical Engineering. Facilities include aerodynamics laboratory, propulsion systems lab, and materials testing facilities. Partnerships with STRATA Manufacturing, Airbus, and Boeing.',
            tags: ['aus', 'american university of sharjah', 'mechanical engineering', 'aerospace concentration']
        },
        {
            question: 'What does Mohamed Bin Zayed University of AI offer?',
            answer: 'MBZUAI focuses on AI applications in aerospace and autonomous systems. Offers MS and PhD in Machine Learning and Computer Vision relevant to aerospace. Applications include autonomous drones, satellite imagery analysis, and AI for air traffic management.',
            tags: ['mbzua', 'ai', 'artificial intelligence', 'autonomous systems', 'drones']
        },
        {
            question: 'What does Abu Dhabi Polytechnic offer?',
            answer: 'Offers Bachelor of Engineering Technology in Aerospace with hands-on training. Prepares students for careers as aircraft maintenance engineers, manufacturing specialists, and quality control professionals. Partners with Etihad Airways Engineering, Strata, Mubadala Aerospace.',
            tags: ['abu dhabi polytechnic', 'hct', 'engineering technology', 'maintenance', 'practical']
        },

        // === AIRLINE CADET PROGRAMS (page2) ===
        {
            question: 'What airline cadet programs are available in the UAE?',
            answer: 'Major programs: Emirates Airlines Cadet Program (sponsored training with guaranteed employment upon qualification), Etihad Airways Future Pilot Program (comprehensive training with mentorship), and Air Arabia Pilot Development (training partnerships with regional flight schools).',
            tags: ['cadet programs', 'sponsored training', 'emirates cadet', 'etihad future pilot', 'air arabia']
        },
        {
            question: 'How do I get into Emirates Airlines as a pilot?',
            answer: 'Apply for the Emirates Cadet Program which covers training costs in exchange for a service commitment. Alternatively, gain experience with other airlines and apply as a direct entry First Officer. Emirates requires ATPL frozen, type rating, and strong CRM skills.',
            tags: ['emirates', 'emirates airline', 'cadet', 'dubai', 'recruitment']
        },
        {
            question: 'How do I get into Etihad Airways as a pilot?',
            answer: 'Apply for the Etihad Future Pilot Program which provides a structured training pathway with mentorship and direct line to employment. Etihad also hires experienced First Officers and Captains from other airlines.',
            tags: ['etihad', 'etihad airways', 'abu dhabi', 'future pilot program']
        },
        {
            question: 'How do I get into flydubai as a pilot?',
            answer: 'flydubai hires through their pilot recruitment programs and also partners with training academies. They operate a Boeing 737 fleet and offer competitive packages. Check their careers page for current openings.',
            tags: ['flydubai', 'dubai', 'boeing 737', 'recruitment']
        },
        {
            question: 'What is the career progression at UAE airlines?',
            answer: 'Typical progression: First Officer (2-5 years) → Senior First Officer → Captain (Narrow Body) → Captain (Wide Body) → Check Captain / Instructor. Promotion depends on flight hours, performance, and seniority.',
            tags: ['career progression', 'promotion', 'first officer', 'captain', 'seniority']
        },

        // === SALARY & COMPENSATION (page3) ===
        {
            question: 'What is the salary of a pilot in the UAE?',
            answer: 'Monthly salaries (AED): Entry First Officer AED 28,000-42,000, Senior First Officer AED 48,000-65,000, Narrow-Body Captain AED 85,000-120,000, Wide-Body Captain AED 110,000-165,000+, Check Captain/Instructor AED 95,000-140,000. Figures include base salary plus allowances.',
            tags: ['salary', 'pay', 'income', 'earnings', 'compensation', 'aed']
        },
        {
            question: 'What benefits do UAE airline pilots receive?',
            answer: 'Comprehensive benefits include: housing allowance or company accommodation, transportation allowance, medical insurance for pilot and family, 42-60 days annual leave, education allowance for children (up to AED 150,000/year), end-of-service gratuity (15-20% of basic salary/year), travel concessions, and pension plans.',
            tags: ['benefits', 'perks', 'housing', 'education allowance', 'insurance', 'leave']
        },
        {
            question: 'How much does a First Officer earn in the UAE?',
            answer: 'Entry level First Officers earn AED 28,000-42,000 per month. Senior First Officers with more experience earn AED 48,000-65,000 per month. These figures include base salary and various allowances.',
            tags: ['first officer salary', 'first officer pay', 'entry level salary', 'junior pilot']
        },
        {
            question: 'How much does an airline Captain earn in the UAE?',
            answer: 'Captains on narrow-body aircraft (e.g., Boeing 737, Airbus A320) earn AED 85,000-120,000/month. Wide-body Captains (e.g., A380, B777, B787) earn AED 110,000-165,000+/month. Check Captains/Instructors earn AED 95,000-140,000/month.',
            tags: ['captain salary', 'captain pay', 'narrow body', 'wide body', 'senior captain']
        },

        // === ADVICE & RESOURCES (page3) ===
        {
            question: 'What advice do experienced pilots give to beginners?',
            answer: 'Captain Sarah Al-Maktoum (Emirates A380): "The most important quality is sound judgment and calm decision-making under pressure." FO James Thompson (Etihad): "Build flight hours wisely and network relentlessly." Captain Ahmed Rashid (flydubai): "Treat every sim session like a line check — master CRM, technical skills get you hired, CRM keeps you flying."',
            tags: ['advice', 'pilot advice', 'experienced pilots', 'tips', 'real pilots']
        },
        {
            question: 'What study materials are recommended for pilot training?',
            answer: 'Books: Jeppesen Private Pilot Manual, Air Pilot\'s Manual series (comprehensive ATPL theory), FAA Aviation Weather, Stick and Rudder (aerodynamics), EASA/JAR-OPS regulations. Online: ATPLGS.com, AviationExam.com, Skybrary, PilotWorkshops.com.',
            tags: ['study materials', 'books', 'textbooks', 'online resources', 'exam prep']
        },
        {
            question: 'What mobile apps are useful for pilots?',
            answer: 'Recommended apps: ForeFlight (flight planning and weather), CloudAhoy (debriefing and flight analysis), AviationCalculator (weight and balance), AirNav (airport information).',
            tags: ['apps', 'mobile apps', 'software', 'foreflight', 'flight planning']
        },
        {
            question: 'What professional organizations should pilots join?',
            answer: 'Key organizations: UAE General Aviation Association (local networking), International Federation of Air Line Pilots\' Associations (global representation), Women in Aviation International (diversity and support), and mentorship programs through training academies.',
            tags: ['organizations', 'professional bodies', 'networking', 'associations']
        },
        {
            question: 'What does a pilot training timeline look like?',
            answer: 'Year 1-2: Foundation (PPL, CPL/IR theory, 150-250 flight hours, networking). Year 2-4: Qualification (ATPL theory, frozen ATPL, 1000-1500 hours, type rating). Year 4-6: First Officer (regional jets, build 5000+ hours, line training, captain upgrade preparation).',
            tags: ['timeline', 'schedule', 'milestones', 'years', 'progression path']
        },
        {
            question: 'What are common mistakes aspiring pilots should avoid?',
            answer: 'Common pitfalls: rushing training (creates knowledge gaps), neglecting theory (failing ATPL written exams), ignoring CRM skills (key for hiring and safety), poor financial planning (training costs 400k-650k AED), weak English (aim for ICAO Level 5 or 6), and isolation (build your network from day one).',
            tags: ['mistakes', 'pitfalls', 'errors', 'warnings', 'things to avoid']
        },
        {
            question: 'How should I prepare mentally for a pilot career?',
            answer: 'Piloting is a lifestyle requiring: physical fitness (regular exercise maintains G-tolerance, medical exams every 6-12 months), fatigue management (learn fatigue patterns, sleep hygiene is non-negotiable), and work-life balance (missing holidays is normal early on, strong family support is essential).',
            tags: ['mental preparation', 'lifestyle', 'fitness', 'fatigue', 'work life balance', 'health']
        },
        {
            question: 'Is piloting a good career choice?',
            answer: 'Pilots earn well with stable careers and international opportunities. Irregular schedules and pressure are challenges. Benefits include high pay, education sponsorship, travel, and prestige. Professionalism is essential. The UAE has strong demand for pilots with major airlines based here.',
            tags: ['career choice', 'pros and cons', 'good career', 'worth it', 'job satisfaction']
        },
        {
            question: 'How competitive is the pilot profession?',
            answer: 'Piloting is competitive but rewarding. Key skills: discipline, problem-solving, communication, decision-making. For interviews: research airlines, practice ICAO English, show CRM understanding. Gain airport/aviation club experience to stand out.',
            tags: ['competitive', 'job market', 'difficulty', 'challenging', 'getting hired']
        },

        // === HOME PAGE CONTENT ===
        {
            question: 'Why should I train in the UAE?',
            answer: 'The UAE is a global aviation leader with Dubai and Abu Dhabi International Airports as major hubs. Advantages: state-of-the-art simulators, experienced international instructors, exposure to diverse flying conditions, strong connections with major airlines (Emirates, Etihad, flydubai), and growing demand for pilots.',
            tags: ['uae advantage', 'why uae', 'train in uae', 'aviation hub', 'benefits uae']
        },
        {
            question: 'What is the Aviator Guide website about?',
            answer: 'This Aviator Guide website helps aspiring pilots in the UAE by providing clear, reliable information on: the subjects, degrees, and licenses required; highly rated aviation academies and aerospace engineering colleges; strong UAE-based airlines to begin your career with; and resources and advice from real pilots.',
            tags: ['about', 'website purpose', 'aviator guide', 'what is this', 'site info']
        },

        // === CONTACT ===
        {
            question: 'How can I contact the Aviator Guide team?',
            answer: 'You can contact the team by email at rishik.patil78@gmail.com or by phone at +971 4 XXX XXXX. The office is located in Dubai Aviation Hub, Building B, Level 3, Dubai, UAE. Office hours are Sunday to Thursday, 9am-6pm GST. Friday-Saturday closed, emergency inquiries via email.',
            tags: ['contact', 'email', 'phone', 'address', 'office hours', 'reach us']
        },
        {
            question: 'What are the office hours for Aviator Guide?',
            answer: 'Sunday to Wednesday: 9:00 AM - 6:00 PM GST. Thursday: 9:00 AM - 5:00 PM GST (early close during Ramadan). Friday - Saturday: Closed (weekend, emergency inquiries via email).',
            tags: ['office hours', 'business hours', 'timing', 'schedule', 'working hours']
        },

        // === GENERAL ===
        {
            question: 'How do I become a pilot in the UAE?',
            answer: 'Step 1: Excel in school (focus on maths, physics, English). Step 2: Obtain Class 1 Medical Certificate. Step 3: Choose a training academy (UAAA, Emirates Aviation University, CAE Oxford). Step 4: Complete an integrated ATPL program (18-24 months). Step 5: Build flight hours. Step 6: Obtain Type Rating. Step 7: Apply to airlines. Total time: 3-6 years from start.',
            tags: ['become a pilot', 'how to become', 'steps', 'pathway', 'guide', 'starting']
        },
        {
            question: 'Can I become a pilot if I struggle with mathematics?',
            answer: 'Yes. Many successful pilots improve their mathematical skills through practice and training. Focus on the specific math needed for navigation and flight planning.',
            tags: ['struggle with math', 'weak math', 'difficult math', 'improve math']
        },
        {
            question: 'What is the demand for pilots in the UAE?',
            answer: 'Strong and growing. Emirates, Etihad, and flydubai regularly hire pilots. The UAE\'s aviation sector continues to grow rapidly, creating strong demand for qualified pilots both locally and internationally. Cadet programs offer structured entry pathways.',
            tags: ['demand', 'job prospects', 'hiring', 'growth', 'future']
        },
        {
            question: 'How long does it take to become an airline pilot?',
            answer: 'Integrated ATPL program: 18-24 months for training. Then building hours to 1500 for unfrozen ATPL (varies by pathway). Total from zero to airline First Officer: typically 3-6 years. Captain upgrade: additional 5-10 years.',
            tags: ['how long', 'duration', 'time required', 'years to become']
        },
        {
            question: 'What is the difference between integrated and modular training?',
            answer: 'Integrated ATPL is a comprehensive course combining theory and flight training (18-24 months), no prior experience required, ends with frozen ATPL. Modular training is broken into separate modules offering flexibility and allowing you to work while training, popular with career changers.',
            tags: ['integrated vs modular', 'training types', 'flexible training', 'full time vs part time']
        },
        {
            question: 'Is there financial aid or sponsorship for pilot training?',
            answer: 'Yes. Cadet programs from Emirates and Etihad cover training costs in exchange for a service commitment (typically 5 years). Some academies offer payment plans. Check with individual institutions for scholarship opportunities.',
            tags: ['financial aid', 'sponsorship', 'scholarships', 'funding', 'payment plans', 'cadet sponsorship']
        },
        {
            question: 'What are the physical fitness requirements for pilots?',
            answer: 'Regular exercise maintains G-tolerance and alertness. Commercial pilots undergo medical exams every 6-12 months. Cardiovascular health is paramount. Vision must be correctable to 20/20, and hearing within normal limits.',
            tags: ['fitness', 'physical', 'exercise', 'g-tolerance', 'vision', 'cardiovascular']
        },
        {
            question: 'Can international students train in the UAE?',
            answer: 'Yes. UAE flight academies accept international students. You will need a student visa, which most academies assist with. Training is conducted in English. ICAO English Level 4 minimum is required.',
            tags: ['international students', 'foreign', 'student visa', 'overseas']
        }
    ];

    // ====== CHATBOT RESPONSE RULES ======

    const GENERAL_KNOWLEDGE_CATEGORIES = [
        'govern', 'politics', 'sports', 'celebrity', 'entertain', 'movie', 'film', 'music', 'song', 'artist',
        'history', 'war', 'president', 'prime minister', 'country', 'nation', 'border', 'flag', 'capital',
        'religion', 'god', 'atheist', 'christian', 'muslim', 'hindu', 'buddhist', 'jewish', 'islam'
    ];

    const ENTERTAINMENT_REQUESTS = [
        { patterns: ['joke', 'funny', 'humor', 'laugh'], response: 'I\'m designed to provide pilot career guidance. Feel free to ask me anything about becoming a pilot or the aviation industry.' },
        { patterns: ['story', 'tale', 'scary', 'adventure'], response: 'My purpose is to help users learn about aviation. I\'d be happy to answer any aviation-related questions instead.' },
        { patterns: ['game', 'play', 'puzzle', 'quiz'], response: 'I\'m designed to provide aviation information. I can\'t play games, but I can answer questions about pilot training and careers.' }
    ];

    const ILLEGAL_KEYWORDS = ['hijack', 'bomb', 'crash', 'destroy', 'attack', 'security', 'bypass', 'illegal', 'steal', 'weapon'];

    const OUT_OF_SCOPE_KEYWORDS = ['poem', 'minecraft', 'cook', 'recipe', 'garden', 'clean', 'repair', 'fix', 'build house'];
    
    // Initialize TF-IDF vectorizer
    const vectorizer = new TfidfVectorizer();
    const faqQuestions = FAQ.map(f => f.question + ' ' + (f.tags || []).join(' '));
    vectorizer.fit(faqQuestions);
    const faqVectors = faqQuestions.map(q => vectorizer.transform(q));

    // Conversation memory
    let conversationHistory = []; // [{ role, text }] last 4 turns
    let lastTopic = '';

    function addToHistory(role, text) {
        conversationHistory.push({ role, text });
        if (conversationHistory.length > 4) conversationHistory.shift();
        // Extract last topic (the FAQ that matched)
        if (role === 'bot') {
            lastTopic = text;
        }
    }

    function getResponse(userText) {
        const normalized = userText.toLowerCase().replace(/[^a-z0-9\s]/g, ' ').replace(/\s+/g, ' ').trim();
        const tokens = normalized.split(' ').filter(Boolean);
        
        // Check for illegal/dangerous requests first (highest priority)
        for (const keyword of ILLEGAL_KEYWORDS) {
            if (normalized.includes(keyword)) {
                return 'I can\'t help with harmful or illegal activities. If you\'d like to learn about aviation safety or pilot training, I\'d be happy to help.';
            }
        }

        // Check for entertainment requests
        for (const ent of ENTERTAINMENT_REQUESTS) {
            if (ent.patterns.some(p => normalized.includes(p))) {
                return ent.response;
            }
        }

        // Check for out-of-scope requests
        for (const keyword of OUT_OF_SCOPE_KEYWORDS) {
            if (normalized.includes(keyword)) {
                return 'I\'m designed specifically to provide guidance about becoming a pilot and aviation careers. Please ask me an aviation-related question.';
            }
        }

        // Check for general knowledge questions
        for (const cat of GENERAL_KNOWLEDGE_CATEGORIES) {
            if (normalized.includes(cat)) {
                return 'I\'m designed specifically to provide information about becoming a pilot and aviation careers. Please ask me a question related to aviation.';
            }
        }

        // Check for personal statements (non-aviation related)
        const personalStatementPatterns = [
            'i am', 'i\'m', 'i like', 'i love', 'my favorite', 'my hobby', 'from india', 'from pakistan', 'from uk', 'from usa',
            'gay', 'straight', 'football', 'cricket', 'music', 'movie', 'actor', 'actress'
        ];
        if (personalStatementPatterns.some(p => normalized.includes(p)) && tokens.length < 12) {
            return 'My purpose is to provide guidance about becoming a pilot and aviation careers. Feel free to ask me any aviation-related questions.';
        }

        // Check for greetings
        const greetingPatterns = ['hello', 'hi', 'hey', 'greetings', 'good morning', 'good evening', 'howdy'];
        if (greetingPatterns.some(p => normalized.includes(p))) {
            return 'Hello! Welcome to the Pilot Career Guide chatbot. I can help you with pilot licenses, flight schools, aviation degrees, airline careers, salaries, and becoming a pilot.';
        }

        // Check for thanks
        const thanksPatterns = ['thanks', 'thank you', 'thankyou', 'appreciate', 'gratitude'];
        if (thanksPatterns.some(p => normalized.includes(p))) {
            return 'You\'re welcome! I\'m glad I could help. Feel free to ask if you have any more aviation questions.';
        }

        // Check for goodbye
        const goodbyePatterns = ['bye', 'goodbye', 'see you', 'see ya', 'farewell'];
        if (goodbyePatterns.some(p => normalized.includes(p))) {
            return 'Goodbye! Best of luck on your journey to becoming a pilot. Safe skies!';
        }
        
        if (!normalized || tokens.length === 0) {
            return 'Please type a question about the Aviator Guide website content. I can help with subjects, licenses, training centers, colleges, salaries, or career advice.';
        }

        // Load learned FAQ from localStorage
        let learned = [];
        try {
            learned = JSON.parse(localStorage.getItem('aviator_learned') || '[]');
            if (!Array.isArray(learned)) learned = [];
        } catch (e) {
            learned = [];
        }

        // 1. TF-IDF Cosine Similarity Matching (Primary)
        let bestScore = 0;
        let bestAnswer = null;
        let bestFaqItem = null;

        // Search through main FAQ
        const userVec = vectorizer.transform(normalized);
        for (let i = 0; i < faqVectors.length; i++) {
            const score = vectorizer.cosineSimilarity(userVec, faqVectors[i]);
            if (score > bestScore) {
                bestScore = score;
                bestAnswer = FAQ[i].answer;
                bestFaqItem = FAQ[i];
            }
        }

        // Also search through learned FAQ (use simpler keyword overlap for learned)
        for (const item of learned) {
            const combined = (item.question + ' ' + (item.keywords || []).join(' ')).toLowerCase();
            let score = 0;
            tokens.forEach(t => { if (combined.includes(t)) score += 1; });
            // Scale learned scores lower to prefer curated FAQ
            const simScore = score / Math.max(tokens.length, 1);
            if (simScore > 0.2) {
                const finalScore = simScore * 0.7; // weight learned lower
                if (finalScore > bestScore) {
                    bestScore = finalScore;
                    bestAnswer = item.answer;
                }
            }
        }

        // Thresholds: >0.3 is a confident match, >0.15 is possible, <0.15 is poor
        if (bestScore >= 0.3) {
            addToHistory('user', userText);
            addToHistory('bot', bestAnswer);
            return bestAnswer;
        }

        // 2. Handle conversational follow-ups (context from history)
        const lookForAlternatives = ['what about', 'what else', 'and', 'tell me more', 'more details', 'also', 'other', 'another', 'any other', 'explain more', 'elaborate'];
        const isFollowUp = lookForAlternatives.some(phrase => normalized.includes(phrase) || normalized === phrase);

        if (isFollowUp && lastTopic) {
            // Search history for what was discussed
            const historyContext = conversationHistory.map(h => h.text).join(' ');
            const contextVec = vectorizer.transform(historyContext);
            for (let i = 0; i < faqVectors.length; i++) {
                const score = vectorizer.cosineSimilarity(contextVec, faqVectors[i]);
                if (score > 0.15 && FAQ[i].answer !== lastTopic) {
                    addToHistory('user', userText);
                    addToHistory('bot', FAQ[i].answer);
                    return FAQ[i].answer;
                }
            }
        }

        // 3. Intent-based fallback with better matching than raw contains()
        const intentRules = [
            {
                name: 'greeting',
                patterns: ['hello', 'hi ', 'hey', 'greetings', 'good morning', 'good evening', 'howdy'],
                response: 'Hello! Welcome to the Pilot Career Guide chatbot. I can help you with pilot licenses, flight schools, aviation degrees, airline careers, salaries, and becoming a pilot.'
            },
            {
                name: 'thanks',
                patterns: ['thanks', 'thank you', 'thankyou', 'appreciate', 'gratitude'],
                response: 'You\'re welcome! I\'m glad I could help. Feel free to ask if you have any more aviation questions.'
            },
            {
                name: 'about_site',
                patterns: ['what is this website', 'about this site', 'website purpose', 'what can i learn', 'guide website about', 'tell me about this site', 'what can you help me with', 'i don\'t know where to start'],
                response: 'I can help you with pilot licenses, flight schools in the UAE, aviation degrees, pilot salaries, airline careers, medical requirements, and the steps to becoming a pilot.'
            },
            {
                name: 'subjects_general',
                patterns: ['what subjects', 'which subjects', 'subjects needed', 'required subjects', 'school subjects', 'academic subjects', 'what to study'],
                response: 'Key subjects for aspiring pilots: Mathematics (navigation, fuel calculations), Physics (aerodynamics, aircraft performance), and English (ICAO requirement, ATC communication). Recommended: Geography, Computer Science, and Meteorology.'
            },
            {
                name: 'medical_general',
                patterns: ['medical', 'health requirement', 'medical check', 'doctor', 'vision', 'eyesight', 'hearing'],
                response: 'All pilots must hold a Class 1 Medical Certificate. It includes: cardiovascular examination, vision testing (corrected to 20/20 acceptable), hearing assessment, neurological evaluation, and drug/alcohol screening. Valid 12 months (under 40) or 6 months (over 40).'
            },
            {
                name: 'training_general',
                patterns: ['training center', 'flight school', 'pilot academy', 'aviation academy', 'where to train', 'where can i learn', 'best academy'],
                response: 'Top UAE training centers: UAE Aviation Academy (Sharjah), Emirates Aviation University (Dubai), CAE Oxford Aviation Academy (Al Maktoum/DWC), Phoenix Aviation Academy (Ras Al Khaimah), and Skyline University (Sharjah). They offer integrated ATPL (18-24 months) with modern simulators and aircraft.'
            },
            {
                name: 'college_general',
                patterns: ['university', 'college', 'engineering college', 'aerospace college', 'where to study degree', 'bachelor'],
                response: 'Top UAE institutions: Khalifa University (Abu Dhabi) for Aerospace Engineering, American University of Sharjah, Mohamed Bin Zayed University of AI (AI in aerospace), and Abu Dhabi Polytechnic (practical aerospace technology). Programs from BSc to PhD level.'
            },
            {
                name: 'salary_general',
                patterns: ['salary', 'pay', 'income', 'earnings', 'how much do pilots', 'compensation', 'monthly salary', 'wages'],
                response: 'UAE pilot monthly salaries (AED): Entry First Officer: 28,000-42,000, Senior First Officer: 48,000-65,000, Narrow-Body Captain: 85,000-120,000, Wide-Body Captain: 110,000-165,000+. Benefits include housing, education allowance (up to 150k/year), medical insurance, 42-60 days leave, and end-of-service gratuity.'
            },
            {
                name: 'airline_general',
                patterns: ['which airline', 'best airline', 'top airline', 'airline career', 'emirates', 'etihad', 'flydubai', 'air arabia'],
                response: 'Major UAE airlines hiring pilots: Emirates (Dubai, largest A380/B777 fleet), Etihad Airways (Abu Dhabi), flydubai (Boeing 737), and Air Arabia (Sharjah, low-cost carrier). All offer cadet programs and direct entry pathways. High demand with structured career progression.'
            },
            {
                name: 'cost_general',
                patterns: ['cost', 'fee', 'price', 'expensive', 'how much does it cost', 'tuition'],
                response: 'Estimated training costs: PPL AED 35,000-50,000, CPL AED 180,000-250,000, Integrated ATPL AED 400,000-650,000, Type Rating AED 80,000-150,000. I can\'t provide financial assistance, but I can suggest scholarships, sponsorships, and funding opportunities that may help.'
            },
            {
                name: 'licenses_general',
                patterns: ['license', 'licence', 'certification', 'certificate', 'ppl', 'cpl', 'atpl', 'type rating'],
                response: 'Pilot license progression: SPL (Student) → PPL (Private, 40hrs) → IR (Instrument) → CPL (Commercial, 250hrs) → Multi-Engine → ATPL (Airline Transport, 1500hrs) → Type Rating (Boeing/Airbus). The full pathway takes 3-6 years.'
            },
            {
                name: 'degree_general',
                patterns: ['degree', 'bachelor', 'graduate', 'undergraduate', 'masters', 'university program'],
                response: 'While not mandatory, recommended degrees: Aeronautical Engineering, Aerospace Engineering, Aviation Management, or Aviation Science. A degree provides a backup career if medically unfit to fly. Many universities prefer Mathematics and Physics for entry.'
            },
            {
                name: 'faq_navigation',
                patterns: ['faq', 'common questions', 'frequent', 'quick answer', 'summary'],
                response: 'I can answer questions about: 1) School subjects and grades needed, 2) Pilot licenses (PPL, CPL, ATPL), 3) Training centers and costs, 4) Aerospace engineering colleges, 5) Airline cadet programs (Emirates, Etihad), 6) Salaries and benefits, 7) Career advice from real pilots, 8) Study resources and apps.'
            }
        ];

        for (const intent of intentRules) {
            if (intent.patterns.some(p => normalized.includes(p))) {
                addToHistory('user', userText);
                addToHistory('bot', intent.response);
                return intent.response;
            }
        }

        // 4. Handle "where is" type questions
        if (normalized.includes('where is') || normalized.includes('where can')) {
            const locationPatterns = [
                { keywords: ['uaaa', 'sharjah airport', 'uae aviation'], response: 'UAE Aviation Academy (UAAA) is located at Sharjah International Airport, UAE.' },
                { keywords: ['emirates aviation', 'dubai academic'], response: 'Emirates Aviation University is located in Dubai Academic City, UAE.' },
                { keywords: ['cae', 'oxford', 'al maktoum', 'dwc'], response: 'CAE Oxford Aviation Academy is located at Al Maktoum International Airport (DWC), Dubai.' },
                { keywords: ['phoenix', 'ras al khaimah', 'rak'], response: 'Phoenix Aviation Academy is located at Ras Al Khaimah International Airport.' },
                { keywords: ['khalifa', 'abu dhabi'], response: 'Khalifa University is located in Abu Dhabi, UAE.' }
            ];
            for (const lp of locationPatterns) {
                if (lp.keywords.some(k => normalized.includes(k))) {
                    addToHistory('user', userText);
                    addToHistory('bot', lp.response);
                    return lp.response + ' Let me know if you need more details!';
                }
            }
        }

        // 5. Log unanswered question for admin review (in localStorage)
        try {
            const unanswered = JSON.parse(localStorage.getItem('aviator_unanswered') || '[]');
            if (!Array.isArray(unanswered)) throw new Error();
            if (!unanswered.includes(userText)) {
                unanswered.push(userText);
                if (unanswered.length > 50) unanswered.shift();
                localStorage.setItem('aviator_unanswered', JSON.stringify(unanswered));
            }
        } catch (e) { /* ignore */ }

        // 6. Helpful fallback with suggested topics
        addToHistory('user', userText);
        
        // Look for specific topic keywords to give a targeted suggestion
        const topicMap = [
            { keywords: ['subject', 'math', 'physics', 'english', 'school', 'study'], hint: 'subjects and academic requirements' },
            { keywords: ['license', 'ppl', 'cpl', 'atpl', 'certificate'], hint: 'pilot licenses and certifications' },
            { keywords: ['training', 'academy', 'flight school', 'center'], hint: 'pilot training centers in the UAE' },
            { keywords: ['college', 'university', 'engineering', 'degree'], hint: 'aerospace engineering colleges' },
            { keywords: ['salary', 'pay', 'earn', 'money', 'income'], hint: 'pilot salaries and benefits' },
            { keywords: ['airline', 'emirates', 'etihad', 'flydubai', 'job'], hint: 'UAE airlines and career opportunities' },
            { keywords: ['cadet', 'program', 'sponsor', 'scholarship'], hint: 'airline cadet programs and sponsorship' },
            { keywords: ['cost', 'fee', 'expensive', 'afford', 'price'], hint: 'training costs and financial options' },
            { keywords: ['advice', 'tip', 'mistake', 'experience', 'resource'], hint: 'pilot advice and resources' },
            { keywords: ['contact', 'email', 'phone', 'reach'], hint: 'contact information for Aviator Guide' }
        ];

        let suggestion = '';
        for (const topic of topicMap) {
            if (topic.keywords.some(k => normalized.includes(k))) {
                suggestion = topic.hint;
                break;
            }
        }

        if (suggestion) {
            return `I don't have a specific answer about that yet, but it sounds like you're asking about ${suggestion}. Could you rephrase your question? For example, try asking "What subjects do I need to become a pilot?" or "How much do pilots earn in the UAE?"`;
        }
        
        return 'I\'m not sure I understood your question. I can help with: subjects and grades, pilot licenses (PPL, CPL, ATPL), training centers and costs, aerospace colleges, airline careers (Emirates, Etihad), salaries, or advice from real pilots. Try asking a specific question like "What subjects do I need to become a pilot?"';
    }

    function createChatbotWidget() {
        const widget = document.createElement('div');
        widget.className = 'chatbot-widget';
        widget.innerHTML = `
            <button class="chatbot-button" aria-label="Open chat">💬</button>
            <div class="chatbot-modal" role="dialog" aria-modal="true" aria-label="Chatbot window">
                <div class="chatbot-header">
                    <h4>Pilot Career Guide</h4>
                    <button class="chatbot-close" aria-label="Close chat">×</button>
                </div>
                <div class="chatbot-body">
                    <div class="chatbot-message bot">Hello! Welcome to the Pilot Career Guide chatbot. I can help you with pilot licenses, flight schools, aviation degrees, airline careers, salaries, and becoming a pilot.</div>
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

        function saveKnowledge(question, answer) {
            try {
                const key = 'aviator_learned';
                const stored = JSON.parse(localStorage.getItem(key) || '[]');
                const list = Array.isArray(stored) ? stored : [];
                const q = (question || '').trim();
                const a = (answer || '').trim();
                if (!q || !a) return;
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