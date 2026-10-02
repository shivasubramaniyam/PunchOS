# QR Attendance System — Project Documentation

Comprehensive technical documentation, architecture overview, folder structure, data models, API reference, and setup guide.

---

## 1. Project Overview

The **QR Attendance System** is an institutional attendance management platform designed for universities, colleges, and schools. It eliminates traditional pen-and-paper roll calls, manual data entry errors, and proxy attendance (buddy punching).

### Core Highlights

- **Anti-Proxy Protection:** Mitigates proxy attendance using two layers of defense:
  1. **Rotating QR Codes:** 45-second cryptographically signed sliding window tokens.
  2. **Hardware-Bound Biometric Punch:** 3-second slot ECDSA P-256 signatures generated inside the device's Secure Enclave / TEE via WebAuthn Passkeys.
- **Local Network Auto-Binding:** Automatically binds to the host's Local Area Network (LAN) IPv4 address via UDP socket probing, allowing students to access the portal on college Wi-Fi without cloud dependencies.
- **Real-Time Data Streaming:** Built-in Server-Sent Events (SSE) stream attendance scans directly to the faculty dashboard with instant live updates and one-click undo.
- **Dual Architecture:**
  - **Classical Web Interface:** Clean Express-rendered mobile and faculty views (`/faculty_view`, `/add_manually`).
  - **Modern Full-Stack Ecosystem:** Next.js analytics dashboard, React 19, TypeScript, Tailwind CSS, Recharts, and mobile-first biometric PWA.

---

## 2. System Architecture

```
                                  +---------------------------------------+
                                  |         Student Devices (Mobile)      |
                                  |  - Mobile Web Browser (QR Scan)       |
                                  |  - Punch PWA (Biometric Passkey)      |
                                  +-------------------+-------------------+
                                                      |
                                                      | Local Wi-Fi / LAN (HTTP / JSON / JWS)
                                                      v
+-----------------------------------------------------+---------------------------------------------------+
|                            TypeScript Express Backend Server (Port 8000)                                |
|                                                                                                         |
|  +---------------------------+  +---------------------------+  +-------------------------------------+  |
|  | Classical Web Views       |  | REST & SSE Engine (/api/*)|  | Punch Protocol Engine (/api/punch/*)|  |
|  | - /faculty_view & QR      |  | - Student & Attendance API|  | - WebAuthn Ceremonies (FIDO2)       |  |
|  | - /add_manually Check-in  |  | - 45s Rotating QR Tokens  |  | - ES256 Signature Verification      |  |
|  | - Confirmation Screens    |  | - Live SSE Event Stream   |  | - Slot & Nonce Replay Guards        |  |
|  +---------------------------+  +---------------------------+  +-------------------------------------+  |
|                                              |                                                          |
+----------------------------------------------+----------------------------------------------------------+
                                               |
                   +---------------------------+---------------------------+
                   |                                                       |
                   v                                                       v
+--------------------------------------+               +--------------------------------------+
|        Prisma SQLite / PostgreSQL    |               |    Faculty Analytics Dashboard       |
| - Student, Branch, Year, Section     |               |    (Next.js 16 / Port 3000)          |
| - Attendance Records (Unique per day)|               | - Live Real-Time Feed via SSE        |
| - PunchKeys & Passkey Credentials    |               | - Dynamic 45s QR Projector           |
| - Audit PunchEvents & Sessions       |               | - Student Manager & Analytics Charts |
+--------------------------------------+               +--------------------------------------+
```

---

## 3. Directory & File Structure

```
QR-Attendance-System/
├── package.json                       # Root workspace scripts (dev, build, seed)
├── README.md                          # Quickstart guide & repository documentation
├── DOCUMENTATION.md                   # Complete architectural & technical documentation
│
├── server/                            # Core TypeScript Backend (Express + Prisma)
│   ├── prisma/
│   │   └── schema.prisma              # Relational schema (Student, Attendance, PunchKey, etc.)
│   ├── src/
│   │   ├── index.ts                   # Express server entry point & middleware
│   │   ├── db.ts                      # Prisma client singleton
│   │   ├── seed.ts                    # Database seeder (Branches, Years, Sections, Students)
│   │   ├── routes/
│   │   │   ├── students.ts            # Student CRUD endpoints
│   │   │   ├── attendance.ts          # Attendance mark/undo & analytics stats
│   │   │   ├── qr.ts                  # Rotating QR code generator
│   │   │   ├── punch.ts               # Hardware biometric ES256 & WebAuthn engine
│   │   │   └── views.ts               # Classical mobile & faculty web views
│   │   └── services/
│   │       ├── qr.ts                  # QR signing, token rotation & IP detection
│   │       └── events.ts              # Server-Sent Events (SSE) live broadcast
│   ├── package.json
│   └── tsconfig.json
│
├── protocol/                          # Punch Cryptographic Protocol SDK
│   ├── src/
│   │   ├── core.ts                    # Slot math, payload validation, types
│   │   ├── node.ts                    # Node.js ES256 signing & verification
│   │   ├── web.ts                     # WebCrypto ES256 signing & verification
│   │   └── merkle.ts                  # Merkle tree batch verification
│   ├── tests/                         # Protocol test suite (Vitest)
│   └── package.json
│
├── dashboard/                         # Faculty Analytics Dashboard (Next.js)
│   ├── src/                           # Analytics UI, SSE listener, live projector
│   └── package.json
│
└── punch-pwa/                         # Student Biometric Punch PWA (Next.js)
    ├── src/                           # Mobile passkey registration & punch screen
    └── package.json
├── dashboard/                         # Modern Next.js 16 Faculty Dashboard
│   ├── package.json                   # Dependencies: Next.js 16, React 19, Recharts, Tailwind CSS 4
│   ├── next.config.ts                 # Next.js compiler configuration
│   ├── tsconfig.json                  # TypeScript compiler settings
│   └── src/
│       ├── app/
│       │   ├── layout.tsx             # Root layout and theme wrapper
│       │   ├── page.tsx               # Main dashboard page layout
│       │   └── globals.css            # Tailwind CSS styling
│       ├── components/
│       │   ├── StatCards.tsx          # Real-time KPI statistics cards
│       │   ├── Charts.tsx             # Year-wise & branch-wise attendance bar/pie charts
│       │   ├── LiveFeed.tsx           # Live SSE attendance feed with instant undo
│       │   ├── QrPanel.tsx            # Animated 45-second rotating QR token display
│       │   └── StudentManager.tsx     # Student database search, filter, and CRUD modal
│       └── lib/
│           ├── api.ts                 # Typed fetch client communicating with TypeScript API
│           └── types.ts               # TypeScript data definitions
│
├── punch-pwa/                         # Student Progressive Web App (PWA)
│   ├── package.json                   # PWA dependencies
│   ├── next.config.ts                 # PWA build configuration
│   └── src/
│       ├── app/                       # Application routes & layouts
│       ├── components/
│       │   ├── EnrollFlow.tsx         # Passkey registration & WebCrypto key generation
│       │   └── PunchScreen.tsx        # Dynamic 3-second animated QR punch generator
│       └── lib/
│           ├── client.ts              # API client for WebAuthn & punch endpoints
│           └── storage.ts             # IndexedDB / local storage key store
│
└── protocol/                          # Shared Isomorphic TypeScript Protocol Library
    ├── package.json                   # Library package (@punch/protocol)
    ├── tsconfig.json                  # TypeScript build configuration
    └── src/
        ├── core.ts                    # Time-slot math, constants, core types
        ├── merkle.ts                  # RFC 6962 Merkle tree transparency log & audit proofs
        ├── web.ts                     # WebCrypto non-extractable P-256 key generator
        └── node.ts                    # Node.js server verification utilities
```

---

## 4. Database Schema & Data Models

### Academic & Attendance Models (`FacultyView/models.py`)

1. **`Branch`**
   - `branch`: Name of the branch (`CharField(max_length=10)`, e.g., "CSE", "ECE", "ME").
2. **`Year`**
   - `year`: Integer year level (`IntegerField`, bounded between 1 and 4).
3. **`Section`**
   - `section`: Section identifier (`CharField(max_length=2)`, e.g., "A", "B").
4. **`Student`**
   - `s_roll`: Unique Roll Number / USN (`CharField(max_length=20, primary_key=True)`).
   - `s_fname`: Student first name (`CharField(max_length=20)`).
   - `s_lname`: Student last name (`CharField(max_length=20)`).
   - `s_branch`: Foreign key $\rightarrow$ `Branch`.
   - `s_section`: Foreign key $\rightarrow$ `Section`.
   - `s_year`: Foreign key $\rightarrow$ `Year`.
5. **`Attendance`**
   - `student`: Foreign key $\rightarrow$ `Student`.
   - `date`: Date of attendance (`DateField(db_index=True)`).
   - `marked_at`: Timestamp of attendance (`DateTimeField(auto_now_add=True)`).
   - `method`: Attendance method (`qr` or `manual`).
   - **Database Constraint:** `UniqueConstraint(fields=['student', 'date'])` ensures a student cannot have more than one attendance record per day.

---

### Cryptographic Punch Models (`punch/models.py`)

1. **`PunchKey`**
   - `student`: Foreign key $\rightarrow$ `Student`.
   - `key_id`: SHA-256 fingerprint of the public SPKI (`CharField(max_length=64, unique=True)`).
   - `public_jwk`: EC P-256 public key stored as JSON (`JSONField`).
   - `hardware_backed`: Boolean indicating if key resides in TEE / Secure Enclave.
   - `trust_tier`: Integrity tier rating (0 to 3).
   - `revoked_at`: Timestamp if revoked (`DateTimeField(null=True)`).
2. **`PasskeyCredential`**
   - `student`: Foreign key $\rightarrow$ `Student`.
   - `credential_id`: Base64URL-encoded WebAuthn credential ID (`CharField(max_length=128, unique=True)`).
   - `public_jwk`: Passkey public key from attestation object (`JSONField`).
   - `sign_count`: WebAuthn signature counter to detect cloned authenticators (`BigIntegerField`).
3. **`PunchSession`**
   - `branch`, `year`, `section`: Class scope filters.
   - `opened_at`, `closed_at`: Active session timeframe.
4. **`PunchEvent`**
   - `student`, `key`, `session`: Foreign references.
   - `slot`: Unix epoch slot index (`BigIntegerField`).
   - `nonce`: Unique single-use UUID (`CharField(max_length=24)`).
   - `outcome`: Audit status (`ok`, `duplicate`, `replay`, `stale`).

---

## 5. Security & Verification Mechanics

```
+-----------------------------------------------------------------------------------------+
|                                    SECURITY MECHANISMS                                  |
+============================+=============================+==============================+
| Attack Vector              | Defense Mechanism           | Implementation Detail        |
+----------------------------+-----------------------------+------------------------------+
| QR Screenshot Sharing      | 45s / 3s Sliding Windows    | Cryptographic timestamp slot |
| Buddy Punching             | Hardware Biometrics         | FIDO2 WebAuthn Passkeys      |
| Replay Attacks             | Nonce Tracking Cache        | Single-use UUID in Django DB |
| Key Extraction / Export    | Non-Extractable CryptoKey   | WebCrypto SubtleCrypto API   |
| Historical Tampering       | Merkle Transparency Log     | RFC 6962 Daily Hash Tree     |
+----------------------------+-----------------------------+------------------------------+
```

### Rotating QR Slot Math

$$\text{Slot Number} = \left\lfloor \frac{\text{Current Unix Timestamp}}{\text{Slot Duration in Seconds}} \right\rfloor$$

- **Rotating QR (Dashboard):** 45-second duration with 1-slot backward tolerance for clock drift.
- **Punch PWA Dynamic QR:** 3-second duration with 1-slot backward tolerance.

---

## 6. API Reference

### Core & Dashboard API (`/api/`)

| Method | Endpoint                    | Description                                  | Query / Body Parameters |
| ------ | --------------------------- | -------------------------------------------- | ----------------------- |
| `GET`  | `/api/students`             | List students with optional filters          | `?branch=CSE&year=3&section=A` |
| `POST` | `/api/students/create`      | Add a new student record                     | `{ "roll", "firstName", "lastName", "branch", "year", "section" }` |
| `POST` | `/api/students/delete`      | Remove a student record                      | `{ "roll": "1JT21CS001" }` |
| `GET`  | `/api/attendance`           | Query attendance for a specific date         | `?date=YYYY-MM-DD` |
| `GET`  | `/api/attendance/student/:roll` | Case-insensitive attendance stats & history for student | Params: `:roll` |
| `POST` | `/api/attendance/mark`      | Mark student attendance                      | `{ "roll": "...", "method": "qr" \| "manual", "token": "..." }` |
| `POST` | `/api/attendance/undo`      | Undo an attendance entry                     | `{ "id": 42 }` |
| `GET`  | `/api/stats`                | Get daily aggregate attendance statistics    | `?date=YYYY-MM-DD` |
| `GET`  | `/api/qr/current`           | Fetch active rotating QR code and image      | Returns token and base64 PNG data-URL |
| `GET`  | `/api/events`               | Server-Sent Events (SSE) live feed           | Returns `text/event-stream` for live PWA & Dashboard updates |

### Punch Protocol API (`/api/punch/`)

| Method | Endpoint                    | Description                                          |
| ------ | --------------------------- | ---------------------------------------------------- |
| `POST` | `/api/punch/enroll`         | Request challenge for hardware key registration      |
| `POST` | `/api/punch/enroll/finish`  | Submit and store public ECDSA JWK key                |
| `GET`  | `/api/punch/key-status`     | Check device enrollment status for a roll number     |
| `POST` | `/api/punch/passkey/init`   | Request WebAuthn credential creation options         |
| `POST` | `/api/punch/passkey/done`   | Submit attestation response and finish passkey setup |
| `POST` | `/api/punch/passkey/auth`   | Request WebAuthn assertion challenge for punching    |
| `POST` | `/api/punch/passkey/check`  | Verify assertion signature and unlock slot signing   |
| `POST` | `/api/punch/verify`         | Verify scanned `punch.v1` JWS QR code                |
| `GET`  | `/api/punch/merkle-root`    | Get current daily RFC 6962 Merkle tree root hash     |
| `GET`  | `/api/punch/receipt/:roll`  | Get cryptographic zero-knowledge inclusion proof for student |

---

## 7. Setup & Execution Instructions

### Prerequisites

- **Python 3.10+**
- **Node.js 18+ & npm**
- Host and client devices connected to the **same Local Wi-Fi Network / LAN**.

---

### Step 1: Start Django Backend (Port 8000)

```bash
# 1. Navigate to project root
cd QR-Attendance-System

# 2. Install dependencies
pip install -r requirements.txt

# 3. Apply migrations
python manage.py migrate

# 4. Run server on all interfaces
python manage.py runserver 0.0.0.0:8000
```

> **LAN Host Auto-Discovery:** Django automatically determines your computer's LAN IP (e.g. `192.168.1.50`) and adds it to `ALLOWED_HOSTS`.

---

### Step 2: Start Modern Analytics Dashboard (Port 3000)

```bash
# Open a new terminal
cd QR-Attendance-System/dashboard

# Install frontend packages
npm install

# Start Next.js development server
npm run dev
```

Open **`http://localhost:3000`** in your browser.

---

### Step 3: Start Student Punch PWA (Port 3001)

```bash
# Open a new terminal
cd QR-Attendance-System/punch-pwa

# Install packages
npm install

# Start PWA server on port 3001
npm run dev -- -p 3001
```

Open **`http://localhost:3001`** (or `http://<YOUR_LAN_IP>:3001` on mobile).

---

### Step 4: Configure Windows Firewall (For Local Network Access)

To ensure student phones can reach your server:

1. Press `Win + S` and search for **Windows Defender Firewall with Advanced Security**.
2. Go to **Inbound Rules** $\rightarrow$ Click **New Rule...**
3. Choose **Port** $\rightarrow$ **TCP** $\rightarrow$ Enter ports: `8000, 3000, 3001`.
4. Choose **Allow the connection** $\rightarrow$ Apply to **Domain, Private, and Public**.
5. Name the rule `QR Attendance System` and click **Finish**.
