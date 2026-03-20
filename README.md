# Parking System (ParkEase) — Smart Peer-to-Peer Parking Platform

Full-stack web app that connects drivers (seekers) with private parking space owners. Includes geospatial nearby search (PostGIS), booking + payments (Razorpay), OTP verification, and role-based dashboards (Seeker/Owner/Admin).

## Features (What the project does)

- Nearby parking search using PostGIS (distance/radius queries)
- Location privacy: public map location is shown first, exact location is revealed only after successful payment
- Booking flow: create, confirm, cancel, complete + reviews
- Payments with Razorpay: order creation, signature verification, and refunds
- OTP verification: Twilio integration when configured; in dev it can return OTP in the API response
- Role-based access: Seeker, Owner, Admin with JWT access/refresh tokens
- Admin dashboard: approve owners (KYC) + approve parking listings + view platform stats
- Owner dashboard: manage listings, availability/slots, and incoming bookings
- In-app notifications + optional email notifications (SMTP)
- Docker Compose dev stack (Postgres+PostGIS, Redis, backend, frontend)

## Tech Stack

| Layer | Technology |
|---|---|
| Backend | Python, FastAPI, Uvicorn |
| DB | PostgreSQL + PostGIS |
| Cache | Redis |
| ORM | SQLAlchemy + GeoAlchemy2 |
| Auth | JWT (python-jose) + bcrypt/passlib |
| Payments | Razorpay |
| Frontend | React + Vite + Tailwind CSS |
| Maps | Leaflet + OpenStreetMap (no API key) |

## Setup on another PC (Clone from GitHub)

### Option A — Docker (recommended)

Prerequisites:
- Git
- Docker Desktop (Compose v2)

1) Clone

```bash
git clone https://github.com/ramakrishnan-sp/parking-system.git
cd parking-system
```

2) Create env files

```bash
# Windows (PowerShell)
copy backend\.env.example backend\.env
copy frontend\.env.example frontend\.env

# macOS/Linux
cp backend/.env.example backend/.env
cp frontend/.env.example frontend/.env
```

Edit `backend/.env` for Docker (important differences vs local):

```env
# Use the docker-compose service names
DATABASE_URL=postgresql://parking_user:parking_pass@db:5432/parking_db
REDIS_URL=redis://redis:6379/0

# Required
SECRET_KEY=change-me-min-32-chars
RAZORPAY_KEY_ID=rzp_test_...
RAZORPAY_KEY_SECRET=...
```

Edit `frontend/.env` (recommended defaults):

```env
# Leave empty for LAN-friendly auto-detection:
# the frontend will call http://<current-hostname>:8000
VITE_API_URL=

VITE_RAZORPAY_KEY_ID=rzp_test_...
```

3) Start everything

```bash
docker compose up --build
```

Open:
- Frontend: http://localhost:3000
- Backend API: http://localhost:8000
- API Docs (Swagger): http://localhost:8000/api/docs

Notes:
- The database schema is applied automatically via `database/schema.sql` on first DB start.
- If you want to access from another device on the same Wi‑Fi/LAN, keep `VITE_API_URL` empty (or set it to `http://<your-pc-ip>:8000`).

Stop/reset:

```bash
docker compose down -v
```

### Option B — Local dev (without Docker)

Prerequisites:
- Python 3.11+
- Node.js 18+ (Node 20 recommended)
- PostgreSQL 15 + PostGIS
- Redis 7

1) Database

Create a DB and run the schema:

```bash
psql -U postgres -d parking_db -f database/schema.sql
```

2) Backend

```bash
cd backend
python -m venv .venv
.venv\Scripts\Activate.ps1   # Windows PowerShell
# source .venv/bin/activate   # macOS/Linux
pip install -r requirements.txt

copy .env.example .env        # Windows
# cp .env.example .env        # macOS/Linux
# Edit .env for LOCAL services (typically localhost)

uvicorn app.main:app --reload --port 8000
```

3) Frontend

```bash
cd ..\frontend
npm install

copy .env.example .env
# Set VITE_API_URL=http://localhost:8000 (or leave blank for LAN auto)

npm run dev
```

Frontend runs on http://localhost:3000

## Default Admin Account

Seeded by the DB schema (`database/schema.sql`):

```text
Email:    admin@parkingsystem.com
Password: Admin@1234
```

Change the password before real deployments.

## API Notes

- Base prefix: `/api/v1`
- Health: `/api/health`
- Docs: `/api/docs`

## Environment Variables

- Backend: see `backend/.env.example`
- Frontend: see `frontend/.env.example`

## Project Structure (high level)

```text
parking-system/
    backend/    # FastAPI app (routers, models, services)
    frontend/   # React + Vite app
    database/   # Postgres/PostGIS schema
```

## License

MIT
