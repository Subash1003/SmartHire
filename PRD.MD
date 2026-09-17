# SMART RECRUITMENT & INTERVIEW MANAGEMENT PLATFORM
## Product Requirements Document (PRD)

Version: 1.0
Status: Development Specification
Project Type: Full-Stack SaaS Web Application
Primary Stack: MERN
AI: AI-assisted resume screening
Target: Production-quality portfolio project

---

# 1. PROJECT OVERVIEW

## 1.1 Product Name

SmartHire

The name is provisional and can be changed later.

## 1.2 Product Description

SmartHire is a multi-tenant recruitment and interview management platform designed for small and medium-sized companies.

The platform allows organizations to:

- Create and manage job postings
- Receive candidate applications
- Manage candidate profiles
- Upload and review resumes
- Use AI-assisted resume-to-job matching
- Manage the recruitment pipeline
- Schedule interviews
- Assign interviewers
- Collect interview evaluations
- Make final hiring decisions
- Send notifications
- View recruitment analytics
- Maintain audit logs

The platform must feel like a real SaaS product rather than a basic CRUD college project.

---

# 2. PRIMARY OBJECTIVE

The primary objective is to build a complete full-stack application that demonstrates strong practical software-development skills.

The application must demonstrate:

- React development
- REST API development
- Node.js/Express
- MongoDB
- Authentication
- Authorization
- Multi-tenancy
- Role-based access control
- File uploads
- AI API integration
- Data processing
- Search and filtering
- Pagination
- Interview scheduling
- Analytics
- Notifications
- Security
- Testing
- Deployment

---

# 3. IMPORTANT DEVELOPMENT RULES

These rules are mandatory.

## 3.1 Phase-by-phase development

DO NOT implement the entire application in one step.

Development must happen in phases.

Before starting every phase:

1. Explain what will be implemented.
2. List the files/components expected to change.
3. Explain any architectural decisions.
4. Explain dependencies that will be installed.
5. Explain how the phase will be tested.
6. STOP.
7. Ask the user for explicit permission to start the phase.

Example:

"Phase 1 analysis is complete. I am ready to implement Phase 1. May I proceed?"

Do not begin implementation until the user explicitly approves.

---

## 3.2 No uncontrolled changes

Do not make unrelated changes outside the current phase.

Do not refactor unrelated code unless it is necessary for the current phase.

Do not remove existing functionality without approval.

Do not introduce unnecessary libraries.

---

## 3.3 Analyze before modifying

Before making changes:

- Inspect the existing project structure.
- Understand the current architecture.
- Identify existing dependencies.
- Identify reusable components.
- Identify conflicts.
- Explain findings.

Do not immediately start coding.

---

## 3.4 Preserve working functionality

Whenever modifying an existing feature:

- Do not break unrelated functionality.
- Test the affected feature.
- Check for regressions.

---

## 3.5 Secrets

Never hardcode:

- API keys
- Database passwords
- JWT secrets
- Email credentials
- Cloudinary credentials
- AI API keys

Use environment variables.

Maintain:

`.env`

and:

`.env.example`

---

# 4. PRODUCT USERS

The system has four roles.

## 4.1 Admin

Organization administrator.

Responsibilities:

- Manage organization
- Manage users
- Manage recruiters
- Manage interviewers
- Manage jobs
- View candidates
- View applications
- View analytics
- View audit logs
- Configure organization settings

---

## 4.2 Recruiter

Responsibilities:

- Create jobs
- Edit jobs
- Publish jobs
- Close jobs
- Review candidates
- Review applications
- Run AI resume screening
- Shortlist candidates
- Schedule interviews
- Assign interviewers
- Review interview evaluations
- Add private candidate notes
- Move candidates through hiring stages
- Make final hiring decisions

---

## 4.3 Interviewer

Responsibilities:

- View assigned interviews
- View candidate profile
- View candidate resume
- View job information
- Submit interview evaluation
- Add feedback
- Recommend Select / Hold / Reject

Interviewers must only access interviews assigned to them.

---

## 4.4 Candidate

Responsibilities:

- Register
- Login
- Create profile
- Upload resume
- Search jobs
- View job details
- Apply for jobs
- Track applications
- View interview schedules
- Receive notifications
- Update profile

---

# 5. MULTI-TENANT ARCHITECTURE

The application must support multiple organizations.

Example:

Organization A:

- Users
- Jobs
- Candidates
- Applications
- Interviews

Organization B:

- Users
- Jobs
- Candidates
- Applications
- Interviews

Organization A must never be able to access Organization B's private data.

Every organization-owned resource must contain:

`organizationId`

Backend authorization must verify organization ownership on every protected resource.

Never rely only on frontend route protection.

---

# 6. AUTHENTICATION

Implement secure authentication.

## Candidate authentication

- Register
- Login
- Logout
- Email verification
- Forgot password
- Reset password

## Staff authentication

- Login
- Logout
- Forgot password
- Reset password

## Security

Use:

- bcrypt password hashing
- JWT authentication
- Secure cookies where appropriate
- Authentication middleware
- Role-based authorization middleware
- Input validation
- Rate limiting
- Helmet
- CORS configuration

---

# 7. ROLE-BASED ACCESS CONTROL

Permissions must be enforced on the backend.

## Admin

Full organization access.

## Recruiter

Access recruitment-related organization resources.

## Interviewer

Only:

- Assigned interviews
- Relevant candidate information
- Relevant job information
- Own evaluations

## Candidate

Only:

- Own profile
- Own applications
- Own interviews
- Own notifications

A candidate must never access another candidate's information.

---

# 8. RECRUITMENT PIPELINE

The standard application lifecycle is:

Applied
↓
Under Review
↓
Shortlisted
↓
Interview Scheduled
↓
Interview Completed
↓
Evaluation
↓
Selected / Rejected / On Hold

The recruiter can update the application status.

All important status changes should be recorded in the audit log.

---

# 9. JOB MANAGEMENT

Recruiters can create jobs.

## Job fields

- Title
- Department
- Description
- Responsibilities
- Required skills
- Preferred skills
- Education
- Experience
- Employment type
- Work mode
- Location
- Salary minimum
- Salary maximum
- Application deadline
- Status
- Created date
- Updated date

## Employment types

- Full-time
- Part-time
- Internship
- Contract

## Work modes

- Remote
- Hybrid
- On-site

## Job status

- Draft
- Published
- Closed
- Expired

---

# 10. PUBLIC JOB LISTING

Candidates and visitors can view published jobs.

Job listing should support:

- Search
- Skill filtering
- Location filtering
- Employment type
- Work mode
- Experience
- Sorting
- Pagination

Visitors should be able to view job details without authentication.

Authentication is required to apply.

---

# 11. CANDIDATE PROFILE

Candidate profile must support:

## Personal information

- Full name
- Email
- Phone
- Location
- Profile picture

## Professional information

- Professional summary
- Skills
- Experience
- Education
- Projects
- Certifications
- Portfolio
- GitHub
- LinkedIn

## Resume

Candidate can upload a resume.

Supported formats:

- PDF
- DOCX

File size must be validated.

---

# 12. RESUME STORAGE

Resumes should not be stored directly in MongoDB unless there is a strong technical reason.

Preferred:

Cloudinary or S3-compatible storage.

Database stores:

- File URL
- File name
- File type
- File size
- Uploaded date

Resume access must be authorized.

---

# 13. APPLICATION SYSTEM

Candidate can apply for a published job.

Application fields:

- Candidate ID
- Job ID
- Organization ID
- Resume ID
- Cover letter
- Expected salary
- Availability
- Application date
- Current status

Business rule:

A candidate cannot apply to the same job more than once.

---

# 14. APPLICATION STATUS

Allowed statuses:

- Applied
- Under Review
- Shortlisted
- Interview Scheduled
- Interview Completed
- Selected
- Rejected
- On Hold

Status changes should be persisted immediately.

Important status changes should generate audit logs.

---

# 15. RECRUITER APPLICATION MANAGEMENT

Recruiters need:

- Application table
- Search
- Filters
- Sorting
- Pagination
- Candidate details
- Resume access
- Status management
- AI screening
- Notes
- Interview history
- Evaluation history

Filters:

- Job
- Department
- Status
- Skills
- Experience
- Location
- AI match score
- Application date

---

# 16. CANDIDATE PIPELINE

Implement a Kanban-style recruitment pipeline.

Columns:

Applied
Under Review
Shortlisted
Interview
Selected
Rejected
On Hold

Candidate cards should display:

- Candidate name
- Job
- Experience
- Skills
- AI match score
- Application date
- Current status

Recruiters may drag candidates between valid stages.

Every status change must call the backend API.

Do not implement frontend-only status changes.

---

# 17. AI-ASSISTED RESUME SCREENING

This is the primary AI feature.

The AI must assist the recruiter.

It must NOT make the final hiring decision.

## Input

- Job description
- Required skills
- Preferred skills
- Candidate resume text

## Processing

Resume:

→ Extract text

→ Identify candidate skills

→ Identify experience

→ Identify education

→ Compare with job requirements

→ Generate structured analysis

---

# 18. AI SCREENING OUTPUT

AI should return structured information.

Example:

{
  "matchScore": 82,
  "matchedSkills": [
    "React",
    "JavaScript",
    "REST APIs",
    "MongoDB"
  ],
  "missingSkills": [
    "Docker",
    "AWS"
  ],
  "experienceMatch": 85,
  "educationMatch": 80,
  "summary": "..."
}

The exact schema can be refined during implementation.

---

# 19. AI RULES

AI must not:

- Automatically reject candidates
- Automatically select candidates
- Infer protected characteristics
- Use gender as a hiring criterion
- Use religion as a hiring criterion
- Use race/ethnicity as a hiring criterion
- Infer health conditions
- Make final hiring decisions

The UI must clearly identify the feature as:

"AI-assisted candidate analysis"

The recruiter remains responsible for the hiring decision.

---

# 20. INTERVIEW MANAGEMENT

Recruiters can schedule interviews.

Interview fields:

- Candidate
- Job
- Interviewer
- Interview type
- Interview round
- Date
- Start time
- End time
- Meeting link
- Notes
- Status

Interview types:

- Technical
- HR
- Managerial
- Behavioral
- Final

---

# 21. INTERVIEW BUSINESS RULES

An interviewer must not have overlapping interviews.

A recruiter must only assign interviews to valid organization users with the interviewer role.

Cancelled interviews must not appear as active interviews.

Rescheduled interviews must update the candidate and interviewer.

---

# 22. INTERVIEWER DASHBOARD

Interviewer dashboard should show:

- Today's interviews
- Upcoming interviews
- Completed interviews
- Pending evaluations

Each interview should provide:

- Candidate information
- Resume
- Job description
- Interview details
- Evaluation form

---

# 23. INTERVIEW EVALUATION

Evaluation fields:

Technical Skills: 1–10

Problem Solving: 1–10

Communication: 1–10

Role Knowledge: 1–10

Coding Skills: 1–10

Overall Rating: 1–10

Recommendation:

- Select
- Hold
- Reject

Feedback:

Free-text field.

---

# 24. MULTIPLE INTERVIEW ROUNDS

A candidate may have multiple interviews.

Example:

Technical Interview
→ Evaluation

Managerial Interview
→ Evaluation

HR Interview
→ Evaluation

Recruiter should be able to see the complete interview history.

---

# 25. FINAL HIRING DECISION

Only authorized recruiters/admins can make the final decision.

Allowed:

- Selected
- Rejected
- On Hold

Record:

- Decision
- Decision maker
- Decision date
- Notes

---

# 26. NOTIFICATIONS

Implement in-app notifications.

Candidate notifications:

- Application submitted
- Application status changed
- Interview scheduled
- Interview rescheduled
- Interview cancelled
- Final decision

Recruiter notifications:

- New application
- Interview evaluation submitted

Interviewer notifications:

- Interview assigned
- Interview updated
- Interview reminder

---

# 27. EMAIL NOTIFICATIONS

Use Nodemailer or another email service.

Email events:

- Registration verification
- Password reset
- Application confirmation
- Interview scheduling
- Interview rescheduling
- Interview cancellation
- Application status update
- Final decision

Email functionality should be implemented through a service layer.

Do not put email logic directly inside controllers.

---

# 28. RECRUITER NOTES

Recruiters can add private notes to candidates.

Example:

"Strong React experience. Good communication. Consider for next round."

Candidate must never be able to view recruiter-private notes.

---

# 29. AUDIT LOGGING

Maintain audit logs for important actions.

Examples:

- User created
- User role changed
- Job created
- Job published
- Job closed
- Candidate application submitted
- Application status changed
- Interview scheduled
- Interview rescheduled
- Evaluation submitted
- Hiring decision made

Audit record:

- Organization
- Actor
- Action
- Resource type
- Resource ID
- Previous value where applicable
- New value where applicable
- Timestamp

---

# 30. ANALYTICS DASHBOARD

Admin/recruiter dashboard should provide analytics.

## KPI cards

- Total jobs
- Active jobs
- Total applications
- Shortlisted candidates
- Interviews
- Selected candidates

## Charts

### Applications over time

Monthly application trend.

### Candidate pipeline

Applications by status.

### Applications by job

Compare application counts between jobs.

### Hiring funnel

Applications
→ Screening
→ Shortlisted
→ Interview
→ Selected

### Interview analytics

- Interviews scheduled
- Completed interviews
- Pending evaluations
- Average interview score

---

# 31. DASHBOARD DESIGN

The dashboard should look like a modern SaaS application.

Use:

- Sidebar
- Top navigation
- KPI cards
- Charts
- Tables
- Filters
- Search
- Dropdowns
- Modals
- Toast notifications
- Skeleton loading
- Empty states
- Error states

Avoid:

- Basic Bootstrap-looking UI
- Excessive gradients
- Unnecessary animations
- Cluttered dashboards
- Huge cards
- Poor mobile layouts

---

# 32. FRONTEND TECHNOLOGY

Use:

- React
- Vite
- React Router
- Axios
- Plain CSS: a single global stylesheet (src/styles/global.css) using CSS
  custom properties for design tokens, not Tailwind CSS — switched from
  Tailwind so styles are directly readable/editable without needing
  Tailwind knowledge.
- Recharts
- React Hook Form where appropriate
- Zod or another validation library where appropriate
- Lucide React or another consistent icon library

Do not install libraries unnecessarily.

---

# 33. BACKEND TECHNOLOGY

Use:

- Node.js
- Express.js
- MongoDB
- Mongoose
- JWT
- bcrypt
- Helmet
- CORS
- express-rate-limit

Use a modular architecture.

---

# 34. BACKEND STRUCTURE

Recommended:

server/

config/
controllers/
middleware/
models/
routes/
services/
validators/
utils/
jobs/
uploads/

Example:

controllers/
- authController.js
- jobController.js
- applicationController.js
- interviewController.js
- evaluationController.js
- analyticsController.js

services/
- emailService.js
- aiService.js
- resumeService.js
- notificationService.js

middleware/
- authMiddleware.js
- roleMiddleware.js
- errorMiddleware.js
- uploadMiddleware.js

---

# 35. FRONTEND STRUCTURE

Recommended:

client/src/

components/
pages/
layouts/
hooks/
context/
services/
utils/
validators/
assets/

Use reusable components.

Do not duplicate identical UI components.

---

# 36. FRONTEND ROUTES

## Public

/
 /jobs
 /jobs/:id
 /login
 /register

## Candidate

/candidate/dashboard
/candidate/profile
/candidate/jobs
/candidate/applications
/candidate/applications/:id
/candidate/interviews
/candidate/notifications

## Recruiter

/recruiter/dashboard
/recruiter/jobs
/recruiter/jobs/create
/recruiter/jobs/:id
/recruiter/applications
/recruiter/applications/:id
/recruiter/candidates
/recruiter/interviews
/recruiter/analytics

## Interviewer

/interviewer/dashboard
/interviewer/interviews
/interviewer/interviews/:id
/interviewer/evaluations/:id

## Admin

/admin/dashboard
/admin/users
/admin/jobs
/admin/candidates
/admin/analytics
/admin/audit-logs
/admin/settings

---

# 37. API DESIGN

Use REST APIs.

## Authentication

POST /api/auth/register

POST /api/auth/login

POST /api/auth/logout

GET /api/auth/me

POST /api/auth/forgot-password

POST /api/auth/reset-password

---

## Jobs

GET /api/jobs

GET /api/jobs/:id

POST /api/jobs

PUT /api/jobs/:id

DELETE /api/jobs/:id

PATCH /api/jobs/:id/status

---

## Applications

POST /api/applications

GET /api/applications

GET /api/applications/:id

PATCH /api/applications/:id/status

---

## Interviews

POST /api/interviews

GET /api/interviews

GET /api/interviews/:id

PUT /api/interviews/:id

DELETE /api/interviews/:id

---

## Evaluations

POST /api/evaluations

GET /api/evaluations/:interviewId

PUT /api/evaluations/:id

---

## AI

POST /api/ai/resume-screen

GET /api/ai/screenings/:applicationId

---

## Analytics

GET /api/analytics/overview

GET /api/analytics/applications

GET /api/analytics/hiring-funnel

GET /api/analytics/interviews

---

# 38. API RESPONSE FORMAT

Use a consistent response structure.

Success:

{
  "success": true,
  "message": "Application retrieved successfully",
  "data": {}
}

Error:

{
  "success": false,
  "message": "Unable to retrieve application",
  "error": {}
}

Do not expose sensitive internal errors in production responses.

---

# 39. DATABASE COLLECTIONS

Recommended MongoDB collections:

users
organizations
jobs
candidates
applications
interviews
evaluations
notifications
notes
auditLogs
aiScreenings
passwordResets

---

# 40. USER MODEL

Fields:

- organizationId
- name
- email
- passwordHash
- role
- profileImage
- isEmailVerified
- isActive
- createdAt
- updatedAt

Roles:

- admin
- recruiter
- interviewer
- candidate

Candidate-specific profile information can either be embedded carefully or stored in a separate candidate profile model.

Choose the approach based on maintainability and explain the decision before implementation.

---

# 41. ORGANIZATION MODEL

Fields:

- name
- logo
- description
- website
- industry
- location
- contactEmail
- createdAt
- updatedAt

---

# 42. JOB MODEL

Fields:

- organizationId
- createdBy
- title
- department
- description
- responsibilities
- requiredSkills
- preferredSkills
- education
- experience
- employmentType
- workMode
- location
- salaryMin
- salaryMax
- deadline
- status
- createdAt
- updatedAt

---

# 43. APPLICATION MODEL

Fields:

- organizationId
- jobId
- candidateId
- resumeId
- coverLetter
- expectedSalary
- availability
- status
- appliedAt
- updatedAt

Create a unique constraint/index to prevent duplicate applications.

---

# 44. INTERVIEW MODEL

Fields:

- organizationId
- applicationId
- candidateId
- jobId
- interviewerId
- type
- round
- date
- startTime
- endTime
- meetingLink
- notes
- status
- createdBy
- createdAt
- updatedAt

---

# 45. EVALUATION MODEL

Fields:

- organizationId
- interviewId
- interviewerId
- technicalSkills
- problemSolving
- communication
- roleKnowledge
- codingSkills
- overallRating
- recommendation
- feedback
- createdAt
- updatedAt

---

# 46. AI SCREENING MODEL

Fields:

- organizationId
- applicationId
- jobId
- candidateId
- matchScore
- matchedSkills
- missingSkills
- experienceMatch
- educationMatch
- summary
- model
- createdAt
- updatedAt

Do not store unnecessary sensitive information.

---

# 47. NOTIFICATION MODEL

Fields:

- organizationId
- recipientId
- type
- title
- message
- relatedResource
- isRead
- createdAt

---

# 48. AUDIT LOG MODEL

Fields:

- organizationId
- actorId
- action
- resourceType
- resourceId
- previousValue
- newValue
- createdAt

---

# 49. DATABASE INDEXING

Add appropriate indexes for:

- organizationId
- email
- jobId
- candidateId
- applicationId
- status
- createdAt

Analyze query patterns before adding excessive indexes.

---

# 50. SEARCH

Candidate search should support:

- Name
- Email
- Skills
- Location

Job search should support:

- Title
- Skills
- Location
- Department

Use server-side search.

Do not download all records to the frontend and filter them there.

---

# 51. PAGINATION

Use server-side pagination.

Example:

GET /api/applications?page=1&limit=20

Response:

{
  "success": true,
  "data": [],
  "pagination": {
    "page": 1,
    "limit": 20,
    "total": 150,
    "totalPages": 8
  }
}

Default page size:

20

Maximum page size should be limited.

---

# 52. FILE UPLOAD SECURITY

Validate:

- File type
- File extension
- File size

Do not trust only the filename extension.

Resume uploads must not allow arbitrary executable files.

---

# 53. SECURITY REQUIREMENTS

Implement:

- Password hashing
- JWT authentication
- Authorization middleware
- Organization-level access checks
- Input validation
- Rate limiting
- CORS
- Helmet
- Secure cookies where applicable
- File validation
- Request body limits
- Consistent error handling

Never expose:

- Password hashes
- JWT secrets
- API keys
- Database credentials

---

# 54. ERROR HANDLING

Implement centralized backend error handling.

Frontend must provide:

- Loading state
- Success state
- Error state
- Empty state

Example:

"Unable to load applications. Please try again."

Do not show raw stack traces to users.

---

# 55. PERFORMANCE

Requirements:

- Lazy load major dashboard routes.
- Paginate large datasets.
- Debounce search.
- Avoid unnecessary API requests.
- Optimize images.
- Use database indexes.
- Avoid N+1 database queries.
- Do not load all candidates at once.
- Do not load all applications at once.

---

# 56. ACCESSIBILITY

Implement:

- Keyboard-accessible controls
- Labels for form fields
- Appropriate button names
- Visible focus states
- Sufficient text contrast
- Accessible modal behavior
- Do not rely only on color for status

---

# 57. RESPONSIVE DESIGN

Support:

- Desktop
- Tablet
- Mobile

Desktop should be the primary experience for recruiter/admin dashboards.

Candidate-facing pages must have a strong mobile experience.

---

# 58. TESTING

Critical features must be tested.

## Authentication

- Register
- Login
- Logout
- Unauthorized access
- Role restrictions

## Jobs

- Create
- Edit
- Publish
- Close
- Search

## Applications

- Apply
- Duplicate application prevention
- Status update
- Unauthorized access

## Interviews

- Schedule
- Reschedule
- Cancel
- Overlap validation

## Evaluations

- Submit
- Update
- Access control

## AI

- Resume screening request
- Invalid input
- AI API failure handling

---

# 59. SEED DATA

Create development/demo seed data.

Example organization:

TechNova Solutions

Jobs:

- Frontend Developer
- Backend Developer
- MERN Stack Developer
- Java Developer
- UI/UX Designer

Create:

- 20+ candidates
- 50+ applications
- 15+ interviews
- Sample evaluations
- Sample notifications
- Sample analytics data

Seed data must never contain real people's personal information.

---

# 60. DEMO ACCOUNTS

Provide development/demo accounts.

Example:

Recruiter:
recruiter@demo.com

Interviewer:
interviewer@demo.com

Candidate:
candidate@demo.com

Admin:
admin@demo.com

Use development-only passwords.

Do not expose real credentials.

---

# 61. DEVELOPMENT PHASES

Development must follow these phases.

---

## PHASE 0 — ANALYSIS & ARCHITECTURE

Tasks:

- Analyze PRD
- Analyze requirements
- Finalize technology choices
- Design architecture
- Design database models
- Design API structure
- Define frontend architecture
- Identify reusable components
- Identify risks
- Create implementation plan

Deliverables:

- Architecture document
- Database design
- API plan
- Folder structure
- Phase roadmap

NO application implementation.

After analysis, STOP and ask permission for Phase 1.

---

# PHASE 1 — PROJECT FOUNDATION

Implement:

- React/Vite frontend
- Node/Express backend
- MongoDB connection
- Environment configuration
- Base folder structure
- Global error handling
- Basic API health check
- Base UI system
- ESLint/formatting if required

Test:

- Frontend starts
- Backend starts
- MongoDB connection works
- Health API works

STOP and ask permission for Phase 2.

---

# PHASE 2 — AUTHENTICATION & RBAC

Implement:

- Registration
- Login
- Logout
- Password hashing
- JWT
- Authentication middleware
- Role middleware
- Current-user API
- Forgot password
- Reset password
- Protected frontend routes

Test every role.

STOP and ask permission for Phase 3.

---

# PHASE 3 — ORGANIZATION & USER MANAGEMENT

Implement:

- Organization model
- Organization creation
- Admin user
- User management
- Recruiter management
- Interviewer management
- Candidate profile foundation

Verify tenant isolation.

STOP and ask permission for Phase 4.

---

# PHASE 4 — JOB MANAGEMENT

Implement:

- Create job
- Edit job
- Delete/close job
- Publish job
- Job listing
- Job detail
- Search
- Filters
- Pagination

Test recruiter permissions.

STOP and ask permission for Phase 5.

---

# PHASE 5 — CANDIDATE APPLICATION SYSTEM

Implement:

- Candidate profile
- Resume upload
- Resume storage
- Apply to job
- Duplicate application prevention
- Candidate application dashboard
- Recruiter application list
- Candidate details

STOP and ask permission for Phase 6.

---

# PHASE 6 — RECRUITMENT PIPELINE

Implement:

- Candidate table
- Search
- Filters
- Sorting
- Pagination
- Kanban pipeline
- Drag/drop status changes
- Recruiter notes
- Status history

Test organization-level access.

STOP and ask permission for Phase 7.

---

# PHASE 7 — INTERVIEW MANAGEMENT

Implement:

- Interview scheduling
- Interview list
- Interview calendar/list view
- Interviewer assignment
- Conflict detection
- Rescheduling
- Cancellation
- Interviewer dashboard

STOP and ask permission for Phase 8.

---

# PHASE 8 — INTERVIEW EVALUATION

Implement:

- Evaluation form
- Ratings
- Recommendation
- Feedback
- Evaluation history
- Recruiter evaluation view
- Final hiring decision

STOP and ask permission for Phase 9.

---

# PHASE 9 — AI RESUME SCREENING

Before implementation:

- Analyze resume extraction options.
- Analyze AI API integration.
- Define structured response.
- Define failure handling.
- Define token/cost considerations.
- Define privacy considerations.

Then implement:

- Resume text extraction
- AI service
- Job requirement comparison
- Match score
- Matched skills
- Missing skills
- Experience match
- Education match
- Explanation
- AI screening storage
- Recruiter UI

AI must remain assistive.

STOP and ask permission for Phase 10.

---

# PHASE 10 — NOTIFICATIONS & EMAIL

Implement:

- Notification model
- Notification service
- In-app notifications
- Email service
- Application email
- Interview email
- Status update email
- Decision email

STOP and ask permission for Phase 11.

---

# PHASE 11 — ANALYTICS

Implement:

- KPI cards
- Application trends
- Candidate pipeline
- Hiring funnel
- Job statistics
- Interview statistics
- Average interview score
- Time-to-hire where sufficient data exists

Charts should use real database data.

Do not hardcode dashboard numbers.

STOP and ask permission for Phase 12.

---

# PHASE 12 — AUDIT LOGGING

Implement:

- Audit log model
- Audit middleware/service
- Important action logging
- Admin audit-log page
- Filtering
- Pagination

STOP and ask permission for Phase 13.

---

# PHASE 13 — UI POLISH & RESPONSIVENESS

Review the complete application.

Improve:

- Typography
- Spacing
- Components
- Tables
- Forms
- Modals
- Loading states
- Empty states
- Error states
- Mobile layout
- Responsive navigation
- Accessibility
- Animations where useful

Do not redesign working functionality unnecessarily.

STOP and ask permission for Phase 14.

---

# PHASE 14 — TESTING & SECURITY REVIEW

Perform:

- Frontend tests
- Backend tests
- Authentication tests
- Authorization tests
- Tenant isolation tests
- File upload tests
- API validation tests
- AI failure tests
- Interview conflict tests

Perform security review.

Fix only confirmed issues.

STOP and ask permission for Phase 15.

---

# PHASE 15 — PERFORMANCE OPTIMIZATION

Analyze:

- Frontend bundle
- API response times
- Database queries
- Large tables
- Images
- AI API calls

Optimize:

- Lazy loading
- Pagination
- Indexes
- API queries
- Caching where appropriate
- Image loading

Measure before and after where possible.

STOP and ask permission for Phase 16.

---

# PHASE 16 — DEPLOYMENT

Prepare:

Frontend:
Vercel

Backend:
Railway or Render

Database:
MongoDB Atlas

File storage:
Cloudinary or S3-compatible storage

Configure:

- Production environment variables
- CORS
- Production database
- HTTPS
- Deployment builds
- Error handling

STOP and ask permission before production deployment.

---

# 62. ENVIRONMENT VARIABLES

Expected variables:

MONGO_URI=
JWT_SECRET=
JWT_EXPIRES_IN=
CLIENT_URL=

AI_API_KEY=

EMAIL_HOST=
EMAIL_PORT=
EMAIL_USER=
EMAIL_PASSWORD=

CLOUDINARY_CLOUD_NAME=
CLOUDINARY_API_KEY=
CLOUDINARY_API_SECRET=

All values must remain in `.env`.

`.env` must be included in `.gitignore`.

---

# 63. GIT REQUIREMENTS

Use Git with meaningful commits.

Suggested commits:

feat: initialize project architecture

feat: implement authentication

feat: implement organization management

feat: implement job management

feat: implement applications

feat: implement recruitment pipeline

feat: implement interview management

feat: implement evaluations

feat: implement AI resume screening

feat: implement notifications

feat: implement analytics

test: add authentication tests

test: add application tests

fix: ...

Do not make one giant commit for the entire project.

---

# 64. DOCUMENTATION

The final repository must contain:

README.md

The README should include:

- Product overview
- Features
- Screenshots
- Tech stack
- Architecture
- Folder structure
- Setup instructions
- Environment variables
- Database setup
- Running locally
- API overview
- Demo accounts
- Deployment
- AI feature explanation
- Security considerations

---

# 65. SCREENSHOTS

Create screenshots of major features for README/portfolio:

- Landing page
- Job listing
- Job details
- Candidate dashboard
- Recruiter dashboard
- Candidate pipeline
- Candidate details
- AI screening
- Interview calendar
- Interviewer dashboard
- Evaluation form
- Analytics dashboard
- Admin dashboard

Screenshots should use realistic seeded demo data.

---

# 66. UI QUALITY STANDARD

The project must look like a professional SaaS product.

Avoid:

- Generic templates without customization
- Excessive gradients
- Random colors
- Inconsistent spacing
- Inconsistent buttons
- Browser-default forms
- Poor mobile layouts
- Placeholder-looking dashboards

Use a consistent design system.

---

# 67. ACCEPTANCE CRITERIA

The project is complete only when:

- Authentication works.
- All four roles work.
- RBAC works.
- Tenant isolation works.
- Jobs can be created and published.
- Candidates can apply.
- Duplicate applications are prevented.
- Resumes can be uploaded securely.
- Recruiters can manage applications.
- Recruitment pipeline works.
- AI screening works.
- Interviews can be scheduled.
- Interview conflicts are prevented.
- Interviewers can submit evaluations.
- Recruiters can make final decisions.
- Notifications work.
- Emails work.
- Analytics use real database data.
- Audit logs work.
- API validation works.
- Error handling works.
- Responsive UI works.
- Critical tests pass.
- Production deployment works.
- README is complete.

---

# 68. IMPORTANT IMPLEMENTATION PRINCIPLE

Do not optimize for the number of features.

Optimize for:

1. Correct architecture
2. Security
3. Maintainability
4. Real-world workflows
5. Good UI/UX
6. Clean code
7. Proper database design
8. Meaningful AI integration
9. Testing
10. Deployability

Every feature must be implemented in a way that can be explained clearly during a technical interview.

---

# 69. FINAL INTERVIEW VALUE

The completed project should allow the developer to explain:

- Why MERN was selected
- How JWT authentication works
- How RBAC works
- How multi-tenancy works
- How MongoDB schemas are designed
- How duplicate applications are prevented
- How candidate status changes are handled
- How interview conflicts are detected
- How file uploads are secured
- How AI resume screening works
- How AI failures are handled
- How REST APIs are structured
- How pagination works
- How analytics queries work
- How notifications work
- How audit logs work
- How production deployment works
- What security risks were considered
- What performance optimizations were implemented

The project should be understandable and explainable by a fresher who actually built it.

---

# END OF PRD