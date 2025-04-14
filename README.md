# Article Experiment Next.js Project

A Next.js-based article experiment project focused on testing and implementing various article-related features, including author variations, explanation boxes, and comment systems.

## Table of Contents
- [Project Overview](#project-overview)
- [Tech Stack](#tech-stack)
- [Getting Started](#getting-started)
- [Project Structure](#project-structure)
- [Environment Setup](#environment-setup)
- [Development Workflow](#development-workflow)
- [Deployment](#deployment)
- [Testing](#testing)
- [Contributing](#contributing)

## Project Overview

This project is designed to experiment with different article presentation formats and user engagement features. Key features include:

- Dynamic author information with multiple bio variations
- Explanation boxes for article context
- Comment system with anonymous and authenticated modes
- Article metadata and version tracking
- Trust Project integration
- Google Analytics integration

## Tech Stack

- **Framework**: Next.js 14 with App Router
- **Language**: TypeScript
- **Styling**: CSS Modules
- **Database**: Firebase/Firestore
- **Analytics**: Google Analytics
- **Deployment**: Netlify
- **Development Tools**:
  - ESLint for code linting
  - TypeScript for type safety
  - SWC for fast compilation

## Getting Started

### Prerequisites

- Node.js 18.x or later
- npm or yarn
- Firebase account and project
- Google Analytics account

### Installation

1. Clone the repository:
   ```bash
   git clone [repository-url]
   cd article-experiment-next
   ```

2. Install dependencies:
   ```bash
   npm install
   # or
   yarn install
   ```

3. Set up environment variables:
   Create a `.env.local` file in the root directory with the following variables:
   ```
   NEXT_PUBLIC_FIREBASE_API_KEY=your_api_key
   NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN=your_auth_domain
   NEXT_PUBLIC_FIREBASE_PROJECT_ID=your_project_id
   NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET=your_storage_bucket
   NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID=your_messaging_sender_id
   NEXT_PUBLIC_FIREBASE_APP_ID=your_app_id
   NEXT_PUBLIC_FIREBASE_MEASUREMENT_ID=your_measurement_id
   ```

4. Start the development server:
   ```bash
   npm run dev
   # or
   yarn dev
   ```

5. Open [http://localhost:3000](http://localhost:3000) in your browser.

## Project Structure

This project uses [`next/font`](https://nextjs.org/docs/app/building-your-application/optimizing/fonts) to automatically optimize and load [Geist](https://vercel.com/font), a new font family for Vercel.

### Key Directories and Files

- **src/app/**: Contains the Next.js app router pages and layouts
- **src/components/**: React components organized by feature
- **src/lib/**: Utility functions, hooks, and data management
- **src/types/**: TypeScript type definitions
- **src/styles/**: Global styles and CSS variables
- **public/**: Static assets and images
- **.env.local**: Environment variables for development
- **next.config.js**: Next.js configuration
- **netlify.toml**: Netlify deployment configuration

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

## Project Summary

This is a Next.js-based article experiment project focused on testing and implementing various article-related features. The project uses:

- Next.js with TypeScript for the frontend framework
- CSS Modules and global styles for styling
- Component-based architecture for modular development
- Environment variables for configuration
- Modern development tools including ESLint and TypeScript

The project structure follows Next.js conventions with:
- `/src` for main source code
- `/pages` for Next.js pages
- `/public` for static assets
- `/lib` for utility functions
- Component-based CSS organization


## Environment Setup

### Firebase Configuration

1. Create a Firebase project
2. Enable Firestore database
3. Set up authentication if needed
4. Configure security rules
5. Add your Firebase configuration to `.env.local`

### Google Analytics Setup

1. Create a Google Analytics property
2. Set up Firebase Analytics
3. Add your Measurement ID to `.env.local`

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

### Netlify Deployment

1. Connect your repository to Netlify
2. Configure build settings:
   - Build command: `npm run build`
   - Publish directory: `.next`
3. Set up environment variables in Netlify dashboard
4. Deploy!

### Build Process

```bash
npm run build    # Build the application
npm run start    # Start production server
```

## Testing

### Running Tests

```bash
npm run test     # Run all tests
npm run lint     # Run ESLint
```

## Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Submit a pull request

## Additional Resources

- [Next.js Documentation](https://nextjs.org/docs)
- [Firebase Documentation](https://firebase.google.com/docs)
- [TypeScript Documentation](https://www.typescriptlang.org/docs/)
- [CSS Modules Documentation](https://github.com/css-modules/css-modules)