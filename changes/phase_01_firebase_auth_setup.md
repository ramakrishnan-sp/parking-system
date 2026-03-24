# PHASE 1 — Firebase Auth Setup
# ParkEase — Authentication Modernization
# ⚠️ DO NOT move to Phase 2 until every step here is complete and verified.
# ⚠️ Do NOT modify any existing page components, API files, store files, or UI components in this phase.

---

## CONTEXT

You are working on **ParkEase**, a peer-to-peer parking platform. The backend is FastAPI + PostgreSQL and the frontend is React + Vite + Tailwind.

This is Phase 1 of a multi-phase authentication modernization. In this phase you will:
1. Install and configure **Firebase Admin SDK** on the backend
2. Install and configure the **Firebase client SDK** on the frontend
3. Create utility files only — no existing files are modified

---

## STEP 1 — Backend: Install Firebase Admin SDK

Add `firebase-admin==6.5.0` to `backend/requirements.txt`.

If using Docker, rebuild after this step.

---

## STEP 2 — Backend: Create Firebase Admin utility

Create the file `backend/app/utils/firebase_admin.py`:

```python
import os
import firebase_admin
from firebase_admin import credentials, auth as firebase_auth
from fastapi import HTTPException
from ..config import settings

# Initialize Firebase Admin SDK (only once)
_firebase_app = None

def get_firebase_app():
    global _firebase_app
    if _firebase_app is not None:
        return _firebase_app

    service_account_path = settings.FIREBASE_SERVICE_ACCOUNT_PATH
    if not service_account_path or not os.path.exists(service_account_path):
        # Allow running without Firebase in dev (returns None token)
        return None

    try:
        if not firebase_admin._apps:
            cred = credentials.Certificate(service_account_path)
            _firebase_app = firebase_admin.initialize_app(cred)
        else:
            _firebase_app = firebase_admin.get_app()
    except Exception as e:
        print(f"[Firebase] Failed to initialize: {e}")
        return None

    return _firebase_app


def verify_firebase_token(id_token: str) -> dict:
    """
    Verify a Firebase ID token and return the decoded token dict.
    Raises HTTPException 401 if invalid.
    Returns None if Firebase is not configured (dev mode).
    """
    app = get_firebase_app()

    # Dev mode: Firebase not configured — skip verification
    if app is None:
        if settings.APP_ENV == "development":
            return None
        raise HTTPException(
            status_code=401,
            detail="Firebase not configured on server"
        )

    try:
        decoded_token = firebase_auth.verify_id_token(id_token, app=app)
        return decoded_token
    except firebase_auth.ExpiredIdTokenError:
        raise HTTPException(status_code=401, detail="Firebase token has expired")
    except firebase_auth.InvalidIdTokenError:
        raise HTTPException(status_code=401, detail="Invalid Firebase token")
    except Exception as e:
        raise HTTPException(status_code=401, detail=f"Firebase token verification failed: {str(e)}")


def get_phone_from_firebase_token(decoded_token: dict) -> str | None:
    """Extract phone number from decoded Firebase token."""
    if decoded_token is None:
        return None
    return decoded_token.get("phone_number")


def get_uid_from_firebase_token(decoded_token: dict) -> str | None:
    """Extract Firebase UID from decoded token."""
    if decoded_token is None:
        return None
    return decoded_token.get("uid")
```

---

## STEP 3 — Backend: Add Firebase config to Settings

In `backend/app/config.py`, add the following field inside the `Settings` class (after the existing fields, before the `@property` methods):

```python
# Firebase
FIREBASE_SERVICE_ACCOUNT_PATH: str = ""
```

---

## STEP 4 — Backend: Update .env.example

In `backend/.env.example`, add this section at the end:

```env
# ─── Firebase Admin SDK ────────────────────────────────────────────────────────
# Path to your Firebase service account JSON file (download from Firebase Console)
# Project Settings → Service Accounts → Generate new private key
FIREBASE_SERVICE_ACCOUNT_PATH=./firebase-service-account.json
```

---

## STEP 5 — Frontend: Install Firebase client SDK

Run inside the `frontend/` directory:

```bash
cd frontend
npm install firebase
```

---

## STEP 6 — Frontend: Create Firebase client utility

Create the file `frontend/src/lib/firebase.js`:

```js
import { initializeApp } from 'firebase/app'
import {
  getAuth,
  RecaptchaVerifier,
  signInWithPhoneNumber,
} from 'firebase/auth'

// Firebase config from environment variables
const firebaseConfig = {
  apiKey:            import.meta.env.VITE_FIREBASE_API_KEY,
  authDomain:        import.meta.env.VITE_FIREBASE_AUTH_DOMAIN,
  projectId:         import.meta.env.VITE_FIREBASE_PROJECT_ID,
  storageBucket:     import.meta.env.VITE_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID,
  appId:             import.meta.env.VITE_FIREBASE_APP_ID,
}

// Initialize Firebase app (singleton)
let firebaseApp
let auth

try {
  firebaseApp = initializeApp(firebaseConfig)
  auth = getAuth(firebaseApp)
} catch (error) {
  console.warn('[Firebase] Initialization failed:', error.message)
}

export { auth }

/**
 * Check if Firebase is properly configured.
 * Returns false if env vars are missing (dev without Firebase).
 */
export function isFirebaseConfigured() {
  return Boolean(
    import.meta.env.VITE_FIREBASE_API_KEY &&
    import.meta.env.VITE_FIREBASE_PROJECT_ID &&
    import.meta.env.VITE_FIREBASE_APP_ID
  )
}

/**
 * Send OTP to a phone number using Firebase Phone Auth.
 *
 * @param {string} phoneNumber - E.164 format, e.g. "+919876543210"
 * @param {string} recaptchaContainerId - DOM element id for invisible reCAPTCHA
 * @returns {Promise<ConfirmationResult>} - Confirmation result to verify OTP
 */
export async function sendFirebaseOTP(phoneNumber, recaptchaContainerId = 'recaptcha-container') {
  if (!isFirebaseConfigured()) {
    throw new Error('Firebase is not configured. Set VITE_FIREBASE_* env vars.')
  }

  // Clear any existing reCAPTCHA verifier
  if (window._recaptchaVerifier) {
    try {
      window._recaptchaVerifier.clear()
    } catch {}
    window._recaptchaVerifier = null
  }

  const recaptchaVerifier = new RecaptchaVerifier(auth, recaptchaContainerId, {
    size: 'invisible',
    callback: () => {},
    'expired-callback': () => {
      window._recaptchaVerifier = null
    },
  })

  window._recaptchaVerifier = recaptchaVerifier

  const confirmationResult = await signInWithPhoneNumber(auth, phoneNumber, recaptchaVerifier)
  window._confirmationResult = confirmationResult
  return confirmationResult
}

/**
 * Verify the OTP code entered by the user.
 *
 * @param {object} confirmationResult - Result from sendFirebaseOTP
 * @param {string} otp - 6-digit OTP entered by user
 * @returns {Promise<{ idToken: string, uid: string, phoneNumber: string }>}
 */
export async function verifyFirebaseOTP(confirmationResult, otp) {
  const userCredential = await confirmationResult.confirm(otp)
  const user = userCredential.user
  const idToken = await user.getIdToken()

  return {
    idToken,
    uid: user.uid,
    phoneNumber: user.phoneNumber,
  }
}

/**
 * Sign out from Firebase (cleanup only — our app uses its own JWT sessions).
 */
export async function firebaseSignOut() {
  if (auth) {
    try {
      await auth.signOut()
    } catch {}
  }
}
```

---

## STEP 7 — Frontend: Update .env.example

In `frontend/.env.example`, add these lines:

```env
# Firebase Client SDK (get from Firebase Console → Project Settings → Your Apps → Web App)
VITE_FIREBASE_API_KEY=
VITE_FIREBASE_AUTH_DOMAIN=
VITE_FIREBASE_PROJECT_ID=
VITE_FIREBASE_STORAGE_BUCKET=
VITE_FIREBASE_MESSAGING_SENDER_ID=
VITE_FIREBASE_APP_ID=
```

---

## STEP 8 — Frontend: Add recaptcha container to index.html

In `frontend/index.html`, add this invisible div inside `<body>` BEFORE the `<script>` tag:

```html
<!-- Firebase invisible reCAPTCHA container -->
<div id="recaptcha-container"></div>
```

---

## VERIFICATION CHECKLIST

Before marking Phase 1 complete, confirm ALL of these:

- [ ] `backend/requirements.txt` contains `firebase-admin==6.5.0`
- [ ] `backend/app/utils/firebase_admin.py` exists with `verify_firebase_token`, `get_phone_from_firebase_token`, `get_uid_from_firebase_token` functions
- [ ] `backend/app/config.py` has `FIREBASE_SERVICE_ACCOUNT_PATH: str = ""` in Settings
- [ ] `backend/.env.example` has the Firebase section added
- [ ] Backend starts without errors: `uvicorn app.main:app --reload --port 8000` (Firebase simply logs a warning if not configured — it does NOT crash)
- [ ] `frontend/node_modules/firebase` exists after `npm install firebase`
- [ ] `frontend/src/lib/firebase.js` exists with `sendFirebaseOTP`, `verifyFirebaseOTP`, `isFirebaseConfigured` exports
- [ ] `frontend/.env.example` has the `VITE_FIREBASE_*` variables added
- [ ] `frontend/index.html` has `<div id="recaptcha-container"></div>`
- [ ] `npm run build` inside `frontend/` completes without errors
- [ ] No existing pages, components, or stores have been modified

---

## IMPORTANT NOTES FOR NEXT PHASES

- The `verify_firebase_token` function returns `None` in development mode when Firebase is not configured — all subsequent phases must handle this gracefully (treat as "phone verified by other means" in dev).
- The Firebase `idToken` obtained after phone OTP verification must be passed to backend endpoints as `firebase_id_token` in the request body/form.
- The `recaptcha-container` div id must remain in `index.html` for invisible reCAPTCHA to work.
- Do NOT store Firebase ID tokens in localStorage — they are short-lived (1 hour) and used only during login/registration flow.
