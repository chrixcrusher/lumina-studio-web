# AI Setup Maintenance

## Update Rules

Update `AGENTS.md` first when project-wide behavior changes. Keep adapter files (`CLAUDE.md`, `GEMINI.md`, `.cursor/rules`, `.clinerules`, `.windsurfrules`) short and pointing back to `AGENTS.md`.

## Add A New Skill

1. Create `.agents/skills/<skill-name>/SKILL.md`.
2. Add frontmatter with `name` and `description`.
3. Keep the workflow concrete and command-aware.
4. Add the skill to `AGENTS.md` and `.ai/maps/agent-map.md` if broadly useful.

## Add A New Role

1. Create `.agents/roles/<role-name>.md`.
2. Include purpose, responsibilities, what to inspect first, what not to do, expected output, and handoff notes.
3. Add a Claude subagent only if Claude Code needs that role.
4. Update `.ai/maps/agent-map.md`.

## Update Verification Commands

When `package.json` scripts change, update:

- `AGENTS.md`
- `.agents/tools/verification-commands.md`
- `.cursor/rules/30-testing.mdc`
- Relevant setup docs.

## Update Context Maps

When routes, schemas, ownership rules, deployment shape, test layout, or major workflows change, update the matching map in `.ai/maps/`.

Keep maps compact. They should help agents find exact files, not restate full canonical docs.

## Regenerate Lightweight Indexes

Run this after adding, moving, or deleting source files, routes, exported symbols, or imports:

```powershell
npm run ai:index
```

Review `.ai/index/routes.json` after API changes and `.ai/index/dependency-graph.json` after cross-module refactors.

## Regenerate Context Tool Outputs

Regenerate Graphify, Understand Anything, repo map, or Repomix outputs only when needed for navigation or sharing context. Do not commit large generated outputs by default.

Ignored generated paths include:

- `graphify-out/`
- `.graphify/`
- `.understand-anything/`
- `repomix-output.*`
- `.repo-map/`

## Review Drift

When the TDD changes, check whether API, database, diagram, flow, project structure, AI setup, and agent rules need updates too.
