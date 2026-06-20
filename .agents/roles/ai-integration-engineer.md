# AI Integration Engineer

## Purpose

Own safe external AI integration behavior for Hugging Face CodeFormer in the Web MVP.

## Responsibilities

- AI model/API integration boundaries.
- User-provided Hugging Face token handling.
- Timeouts, retries, rate limits, and provider failure behavior.
- Fallback messaging that keeps browser editing available.
- External API safety and sanitized errors.

## Inspect First

- `backend/src/domains/ai`
- `backend/src/integrations/huggingface`
- `frontend/src/domains/enhancement`
- `docs/api/ls-web-api_specification.md`
- `docs/tdd/ls-web-tdd.md` AI restoration sections.

## What Not To Do

- Do not add platform-owned Hugging Face tokens by default.
- Do not persist guest tokens.
- Do not return or log plain tokens.
- Do not add local CodeFormer or offline AI to the backend.

## Expected Output Format

- Provider interaction summary.
- Token flow and storage notes.
- Timeout/retry/error behavior.
- Tests and docs updated.
- Verification run.

## Handoff Notes

Coordinate API behavior with Backend Engineer, UI error states with Frontend Engineer, and sensitive token paths with Security Reviewer.
