# PHASE 1 — Foundation Setup
# ParkEase Frontend Redesign
# ⚠️ DO NOT move to Phase 2 until every step here is complete and verified.

---

## CONTEXT

You are working on **ParkEase**, a peer-to-peer parking platform. The backend is fully built (FastAPI + PostgreSQL). You are rebuilding ONLY the `frontend/` directory. Do not touch any backend files.

This is Phase 1 of a multi-phase frontend rebuild. In this phase you will set up the entire design system foundation — packages, CSS variables, Tailwind config, shadcn/ui, and global theme infrastructure.

---

## STEP 1 — Clean up broken dependencies

In `frontend/`, remove packages that are referenced in the existing code but never actually installed (they cause build errors):

```bash
cd frontend
npm uninstall @googlemaps/js-api-loader @stripe/react-stripe-js @stripe/stripe-js 2>/dev/null || true
```

Also open `frontend/vite.config.js` and remove the broken `manualChunks` entries:

```js
// REMOVE these lines from rollupOptions.output.manualChunks:
maps:   ['@googlemaps/js-api-loader'],
stripe: ['@stripe/react-stripe-js', '@stripe/stripe-js'],

// Keep only:
react: ['react', 'react-dom', 'react-router-dom'],
```

---

## STEP 2 — Install new design system packages

```bash
cd frontend

# Radix UI primitives (shadcn/ui uses these)
npm install @radix-ui/react-dialog \
  @radix-ui/react-dropdown-menu \
  @radix-ui/react-avatar \
  @radix-ui/react-tabs \
  @radix-ui/react-select \
  @radix-ui/react-switch \
  @radix-ui/react-tooltip \
  @radix-ui/react-separator \
  @radix-ui/react-slot \
  @radix-ui/react-label \
  @radix-ui/react-progress \
  @radix-ui/react-checkbox

# Utility libs
npm install class-variance-authority clsx tailwind-merge

# Charts
npm install recharts

# Toast (replaces react-hot-toast)
npm install sonner

# Animation
npm install tw-animate-css

# Theme (Vite-compatible dark mode)
npm install next-themes
```

---

## STEP 3 — Initialize shadcn/ui for Vite

Run this inside `frontend/`:

```bash
npx shadcn@latest init
```

When prompted, choose:
- Style: **Default**
- Base color: **Neutral**
- CSS variables: **Yes**
- Config: **tailwind.config.js**
- Components path: **src/components/ui**
- Utils path: **src/lib/utils**
- React Server Components: **No**

Then add all needed components:

```bash
npx shadcn@latest add button card input label badge avatar \
  dropdown-menu dialog sheet tabs select separator skeleton \
  switch tooltip progress sonner
```

---

## STEP 4 — Replace `frontend/src/index.css` (or globals.css)

Delete the existing contents of `frontend/src/index.css` and replace with:

```css
@import "tailwindcss";
@import "tw-animate-css";

@custom-variant dark (&:is(.dark *));

/* ── Light mode tokens ─────────────────────────────────── */
:root {
  --background: oklch(0.97 0 0);
  --foreground: oklch(0.145 0 0);
  --card: oklch(1 0 0);
  --card-foreground: oklch(0.145 0 0);
  --popover: oklch(1 0 0);
  --popover-foreground: oklch(0.145 0 0);
  --primary: oklch(0.205 0 0);
  --primary-foreground: oklch(0.985 0 0);
  --secondary: oklch(0.97 0 0);
  --secondary-foreground: oklch(0.205 0 0);
  --muted: oklch(0.97 0 0);
  --muted-foreground: oklch(0.556 0 0);
  --accent: oklch(0.97 0 0);
  --accent-foreground: oklch(0.205 0 0);
  --destructive: oklch(0.577 0.245 27.325);
  --destructive-foreground: oklch(0.985 0 0);
  --border: oklch(0.922 0 0);
  --input: oklch(0.922 0 0);
  --ring: oklch(0.708 0 0);
  --radius: 0.625rem;

  /* Sidebar tokens */
  --sidebar: oklch(0.985 0 0);
  --sidebar-foreground: oklch(0.145 0 0);
  --sidebar-border: oklch(0.922 0 0);

  /* Brand color — default purple, overridden by data-brand attribute */
  --brand: oklch(0.61 0.24 300);
  --brand-2: color-mix(in oklab, var(--brand) 85%, white 15%);

  /* Chart colors */
  --chart-1: oklch(0.646 0.222 41.116);
  --chart-2: oklch(0.6 0.118 184.704);
  --chart-3: oklch(0.398 0.07 227.392);
  --chart-4: oklch(0.828 0.189 84.429);
  --chart-5: oklch(0.769 0.188 70.08);
}

/* ── Dark mode tokens ──────────────────────────────────── */
.dark {
  --background: oklch(0.145 0 0);
  --foreground: oklch(0.985 0 0);
  --card: oklch(0.2 0 0);
  --card-foreground: oklch(0.985 0 0);
  --popover: oklch(0.2 0 0);
  --popover-foreground: oklch(0.985 0 0);
  --primary: oklch(0.985 0 0);
  --primary-foreground: oklch(0.205 0 0);
  --secondary: oklch(0.269 0 0);
  --secondary-foreground: oklch(0.985 0 0);
  --muted: oklch(0.269 0 0);
  --muted-foreground: oklch(0.708 0 0);
  --accent: oklch(0.269 0 0);
  --accent-foreground: oklch(0.985 0 0);
  --destructive: oklch(0.396 0.141 25.723);
  --destructive-foreground: oklch(0.985 0 0);
  --border: oklch(0.269 0 0);
  --input: oklch(0.269 0 0);
  --ring: oklch(0.439 0 0);
  --sidebar: oklch(0.18 0 0);
  --sidebar-foreground: oklch(0.985 0 0);
  --sidebar-border: oklch(0.269 0 0);
}

/* ── Brand color overrides ─────────────────────────────── */
[data-brand="purple"] { --brand: oklch(0.61 0.24 300); }
[data-brand="blue"]   { --brand: oklch(0.60 0.22 250); }
[data-brand="teal"]   { --brand: oklch(0.65 0.15 185); }
[data-brand="orange"] { --brand: oklch(0.72 0.18 55);  }
[data-brand="pink"]   { --brand: oklch(0.70 0.20 340); }

/* ── Sidebar gradient utility ──────────────────────────── */
.bg-sidebar-gradient {
  background: linear-gradient(
    135deg,
    var(--brand) 0%,
    color-mix(in oklab, var(--brand) 55%, black) 100%
  );
}

/* ── Base resets ───────────────────────────────────────── */
@layer base {
  * {
    box-sizing: border-box;
    border-color: oklch(var(--border, 0.922 0 0));
  }
  body {
    background-color: var(--background);
    color: var(--foreground);
    font-family: 'Inter', system-ui, sans-serif;
    -webkit-font-smoothing: antialiased;
  }
  ::-webkit-scrollbar { width: 5px; height: 5px; }
  ::-webkit-scrollbar-track { background: transparent; }
  ::-webkit-scrollbar-thumb { background: var(--border); border-radius: 4px; }
}
```

---

## STEP 5 — Replace `frontend/tailwind.config.js`

Replace the entire file with:

```js
/** @type {import('tailwindcss').Config} */
export default {
  darkMode: 'class',
  content: ['./index.html', './src/**/*.{js,ts,jsx,tsx}'],
  theme: {
    extend: {
      colors: {
        background:  'var(--background)',
        foreground:  'var(--foreground)',
        brand:       'var(--brand)',
        'brand-2':   'var(--brand-2)',
        card: {
          DEFAULT:    'var(--card)',
          foreground: 'var(--card-foreground)',
        },
        popover: {
          DEFAULT:    'var(--popover)',
          foreground: 'var(--popover-foreground)',
        },
        primary: {
          DEFAULT:    'var(--primary)',
          foreground: 'var(--primary-foreground)',
        },
        secondary: {
          DEFAULT:    'var(--secondary)',
          foreground: 'var(--secondary-foreground)',
        },
        muted: {
          DEFAULT:    'var(--muted)',
          foreground: 'var(--muted-foreground)',
        },
        accent: {
          DEFAULT:    'var(--accent)',
          foreground: 'var(--accent-foreground)',
        },
        destructive: {
          DEFAULT:    'var(--destructive)',
          foreground: 'var(--destructive-foreground)',
        },
        border:  'var(--border)',
        input:   'var(--input)',
        ring:    'var(--ring)',
        sidebar: {
          DEFAULT:    'var(--sidebar)',
          foreground: 'var(--sidebar-foreground)',
          border:     'var(--sidebar-border)',
        },
        chart: {
          1: 'var(--chart-1)',
          2: 'var(--chart-2)',
          3: 'var(--chart-3)',
          4: 'var(--chart-4)',
          5: 'var(--chart-5)',
        },
      },
      borderRadius: {
        lg: 'var(--radius)',
        md: 'calc(var(--radius) - 2px)',
        sm: 'calc(var(--radius) - 4px)',
      },
      fontFamily: {
        sans: ['Inter', 'system-ui', 'sans-serif'],
      },
      boxShadow: {
        card:  '0 2px 12px rgba(0,0,0,0.06)',
        float: '0 8px 32px rgba(0,0,0,0.12)',
      },
      keyframes: {
        'slide-up': {
          '0%':   { transform: 'translateY(16px)', opacity: '0' },
          '100%': { transform: 'translateY(0)',    opacity: '1' },
        },
        'fade-in': {
          '0%':   { opacity: '0' },
          '100%': { opacity: '1' },
        },
        'scale-in': {
          '0%':   { transform: 'scale(0.85)', opacity: '0' },
          '100%': { transform: 'scale(1)',    opacity: '1' },
        },
      },
      animation: {
        'slide-up': 'slide-up 0.3s ease-out',
        'fade-in':  'fade-in 0.2s ease-in',
        'scale-in': 'scale-in 0.3s ease-out',
      },
    },
  },
  plugins: [],
}
```

---

## STEP 6 — Create `src/lib/utils.js`

Create the file `frontend/src/lib/utils.js`:

```js
import { clsx } from 'clsx'
import { twMerge } from 'tailwind-merge'

export function cn(...inputs) {
  return twMerge(clsx(inputs))
}
```

---

## STEP 7 — Create `ThemeProvider` component

Create `frontend/src/components/common/ThemeProvider.jsx`:

```jsx
import { ThemeProvider as NextThemesProvider } from 'next-themes'

export function ThemeProvider({ children }) {
  return (
    <NextThemesProvider
      attribute="class"
      defaultTheme="light"
      enableSystem={false}
      storageKey="parkease-theme"
    >
      {children}
    </NextThemesProvider>
  )
}
```

---

## STEP 8 — Create `ThemeToggle` component

Create `frontend/src/components/common/ThemeToggle.jsx`:

```jsx
import { Moon, Sun } from 'lucide-react'
import { useTheme } from 'next-themes'
import { useEffect, useState } from 'react'

export function ThemeToggle() {
  const { theme, setTheme, resolvedTheme } = useTheme()
  const [mounted, setMounted] = useState(false)

  useEffect(() => setMounted(true), [])
  if (!mounted) return null

  const isDark = (resolvedTheme ?? theme) === 'dark'

  return (
    <button
      type="button"
      onClick={() => setTheme(isDark ? 'light' : 'dark')}
      className="flex w-full items-center justify-between rounded-md border border-border px-3 py-2 text-sm hover:bg-muted transition-colors"
    >
      <span>Theme</span>
      {isDark ? (
        <span className="inline-flex items-center gap-2 text-muted-foreground">
          Dark <Moon className="size-4" />
        </span>
      ) : (
        <span className="inline-flex items-center gap-2 text-muted-foreground">
          Light <Sun className="size-4" />
        </span>
      )}
    </button>
  )
}
```

---

## STEP 9 — Create `ColorThemePicker` component

Create `frontend/src/components/common/ColorThemePicker.jsx`:

```jsx
import { useEffect, useState } from 'react'

const BRANDS = [
  { key: 'purple', label: 'Purple', color: '#9333ea' },
  { key: 'blue',   label: 'Blue',   color: '#2563eb' },
  { key: 'teal',   label: 'Teal',   color: '#0d9488' },
  { key: 'orange', label: 'Orange', color: '#ea580c' },
  { key: 'pink',   label: 'Pink',   color: '#db2777' },
]

export function ColorThemePicker() {
  const [current, setCurrent] = useState('purple')

  useEffect(() => {
    const saved = localStorage.getItem('parkease-brand') || 'purple'
    setCurrent(saved)
    document.documentElement.setAttribute('data-brand', saved)
  }, [])

  function setBrand(key) {
    setCurrent(key)
    document.documentElement.setAttribute('data-brand', key)
    localStorage.setItem('parkease-brand', key)
  }

  return (
    <div className="px-1 pb-1">
      <p className="mb-2 text-xs text-muted-foreground px-1">Brand color</p>
      <div className="flex items-center gap-2 px-1">
        {BRANDS.map((b) => (
          <button
            key={b.key}
            aria-label={`Use ${b.label} theme`}
            onClick={() => setBrand(b.key)}
            className={`size-6 rounded-full ring-offset-2 ring-offset-background transition-all focus-visible:outline-none focus-visible:ring-2 ${
              current === b.key ? 'ring-2 ring-ring scale-110' : 'ring-transparent hover:scale-105'
            }`}
            style={{ backgroundColor: b.color }}
          />
        ))}
      </div>
    </div>
  )
}
```

---

## STEP 10 — Update `frontend/src/main.jsx`

Wrap the app with `ThemeProvider` and replace `react-hot-toast` `Toaster` with `sonner`'s `Toaster`:

```jsx
import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './index.css'
import App from './App'
import { ThemeProvider } from './components/common/ThemeProvider'
import { Toaster } from 'sonner'

createRoot(document.getElementById('root')).render(
  <StrictMode>
    <ThemeProvider>
      <App />
      <Toaster
        position="top-right"
        richColors
        closeButton
        toastOptions={{ duration: 4000 }}
      />
    </ThemeProvider>
  </StrictMode>
)
```

---

## STEP 11 — Add Inter font to `frontend/index.html`

Add inside `<head>`:

```html
<link rel="preconnect" href="https://fonts.googleapis.com" />
<link rel="preconnect" href="https://fonts.gstatic.com" crossorigin />
<link
  href="https://fonts.googleapis.com/css2?family=Inter:wght@300;400;500;600;700;800&display=swap"
  rel="stylesheet"
/>
```

Also update the `<title>` to `ParkEase – Smart P2P Parking`.

---

## STEP 12 — Initialize brand color on app boot

In `frontend/src/App.jsx`, add this at the top of the component (before the router):

```jsx
useEffect(() => {
  const saved = localStorage.getItem('parkease-brand') || 'purple'
  document.documentElement.setAttribute('data-brand', saved)
}, [])
```

---

## VERIFICATION CHECKLIST

Before marking Phase 1 complete, confirm ALL of these:

- [ ] `npm run dev` starts without errors
- [ ] `npm run build` completes without errors (no missing module warnings)
- [ ] The app renders with a white/light background (Inter font visible)
- [ ] No console errors about missing packages (`@googlemaps`, `@stripe`)
- [ ] `src/lib/utils.js` exists with `cn()` helper
- [ ] `src/components/common/ThemeProvider.jsx` exists
- [ ] `src/components/common/ThemeToggle.jsx` exists
- [ ] `src/components/common/ColorThemePicker.jsx` exists
- [ ] `src/components/ui/` directory has shadcn components (button.jsx, card.jsx, etc.)
- [ ] Tailwind CSS variable colors are working (test by temporarily adding `className="bg-brand text-white p-4"` to App.jsx and confirming it shows purple)
- [ ] Dark mode class toggle works (manually add `class="dark"` to `<html>` and confirm background goes dark)

---

## IMPORTANT NOTES FOR NEXT PHASES

- Do NOT start Phase 2 until this phase builds cleanly.
- The `cn()` utility from `src/lib/utils.js` must be imported in EVERY component that uses conditional classNames.
- All brand-colored elements must use `bg-brand`, `text-brand`, `border-brand`, `ring-brand` — never hardcoded colors like `bg-purple-600`.
- All toast calls going forward use `import { toast } from 'sonner'` — NOT `react-hot-toast`.
