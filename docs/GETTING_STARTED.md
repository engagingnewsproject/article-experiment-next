# Getting Started Guide

Welcome to the Article Experiment Next.js project! This guide will help you get up and running quickly.

## Quick Start (5 minutes)

1. **Prerequisites Check**
   - Node.js v18+ installed? Run `node --version`
   - npm v9+ installed? Run `npm --version`
   - Firebase CLI installed? Run `firebase --version` (if not: `npm install -g firebase-tools`)

2. **Clone and Install**
   ```bash
   git clone <repository-url>
   cd article-experiment-next
   npm install
   ```

3. **Set Up Environment**
   - Create `.env.local` file (see [Local Dev Setup](./dev/LOCAL_DEV_SETUP.md) for template)
   - Get Firebase credentials from Firebase Console
   - Add service account key if using data scripts

4. **Start Development Server**
   ```bash
   # Option A: With emulator (recommended for first-time setup)
   npm run dev:emulator
   
   # Option B: With live dev Firebase
   npm run dev
   ```

5. **Verify Setup**
   - Open `http://localhost:3000`
   - Check browser console for Firebase connection message
   - Visit `/admin` to test admin access

## Next Steps

### For Developers

1. **Read the Architecture Overview**
   - [Source Code Overview](./code/SRC_OVERVIEW.md) - Understand the codebase structure

2. **Understand the Multi-Study System**
   - [Multiple Research Projects](./MULTIPLE_RESEARCH_PROJECTS.md) - How studies work

3. **Learn About Qualtrics Integration**
   - [Qualtrics Integration](./qualtrics/QUALTRICS_INTEGRATION.md) - How surveys integrate
   - [Logging Events](./qualtrics/LOGGING_EVENTS.md) - What gets logged

4. **Explore Common Tasks**
   - See [Common Tasks Guide](./COMMON_TASKS.md) for workflows

### For Researchers

1. **Access the Research Dashboard**
   - Navigate to `/admin/research-dashboard`
   - Authenticate with Firebase credentials
   - Explore logs, articles, and comments

2. **Export Data**
   - See [Research Data Export](./firebase/RESEARCH_DATA_EXPORT.md)
   - Use the dashboard's export functionality

3. **Set Up Qualtrics Surveys**
   - Follow [Qualtrics Integration Guide](./qualtrics/QUALTRICS_INTEGRATION.md)
   - Use the provided JavaScript code for survey questions

## Documentation Map

### Setup & Configuration
- **[Local Dev Setup](./dev/LOCAL_DEV_SETUP.md)** - Complete local development guide
- **[Firebase Auth Setup](./auth/FIREBASE_AUTH_SETUP.md)** - Authentication configuration
- **[Environment Variables](../README.md#environment-setup)** - Environment configuration

### Development
- **[Source Code Overview](./code/SRC_OVERVIEW.md)** - Architecture and code structure
- **[Common Tasks](./COMMON_TASKS.md)** - Step-by-step workflows
- **[Multiple Research Projects](./MULTIPLE_RESEARCH_PROJECTS.md)** - Multi-study system

### Integration
- **[Qualtrics Integration](./qualtrics/QUALTRICS_INTEGRATION.md)** - Survey integration
- **[Logging Events](./qualtrics/LOGGING_EVENTS.md)** - Event tracking reference
- **[Qualtrics Verification](./qualtrics/QUALTRICS_LOGGING_VERIFICATION.md)** - Testing guide

### Deployment
- **[Deployment Guide](./deploy/DEPLOYMENT.md)** - Netlify deployment
- **[Netlify Dev Environment](./deploy/NETLIFY_DEV_ENVIRONMENT.md)** - Netlify setup

### Data Management
- **[Research Data Export](./firebase/RESEARCH_DATA_EXPORT.md)** - Exporting data for analysis

## Common Commands

| Command | Purpose |
|---------|---------|
| `npm run dev` | Start dev server (live Firebase) |
| `npm run dev:emulator` | Start dev server with emulator |
| `npm run build` | Build for production |
| `npm run export-research` | Export all data for research |
| `firebase use dev` | Switch to dev Firebase project |
| `firebase use prod` | Switch to prod Firebase project |

See [package.json](../package.json) for all available scripts.

## Getting Help

1. **Check Documentation**
   - Review relevant docs in `/docs`
   - Check troubleshooting sections

2. **Common Issues**
   - See [Local Dev Setup - Common Issues](./dev/LOCAL_DEV_SETUP.md#common-issues)
   - Check browser console for errors
   - Verify Firebase project access

3. **Ask for Help**
   - Contact project maintainer for:
     - Firebase project access
     - Service account keys
     - Admin credentials
     - Environment variable values

## What to Read First

**New Developer?** Read in this order:
1. This Getting Started guide
2. [Local Dev Setup](./dev/LOCAL_DEV_SETUP.md)
3. [Source Code Overview](./code/SRC_OVERVIEW.md)
4. [Common Tasks](./COMMON_TASKS.md)

**New Researcher?** Read in this order:
1. This Getting Started guide
2. [Multiple Research Projects](./MULTIPLE_RESEARCH_PROJECTS.md)
3. [Research Data Export](./firebase/RESEARCH_DATA_EXPORT.md)
4. [Qualtrics Integration](./qualtrics/QUALTRICS_INTEGRATION.md)
