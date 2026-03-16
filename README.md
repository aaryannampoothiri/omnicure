# OmniCure — Secure Healthcare Portal

Vercel Deployment: omnicure-one.vercel.app

A full-stack web application for secure patient-doctor data sharing, built with Next.js 16 and enforcing cryptographic mutual authentication via Elliptic Curve Cryptography (ECC) and Bilinear Pairing. Patients manage their own health records; doctors access patient data through a cryptographically verified secure channel.

---

## Features

- **Patient Portal** — Manage vitals, medications, devices, lab reports, prescriptions, and medical history
- **Doctor Portal** — Enroll patients, access transferred records, prescribe medications, and add clinical advice
- **ECC + Bilinear Pairing Authentication** — Mutual authentication with dynamic session keys, timestamp freshness validation, and bilinear pairing verification before any data transfer
- **Audit Logging** — Immutable audit trail for all authentication and data access events
- **Medication Scheduling** — Four daily time slots with take-tracking and due-time reminders
- **Vitals Visualization** — Line charts for heart rate, SpO₂, blood sugar, blood pressure, and temperature
- **Bluetooth Device Pairing** — Register and sync monitoring devices
- **Role-based Access Control** — Strict patient/doctor separation; patients cannot access doctor routes and vice versa

---

## Tech Stack

| Layer | Technology |
|-------|-----------|
| Framework | Next.js 16.1.6 (App Router) |
| UI Library | React 19.2.3 |
| Language | TypeScript 5 |
| Styling | Tailwind CSS v4 |
| Charts | Recharts 3 |
| Cryptography | Custom ECC + Bilinear Pairing (pure TypeScript, no external crypto lib) |
| Data Store | Flat-file JSON (`data/omnicure-store.json`) |
| Session | Client-side `localStorage` (`omnicure_session`) |

---

## Getting Started

### Prerequisites

- Node.js 18+
- npm 9+

### Installation

```bash
git clone https://github.com/aaryannampoothiri/omnicure.git
cd omnicure
npm install
```

### Development

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) in your browser.

### Production Build

```bash
npm run build
npm run start
```

### Lint

```bash
npm run lint
```

### Demo Credentials 

Use the seeded accounts below to test both portals immediately:

| Role | ID / Username | Password |
|------|----------------|----------|
| Doctor | `demo_doc` | `demo123` |
| Patient | `demo_patient` | `demo123` |

Quick transfer demo flow:

1. Login as **Doctor** (`demo_doc` / `demo123`)
2. Open **Doctor → Patients** and select **demo_patient**
3. Continue to transfer and open the patient detail page
4. Verify daily vitals, weekly stats, medications, history, and lab report data are available

---

## Project Structure

```
omnicure/
├── app/
│   ├── api/                        # REST API routes
│   │   ├── auth/                   # login, register
│   │   ├── doctor/                 # patient enrollment + secure data sync
│   │   ├── patient/[patientId]/    # clinical data (profile, vitals, meds, devices, records)
│   │   ├── omnicure/               # ECC protocol: init, register, authenticate
│   │   └── logs/                   # audit log retrieval
│   ├── components/                 # Shared React components & utilities
│   │   ├── portal-shell.tsx        # Top bar + sidebar layout wrapper
│   │   ├── session-utils.ts        # localStorage session helper
│   │   ├── patient-api.ts          # Patient data REST client
│   │   ├── security-audit-log.tsx  # Audit log UI component
│   │   ├── vital-monitor.tsx       # Vitals charts component
│   │   ├── handshake-modal.tsx     # Protocol handshake UI
│   │   └── role-gate.tsx           # Route access guard by role
│   ├── doctor/                     # Doctor portal pages
│   │   ├── page.tsx                # Doctor dashboard
│   │   ├── patients/page.tsx       # Patient list + enrollment + transfer trigger
│   │   ├── patients/[patientId]/   # Patient detail + prescriptions + advice
│   │   └── logs/page.tsx           # Activity audit log
│   ├── patient/                    # Patient portal pages
│   │   ├── page.tsx                # Patient dashboard
│   │   ├── profile/                # Profile editor
│   │   ├── vitals/                 # Vitals entry + chart
│   │   ├── medications/            # Medication schedule + logging
│   │   ├── devices/                # Device pairing
│   │   ├── history/                # Medical history
│   │   ├── lab-reports/            # Lab reports
│   │   ├── prescriptions/          # Prescriptions view
│   │   ├── daily-vitals/           # Daily vital records
│   │   ├── weekly-vitals/          # Weekly averages
│   │   └── comments/               # Notes and comments
│   ├── login/page.tsx              # Login (patient / doctor)
│   ├── register/page.tsx           # New user registration
│   └── globals.css                 # Global styles + Tailwind config
├── lib/omnicure/
│   ├── protocol.ts                 # ECC + bilinear pairing cryptographic engine
│   ├── clinical-store.ts           # Patient & user data access layer
│   ├── audit-store.ts              # In-memory audit log
│   └── store.ts                    # Protocol context state management
├── data/
│   └── omnicure-store.json         # Persistent user and patient records
└── public/                         # Static assets (logo, icons)
```

---

## Cryptographic Security Model

Data transfers from patient to doctor are protected by a three-phase protocol implemented in `lib/omnicure/protocol.ts`.

### Protocol Overview

```
TA Initialization → Doctor Registration → Patient Registration → Mutual Authentication → Session Key
```

### Mathematical Foundation

- **Field**: All arithmetic modulo prime `p = 170141183460469231731687303715884105727` (128-bit Mersenne prime)
- **Group Order**: `p − 1`
- **Bilinear Map**: `e: G₁ × G₂ → Gₜ` simulated via modular exponentiation

### Phase 1 — Trusted Authority (TA) Init

Random scalars `g1, a, t, g3` generated. `g2` derived as a bilinear-compatible generator via:
```
g2 = g1^(u1² mod p)
x  = g1^a mod p
```

### Phase 2 — Doctor Registration

```
d1Scalar = SHA‑256(doctorId) mod (p−1)
d1Key    = g1^(a + d1Scalar)
d2       = g1^(a − d1Scalar + t)
d3       = g1^(2a + t)
```

### Phase 3 — Patient Registration

```
uiScalar = SHA‑256(patientId) mod (p−1)
b1       = g1^(t + uiScalar)
b2       = g1^(a + t − uiScalar)
u1Auth   = g1^(a + 2t)
u2       = SHA‑256(u1Auth ‖ patientId)
```

### Phase 4 — Mutual Authentication

1. **User hash** — client-supplied `u2*` verified against server-computed `u2`
2. **Timestamp freshness** — request timestamp must be within ±30 seconds of server time (replay attack prevention)
3. **Bilinear pairing check** — patient's `g2` must equal TA-derived `g2`
4. **Session key agreement** — three independent XOR-derived keys `(skd, skta, sku)` must converge:
   ```
   sessionKey = keyFromXor(t1, u1, d1Scalar)   # 64-hex-char, TTL: 2 minutes
   ```

All four checks must pass; any failure returns `HTTP 401` and logs a `critical` audit event.

### Performance

Module-level singletons cache TA state, doctor registrations, and patient registrations — cold-start cost is paid once per server process. Warm-path benchmark: ~190–200 ms per request.

---

## API Reference

### Auth

| Method | Endpoint | Description |
|--------|----------|-------------|
| `POST` | `/api/auth/login` | Login with ID/email + password; returns role and session info |
| `POST` | `/api/auth/register` | Register a new patient or doctor account |

### Doctor

| Method | Endpoint | Description |
|--------|----------|-------------|
| `GET` | `/api/doctor/patients?doctorId=` | List enrolled patients for a doctor |
| `POST` | `/api/doctor/patients` | Enroll a patient under a doctor |
| `POST` | `/api/doctor/patients/[patientId]/secure-sync` | Secure data transfer with full ECC + bilinear pairing enforcement |

### Patient Clinical Data

| Method | Endpoint | Description |
|--------|----------|-------------|
| `GET` | `/api/patient/[patientId]/overview` | Full patient record |
| `GET/PUT` | `/api/patient/[patientId]/profile` | Read / update profile |
| `POST` | `/api/patient/[patientId]/medications/add` | Schedule a medication |
| `POST` | `/api/patient/[patientId]/medications/log` | Mark medication as taken |
| `POST` | `/api/patient/[patientId]/medications/remove` | Remove medication |
| `POST` | `/api/patient/[patientId]/devices/pair` | Pair a Bluetooth device |
| `POST` | `/api/patient/[patientId]/devices/[deviceId]/sync` | Sync device data |
| `POST` | `/api/patient/[patientId]/records/[section]` | Update a clinical record section |

### OmniCure Protocol

| Method | Endpoint | Description |
|--------|----------|-------------|
| `POST` | `/api/omnicure/init` | Initialize TA state |
| `POST` | `/api/omnicure/register/doctor` | Register doctor in protocol |
| `POST` | `/api/omnicure/register/patient` | Register patient in protocol |
| `POST` | `/api/omnicure/authenticate` | Perform mutual authentication; returns session key |
| `POST` | `/api/omnicure/protocol` | End-to-end: init + register + authenticate in one call |

### Logs

| Method | Endpoint | Description |
|--------|----------|-------------|
| `GET` | `/api/logs?role=&actorId=` | Retrieve audit entries filtered by role and actor |

---

## User Roles & Session

Sessions are stored in `localStorage` under the key `omnicure_session`:

```ts
type ClientSession = {
  id: string;
  name: string;
  role: "patient" | "doctor";
  needsProfileSetup?: boolean;
};
```

- **Patients** with incomplete profiles (`age < 1` or `height < 1` or `weight < 1`) are redirected to profile setup on first login.
- **Doctors** access patient data exclusively through the secure-sync endpoint; direct patient API calls are not permitted from the doctor portal.

---

## Data Storage

Patient and user records are persisted to `data/omnicure-store.json`:

```json
{
  "users": [ { "id", "name", "email", "role", "password", "linkedPatientIds?" } ],
  "patients": [ { "id", "name", "age", "heightCm", "weightKg", "medications", "careMedications", "vitals", "devices", "history", "labReports", ... } ]
}
```

> **Note**: Passwords are stored in plain text in the JSON file. This is intentional for demo/prototype use. For production deployment, replace with a hashed credential store (e.g., bcrypt + a relational database).

---

## Audit Log

Every authentication event and data access is written to the in-memory audit store (`lib/omnicure/audit-store.ts`). Entries include:

| Field | Values |
|-------|--------|
| `role` | `patient` \| `doctor` \| `system` |
| `status` | `success` \| `warning` \| `critical` |
| `actorId` | User ID of the actor |
| `message` | Human-readable event description |
| `timestamp` | ISO 8601 string |

Audit logs reset on server restart (in-memory only). The last 50 entries per actor are surfaced in the portal UI.

---

## License

MIT

