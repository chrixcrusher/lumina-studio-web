# Free Deployment Guide

This guide deploys LuminaStudio Web with provider-generated URLs and no paid custom domain.

Recommended free-first stack:

- Frontend: Vercel Hobby
- Backend: Render free web service
- Database: MongoDB Atlas Free cluster
- AI restore: user-provided Hugging Face token only

Do not add a platform-owned Hugging Face token. Guests enter their own token during the restore flow, and authenticated users can save an encrypted token from settings.

## Why This Stack

- Vercel is the best fit for the Next.js frontend and has a free Hobby plan for personal projects.
- Render can run the long-lived NestJS backend as a free web service. Free services can sleep when idle, so the first request after inactivity can be slow.
- MongoDB Atlas Free clusters, formerly M0, never expire and are intended for development or small proof-of-concept apps.
- Railway is useful with GitHub Student Developer Pack credits, but its current public pricing is credit/subscription based rather than a simple forever-free backend default.

## 1. Prepare MongoDB Atlas

1. Create a MongoDB Atlas account.
2. Create a Free cluster.
3. Create a database user with a strong generated password.
4. Add network access for deployment.
   - For a quick student/demo deployment, allow `0.0.0.0/0`.
   - For a tighter setup, use provider outbound IP controls if available on your plan.
5. Copy the connection string and replace the username, password, and database name.

Use a database name in the URI:

```text
mongodb+srv://<username>:<password>@<cluster-host>/lumina-studio-web?retryWrites=true&w=majority
```

If a MongoDB URI was ever committed or shared with a real password, rotate that Atlas database user's password before deploying.

## 2. Deploy The Backend On Render

You can use the included `render.yaml` blueprint from the repository root, or create the service manually.

Manual Render settings:

```text
Service type: Web Service
Runtime: Node
Root directory: backend
Build command: npm install && npm run build
Start command: npm run start
Instance type: Free
Health check path: /api/v1/health
```

Environment variables:

```text
NODE_ENV=production
NODE_VERSION=20.18.0
FRONTEND_URL=https://your-vercel-app.vercel.app
MONGODB_URI=mongodb+srv://...
JWT_SECRET=<long random secret>
TOKEN_ENCRYPTION_KEY=<long random secret>
MAX_UPLOAD_SIZE_MB=10
RATE_LIMIT_WINDOW_MS=60000
RATE_LIMIT_MAX_REQUESTS=60
HUGGING_FACE_CODEFORMER_SPACE_URL=https://sczhou-codeformer.hf.space
HUGGING_FACE_CODEFORMER_API_NAME=inference
```

Generate local secrets in PowerShell:

```powershell
node -e "console.log(require('crypto').randomBytes(48).toString('base64'))"
```

After Render deploys, open:

```text
https://your-render-service.onrender.com/api/v1/health
```

Expected result: JSON with `status` set to `ok`.

## 3. Deploy The Frontend On Vercel

Import the same GitHub repository into Vercel.

Project settings:

```text
Framework preset: Next.js
Root directory: frontend
Build command: npm run build
Install command: npm install
Output directory: .next
```

Environment variable:

```text
NEXT_PUBLIC_API_BASE_URL=https://your-render-service.onrender.com
```

Deploy the frontend. Vercel will give you a `vercel.app` URL.

## 4. Connect CORS Both Ways

After Vercel gives you the frontend URL, go back to Render and set:

```text
FRONTEND_URL=https://your-vercel-app.vercel.app
```

Redeploy or restart the Render backend after changing `FRONTEND_URL`.

If you use both Vercel preview and production URLs, this backend supports comma-separated origins:

```text
FRONTEND_URL=https://your-vercel-app.vercel.app,https://your-preview-url.vercel.app
```

## 5. Smoke Test

1. Open the Vercel URL.
2. Upload an image and use browser-side editing.
3. Export the image.
4. Register or log in.
5. Save a preset.
6. Open history and confirm metadata appears.
7. Try AI face restore with your own Hugging Face token.

## Free-Tier Caveats

- Render free services may sleep after inactivity; first requests can be slow.
- MongoDB Atlas Free clusters are for small-scale apps and proofs of concept.
- Provider-generated URLs are expected for the MVP. A custom domain is optional and may cost money.
- Keep all real secrets in provider environment variables only. Never commit `.env` files.

## Useful Links

- Vercel pricing: https://vercel.com/pricing
- Render free services: https://render.com/docs/free
- Render blueprint spec: https://render.com/docs/blueprint-spec
- MongoDB Atlas Free cluster guide: https://www.mongodb.com/docs/atlas/tutorial/deploy-free-tier-cluster/
- Railway pricing: https://railway.com/pricing
