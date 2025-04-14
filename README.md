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

This project is a Next.js-based article experiment platform designed to test and implement various article presentation formats and user engagement features. The project combines modern web technologies with innovative content presentation approaches.

### Key Features

- Dynamic author information with multiple bio variations
- Explanation boxes for article context
- Comment system with anonymous and authenticated modes
- Article metadata and version tracking
- Trust Project integration
- Google Analytics integration

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

1. Connect your repository to Netlify
2. Configure build settings:
   - Build command: `npm run build`
   - Publish directory: `.next`
   - Base directory: `article-experiment-next`
3. Set up environment variables in Netlify dashboard
4. Configure branch settings:
   - Production branch: `prod`
   - Deploy previews: Enabled for pull requests
5. Deploy!

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

## Additional Resources

- [Next.js Documentation](https://nextjs.org/docs)
- [Firebase Documentation](https://firebase.google.com/docs)
- [TypeScript Documentation](https://www.typescriptlang.org/docs/)
- [CSS Modules Documentation](https://github.com/css-modules/css-modules)