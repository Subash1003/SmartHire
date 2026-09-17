# SmartHire — Phase 0: Architecture & Design

## 1. Tech Stack (final)

**Frontend:** React 18 + Vite, React Router v6, Axios, Tailwind CSS, Recharts, React Hook Form + Zod resolver, Lucide React, Vitest + React Testing Library.

**Backend:** Node.js + Express, MongoDB + Mongoose, JWT (`jsonwebtoken`), bcrypt, Helmet, CORS, express-rate-limit, Multer, `file-type` (magic-byte validation), pdf-parse, mammoth, Zod, Nodemailer, Jest + Supertest.

**AI:** Anthropic API (`@anthropic-ai/sdk`), Claude model, tool-use forced structured output for the screening schema.

**Storage:** Cloudinary (resumes, profile images).

**Deployment (Phase 16):** Vercel (frontend), Render/Railway (backend), MongoDB Atlas, Cloudinary.

### Resolved open decisions
- **Auth:** JWT access token (short-lived, ~15 min) in an httpOnly, Secure, SameSite=Strict/Lax cookie. Refresh token (long-lived, ~7d) also httpOnly cookie, opaque random token hashed and stored in a `refreshTokens` collection (rotation + revocation on logout/reuse-detection). CSRF protection via double-submit cookie pattern (a readable `csrfToken` cookie + `X-CSRF-Token` header checked on state-changing requests) since we're cookie-based rather than bearer-token-based.
- **Resume extraction:** `pdf-parse` for PDF, `mammoth` for DOCX, behind a single `resumeService.extractText()` abstraction.
- **AI provider:** Claude via Anthropic SDK, using a tool-use call with a strict JSON schema matching section 18, so the model is forced into structured output rather than free text we'd have to parse.
- **Validation:** Zod schemas in `server/validators/`, mirrored/reused by the frontend where the same shape applies (e.g. job create form).
- **Testing:** Jest + Supertest (backend), Vitest + RTL (frontend).
- **Notifications:** Polling via `GET /api/v1/notifications` (no WebSockets) — revisit later if needed.
- **Uploads:** Multer (memory storage) → magic-byte validation via `file-type` → Cloudinary upload from buffer.
- **File validation:** allow-list `application/pdf` and `application/vnd.openxmlformats-officedocument.wordprocessingml.document` only, 5MB max, verified against actual content, not just extension/MIME claimed by the client.
- **API versioning:** all routes under `/api/v1/`.
- **Rate limiting:** stricter limiters on `/api/v1/auth/login` and `/api/v1/ai/resume-screen` than the general API limiter.
- **Time:** interview `date`/`startTime`/`endTime` stored as UTC `Date` in MongoDB; client formats using the browser's locale/timezone (`Intl.DateTimeFormat`).

---

## 2. High-Level Architecture

```
┌─────────────────────┐        HTTPS/JSON        ┌──────────────────────────┐
│  React SPA (Vite)   │ ───────────────────────▶ │  Express API (/api/v1)   │
│  Tailwind, RHF+Zod   │ ◀─────────────────────── │  modular MVC + services  │
└─────────────────────┘     httpOnly cookies       └──────────┬───────────────┘
                                                                │
                          ┌─────────────────────────────────────┼───────────────────────┐
                          ▼                                     ▼                        ▼
                 ┌────────────────┐                  ┌──────────────────┐     ┌──────────────────┐
                 │   MongoDB       │                  │   Cloudinary      │     │  Anthropic API    │
                 │   (Atlas/local) │                  │   (resumes, imgs) │     │  (Claude, tool-use)│
                 └────────────────┘                  └──────────────────┘     └──────────────────┘
                                                                ▲
                                                       ┌──────────────────┐
                                                       │  SMTP (Nodemailer)│
                                                       └──────────────────┘
```

Backend is a modular monolith: `routes → controllers → services → models`, with cross-cutting `middleware` (auth, role/tenant checks, validation, rate limiting, error handling) and `validators` (Zod schemas). Controllers stay thin; business logic and third-party integration (email, AI, resume parsing, notifications) live in `services/` per the PRD's explicit instruction not to put email logic in controllers — the same rule is applied to AI and resume logic.

Every organization-scoped Mongoose model carries `organizationId`, and a single `tenantScope` middleware/helper injects `organizationId` from the authenticated user into every query — controllers never trust a client-supplied `organizationId`.

---

## 3. Database Design (MongoDB / Mongoose)

Design choice for candidate data: **separate `CandidateProfile` model**, referenced by `userId`, rather than embedding profile fields on `User`. Reasons:
- `User` stays uniform and lean across all four roles (auth/session concerns only); candidate-only fields (skills, experience, resume, portfolio links) would otherwise be sparse/unused on 75% of documents.
- Candidate profile grows over time (multiple experience/education/project entries, resume history) — better modeled as its own document than an ever-growing embedded subdocument on the auth record.
- Independent indexing on candidate search fields (skills, location) without bloating the `users` index footprint.
- Cleaner authorization: profile reads/writes go through a distinct service, separate from auth/session logic.

### 3.1 `organizations`
| Field | Type | Notes |
|---|---|---|
| name | String | required |
| logo | String | Cloudinary URL |
| description | String | |
| website | String | |
| industry | String | |
| location | String | |
| contactEmail | String | |
| createdAt/updatedAt | Date | timestamps |

### 3.2 `users`
| Field | Type | Notes |
|---|---|---|
| organizationId | ObjectId → organizations | indexed, required |
| name | String | required |
| email | String | unique **per organization** (compound unique index `{organizationId, email}`) — candidates are also org-scoped since they apply within one org's job board in this model (see §7 risk note) |
| passwordHash | String | bcrypt, never returned by default (`select: false`) |
| role | Enum: admin, recruiter, interviewer, candidate | indexed |
| profileImage | String | Cloudinary URL |
| isEmailVerified | Boolean | default false |
| isActive | Boolean | default true |
| createdAt/updatedAt | Date | timestamps |

### 3.3 `candidateProfiles`
| Field | Type |
|---|---|
| userId (→ users, unique) | phone, location |
| summary | skills: [String] |
| experience: [{title, company, startDate, endDate, description}] | |
| education: [{degree, institution, startDate, endDate}] | |
| projects: [{name, description, link}] | certifications: [String] |
| portfolio, github, linkedin | String |
| resume: {url, fileName, fileType, fileSize, uploadedAt} | |
| createdAt/updatedAt |

### 3.4 `jobs`
organizationId, createdBy (→users), title, department, description, responsibilities, requiredSkills: [String], preferredSkills: [String], education, experience, employmentType (enum), workMode (enum), location, salaryMin, salaryMax, deadline, status (enum: draft/published/closed/expired), timestamps.
Indexes: `{organizationId, status}`, text index on `{title, description, requiredSkills}` for search, `{location}`.

### 3.5 `applications`
organizationId, jobId, candidateId, resumeId (embedded resume snapshot or ref to profile resume), coverLetter, expectedSalary, availability, status (enum per §14), appliedAt, timestamps.
**Unique compound index `{jobId, candidateId}`** — enforces "no duplicate applications" at the database level, not just app logic.
Indexes: `{organizationId, status}`, `{organizationId, jobId}`, `{candidateId}`.

### 3.6 `interviews`
organizationId, applicationId, candidateId, jobId, interviewerId, type (enum), round, date, startTime, endTime (all UTC), meetingLink, notes, status (enum: scheduled/completed/cancelled/rescheduled), createdBy, timestamps.
Indexes: `{interviewerId, date}` (used for overlap-conflict queries), `{organizationId, status}`, `{candidateId}`.

### 3.7 `evaluations`
organizationId, interviewId (unique — one evaluation per interview, per interviewer), interviewerId, technicalSkills, problemSolving, communication, roleKnowledge, codingSkills (1–10 each), overallRating, recommendation (enum: select/hold/reject), feedback, timestamps.

### 3.8 `aiScreenings`
organizationId, applicationId (unique — latest screening per application, or keep history by dropping uniqueness; decision: unique, re-screening overwrites), jobId, candidateId, matchScore, matchedSkills: [String], missingSkills: [String], experienceMatch, educationMatch, summary, model, timestamps. No raw resume text stored here (PRD §46: avoid unnecessary sensitive data).

### 3.9 `notifications`
organizationId, recipientId, type (enum), title, message, relatedResource: {resourceType, resourceId}, isRead, createdAt.
Index: `{recipientId, isRead, createdAt}`.

### 3.10 `notes` (recruiter-private candidate notes)
organizationId, candidateId, authorId, jobId (optional, if note is application-specific), content, createdAt/updatedAt. Never exposed on candidate-facing endpoints.

### 3.11 `auditLogs`
organizationId, actorId, action, resourceType, resourceId, previousValue (Mixed), newValue (Mixed), createdAt.
Index: `{organizationId, createdAt}`, `{resourceType, resourceId}`.

### 3.12 `passwordResets`
userId, tokenHash, expiresAt, used (Boolean). TTL index on `expiresAt`.

### 3.13 `refreshTokens` (supports the JWT refresh flow)
userId, tokenHash, expiresAt, revokedAt, replacedByTokenHash, createdByIp. TTL index on `expiresAt`.

### 3.14 `emailVerificationTokens`
userId, tokenHash, expiresAt. TTL index.

---

## 4. API Structure (`/api/v1`)

```
/api/v1/health                          GET

/api/v1/auth
  POST   /register
  POST   /login              (strict rate limit)
  POST   /refresh
  POST   /logout
  GET    /me
  POST   /verify-email
  POST   /forgot-password
  POST   /reset-password

/api/v1/organizations
  GET    /me                 (current org)
  PUT    /me                 (admin only)

/api/v1/users                (admin: staff management)
  GET    /            list org users, filter by role
  POST   /            create recruiter/interviewer
  GET    /:id
  PUT    /:id
  PATCH  /:id/status  activate/deactivate
  DELETE /:id

/api/v1/candidates/profile   (candidate: own profile)
  GET    /
  PUT    /
  POST   /resume       (multipart upload)
  DELETE /resume

/api/v1/jobs
  GET    /             public list (published only, unauth OK) + recruiter view (all statuses, org-scoped, auth)
  GET    /:id           public detail
  POST   /              recruiter/admin
  PUT    /:id            recruiter/admin
  DELETE /:id            recruiter/admin
  PATCH  /:id/status     publish/close

/api/v1/applications
  POST   /               candidate applies
  GET    /               recruiter: org applications (filters/pagination); candidate: own applications
  GET    /:id
  PATCH  /:id/status     recruiter
  POST   /:id/notes      recruiter-private note
  GET    /:id/notes

/api/v1/interviews
  POST   /
  GET    /                filters: mine (interviewer), org (recruiter)
  GET    /:id
  PUT    /:id             reschedule
  PATCH  /:id/status      cancel/complete
  DELETE /:id

/api/v1/evaluations
  POST   /
  GET    /interview/:interviewId
  PUT    /:id

/api/v1/decisions
  POST   /applications/:id/decision   final hiring decision (recruiter/admin)

/api/v1/ai
  POST   /resume-screen         (strict rate limit)
  GET    /screenings/:applicationId

/api/v1/notifications
  GET    /
  PATCH  /:id/read
  PATCH  /read-all

/api/v1/analytics
  GET    /overview
  GET    /applications
  GET    /hiring-funnel
  GET    /interviews

/api/v1/audit-logs           (admin)
  GET    /
```

Response envelope follows PRD §38 exactly (`{success, message, data}` / `{success, message, error}`), implemented via a shared `sendResponse` util and a centralized error middleware so controllers never hand-roll error JSON.

Pagination follows PRD §51 (`?page&limit`, `pagination` block in response), default limit 20, hard max (e.g. 100), implemented as a shared `paginate()` helper used by list endpoints.

---

## 5. Backend Folder Structure

```
server/
  config/            db.js, env.js, cloudinary.js, cors.js
  controllers/        authController.js, userController.js, organizationController.js,
                       candidateProfileController.js, jobController.js, applicationController.js,
                       interviewController.js, evaluationController.js, decisionController.js,
                       aiController.js, notificationController.js, analyticsController.js,
                       auditLogController.js
  middleware/          authMiddleware.js, roleMiddleware.js, tenantMiddleware.js,
                       validateMiddleware.js (Zod), uploadMiddleware.js, rateLimiters.js,
                       csrfMiddleware.js, errorMiddleware.js, auditMiddleware.js
  models/              User.js, Organization.js, CandidateProfile.js, Job.js, Application.js,
                       Interview.js, Evaluation.js, AIScreening.js, Notification.js, Note.js,
                       AuditLog.js, PasswordReset.js, RefreshToken.js, EmailVerificationToken.js
  routes/              v1/ (auth.js, users.js, organizations.js, candidates.js, jobs.js,
                       applications.js, interviews.js, evaluations.js, decisions.js, ai.js,
                       notifications.js, analytics.js, auditLogs.js, index.js)
  services/            emailService.js, aiService.js, resumeService.js, notificationService.js,
                       auditService.js, storageService.js (Cloudinary wrapper)
  validators/          auth.schema.js, job.schema.js, application.schema.js, interview.schema.js,
                       evaluation.schema.js, candidateProfile.schema.js
  utils/               apiResponse.js, ApiError.js, asyncHandler.js, paginate.js, jwt.js,
                       tokens.js (random token gen/hash)
  jobs/                 (background/cron-style tasks, e.g. mark expired jobs) — added when needed
  tests/                 integration tests (Jest + Supertest), mirroring routes/
  seed/                  seed.js, seedData/ (orgs, jobs, candidates, etc.)
  app.js                 Express app assembly (middleware, routes)
  server.js              entrypoint (listen, DB connect)
  .env / .env.example
```

## 6. Frontend Folder Structure

```
client/
  src/
    api/              axios instance + per-resource API modules (authApi.js, jobsApi.js, ...)
    components/        ui/ (Button, Input, Modal, Table, Badge, Toast, Skeleton, EmptyState...),
                       layout/ (Sidebar, Topbar, DashboardLayout), shared feature components
    pages/              public/, candidate/, recruiter/, interviewer/, admin/  (matches PRD §36 routes)
    layouts/            PublicLayout, AuthLayout, DashboardLayout (role-aware)
    hooks/              useAuth, usePagination, useDebounce, useNotifications
    context/            AuthContext
    services/           (thin wrappers if needed beyond api/)
    utils/              formatters (dates in local TZ), constants
    validators/         Zod schemas shared in spirit with backend (job, application, evaluation forms)
    routes/              route config + ProtectedRoute/RoleRoute guards
    assets/
  index.html, vite.config.js, tailwind.config.js
  .env / .env.example
```

---

## 7. Key Architectural Decisions & Risks

1. **Candidates scoped per organization vs. global candidate accounts.** PRD models everything (including `users`) as organization-owned, and job applications are org-scoped. Decision: candidates register **per organization** (mirroring the PRD's `{organizationId, email}` uniqueness on `users`), i.e. a candidate applying to jobs at two different SmartHire tenant companies would have two separate accounts. This matches the literal PRD data model (§40, §5) and keeps tenant isolation absolute. Flagged here since a real-world job board (like LinkedIn) would want one global candidate identity — can revisit if you'd prefer that instead, but it's a bigger structural change, so proceeding with the PRD-literal design unless told otherwise.
2. **Interview conflict detection.** Overlap check done at the service layer: query `interviews` for the same `interviewerId` with status != cancelled where `startTime < newEnd && endTime > newStart`, backed by the `{interviewerId, date}` index.
3. **Duplicate applications.** Enforced both at the Mongoose schema level (compound unique index) and pre-validated in the controller for a clean error message — belt and suspenders, since a raw duplicate-key error is not user-friendly.
4. **AI screening idempotency.** One `aiScreenings` doc per application (unique index on `applicationId`); re-running screening upserts rather than accumulating history, keeping storage and the schema simple for a portfolio project.
5. **CSRF + httpOnly cookies.** Since JWTs live in httpOnly cookies (not readable by JS, good against XSS token theft), CSRF becomes the relevant risk for state-changing requests; mitigated with double-submit token checked by middleware on all non-GET `/api/v1` routes.
6. **AI failure handling (detailed in Phase 9).** `aiService` wraps the Anthropic call with timeout + try/catch; failure returns a clean `503`-style API error ("AI screening is temporarily unavailable") without blocking the rest of the application workflow — screening is always optional/supplementary, never blocking.

---

## 8. Phase Roadmap (per PRD §61)

| Phase | Scope |
|---|---|
| 0 | Analysis & architecture (this document) |
| 1 | Project foundation — Vite/React app, Express app, MongoDB connection, env config, health check, base UI system |
| 2 | Authentication & RBAC — register/login/logout, JWT+refresh+CSRF, password reset, protected routes |
| 3 | Organization & user management — org model, admin/recruiter/interviewer management, candidate profile foundation, tenant isolation |
| 4 | Job management — CRUD, publish/close, search/filter/pagination |
| 5 | Candidate application system — profile, resume upload, apply, duplicate prevention, dashboards |
| 6 | Recruitment pipeline — candidate table, Kanban, drag/drop status via API, notes |
| 7 | Interview management — scheduling, conflict detection, reschedule/cancel, interviewer dashboard |
| 8 | Interview evaluation — evaluation form, history, final hiring decision |
| 9 | AI resume screening — extraction, Claude integration, structured output, recruiter UI |
| 10 | Notifications & email — in-app polling, Nodemailer service |
| 11 | Analytics — KPI cards, charts from real data |
| 12 | Audit logging — model, service, admin page |
| 13 | UI polish & responsiveness |
| 14 | Testing & security review |
| 15 | Performance optimization |
| 16 | Deployment |

Each phase starts with an explanation of scope, affected files, architectural decisions, new dependencies, and test plan, followed by an explicit stop for approval — no phase is skipped or combined.

---

## 9. Reusable Components (planned, frontend)

`Button`, `Input`/`TextArea`/`Select` (RHF-bound), `Modal`, `DataTable` (sortable, paginated), `Badge` (status pill, color by status not color-only per a11y), `Toast`, `Skeleton`, `EmptyState`, `ErrorState`, `KanbanBoard`/`KanbanCard`, `KpiCard`, `ChartCard` wrapper around Recharts, `FileUpload`, `Pagination`, `SearchBar` (debounced), `RoleGuard`/`ProtectedRoute`.
