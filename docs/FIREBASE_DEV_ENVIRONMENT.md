# Firebase Dev Environment Setup Guide

This guide explains how to set up a separate development environment in Firebase for testing without affecting production data.

## Options for Dev Environment

You have three main options:

1. **Separate Firebase Project (Recommended)** - Clean separation, isolated data
2. **Firestore Emulator** - Already set up, but data doesn't persist
3. **Environment-based Configuration** - Switch between projects using env vars

## Option 1: Separate Firebase Project (Recommended)

This is the best approach for a true dev environment with persistent data.

### Step 1: Create a New Firebase Project

1. Go to [Firebase Console](https://console.firebase.google.com/)
2. Click "Add project" or "Create a project"
3. Name it something like `your-project-name-dev`
4. Follow the setup wizard:
   - Enable/disable Google Analytics (your choice)
   - Complete project creation

### Step 2: Set Up Firestore Database

1. In your new dev project, go to **Firestore Database**
2. Click "Create database"
3. Choose "Start in test mode" (or production mode with appropriate rules)
4. Select a location (same as production for consistency)

### Step 3: Configure Firebase App

1. In your dev project, go to **Project Settings** (gear icon)
2. Scroll down to "Your apps"
3. Click the web icon (`</>`) to add a web app
4. Register the app (name it "your-project-name-dev")
5. Copy the Firebase configuration

### Step 4: Update `.firebaserc`

Update `.firebaserc` to include both projects:

```json
{
  "projects": {
    "default": "article-experiment-next",
    "dev": "your-project-name-dev",
    "prod": "article-experiment-next"
  }
}
```

### Step 5: Create Environment Files

Create separate environment files for each environment:

**`.env.local`** (for local development with emulator):
```bash
# Use emulator by default in local dev
NEXT_PUBLIC_USE_LIVE_FIRESTORE=false
```

**`.env.development`** (for dev Firebase project):
```bash
# Dev Firebase Project
NEXT_PUBLIC_FIREBASE_API_KEY=your_dev_api_key
NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN=your-project-name-dev.firebaseapp.com
NEXT_PUBLIC_FIREBASE_PROJECT_ID=your-project-name-dev
NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET=your-project-name-dev.appspot.com
NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID=your_dev_sender_id
NEXT_PUBLIC_FIREBASE_APP_ID=your_dev_app_id

# Use live Firestore (not emulator)
NEXT_PUBLIC_USE_LIVE_FIRESTORE=true
```

**`.env.production`** (for production Firebase project):
```bash
# Production Firebase Project
NEXT_PUBLIC_FIREBASE_API_KEY=your_prod_api_key
NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN=article-experiment-next.firebaseapp.com
NEXT_PUBLIC_FIREBASE_PROJECT_ID=article-experiment-next
NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET=article-experiment-next.appspot.com
NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID=your_prod_sender_id
NEXT_PUBLIC_FIREBASE_APP_ID=your_prod_app_id

# Use live Firestore
NEXT_PUBLIC_USE_LIVE_FIRESTORE=true
```

### Step 6: Update `package.json` Scripts

Add scripts to easily switch between environments:

```json
{
  "scripts": {
    "dev": "sh scripts/dev.sh",
    "dev:emulator": "concurrently -k -s first -n emulator,import,dev \"npm run emulator\" \"npm run import-data:wait\" \"next dev\"",
    "dev:firebase": "NODE_ENV=development next dev",
    "dev:prod": "NODE_ENV=production next dev",
    "firebase:use:dev": "firebase use dev",
    "firebase:use:prod": "firebase use prod",
    "firebase:deploy:dev": "firebase use dev && firebase deploy",
    "firebase:deploy:prod": "firebase use prod && firebase deploy"
  }
}
```

### Step 7: Initialize Dev Database

Copy your production data structure to dev (optional):

```bash
# Export from production
npm run export-production-data

# Switch to dev project
firebase use dev

# Import to dev (you'll need to modify import script to use dev project)
# Or manually create collections in Firebase Console
```

## Option 2: Firestore Emulator (Already Set Up)

You already have the Firestore emulator configured. This is great for local development but data doesn't persist between sessions.

### Current Setup

- Emulator runs on `localhost:8080`
- Automatically connects when `NODE_ENV=development` and `NEXT_PUBLIC_USE_LIVE_FIRESTORE !== 'true'`
- Data is reset when emulator stops

### Usage

```bash
# Start emulator
npm run emulator

# In another terminal, start dev server
npm run dev

# Or use the combined command
npm run dev:emulator
```

### Pros and Cons

**Pros:**
- ✅ No cost
- ✅ Fast iteration
- ✅ Safe testing (can't affect production)
- ✅ Already configured

**Cons:**
- ❌ Data doesn't persist
- ❌ Can't test with real Firebase features (auth, storage, etc.)
- ❌ Requires emulator to be running

## Option 3: Environment-Based Configuration

Switch between projects using environment variables without separate files.

### Update `firebase.ts` to Support Multiple Projects

You could modify `src/lib/firebase.ts` to support project switching:

```typescript
// Determine which project to use
const projectId = process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID || 'article-experiment-next';
const isDevProject = projectId.includes('-dev');

const firebaseConfig = {
  apiKey: process.env.NEXT_PUBLIC_FIREBASE_API_KEY,
  authDomain: process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN,
  projectId: projectId,
  // ... rest of config
};
```

## Recommended Approach

**For your use case, I recommend Option 1 (Separate Firebase Project)** because:

1. ✅ Persistent data (unlike emulator)
2. ✅ Can test real Firebase features (auth, storage, etc.)
3. ✅ Clean separation from production
4. ✅ Can test deployment to dev environment
5. ✅ Can test with real Qualtrics integrations

## Quick Start: Setting Up Dev Project

1. **Create dev project in Firebase Console**
   ```bash
   # Name: your-project-name-dev
   ```

2. **Update `.firebaserc`**
   ```json
   {
     "projects": {
       "default": "article-experiment-next",
       "dev": "your-project-name-dev"
     }
   }
   ```

3. **Create `.env.development` with dev project credentials**

4. **Switch to dev project**
   ```bash
   firebase use dev
   ```

5. **Initialize Firestore in dev project** (via Firebase Console or CLI)

6. **Run dev server**
   ```bash
   NODE_ENV=development npm run dev
   ```

## Testing Checklist

After setting up dev environment:

- [ ] Dev project created in Firebase Console
- [ ] Firestore database initialized in dev project
- [ ] `.firebaserc` updated with dev project
- [ ] `.env.development` created with dev credentials
- [ ] Can switch between projects: `firebase use dev` / `firebase use prod`
- [ ] Dev app connects to dev Firestore
- [ ] Can create articles in dev without affecting production
- [ ] Logs are saved to dev Firestore
- [ ] Can test Qualtrics integration with dev data

## Security Rules

Make sure to set up appropriate Firestore security rules for your dev project:

**Dev Project Rules** (more permissive for testing):
```javascript
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    // Allow read/write for testing (adjust as needed)
    // Note: For dev environments, you can use permissive rules
    // For production, use more restrictive rules (see production rules below)
    match /{document=**} {
      allow read, write: if true;
    }
  }
}
```

**Production Rules** (more restrictive):
```javascript
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    // Your production rules here
  }
}
```

## Switching Between Environments

```bash
# Use dev project
firebase use dev
npm run dev:firebase

# Use production project
firebase use prod
npm run dev:prod

# Use emulator (local)
firebase use default
NEXT_PUBLIC_USE_LIVE_FIRESTORE=false npm run dev
```

## Troubleshooting

### Issue: Wrong project being used

**Solution:** Check which project is active:
```bash
firebase use
```

Switch if needed:
```bash
firebase use dev  # or firebase use prod
```

### Issue: Environment variables not loading

**Solution:** Make sure you're using the correct env file:
- `.env.local` - Always loaded (highest priority)
- `.env.development` - Loaded when `NODE_ENV=development`
- `.env.production` - Loaded when `NODE_ENV=production`

### Issue: Can't connect to Firestore

**Solution:** 
1. Check `NEXT_PUBLIC_USE_LIVE_FIRESTORE` is set correctly
2. Verify Firebase credentials in env file
3. Check Firebase project is active: `firebase use`
4. Verify Firestore is enabled in Firebase Console

## Next Steps

1. Create the dev Firebase project
2. Set up the configuration files
3. Test the connection
4. Copy production data structure (if needed)
5. Start testing new features in dev!

