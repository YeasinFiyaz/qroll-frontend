# QRoll — Smart QR Attendance (frontend)

QRoll turns every class into a one-scan check-in. Teachers show a QR code, students
scan it with their phone, and attendance is recorded instantly.

**Live app:** https://helloqroll.vercel.app
**API:** https://qroll-backend-five.vercel.app ([backend repo](https://github.com/YeasinFiyaz/qroll-backend))

## Features

**Teachers**
- Dashboard with course, student, session and attendance stats
- Create courses, enrol students by email (single or bulk), remove students, rename or delete a course
- Start a timed attendance session: big QR code, countdown, projector mode, live list of who has checked in
- Session roster (present / absent) and CSV export
- Reports per course with date ranges, search, low-attendance filter and email alerts

**Students**
- Scan the QR with the phone camera (in-app scanner or the phone's camera app) — attendance is marked automatically after login
- Home page with per-course attendance percentage and overall ring
- Full check-in history with CSV export

**General**
- Works on phones (bottom navigation) and desktops, light and dark mode
- Keeps working while a sleeping API wakes up (auto-retry + status banner)
- Profile page with password change

## Tech

React 19 (Create React App), React Router 7, Axios, `qrcode.react`. No UI framework —
hand-written CSS with design tokens in `src/index.css` and components in `src/App.css`.

```
src/
  api/axios.js        API client with retry, auth header and server-status events
  auth.js             login state (context) and role-based home routes
  components/         Navbar, Icon set, Backdrop art, shared UI (modals, toasts, tables…)
  pages/              Login, Register, TeacherDashboard, LiveSession, Courses, CourseDetail,
                      Reports, StudentHome, Scanner, History, Profile
```

## Run locally

```bash
npm install
REACT_APP_API_URL=http://localhost:5000/api/v1 npm start   # or omit to use the live API
npm test
npm run build
```

Environment variables:

| Variable | Purpose | Default |
| --- | --- | --- |
| `REACT_APP_API_URL` | Base URL of the QRoll API (`…/api/v1`) | live Vercel backend |

## Deploy

Hosted on Vercel. Every push to `main` is deployed automatically. `vercel.json`
rewrites all routes to `index.html` so deep links (e.g. `/scan?t=…`) work.
