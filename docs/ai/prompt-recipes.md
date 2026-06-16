# Prompt Recipes

Use these as starting prompts with Codex, Claude Code, Cursor, Gemini/Antigravity, Cline, Windsurf, or similar tools.

## Implement A Feature

```text
Use AGENTS.md and the implement-feature skill. Confirm the relevant LuminaStudio docs, identify exact files, implement the smallest safe change, add/update tests, run relevant verification, and summarize commands run.
```

## Fix A Bug

```text
Use AGENTS.md and the fix-bug skill. Reproduce or explain the observed failure, trace the root cause from exact source files, make a minimal fix, add a regression test, run verification, and summarize root cause.
```

## Review A PR

```text
Use AGENTS.md and the code-review skill. Review the diff for correctness, architecture boundaries, security, API contracts, type safety, error handling, tests, and maintainability. Findings first with file/line references.
```

## Add Tests

```text
Use AGENTS.md and the write-tests skill. Inspect existing test patterns, add focused coverage for the requested behavior, run the relevant test command, and report coverage gaps.
```

## Update API Contract

```text
Use AGENTS.md and the api-contract-check skill. Compare backend controllers/services/types, frontend API clients, contract tests, and docs/api/ls-web-api_specification.md. Update all affected surfaces.
```

## Review Security

```text
Use AGENTS.md and the security-review skill. Focus on secrets, auth, authorization, Hugging Face token handling, upload validation, logging, provider errors, dependency risk, injection, XSS, and CSRF.
```

## Use Graphify To Find Relevant Files

```text
Use AGENTS.md and the use-context-tools skill. If Graphify is available, use it only to identify likely related files. Then read the exact source files before planning or editing.
```

## Use Aider Repo Map If Available

```text
Use AGENTS.md and the use-context-tools skill. If working in Aider, use the repo map for token-efficient context, then open exact files before edits.
```

## Prepare Release Checklist

```text
Use AGENTS.md and the release-check skill. Check lint, typecheck, tests, build, docs, environment variables, generated files, secrets, and deployment notes. Report commands run and commands skipped.
```
