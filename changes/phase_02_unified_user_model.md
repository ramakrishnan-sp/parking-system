# PHASE 2 — Unified User Model (No Role at Registration)
# ParkEase — Authentication Modernization
# ⚠️ Phase 1 must be complete before starting this phase.
# ⚠️ Do NOT modify any frontend files in this phase.
# ⚠️ Do NOT drop existing tables — use ALTER TABLE to add new columns.

---

## CONTEXT

You are continuing the ParkEase authentication modernization. In Phase 1 you set up Firebase utilities.

In this phase you will change the **backend user model** so that:
- Users register once with no seeker/owner role choice
- Every registered user can seek parking (is_seeker = true by default)
- Users become owners automatically when they create their first parking listing
- The `user_type` field is kept for backward compatibility but defaults to `'user'` for new registrations
- Admin accounts remain unchanged

---

## STEP 1 — Database: Add new columns to users table

Create a new SQL migration file `database/migration_unified_user.sql`:

```sql
-- Migration: Unified User Model
-- Run this against your existing parking_db database
-- Safe to run multiple times (uses IF NOT EXISTS / DO blocks)

-- Add is_seeker column (everyone can seek by default)
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns
        WHERE table_name='users' AND column_name='is_seeker'
    ) THEN
        ALTER TABLE users ADD COLUMN is_seeker BOOLEAN NOT NULL DEFAULT TRUE;
    END IF;
END $$;

-- Add is_owner column (becomes true when user creates first parking space)
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns
        WHERE table_name='users' AND column_name='is_owner'
    ) THEN
        ALTER TABLE users ADD COLUMN is_owner BOOLEAN NOT NULL DEFAULT FALSE;
    END IF;
END $$;

-- Add firebase_uid column for linking Firebase accounts
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns
        WHERE table_name='users' AND column_name='firebase_uid'
    ) THEN
        ALTER TABLE users ADD COLUMN firebase_uid VARCHAR(128);
    END IF;
END $$;

-- Allow user_type to accept 'user' value (new default for non-admin registrations)
-- The existing CHECK constraint allows: 'seeker'|'owner'|'admin'
-- We need to widen it to also allow 'user'
-- Drop old constraint and add new one
DO $$
BEGIN
    -- Drop the old check constraint if it exists
    IF EXISTS (
        SELECT 1 FROM information_schema.table_constraints
        WHERE table_name = 'users'
        AND constraint_type = 'CHECK'
        AND constraint_name LIKE '%user_type%'
    ) THEN
        EXECUTE (
            SELECT 'ALTER TABLE users DROP CONSTRAINT ' || constraint_name
            FROM information_schema.table_constraints
            WHERE table_name = 'users'
            AND constraint_type = 'CHECK'
            AND constraint_name LIKE '%user_type%'
            LIMIT 1
        );
    END IF;
END $$;

-- Add new wider check constraint
ALTER TABLE users DROP CONSTRAINT IF EXISTS users_user_type_check;
ALTER TABLE users ADD CONSTRAINT users_user_type_check
    CHECK (user_type IN ('user', 'seeker', 'owner', 'admin'));

-- Backfill existing seekers and owners
UPDATE users SET is_seeker = TRUE WHERE user_type = 'seeker';
UPDATE users SET is_owner = TRUE WHERE user_type = 'owner';

-- Create index for firebase_uid lookups
CREATE INDEX IF NOT EXISTS idx_users_firebase_uid ON users(firebase_uid);

COMMENT ON COLUMN users.is_seeker IS 'True if user can book parking spaces (default true for all users)';
COMMENT ON COLUMN users.is_owner IS 'True if user has listed at least one parking space';
COMMENT ON COLUMN users.firebase_uid IS 'Firebase Auth UID for phone verification linking';
```

**Run this migration on your database before proceeding.**

For Docker: `docker exec -i parking_db psql -U parking_user -d parking_db < database/migration_unified_user.sql`
For local: `psql -U postgres -d parking_db -f database/migration_unified_user.sql`

---

## STEP 2 — Backend Model: Update User model

In `backend/app/models/user.py`, make the following changes to the `User` class:

Add these three columns after the existing `profile_photo_url` column:

```python
is_seeker    = Column(Boolean, default=True,  nullable=False)
is_owner     = Column(Boolean, default=False, nullable=False)
firebase_uid = Column(String(128), nullable=True, index=True)
```

Also change the `user_type` default value comment — it now accepts `'user'` as well as `'seeker'`, `'owner'`, `'admin'`.

The complete updated `User` class columns should look like this (keep all relationships unchanged):

```python
class User(Base):
    __tablename__ = "users"

    id                = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    full_name         = Column(String(255), nullable=False)
    email             = Column(String(255), unique=True, nullable=False, index=True)
    phone             = Column(String(20),  unique=True, nullable=False, index=True)
    password_hash     = Column(String(255), nullable=False)
    user_type         = Column(String(10),  nullable=False)   # user | seeker | owner | admin
    is_verified       = Column(Boolean, default=False, nullable=False)
    is_active         = Column(Boolean, default=True,  nullable=False)
    is_seeker         = Column(Boolean, default=True,  nullable=False)
    is_owner          = Column(Boolean, default=False, nullable=False)
    firebase_uid      = Column(String(128), nullable=True, index=True)
    profile_photo_url = Column(String(500))
    created_at        = Column(DateTime(timezone=True), default=datetime.utcnow)
    updated_at        = Column(DateTime(timezone=True), default=datetime.utcnow,
                               onupdate=datetime.utcnow)

    # ... keep all existing relationships exactly as they are ...
```

---

## STEP 3 — Backend Schemas: Update UserOut schema

In `backend/app/schemas/user.py`, update the `UserOut` class to include the new fields:

```python
class UserOut(BaseModel):
    id: UUID
    full_name: str
    email: str
    phone: str
    user_type: str
    is_verified: bool
    is_active: bool
    is_seeker: bool = True
    is_owner: bool = False
    profile_photo_url: Optional[str] = None
    created_at: datetime
    seeker_profile: Optional[SeekerProfileOut] = None
    owner_profile: Optional[OwnerProfileOut] = None

    model_config = {"from_attributes": True}
```

---

## STEP 4 — Backend Security: Update role guards

In `backend/app/utils/security.py`, update the three guard functions:

Replace the existing `require_seeker`, `require_owner`, and keep `require_admin` as-is:

```python
def require_seeker(current_user=Depends(get_current_user)):
    """Allow access if user is a seeker, any legacy user type, or admin."""
    if not current_user.is_active:
        raise HTTPException(status_code=403, detail="Account is disabled")
    # is_seeker is True by default for all users
    # Also allow legacy 'seeker' user_type and admins
    if (
        current_user.is_seeker
        or current_user.user_type in ("seeker", "admin")
    ):
        return current_user
    raise HTTPException(
        status_code=403,
        detail="Seeker access required. Please complete your profile to enable bookings."
    )


def require_owner(current_user=Depends(get_current_user)):
    """Allow access if user has listed a parking space (is_owner=True) or is admin."""
    if not current_user.is_active:
        raise HTTPException(status_code=403, detail="Account is disabled")
    if (
        current_user.is_owner
        or current_user.user_type in ("owner", "admin")
    ):
        return current_user
    raise HTTPException(
        status_code=403,
        detail="Owner access required. List a parking space first to unlock owner features."
    )


def require_admin(current_user=Depends(get_current_user)):
    if current_user.user_type != "admin":
        raise HTTPException(status_code=403, detail="Admin access required")
    return current_user
```

---

## STEP 5 — Backend: Update parking space creation to auto-set is_owner

In `backend/app/routers/parking.py`, in the `create_parking` endpoint:

After the `db.commit()` that creates the parking space, add these lines to auto-promote the user to owner:

```python
# Auto-promote user to owner when they create their first space
if not current_user.is_owner:
    current_user.is_owner = True
    db.commit()
```

Also remove the check for `owner_profile.verification_status` at the top of `create_parking`. Replace:

```python
# REMOVE THIS BLOCK:
if current_user.owner_profile and current_user.owner_profile.verification_status != "approved":
    raise HTTPException(status_code=403, detail="Owner account pending admin approval")
```

With nothing (delete it entirely). The listing itself still goes through admin approval via `is_approved=False`.

---

## STEP 6 — Backend: Update login endpoint to accept user_type='user'

In `backend/app/routers/auth.py`, in the `login` endpoint:

The existing code already works because it only checks `user.is_active` — no user_type gating on login. Verify this is the case and that there is no code rejecting `user_type='user'`. If there is any such check, remove it.

---

## STEP 7 — Update schema.sql for new installations

In `database/schema.sql`, update the `users` table definition so new installations get the new columns:

Find the `CREATE TABLE users` block and add these columns after `profile_photo_url`:

```sql
is_seeker        BOOLEAN       NOT NULL DEFAULT TRUE,
is_owner         BOOLEAN       NOT NULL DEFAULT FALSE,
firebase_uid     VARCHAR(128),
```

Also update the `user_type` CHECK constraint from:
```sql
user_type VARCHAR(10) NOT NULL CHECK (user_type IN ('seeker','owner','admin')),
```
to:
```sql
user_type VARCHAR(10) NOT NULL CHECK (user_type IN ('user','seeker','owner','admin')),
```

Also add an index after the existing indexes section:
```sql
CREATE INDEX IF NOT EXISTS idx_users_firebase_uid ON users(firebase_uid);
```

---

## VERIFICATION CHECKLIST

Before marking Phase 2 complete, confirm ALL of these:

- [ ] Migration SQL ran successfully — no errors
- [ ] `SELECT column_name FROM information_schema.columns WHERE table_name='users'` shows `is_seeker`, `is_owner`, `firebase_uid` columns
- [ ] `backend/app/models/user.py` User model has `is_seeker`, `is_owner`, `firebase_uid` columns
- [ ] `backend/app/schemas/user.py` UserOut has `is_seeker: bool = True` and `is_owner: bool = False`
- [ ] `backend/app/utils/security.py` — `require_seeker` allows users where `is_seeker=True`
- [ ] `backend/app/utils/security.py` — `require_owner` allows users where `is_owner=True`
- [ ] Backend starts without errors
- [ ] `GET /api/v1/auth/me` response now includes `is_seeker` and `is_owner` fields
- [ ] Existing admin account still works: login as `admin@parkingsystem.com` / `Admin@1234`
- [ ] Existing seeker/owner accounts still work (they have `is_seeker=True` or `is_owner=True` from the backfill)
- [ ] `npm run build` in frontend still passes (no frontend changes in this phase)
- [ ] No frontend files were modified

---

## IMPORTANT NOTES FOR NEXT PHASES

- `user_type` still exists and is still used for admin detection — never remove it.
- New users created in Phase 3 will have `user_type='user'`, `is_seeker=True`, `is_owner=False`.
- The `firebase_uid` column links a ParkEase account to a Firebase phone auth account.
- `is_owner` is set to `True` automatically in two ways: (1) user lists a parking space, (2) via the `/users/setup/owner` endpoint added in Phase 5.
