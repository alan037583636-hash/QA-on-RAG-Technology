# Project Plan

**Status**: Approved
**Created**: 2026-11-13
**Mode**: NEW

---

## 1. Project Overview

**Goal**: Build a single-page React + Tailwind CSS training demo that presents a mock retrieval-augmented generation flow, its question vector, knowledge base, ranked results, dashboard, execution log, min-heap, and prompt. The UI is static and uses in-app mock data; it does not run live retrieval or call an API. The project is designed so that every module is independently testable.

**App Type**: Static client-side SPA

**API Login**: No

**Mode**: NEW

**Deployment Plan**: No deployment plan found

---

## 2. Frontend — Web App

| Component | Technology |
|-----------|-----------|
| **Language** | TypeScript |
| **Framework** | React + Vite |
| **Styling** | Tailwind CSS |
| **Package Manager** | npm |
| **Test Runner** | Vitest |
| **Mocking Library** | vi.mock |
| **Test Command** | npm test |

---

## 3. Services Required

| Azure Service | Role in App | Environment Variable | Default Value (Local) | Classification |
|---------------|------------|---------------------|----------------------|----------------|
| None | Frontend-only demo; no Azure runtime, API, persistence, or external service is required | — | — | — |

---

## 4. Prerequisites

### Run

| Tool | Service(s) | Installed | Version |
|------|------------|-----------|---------|
| Node.js | frontend | ❓ | Unknown; not found in PATH during scan |
| npm | frontend | ❓ | Unknown; not found in PATH during scan |

### Debug

| Tool | Service(s) | Installed | Version |
|------|------------|-----------|---------|
| Visual Studio Code | frontend | ✅ | 1.145.1 |
| VS Code JavaScript Debugger (built in) | frontend | ✅ | Bundled with VS Code 1.145.1 |

Double-check the Node.js and npm prerequisites marked ❓ before running or building the project. Docker is not required because the app has no emulated Azure dependencies.

---

## 5. Design System & UI

**Component Library**: Fluent UI v9 (`@fluentui/react-components`), with Tailwind CSS utilities for layout and spacing
**Style Direction**: A crisp, technical learning console with a calm light canvas, ink-blue hierarchy, cyan retrieval highlights, compact data-dense panels, and restrained elevation. Use consistent rounded corners and clear separation between the query, retrieval, and generation stages so the RAG flow is easy to scan.
**Typography**: Inter, system-ui, Segoe UI, sans-serif

### Color Palette

| Token | Hex | Usage |
|-------|-----|-------|
| `primary` | `#2457D6` | Active retrieval controls, primary action styling, selected result emphasis |
| `accent` | `#0E9F9A` | Embedding and retrieval-stage accents, vector dimension highlights |
| `surface` | `#F4F7FC` | Main training-console canvas |
| `text` | `#17243A` | Question, document, result, and prompt content |
| `muted` | `#64748B` | Explanatory labels, vector metadata, timestamps, and secondary notes |
| `border` | `#DCE4F0` | Panel boundaries, document separators, and compact data-table dividers |

### Pages

| Page | Route | Purpose | Layout |
|------|-------|---------|--------|
| RAG Playground | `/` | Show the static end-to-end retrieval walkthrough, question vector, exact D1–D10 knowledge base, ranked result cards, and supporting algorithm/output panels. | `header, hero, two-column(form+table), grid, tabs, card-list, footer` |

### Sample Content

RAG Playground — training walkthrough:

| Record | Required rendering |
|--------|--------------------|
| D1 | Render the corresponding user-provided mock document and its supplied metadata unchanged |
| D2 | Render the corresponding user-provided mock document and its supplied metadata unchanged |
| D3 | Render the corresponding user-provided mock document and its supplied metadata unchanged |
| D4 | Render the corresponding user-provided mock document and its supplied metadata unchanged |
| D5 | Render the corresponding user-provided mock document and its supplied metadata unchanged |
| D6 | Render the corresponding user-provided mock document and its supplied metadata unchanged |
| D7 | Render the corresponding user-provided mock document and its supplied metadata unchanged |
| D8 | Render the corresponding user-provided mock document and its supplied metadata unchanged |
| D9 | Render the corresponding user-provided mock document and its supplied metadata unchanged |
| D10 | Render the corresponding user-provided mock document and its supplied metadata unchanged |

The visible requirements available for this plan specify the ten IDs but do not include the source text, score, or vector values for those records. The UI and mock-data module must preserve the original supplied values verbatim when they are available; do not fabricate replacement document content, retrieval scores, or vector dimensions. Display the question-vector dimensions from the supplied question vector.

### Component Structure

- `App` — page composition and static RAG-demo state.
- `DemoHeader` — title, explanatory description, topic tags, mode, `k`, and level indicators.
- `QueryVectorPanel` — question text and vector dimensions/values with readable compact formatting.
- `KnowledgeBasePanel` — exactly ten document cards, with stable IDs D1–D10 and the provided document metadata.
- `RetrievalResults` / `ResultCard` — ranked result cards with the supplied similarity/rank fields and selected-state styling.
- `DashboardPanel` — summary counts and retrieval-stage metrics derived from the static demo data.
- `ExecutionLogPanel` — ordered, readable mock pipeline events.
- `MinHeapPanel` — visual min-heap/selection state for top-k retrieval.
- `PromptPanel` — assembled prompt preview using the supplied query and selected document content.
- `mockData` — typed, in-memory records only; no network or persistence layer.

The two-column work area pairs the query/vector and retrieval controls with the knowledge base. Ranked results follow the retrieval stage; dashboard, execution log, min-heap, and prompt are grouped into clearly labeled supporting panels. Controls are presentation-only unless their behavior is explicitly added as a later scope change.

---

## 6. Project Structure

```text
rag-training-demo/
├── index.html
├── package.json
├── vite.config.ts
├── tsconfig.json
├── tailwind.config.ts
├── postcss.config.js
└── src/
    ├── main.tsx
    ├── App.tsx
    ├── index.css
    ├── data/
    │   └── ragDemo.ts
    ├── components/
    │   ├── DemoHeader.tsx
    │   ├── QueryVectorPanel.tsx
    │   ├── KnowledgeBasePanel.tsx
    │   ├── RetrievalResults.tsx
    │   ├── DashboardPanel.tsx
    │   ├── ExecutionLogPanel.tsx
    │   ├── MinHeapPanel.tsx
    │   └── PromptPanel.tsx
    └── __tests__/
        └── ragDemo.test.tsx
```

---

## 7. Route Definitions

| # | Method | Path | Description | Request Body | Response Body | Status Codes |
|---|--------|------|-------------|-------------|--------------|-------------|
| 1 | — | `/` | Render the single-page RAG training demo; no application API routes | — | Static React page | 200 |

---

## 8. Next Steps

1. After explicit approval, run **azure-project-scaffold** to create the React + Vite + Tailwind frontend and its static mock-data UI.
2. **azure-project-integrate** is not required for this frontend-only plan; there is no backend, database, or API to wire.
3. Use **azure-debug-plan** → **azure-debug-generate** only if local emulator/debug configuration is later requested.
4. Run the **azure-deploy** agent only if Azure hosting or deployment is later requested.
