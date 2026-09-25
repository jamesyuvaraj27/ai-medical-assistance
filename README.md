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

Copy `backend/.env.example` to `backend/.env` and set `JWT_SECRET`. `MONGODB_URI` is accepted
for database connectivity and the repository's persistence layer can be
extended from the typed models; the current feature routes intentionally use an
in-memory store for deterministic local development. Run it with
`npm run server:dev`; compile it with
`npm run server:build` and start the compiled API with `npm run server:start`.