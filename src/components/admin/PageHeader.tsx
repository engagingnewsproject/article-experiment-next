/**
 * PageHeader component that provides consistent header styling for admin pages.
 * 
 * This component:
 * - Displays a page title and optional subtitle/description
 * - Uses consistent styling across all admin pages
 * - Supports both regular and full-width layouts
 * 
 * @component
 */

interface PageHeaderProps {
  /**
   * The main page title.
   */
  title: string;
  
  /**
   * Optional subtitle or description text displayed below the title.
   */
  subtitle?: string;
}

export function PageHeader({ title, subtitle }: PageHeaderProps) {
  return (
    <div className="flex items-start justify-between mb-8">
      <div>
        <h1 className="mb-2 text-3xl font-bold text-gray-900">{title}</h1>
        {subtitle && (
          <p className="text-gray-600">{subtitle}</p>
        )}
      </div>
    </div>
  );
}
