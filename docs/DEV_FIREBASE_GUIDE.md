# Dev Firebase Project - Quick Guide

Hey! We've set up a separate Firebase project for development so we can test stuff without messing with production data.

## What is it?

We have two Firebase projects now:
- **Production**: `article-experiment-next` (the real one)
- **Dev**: `your-project-name-dev` (for testing)

The dev project has the same data structure as production, so you can test with real-looking data without worrying about breaking anything.

## How to Use It

### Daily Development (Most Common)

Just run:
```bash
npm run dev
```

This automatically:
- Connects to the **dev Firebase project** (your dev project ID)
- Uses live Firestore (not emulator)
- Lets you test safely without touching production

### Using the Emulator (Less Common)

If you want to test with the local emulator instead:
```bash
npm run dev:emulator
```

This starts the emulator and imports data from `firestore-data/` directory.

## Switching Projects

If you need to switch between dev and production for Firebase CLI commands:

```bash
# Use dev project
firebase use dev

# Use production project  
firebase use prod

# Check which one you're using
firebase use
```

## What Gets Logged Where?

- **When running `npm run dev`**: All logs go to the **dev Firebase project**
- **When running `npm run dev:emulator`**: Logs go to the local emulator (not saved)
- **Production**: Logs go to the production Firebase project

## Environment Files

The app uses `.env.local` which is configured for the dev project. It has:
- Dev Firebase credentials
- `NEXT_PUBLIC_USE_LIVE_FIRESTORE=true` (so it uses live Firebase, not emulator)

## Importing Data

If you need to refresh the dev database with production data:

```bash
firebase use dev
npm run import-data:dev
```

This imports everything from `firestore-data/` into the dev project.

## Quick Reference

| Command | What It Does |
|---------|-------------|
| `npm run dev` | Start dev server with **live dev Firebase** |
| `npm run dev:emulator` | Start dev server with **local emulator** |
| `firebase use dev` | Switch Firebase CLI to dev project |
| `firebase use prod` | Switch Firebase CLI to production |
| `npm run import-data:dev` | Import data to dev Firebase project |

## That's It!

Basically: just run `npm run dev` and you're good. It'll use the dev Firebase project automatically, so you can test safely without worrying about production.
