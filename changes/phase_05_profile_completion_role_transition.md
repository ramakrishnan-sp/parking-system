# PHASE 5 — Profile Completion + Role Transition (Seeker ↔ Owner)
# ParkEase — Authentication Modernization
# ⚠️ All previous phases (1–4) must be complete before starting this phase.
# ⚠️ Keep all existing UI components and page layouts unchanged.
# ⚠️ This phase only ADDS new UI sections to existing pages — it does not redesign them.

---

## CONTEXT

You are completing the ParkEase authentication modernization. In Phases 1–4 you set up Firebase, updated the user model, added new backend endpoints, and refactored the auth pages.

In this phase you will:
1. Update `frontend/src/api/users.js` to add profile setup API calls
2. Update `frontend/src/pages/Profile.jsx` to show "Account Setup" panels for seeker and owner profile completion
3. Update `frontend/src/pages/ParkingMap.jsx` to show a banner if seeker profile is incomplete
4. Update `frontend/src/pages/OwnerDashboard.jsx` to show a setup prompt if owner profile is missing
5. Update `frontend/src/components/common/Sidebar.jsx` to show correct nav links based on `is_owner` flag

---

## STEP 1 — Update users API module

Replace the contents of `frontend/src/api/users.js` with:

```js
import { api } from './axios';

// ── Existing endpoints (unchanged) ───────────────────────────────────────────
export const getMyNotifications       = ()         => api.get('/users/notifications');
export const markAllNotificationsRead = ()         => api.post('/users/notifications/mark-read');
export const uploadProfilePhoto       = (formData) =>
  api.post('/users/profile-photo', formData, {
    headers: { 'Content-Type': 'multipart/form-data' },
  });
export const updateSeekerProfile      = (data)     => api.put('/users/seeker-profile', data);
export const updateOwnerProfile       = (data)     => api.put('/users/owner-profile', data);

// ── New profile setup endpoints (Phase 3 backend) ────────────────────────────

/**
 * Set up seeker profile (vehicle details, driving license).
 * Can be called by any authenticated user post-registration.
 * Sets user.is_seeker = true on the backend.
 */
export const setupSeekerProfile = (formData) =>
  api.post('/users/setup/seeker', formData, {
    headers: { 'Content-Type': 'multipart/form-data' },
  });

/**
 * Set up owner profile (property details, KYC documents).
 * Can be called by any authenticated user post-registration.
 * Sets user.is_owner = true on the backend.
 */
export const setupOwnerProfile = (formData) =>
  api.post('/users/setup/owner', formData, {
    headers: { 'Content-Type': 'multipart/form-data' },
  });
```

---

## STEP 2 — Add profile setup panels to Profile.jsx

In `frontend/src/pages/Profile.jsx`, you will add two new collapsible setup panels:
- One for completing seeker profile (vehicle details)
- One for becoming an owner (property details + KYC)

These panels only appear when the respective profile is missing.

Find the section in `Profile.jsx` where the form is rendered (the `md:col-span-2` column with the `GlassCard` containing the Edit Details form). ADD the following two panels BELOW the existing edit form GlassCard. Do NOT remove or change any existing code.

Add these imports at the top of `Profile.jsx` (if not already present):

```jsx
import { useState } from 'react';
import { setupSeekerProfile, setupOwnerProfile } from '@/api/users';
import { FileUpload } from '@/components/common/FileUpload';
import { Car, Building2, ChevronDown, ChevronUp } from 'lucide-react';
import { VEHICLE_TYPES, PROPERTY_TYPES } from '@/lib/constants';
```

Then, after the closing `</GlassCard>` of the existing edit form (inside the `md:col-span-2` div), add:

```jsx
{/* ── Seeker Profile Setup Panel ────────────────────────────── */}
<SeekerSetupPanel user={user} onRefresh={refreshUser} />

{/* ── Owner Profile Setup Panel ────────────────────────────── */}
<OwnerSetupPanel user={user} onRefresh={refreshUser} />
```

Then, OUTSIDE the default export function (at the bottom of the file), add these two new components:

```jsx
// ─────────────────────────────────────────────────────────────────────────────
// Seeker Setup Panel
// Shown when the user has no seeker_profile (no vehicle details filled in)
// ─────────────────────────────────────────────────────────────────────────────
function SeekerSetupPanel({ user, onRefresh }) {
  const [expanded, setExpanded]     = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [files, setFiles] = useState({ license_proof: null, aadhaar_proof: null });

  const { register, handleSubmit, formState: { errors } } = useForm({ mode: 'onTouched' });

  // Show panel only if seeker profile is missing or incomplete
  if (user?.seeker_profile?.vehicle_number) return null;

  const onSubmit = async (data) => {
    setIsSubmitting(true);
    try {
      const fd = new FormData();
      if (data.vehicle_number)         fd.append('vehicle_number',          data.vehicle_number);
      if (data.vehicle_type)           fd.append('vehicle_type',            data.vehicle_type);
      if (data.driving_license_number) fd.append('driving_license_number',  data.driving_license_number);
      if (data.aadhaar_number)         fd.append('aadhaar_number',          data.aadhaar_number);
      if (files.license_proof)         fd.append('license_proof',           files.license_proof);
      if (files.aadhaar_proof)         fd.append('aadhaar_proof',           files.aadhaar_proof);

      await setupSeekerProfile(fd);
      toast.success('Vehicle details saved!');
      setExpanded(false);
      onRefresh?.();
    } catch (err) {
      toast.error(err.response?.data?.detail || 'Failed to save details');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <GlassCard className="p-6 border border-brand-cyan/20 bg-brand-cyan/5">
      <button
        type="button"
        className="w-full flex items-center justify-between"
        onClick={() => setExpanded((v) => !v)}
      >
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-brand-cyan/20 flex items-center justify-center">
            <Car className="w-5 h-5 text-brand-cyan" />
          </div>
          <div className="text-left">
            <h3 className="font-semibold text-white text-sm">Complete Seeker Profile</h3>
            <p className="text-xs text-white/50 mt-0.5">Add vehicle details to enable bookings</p>
          </div>
        </div>
        {expanded
          ? <ChevronUp className="w-5 h-5 text-white/60" />
          : <ChevronDown className="w-5 h-5 text-white/60" />
        }
      </button>

      {expanded && (
        <form onSubmit={handleSubmit(onSubmit)} className="mt-6 space-y-4 animate-in fade-in slide-in-from-top-2 duration-200">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <GlassInput
              label="Vehicle Number"
              placeholder="e.g. TN12AB1234"
              {...register('vehicle_number', { required: 'Required' })}
              error={errors.vehicle_number?.message}
            />
            <div className="space-y-1">
              <label className="block text-sm font-medium text-white/80 ml-1">Vehicle Type</label>
              <select
                {...register('vehicle_type', { required: 'Required' })}
                className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-white focus:outline-none focus:ring-2 focus:ring-brand-purple/50 transition-all"
              >
                <option value="" className="bg-slate-900">Select type</option>
                {Object.values(VEHICLE_TYPES).map((t) => (
                  <option key={t} value={t} className="bg-slate-900">{t.toUpperCase()}</option>
                ))}
              </select>
              {errors.vehicle_type && (
                <p className="text-red-400 text-xs mt-1 ml-1">{errors.vehicle_type.message}</p>
              )}
            </div>
          </div>

          <GlassInput
            label="Driving License Number"
            placeholder="e.g. TN0120210012345"
            {...register('driving_license_number')}
          />

          <GlassInput
            label="Aadhaar Number (12 digits)"
            placeholder="XXXX XXXX XXXX"
            {...register('aadhaar_number', {
              pattern: { value: /^\d{12}$/, message: '12 digits required' },
            })}
            error={errors.aadhaar_number?.message}
          />

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <FileUpload
              label="License Proof (optional)"
              accept="image/*,.pdf"
              onFileSelect={(f) => setFiles((p) => ({ ...p, license_proof: f }))}
            />
            <FileUpload
              label="Aadhaar Proof (optional)"
              accept="image/*,.pdf"
              onFileSelect={(f) => setFiles((p) => ({ ...p, aadhaar_proof: f }))}
            />
          </div>

          <div className="flex gap-3 pt-2">
            <GlassButton
              type="button"
              variant="secondary"
              className="flex-1"
              onClick={() => setExpanded(false)}
            >
              Cancel
            </GlassButton>
            <GlassButton type="submit" className="flex-1" isLoading={isSubmitting}>
              Save Vehicle Details
            </GlassButton>
          </div>
        </form>
      )}
    </GlassCard>
  );
}


// ─────────────────────────────────────────────────────────────────────────────
// Owner Setup Panel
// Shown when the user has not yet set up an owner profile
// ─────────────────────────────────────────────────────────────────────────────
function OwnerSetupPanel({ user, onRefresh }) {
  const [expanded, setExpanded]         = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [files, setFiles] = useState({ govt_id_proof: null, aadhaar_proof: null });

  const { register, handleSubmit, formState: { errors } } = useForm({ mode: 'onTouched' });

  // Hide panel if user is already an owner with a profile
  if (user?.is_owner && user?.owner_profile?.property_address) return null;

  const onSubmit = async (data) => {
    setIsSubmitting(true);
    try {
      const fd = new FormData();
      if (data.property_address) fd.append('property_address',  data.property_address);
      if (data.property_type)    fd.append('property_type',     data.property_type);
      if (data.aadhaar_number)   fd.append('aadhaar_number',    data.aadhaar_number);
      if (files.govt_id_proof)   fd.append('govt_id_proof',     files.govt_id_proof);
      if (files.aadhaar_proof)   fd.append('aadhaar_proof',     files.aadhaar_proof);

      await setupOwnerProfile(fd);
      toast.success('Owner profile submitted for admin review!');
      setExpanded(false);
      onRefresh?.();
    } catch (err) {
      toast.error(err.response?.data?.detail || 'Failed to submit owner profile');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <GlassCard className="p-6 border border-brand-purple/20 bg-brand-purple/5">
      <button
        type="button"
        className="w-full flex items-center justify-between"
        onClick={() => setExpanded((v) => !v)}
      >
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-brand-purple/20 flex items-center justify-center">
            <Building2 className="w-5 h-5 text-brand-purple" />
          </div>
          <div className="text-left">
            <h3 className="font-semibold text-white text-sm">
              {user?.is_owner ? 'Complete Owner Profile' : 'Become a Host'}
            </h3>
            <p className="text-xs text-white/50 mt-0.5">
              List your parking space and start earning
            </p>
          </div>
        </div>
        {expanded
          ? <ChevronUp className="w-5 h-5 text-white/60" />
          : <ChevronDown className="w-5 h-5 text-white/60" />
        }
      </button>

      {expanded && (
        <form onSubmit={handleSubmit(onSubmit)} className="mt-6 space-y-4 animate-in fade-in slide-in-from-top-2 duration-200">
          <div className="p-3 bg-amber-500/10 border border-amber-500/20 rounded-xl text-xs text-amber-300">
            💡 After submitting, an admin will review your KYC documents. Once approved, your listings will go live.
          </div>

          <GlassInput
            label="Property Address"
            placeholder="Address where you have parking"
            {...register('property_address', { required: 'Property address is required' })}
            error={errors.property_address?.message}
          />

          <div className="space-y-1">
            <label className="block text-sm font-medium text-white/80 ml-1">Property Type</label>
            <select
              {...register('property_type', { required: 'Required' })}
              className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-white focus:outline-none focus:ring-2 focus:ring-brand-purple/50 transition-all"
            >
              <option value="" className="bg-slate-900">Select type</option>
              {Object.values(PROPERTY_TYPES).map((p) => (
                <option key={p} value={p} className="bg-slate-900">
                  {p.charAt(0).toUpperCase() + p.slice(1)}
                </option>
              ))}
            </select>
            {errors.property_type && (
              <p className="text-red-400 text-xs mt-1 ml-1">{errors.property_type.message}</p>
            )}
          </div>

          <GlassInput
            label="Aadhaar Number (12 digits)"
            placeholder="XXXX XXXX XXXX"
            {...register('aadhaar_number', {
              pattern: { value: /^\d{12}$/, message: '12 digits required' },
            })}
            error={errors.aadhaar_number?.message}
          />

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <FileUpload
              label="Govt. ID Proof"
              accept="image/*,.pdf"
              onFileSelect={(f) => setFiles((p) => ({ ...p, govt_id_proof: f }))}
            />
            <FileUpload
              label="Aadhaar Proof"
              accept="image/*,.pdf"
              onFileSelect={(f) => setFiles((p) => ({ ...p, aadhaar_proof: f }))}
            />
          </div>

          <div className="flex gap-3 pt-2">
            <GlassButton
              type="button"
              variant="secondary"
              className="flex-1"
              onClick={() => setExpanded(false)}
            >
              Cancel
            </GlassButton>
            <GlassButton type="submit" className="flex-1" isLoading={isSubmitting}>
              Submit for Review
            </GlassButton>
          </div>
        </form>
      )}
    </GlassCard>
  );
}
```

Also add `useForm` import at the top of `Profile.jsx` (if not already imported from react-hook-form):
```jsx
import { useForm } from 'react-hook-form';
```

And add `toast` import:
```jsx
import { toast } from 'sonner';
```

---

## STEP 3 — Add seeker profile nudge to ParkingMap.jsx

In `frontend/src/pages/ParkingMap.jsx`, add a small informational banner at the top of the page when the user has no seeker profile set up.

Add this import at the top:
```jsx
import { Link } from 'react-router-dom';
```

Then find the `return (` statement in `ParkingMap` and add this banner as the FIRST element inside the outer div (before the existing flex container):

```jsx
{/* ── Seeker profile nudge ─────────────────────────────────── */}
{user && !user.seeker_profile?.vehicle_number && (
  <div className="mb-4 flex items-center gap-3 p-3 bg-brand-cyan/10 border border-brand-cyan/20 rounded-xl text-sm text-brand-cyan animate-in fade-in duration-500">
    <Car className="w-4 h-4 shrink-0" />
    <span className="flex-1">
      Add your vehicle details to speed up bookings.
    </span>
    <Link
      to="/profile"
      className="text-xs font-semibold underline hover:text-white transition-colors whitespace-nowrap"
    >
      Complete Profile →
    </Link>
  </div>
)}
```

Also make sure `user` is available in scope — add this near the top of the `ParkingMap` component:
```jsx
const { user } = useAuthStore();
```

And add the `Car` import if not already there:
```jsx
import { Car } from 'lucide-react';
```

---

## STEP 4 — Add owner setup prompt to OwnerDashboard.jsx

In `frontend/src/pages/OwnerDashboard.jsx`, find the tab content section where `spaces.length === 0` shows the `EmptyState`.

BEFORE the existing EmptyState for no spaces, add a check for missing owner profile. Find the `activeTab === 'spaces'` content block and wrap the existing content to show a setup prompt first:

```jsx
{activeTab === 'spaces' && (
  isLoadingSpaces ? (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
      {Array(3).fill(0).map((_, i) => <ParkingCardSkeleton key={i} />)}
    </div>
  ) : !user?.owner_profile?.property_address ? (
    /* ── No owner profile yet ─────────────────────────────── */
    <GlassCard className="p-10 text-center border border-brand-purple/20 bg-brand-purple/5">
      <div className="w-16 h-16 rounded-full bg-brand-purple/20 flex items-center justify-center mx-auto mb-4">
        <Building2 className="w-8 h-8 text-brand-purple" />
      </div>
      <h3 className="text-xl font-semibold text-white mb-2">Complete your owner profile first</h3>
      <p className="text-white/60 max-w-sm mx-auto mb-6 text-sm">
        Before listing a parking space, please add your property details and KYC documents
        so admin can verify your account.
      </p>
      <Link to="/profile">
        <GlassButton>
          Set Up Owner Profile
        </GlassButton>
      </Link>
    </GlassCard>
  ) : spaces?.length === 0 ? (
    <EmptyState
      icon={Car}
      title="No spaces listed yet"
      message="Add your first parking space to start earning."
      actionText="Add Space"
      onAction={handleAddSpace}
    />
  ) : (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
      {spaces?.map(space => (
        <ParkingSpaceCard
          key={space.id}
          space={space}
          onEdit={handleEditSpace}
          onDelete={handleDeleteClick}
          onToggleActive={handleToggleActive}
        />
      ))}
    </div>
  )
)}
```

Add the `Link` import if not present:
```jsx
import { Link } from 'react-router-dom';
```

Add the `Building2` import if not present:
```jsx
import { Building2 } from 'lucide-react';
```

---

## STEP 5 — Update Sidebar to show correct nav links for unified users

In `frontend/src/components/common/Sidebar.jsx`, update the links array to show the Owner Dashboard link based on `is_owner` instead of `user_type`:

Find the `links` array and update the owner dashboard entry:

```jsx
const { user, logout, isOwner, isAdmin } = useAuthStore();

const links = [
  {
    to: '/seeker/map',
    icon: MapPin,
    label: 'Find Parking',
    // Shown to all regular users
    show: !isAdmin(),
  },
  {
    to: '/seeker/bookings',
    icon: Calendar,
    label: 'My Bookings',
    // Shown to all regular users
    show: !isAdmin(),
  },
  {
    to: '/owner',
    icon: LayoutDashboard,
    label: 'My Spaces',
    // Only shown after user has listed a space (is_owner=true)
    show: isOwner() && !isAdmin(),
  },
  {
    to: '/admin',
    icon: LayoutDashboard,
    label: 'Admin Dashboard',
    show: isAdmin(),
  },
  {
    to: '/profile',
    icon: User,
    label: 'Profile',
    show: true,
  },
];

const filteredLinks = links.filter((link) => link.show);
```

Replace the existing NavLink mapping to use `filteredLinks`:

```jsx
{filteredLinks.map((link) => (
  <NavLink
    key={link.to}
    to={link.to}
    onClick={() => setIsOpen(false)}
    className={({ isActive }) => cn(
      'flex items-center px-4 py-3 rounded-xl text-sm font-medium transition-colors',
      isActive
        ? 'bg-brand-purple/20 text-brand-purple border border-brand-purple/30'
        : 'text-white/70 hover:bg-white/5 hover:text-white'
    )}
  >
    <link.icon className="w-5 h-5 mr-3" />
    {link.label}
  </NavLink>
))}
```

Also add a "Become a Host" link at the bottom of the nav (above Sign Out) for users who are NOT yet owners:

```jsx
{/* Show "Become a Host" nudge for non-owner users */}
{!isOwner() && !isAdmin() && (
  <NavLink
    to="/profile"
    onClick={() => setIsOpen(false)}
    className="flex items-center px-4 py-3 rounded-xl text-sm font-medium text-brand-purple/70 hover:bg-brand-purple/10 hover:text-brand-purple transition-colors border border-brand-purple/20 mt-2"
  >
    <Building2 className="w-5 h-5 mr-3" />
    Become a Host
  </NavLink>
)}
```

Add the `Building2` import if not present:
```jsx
import { Building2 } from 'lucide-react';
```

---

## VERIFICATION CHECKLIST

Before marking Phase 5 (and the entire modernization) complete:

### Profile Page
- [ ] `/profile` shows "Complete Seeker Profile" collapsible panel for users without vehicle details
- [ ] Clicking the panel expands it to show vehicle number, type, license fields
- [ ] Submitting seeker setup calls `POST /api/v1/users/setup/seeker`
- [ ] `/profile` shows "Become a Host" panel for users without owner profile
- [ ] Submitting owner setup calls `POST /api/v1/users/setup/owner`
- [ ] After submitting either panel, the store refreshes the user object
- [ ] Panels disappear after the respective profile is complete

### Parking Map
- [ ] New users (no seeker_profile) see the "Add your vehicle details" banner
- [ ] Banner links to `/profile`
- [ ] Banner disappears after seeker profile is set up (after page refresh / store update)

### Owner Dashboard
- [ ] Users without `owner_profile.property_address` see the "Complete your owner profile first" card
- [ ] Card links to `/profile`
- [ ] After completing owner profile via `/profile`, the dashboard shows the Add Space button

### Sidebar
- [ ] "My Spaces" link is hidden for users with `is_owner=false`
- [ ] "My Spaces" link appears after user becomes an owner
- [ ] "Become a Host" nudge link shows for non-owner users
- [ ] Admin users only see Admin Dashboard
- [ ] All users see Find Parking, My Bookings, Profile

### Full end-to-end flow
- [ ] New user registers via `/register` (no role selection)
- [ ] Logs in → lands on `/seeker/map`
- [ ] Can browse parking and make bookings immediately
- [ ] Goes to `/profile` → sets up seeker profile → vehicle banner disappears
- [ ] Goes to `/profile` → sets up owner profile → "My Spaces" appears in sidebar
- [ ] Clicks "My Spaces" → goes to `/owner` → can add parking spaces
- [ ] `npm run build` passes without errors

---

## SUMMARY — What Changed Across All 5 Phases

| What | Before | After |
|------|--------|-------|
| Phone OTP | Custom backend OTP | Firebase Phone Auth |
| Registration | Separate seeker / owner forms | Single unified form |
| Role assignment | Chosen at registration | Automatic based on actions |
| `user_type` values | seeker / owner / admin | user / seeker / owner / admin |
| Seeker access | `user_type='seeker'` | `is_seeker=true` (all users) |
| Owner access | `user_type='owner'` | `is_owner=true` (after listing) |
| Profile setup | During registration | Post-registration via Profile page |
| Login | Email + password | Phone OTP (Firebase) + Email + Password |
