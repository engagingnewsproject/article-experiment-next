/**
 * FilterSection Component
 * 
 * A reusable filter section component for the research dashboard that can be used
 * in both the User Activity (logs) and Comments tabs.
 * 
 * @component
 */

'use client';

import { StudyDropdown } from './StudyDropdown';
import { DateRangePicker } from './DateRangePicker';
import { TextInput } from './TextInput';
import { Select } from './Select';
import { Checkbox } from './Checkbox';
import { StudyDefinition } from '@/lib/studies';

interface FilterSectionProps {
  /** Study-related props */
  studies: StudyDefinition[];
  selectedStudy: string;
  onStudyChange: (studyId: string) => void;

  /** Date range props */
  dateRange: string;
  onDateRangeChange: (value: string) => void;
  customStartDate: string;
  customEndDate: string;
  onCustomStartDateChange: (value: string) => void;
  onCustomEndDateChange: (value: string) => void;

  /** QT Response ID filter props */
  qtResponseId: string;
  onQtResponseIdChange: (value: string) => void;
  showOnlyWithQtResponseId: boolean;
  onShowOnlyWithQtResponseIdChange: (value: boolean) => void;

  /** Article filter props */
  selectedArticle: string;
  onArticleChange: (articleId: string) => void;
  articleOptions: Array<{ value: string; label: string }>;
  showArticleFilter?: boolean;
  onShowArticleFilterChange?: (value: boolean) => void;

  /** Action type filter props (for logs only) */
  selectedActions?: string[];
  onSelectedActionsChange?: (actions: string[]) => void;
  availableActions?: Record<string, number>;
  actionCounts?: Record<string, number>;

  /** Search props (for comments only) */
  searchTerm?: string;
  onSearchTermChange?: (value: string) => void;
  searchPlaceholder?: string;

  /** Sort props (for comments only) */
  sortValue?: string;
  onSortChange?: (value: string) => void;
  sortOptions?: Array<{ value: string; label: string }>;

  /** Show default comments toggle (for comments only) */
  showDefaultComments?: boolean;
  onShowDefaultCommentsChange?: (value: boolean) => void;

  /** Clear filters handler */
  onClearFilters: () => void;

  /** Optional className for the container */
  className?: string;
}

/**
 * Reusable filter section component for research dashboard tabs
 */
export function FilterSection({
  studies,
  selectedStudy,
  onStudyChange,
  dateRange,
  onDateRangeChange,
  customStartDate,
  customEndDate,
  onCustomStartDateChange,
  onCustomEndDateChange,
  qtResponseId,
  onQtResponseIdChange,
  showOnlyWithQtResponseId,
  onShowOnlyWithQtResponseIdChange,
  selectedArticle,
  onArticleChange,
  articleOptions,
  showArticleFilter = false,
  onShowArticleFilterChange,
  selectedActions = [],
  onSelectedActionsChange,
  availableActions,
  actionCounts,
  searchTerm,
  onSearchTermChange,
  searchPlaceholder = 'Search',
  sortValue,
  onSortChange,
  sortOptions,
  showDefaultComments,
  onShowDefaultCommentsChange,
  onClearFilters,
  className = '',
}: FilterSectionProps) {
  const isLogsView = !!availableActions;
  const isCommentsView = searchTerm !== undefined;

  // Render different layouts for logs vs comments
  if (isCommentsView) {
    // Comments view: 3-column grid layout (similar to logs)
    return (
      <div className={`p-6 mb-8 bg-white rounded-lg shadow ${className}`}>
        <div className="grid grid-cols-1 gap-4 md:grid-cols-3 items-start">
          {/* Study Dropdown - Full Width */}
          <div className="md:col-span-3">
            <StudyDropdown
              value={selectedStudy}
              onChange={onStudyChange}
              studies={studies}
            />
          </div>

          {/* Left Column - Date Range and Filters */}
          <div className="md:col-span-2 space-y-4">
            {/* Date Range - First */}
            <DateRangePicker
              value={dateRange}
              onChange={onDateRangeChange}
              customStartDate={customStartDate}
              customEndDate={customEndDate}
              onCustomStartDateChange={onCustomStartDateChange}
              onCustomEndDateChange={onCustomEndDateChange}
            />

            {/* Article Filter */}
            <div>
              <Select
                id="article-select"
                value={selectedArticle}
                onChange={onArticleChange}
                label="Article"
                options={[
                  { value: 'all', label: 'All Articles' },
                  ...articleOptions,
                ]}
              />
            </div>

            {/* Search */}
            {onSearchTermChange && (
              <div>
                <TextInput
                  id="search-input"
                  value={searchTerm || ''}
                  onChange={onSearchTermChange}
                  placeholder={searchPlaceholder}
                  label="Search"
                />
              </div>
            )}
          </div>

          {/* Right Column - Show Default Comments, QT Response ID, and Clear Button */}
          <div className="space-y-4">
            {/* Show Default Comments Checkbox */}
            {onShowDefaultCommentsChange !== undefined && (
              <div>
                <div className="w-full px-3 py-2 border border-gray-300 rounded-md bg-white">
                  <Checkbox
                    checked={showDefaultComments ?? true}
                    onChange={onShowDefaultCommentsChange}
                    label="Show Default Comments"
                  />
                </div>
              </div>
            )}

            {/* QT Response ID Filter with Checkbox - Only show in logs view, not comments */}
            {!isCommentsView && (
              <div className="qt-response-id-filter">
                <div className="w-full px-3 py-2 border border-gray-300 rounded-md bg-white">
                  <Checkbox
                    checked={showOnlyWithQtResponseId}
                    onChange={onShowOnlyWithQtResponseIdChange}
                    label="Only show rows with QT Response ID"
                  />
                  {showOnlyWithQtResponseId && (
                    <div className="mt-3">
                      <TextInput
                        id="qt-response-id-input"
                        value={qtResponseId}
                        onChange={onQtResponseIdChange}
                        placeholder="QT Response ID"
                        label="QT Response ID"
                      />
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* Sort Select */}
            {sortValue && onSortChange && sortOptions && (
              <div>
                <Select
                  id="sort-select"
                  value={sortValue}
                  onChange={onSortChange}
                  label="Sort By"
                  options={sortOptions}
                />
              </div>
            )}

            {/* Clear Filters Button */}
            <button
              onClick={onClearFilters}
              className="w-full px-3 py-2 text-sm text-white bg-gray-500 rounded-md hover:bg-gray-600"
            >
              Clear Filters
            </button>
          </div>
        </div>
      </div>
    );
  }

  // Logs view: 3-column grid layout
  return (
    <div className={`p-6 mb-8 bg-white rounded-lg shadow ${className}`}>
      <div className="grid grid-cols-1 gap-4 md:grid-cols-3 items-start">
        {/* Study Dropdown - Full Width */}
        <div className="md:col-span-3">
          <StudyDropdown
            value={selectedStudy}
            onChange={onStudyChange}
            studies={studies}
          />
        </div>

        {/* Left Column - Date Range and Filters */}
        <div className="md:col-span-2 space-y-4">
          <DateRangePicker
            value={dateRange}
            onChange={onDateRangeChange}
            customStartDate={customStartDate}
            customEndDate={customEndDate}
            onCustomStartDateChange={onCustomStartDateChange}
            onCustomEndDateChange={onCustomEndDateChange}
          />

          {/* QT Response ID Filter with Checkbox */}
          <div className="qt-response-id-filter">
            <div className="w-full px-3 py-2 border border-gray-300 rounded-md bg-white">
              <Checkbox
                checked={showOnlyWithQtResponseId}
                onChange={onShowOnlyWithQtResponseIdChange}
                label="Only show rows with QT Response ID"
              />
              {showOnlyWithQtResponseId && (
                <div className="mt-3">
                  <TextInput
                    id="qt-response-id-input"
                    value={qtResponseId}
                    onChange={onQtResponseIdChange}
                    placeholder="Filter by individual ID"
                    label="QT Response ID"
                  />
                </div>
              )}
            </div>
          </div>

          {/* Article Filter with Checkbox */}
          {onShowArticleFilterChange && (
            <div>
              <div className="w-full px-3 py-2 border border-gray-300 rounded-md bg-white">
                <Checkbox
                  checked={showArticleFilter}
                  onChange={onShowArticleFilterChange}
                  label="Filter by article"
                />
                {showArticleFilter && (
                  <div className="mt-3">
                    <Select
                      id="article-select"
                      value={selectedArticle}
                      onChange={onArticleChange}
                      label="Article"
                      options={[
                        { value: 'all', label: 'All Articles' },
                        ...articleOptions,
                      ]}
                    />
                  </div>
                )}
              </div>
            </div>
          )}
        </div>

        {/* Right Column - Action Types and Clear Button */}
        <div className="space-y-4">
          {/* Action Type Filter */}
          {availableActions && onSelectedActionsChange && (
            <div>
              <label className="sr-only">Action Type</label>
              <div className="w-full px-3 py-2 border border-gray-300 rounded-md bg-white max-h-56 overflow-y-auto">
                {Object.keys(availableActions).length > 0 ? (
                  <div className="space-y-2">
                    {Object.keys(availableActions).map(action => (
                      <div key={action} className="hover:bg-gray-50 p-1 rounded">
                        <Checkbox
                          checked={selectedActions.includes(action)}
                          onChange={(checked) => {
                            if (checked) {
                              onSelectedActionsChange([...selectedActions, action]);
                            } else {
                              onSelectedActionsChange(selectedActions.filter(a => a !== action));
                            }
                          }}
                          label={
                            <>
                              {action} <span className="text-gray-500">({actionCounts?.[action] || 0})</span>
                            </>
                          }
                        />
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="text-sm text-gray-500 py-2">No actions available</div>
                )}
              </div>
            </div>
          )}

          {/* Clear Filters Button */}
          <button
            onClick={onClearFilters}
            className="w-full px-3 py-2 text-sm text-white bg-gray-500 rounded-md hover:bg-gray-600"
          >
            Clear Filters
          </button>
        </div>
      </div>
    </div>
  );
}
