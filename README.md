# Intercity Bus Ticketing Platform - Authentication & Authorization Architecture

Production-grade, modular, security-focused authentication and multi-tenant organization-aware authorization system for a long-distance intercity bus ticketing platform.

---

## 🚌 System Architecture Overview

The system strictly decouples **identity**, **system roles**, **permissions**, and **organizational context**:

```
[ Frontend: React 19 + Axios ]
               │  HttpOnly Cookie + Bearer JWT
               ▼
[ Express API Gateway: /api/v1 ]
               │
    ┌──────────┴────────────────────────┐
    ▼                                   ▼
[ Security Middlewares ]     [ Centralized Error Handler ]
  - Helmet Security Headers    - Safe Production Output
  - CORS with Credentials      - Error Sanitization
  - Request Rate Limiting
    │
    ▼
[ Authentication Middleware: authenticate ]
    │  - Verifies short-lived access JWT
    │  - Loads roles, permissions, and organization context
    ▼
[ Authorization Middleware ]
    ├── authorizeRole('PLATFORM_ADMIN', ...)
    ├── authorizePermission('CREATE_TRIP', ...)
    └── authorizeOrganization(...) [Enforces organizational boundary]
    │
    ▼
[ Controller ] ──> [ Service ] ──> [ Repository ] ──> [ Prisma ORM ] ──> [ PostgreSQL ]
                         │
                         ├──> [ Crypto Utils: SHA-256 Token Hashing ]
                         ├──> [ Security Audit Logger: audit_logs ]
                         └──> [ Email Verification & Password Reset Dispatcher ]
```

---

## 👥 System Roles & Organizational Context

| System Role | Scope | Organization Context | Capabilities |
| :--- | :--- | :--- | :--- |
| **`PLATFORM_ADMIN`** | Platform-Wide | None (`null`) | Full administrative oversight, user governance, bus company onboarding, audit trails. |
| **`OPERATIONAL_MANAGER`** | Organization | Required (`organization_id`) | Scoped to assigned bus company or transport association. Fleet, schedule, and passenger management. |
| **`TICKET_VERIFIER`** | Organization | Required (`organization_id`) | Scoped to operational organization. Boarding pass scanning and validation at terminals. |
| **`PASSENGER`** | Public | None (`null`) | Default registration role. Intercity trip search, seat booking, digital tickets, profile management. |

> **Architectural Rule:** Role and organizational context are separate concepts. Operational managers and ticket verifiers work within the scope of their assigned company (`user_roles.organization_id`). The backend enforces that users cannot access resources outside their organization boundary.

---

## 🔒 Security Implementations

1. **Password Security:**
   - Hashed using `bcryptjs` with salt work factor 12.
   - Enforced password complexity: minimum 8 characters, at least 1 uppercase letter, 1 lowercase letter, and 1 digit.
   - Plaintext passwords and hashes are never logged.

2. **Access Tokens (JWT):**
   - Short-lived (default 15 minutes).
   - Minimal payload claims: `{ sub: userId, jti: uuid, type: "access" }`.
   - Stored in frontend memory (never written to `localStorage` or `sessionStorage`).

3. **Refresh Tokens & Rotation:**
   - Cryptographically secure random tokens (32 bytes).
   - Stored as **SHA-256 hashes** in `refresh_tokens` database table (never raw).
   - Delivered to client exclusively via `HttpOnly`, `SameSite=Lax`, `Path=/api/v1/auth` cookie.
   - **Token Rotation:** Each refresh issues a new refresh token and invalidates the previous one (`replaced_by_token_id`).
   - **Reuse Detection:** If a previously revoked token is presented, the system detects potential token theft, invalidates the entire session family for that user, logs a `REFRESH_TOKEN_REUSED` audit log, and requires re-login.

4. **Brute-Force & Lockout Protection:**
   - Express rate limiters applied to `/login`, `/register`, `/forgot-password`, `/reset-password`.
   - In-database failed attempt counter (`failed_login_attempts`).
   - After 5 consecutive failed attempts, the account is temporarily locked for 15 minutes (`locked_until`).

5. **Anti-Account Enumeration:**
   - Forgot-password and resend-verification endpoints return generic confirmations regardless of whether the email exists.
   - Login endpoint returns generic `"Invalid email or password."`.

6. **Single-Use Verification & Reset Tokens:**
   - Email verification tokens expire in 24 hours.
   - Password reset tokens expire in 1 hour.
   - Stored as SHA-256 hashes with `used_at` single-use tracking.
   - Password reset invalidates all existing user refresh tokens.

7. **Security Audit Logging:**
   - Important security events recorded to `audit_logs` table: `REGISTER`, `LOGIN_SUCCESS`, `LOGIN_FAILED`, `LOGOUT`, `PASSWORD_CHANGED`, `PASSWORD_RESET`, `EMAIL_VERIFIED`, `REFRESH_TOKEN_REUSED`, `ACCOUNT_LOCKED`.
   - Passwords and raw tokens are stripped from log payloads.

---

## 📁 Project Structure

```
├── backend/
│   ├── Config/
│   │   ├── db.js                     # Prisma client connection & lifecycle
│   │   └── env.js                    # Validated environment variables
│   ├── middleware/
│   │   ├── authenticate.middleware.js # Bearer JWT verification & context loader
│   │   ├── authorize.middleware.js    # Role and Permission authorization
│   │   ├── organization.middleware.js # Organization boundary enforcement
│   │   ├── rateLimit.middleware.js    # Express rate limiters
│   │   ├── validate.middleware.js     # Zod request validation
│   │   └── error.middleware.js        # Centralized error handler
│   ├── modules/
│   │   ├── auth/
│   │   │   ├── auth.controller.js     # HTTP request & cookie handling
│   │   │   ├── auth.service.js        # Business logic & authentication workflows
│   │   │   ├── auth.repository.js     # Prisma database access layer
│   │   │   ├── auth.route.js          # Auth route declarations
│   │   │   ├── auth.validation.js     # Zod schemas
│   │   │   └── auth.utils.js          # HttpOnly cookie helpers
│   │   └── users/
│   │       └── user.repository.js     # User entity repository
│   ├── prisma/
│   │   ├── migrations/                # Database migrations
│   │   ├── schema.prisma              # Database schema
│   │   └── seed.js                    # Seeding roles, permissions, organizations
│   ├── utils/
│   │   ├── apiError.js                # Custom ApiError class
│   │   ├── asyncHandler.js            # Async route wrapper
│   │   ├── auditLogger.js             # Security audit logger
│   │   ├── crypto.js                  # SHA-256 & random token generator
│   │   ├── email.js                   # Email verification & reset dispatcher
│   │   ├── jwt.js                     # Access token generation and verification
│   │   └── password.js                # Bcrypt hashing & complexity checks
│   ├── tests/
│   │   └── auth.test.js               # Automated authentication test suite
│   ├── app.js                         # Express application configuration
│   └── server.js                      # Server boot and graceful shutdown
│
├── frontend/
│   ├── src/
│   │   ├── components/
│   │   │   └── Navbar.jsx             # Role-aware navigation header
│   │   ├── context/
│   │   │   └── AuthContext.jsx        # Centralized React auth state & helpers
│   │   ├── features/
│   │   │   └── auth/
│   │   │       ├── auth.api.js        # Auth API client
│   │   │       └── pages/             # Login, Register, Forgot, Reset, Profile, etc.
│   │   ├── routes/
│   │   │   ├── AppRoutes.jsx          # Route declarations
│   │   │   ├── ProtectedRoute.jsx     # Authentication guard
│   │   │   └── RoleRoute.jsx          # Role-based route guard
│   │   └── services/
│   │       └── api.js                 # Axios instance with refresh retry queue
│   └── index.html
```

---

## 📡 API Reference

### Base URL: `/api/v1`

| Method | Endpoint | Access | Description |
| :--- | :--- | :--- | :--- |
| `POST` | `/auth/register` | Public | Register a new passenger account |
| `POST` | `/auth/login` | Public | Authenticate user, receive JWT & set HttpOnly refresh cookie |
| `POST` | `/auth/refresh` | Public (Cookie) | Rotate refresh token and receive new access token |
| `POST` | `/auth/logout` | Optional Auth | Invalidate refresh token and clear cookie |
| `GET` | `/auth/me` | Authenticated | Retrieve current user profile, roles, permissions, and org context |
| `POST` | `/auth/verify-email` | Public | Verify email address with raw token |
| `POST` | `/auth/resend-verification` | Public | Resend email verification link |
| `POST` | `/auth/forgot-password` | Public | Request password reset email |
| `POST` | `/auth/reset-password` | Public | Set new password with reset token |
| `POST` | `/auth/change-password` | Authenticated | Change password (requires current password) |
| `GET` | `/health` | Public | Service health check |

### Passenger Endpoints (`/api/v1/passenger`)

| Method | Endpoint | Access | Description |
| :--- | :--- | :--- | :--- |
| `GET` | `/passenger/trips` | `PASSENGER` | Search trips with origin, destination, travel date, operator, pagination & sorting |
| `GET` | `/passenger/trips/:tripId` | `PASSENGER` | View trip details, operator, bus, route, and seat inventory |
| `GET` | `/passenger/trips/:tripId/seats` | `PASSENGER` | Get real-time seat availability map for a trip |
| `POST` | `/passenger/bookings` | `PASSENGER` | Atomically book/reserve a seat (prevents double booking) |
| `GET` | `/passenger/bookings` | `PASSENGER` | Retrieve passenger's personal bookings list |
| `GET` | `/passenger/bookings/:id` | `PASSENGER` | View personal booking details (strict ownership isolation) |
| `POST` | `/passenger/payments/initialize` | `PASSENGER` | Initialize payment session (Chapa, Telebirr, CBE) |
| `POST` | `/passenger/payments/verify` | `PASSENGER` | Verify payment and automatically issue digital ticket |
| `GET` | `/passenger/payments/booking/:bookingId` | `PASSENGER` | Check payment status for booking |
| `GET` | `/passenger/tickets` | `PASSENGER` | View passenger's digital boarding passes |
| `GET` | `/passenger/tickets/:id` | `PASSENGER` | Retrieve digital ticket with cryptographic QR verification token |
| `POST` | `/passenger/feedback` | `PASSENGER` | Submit rating & review for completed trip |
| `GET` | `/passenger/feedback` | `PASSENGER` | View personal feedback history |

### Ticket Verifier Endpoints (`/api/v1/verifier`)

| Method | Endpoint | Access | Description |
| :--- | :--- | :--- | :--- |
| `GET` | `/verifier/trips` | `TICKET_VERIFIER` | List assigned operator trips with verification progress summary |
| `GET` | `/verifier/trips/:tripId` | `TICKET_VERIFIER` | View passenger manifest for assigned trip |
| `POST` | `/verifier/tickets/verify` | `TICKET_VERIFIER` | Atomically verify QR boarding pass (`VALID`, `ALREADY_USED`, `INVALID`, `CANCELLED`, `WRONG_TRIP`) |
| `GET` | `/verifier/history` | `TICKET_VERIFIER` | View recent audit log records of scans |

---

## 🚀 Getting Started

### 1. Backend Setup

```bash
cd backend
npm install

# Copy and configure environment variables
cp .env.example .env

# Generate Prisma Client
npx prisma generate

# Seed initial roles, permissions, organizations, and admin account
npm run seed

# Run automated tests
npm test

# Start development server
npm run dev
```

### 2. Frontend Setup

```bash
cd frontend
npm install

# Start Vite development server
npm run dev

# Build for production
npm run build
```

---

## 🧪 Automated Testing

Run the test suite from the `backend` directory:

```bash
npm test
```

Verifies:
- Password hashing & complexity validation
- Access token generation & minimal claim verification
- Cryptographic SHA-256 token hashing
- Zod schema validation & privilege escalation prevention
- Role-based authorization & Platform Admin bypass
- Permission-based authorization
- Organization boundary enforcement & cross-company IDOR prevention