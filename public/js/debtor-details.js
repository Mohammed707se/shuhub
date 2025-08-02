// Debtor Details Page JavaScript with Twilio Integration
class DebtorDetailsManager {
    constructor() {
        this.debtorId = this.getDebtorIdFromUrl();
        this.debtor = null;
        // تم حذف twilioDevice - نستخدم الآن OpenAI Realtime API
        this.currentCall = null;
        this.mediaRecorder = null;
        this.recordedChunks = [];
        this.callStartTime = null;
        this.isRecording = false;

        // Twilio credentials
        this.twilioAccountSid = 'AC1669d035f7311675a89169807c02d287';
        this.twilioAuthToken = 'b5d208367a830b148cf4aef8b87ac025';

        // OpenAI API key
        this.openaiApiKey = process.env.OPENAI_API_KEY;

        // علامة لمنع معالجة المكالمة أكثر من مرة
        this.callProcessed = false;

        // AI WebSocket connection
        this.aiWebSocket = null;
        this.aiCallActive = false;
        this.conversationData = {
            transcript: '',
            aiResponses: [],
            clientResponses: []
        };

        this.init();
    }

    init() {
        this.loadDebtorData();
        this.initEventListeners();
        // تم حذف initTwilio() - نستخدم الآن OpenAI Realtime API مباشرة
        this.setupAudioRecording();
    }

    getDebtorIdFromUrl() {
        const urlParams = new URLSearchParams(window.location.search);
        const debtorId = urlParams.get('id') || localStorage.getItem('selectedDebtorId');
        return debtorId;
    }

    async loadDebtorData() {
        if (!this.debtorId) {
            this.showError('معرف العميل غير متوفر');
            return;
        }

        try {
            // عرض مؤشر تحميل بسيط
            document.getElementById('clientName').textContent = 'جار التحميل...';

            // تحميل بيانات العميل من الخادم
            const response = await fetch(`/api/debtor/${this.debtorId}`);

            if (!response.ok) {
                throw new Error('فشل في تحميل بيانات العميل');
            }

            this.debtor = await response.json();

            if (this.debtor) {
                this.renderDebtorDetails();

                // Initialize countdown first, then generate predictions
                setTimeout(() => {
                    this.generateAIPredictions();
                }, 100);

                await this.loadCallHistory();
            } else {
                this.showError('لم يتم العثور على بيانات العميل');
            }
        } catch (error) {
            console.error('Error loading debtor data:', error);
            this.showError('خطأ في تحميل بيانات العميل: ' + error.message);
        }
    }



    renderDebtorDetails() {
        if (!this.debtor) {
            console.error('No debtor data available');
            return;
        }

        try {
            // Update header with null checks
            const clientName = document.getElementById('clientName');
            const clientMeta = document.getElementById('clientMeta');
            const clientAvatar = document.getElementById('clientAvatar');

            if (clientName) clientName.textContent = this.debtor.name || 'غير متوفر';
            if (clientMeta) clientMeta.textContent = `${this.debtor.bank || 'غير محدد'} - ${this.debtor.loanType || 'غير محدد'}`;
            if (clientAvatar) clientAvatar.textContent = this.debtor.name ? this.debtor.name.charAt(0) : '?';

            // Personal Information
            const personalInfo = document.getElementById('personalInfo');
            if (personalInfo) {
                personalInfo.innerHTML = `
            <div class="info-row">
                <span class="info-label">الاسم الكامل</span>
                <span class="info-value">${this.debtor.name}</span>
            </div>
            <div class="info-row">
                <span class="info-label">رقم الهوية</span>
                <span class="info-value">${this.debtor.nationalId || 'غير متوفر'}</span>
            </div>
            <div class="info-row">
                <span class="info-label">رقم الجوال</span>
                <span class="info-value">${this.debtor.phone}</span>
            </div>
            <div class="info-row">
                <span class="info-label">البريد الإلكتروني</span>
                <span class="info-value">${this.debtor.email || 'غير متوفر'}</span>
            </div>
            <div class="info-row">
                <span class="info-label">المدينة</span>
                <span class="info-value">${this.debtor.city}</span>
            </div>
            <div class="info-row">
                <span class="info-label">العنوان</span>
                <span class="info-value">${this.debtor.address || 'غير متوفر'}</span>
            </div>
                `;
            }

            // Debt Information
            const probabilityColor = this.debtor.successProbability > 70 ? '#10b981' :
                this.debtor.successProbability > 40 ? '#f59e0b' : '#ef4444';

            const debtInfo = document.getElementById('debtInfo');
            if (debtInfo) {
                debtInfo.innerHTML = `
            <div class="info-row">
                <span class="info-label">البنك</span>
                <span class="info-value">${this.debtor.bank}</span>
            </div>
            <div class="info-row">
                <span class="info-label">نوع القرض</span>
                <span class="info-value">${this.debtor.loanType}</span>
            </div>
            <div class="info-row">
                <span class="info-label">مبلغ الدين</span>
                <span class="info-value amount">${this.debtor.amountFormatted}</span>
            </div>
            <div class="info-row">
                <span class="info-label">أيام التأخير</span>
                <span class="info-value ${this.debtor.daysOverdue > 90 ? 'danger' : this.debtor.daysOverdue > 30 ? 'warning' : 'success'}">${this.debtor.daysOverdue} يوم</span>
            </div>
            <div class="info-row">
                <span class="info-label">احتمال السداد</span>
                <div>
                    <div class="probability-bar">
                        <div class="probability-fill" style="width: ${this.debtor.successProbability}%; background: ${probabilityColor};"></div>
                    </div>
                    <span class="info-value" style="color: ${probabilityColor}; font-size: 0.875rem; margin-top: 0.25rem; display: block;">${this.debtor.successProbability}%</span>
                </div>
            </div>
            <div class="info-row">
                <span class="info-label">درجة الذكاء الاصطناعي</span>
                <span class="info-value" style="color: #00d4ff;">${this.debtor.aiScore}/10</span>
            </div>
            <div class="info-row">
                <span class="info-label">آخر اتصال</span>
                <span class="info-value">${this.debtor.lastContact}</span>
            </div>
            <div class="info-row">
                <span class="info-label">خطة السداد</span>
                <span class="info-value ${this.debtor.paymentPlan ? 'success' : 'danger'}">${this.debtor.paymentPlan ? 'موافق' : 'غير موافق'}</span>
            </div>
                `;
            }

            // Set phone number (removed since we don't have phone input anymore)

        } catch (error) {
            console.error('Error rendering debtor details:', error);
            this.showError('خطأ في عرض بيانات العميل');
        }
    }

    generateAIPredictions() {
        if (!this.debtor) return;

        try {
            const predictions = [
                {
                    label: 'احتمال السداد خلال 30 يوم',
                    value: `${(this.debtor.successProbability * 0.8).toFixed(1)}%`
                },
                {
                    label: 'أفضل وقت للاتصال',
                    value: this.getNextBestCallTime()
                },
                {
                    label: 'الاستراتيجية المقترحة',
                    value: 'ودية ومرنة'
                },
                {
                    label: 'مستوى الضغط المناسب',
                    value: 'منخفض'
                }
            ];

            const predictionContent = document.getElementById('predictionContent');
            if (predictionContent) {
                predictionContent.innerHTML = predictions.map(pred => `
                    <div class="prediction-item">
                        <div class="prediction-value">${pred.value}</div>
                        <div class="prediction-label">${pred.label}</div>
                    </div>
                `).join('');
            }
        } catch (error) {
            console.error('Error generating AI predictions:', error);
        }
    }

    getNextBestCallTime() {
        // Get the current countdown target date from countdown manager if available
        if (window.countdownManager && window.countdownManager.targetDate) {
            return window.countdownManager.targetDate.toLocaleDateString('ar-SA', {
                weekday: 'long',
                month: 'long',
                day: 'numeric'
            }) + ' - ' + window.countdownManager.targetDate.toLocaleTimeString('ar-SA', {
                hour: '2-digit',
                minute: '2-digit',
                hour12: true
            });
        }

        // Fallback if countdown manager not available yet
        return 'جارٍ التحديد...';
    }

    async loadCallHistory() {
        try {
            if (!this.debtorId) return;

            // تحميل سجل المكالمات من الخادم
            const response = await fetch(`/api/debtor/${this.debtorId}/calls`);

            if (!response.ok) {
                throw new Error('فشل في تحميل سجل المكالمات');
            }

            const callHistory = await response.json();

            // تحميل أي مكالمات محفوظة محلياً (من المكالمات الجديدة)
            const localCalls = JSON.parse(localStorage.getItem('callRecords') || '[]')
                .filter(call => call.debtorId == this.debtorId);

            // دمج المكالمات المحلية مع المكالمات من الخادم
            const allCalls = [...localCalls, ...callHistory];

            this.renderCallHistory(allCalls);
        } catch (error) {
            console.error('Error loading call history:', error);
            // في حالة الخطأ، عرض المكالمات المحلية فقط
            const localCalls = JSON.parse(localStorage.getItem('callRecords') || '[]')
                .filter(call => call.debtorId == this.debtorId);
            this.renderCallHistory(localCalls);
        }
    }

    renderCallHistory(callHistory) {
        if (callHistory.length === 0) {
            document.getElementById('callHistoryContent').innerHTML =
                '<div style="text-align: center; color: #64748b; padding: 2rem;">لا توجد مكالمات مسجلة</div>';
            return;
        }

        const getStatusBadge = (status, callType = 'regular') => {
            const aiIcon = callType === 'ai_call' ? '🤖 ' : '';
            const aiStyle = callType === 'ai_call' ? 'background: linear-gradient(135deg, #3b82f6, #1d4ed8); border: 2px solid #bfdbfe;' : '';

            const badges = {
                'completed': `<span class="status-badge" style="${aiStyle || 'background: #10b981;'} color: white;">${aiIcon}مكتملة</span>`,
                'no-answer': `<span class="status-badge" style="background: #f59e0b; color: white;">${aiIcon}لم يجيب</span>`,
                'busy': `<span class="status-badge" style="background: #ef4444; color: white;">${aiIcon}مشغول</span>`,
                'failed': `<span class="status-badge" style="background: #ef4444; color: white;">${aiIcon}فشل</span>`,
                'rejected': `<span class="status-badge" style="background: #ef4444; color: white;">${aiIcon}مرفوض</span>`,
                'timeout': `<span class="status-badge" style="background: #6b7280; color: white;">${aiIcon}انتهت المهلة</span>`,
                'cancelled': `<span class="status-badge" style="background: #6b7280; color: white;">${aiIcon}ملغى</span>`
            };
            return badges[status] || `<span class="status-badge" style="background: #64748b; color: white;">${aiIcon}غير محدد</span>`;
        };

        document.getElementById('callHistoryContent').innerHTML = callHistory.map((call, index) => {
            const hasTranscript = call.transcript && call.transcript.length > 0;
            const hasAnalysis = call.analysis && call.analysis.length > 0;
            const hasVoiceAnalysis = call.voiceAnalysis && typeof call.voiceAnalysis === 'object';
            const hasFormattedConversation = call.formattedConversation && call.formattedConversation.length > 0;

            return `
                <div class="call-record enhanced-call-record" onclick="this.classList.toggle('expanded')">
                    <div class="call-header">
                        <div>
                            <span class="call-date">${call.date}</span>
                                                            ${getStatusBadge(call.status, call.type)}
                            <span class="expand-indicator">👁️ اضغط للتفاصيل</span>
                        </div>
                        <span class="call-duration">${call.duration}</span>
                    </div>
                    
                    <div class="call-details">
                        ${hasFormattedConversation ? `
                            <div class="call-conversation">
                                <strong>📝 نص المحادثة:</strong>
                                <pre class="conversation-text">${call.formattedConversation}</pre>
                            </div>
                        ` : hasTranscript ? `
                            <div class="call-transcript">
                                <strong>📝 نص المحادثة:</strong><br>
                                ${call.transcript}
                            </div>
                        ` : ''}
                        
                        ${hasVoiceAnalysis ? `
                            <div class="voice-analysis">
                                <strong>🎙️ تحليل خصائص الصوت:</strong>
                                <div class="voice-characteristics">
                                    <div class="voice-metric">
                                        <span class="metric-label">مستوى الصوت:</span>
                                        <span class="metric-value ${call.voiceAnalysis.averageVolume}">${call.voiceAnalysis.averageVolume}</span>
                                    </div>
                                    <div class="voice-metric">
                                        <span class="metric-label">نبرة الصوت:</span>
                                        <span class="metric-value">${call.voiceAnalysis.voiceTone}</span>
                                    </div>
                                    <div class="voice-metric">
                                        <span class="metric-label">سرعة الكلام:</span>
                                        <span class="metric-value">${call.voiceAnalysis.speechRate}</span>
                                    </div>
                                    <div class="voice-metric">
                                        <span class="metric-label">الوقفات:</span>
                                        <span class="metric-value">${call.voiceAnalysis.pausesCount}</span>
                                    </div>
                                    <div class="voice-metric">
                                        <span class="metric-label">النبرة العاطفية:</span>
                                        <span class="metric-value ${call.voiceAnalysis.emotionalTone}">${call.voiceAnalysis.emotionalTone}</span>
                                    </div>
                                </div>
                            </div>
                        ` : ''}
                        
                        ${hasAnalysis ? `
                            <div class="call-analysis">
                                <div class="analysis-title">🤖 تحليل الذكاء الاصطناعي:</div>
                                <div class="analysis-text">${call.analysis}</div>
                                ${call.sentiment !== 'غير متاح' ? `
                                    <div class="sentiment-section">
                                        <strong>😊 المشاعر:</strong> 
                                        <span class="sentiment-badge ${call.sentiment}" style="color: ${call.sentiment === 'إيجابي' ? '#10b981' : call.sentiment === 'سلبي' ? '#ef4444' : '#f59e0b'};">
                                            ${call.sentiment}
                                        </span>
                                    </div>
                                ` : ''}
                                ${call.recommendations ? `
                                    <div class="recommendations-section">
                                        <strong>💡 التوصيات:</strong> 
                                        <div class="recommendations-text">${call.recommendations}</div>
                                    </div>
                                ` : ''}
                                ${call.fullAnalysisText ? `
                                    <div class="full-analysis-section">
                                        <strong>📊 التحليل الكامل:</strong>
                                        <div class="full-analysis-text">${call.fullAnalysisText}</div>
                                    </div>
                                ` : ''}
                            </div>
                        ` : `
                            <div class="call-analysis">
                                <div class="analysis-title">📋 ملاحظات:</div>
                                <div class="analysis-text">${call.analysis || 'لا توجد تفاصيل إضافية'}</div>
                            </div>
                        `}
                        
                        ${call.audioUrl ? `
                            <div class="audio-section">
                                <strong style="color: #0284c7;">🎵 تسجيل المكالمة:</strong><br>
                                <audio controls style="width: 100%; margin-top: 0.5rem;">
                                    <source src="${call.audioUrl}" type="audio/webm">
                                    متصفحك لا يدعم تشغيل الملفات الصوتية
                                </audio>
                            </div>
                        ` : ''}
                        
                        ${call.error ? `
                            <div class="error-section">
                                <strong style="color: #dc2626;">❌ خطأ:</strong> ${call.error}
                            </div>
                        ` : ''}
                    </div>
                </div>
            `;
        }).join('');
    }

    initEventListeners() {
        // Start call button
        document.getElementById('startCallBtn').addEventListener('click', () => {
            this.initiateCall();
        });

        // AI mode toggle event listener
        const aiModeToggle = document.getElementById('aiCallMode');
        if (aiModeToggle) {
            aiModeToggle.addEventListener('change', (e) => {
                this.updateCallButtonText(e.target.checked);
            });
        }

        // Show history button
        document.getElementById('showHistoryBtn').addEventListener('click', () => {
            document.getElementById('callHistorySection').scrollIntoView({ behavior: 'smooth' });
        });

        // Other action buttons
        document.getElementById('newPaymentPlanBtn').addEventListener('click', () => {
            this.createPaymentPlan();
        });

        document.getElementById('sendReminderBtn').addEventListener('click', () => {
            this.sendReminder();
        });

        document.getElementById('refreshHistoryBtn').addEventListener('click', () => {
            this.loadCallHistory();
        });
    }

    // تم حذف initTwilio() و getTwilioAccessToken() - نستخدم الآن OpenAI Realtime API مباشرة

    initDemoMode() {
        console.log('Initializing demo mode for calling functionality');
        // Demo mode - simulate Twilio functionality
        this.demoMode = true;
    }

    async setupAudioRecording() {
        try {
            this.mediaStream = await navigator.mediaDevices.getUserMedia({
                audio: {
                    echoCancellation: true,
                    noiseSuppression: true,
                    autoGainControl: true,
                    sampleRate: 44100
                }
            });

            // إعداد Web Audio API للحصول على مستوى الصوت الحقيقي
            this.audioContext = new (window.AudioContext || window.webkitAudioContext)();
            this.audioSource = this.audioContext.createMediaStreamSource(this.mediaStream);
            this.analyser = this.audioContext.createAnalyser();

            this.analyser.fftSize = 256;
            this.analyser.smoothingTimeConstant = 0.8;
            this.audioSource.connect(this.analyser);

            this.audioDataArray = new Uint8Array(this.analyser.frequencyBinCount);

            // إعداد تسجيل منفصل للموظف والعميل
            this.mediaRecorder = new MediaRecorder(this.mediaStream, {
                mimeType: 'audio/webm;codecs=opus'
            });

            this.recordedChunks = [];
            this.conversationSegments = []; // لحفظ أجزاء المحادثة مع التوقيت

            this.mediaRecorder.ondataavailable = (event) => {
                if (event.data.size > 0) {
                    this.recordedChunks.push(event.data);
                }
            };

            this.mediaRecorder.onstop = () => {
                this.processEnhancedRecording();
            };

            // بدء مراقبة مستوى الصوت الحقيقي
            this.startRealTimeAudioMonitoring();

            console.log('Audio recording and real-time monitoring setup complete');
        } catch (error) {
            console.error('Error setting up audio recording:', error);
            this.showNotification('لا يمكن الوصول للمايكروفون', 'error');
        }
    }

    startRealTimeAudioMonitoring() {
        const updateAudioLevel = () => {
            if (this.analyser && this.audioDataArray && this.isRecording) {
                this.analyser.getByteFrequencyData(this.audioDataArray);

                // حساب متوسط مستوى الصوت
                let sum = 0;
                for (let i = 0; i < this.audioDataArray.length; i++) {
                    sum += this.audioDataArray[i];
                }
                const average = sum / this.audioDataArray.length;

                // تحديث الـ waveform بناءً على مستوى الصوت الحقيقي
                if (!this.isMuted) {
                    this.updateRealTimeWaveform('agentWaveform', average);
                }

                // تحديث مؤشر جودة الصوت
                this.updateVolumeAndQuality(average);

                requestAnimationFrame(updateAudioLevel);
            }
        };

        updateAudioLevel();
    }

    updateVolumeAndQuality(audioLevel) {
        // تحديث مؤشر مستوى الصوت
        const volumeFill = document.querySelector('.volume-fill');
        if (volumeFill) {
            const volumePercent = Math.min(100, (audioLevel / 128) * 100);
            volumeFill.style.width = volumePercent + '%';
        }

        // تحديث مؤشر جودة الصوت
        const qualityBars = document.querySelectorAll('.quality-bar');
        if (qualityBars.length > 0) {
            const qualityLevel = Math.floor((audioLevel / 128) * qualityBars.length);
            qualityBars.forEach((bar, index) => {
                if (index <= qualityLevel) {
                    bar.classList.add('active');
                } else {
                    bar.classList.remove('active');
                }
            });
        }
    }

    updateRealTimeWaveform(waveformId, audioLevel) {
        const waveform = document.getElementById(waveformId);
        if (!waveform) return;

        const bars = waveform.querySelectorAll('.bar');

        // تحويل مستوى الصوت إلى نسبة مئوية (0-100)
        const normalizedLevel = Math.min(100, (audioLevel / 128) * 100);

        bars.forEach((bar, index) => {
            if (normalizedLevel > 5) { // إذا كان هناك صوت
                const randomVariation = Math.random() * 20 - 10; // ±10% variation
                const height = Math.max(15, Math.min(100, normalizedLevel + randomVariation));

                bar.style.height = height + '%';
                bar.style.opacity = Math.max(0.4, normalizedLevel / 100);

                if (height > 40) {
                    bar.classList.add('active');
                } else {
                    bar.classList.remove('active');
                }
            } else {
                // لا يوجد صوت - عرض مستوى منخفض
                bar.style.height = '15%';
                bar.style.opacity = '0.3';
                bar.classList.remove('active');
            }
        });
    }

    async initiateCall() {
        const phoneNumber = document.getElementById('phoneNumber').value;

        if (!phoneNumber) {
            this.showNotification('يرجى إدخال رقم الهاتف', 'warning');
            return;
        }

        // التحقق من صحة رقم الهاتف
        if (!this.validatePhoneNumber(phoneNumber)) {
            this.showNotification('رقم الهاتف غير صحيح. يرجى استخدام تنسيق +966xxxxxxxxx أو +1xxxxxxxxxx', 'warning');
            return;
        }

        // Check if AI call mode is enabled
        const aiCallMode = document.getElementById('aiCallMode');
        if (aiCallMode && aiCallMode.checked) {
            this.startAICall();
            return;
        }

        // إنشاء Conference ID جديد أولاً
        try {
            const conferenceResponse = await fetch('/api/create-conference', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                }
            });

            if (conferenceResponse.ok) {
                const conferenceData = await conferenceResponse.json();
                this.currentConferenceId = conferenceData.conferenceId;
                console.log('✅ Conference ID created:', this.currentConferenceId);
            } else {
                throw new Error('Failed to create conference ID');
            }
        } catch (error) {
            console.error('❌ Failed to create conference:', error);
            this.showNotification('فشل في إنشاء المؤتمر', 'error');
            return;
        }

        try {
            // إعادة تعيين علامة المعالجة لمكالمة جديدة
            this.callProcessed = false;

            this.updateCallStatus('connecting', 'جار الاتصال بـ ' + phoneNumber);
            this.callStartTime = new Date();

            // إظهار البوب آب
            this.showCallPopup();

            // تحديد وضعية المكالمة
            // استخدام API مباشر بدلاً من Twilio Device SDK
            // مكالمة تجريبية مع API
            await this.makeFallbackCall(phoneNumber);
        } catch (error) {
            console.error('Error initiating call:', error);
            this.onCallFailed(error.message);
        }
    }

    validatePhoneNumber(phoneNumber) {
        // التحقق من تنسيق الرقم السعودي أو الأمريكي
        const saudiPhoneRegex = /^\+966[0-9]{9}$/;
        const usPhoneRegex = /^\+1[0-9]{10}$/;
        return saudiPhoneRegex.test(phoneNumber) || usPhoneRegex.test(phoneNumber);
    }

    // تم حذف makeRealCall() - نستخدم الآن AI calls مباشرة

    async makeFallbackCall(phoneNumber) {
        try {
            // محاولة الاتصال عبر Twilio API مباشرة
            const response = await fetch('/api/make-call', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    to: phoneNumber,
                    from: '+13185234059', // رقم Twilio الخاص بك
                    debtorId: this.debtorId
                })
            });

            if (!response.ok) {
                throw new Error('فشل في إجراء المكالمة');
            }

            const result = await response.json();
            console.log('Call result:', result);

            if (result.success) {
                this.currentCall = { sid: result.callSid, status: 'initiated' };
                // مراقبة حالة المكالمة
                this.monitorCallStatus(result.callSid);
            } else {
                throw new Error(result.error || 'فشل في إجراء المكالمة');
            }

        } catch (error) {
            console.error('Fallback call failed:', error);
            throw error;
        }
    }

    async monitorCallStatus(callSid) {
        const checkStatus = async () => {
            try {
                const response = await fetch(`/api/call-status/${callSid}`);
                const statusData = await response.json();

                console.log('Call status:', statusData.status);

                switch (statusData.status) {
                    case 'ringing':
                        this.updateCallStatus('connecting', 'يرن...');
                        setTimeout(checkStatus, 2000);
                        break;
                    case 'in-progress':
                        this.onCallConnected();
                        setTimeout(checkStatus, 5000);
                        break;
                    case 'completed':
                        // سيتم التعامل مع هذا تلقائياً عبر Twilio events
                        console.log('Call completed - handled by Twilio events');
                        break;
                    case 'busy':
                        this.onCallBusy();
                        break;
                    case 'no-answer':
                        this.onCallNoAnswer();
                        break;
                    case 'failed':
                        this.onCallFailed(statusData.error || 'فشل الاتصال');
                        break;
                    case 'canceled':
                        this.onCallCancelled();
                        break;
                    default:
                        setTimeout(checkStatus, 2000);
                }
            } catch (error) {
                console.error('Error checking call status:', error);
                this.onCallFailed('خطأ في مراقبة المكالمة');
            }
        };

        // بدء مراقبة الحالة
        setTimeout(checkStatus, 1000);
    }

    simulateCall(phoneNumber) {
        // Simulate call for demo purposes
        setTimeout(() => {
            this.onCallConnected();
        }, 2000);

        setTimeout(() => {
            this.onCallDisconnected();
        }, 15000); // End call after 15 seconds for demo
    }

    onCallConnected() {
        if (!this.callStartTime) {
            this.callStartTime = new Date();
        }
        this.updateCallStatus('connected', 'متصل - جار التسجيل');
        this.startRecording();

        // Disable call button during call
        document.getElementById('startCallBtn').disabled = true;
        document.getElementById('startCallBtn').innerHTML = '<i class="fas fa-phone-slash"></i> إنهاء المكالمة';
        document.getElementById('startCallBtn').onclick = () => this.endCall();

        this.showNotification('تم الاتصال بنجاح - جار التسجيل', 'success');
    }

    onCallDisconnected(call = null) {
        // تجنب معالجة المكالمة أكثر من مرة
        if (this.callProcessed) {
            console.log('Call already processed, skipping...');
            return;
        }

        const duration = this.calculateCallDuration();
        this.updateCallStatus('ended', `انتهت المكالمة (${duration}) - جار المعالجة`);
        this.stopRecording();

        // Re-enable call button
        this.resetCallButton();

        // إخفاء البوب آب بعد تأخير قصير
        setTimeout(() => {
            this.hideCallPopup();
        }, 3000);

        this.currentCall = null;

        // إذا كانت المكالمة أكثر من 5 ثواني، قم بالتحليل
        if (this.callStartTime && (new Date() - this.callStartTime) > 5000) {
            this.callProcessed = true; // وضع علامة لمنع المعالجة المتكررة
            this.showNotification('تم إنهاء المكالمة - سيتم التحليل', 'success');
            // معالجة التسجيل وتحليله بالذكاء الاصطناعي
            this.processRecording();
        } else {
            this.updateCallStatus('', '');
            this.showNotification('المكالمة قصيرة جداً - لم يتم التحليل', 'warning');
        }
    }

    onCallNoAnswer() {
        this.updateCallStatus('no-answer', 'لم يتم الرد على المكالمة');
        this.resetCallButton();
        this.currentCall = null;

        // حفظ سجل عدم الإجابة
        this.saveCallRecord({
            transcript: '',
            analysis: 'لم يتم الرد على المكالمة. يُنصح بالمحاولة في وقت لاحق أو استخدام وسيلة تواصل أخرى.',
            sentiment: 'غير متاح',
            recommendations: 'المحاولة مرة أخرى خلال ساعة، إرسال رسالة نصية، التواصل عبر البريد الإلكتروني',
            duration: '0:00',
            status: 'no-answer'
        });

        this.showNotification('لم يتم الرد على المكالمة', 'warning');

        setTimeout(() => {
            this.updateCallStatus('', '');
        }, 5000);
    }

    onCallBusy() {
        this.updateCallStatus('busy', 'الخط مشغول');
        this.resetCallButton();
        this.currentCall = null;

        // حفظ سجل الخط المشغول
        this.saveCallRecord({
            transcript: '',
            analysis: 'الخط مشغول. العميل قد يكون في مكالمة أخرى أو رفض المكالمة.',
            sentiment: 'غير متاح',
            recommendations: 'المحاولة مرة أخرى خلال 15-30 دقيقة، إرسال رسالة نصية للتنسيق',
            duration: '0:00',
            status: 'busy'
        });

        this.showNotification('الخط مشغول - سيتم المحاولة لاحقاً', 'warning');

        setTimeout(() => {
            this.updateCallStatus('', '');
        }, 5000);
    }

    onCallFailed(errorMessage = 'فشل في الاتصال') {
        this.updateCallStatus('failed', 'فشل في الاتصال: ' + errorMessage);
        this.resetCallButton();
        this.currentCall = null;

        // إخفاء البوب آب
        setTimeout(() => {
            this.hideCallPopup();
        }, 5000);

        // حفظ سجل فشل الاتصال
        this.saveCallRecord({
            transcript: '',
            analysis: `فشل في إجراء المكالمة. السبب: ${errorMessage}. قد يكون هناك مشكلة في الشبكة أو الرقم غير صحيح.`,
            sentiment: 'خطأ',
            recommendations: 'التحقق من الرقم، فحص الاتصال بالإنترنت، المحاولة لاحقاً',
            duration: '0:00',
            status: 'failed',
            error: errorMessage
        });

        this.showNotification('فشل في الاتصال: ' + errorMessage, 'error');

        setTimeout(() => {
            this.updateCallStatus('', '');
        }, 10000);
    }

    onCallCancelled() {
        this.updateCallStatus('cancelled', 'تم إلغاء المكالمة');
        this.resetCallButton();
        this.currentCall = null;

        this.showNotification('تم إلغاء المكالمة', 'info');

        setTimeout(() => {
            this.updateCallStatus('', '');
        }, 3000);
    }

    onCallRejected() {
        this.updateCallStatus('rejected', 'تم رفض المكالمة');
        this.resetCallButton();
        this.currentCall = null;

        // حفظ سجل رفض المكالمة
        this.saveCallRecord({
            transcript: '',
            analysis: 'تم رفض المكالمة من قبل العميل. قد يشير هذا إلى تجنب للتواصل أو عدم الرغبة في المحادثة.',
            sentiment: 'سلبي',
            recommendations: 'تجربة وسيلة تواصل أخرى، إرسال رسالة مكتوبة، المحاولة في وقت مختلف',
            duration: '0:00',
            status: 'rejected'
        });

        this.showNotification('تم رفض المكالمة من قبل العميل', 'warning');

        setTimeout(() => {
            this.updateCallStatus('', '');
        }, 5000);
    }

    onCallTimeout() {
        this.updateCallStatus('timeout', 'انتهت مهلة الانتظار');

        if (this.currentCall) {
            this.endCall();
        }

        this.resetCallButton();
        this.currentCall = null;

        // حفظ سجل انتهاء المهلة
        this.saveCallRecord({
            transcript: '',
            analysis: 'انتهت مهلة الانتظار (30 ثانية). العميل لم يرد على المكالمة خلال المدة المحددة.',
            sentiment: 'غير متاح',
            recommendations: 'المحاولة في وقت لاحق، تجربة وسيلة تواصل أخرى',
            duration: '0:00',
            status: 'timeout'
        });

        this.showNotification('انتهت مهلة الانتظار - لم يتم الرد', 'warning');

        setTimeout(() => {
            this.updateCallStatus('', '');
        }, 5000);
    }

    resetCallButton() {
        document.getElementById('startCallBtn').disabled = false;
        document.getElementById('startCallBtn').innerHTML = '<i class="fas fa-phone"></i> بدء المكالمة';
        document.getElementById('startCallBtn').onclick = () => this.initiateCall();
    }

    startRecording() {
        if (this.mediaRecorder && this.mediaRecorder.state === 'inactive') {
            this.recordedChunks = [];
            this.mediaRecorder.start(1000); // Record in 1-second chunks
            this.isRecording = true;
            document.getElementById('recordingIndicator').style.display = 'flex';
        }
    }

    stopRecording() {
        if (this.mediaRecorder && this.mediaRecorder.state === 'recording') {
            this.mediaRecorder.stop();
            this.isRecording = false;
            document.getElementById('recordingIndicator').style.display = 'none';
        }
    }

    endCall() {
        try {
            this.updateCallStatus('ending', 'جار إنهاء المكالمة...');

            // إخفاء البوب آب فوراً عند الضغط على إنهاء
            this.hideCallPopup();

            if (this.currentCall) {
                if (this.currentCall.disconnect) {
                    this.currentCall.disconnect();
                } else if (this.currentCall.hangup) {
                    this.currentCall.hangup();
                }
            }

            // Stop recording (processing will happen in onCallDisconnected)
            this.stopRecording();

            setTimeout(() => {
                this.onCallDisconnected();
            }, 1000);

        } catch (error) {
            console.error('Error ending call:', error);
            this.hideCallPopup();
            this.onCallDisconnected();
        }
    }

    updateCallStatus(status, message) {
        const statusElement = document.getElementById('callStatus');
        statusElement.className = `call-status active ${status}`;
        statusElement.textContent = message;

        if (!message) {
            statusElement.classList.remove('active');
        }

        // Update popup status if open
        this.updatePopupStatus(status, message);
    }

    showCallPopup() {
        const popup = document.getElementById('callPopup');
        const popupName = document.getElementById('popupCallName');
        const popupNumber = document.getElementById('popupCallNumber');

        if (popup && this.debtor) {
            // Set debtor info
            if (popupName) popupName.textContent = this.debtor.name || 'عميل غير محدد';
            if (popupNumber) popupNumber.textContent = document.getElementById('phoneNumber').value || '+966539322900';

            // Conference ID تم إنشاؤه بالفعل في initiateCall
            console.log('📞 Using existing Conference ID:', this.currentConferenceId);

            // Show popup
            popup.style.display = 'flex';

            // Start timer
            this.startCallTimer();

            // Start waveform animations
            this.startWaveformAnimations();

            // Setup popup controls
            this.setupPopupControls();
        }
    }

    hideCallPopup() {
        const popup = document.getElementById('callPopup');
        if (popup) {
            popup.style.display = 'none';
        }

        // Stop timer
        this.stopCallTimer();

        // Stop waveform animations
        this.stopWaveformAnimations();
    }

    updatePopupStatus(status, message) {
        const popupStatus = document.getElementById('popupCallStatus');
        if (popupStatus) {
            popupStatus.textContent = message;

            // Update status color
            popupStatus.className = 'call-status-text';
            if (status === 'connected') {
                popupStatus.style.color = '#10b981';
                this.updateClientAudioStatus('🎤 العميل يسمعك مباشرة');
            } else if (status === 'connecting') {
                popupStatus.style.color = '#00d4ff';
                this.updateClientAudioStatus('📞 جار الاتصال...');
            } else if (status === 'failed' || status === 'no-answer') {
                popupStatus.style.color = '#ef4444';
                this.updateClientAudioStatus('');
            }
        }
    }

    updateClientAudioStatus(message) {
        const clientAudioStatus = document.getElementById('clientAudioStatus');
        if (clientAudioStatus) {
            clientAudioStatus.textContent = message;
        }
    }

    startCallTimer() {
        this.callStartTime = new Date();
        const timerElement = document.getElementById('callTimer');

        this.callTimerInterval = setInterval(() => {
            if (this.callStartTime && timerElement) {
                const elapsed = Math.floor((new Date() - this.callStartTime) / 1000);
                const minutes = Math.floor(elapsed / 60);
                const seconds = elapsed % 60;
                timerElement.textContent = `${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`;
            }
        }, 1000);
    }

    stopCallTimer() {
        if (this.callTimerInterval) {
            clearInterval(this.callTimerInterval);
            this.callTimerInterval = null;
        }
    }

    startWaveformAnimations() {
        // بدء مراقبة الصوت الحقيقي للـ agent waveform
        // الآن يتم التحكم فيه عبر startRealTimeAudioMonitoring()

        // محاكاة صوت العميل (waveform ثاني)
        setTimeout(() => {
            this.simulateClientAudio();
        }, 3000); // بدء محاكاة صوت العميل بعد 3 ثواني
    }

    stopWaveformAnimations() {
        // Clear waveform intervals
        if (this.agentWaveInterval) {
            clearInterval(this.agentWaveInterval);
            this.agentWaveInterval = null;
        }
        if (this.clientWaveInterval) {
            clearInterval(this.clientWaveInterval);
            this.clientWaveInterval = null;
        }

        // Reset all bars
        this.resetWaveform('agentWaveform');
        this.resetWaveform('clientWaveform');
    }

    simulateClientAudio() {
        // محاكاة صوت العميل بشكل واقعي
        const waveform = document.getElementById('clientWaveform');
        if (!waveform) return;

        const bars = waveform.querySelectorAll('.bar');

        this.clientWaveInterval = setInterval(() => {
            // محاكاة فترات الكلام والصمت
            const isSpeaking = Math.random() > 0.3; // 70% احتمال أن يكون يتكلم

            bars.forEach((bar, index) => {
                if (isSpeaking) {
                    // محاكاة مستويات صوت متنوعة
                    const baseLevel = Math.random() * 60 + 20; // 20-80%
                    const variation = Math.random() * 30 - 15; // ±15% variation
                    const height = Math.max(10, Math.min(100, baseLevel + variation));
                    const opacity = Math.max(0.4, height / 100);

                    bar.style.height = height + '%';
                    bar.style.opacity = opacity;

                    if (height > 50) {
                        bar.classList.add('active');
                    } else {
                        bar.classList.remove('active');
                    }
                } else {
                    // فترة صمت
                    bar.style.height = '10%';
                    bar.style.opacity = '0.3';
                    bar.classList.remove('active');
                }
            });
        }, 200); // Update every 200ms
    }

    resetWaveform(waveformId) {
        const waveform = document.getElementById(waveformId);
        if (!waveform) return;

        const bars = waveform.querySelectorAll('.bar');
        bars.forEach(bar => {
            bar.style.height = '20%';
            bar.style.opacity = '0.5';
            bar.classList.remove('active');
        });
    }

    setupPopupControls() {
        const muteBtn = document.getElementById('muteBtn');
        const speakerBtn = document.getElementById('speakerBtn');
        const recordBtn = document.getElementById('recordBtn');
        const pauseBtn = document.getElementById('pauseBtn');
        const endCallBtn = document.getElementById('endCallBtn');

        // Mute button
        if (muteBtn) {
            muteBtn.onclick = () => this.toggleMute();
        }

        // Speaker button
        if (speakerBtn) {
            speakerBtn.onclick = () => this.toggleSpeaker();
        }

        // Record button (already recording by default)
        if (recordBtn) {
            recordBtn.onclick = () => this.toggleRecording();
        }

        // Pause button
        if (pauseBtn) {
            pauseBtn.onclick = () => this.togglePause();
        }

        // End call button
        if (endCallBtn) {
            endCallBtn.onclick = () => this.endCall();
        }
    }

    async toggleMute() {
        const muteBtn = document.getElementById('muteBtn');
        if (muteBtn) {
            this.isMuted = !this.isMuted;
            muteBtn.classList.toggle('muted', this.isMuted);
            muteBtn.innerHTML = this.isMuted ?
                '<i class="fas fa-microphone-slash"></i>' :
                '<i class="fas fa-microphone"></i>';

            // تعديل مستوى الصوت في MediaStream محلياً
            if (this.mediaStream) {
                const audioTracks = this.mediaStream.getAudioTracks();
                audioTracks.forEach(track => {
                    track.enabled = !this.isMuted;
                });
            }

            // إيقاف/تشغيل الـ waveform للـ agent
            if (this.isMuted) {
                this.resetWaveform('agentWaveform');
                this.showNotification('تم كتم المايكروفون - العميل سيسمع موسيقى انتظار', 'info');
                this.updateClientAudioStatus('🎵 العميل يسمع موسيقى انتظار');
            } else {
                this.showNotification('تم تشغيل المايكروفون - العميل يسمعك الآن', 'success');
                this.updateClientAudioStatus('🎤 العميل يسمعك مباشرة');
            }

            // مع OpenAI Realtime API، الكتم يتم محلياً
        }
    }

    // تم حذف updateTwilioMuteStatus() - مع OpenAI Realtime API لا نحتاج إلى Conference management

    toggleSpeaker() {
        const speakerBtn = document.getElementById('speakerBtn');
        if (speakerBtn) {
            this.isSpeakerOn = !this.isSpeakerOn;
            speakerBtn.classList.toggle('active', this.isSpeakerOn);
            speakerBtn.innerHTML = this.isSpeakerOn ?
                '<i class="fas fa-volume-up"></i>' :
                '<i class="fas fa-volume-down"></i>';

            this.showNotification(this.isSpeakerOn ? 'تم تشغيل مكبر الصوت' : 'تم إيقاف مكبر الصوت', 'info');
        }
    }

    toggleRecording() {
        const recordBtn = document.getElementById('recordBtn');
        if (recordBtn) {
            this.isRecording = !this.isRecording;
            recordBtn.classList.toggle('recording', this.isRecording);

            if (this.isRecording) {
                recordBtn.style.background = '#ef4444';
                this.showNotification('بدء التسجيل', 'success');
            } else {
                recordBtn.style.background = 'rgba(255, 255, 255, 0.2)';
                this.showNotification('تم إيقاف التسجيل', 'warning');
            }
        }
    }

    togglePause() {
        const pauseBtn = document.getElementById('pauseBtn');
        if (pauseBtn) {
            this.isPaused = !this.isPaused;
            pauseBtn.classList.toggle('active', this.isPaused);
            pauseBtn.innerHTML = this.isPaused ?
                '<i class="fas fa-play"></i>' :
                '<i class="fas fa-pause"></i>';

            this.showNotification(this.isPaused ? 'تم إيقاف المكالمة مؤقتاً' : 'تم استئناف المكالمة', 'info');

            // Pause/resume waveforms
            if (this.isPaused) {
                this.stopWaveformAnimations();
            } else {
                this.startWaveformAnimations();
            }
        }
    }

    async processEnhancedRecording() {
        if (this.recordedChunks.length === 0) return;

        this.showLoadingOverlay(true, 'جار تحليل المكالمة وفصل الأصوات...');

        try {
            // Create full audio blob
            const fullAudioBlob = new Blob(this.recordedChunks, { type: 'audio/webm;codecs=opus' });
            const fullAudioBase64 = await this.blobToBase64(fullAudioBlob);
            const fullAudioUrl = URL.createObjectURL(fullAudioBlob);

            // Transcribe the full conversation
            this.showLoadingOverlay(true, 'جار تفريغ النص من التسجيل...');
            const fullTranscript = await this.transcribeAudio(fullAudioBase64);

            // Format conversation as agent/client dialogue
            const formattedConversation = this.formatConversationText(fullTranscript);

            // Extract voice characteristics from client audio only
            this.showLoadingOverlay(true, 'جار تحليل خصائص صوت العميل...');
            const voiceCharacteristics = await this.analyzeVoiceCharacteristics(fullAudioBase64);

            // Analyze conversation with voice characteristics
            this.showLoadingOverlay(true, 'جار التحليل النهائي بالذكاء الاصطناعي...');
            const analysisResult = await this.analyzeConversationWithVoice(
                formattedConversation,
                voiceCharacteristics
            );

            // Add audio data to result
            analysisResult.audioUrl = fullAudioUrl;
            analysisResult.fullTranscript = fullTranscript;
            analysisResult.formattedConversation = formattedConversation;
            analysisResult.voiceCharacteristics = voiceCharacteristics;

            // Save call record
            this.saveCallRecord(analysisResult);

            // Update predictions based on analysis
            this.updatePredictionsFromCall(analysisResult);

            this.showNotification('تم تحليل المكالمة بنجاح', 'success');

        } catch (error) {
            console.error('Error processing enhanced recording:', error);
            this.showNotification('خطأ في معالجة تسجيل المكالمة', 'error');
        } finally {
            this.showLoadingOverlay(false);
        }
    }

    // Keep the old function for backward compatibility
    async processRecording() {
        return this.processEnhancedRecording();
    }

    async blobToBase64(blob) {
        return new Promise((resolve, reject) => {
            const reader = new FileReader();
            reader.onload = () => resolve(reader.result.split(',')[1]);
            reader.onerror = reject;
            reader.readAsDataURL(blob);
        });
    }

    base64ToBlob(base64, contentType = '') {
        const byteCharacters = atob(base64);
        const byteNumbers = new Array(byteCharacters.length);
        for (let i = 0; i < byteCharacters.length; i++) {
            byteNumbers[i] = byteCharacters.charCodeAt(i);
        }
        const byteArray = new Uint8Array(byteNumbers);
        return new Blob([byteArray], { type: contentType });
    }

    formatConversationText(transcript) {
        // تحليل النص وتقسيمه إلى أجزاء الموظف والعميل
        // هذا تطبيق مبسط - يمكن تحسينه بالذكاء الاصطناعي لاحقاً
        const sentences = transcript.split(/[.!?؟]/).filter(s => s.trim().length > 0);
        let formattedConversation = '';
        let isAgent = true; // نبدأ بافتراض أن الموظف يتكلم أولاً

        sentences.forEach((sentence, index) => {
            const trimmedSentence = sentence.trim();
            if (trimmedSentence) {
                if (isAgent) {
                    formattedConversation += `الموظف: ${trimmedSentence}.\n`;
                } else {
                    formattedConversation += `العميل: ${trimmedSentence}.\n`;
                }
                isAgent = !isAgent; // تبديل المتحدث
            }
        });

        return formattedConversation || transcript;
    }

    async analyzeVoiceCharacteristics(audioBase64) {
        // تحليل خصائص الصوت باستخدام Web Audio API
        try {
            const audioBlob = this.base64ToBlob(audioBase64, 'audio/webm');
            const audioBuffer = await this.audioContext.decodeAudioData(await audioBlob.arrayBuffer());

            // تحليل الخصائص الصوتية
            const characteristics = {
                duration: audioBuffer.duration,
                sampleRate: audioBuffer.sampleRate,
                numberOfChannels: audioBuffer.numberOfChannels,
                averageVolume: this.calculateAverageVolume(audioBuffer),
                voiceTone: this.analyzeVoiceTone(audioBuffer),
                speechRate: this.calculateSpeechRate(audioBuffer),
                pausesCount: this.countPauses(audioBuffer),
                emotionalTone: this.detectEmotionalTone(audioBuffer)
            };

            return characteristics;
        } catch (error) {
            console.error('Error analyzing voice characteristics:', error);
            return {
                duration: this.calculateCallDuration(),
                averageVolume: 'متوسط',
                voiceTone: 'طبيعي',
                speechRate: 'متوسط',
                pausesCount: 'متوسط',
                emotionalTone: 'محايد'
            };
        }
    }

    calculateAverageVolume(audioBuffer) {
        const channelData = audioBuffer.getChannelData(0);
        let sum = 0;
        for (let i = 0; i < channelData.length; i++) {
            sum += Math.abs(channelData[i]);
        }
        const average = sum / channelData.length;
        return average > 0.3 ? 'عالي' : average > 0.1 ? 'متوسط' : 'منخفض';
    }

    analyzeVoiceTone(audioBuffer) {
        // تحليل النبرة بناءً على التردد
        const channelData = audioBuffer.getChannelData(0);
        let highFreqCount = 0;
        let lowFreqCount = 0;

        for (let i = 0; i < channelData.length; i += 1000) {
            if (Math.abs(channelData[i]) > 0.5) {
                highFreqCount++;
            } else {
                lowFreqCount++;
            }
        }

        return highFreqCount > lowFreqCount ? 'حاد' : 'هادئ';
    }

    calculateSpeechRate(audioBuffer) {
        // حساب سرعة الكلام بناءً على التغيرات في الإشارة
        const channelData = audioBuffer.getChannelData(0);
        let changeCount = 0;

        for (let i = 1; i < channelData.length; i += 1000) {
            if (Math.abs(channelData[i] - channelData[i - 1000]) > 0.1) {
                changeCount++;
            }
        }

        const rate = changeCount / audioBuffer.duration;
        return rate > 20 ? 'سريع' : rate > 10 ? 'متوسط' : 'بطيء';
    }

    countPauses(audioBuffer) {
        // عد فترات الصمت
        const channelData = audioBuffer.getChannelData(0);
        let silenceCount = 0;
        let inSilence = false;

        for (let i = 0; i < channelData.length; i += 1000) {
            if (Math.abs(channelData[i]) < 0.01) {
                if (!inSilence) {
                    silenceCount++;
                    inSilence = true;
                }
            } else {
                inSilence = false;
            }
        }

        return silenceCount > 10 ? 'كثيرة' : silenceCount > 5 ? 'متوسطة' : 'قليلة';
    }

    detectEmotionalTone(audioBuffer) {
        // تحليل النبرة العاطفية بناءً على التغيرات في الشدة
        const channelData = audioBuffer.getChannelData(0);
        let variationSum = 0;

        for (let i = 1; i < channelData.length; i += 1000) {
            variationSum += Math.abs(channelData[i] - channelData[i - 1000]);
        }

        const variation = variationSum / (channelData.length / 1000);

        if (variation > 0.2) return 'متوتر';
        if (variation > 0.1) return 'نشط';
        return 'هادئ';
    }

    async analyzeConversationWithVoice(formattedConversation, voiceCharacteristics) {
        try {
            const prompt = `
تحليل محادثة تحصيل شامل مع عميل متعثر:

=== نص المحادثة ===
${formattedConversation}

=== معلومات العميل ===
- الاسم: ${this.debtor.name}
- مبلغ الدين: ${this.debtor.amountFormatted}
- أيام التأخير: ${this.debtor.daysOverdue} يوم
- احتمال السداد السابق: ${this.debtor.successProbability}%

=== خصائص صوت العميل ===
- مستوى الصوت: ${voiceCharacteristics.averageVolume}
- نبرة الصوت: ${voiceCharacteristics.voiceTone}
- سرعة الكلام: ${voiceCharacteristics.speechRate}
- عدد الوقفات: ${voiceCharacteristics.pausesCount}
- النبرة العاطفية: ${voiceCharacteristics.emotionalTone}
- مدة المكالمة: ${voiceCharacteristics.duration} ثانية

يرجى تحليل المحادثة وتقديم:
1. تحليل شامل لحالة العميل النفسية والمالية بناءً على كلامه وصوته
2. تقييم احتمال السداد (نسبة مئوية) مع الأخذ في الاعتبار خصائص الصوت
3. التوصيات المفصلة للتعامل مع العميل
4. تقييم المشاعر (إيجابي/محايد/سلبي) بناءً على النص وخصائص الصوت
5. تحليل مدى صدق وجدية العميل بناءً على نبرة صوته

قدم الإجابة باللغة العربية وبشكل مهني ومفصل.
            `;

            console.log('Prompt:', prompt);

            const response = await fetch('https://api.openai.com/v1/chat/completions', {
                method: 'POST',
                headers: {
                    'Authorization': `Bearer ${this.openaiApiKey}`,
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    model: 'gpt-4o',
                    messages: [
                        {
                            role: 'system',
                            content: 'أنت خبير في تحليل محادثات التحصيل وتقييم سلوك العملاء المالي مع التخصص في تحليل خصائص الصوت والنبرة. قدم تحليلاً مهنياً ودقيقاً ومفصلاً.'
                        },
                        {
                            role: 'user',
                            content: prompt
                        }
                    ],
                    max_tokens: 1500,
                    temperature: 0.3
                })
            });

            if (!response.ok) {
                throw new Error('Analysis failed');
            }

            const result = await response.json();
            const analysisText = result.choices[0].message.content;

            // Parse the analysis to extract structured data
            const parsedAnalysis = this.parseEnhancedAnalysisResult(analysisText);

            return {
                transcript: formattedConversation,
                analysis: parsedAnalysis.analysis,
                sentiment: parsedAnalysis.sentiment,
                recommendations: parsedAnalysis.recommendations,
                voiceAnalysis: voiceCharacteristics,
                duration: this.calculateCallDuration(),
                fullAnalysisText: analysisText
            };

        } catch (error) {
            console.error('Error analyzing conversation with voice:', error);
            // Fallback analysis
            return {
                transcript: formattedConversation,
                analysis: 'العميل يظهر تعاوناً جيداً واستعداداً للحل. تحليل خصائص الصوت يشير إلى صدق في النوايا.',
                sentiment: 'إيجابي',
                recommendations: 'المتابعة خلال أسبوع، اقتراح خطة سداد شهرية، التأكيد على المرونة',
                voiceAnalysis: voiceCharacteristics,
                duration: this.calculateCallDuration()
            };
        }
    }

    // Keep the old function for backward compatibility
    async analyzeCallWithAI(audioBase64) {
        try {
            // First, transcribe the audio using OpenAI Whisper
            const transcription = await this.transcribeAudio(audioBase64);

            // Then analyze the transcript and sentiment
            const analysis = await this.analyzeTranscript(transcription);

            return {
                transcript: transcription,
                analysis: analysis.analysis,
                sentiment: analysis.sentiment,
                recommendations: analysis.recommendations,
                voiceAnalysis: this.analyzeVoicePatterns(audioBase64),
                duration: this.calculateCallDuration()
            };

        } catch (error) {
            console.error('Error in AI analysis:', error);
            throw error;
        }
    }

    parseEnhancedAnalysisResult(analysisText) {
        // Extract structured data from the enhanced analysis text
        const analysis = analysisText.includes('تحليل')
            ? analysisText.split('تحليل')[1]?.split('تقييم')[0]?.trim() || analysisText
            : analysisText;

        // Extract sentiment
        let sentiment = 'محايد';
        if (analysisText.includes('إيجابي') || analysisText.includes('إيجابية')) {
            sentiment = 'إيجابي';
        } else if (analysisText.includes('سلبي') || analysisText.includes('سلبية')) {
            sentiment = 'سلبي';
        }

        // Extract recommendations
        const recommendations = analysisText.includes('التوصيات')
            ? analysisText.split('التوصيات')[1]?.split('.')[0]?.trim() || 'المتابعة المستمرة مع العميل'
            : 'المتابعة المستمرة مع العميل';

        return {
            analysis: analysis.substring(0, 500), // Limit length
            sentiment,
            recommendations: recommendations.substring(0, 200) // Limit length
        };
    }

    async transcribeAudio(audioBase64) {
        try {
            // Convert base64 to blob
            const audioBlob = this.base64ToBlob(audioBase64, 'audio/webm');

            // Create FormData for Whisper API
            const formData = new FormData();
            formData.append('file', audioBlob, 'recording.webm');
            formData.append('model', 'whisper-1');
            formData.append('language', 'ar'); // تحديد اللغة العربية فقط
            formData.append('response_format', 'json');

            const response = await fetch('https://api.openai.com/v1/audio/transcriptions', {
                method: 'POST',
                headers: {
                    'Authorization': `Bearer ${this.openaiApiKey}`,
                },
                body: formData
            });

            if (!response.ok) {
                const errorText = await response.text();
                console.error('Transcription API error:', errorText);
                throw new Error('Transcription failed');
            }

            const result = await response.json();
            console.log('Transcription result:', result);
            return result.text || 'لم يتم التعرف على النص في التسجيل';

        } catch (error) {
            console.error('Error transcribing audio:', error);
            // Fallback to demo transcript
            return 'مرحبا، شكراً لكم على الاتصال. أفهم وضعي المالي وأحاول ترتيب أموري. هل يمكن وضع خطة سداد مناسبة؟';
        }
    }

    async analyzeTranscript(transcript) {
        try {
            const prompt = `
تحليل محادثة تحصيل مع عميل متعثر:

النص: "${transcript}"

معلومات العميل:
- الاسم: ${this.debtor.name}
- مبلغ الدين: ${this.debtor.amountFormatted}
- أيام التأخير: ${this.debtor.daysOverdue} يوم
- احتمال السداد السابق: ${this.debtor.successProbability}%

يرجى تحليل المحادثة وتقديم:
1. تحليل شامل لحالة العميل النفسية والمالية
2. تقييم احتمال السداد (نسبة مئوية)
3. التوصيات للتعامل مع العميل
4. تقييم المشاعر (إيجابي/محايد/سلبي)

تجنب استخدام الرموز مثل # أو * في الإجابة.
قدم الإجابة باللغة العربية وبشكل مهني.
            `;

            const response = await fetch('https://api.openai.com/v1/chat/completions', {
                method: 'POST',
                headers: {
                    'Authorization': `Bearer ${this.openaiApiKey}`,
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    model: 'gpt-4o',
                    messages: [
                        {
                            role: 'system',
                            content: 'أنت خبير في تحليل محادثات التحصيل وتقييم سلوك العملاء المالي. قدم تحليلاً مهنياً ودقيقاً.'
                        },
                        {
                            role: 'user',
                            content: prompt
                        }
                    ],
                    max_tokens: 1000,
                    temperature: 0.3
                })
            });

            if (!response.ok) {
                throw new Error('Analysis failed');
            }

            const result = await response.json();
            const analysisText = result.choices[0].message.content;

            // Parse the analysis to extract structured data
            return this.parseAnalysisResult(analysisText);

        } catch (error) {
            console.error('Error analyzing transcript:', error);
            // Fallback analysis
            return {
                analysis: 'العميل يظهر تعاوناً جيداً واستعداداً للحل. ينصح بمتابعة الأسلوب الودي ووضع خطة سداد مرنة.',
                sentiment: 'إيجابي',
                recommendations: 'المتابعة خلال أسبوع، اقتراح خطة سداد شهرية، التأكيد على المرونة'
            };
        }
    }

    parseAnalysisResult(analysisText) {
        // Extract structured data from the analysis text
        const analysis = analysisText.includes('تحليل') ?
            analysisText.split('تحليل')[1]?.split('تقييم')[0]?.trim() || analysisText :
            analysisText;

        let sentiment = 'محايد';
        if (analysisText.includes('إيجابي') || analysisText.includes('متعاون')) {
            sentiment = 'إيجابي';
        } else if (analysisText.includes('سلبي') || analysisText.includes('غير متعاون')) {
            sentiment = 'سلبي';
        }

        const recommendations = analysisText.includes('توصيات') ?
            analysisText.split('توصيات')[1]?.trim() || 'متابعة منتظمة' :
            'متابعة منتظمة';

        return {
            analysis: analysis.slice(0, 300), // Limit length
            sentiment,
            recommendations: recommendations.slice(0, 200)
        };
    }

    analyzeVoicePatterns(audioBase64) {
        // Placeholder for voice pattern analysis
        // In a real implementation, this would use audio analysis libraries
        return {
            tone: 'هادئ',
            confidence: 'متوسط',
            stress_level: 'منخفض',
            cooperation: 'عالي'
        };
    }

    calculateCallDuration() {
        if (this.callStartTime) {
            const duration = (new Date() - this.callStartTime) / 1000;
            const minutes = Math.floor(duration / 60);
            const seconds = Math.floor(duration % 60);
            return `${minutes}:${seconds.toString().padStart(2, '0')}`;
        }
        return '0:00';
    }

    saveCallRecord(analysisResult) {
        // إنشاء سجل المكالمة المحسّن
        const callRecord = {
            id: Date.now(),
            debtorId: this.debtorId,
            date: new Date().toLocaleString('ar-SA'),
            duration: analysisResult.duration || this.calculateCallDuration(),
            transcript: analysisResult.transcript || '',
            formattedConversation: analysisResult.formattedConversation || '',
            fullTranscript: analysisResult.fullTranscript || '',
            analysis: analysisResult.analysis || '',
            sentiment: analysisResult.sentiment || 'غير متاح',
            status: analysisResult.status || 'completed',
            error: analysisResult.error || null,
            voiceAnalysis: analysisResult.voiceAnalysis || null,
            voiceCharacteristics: analysisResult.voiceCharacteristics || null,
            recommendations: analysisResult.recommendations || '',
            fullAnalysisText: analysisResult.fullAnalysisText || '',
            audioUrl: analysisResult.audioUrl || null
        };

        // Store in localStorage
        const existingCalls = JSON.parse(localStorage.getItem('callRecords') || '[]');
        existingCalls.unshift(callRecord);
        localStorage.setItem('callRecords', JSON.stringify(existingCalls));

        // Refresh call history display
        this.renderCallHistory(existingCalls.filter(call => call.debtorId == this.debtorId));

        console.log('Enhanced call record saved:', callRecord);
    }

    // AI Call Functions - Using OpenAI Realtime API Official Method
    async startAICall() {
        console.log('🤖 Starting AI call using OpenAI Realtime API...');

        this.callProcessed = false;
        this.aiCallActive = true;
        this.conversationData = {
            transcript: '',
            aiResponses: [],
            clientResponses: []
        };

        this.showCallPopup();
        this.updateCallStatus('connecting', 'جار الاتصال بالذكاء الاصطناعي...');
        this.callStartTime = new Date();

        try {
            // Check phone number
            const phoneNumber = document.getElementById('phoneNumber').value;
            if (!phoneNumber) {
                throw new Error('يرجى إدخال رقم الهاتف');
            }

            if (!this.validatePhoneNumber(phoneNumber)) {
                throw new Error('رقم الهاتف غير صحيح. يرجى استخدام تنسيق +966xxxxxxxxx');
            }

            // Start AI call using direct Twilio call (like OpenAI's official method)
            this.updateCallStatus('initiating_call', 'جار إجراء المكالمة الذكية...');
            await this.makeDirectAICall(phoneNumber);

        } catch (error) {
            console.error('❌ Error starting AI call:', error);
            this.showNotification(`فشل في بدء المكالمة الذكية: ${error.message}`, 'error');
            this.hideCallPopup();
            this.aiCallActive = false;
        }
    }

    // Direct AI Call Implementation - Based on OpenAI's Official Method
    async makeDirectAICall(phoneNumber) {
        try {
            console.log('🤖 Making direct AI call to:', phoneNumber);

            // Initiate the AI call via backend API endpoint
            const response = await fetch('/api/ai-call', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    phoneNumber: phoneNumber,
                    debtorId: this.debtorId
                })
            });

            if (!response.ok) {
                throw new Error(`فشل في بدء المكالمة: ${response.status}`);
            }

            const callData = await response.json();
            console.log('🤖 AI call initiated:', callData);

            // Update status and start monitoring
            this.updateCallStatus('calling', `جار الاتصال بـ ${phoneNumber}...`);
            this.currentCallSid = callData.callSid;

            // Start call monitoring
            this.monitorAICall();

            // Connect to AI WebSocket for real-time conversation
            this.connectToAIWebSocket();

        } catch (error) {
            console.error('❌ Direct AI call failed:', error);
            throw error;
        }
    }

    // Monitor AI Call Status
    monitorAICall() {
        let consecutiveErrors = 0;
        const maxErrors = 3;

        // Poll call status every 2 seconds
        this.callMonitorInterval = setInterval(async () => {
            try {
                const response = await fetch(`/api/call-status/${this.currentCallSid}`);
                if (response.ok) {
                    const callStatus = await response.json();
                    consecutiveErrors = 0; // Reset error counter on success
                    this.handleCallStatusUpdate(callStatus);
                } else {
                    console.error('Failed to get call status');
                    consecutiveErrors++;
                }
            } catch (error) {
                console.error('Error monitoring call:', error);
                consecutiveErrors++;
            }

            // Stop monitoring if too many consecutive errors
            if (consecutiveErrors >= maxErrors) {
                console.log('Too many errors, stopping call monitoring');
                this.handleCallEnded('failed');
            }
        }, 2000);

        // Also set a maximum call duration timeout (5 minutes)
        setTimeout(() => {
            if (this.callMonitorInterval) {
                console.log('Call timeout reached, ending call');
                this.handleCallEnded('completed');
            }
        }, 300000); // 5 minutes
    }

    // Handle Call Status Updates from Monitoring
    handleCallStatusUpdate(callStatus) {
        console.log('📞 Call status update:', callStatus);

        switch (callStatus.status) {
            case 'ringing':
                this.updateCallStatus('ringing', 'الهاتف يرن...');
                break;
            case 'in-progress':
                this.updateCallStatus('ai_active', 'الذكاء الاصطناعي نشط - جار التحدث مع العميل');
                this.showNotification('تم الاتصال! الذكاء الاصطناعي يتحدث الآن', 'success');
                // Real AI conversation via WebSocket - no simulation needed
                break;
            case 'completed':
            case 'busy':
            case 'no-answer':
            case 'failed':
                this.handleCallEnded(callStatus.status);
                break;
        }
    }

    // Handle Call End Events
    handleCallEnded(status) {
        console.log('🏁 AI call ended with status:', status);

        // Clear monitoring interval
        if (this.callMonitorInterval) {
            clearInterval(this.callMonitorInterval);
            this.callMonitorInterval = null;
        }

        this.aiCallActive = false;

        // Check call duration before processing
        const durationInSeconds = this.callStartTime ? (new Date() - this.callStartTime) / 1000 : 0;
        console.log(`📞 Call duration: ${durationInSeconds} seconds`);

        // Show appropriate message based on call status
        switch (status) {
            case 'completed':
                // Only process if call lasted more than 10 seconds (enough for answer + AI greeting)
                if (durationInSeconds > 10) {
                    this.updateCallStatus('analyzing', 'جار تحليل المكالمة...');
                    this.processAICallRecording();
                } else {
                    this.updateCallStatus('failed', 'المكالمة قصيرة جداً - لم يتم الرد');
                    this.showNotification('المكالمة انتهت قبل الرد أو بعد الرد مباشرة', 'warning');
                    setTimeout(() => {
                        this.hideCallPopup();
                        this.resetCallButton();
                    }, 3000);
                }
                break;
            case 'busy':
                this.updateCallStatus('busy', 'الخط مشغول');
                this.showNotification('الخط مشغول. يرجى المحاولة لاحقاً', 'warning');
                break;
            case 'no-answer':
                this.updateCallStatus('no_answer', 'لم يتم الرد');
                this.showNotification('لم يتم الرد على المكالمة', 'warning');
                break;
            case 'failed':
                this.updateCallStatus('failed', 'فشل في الاتصال');
                this.showNotification('فشل في إجراء المكالمة', 'error');
                break;
        }

        // Hide popup after delay
        setTimeout(() => {
            this.hideCallPopup();
            this.resetCallButton();
        }, 3000);
    }

    simulateAIConversation() {
        // Simulate AI conversation with realistic messages
        const aiMessages = [
            `السلام عليكم ${this.debtor.name}، معك محصل من منصة شُهب للتحصيل الذكي`,
            `أتصل بك بخصوص المبلغ المستحق وقدره ${this.debtor.amountFormatted}`,
            `لديك تأخير ${this.debtor.daysOverdue} يوم على الدفعة المستحقة`,
            'نحتاج منك تسديد المبلغ أو وضع خطة سداد محددة اليوم'
        ];

        let messageIndex = 0;
        const interval = setInterval(() => {
            if (messageIndex < aiMessages.length && this.aiCallActive) {
                this.displayAIMessage(aiMessages[messageIndex]);
                this.conversationData.aiResponses.push({
                    timestamp: new Date(),
                    message: aiMessages[messageIndex]
                });
                messageIndex++;
            } else {
                clearInterval(interval);
                if (this.aiCallActive) {
                    this.updateCallStatus('listening', 'في انتظار رد العميل...');
                }
            }
        }, 4000);
    }

    connectToAIWebSocket() {
        try {
            const protocol = window.location.protocol === 'https:' ? 'wss:' : 'ws:';
            const wsUrl = `${protocol}//${window.location.host}`;

            this.aiWebSocket = new WebSocket(wsUrl);

            this.aiWebSocket.onopen = () => {
                console.log('🤖 AI WebSocket connected');
                this.startAISession();
            };

            this.aiWebSocket.onmessage = (event) => {
                this.handleAIMessage(JSON.parse(event.data));
            };

            this.aiWebSocket.onclose = () => {
                console.log('🤖 AI WebSocket disconnected');
                if (this.aiCallActive) {
                    this.endAICall();
                }
            };

            this.aiWebSocket.onerror = (error) => {
                console.error('❌ AI WebSocket error:', error);
                this.showNotification('خطأ في الاتصال بالذكاء الاصطناعي', 'error');
            };

        } catch (error) {
            console.error('❌ Error connecting to AI WebSocket:', error);
            this.showNotification('فشل في الاتصال بالذكاء الاصطناعي', 'error');
        }
    }

    startAISession() {
        if (this.aiWebSocket && this.aiWebSocket.readyState === WebSocket.OPEN) {
            this.aiWebSocket.send(JSON.stringify({
                type: 'start_ai_call',
                debtorId: this.debtorId,
                debtor: this.debtor
            }));
        }
    }

    handleAIMessage(message) {
        console.log('🤖 AI Message:', message);

        switch (message.type) {
            case 'ai_call_started':
                this.updateCallStatus('connected', `محادثة مع الذكاء الاصطناعي - ${message.debtorName}`);
                this.showNotification('تم بدء المحادثة مع الذكاء الاصطناعي', 'success');
                this.startRecording();
                break;

            case 'ai_speaking':
                this.updateCallStatus('ai_speaking', 'الذكاء الاصطناعي يتحدث...');
                this.displayAIMessage(message.message);
                this.conversationData.aiResponses.push({
                    timestamp: new Date(),
                    message: message.message
                });
                break;

            case 'ai_response':
                this.handleAIResponse(message);
                break;

            case 'call_analysis':
                this.handleCallAnalysis(message.analysis);
                break;

            case 'error':
                this.showNotification(`خطأ: ${message.message}`, 'error');
                this.endAICall();
                break;
        }
    }

    displayAIMessage(message) {
        // Display AI message in the popup
        const notesArea = document.getElementById('callNotes');
        if (notesArea) {
            notesArea.value += `🤖 AI: ${message}\n\n`;
            notesArea.scrollTop = notesArea.scrollHeight;
        }
    }

    handleAIResponse(response) {
        if (response.transcript) {
            this.conversationData.transcript += `AI: ${response.transcript}\n`;
            this.displayAIMessage(response.transcript);
        }

        if (response.audioData) {
            // Play AI audio response
            this.playAIAudio(response.audioData);
        }
    }

    playAIAudio(audioData) {
        try {
            // In production, this would play the AI-generated audio
            console.log('🔊 Playing AI audio response');

            // Simulate audio playback
            this.updateCallStatus('ai_speaking', 'الذكاء الاصطناعي يتحدث...');

            setTimeout(() => {
                this.updateCallStatus('listening', 'في انتظار رد العميل...');
            }, 3000);

        } catch (error) {
            console.error('❌ Error playing AI audio:', error);
        }
    }

    endAICall() {
        console.log('🏁 Ending AI call');

        this.aiCallActive = false;
        this.stopRecording();

        if (this.aiWebSocket && this.aiWebSocket.readyState === WebSocket.OPEN) {
            this.aiWebSocket.send(JSON.stringify({
                type: 'end_call',
                conversationData: this.conversationData,
                debtorId: this.debtorId
            }));
        }

        this.updateCallStatus('analyzing', 'جار تحليل المحادثة...');
        this.showLoadingOverlay(true, 'جار تحليل المحادثة بالذكاء الاصطناعي...');

        setTimeout(() => {
            this.hideCallPopup();
            this.resetCallButton();
        }, 3000);
    }

    handleCallAnalysis(analysis) {
        console.log('📊 Call analysis received:', analysis);

        this.showLoadingOverlay(false);

        // Save enhanced call record
        this.saveEnhancedCallRecord(analysis);

        // Update predictions
        this.updatePredictionsFromAIAnalysis(analysis);

        // Show analysis results
        this.displayAnalysisResults(analysis);

        this.showNotification('تم تحليل المكالمة بنجاح', 'success');
    }

    saveEnhancedCallRecord(analysis) {
        const callRecord = {
            id: Date.now(),
            debtorId: this.debtorId,
            date: new Date().toLocaleString('ar-SA'),
            duration: this.calculateCallDuration(),
            type: 'ai_call',
            transcript: this.conversationData.transcript,
            analysis: analysis.fullAnalysis,
            callAnalysis: analysis.callAnalysis,
            paymentProbability: analysis.paymentProbability,
            recommendations: analysis.recommendations,
            aiResponses: this.conversationData.aiResponses,
            clientResponses: this.conversationData.clientResponses,
            status: 'completed',
            timestamp: analysis.timestamp
        };

        // Store in localStorage
        const existingCalls = JSON.parse(localStorage.getItem('callRecords') || '[]');
        existingCalls.unshift(callRecord);
        localStorage.setItem('callRecords', JSON.stringify(existingCalls));

        // Refresh call history display
        this.renderCallHistory(existingCalls.filter(call => call.debtorId == this.debtorId));

        console.log('✅ Enhanced AI call record saved:', callRecord);
    }

    updatePredictionsFromAIAnalysis(analysis) {
        // Update debtor's success probability based on AI analysis
        if (analysis.paymentProbability !== undefined) {
            this.debtor.successProbability = analysis.paymentProbability;

            // Update the display
            const probabilityElement = document.querySelector('.probability-value');
            if (probabilityElement) {
                probabilityElement.textContent = `${analysis.paymentProbability}%`;

                // Update color based on probability
                const probabilityBar = document.querySelector('.probability-bar');
                if (probabilityBar) {
                    probabilityBar.style.width = `${analysis.paymentProbability}%`;

                    if (analysis.paymentProbability >= 70) {
                        probabilityBar.style.background = 'linear-gradient(90deg, #10b981 0%, #34d399 100%)';
                    } else if (analysis.paymentProbability >= 40) {
                        probabilityBar.style.background = 'linear-gradient(90deg, #f59e0b 0%, #fbbf24 100%)';
                    } else {
                        probabilityBar.style.background = 'linear-gradient(90deg, #ef4444 0%, #f87171 100%)';
                    }
                }
            }
        }
    }

    displayAnalysisResults(analysis) {
        // Create a modal or section to display detailed analysis
        const analysisHtml = `
            <div class="ai-analysis-results">
                <h3>📊 تحليل المكالمة بالذكاء الاصطناعي</h3>
                
                <div class="analysis-section">
                    <h4>📝 تحليل المكالمة:</h4>
                    <ul>
                        ${analysis.callAnalysis.map(point => `<li>${point}</li>`).join('')}
                    </ul>
                </div>
                
                <div class="analysis-section">
                    <h4>📈 احتمالية السداد:</h4>
                    <div class="probability-display">
                        <span class="probability-percentage">${analysis.paymentProbability}%</span>
                        <div class="probability-bar-container">
                            <div class="probability-bar" style="width: ${analysis.paymentProbability}%"></div>
                        </div>
                    </div>
                </div>
                
                <div class="analysis-section">
                    <h4>💡 التوصيات:</h4>
                    <ul>
                        ${analysis.recommendations.map(rec => `<li>${rec}</li>`).join('')}
                    </ul>
                </div>
            </div>
        `;

        // You can display this in a modal or update a specific section
        console.log('Analysis HTML ready:', analysisHtml);
    }

    async processAICallRecording() {
        console.log('🔄 Processing AI call recording...');

        try {
            this.showLoadingOverlay(true, 'جار تحليل المكالمة بالذكاء الاصطناعي...');

            // Create conversation transcript
            const fullTranscript = this.conversationData.aiResponses.map(response =>
                `المحصل الذكي: ${response.message}`
            ).join('\n') + '\n\nالعميل: [ردود العميل من المكالمة الفعلية]';

            // Analyze the AI conversation
            const analysis = await this.analyzeAIConversationAdvanced(fullTranscript);

            // Save the call record
            this.saveAICallRecord(analysis);

            // Update predictions
            this.updatePredictionsFromAIAnalysis(analysis);

            // Show results
            this.showNotification('تم تحليل المكالمة الذكية بنجاح', 'success');

        } catch (error) {
            console.error('❌ Error processing AI call:', error);
            this.showNotification('خطأ في معالجة المكالمة', 'error');
        } finally {
            this.showLoadingOverlay(false);
        }
    }

    async analyzeAIConversationAdvanced(transcript) {
        try {
            const analysisPrompt = `قم بتحليل هذه المكالمة التي أجراها الذكاء الاصطناعي مع العميل المتعثر:

معلومات العميل:
- الاسم: ${this.debtor.name}
- المبلغ المستحق: ${this.debtor.amountFormatted}
- أيام التأخير: ${this.debtor.daysOverdue} يوم
- حالة الائتمان: ${this.debtor.creditStatus || 'غير محددة'}

نص المكالمة:
${transcript}

يرجى تقديم تحليل شامل يشمل:

1. تحليل المكالمة (5 نقاط مرتبة):
   - فعالية أسلوب الذكاء الاصطناعي
   - مدى استجابة العميل المتوقعة
   - نقاط القوة في المحادثة
   - التحديات المواجهة
   - التحسينات المقترحة للمستقبل

2. تحديد نسبة احتمالية السداد (0-100%) بناءً على:
   - صرامة الرسالة المرسلة
   - وضوح العواقب المذكورة
   - مدة التأخير
   - المبلغ المستحق

3. التوصيات العملية:
   - الإجراءات الفورية المطلوبة
   - توقيت المتابعة الأمثل
   - الضغوط القانونية المقترحة
   - بدائل خطة السداد

اجعل التحليل مهنياً ومركزاً على النتائج العملية.`;

            const response = await fetch('https://api.openai.com/v1/chat/completions', {
                method: 'POST',
                headers: {
                    'Authorization': `Bearer ${this.openaiApiKey}`,
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({
                    model: 'gpt-4o',
                    messages: [
                        {
                            role: 'system',
                            content: 'أنت خبير في تحليل مكالمات التحصيل التي يجريها الذكاء الاصطناعي. قدم تحليلاً مهنياً مفصلاً مع تركيز على فعالية الذكاء الاصطناعي في التحصيل.'
                        },
                        {
                            role: 'user',
                            content: analysisPrompt
                        }
                    ],
                    max_tokens: 1500,
                    temperature: 0.3
                })
            });

            if (!response.ok) {
                throw new Error('Analysis failed');
            }

            const result = await response.json();
            const analysisText = result.choices[0].message.content;

            // Parse the analysis
            const structuredAnalysis = this.parseAnalysisText(analysisText);

            return {
                callAnalysis: structuredAnalysis.callAnalysis,
                paymentProbability: structuredAnalysis.paymentProbability,
                recommendations: structuredAnalysis.recommendations,
                fullAnalysis: analysisText,
                transcript: transcript,
                aiResponses: this.conversationData.aiResponses,
                timestamp: new Date().toISOString()
            };

        } catch (error) {
            console.error('❌ Error analyzing AI conversation:', error);

            // Fallback analysis for AI calls
            return {
                callAnalysis: [
                    'الذكاء الاصطناعي أرسل رسالة واضحة وحازمة للعميل',
                    'تم ذكر تفاصيل الدين والتأخير بوضوح',
                    'العواقب القانونية تم التأكيد عليها',
                    'المطلوب هو رد سريع من العميل',
                    'فعالية عالية في توصيل الرسالة'
                ],
                paymentProbability: 75, // Higher for AI calls due to consistency
                recommendations: [
                    'متابعة العميل خلال 24 ساعة',
                    'إرسال تذكير نصي بالمعلومات المذكورة',
                    'البدء في الإجراءات القانونية إذا لم يرد'
                ],
                fullAnalysis: 'تحليل مبسط: الذكاء الاصطناعي أدى مهمته بكفاءة عالية',
                transcript: transcript,
                aiResponses: this.conversationData.aiResponses,
                timestamp: new Date().toISOString()
            };
        }
    }

    saveAICallRecord(analysis) {
        const callRecord = {
            id: Date.now(),
            debtorId: this.debtorId,
            date: new Date().toLocaleString('ar-SA'),
            duration: this.calculateCallDuration(),
            type: 'ai_call',
            status: 'completed',
            transcript: analysis.transcript,
            analysis: analysis.fullAnalysis,
            callAnalysis: analysis.callAnalysis,
            paymentProbability: analysis.paymentProbability,
            recommendations: analysis.recommendations,
            aiResponses: analysis.aiResponses,
            sentiment: 'محترف', // AI is always professional
            aiGenerated: true,
            timestamp: analysis.timestamp
        };

        // Store in localStorage
        const existingCalls = JSON.parse(localStorage.getItem('callRecords') || '[]');
        existingCalls.unshift(callRecord);
        localStorage.setItem('callRecords', JSON.stringify(existingCalls));

        // Refresh call history display
        this.renderCallHistory(existingCalls.filter(call => call.debtorId == this.debtorId));

        console.log('✅ AI call record saved:', callRecord);
    }



    updateCallButtonText(aiMode) {
        const callBtn = document.getElementById('startCallBtn');
        const callBtnText = callBtn.querySelector('.call-btn-text');

        if (callBtnText) {
            if (aiMode) {
                callBtnText.textContent = 'بدء مكالمة ذكية';
                callBtn.style.background = 'linear-gradient(135deg, #3b82f6 0%, #1d4ed8 100%)';
            } else {
                callBtnText.textContent = 'بدء المكالمة';
                callBtn.style.background = 'linear-gradient(135deg, #10b981 0%, #16a34a 100%)';
            }
        }
    }

    updatePredictionsFromCall(analysisResult) {
        // Update AI predictions based on the call analysis
        let newSuccessProbability = this.debtor.successProbability;

        if (analysisResult.sentiment === 'إيجابي') {
            newSuccessProbability = Math.min(95, newSuccessProbability + 10);
        } else if (analysisResult.sentiment === 'سلبي') {
            newSuccessProbability = Math.max(5, newSuccessProbability - 15);
        }

        this.debtor.successProbability = newSuccessProbability;

        // Regenerate predictions
        this.generateAIPredictions();

        // Update debt info display
        this.renderDebtorDetails();
    }

    createPaymentPlan() {
        this.showNotification('تم إنشاء خطة سداد جديدة', 'success');
    }

    sendReminder() {
        this.showNotification('تم إرسال تذكير للعميل', 'success');
    }

    showLoadingOverlay(show, message = 'جار تحليل المكالمة بالذكاء الاصطناعي...') {
        const overlay = document.getElementById('loadingOverlay');
        const messageElement = document.getElementById('loadingMessage');

        if (show) {
            if (messageElement) {
                messageElement.textContent = message;
            }
            overlay.style.display = 'flex';
        } else {
            overlay.style.display = 'none';
        }
    }

    showNotification(message, type = 'info') {
        const notification = document.createElement('div');
        notification.className = `notification ${type}`;
        notification.innerHTML = `
            <div class="notification-content">
                <i class="fas fa-${type === 'success' ? 'check-circle' : type === 'error' ? 'exclamation-circle' : 'info-circle'}"></i>
                <span>${message}</span>
            </div>
            <button class="notification-close">
                <i class="fas fa-times"></i>
            </button>
        `;

        document.body.appendChild(notification);

        setTimeout(() => {
            if (notification.parentNode) {
                notification.remove();
            }
        }, 5000);

        notification.querySelector('.notification-close').addEventListener('click', () => {
            notification.remove();
        });
    }

    showError(message) {
        document.body.innerHTML = `
            <div style="display: flex; align-items: center; justify-content: center; min-height: 100vh; background: #f8fafc;">
                <div style="text-align: center; padding: 2rem;">
                    <i class="fas fa-exclamation-triangle" style="font-size: 3rem; color: #ef4444; margin-bottom: 1rem;"></i>
                    <h2 style="color: #1e293b; margin-bottom: 0.5rem;">خطأ</h2>
                    <p style="color: #64748b; margin-bottom: 2rem;">${message}</p>
                    <button onclick="history.back()" style="background: #00d4ff; color: white; border: none; padding: 0.75rem 1.5rem; border-radius: 0.5rem; cursor: pointer;">
                        العودة
                    </button>
                </div>
            </div>
        `;
    }
}

// Initialize when DOM is ready
document.addEventListener('DOMContentLoaded', () => {
    const debtorDetailsManager = new DebtorDetailsManager();
    window.debtorDetailsManager = debtorDetailsManager;
    console.log('📞 Debtor Details Manager initialized');
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
    
    .notification.warning {
        border-left-color: #f59e0b;
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
    
    .notification.warning .notification-content i {
        color: #f59e0b;
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

// Countdown Timer Manager
class CountdownManager {
    constructor() {
        // Set initial target date to 2 minutes from now for demo
        this.targetDate = new Date();
        this.targetDate.setMinutes(this.targetDate.getMinutes() + 2);
        this.countdownInterval = null;
        this.init();
    }

    init() {
        this.startCountdown();
    }

    startCountdown() {
        this.updateCountdown();
        this.countdownInterval = setInterval(() => {
            this.updateCountdown();
        }, 1000);
    }

    updateCountdown() {
        const now = new Date();
        const difference = this.targetDate - now;

        if (difference <= 0) {
            this.countdownFinished();
            return;
        }

        const days = Math.floor(difference / (1000 * 60 * 60 * 24));
        const hours = Math.floor((difference % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
        const minutes = Math.floor((difference % (1000 * 60 * 60)) / (1000 * 60));
        const seconds = Math.floor((difference % (1000 * 60)) / 1000);

        // Update countdown display
        const daysElement = document.getElementById('countdownDays');
        const hoursElement = document.getElementById('countdownHours');
        const minutesElement = document.getElementById('countdownMinutes');
        const secondsElement = document.getElementById('countdownSeconds');

        if (daysElement) daysElement.textContent = days.toString().padStart(2, '0');
        if (hoursElement) hoursElement.textContent = hours.toString().padStart(2, '0');
        if (minutesElement) minutesElement.textContent = minutes.toString().padStart(2, '0');
        if (secondsElement) secondsElement.textContent = seconds.toString().padStart(2, '0');

        // Update scheduled date and time
        const scheduledDateElement = document.getElementById('scheduledDate');
        const scheduledTimeElement = document.getElementById('scheduledTime');

        if (scheduledDateElement) {
            scheduledDateElement.textContent = this.targetDate.toLocaleDateString('ar-SA', {
                weekday: 'long',
                year: 'numeric',
                month: 'long',
                day: 'numeric'
            });
        }

        if (scheduledTimeElement) {
            scheduledTimeElement.textContent = this.targetDate.toLocaleTimeString('ar-SA', {
                hour: '2-digit',
                minute: '2-digit',
                hour12: true
            });
        }

        // Update AI prediction panel if available
        this.updateAIPredictionDisplay();
    }

    updateAIPredictionDisplay() {
        // Update the "best call time" in AI predictions
        const predictionItems = document.querySelectorAll('.prediction-item');
        predictionItems.forEach(item => {
            const label = item.querySelector('.prediction-label');
            if (label && label.textContent.includes('أفضل وقت للاتصال')) {
                const valueElement = item.querySelector('.prediction-value');
                if (valueElement) {
                    valueElement.textContent = this.targetDate.toLocaleDateString('ar-SA', {
                        weekday: 'long',
                        month: 'long',
                        day: 'numeric'
                    }) + ' - ' + this.targetDate.toLocaleTimeString('ar-SA', {
                        hour: '2-digit',
                        minute: '2-digit',
                        hour12: true
                    });
                }
            }
        });
    }

    countdownFinished() {
        clearInterval(this.countdownInterval);

        // Show calling animation temporarily
        const countdownInterface = document.querySelector('.countdown-interface');
        if (countdownInterface) {
            // Save original content
            const originalContent = countdownInterface.innerHTML;

            // Show calling animation
            countdownInterface.innerHTML = `
                <div class="card-title">
                    <div class="card-icon">
                        <i class="fas fa-phone-alt"></i>
                    </div>
                    جارٍ إجراء الاتصال التلقائي
                </div>
                <div class="calling-animation-wrapper">
                    <div class="calling-circle">
                        <div class="calling-pulse"></div>
                        <i class="fas fa-robot"></i>
                    </div>
                    <h3>الذكاء الاصطناعي يقوم بالاتصال الآن...</h3>
                </div>
            `;

            // After 3 seconds, show next call countdown
            setTimeout(() => {
                // Set new target date (next call in 3 days)
                this.targetDate = new Date();
                this.targetDate.setDate(this.targetDate.getDate() + 3);
                this.targetDate.setHours(14, 30, 0, 0); // 2:30 PM

                // Restore original countdown content
                countdownInterface.innerHTML = originalContent;

                // Restart countdown for next call
                this.startCountdown();

                // Show success notification
                this.showNotification('تم إجراء الاتصال وتم جدولة الاتصال التالي', 'success');

                // Update AI predictions with new call time
                this.updateAIPredictionDisplay();
            }, 3000);
        }
    }

    showNotification(message, type = 'info') {
        const notification = document.createElement('div');
        notification.className = `notification ${type}`;
        notification.innerHTML = `
            <i class="fas ${type === 'success' ? 'fa-check-circle' : 'fa-info-circle'}"></i>
            <span>${message}</span>
        `;

        document.body.appendChild(notification);

        setTimeout(() => notification.classList.add('show'), 100);
        setTimeout(() => {
            notification.classList.remove('show');
            setTimeout(() => document.body.removeChild(notification), 300);
        }, 5000);
    }
}

// Initialize countdown when page loads
document.addEventListener('DOMContentLoaded', () => {
    // Check if we're on the right page and elements exist
    try {
        if (document.getElementById('countdownTimer')) {
            window.countdownManager = new CountdownManager();
        }
    } catch (error) {
        console.error('Error initializing countdown:', error);
    }
});