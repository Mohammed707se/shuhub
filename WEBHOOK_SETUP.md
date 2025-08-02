# 🔗 إعداد Webhooks للمكالمات الحقيقية

## 📋 نظرة عامة

للحصول على مكالمات حقيقية كاملة مع Twilio، تحتاج لإعداد webhooks عامة. هناك طريقتان:

## 🌐 الطريقة الأولى: استخدام ngrok (للتطوير)

### 1. تثبيت ngrok
```bash
# macOS
brew install ngrok

# أو تحميل من الموقع
https://ngrok.com/download
```

### 2. تشغيل ngrok
```bash
# في terminal منفصل
ngrok http 3000
```

### 3. نسخ URL العام
ستحصل على URL مثل: `https://abc123.ngrok.io`

### 4. تحديث متغير البيئة
```bash
export PUBLIC_URL=https://abc123.ngrok.io
npm start
```

## 🏗️ الطريقة الثانية: نشر على خادم عام

### خيارات النشر:
- **Heroku**: `https://your-app.herokuapp.com`
- **Vercel**: `https://your-app.vercel.app`
- **Railway**: `https://your-app.railway.app`
- **DigitalOcean**: `https://your-domain.com`

## ⚙️ إعداد Twilio Console

### 1. إنشاء TwiML Application
1. اذهب إلى [Twilio Console](https://console.twilio.com)
2. انتقل إلى **Phone Numbers > TwiML Apps**
3. انقر **Create new TwiML App**
4. املأ:
   - **Friendly Name**: `Shuhub Voice App`
   - **Voice Request URL**: `https://your-domain.com/api/voice/outgoing`
   - **Voice Method**: `POST`
   - **Status Callback URL**: `https://your-domain.com/api/call-events`
   - **Status Callback Method**: `POST`

### 2. ربط الرقم بـ TwiML App
1. اذهب إلى **Phone Numbers > Manage > Active Numbers**
2. انقر على رقمك: `(318) 523-4059`
3. في قسم **Voice & Fax**:
   - **Configure with**: `TwiML App`
   - **TwiML App**: `Shuhub Voice App`
4. احفظ التغييرات

## 🧪 اختبار النظام

### الوضع الحالي (بدون webhook):
- ✅ إنشاء المكالمة
- ✅ مراقبة الحالة
- ❌ تسجيل المحادثة
- ❌ webhooks للأحداث

### مع الـ webhook:
- ✅ إنشاء المكالمة
- ✅ مراقبة الحالة
- ✅ تسجيل المحادثة
- ✅ webhooks للأحداث
- ✅ TwiML مخصص

## 🔧 نصائح استكشاف الأخطاء

### مشكلة: "URL is not valid"
```bash
# تأكد أن ngrok يعمل
curl https://your-ngrok-url.ngrok.io/api/voice/outgoing

# تأكد من تحديث PUBLIC_URL
echo $PUBLIC_URL
```

### مشكلة: "Call fails immediately"
1. تحقق من رصيد Twilio
2. تأكد أن الرقم مُتحقق منه في Twilio
3. تحقق من logs الخادم

### مشكلة: "No webhook events"
1. تحقق من إعداد TwiML App
2. تأكد أن URL عام ومتاح
3. تحقق من Twilio Debug Logs

## 📱 أرقام الاختبار

### للاختبار مع Twilio:
- **رقمك**: `+13185234059`
- **أرقام اختبار Twilio**: 
  - `+15005550006` (invalid number)
  - `+15005550001` (busy)
  - `+15005550004` (answered then hangs up)

## 🚀 التشغيل السريع

للحصول على مكالمات تعمل خلال 5 دقائق:

```bash
# في terminal 1
ngrok http 3000

# في terminal 2
export PUBLIC_URL=https://your-ngrok-url.ngrok.io
npm start

# اذهب إلى المتصفح واختبر المكالمة
```

---

**ملاحظة**: النظام يعمل حالياً في وضع "fallback" بدون webhooks، وسيقوم بمراقبة حالة المكالمات عبر Twilio API مباشرة.