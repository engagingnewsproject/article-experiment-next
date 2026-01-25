/**
 * DateRangePicker Component
 * 
 * A reusable date range picker that combines preset date ranges (All Time, Last 24 hours, etc.)
 * with custom date range selection using calendar inputs.
 * 
 * @param value - The selected preset range ('all', '1', '7', '30', '90', or 'custom')
 * @param onChange - Callback when preset range changes
 * @param customStartDate - Start date value for custom range (YYYY-MM-DD format)
 * @param customEndDate - End date value for custom range (YYYY-MM-DD format)
 * @param onCustomStartDateChange - Callback when custom start date changes
 * @param onCustomEndDateChange - Callback when custom end date changes
 * @param label - Optional label text (defaults to "Date Range")
 * @param className - Optional additional CSS classes
 */
interface DateRangePickerProps {
  value: string;
  onChange: (value: string) => void;
  customStartDate: string;
  customEndDate: string;
  onCustomStartDateChange: (value: string) => void;
  onCustomEndDateChange: (value: string) => void;
  label?: string;
  className?: string;
}

export function DateRangePicker({
  value,
  onChange,
  customStartDate,
  customEndDate,
  onCustomStartDateChange,
  onCustomEndDateChange,
  label = 'Date Range',
  className = '',
}: DateRangePickerProps) {
  const handlePresetChange = (newValue: string) => {
    onChange(newValue);
    // Clear custom dates when switching to preset
    if (newValue !== 'custom') {
      onCustomStartDateChange('');
      onCustomEndDateChange('');
    }
  };

  return (
    <div>
      <label htmlFor="date-range-select" className="sr-only">{label}</label>
      <select 
        id="date-range-select"
        value={value} 
        onChange={(e) => handlePresetChange(e.target.value)}
        className={`w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors ${className}`}
      >
        <option value="custom">Date Range</option>
        <option value="1">Last 24 hours</option>
        <option value="7">Last 7 days</option>
        <option value="30">Last 30 days</option>
        <option value="90">Last 90 days</option>
        <option value="all">All Time</option>
      </select>
      {value === 'custom' && (
        <div className="mt-3 p-4 bg-blue-50 border border-blue-200 rounded-lg shadow-sm relative z-10">
          <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
            <div>
              <label htmlFor="start-date" className="block mb-1 text-sm font-medium text-gray-700">Start Date</label>
              <input
                id="start-date"
                type="date"
                value={customStartDate}
                onChange={(e) => onCustomStartDateChange(e.target.value)}
                className="w-full px-3 py-2.5 text-sm border border-gray-300 rounded-md bg-white focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors shadow-sm cursor-pointer"
              />
            </div>
            <div>
              <label htmlFor="end-date" className="block mb-1 text-sm font-medium text-gray-700">End Date</label>
              <input
                id="end-date"
                type="date"
                value={customEndDate}
                onChange={(e) => onCustomEndDateChange(e.target.value)}
                min={customStartDate || undefined}
                className="w-full px-3 py-2.5 text-sm border border-gray-300 rounded-md bg-white focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors shadow-sm cursor-pointer"
              />
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
