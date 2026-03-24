-- ============================================================
--  Smart Peer-to-Peer Parking Platform – Database Schema
--  PostgreSQL 15 + PostGIS 3.3
-- ============================================================

-- Extensions
CREATE EXTENSION IF NOT EXISTS postgis;
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS pg_trgm;   -- fuzzy text search

-- ============================================================
--  USERS
-- ============================================================
CREATE TABLE users (
    id               UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    full_name        VARCHAR(255)  NOT NULL,
    email            VARCHAR(255)  UNIQUE NOT NULL,
    phone            VARCHAR(20)   UNIQUE NOT NULL,
    password_hash    VARCHAR(255)  NOT NULL,
    user_type        VARCHAR(10)   NOT NULL CHECK (user_type IN ('user','seeker','owner','admin')),
    is_verified      BOOLEAN       NOT NULL DEFAULT FALSE,
    is_active        BOOLEAN       NOT NULL DEFAULT TRUE,
    profile_photo_url VARCHAR(500),
    is_seeker        BOOLEAN       NOT NULL DEFAULT TRUE,
    is_owner         BOOLEAN       NOT NULL DEFAULT FALSE,
    created_at       TIMESTAMPTZ   NOT NULL DEFAULT NOW(),
    updated_at       TIMESTAMPTZ   NOT NULL DEFAULT NOW()
);

-- ============================================================
--  SEEKER PROFILES (Parking Seekers / Drivers)
-- ============================================================
CREATE TABLE seeker_profiles (
    id                      UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id                 UUID UNIQUE NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    residential_address     TEXT,
    aadhaar_number          VARCHAR(12),
    driving_license_number  VARCHAR(20),
    license_proof_url       VARCHAR(500),
    aadhaar_proof_url       VARCHAR(500),
    vehicle_number          VARCHAR(20),
    vehicle_type            VARCHAR(10)  CHECK (vehicle_type IN ('car','bike','ev')),
    verification_status     VARCHAR(10)  NOT NULL DEFAULT 'pending'
                               CHECK (verification_status IN ('pending','approved','rejected')),
    rejection_reason        TEXT,
    created_at              TIMESTAMPTZ  NOT NULL DEFAULT NOW(),
    updated_at              TIMESTAMPTZ  NOT NULL DEFAULT NOW()
);

-- ============================================================
--  OWNER PROFILES (Parking Space Owners)
-- ============================================================
CREATE TABLE owner_profiles (
    id                   UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id              UUID UNIQUE NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    residential_address  TEXT,
    govt_id_proof_url    VARCHAR(500),
    aadhaar_proof_url    VARCHAR(500),
    aadhaar_number       VARCHAR(12),
    property_address     TEXT,
    property_type        VARCHAR(20)  CHECK (property_type IN ('house','apartment','shop','office')),
    verification_status  VARCHAR(10)  NOT NULL DEFAULT 'pending'
                            CHECK (verification_status IN ('pending','approved','rejected')),
    rejection_reason     TEXT,
    bank_account_number  VARCHAR(20),
    bank_ifsc_code       VARCHAR(15),
    stripe_account_id    VARCHAR(100),
    created_at           TIMESTAMPTZ  NOT NULL DEFAULT NOW(),
    updated_at           TIMESTAMPTZ  NOT NULL DEFAULT NOW()
);

-- ============================================================
--  PARKING SPACES
-- ============================================================
CREATE TABLE parking_spaces (
    id                   UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    owner_id             UUID         NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    title                VARCHAR(255) NOT NULL,
    description          TEXT,
    price_per_hour       NUMERIC(10,2) NOT NULL CHECK (price_per_hour > 0),
    total_slots          INTEGER       NOT NULL DEFAULT 1 CHECK (total_slots > 0),
    available_slots      INTEGER       NOT NULL DEFAULT 1,
    -- PostGIS geometry columns
    exact_location       GEOMETRY(POINT, 4326) NOT NULL,
    public_location      GEOMETRY(POINT, 4326) NOT NULL,
    -- Denormalised lat/lng for quick access
    exact_latitude       DOUBLE PRECISION NOT NULL,
    exact_longitude      DOUBLE PRECISION NOT NULL,
    public_latitude      DOUBLE PRECISION NOT NULL,
    public_longitude     DOUBLE PRECISION NOT NULL,
    vehicle_type_allowed VARCHAR(10)  NOT NULL DEFAULT 'all'
                            CHECK (vehicle_type_allowed IN ('car','bike','ev','all')),
    property_type        VARCHAR(20),
    amenities            JSONB        NOT NULL DEFAULT '[]',
    availability_schedule JSONB       NOT NULL DEFAULT '{}',
    is_active            BOOLEAN      NOT NULL DEFAULT TRUE,
    is_approved          BOOLEAN      NOT NULL DEFAULT FALSE,
    avg_rating           NUMERIC(3,2) DEFAULT 0,
    total_reviews        INTEGER      DEFAULT 0,
    created_at           TIMESTAMPTZ  NOT NULL DEFAULT NOW(),
    updated_at           TIMESTAMPTZ  NOT NULL DEFAULT NOW(),
    CONSTRAINT available_lte_total CHECK (available_slots <= total_slots),
    CONSTRAINT available_gte_zero  CHECK (available_slots >= 0)
);

-- ============================================================
--  PARKING PHOTOS
-- ============================================================
CREATE TABLE parking_photos (
    id          UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    parking_id  UUID         NOT NULL REFERENCES parking_spaces(id) ON DELETE CASCADE,
    photo_url   VARCHAR(500) NOT NULL,
    is_primary  BOOLEAN      NOT NULL DEFAULT FALSE,
    created_at  TIMESTAMPTZ  NOT NULL DEFAULT NOW()
);

-- ============================================================
--  OTP VERIFICATIONS
-- ============================================================
CREATE TABLE otp_verifications (
    id         UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    phone      VARCHAR(20)  NOT NULL,
    otp        VARCHAR(10)  NOT NULL,
    purpose    VARCHAR(20)  NOT NULL DEFAULT 'registration'
                  CHECK (purpose IN ('registration','login','password_reset')),
    is_used    BOOLEAN      NOT NULL DEFAULT FALSE,
    attempts   INTEGER      NOT NULL DEFAULT 0,
    expires_at TIMESTAMPTZ  NOT NULL,
    created_at TIMESTAMPTZ  NOT NULL DEFAULT NOW()
);

-- ============================================================
--  BOOKINGS
-- ============================================================
CREATE TABLE bookings (
    id                UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id           UUID         NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    parking_id        UUID         NOT NULL REFERENCES parking_spaces(id),
    start_time        TIMESTAMPTZ  NOT NULL,
    end_time          TIMESTAMPTZ  NOT NULL,
    purpose           VARCHAR(20)  NOT NULL
                         CHECK (purpose IN ('office','shopping','event',
                                            'residential_visit','short_stay',
                                            'long_stay','other')),
    total_hours       NUMERIC(8,2) NOT NULL,
    total_amount      NUMERIC(10,2) NOT NULL,
    platform_commission NUMERIC(10,2) NOT NULL DEFAULT 0,
    owner_payout      NUMERIC(10,2) NOT NULL DEFAULT 0,
    payment_status    VARCHAR(10)  NOT NULL DEFAULT 'pending'
                         CHECK (payment_status IN ('pending','paid','refunded','failed')),
    booking_status    VARCHAR(15)  NOT NULL DEFAULT 'pending'
                         CHECK (booking_status IN ('pending','confirmed','active',
                                                    'completed','cancelled')),
    location_revealed BOOLEAN      NOT NULL DEFAULT FALSE,
    cancellation_reason TEXT,
    stripe_payment_intent_id VARCHAR(100),
    created_at        TIMESTAMPTZ  NOT NULL DEFAULT NOW(),
    updated_at        TIMESTAMPTZ  NOT NULL DEFAULT NOW(),
    CONSTRAINT end_after_start CHECK (end_time > start_time)
);

-- ============================================================
--  PAYMENTS
-- ============================================================
CREATE TABLE payments (
    id                    UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    booking_id            UUID         NOT NULL REFERENCES bookings(id) ON DELETE CASCADE,
    user_id               UUID         NOT NULL REFERENCES users(id),
    amount                NUMERIC(10,2) NOT NULL,
    currency              VARCHAR(5)   NOT NULL DEFAULT 'INR',
    payment_gateway       VARCHAR(20)  NOT NULL DEFAULT 'stripe',
    gateway_payment_id    VARCHAR(255),
    gateway_order_id      VARCHAR(255),
    payment_status        VARCHAR(10)  NOT NULL DEFAULT 'pending'
                             CHECK (payment_status IN ('pending','success','failed','refunded')),
    refund_id             VARCHAR(255),
    refund_amount         NUMERIC(10,2),
    refund_reason         TEXT,
    metadata              JSONB        DEFAULT '{}',
    created_at            TIMESTAMPTZ  NOT NULL DEFAULT NOW(),
    updated_at            TIMESTAMPTZ  NOT NULL DEFAULT NOW()
);

-- ============================================================
--  NOTIFICATIONS
-- ============================================================
CREATE TABLE notifications (
    id         UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id    UUID         NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    title      VARCHAR(255) NOT NULL,
    message    TEXT         NOT NULL,
    type       VARCHAR(20)  NOT NULL
                  CHECK (type IN ('booking','payment','reminder',
                                  'cancellation','alert','system')),
    is_read    BOOLEAN      NOT NULL DEFAULT FALSE,
    metadata   JSONB        DEFAULT '{}',
    created_at TIMESTAMPTZ  NOT NULL DEFAULT NOW()
);

-- ============================================================
--  REVIEWS
-- ============================================================
CREATE TABLE reviews (
    id           UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    booking_id   UUID         UNIQUE NOT NULL REFERENCES bookings(id) ON DELETE CASCADE,
    reviewer_id  UUID         NOT NULL REFERENCES users(id),
    parking_id   UUID         NOT NULL REFERENCES parking_spaces(id),
    rating       INTEGER      NOT NULL CHECK (rating BETWEEN 1 AND 5),
    comment      TEXT,
    owner_reply  TEXT,
    created_at   TIMESTAMPTZ  NOT NULL DEFAULT NOW(),
    updated_at   TIMESTAMPTZ  NOT NULL DEFAULT NOW()
);

-- ============================================================
--  REFRESH TOKENS
-- ============================================================
CREATE TABLE refresh_tokens (
    id         UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id    UUID        NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    token_hash VARCHAR(255) NOT NULL,
    expires_at TIMESTAMPTZ NOT NULL,
    is_revoked BOOLEAN     NOT NULL DEFAULT FALSE,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ============================================================
--  ANALYTICS (Materialised / append-only event log)
-- ============================================================
CREATE TABLE parking_events (
    id          UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    event_type  VARCHAR(30)  NOT NULL,  -- search, view, book, cancel, complete
    user_id     UUID         REFERENCES users(id),
    parking_id  UUID         REFERENCES parking_spaces(id),
    payload     JSONB        DEFAULT '{}',
    created_at  TIMESTAMPTZ  NOT NULL DEFAULT NOW()
);

-- ============================================================
--  INDEXES
-- ============================================================
-- Spatial indexes
CREATE INDEX idx_parking_exact_loc  ON parking_spaces USING GIST(exact_location);
CREATE INDEX idx_parking_public_loc ON parking_spaces USING GIST(public_location);

-- Booking lookups
CREATE INDEX idx_bookings_user      ON bookings(user_id);
CREATE INDEX idx_bookings_parking   ON bookings(parking_id);
CREATE INDEX idx_bookings_status    ON bookings(booking_status);
CREATE INDEX idx_bookings_times     ON bookings(start_time, end_time);

-- Notification lookups
CREATE INDEX idx_notifications_user ON notifications(user_id, is_read, created_at DESC);

-- OTP lookups
CREATE INDEX idx_otp_phone_purpose  ON otp_verifications(phone, purpose, is_used);

-- Refresh token
CREATE INDEX idx_refresh_token_user ON refresh_tokens(user_id, is_revoked);

-- Events
CREATE INDEX idx_events_parking_time ON parking_events(parking_id, created_at DESC);

-- ============================================================
--  TRIGGER: keep updated_at fresh
-- ============================================================
CREATE OR REPLACE FUNCTION update_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DO $$ DECLARE
    t TEXT;
BEGIN
    FOREACH t IN ARRAY ARRAY[
        'users','seeker_profiles','owner_profiles',
        'parking_spaces','bookings','payments','reviews'
    ] LOOP
        EXECUTE format(
            'CREATE TRIGGER trg_%I_updated_at
             BEFORE UPDATE ON %I
             FOR EACH ROW EXECUTE FUNCTION update_updated_at()',
            t, t
        );
    END LOOP;
END $$;

-- ============================================================
--  TRIGGER: update avg_rating on parking_spaces after review
-- ============================================================
CREATE OR REPLACE FUNCTION refresh_parking_rating()
RETURNS TRIGGER AS $$
BEGIN
    UPDATE parking_spaces
    SET avg_rating    = sub.avg_r,
        total_reviews = sub.cnt
    FROM (
        SELECT AVG(rating)::NUMERIC(3,2) AS avg_r, COUNT(*) AS cnt
        FROM reviews
        WHERE parking_id = NEW.parking_id
    ) sub
    WHERE id = NEW.parking_id;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trg_refresh_parking_rating
AFTER INSERT OR UPDATE ON reviews
FOR EACH ROW EXECUTE FUNCTION refresh_parking_rating();

-- ============================================================
--  DEFAULT ADMIN USER  (change password before going live)
-- ============================================================
INSERT INTO users (full_name, email, phone, password_hash, user_type, is_verified)
VALUES (
    'System Admin',
    'admin@parkingsystem.com',
    '+910000000000',
    -- bcrypt hash of "Admin@1234" – CHANGE IN PRODUCTION
    '$2b$12$cNgcM6Yt1lCCsWQ6ruJv1OUvLSUVxDpd8zM32XDd7Hvbo6OsevxRm',
    'admin',
    TRUE
);
