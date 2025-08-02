// Dashboard JavaScript
class Dashboard {
    constructor() {
        this.currentSection = 'overview';
        this.charts = {};
        this.data = window.ShuhubApp.data;
        this.api = window.ShuhubApp.api;
        this.dataGen = window.ShuhubApp.dataGen;

        this.init();
    }

    init() {
        this.initEventListeners();
        this.initCharts();
        this.loadDashboardData();
        this.animateMetrics();
        this.initMobileMenu();
        this.initVoiceBotSection();
        this.initReportsSection();

        // Show overview section by default after a small delay
        setTimeout(() => {
            this.switchSection('overview');
        }, 100);
    }

    initEventListeners() {
        // Sidebar navigation
        document.querySelectorAll('.nav-link').forEach(link => {
            link.addEventListener('click', (e) => {
                const href = link.getAttribute('href');
                console.log(`🔗 Nav link clicked: ${href}`);

                // Only prevent default for internal sections (starting with #)
                if (href.startsWith('#')) {
                    e.preventDefault();
                    const target = href.substring(1);
                    console.log(`🎯 Switching to section: ${target}`);
                    this.switchSection(target);
                    this.updateActiveNavLink(link);
                }
                // For external links (.html files), let them navigate normally
            });
        });

        // Mobile menu toggle
        const mobileMenuBtn = document.querySelector('.mobile-menu-btn');
        const sidebar = document.querySelector('.sidebar');

        if (mobileMenuBtn && sidebar) {
            // Initialize sidebar state based on screen size
            const initializeSidebar = () => {
                if (window.innerWidth <= 768) {
                    sidebar.classList.add('mobile-hidden');
                } else {
                    sidebar.classList.remove('mobile-hidden');
                }
            };

            // Initialize on load
            initializeSidebar();

            // Mobile menu button click (only works on mobile)
            mobileMenuBtn.addEventListener('click', (e) => {
                e.stopPropagation();
                if (window.innerWidth <= 768) {
                    sidebar.classList.toggle('mobile-hidden');
                }
            });

            // Close sidebar when clicking outside (ONLY on mobile)
            document.addEventListener('click', (e) => {
                // Triple check: mobile screen + sidebar visible + click outside
                if (window.innerWidth <= 768 &&
                    !sidebar.classList.contains('mobile-hidden') &&
                    !sidebar.contains(e.target) &&
                    !mobileMenuBtn.contains(e.target)) {
                    sidebar.classList.add('mobile-hidden');
                }
            });

            // Handle window resize
            window.addEventListener('resize', () => {
                initializeSidebar();
            });
        }

        // Modal close
        document.querySelectorAll('.modal-close').forEach(btn => {
            btn.addEventListener('click', (e) => {
                e.target.closest('.modal').classList.remove('active');
            });
        });

        // Chart filters
        document.querySelectorAll('.chart-filter').forEach(filter => {
            filter.addEventListener('change', (e) => {
                this.updateChartData(e.target.value);
            });
        });

        // Table actions
        document.addEventListener('click', (e) => {
            if (e.target.classList.contains('view-debtor-btn') || e.target.closest('.view-debtor-btn')) {
                const btn = e.target.classList.contains('view-debtor-btn') ? e.target : e.target.closest('.view-debtor-btn');
                this.navigateToDebtorDetails(btn.dataset.debtorId);
            }
        });
    }

    initMobileMenu() {
        const mobileMenuBtn = document.querySelector('.mobile-menu-btn');
        const sidebar = document.querySelector('.sidebar');
        const sidebarToggle = document.querySelector('.sidebar-toggle');

        if (mobileMenuBtn && sidebar) {
            // Open sidebar when mobile menu button is clicked
            mobileMenuBtn.addEventListener('click', (e) => {
                e.stopPropagation();
                sidebar.classList.toggle('mobile-visible');
                sidebar.classList.remove('mobile-hidden');
            });

            // Close sidebar when sidebar toggle is clicked
            if (sidebarToggle) {
                sidebarToggle.addEventListener('click', (e) => {
                    e.stopPropagation();
                    sidebar.classList.remove('mobile-visible');
                    sidebar.classList.add('mobile-hidden');
                });
            }

            // Close sidebar when clicking outside
            document.addEventListener('click', (e) => {
                if (!sidebar.contains(e.target) && !mobileMenuBtn.contains(e.target)) {
                    sidebar.classList.remove('mobile-visible');
                    sidebar.classList.add('mobile-hidden');
                }
            });

            // Close sidebar when clicking on nav links on mobile
            const navLinks = sidebar.querySelectorAll('.nav-link');
            navLinks.forEach(link => {
                link.addEventListener('click', () => {
                    if (window.innerWidth <= 1024) {
                        sidebar.classList.remove('mobile-visible');
                        sidebar.classList.add('mobile-hidden');
                    }
                });
            });

            // Handle window resize
            window.addEventListener('resize', () => {
                if (window.innerWidth > 1024) {
                    sidebar.classList.remove('mobile-visible', 'mobile-hidden');
                } else {
                    sidebar.classList.add('mobile-hidden');
                }
            });

            // Initialize mobile state
            if (window.innerWidth <= 1024) {
                sidebar.classList.add('mobile-hidden');
            }
        }
    }

    switchSection(sectionId) {
        // Hide all sections (both dashboard-section and content-section)
        document.querySelectorAll('.dashboard-section, .content-section').forEach(section => {
            section.style.display = 'none';
            section.classList.remove('active');
        });

        // Show target section
        const targetSection = document.getElementById(sectionId);
        if (targetSection) {
            targetSection.style.display = 'block';
            targetSection.classList.add('active');
            this.currentSection = sectionId;

            // Load section-specific data
            this.loadSectionData(sectionId);

            console.log(`📱 Switched to section: ${sectionId}`);
        } else {
            console.error(`❌ Section not found: ${sectionId}`);
        }
    }

    updateActiveNavLink(activeLink) {
        // Remove active class from all nav items
        document.querySelectorAll('.nav-item').forEach(item => {
            item.classList.remove('active');
        });

        // Add active class to clicked nav item
        activeLink.closest('.nav-item').classList.add('active');
    }

    initCharts() {
        this.initRecoveryChart();
        this.initDistributionChart();
        this.initCallsChart();
        this.initAmountDistributionChart();
        this.initBehaviorChart();
    }

    initRecoveryChart() {
        const ctx = document.getElementById('recoveryChart');
        if (!ctx) return;

        this.charts.recovery = new Chart(ctx, {
            type: 'line',
            data: {
                labels: this.data.recoveryData.map(d => d.month),
                datasets: [{
                    label: 'معدل الاسترداد %',
                    data: this.data.recoveryData.map(d => d.rate),
                    borderColor: '#00d4ff',
                    backgroundColor: 'rgba(0, 212, 255, 0.1)',
                    borderWidth: 3,
                    fill: true,
                    tension: 0.4,
                    pointBackgroundColor: '#00d4ff',
                    pointBorderColor: '#ffffff',
                    pointBorderWidth: 2,
                    pointRadius: 6
                }]
            },
            options: {
                responsive: true,
                maintainAspectRatio: false,
                plugins: {
                    legend: {
                        display: false
                    },
                    tooltip: {
                        backgroundColor: 'rgba(15, 23, 42, 0.9)',
                        titleColor: '#ffffff',
                        bodyColor: '#ffffff',
                        borderColor: '#00d4ff',
                        borderWidth: 1,
                        cornerRadius: 8
                    }
                },
                scales: {
                    x: {
                        grid: {
                            display: false
                        },
                        ticks: {
                            color: '#64748b'
                        }
                    },
                    y: {
                        beginAtZero: true,
                        max: 100,
                        grid: {
                            color: 'rgba(148, 163, 184, 0.1)'
                        },
                        ticks: {
                            color: '#64748b',
                            callback: function (value) {
                                return value + '%';
                            }
                        }
                    }
                },
                interaction: {
                    intersect: false,
                    mode: 'index'
                }
            }
        });
    }

    initDistributionChart() {
        const ctx = document.getElementById('distributionChart');
        if (!ctx) return;

        this.charts.distribution = new Chart(ctx, {
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
                    borderWidth: 0,
                    cutout: '70%'
                }]
            },
            options: {
                responsive: true,
                maintainAspectRatio: false,
                plugins: {
                    legend: {
                        display: false
                    },
                    tooltip: {
                        backgroundColor: 'rgba(15, 23, 42, 0.9)',
                        titleColor: '#ffffff',
                        bodyColor: '#ffffff',
                        borderColor: '#00d4ff',
                        borderWidth: 1,
                        cornerRadius: 8,
                        callbacks: {
                            label: function (context) {
                                return context.label + ': ' + context.parsed + '%';
                            }
                        }
                    }
                }
            }
        });
    }

    initCallsChart() {
        const ctx = document.getElementById('callsChart');
        if (!ctx) return;

        const callData = this.data.callData.slice(8, 20);

        this.charts.calls = new Chart(ctx, {
            type: 'bar',
            data: {
                labels: callData.map(d => d.hour),
                datasets: [{
                    label: 'مكالمات ناجحة',
                    data: callData.map(d => d.successful),
                    backgroundColor: '#00d4ff',
                    borderRadius: 6,
                    borderSkipped: false
                }, {
                    label: 'إجمالي المكالمات',
                    data: callData.map(d => d.calls),
                    backgroundColor: 'rgba(0, 212, 255, 0.3)',
                    borderRadius: 6,
                    borderSkipped: false
                }]
            },
            options: {
                responsive: true,
                maintainAspectRatio: false,
                plugins: {
                    legend: {
                        position: 'top',
                        labels: {
                            usePointStyle: true,
                            padding: 20,
                            color: '#64748b'
                        }
                    },
                    tooltip: {
                        backgroundColor: 'rgba(15, 23, 42, 0.9)',
                        titleColor: '#ffffff',
                        bodyColor: '#ffffff',
                        borderColor: '#00d4ff',
                        borderWidth: 1,
                        cornerRadius: 8
                    }
                },
                scales: {
                    x: {
                        grid: {
                            display: false
                        },
                        ticks: {
                            color: '#64748b'
                        }
                    },
                    y: {
                        beginAtZero: true,
                        grid: {
                            color: 'rgba(148, 163, 184, 0.1)'
                        },
                        ticks: {
                            color: '#64748b'
                        }
                    }
                }
            }
        });
    }

    initAmountDistributionChart() {
        const ctx = document.getElementById('amountDistributionChart');
        if (!ctx) return;

        this.charts.amountDistribution = new Chart(ctx, {
            type: 'pie',
            data: {
                labels: ['أقل من 10K', '10K - 50K', '50K - 100K', 'أكثر من 100K'],
                datasets: [{
                    data: [25, 35, 25, 15],
                    backgroundColor: [
                        '#3b82f6',
                        '#00d4ff',
                        '#10b981',
                        '#f59e0b'
                    ],
                    borderWidth: 2,
                    borderColor: '#ffffff'
                }]
            },
            options: {
                responsive: true,
                maintainAspectRatio: false,
                plugins: {
                    legend: {
                        position: 'bottom',
                        labels: {
                            usePointStyle: true,
                            padding: 15,
                            color: '#64748b'
                        }
                    },
                    tooltip: {
                        backgroundColor: 'rgba(15, 23, 42, 0.9)',
                        titleColor: '#ffffff',
                        bodyColor: '#ffffff',
                        borderColor: '#00d4ff',
                        borderWidth: 1,
                        cornerRadius: 8,
                        callbacks: {
                            label: function (context) {
                                return context.label + ': ' + context.parsed + '%';
                            }
                        }
                    }
                }
            }
        });
    }

    initBehaviorChart() {
        const ctx = document.getElementById('behaviorChart');
        if (!ctx) return;

        const labels = ['السبت', 'الأحد', 'الاثنين', 'الثلاثاء', 'الأربعاء', 'الخميس', 'الجمعة'];

        this.charts.behavior = new Chart(ctx, {
            type: 'line',
            data: {
                labels: labels,
                datasets: [{
                    label: 'معدل الاستجابة',
                    data: [65, 72, 78, 82, 85, 79, 45],
                    borderColor: '#00d4ff',
                    backgroundColor: 'rgba(0, 212, 255, 0.1)',
                    borderWidth: 3,
                    fill: true,
                    tension: 0.4
                }, {
                    label: 'معدل السداد',
                    data: [45, 52, 58, 62, 68, 59, 32],
                    borderColor: '#10b981',
                    backgroundColor: 'rgba(16, 185, 129, 0.1)',
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
                        position: 'top',
                        labels: {
                            usePointStyle: true,
                            padding: 20,
                            color: '#64748b'
                        }
                    },
                    tooltip: {
                        backgroundColor: 'rgba(15, 23, 42, 0.9)',
                        titleColor: '#ffffff',
                        bodyColor: '#ffffff',
                        borderColor: '#00d4ff',
                        borderWidth: 1,
                        cornerRadius: 8
                    }
                },
                scales: {
                    x: {
                        grid: {
                            display: false
                        },
                        ticks: {
                            color: '#64748b'
                        }
                    },
                    y: {
                        beginAtZero: true,
                        max: 100,
                        grid: {
                            color: 'rgba(148, 163, 184, 0.1)'
                        },
                        ticks: {
                            color: '#64748b',
                            callback: function (value) {
                                return value + '%';
                            }
                        }
                    }
                }
            }
        });
    }

    async loadDashboardData() {
        try {
            // Load activities
            const activities = await this.api.getActivities();
            this.renderActivities(activities);

            // Load priority cases
            this.renderPriorityCases();

            // Load debtors table
            this.loadDebtorsData();

        } catch (error) {
            console.error('Error loading dashboard data:', error);
        }
    }

    loadSectionData(sectionId) {
        switch (sectionId) {
            case 'debtors':
                this.loadDebtorsData();
                break;
            case 'analytics':
                this.refreshAnalytics();
                break;
            case 'voicebot':
                console.log('🎯 Loading VoiceBot section...');
                this.loadSampleCalls();

                // Force re-render if data exists but table is empty
                setTimeout(() => {
                    const tbody = document.getElementById('callsTableBody');
                    if (tbody && tbody.children.length === 0 && this.callsData) {
                        console.log('🔄 Force re-rendering with stored data');
                        this.renderCallsTable(this.callsData);
                        this.updateCallsStats(this.callsData);
                    }
                }, 500);
                console.log('🤖 VoiceBot section loaded');
                break;
            case 'reports':
                console.log('📊 Reports section loaded');
                break;
            default:
                break;
        }
    }

    renderActivities(activities) {
        const container = document.getElementById('activitiesList');
        if (!container) return;

        container.innerHTML = activities.map(activity => `
            <div class="activity-item">
                <div class="activity-icon ${activity.status}">
                    <i class="${activity.icon}"></i>
                </div>
                <div class="activity-content">
                    <div class="activity-description">${activity.description}</div>
                    <div class="activity-time">${activity.time}</div>
                </div>
                ${activity.amount ? `<div class="activity-amount">${activity.amount}</div>` : ''}
            </div>
        `).join('');
    }

    renderPriorityCases() {
        const container = document.getElementById('priorityList');
        if (!container) return;

        const priorityCases = this.data.debtors
            .sort((a, b) => b.successProbability - a.successProbability)
            .slice(0, 5);

        container.innerHTML = priorityCases.map(debtor => `
            <div class="priority-item">
                <div class="priority-info">
                    <div class="priority-name">${debtor.name}</div>
                    <div class="priority-details">${debtor.amountFormatted} - ${debtor.bank}</div>
                </div>
                <div class="priority-score ${debtor.status === 'عالي' ? 'high' : debtor.status === 'متوسط' ? 'medium' : 'low'}">
                    ${debtor.successProbability.toFixed(1)}%
                </div>
            </div>
        `).join('');
    }

    async loadDebtorsData(page = 1) {
        try {
            const response = await this.api.getDebtors(page, 10);
            this.renderDebtorsTable(response.data);
            this.updatePagination(response);
        } catch (error) {
            console.error('Error loading debtors data:', error);
        }
    }

    renderDebtorsTable(debtors) {
        const tbody = document.getElementById('debtorsTableBody');
        if (!tbody) return;

        tbody.innerHTML = debtors.map(debtor => `
            <tr>
                <td>
                    <div>
                        <div style="font-weight: 600; color: #1e293b;">${debtor.name}</div>
                        <div style="font-size: 0.875rem; color: #64748b;">${debtor.city} - ${debtor.loanType}</div>
                        <div style="font-size: 0.75rem; color: #94a3b8; margin-top: 0.25rem;">${debtor.bank}</div>
                    </div>
                </td>
                <td style="font-weight: 600; color: #ef4444;">${debtor.amountFormatted}</td>
                <td>
                    <span style="color: ${debtor.daysOverdue > 90 ? '#ef4444' : debtor.daysOverdue > 30 ? '#f59e0b' : '#10b981'}; font-weight: 600;">
                        ${debtor.daysOverdue} يوم
                    </span>
                </td>
                <td>
                    <div style="display: flex; align-items: center; gap: 0.5rem;">
                        <div style="width: 60px; height: 6px; background: #f1f5f9; border-radius: 3px; overflow: hidden;">
                            <div style="width: ${debtor.successProbability}%; height: 100%; background: ${debtor.successProbability > 70 ? '#10b981' : debtor.successProbability > 40 ? '#f59e0b' : '#ef4444'}; border-radius: 3px;"></div>
                        </div>
                        <span style="font-size: 0.875rem; font-weight: 600; color: #64748b;">
                            ${debtor.successProbability.toFixed(1)}%
                        </span>
                    </div>
                </td>
                <td style="color: #64748b;">${debtor.lastContact}</td>
                <td>
                    <div class="table-actions">
                        <button class="action-btn-sm primary view-debtor-btn" data-debtor-id="${debtor.id}">
                            <i class="fas fa-eye"></i>
                            عرض التفاصيل
                        </button>
                    </div>
                </td>
            </tr>
        `).join('');
    }

    updatePagination(response) {
        const paginationInfo = document.querySelector('.pagination-info span');
        if (paginationInfo) {
            paginationInfo.textContent = `صفحة ${response.page} من ${response.pages}`;
        }

        const prevBtn = document.querySelector('.pagination-btn.prev');
        const nextBtn = document.querySelector('.pagination-btn.next');

        if (prevBtn) {
            prevBtn.disabled = response.page === 1;
        }

        if (nextBtn) {
            nextBtn.disabled = response.page === response.pages;
        }
    }

    navigateToDebtorDetails(debtorId) {
        // Store debtor ID for the details page
        localStorage.setItem('selectedDebtorId', debtorId);
        // Navigate to debtor details page
        window.location.href = `/debtor-details.html?id=${debtorId}`;
    }

    animateMetrics() {
        const metricElements = document.querySelectorAll('.metric-value');

        metricElements.forEach(element => {
            const target = parseFloat(element.dataset.value);
            if (isNaN(target)) return;

            const duration = 2000;
            const increment = target / (duration / 16);
            let current = 0;

            const timer = setInterval(() => {
                current += increment;
                if (current >= target) {
                    current = target;
                    clearInterval(timer);
                }

                element.textContent = Math.round(current * 10) / 10;

                // Add appropriate suffix
                if (element.textContent.includes('.')) {
                    element.textContent = current.toFixed(1);
                } else {
                    element.textContent = Math.round(current).toLocaleString('en-US');
                }
            }, 16);
        });
    }

    updateChartData(period) {
        // This would typically fetch new data based on the selected period
        console.log('Updating chart data for period:', period);

        // Simulate data update with animation
        Object.values(this.charts).forEach(chart => {
            if (chart && chart.update) {
                chart.update('active');
            }
        });
    }

    refreshAnalytics() {
        // Refresh analytics charts with latest data
        setTimeout(() => {
            Object.values(this.charts).forEach(chart => {
                if (chart && chart.resize) {
                    chart.resize();
                }
            });
        }, 100);
    }

    exportData(format = 'excel') {
        // Simulate data export
        const data = this.data.debtors.map(debtor => ({
            'الاسم': debtor.name,
            'البنك': debtor.bank,
            'المبلغ': debtor.amount,
            'أيام التأخير': debtor.daysOverdue,
            'احتمال السداد': debtor.successProbability,
            'آخر اتصال': debtor.lastContact
        }));

        console.log('Exporting data:', format, data);

        // Show success message
        this.showNotification('تم تصدير البيانات بنجاح', 'success');
    }

    loadSampleCalls() {
        console.log('🔄 Loading sample calls data...');
        const callsData = [
            {
                id: 1,
                customerName: 'محمد أحمد العتيبي',
                callDate: '2024-01-15 14:30',
                language: 'العربية',
                duration: '03:45',
                result: 'success',
                interactionRate: 85,
                voiceTone: 'calm'
            },
            {
                id: 2,
                customerName: 'فاطمة سعد الغامدي',
                callDate: '2024-01-15 11:20',
                language: 'العربية',
                duration: '02:15',
                result: 'partial',
                interactionRate: 62,
                voiceTone: 'neutral'
            },
            {
                id: 3,
                customerName: 'عبدالله خالد الحربي',
                callDate: '2024-01-15 09:15',
                language: 'العربية',
                duration: '01:30',
                result: 'failed',
                interactionRate: 25,
                voiceTone: 'tense'
            },
            {
                id: 4,
                customerName: 'نورا إبراهيم القحطاني',
                callDate: '2024-01-15 16:45',
                language: 'العربية',
                duration: '04:20',
                result: 'success',
                interactionRate: 92,
                voiceTone: 'calm'
            },
            {
                id: 5,
                customerName: 'أحمد سالم المطيري',
                callDate: '2024-01-15 13:10',
                language: 'العربية',
                duration: '02:55',
                result: 'partial',
                interactionRate: 68,
                voiceTone: 'neutral'
            },
            {
                id: 6,
                customerName: 'سارة عبدالعزيز الدوسري',
                callDate: '2024-01-15 10:30',
                language: 'العربية',
                duration: '05:12',
                result: 'success',
                interactionRate: 89,
                voiceTone: 'calm'
            },
            {
                id: 7,
                customerName: 'خالد محمد الشهري',
                callDate: '2024-01-15 08:45',
                language: 'العربية',
                duration: '01:45',
                result: 'failed',
                interactionRate: 32,
                voiceTone: 'tense'
            },
            {
                id: 8,
                customerName: 'مريم أحمد البلوي',
                callDate: '2024-01-15 15:20',
                language: 'العربية',
                duration: '03:30',
                result: 'success',
                interactionRate: 78,
                voiceTone: 'calm'
            }
        ];

        console.log('📊 Calls data prepared:', callsData);

        // Store data for later use
        this.callsData = callsData;

        // Try to render immediately
        this.renderCallsTable(callsData);
        this.updateCallsStats(callsData);

        // If rendering failed, try again periodically
        if (!document.getElementById('callsTableBody')) {
            const retryInterval = setInterval(() => {
                const tbody = document.getElementById('callsTableBody');
                if (tbody) {
                    console.log('🔄 Retrying renderCallsTable after finding tbody');
                    this.renderCallsTable(callsData);
                    this.updateCallsStats(callsData);
                    clearInterval(retryInterval);
                }
            }, 500);

            // Stop trying after 10 seconds
            setTimeout(() => clearInterval(retryInterval), 10000);
        }
    }

    updateCallsStats(callsData) {
        // Calculate stats from actual data
        const totalCalls = callsData.length;
        const successfulCalls = callsData.filter(call => call.result === 'success').length;
        const agreementCalls = Math.floor(successfulCalls * 0.8); // Assume 80% of successful calls agreed to payment plan
        const avgInteractionRate = Math.round(callsData.reduce((sum, call) => sum + call.interactionRate, 0) / totalCalls);

        // Update DOM elements if they exist
        const totalCallsEl = document.getElementById('totalCalls');
        const successfulCallsEl = document.getElementById('successfulCalls');
        const agreementCallsEl = document.getElementById('agreementCalls');
        const interactionRateEl = document.getElementById('interactionRate');

        if (totalCallsEl) totalCallsEl.textContent = totalCalls;
        if (successfulCallsEl) successfulCallsEl.textContent = successfulCalls;
        if (agreementCallsEl) agreementCallsEl.textContent = agreementCalls;
        if (interactionRateEl) interactionRateEl.textContent = `${avgInteractionRate}%`;

        console.log('📊 Stats updated:', { totalCalls, successfulCalls, agreementCalls, avgInteractionRate });
    }

    renderCallsTable(calls) {
        console.log('🔄 renderCallsTable called with', calls?.length, 'calls');
        const tbody = document.getElementById('callsTableBody');
        console.log('🎯 tbody element:', tbody);

        if (!tbody) {
            console.log('⚠️ callsTableBody element not found - VoiceBot section may not be visible');
            console.log('🔍 Available elements with "Table":', document.querySelectorAll('[id*="Table"]'));
            // Try again after a short delay in case DOM is still loading
            setTimeout(() => {
                console.log('🔄 Retrying after 500ms...');
                const retryTbody = document.getElementById('callsTableBody');
                if (retryTbody) {
                    console.log('✅ Found tbody on retry');
                    this.renderCallsTable(calls);
                } else {
                    console.error('❌ callsTableBody still not found after retry');
                    console.log('🔍 Current section visibility:', document.getElementById('voicebot')?.style.display);
                }
            }, 500);
            return;
        }

        tbody.innerHTML = calls.map((call, index) => `
            <tr class="fade-in" style="animation-delay: ${index * 0.1}s">
                <td>${call.customerName}</td>
                <td>${call.callDate}</td>
                <td>${call.language}</td>
                <td>${call.duration}</td>
                <td>
                    <span class="status-badge ${call.result}">
                        <i class="fas fa-${call.result === 'success' ? 'check' : call.result === 'partial' ? 'clock' : 'times'}"></i>
                        ${call.result === 'success' ? 'نجح' : call.result === 'partial' ? 'جزئي' : 'فشل'}
                    </span>
                </td>
                <td>
                    <span class="interaction-rate ${this.getInteractionClass(call.interactionRate)}">
                        ${call.interactionRate}%
                    </span>
                </td>
                <td>
                    <span class="voice-tone ${call.voiceTone}">
                        ${this.getVoiceToneText(call.voiceTone)}
                    </span>
                </td>
                <td>
                    <button class="action-btn view" onclick="viewCallDetails(${call.id})" title="عرض التفاصيل">
                        <i class="fas fa-eye"></i>
                    </button>
                </td>
            </tr>
        `).join('');

        console.log(`📋 Rendered ${calls.length} calls to table`);
    }

    getVoiceToneText(tone) {
        const tones = {
            calm: 'هادئة',
            neutral: 'محايدة',
            tense: 'متوترة'
        };
        return tones[tone] || tone;
    }

    getInteractionClass(rate) {
        if (rate >= 80) return 'high';
        if (rate >= 60) return 'medium';
        return 'low';
    }
}

// Initialize Dashboard when DOM is ready
document.addEventListener('DOMContentLoaded', () => {
    const dashboard = new Dashboard();

    // Make dashboard available globally for debugging
    window.dashboard = dashboard;

    console.log('🚀 Dashboard initialized successfully');
});

// Add notification styles
const notificationStyles = document.createElement('style');
notificationStyles.textContent = `
    .notification {
        position: fixed;
        top: 2rem;
        left: 50%;
        transform: translateX(-50%);
        background: white;
        border-radius: 0.75rem;
        box-shadow: 0 10px 25px rgba(0, 0, 0, 0.15);
        padding: 1rem 1.5rem;
        display: flex;
        align-items: center;
        gap: 1rem;
        z-index: 10000;
        animation: slideDown 0.3s ease-out;
        min-width: 300px;
        border-left: 4px solid #00d4ff;
    }
    
    .notification.success {
        border-left-color: #10b981;
    }
    
    .notification.error {
        border-left-color: #ef4444;
    }
    
    .notification-content {
        display: flex;
        align-items: center;
        gap: 0.75rem;
        flex: 1;
    }
    
    .notification-content i {
        font-size: 1.25rem;
        color: #00d4ff;
    }
    
    .notification.success .notification-content i {
        color: #10b981;
    }
    
    .notification.error .notification-content i {
        color: #ef4444;
    }
    
    .notification-close {
        background: none;
        border: none;
        color: #64748b;
        cursor: pointer;
        padding: 0.25rem;
        border-radius: 0.25rem;
        transition: all 0.3s ease;
    }
    
    .notification-close:hover {
        background: #f1f5f9;
        color: #ef4444;
    }
    
    @keyframes slideDown {
        from {
            opacity: 0;
            transform: translateX(-50%) translateY(-100%);
        }
        to {
            opacity: 1;
            transform: translateX(-50%) translateY(0);
        }
    }
`;

document.head.appendChild(notificationStyles);

// AI Call Modal Controller
class AICallModal {
    constructor() {
        this.modal = document.getElementById('aiCallModal');
        this.currentCallSid = null;
        this.callTimer = null;
        this.callDuration = 0;
        this.debtor = null;

        this.init();
    }

    init() {
        this.initEventListeners();
        this.loadSampleDebtor();
    }

    initEventListeners() {
        // Open modal
        document.getElementById('aiCallBtn').addEventListener('click', () => {
            this.openModal();
        });

        // Close modal
        document.getElementById('closeAiCallModal').addEventListener('click', () => {
            this.closeModal();
        });

        // Verify phone
        document.getElementById('verifyPhone').addEventListener('click', () => {
            this.verifyPhoneNumber();
        });

        // Start call
        document.getElementById('startAiCall').addEventListener('click', () => {
            this.startAICall();
        });

        // End call
        document.getElementById('endCall').addEventListener('click', () => {
            this.endCall();
        });

        // Export PDF
        document.getElementById('exportPdfBtn').addEventListener('click', () => {
            this.exportPDF();
        });

        // Schedule followup
        document.getElementById('scheduleFollowup').addEventListener('click', () => {
            this.scheduleFollowup();
        });

        // Refresh data button
        document.getElementById('refreshDataBtn').addEventListener('click', () => {
            this.refreshTemplateData();
        });
    }

    loadSampleDebtor() {
        // قوالب متعددة للبيانات
        const templates = [
            {
                id: '99031',
                name: 'محمد أحمد العتيبي',
                nationalId: '1234567890',
                phone: '+966539322900',
                address: 'الرياض - حي النرجس - شارع الملك فهد',
                loanType: 'قرض شخصي',
                bankName: 'البنك الأهلي السعودي',
                originalAmount: '150,000 ريال',
                remainingAmount: '125,000 ريال',
                daysOverdue: '45 يوم',
                daysOverdueNumber: 45,
                remainingAmountNumber: 125000,
                creditStatus: 'متوسط'
            },
            {
                id: '85629',
                name: 'فاطمة سعد الغامدي',
                nationalId: '2345678901',
                phone: '+966501234567',
                address: 'جدة - حي الصفا - شارع التحلية',
                loanType: 'قرض عقاري',
                bankName: 'بنك الراجحي',
                originalAmount: '450,000 ريال',
                remainingAmount: '280,000 ريال',
                daysOverdue: '120 يوم',
                daysOverdueNumber: 120,
                remainingAmountNumber: 280000,
                creditStatus: 'سيء'
            },
            {
                id: '73205',
                name: 'عبدالله خالد الحربي',
                nationalId: '3456789012',
                phone: '+966555123456',
                address: 'الدمام - حي الفيصلية - شارع الأمير محمد',
                loanType: 'قرض تجاري',
                bankName: 'البنك السعودي الفرنسي',
                originalAmount: '75,000 ريال',
                remainingAmount: '35,000 ريال',
                daysOverdue: '15 يوم',
                daysOverdueNumber: 15,
                remainingAmountNumber: 35000,
                creditStatus: 'جيد'
            },
            {
                id: '91847',
                name: 'نورا إبراهيم القحطاني',
                nationalId: '4567890123',
                phone: '+966521987654',
                address: 'مكة المكرمة - حي العزيزية - طريق الملك عبدالعزيز',
                loanType: 'قرض شخصي',
                bankName: 'بنك الإنماء',
                originalAmount: '220,000 ريال',
                remainingAmount: '180,000 ريال',
                daysOverdue: '200 يوم',
                daysOverdueNumber: 200,
                remainingAmountNumber: 180000,
                creditStatus: 'سيء جداً'
            },
            {
                id: '56413',
                name: 'أحمد محمد الزهراني',
                nationalId: '5678901234',
                phone: '+966533456789',
                address: 'الطائف - حي الشفا - شارع الستين',
                loanType: 'قرض سيارة',
                bankName: 'البنك الأهلي التجاري',
                originalAmount: '95,000 ريال',
                remainingAmount: '65,000 ريال',
                daysOverdue: '90 يوم',
                daysOverdueNumber: 90,
                remainingAmountNumber: 65000,
                creditStatus: 'متوسط'
            }
        ];

        // اختيار قالب عشوائي في كل مرة
        const randomIndex = Math.floor(Math.random() * templates.length);
        this.debtor = { ...templates[randomIndex] };

        // تحديد حالة العميل وسياسة الموافقة
        this.debtor.clientStatus = this.determineClientStatus(this.debtor);

        console.log('📋 تم تحميل بيانات العميل:', this.debtor.name, `(ID: ${this.debtor.id})`);

        this.updateDebtorDisplay();
    }

    refreshTemplateData() {
        // Add animation to refresh button
        const refreshBtn = document.getElementById('refreshDataBtn');
        const icon = refreshBtn.querySelector('i');

        if (icon) {
            icon.classList.add('fa-spin');
        }

        // Simulate loading delay for better UX
        setTimeout(() => {
            this.loadSampleDebtor();

            if (icon) {
                icon.classList.remove('fa-spin');
            }

            this.showNotification('تم تحديث البيانات بنجاح!', 'success');
        }, 800);
    }

    determineClientStatus(debtor) {
        const daysOverdue = debtor.daysOverdueNumber || 45;
        const remainingAmount = debtor.remainingAmountNumber || 125000;

        if (daysOverdue > 180) {
            return {
                status: 'متعثر شديد',
                color: '#dc2626',
                bgColor: '#fef2f2',
                policy: 'لا يمكن الموافقة على أي طلبات - السداد الفوري مطلوب'
            };
        } else if (daysOverdue > 90) {
            return {
                status: 'متعثر متوسط',
                color: '#ea580c',
                bgColor: '#fff7ed',
                policy: 'يمكن النظر في طلبات محدودة مع ضمانات إضافية'
            };
        } else if (debtor.creditStatus === 'سيء' && daysOverdue > 60) {
            return {
                status: 'عالي المخاطر',
                color: '#dc2626',
                bgColor: '#fef2f2',
                policy: 'يتطلب موافقة الإدارة العليا'
            };
        } else if (remainingAmount > 50000) {
            return {
                status: 'مبلغ كبير',
                color: '#7c3aed',
                bgColor: '#f3f4f6',
                policy: 'يمكن النظر في الطلب مع دراسة مفصلة'
            };
        }

        return {
            status: 'متعثر عادي',
            color: '#059669',
            bgColor: '#f0fdf4',
            policy: 'يمكن النظر في الطلب'
        };
    }

    updateDebtorDisplay() {
        if (!this.debtor) return;

        const debtorName = document.getElementById('debtorName');
        const debtorId = document.getElementById('debtorId');
        const debtorNationalId = document.getElementById('debtorNationalId');
        const debtorAddress = document.getElementById('debtorAddress');
        const loanType = document.getElementById('loanType');
        const bankName = document.getElementById('bankName');
        const originalAmount = document.getElementById('originalAmount');
        const remainingAmount = document.getElementById('remainingAmount');
        const daysOverdue = document.getElementById('daysOverdue');
        const creditStatus = document.getElementById('creditStatus');
        const phoneInput = document.getElementById('phoneInput');

        if (debtorName) debtorName.textContent = this.debtor.name;
        if (debtorId) debtorId.textContent = `ID: #${this.debtor.id}`;
        if (debtorNationalId) debtorNationalId.textContent = this.debtor.nationalId;
        if (debtorAddress) debtorAddress.textContent = this.debtor.address;
        if (loanType) loanType.textContent = this.debtor.loanType;
        if (bankName) bankName.textContent = this.debtor.bankName;
        if (originalAmount) originalAmount.textContent = this.debtor.originalAmount;
        if (remainingAmount) remainingAmount.textContent = this.debtor.remainingAmount;
        if (daysOverdue) daysOverdue.textContent = this.debtor.daysOverdue;
        if (creditStatus) creditStatus.textContent = this.debtor.creditStatus;
        if (phoneInput) phoneInput.value = this.debtor.phone;

        // عرض حالة العميل وسياسة الموافقة
        if (this.debtor.clientStatus) {
            const statusBadge = document.getElementById('clientStatusBadge');
            const policyText = document.getElementById('policyText');

            if (statusBadge) {
                statusBadge.textContent = this.debtor.clientStatus.status;
                statusBadge.style.background = this.debtor.clientStatus.bgColor;
                statusBadge.style.color = this.debtor.clientStatus.color;
            }

            if (policyText) {
                policyText.textContent = this.debtor.clientStatus.policy;
            }
        }
    }

    openModal() {
        this.modal.classList.add('active');
        this.resetModal();
    }

    closeModal() {
        this.modal.classList.remove('active');
        if (this.currentCallSid) {
            this.endCall();
        }
    }

    resetModal() {
        // Reset to call setup phase
        const callSetup = document.getElementById('callSetup');
        const callInProgress = document.getElementById('callInProgress');
        const callCompleted = document.getElementById('callCompleted');

        if (callSetup) {
            callSetup.classList.remove('hidden');

            // Reset debtor preview styles to original state
            const debtorPreview = callSetup.querySelector('.debtor-preview');
            if (debtorPreview) {
                debtorPreview.style.transform = '';
                debtorPreview.style.opacity = '';
                debtorPreview.style.pointerEvents = '';
                debtorPreview.style.marginBottom = '';
            }

            // Show phone input section again
            const phoneInputSection = callSetup.querySelector('.phone-input-section');
            if (phoneInputSection) {
                phoneInputSection.style.display = '';
            }
        }

        if (callInProgress) {
            callInProgress.classList.add('hidden');
        }

        if (callCompleted) {
            callCompleted.classList.add('hidden');
        }

        // Reset call state
        this.currentCallSid = null;
        this.callDuration = 0;
        if (this.callTimer) {
            clearInterval(this.callTimer);
            this.callTimer = null;
        }

        // Load new random template data
        this.loadSampleDebtor();
    }

    verifyPhoneNumber() {
        const phoneInput = document.getElementById('phoneInput');
        const phone = phoneInput.value.trim();

        if (!phone || phone.length < 10) {
            this.showNotification('يرجى إدخال رقم جوال صحيح', 'error');
            return;
        }

        // Simulate verification
        const verifyBtn = document.getElementById('verifyPhone');
        verifyBtn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> جارٍ التحقق...';
        verifyBtn.disabled = true;

        setTimeout(() => {
            verifyBtn.innerHTML = '<i class="fas fa-check-circle"></i> تم التحقق';
            verifyBtn.style.background = '#10b981';
            this.showNotification('تم التحقق من الرقم بنجاح', 'success');
        }, 1500);
    }

    async startAICall() {
        const phoneNumber = document.getElementById('phoneInput').value.trim();

        if (!phoneNumber) {
            this.showNotification('يرجى إدخال رقم الجوال', 'error');
            return;
        }

        try {
            // Switch to call in progress view
            this.showCallInProgress();

            // Make the actual AI call
            const response = await fetch('/api/ai-call', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({
                    phoneNumber: phoneNumber,
                    debtorId: this.debtor.id,
                    debtorData: this.debtor // ← إرسال البيانات الكاملة
                })
            });

            const result = await response.json();

            if (result.success) {
                this.currentCallSid = result.callSid;
                this.startCallTimer();
                this.monitorCall();
                this.showNotification('تم بدء الاتصال بنجاح', 'success');
            } else {
                throw new Error(result.error || 'فشل في بدء الاتصال');
            }

        } catch (error) {
            console.error('Error starting AI call:', error);
            this.showNotification('فشل في بدء الاتصال: ' + error.message, 'error');
            this.resetModal();
        }
    }

    showCallInProgress() {
        const callSetup = document.getElementById('callSetup');
        const callInProgress = document.getElementById('callInProgress');
        const callCompleted = document.getElementById('callCompleted');

        // Keep debtor info visible but hide phone input
        if (callSetup) {
            // Make debtor preview smaller but keep visible
            const debtorPreview = callSetup.querySelector('.debtor-preview');
            if (debtorPreview) {
                debtorPreview.style.transform = 'scale(0.9)';
                debtorPreview.style.opacity = '0.7';
                debtorPreview.style.pointerEvents = 'none';
                debtorPreview.style.marginBottom = '1rem';
            }

            // Hide only the phone input section
            const phoneInputSection = callSetup.querySelector('.phone-input-section');
            if (phoneInputSection) {
                phoneInputSection.style.display = 'none';
            }
        }

        if (callInProgress) {
            callInProgress.classList.remove('hidden');
        }

        if (callCompleted) {
            callCompleted.classList.add('hidden');
        }

        document.getElementById('callStatusText').textContent = 'جارٍ الاتصال...';
    }

    startCallTimer() {
        this.callDuration = 0;
        this.callTimer = setInterval(() => {
            this.callDuration++;
            const minutes = Math.floor(this.callDuration / 60);
            const seconds = this.callDuration % 60;
            const timeString = `${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`;
            document.getElementById('callDuration').textContent = timeString;
        }, 1000);
    }

    async monitorCall() {
        if (!this.currentCallSid) return;

        const checkStatus = async () => {
            try {
                const response = await fetch(`/api/call-status/${this.currentCallSid}`);
                const callStatus = await response.json();

                if (callStatus.status === 'completed') {
                    this.callCompleted();
                } else if (callStatus.status === 'in-progress') {
                    document.getElementById('callStatusText').textContent = 'المكالمة جارية...';
                } else if (callStatus.status === 'ringing') {
                    document.getElementById('callStatusText').textContent = 'جارٍ الرنين...';
                }

                // Continue monitoring if call is still active
                if (['queued', 'ringing', 'in-progress'].includes(callStatus.status)) {
                    setTimeout(checkStatus, 2000);
                }

            } catch (error) {
                console.error('Error monitoring call:', error);
            }
        };

        checkStatus();
    }

    endCall() {
        if (this.callTimer) {
            clearInterval(this.callTimer);
            this.callTimer = null;
        }

        if (this.currentCallSid) {
            // Here you would make API call to end the actual call
            console.log('Ending call:', this.currentCallSid);
        }

        this.callCompleted();
    }

    callCompleted() {
        if (this.callTimer) {
            clearInterval(this.callTimer);
            this.callTimer = null;
        }

        // Switch to completed view
        document.getElementById('callSetup').classList.add('hidden');
        document.getElementById('callInProgress').classList.add('hidden');
        document.getElementById('callCompleted').classList.remove('hidden');

        // Set final duration
        const minutes = Math.floor(this.callDuration / 60);
        const seconds = this.callDuration % 60;
        const timeString = `${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`;
        document.getElementById('finalCallDuration').textContent = timeString;

        // Load AI analytics and recommendations
        this.loadCallAnalytics();
        this.loadRecommendations();
    }

    async loadCallAnalytics() {
        console.log('📊 Loading call analytics for callSid:', this.currentCallSid);

        // Show loading state
        this.showAnalyticsLoading();

        try {
            // Simulate minimum loading time for better UX
            const startTime = Date.now();

            // Get conversation data first
            let conversationData = null;
            let fullTranscript = '';

            if (this.currentCallSid) {
                const response = await fetch(`/api/call-status/${this.currentCallSid}`);
                const callData = await response.json();

                if (callData.success && callData.hasRealData) {
                    conversationData = callData.conversation;
                    fullTranscript = callData.fullTranscript;
                }
            }

            // Generate AI analytics based on conversation and debtor data
            const analytics = await this.generateAIAnalytics(conversationData, fullTranscript);

            // Ensure minimum loading time (2 seconds for realistic feel)
            const elapsedTime = Date.now() - startTime;
            const minLoadingTime = 2000;

            if (elapsedTime < minLoadingTime) {
                await new Promise(resolve => setTimeout(resolve, minLoadingTime - elapsedTime));
            }

            // Hide loading and show results
            this.hideAnalyticsLoading();
            this.updateAnalyticsDisplay(analytics);

        } catch (error) {
            console.error('❌ Error loading call analytics:', error);
            this.hideAnalyticsLoading();
            this.showFallbackAnalytics();
        }
    }

    showAnalyticsLoading() {
        const loading = document.getElementById('analyticsLoading');
        const cards = document.getElementById('analyticsCards');

        if (loading) loading.classList.remove('hidden');
        if (cards) cards.classList.add('hidden');
    }

    hideAnalyticsLoading() {
        const loading = document.getElementById('analyticsLoading');
        const cards = document.getElementById('analyticsCards');

        if (loading) loading.classList.add('hidden');
        if (cards) cards.classList.remove('hidden');
    }

    async generateAIAnalytics(conversationData, fullTranscript) {
        // If we have real conversation data, use AI analysis
        if (conversationData && conversationData.length > 0) {
            try {
                const response = await fetch('/api/analyze-conversation', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({
                        transcript: fullTranscript,
                        debtorData: this.debtor,
                        callSid: this.currentCallSid
                    })
                });

                if (response.ok) {
                    const analysis = await response.json();

                    return {
                        callQuality: this.calculateCallQuality(conversationData),
                        problemSummary: this.extractProblemSummary(analysis),
                        paymentProbability: analysis.paymentProbability || 50,
                        financialStatus: this.determineFinancialStatus(analysis, this.debtor),
                        isRealAnalysis: true
                    };
                }
            } catch (error) {
                console.error('AI analysis failed:', error);
            }
        }

        // Fallback to debtor-based analysis
        return this.generateFallbackAnalytics();
    }

    calculateCallQuality(conversationData) {
        // Calculate based on conversation length, interaction, etc.
        const userMessages = conversationData.filter(msg => msg.type === 'user').length;
        const aiMessages = conversationData.filter(msg => msg.type === 'ai').length;

        if (userMessages >= 3 && aiMessages >= 3) return 85;
        if (userMessages >= 2 && aiMessages >= 2) return 72;
        if (userMessages >= 1 && aiMessages >= 1) return 58;
        return 35;
    }

    extractProblemSummary(analysis) {
        // Extract summary from AI analysis
        if (analysis.fullAnalysis) {
            // Simple extraction - in real scenario, you'd use more sophisticated NLP
            return analysis.fullAnalysis.substring(0, 60) + '...';
        }
        return 'لم يتم تحديد المشكلة بوضوح';
    }

    determineFinancialStatus(analysis, debtor) {
        const daysOverdue = debtor.daysOverdueNumber || 0;
        const creditStatus = debtor.creditStatus || '';

        if (daysOverdue > 180 || creditStatus === 'سيء جداً') return 'سيئة جداً';
        if (daysOverdue > 90 || creditStatus === 'سيء') return 'سيئة';
        if (daysOverdue > 30 || creditStatus === 'متوسط') return 'متوسطة';
        if (daysOverdue <= 15 && creditStatus === 'جيد') return 'جيدة';
        return 'متوسطة';
    }

    generateFallbackAnalytics() {
        return {
            callQuality: Math.floor(Math.random() * 30) + 60, // 60-90
            problemSummary: 'صعوبات مالية مؤقتة بحاجة للمتابعة',
            paymentProbability: Math.floor(Math.random() * 40) + 40, // 40-80
            financialStatus: this.determineFinancialStatus({}, this.debtor),
            isRealAnalysis: false
        };
    }

    updateAnalyticsDisplay(analytics) {
        // Update call quality
        const callQualityEl = document.getElementById('callQuality');
        if (callQualityEl) {
            callQualityEl.textContent = `${analytics.callQuality}%`;
            callQualityEl.setAttribute('data-level', this.getPercentageLevel(analytics.callQuality));
        }

        // Update problem summary
        const problemSummaryEl = document.getElementById('problemSummary');
        if (problemSummaryEl) {
            problemSummaryEl.textContent = analytics.problemSummary;
        }

        // Update payment probability
        const paymentProbabilityEl = document.getElementById('paymentProbability');
        if (paymentProbabilityEl) {
            paymentProbabilityEl.textContent = `${analytics.paymentProbability}%`;
            paymentProbabilityEl.setAttribute('data-level', this.getPercentageLevel(analytics.paymentProbability));
        }

        // Update financial status
        const financialStatusEl = document.getElementById('financialStatus');
        if (financialStatusEl) {
            financialStatusEl.textContent = analytics.financialStatus;
            financialStatusEl.setAttribute('data-status', analytics.financialStatus);
        }
    }

    getPercentageLevel(percentage) {
        if (percentage >= 80) return 'excellent';
        if (percentage >= 65) return 'good';
        if (percentage >= 45) return 'fair';
        return 'poor';
    }

    showFallbackAnalytics() {
        this.updateAnalyticsDisplay({
            callQuality: 45,
            problemSummary: 'خطأ في تحليل المحادثة',
            paymentProbability: 30,
            financialStatus: 'غير محدد'
        });
    }

    // Removed old analysis functions - now using loadCallAnalytics()

    async loadRecommendations() {
        console.log('📋 Loading recommendations...');

        // Show loading state
        this.showRecommendationsLoading();

        try {
            // Simulate loading time
            const startTime = Date.now();

            let recommendations = [];

            // Try to get real recommendations from the analytics
            if (this.currentCallSid) {
                const response = await fetch(`/api/call-status/${this.currentCallSid}`);
                const callData = await response.json();

                if (callData.success && callData.hasRealData) {
                    // Get real recommendations from AI analysis
                    const analysisResponse = await fetch('/api/analyze-conversation', {
                        method: 'POST',
                        headers: { 'Content-Type': 'application/json' },
                        body: JSON.stringify({
                            transcript: callData.fullTranscript,
                            debtorData: this.debtor,
                            callSid: this.currentCallSid
                        })
                    });

                    if (analysisResponse.ok) {
                        const analysis = await analysisResponse.json();
                        recommendations = analysis.recommendations || [];
                    }
                }
            }

            // Fallback to default recommendations if no real ones
            if (recommendations.length === 0) {
                recommendations = this.generateFallbackRecommendations();
            }

            // Ensure minimum loading time (1.5 seconds)
            const elapsedTime = Date.now() - startTime;
            const minLoadingTime = 1500;

            if (elapsedTime < minLoadingTime) {
                await new Promise(resolve => setTimeout(resolve, minLoadingTime - elapsedTime));
            }

            // Hide loading and show recommendations
            this.hideRecommendationsLoading();
            this.displayRecommendations(recommendations);

        } catch (error) {
            console.error('❌ Error loading recommendations:', error);
            this.hideRecommendationsLoading();
            this.displayRecommendations(this.generateFallbackRecommendations());
        }
    }

    generateFallbackRecommendations() {
        const baseRecommendations = [
            'متابعة العميل خلال 48 ساعة عبر الهاتف',
            'إرسال رسالة نصية تذكيرية بالدفع',
            'تقديم خطة سداد مقسطة على 6 أشهر'
        ];

        // Add specific recommendation based on debtor status
        const daysOverdue = this.debtor?.daysOverdueNumber || 0;
        if (daysOverdue > 90) {
            baseRecommendations.push('إشعار العميل بالعواقب القانونية المحتملة');
        } else {
            baseRecommendations.push('تقديم حوافز للسداد المبكر');
        }

        return baseRecommendations;
    }

    displayRecommendations(recommendations) {
        const recommendationsList = document.getElementById('recommendationsList');

        if (recommendationsList) {
            recommendationsList.innerHTML = recommendations.map((rec, index) => `
                <div class="recommendation-item" style="animation-delay: ${index * 0.1}s">
                    <i class="fas fa-lightbulb"></i>
                    <div class="recommendation-text">${rec}</div>
                </div>
            `).join('');
        }
    }

    showRecommendationsLoading() {
        const loading = document.getElementById('recommendationsLoading');
        const list = document.getElementById('recommendationsList');

        if (loading) loading.classList.remove('hidden');
        if (list) list.classList.add('hidden');
    }

    hideRecommendationsLoading() {
        const loading = document.getElementById('recommendationsLoading');
        const list = document.getElementById('recommendationsList');

        if (loading) loading.classList.add('hidden');
        if (list) list.classList.remove('hidden');
    }

    exportPDF() {
        // Create PDF content
        const pdfContent = {
            debtor: this.debtor,
            callDuration: document.getElementById('finalCallDuration').textContent,
            conversation: document.getElementById('conversationTranscript').innerHTML,
            analysis: Array.from(document.querySelectorAll('.analysis-point-text')).map(el => el.textContent),
            recommendations: Array.from(document.querySelectorAll('.recommendation-text')).map(el => el.textContent),
            date: new Date().toLocaleDateString('ar-SA'),
            time: new Date().toLocaleTimeString('ar-SA')
        };

        // Here you would generate actual PDF
        console.log('Exporting PDF:', pdfContent);
        this.showNotification('جارٍ تصدير التقرير...', 'info');

        setTimeout(() => {
            this.showNotification('تم تصدير التقرير بنجاح', 'success');
        }, 2000);
    }

    scheduleFollowup() {
        this.showNotification('تم جدولة المتابعة خلال أسبوع', 'success');
    }

    showNotification(message, type = 'info') {
        // Create notification element
        const notification = document.createElement('div');
        notification.className = `notification ${type}`;
        notification.innerHTML = `
            <i class="fas ${type === 'success' ? 'fa-check-circle' : type === 'error' ? 'fa-exclamation-circle' : 'fa-info-circle'}"></i>
            <span>${message}</span>
        `;

        // Add to body
        document.body.appendChild(notification);

        // Show notification
        setTimeout(() => notification.classList.add('show'), 100);

        // Hide and remove notification
        setTimeout(() => {
            notification.classList.remove('show');
            setTimeout(() => document.body.removeChild(notification), 300);
        }, 3000);
    }

    initVoiceBotSection() {
        // Initialize VoiceBot section and preload data
        console.log('🤖 VoiceBot section initialized');

        // Preload data for better UX
        setTimeout(() => {
            if (typeof this.loadSampleCalls === 'function') {
                console.log('🔄 Preloading VoiceBot data...');
                this.loadSampleCalls();
            }
        }, 1000);
    }

    initReportsSection() {
        // Initialize reports functionality
        console.log('📊 Reports section initialized');
    }
}

// Global functions
function viewCallDetails(callId) {
    console.log(`👁️ Viewing details for call ${callId}`);

    // Find the call data
    const callsData = [
        {
            id: 1,
            customerName: 'محمد أحمد العتيبي',
            callDate: '2024-01-15 14:30',
            language: 'العربية',
            duration: '03:45',
            result: 'success',
            interactionRate: 85,
            voiceTone: 'calm',
            notes: ['العميل أظهر تعاوناً جيداً', 'وافق على خطة السداد المقترحة', 'طلب تأجيل الدفعة الأولى لمدة أسبوع']
        },
        {
            id: 2,
            customerName: 'فاطمة سعد الغامدي',
            callDate: '2024-01-15 11:20',
            language: 'العربية',
            duration: '02:15',
            result: 'partial',
            interactionRate: 62,
            voiceTone: 'neutral',
            notes: ['العميلة بدت متحفظة في البداية', 'ذكرت صعوبات مالية', 'طلبت مهلة للتفكير']
        },
        {
            id: 3,
            customerName: 'عبدالله خالد الحربي',
            callDate: '2024-01-15 09:15',
            language: 'العربية',
            duration: '01:30',
            result: 'failed',
            interactionRate: 25,
            voiceTone: 'tense',
            notes: ['العميل أظهر انزعاجاً من المكالمة', 'رفض الاستماع للعرض', 'أنهى المكالمة بشكل مفاجئ']
        },
        {
            id: 4,
            customerName: 'نورا إبراهيم القحطاني',
            callDate: '2024-01-15 16:45',
            language: 'العربية',
            duration: '04:20',
            result: 'success',
            interactionRate: 92,
            voiceTone: 'calm',
            notes: ['العميلة كانت متفهمة ومتعاونة', 'شرحت وضعها المالي بصراحة', 'اقترحت بنفسها خطة سداد بديلة']
        },
        {
            id: 5,
            customerName: 'أحمد سالم المطيري',
            callDate: '2024-01-15 13:10',
            language: 'العربية',
            duration: '02:55',
            result: 'partial',
            interactionRate: 68,
            voiceTone: 'neutral',
            notes: ['العميل تفاعل بشكل معتدل', 'طلب تفاصيل إضافية عن الفوائد', 'وعد بالرد خلال 48 ساعة']
        },
        {
            id: 6,
            customerName: 'سارة عبدالعزيز الدوسري',
            callDate: '2024-01-15 10:30',
            language: 'العربية',
            duration: '05:12',
            result: 'success',
            interactionRate: 89,
            voiceTone: 'calm',
            notes: ['مكالمة مثمرة جداً', 'العميلة أبدت استعداداً للتسوية الفورية', 'تم الاتفاق على خصم 15% مقابل السداد الكامل']
        },
        {
            id: 7,
            customerName: 'خالد محمد الشهري',
            callDate: '2024-01-15 08:45',
            language: 'العربية',
            duration: '01:45',
            result: 'failed',
            interactionRate: 32,
            voiceTone: 'tense',
            notes: ['العميل رفض النقاش من البداية', 'ادعى عدم وجود مديونية', 'هدد بالشكوى للجهات الرقابية']
        },
        {
            id: 8,
            customerName: 'مريم أحمد البلوي',
            callDate: '2024-01-15 15:20',
            language: 'العربية',
            duration: '03:30',
            result: 'success',
            interactionRate: 78,
            voiceTone: 'calm',
            notes: ['العميلة شرحت ظروفها الخاصة', 'تم الاتفاق على تقسيط المبلغ على 6 أشهر', 'ستبدأ الدفعات من الشهر القادم']
        }
    ];

    const call = callsData.find(c => c.id === callId);
    if (!call) return;

    // Create modal HTML
    const modalHTML = `
        <div class="modal-overlay" id="callDetailsModal" style="display: flex;">
            <div class="modal-container" style="max-width: 600px; background: white; border-radius: 0.75rem; padding: 0; overflow: hidden;">
                <div class="modal-header" style="background: #f8fafc; padding: 1.5rem; border-bottom: 1px solid #e2e8f0; display: flex; justify-content: space-between; align-items: center;">
                    <h3 style="margin: 0; color: #1f2937; display: flex; align-items: center; gap: 0.5rem;">
                        <i class="fas fa-phone-alt"></i>
                        تفاصيل المكالمة
                    </h3>
                    <button onclick="closeCallModal()" style="background: none; border: none; font-size: 1.25rem; color: #6b7280; cursor: pointer;">
                        <i class="fas fa-times"></i>
                    </button>
                </div>
                <div class="modal-body" style="padding: 1.5rem;">
                    <div style="margin-bottom: 2rem;">
                        <h4 style="margin: 0 0 1rem 0; color: #1f2937; display: flex; align-items: center; gap: 0.5rem;">
                            <i class="fas fa-user"></i>
                            معلومات العميل
                        </h4>
                        <div style="background: #f9fafb; padding: 1rem; border-radius: 0.5rem;">
                            <p style="margin: 0;"><strong>الاسم:</strong> ${call.customerName}</p>
                            <p style="margin: 0.5rem 0 0 0;"><strong>تاريخ المكالمة:</strong> ${call.callDate}</p>
                            <p style="margin: 0.5rem 0 0 0;"><strong>المدة:</strong> ${call.duration}</p>
                            <p style="margin: 0.5rem 0 0 0;"><strong>اللغة:</strong> ${call.language}</p>
                        </div>
                    </div>
                    
                    <div style="margin-bottom: 2rem;">
                        <h4 style="margin: 0 0 1rem 0; color: #1f2937; display: flex; align-items: center; gap: 0.5rem;">
                            <i class="fas fa-chart-bar"></i>
                            تحليل المكالمة
                        </h4>
                        <div style="display: grid; grid-template-columns: repeat(auto-fit, minmax(150px, 1fr)); gap: 1rem;">
                            <div style="text-align: center; padding: 1rem; background: #f0f9ff; border-radius: 0.5rem;">
                                <div style="font-size: 1.5rem; font-weight: bold; color: #0ea5e9;">${call.interactionRate}%</div>
                                <div style="font-size: 0.8rem; color: #64748b;">نسبة التفاعل</div>
                            </div>
                            <div style="text-align: center; padding: 1rem; background: #f0fdf4; border-radius: 0.5rem;">
                                <div style="font-size: 1rem; font-weight: bold; color: #16a34a;">${call.result === 'success' ? 'نجح' : call.result === 'partial' ? 'جزئي' : 'فشل'}</div>
                                <div style="font-size: 0.8rem; color: #64748b;">نتيجة المكالمة</div>
                            </div>
                            <div style="text-align: center; padding: 1rem; background: #fef7ed; border-radius: 0.5rem;">
                                <div style="font-size: 1rem; font-weight: bold; color: #d97706;">${call.voiceTone === 'calm' ? 'هادئة' : call.voiceTone === 'neutral' ? 'محايدة' : 'متوترة'}</div>
                                <div style="font-size: 0.8rem; color: #64748b;">نبرة الصوت</div>
                            </div>
                        </div>
                    </div>
                    
                    <div>
                        <h4 style="margin: 0 0 1rem 0; color: #1f2937; display: flex; align-items: center; gap: 0.5rem;">
                            <i class="fas fa-sticky-note"></i>
                            ملاحظات المكالمة
                        </h4>
                        <div style="background: #fafafa; padding: 1rem; border-radius: 0.5rem; border-left: 4px solid #3b82f6;">
                            ${call.notes.map(note => `<p style="margin: 0.5rem 0; color: #374151;">• ${note}</p>`).join('')}
                        </div>
                    </div>
                </div>
            </div>
        </div>
    `;

    // Add to body
    document.body.insertAdjacentHTML('beforeend', modalHTML);
}

function closeCallModal() {
    const modal = document.getElementById('callDetailsModal');
    if (modal) {
        modal.remove();
    }
}

function generateReport(reportType, format = 'pdf') {
    console.log(`📄 Generating ${reportType} report in ${format} format`);

    // Get the button that was clicked
    const button = event.target.closest('button');
    const originalHTML = button.innerHTML;

    // Show loading state
    button.innerHTML = '<i class="fas fa-spinner fa-spin"></i> جارٍ الإنشاء...';
    button.disabled = true;

    // Simulate report generation
    setTimeout(() => {
        // Create download simulation
        const link = document.createElement('a');
        link.href = '#';
        link.download = `${reportType}-report.${format === 'excel' ? 'xlsx' : 'pdf'}`;
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);

        // Restore button
        button.innerHTML = originalHTML;
        button.disabled = false;

        // Show success notification
        showNotification(`تم إنشاء ${getReportName(reportType)} بصيغة ${format.toUpperCase()} بنجاح!`, 'success');
    }, 2000);
}

function getReportName(reportType) {
    const names = {
        weekly: 'تقرير المدير الأسبوعي',
        monthly: 'التقرير الشهري التنفيذي',
        'ai-vs-manual': 'تقرير النظام الذكي مقابل الفريق اليدوي',
        branches: 'تقرير نسب التحصيل حسب الفرع'
    };
    return names[reportType] || 'التقرير';
}

function showNotification(message, type = 'success') {
    const notification = document.createElement('div');
    notification.className = `notification ${type}`;
    notification.style.cssText = `
        position: fixed;
        top: 2rem;
        right: 2rem;
        background: ${type === 'success' ? '#10b981' : '#ef4444'};
        color: white;
        padding: 1rem 1.5rem;
        border-radius: 0.5rem;
        box-shadow: 0 4px 12px rgba(0, 0, 0, 0.3);
        z-index: 9999;
        font-weight: 600;
        transform: translateX(100%);
        transition: all 0.3s ease;
        max-width: 400px;
    `;
    notification.innerHTML = `<i class="fas fa-${type === 'success' ? 'check-circle' : 'exclamation-circle'}"></i> ${message}`;

    document.body.appendChild(notification);

    // Show notification
    setTimeout(() => {
        notification.style.transform = 'translateX(0)';
    }, 100);

    // Hide notification
    setTimeout(() => {
        notification.style.transform = 'translateX(100%)';
        setTimeout(() => {
            if (notification.parentNode) {
                notification.parentNode.removeChild(notification);
            }
        }, 300);
    }, 4000);
}

// Initialize AI Call Modal when DOM is loaded
document.addEventListener('DOMContentLoaded', () => {
    window.aiCallModal = new AICallModal();
});