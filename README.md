# College Placement Management System (MERN) — Local MongoDB Compass

✅ Includes:
- Student **Signup + Login** (JWT auth)
- TPO **Signup + Login** (JWT auth)
- Separate dashboards for Student and TPO
- TPO: Create jobs, publish notices, view applicants
- Student: View jobs, apply, view application status, view notices
- MongoDB: **local only** (MongoDB Compass connection string)

## 1) Requirements
- Node.js 18+ (recommended)
- MongoDB running locally (MongoDB Compass / MongoDB Community Server)

## 2) Setup (one-time)
Open terminal in project root:

```bash
npm install
npm run install:all
```

## 3) Configure ENV
### Backend
Create: `backend/.env`

```env
PORT=4518
MONGO_URI=mongodb://127.0.0.1:27017/college_placement
JWT_SECRET=change_this_to_any_long_random_string
```

> If your MongoDB is different (atlas or auth), update `MONGO_URI` accordingly.

## 4) Run (Frontend + Backend together)
From project root:

```bash
npm run dev
```

- Backend: http://localhost:4518
- Frontend: http://localhost:5173

## 5) First Use
- Go to **/student/signup** and create a student account
- Go to **/tpo/signup** and create a TPO account
- Login and use dashboards

## API Summary
- Auth:
  - POST `/api/auth/student/signup`
  - POST `/api/auth/student/login`
  - POST `/api/auth/tpo/signup`
  - POST `/api/auth/tpo/login`
- Jobs:
  - GET `/api/jobs` (public)
  - POST `/api/jobs` (tpo)
- Applications:
  - POST `/api/applications/:jobId/apply` (student)
  - GET `/api/applications/my` (student)
  - GET `/api/applications/job/:jobId` (tpo)
  - PATCH `/api/applications/:applicationId/status` (tpo)
- Notices:
  - GET `/api/notices` (public)
  - POST `/api/notices` (tpo)

## Notes
- ⚠️ Passwords are stored in **plain text** (as you requested). This is NOT secure and only OK for college/demo projects.
- JWT is stored in localStorage (simple college project style)
- You can extend roles (Admin/Management) later if needed.

### New Options Added
- TPO can **Approve / Disapprove** students for placement eligibility
- Student can apply only if **Approved**
- TPO can **Download Applicants Report (CSV)** for each job


## College Background Image
- Put your college photo in: `frontend/src/assets/college-bg.jpg`
- Replace the placeholder file and keep the same name.


## Excel Download Reports
All CSV downloads include UTF-8 BOM and Excel directive (sep=,) so they open correctly in MS Excel.
