# Workout Tracker

A full-stack web application for tracking an 18-week gymnastic rings bodyweight training program. Built with Next.js, TypeScript, Tailwind CSS, MongoDB, and NextAuth.js.

**Live URL:** https://workout.tth.dev

## Features

- **Google OAuth Authentication** - Secure sign-in with your Google account
- **Explicit Workout Control** - Preview workout → Start → Save/Complete (no accidental saves)
- **Workout Logging** - Track sets, reps, and per-set notes for each exercise
- **Free-Text Progression Variants** - Enter custom progression descriptions with autocomplete
- **Rest Timer** - Built-in timer with vibration notification on mobile
- **Workout History** - View past workouts with all logged data
- **Dashboard** - Current phase/week display, clickable weekly schedule, progress tracking
- **Exercise Progress** - Per-exercise stats with rep trends and variant history
- **Progress Charts** - Visual charts for volume trends and completion
- **Body Metrics** - Track body weight over time with trend charts
- **Dark/Light Mode** - Theme toggle with system preference support

## Tech Stack

| Category | Technology |
|----------|------------|
| Framework | Next.js 16 (App Router) |
| Language | TypeScript 5 |
| Styling | Tailwind CSS, shadcn/ui |
| Database | MongoDB (Atlas CLI local / Atlas Cloud) |
| Auth | NextAuth.js with Google OAuth |
| Charts | Recharts |
| Testing | Vitest, Testing Library |
| CI/CD | GitHub Actions |
| Hosting | Vercel |

---

## Quick Start (Existing Contributors)

If you've already set everything up before:

```bash
# Start local MongoDB
atlas deployments start local

# Start dev server
npm run dev

# Run tests
npm test
```

---

## Initial Setup Guide

Follow these steps if you're setting up the project for the first time.

### Prerequisites

- **Node.js 18+** - [Download](https://nodejs.org/)
- **Git** - [Download](https://git-scm.com/)
- **Atlas CLI** - [Installation Guide](https://www.mongodb.com/docs/atlas/cli/current/install-atlas-cli/)
- **Google Cloud account** - [Console](https://console.cloud.google.com/)
- **GitHub account** - For repository access and CI/CD
- **Vercel account** - For deployment (optional for local dev)

### Step 1: Clone and Install

```bash
git clone https://github.com/yourusername/workout-tracker.git
cd workout-tracker
npm install
```

### Step 2: Set Up Local MongoDB (Atlas CLI)

We use Atlas CLI's local deployment for development. This gives you a local MongoDB instance that mirrors Atlas functionality.

```bash
# Install Atlas CLI (macOS)
brew install mongodb-atlas-cli

# Or on other platforms, see: https://www.mongodb.com/docs/atlas/cli/current/install-atlas-cli/

# Create and start a local deployment
atlas deployments setup local --type local --port 27017

# Start the deployment (run this each time you start development)
atlas deployments start local

# Verify it's running
atlas deployments list
```

Your local connection string will look like:
```
mongodb://localhost:<port>/workout-tracker?directConnection=true
```

Find your port by running `atlas deployments list`. Then append `/workout-tracker` (the database name) before any query parameters. MongoDB creates the database automatically on first write.

Example: If your connection string is `mongodb://localhost:51120/?directConnection=true`, use:
```
MONGODB_URI=mongodb://localhost:51120/workout-tracker?directConnection=true
```

**Useful Atlas CLI commands:**
```bash
atlas deployments start local    # Start local MongoDB
atlas deployments pause local    # Pause local MongoDB
atlas deployments list           # List all deployments
atlas deployments logs local     # View logs
```

### Step 3: Set Up Google OAuth

#### OAuth Concepts Overview

When a user clicks "Sign in with Google", here's what happens:

1. Your app redirects the user to Google's login page
2. User enters their Google credentials (on Google's site, not yours)
3. Google asks user: "Do you want to let [Your App] access your email/profile?"
4. User clicks "Allow"
5. Google redirects back to your app with an authorization code
6. Your server exchanges that code for user info (email, name, profile picture)

**Why OAuth?** You never handle the user's Google password. Google authenticates them and just tells you "yes, this is user@gmail.com". This is more secure for everyone.

#### Why Separate Projects for Dev vs Production?

We create **two GCP projects**: one for dev/staging, one for production.

- **Security isolation** - If dev credentials leak, production is unaffected
- **Different configurations** - Dev stays in "Testing" mode (easy), production can be published (if needed)
- **Audit separation** - Usage metrics are tracked separately

---

#### Create Development/Staging OAuth Credentials

1. **Go to [Google Cloud Console](https://console.cloud.google.com/)**

2. **Create a new project**
   - Click project dropdown → "New Project"
   - Name: `workout-tracker-dev-stg`
   - Click "Create"

   *Why: GCP projects are containers for resources. OAuth credentials live inside a project.*

3. **Configure OAuth Consent Screen**
   - Go to "APIs & Services" → "OAuth consent screen" in the sidebar
   - This opens the "Google Auth Platform" interface

4. **Configure Branding**
   - Go to "Branding" in the left sidebar
   - Fill in:
     - App name: `Workout Tracker (Dev/Staging)`
     - User support email: Your email
     - Developer contact email: Your email
   - Save

   *Why: This is what users see on the "Sign in with Google" consent screen. Google requires contact info for users.*

5. **Configure Audience & Test Users**
   - Go to "Audience" in the left sidebar
   - User type should be "External"
   - Under "Test users", click "+ Add users"
   - Add your email address (and any teammates)
   - Save

   *Why "External": "Internal" is only for Google Workspace orgs. "External" allows any Google account.*

   *Why test users: In "Testing" mode, only whitelisted emails can sign in (up to 100). Bypasses Google's app verification. Perfect for personal projects.*

   > **Keep in "Testing" mode** - Only emails you add as test users can sign in. No verification required.

6. **Create OAuth Client**
   - Go to "Clients" in the left sidebar
   - Click "+ Create Client"
   - Application type: "Web application"
   - Name: `Workout Tracker Dev/Staging`

   **Authorized JavaScript origins:**
   ```
   http://localhost:3000
   https://staging.workout.tth.dev
   ```
   *Why: Tells Google which domains can initiate OAuth requests. Prevents other websites from using your credentials.*

   **Authorized redirect URIs:**
   ```
   http://localhost:3000/api/auth/callback/google
   https://staging.workout.tth.dev/api/auth/callback/google
   ```
   *Why: After authentication, Google redirects users back to your app at this URL. Google ONLY redirects to URLs in this list - this prevents attackers from stealing auth codes by redirecting to malicious sites. Must be exact matches (no wildcards).*

   - Click "Create"

7. **Copy your Client ID and Client Secret**

   - **Client ID** - Public identifier for your app. Safe to expose in frontend code.
   - **Client Secret** - Private key proving your server's identity. **NEVER expose this.** Store only in environment variables, never commit to git.

> **Note:** Google OAuth doesn't allow wildcard redirect URIs, so we use a dedicated staging subdomain (`staging.workout.tth.dev`) instead of Vercel's random preview URLs.

---

#### Create Production OAuth Credentials (When Ready to Deploy)

Repeat the above steps with a separate GCP project:

1. **Create project:** `workout-tracker-prod`
2. **Configure Branding:** App name: `Workout Tracker`
3. **Configure Audience:** Add yourself as a test user
4. **Create OAuth Client:**
   - Authorized origins: `https://workout.tth.dev`
   - Authorized redirect URIs: `https://workout.tth.dev/api/auth/callback/google`

**Publishing Status** - Choose based on your needs:

| Option | Who Can Sign In | Verification |
|--------|-----------------|--------------|
| Testing (recommended for personal use) | Only test users you add (up to 100) | None required |
| Production | Anyone with a Google account | May require Google verification |

> **For a personal app:** Stay in "Testing" mode and add yourself as a test user. No verification needed.
>
> **To publish:** Go to "Audience" → Look for publishing options, or "Verification centre" in the sidebar. Google may require a privacy policy, terms of service, and manual review.

### Step 4: Configure Environment Variables

```bash
cp .env.local.example .env.local
```

Edit `.env.local` with your values:

```env
# Local MongoDB (Atlas CLI)
MONGODB_URI=mongodb://localhost:27017/workout-tracker

# Google OAuth (Dev credentials)
GOOGLE_CLIENT_ID=your-dev-client-id.apps.googleusercontent.com
GOOGLE_CLIENT_SECRET=your-dev-client-secret

# NextAuth.js
NEXTAUTH_SECRET=generate-a-random-secret-see-below
NEXTAUTH_URL=http://localhost:3000
```

Generate a secure `NEXTAUTH_SECRET`:
```bash
openssl rand -base64 32
```

### Step 5: Run the Development Server

```bash
# Make sure local MongoDB is running
atlas deployments start local

# Start the dev server
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) - you should see the login page.

---

## Development Workflow

### Branching Strategy

```
main (production)
  └── feature/your-feature-name
  └── fix/bug-description
```

### Daily Development

```bash
# 1. Start local MongoDB
atlas deployments start local

# 2. Create a feature branch
git checkout -b feature/your-feature-name

# 3. Start dev server
npm run dev

# 4. Run tests as you develop
npm test

# 5. Commit your changes
git add .
git commit -m "Add your feature"

# 6. Push and create PR
git push -u origin feature/your-feature-name
```

### Available Scripts

| Command | Description |
|---------|-------------|
| `npm run dev` | Start development server |
| `npm run build` | Build for production |
| `npm run start` | Start production server |
| `npm run lint` | Run ESLint |
| `npm test` | Run tests in watch mode |
| `npm run test:run` | Run tests once |
| `npm run test:coverage` | Run tests with coverage |

---

## Testing

We use **Vitest** for unit and integration tests with **Testing Library** for component testing.

### Running Tests

```bash
# Watch mode (recommended during development)
npm test

# Single run
npm run test:run

# With coverage report
npm run test:coverage

# With UI
npm run test:ui
```

### Test Structure

```
tests/
├── setup.ts              # Test setup and global mocks
├── lib/                   # Unit tests for utilities
│   ├── utils.test.ts
│   └── date-utils.test.ts
├── api/                   # Integration tests for API routes
│   ├── workouts.test.ts
│   └── metrics.test.ts
└── components/            # Component tests
    └── WorkoutCard.test.ts
```

### Writing Tests

**Unit test example:**
```typescript
import { describe, it, expect } from 'vitest'
import { formatTime } from '@/lib/utils'

describe('formatTime', () => {
  it('formats seconds into MM:SS', () => {
    expect(formatTime(90)).toBe('1:30')
    expect(formatTime(0)).toBe('0:00')
  })
})
```

**API integration test example:**
```typescript
import { describe, it, expect, beforeAll, afterAll } from 'vitest'
// Tests use mongodb-memory-server for isolated database testing
```

---

## CI/CD Pipeline

We use **GitHub Actions** for continuous integration and **Vercel** for deployment.

### Pipeline Overview

```
Push to branch → GitHub Actions → Vercel Preview
                      ↓
               Lint + Type Check
                      ↓
                 Run Tests
                      ↓
               Build Verification

Merge to main → GitHub Actions → Vercel Production
                      ↓
                 Same checks
                      ↓
              Deploy to workout.tth.dev
```

### What Happens on PR

1. **Lint** - ESLint checks code quality
2. **Type Check** - TypeScript validates types
3. **Test** - Vitest runs all tests
4. **Build** - Verifies production build succeeds
5. **Preview Deploy** - Vercel creates a unique preview URL

### Branch Protection

The `main` branch requires:
- All CI checks to pass
- At least one approval (if working in a team)

---

## Deployment

### Environment Overview

| Environment | URL | Database | OAuth (GCP Project) |
|-------------|-----|----------|---------------------|
| Local | localhost:3000 | Atlas CLI local | `workout-tracker-dev-stg` |
| Staging | staging.workout.tth.dev | Atlas staging project | `workout-tracker-dev-stg` |
| Production | workout.tth.dev | Atlas prod project | `workout-tracker-prod` |

### Setting Up MongoDB Atlas (Staging & Production)

You'll need **two separate Atlas projects** for staging and production.

#### Create Staging Atlas Project

1. Go to [MongoDB Atlas](https://cloud.mongodb.com/)
2. Create organization (if needed) → Create project: `workout-tracker-staging`
3. Create a cluster:
   - Choose FREE M0 tier
   - Select region close to Vercel (e.g., `aws-us-east-1` or `aws-ap-southeast-1`)
4. Set up Database Access:
   - Create user with read/write permissions
5. Set up Network Access:
   - Add `0.0.0.0/0` (allow from anywhere - required for Vercel)
6. Get connection string from "Connect" → "Drivers"

#### Create Production Atlas Project

Repeat the above with project name: `workout-tracker-prod`

> **Tip:** Consider using a paid tier (M2+) for production for better performance and backups.

### Setting Up Vercel

1. **Import Project**
   - Go to [Vercel](https://vercel.com) → "Add New" → "Project"
   - Import your GitHub repository

2. **Configure Environment Variables**

   Go to Project Settings → Environment Variables. For each variable, you'll see environment checkboxes:
   - **Production** - Used for your main domain (workout.tth.dev)
   - **Preview** - Used for PR previews and staging (staging.workout.tth.dev)
   - **Development** - Used when running `vercel dev` locally (rarely needed)

   #### Step-by-Step Variable Setup

   **Variable 1: `MONGODB_URI`**

   You need TWO entries for this variable (different values for each environment):

   | Entry | Value | Environments |
   |-------|-------|--------------|
   | 1 | `mongodb+srv://user:pass@prod-cluster.mongodb.net/workout-tracker?retryWrites=true&w=majority` | ☑ Production only |
   | 2 | `mongodb+srv://user:pass@staging-cluster.mongodb.net/workout-tracker?retryWrites=true&w=majority` | ☑ Preview only |

   **Variable 2: `GOOGLE_CLIENT_ID`**

   | Entry | Value | Environments |
   |-------|-------|--------------|
   | 1 | Your production OAuth Client ID | ☑ Production only |
   | 2 | Your dev/staging OAuth Client ID | ☑ Preview only |

   **Variable 3: `GOOGLE_CLIENT_SECRET`**

   | Entry | Value | Environments |
   |-------|-------|--------------|
   | 1 | Your production OAuth Client Secret | ☑ Production only |
   | 2 | Your dev/staging OAuth Client Secret | ☑ Preview only |

   > Enable **Sensitive** toggle for secrets so they can't be read after creation.

   **Variable 4: `NEXTAUTH_SECRET`**

   Generate two different secrets (`openssl rand -base64 32`):

   | Entry | Value | Environments |
   |-------|-------|--------------|
   | 1 | `<random-secret-1>` | ☑ Production only |
   | 2 | `<random-secret-2>` | ☑ Preview only |

   **Variable 5: `NEXTAUTH_URL`**

   | Entry | Value | Environments |
   |-------|-------|--------------|
   | 1 | `https://workout.tth.dev` | ☑ Production only |
   | 2 | `https://staging.workout.tth.dev` | ☑ Preview only |

   #### Summary Table

   After setup, you should have these entries:

   | Variable | Production Value | Preview Value |
   |----------|-----------------|---------------|
   | `MONGODB_URI` | prod Atlas URI | staging Atlas URI |
   | `GOOGLE_CLIENT_ID` | prod OAuth ID | dev/stg OAuth ID |
   | `GOOGLE_CLIENT_SECRET` | prod OAuth secret | dev/stg OAuth secret |
   | `NEXTAUTH_SECRET` | unique secret #1 | unique secret #2 |
   | `NEXTAUTH_URL` | `https://workout.tth.dev` | `https://staging.workout.tth.dev` |

   > **Why separate values?** Production and staging use different databases and OAuth credentials. This prevents staging from accidentally modifying production data, and keeps credentials isolated.

   > **Note:** OAuth will only work on `staging.workout.tth.dev` (not random Vercel preview URLs like `project-abc123.vercel.app`) because Google requires exact redirect URIs.

3. **Configure Custom Domains**

   **Production domain:**
   - Go to Project Settings → Domains
   - Add `workout.tth.dev`
   - Add DNS record at your registrar:
     - Type: `CNAME`
     - Name: `workout`
     - Value: `cname.vercel-dns.com`

   **Staging domain:**
   - Add `staging.workout.tth.dev` to the same project
   - Assign it to a specific branch (e.g., `develop`) or use as preview domain
   - Add DNS record:
     - Type: `CNAME`
     - Name: `staging.workout`
     - Value: `cname.vercel-dns.com`

4. **Configure Staging Environment Variables**

   In Vercel, you can set environment variables per domain. For `staging.workout.tth.dev`:
   - Set `MONGODB_URI` to your staging Atlas URI
   - Set `NEXTAUTH_URL` to `https://staging.workout.tth.dev`

### Deployment Flow

**Automatic deployments:**
- Push to any branch → Creates preview deployment
- Merge/push to `main` → Deploys to production

**Manual promotion:**
- In Vercel dashboard, you can promote any preview to production

---

## Project Structure

```
workout-tracker/
├── app/
│   ├── (auth)/login/          # Login page
│   ├── (protected)/           # Authenticated routes
│   │   ├── dashboard/         # Main dashboard
│   │   ├── workout/           # Workout logging
│   │   ├── exercises/         # Exercise library
│   │   ├── progress/          # Progress charts
│   │   ├── metrics/           # Body metrics
│   │   ├── settings/          # User settings
│   │   └── program/           # Program info
│   ├── api/                   # API routes
│   │   ├── auth/[...nextauth]/
│   │   ├── user/
│   │   ├── workouts/
│   │   ├── metrics/
│   │   └── program/
│   ├── layout.tsx
│   └── globals.css
├── components/
│   ├── ui/                    # shadcn/ui components
│   ├── workout/               # Workout components
│   ├── dashboard/             # Dashboard widgets
│   ├── layout/                # Header, BottomNav
│   └── providers/             # Context providers
├── lib/
│   ├── mongodb.ts             # Database connection
│   ├── auth.ts                # NextAuth config
│   ├── program-data.ts        # Training program data
│   ├── date-utils.ts          # Date utilities
│   └── utils.ts               # General utilities
├── tests/                     # Test files
├── types/                     # TypeScript types
├── .github/workflows/         # CI/CD workflows
└── vercel.json                # Vercel config
```

---

## Troubleshooting

### MongoDB Connection Issues

**Local MongoDB won't start:**
```bash
# Check if deployment exists
atlas deployments list

# If not, create it
atlas deployments setup local --type local --port 27017

# Check logs for errors
atlas deployments logs local
```

**Atlas connection timeout:**
- Verify IP whitelist includes `0.0.0.0/0` for Vercel
- Check connection string format

### Google OAuth Issues

**`redirect_uri_mismatch` error:**
- Ensure redirect URI exactly matches (no trailing slash)
- Local: `http://localhost:3000/api/auth/callback/google`
- Production: `https://workout.tth.dev/api/auth/callback/google`

**`Access blocked: This app's request is invalid`:**
- In testing mode? Add your email to test users
- Check OAuth consent screen is configured

### Build/Deploy Issues

**Build fails on Vercel:**
```bash
# Reproduce locally
npm run build

# Check for type errors
npx tsc --noEmit

# Check for lint errors
npm run lint
```

**Environment variable issues:**
- Ensure all required vars are set in Vercel for each environment
- `NEXTAUTH_URL` should be empty for Preview, set for Production

---

## Contributing

1. **Fork the repository** (if external contributor)
2. **Create a feature branch:** `git checkout -b feature/your-feature`
3. **Make your changes** following the existing code style
4. **Write/update tests** for your changes
5. **Run tests locally:** `npm test`
6. **Push and create a PR**

### Code Style

- TypeScript strict mode enabled
- ESLint with Next.js config
- Prettier formatting (configure your editor)
- Component naming: PascalCase
- Utility functions: camelCase
- Files: kebab-case

### Commit Messages

Use descriptive commit messages:
```
Add rest timer vibration on mobile
Fix workout save race condition
Update dashboard progress calculation
```

---

## License

This project is private and intended for personal use.
