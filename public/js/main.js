// Fake Data Generator (Faker-like functionality)
class DataGenerator {
    constructor() {
        this.saudiNames = [
            'محمد أحمد العتيبي', 'فهد سعود المطيري', 'عبدالله خالد القحطاني',
            'سارة محمد الدوسري', 'نورا عبدالرحمن الشهري', 'رهف أحمد الزهراني',
            'عمر فيصل الحربي', 'مريم عبدالله البقمي', 'يوسف محمد العنزي',
            'لمياء سعد الغامدي', 'تركي عبدالعزيز آل سعود', 'أمل محمد الشمري'
        ];

        this.bankNames = [
            'البنك الأهلي السعودي', 'بنك الرياض', 'بنك ساب', 'البنك السعودي الفرنسي',
            'بنك البلاد', 'بنك الجزيرة', 'البنك السعودي للاستثمار', 'بنك الانماء',
            'البنك العربي الوطني', 'مصرف الراجحي', 'بنك الرياض كابيتال', 'البنك الأول'
        ];

        this.cities = [
            'الرياض', 'جدة', 'الدمام', 'مكة المكرمة', 'المدينة المنورة',
            'الطائف', 'تبوك', 'القصيم', 'حائل', 'جازان', 'نجران', 'الباحة'
        ];

        this.loanTypes = [
            'قرض شخصي', 'قرض عقاري', 'قرض سيارة', 'قرض تجاري',
            'بطاقة ائتمان', 'تمويل تعليمي', 'تمويل طبي'
        ];
    }

    randomChoice(array) {
        return array[Math.floor(Math.random() * array.length)];
    }

    randomNumber(min, max) {
        return Math.floor(Math.random() * (max - min + 1)) + min;
    }

    randomFloat(min, max, decimals = 2) {
        return +(Math.random() * (max - min) + min).toFixed(decimals);
    }

    randomDate(daysBack = 365) {
        const date = new Date();
        date.setDate(date.getDate() - this.randomNumber(0, daysBack));
        return date;
    }

    formatCurrency(amount) {
        return new Intl.NumberFormat('ar-SA', {
            style: 'currency',
            currency: 'SAR',
            minimumFractionDigits: 0
        }).format(amount);
    }

    formatDate(date) {
        return new Intl.DateTimeFormat('ar-SA', {
            year: 'numeric',
            month: 'long',
            day: 'numeric'
        }).format(date);
    }

    generateDebtor() {
        const amount = this.randomNumber(5000, 500000);
        const daysOverdue = this.randomNumber(1, 365);
        const successProbability = this.randomFloat(10, 95);

        return {
            id: this.randomNumber(10000, 99999),
            name: this.randomChoice(this.saudiNames),
            bank: this.randomChoice(this.bankNames),
            city: this.randomChoice(this.cities),
            loanType: this.randomChoice(this.loanTypes),
            amount: amount,
            amountFormatted: this.formatCurrency(amount),
            daysOverdue: daysOverdue,
            lastContact: this.formatDate(this.randomDate(30)),
            successProbability: successProbability,
            status: successProbability > 70 ? 'عالي' : successProbability > 40 ? 'متوسط' : 'منخفض',
            paymentPlan: Math.random() > 0.5,
            aiScore: this.randomFloat(1, 10)
        };
    }

    generateDebtors(count = 100) {
        return Array.from({ length: count }, () => this.generateDebtor());
    }

    generateRecoveryData() {
        const months = ['يناير', 'فبراير', 'مارس', 'أبريل', 'مايو', 'يونيو'];
        return months.map(month => ({
            month,
            amount: this.randomNumber(800000, 2500000),
            cases: this.randomNumber(150, 400),
            rate: this.randomFloat(45, 75)
        }));
    }

    generateCallData() {
        const hours = Array.from({ length: 24 }, (_, i) => `${i}:00`);
        return hours.map(hour => ({
            hour,
            calls: this.randomNumber(10, 150),
            successful: this.randomNumber(5, 100)
        }));
    }
}

// Initialize data generator
const dataGen = new DataGenerator();

// Dashboard Data
const dashboardData = {
    stats: {
        totalDebtors: 2847,
        recoveryRate: 67.3,
        automatedCalls: 15432,
        averageRecoveryTime: 8.4,
        monthlyGrowth: 24.7,
        activeClients: 127,
        totalRecovered: dataGen.formatCurrency(48750000),
        avgCaseValue: dataGen.formatCurrency(52300)
    },
    debtors: dataGen.generateDebtors(50),
    recoveryData: dataGen.generateRecoveryData(),
    callData: dataGen.generateCallData(),
    recentActivities: [
        {
            id: 1,
            type: 'payment',
            icon: 'fas fa-money-bill-wave',
            description: 'تم استلام دفعة من أحمد المطيري',
            amount: dataGen.formatCurrency(45000),
            time: '10 دقائق مضت',
            status: 'success'
        },
        {
            id: 2,
            type: 'call',
            icon: 'fas fa-phone',
            description: 'مكالمة آلية ناجحة - سارة الدوسري',
            time: '25 دقيقة مضت',
            status: 'info'
        },
        {
            id: 3,
            type: 'plan',
            icon: 'fas fa-calendar-alt',
            description: 'خطة سداد جديدة - عمر الحربي',
            time: '40 دقيقة مضت',
            status: 'warning'
        },
        {
            id: 4,
            type: 'recovery',
            icon: 'fas fa-chart-line',
            description: 'تحديث معدل الاسترداد',
            amount: '+2.3%',
            time: '1 ساعة مضت',
            status: 'success'
        }
    ]
};

// Chart Configurations
const chartConfigs = {
    hero: {
        type: 'doughnut',
        data: {
            labels: ['مسترد', 'قيد المعالجة', 'متأخر'],
            datasets: [{
                data: [67, 23, 10],
                backgroundColor: [
                    '#10b981',
                    '#f59e0b',
                    '#ef4444'
                ],
                borderWidth: 0
            }]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            plugins: {
                legend: {
                    display: false
                }
            }
        }
    },

    recovery: {
        type: 'line',
        data: {
            labels: dashboardData.recoveryData.map(d => d.month),
            datasets: [{
                label: 'معدل الاسترداد %',
                data: dashboardData.recoveryData.map(d => d.rate),
                borderColor: '#00d4ff',
                backgroundColor: 'rgba(0, 212, 255, 0.1)',
                borderWidth: 3,
                fill: true,
                tension: 0.4
            }]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            plugins: {
                legend: {
                    display: false
                }
            },
            scales: {
                y: {
                    beginAtZero: true,
                    max: 100,
                    ticks: {
                        callback: function (value) {
                            return value + '%';
                        }
                    }
                }
            }
        }
    },

    calls: {
        type: 'bar',
        data: {
            labels: dashboardData.callData.slice(8, 20).map(d => d.hour),
            datasets: [{
                label: 'مكالمات ناجحة',
                data: dashboardData.callData.slice(8, 20).map(d => d.successful),
                backgroundColor: '#00d4ff',
                borderRadius: 8
            }, {
                label: 'إجمالي المكالمات',
                data: dashboardData.callData.slice(8, 20).map(d => d.calls),
                backgroundColor: 'rgba(0, 212, 255, 0.3)',
                borderRadius: 8
            }]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            plugins: {
                legend: {
                    position: 'top'
                }
            },
            scales: {
                y: {
                    beginAtZero: true
                }
            }
        }
    }
};

// DOM Ready
document.addEventListener('DOMContentLoaded', function () {
    initializeApp();
});

function initializeApp() {
    // Initialize navigation
    initNavigation();

    // Initialize charts
    initCharts();

    // Initialize tabs
    initTabs();

    // Initialize animations
    initAnimations();

    // Initialize mobile menu
    initMobileMenu();

    // Update stats with animations
    animateStats();
}

function initNavigation() {
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

    // Update active navigation link on scroll
    window.addEventListener('scroll', updateActiveNavLink);
}

function updateActiveNavLink() {
    const sections = document.querySelectorAll('section[id]');
    const navLinks = document.querySelectorAll('.nav-link');

    let current = '';
    sections.forEach(section => {
        const sectionTop = section.offsetTop - 100;
        if (window.pageYOffset >= sectionTop) {
            current = section.getAttribute('id');
        }
    });

    navLinks.forEach(link => {
        link.classList.remove('active');
        if (link.getAttribute('href') === `#${current}`) {
            link.classList.add('active');
        }
    });
}

function initCharts() {
    // Hero Chart
    const heroChartCtx = document.getElementById('heroChart');
    if (heroChartCtx) {
        new Chart(heroChartCtx, chartConfigs.hero);
    }

    // Initialize other charts when their containers are available
    setTimeout(() => {
        const recoveryChartCtx = document.getElementById('recoveryChart');
        if (recoveryChartCtx) {
            new Chart(recoveryChartCtx, chartConfigs.recovery);
        }

        const callsChartCtx = document.getElementById('callsChart');
        if (callsChartCtx) {
            new Chart(callsChartCtx, chartConfigs.calls);
        }
    }, 100);
}

function initTabs() {
    const tabButtons = document.querySelectorAll('.tab-btn');
    const tabContents = document.querySelectorAll('.tab-content');

    tabButtons.forEach(button => {
        button.addEventListener('click', () => {
            const targetTab = button.getAttribute('data-tab');

            // Remove active class from all buttons and contents
            tabButtons.forEach(btn => btn.classList.remove('active'));
            tabContents.forEach(content => content.classList.remove('active'));

            // Add active class to clicked button and corresponding content
            button.classList.add('active');
            const targetContent = document.getElementById(targetTab);
            if (targetContent) {
                targetContent.classList.add('active');
            }
        });
    });
}

function initAnimations() {
    // Intersection Observer for animations
    const observerOptions = {
        threshold: 0.1,
        rootMargin: '0px 0px -50px 0px'
    };

    const observer = new IntersectionObserver((entries) => {
        entries.forEach(entry => {
            if (entry.isIntersecting) {
                entry.target.style.animation = 'fadeInUp 0.6s ease-out forwards';
            }
        });
    }, observerOptions);

    // Observe elements for animation
    document.querySelectorAll('.feature-card, .pricing-card, .solution-content').forEach(el => {
        observer.observe(el);
    });
}

function initMobileMenu() {
    const hamburger = document.querySelector('.hamburger');
    const navMenu = document.querySelector('.nav-menu');

    if (hamburger && navMenu) {
        hamburger.addEventListener('click', () => {
            navMenu.classList.toggle('active');
            hamburger.classList.toggle('active');
        });
    }
}

function animateStats() {
    const stats = document.querySelectorAll('.stat-number');

    stats.forEach(stat => {
        const target = parseFloat(stat.textContent);
        const duration = 2000;
        const step = target / (duration / 16);
        let current = 0;

        const timer = setInterval(() => {
            current += step;
            if (current >= target) {
                current = target;
                clearInterval(timer);
            }

            if (stat.textContent.includes('%')) {
                stat.textContent = current.toFixed(1) + '%';
            } else if (stat.textContent.includes('+')) {
                stat.textContent = '+' + Math.floor(current);
            } else {
                stat.textContent = Math.floor(current).toLocaleString('ar-SA');
            }
        }, 16);
    });
}

// Utility Functions
function formatNumber(num) {
    return new Intl.NumberFormat('ar-SA').format(num);
}

function formatCurrency(amount) {
    return new Intl.NumberFormat('ar-SA', {
        style: 'currency',
        currency: 'SAR',
        minimumFractionDigits: 0
    }).format(amount);
}

function formatPercentage(value) {
    return new Intl.NumberFormat('ar-SA', {
        style: 'percent',
        minimumFractionDigits: 1
    }).format(value / 100);
}

// Loading States
function showLoading(element) {
    element.classList.add('loading');
}

function hideLoading(element) {
    element.classList.remove('loading');
}

// API Simulation
class APIService {
    static async getStats() {
        // Simulate API call
        await new Promise(resolve => setTimeout(resolve, 500));
        return dashboardData.stats;
    }

    static async getDebtors(page = 1, limit = 10) {
        await new Promise(resolve => setTimeout(resolve, 300));
        const start = (page - 1) * limit;
        const end = start + limit;
        return {
            data: dashboardData.debtors.slice(start, end),
            total: dashboardData.debtors.length,
            page,
            pages: Math.ceil(dashboardData.debtors.length / limit)
        };
    }

    static async getActivities() {
        await new Promise(resolve => setTimeout(resolve, 200));
        return dashboardData.recentActivities;
    }
}

// Export for use in other files
window.ShuhubApp = {
    data: dashboardData,
    api: APIService,
    dataGen: dataGen,
    charts: chartConfigs,
    utils: {
        formatNumber,
        formatCurrency,
        formatPercentage,
        showLoading,
        hideLoading
    }
};

// Add CSS animations
const style = document.createElement('style');
style.textContent = `
    @keyframes fadeInUp {
        from {
            opacity: 0;
            transform: translateY(30px);
        }
        to {
            opacity: 1;
            transform: translateY(0);
        }
    }
    
    @keyframes slideInRight {
        from {
            opacity: 0;
            transform: translateX(30px);
        }
        to {
            opacity: 1;
            transform: translateX(0);
        }
    }
    
    .nav-menu.active {
        display: flex !important;
        flex-direction: column;
        position: absolute;
        top: 100%;
        left: 0;
        width: 100%;
        background: rgba(255, 255, 255, 0.98);
        backdrop-filter: blur(20px);
        padding: 20px;
        box-shadow: 0 10px 25px rgba(0, 0, 0, 0.1);
    }
    
    .hamburger.active span:nth-child(1) {
        transform: rotate(45deg) translate(5px, 5px);
    }
    
    .hamburger.active span:nth-child(2) {
        opacity: 0;
    }
    
    .hamburger.active span:nth-child(3) {
        transform: rotate(-45deg) translate(7px, -6px);
    }
    
    @media (max-width: 768px) {
        .nav-menu {
            display: none;
        }
    }
`;
document.head.appendChild(style);

console.log('🚀 شُهب Finance Platform Initialized');
console.log('📊 Dashboard data loaded:', dashboardData.stats);
console.log('🎯 Ready for interactions!');