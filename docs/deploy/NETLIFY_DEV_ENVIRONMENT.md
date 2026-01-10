# Netlify Dev Environment Setup

## How It Works

Netlify can deploy different branches to different URLs:
- **Production branch** (`prod`) → `article-experiment-next.netlify.app` (production)
- **Dev branch** (`main` or `dev`) → `dev--article-experiment-next.netlify.app` (dev environment)

Each branch can have different environment variables, so dev uses dev Firebase and production uses production Firebase.

## Setup Steps

### Step 1: Configure Branch Deploys in Netlify

1. Go to your Netlify project: [Netlify Dashboard](https://app.netlify.com/projects/article-experiment-next/overview)
2. Go to **Site settings** → **Build & deploy** → **Continuous Deployment**
3. Under **Branch deploys**, you'll see three radio button options:
   - **"All"** - Deploy all branches pushed to the repository
   - **"None"** - Deploy only the production branch (currently selected)
   - **"Let me add individual branches"** - Add specific branches ← **Select this one**
   
4. After selecting **"Let me add individual branches"**, you'll see a field to add branches
5. Add your dev branch name (e.g., `dev` or `main` if you're using `main` for dev)
6. Make sure **Production branch** is set to `prod`
7. Click **"Save"** at the bottom

**Result:**
- Only `prod` branch → Deploys to production URL (`article-experiment-next.netlify.app`)
- Only `dev` branch (or whatever you specified) → Deploys to dev URL (`dev--article-experiment-next.netlify.app`)
- Other branches → Won't deploy automatically

### Step 2: Set Up Environment Variables for Dev Branch

Since you already have production Firebase variables set up, you need to configure them to use different values for branch deploys.

1. In Netlify, go to **Site settings** → **Environment variables**
2. Click on each existing Firebase variable to edit it (e.g., `NEXT_PUBLIC_FIREBASE_API_KEY`)
3. You'll see two radio button options:
   - **"Same value for all deploy contexts"** (currently selected)
   - **"Different value for each deploy context"** ← **Select this one**
4. After selecting "Different value for each deploy context", you'll see separate input fields for:
   - **Production** - Keep your existing production value here
   - **Branch deploys** - Enter your dev Firebase value here
   - **Deploy Previews** - You can copy the production value or leave it
   - **Local development** - Optional, for Netlify CLI
5. For each Firebase variable, enter the dev values in the **"Branch deploys"** field:

**Dev Firebase Values (enter in "Branch deploys" field for each variable):**
- `NEXT_PUBLIC_FIREBASE_API_KEY`: `your-dev-api-key-here`
- `NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN`: `your-dev-project-id.firebaseapp.com`
- `NEXT_PUBLIC_FIREBASE_PROJECT_ID`: `your-dev-project-id`
- `NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET`: `your-dev-project-id.firebasestorage.app`
- `NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID`: `your-dev-sender-id`
- `NEXT_PUBLIC_FIREBASE_APP_ID`: `your-dev-app-id`

6. Also add a new variable `NEXT_PUBLIC_USE_LIVE_FIRESTORE` with:
   - **Production**: `true` (or leave empty)
   - **Branch deploys**: `true`

7. Click **"Save variable"** for each one

**Result:**
- **Production context** → Uses production Firebase (`article-experiment-next`)
- **Branch deploys context** → Uses dev Firebase (your dev project ID)

### Step 3: Deploy Dev Branch and Find the URL

Push to your dev branch:

```bash
# Create and push dev branch (if you haven't already)
git checkout -b dev
git push origin dev

# Or if you're using main for dev
git checkout main
git push origin main
```

Netlify will automatically deploy it to a branch-specific URL.

**How to Find the Dev URL:**

1. Go to your Netlify dashboard: [Deploys](https://app.netlify.com/projects/article-experiment-next/deploys)
2. Look for the deploy from your dev branch (`main` or `dev`)
3. Click on that deploy
4. The URL will be shown at the top, typically in one of these formats:
   - `https://[branch-name]--article-experiment-next.netlify.app`
   - For `main` branch: `https://main--article-experiment-next.netlify.app`
   - For `dev` branch: `https://dev--article-experiment-next.netlify.app`

**Or check the Deploys list:**
- In the **Deploys** tab, each deploy shows its URL
- Branch deploys will have a different URL than production
- Production deploys show the main site URL
- Branch deploys show the branch-specific URL

## Result

After setup, you'll have:

- **Production**: `https://article-experiment-next.netlify.app`
  - Uses production Firebase (`article-experiment-next`)
  - Deploys from `prod` branch

- **Dev**: `https://main--article-experiment-next.netlify.app` (or `https://dev--article-experiment-next.netlify.app` if using `dev` branch)
  - Uses dev Firebase (your dev project ID)
  - Deploys from `main` or `dev` branch
  - URL format: `https://[branch-name]--[site-name].netlify.app`

## Alternative: Separate Netlify Site

If you prefer complete separation, you can create a **separate Netlify site** for dev:

1. Create a new site in Netlify
2. Connect the same GitHub repo
3. Configure it to deploy from `main` branch
4. Set dev Firebase environment variables
5. Get a separate URL like `your-project-name-dev.netlify.app`

**Pros:**
- Complete separation
- Different URLs are clearer
- Can have different settings/plugins

**Cons:**
- Two sites to manage
- Slightly more setup

## Recommended Approach

For your use case, **branch deploys in the same project** is simpler:
- One project to manage
- Automatic deploys from branches
- Easy to see both environments in one dashboard
- Can share some settings between environments

## Quick Reference

| Environment | Branch | URL | Firebase Project |
|------------|--------|-----|------------------|
| Production | `prod` | `article-experiment-next.netlify.app` | `article-experiment-next` |
| Dev | `dev` (or `main` if configured) | `dev--article-experiment-next.netlify.app` | `your-dev-project-id` |

**Note:** Only the branches you specify in Step 1 will deploy. Other branches won't trigger automatic deploys.

## Testing

After setup:
1. Push to your dev branch
2. Wait for Netlify to deploy
3. Visit the branch deploy URL
4. Check the browser console - should show `Project: your-dev-project-id`
5. Test that it's using dev Firebase (create a test article, check it appears in dev Firebase console)

That's it! You'll have a dev environment on Netlify that uses your dev Firebase project.
