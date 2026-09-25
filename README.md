# Carely — AI Medical Assistance

Carely is a responsive healthcare experience built around calm, understandable
health guidance. The current frontend foundation includes:

- A claymorphism landing page with responsive navigation and animated care
  previews
- Login and registration flows
- A role-switchable patient, doctor, and admin dashboard shell
- Patient wellness summary, appointments, activity, reminders, and AI entry
  point
- Vite, React, TypeScript, React Router, Framer Motion, and Lucide icons

## Local development

```bash
npm install
npm run dev
```

Create a production build with `npm run build`. The current screens use local
UI state so they can be connected to the planned Express/MongoDB API layer
without changing the route structure.

## API

The Express API lives in `backend/src/server.ts` and includes:

- Secure cookie JWT registration, login, logout, and session lookup
- Role-aware patient, doctor, and admin authorization
- Doctors, appointments, reminders, medical records, and admin stats endpoints
- A safety-bounded AI health guidance endpoint that does not diagnose or prescribe
- Helmet, CORS, rate limiting, Zod validation, bcrypt password hashing, and
  required MongoDB persistence
- Automatic indexes and startup seed accounts for demo doctors and an admin
- Doctor appointment status updates, patient clinical notes, admin user
  management, notifications, reminder deletion, record filtering, and a
  cloud-storage-ready upload endpoint

The authenticated frontend now has working routes for:

- `/patient` overview with live reminder data
- `/patient/appointments` clinician search, booking, listing, and cancellation
- `/patient/records` medical record creation and secure URL access
- `/patient/reminders` medication/habit creation and active/paused state
- `/patient/assistant` safety-bounded health education chat
- `/patient/help` privacy and support guidance
- Doctor and admin workspaces when a user has those roles

Copy `backend/.env.example` to `backend/.env`, set `JWT_SECRET` and a complete
`MONGODB_URI`, and optionally set `GEMINI_API_KEY` for provider-backed AI
responses. Run it with `npm run server:dev`; compile it with
`npm run server:build` and start the compiled API with `npm run server:start`.

## Production checklist

Before deploying, configure a real `MONGODB_URI`, a 32+ character random
`JWT_SECRET`, `CLIENT_ORIGIN` for the deployed frontend, `COOKIE_SECURE=true`,
and a real file storage/provider integration for medical uploads. The API
fails fast without MongoDB rather than silently losing health data. Gemini is
used when configured, with non-diagnostic guardrails retained in the fallback.