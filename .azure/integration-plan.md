# Integration hand-off

This approved project is a frontend-only static RAG walkthrough. Backend/API integration, database migrations, and seed data are not applicable.

- **Frontend:** workspace root; `npm install`; `npm run build`; `npm run dev`.
- **Data:** `src/data/ragDemo.ts` contains the typed in-memory mock corpus and demo scores; intentionally keep it static.
- **Routes:** `/` renders the SPA; no application API routes.
- **Services:** React + Vite + Tailwind CSS + Fluent UI v9; no Azure runtime, persistence, or external services.
