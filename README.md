# CampusVelocity — Campus Placement & Internship Management Portal

**CampusVelocity** is an institutional campus placement and internship management platform built for universities (such as the National Institute of Technology). It implements a production-grade, three-role architecture enforcing strict server-side eligibility checks, administrative approval workflows, batch applicant lifecycle management, and tamper-evident audit logging.

The user interface is an authentic, production-style implementation of the Stitch UI/UX design specification, preserving exact typography (`Space Grotesk`, `Geist`, `Material Symbols Outlined`), color hierarchies, and metric dashboards.

---

## 1. System Architecture & Roles

The system is strictly partitioned into three authoritative roles:

### 🎓 1. Student Applicant
- **Academic Dashboard**: High-fidelity terminal displaying verified CGPA (e.g. 8.42), roll number, batch (`2022-2026`), and eligibility tier.
- **5-Metric KPI Summary**: Real-time counter of eligible jobs, applications submitted, shortlisted status, scheduled interviews, and offers released.
- **Server-Gated Application Engine**: Strict backend checks on Cutoff CGPA, permitted academic branches, graduation year, deadline, and zero-standing backlogs before any application can be persisted.
- **Chronological Pipeline Tracker**: Real-time tracking through `APPLIED → SHORTLISTED → INTERVIEW → SELECTED` with timestamped reviewer notes and official offer letter attestations (e.g., Deloitte USI `DEL-USI-2026-CAMPUS-7719`).
- **Academic Profile Editor**: Update roll numbers, CGPA, department, resume cloud links, GitHub/LinkedIn links, and skills.

### 🏢 2. Company Recruiter
- **Accreditation Lifecycle**: Organizations register as `PENDING` and must be audited and approved by the Placement Cell before job postings become visible to students.
- **Job Posting Management**: Recruiters create on-campus placement drives (Full-time, Internship) with specific CGPA cutoffs, branches, batches, and deadlines. Postings start as `PENDING` for administrative sign-off.
- **Multi-Select Batch Candidate Management**: Checkbox selection of multiple candidates (`☑ Student A`, `☑ Student B`) to batch-transition statuses (`SHORTLISTED`, `INTERVIEW`, `SELECTED`, `REJECTED`) with remarks.
- **Candidate Dossier Inspection**: Detailed drawer displaying student CGPA, verified branch, technical skills, and resume links.

### 🏛️ 3. Placement Cell Admin
- **Administrative Command Center**: Comprehensive metrics across students, partner companies, open positions, active applications, and issued offers.
- **Company Accreditation Review**: One-click approval or rejection with mandatory administrative remarks.
- **Job Posting Approval Workflow**: Audit job descriptions, cutoffs, and compensation before activating them for campus registration.
- **Immutable Audit Trail**: Chronological, timestamped records of every approval, rejection, and reviewer ID.

---

## 2. Technology Stack

- **Frontend**: React 19, Vite, Tailwind CSS v4, Google Fonts (`Space Grotesk`, `Geist`), Material Symbols Outlined.
- **Backend**: Node.js, Express.js REST API with Bearer JWT authentication and role-based authorization middlewares.
- **Database**: MongoDB with Mongoose schemas, indexes, and unique compound constraints (`{ studentId: 1, jobId: 1 }`).
  - Automatic zero-configuration embedded MongoDB memory server with fallback to `MONGODB_URI`.
- **Security**: `bcryptjs` password hashing, token validation, server-side eligibility verification, ownership verification.

---

## 3. Demo Credentials

The database automatically seeds realistic, populated accounts on first boot:

| Role | Name | Email | Password |
|---|---|---|---|
| **Student** | Rohan Sharma (CS '26, CGPA 8.42) | `rohan.sharma@nit.ac.in` | `Student@2026!` |
| **Student 2** | Ananya Verma (IT '26, CGPA 7.90) | `ananya.verma@nit.ac.in` | `Student@2026!` |
| **Student 3** | Vikram Aditya (ECE '27, CGPA 8.75) | `vikram.aditya@nit.ac.in` | `Student@2026!` |
| **Recruiter (Google)** | Priya Nair | `recruiter.google@campus.com` | `Recruiter@2026!` |
| **Recruiter (Microsoft)** | Arun Mehta | `recruiter.ms@campus.com` | `Recruiter@2026!` |
| **Recruiter (Startup - Pending)** | Karan Gupta (NeuralByte) | `recruiter.startup@campus.com` | `Recruiter@2026!` |
| **Admin** | Dr. A. K. Sharma (Head TPO) | `admin@nit.ac.in` | `Admin@2026!` |

> **Quick Switcher**: Testers can also click **"Switch: Student | Recruiter | Admin"** directly in the top header bar or the demo buttons inside the login modal for instant 1-click evaluation.

---

## 4. Server-Side Eligibility Engine

Eligibility is strictly verified on the backend before any database insertion:

```json
{
  "success": false,
  "message": "You are not eligible for this position.",
  "reasons": [
    "Minimum CGPA required is 8.00. Your verified CGPA is 7.50.",
    "Department restriction: Allowed branches are [CSE, IT]. Your registered branch is MECH."
  ]
}
```

The server inspects:
1. Student verified CGPA vs Job `minimumCGPA`
2. Student branch vs Job `allowedDepartments`
3. Student graduation year vs Job `allowedGraduationYears`
4. Active backlogs status vs Tier criteria
5. Application deadline expiry
6. Company approval status (`APPROVED` required)
7. Job approval status (`APPROVED` required)
8. Prior submission duplication check

---

## 5. REST API Specification

### Authentication
- `POST /api/auth/register`: Register new student or recruiter account
- `POST /api/auth/login`: Authenticate and issue Bearer JWT
- `GET /api/auth/me`: Retrieve current session user
- `POST /api/auth/quick-switch`: Quick switch between demo roles

### Student Endpoints
- `GET /api/students/dashboard-summary`: Retrieve verified KPIs, readiness score, and eligible drives
- `GET /api/students/profile`: Get student academic profile
- `PUT /api/students/profile`: Update student academic profile
- `GET /api/students/jobs`: Search & filter approved open jobs with pre-computed eligibility
- `GET /api/students/jobs/:id`: Job details with eligibility audit
- `POST /api/students/applications`: Submit application (Gated by authoritative backend check)
- `GET /api/students/applications`: View all submitted applications with real-time status history
- `GET /api/students/applications/:id`: Application detail

### Recruiter Endpoints
- `GET /api/recruiter/dashboard-summary`: Hiring KPIs, applicant counts, and company status
- `GET /api/recruiter/company`: View company profile
- `PUT /api/recruiter/company`: Update company profile (Preserves approval gating)
- `GET /api/recruiter/jobs`: Recruiter's job postings
- `POST /api/recruiter/jobs`: Create job opening (Starts as `PENDING`)
- `GET /api/recruiter/jobs/:id`: Retrieve job
- `PUT /api/recruiter/jobs/:id`: Update job
- `GET /api/recruiter/jobs/:id/applicants`: Candidate list for job
- `PATCH /api/recruiter/applications/:id/status`: Update single candidate stage
- `PATCH /api/recruiter/applications/batch-status`: Multi-select batch status transition

### Admin Endpoints
- `GET /api/admin/dashboard`: University placement metrics & pending approval queues
- `GET /api/admin/companies`: Master company directory
- `PATCH /api/admin/companies/:id/approve`: Certify corporate entity & log audit
- `PATCH /api/admin/companies/:id/reject`: Decline corporate entity & log audit reason
- `GET /api/admin/jobs`: Master job registry
- `PATCH /api/admin/jobs/:id/approve`: Approve drive & make student-visible
- `PATCH /api/admin/jobs/:id/reject`: Decline drive & log audit reason
- `GET /api/admin/students`: Directory of enrolled candidates
- `GET /api/admin/applications`: University-wide application ledger
- `GET /api/admin/audit-logs`: Tamper-proof administrative audit register

---

## 6. How to Run Locally

### Environment Setup
Create a `.env` file in the root directory:
```env
PORT=3000
JWT_SECRET=campus-velocity-secure-jwt-key-2026
MONGODB_URI= # Optional: If omitted, embedded MongoMemoryServer boots automatically
```

### Run the Full-Stack Application
```bash
npm install
npm run dev
```
Open [http://localhost:3000](http://localhost:3000) to view the portal.
