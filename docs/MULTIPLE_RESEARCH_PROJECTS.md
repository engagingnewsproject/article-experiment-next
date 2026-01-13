# Multiple Research Projects Integration

## Overview

The article experiment platform now supports **multiple independent research projects** (studies) running simultaneously. Each project can have its own customized appearance, author information, and study-specific settings, while sharing the same underlying platform infrastructure.

## Why This Matters

Previously, the system was designed for a single study. Now, researchers can:

- **Run multiple studies simultaneously** without interference
- **Customize each study's appearance** (site name, author, publication date format)
- **Manage studies independently** through an admin interface
- **Maintain data separation** between different research projects
- **Preserve existing data** - all current articles and data remain intact

## Key Concepts

### Studies

A **Study** is a research project identifier. Each study has:
- A unique ID (e.g., `eonc`, `msc`)
- A display name (e.g., "Evaluating Online News Comments")
- Optional aliases for backward compatibility

Studies are managed through the **"Manage Studies"** admin page.

### Study Configurations

Each study can have a **Study Configuration** that defines:
- **Site Name**: The name of the news site (e.g., "The Gazette Star")
- **Author Information**:
  - Author name
  - Author biography (personal and basic versions)
  - Author photo
- **Publication Date Format**: How dates are displayed (e.g., "1 day ago")
- **Feature Flags**: Which experimental features are enabled:
  - Author variations
  - Explanation boxes
  - Comment variations
  - Summaries

Configurations are managed through the **"Manage Study Configs"** admin page.

### Articles

Articles are now associated with a specific study via a `studyId` field. When an article is created:
- It inherits the study's configuration (author, site name, publication date)
- It can be filtered and displayed by study
- It maintains backward compatibility with existing articles

## How It Works

### Configuration Priority

The system uses a priority order to determine which configuration to use:

1. **Code-defined configs** (highest priority) - Built into the system, cannot be changed via UI (Ashwin's Research Project)
2. **Firestore configs** - Created and managed through the admin interface
3. **Default config** - Falls back to the default "Evaluating Online News Comments" config

### Article Rendering

When an article is displayed:
1. The system identifies the article's `studyId`
2. It loads the corresponding study configuration
3. It uses that configuration to display:
   - Site name in the header
   - Author name and biography
   - Publication date format
   - Author photo

If an article doesn't have a `studyId` (older articles), it defaults to the "eonc" study configuration for backward compatibility.

### URL Parameters

Articles can be accessed with study-specific URLs:
- `?study=eonc` - Shows articles for the "Evaluating Online News Comments" study
- `?study=msc` - Shows articles for the "Media Summarization and Consumption" study
- No parameter - Shows all articles (or defaults to eonc for backward compatibility)

## Admin Interface

### Manage Studies Page (`/admin/manage-studies`)

This page allows you to:
- **View all studies** (both code-defined and Firestore-based)
- **Add new studies** with a unique ID and name
- **Edit study names** and aliases
- **Delete studies** (only Firestore-based studies)
- **See configuration status** for each study:
  - "Code-defined" - Built into the system
  - "Firestore Config" - Has a custom configuration
  - "Default Config" - Uses the default configuration

### Manage Study Configs Page (`/admin/manage-project-configs`)

This page allows you to:
- **View all study configurations**
- **Create new configurations** for studies
- **Edit existing configurations** (Firestore-based only)
- **Delete configurations** (Firestore-based only)

Code-defined configs (like `eonc`) are shown as read-only and cannot be edited or deleted.

## Creating a New Study

To set up a new research project:

1. **Create the Study**:
   - Go to `/admin/manage-studies`
   - Click "Add New Study"
   - Enter a unique ID (e.g., `msc`) and name
   - Save

2. **Create the Configuration** (optional):
   - Go to `/admin/manage-project-configs`
   - Find your study in the list
   - Click "Create Config" if it doesn't exist
   - Fill in:
     - Site name
     - Author name
     - Author biographies (personal and basic)
     - Author image URL
     - Publication date format
     - Feature flags (checkboxes for enabled features)
   - Save

3. **Create Articles**:
   - When creating articles, select the study from the dropdown
   - The article will automatically inherit the study's configuration
   - Articles will display with the study's custom author, site name, etc.

## Data Organization

### Studies Collection (`studies/`)
Stores study definitions:
- Study ID
- Study name
- Aliases (for backward compatibility)

### Project Configs Collection (`projectConfigs/`)
Stores study configurations:
- Study ID (links to study)
- Site name
- Author information
- Feature flags

### Articles Collection (`articles/`)
Each article now includes:
- `studyId` - Links the article to its study
- `siteName` - Stored from the study config at creation time
- `author` - Stored from the study config at creation time
- `pubdate` - Stored from the study config at creation time

This ensures that even if a study's configuration changes later, existing articles maintain their original appearance.

## Backward Compatibility

The system maintains full backward compatibility:

- **Existing articles** without a `studyId` are treated as belonging to the default "eonc" study
- **URLs without study parameters** still work and default to showing all articles or the default study
- **Old study aliases** (like `ashwin`) are automatically mapped to their canonical IDs (`eonc`)

## Benefits for Researchers

1. **Data Isolation**: Each study's data is clearly separated and can be filtered
2. **Customization**: Each study can have its own branding and author information
3. **Flexibility**: Studies can be added, modified, or removed without affecting others
4. **Consistency**: All articles in a study automatically use the same configuration
5. **Scalability**: The system can support many studies simultaneously
6. **Maintainability**: Changes to one study don't affect others

## Technical Notes

- Study configurations are cached for performance
- Code-defined configs take precedence over Firestore configs
- The system falls back gracefully if a configuration is missing
- All data is stored in Firebase Firestore
- The admin interface provides full CRUD operations for studies and configs

## Example Use Cases

1. **Multiple Research Teams**: Different research teams can run their studies simultaneously without interfering with each other

2. **A/B Testing**: Create multiple studies with different configurations to test how author information or site branding affects participant behavior

3. **Longitudinal Studies**: Maintain separate studies for different phases or waves of research

4. **Collaborative Research**: Share the platform with other researchers while maintaining data and configuration separation

