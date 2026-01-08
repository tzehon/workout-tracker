# Workout Tracker

[![CI](https://github.com/tzehon/workout-tracker/actions/workflows/ci.yml/badge.svg)](https://github.com/tzehon/workout-tracker/actions/workflows/ci.yml)

A full-stack web application for tracking an 18-week gymnastic rings bodyweight training program. Built with Next.js, TypeScript, Tailwind CSS, MongoDB, and NextAuth.js.

**Live URL:** https://workout.tth.dev

## Features

- **Google OAuth Authentication** - Secure sign-in with your Google account
- **Explicit Workout Control** - Preview workout → Start → Save/Complete (no accidental saves)
- **Workout Logging** - Track sets, reps, and per-set notes for each exercise
- **Free-Text Progression Variants** - Enter custom progression descriptions with autocomplete
- **Rest Timer** - Built-in timer with vibration notification on mobile
- **Workout History** - View past workouts with all logged data
- **Dashboard** - Current phase/week display, training week session tracker, progress overview
- **Flexible Training Weeks** - Complete all 4 sessions at your own pace, no calendar pressure
- **Auto Week Progression** - Prompts to advance when all 4 sessions are complete, with options to repeat phases
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

We create **two GCP projects**: one for local development, one for production.

- **Security isolation** - If dev credentials leak, production is unaffected
- **Different configurations** - Dev stays in "Testing" mode (easy), production can be published (if needed)
- **Audit separation** - Usage metrics are tracked separately

---

#### Create Development OAuth Credentials

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
     - App name: `Workout Tracker (Dev)`
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
   - Name: `Workout Tracker Dev`

   **Authorized JavaScript origins:**
   ```
   http://localhost:3000
   ```
   *Why: Tells Google which domains can initiate OAuth requests. Prevents other websites from using your credentials.*

   **Authorized redirect URIs:**
   ```
   http://localhost:3000/api/auth/callback/google
   ```
   *Why: After authentication, Google redirects users back to your app at this URL. Google ONLY redirects to URLs in this list - this prevents attackers from stealing auth codes by redirecting to malicious sites. Must be exact matches (no wildcards).*

   - Click "Create"

7. **Copy your Client ID and Client Secret**

   - **Client ID** - Public identifier for your app. Safe to expose in frontend code.
   - **Client Secret** - Private key proving your server's identity. **NEVER expose this.** Store only in environment variables, never commit to git.

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
| `npm run seed` | Seed dev database with sample data |
| `npm run seed:delete` | Delete seeded sample data |

### Seeding Development Data

To test the UI with realistic data (workouts, body metrics, charts), you can seed your local database:

```bash
# Seed 6 weeks of data (1 complete phase) - default
SEED_USER_EMAIL=your@email.com npm run seed

# Seed specific number of weeks
SEED_USER_EMAIL=your@email.com npm run seed 4   # 4 weeks (partial phase)
SEED_USER_EMAIL=your@email.com npm run seed 12  # 12 weeks (2 phases)

# Delete all seeded data
SEED_USER_EMAIL=your@email.com npm run seed:delete
```

**Requirements:**
- Local MongoDB must be running (`atlas deployments start local`)
- You must have logged in at least once to create your user account
- `SEED_USER_EMAIL` must match the email you logged in with

**What gets seeded:**
- Workouts: 4 per week (Push 1, Pull 1, Push 2, Pull 2)
- Body metrics: 2 weigh-ins per week
- Realistic progression: reps increase through weeks, deload week has reduced volume

### Training Week System

Training weeks are **flexible and not tied to calendar dates**. This design accommodates real-life schedules where you might not complete all sessions in a single calendar week.

#### How It Works

1. **Each training week has 4 sessions:** Push 1, Pull 1, Push 2, Pull 2
2. **Complete them at your own pace** - take 5 days or 2 weeks, it doesn't matter
3. **Progress is tracked per training week** - your dashboard shows sessions completed in your current training week (not calendar week)
4. **Advance when ready** - once all 4 sessions are complete, you'll be prompted to move to the next week

#### Example Scenario

| Real Date | Action | Training Progress |
|-----------|--------|-------------------|
| Monday | Push 1 | Week 1: 1/4 |
| Thursday | Pull 1 | Week 1: 2/4 |
| (Weekend off) | - | - |
| Next Monday | Push 2 | Week 1: 3/4 |
| Next Wednesday | Pull 2 | Week 1: 4/4 ✓ |
| (Prompted to advance) | Click "Move to Week 2" | Week 2: 0/4 |

Your previous session data (sets, reps, variants, ring height) carries over to help you track progression, regardless of when you did them.

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
Push to main → GitHub Actions → Vercel Production
                    ↓
             Lint + Type Check
                    ↓
               Run Tests
                    ↓
            Build Verification
                    ↓
         Deploy to workout.tth.dev
```

### What Happens on Push

1. **Lint** - ESLint checks code quality
2. **Type Check** - TypeScript validates types
3. **Test** - Vitest runs all tests
4. **Build** - Verifies production build succeeds
5. **Deploy** - Vercel deploys to production

---

## Deployment

### Setting Up MongoDB Atlas (Production)

1. Go to [MongoDB Atlas](https://cloud.mongodb.com/)
2. Create organization (if needed) → Create project: `workout-tracker-prod`
3. Create a cluster:
   - Choose FREE M0 tier (or M2+ for better performance/backups)
   - Select region close to Vercel (e.g., `aws-us-east-1` or `aws-ap-southeast-1`)
4. Set up Database Access:
   - Create user with read/write permissions
5. Set up Network Access:
   - Add `0.0.0.0/0` (allow from anywhere - required for Vercel)
6. Get connection string from "Connect" → "Drivers"

### Setting Up Vercel

1. **Import Project**
   - Go to [Vercel](https://vercel.com) → "Add New" → "Project"
   - Import your GitHub repository

2. **Configure Environment Variables**

   Go to Project Settings → Environment Variables.

   For each variable:
   1. Click "Add New" → "Environment Variable"
   2. Enter the Key and Value
   3. Environments: **Check only "Production"** (uncheck Preview and Development)
   4. Click "Save"

   #### All Variables to Add

   | Variable | Value | Sensitive |
   |----------|-------|-----------|
   | `MONGODB_URI` | Your production Atlas connection string | No |
   | `GOOGLE_CLIENT_ID` | Client ID from `workout-tracker-prod` GCP project | No |
   | `GOOGLE_CLIENT_SECRET` | Client Secret from `workout-tracker-prod` GCP project | Yes |
   | `NEXTAUTH_SECRET` | Random secret (`openssl rand -base64 32`) | Yes |
   | `NEXTAUTH_URL` | `https://workout.tth.dev` | No |

   #### Final Result

   5 environment variables, all set to **Production** environment only.

3. **Configure Custom Domains**

   Go to Project Settings → **Domains** in the left sidebar.

   You'll see a default Vercel domain (e.g., `workout-tracker-xyz.vercel.app`) already assigned to Production.

   **Add Production Domain:**
   1. Click **"Add Domain"** button (top right)
   2. In the modal:
      - Enter your domain: `workout.tth.dev`
      - Select **"Connect to an environment"**
      - Choose **"Production"** from the dropdown
   3. Click **"Save"**

   **Configure DNS:**

   After saving, the domain appears in your list with **"Invalid Configuration"** (red warning). This is expected - you need to configure DNS.

   4. Click **"Learn more"** next to "Invalid Configuration" to expand DNS instructions
   5. You'll see a **DNS Records** tab with a table showing:
      | Type | Name | Value |
      |------|------|-------|
      | CNAME | `workout` | `abc123.vercel-dns-017.com.` |

      *(The Value is unique to your project - copy the exact value shown)*

   6. Go to your DNS provider (e.g., Cloudflare, Namecheap, Google Domains) and add this record:
      - Type: **CNAME**
      - Name: Copy from Vercel (e.g., `workout`)
      - Value: Copy the full value from Vercel (e.g., `abc123.vercel-dns-017.com.`)

   7. Wait for DNS propagation (1-10 minutes), then click **"Refresh"** in Vercel
   8. Status should change to **"Valid Configuration"** (blue checkmark)

   **Final Result:**

   Your Domains list should show:
   | Domain | Status | Environment |
   |--------|--------|-------------|
   | `workout-tracker-xyz.vercel.app` | ✓ Valid | Production |
   | `workout.tth.dev` | ✓ Valid | Production |

### Development Workflow

Simple two-environment setup: **Local** → **Production**

```
┌─────────────────────────────────────────────────────────────────┐
│                    DEVELOPMENT WORKFLOW                          │
├─────────────────────────────────────────────────────────────────┤
│                                                                 │
│   LOCAL                                    PRODUCTION           │
│   (localhost:3000)                         (workout.tth.dev)    │
│                                                                 │
│   ┌─────────────┐                         ┌─────────────┐       │
│   │    main     │ ────── git push ──────► │    main     │       │
│   └─────────────┘                         └─────────────┘       │
│         │                                       │               │
│         ▼                                       ▼               │
│   Local MongoDB                          Production Atlas       │
│   Dev OAuth                              Production OAuth       │
│                                                                 │
└─────────────────────────────────────────────────────────────────┘
```

#### Environment Summary

| Environment | URL | Database | OAuth |
|-------------|-----|----------|-------|
| Local | `localhost:3000` | Atlas CLI (local) | Dev GCP project |
| Production | `workout.tth.dev` | Production Atlas | Prod GCP project |

#### Daily Development

```bash
# 1. Start local MongoDB
atlas deployments start local

# 2. Start dev server
npm run dev

# 3. Make changes and test locally
npm test

# 4. Commit and push to production
git add .
git commit -m "Add my feature"
git push origin main
# → Automatically deploys to workout.tth.dev
```

#### Quick Reference

| Action | Command |
|--------|---------|
| Start local dev | `atlas deployments start local && npm run dev` |
| Run tests | `npm test` |
| Deploy to production | `git add . && git commit -m "message" && git push` |

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
- Ensure all required vars are set in Vercel for Production environment
- Check that `NEXTAUTH_URL` matches your production domain

---

## Contributing

1. **Fork the repository** (if external contributor)
2. **Make your changes** following the existing code style
3. **Write/update tests** for your changes
4. **Run tests locally:** `npm test`
5. **Push to main** (auto-deploys to production)

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
