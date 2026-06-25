# Scripts

Project automation for LuminaStudio Web and the adopted AI structure.

## Available Scripts

| Script | Purpose |
| --- | --- |
| `generate-ai-index.mjs` | Regenerates `.ai/index/*.json` discovery files for source files, routes, symbols, and dependency relationships. |
| `deployment-smoke.mjs` | Runs deployment smoke checks where configured. |
| `sync-ai-adapters.ps1` | Preferred target-aware sync for Claude, Codex, Cursor, Copilot, OpenCode, Aider, Cline, Kilo, Windsurf, Antigravity, and OpenHands adapters from canonical `.agents/` sources. |
| `generate-ai-adapters.ps1` | Compatibility wrapper that runs `sync-ai-adapters.ps1 -Target all`. |
| `validate-ai-template.ps1` | Validates canonical AI role metadata, core workflow skill presence, skill frontmatter, routing-map skill references, generated adapter formatting, and source notices. |

## Project Verification

Use npm scripts from the repository root:

```powershell
npm run lint
npm run typecheck
npm run test
npm run build
npm run verify
```

Frontend e2e tests:

```powershell
npm run test:e2e --workspace frontend
```

## AI Indexes

Regenerate lightweight local context indexes after adding, moving, or deleting source files, routes, exported symbols, or imports:

```powershell
npm run ai:index
```

The generated files live under `.ai/index/` and are navigation aids only.

## Adapter Sync

After canonical `.agents/` role, skill, overlay, workflow, or tool-policy changes:

```powershell
pwsh scripts/validate-ai-template.ps1
pwsh scripts/sync-ai-adapters.ps1 -Target all
pwsh scripts/validate-ai-template.ps1
```

Use `pwsh` for cross-platform consistency. `scripts/generate-ai-adapters.ps1` remains a compatibility wrapper for older workflows.

Do not add destructive scripts without explicit safeguards and documentation.
