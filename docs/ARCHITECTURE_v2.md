# KidGuard Core v2 — Architecture Blueprint

تاريخ الإنشاء: 2026-08-03

## 1. الرؤية
KidGuard ليس تطبيق تتبع، بل منصة تحليل وحماية للأطفال.
كل شيء داخل النظام يعتمد على:
- Events
- Engines
- States
- Rules

وليس على استدعاء الخدمات مباشرة.

## 2. الهيكل النهائي
src/

core/
    EventBus
    Logger
    Config
    Scheduler
    TimeProvider
    HealthMonitor

domain/
    entities/
    valueObjects/
    events/
    rules/
    engines/
    usecases/
    repositories/

services/
    location/
    notification/
    firebase/
    storage/
    permission/
    battery/
    network/

repositories/
    local/
    remote/
    cache/

platform/
    android/
    ios/
    web/

presentation/
    screens/
    components/
    viewmodels/

analytics/

security/

diagnostics/

tests/

## 3. محركات النظام
- LocationEngine
- BehaviorEngine
- RiskEngine
- DecisionEngine
- ActionDispatcher
- NotificationEngine
- SyncEngine
- BatteryEngine
- PermissionEngine
- TamperEngine
- HealthEngine
- PredictionEngine

كل محرك يؤدي وظيفة واحدة فقط.

## 4. EventBus
كل التواصل داخل المشروع يتم عبر الأحداث.

مثال:
LocationUpdated

↓

EventBus

↓

BehaviorEngine

↓

RiskEngine

↓

DecisionEngine

↓

ActionDispatcher

لا يستدعي أي محرك محركًا آخر مباشرة.

## 5. Domain Events
- LocationUpdated
- RiskChanged
- ChildStopped
- ChildRunning
- BatteryLow
- BatteryCritical
- NetworkLost
- NetworkRestored
- GpsDisabled
- GpsEnabled
- PermissionLost
- PermissionGranted
- EmergencyStarted
- EmergencyEnded
- SafeZoneEntered
- SafeZoneExited
- TamperDetected
- SyncCompleted
- BootCompleted

## 6. State Machine
SAFE

↓

NORMAL

↓

WATCHING

↓

SUSPICIOUS

↓

DANGER

↓

EMERGENCY

كل حالة تحدد:
- دقة GPS.
- سرعة الإرسال.
- عدد الحساسات.
- نوع الإشعارات.
- سياسة البطارية.

## 7. Rule Engine
كل قواعد المشروع تحفظ خارج الكود.

مثال:
- Battery < 10  → Risk +25
- GPS Disabled  → Risk +40
- SafeZone Exit → Risk +20

يمكن تعديلها دون تعديل الكود.

## 8. Decision Engine
المدخلات:
- Risk Report
- Child State
- Confidence
- Rules

المخرجات:
- Decision

ولا ينفذ القرار.

## 9. Action Dispatcher
هو الوحيد الذي ينفذ.
مثلاً:
Decision → Notification / Firebase / SMS / Call / Recording / Location Update

## 10. Repository Layer
Repository → Cache → SQLite → Firebase

لا يعرف Domain مكان البيانات.

## 11. Sync Engine
مسؤول عن:
- Queue
- Retry
- Conflict
- Offline
- Upload
- Download

## 12. Android Layer
Foreground Service → Workers → Native Sensors → Core

React لا يدير الخدمات.

## 13. Security
يتكون من:
- Encryption
- Integrity Check
- Root Detection
- Debugger Detection
- Mock Location
- Tamper Detection
- Permission Verification

## 14. Health Monitor
يراقب:
- Foreground Service
- GPS
- Workers
- Firebase
- Battery
- Permissions
- Queue
- Database

## 15. Logger
الفئات:
- Security
- Location
- Battery
- Decision
- Risk
- Firebase
- System
- Performance

## 16. Diagnostics
يعرض:
- حالة الخدمات.
- آخر موقع.
- آخر حدث.
- آخر Sync.
- استهلاك البطارية.
- عدد الأخطاء.
- حالة الصلاحيات.

## 17. Configuration
ملف واحد يحتوي:
- GPS
- Battery
- Firebase
- Risk
- Notification
- Logging
- Sync
- Debug

## 18. Feature Flags
إمكانية تشغيل أو تعطيل:
- AI
- Voice
- Prediction
- Live Tracking
- Diagnostics
- Watch Support

بدون تحديث التطبيق.

## 19. Coding Standards
- الحد الأقصى للملف: 300 سطر.
- الحد الأقصى للدالة: 40 سطرًا.
- كل Service لها مسؤولية واحدة.
- يمنع استدعاء Service من Service مباشرة.
- يمنع الوصول إلى Firebase من Domain.
- يمنع الوصول إلى Android API من Domain.
- كل قرار يصدر من Decision Engine فقط.
- كل تنفيذ يمر عبر Action Dispatcher.
- كل اتصال داخلي يتم عبر EventBus.

## 20. خارطة التنفيذ
1. إنشاء core.
2. إنشاء EventBus.
3. إنشاء StateMachine.
4. إنشاء Domain Events.
5. إنشاء Rule Engine.
6. إنشاء Action Dispatcher.
7. إعادة تقسيم جميع الخدمات.
8. إنشاء Sync Engine.
9. إنشاء Health Monitor.
10. إعادة بناء طبقة Android الأصلية.
11. إضافة الاختبارات.
12. تحسين الأداء والأمان.

بهذه البنية يصبح KidGuard Core نواة مستقلة يمكن تشغيلها مع تطبيق الطفل، تطبيق ولي الأمر، ساعة ذكية، جهاز GPS مخصص، أو لوحة ويب دون إعادة تصميم الأساس.
