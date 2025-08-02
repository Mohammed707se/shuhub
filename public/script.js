// Debounce scroll and resize events
function debounce(func, wait = 100) {
    let timeout;
    return function(...args) {
        clearTimeout(timeout);
        timeout = setTimeout(() => {
            func.apply(this, args);
        }, wait);
    };
}

// Intersection Observer for animations
const observerOptions = {
    threshold: 0.1,
    rootMargin: '0px 0px -50px 0px'
};

const observer = new IntersectionObserver((entries) => {
    entries.forEach(entry => {
        if (entry.isIntersecting) {
            entry.target.style.opacity = '1';
            entry.target.style.transform = 'translateY(0)';
        }
    });
}, observerOptions);

// Observe elements for animation
document.querySelectorAll('.service-card, .achievement-highlight, .cert-item, .method-step').forEach(el => {
    el.style.opacity = '0';
    el.style.transform = 'translateY(30px)';
    el.style.transition = 'opacity 0.6s ease, transform 0.6s ease';
    observer.observe(el);
});

// Counter animation for stats
const animateCounters = () => {
    const counters = document.querySelectorAll('.stat h3');
    counters.forEach(counter => {
        const originalText = counter.textContent;

        // Handle different types of stats
        if (originalText.includes('24/7')) {
            // Animate 24/7
            let current = 0;
            const animate = () => {
                if (current < 24) {
                    current++;
                    counter.textContent = `${current}/7`;
                    setTimeout(animate, 50);
                } else {
                    counter.textContent = '24/7';
                }
            };
            animate();
        } else if (originalText.includes('99.9%')) {
            // Animate percentage
            let current = 0;
            const animate = () => {
                if (current < 99.9) {
                    current += 1.1;
                    counter.textContent = `${Math.min(current, 99.9).toFixed(1)}%`;
                    setTimeout(animate, 30);
                } else {
                    counter.textContent = '99.9%';
                }
            };
            animate();
        } else if (originalText.includes('201+')) {
            // Animate 201+ labs count
            let current = 0;
            const animate = () => {
                if (current < 201) {
                    current += 5;
                    counter.textContent = `${Math.min(current, 201)}+`;
                    setTimeout(animate, 50);
                } else {
                    counter.textContent = '201+';
                }
            };
            animate();
        } else {
            // Default number animation for any numeric values
            const target = parseInt(originalText.replace(/[^0-9]/g, ''));
            if (!isNaN(target) && target > 0) {
                const increment = target / 50;
                let current = 0;
                const animate = () => {
                    if (current < target) {
                        current += increment;
                        counter.textContent = Math.ceil(current) + '+';
                        requestAnimationFrame(animate);
                    } else {
                        counter.textContent = originalText;
                    }
                };
                animate();
            }
        }
    });
};

// Trigger counter animation when stats section is visible
const statsObserver = new IntersectionObserver((entries) => {
    entries.forEach(entry => {
        if (entry.isIntersecting) {
            animateCounters();
            statsObserver.unobserve(entry.target);
        }
    });
}, { threshold: 0.5 });

const statsSection = document.querySelector('.hero-stats');
if (statsSection) {
    statsObserver.observe(statsSection);
}

// Form submission handling
const contactForm = document.querySelector('.contact-form');
if (contactForm) {
    contactForm.addEventListener('submit', (e) => {
        e.preventDefault();

        // Get form data
        const formData = new FormData(contactForm);
        const data = Object.fromEntries(formData);

        // Simulate form submission
        const submitBtn = contactForm.querySelector('.btn-primary');
        const originalText = submitBtn.textContent;
        submitBtn.textContent = 'جاري الإرسال...';
        submitBtn.disabled = true;

        setTimeout(() => {
            // Create a custom modal instead of alert for better mobile experience
            showSuccessMessage('تم إرسال طلبك بنجاح! سنتواصل معك قريباً.');
            contactForm.reset();
            submitBtn.textContent = originalText;
            submitBtn.disabled = false;
        }, 2000);
    });
}

// Success message modal for mobile
function showSuccessMessage(message) {
    // Remove existing modal if any
    const existingModal = document.querySelector('.success-modal');
    if (existingModal) {
        existingModal.remove();
    }

    // Create modal
    const modal = document.createElement('div');
    modal.className = 'success-modal';
    modal.innerHTML = `
        <div class="success-modal-content">
            <div class="success-icon">✓</div>
            <p>${message}</p>
            <button onclick="this.parentElement.parentElement.remove()" class="success-btn">حسناً</button>
        </div>
    `;

    document.body.appendChild(modal);

    // Auto remove after 5 seconds
    setTimeout(() => {
        if (modal.parentElement) {
            modal.remove();
        }
    }, 5000);
}

// Initialize hero title properly to avoid color flashing
document.addEventListener('DOMContentLoaded', () => {
    const heroTitle = document.querySelector('.hero-title');
    if (heroTitle) {
        // Ensure gradient is applied immediately
        const gradientSpan = heroTitle.querySelector('.gradient-text');
        if (gradientSpan) {
            // Make sure the gradient text is visible from the start
            gradientSpan.style.opacity = '1';
            gradientSpan.style.visibility = 'visible';
        }
    }

    // 
        // Mobile Menu Toggle
        const hamburger = document.querySelector('.hamburger');
        const navMenu = document.querySelector('.nav-menu');
        const navActions = document.querySelector('.nav-actions');
        
        if (hamburger && navMenu) {
            hamburger.addEventListener('click', function() {
                navMenu.classList.toggle('active');
                hamburger.classList.toggle('active');
                navActions.classList.toggle('active');
            });
        }
    
        // Smooth scrolling for navigation links
        const navLinks = document.querySelectorAll('.nav-menu a[href^="#"]');
        navLinks.forEach(link => {
            link.addEventListener('click', function(e) {
                e.preventDefault();
                const targetId = this.getAttribute('href');
                const targetSection = document.querySelector(targetId);
                
                if (targetSection) {
                    const headerHeight = document.querySelector('.header').offsetHeight;
                    const targetPosition = targetSection.offsetTop - headerHeight;
                    
                    window.scrollTo({
                        top: targetPosition,
                        behavior: 'smooth'
                    });
                    
                    // Close mobile menu if open
                    if (navMenu.classList.contains('active')) {
                        navMenu.classList.remove('active');
                        hamburger.classList.remove('active');
                        navActions.classList.remove('active');
                    }
                }
            });
        });
    
        // Header scroll effect
        const header = document.querySelector('.header');
        let lastScrollTop = 0;
        
        window.addEventListener('scroll', function() {
            const scrollTop = window.pageYOffset || document.documentElement.scrollTop;
            
            if (scrollTop > 100) {
                header.classList.add('scrolled');
            } else {
                header.classList.remove('scrolled');
            }
            
            // Hide/show header on scroll
            if (scrollTop > lastScrollTop && scrollTop > 200) {
                header.style.transform = 'translateY(-100%)';
            } else {
                header.style.transform = 'translateY(0)';
            }
            
            lastScrollTop = scrollTop;
        });

});

// Parallax effect for hero background
window.addEventListener('scroll', debounce(() => {
    const scrolled = window.pageYOffset;
    const heroBackground = document.querySelector('.hero-background');

    if (heroBackground && scrolled < window.innerHeight) {
        heroBackground.style.transform = `translateY(${scrolled * 0.5}px)`;
    }
}));

// Add loading class to body
document.body.classList.add('loading');

// Remove loading class when page is fully loaded
window.addEventListener('load', debounce(() => {
    document.body.classList.remove('loading');
}));

// Enhanced hover effects for service cards
document.querySelectorAll('.service-card').forEach(card => {
    card.addEventListener('mouseenter', () => {
        card.style.transform = 'translateY(-15px) scale(1.02)';
    });

    card.addEventListener('mouseleave', () => {
        card.style.transform = 'translateY(0) scale(1)';
    });
});

// Add floating animation to achievement badge
const achievementBadge = document.querySelector('.achievement-badge');
if (achievementBadge) {
    setInterval(() => {
        achievementBadge.style.transform = 'translateY(-5px)';
        setTimeout(() => {
            achievementBadge.style.transform = 'translateY(0)';
        }, 1000);
    }, 3000);
}

// AI Cards Auto-slider
let currentCardIndex = 0;
let cardInterval;
const totalCards = 4;

function showCard(index) {
    const cards = document.querySelectorAll('.ai-card');
    const indicators = document.querySelectorAll('.indicator');
    const progressFill = document.querySelector('.progress-fill');

    // Hide all cards first
    cards.forEach(card => {
        card.classList.remove('active');
    });

    // Remove active from all indicators
    indicators.forEach(indicator => {
        indicator.classList.remove('active');
    });

    // Use requestAnimationFrame for smoother performance
    requestAnimationFrame(() => {
        // Pre-adjust container height before showing new card
        if (window.innerWidth <= 768 && cards[index]) {
            adjustContainerHeight(cards[index]);
        }

        // Show current card
        setTimeout(() => {
            if (cards[index]) {
                cards[index].classList.add('active');

                // Final height adjustment after card is shown
                setTimeout(() => {
                    if (window.innerWidth <= 768) {
                        adjustContainerHeight(cards[index]);
                    }
                }, 200);
            }
        }, 50);

        // Activate current indicator
        if (indicators[index]) {
            indicators[index].classList.add('active');
        }

        // Update progress bar
        const progressPercentage = ((index + 1) / totalCards) * 100;
        if (progressFill) {
            progressFill.style.width = progressPercentage + '%';
        }
    });
}

// Function to adjust container height for mobile devices
function adjustContainerHeight(card) {
    const container = document.querySelector('.ai-cards-container');
    if (!container) return;

    if (window.innerWidth <= 768) {
        if (card) {
            // Ensure the card is in its final state before measuring
            requestAnimationFrame(() => {
                const cardHeight = card.offsetHeight;
                const newHeight = Math.max(cardHeight + 40, 200);

                // Smooth height transition
                container.style.transition = 'height 0.3s ease';
                container.style.height = newHeight + 'px';

                // Remove transition after animation
                setTimeout(() => {
                    container.style.transition = '';
                }, 300);
            });
        }
    } else {
        // Reset to default height for desktop
        container.style.height = '400px';
        container.style.transition = '';
    }
}

function nextCard() {
    currentCardIndex = (currentCardIndex + 1) % totalCards;
    showCard(currentCardIndex);
}

function startCardSlider() {
    cardInterval = setInterval(nextCard, 3000);
}

function stopCardSlider() {
    if (cardInterval) {
        clearInterval(cardInterval);
    }
}

// Initialize AI Cards functionality
document.addEventListener('DOMContentLoaded', () => {
    const aiSection = document.querySelector('.ai-capabilities');

    if (aiSection) {
        // Add click handlers to indicators
        const indicators = document.querySelectorAll('.indicator');
        indicators.forEach((indicator, index) => {
            indicator.addEventListener('click', () => {
                currentCardIndex = index;
                showCard(currentCardIndex);
                // Restart timer
                stopCardSlider();
                setTimeout(startCardSlider, 1000);
            });
        });

        // Pause slider on hover (desktop) and touch (mobile)
        const cardsContainer = document.querySelector('.ai-cards-container');
        if (cardsContainer) {
            cardsContainer.addEventListener('mouseenter', stopCardSlider);
            cardsContainer.addEventListener('mouseleave', startCardSlider);

            // Enhanced touch support for mobile
            let touchStartX = 0;
            let touchEndX = 0;
            let touchStartTime = 0;
            let isSwiping = false;

            cardsContainer.addEventListener('touchstart', (e) => {
                touchStartX = e.changedTouches[0].screenX;
                touchStartTime = Date.now();
                isSwiping = false;
                stopCardSlider();
            }, { passive: true });

            cardsContainer.addEventListener('touchmove', (e) => {
                // Detect if user is swiping
                const currentX = e.changedTouches[0].screenX;
                const diff = Math.abs(currentX - touchStartX);
                if (diff > 10) {
                    isSwiping = true;
                }
            }, { passive: true });

            cardsContainer.addEventListener('touchend', (e) => {
                touchEndX = e.changedTouches[0].screenX;
                const touchDuration = Date.now() - touchStartTime;

                // Only handle swipe if it was an actual swipe (not a tap)
                if (isSwiping && touchDuration < 500) {
                    handleSwipe();
                }

                // Restart slider after a delay
                setTimeout(startCardSlider, 3000);
            }, { passive: true });

            function handleSwipe() {
                const swipeThreshold = 30; // Reduced threshold for better mobile experience
                const diff = touchStartX - touchEndX;

                if (Math.abs(diff) > swipeThreshold) {
                    if (diff > 0) {
                        // Swipe left - next card
                        nextCard();
                    } else {
                        // Swipe right - previous card
                        currentCardIndex = currentCardIndex === 0 ? totalCards - 1 : currentCardIndex - 1;
                        showCard(currentCardIndex);
                    }
                }
            }
        }

        // Initialize first card
        showCard(0);

        // Adjust container height on window resize
        window.addEventListener('resize', debounce(() => {
            setTimeout(() => {
                const activeCard = document.querySelector('.ai-card.active');
                if (activeCard) {
                    adjustContainerHeight(activeCard);
                }
            }, 100);
        }));

        // Use Intersection Observer to start slider only when section is visible
        const observer = new IntersectionObserver((entries) => {
            entries.forEach(entry => {
                if (entry.isIntersecting) {
                    setTimeout(startCardSlider, 1000);
                } else {
                    stopCardSlider();
                }
            });
        }, { threshold: 0.3 });

        observer.observe(aiSection);
    }

    // Gradient text initialization
    const gradientText = document.querySelector('.gradient-text');
    if (gradientText) {
        // Ensure the gradient is applied properly without flashing
        gradientText.style.background = 'linear-gradient(90deg, #00befe, #0099cc, #00befe)';
        gradientText.style.backgroundSize = '200% 100%';
        gradientText.style.webkitBackgroundClip = 'text';
        gradientText.style.webkitTextFillColor = 'transparent';
        gradientText.style.backgroundClip = 'text';
    }

    // Navigation Logo Interactive Effects
    const logoImage = document.querySelector('.logo-image');
    if (logoImage) {
        // Click effect - meteor burst
        logoImage.addEventListener('click', (e) => {
            e.preventDefault();
            createMeteorBurst(e.currentTarget);
        });

        // Enhanced interaction effects
        if (!isTouchDevice) {
            // Mouse enter effect (desktop only)
            logoImage.addEventListener('mouseenter', () => {
                logoImage.style.animationPlayState = 'paused';
                logoImage.style.filter = 'drop-shadow(0 0 25px rgba(0, 190, 254, 1)) drop-shadow(0 0 40px rgba(0, 190, 254, 0.5))';
            });

            // Mouse leave effect (desktop only)
            logoImage.addEventListener('mouseleave', () => {
                logoImage.style.animationPlayState = 'running';
                logoImage.style.filter = '';
            });
        } else {
            // Touch effects for mobile
            logoImage.addEventListener('touchstart', () => {
                logoImage.style.filter = 'drop-shadow(0 0 20px rgba(0, 190, 254, 1)) brightness(1.1)';
            });

            logoImage.addEventListener('touchend', () => {
                setTimeout(() => {
                    logoImage.style.filter = '';
                }, 200);
            });
        }
    }

    // Hero Logo Interactive Effects
    const heroLogo = document.querySelector('.hero-logo');
    const heroLogoImage = document.querySelector('.hero-logo-image');

    if (heroLogo && heroLogoImage) {
        // Click effect - realistic meteor impact
        heroLogo.addEventListener('click', (e) => {
            e.preventDefault();

            // Create impact crater effect
            createMeteorImpact(heroLogo);

            // Screen shake effect
            document.body.style.animation = 'screenShake 0.5s ease-in-out';
            setTimeout(() => {
                document.body.style.animation = '';
            }, 500);
        });

        // Mouse tracking for realistic meteor trail
        if (!isTouchDevice) {
            heroLogo.addEventListener('mousemove', (e) => {
                const rect = heroLogo.getBoundingClientRect();
                const centerX = rect.left + rect.width / 2;
                const centerY = rect.top + rect.height / 2;

                const mouseX = e.clientX;
                const mouseY = e.clientY;

                // Calculate angle for trail direction
                const deltaX = mouseX - centerX;
                const deltaY = mouseY - centerY;
                const angle = Math.atan2(deltaY, deltaX) * (180 / Math.PI);

                // Update trail direction
                const trail = heroLogo.querySelector('::before');
                heroLogo.style.setProperty('--trail-angle', `${angle + 180}deg`);
            });

            // Enhanced hover for desktop
            heroLogo.addEventListener('mouseenter', () => {
                createSparkles(heroLogo);
            });
        } else {
            // Enhanced touch effects
            heroLogo.addEventListener('touchstart', (e) => {
                const touch = e.touches[0];
                createTouchImpactWave(touch.clientX, touch.clientY);
            });
        }

        // Random meteor shower effect (occasional) - only on desktop
        if (!isTouchDevice) {
            setInterval(() => {
                if (Math.random() < 0.1 && document.hasFocus() && !document.hidden) {
                    createMiniMeteor();
                }
            }, 5000);
        }
    }
});

// Create meteor burst effect
function createMeteorBurst(element) {
    const rect = element.getBoundingClientRect();
    const centerX = rect.left + rect.width / 2;
    const centerY = rect.top + rect.height / 2;

    for (let i = 0; i < 6; i++) {
        setTimeout(() => {
            createMeteorParticle(centerX, centerY, i);
        }, i * 100);
    }
}

function createMeteorParticle(x, y, index) {
    const particle = document.createElement('div');
    particle.className = 'meteor-particle';

    const angle = (index * 60) * (Math.PI / 180);
    const distance = 100 + Math.random() * 50;
    const endX = x + Math.cos(angle) * distance;
    const endY = y + Math.sin(angle) * distance;

    particle.style.cssText = `
        position: fixed;
        left: ${x}px;
        top: ${y}px;
        width: 3px;
        height: 3px;
        background: linear-gradient(45deg, #00befe, #0099cc);
        border-radius: 50%;
        pointer-events: none;
        z-index: 9999;
        box-shadow: 0 0 6px rgba(0, 190, 254, 0.8);
    `;

    document.body.appendChild(particle);

    // Animate particle
    particle.animate([
        {
            transform: 'translate(0, 0) scale(1)',
            opacity: 1
        },
        {
            transform: `translate(${endX - x}px, ${endY - y}px) scale(0)`,
            opacity: 0
        }
    ], {
        duration: 800,
        easing: 'ease-out'
    }).onfinish = () => {
        particle.remove();
    };
}

// Realistic meteor impact effect
function createMeteorImpact(element) {
    const rect = element.getBoundingClientRect();
    const centerX = rect.left + rect.width / 2;
    const centerY = rect.top + rect.height / 2;

    // Create impact wave
    createImpactWave(centerX, centerY);

    // Create debris particles
    for (let i = 0; i < 15; i++) {
        setTimeout(() => {
            createDebrisParticle(centerX, centerY, i);
        }, i * 30);
    }

    // Create flash effect
    createImpactFlash(centerX, centerY);
}

function createImpactWave(x, y) {
    const wave = document.createElement('div');
    wave.style.cssText = `
        position: fixed;
        left: ${x}px;
        top: ${y}px;
        width: 10px;
        height: 10px;
        border: 3px solid rgba(255, 255, 255, 0.8);
        border-radius: 50%;
        pointer-events: none;
        z-index: 9998;
        transform: translate(-50%, -50%);
    `;

    document.body.appendChild(wave);

    wave.animate([
        {
            width: '10px',
            height: '10px',
            borderWidth: '3px',
            opacity: 1
        },
        {
            width: '200px',
            height: '200px',
            borderWidth: '1px',
            opacity: 0
        }
    ], {
        duration: 800,
        easing: 'ease-out'
    }).onfinish = () => wave.remove();
}

function createDebrisParticle(x, y, index) {
    const particle = document.createElement('div');
    const angle = (index * 24) * (Math.PI / 180);
    const distance = 80 + Math.random() * 120;
    const size = 2 + Math.random() * 4;

    particle.style.cssText = `
        position: fixed;
        left: ${x}px;
        top: ${y}px;
        width: ${size}px;
        height: ${size}px;
        background: linear-gradient(45deg, #ffaa00, #ff6600, #00befe);
        border-radius: 50%;
        pointer-events: none;
        z-index: 9999;
        box-shadow: 0 0 6px rgba(255, 170, 0, 0.8);
    `;

    document.body.appendChild(particle);

    const endX = x + Math.cos(angle) * distance;
    const endY = y + Math.sin(angle) * distance + 50; // Gravity effect

    particle.animate([
        {
            transform: 'translate(-50%, -50%) scale(1) rotate(0deg)',
            opacity: 1
        },
        {
            transform: `translate(${endX - x}px, ${endY - y}px) scale(0.3) rotate(360deg)`,
            opacity: 0
        }
    ], {
        duration: 1000 + Math.random() * 500,
        easing: 'cubic-bezier(0.25, 0.46, 0.45, 0.94)'
    }).onfinish = () => particle.remove();
}

function createImpactFlash(x, y) {
    const flash = document.createElement('div');
    flash.style.cssText = `
        position: fixed;
        left: ${x}px;
        top: ${y}px;
        width: 300px;
        height: 300px;
        background: radial-gradient(circle, 
            rgba(255, 255, 255, 0.8) 0%,
            rgba(0, 212, 255, 0.6) 30%,
            transparent 70%);
        border-radius: 50%;
        pointer-events: none;
        z-index: 9997;
        transform: translate(-50%, -50%);
    `;

    document.body.appendChild(flash);

    flash.animate([
        { opacity: 0, transform: 'translate(-50%, -50%) scale(0.5)' },
        { opacity: 1, transform: 'translate(-50%, -50%) scale(1)' },
        { opacity: 0, transform: 'translate(-50%, -50%) scale(1.2)' }
    ], {
        duration: 400,
        easing: 'ease-out'
    }).onfinish = () => flash.remove();
}

// Create sparkles around logo on hover
function createSparkles(element) {
    const rect = element.getBoundingClientRect();
    const sparkleCount = isTouchDevice ? 3 : 5; // Fewer sparkles on mobile

    for (let i = 0; i < sparkleCount; i++) {
        setTimeout(() => {
            const sparkle = document.createElement('div');
            const x = rect.left + Math.random() * rect.width;
            const y = rect.top + Math.random() * rect.height;

            sparkle.style.cssText = `
                position: fixed;
                left: ${x}px;
                top: ${y}px;
                width: 3px;
                height: 3px;
                background: #ffffff;
                border-radius: 50%;
                pointer-events: none;
                z-index: 9999;
                box-shadow: 0 0 4px #00befe;
            `;

            document.body.appendChild(sparkle);

            sparkle.animate([
                { opacity: 0, transform: 'scale(0)' },
                { opacity: 1, transform: 'scale(1)' },
                { opacity: 0, transform: 'scale(0)' }
            ], {
                duration: 600,
                easing: 'ease-in-out'
            }).onfinish = () => sparkle.remove();
        }, i * 120);
    }
}

// Create mini meteors occasionally
function createMiniMeteor() {
    const meteor = document.createElement('div');
    const startX = Math.random() * window.innerWidth;
    const startY = -20;
    const endX = startX + (Math.random() - 0.5) * 400;
    const endY = window.innerHeight + 20;

    meteor.style.cssText = `
        position: fixed;
        left: ${startX}px;
        top: ${startY}px;
        width: 2px;
        height: 2px;
        background: #00befe;
        border-radius: 50%;
        pointer-events: none;
        z-index: 1000;
        box-shadow: 0 0 4px #00befe, 2px 2px 8px rgba(0, 190, 254, 0.6);
    `;

    document.body.appendChild(meteor);

    meteor.animate([
        {
            transform: 'translate(0, 0) scale(1)',
            opacity: 0
        },
        {
            transform: 'translate(0, 50px) scale(1.5)',
            opacity: 1
        },
        {
            transform: `translate(${endX - startX}px, ${endY - startY}px) scale(0.5)`,
            opacity: 0
        }
    ], {
        duration: 2000 + Math.random() * 1000,
        easing: 'ease-in'
    }).onfinish = () => meteor.remove();
}

function createTouchImpactWave(x, y) {
    // Smaller, more efficient impact for mobile
    const wave = document.createElement('div');
    wave.style.cssText = `
        position: fixed;
        left: ${x}px;
        top: ${y}px;
        width: 8px;
        height: 8px;
        border: 2px solid rgba(0, 190, 254, 0.8);
        border-radius: 50%;
        pointer-events: none;
        z-index: 9998;
        transform: translate(-50%, -50%);
    `;

    document.body.appendChild(wave);

    wave.animate([
        {
            width: '8px',
            height: '8px',
            opacity: 1
        },
        {
            width: '120px',
            height: '120px',
            opacity: 0
        }
    ], {
        duration: 600,
        easing: 'ease-out'
    }).onfinish = () => wave.remove();

    // Create fewer particles for mobile
    for (let i = 0; i < 6; i++) {
        createDebrisParticle(x, y, i);
    }
}

// Add ripple effect to buttons
document.querySelectorAll('.btn-primary, .btn-secondary').forEach(button => {
    button.addEventListener('click', function (e) {
        const ripple = document.createElement('span');
        const rect = this.getBoundingClientRect();
        const size = Math.max(rect.width, rect.height);
        const x = e.clientX - rect.left - size / 2;
        const y = e.clientY - rect.top - size / 2;

        ripple.style.width = ripple.style.height = size + 'px';
        ripple.style.left = x + 'px';
        ripple.style.top = y + 'px';
        ripple.classList.add('ripple-effect');

        this.appendChild(ripple);

        setTimeout(() => {
            ripple.remove();
        }, 600);
    });
});

// Touch device detection
const isTouchDevice = 'ontouchstart' in window || navigator.maxTouchPoints > 0;

// Add touch-friendly interactions for mobile
if (isTouchDevice) {
    // Add touch feedback to interactive elements
    document.querySelectorAll('.service-card, .cert-item, .method-step').forEach(element => {
        element.addEventListener('touchstart', function () {
            this.style.transform = 'scale(0.98)';
        });

        element.addEventListener('touchend', function () {
            this.style.transform = 'scale(1)';
        });
    });
}

// Smooth scroll with offset for mobile
function smoothScrollToElement(element) {
    const headerHeight = document.querySelector('.navbar').offsetHeight;
    const elementPosition = element.offsetTop - headerHeight - 20;

    window.scrollTo({
        top: elementPosition,
        behavior: 'smooth'
    });
}

// Update smooth scrolling for better mobile experience
document.querySelectorAll('a[href^="#"]').forEach(anchor => {
    anchor.addEventListener('click', function (e) {
        e.preventDefault();
        const target = document.querySelector(this.getAttribute('href'));
        if (target) {
            smoothScrollToElement(target);
        }
    });
});

// Add CSS for ripple effect and mobile improvements
const style = document.createElement('style');
style.textContent = `
  .btn-primary, .btn-secondary {
    position: relative;
    overflow: hidden;
    transition: all 0.3s ease;
  }
  
  .ripple-effect {
    position: absolute;
    border-radius: 50%;
    background: rgba(255, 255, 255, 0.3);
    animation: ripple 0.6s linear;
    pointer-events: none;
  }
  
  @keyframes ripple {
    0% {
      opacity: 1;
      transform: scale(0);
    }
    100% {
      opacity: 0;
      transform: scale(2);
    }
  }
  
  .loading {
    overflow: hidden;
  }
  
  .loading * {
    animation-play-state: paused;
  }
  
  /* Ensure gradient text is visible immediately */
  .gradient-text {
    opacity: 1 !important;
    visibility: visible !important;
  }
  
  /* Success Modal Styles */
  .success-modal {
    position: fixed;
    top: 0;
    left: 0;
    width: 100%;
    height: 100%;
    background: rgba(0, 0, 0, 0.8);
    display: flex;
    align-items: center;
    justify-content: center;
    z-index: 10000;
    animation: fadeIn 0.3s ease;
  }
  
  .success-modal-content {
    background: #111111;
    padding: 2rem;
    border-radius: 20px;
    text-align: center;
    max-width: 90%;
    width: 400px;
    border: 1px solid #00befe;
    animation: slideIn 0.3s ease;
  }
  
  .success-icon {
    font-size: 3rem;
    color: #00befe;
    margin-bottom: 1rem;
  }
  
  .success-modal-content p {
    color: #e0e0e0;
    margin-bottom: 1.5rem;
    font-size: 1.1rem;
  }
  
  .success-btn {
    background: linear-gradient(90deg, #00befe, #0099cc);
    color: #000;
    border: none;
    padding: 0.8rem 2rem;
    border-radius: 25px;
    font-weight: 600;
    cursor: pointer;
    transition: all 0.3s ease;
  }
  
  .success-btn:hover {
    transform: translateY(-2px);
    box-shadow: 0 5px 15px rgba(0, 190, 254, 0.4);
  }
  
  @keyframes fadeIn {
    from { opacity: 0; }
    to { opacity: 1; }
  }
  
  @keyframes slideIn {
    from { 
      opacity: 0;
      transform: translateY(-30px);
    }
    to { 
      opacity: 1;
      transform: translateY(0);
    }
  }
  
  /* Mobile touch feedback */
  @media (max-width: 768px) {
    .service-card:active,
    .cert-item:active,
    .method-step:active {
      transform: scale(0.98);
    }
    
    .btn-primary:active,
    .btn-secondary:active {
      transform: scale(0.95);
    }
    
    .success-modal-content {
      margin: 1rem;
      padding: 1.5rem;
    }
  }
`;
document.head.appendChild(style);