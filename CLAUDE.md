# Claude Code Context

## Project Overview
Workout Tracker - A full-stack web app for tracking an 18-week gymnastic rings bodyweight training program.

## Tech Stack
- **Framework:** Next.js 16 (App Router)
- **Language:** TypeScript 5 (strict mode)
- **Styling:** Tailwind CSS + shadcn/ui
- **Database:** MongoDB (Atlas CLI local for dev, Atlas Cloud for staging/prod)
- **Auth:** NextAuth.js with Google OAuth
- **Testing:** Vitest + Testing Library
- **CI/CD:** GitHub Actions + Vercel

## Key Commands
```bash
npm run dev          # Start dev server
npm test             # Run tests in watch mode
npm run test:run     # Run tests once
npm run build        # Production build
npm run lint         # ESLint
npx tsc --noEmit     # Type check
```

## Local Development
```bash
atlas deployments start local   # Start local MongoDB
npm run dev                      # Start Next.js dev server
```

## Project Structure
```
app/
├── (auth)/login/        # Public login page
├── (protected)/         # Auth-required routes
│   ├── dashboard/       # Main dashboard
│   ├── workout/         # Workout logging
│   ├── exercises/       # Exercise library
│   ├── progress/        # Progress charts
│   ├── metrics/         # Body weight tracking
│   └── settings/        # User settings
└── api/                 # API routes

components/
├── ui/                  # shadcn/ui base components
├── workout/             # ExerciseCard, SetInput, RestTimer
├── dashboard/           # WeeklySchedule, RecentWorkouts
└── layout/              # Header, BottomNav

lib/
├── mongodb.ts           # Database connection
├── auth.ts              # NextAuth config
├── program-data.ts      # 18-week program data
└── utils.ts             # Utility functions

types/
└── index.ts             # All TypeScript types
```

## Key Types
- `Workout` - A logged workout session
- `ExerciseLog` - Exercise within a workout (sets, reps, progression)
- `SetLog` - Individual set (reps, completed, notes)
- `BodyMetrics` - Body weight tracking entry

## Coding Conventions
- Use TypeScript strict mode
- Prefer server components, use "use client" only when needed
- API routes return `{ success: boolean, data?: T, error?: string }`
- Component files use PascalCase
- Utility files use kebab-case
- Tests go in `tests/` directory mirroring source structure

## Environment Variables
- `MONGODB_URI` - MongoDB connection string
- `GOOGLE_CLIENT_ID` / `GOOGLE_CLIENT_SECRET` - OAuth credentials
- `NEXTAUTH_SECRET` - Session encryption key
- `NEXTAUTH_URL` - Canonical app URL

## Git Workflow
- `main` - Production (workout.tth.dev)
- `staging` - Staging (staging.workout.tth.dev)
- `feature/*` - Feature branches, merge to staging

## Testing
- 100 tests across API routes, components, and utilities
- API tests use `mongodb-memory-server` for isolation
- Component tests use Testing Library
