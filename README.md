# College Placement Management System (MERN)

A full-stack college placement portal built with the MERN stack for Students and TPO users.

## Features
- Student signup and login
- TPO signup and login
- Separate dashboards for Student and TPO
- Job posting and application management
- Drive registrations and applicant tracking
- Student approval workflow for placement eligibility
- Notices and interview scheduling
- Placement records with student snapshot details
- CSV export for reports
- OTP-based student forgot password flow

## Tech Stack
- Frontend: React + Vite
- Backend: Node.js + Express
- Database: MongoDB (Local or Atlas)
- Auth: JWT

## Requirements
- Node.js 18 or later
- MongoDB running locally or a MongoDB Atlas connection string

## Project Setup
Open the terminal in the project root and run:

```bash
npm install
npm run install:all
```

## Environment Setup
Create `backend/.env` by copying `backend/.env.example`, then update the values as needed.

Example:

```env
PORT=4518
MONGO_URI=mongodb://127.0.0.1:27017/college_placement
JWT_SECRET=change_this_to_any_long_random_string

SMTP_HOST=
SMTP_PORT=
SMTP_SECURE=false
SMTP_USER=
SMTP_PASS=
SMTP_FROM=

TWILIO_ACCOUNT_SID=
TWILIO_AUTH_TOKEN=
TWILIO_FROM_NUMBER=
```

Notes:
- For local MongoDB, you can keep `MONGO_URI=mongodb://127.0.0.1:27017/college_placement`
- For MongoDB Atlas, replace `MONGO_URI` with your Atlas connection string
- Email OTP will work when SMTP values are configured
- Phone OTP will work when Twilio values are configured

## Run the App
From the project root:

```bash
npm run dev
```

Default local URLs:
- Backend: [http://localhost:4518](http://localhost:4518)
- Frontend: [http://localhost:5173](http://localhost:5173)

## First Use
1. Open the student signup page and create a student account
2. Open the TPO signup page and create a TPO account
3. Login and use the dashboards

## Main API Routes
### Auth
- `POST /api/auth/student/signup`
- `POST /api/auth/student/login`
- `POST /api/auth/student/request-password-reset`
- `POST /api/auth/student/verify-password-reset-otp`
- `POST /api/auth/student/reset-password-with-otp`
- `POST /api/auth/tpo/signup`
- `POST /api/auth/tpo/login`

### Jobs
- `GET /api/jobs`
- `POST /api/jobs`

### Applications
- `POST /api/applications/:jobId/apply`
- `GET /api/applications/my`
- `GET /api/applications/job/:jobId`
- `PATCH /api/applications/:applicationId/status`

### Notices
- `GET /api/notices`
- `POST /api/notices`

## Important Notes
- Passwords are currently stored in plain text. This is not secure and should only be used for demo or college project purposes.
- JWT is stored in localStorage for simple authentication handling.
- Real OTP delivery requires external service configuration:
  - Email OTP: SMTP provider
  - Phone OTP: Twilio
- If SMTP or Twilio is not configured, production-style OTP delivery will not work.

## Assets
To change the college background image, replace:

`frontend/src/assets/college-bg.jpg`

## Reports
CSV downloads include UTF-8 BOM and Excel-friendly formatting so they open properly in Microsoft Excel.
