# Article Experiment Next.js Project

A Next.js-based article experiment project focused on testing and implementing various article-related features, including author variations, explanation boxes, and comment systems.

## Table of Contents
- [Project Overview](#project-overview)
- [Quick Start](#quick-start)
- [Project Structure](#project-structure)
- [Environment Setup](#environment-setup)
- [Installation and Running](#installation-and-running)
- [Development Workflow](#development-workflow)
- [Deployment](#deployment)
- [Documentation](#documentation)
- [Contributing](#contributing)
- [Additional Resources](#additional-resources)

## Project Overview

This project is a Next.js-based article experiment platform designed to test and implement various article presentation formats and user engagement features. The project combines modern web technologies with innovative content presentation approaches.

### Key Features

- **Multi-Study Support**: Run multiple research projects simultaneously with isolated data
- **Qualtrics Integration**: Track user interactions linked to survey responses
- **Research Dashboard**: Comprehensive analytics and data export tools
- **Dynamic Author Information**: Multiple bio variations per study
- **Explanation Boxes**: Contextual information for articles
- **Comment System**: Anonymous and authenticated modes with research tracking
- **Article Metadata**: Version tracking and rich metadata
- **Trust Project Integration**: Trust indicators and transparency
- **Google Analytics Integration**: User behavior tracking

### Comment System

The comment system implements a research-focused approach:
- Default comments are stored in the article document and shown to all users
- User interactions (comments, votes, replies) are:
  - Saved to the database for research tracking
  - Displayed immediately to the interacting user
  - Reset to default comments on page refresh
- Components:
  - `Comments`: Main orchestrator component
  - `CommentList`: Displays comments and handles interactions
  - `CommentForm`: Handles new comment submission
  - `CommentVoteSection`: Manages voting functionality

### Technical Stack

- **Frontend Framework**: Next.js with TypeScript
- **Styling**: CSS Modules and global styles
- **Architecture**: Component-based for modular development
- **Configuration**: Environment variables
- **Development Tools**: ESLint and TypeScript

## Project Structure

The project follows Next.js App Router conventions with:
- `/src/app` for Next.js pages and layouts
- `/src/components` for React components
- `/public` for static assets
- `/src/lib` for utility functions
- `/src/types` for TypeScript definitions
- `/src/styles` for global styles and CSS variables

### Component Organization

Components are organized by feature and follow a consistent pattern:
- Each component has its own directory
- Component files include:
  - `[ComponentName].tsx`: React component
  - `[ComponentName].module.css`: Component-specific styles
- Components use CSS Modules for scoped styling
- TypeScript interfaces are defined in the types directory

### Data Management

- **Firebase/Firestore**: Used for data storage
- **lib/firestore.ts**: Contains database operations
- **lib/articles.ts**: Article-specific data utilities
- **lib/config.ts**: Default configuration values

## Environment Setup

### Required Environment Variables

Create a `.env.local` file with:

```
NEXT_PUBLIC_FIREBASE_API_KEY=your_api_key
NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN=your_auth_domain
NEXT_PUBLIC_FIREBASE_PROJECT_ID=your_project_id
NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET=your_storage_bucket
NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID=your_messaging_sender_id
NEXT_PUBLIC_FIREBASE_APP_ID=your_app_id
NEXT_PUBLIC_FIREBASE_MEASUREMENT_ID=your_measurement_id

# Analytics Configuration
NEXT_PUBLIC_GA_MEASUREMENT_ID=your_ga_id
```

### Firebase Project Switching

The project supports two Firebase projects:
- **Development**: `article-experiment-next-dev`
- **Production**: `article-experiment-next`

#### Initial Setup

1. Set up environment files from your existing `.env.local`:
   ```bash
   npm run env:setup
   ```
   This creates `.env.dev` and `.env.prod` from your current `.env.local`.

2. Review and update `.env.dev` with the correct Firebase config values for the dev project.

#### Switching Between Projects

- **Switch to dev project**: `npm run env:dev`
- **Switch to production project**: `npm run env:prod`

**Note:** After switching, restart your dev server for changes to take effect.

#### Which Firebase Project Does `npm run dev` Use?

By default, `npm run dev` connects to the **live dev Firebase project** (`article-experiment-next-dev`) as specified in your `.env.local` file. The Firebase emulator is available via `npm run dev:emulator` if needed.

To verify which project you're connected to, check the browser console when running the dev server. You'll see either:
- `✅ Using LIVE Firestore` with the project ID (live Firebase)
- `✅ Connected to Firestore emulator` (local emulator)

## Quick Start

For a complete getting started guide, see **[docs/GETTING_STARTED.md](./docs/GETTING_STARTED.md)**.

**TL;DR:**
```bash
git clone <repo-url>
cd article-experiment-next
npm install
# Set up .env.local (see Environment Setup)
npm run dev:emulator  # or npm run dev
```

## Installation and Running

### Prerequisites

- Node.js (v18 or higher)
- npm (v9 or higher)
- Git
- Firebase CLI (`npm install -g firebase-tools`)

### Installation Steps

1. Clone the repository:
   ```bash
   git clone https://github.com/your-username/article-experiment-next.git
   cd article-experiment-next
   ```

2. Install dependencies:
   ```bash
   npm install
   ```

3. Set up environment variables:
   - Copy `.env.example` to `.env.local`
   - Fill in the required environment variables as described in [Environment Setup](#environment-setup)

### Running the Project

#### Development Mode
```bash
npm run dev
```
This will start the development server at `http://localhost:3000` and connect to the live dev Firebase project (as configured in `.env.local`).

**Other development commands:**
- `npm run dev:emulator` - Start dev server with Firebase emulator (local, no live data)
- `npm run env:dev` - Switch to dev Firebase project configuration
- `npm run env:prod` - Switch to production Firebase project configuration

#### Production Build
```bash
npm run build
npm start
```
This will create an optimized production build and start the server.

#### Running Tests
```bash
npm test
```

### Common Issues

- If you encounter any dependency-related issues, try:
  ```bash
  rm -rf node_modules
  npm install
  ```
- Ensure all environment variables are properly set in `.env.local`
- Check that you're using the correct Node.js version

## Development Workflow

### Component Development

1. Create new components in the `src/components` directory
2. Use CSS Modules for styling
3. Follow TypeScript best practices
4. Add appropriate documentation

### Data Management

- Articles are stored in Firestore
- Use the provided Firestore utilities in `src/lib/firestore.ts`
- Follow the Article type definition in `src/types/article.ts`

### Styling Guidelines

- Use CSS Modules for component-specific styles
- Follow BEM naming convention
- Maintain consistent spacing and typography
- Use CSS variables for theming

## Deployment

### Branch Management

The project uses two main branches:
- **main**: Development branch for feature development and testing
- **prod**: Production branch that deploys to Netlify

### Netlify Deployment

[Netlify Project Admin](https://app.netlify.com/projects/article-experiment-next/overview) | [Netlify Public URL](https://article-experiment-next.netlify.app/)

1. Connect your repository to Netlify
2. Configure build settings:
   - Build command: `npm run build`
   - Publish directory: `.next`
   - Base directory: `article-experiment-next`
3. Set up environment variables in Netlify dashboard
4. Configure branch settings:
   - Production branch: `prod`
   - Deploy previews: Enabled for pull requests
5. Deploy:
   - Make sure you are in the `main` branch and status is clear
   - Checkout `prod` branch
   - Merge `main` into `prod`. Deployment to Netlify will run.

### Build Process

```bash
# Development
git checkout main
npm run dev    # Start development server

# Production
git checkout prod
npm run build  # Build the application
npm run start  # Start production server
```

## Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Submit a pull request

## Documentation

Comprehensive documentation is available in the `/docs` directory:

### Getting Started
- **[Getting Started Guide](./docs/GETTING_STARTED.md)** - Quick start for new developers/researchers
- **[Common Tasks](./docs/COMMON_TASKS.md)** - Step-by-step workflows

### Setup & Development
- **[Local Dev Setup](./docs/dev/LOCAL_DEV_SETUP.md)** - Complete local development guide
- **[Source Code Overview](./docs/code/SRC_OVERVIEW.md)** - Architecture and code structure
- **[Firebase Auth Setup](./docs/auth/FIREBASE_AUTH_SETUP.md)** - Authentication configuration

### Features & Integration
- **[Multiple Research Projects](./docs/MULTIPLE_RESEARCH_PROJECTS.md)** - Multi-study system
- **[Qualtrics Integration](./docs/qualtrics/QUALTRICS_INTEGRATION.md)** - Survey integration guide
- **[Logging Events](./docs/qualtrics/LOGGING_EVENTS.md)** - Event tracking reference

### Deployment & Data
- **[Deployment Guide](./docs/deploy/DEPLOYMENT.md)** - Netlify deployment
- **[Research Data Export](./docs/firebase/RESEARCH_DATA_EXPORT.md)** - Data export guide

### Available NPM Scripts

| Script | Purpose |
|--------|---------|
| `npm run dev` | Start dev server (live Firebase) |
| `npm run dev:emulator` | Start dev server with emulator |
| `npm run build` | Build for production |
| `npm run export-research` | Export all data for research |
| `npm run import-data:dev` | Import data to dev Firebase |
| `firebase use dev` | Switch to dev Firebase project |
| `firebase use prod` | Switch to prod Firebase project |

See [package.json](./package.json) for all available scripts.

## Additional Resources

- [Next.js Documentation](https://nextjs.org/docs)
- [Firebase Documentation](https://firebase.google.com/docs)
- [TypeScript Documentation](https://www.typescriptlang.org/docs/)
- [CSS Modules Documentation](https://github.com/css-modules/css-modules)