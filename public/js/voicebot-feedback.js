// VoiceBot Feedback Page JavaScript
class VoiceBotManager {
    constructor() {
        this.calls = [];
        this.filteredCalls = [];
        this.currentFilters = {
            date: 'today',
            language: 'all',
            result: 'all'
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
        this.loadSampleCalls();
        this.updateStats();
        this.renderCallsTable();
        this.setupMobileMenu();
        console.log('✅ All components initialized');
    }

    setupEventListeners() {
        // Filter listeners
        document.getElementById('dateFilter').addEventListener('change', (e) => {
            this.currentFilters.date = e.target.value;
            this.applyFilters();
        });

        document.getElementById('languageFilter').addEventListener('change', (e) => {
            this.currentFilters.language = e.target.value;
            this.applyFilters();
        });

        document.getElementById('resultFilter').addEventListener('change', (e) => {
            this.currentFilters.result = e.target.value;
            this.applyFilters();
        });

        // Action buttons
        document.getElementById('refreshCallsBtn').addEventListener('click', () => {
            this.refreshCalls();
        });

        document.getElementById('filterCallsBtn').addEventListener('click', () => {
            this.toggleFilters();
        });

        document.getElementById('exportCallsBtn').addEventListener('click', () => {
            this.exportCalls();
        });

        // Modal listeners
        document.getElementById('closeCallDetails').addEventListener('click', () => {
            this.closeModal();
        });

        document.getElementById('scheduleFollowupBtn').addEventListener('click', () => {
            this.scheduleFollowup();
        });

        document.getElementById('exportCallReportBtn').addEventListener('click', () => {
            this.exportCallReport();
        });

        // Close modal on overlay click
        document.getElementById('callDetailsModal').addEventListener('click', (e) => {
            if (e.target.id === 'callDetailsModal') {
                this.closeModal();
            }
        });
    }

    loadSampleCalls() {
        this.calls = [
            {
                id: 1,
                customerName: 'محمد أحمد العتيبي',
                callDate: '2024-01-15 14:30',
                language: 'العربية',
                duration: '03:45',
                result: 'success',
                interactionRate: 85,
                voiceTone: 'calm',
                paymentAgreement: true,
                smartNotes: [
                    'العميل أظهر تعاوناً جيداً أثناء المحادثة',
                    'وافق على خطة السداد المقترحة على 6 أقساط',
                    'طلب تأجيل الدفعة الأولى لمدة أسبوع',
                    'أعطى رقم هاتف إضافي للمتابعة'
                ]
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
                paymentAgreement: false,
                smartNotes: [
                    'العميلة بدت متحفظة في بداية المحادثة',
                    'ذكرت صعوبات مالية بسبب ظروف العمل',
                    'طلبت مهلة إضافية للتفكير في العرض',
                    'وعدت بالتواصل خلال 48 ساعة'
                ]
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
                paymentAgreement: false,
                smartNotes: [
                    'العميل أظهر انزعاجاً من المكالمة',
                    'ادعى عدم وجود أي التزامات مالية',
                    'رفض الاستماع للعرض المقدم',
                    'أنهى المكالمة بشكل مفاجئ'
                ]
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
                paymentAgreement: true,
                smartNotes: [
                    'العميلة كانت متفهمة ومتعاونة جداً',
                    'شرحت وضعها المالي بصراحة',
                    'اقترحت بنفسها خطة سداد بديلة',
                    'أكدت التزامها بالسداد في المواعيد المحددة'
                ]
            },
            {
                id: 5,
                customerName: 'أحمد محمد الزهراني',
                callDate: '2024-01-15 13:00',
                language: 'العربية',
                duration: '02:55',
                result: 'success',
                interactionRate: 78,
                voiceTone: 'calm',
                paymentAgreement: true,
                smartNotes: [
                    'العميل بدا مهتماً بحل المشكلة',
                    'سأل عدة أسئلة حول خيارات السداد',
                    'وافق على الخطة المقترحة مع تعديل بسيط',
                    'قدم ضمانات إضافية لتأكيد الالتزام'
                ]
            }
        ];

        this.filteredCalls = [...this.calls];
    }

    applyFilters() {
        this.filteredCalls = this.calls.filter(call => {
            let matchesDate = true;
            let matchesLanguage = true;
            let matchesResult = true;

            // Date filter (simplified for demo)
            if (this.currentFilters.date !== 'today') {
                // In real implementation, this would filter by actual dates
                matchesDate = true;
            }

            // Language filter
            if (this.currentFilters.language !== 'all') {
                matchesLanguage = call.language.includes(this.currentFilters.language === 'ar' ? 'العربية' : 'English');
            }

            // Result filter
            if (this.currentFilters.result !== 'all') {
                matchesResult = call.result === this.currentFilters.result;
            }

            return matchesDate && matchesLanguage && matchesResult;
        });

        this.updateStats();
        this.renderCallsTable();
    }

    updateStats() {
        const totalCalls = this.filteredCalls.length;
        const successfulCalls = this.filteredCalls.filter(call => call.result === 'success').length;
        const agreementCalls = this.filteredCalls.filter(call => call.paymentAgreement).length;
        const avgInteraction = Math.round(
            this.filteredCalls.reduce((sum, call) => sum + call.interactionRate, 0) / totalCalls
        );

        document.getElementById('totalCalls').textContent = totalCalls;
        document.getElementById('successfulCalls').textContent = successfulCalls;
        document.getElementById('agreementCalls').textContent = agreementCalls;
        document.getElementById('interactionRate').textContent = `${avgInteraction}%`;
    }

    renderCallsTable() {
        const tbody = document.getElementById('callsTableBody');

        if (!tbody) {
            console.error('❌ callsTableBody element not found!');
            return;
        }

        console.log(`📋 Rendering ${this.filteredCalls.length} calls to table`);

        if (this.filteredCalls.length === 0) {
            tbody.innerHTML = `
                <tr>
                    <td colspan="8" class="text-center">
                        <div style="padding: 2rem; color: #6b7280;">
                            <i class="fas fa-inbox" style="font-size: 2rem; margin-bottom: 1rem;"></i>
                            <p>لا توجد مكالمات تطابق الفلاتر المحددة</p>
                        </div>
                    </td>
                </tr>
            `;
            return;
        }

        tbody.innerHTML = this.filteredCalls.map(call => `
            <tr>
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
                    <button class="action-btn view" onclick="voiceBotManager.viewCallDetails(${call.id})" title="عرض التفاصيل">
                        <i class="fas fa-eye"></i>
                    </button>
                    <button class="action-btn download" onclick="voiceBotManager.downloadCallReport(${call.id})" title="تحميل التقرير">
                        <i class="fas fa-download"></i>
                    </button>
                </td>
            </tr>
        `).join('');
    }

    getInteractionClass(rate) {
        if (rate >= 80) return 'high';
        if (rate >= 60) return 'medium';
        return 'low';
    }

    getVoiceToneText(tone) {
        const tones = {
            calm: 'هادئة',
            neutral: 'محايدة',
            tense: 'متوترة'
        };
        return tones[tone] || tone;
    }

    viewCallDetails(callId) {
        const call = this.calls.find(c => c.id === callId);
        if (!call) return;

        // Update modal content
        document.getElementById('modalCustomerName').textContent = call.customerName;
        document.getElementById('modalCallDate').textContent = call.callDate;
        document.getElementById('modalCallDuration').textContent = call.duration;
        document.getElementById('modalLanguage').textContent = call.language;
        document.getElementById('modalInteractionRate').textContent = `${call.interactionRate}%`;
        document.getElementById('modalVoiceTone').textContent = this.getVoiceToneText(call.voiceTone);
        document.getElementById('modalAgreement').textContent = call.paymentAgreement ? 'نعم' : 'لا';
        document.getElementById('modalResponseTime').textContent = call.responseTime || '1.2 ثانية';

        // Update smart notes
        const notesContainer = document.getElementById('modalSmartNotes');
        notesContainer.innerHTML = call.smartNotes.map(note => `
            <div class="note-item">
                <i class="fas fa-lightbulb"></i>
                <div class="note-text">${note}</div>
            </div>
        `).join('');

        // Show modal
        document.getElementById('callDetailsModal').classList.add('active');
    }

    closeModal() {
        document.getElementById('callDetailsModal').classList.remove('active');
    }

    refreshCalls() {
        const refreshBtn = document.getElementById('refreshCallsBtn');
        const icon = refreshBtn.querySelector('i');

        // Add spinning animation
        icon.classList.add('fa-spin');
        refreshBtn.disabled = true;

        // Simulate refresh delay
        setTimeout(() => {
            this.loadSampleCalls();
            this.applyFilters();

            icon.classList.remove('fa-spin');
            refreshBtn.disabled = false;

            this.showNotification('تم تحديث البيانات بنجاح', 'success');
        }, 1500);
    }

    toggleFilters() {
        const filtersSection = document.querySelector('.filters-section');
        filtersSection.style.display = filtersSection.style.display === 'none' ? 'flex' : 'none';
    }

    exportCalls() {
        this.showNotification('جارٍ تصدير البيانات...', 'info');

        // Simulate export delay
        setTimeout(() => {
            this.showNotification('تم تصدير البيانات بنجاح', 'success');
        }, 2000);
    }

    downloadCallReport(callId) {
        const call = this.calls.find(c => c.id === callId);
        if (!call) return;

        this.showNotification(`جارٍ تحميل تقرير ${call.customerName}...`, 'info');

        // Simulate download delay
        setTimeout(() => {
            this.showNotification('تم تحميل التقرير بنجاح', 'success');
        }, 1500);
    }

    scheduleFollowup() {
        this.showNotification('تم جدولة المتابعة بنجاح', 'success');
        this.closeModal();
    }

    exportCallReport() {
        this.showNotification('جارٍ تصدير تقرير المكالمة...', 'info');

        setTimeout(() => {
            this.showNotification('تم تصدير التقرير بنجاح', 'success');
        }, 2000);
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
            <i class="fas fa-${type === 'success' ? 'check-circle' : type === 'error' ? 'exclamation-circle' : 'info-circle'}"></i>
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
                }
                .notification.success { border-left-color: #10b981; color: #047857; }
                .notification.error { border-left-color: #ef4444; color: #dc2626; }
                .notification.info { border-left-color: #3b82f6; color: #1d4ed8; }
            `;
            document.head.appendChild(styles);
        }

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
        }, 3000);
    }
}

// Initialize the VoiceBot Manager
console.log('🤖 VoiceBot Feedback page loading...');
const voiceBotManager = new VoiceBotManager();
console.log('✅ VoiceBot Manager initialized successfully!');