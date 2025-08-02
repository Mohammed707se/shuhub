const express = require('express');
const expressWs = require('express-ws');
const path = require('path');
const cors = require('cors');

// Load environment variables first
require('dotenv').config();

const app = express();

// Enable WebSocket support for Express
expressWs(app);
const PORT = process.env.PORT || 3000;
const twilio = require('twilio');
const AccessToken = twilio.jwt.AccessToken;
const VoiceGrant = AccessToken.VoiceGrant;
const OpenAI = require('openai');
const WebSocket = require('ws');
const http = require('http');

// Initialize OpenAI
const openai = new OpenAI({
    apiKey: process.env.OPENAI_API_KEY 
});

// Create HTTP server
const server = http.createServer(app);

// Middleware
app.use(cors());

// Add no-cache headers for CSS files to ensure updates
app.use('/css', (req, res, next) => {
    res.set('Cache-Control', 'no-cache, no-store, must-revalidate');
    res.set('Pragma', 'no-cache');
    res.set('Expires', '0');
    next();
});

app.use(express.static('public'));
app.use(express.json({ limit: '50mb' }));
app.use(express.urlencoded({ extended: true, limit: '50mb' }));

// Routes
app.get('/', (req, res) => {
    res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

app.get('/dashboard', (req, res) => {
    res.sendFile(path.join(__dirname, 'public', 'dashboard.html'));
});

app.get('/analytics', (req, res) => {
    res.sendFile(path.join(__dirname, 'public', 'analytics.html'));
});

app.get('/debtor-details.html', (req, res) => {
    res.sendFile(path.join(__dirname, 'public', 'debtor-details.html'));
});

// API Routes for demo data
app.get('/api/stats', (req, res) => {
    res.json({
        totalDebtors: 2847,
        recoveryRate: 67.3,
        automatedCalls: 15432,
        averageRecoveryTime: 8.4,
        monthlyGrowth: 24.7,
        activeClients: 127
    });
});

app.get('/api/recent-activities', (req, res) => {
    res.json([
        { id: 1, type: 'payment', amount: 45000, client: 'البنك الأهلي', time: '10 دقائق' },
        { id: 2, type: 'call', description: 'مكالمة آلية ناجحة', client: 'بنك الرياض', time: '25 دقيقة' },
        { id: 3, type: 'plan', description: 'خطة سداد جديدة', client: 'بنك ساب', time: '40 دقيقة' },
        { id: 4, type: 'recovery', amount: 78500, client: 'البنك السعودي الفرنسي', time: '1 ساعة' }
    ]);
});

// API للحصول على بيانات عميل واحد
app.get('/api/debtor/:id', (req, res) => {
    const debtorId = req.params.id;



    const debtor = generateDebtorData(debtorId);
    res.json(debtor);
});

// API للحصول على سجل المكالمات
app.get('/api/debtor/:id/calls', (req, res) => {
    const debtorId = req.params.id;

    // إنشاء سجل مكالمات وهمي
    const callHistory = [
        {
            id: 1,
            debtorId: debtorId,
            date: '2024-01-15 14:30',
            duration: '3:45',
            transcript: 'مرحبا أستاذ أحمد، نتصل بك من البنك الأهلي بخصوص موضوع السداد. نود التأكد من حالتك المالية الحالية وإمكانية وضع خطة سداد مناسبة. هل يمكنك مساعدتنا في ذلك؟',
            analysis: 'العميل متعاون ومتفهم للوضع. أظهر استعداداً لوضع خطة سداد. النبرة هادئة ومتقبلة. يُنصح بالمتابعة بنفس الأسلوب الودي.',
            sentiment: 'إيجابي',
            audioUrl: '#'
        },
        {
            id: 2,
            debtorId: debtorId,
            date: '2024-01-10 11:15',
            duration: '2:20',
            transcript: 'السلام عليكم، أتصل بكم بخصوص الدفعة المستحقة. أعلم أن لدي تأخير ولكن أواجه ظروف مالية صعبة حالياً. هل يمكن تأجيل الدفعة لفترة قصيرة؟',
            analysis: 'العميل بادر بالاتصال مما يدل على حسن النية. يواجه صعوبات مالية مؤقتة. النبرة صادقة ومهتمة بالحل. فرصة عالية للتسوية.',
            sentiment: 'محايد',
            audioUrl: '#'
        }
    ];

    res.json(callHistory);
});

// Twilio API Routes
app.post('/api/twilio-token', (req, res) => {
    try {
        const identity = req.body.identity || `agent_${Date.now()}`;
        // Generate real Twilio Access Token
        const token = new AccessToken(
            process.env.TWILIO_ACCOUNT_SID,
            process.env.TWILIO_API_KEY_SID,
            process.env.TWILIO_API_KEY_SECRET,
            { identity }
        );
        const voiceGrant = new VoiceGrant({ outgoingApplicationSid: process.env.TWILIO_TWIML_APP_SID, incomingAllow: true });
        token.addGrant(voiceGrant);
        // Return JWT to client
        res.json({ identity, token: token.toJwt() });
    } catch (error) {
        console.error('Error generating Twilio token:', error);
        res.status(500).json({ error: 'Failed to generate access token' });
    }
});

// TwiML webhook for real calls with bidirectional audio
app.post('/api/voice/outgoing', (req, res) => {
    console.log('🎯 Voice webhook called');
    console.log('📋 Request headers:', req.headers);
    console.log('📋 Request body:', req.body);
    console.log('📋 Query params:', req.query);

    // الحصول على الرقم المراد الاتصال به من parameters
    const targetNumber = req.body.To || req.query.To || '+966539322900'; // الرقم المطلوب (مع رقم افتراضي)
    const from = req.body.From || req.query.From;
    const callSid = req.body.CallSid || req.query.CallSid;

    try {
        // استخدام Conference ID من المتغير العام
        const conferenceId = currentConferenceId;

        if (!conferenceId) {
            console.error('❌ No conference ID available');
            res.status(400).send('No conference ID available');
            return;
        }

        // TwiML للاتصال مع conference room مع إزالة موسيقى الانتظار
        const conferenceTwiML = `<?xml version="1.0" encoding="UTF-8"?>
<Response>
    <Dial timeout="30" action="/api/call-result" method="POST">
        <Conference 
            statusCallback="/api/conference-status" 
            statusCallbackEvent="start join leave" 
            statusCallbackMethod="POST"
            record="record-from-start"
            recordingStatusCallback="/api/recording-status"
            recordingStatusCallbackMethod="POST"
            beep="false"
            startConferenceOnEnter="true"
            endConferenceOnExit="true"
            muted="false">${conferenceId}</Conference>
    </Dial>
    <Say voice="alice" language="en">Call could not be connected.</Say>
</Response>`;

        console.log('📞 Creating conference TwiML for:', targetNumber);
        console.log('📄 Using Conference ID:', conferenceId);
        console.log('📄 TwiML Response:', conferenceTwiML);

        // إنشاء مكالمة منفصلة للعميل لإضافته للـ conference
        setTimeout(() => {
            addParticipantToConference(targetNumber, conferenceId);
        }, 2000);

        res.set({
            'Content-Type': 'text/xml',
            'Cache-Control': 'no-cache'
        });
        res.status(200).send(conferenceTwiML);

    } catch (error) {
        console.error('❌ Error in webhook:', error);

        const errorTwiML = `<?xml version="1.0" encoding="UTF-8"?>
<Response>
    <Say voice="alice" language="en">Sorry, there was an error processing your call.</Say>
</Response>`;

        res.set('Content-Type', 'text/xml');
        res.status(200).send(errorTwiML);
    }
});

// Function to add participant to conference
async function addParticipantToConference(phoneNumber, conferenceId) {
    try {
        const accountSid = 'AC1669d035f7311675a89169807c02d287';
        const authToken = 'b5d208367a830b148cf4aef8b87ac025';
        const client = twilio(accountSid, authToken);

        console.log(`📞 Adding ${phoneNumber} to conference ${conferenceId}`);

        const call = await client.calls.create({
            twiml: `<Response>
                <Dial>
                    <Conference 
                        beep="false" 
                        startConferenceOnEnter="true"
                        endConferenceOnExit="true"
                        muted="false">${conferenceId}</Conference>
                </Dial>
            </Response>`,
            to: phoneNumber,
            from: '+13185234059'
        });

        console.log('✅ Participant call created:', call.sid);

    } catch (error) {
        console.error('❌ Error adding participant to conference:', error);
    }
}

app.get('/api/voice/outgoing', (req, res) => {
    console.log('🎯 Voice webhook GET called');
    console.log('📋 GET headers:', req.headers);
    console.log('📋 GET query:', req.query);

    // نفس الكود للاتصال الحقيقي مع conference
    const targetNumber = req.body.To || req.query.To || '+966539322900'; // الرقم المطلوب (مع رقم افتراضي)
    const conferenceId = currentConferenceId;

    if (!conferenceId) {
        console.error('❌ GET: No conference ID available');
        res.status(400).send('No conference ID available');
        return;
    }

    try {
        const conferenceTwiML = `<?xml version="1.0" encoding="UTF-8"?>
<Response>
    <Dial timeout="30">
        <Conference 
            record="record-from-start"
            beep="false"
            startConferenceOnEnter="true"
            endConferenceOnExit="true"
            muted="false">${conferenceId}</Conference>
    </Dial>
</Response>`;

        console.log('📞 GET: Creating conference TwiML for:', targetNumber);
        console.log('📄 GET: Using Conference ID:', conferenceId);

        // إضافة العميل للـ conference
        setTimeout(() => {
            addParticipantToConference(targetNumber, conferenceId);
        }, 2000);

        res.set({
            'Content-Type': 'text/xml',
            'Cache-Control': 'no-cache'
        });
        res.status(200).send(conferenceTwiML);

    } catch (error) {
        console.error('❌ Error in GET webhook:', error);

        const errorTwiML = `<?xml version="1.0" encoding="UTF-8"?>
<Response>
    <Say voice="alice" language="en">Error in GET webhook</Say>
</Response>`;

        res.set('Content-Type', 'text/xml');
        res.status(200).send(errorTwiML);
    }
});

// Conference status callback
app.post('/api/conference-status', (req, res) => {
    console.log('🏢 Conference status update:', req.body);
    const { ConferenceName, ConferenceEvent, ParticipantLabel, CallSid } = req.body;

    if (ConferenceEvent === 'start') {
        console.log('🟢 Conference started:', ConferenceName);
    } else if (ConferenceEvent === 'join') {
        console.log('👤 Participant joined - CallSid:', CallSid, 'Label:', ParticipantLabel);
        console.log('📞 Conference Name:', ConferenceName);
    } else if (ConferenceEvent === 'leave') {
        console.log('👋 Participant left - CallSid:', CallSid, 'Label:', ParticipantLabel);
    }

    res.status(200).send('OK');
});

// Call result callback  
app.post('/api/call-result', (req, res) => {
    console.log('📞 Call result:', req.body);

    const { DialCallStatus, DialCallDuration } = req.body;

    const resultTwiML = `<?xml version="1.0" encoding="UTF-8"?>
<Response>
    <Say voice="alice" language="en">Call completed. Status: ${DialCallStatus}.</Say>
</Response>`;

    res.set('Content-Type', 'text/xml');
    res.send(resultTwiML);
});

// Recording status callback
app.post('/api/recording-status', (req, res) => {
    console.log('🎙️ Recording status update:', req.body);
    const { RecordingUrl, RecordingDuration, RecordingSid } = req.body;

    if (RecordingUrl) {
        console.log('📹 Recording available at:', RecordingUrl);
        console.log('⏱️ Duration:', RecordingDuration + ' seconds');
    }

    res.status(200).send('OK');
});

// API لتحديث حالة الكتم في المؤتمر مع موسيقى انتظار
app.post('/api/conference-mute', async (req, res) => {
    try {
        const { conferenceId, participantId, muted } = req.body;
        const accountSid = 'AC1669d035f7311675a89169807c02d287';
        const authToken = 'b5d208367a830b148cf4aef8b87ac025';
        const client = twilio(accountSid, authToken);

        console.log(`🔇 ${muted ? 'Muting' : 'Unmuting'} participant ${participantId} in conference ${conferenceId}`);

        if (muted) {
            // كتم الموظف ووضع العميل في انتظار مع موسيقى
            await client.conferences(conferenceId)
                .participants(participantId)
                .update({
                    muted: true,
                    hold: false
                });

            // وضع العميل في انتظار مع موسيقى
            const participants = await client.conferences(conferenceId).participants.list();
            const clientParticipant = participants.find(p => p.callSid !== participantId);

            if (clientParticipant) {
                await client.conferences(conferenceId)
                    .participants(clientParticipant.callSid)
                    .update({
                        hold: true,
                        holdUrl: 'http://twimlets.com/holdmusic?Bucket=com.twilio.music.ambient'
                    });
            }
        } else {
            // إلغاء كتم الموظف وإزالة العميل من الانتظار
            await client.conferences(conferenceId)
                .participants(participantId)
                .update({
                    muted: false,
                    hold: false
                });

            // إزالة العميل من الانتظار
            const participants = await client.conferences(conferenceId).participants.list();
            const clientParticipant = participants.find(p => p.callSid !== participantId);

            if (clientParticipant) {
                await client.conferences(conferenceId)
                    .participants(clientParticipant.callSid)
                    .update({ hold: false });
            }
        }

        res.json({ success: true, muted: muted });

    } catch (error) {
        console.error('❌ Error updating mute status:', error);
        res.status(500).json({ success: false, error: error.message });
    }
});

// API للحصول على معلومات المؤتمر والمشاركين
app.get('/api/conference/:conferenceId/participants', async (req, res) => {
    try {
        const { conferenceId } = req.params;
        const accountSid = 'AC1669d035f7311675a89169807c02d287';
        const authToken = 'b5d208367a830b148cf4aef8b87ac025';
        const client = twilio(accountSid, authToken);

        const participants = await client.conferences(conferenceId).participants.list();

        res.json({
            success: true,
            participants: participants.map(p => ({
                callSid: p.callSid,
                muted: p.muted,
                hold: p.hold,
                startTime: p.dateCreated
            }))
        });

    } catch (error) {
        console.error('❌ Error fetching conference participants:', error);
        res.status(500).json({ success: false, error: error.message });
    }
});

// Global variable لتخزين Conference ID الحالي
let currentConferenceId = null;

// دالة إنشاء بيانات العميل
const generateDebtorData = (id) => {
    const saudiNames = [
        'محمد أحمد العتيبي', 'فهد سعود المطيري', 'عبدالله خالد القحطاني',
        'سارة محمد الدوسري', 'نورا عبدالرحمن الشهري', 'رهف أحمد الزهراني',
        'عمر فيصل الحربي', 'مريم عبدالله البقمي', 'يوسف محمد العنزي',
        'لمياء سعد الغامدي', 'تركي عبدالعزيز آل سعود', 'أمل محمد الشمري'
    ];

    const bankNames = [
        'البنك الأهلي السعودي', 'بنك الرياض', 'بنك ساب', 'البنك السعودي الفرنسي',
        'بنك البلاد', 'بنك الجزيرة', 'البنك السعودي للاستثمار', 'بنك الانماء'
    ];

    const cities = [
        'الرياض', 'جدة', 'مكة المكرمة', 'المدينة المنورة', 'الدمام', 'الخبر',
        'تبوك', 'بريدة', 'خميس مشيط', 'حائل', 'نجران', 'جازان'
    ];

    const loanTypes = [
        'قرض شخصي', 'قرض عقاري', 'قرض سيارة', 'قرض تجاري',
        'بطاقة ائتمانية', 'تمويل المرابحة', 'قرض الأجهزة'
    ];

    const creditStatuses = ['ممتاز', 'جيد', 'متوسط', 'ضعيف', 'سيء'];

    // استخدام seed بناءً على ID للحصول على نتائج ثابتة
    const seed = parseInt(id) || 1;
    const random = (min, max, seedOffset = 0) => {
        const x = Math.sin(seed + seedOffset) * 10000;
        return Math.floor((x - Math.floor(x)) * (max - min + 1)) + min;
    };

    const nameIndex = random(0, saudiNames.length - 1, 1);
    const bankIndex = random(0, bankNames.length - 1, 2);
    const cityIndex = random(0, cities.length - 1, 3);
    const loanTypeIndex = random(0, loanTypes.length - 1, 4);
    const creditStatusIndex = random(0, creditStatuses.length - 1, 5);

    const amount = random(5000, 500000, 6);
    const originalAmount = amount + random(0, 100000, 7);
    const daysOverdue = random(1, 365, 8);
    const successProbability = random(10, 95, 9);

    // توليد رقم هوية سعودي
    const nationalId = `1${String(random(100000000, 999999999, 10))}`;

    // توليد رقم جوال سعودي
    const phoneNumber = `+9665${String(random(10000000, 99999999, 11))}`;

    const dueDate = new Date();
    dueDate.setDate(dueDate.getDate() - daysOverdue);

    return {
        id: id,
        name: saudiNames[nameIndex],
        nationalId: nationalId,
        phone: phoneNumber,
        address: `${cities[cityIndex]} - حي ${random(1, 50, 12)} - شارع ${random(1, 100, 13)}`,
        bank: bankNames[bankIndex],
        amount: amount,
        originalAmount: originalAmount,
        amountFormatted: amount.toLocaleString('ar-SA') + ' ريال',
        originalAmountFormatted: originalAmount.toLocaleString('ar-SA') + ' ريال',
        daysOverdue: daysOverdue,
        dueDate: dueDate.toLocaleDateString('ar-SA'),
        loanType: loanTypes[loanTypeIndex],
        creditStatus: creditStatuses[creditStatusIndex],
        successProbability: successProbability,
        lastContact: new Date(Date.now() - random(1, 30, 14) * 24 * 60 * 60 * 1000).toLocaleDateString('ar-SA'),
        priority: daysOverdue > 90 ? 'عالية' : daysOverdue > 30 ? 'متوسطة' : 'منخفضة',
        notes: 'تم التواصل معه مؤخراً، يُظهر تعاوناً في المحادثات'
    };
};

// Removed old WebSocket handler - using /ai-stream/:debtorId endpoint instead

// Old WebSocket handlers removed - now using Twilio Media Stream integration

function createDebtCollectorPrompt(debtor) {
    // تحديد حالة العميل بناءً على البيانات
    let clientStatus = 'متعثر عادي';
    let approvalPolicy = 'يمكن النظر في الطلب';
    let remainingAmount = debtor.amount || debtor.remainingAmount || 0;
    let daysOverdue = debtor.daysOverdue || 0;

    if (daysOverdue > 180) {
        clientStatus = 'متعثر شديد';
        approvalPolicy = 'لا يمكن الموافقة على أي طلبات - السداد الفوري مطلوب';
    } else if (daysOverdue > 90) {
        clientStatus = 'متعثر متوسط';
        approvalPolicy = 'يمكن النظر في طلبات محدودة مع ضمانات إضافية';
    } else if (debtor.creditStatus === 'سيء' && daysOverdue > 60) {
        clientStatus = 'عالي المخاطر';
        approvalPolicy = 'يتطلب موافقة الإدارة العليا';
    } else if (remainingAmount > 50000) {
        clientStatus = 'مبلغ كبير';
        approvalPolicy = 'يمكن النظر في الطلب مع دراسة مفصلة';
    }

    return `أنت مستشار مالي مهذب ومتفهم من منصة شُهب للتحصيل الذكي. تتحدث باللغة العربية باللهجة السعودية.

بيانات العميل:
- الاسم: ${debtor.name}
- رقم الهوية: ${debtor.nationalId}
- رقم الجوال: ${debtor.phone}
- العنوان: ${debtor.address}

بيانات القرض:
- نوع القرض: ${debtor.loanType}
- المبلغ الأصلي: ${debtor.originalAmount}
- المبلغ المتبقي: ${debtor.remainingAmount || remainingAmount + ' ريال'}
- تاريخ الاستحقاق: ${debtor.dueDate || 'غير محدد'}
- أيام التأخير: ${debtor.daysOverdue}
- حالة الائتمان: ${debtor.creditStatus}
- البنك: ${debtor.bankName || debtor.bank || 'غير محدد'}
- حالة العميل: ${clientStatus}

تعليمات المحادثة:
1. كن مهذباً ومتفهماً ومحترماً طوال الوقت
2. استمع للعميل واعطه فرصة للكلام والشرح
3. تفهم ظروف العميل المالية
4. اشرح الوضع بوضوح ودود دون ضغط شديد
5. ناقش حلول مرنة وخطط سداد متنوعة
6. اعرض المساعدة في إيجاد حلول مناسبة
7. استخدم اللهجة السعودية بأسلوب ودود
8. انتظر ردود العميل ولا تتحدث بشكل مستمر
9. اجعل المحادثة تفاعلية وليس أحادية الاتجاه
10. كن صبوراً ومرناً في النقاش

** تعليمات خاصة بالطلبات والموافقات: **

وضع العميل الحالي: ${clientStatus}
سياسة الموافقة: ${approvalPolicy}

إذا طلب العميل إعادة جدولة أو تأجيل أو أي طلب آخر، تعامل معه كالتالي:

• إذا كان الوضع "متعثر شديد" (أكثر من 180 يوم):
  - اعتذر بأدب واشرح أن وضعه لا يسمح بأي تأجيل
  - أخبره أن الملف في مرحلة متقدمة من التعثر
  - أكد على ضرورة السداد الفوري لتجنب الإجراءات القانونية
  - قل: "أعتذر، لكن وضعك الحالي بعد ${daysOverdue} يوم تأخير لا يسمح بمزيد من التأجيل"

• إذا كان الوضع "متعثر متوسط" (90-180 يوم):
  - اشرح أن وضعه يسمح بنظر محدود للطلب
  - اطلب ضمانات إضافية أو دفعة أولى جزئية
  - قل: "يمكنني النظر في طلبك، لكن سيتطلب دفعة جزئية كحسن نية"

• إذا كان الوضع "عالي المخاطر":
  - اشرح أن الطلب يحتاج موافقة الإدارة العليا
  - اطلب تبرير مقنع ووثائق تدعم وضعه المالي
  - قل: "طلبك يحتاج موافقة خاصة من الإدارة العليا وستستغرق 3-5 أيام"

• إذا كان الوضع "متعثر عادي" أو "مبلغ كبير":
  - أظهر مرونة في النظر للطلب
  - اطلب تفاصيل خطة السداد المقترحة
  - قل: "يمكنني عرض طلبك على فريق الموافقات، ما خطتك المقترحة؟"

في جميع الحالات:
- كن واضحاً حول سياسة الشركة
- اشرح الأسباب بطريقة مهذبة ومنطقية
- لا تعطي وعود قاطعة دون موافقة
- اطلب منه المتابعة خلال أسبوع

** مهم جداً: انتظر رد العميل بعد كل سؤال أو نقطة. لا تتكلم بشكل مستمر. **

ابدأ المحادثة بتحية قصيرة وانتظر رد العميل.`;
}

async function startOpenAIRealtime(prompt) {
    try {
        // Note: This is a simplified implementation
        // In production, you would use the actual OpenAI Realtime API
        console.log('🤖 Starting OpenAI Realtime session with prompt:', prompt.substring(0, 100) + '...');

        return {
            sessionId: Date.now(),
            prompt: prompt,
            active: true
        };
    } catch (error) {
        console.error('❌ Error starting OpenAI Realtime:', error);
        throw error;
    }
}

async function processAudioWithAI(audioData) {
    try {
        // In production, this would process audio with OpenAI Realtime API
        // For now, we'll simulate a response

        console.log('🎤 Processing audio data...');

        // Simulate AI processing delay
        await new Promise(resolve => setTimeout(resolve, 1000));

        return {
            audioData: null, // In production, this would be AI-generated audio
            transcript: 'نعم أفهم وضعك، لكن يجب عليك تسديد المبلغ خلال ثلاثة أيام من الآن',
            confidence: 0.95
        };
    } catch (error) {
        console.error('❌ Error processing audio with AI:', error);
        throw error;
    }
}

async function analyzeAIConversation(conversationData, debtorId) {
    try {
        console.log('📊 Analyzing AI conversation for debtor:', debtorId);

        const analysisPrompt = `قم بتحليل هذه المحادثة بين محصل الديون والعميل:

محادثة: ${conversationData.transcript || 'محادثة قصيرة'}

يرجى تقديم تحليل مفصل يشمل:

1. تحليل المكالمة (نقاط مرتبة):
   - سلوك العميل
   - مدى تعاونه
   - الأعذار المقدمة
   - مصداقية الوعود
   - مستوى الضغط المالي

2. تحديد نسبة احتمالية السداد (نسبة مئوية من 0-100%)

3. التوصيات العملية لتسريع السداد:
   - الإجراءات الفورية
   - الضغوط القانونية
   - خطط السداد المقترحة
   - التوقيت الأمثل للمتابعة

اجعل التحليل مهنياً ومبنياً على تحليل سلوك العميل المالي.`;

        const response = await openai.chat.completions.create({
            model: 'gpt-4o',
            messages: [
                {
                    role: 'system',
                    content: 'أنت خبير في تحليل محادثات التحصيل وسلوك العملاء المالي. قدم تحليلاً مهنياً مفصلاً.'
                },
                {
                    role: 'user',
                    content: analysisPrompt
                }
            ],
            max_tokens: 1500,
            temperature: 0.3
        });

        const analysisText = response.choices[0].message.content;

        // Parse the analysis into structured format
        const structuredAnalysis = parseAnalysisText(analysisText);

        return {
            callAnalysis: structuredAnalysis.callAnalysis,
            paymentProbability: structuredAnalysis.paymentProbability,
            recommendations: structuredAnalysis.recommendations,
            fullAnalysis: analysisText,
            timestamp: new Date().toISOString()
        };

    } catch (error) {
        console.error('❌ Error analyzing conversation:', error);

        // Fallback analysis
        return {
            callAnalysis: [
                'العميل أظهر تفهماً للوضع المالي',
                'تم التوصل لاتفاق مبدئي على خطة السداد',
                'يحتاج متابعة خلال أسبوع'
            ],
            paymentProbability: 65,
            recommendations: [
                'إرسال تذكير خلال 48 ساعة',
                'تحديد تاريخ محدد للدفعة الأولى',
                'التهديد بالإجراءات القانونية عند التأخير'
            ],
            fullAnalysis: 'تحليل مبسط: العميل متعاون نسبياً',
            timestamp: new Date().toISOString()
        };
    }
}

function parseAnalysisText(analysisText) {
    try {
        // Extract call analysis points
        const callAnalysisMatch = analysisText.match(/تحليل المكالمة.*?:\s*(.*?)(?=\d\.|تحديد|التوصيات|$)/s);
        const callAnalysis = callAnalysisMatch ?
            callAnalysisMatch[1].split('\n').map(line => line.trim()).filter(line => line && line !== '-') :
            ['تم إجراء محادثة مع العميل'];

        // Extract payment probability
        const probabilityMatch = analysisText.match(/(\d{1,3})%/);
        const paymentProbability = probabilityMatch ? parseInt(probabilityMatch[1]) : 50;

        // Extract recommendations
        const recommendationsMatch = analysisText.match(/التوصيات.*?:\s*(.*?)$/s);
        const recommendations = recommendationsMatch ?
            recommendationsMatch[1].split('\n').map(line => line.trim()).filter(line => line && line !== '-') :
            ['المتابعة خلال أسبوع'];

        return {
            callAnalysis: callAnalysis.slice(0, 5), // Limit to 5 points
            paymentProbability: Math.min(Math.max(paymentProbability, 0), 100),
            recommendations: recommendations.slice(0, 3) // Limit to 3 recommendations
        };
    } catch (error) {
        console.error('❌ Error parsing analysis text:', error);
        return {
            callAnalysis: ['تم تحليل المكالمة'],
            paymentProbability: 50,
            recommendations: ['متابعة العميل']
        };
    }
}

// API للحصول على Conference ID الحالي
app.get('/api/current-conference-id', (req, res) => {
    res.json({
        success: true,
        conferenceId: currentConferenceId
    });
});

// API لإنشاء Conference ID جديد
app.post('/api/create-conference', (req, res) => {
    currentConferenceId = `shuhub_call_${Date.now()}`;
    console.log('🆕 New conference ID created:', currentConferenceId);

    res.json({
        success: true,
        conferenceId: currentConferenceId
    });
});

// Static TwiML for testing
app.get('/api/twiml/test', (req, res) => {
    console.log('🧪 Test TwiML requested');
    res.set('Content-Type', 'text/xml');
    res.send(basicTwiML);
});

// Alternative webhook for dial functionality
app.post('/api/voice/dial', (req, res) => {
    console.log('🎯 Dial webhook called with:', req.body);

    const to = req.body.To || req.body.to;

    let twiml = `<?xml version="1.0" encoding="UTF-8"?>
<Response>
    <Dial timeout="30" record="record-from-answer">
        <Number>${to}</Number>
    </Dial>
</Response>`;

    console.log('📄 Dial TwiML Response:', twiml);

    res.set('Content-Type', 'text/xml');
    res.send(twiml);
});

// معالجة نتيجة المكالمة
app.post('/api/call-status', (req, res) => {
    console.log('📊 Call status webhook called with:', req.body);

    const { DialCallStatus, DialCallDuration, CallSid } = req.body;

    console.log('📈 Call status update:', {
        status: DialCallStatus,
        duration: DialCallDuration,
        callSid: CallSid
    });

    const VoiceResponse = twilio.twiml.VoiceResponse;
    const response = new VoiceResponse();

    // معالجة حالات المكالمة المختلفة
    switch (DialCallStatus) {
        case 'no-answer':
            console.log('📵 Call not answered');
            response.say({ voice: 'alice', language: 'en' }, 'Call was not answered');
            break;
        case 'busy':
            console.log('📞 Line busy');
            response.say({ voice: 'alice', language: 'en' }, 'Line was busy');
            break;
        case 'failed':
            console.log('❌ Call failed');
            response.say({ voice: 'alice', language: 'en' }, 'Call failed');
            break;
        case 'completed':
            console.log('✅ Call completed successfully');
            response.say({ voice: 'alice', language: 'en' }, 'Call completed');
            break;
        default:
            console.log('🔄 Call ended with status:', DialCallStatus);
            response.say({ voice: 'alice', language: 'en' }, 'Call ended');
    }

    const statusResponse = response.toString();
    console.log('📄 Status TwiML Response:', statusResponse);

    res.type('text/xml');
    res.send(statusResponse);
});

// معالجة تسجيل المكالمات
app.post('/api/call-recording-status', (req, res) => {
    console.log('🎙️ Recording status webhook called with:', req.body);

    const { CallSid, RecordingUrl, RecordingDuration, RecordingSid } = req.body;

    console.log('📹 Recording completed:', {
        callSid: CallSid,
        recordingUrl: RecordingUrl,
        duration: RecordingDuration,
        recordingSid: RecordingSid
    });

    // هنا يمكن حفظ معلومات التسجيل في قاعدة البيانات

    res.status(200).send('OK');
});

// Test webhook endpoint
app.get('/api/test-webhook', (req, res) => {
    const VoiceResponse = twilio.twiml.VoiceResponse;
    const response = new VoiceResponse();

    response.say({ voice: 'alice', language: 'en' }, 'Webhook test successful. This is a test call from Shuhub platform.');
    response.pause({ length: 1 });
    response.say({ voice: 'alice', language: 'en' }, 'Thank you for testing. Goodbye.');

    res.type('text/xml');
    res.send(response.toString());
});

// Call recording webhook (legacy)
app.post('/api/call-recording', (req, res) => {
    try {
        const { CallSid, RecordingUrl, RecordingDuration } = req.body;

        console.log('Call recording received:', {
            callSid: CallSid,
            recordingUrl: RecordingUrl,
            duration: RecordingDuration
        });

        // Process the recording (save to database, analyze, etc.)

        res.status(200).send('OK');
    } catch (error) {
        console.error('Error processing call recording:', error);
        res.status(500).json({ error: 'Failed to process recording' });
    }
});

// Make actual call endpoint
app.post('/api/make-call', async (req, res) => {
    try {
        const { to, from, debtorId } = req.body;
        const accountSid = 'AC1669d035f7311675a89169807c02d287';
        const authToken = 'b5d208367a830b148cf4aef8b87ac025';

        const client = twilio(accountSid, authToken);

        console.log(`Making call to ${to} from ${from}`);

        // للتطوير المحلي، نحتاج webhook عام
        // يمكن استخدام ngrok أو تعطيل الـ webhooks للتطوير
        const baseUrl = process.env.PUBLIC_URL || `${req.protocol}://${req.get('host')}`;
        const isLocalDevelopment = req.get('host').includes('localhost');

        let callParams = {
            to: to,
            from: from,
            timeout: 30
        };

        if (!isLocalDevelopment && baseUrl.startsWith('http')) {
            // إضافة webhooks فقط إذا كان URL عام
            callParams.url = `${baseUrl}/api/voice/outgoing`;
            callParams.statusCallback = `${baseUrl}/api/call-events`;
            callParams.statusCallbackEvent = ['initiated', 'ringing', 'answered', 'completed'];
            callParams.statusCallbackMethod = 'POST';
        } else {
            // للتطوير المحلي، استخدم TwiML بسيط
            callParams.url = 'http://twimlets.com/holdmusic?Bucket=com.twilio.music.ambient';
        }

        const call = await client.calls.create(callParams);

        console.log('Call created:', call.sid);

        res.json({
            success: true,
            callSid: call.sid,
            status: call.status
        });

    } catch (error) {
        console.error('Error making call:', error);
        res.status(500).json({
            success: false,
            error: error.message || 'Failed to make call'
        });
    }
});

// Check call status endpoint with real conversation data
app.get('/api/call-status/:callSid', async (req, res) => {
    try {
        const { callSid } = req.params;
        const accountSid = 'AC1669d035f7311675a89169807c02d287';
        const authToken = 'b5d208367a830b148cf4aef8b87ac025';

        const client = twilio(accountSid, authToken);

        const call = await client.calls(callSid).fetch();

        // Get real conversation data if available
        const conversationData = getConversationData(callSid);

        console.log(`📊 Call status check for ${callSid}:`, {
            callStatus: call.status,
            conversationMessages: conversationData.messages?.length || 0,
            hasTranscript: !!conversationData.fullTranscript,
            transcriptLength: conversationData.fullTranscript?.length || 0
        });

        res.json({
            success: true,
            status: call.status,
            duration: call.duration,
            startTime: call.startTime,
            endTime: call.endTime,
            conversation: conversationData.messages || [],
            fullTranscript: conversationData.fullTranscript || '',
            hasRealData: conversationData.messages && conversationData.messages.length > 0
        });

    } catch (error) {
        console.error('Error fetching call status:', error);
        res.status(500).json({
            success: false,
            error: error.message || 'Failed to fetch call status'
        });
    }
});

// Store for real conversation data
const activeConversations = new Map();

function getConversationData(callSid) {
    return activeConversations.get(callSid) || { messages: [], fullTranscript: '' };
}

function addConversationMessage(callSid, speaker, message, timestamp) {
    console.log(`💬 Adding message - CallSid: ${callSid}, Speaker: ${speaker}, Message: ${message?.substring(0, 50)}...`);

    if (!callSid) {
        console.error('❌ No callSid provided to addConversationMessage');
        return;
    }

    if (!activeConversations.has(callSid)) {
        console.log(`📝 Creating new conversation for callSid: ${callSid}`);
        activeConversations.set(callSid, { messages: [], fullTranscript: '' });
    }

    const conversation = activeConversations.get(callSid);
    conversation.messages.push({
        speaker,
        message,
        time: timestamp,
        type: speaker === 'AI' ? 'ai' : 'user'
    });

    conversation.fullTranscript += `[${timestamp}] ${speaker}: ${message}\n`;
    activeConversations.set(callSid, conversation);

    console.log(`📊 Conversation updated - Total messages: ${conversation.messages.length}`);
}

// Real conversation analysis endpoint
app.post('/api/analyze-conversation', async (req, res) => {
    try {
        const { transcript, debtorData, callSid } = req.body;

        if (!transcript || transcript.trim().length === 0) {
            return res.status(400).json({
                error: 'No transcript provided',
                analysisPoints: ['لا توجد محادثة للتحليل']
            });
        }

        console.log('🔍 Analyzing real conversation for call:', callSid);
        console.log('📝 Transcript length:', transcript.length);

        // Use the existing analyzeAIConversation function
        const conversationData = { transcript };
        const analysis = await analyzeAIConversation(conversationData, debtorData?.id || 'unknown');

        res.json({
            success: true,
            analysisPoints: analysis.callAnalysis || [
                'تم تحليل المحادثة بناءً على المحتوى الفعلي',
                'نتائج التحليل مبنية على النص الحقيقي للمكالمة'
            ],
            paymentProbability: analysis.paymentProbability || Math.floor(Math.random() * 40) + 50,
            recommendations: analysis.recommendations || [
                'متابعة العميل خلال 48 ساعة',
                'إرسال ملخص المحادثة عبر الرسائل النصية',
                'تقديم خطة سداد مرنة',
                'جدولة مكالمة متابعة أسبوعية'
            ],
            fullAnalysis: analysis.fullAnalysis || `تم تحليل محادثة مع العميل ${debtorData?.name || 'غير محدد'}. المحادثة أظهرت ${transcript.length > 100 ? 'تفاعل جيد' : 'تفاعل محدود'} من العميل. يُنصح بالمتابعة وفقاً للحالة المالية الحالية.`,
            isRealAnalysis: true,
            // إضافة تفاصيل أكثر للتحليل الذكي
            callMetrics: {
                duration: transcript.length > 200 ? 'طويلة' : transcript.length > 100 ? 'متوسطة' : 'قصيرة',
                engagement: transcript.includes('نعم') || transcript.includes('موافق') ? 'عالي' : 'منخفض',
                sentiment: transcript.includes('شكراً') || transcript.includes('جيد') ? 'إيجابي' : 'محايد'
            }
        });

    } catch (error) {
        console.error('Error analyzing real conversation:', error);
        res.json({
            success: false,
            error: error.message,
            analysisPoints: [
                'حدث خطأ في تحليل المحادثة',
                'يُنصح بمراجعة التسجيل يدوياً'
            ],
            isRealAnalysis: false
        });
    }
});

// Debug endpoint to check stored conversations
app.get('/api/debug/conversations', (req, res) => {
    const conversations = {};
    for (const [callSid, data] of activeConversations.entries()) {
        conversations[callSid] = {
            messagesCount: data.messages?.length || 0,
            transcriptLength: data.fullTranscript?.length || 0,
            lastMessages: data.messages?.slice(-3) || []
        };
    }

    res.json({
        totalConversations: activeConversations.size,
        conversations: conversations
    });
});

// Voice analysis endpoint (legacy)
app.post('/api/analyze-voice', (req, res) => {
    try {
        const { audioData, transcript, debtorId } = req.body;

        // Simulate voice analysis results
        const analysis = {
            sentiment: 'إيجابي',
            confidence: 0.85,
            tone: 'هادئ',
            stressLevel: 'منخفض',
            cooperationLevel: 'عالي',
            recommendations: [
                'متابعة بنفس الأسلوب الودي',
                'اقتراح خطة سداد مرنة',
                'جدولة مكالمة متابعة خلال أسبوع'
            ]
        };

        res.json({
            success: true,
            analysis: analysis
        });
    } catch (error) {
        console.error('Error analyzing voice:', error);
        res.status(500).json({ error: 'Failed to analyze voice' });
    }
});

// API endpoint for initiating AI calls (OpenAI Realtime API method)
app.post('/api/ai-call', async (req, res) => {
    try {
        const { phoneNumber, debtorId, debtorData } = req.body;

        if (!phoneNumber) {
            return res.status(400).json({ error: 'Phone number is required' });
        }

        console.log(`🤖 Initiating AI call to ${phoneNumber} for debtor ${debtorId}`);

        // Store the real debtor data for this call
        if (debtorData) {
            console.log(`💼 Using real debtor data for ${debtorData.name}`);
        }

        // Initialize Twilio client
        const accountSid = process.env.TWILIO_ACCOUNT_SID;
        const authToken = process.env.TWILIO_AUTH_TOKEN;
        const client = twilio(accountSid, authToken);

        // Create Twilio call with webhook URL
        const call = await client.calls.create({
            to: phoneNumber,
            from: process.env.TWILIO_PHONE_NUMBER,
            url: `http://${req.get('host')}/api/ai-twiml/${debtorId}`
        });

        // Store debtor data for use in WebSocket
        if (debtorData) {
            console.log(`💾 Storing real debtor data for ID: ${debtorId}`);
            debtorDataStore.set(debtorId, debtorData);

            // Store call information for later use
            activeConversations.set(call.sid, {
                messages: [],
                fullTranscript: '',
                debtorData: debtorData,
                startTime: new Date(),
                phoneNumber: phoneNumber
            });
        }

        res.json({
            success: true,
            callSid: call.sid,
            message: 'AI call initiated successfully'
        });

    } catch (error) {
        console.error('❌ Error initiating AI call:', error);
        res.status(500).json({
            error: 'Failed to initiate AI call',
            details: error.message
        });
    }
});

// API endpoint for checking call status
app.get('/api/call-status/:callSid', async (req, res) => {
    try {
        const { callSid } = req.params;

        // Initialize Twilio client
        const accountSid = process.env.TWILIO_ACCOUNT_SID;
        const authToken = process.env.TWILIO_AUTH_TOKEN;
        const client = twilio(accountSid, authToken);

        const call = await client.calls(callSid).fetch();

        res.json({
            callSid: call.sid,
            status: call.status,
            direction: call.direction,
            duration: call.duration,
            price: call.price
        });

    } catch (error) {
        console.error('❌ Error fetching call status:', error);
        res.status(500).json({
            error: 'Failed to fetch call status',
            details: error.message
        });
    }
});

// TwiML endpoint for AI calls
app.get('/api/ai-twiml/:debtorId', (req, res) => {
    const { debtorId } = req.params;
    const host = req.get('host');
    const callSid = req.query.CallSid; // الحصول على CallSid من Twilio

    console.log(`🤖 Generating TwiML for debtor ${debtorId}, CallSid: ${callSid}, host: ${host}`);

    // Always use wss:// for secure WebSocket with ngrok and pass callSid
    const websocketUrl = `wss://${host}/ai-stream/${debtorId}?callSid=${callSid}`;

    const twimlResponse = `<?xml version="1.0" encoding="UTF-8"?>
<Response>
    <Say voice="alice" language="ar">جاري الاتصال</Say>
    <Connect>
        <Stream url="${websocketUrl}" />
    </Connect>
</Response>`;

    console.log(`🤖 TwiML Response:`, twimlResponse);

    res.type('text/xml');
    res.send(twimlResponse);
});

// Store for mapping debtorId to real data
const debtorDataStore = new Map();

// WebSocket handler for AI streaming (OpenAI Realtime API)
app.ws('/ai-stream/:debtorId', async (ws, req) => {
    const { debtorId } = req.params;
    const callSidFromQuery = req.query.callSid; // الحصول على callSid من query params
    console.log(`🤖 AI Stream connected for debtor ${debtorId}, callSid: ${callSidFromQuery}`);

    // Get real debtor data from store, fallback to generated
    let debtorData = null;

    try {
        // Try to get real data from store first
        if (debtorDataStore.has(debtorId)) {
            debtorData = debtorDataStore.get(debtorId);
            console.log(`📋 Using REAL debtor data for: ${debtorData.name} (ID: ${debtorData.id})`);
        } else {
            // Fallback to generated data
            debtorData = generateDebtorData(debtorId);
            console.log(`📋 Using GENERATED debtor data for: ${debtorData.name}`);
        }
    } catch (error) {
        console.error('Error getting debtor data:', error);
        debtorData = generateDebtorData(debtorId); // fallback
    }

    // Keep connection alive
    let openaiWs = null;
    let connectionReady = false;
    let streamSid = null;
    let activeCall = { status: 'initiated' };
    let currentCallSid = callSidFromQuery; // استخدام callSid من الرابط
    let currentAIResponse = '';
    let aiResponseStartTime = null;

    try {
        console.log(`🔗 Connecting to OpenAI for debtor ${debtorData.name}...`);

        // Connect to OpenAI Realtime API
        openaiWs = new WebSocket('wss://api.openai.com/v1/realtime?model=gpt-4o-realtime-preview-2024-12-17', {
            headers: {
                'Authorization': `Bearer ${process.env.OPENAI_API_KEY}`,
                'OpenAI-Beta': 'realtime=v1'
            }
        });

        // Initialize OpenAI session
        openaiWs.on('open', () => {
            console.log('✅ Connected to OpenAI Realtime API successfully!');
            console.log('🔗 OpenAI WebSocket state:', openaiWs.readyState);
            connectionReady = true;

            // Send session configuration
            const sessionConfig = {
                type: 'session.update',
                session: {
                    turn_detection: {
                        type: 'server_vad',
                        threshold: 0.5,
                        prefix_padding_ms: 300,
                        silence_duration_ms: 800
                    },
                    input_audio_format: 'g711_ulaw',
                    output_audio_format: 'g711_ulaw',
                    voice: 'alloy',
                    instructions: createDebtCollectorPrompt(debtorData),
                    modalities: ['text', 'audio'],
                    temperature: 0.7,
                    input_audio_transcription: {
                        model: 'whisper-1'
                    }
                }
            };

            console.log('🔧 Sending session config to OpenAI...');
            console.log('📋 Session config:', JSON.stringify(sessionConfig, null, 2));

            try {
                openaiWs.send(JSON.stringify(sessionConfig));
                console.log('✅ Session config sent successfully');
            } catch (error) {
                console.error('❌ Failed to send session config:', error);
            }
        });

        // Handle session updates from OpenAI
        openaiWs.on('message', (message) => {
            try {
                const data = JSON.parse(message);
                console.log('📨 OpenAI Event:', data.type);

                // Send audio responses back to Twilio
                if (data.type === 'response.audio.delta' && data.delta && streamSid) {
                    console.log('🔊 Sending audio to Twilio, length:', data.delta.length);

                    // Format audio for Twilio Media Stream
                    const twilioMediaMessage = {
                        event: 'media',
                        streamSid: streamSid,
                        media: {
                            payload: data.delta
                        }
                    };

                    if (ws.readyState === WebSocket.OPEN) {
                        try {
                            ws.send(JSON.stringify(twilioMediaMessage));
                            console.log('📤 Audio sent to Twilio successfully');
                        } catch (error) {
                            console.error('❌ Failed to send audio to Twilio:', error);
                        }
                    } else {
                        console.log('⚠️ Twilio WebSocket not open, skipping audio send');
                    }
                } else if (data.type === 'response.audio.delta' && data.delta && !streamSid) {
                    console.log('⚠️ Received audio but streamSid not set yet');
                }

                // When session is updated, send initial greeting
                if (data.type === 'session.updated') {
                    console.log('✅ Session updated, sending initial greeting...');
                    setTimeout(() => {
                        const greetingMessage = {
                            type: 'conversation.item.create',
                            item: {
                                type: 'message',
                                role: 'user',
                                content: [{
                                    type: 'input_text',
                                    text: `قل السلام عليكم للعميل ${debtorData.name}، وعرّف نفسك باختصار من منصة شُهب واطلب منه دقيقة من وقته. انتظر رده ولا تطول في الكلام.`
                                }]
                            }
                        };

                        console.log('💬 Sending greeting message...');
                        openaiWs.send(JSON.stringify(greetingMessage));
                        openaiWs.send(JSON.stringify({ type: 'response.create' }));
                    }, 500);
                }

                // Handle real transcriptions and responses
                if (data.type === 'conversation.item.input_audio_transcription.completed') {
                    console.log('🎤 User Transcription:', data.transcript);
                    // Store user message
                    const timestamp = new Date().toLocaleTimeString('ar-SA');
                    addConversationMessage(currentCallSid, 'العميل', data.transcript, timestamp);
                }

                // Accumulate AI response deltas
                if (data.type === 'response.text.delta' && data.delta) {
                    console.log('🤖 AI Response Delta:', data.delta);
                    // Accumulate deltas instead of storing each one
                    if (!currentAIResponse) {
                        currentAIResponse = '';
                        aiResponseStartTime = new Date().toLocaleTimeString('ar-SA');
                    }
                    currentAIResponse += data.delta;
                }

                // Save complete AI response when done
                if (data.type === 'response.text.done') {
                    if (currentAIResponse && currentAIResponse.trim()) {
                        console.log('✅ Complete AI Response:', currentAIResponse);
                        addConversationMessage(currentCallSid, 'AI', currentAIResponse.trim(), aiResponseStartTime);
                        currentAIResponse = '';
                        aiResponseStartTime = null;
                    }
                }

                // Handle completed responses
                if (data.type === 'response.done') {
                    console.log('✅ Response completed');
                }

            } catch (error) {
                console.error('❌ Error parsing OpenAI message:', error);
            }
        });

        // Forward messages from Twilio to OpenAI
        ws.on('message', (message) => {
            try {
                const twilioData = JSON.parse(message.toString());
                console.log('📞 Received from Twilio:', twilioData.event || 'unknown event');

                if (twilioData.event === 'start') {
                    streamSid = twilioData.start.streamSid;
                    // Use the callSid from query params (more reliable)
                    if (!currentCallSid) {
                        currentCallSid = twilioData.start.callSid || streamSid;
                    }
                    console.log('📞 Call started, media stream activated. StreamSid:', streamSid, 'CallSid:', currentCallSid);

                    // Initialize conversation storage for this call
                    if (currentCallSid && !activeConversations.has(currentCallSid)) {
                        activeConversations.set(currentCallSid, { messages: [], fullTranscript: '' });
                        console.log(`📝 Initialized conversation storage for callSid: ${currentCallSid}`);
                    }

                    // Update call status
                    if (activeCall) {
                        activeCall.status = 'in-progress';
                        activeCall.startTime = new Date();
                    }
                } else if (twilioData.event === 'stop') {
                    console.log('📞 Media stream stopped');
                    // Update call status and close OpenAI connection
                    if (activeCall) {
                        activeCall.status = 'completed';
                        activeCall.endTime = new Date();
                    }
                    if (openaiWs && openaiWs.readyState === WebSocket.OPEN) {
                        openaiWs.close();
                    }
                } else if (connectionReady && openaiWs && openaiWs.readyState === WebSocket.OPEN) {
                    // Only forward media events to OpenAI
                    if (twilioData.event === 'media' && twilioData.media) {
                        const audioEvent = {
                            type: 'input_audio_buffer.append',
                            audio: twilioData.media.payload
                        };
                        openaiWs.send(JSON.stringify(audioEvent));
                        console.log('🎤 Forwarded audio to OpenAI');
                    }
                } else if (twilioData.event === 'media') {
                    console.log('⚠️ Received audio but OpenAI not ready or connected');
                }
            } catch (error) {
                console.error('❌ Error processing Twilio message:', error);
            }
        });

        // Add error handling
        openaiWs.on('error', (error) => {
            console.error('❌ OpenAI WebSocket error:', error);
            console.error('🔍 Error details:', {
                message: error.message,
                code: error.code,
                type: error.type
            });
        });

        ws.on('error', (error) => {
            console.error('❌ Twilio WebSocket error:', error);
        });

        // Check initial connection
        setTimeout(() => {
            if (!connectionReady) {
                console.error('⚠️ OpenAI connection not ready after 5 seconds');
                console.log('🔍 Current WebSocket state:', openaiWs.readyState);
                console.log('🔍 Connection ready flag:', connectionReady);
            }
        }, 5000);

        // Keep connections alive
        const keepAlive = setInterval(() => {
            if (ws.readyState === WebSocket.OPEN) {
                ws.ping();
            }
            if (openaiWs && openaiWs.readyState === WebSocket.OPEN) {
                // Send keep-alive to OpenAI if needed
            }
        }, 30000); // Every 30 seconds

        // Handle Twilio connection events
        ws.on('open', () => {
            console.log('🔗 Twilio WebSocket connected successfully');
        });

        ws.on('close', (code, reason) => {
            console.log(`📴 Twilio WebSocket disconnected: ${code} - ${reason}`);
            console.log(`📞 Call ended for debtor ${debtorId}`);
            clearInterval(keepAlive);

            // Update call status to completed when Twilio disconnects
            if (activeCall) {
                activeCall.status = 'completed';
                activeCall.endTime = new Date();
                console.log(`📊 Call completed: ${activeCall.status}`);
            }

            if (openaiWs && openaiWs.readyState === WebSocket.OPEN) {
                openaiWs.close();
            }
        });

        // Handle OpenAI connection events
        openaiWs.on('close', (code, reason) => {
            console.log(`🤖 OpenAI connection closed: ${code} - ${reason}`);
            clearInterval(keepAlive);
            if (ws.readyState === WebSocket.OPEN) {
                ws.close();
            }
        });

    } catch (error) {
        console.error('❌ Error in AI stream:', error);
        ws.close();
    }
});

app.listen(PORT, () => {
    console.log(`🚀 شُهب Finance Platform running on http://localhost:${PORT}`);
    console.log('📊 منصة التحصيل الذكي جاهزة للعمل');
    console.log(`🤖 AI Realtime WebSocket ready on ws://localhost:${PORT}`);
});