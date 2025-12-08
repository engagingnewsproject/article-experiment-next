# Firebase Dev Environment Setup - Quick Reference

## Initial Setup (One-time)

1. ✅ Created dev Firebase project: `your-project-name-dev`
2. ✅ Updated `.firebaserc` with dev project
3. ✅ Created `.env.development` with dev project credentials
4. ✅ Set up Firestore database in dev project

## Import Data to Dev Project

### Step 1: Download Service Account Key for Dev Project

1. Go to [Firebase Console](https://console.firebase.google.com/)
2. Select your **dev project**: `your-project-name-dev`
3. Click the gear icon → **Project settings**
4. Go to **Service accounts** tab
5. Click **Generate new private key**
6. Save it as `serviceAccountKey-dev.json` in your project root (same directory as `package.json`)

**Important:** This key must be from the **dev project**, not the production project!

### Step 2: Import Data

```bash
# Make sure you're using the dev project
firebase use dev

# Import data from firestore-data/ directory
npm run import-data:dev
```

This will import:
- Articles
- Authors
- Studies
- Project Configs
- Logs
- Comments (as subcollections)

**Note:** The script will automatically use `serviceAccountKey-dev.json` if it exists, otherwise it will try `serviceAccountKey.json`.

## Running Dev Server

### Option 1: Use Live Dev Firebase Project (Recommended)
```bash
# Switch to dev project
firebase use dev

# Run dev server (connects to live dev Firebase)
npm run dev
```

### Option 2: Use Emulator (Local Testing)
```bash
# Run dev server with emulator
npm run dev:emulator
```

## Switching Between Projects

```bash
# Use dev project
firebase use dev

# Use production project
firebase use prod

# Check current project
firebase use
```

## Environment Files

- `.env.local` - Local overrides (highest priority)
- `.env.development` - Dev Firebase project config (loaded when `NODE_ENV=development`)
- `.env.production` - Production config (loaded when `NODE_ENV=production`)

## Troubleshooting

### Issue: Still connecting to emulator

**Solution:** Make sure `.env.development` has:
```bash
NEXT_PUBLIC_USE_LIVE_FIRESTORE=true
```

And use `npm run dev` (which now uses live Firebase by default).

### Issue: Wrong project being used

**Solution:** Check and switch:
```bash
firebase use  # Check current project
firebase use dev  # Switch to dev
```

### Issue: Import fails with permission error (PERMISSION_DENIED)

**Solution:** 
1. Download a service account key specifically for the **dev project**:
   - Go to Firebase Console → Select your dev project
   - Project Settings → Service Accounts → Generate new private key
   - Save as `serviceAccountKey-dev.json` in project root
2. Make sure the service account has "Firebase Admin SDK Administrator Service Agent" role in the dev project
3. Try the import again: `npm run import-data:dev`
