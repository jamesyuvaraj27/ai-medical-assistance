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
  optional MongoDB connection

The authenticated frontend now has working routes for:

- `/patient` overview with live reminder data
- `/patient/appointments` clinician search, booking, listing, and cancellation
- `/patient/records` medical record creation and secure URL access
- `/patient/reminders` medication/habit creation and active/paused state
- `/patient/assistant` safety-bounded health education chat
- `/patient/help` privacy and support guidance
- Doctor and admin overview shells when a user has those roles

Copy `backend/.env.example` to `backend/.env` and set `JWT_SECRET`. `MONGODB_URI` is accepted
for database connectivity and the repository's persistence layer can be
extended from the typed models; the current feature routes intentionally use an
in-memory store for deterministic local development. Run it with
`npm run server:dev`; compile it with
`npm run server:build` and start the compiled API with `npm run server:start`.

## Production checklist

Before deploying, configure a real `MONGODB_URI`, a 32+ character random
`JWT_SECRET`, `CLIENT_ORIGIN` for the deployed frontend, `COOKIE_SECURE=true`,
and a real file storage/provider integration for medical uploads. The current
development fallback is intentionally in-memory and should not be used for
production persistence. The AI route is a safe provider seam; connect it to a
reviewed healthcare information provider and retain the non-diagnostic
guardrails before enabling it in production.