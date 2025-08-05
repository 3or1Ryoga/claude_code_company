// Smooth scrolling for navigation links
document.querySelectorAll('a[href^="#"]').forEach(anchor => {
    anchor.addEventListener('click', function (e) {
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

// Navigation background change on scroll
const navigation = document.querySelector('.navigation');
let lastScroll = 0;

window.addEventListener('scroll', () => {
    const currentScroll = window.pageYOffset;
    
    if (currentScroll > 100) {
        navigation.style.backgroundColor = 'rgba(255, 255, 255, 0.98)';
        navigation.style.backdropFilter = 'blur(10px)';
    } else {
        navigation.style.backgroundColor = 'white';
        navigation.style.backdropFilter = 'none';
    }
    
    lastScroll = currentScroll;
});

// Intersection Observer for fade-in animations
const observerOptions = {
    threshold: 0.1,
    rootMargin: '0px 0px -100px 0px'
};

const observer = new IntersectionObserver((entries) => {
    entries.forEach(entry => {
        if (entry.isIntersecting) {
            entry.target.style.opacity = '1';
            entry.target.style.transform = 'translateY(0)';
        }
    });
}, observerOptions);

// Apply animation to sections
document.querySelectorAll('.section').forEach(section => {
    section.style.opacity = '0';
    section.style.transform = 'translateY(30px)';
    section.style.transition = 'opacity 0.8s ease, transform 0.8s ease';
    observer.observe(section);
});

// Parallax effect for hero section
const hero = document.querySelector('.hero');
window.addEventListener('scroll', () => {
    const scrolled = window.pageYOffset;
    const parallax = scrolled * 0.5;
    hero.style.transform = `translateY(${parallax}px)`;
});

// Form submission
const contactForm = document.querySelector('.contact-form');
contactForm.addEventListener('submit', (e) => {
    e.preventDefault();
    
    // Add success animation
    const button = contactForm.querySelector('.submit-button');
    const originalText = button.textContent;
    button.textContent = 'Message Sent!';
    button.style.backgroundColor = '#4CAF50';
    
    // Reset form
    contactForm.reset();
    
    // Reset button after 3 seconds
    setTimeout(() => {
        button.textContent = originalText;
        button.style.backgroundColor = '';
    }, 3000);
});

// Add hover effect to product cards
document.querySelectorAll('.product-card').forEach(card => {
    card.addEventListener('mouseenter', function() {
        this.style.transform = 'translateY(-10px) scale(1.02)';
    });
    
    card.addEventListener('mouseleave', function() {
        this.style.transform = 'translateY(0) scale(1)';
    });
});

// Add gentle floating animation to benefit icons
document.querySelectorAll('.benefit-icon').forEach((icon, index) => {
    icon.style.animation = `float ${3 + index * 0.5}s ease-in-out infinite`;
    icon.style.animationDelay = `${index * 0.2}s`;
});

// Create tea leaf particles for ambiance
function createTeaLeaf() {
    const leaf = document.createElement('div');
    leaf.className = 'tea-leaf';
    leaf.style.cssText = `
        position: fixed;
        width: 20px;
        height: 20px;
        background-color: rgba(124, 179, 66, 0.3);
        border-radius: 0% 100% 0% 100%;
        pointer-events: none;
        z-index: 1;
        left: ${Math.random() * 100}%;
        top: -20px;
        animation: fall ${10 + Math.random() * 10}s linear;
    `;
    
    document.body.appendChild(leaf);
    
    setTimeout(() => {
        leaf.remove();
    }, 20000);
}

// Add falling leaves CSS animation
if (!document.querySelector('#leaf-animation')) {
    const style = document.createElement('style');
    style.id = 'leaf-animation';
    style.textContent = `
        @keyframes fall {
            to {
                transform: translateY(calc(100vh + 20px)) rotate(360deg);
            }
        }
    `;
    document.head.appendChild(style);
}

// Create leaves periodically
setInterval(createTeaLeaf, 5000);

// Active navigation highlighting
window.addEventListener('scroll', () => {
    const sections = document.querySelectorAll('section[id]');
    const navLinks = document.querySelectorAll('.nav-menu a');
    
    let current = '';
    sections.forEach(section => {
        const sectionTop = section.offsetTop;
        const sectionHeight = section.clientHeight;
        if (pageYOffset >= sectionTop - 200) {
            current = section.getAttribute('id');
        }
    });
    
    navLinks.forEach(link => {
        link.style.color = '';
        if (link.getAttribute('href').slice(1) === current) {
            link.style.color = 'var(--matcha-green)';
        }
    });
});