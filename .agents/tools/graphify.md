# Graphify Guidance

Graphify is useful for codebase navigation, dependency discovery, and module relationship exploration.

## Use When

- You need a quick map of related files.
- You are onboarding to an unfamiliar area.
- You want to identify likely call paths before reading source.

## Do Not Use When

- You need exact implementation details.
- You are deciding final behavior.
- The graph is stale or generated before recent changes.

## Suggested Commands

Graphify is installed in this repo as `@sentropic/graphify`.

Run it through the local package binary:

```text
npx graphify --help
node_modules/.bin/graphify --version
```

Generate output into an ignored directory such as:

```text
graphify-out/
.graphify/
```

Use the tool's current documentation for exact graph generation and query syntax.

## Generated Output Policy

Do not commit large generated graph output by default. Regenerate it when source changes meaningfully.

## Staleness Risk

Graphs can miss dynamic relationships, generated files, runtime configuration, and recent edits. Read exact files before editing.

## .gitignore Recommendation

Keep `graphify-out/` and `.graphify/` ignored.
