#!/usr/bin/env python3
"""
Merges Qualtrics survey responses with dashboard log data.

Matches records based on:
- Qualtrics CSV: ResponseId column
- Dashboard CSV: qualtricsResponseId column

Outputs a merged CSV where each log entry includes the corresponding
Qualtrics survey response data.
"""

import csv
import sys
from pathlib import Path
from collections import defaultdict
from typing import Dict, List, Any

def read_qualtrics_csv(file_path: Path) -> Dict[str, Dict[str, Any]]:
    """
    Reads Qualtrics CSV and returns a dictionary mapping ResponseId to response data.
    
    Qualtrics CSVs have multiple header rows:
    - Row 1: Column names (e.g., "StartDate", "ResponseId")
    - Row 2: Human-readable labels
    - Row 3: Import IDs (JSON format)
    - Row 4+: Actual data
    
    Args:
        file_path: Path to the Qualtrics CSV file
        
    Returns:
        Dictionary mapping ResponseId to a dict of all response fields
    """
    qualtrics_data = {}
    
    with open(file_path, 'r', encoding='utf-8') as f:
        reader = csv.reader(f)
        
        # Read the first row to get column names
        headers = next(reader)
        
        # Skip the next two header rows (human-readable labels and Import IDs)
        next(reader)  # Row 2
        next(reader)  # Row 3
        
        # Find the ResponseId column index
        try:
            response_id_idx = headers.index('ResponseId')
        except ValueError:
            print(f"Error: 'ResponseId' column not found in Qualtrics CSV")
            print(f"Available columns: {headers[:10]}...")
            sys.exit(1)
        
        # Read all data rows
        for row in reader:
            if not row or len(row) <= response_id_idx:
                continue
                
            response_id = row[response_id_idx].strip()
            if not response_id:
                continue
            
            # Create a dictionary with all columns for this response
            response_dict = {}
            for i, header in enumerate(headers):
                if i < len(row):
                    response_dict[header] = row[i]
                else:
                    response_dict[header] = ''
            
            qualtrics_data[response_id] = response_dict
    
    return qualtrics_data


def read_dashboard_csv(file_path: Path) -> List[Dict[str, Any]]:
    """
    Reads dashboard log CSV and returns a list of log entries.
    
    Args:
        file_path: Path to the dashboard CSV file
        
    Returns:
        List of dictionaries, each representing a log entry
    """
    logs = []
    
    with open(file_path, 'r', encoding='utf-8') as f:
        reader = csv.DictReader(f)
        
        for row in reader:
            logs.append(dict(row))
    
    return logs


def merge_data(qualtrics_data: Dict[str, Dict[str, Any]], 
                dashboard_logs: List[Dict[str, Any]]) -> List[Dict[str, Any]]:
    """
    Merges Qualtrics responses with dashboard logs.
    
    Args:
        qualtrics_data: Dictionary mapping ResponseId to Qualtrics response data
        dashboard_logs: List of dashboard log entries
        
    Returns:
        List of merged records, each containing log data + Qualtrics response data
    """
    merged = []
    matched_count = 0
    unmatched_count = 0
    matched_response_ids = set()
    
    for log in dashboard_logs:
        response_id = log.get('qualtricsResponseId', '').strip()
        
        if not response_id:
            # Log entry without a Qualtrics response ID
            merged_log = log.copy()
            merged_log['_match_status'] = 'no_qualtrics_id'
            merged.append(merged_log)
            unmatched_count += 1
            continue
        
        if response_id in qualtrics_data:
            # Found a match!
            qualtrics_response = qualtrics_data[response_id]
            
            # Create merged record: start with log data, add Qualtrics data with prefix
            merged_log = log.copy()
            
            # Add all Qualtrics fields with a prefix to avoid column name conflicts
            for key, value in qualtrics_response.items():
                merged_log[f'qualtrics_{key}'] = value
            
            merged_log['_match_status'] = 'matched'
            merged.append(merged_log)
            matched_count += 1
            matched_response_ids.add(response_id)
        else:
            # Log entry with a Qualtrics ID that doesn't exist in Qualtrics data
            merged_log = log.copy()
            merged_log['_match_status'] = 'qualtrics_id_not_found'
            merged.append(merged_log)
            unmatched_count += 1
    
    return merged, matched_count, unmatched_count, matched_response_ids


def write_merged_csv(merged_data: List[Dict[str, Any]], output_path: Path):
    """
    Writes merged data to a CSV file.
    
    Args:
        merged_data: List of merged records
        output_path: Path where the output CSV should be written
    """
    if not merged_data:
        print("No data to write!")
        return
    
    # Get all unique keys from all records
    all_keys = set()
    for record in merged_data:
        all_keys.update(record.keys())
    
    # Sort keys: put standard log columns first, then Qualtrics columns, then metadata
    standard_log_keys = ['qualtricsResponseId', 'userId', 'studyId', 'studyName', 
                         'ipAddress', 'action', 'details', 'timestamp', 'url', 
                         'articleId', 'articleTitle', 'id']
    
    # Order: standard log keys (that exist), then qualtrics_* keys, then other keys, then _match_status
    ordered_keys = []
    seen = set()
    
    # Add standard log keys first
    for key in standard_log_keys:
        if key in all_keys:
            ordered_keys.append(key)
            seen.add(key)
    
    # Add qualtrics_* keys
    qualtrics_keys = sorted([k for k in all_keys if k.startswith('qualtrics_') and k not in seen])
    ordered_keys.extend(qualtrics_keys)
    seen.update(qualtrics_keys)
    
    # Add other keys
    other_keys = sorted([k for k in all_keys if k not in seen and not k.startswith('_')])
    ordered_keys.extend(other_keys)
    seen.update(other_keys)
    
    # Add metadata keys last
    metadata_keys = sorted([k for k in all_keys if k.startswith('_')])
    ordered_keys.extend(metadata_keys)
    
    with open(output_path, 'w', encoding='utf-8', newline='') as f:
        writer = csv.DictWriter(f, fieldnames=ordered_keys)
        writer.writeheader()
        writer.writerows(merged_data)


def print_summary(qualtrics_data: Dict[str, Dict[str, Any]], 
                  dashboard_logs: List[Dict[str, Any]],
                  matched_count: int,
                  unmatched_count: int,
                  matched_response_ids: set):
    """
    Prints a summary of the merge operation.
    
    Args:
        qualtrics_data: Dictionary of Qualtrics responses
        dashboard_logs: List of dashboard logs
        matched_count: Number of matched log entries
        unmatched_count: Number of unmatched log entries
        matched_response_ids: Set of ResponseIds that were matched
    """
    print("\n" + "="*70)
    print("MERGE SUMMARY")
    print("="*70)
    print(f"Qualtrics responses loaded: {len(qualtrics_data)}")
    print(f"Dashboard log entries loaded: {len(dashboard_logs)}")
    print(f"\nMatched log entries: {matched_count}")
    print(f"Unmatched log entries: {unmatched_count}")
    print(f"Unique Qualtrics ResponseIds matched: {len(matched_response_ids)}")
    
    # Show unmatched Qualtrics responses
    unmatched_qualtrics = set(qualtrics_data.keys()) - matched_response_ids
    if unmatched_qualtrics:
        print(f"\nQualtrics responses with no matching logs: {len(unmatched_qualtrics)}")
        if len(unmatched_qualtrics) <= 10:
            print(f"  ResponseIds: {', '.join(sorted(unmatched_qualtrics))}")
        else:
            print(f"  ResponseIds (first 10): {', '.join(sorted(list(unmatched_qualtrics))[:10])}...")
    
    # Show log entries without Qualtrics IDs
    logs_without_id = sum(1 for log in dashboard_logs if not log.get('qualtricsResponseId', '').strip())
    if logs_without_id > 0:
        print(f"\nLog entries without qualtricsResponseId: {logs_without_id}")
    
    print("="*70 + "\n")


def main():
    """Main function to run the merge process."""
    # Define file paths
    script_dir = Path(__file__).parent
    qualtrics_file = script_dir / 'qt' / 'Study2_Media Summarization and Consumption_January 24, 2026_17.41.csv'
    dashboard_file = script_dir / 'dashboard-data' / 'filtered_logs_2025-10-29-to-2026-01-25.csv'
    output_file = script_dir / 'merged_data.csv'
    
    # Check if input files exist
    if not qualtrics_file.exists():
        print(f"Error: Qualtrics file not found: {qualtrics_file}")
        sys.exit(1)
    
    if not dashboard_file.exists():
        print(f"Error: Dashboard file not found: {dashboard_file}")
        sys.exit(1)
    
    print("Reading Qualtrics CSV...")
    qualtrics_data = read_qualtrics_csv(qualtrics_file)
    print(f"  Loaded {len(qualtrics_data)} responses")
    
    print("Reading dashboard CSV...")
    dashboard_logs = read_dashboard_csv(dashboard_file)
    print(f"  Loaded {len(dashboard_logs)} log entries")
    
    print("Merging data...")
    merged_data, matched_count, unmatched_count, matched_response_ids = merge_data(
        qualtrics_data, dashboard_logs
    )
    
    print("Writing merged CSV...")
    write_merged_csv(merged_data, output_file)
    print(f"  Written to: {output_file}")
    
    # Print summary
    print_summary(qualtrics_data, dashboard_logs, matched_count, 
                 unmatched_count, matched_response_ids)
    
    print("Done!")


if __name__ == '__main__':
    main()
