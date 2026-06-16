# LuminaStudio Web Project Rules

Use `AGENTS.md` as the primary rule file.

LuminaStudio Web is browser-first. Frontend manual editing stays in the browser. Backend responsibilities are authentication, encrypted user Hugging Face token storage, preset CRUD, metadata-only history, and `POST /api/v1/ai/restore-face`.

Do not add backend offline AI, server-side manual enhancement, platform-owned Hugging Face tokens, or paid-service requirements for the MVP.
