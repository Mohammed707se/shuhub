// Smart Reports Page JavaScript
class SmartReportsManager {
    constructor() {
        this.downloads = [];
        this.reports = {
            weekly: { name: 'تقرير المدير الأسبوعي', size: '2.4 MB' },
            monthly: { name: 'التقرير الشهري التنفيذي', size: '5.2 MB' },
            branches: { name: 'نسب التحصيل حسب الفرع', size: '1.8 MB' },
            'customer-analysis': { name: 'تحليل أنواع العملاء', size: '3.1 MB' },
            'ai-vs-manual': { name: 'النظام الذكي مقابل الفريق اليدوي', size: '4.7 MB' },
            quarterly: { name: 'مقارنة الأداء الفصلي', size: '2.9 MB' }
        };

        this.init();
    }

    init() {
        // Wait for DOM to be fully loaded
        if (document.readyState === 'loading') {
            document.addEventListener('DOMContentLoaded', () => {
                this.initializeComponents();
            });
        } else {
            this.initializeComponents();
        }
    }

    initializeComponents() {
        console.log('🔧 Initializing components...');
        this.setupEventListeners();
        this.loadRecentDownloads();
        this.setupMobileMenu();
        console.log('✅ All components initialized');
    }

    setupEventListeners() {
        // Header actions
        document.getElementById('refreshReportsBtn').addEventListener('click', () => {
            this.refreshReports();
        });

        document.getElementById('scheduleReportBtn').addEventListener('click', () => {
            this.scheduleReport();
        });

        document.getElementById('clearHistoryBtn').addEventListener('click', () => {
            this.clearHistory();
        });

        // Modal close
        document.getElementById('loadingModal').addEventListener('click', (e) => {
            if (e.target.id === 'loadingModal') {
                this.hideLoadingModal();
            }
        });
    }

    generateReport(reportType, format = 'pdf') {
        const report = this.reports[reportType];
        if (!report) return;

        this.showLoadingModal(report.name, format);

        // Simulate report generation with progress
        let progress = 0;
        const progressInterval = setInterval(() => {
            progress += Math.random() * 20;
            if (progress > 100) {
                progress = 100;
                clearInterval(progressInterval);

                setTimeout(() => {
                    this.completeReportGeneration(report, format);
                }, 500);
            }

            document.getElementById('progressFill').style.width = `${Math.min(progress, 100)}%`;
        }, 300);
    }

    showLoadingModal(reportName, format) {
        const modal = document.getElementById('loadingModal');
        const loadingMessage = document.getElementById('loadingMessage');
        const progressFill = document.getElementById('progressFill');

        const formatText = format === 'excel' ? 'Excel' : 'PDF';
        loadingMessage.textContent = `جارٍ إنشاء ${reportName} بصيغة ${formatText}...`;
        progressFill.style.width = '0%';

        modal.classList.add('active');
    }

    hideLoadingModal() {
        document.getElementById('loadingModal').classList.remove('active');
    }

    completeReportGeneration(report, format) {
        this.hideLoadingModal();

        // Add to downloads history
        const download = {
            id: Date.now(),
            name: report.name,
            format: format,
            size: report.size,
            timestamp: new Date(),
            icon: format === 'excel' ? 'excel' : 'pdf'
        };

        this.downloads.unshift(download);
        this.updateDownloadsList();
        this.updateStats();

        this.showNotification(
            `تم إنشاء ${report.name} بنجاح!`,
            'success'
        );

        // Simulate download
        setTimeout(() => {
            this.simulateDownload(download);
        }, 1000);
    }

    simulateDownload(download) {
        // Create a temporary download link
        const link = document.createElement('a');
        link.href = '#';
        link.download = `${download.name}.${download.format === 'excel' ? 'xlsx' : 'pdf'}`;

        // In a real application, this would be the actual file URL
        // link.href = actualFileURL;

        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);

        this.showNotification('تم بدء التحميل', 'info');
    }

    updateDownloadsList() {
        const downloadsList = document.getElementById('downloadsList');

        if (!downloadsList) {
            console.error('❌ downloadsList element not found!');
            return;
        }

        console.log(`📥 Updating downloads list with ${this.downloads.length} items`);

        if (this.downloads.length === 0) {
            downloadsList.innerHTML = `
                <div style="text-align: center; padding: 3rem; color: #64748b;">
                    <i class="fas fa-download" style="font-size: 3rem; margin-bottom: 1rem; opacity: 0.3;"></i>
                    <p>لا توجد تحميلات حتى الآن</p>
                </div>
            `;
            return;
        }

        downloadsList.innerHTML = this.downloads.slice(0, 10).map(download => `
            <div class="download-item">
                <div class="download-info">
                    <div class="download-icon ${download.icon}">
                        <i class="fas fa-file-${download.icon === 'excel' ? 'excel' : 'pdf'}"></i>
                    </div>
                    <div class="download-details">
                        <h4>${download.name}</h4>
                        <p>${this.formatTimestamp(download.timestamp)} - ${download.format.toUpperCase()}</p>
                    </div>
                </div>
                <div class="download-size">${download.size}</div>
            </div>
        `).join('');
    }

    updateStats() {
        // Update downloads today count
        const today = new Date().toDateString();
        const downloadsToday = this.downloads.filter(d =>
            d.timestamp.toDateString() === today
        ).length;

        document.getElementById('downloadsToday').textContent = downloadsToday;

        // Simulate other stats updates
        const currentTotal = parseInt(document.getElementById('totalReports').textContent);
        if (this.downloads.length > 0) {
            document.getElementById('totalReports').textContent = currentTotal;
        }
    }

    formatTimestamp(timestamp) {
        const now = new Date();
        const diffMs = now - timestamp;
        const diffMins = Math.floor(diffMs / 60000);

        if (diffMins < 1) return 'الآن';
        if (diffMins < 60) return `منذ ${diffMins} دقيقة`;

        const diffHours = Math.floor(diffMins / 60);
        if (diffHours < 24) return `منذ ${diffHours} ساعة`;

        const diffDays = Math.floor(diffHours / 24);
        return `منذ ${diffDays} يوم`;
    }

    refreshReports() {
        const refreshBtn = document.getElementById('refreshReportsBtn');
        const icon = refreshBtn.querySelector('i');

        // Add spinning animation
        icon.classList.add('fa-spin');
        refreshBtn.disabled = true;

        // Simulate refresh delay
        setTimeout(() => {
            icon.classList.remove('fa-spin');
            refreshBtn.disabled = false;

            // Update last updated times
            document.querySelectorAll('.last-updated').forEach(element => {
                element.textContent = 'آخر تحديث: منذ دقيقة';
            });

            this.showNotification('تم تحديث التقارير بنجاح', 'success');
        }, 2000);
    }

    scheduleReport() {
        this.showNotification('سيتم إضافة ميزة جدولة التقارير قريباً', 'info');
    }

    clearHistory() {
        if (this.downloads.length === 0) {
            this.showNotification('لا توجد تحميلات لمسحها', 'warning');
            return;
        }

        this.downloads = [];
        this.updateDownloadsList();
        this.updateStats();
        this.showNotification('تم مسح سجل التحميلات', 'success');
    }

    loadRecentDownloads() {
        // Load some sample downloads
        this.downloads = [
            {
                id: 1,
                name: 'النظام الذكي مقابل الفريق اليدوي',
                format: 'pdf',
                size: '4.7 MB',
                timestamp: new Date(Date.now() - 30 * 60000), // 30 minutes ago
                icon: 'pdf'
            },
            {
                id: 2,
                name: 'تقرير المدير الأسبوعي',
                format: 'excel',
                size: '2.4 MB',
                timestamp: new Date(Date.now() - 2 * 60 * 60000), // 2 hours ago
                icon: 'excel'
            },
            {
                id: 3,
                name: 'نسب التحصيل حسب الفرع',
                format: 'pdf',
                size: '1.8 MB',
                timestamp: new Date(Date.now() - 6 * 60 * 60000), // 6 hours ago
                icon: 'pdf'
            }
        ];

        this.updateDownloadsList();
        this.updateStats();
    }

    setupMobileMenu() {
        const mobileMenuBtn = document.getElementById('mobileMenuBtn');
        const sidebar = document.querySelector('.sidebar');

        if (mobileMenuBtn && sidebar) {
            const initializeSidebar = () => {
                if (window.innerWidth <= 768) {
                    sidebar.classList.add('mobile-hidden');
                } else {
                    sidebar.classList.remove('mobile-hidden');
                }
            };

            initializeSidebar();

            mobileMenuBtn.addEventListener('click', (e) => {
                e.stopPropagation();
                if (window.innerWidth <= 768) {
                    sidebar.classList.toggle('mobile-hidden');
                }
            });

            document.addEventListener('click', (e) => {
                if (window.innerWidth <= 768 &&
                    !sidebar.classList.contains('mobile-hidden') &&
                    !sidebar.contains(e.target) &&
                    !mobileMenuBtn.contains(e.target)) {
                    sidebar.classList.add('mobile-hidden');
                }
            });

            window.addEventListener('resize', () => {
                initializeSidebar();
            });
        }
    }

    showNotification(message, type = 'info') {
        // Create notification element
        const notification = document.createElement('div');
        notification.className = `notification ${type}`;
        notification.innerHTML = `
            <i class="fas fa-${type === 'success' ? 'check-circle' :
                type === 'error' ? 'exclamation-circle' :
                    type === 'warning' ? 'exclamation-triangle' : 'info-circle'}"></i>
            <span>${message}</span>
        `;

        // Add to body
        document.body.appendChild(notification);

        // Add styles if not already added
        if (!document.getElementById('notification-styles')) {
            const styles = document.createElement('style');
            styles.id = 'notification-styles';
            styles.textContent = `
                .notification {
                    position: fixed;
                    top: 2rem;
                    right: 2rem;
                    background: white;
                    padding: 1rem 1.5rem;
                    border-radius: 0.5rem;
                    box-shadow: 0 4px 20px rgba(0, 0, 0, 0.15);
                    display: flex;
                    align-items: center;
                    gap: 0.5rem;
                    z-index: 9999;
                    transform: translateX(100%);
                    transition: all 0.3s ease;
                    border-left: 4px solid #3b82f6;
                    max-width: 400px;
                }
                .notification.success { border-left-color: #10b981; color: #047857; }
                .notification.error { border-left-color: #ef4444; color: #dc2626; }
                .notification.warning { border-left-color: #f59e0b; color: #d97706; }
                .notification.info { border-left-color: #3b82f6; color: #1d4ed8; }
                
                @media (max-width: 768px) {
                    .notification {
                        top: 1rem;
                        right: 1rem;
                        left: 1rem;
                        max-width: none;
                        transform: translateY(-100%);
                    }
                }
            `;
            document.head.appendChild(styles);
        }

        // Show notification
        setTimeout(() => {
            if (window.innerWidth <= 768) {
                notification.style.transform = 'translateY(0)';
            } else {
                notification.style.transform = 'translateX(0)';
            }
        }, 100);

        // Hide notification
        setTimeout(() => {
            if (window.innerWidth <= 768) {
                notification.style.transform = 'translateY(-100%)';
            } else {
                notification.style.transform = 'translateX(100%)';
            }
            setTimeout(() => {
                if (notification.parentNode) {
                    notification.parentNode.removeChild(notification);
                }
            }, 300);
        }, 4000);
    }
}

// Initialize the Smart Reports Manager
console.log('📊 Smart Reports page loading...');
const smartReports = new SmartReportsManager();
console.log('✅ Smart Reports Manager initialized successfully!');