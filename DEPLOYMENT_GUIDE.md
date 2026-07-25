# Deployment Guide: Vercel + Hostinger VPS + Neon

## Target architecture

```txt
Frontend  -> Vercel
Backend   -> Hostinger VPS
Database  -> Neon Postgres
```

The backend is hosted on a Hostinger VPS. We use `deploy.sh` and `run_vps.sh` scripts for deployment.

## 1. Neon Postgres

Create a Neon project and copy the pooled connection string:

```txt
DATABASE_URL=postgresql://user:password@host.neon.tech/dbname?sslmode=require
```

## 2. Backend on Hostinger VPS

The backend is deployed via SSH on a Hostinger VPS.
Use the provided `run_vps.sh` script to deploy, or SSH into the VPS and run `./deploy.sh`.

## 3. Deployment Scripts

Use `run_vps.sh` from the root directory to initiate deployment to the Hostinger VPS.
This script connects via SSH, pulls the latest code, and runs `deploy.sh` to rebuild the Docker containers.

## 4. Frontend on Vercel

Deploy `frontend/`.

Required Vercel environment variables:

```txt
NEXT_PUBLIC_API_BASE_URL=https://api.skilledeagle.tech/api
NEXT_PUBLIC_WS_URL=wss://api.skilledeagle.tech
```

The existing `frontend/vercel.json` is enough for Vercel.

## 5. GitHub OAuth callback

In your GitHub OAuth App settings:

```txt
Homepage URL: https://<your-vercel-app>.vercel.app
Authorization callback URL: https://api.skilledeagle.tech/api/agent/github/oauth/callback/
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
