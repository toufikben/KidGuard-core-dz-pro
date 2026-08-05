# KidGuard-Next

Rebuilt architecture for KidGuard, replacing the single-repo prototype in **KidGuard-dz**.

## Why this repo exists
The original app worked but was a single flat `com.example` package where the "child left safe zone"
event was the only signal driving alerts. This repo restructures the same working logic into a clean,
layered architecture and adds a real Risk Engine so the system can reason about *behavior*, not just
geofence membership.

## Architecture
```
app/
  core/          device-facing building blocks (permissions, location, notification)
  data/          model, database (Room), repository
  domain/        analyzer, risk, geofence, emergency, usecases
  service/       background foreground services (Stage 3)
  ui/            screens, viewmodels, navigation, theme (Stage 2)
  worker/        WorkManager periodic jobs (Stage 3)
```

### Risk pipeline (new)
```
Location -> BehaviorAnalyzer -> RiskEngine -> DecisionEngine -> EmergencyEngine -> Actions
```
- **BehaviorAnalyzer** turns raw GPS samples into events: left safe zone, sustained speed increase,
  no stop detected, entered vehicle, tamper detected.
- **RiskEngine** keeps a 0-100 score per kid; tamper events jump straight to the top tier.
- **DecisionEngine** maps score thresholds to actions, only returning newly-crossed thresholds:
  - 15 -> begin close monitoring
  - 40 -> notify parent
  - 70 -> SMS parent
  - 90 -> call parent + continuous live location + audio recording
- **EmergencyEngine** executes actions gradually (not all at once) and picks the adaptive GPS polling
  interval: stationary = 5 min, walking = 20s, running/vehicle = 5s, risk >= 70 = 1s.
- **TamperDetectionMonitor** checks for GPS disabled, airplane mode, and revoked location permission.

## Migration status
- [x] **Stage 1** — project scaffold, core layer (permissions/location/notification), data layer
  (model/database/repository, migrated from KidGuard-dz), and the new domain risk pipeline.
- [ ] **Stage 2** — UI layer: screens (Dashboard, Geofence, History, KidsManager, PinLock, Settings,
  Alerts), navigation, theming, i18n, MainActivity — ported from KidGuard-dz and wired to the new
  ViewModels.
- [ ] **Stage 3** — background foreground service + WorkManager, so tracking/risk evaluation keeps
  running when the app isn't in the foreground; wiring `EmergencyEngine.pollingIntervalMs()` into
  `LocationEngine`.
- [ ] **Stage 4** — Firebase backend + parent app / web dashboard (per original plan).

**Note:** Stage 1 alone will not compile in Android Studio — `TrackerViewModel` references the
`ui.i18n` package that lands in Stage 2. This is expected for a staged migration.

Original prototype for reference: [KidGuard-dz](https://github.com/toufikben/KidGuard-dz)
