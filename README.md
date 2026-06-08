# LuminaStudio Web

LuminaStudio Web is the browser-first MVP for LuminaStudio.

Source of truth: [`docs/ls-web-tdd.md`](docs/ls-web-tdd.md)

## Local Development

Install dependencies in each app:

```bash
npm install --workspace frontend
npm install --workspace backend
```

Run the frontend:

```bash
npm run dev:frontend
```

Run the backend:

```bash
npm run dev:backend
```

## Verification

```bash
npm run lint
npm run typecheck
npm run test
```
