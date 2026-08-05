# Security Specification for KidGuard Firebase Integration

## 1. Data Invariants
- A `KidProfile` document must have `ownerUid == request.auth.uid`.
- A `GeofenceZone` document must have `ownerUid == request.auth.uid`.
- An `AlertEvent` document must have `ownerUid == request.auth.uid`.
- A `TimelineEvent` document must have `ownerUid == request.auth.uid`.
- Unauthenticated users cannot read or write any documents.
- Authenticated users can only read or write documents where `ownerUid == request.auth.uid`.

## 2. The Dirty Dozen Payloads
1. Unauthenticated write attempt to `/kids/k1` -> PERMISSION_DENIED
2. Spoofed `ownerUid` (`ownerUid != request.auth.uid`) during create on `/kids/k1` -> PERMISSION_DENIED
3. Oversized string (>100 chars) for `name` on `/kids/k1` -> PERMISSION_DENIED
4. Attempting to update another user's geofence document `/geofences/g1` -> PERMISSION_DENIED
5. Attempting to list all alerts without `ownerUid` filter in query -> PERMISSION_DENIED
6. Creating an alert with non-number `timestamp` -> PERMISSION_DENIED
7. Creating a timeline event with missing `title` or `category` -> PERMISSION_DENIED
8. Attempting shadow update with extra disallowed field on `/geofences/g1` -> PERMISSION_DENIED
9. Attempting to modify `ownerUid` on existing `/kids/k1` document -> PERMISSION_DENIED
10. Injecting invalid document ID with malicious characters (e.g. `../../admin`) -> PERMISSION_DENIED
11. Reading another user's `TimelineEvent` document -> PERMISSION_DENIED
12. Creating a `KidProfile` with empty string or non-string `id` -> PERMISSION_DENIED
