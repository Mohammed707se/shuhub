// Advanced Analytics JavaScript
class AdvancedAnalytics {
    constructor() {
        this.charts = {};
        this.currentTab = 'overview';
        this.dataGen = window.ShuhubApp.dataGen;

        this.init();
    }

    init() {
        this.initTabSwitching();
        this.initCharts();
        this.generateHeatmap();
        this.animateInsights();
    }

    initTabSwitching() {
        const tabButtons = document.querySelectorAll('.nav-tab');
        const tabPanels = document.querySelectorAll('.tab-panel');

        tabButtons.forEach(button => {
            button.addEventListener('click', () => {
                const targetTab = button.getAttribute('data-tab');

                // Update active button
                tabButtons.forEach(btn => btn.classList.remove('active'));
                button.classList.add('active');

                // Update active panel
                tabPanels.forEach(panel => panel.classList.remove('active'));
                const targetPanel = document.getElementById(targetTab);
                if (targetPanel) {
                    targetPanel.classList.add('active');
                    this.currentTab = targetTab;
                    this.refreshChartsForTab(targetTab);
                }
            });
        });

        // Export functionality
        const exportBtn = document.querySelector('.export-btn');
        if (exportBtn) {
            exportBtn.addEventListener('click', () => {
                this.exportAnalytics();
            });
        }
    }

    initCharts() {
        this.initPerformanceOverviewChart();
        this.initPerformanceComparisonChart();
        this.initTeamEfficiencyChart();
        this.initPredictionModelChart();
        this.initGrowthForecastChart();
        this.initResponsePatternChart();
        this.initCostBenefitChart();
    }

    initPerformanceOverviewChart() {
        const ctx = document.getElementById('performanceOverviewChart');
        if (!ctx) return;

        const months = ['يناير', 'فبراير', 'مارس', 'أبريل', 'مايو', 'يونيو', 'يوليو', 'أغسطس', 'سبتمبر', 'أكتوبر', 'نوفمبر', 'ديسمبر'];

        this.charts.performanceOverview = new Chart(ctx, {
            type: 'line',
            data: {
                labels: months,
                datasets: [{
                    label: 'معدل الاسترداد %',
                    data: [45.2, 48.7, 52.1, 55.8, 59.3, 62.7, 64.1, 66.8, 67.3, 69.1, 70.5, 72.1],
                    borderColor: '#00d4ff',
                    backgroundColor: 'rgba(0, 212, 255, 0.1)',
                    borderWidth: 3,
                    fill: true,
                    tension: 0.4,
                    pointRadius: 6,
                    pointHoverRadius: 8
                }, {
                    label: 'الهدف %',
                    data: [50, 52, 54, 56, 58, 60, 62, 64, 66, 68, 70, 72],
                    borderColor: '#f59e0b',
                    backgroundColor: 'transparent',
                    borderWidth: 2,
                    borderDash: [5, 5],
                    pointRadius: 0
                }, {
                    label: 'رضا العملاء %',
                    data: [78, 81, 84, 86, 88, 90, 91, 92, 94, 94.5, 95, 96],
                    borderColor: '#10b981',
                    backgroundColor: 'rgba(16, 185, 129, 0.1)',
                    borderWidth: 3,
                    fill: true,
                    tension: 0.4,
                    pointRadius: 4
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
                },
                interaction: {
                    intersect: false,
                    mode: 'index'
                }
            }
        });
    }

    initPerformanceComparisonChart() {
        const ctx = document.getElementById('performanceComparisonChart');
        if (!ctx) return;

        const quarters = ['Q1 2023', 'Q2 2023', 'Q3 2023', 'Q4 2023', 'Q1 2024'];

        this.charts.performanceComparison = new Chart(ctx, {
            type: 'bar',
            data: {
                labels: quarters,
                datasets: [{
                    label: 'قبل شُهب',
                    data: [28.5, 31.2, 29.8, 33.1, 35.4],
                    backgroundColor: 'rgba(239, 68, 68, 0.8)',
                    borderRadius: 8,
                    borderSkipped: false
                }, {
                    label: 'بعد شُهب',
                    data: [45.2, 52.1, 59.3, 64.1, 67.3],
                    backgroundColor: '#00d4ff',
                    borderRadius: 8,
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
                        cornerRadius: 8,
                        callbacks: {
                            label: function (context) {
                                return context.dataset.label + ': ' + context.parsed.y + '%';
                            }
                        }
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
                        max: 80,
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

    initTeamEfficiencyChart() {
        const ctx = document.getElementById('teamEfficiencyChart');
        if (!ctx) return;

        const teams = ['فريق الرياض', 'فريق جدة', 'فريق الدمام', 'فريق المدينة', 'فريق الطائف'];

        this.charts.teamEfficiency = new Chart(ctx, {
            type: 'radar',
            data: {
                labels: ['سرعة الاستجابة', 'معدل النجاح', 'رضا العملاء', 'الكفاءة', 'الإنتاجية'],
                datasets: [{
                    label: 'المتوسط العام',
                    data: [75, 67, 82, 71, 78],
                    borderColor: '#64748b',
                    backgroundColor: 'rgba(100, 116, 139, 0.1)',
                    borderWidth: 2,
                    pointBackgroundColor: '#64748b'
                }, {
                    label: 'فريق الرياض',
                    data: [85, 78, 91, 82, 87],
                    borderColor: '#00d4ff',
                    backgroundColor: 'rgba(0, 212, 255, 0.1)',
                    borderWidth: 3,
                    pointBackgroundColor: '#00d4ff'
                }, {
                    label: 'فريق جدة',
                    data: [79, 72, 88, 75, 81],
                    borderColor: '#10b981',
                    backgroundColor: 'rgba(16, 185, 129, 0.1)',
                    borderWidth: 3,
                    pointBackgroundColor: '#10b981'
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
                    }
                },
                scales: {
                    r: {
                        beginAtZero: true,
                        max: 100,
                        ticks: {
                            stepSize: 20,
                            color: '#64748b'
                        },
                        grid: {
                            color: 'rgba(148, 163, 184, 0.2)'
                        },
                        pointLabels: {
                            color: '#64748b',
                            font: {
                                size: 12
                            }
                        }
                    }
                }
            }
        });
    }

    initPredictionModelChart() {
        const ctx = document.getElementById('predictionModelChart');
        if (!ctx) return;

        const probabilityRanges = ['0-20%', '21-40%', '41-60%', '61-80%', '81-100%'];

        this.charts.predictionModel = new Chart(ctx, {
            type: 'doughnut',
            data: {
                labels: probabilityRanges,
                datasets: [{
                    data: [15, 25, 30, 20, 10],
                    backgroundColor: [
                        '#ef4444',
                        '#f59e0b',
                        '#eab308',
                        '#22c55e',
                        '#10b981'
                    ],
                    borderWidth: 3,
                    borderColor: '#ffffff',
                    cutout: '60%'
                }]
            },
            options: {
                responsive: true,
                maintainAspectRatio: false,
                plugins: {
                    legend: {
                        position: 'right',
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

    initGrowthForecastChart() {
        const ctx = document.getElementById('growthForecastChart');
        if (!ctx) return;

        const months = ['يناير', 'فبراير', 'مارس', 'أبريل', 'مايو', 'يونيو'];

        this.charts.growthForecast = new Chart(ctx, {
            type: 'line',
            data: {
                labels: months,
                datasets: [{
                    label: 'البيانات الفعلية',
                    data: [67.3, 68.1, 69.2, null, null, null],
                    borderColor: '#00d4ff',
                    backgroundColor: 'rgba(0, 212, 255, 0.1)',
                    borderWidth: 3,
                    fill: true,
                    tension: 0.4,
                    pointRadius: 6
                }, {
                    label: 'التوقعات',
                    data: [null, null, 69.2, 70.5, 71.8, 72.1],
                    borderColor: '#10b981',
                    backgroundColor: 'rgba(16, 185, 129, 0.1)',
                    borderWidth: 3,
                    borderDash: [10, 5],
                    fill: true,
                    tension: 0.4,
                    pointRadius: 6,
                    pointStyle: 'triangle'
                }, {
                    label: 'السيناريو المتفائل',
                    data: [null, null, 69.2, 71.2, 73.1, 74.5],
                    borderColor: '#f59e0b',
                    backgroundColor: 'rgba(245, 158, 11, 0.05)',
                    borderWidth: 2,
                    borderDash: [5, 10],
                    fill: true,
                    tension: 0.4,
                    pointRadius: 4
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
                        beginAtZero: false,
                        min: 65,
                        max: 80,
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

    initResponsePatternChart() {
        const ctx = document.getElementById('responsePatternChart');
        if (!ctx) return;

        const hours = ['8:00', '10:00', '12:00', '14:00', '16:00', '18:00', '20:00'];

        this.charts.responsePattern = new Chart(ctx, {
            type: 'line',
            data: {
                labels: hours,
                datasets: [{
                    label: 'معدل الاستجابة السبت-الأربعاء',
                    data: [45, 62, 78, 85, 92, 67, 34],
                    borderColor: '#00d4ff',
                    backgroundColor: 'rgba(0, 212, 255, 0.1)',
                    borderWidth: 3,
                    fill: true,
                    tension: 0.4
                }, {
                    label: 'معدل الاستجابة الخميس-الجمعة',
                    data: [32, 48, 55, 62, 58, 45, 28],
                    borderColor: '#f59e0b',
                    backgroundColor: 'rgba(245, 158, 11, 0.1)',
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

    initCostBenefitChart() {
        const ctx = document.getElementById('costBenefitChart');
        if (!ctx) return;

        const months = ['يناير', 'فبراير', 'مارس', 'أبريل', 'مايو', 'يونيو'];

        this.charts.costBenefit = new Chart(ctx, {
            type: 'bar',
            data: {
                labels: months,
                datasets: [{
                    label: 'التكلفة (بالآلاف)',
                    data: [125, 118, 112, 108, 105, 102],
                    backgroundColor: 'rgba(239, 68, 68, 0.8)',
                    borderRadius: 8,
                    yAxisID: 'y'
                }, {
                    label: 'العائد (بالآلاف)',
                    data: [340, 385, 420, 465, 510, 545],
                    backgroundColor: '#10b981',
                    borderRadius: 8,
                    yAxisID: 'y'
                }, {
                    label: 'ROI %',
                    data: [172, 226, 275, 331, 386, 434],
                    type: 'line',
                    borderColor: '#00d4ff',
                    backgroundColor: 'rgba(0, 212, 255, 0.1)',
                    borderWidth: 3,
                    tension: 0.4,
                    yAxisID: 'y1',
                    pointRadius: 6
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
                        type: 'linear',
                        display: true,
                        position: 'right',
                        beginAtZero: true,
                        grid: {
                            color: 'rgba(148, 163, 184, 0.1)'
                        },
                        ticks: {
                            color: '#64748b'
                        }
                    },
                    y1: {
                        type: 'linear',
                        display: true,
                        position: 'left',
                        beginAtZero: true,
                        grid: {
                            drawOnChartArea: false
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

    generateHeatmap() {
        const heatmapContainer = document.getElementById('behaviorHeatmap');
        if (!heatmapContainer) return;

        const days = ['السبت', 'الأحد', 'الاثنين', 'الثلاثاء', 'الأربعاء', 'الخميس', 'الجمعة'];
        const hours = ['8-10', '10-12', '12-14', '14-16', '16-18', '18-20'];

        // Generate heatmap data
        const heatmapData = [];
        for (let day = 0; day < 7; day++) {
            for (let hour = 0; hour < 6; hour++) {
                const intensity = Math.random();
                const value = Math.floor(intensity * 100);

                let color;
                if (intensity > 0.7) {
                    color = '#ef4444';
                } else if (intensity > 0.4) {
                    color = '#f59e0b';
                } else {
                    color = '#10b981';
                }

                heatmapData.push({
                    day: days[day],
                    hour: hours[hour],
                    value: value,
                    color: color,
                    opacity: 0.3 + (intensity * 0.7)
                });
            }
        }

        // Create heatmap cells
        heatmapContainer.innerHTML = heatmapData.map(cell => `
            <div class="heatmap-cell" 
                 style="background-color: ${cell.color}; opacity: ${cell.opacity};"
                 title="${cell.day} ${cell.hour}: ${cell.value}% نشاط">
                ${cell.value}
            </div>
        `).join('');
    }

    animateInsights() {
        const insightValues = document.querySelectorAll('.insight-value');

        insightValues.forEach(element => {
            const text = element.textContent;
            const isPercentage = text.includes('%');
            const target = parseFloat(text);

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

                if (isPercentage) {
                    element.textContent = current.toFixed(1) + '%';
                } else if (text.includes('.')) {
                    element.textContent = current.toFixed(1);
                } else {
                    element.textContent = Math.round(current);
                }
            }, 16);
        });
    }

    refreshChartsForTab(tabId) {
        setTimeout(() => {
            const chartsInTab = document.querySelector(`#${tabId}`).querySelectorAll('canvas');
            chartsInTab.forEach(canvas => {
                const chartId = canvas.id;
                if (this.charts[chartId.replace('Chart', '')]) {
                    this.charts[chartId.replace('Chart', '')].resize();
                }
            });
        }, 100);
    }

    exportAnalytics() {
        // Simulate analytics export
        const analysisData = {
            overview: {
                successRate: '89.2%',
                avgDays: '6.4',
                satisfaction: '94.1%',
                automation: '78.3%'
            },
            performance: {
                recoveryRate: '67.3%',
                improvement: '+5.2%',
                totalRecovered: '48.7M SAR',
                automatedCalls: '15,432'
            },
            predictions: {
                nextMonthRate: '72.1%',
                efficiencyIncrease: '+18.2%',
                expectedRecovery: '52.3M SAR',
                avgDays: '5.8'
            },
            efficiency: {
                overallIndex: '156%',
                avgCallTime: '2.3 min',
                costPerCase: '187 SAR',
                roi: '4.7x'
            }
        };

        console.log('Exporting analytics data:', analysisData);

        // Show success notification
        this.showExportNotification();
    }

    showExportNotification() {
        const notification = document.createElement('div');
        notification.className = 'export-notification';
        notification.innerHTML = `
            <div class="notification-content">
                <i class="fas fa-check-circle"></i>
                <span>تم تصدير التقرير التحليلي بنجاح</span>
            </div>
            <button class="notification-close">
                <i class="fas fa-times"></i>
            </button>
        `;

        document.body.appendChild(notification);

        // Auto remove after 4 seconds
        setTimeout(() => {
            if (notification.parentNode) {
                notification.remove();
            }
        }, 4000);

        // Close button functionality
        notification.querySelector('.notification-close').addEventListener('click', () => {
            notification.remove();
        });
    }
}

// Initialize Advanced Analytics when DOM is ready
document.addEventListener('DOMContentLoaded', () => {
    const analytics = new AdvancedAnalytics();

    // Make analytics available globally for debugging
    window.analytics = analytics;

    console.log('📊 Advanced Analytics initialized successfully');
});

// Add export notification styles
const exportNotificationStyles = document.createElement('style');
exportNotificationStyles.textContent = `
    .export-notification {
        position: fixed;
        top: 2rem;
        left: 50%;
        transform: translateX(-50%);
        background: linear-gradient(135deg, #10b981 0%, #059669 100%);
        color: white;
        border-radius: 0.75rem;
        box-shadow: 0 10px 25px rgba(16, 185, 129, 0.3);
        padding: 1rem 1.5rem;
        display: flex;
        align-items: center;
        gap: 1rem;
        z-index: 10000;
        animation: slideDown 0.3s ease-out;
        min-width: 350px;
    }
    
    .export-notification .notification-content {
        display: flex;
        align-items: center;
        gap: 0.75rem;
        flex: 1;
    }
    
    .export-notification .notification-content i {
        font-size: 1.25rem;
    }
    
    .export-notification .notification-close {
        background: none;
        border: none;
        color: rgba(255, 255, 255, 0.8);
        cursor: pointer;
        padding: 0.25rem;
        border-radius: 0.25rem;
        transition: all 0.3s ease;
    }
    
    .export-notification .notification-close:hover {
        background: rgba(255, 255, 255, 0.1);
        color: white;
    }
`;

document.head.appendChild(exportNotificationStyles);