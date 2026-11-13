# RAG Playground

A frontend-only React + TypeScript training demo for a deterministic, keyword-based retrieval-augmented generation flow. Embeddings and similarity scores are calculated locally; the app does not call an API or persist information.

## Component structure

- `DemoHeader`: RAG concept explanation, complexity tags, mode, K selector, and seven interactive scenarios.
- `QueryVectorPanel`: sample question and its eight mock dimension scores.
- `KnowledgeBasePanel`: all ten source documents with similarity and Top-K status.
- `RetrievalResults`: grounded answer and no-RAG hallucination comparison.
- `DashboardPanel`, `ExecutionLogPanel`, `MinHeapPanel`, and `PromptPanel`: retrieval metrics and internal flow.
- `src/data/ragDemo.ts`: shared mock corpus, eight-dimensional document vectors, and scenarios.
- `src/data/ragEngine.ts`: deterministic keyword-vector generation, cosine similarity, thresholding, and min-heap Top-K selection with per-document logs.

Selecting a scenario updates the question input and K value, then runs retrieval. Editing a question requires clicking **開始檢索** to recalculate the vector, similarity scores, Top-K set, prompt, and execution log.

## Run locally

```sh
npm install
npm run dev
```

## Verify

```sh
npm test
npm run build
```

## Deploy to GitHub Pages

Every push to `main` runs the tests, builds the app into `dist/`, and deploys that build to GitHub Pages. The workflow is in `.github/workflows/deploy.yml`; Vite uses the repository path automatically for project pages.

In the repository settings, set **Pages → Build and deployment → Source** to **GitHub Actions**. The first deployment then publishes the generated `dist/` artifact instead of serving `index.html` from the source tree.
