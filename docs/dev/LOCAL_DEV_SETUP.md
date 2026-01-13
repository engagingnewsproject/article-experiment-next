# Local Development Environment Setup (Canonical)

Single source of truth for setting up this project locally. Use this file instead of the other dev Firebase docs.

## Prerequisites

Before starting, ensure you have:
- **Node.js** (v18 or higher)
- **npm** (v9 or higher)
- **Git**
- **Firebase CLI** (`npm install -g firebase-tools`)
- Access to the Firebase projects (dev and/or production)

## Quick Reference (common commands)

| Command | What it does |
|---------|--------------|
| `npm run dev` | Start dev server using **live dev Firebase** |
| `npm run dev:emulator` | Start dev server + Firestore/Auth emulators |
| `npm run emulator` | Start emulators only |
| `firebase use dev` | Point Firebase CLI at dev project |
| `firebase use prod` | Point Firebase CLI at prod project |
| `npm run import-data:dev` | Import `firestore-data/` into dev Firebase |
| `npm run export-production-data` | Export prod data (requires prod access) |
| `npm run import-data` | Import `firestore-data/` (uses service account) |

## Files to Share

### 1. Repository Access
- Git repository URL and access permissions
- Branch information:
  - `main` - Development branch
  - `prod` - Production branch

### 2. Environment Variables Template

Create a `.env.local` file in the project root with the following variables:

```bash
# Firebase Configuration (Required)
NEXT_PUBLIC_FIREBASE_API_KEY=your_api_key_here
NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN=your_auth_domain_here
NEXT_PUBLIC_FIREBASE_PROJECT_ID=your_project_id_here
NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET=your_storage_bucket_here
NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID=your_messaging_sender_id_here
NEXT_PUBLIC_FIREBASE_APP_ID=your_app_id_here
NEXT_PUBLIC_FIREBASE_MEASUREMENT_ID=your_measurement_id_here

# Firebase Connection Mode (Optional)
# Set to 'true' to use live Firestore, 'false' or unset to use emulator
NEXT_PUBLIC_USE_LIVE_FIRESTORE=false

# Google Analytics (Optional)
NEXT_PUBLIC_GA_ID=your_ga_measurement_id_here
```

**How to get Firebase credentials:**
1. Go to [Firebase Console](https://console.firebase.google.com/)
2. Select your project (dev or production)
3. Click the gear icon → **Project settings**
4. Scroll to "Your apps" section
5. Click the web icon (`</>`) or select your web app
6. Copy the configuration values

### 3. Firebase Project Configuration

Share the `.firebaserc` file contents (already in repo, but verify):
```json
{
  "projects": {
    "default": "article-experiment-next",
    "dev": "article-experiment-next-dev",
    "prod": "article-experiment-next"
  }
}
```

**Note:** Developers need Firebase CLI access to these projects. They should:
1. Run `firebase login` to authenticate
2. Verify access: `firebase projects:list`

### 4. Service Account Keys (For Data Import/Export Scripts)

**For Development:**
- `serviceAccountKey-dev.json` - Service account key for the dev Firebase project
  - Download from: Firebase Console → Project Settings → Service Accounts → Generate new private key
  - **Important:** This file is in `.gitignore` and should NOT be committed
  - Share via secure method (password manager, encrypted file share, etc.)

**For Production (if needed):**
- `serviceAccountKey.json` - Service account key for production Firebase project
  - Same process as above, but for production project
  - **Even more sensitive** - only share if developer needs production data access

### 5. Firebase Authentication Setup

Developers need Firebase Auth accounts to access the admin dashboard:

1. **For Development with Emulator:**
   - Create test users in the Auth Emulator UI (runs at `http://localhost:4000` when emulator is running)
   - Or use the Firebase Console for the dev project

2. **For Development with Live Firebase:**
   - Admin users must be created in Firebase Console → Authentication → Users
   - Share the email addresses that have admin access
   - Each developer should create their own account or be added by project admin

**Steps to create admin user:**
1. Go to Firebase Console → Authentication → Users
2. Click "Add user"
3. Enter email and password
4. User can now sign in at `/admin`

## Setup Steps

### Step 1: Clone and Install

```bash
# Clone the repository
git clone <repository-url>
cd article-experiment-next

# Install dependencies
npm install
```

### Step 2: Configure Environment Variables

1. Create `.env.local` file in project root
2. Copy the template above and fill in values
3. For local development with emulator, set:
   ```bash
   NEXT_PUBLIC_USE_LIVE_FIRESTORE=false
   ```

### Step 3: Set Up Firebase

```bash
# Login to Firebase
firebase login

# Verify you can see the projects
firebase projects:list

# Switch to dev project (recommended for development)
firebase use dev

# Or use production (if you have access)
firebase use prod
```

### Step 4: Add Service Account Key (Optional - for data scripts)

1. Download service account key from Firebase Console (dev project)
2. Save as `serviceAccountKey-dev.json` in project root
3. **Never commit this file** (it's in `.gitignore`)

### Step 5: Initialize Firebase Auth (if using live Firebase)

1. Go to Firebase Console → Authentication
2. Enable Email/Password provider if not already enabled
3. Create admin user accounts (see "Firebase Authentication Setup" above)

### Step 6: Run the Development Server

**Option A: With Emulator (Recommended for local dev)**
```bash
npm run dev:emulator
```
This will:
- Start Firestore emulator on port 8080
- Start Auth emulator on port 9099
- Import initial data (if available)
- Start Next.js dev server on port 3000

**Option B: With Live Firebase Dev Project**
```bash
# Make sure you're using dev project
firebase use dev

# Set environment variable
export NEXT_PUBLIC_USE_LIVE_FIRESTORE=true
# Or add to .env.local: NEXT_PUBLIC_USE_LIVE_FIRESTORE=true

# Run dev server
npm run dev
```

**Option C: With Live Firebase Production (Not Recommended)**

## Environment Modes (when to use which)

- **Live Dev Firebase (default)**: For normal development; persists data in dev project. Command: `npm run dev` with `NEXT_PUBLIC_USE_LIVE_FIRESTORE=true`.
- **Emulator**: For offline/isolated testing; data wiped on restart. Command: `npm run dev:emulator`; ensure `NEXT_PUBLIC_USE_LIVE_FIRESTORE` is absent/false.
- **Prod (avoid for dev)**: Only when you explicitly need to validate against prod. Command: `firebase use prod && NEXT_PUBLIC_USE_LIVE_FIRESTORE=true npm run dev`.

## Importing/Refreshing Data in Dev

1) Ensure you have `serviceAccountKey-dev.json` in project root (from dev Firebase project).  
2) Point Firebase CLI to dev: `firebase use dev`.  
3) Import from `firestore-data/`:
```bash
npm run import-data:dev
```
Imports: articles, authors, studies, project configs, logs, comments (subcollections).

## Security Rules (reference)

Dev (more permissive; adjust as needed):
```javascript
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    match /{document=**} {
      allow read, write: if true;
    }
  }
}
```

Prod should use your restrictive rules (not reproduced here). Keep rules in sync with your intended access model.
```bash
firebase use prod
export NEXT_PUBLIC_USE_LIVE_FIRESTORE=true
npm run dev
```

## Verification

After setup, verify everything works:

1. **Check Firebase Connection:**
   - Open browser console at `http://localhost:3000`
   - Look for Firebase connection logs
   - Should see either "Connected to Firestore emulator" or "Using LIVE Firestore"

2. **Test Admin Access:**
   - Navigate to `http://localhost:3000/admin`
   - Sign in with Firebase Auth credentials
   - Should see the admin dashboard

3. **Test Article Viewing:**
   - Navigate to any article (e.g., `http://localhost:3000/articles/[slug]`)
   - Should load without errors

4. **Test Data Operations:**
   - Try creating/editing an article in admin
   - Check that it appears in Firestore (emulator UI or Firebase Console)

## Common Issues

### Issue: "Firebase: Error (auth/unauthorized-domain)"
**Solution:** Add `localhost` to authorized domains in Firebase Console → Authentication → Settings → Authorized domains

### Issue: "Cannot connect to emulator"
**Solution:** 
- Make sure emulator is running: `npm run emulator`
- Check ports 8080 (Firestore) and 9099 (Auth) are not in use
- Verify `NEXT_PUBLIC_USE_LIVE_FIRESTORE` is not set to `true`

### Issue: "Permission denied" when importing data
**Solution:**
- Make sure you're using the correct service account key for the project
- Verify the service account has "Firebase Admin SDK Administrator Service Agent" role
- Check you're using the right project: `firebase use dev`

### Issue: "Module not found" errors
**Solution:**
```bash
rm -rf node_modules package-lock.json
npm install
```

## Additional Resources

- [Firebase Auth Setup](../auth/FIREBASE_AUTH_SETUP.md) - Authentication configuration
- [Qualtrics Integration](./QUALTRICS_INTEGRATION.md) - Qualtrics survey integration (if needed)
- [Netlify Dev Environment](./NETLIFY_DEV_ENVIRONMENT.md) - Netlify deployment setup

## Security Notes

⚠️ **Important Security Reminders:**

1. **Never commit sensitive files:**
   - `.env.local`
   - `serviceAccountKey.json`
   - `serviceAccountKey-dev.json`
   - These are already in `.gitignore`

2. **Service account keys are sensitive:**
   - Share via secure channels only
   - Rotate keys if accidentally exposed
   - Each developer should have their own key if possible

3. **Environment variables:**
   - `NEXT_PUBLIC_*` variables are exposed to the browser
   - Don't put truly secret values in `NEXT_PUBLIC_*` variables
   - Firebase API keys are safe to expose (they're public by design)

4. **Firebase Auth:**
   - Admin access is controlled through Firebase Authentication
   - Only create accounts for trusted developers
   - Remove access by deleting users in Firebase Console

## Quick Start Checklist

- [ ] Node.js v18+ installed
- [ ] npm v9+ installed
- [ ] Firebase CLI installed (`npm install -g firebase-tools`)
- [ ] Repository cloned
- [ ] Dependencies installed (`npm install`)
- [ ] `.env.local` created with Firebase credentials
- [ ] Firebase CLI logged in (`firebase login`)
- [ ] Firebase project access verified (`firebase projects:list`)
- [ ] Service account key added (if using data scripts)
- [ ] Firebase Auth user created (if using live Firebase)
- [ ] Development server runs successfully (`npm run dev:emulator` or `npm run dev`)
- [ ] Can access admin dashboard at `/admin`
- [ ] Can view articles at `/articles/[slug]`

## Getting Help

If you encounter issues:
1. Check the troubleshooting section above
2. Review the detailed guides in `/docs`
3. Check browser console for errors
4. Verify Firebase project access
5. Ask the project maintainer for:
   - Firebase project access
   - Service account keys
   - Admin user credentials
   - Environment variable values
