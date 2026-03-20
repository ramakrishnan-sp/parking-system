# ParkEase — Smart Peer-to-Peer Parking Platform

A production-ready full-stack web application connecting drivers with private parking space owners. Built with FastAPI, PostgreSQL+PostGIS, React, Google Maps, and Stripe.

---

## Features

- **Nearby parking search** — PostGIS `ST_DWithin` geospatial queries with distance sorting
- **Privacy-first location masking** — Exact GPS coordinates offset by 100–200 m until payment confirmation
- **Stripe payments** — Secure PaymentIntent flow with platform commission (15%) and instant refunds
- **OTP phone verification** — Twilio SMS with fallback dev-mode response
- **Role-based access** — Seeker, Owner, Admin roles with JWT auth and refresh token rotation
- **Admin dashboard** — User KYC approval, parking space approval, bookings overview, revenue analytics
- **Owner dashboard** — Manage spaces, toggle availability, view incoming bookings
- **Email notifications** — SMTP-based booking confirmations and cancellation notices
- **Docker Compose** — One-command local deployment

---

## Tech Stack

| Layer      | Technology                                      |
|------------|-------------------------------------------------|
| Backend    | Python 3.11, FastAPI, Uvicorn                   |
| ORM        | SQLAlchemy 2.0, GeoAlchemy2                     |
| Database   | PostgreSQL 15 + PostGIS 3.3                     |
| Cache      | Redis 7                                         |
| Auth       | python-jose JWT, passlib bcrypt                 |
| Payments   | Stripe Python SDK                               |
| SMS        | Twilio                                          |
| Frontend   | React, Vite, Tailwind CSS, React Router        |
| State      | Zustand (persisted)                             |
| Maps       | Leaflet + OpenStreetMap (free, no API key)      |
| Containers | Docker Compose                                  |

---

## Quick Start (Docker)

### Prerequisites
- Docker Desktop with Compose v2
- A Razorpay account (test keys)
- (Optional) Twilio account for SMS OTP

### 1. Clone and configure

```bash
git clone https://github.com/yourname/parkease.git
cd parkease
cp backend/.env.example backend/.env
cp frontend/.env.example frontend/.env
```

Edit `backend/.env` with your credentials:

```env
DATABASE_URL=postgresql://parking_user:parking_password@db:5432/parking_db
REDIS_URL=redis://redis:6379
SECRET_KEY=your-super-secret-key-at-least-32-chars
STRIPE_SECRET_KEY=sk_test_...
STRIPE_WEBHOOK_SECRET=whsec_...
TWILIO_ACCOUNT_SID=ACxxxxx
TWILIO_AUTH_TOKEN=xxxxx
TWILIO_PHONE_NUMBER=+1xxxxxxxxxx
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_USER=you@gmail.com
SMTP_PASSWORD=app-password
```

Edit `frontend/.env`:

```env
VITE_API_URL=http://localhost:8000
VITE_RAZORPAY_KEY_ID=rzp_test_...
```

### 2. Run with Docker

```bash
docker compose up --build
```

| Service  | URL                          |
|----------|------------------------------|
| Frontend | http://localhost:3000        |
| Backend  | http://localhost:8000        |
| API Docs | http://localhost:8000/api/docs |
| PgAdmin  | http://localhost:5432 (psql) |

The database schema is applied automatically on first startup.

### 3. Default admin account

```
Email:    admin@parkingsystem.com
Password: Admin@1234
```

> **Change this immediately in production.**

---

## Local Development (without Docker)

### Backend

```bash
cd backend
python -m venv .venv
.venv\Scripts\activate          # Windows
# source .venv/bin/activate     # macOS/Linux

pip install -r requirements.txt
cp .env.example .env            # Fill in values

# Ensure PostgreSQL with PostGIS is running locally
# Run schema once:
psql -U postgres -d parking_db -f ../database/schema.sql

uvicorn app.main:app --reload --port 8000
```

### Frontend

```bash
cd frontend
npm install
cp .env.example .env   # Fill in values
npm run dev
```

---

## Project Structure

```
parking-system/
├── docker-compose.yml
├── database/
│   └── schema.sql              # Full PostgreSQL+PostGIS schema
├── backend/
│   ├── Dockerfile
│   ├── requirements.txt
│   ├── .env.example
│   └── app/
│       ├── main.py             # FastAPI app entry, middleware, router registration
│       ├── config.py           # Pydantic Settings
│       ├── database.py         # SQLAlchemy engine + get_db dependency
│       ├── models/             # SQLAlchemy ORM models
│       ├── schemas/            # Pydantic request/response schemas
│       ├── routers/            # Route handlers (auth, parking, booking, payment, admin, users)
│       ├── services/           # OTP, payment, notification services
│       └── utils/              # Security (JWT), geolocation, file upload
└── frontend/
    ├── index.html
    ├── package.json
    ├── vite.config.js
    ├── tailwind.config.js
    └── src/
        ├── main.jsx            # App entry
        ├── App.jsx             # Router + layout
        ├── api/                # Axios API clients
        ├── store/              # Zustand auth store
        ├── components/
        │   ├── common/         # Navbar, Modal, ProtectedRoute, FileUpload, LoadingSpinner
        │   ├── map/            # MapContainer, ParkingCard, SearchPanel
        │   ├── booking/        # BookingForm, BookingCard
        │   ├── owner/          # ParkingForm
        │   └── admin/          # AdminStats, UserTable, ParkingTable
        └── pages/              # Home, Login, Register, ParkingMap, BookingPage,
                                # BookingConfirmation, OwnerDashboard, AdminDashboard, Profile
```

---

## API Overview

All endpoints are prefixed with `/api/v1`.

| Method | Path | Description |
|--------|------|-------------|
| POST | `/auth/otp/send` | Send OTP to phone |
| POST | `/auth/otp/verify` | Verify OTP |
| POST | `/auth/register/seeker` | Register seeker (multipart) |
| POST | `/auth/register/owner` | Register owner (multipart) |
| POST | `/auth/login` | Login → JWT tokens |
| POST | `/auth/refresh` | Rotate refresh token |
| POST | `/auth/logout` | Revoke refresh token |
| GET | `/auth/me` | Current user profile |
| GET | `/parking/nearby` | Search nearby spaces (PostGIS) |
| POST | `/parking/` | Create parking space (owner) |
| GET | `/parking/owner/my-spaces` | Owner's spaces (exact coords) |
| POST | `/bookings/` | Create booking |
| GET | `/bookings/my` | Seeker's bookings |
| POST | `/bookings/{id}/cancel` | Cancel booking |
| POST | `/bookings/{id}/review` | Submit review |
| POST | `/payments/intent` | Create Stripe PaymentIntent |
| POST | `/payments/confirm` | Confirm payment, reveal location |
| POST | `/payments/refund` | Refund |
| POST | `/payments/webhook` | Stripe webhook |
| GET | `/admin/stats` | Platform statistics |
| POST | `/admin/owners/{id}/approve` | Approve owner KYC |
| POST | `/admin/parking/{id}/approve` | Approve parking listing |

Full interactive docs: `http://localhost:8000/docs`

---

## Security Notes

- Refresh tokens are stored as SHA-256 hashes — never plaintext
- Parking exact GPS coordinates are **only** returned in booking responses after `location_revealed = True` (set by payment confirmation)
- Rate limiting via `slowapi` on all endpoints
- File uploads validated by MIME type and size before writing to disk
- All DB queries use parameterized statements (SQLAlchemy ORM)

---

## Environment Variables Reference

See [`backend/.env.example`](backend/.env.example) and [`frontend/.env.example`](frontend/.env.example) for full variable lists.
No map API key required — the map uses Leaflet + OpenStreetMap tiles, which are completely free.

---

## License

MIT
