# Source Code Overview

This document provides a high-level overview of the `src/` directory structure and architecture for the Article Experiment Next.js application.

## Directory Structure

```
src/
├── app/              # Next.js App Router pages and layouts
├── components/       # React components (UI building blocks)
├── hooks/           # Custom React hooks
├── lib/             # Core libraries and utilities
├── scripts/         # Utility scripts
├── styles/          # Global styles and CSS variables
└── types/           # TypeScript type definitions
```

## Core Architecture

### Multi-Study System

The application supports multiple research studies/projects, each with its own:
- **Study ID**: Unique identifier (e.g., `eonc`, `gazette`)
- **Project Config**: Study-specific settings (author info, site name, feature flags)
- **Data Isolation**: Articles, comments, and logs are filtered by `studyId`

### Key Concepts

1. **Studies**: Research projects that can be code-defined (defaults) or added via admin UI
2. **Project Configs**: Study-specific configuration (author, site name, feature flags)
3. **Articles**: Content pieces that belong to a specific study
4. **Comments**: User-generated comments tied to articles
5. **Logging**: Event tracking for research analytics

## Directory Details

### `/app` - Next.js App Router

Next.js 14+ App Router structure with client and server components.

**Public Pages:**
- `page.tsx` - Home page (article listing)
- `articles/[slug]/page.tsx` - Individual article pages
- `articles/[slug]/ArticleClient.tsx` - Client-side article component

**Admin Pages:**
- `admin/page.tsx` - Admin dashboard
- `admin/manage-studies/` - Study management
- `admin/manage-project-configs/` - Project configuration management
- `admin/edit-article/[id]/` - Article editing
- `admin/add-default-comments/` - Comment management
- `admin/research-dashboard/` - Research analytics dashboard

**Key Features:**
- Server-side rendering (SSR) for initial page loads
- Client-side interactivity with `"use client"` directives
- Dynamic routes with `[slug]` and `[id]` parameters

### `/components` - React Components

Reusable UI components organized by functionality.

**Article Components:**
- `ArticleContent.tsx` - Main article content renderer
- `ArticleHeader.tsx` - Article header with author info
- `ArticleSummary.tsx` - Article summary display
- `ArticleThemes.tsx` - Theme display component
- `AuthorBio.tsx` - Author biography component
- `BehindTheStory.tsx` - Explanation box component
- `ExplainBox.tsx` - Explanation box wrapper

**Comment Components:**
- `Comments.tsx` - Main comments container
- `CommentList.tsx` - Comment list renderer
- `CommentForm.tsx` - Comment submission form
- `CommentReplyForm.tsx` - Reply form
- `CommentSection.tsx` - Comment section wrapper
- `CommentVoteSection.tsx` - Voting functionality

**Admin Components** (`/admin`):
- `AdminCommentForm.tsx` - Admin comment management
- `AdminImportButton.tsx` - CSV import functionality
- `CopyUrlButton.tsx` - URL copying utility
- `InsertImageButton.tsx` - Image template inserter
- `ResearchDashboardLogin.tsx` - Dashboard authentication
- `StudyDropdown.tsx` - Study selection dropdown

**Layout Components:**
- `Header.tsx` - Site header (supports dynamic site name)
- `Footer.tsx` - Site footer
- `TrustProjectCallout.tsx` - Trust indicators

**Form Components:**
- `AddArticleForm.tsx` - Article creation form

### `/hooks` - Custom React Hooks

Reusable React hooks for common functionality.

- `useStudyId.ts` - Extracts and validates study ID from URL parameters
- `useLogger.ts` - Event logging with Qualtrics integration
- `usePageTracking.ts` - Page view tracking
- `useQualtrics.ts` - Qualtrics survey integration

**Usage Pattern:**
```typescript
const { studyId } = useStudyId();
const { log } = useLogger(qualtricsData, articleStudyId);
```

### `/lib` - Core Libraries

Core business logic and utilities.

**Firebase Integration:**
- `firebase.ts` - Firebase initialization and emulator connection
- `firestore.ts` - Firestore operations (CRUD, queries, types)
- `logger.ts` - Event logging to Firestore

**Configuration:**
- `config.ts` - Base configuration types
- `projectConfig.ts` - Project/study-specific configuration system
- `studies.ts` - Study definitions and management

**Data Access:**
- `articles.ts` - Article data operations
- `auth.ts` - Authentication utilities (client-side session management)

**Utilities:**
- `analytics.ts` - Analytics helpers
- `useAuthorVariations.ts` - Author variation logic

**Key Functions:**
- `getProjectConfig(studyId)` - Get project config for a study
- `loadStudies()` - Load all studies (code + Firestore)
- `getArticles(studyId)` - Get articles filtered by study
- `logEvent(entry)` - Log research events

### `/types` - TypeScript Definitions

- `article.ts` - Article-related type definitions

### `/styles` - Global Styles

- `globals.css` - Global CSS styles
- `variables.css` - CSS custom properties (design tokens)

### `/scripts` - Utility Scripts

- `addDefaultComments.ts` - Script for adding default comments

## Data Flow

### Article Display Flow

1. User visits `/articles/[slug]?study=eonc`
2. `useStudyId()` hook extracts study ID from URL
3. `ArticleClient` component loads article data via `getArticles(studyId)`
4. Article data includes project config (author, site name)
5. Components render with study-specific configuration

### Logging Flow

1. User interaction triggers event (click, view, etc.)
2. `useLogger()` hook captures event with study ID
3. Event includes Qualtrics data if available
4. `logEvent()` writes to Firestore `logs` collection
5. Research dashboard queries logs for analytics

### Admin Flow

1. Admin authenticates via `ResearchDashboardLogin`
2. Session stored in localStorage
3. Admin pages check authentication status
4. CRUD operations use Firestore Admin SDK or authenticated requests

## Key Patterns

### Study-Based Filtering

All data operations filter by `studyId`:
```typescript
const articles = await getArticles(studyId);
const config = getProjectConfig(studyId);
```

### Project Configuration

Each study has a project config that provides:
- Author information (name, bio, image)
- Site name
- Feature flags (author variations, explain box, etc.)
- Publication date format

### Client/Server Component Split

- **Server Components**: Initial data fetching, SEO
- **Client Components**: Interactivity, hooks, browser APIs
- Marked with `"use client"` directive when needed

### Type Safety

- TypeScript throughout
- Firestore types defined in `firestore.ts`
- Component props typed with interfaces

## Environment Configuration

The app supports multiple environments:
- **Development**: Uses dev Firebase project or emulator
- **Production**: Uses production Firebase project
- Controlled via environment variables and `.firebaserc`

## Dependencies

**Core:**
- Next.js 14+ (App Router)
- React 18+
- TypeScript

**Firebase:**
- Firebase SDK (Firestore, Auth)
- Firestore emulator for local development

**UI:**
- CSS Modules for component styling
- Tailwind CSS (via utility classes)

## Development Workflow

1. **Local Development**: Uses dev Firebase project (or emulator)
2. **Data Import**: Production data can be exported/imported for testing
3. **Study Management**: Studies can be added via admin UI
4. **Config Management**: Project configs managed via admin UI

## Security Considerations

- Client-side authentication for admin pages
- Firestore security rules control data access
- Study-based data isolation
- Logs are append-only

## Future Considerations

- Server-side authentication for admin
- Enhanced security rules
- Additional study features
- Analytics enhancements
