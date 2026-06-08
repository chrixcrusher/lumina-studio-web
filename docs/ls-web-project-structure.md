# LuminaStudio Web
## MVP Project Structure
Version 1.0

Source of truth: `ls-web-tdd.md`

---

# Philosophy

This structure is optimized for:

- Browser-first image editing
- Free-tier-friendly deployment where possible
- Clear frontend/backend separation
- AI-assisted development
- Testability
- Future desktop separation without adding desktop concerns to the Web MVP

Core architecture:

```text
Frontend -> Backend API -> MongoDB
Frontend -> Backend API -> Hugging Face
```

Manual editing, filters, transforms, text overlay, and export run in the browser. The backend handles authentication, optional encrypted Hugging Face token storage, preset persistence, metadata-only history, and the AI restore proxy.

---

# Repository Structure

```text
lumina-studio-web/
|-- frontend/
|-- backend/
|-- docs/
|-- .ai/
|-- .github/
|-- scripts/
|-- AGENTS.md
|-- README.md
`-- CHANGELOG.md
```

---

# Frontend Structure

```text
frontend/
|-- public/
|-- src/
|   |-- app/
|   |   |-- (marketing)/
|   |   |-- (workspace)/
|   |   |-- auth/
|   |   |-- presets/
|   |   |-- history/
|   |   |-- layout.tsx
|   |   |-- page.tsx
|   |   |-- loading.tsx
|   |   `-- error.tsx
|   |
|   |-- domains/
|   |   |-- authentication/
|   |   |   |-- components/
|   |   |   |-- hooks/
|   |   |   |-- services/
|   |   |   |-- types/
|   |   |   `-- tests/
|   |   |
|   |   |-- account/
|   |   |   |-- components/
|   |   |   |-- hooks/
|   |   |   |-- services/
|   |   |   |-- types/
|   |   |   `-- tests/
|   |   |
|   |   |-- editor/
|   |   |   |-- canvas/
|   |   |   |-- adjustments/
|   |   |   |-- filters/
|   |   |   |-- crop/
|   |   |   |-- rotate/
|   |   |   |-- flip/
|   |   |   |-- text-overlay/
|   |   |   |-- histogram/
|   |   |   |-- export/
|   |   |   |-- components/
|   |   |   |-- hooks/
|   |   |   |-- services/
|   |   |   |-- types/
|   |   |   `-- tests/
|   |   |
|   |   |-- enhancement/
|   |   |   |-- components/
|   |   |   |-- hooks/
|   |   |   |-- services/
|   |   |   |-- types/
|   |   |   `-- tests/
|   |   |
|   |   |-- presets/
|   |   |-- history/
|   |   `-- landing/
|   |
|   |-- shared/
|   |   |-- components/
|   |   |-- hooks/
|   |   |-- services/
|   |   |-- types/
|   |   |-- constants/
|   |   `-- utils/
|   |
|   |-- infrastructure/
|   |   |-- api/
|   |   |-- auth/
|   |   |-- session/
|   |   `-- configuration/
|   |
|   `-- tests/
|       |-- unit/
|       |-- integration/
|       `-- e2e/
|
|-- package.json
|-- next.config.ts
`-- tsconfig.json
```

Frontend dependency direction:

```text
Page -> Domain Component -> Hook -> Service -> API Client
```

Forbidden:

```text
Frontend -> MongoDB
Frontend -> Hugging Face
```

---

# Backend Structure

```text
backend/
|-- src/
|   |-- main.ts
|   |-- app.module.ts
|   |
|   |-- domains/
|   |   |-- auth/
|   |   |   |-- controllers/
|   |   |   |-- services/
|   |   |   |-- dto/
|   |   |   |-- validators/
|   |   |   |-- exceptions/
|   |   |   |-- tests/
|   |   |   `-- auth.module.ts
|   |   |
|   |   |-- account/
|   |   |   |-- controllers/
|   |   |   |-- services/
|   |   |   |-- dto/
|   |   |   |-- tests/
|   |   |   `-- account.module.ts
|   |   |
|   |   |-- ai/
|   |   |   |-- controllers/
|   |   |   |-- services/
|   |   |   |-- dto/
|   |   |   |-- validators/
|   |   |   |-- providers/
|   |   |   |-- tests/
|   |   |   `-- ai.module.ts
|   |   |
|   |   |-- history/
|   |   |-- presets/
|   |   `-- session/
|   |
|   |-- integrations/
|   |   `-- huggingface/
|   |       |-- huggingface.client.ts
|   |       |-- codeformer.provider.ts
|   |       `-- types/
|   |
|   |-- persistence/
|   |   |-- mongodb/
|   |   |   |-- schemas/
|   |   |   |-- indexes/
|   |   |   `-- connection.ts
|   |   `-- repositories/
|   |       |-- account.repository.ts
|   |       |-- history.repository.ts
|   |       `-- preset.repository.ts
|   |
|   |-- common/
|   |   |-- guards/
|   |   |-- interceptors/
|   |   |-- middleware/
|   |   |-- filters/
|   |   |-- decorators/
|   |   |-- constants/
|   |   `-- utils/
|   |
|   |-- contracts/
|   |   |-- api/
|   |   |-- requests/
|   |   `-- responses/
|   |
|   |-- config/
|   |
|   `-- tests/
|       |-- unit/
|       |-- integration/
|       |-- contract/
|       `-- e2e/
|
|-- package.json
|-- nest-cli.json
`-- tsconfig.json
```

Backend dependency direction:

```text
Controller -> Service -> Repository -> MongoDB
AI Service -> Hugging Face Client -> Hugging Face API
```

Forbidden:

```text
Controller -> MongoDB
Controller -> External APIs
Frontend -> MongoDB
Frontend -> Hugging Face
```

---

# Documentation Structure

The current docs folder is intentionally flat while the project is still in planning:

```text
docs/
|-- AGENTS.md
|-- ls-web-api_specification.md
|-- ls-web-database-schema.md
|-- ls-web-dfd.md
|-- ls-web-erd.md
|-- ls-web-flowchart.md
|-- ls-web-project-structure.md
|-- ls-web-ps-detailed.md
|-- ls-web-tdd.md
`-- ls-web-ufd.md
```

Canonical order:

1. `ls-web-tdd.md`
2. `ls-web-api_specification.md`
3. `ls-web-database-schema.md`
4. `ls-web-project-structure.md`
5. Diagram and flow docs
6. `AGENTS.md`

Future versions may split docs into `architecture/`, `api/`, `database/`, `workflows/`, `decisions/`, and `standards/` folders after implementation begins.

---

# AI Development Layer

```text
.ai/
|-- agents/
|   |-- frontend-agent.md
|   |-- backend-agent.md
|   |-- database-agent.md
|   |-- testing-agent.md
|   `-- architecture-agent.md
|
|-- prompts/
|   |-- feature-implementation.md
|   |-- bug-fix.md
|   |-- refactoring.md
|   `-- code-review.md
|
`-- rules/
    |-- architecture-rules.md
    |-- dependency-rules.md
    `-- security-rules.md
```

---

# Deployment Shape

Free-tier-first target:

```text
Frontend: Vercel or Cloudflare Pages
Backend: Render, Koyeb, Railway, or another Node.js-compatible host
Database: MongoDB Atlas free tier where possible
DNS/CDN: Cloudflare free tier when using a custom domain
Domain: Optional paid custom domain
```

The application must be able to run without a paid domain by using provider-generated URLs.

---

# Why This Structure

1. Browser-side editing reduces backend cost.
2. User-provided Hugging Face tokens avoid platform-owned AI token costs.
3. Metadata-only history avoids storage costs in the MVP.
4. Frontend and backend can deploy independently.
5. Domains remain understandable for AI-assisted development.
6. Desktop/offline AI work remains outside the Web MVP.

This is the recommended MVP structure for LuminaStudio Web.
