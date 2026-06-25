# Generated Indexes

This folder contains lightweight generated indexes for LuminaStudio Web source discovery.

Use these files as navigation aids only. They do not replace exact source reads.

Regenerate them with:

```powershell
npm run ai:index
```

Typical outputs:

- `file-map.json`: source files grouped by area and kind.
- `routes.json`: API routes and frontend route files when detected.
- `symbols.json`: exported classes, functions, constants, interfaces, and types.
- `dependency-graph.json`: import relationships.
