# Deployment Guide: Vercel + Koyeb/Fly + Neon

## Target architecture

```txt
Frontend  -> Vercel
Backend   -> Koyeb or Fly.io
Database  -> Neon Postgres
```

Use Koyeb if you want the simpler free backend path. Use Fly.io if you prefer its runtime and accept billing/usage-based setup.

## 1. Neon Postgres

Create a Neon project and copy the pooled connection string:

```txt
DATABASE_URL=postgresql://user:password@host.neon.tech/dbname?sslmode=require
```

## 2. Backend on Koyeb

Deploy from `backend/` using the existing Dockerfile.

Required environment variables:

```txt
DEBUG=False
SECRET_KEY=<generate-a-real-secret>
DATABASE_URL=<neon-connection-string>
ALLOWED_HOSTS=<your-koyeb-app>.koyeb.app
CORS_ALLOWED_ORIGINS=https://<your-vercel-app>.vercel.app
CSRF_TRUSTED_ORIGINS=https://<your-vercel-app>.vercel.app
FRONTEND_URL=https://<your-vercel-app>.vercel.app
GITHUB_OAUTH_CLIENT_ID=<github-oauth-client-id>
GITHUB_OAUTH_CLIENT_SECRET=<github-oauth-client-secret>
GITHUB_OAUTH_REDIRECT_URI=https://<your-koyeb-app>.koyeb.app/api/agent/github/oauth/callback/
GITHUB_OAUTH_ALLOWED_ORIGINS=https://<your-vercel-app>.vercel.app
```

Optional:

```txt
OPENROUTER_API_KEY=
GEMINI_API_KEY=
GROQ_API_KEY=
NVIDIA_API_KEY=
REDIS_URL=
```

Health check:

```txt
/api/health/
```

## 3. Backend on Fly.io

Fly config lives in:

```txt
backend/fly.toml
```

Deploy:

```bash
cd backend
flyctl auth login
flyctl apps create <your-backend-app>
flyctl secrets set \
  DEBUG=False \
  SECRET_KEY="$(python - <<'PY'
from django.core.management.utils import get_random_secret_key
print(get_random_secret_key())
PY
)" \
  DATABASE_URL="<neon-connection-string>" \
  ALLOWED_HOSTS="<your-backend-app>.fly.dev" \
  CORS_ALLOWED_ORIGINS="https://<your-vercel-app>.vercel.app" \
  CSRF_TRUSTED_ORIGINS="https://<your-vercel-app>.vercel.app" \
  FRONTEND_URL="https://<your-vercel-app>.vercel.app" \
  GITHUB_OAUTH_CLIENT_ID="<github-oauth-client-id>" \
  GITHUB_OAUTH_CLIENT_SECRET="<github-oauth-client-secret>" \
  GITHUB_OAUTH_REDIRECT_URI="https://<your-backend-app>.fly.dev/api/agent/github/oauth/callback/" \
  GITHUB_OAUTH_ALLOWED_ORIGINS="https://<your-vercel-app>.vercel.app"
flyctl deploy
```

Run admin setup:

```bash
flyctl ssh console
python manage.py createsuperuser
```

## 4. Frontend on Vercel

Deploy `frontend/`.

Required Vercel environment variables:

```txt
NEXT_PUBLIC_API_BASE_URL=https://<your-backend-host>/api
NEXT_PUBLIC_WS_URL=wss://<your-backend-host>
```

The existing `frontend/vercel.json` is enough for Vercel.

## 5. GitHub OAuth callback

In your GitHub OAuth App settings:

```txt
Homepage URL: https://<your-vercel-app>.vercel.app
Authorization callback URL: https://<your-backend-host>/api/agent/github/oauth/callback/
```

Use the same callback URL in `GITHUB_OAUTH_REDIRECT_URI`.

## 6. Local Docker smoke test

```bash
docker compose up --build
```

Local URLs:

```txt
Frontend: http://localhost:3000
Backend:  http://localhost:8000
Health:   http://localhost:8000/api/health/
```
