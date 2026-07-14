# ⚡ Quick Start Guide

## Option 1: Local Development (Docker Compose) — 5 minutes

### Prerequisites
- Docker & Docker Compose installed
- Code pushed to GitHub

### Run Everything
```bash
cd /path/to/project
docker-compose up

# Wait for "✓ Compiled successfully"
```

### Access
- **Frontend:** http://localhost:3000
- **Backend API:** http://localhost:8000/api
- **Django Admin:** http://localhost:8000/admin

### Test Flow
1. http://localhost:3000/register → Create account
2. Login → See dashboard
3. http://localhost:8000/admin → Login with superuser

### Stop
```bash
docker-compose down

# Remove database (fresh start):
docker-compose down -v
```

---

## Option 2: Manual Local Setup (No Docker)

### Backend
```bash
cd backend

# Create virtual environment
python -m venv venv
source venv/bin/activate  # On Windows: venv\Scripts\activate

# Install dependencies
pip install -r requirements.txt

# Configure PostgreSQL or SQLite
# For SQLite (dev only): set DATABASE_URL in .env
cp .env.example .env

# Run migrations
python manage.py makemigrations
python manage.py migrate

# Create superuser
python manage.py createsuperuser

# Run server
python manage.py runserver
```

### Frontend (New Terminal)
```bash
cd frontend

# Install dependencies
npm install

# Run dev server
npm run dev
```

---

## Option 3: Production Deployment (Fly.io + Vercel) — 20 minutes

See `DEPLOYMENT_GUIDE.md` for step-by-step instructions.

---

## Project Structure

```
Project name/
├── backend/                    # Django project
│   ├── config/                 # Settings, urls
│   ├── apps/
│   │   └── accounts/          # Auth (models, views, serializers)
│   ├── Dockerfile             # Docker image for backend
│   ├── fly.toml               # Fly.io config
│   ├── requirements.txt        # Python dependencies
│   └── manage.py
│
├── frontend/                   # Next.js project
│   ├── src/
│   │   ├── app/               # Pages (login, register, dashboard)
│   │   ├── lib/               # API client (auth-client.ts)
│   │   ├── hooks/             # useAuth hook
│   │   └── types/             # TypeScript interfaces
│   ├── Dockerfile             # Docker image for frontend
│   ├── vercel.json            # Vercel config
│   └── package.json
│
├── docker-compose.yml         # Local dev environment
├── DEPLOYMENT_GUIDE.md        # How to deploy
├── IMPLEMENTATION_SUMMARY.md  # What was built
└── QUICK_START.md            # This file
```

---

## Common Commands

### Backend
```bash
# Make migrations
python manage.py makemigrations

# Apply migrations
python manage.py migrate

# Create superuser
python manage.py createsuperuser

# Run tests
python manage.py test

# Django shell
python manage.py shell

# Collect static files (production)
python manage.py collectstatic --noinput
```

### Frontend
```bash
# Install dependencies
npm install

# Run dev server
npm run dev

# Build for production
npm run build

# Run production build
npm start

# Run linting
npm run lint
```

### Docker Compose
```bash
# Start all services
docker-compose up

# Start in background
docker-compose up -d

# View logs
docker-compose logs -f

# Stop all services
docker-compose down

# Remove volumes (database)
docker-compose down -v

# Rebuild images
docker-compose up --build
```

---

## Environment Variables

### Backend (.env)
```
DEBUG=False
SECRET_KEY=...
DATABASE_URL=postgresql://...
ALLOWED_HOSTS=...
CORS_ALLOWED_ORIGINS=...
```

### Frontend (.env.local)
```
NEXT_PUBLIC_API_BASE_URL=http://localhost:8000/api
```

---

## Testing

### Create Test Account
```bash
# Via frontend
http://localhost:3000/register
Email: test@example.com
Password: TestPassword123

# Via API (cURL)
curl -X POST http://localhost:8000/api/auth/register/ \
  -H "Content-Type: application/json" \
  -d '{
    "email": "test@example.com",
    "username": "testuser",
    "password": "TestPassword123",
    "password2": "TestPassword123"
  }'
```

### Login
```bash
# Frontend
http://localhost:3000/login

# API
curl -X POST http://localhost:8000/api/auth/login/ \
  -H "Content-Type: application/json" \
  -d '{
    "email": "test@example.com",
    "password": "TestPassword123"
  }'
```

### Get Current User
```bash
curl -H "Authorization: Bearer <access_token>" \
  http://localhost:8000/api/auth/me/
```

---

## Troubleshooting

### "Connection refused" on frontend
→ Backend not running? Start it: `python manage.py runserver`

### Docker permission denied
```bash
# Add user to docker group
sudo usermod -aG docker $USER
newgrp docker
```

### Port already in use
```bash
# Backend on 8001 instead
python manage.py runserver 8001

# Frontend on 3001 instead
PORT=3001 npm run dev
```

### Database errors
```bash
# Reset database (remove all data)
docker-compose down -v
docker-compose up  # Fresh database
```

---

## Next Steps

1. ✅ Run locally with Docker Compose
2. ✅ Test register → login → dashboard flow
3. ✅ Review Django Admin at /admin
4. 🚀 Deploy to Fly.io + Vercel (see DEPLOYMENT_GUIDE.md)
5. 🎉 Share your app!

---

## Need Help?

- Django Docs: https://docs.djangoproject.com
- Next.js Docs: https://nextjs.org/docs
- Fly.io Docs: https://fly.io/docs
- Vercel Docs: https://vercel.com/docs

