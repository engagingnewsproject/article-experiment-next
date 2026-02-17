# Firebase Authentication Setup Guide

This guide explains how to set up and use Firebase Authentication in the project.

## Overview

The project now uses Firebase Authentication instead of the simple password-based authentication. This provides:
- Better security with Firebase's managed authentication
- Password reset functionality
- Session management handled by Firebase
- Support for multiple authentication providers (currently email/password)

## Setup Instructions

### 1. Enable Authentication in Firebase Console

1. Go to [Firebase Console](https://console.firebase.google.com/)
2. Select your project (production or dev)
3. Navigate to **Authentication** in the left sidebar
4. Click **Get Started** if you haven't enabled Authentication yet
5. Go to the **Sign-in method** tab
6. Enable **Email/Password** provider:
   - Click on **Email/Password**
   - Toggle **Enable** to ON
   - Click **Save**

### 2. Create User Accounts

You need to create user accounts for each admin user. There are two ways:

#### Option A: Create Users in Firebase Console (Recommended for Production)

1. In Firebase Console → **Authentication** → **Users** tab
2. Click **Add user**
3. Enter the email address
4. Enter a password
5. Click **Add user**

**Note**: Access control is managed entirely through Firebase Authentication. Only users with valid Firebase Auth accounts can access the admin dashboard.

#### Option B: Create Users Programmatically

For development, you can use the Firebase Admin SDK or create users via the Auth emulator.

### 3. Development with Emulator (Optional)

For local development, you can use the Firebase Auth emulator:

1. Make sure `firebase.json` includes the auth emulator:
```json
{
  "emulators": {
    "auth": {
      "port": 9099
    }
  }
}
```

2. Run the emulators:
```bash
npm run emulator
```

3. Create test users in the Auth Emulator UI (usually at `http://localhost:4000`)

## Usage

### Signing In

Users sign in through the admin login page at `/admin`. They need:
- An email address that exists in Firebase Auth
- The password for that account

### Session Management

Sessions are automatically managed by Firebase Auth. Users remain signed in until:
- They explicitly sign out
- Their session expires (handled by Firebase)
- They clear their browser data

### Signing Out

Users can sign out by clicking the "Sign Out" button in the admin dashboard.

## Code Changes

### Updated Files

1. **`src/lib/firebase.ts`**
   - Added Firebase Auth initialization
   - Added Auth emulator support

2. **`src/lib/auth.ts`**
   - Completely rewritten to use Firebase Authentication
   - Legacy wrapper `clearSession()` remains but is deprecated; use the Firebase Auth APIs below.
   - Current API: `signIn()`, `signOut()`, `getCurrentUser()`, `getCurrentSession()`, `createSessionFromUser()`, `onAuthChange()`

3. **`src/components/admin/ResearchDashboardLogin.tsx`**
   - Updated to use Firebase Auth `signIn()` function
   - Improved error handling

4. **`src/app/admin/page.tsx`**
   - Updated to use Firebase Auth state listeners
   - Real-time auth state updates

5. **`firebase.json`**
   - Added Auth emulator configuration

### Backward Compatibility

- `clearSession()` — still available but deprecated; use `signOut()` instead.
- `getSessionFromStorage()` and `createSession()` have been removed; use `getCurrentSession()` and Firebase Auth `signIn()` respectively.

## Troubleshooting

### "Invalid email or password"
- Verify the user exists in Firebase Console → Authentication → Users
- Check that Email/Password provider is enabled
- Try resetting the password in Firebase Console

### "Too many failed attempts"
- Firebase temporarily blocks sign-in attempts after multiple failures
- Wait a few minutes before trying again
- Consider increasing the rate limit in Firebase Console if needed

### Auth emulator not connecting
- Make sure the emulator is running: `npm run emulator`
- Check that port 9099 is available
- Verify `firebase.json` includes the auth emulator config

## Security Notes

1. **Email Verification**: Currently, email verification is not required. You can enable it in Firebase Console if needed.

2. **Password Requirements**: Firebase enforces password requirements by default (minimum 6 characters). You can configure additional requirements in Firebase Console.

3. **Access Control**: Access control is managed entirely through Firebase Authentication. Only users with valid Firebase Auth accounts can access the admin dashboard. To grant access, create a user account in Firebase Console. To revoke access, delete the user account or disable it in Firebase Console.

4. **Session Persistence**: Firebase Auth sessions persist across browser sessions by default. Users remain signed in until they explicitly sign out or clear browser data.

## Next Steps (Optional Enhancements)

- Add password reset functionality
- Add email verification requirement
- Implement custom claims for role-based access
- Add social authentication providers (Google, GitHub, etc.)
- Add multi-factor authentication (MFA)