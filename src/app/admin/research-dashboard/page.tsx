/**
 * Research Data Dashboard Page
 *
 * This page provides an interactive dashboard for researchers to explore, filter, and export
 * user activity logs, articles, and comments from Firestore. It includes authentication,
 * data loading, statistics calculation, and tabbed views for logs, articles, and comments.
 *
 * Main Features:
 * - Authenticated access for researchers
 * - Loads logs, articles, and user comments from Firestore
 * - Combines default and user-submitted comments for analysis
 * - Calculates and displays key statistics (totals, date range, unique users, etc.)
 * - Provides tabbed navigation for overview, logs, articles, and comments
 * - Supports searching, filtering, and CSV/JSON export of data
 * - Displays both default and user comment counts per article
 * - Shows comment details, including type (default/user), upvotes/downvotes, and timestamps
 *
 * Key Logic:
 * - Data is loaded on authentication and stored in React state
 * - Comments are aggregated from both article default_comments and article subcollections
 * - Filtering and searching is performed in-memory for fast UI updates
 * - All data views are kept in sync with the loaded Firestore data
 *
 * File Structure:
 * - Interfaces: LogEntry, Article, Comment, DashboardStats
 * - Main component: ResearchDashboard (React function component)
 * - useEffect: Handles authentication and triggers data loading
 * - loadData: Loads and processes all Firestore data for the dashboard
 * - Filtering/searching: Handled via React state and derived arrays
 * - UI: Tabbed navigation, tables, and cards for each data type
 *
 * For more details on Firestore structure and comment aggregation, see the inline comments
 * within the loadData function and the allComments calculation.
 */

'use client';

import { StudyDropdown } from '@/components/admin/StudyDropdown';
import { ResearchDashboardLogin } from '@/components/admin/ResearchDashboardLogin';
import { PageHeader } from '@/components/admin/PageHeader';
import { FilterSection } from '@/components/admin/FilterSection';
import { TextInput } from '@/components/admin/TextInput';
import { signOut, getCurrentUser, onAuthChange } from '@/lib/auth';
import { User } from 'firebase/auth';
import { db } from '@/lib/firebase';
import { loadStudies, StudyDefinition, getStudyAliases, getStudyName, CODE_STUDIES } from '@/lib/studies';
import DOMPurify from 'dompurify';
import { collection, getDocs, orderBy, query, Timestamp, where, limit } from 'firebase/firestore';
import { useEffect, useState, useMemo, useCallback } from 'react';
import { BiRefresh } from 'react-icons/bi';

interface LogEntry {
  parentId?: string;
  id: string;
  url: string;
  identifier: string;
  articleTitle?: string;
  userId: string;
  ipAddress?: string;
  action: string;
  label: string;
  details: string;
  timestamp: any;
  qualtricsResponseId?: string;
  qualtricsSurveyId?: string;
}

interface Article {
  id: string;
  title: string;
  slug: string;
  content: string;
  createdAt?: any;
  updatedAt?: any;
  anonymous?: boolean;
  pubdate: string;
  author: any;
  comments_display: boolean;
  default_comments?: Comment[];
  comments?: LocalComment[];
  themes?: any[];
  summary?: string;
}

interface LocalComment {
  id: string;
  name: string;
  content: string;
  createdAt: string;
  upvotes: number;
  downvotes: number;
  identifier: string;
  parentId?: string;
  grandParentId?: string;
  replies?: LocalComment[];
  qualtricsResponseId?: string;
}

interface DashboardStats {
  totalLogs: number;
  totalArticles: number;
  totalComments: number;
  uniqueUsers: number;
  totalActions: number;
  dateRange: {
    earliest: string;
    latest: string;
  };
  actionsByType: Record<string, number>;
  articlesWithComments: number;
  averageWordCount: number;
}

/**
 * Helper function to check if a studyId matches the selected study (including aliases).
 * For code-defined studies like 'eonc', also includes items without a studyId (legacy items).
 */
function matchesStudy(studyId: string | undefined, selectedStudy: string): boolean {
  if (selectedStudy === 'all') return true;
  
  // For code-defined studies (like 'eonc'), include items without studyId as legacy items
  const isCodeDefinedStudy = CODE_STUDIES.some(s => s.id === selectedStudy);
  if (isCodeDefinedStudy && !studyId) {
    return true; // Legacy items belong to code-defined studies
  }
  
  if (!studyId) return false;
  const aliases = getStudyAliases(selectedStudy);
  return aliases.includes(studyId);
}

/**
 * Safely extracts a Date object from a Firestore timestamp.
 * Handles Firestore Timestamp objects, string timestamps, and invalid values.
 * 
 * @param timestamp - Firestore timestamp, string, number, or null/undefined
 * @returns Date object or null if invalid
 */
function safeExtractDate(timestamp: any): Date | null {
  if (!timestamp) return null;
  try {
    // Handle Firestore Timestamp objects
    if (timestamp && typeof timestamp.toDate === 'function') {
      return timestamp.toDate();
    }
    // Handle string/number timestamps
    const date = new Date(timestamp);
    return isNaN(date.getTime()) ? null : date;
  } catch {
    return null;
  }
}

/**
 * Extracts all valid dates from an array of logs.
 * 
 * @param logs - Array of log entries with timestamp fields
 * @returns Array of valid Date objects
 */
function extractValidDates(logs: LogEntry[]): Date[] {
  return logs
    .map(log => safeExtractDate(log.timestamp))
    .filter((date): date is Date => date !== null);
}

export default function ResearchDashboard() {
  const [userEmail, setUserEmail] = useState('');
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [logs, setLogs] = useState<LogEntry[]>([]);
  const [articles, setArticles] = useState<Article[]>([]);
  const [comments, setComments] = useState<LocalComment[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshingLogs, setRefreshingLogs] = useState(false);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [studies, setStudies] = useState<StudyDefinition[]>([]);
  const [selectedDateRange, setSelectedDateRange] = useState('7');
  const [customStartDate, setCustomStartDate] = useState<string>('');
  const [customEndDate, setCustomEndDate] = useState<string>('');
  const [selectedActions, setSelectedActions] = useState<string[]>([]);
  const [selectedArticle, setSelectedArticle] = useState('all');
  const [selectedStudy, setSelectedStudy] = useState<string>('all'); // Filter by study ID
  const [viewMode, setViewMode] = useState<'logs' | 'articles' | 'comments'>('logs');
  const [searchTerm, setSearchTerm] = useState('');

  // Add a new state for date filter in comments
  const [selectedCommentDateRange, setSelectedCommentDateRange] = useState('all');
  const [commentCustomStartDate, setCommentCustomStartDate] = useState<string>('');
  const [commentCustomEndDate, setCommentCustomEndDate] = useState<string>('');
  
  // Add a new state for QT Response ID filter in comments
  const [commentQtResponseIdFilter, setCommentQtResponseIdFilter] = useState('');
  const [showOnlyWithQtResponseIdComments, setShowOnlyWithQtResponseIdComments] = useState(false);

  // Add a new state for article title/id filter in comments
  const [articleTitleIdFilter, setArticleTitleIdFilter] = useState('');

  // Add a new state for QT Response ID filter in logs
  const [qtResponseIdFilter, setQtResponseIdFilter] = useState('');
  const [showOnlyWithQtResponseId, setShowOnlyWithQtResponseId] = useState(false);
  const [showArticleFilter, setShowArticleFilter] = useState(false);

  // State for toggling default comments in comments tab
  const [showDefaultComments, setShowDefaultComments] = useState(true);

  // Tooltip state for all comments (move to top-level of component)
  const [showTooltip, setShowTooltip] = useState(false);
  const [tooltipPos, setTooltipPos] = useState({ x: 0, y: 0 });
  const [tooltipComment, setTooltipComment] = useState<any | null>(null);
  let tooltipTimeout: NodeJS.Timeout;

  const [numShownComments, setNumShownComments] = useState(50);

  // New state for sorting comments
  const [commentSort, setCommentSort] = useState('date-desc');

  // State for full width toggle
  const [isFullWidth, setIsFullWidth] = useState(false);

  // State for mobile menu
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  useEffect(() => {
    // Subscribe to Firebase Auth state changes to get user email (auth is handled by layout)
    const unsubscribe = onAuthChange((user: User | null) => {
      if (user && user.email) {
        setUserEmail(user.email);
      loadData();
        loadStudiesData();
    } else {
        setUserEmail('');
      setLoading(false);
    }
    });

    // Check initial auth state and load data
    const user = getCurrentUser();
    if (user && user.email) {
      setUserEmail(user.email);
      loadData();
      loadStudiesData();
    } else {
      setLoading(false);
    }

    return () => unsubscribe();
  }, []);

  // Initialize selectedActions with all available actions when stats are loaded
  useEffect(() => {
    if (stats?.actionsByType && selectedActions.length === 0) {
      const allActions = Object.keys(stats.actionsByType);
      setSelectedActions(allActions);
    }
  }, [stats?.actionsByType, selectedActions.length]);

  const loadStudiesData = async () => {
        try {
          const loadedStudies = await loadStudies();
          setStudies(loadedStudies);
        } catch (error) {
          console.error('Error loading studies:', error);
          setStudies([]);
        }
      };

  const handleLogout = async () => {
    try {
      await signOut();
    setUserEmail('');
    setStats(null);
    setLogs([]);
    setArticles([]);
    setComments([]);
    } catch (error) {
      console.error('Error signing out:', error);
    }
  };

  const loadData = async () => {
    try {
      setLoading(true);
      setLoadError(null);
      
      // Verify authentication before loading data
      const currentUser = getCurrentUser();
      if (!currentUser) {
        const errorMsg = 'User not authenticated. Please log in.';
        console.error('[Research Dashboard]', errorMsg);
        setLoadError(errorMsg);
        setLoading(false);
        return;
      }
      
      // Load logs and articles in parallel for better performance
      const [logsSnapshot, articlesSnapshot] = await Promise.all([
        getDocs(query(collection(db, 'logs'), orderBy('timestamp', 'desc'))).catch(error => {
          console.error('[Research Dashboard] Error loading logs:', error);
          throw new Error(`Failed to load logs: ${error instanceof Error ? error.message : String(error)}`);
        }),
        getDocs(query(collection(db, 'articles'), orderBy('createdAt', 'desc'))).catch(error => {
          console.error('[Research Dashboard] Error loading articles:', error);
          throw new Error(`Failed to load articles: ${error instanceof Error ? error.message : String(error)}`);
        })
      ]);

      const logsData = logsSnapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      })) as LogEntry[];

      // Process articles without loading comments initially (comments loaded on-demand)
      const articlesData = articlesSnapshot.docs.map(doc => ({
        ...(doc.data() as Article),
        id: doc.id,
        comments: [] // Comments loaded separately to avoid blocking
      }));

      // Load all user comments in parallel for all articles
      const commentPromises = articlesData.map(async (article) => {
        try {
          const commentsRef = collection(db, 'articles', article.id, 'comments');
          const commentsSnapshot = await getDocs(query(commentsRef, orderBy('createdAt', 'desc')));
          return commentsSnapshot.docs.map(doc => ({
            id: doc.id,
            ...doc.data(),
            identifier: article.id
          })) as LocalComment[];
        } catch (error) {
          console.warn(`[Research Dashboard] Failed to load comments for article ${article.id}:`, error);
          return [];
        }
      });

      const allUserCommentsArrays = await Promise.all(commentPromises);
      const allUserComments = allUserCommentsArrays.flat();

      // Update state with loaded data
      setLogs(logsData);
      setArticles(articlesData);
      setComments(allUserComments);

      // Calculate stats efficiently
      const uniqueUsers = new Set(logsData.map(log => log.userId)).size;
      const actionsByType: Record<string, number> = {};
      logsData.forEach(log => {
        actionsByType[log.action] = (actionsByType[log.action] || 0) + 1;
      });

      // Safely extract and convert timestamps to dates
      const validDates = extractValidDates(logsData);
      const dateRange = validDates.length > 0 ? {
        earliest: new Date(Math.min(...validDates.map(d => d.getTime()))).toISOString(),
        latest: new Date(Math.max(...validDates.map(d => d.getTime()))).toISOString()
      } : { earliest: '', latest: '' };

      const articlesWithComments = articlesData.filter(article => 
        Array.isArray(article.default_comments) && article.default_comments.length > 0
      ).length;

      // Calculate word count more efficiently
      let totalWordCount = 0;
      for (const article of articlesData) {
        if (article.content) {
          totalWordCount += article.content.split(/\s+/).length;
        }
      }

      const totalComments = articlesData.reduce((sum, article) => 
        sum + (Array.isArray(article.default_comments) ? article.default_comments.length : 0), 0
      ) + allUserComments.length;

      setStats({
        totalLogs: logsData.length,
        totalArticles: articlesData.length,
        totalComments,
        uniqueUsers,
        totalActions: logsData.length,
        dateRange,
        actionsByType,
        articlesWithComments,
        averageWordCount: articlesData.length > 0 ? Math.round(totalWordCount / articlesData.length) : 0
      });

    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : String(error);
      console.error('[Research Dashboard] Error loading data:', error);
      console.error('[Research Dashboard] Error details:', {
        message: errorMessage,
        stack: error instanceof Error ? error.stack : undefined,
        name: error instanceof Error ? error.name : undefined
      });
      setLoadError(errorMessage);
      // Set empty arrays on error so UI can still render
      setLogs([]);
      setArticles([]);
      setComments([]);
      setStats(null);
    } finally {
      setLoading(false);
    }
  };
  
  /**
   * Re-fetches only logs from Firestore and updates table + log-derived stats.
   * Does not touch articles, comments, or other dashboard data.
   */
  const refreshLogsOnly = async () => {
    const currentUser = getCurrentUser();
    if (!currentUser) return;
    try {
      setRefreshingLogs(true);
      const logsSnapshot = await getDocs(
        query(collection(db, 'logs'), orderBy('timestamp', 'desc'))
      );
      const logsData = logsSnapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      })) as LogEntry[];
      setLogs(logsData);

      // Update only the stats that depend on logs
      const uniqueUsers = new Set(logsData.map(log => log.userId)).size;
      const actionsByType: Record<string, number> = {};
      logsData.forEach(log => {
        actionsByType[log.action] = (actionsByType[log.action] || 0) + 1;
      });
      const validDates = extractValidDates(logsData);
      const dateRange = validDates.length > 0
        ? {
            earliest: new Date(Math.min(...validDates.map(d => d.getTime()))).toISOString(),
            latest: new Date(Math.max(...validDates.map(d => d.getTime()))).toISOString()
          }
        : { earliest: '', latest: '' };

      setStats(prev => prev ? {
        ...prev,
        totalLogs: logsData.length,
        totalActions: logsData.length,
        uniqueUsers,
        dateRange,
        actionsByType
      } : null);
    } catch (error) {
      console.error('[Research Dashboard] Error refreshing logs:', error);
      setLoadError(error instanceof Error ? error.message : String(error));
    } finally {
      setRefreshingLogs(false);
    }
  };
  
  const exportToCSV = (data: any[], filename: string) => {
    if (!data.length) return;
    const headers = Object.keys(data[0] || {});
    
    /**
     * Converts a Firestore Timestamp (in any format) to an ISO string.
     * Handles both live Timestamp objects and serialized formats.
     */
    const convertTimestamp = (value: any): string | null => {
      if (!value) return null;
      
      // Handle Firestore Timestamp with toDate method
      if (typeof value === 'object' && typeof value.toDate === 'function') {
        try {
          return value.toDate().toISOString();
        } catch {
          return null;
        }
      }
      
      // Handle serialized Firestore Timestamp with _seconds and _nanoseconds
      if (typeof value === 'object' && value._seconds !== undefined) {
        try {
          const milliseconds = value._seconds * 1000 + (value._nanoseconds || 0) / 1000000;
          return new Date(milliseconds).toISOString();
        } catch {
          return null;
        }
      }
      
      // Handle string or number timestamps
      if (typeof value === 'string' || typeof value === 'number') {
        const d = new Date(value);
        if (!isNaN(d.getTime())) return d.toISOString();
      }
      
      return null;
    };
    
    const csvContent = [
      headers.join(','),
      ...data.map(row => 
        headers.map(header => {
          let value = row[header];
          
          // Handle timestamp fields
          if ((header === 'timestamp' || header === 'createdAt' || header === 'updatedAt') && value) {
            const converted = convertTimestamp(value);
            value = converted || value;
          }
          // For other objects, convert to JSON string if they exist
          else if (typeof value === 'object' && value !== null) {
            value = JSON.stringify(value);
          }
          
          return typeof value === 'string' ? `"${value.replace(/"/g, '""')}"` : (value ?? '');
        }).join(',')
      )
    ].join('\n');

    const blob = new Blob([csvContent], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = filename;
    a.click();
    window.URL.revokeObjectURL(url);
  };

    // Prepare export rows for logs: ensure articleId and Qualtrics fields are present.
    // For qualtricsResponseId, if a row is missing it, try to attach the user's known response id
    // from any other log for that user (so all of a user's logs get the same qualtricsResponseId when available).
    const prepareLogExportRows = (rows: any[]) => {
      const userToQualtrics: Record<string, string> = {};
      // build mapping from full logs state so filtered exports can inherit values
      logs.forEach((l: any) => {
        if (l.userId && l.qualtricsResponseId) userToQualtrics[l.userId] = l.qualtricsResponseId;
      });

      return rows.map((row: any) => {
        // construct an ordered, minimal export row
        const studyId = row.studyId || '';
        return {
          qualtricsResponseId: row.qualtricsResponseId ?? userToQualtrics[row.userId] ?? '',
          // user and action
          userId: row.userId ?? '',
          studyId: studyId,
          studyName: studyId ? getStudyName(studyId) : '',
          ipAddress: row.ipAddress ?? '',
          action: row.action ?? '',
          // move details immediately after action
          details: row.details ?? '',
          // timestamp next
          timestamp: row.timestamp ?? '',
          url: row.url ?? '',
          // normalized article id
          articleId: row.articleId ?? row.identifier ?? '',
          articleTitle: row.articleTitle ?? row.label ?? '',
          // keep id last
          id: row.id ?? '',
        };
      });
    };

  // Memoize filtered logs to avoid recalculating on every render
  const filteredLogs = useMemo(() => logs.filter(log => {
    if (selectedActions.length > 0 && !selectedActions.includes(log.action)) return false;
    if (showArticleFilter && selectedArticle !== 'all' && log.identifier !== selectedArticle) return false;
    // Filter by studyId if selected (when "All Studies" is selected, show all logs)
    if (selectedStudy !== 'all') {
      const logStudyId = (log as any).studyId;
      if (!matchesStudy(logStudyId, selectedStudy)) return false;
    }
    // When "All Studies" is selected, include logs even if they don't have a studyId
    if (selectedDateRange !== 'all') {
      const logDate = log.timestamp?.toDate ? log.timestamp.toDate() : new Date(log.timestamp);
      
      // Handle custom date range
      if (selectedDateRange === 'custom') {
        if (customStartDate || customEndDate) {
          const startDate = customStartDate ? new Date(customStartDate) : null;
          const endDate = customEndDate ? new Date(customEndDate) : null;
          
          // Set end date to end of day if provided
          if (endDate) {
            endDate.setHours(23, 59, 59, 999);
          }
          
          if (startDate && logDate < startDate) return false;
          if (endDate && logDate > endDate) return false;
        }
      } else {
        // Handle preset ranges (1, 7, 30, 90 days)
        const now = new Date();
        const daysAgo = parseInt(selectedDateRange);
        const cutoffDate = new Date(now.getTime() - (daysAgo * 24 * 60 * 60 * 1000));
        if (logDate < cutoffDate) return false;
      }
    }
    // Filter by checkbox: show only logs with QT Response ID
    if (showOnlyWithQtResponseId && !log.qualtricsResponseId) return false;
    
    if (qtResponseIdFilter) {
      // If filtering by response ID, exclude rows without a response ID
      if (!log.qualtricsResponseId) return false;
      // If response ID doesn't match the filter, exclude it
      if (!log.qualtricsResponseId.toLowerCase().includes(qtResponseIdFilter.toLowerCase())) return false;
    }
    if (searchTerm) {
      const searchLower = searchTerm.toLowerCase();
      return (
        (log.label && log.label.toLowerCase().includes(searchLower)) ||
        (typeof log.details === 'string' && log.details.toLowerCase().includes(searchLower)) ||
        (log.url && log.url.toLowerCase().includes(searchLower)) ||
        (log.qualtricsResponseId && log.qualtricsResponseId.toLowerCase().includes(searchLower))
      );
    }
    return true;
  }), [logs, selectedActions, selectedArticle, selectedStudy, selectedDateRange, customStartDate, customEndDate, showOnlyWithQtResponseId, qtResponseIdFilter, searchTerm, showArticleFilter]);

  /**
   * Calculate action counts from filtered logs (excluding the action filter itself).
   * This gives us the count of logs that match all other filters for each action type.
   */
  const filteredActionCounts = useMemo(() => {
    const counts: Record<string, number> = {};
    
    // Filter logs by all criteria except selectedActions
    const logsFilteredByOtherCriteria = logs.filter(log => {
      if (showArticleFilter && selectedArticle !== 'all' && log.identifier !== selectedArticle) return false;
      // Filter by studyId if selected
      if (selectedStudy !== 'all') {
        const logStudyId = (log as any).studyId;
        if (!matchesStudy(logStudyId, selectedStudy)) return false;
      }
      // Date range filtering
      if (selectedDateRange !== 'all') {
        const logDate = log.timestamp?.toDate ? log.timestamp.toDate() : new Date(log.timestamp);
        
        if (selectedDateRange === 'custom') {
          if (customStartDate || customEndDate) {
            const startDate = customStartDate ? new Date(customStartDate) : null;
            const endDate = customEndDate ? new Date(customEndDate) : null;
            
            if (endDate) {
              endDate.setHours(23, 59, 59, 999);
            }
            
            if (startDate && logDate < startDate) return false;
            if (endDate && logDate > endDate) return false;
          }
        } else {
          const now = new Date();
          const daysAgo = parseInt(selectedDateRange);
          const cutoffDate = new Date(now.getTime() - (daysAgo * 24 * 60 * 60 * 1000));
          if (logDate < cutoffDate) return false;
        }
      }
      // Filter by checkbox: show only logs with QT Response ID
      if (showOnlyWithQtResponseId && !log.qualtricsResponseId) return false;
      
      if (qtResponseIdFilter) {
        if (!log.qualtricsResponseId) return false;
        if (!log.qualtricsResponseId.toLowerCase().includes(qtResponseIdFilter.toLowerCase())) return false;
      }
      if (searchTerm) {
        const searchLower = searchTerm.toLowerCase();
        if (!(
          (log.label && log.label.toLowerCase().includes(searchLower)) ||
          (typeof log.details === 'string' && log.details.toLowerCase().includes(searchLower)) ||
          (log.url && log.url.toLowerCase().includes(searchLower)) ||
          (log.qualtricsResponseId && log.qualtricsResponseId.toLowerCase().includes(searchLower))
        )) return false;
      }
      return true;
    });
    
    // Count actions in the filtered logs
    logsFilteredByOtherCriteria.forEach(log => {
      counts[log.action] = (counts[log.action] || 0) + 1;
    });
    
    return counts;
  }, [logs, selectedArticle, selectedStudy, selectedDateRange, customStartDate, customEndDate, showOnlyWithQtResponseId, qtResponseIdFilter, searchTerm, showArticleFilter]);

  // Memoize filtered articles
  const filteredArticles = useMemo(() => articles.filter(article => {
    // Filter by studyId if selected
    if (selectedStudy !== 'all') {
      const articleStudyId = (article as any).studyId;
      if (!matchesStudy(articleStudyId, selectedStudy)) return false;
    }
    
    // Apply tab-specific filters
    if (viewMode === 'articles') {
      if (articleTitleIdFilter) {
        const filter = articleTitleIdFilter.toLowerCase();
        return (
          article.title.toLowerCase().includes(filter) ||
          article.id.toLowerCase().includes(filter)
        );
      }
    } else {
      if (searchTerm) {
        const searchLower = searchTerm.toLowerCase();
        return (
          article.title.toLowerCase().includes(searchLower) ||
          article.content.toLowerCase().includes(searchLower) ||
          (article.author?.name || '').toLowerCase().includes(searchLower)
        );
      }
    }
    return true;
  }), [articles, selectedStudy, viewMode, articleTitleIdFilter, searchTerm]);

  function flattenComments(comments: any[], article: any, parentId: string | null = null, grandParentId?: string) {
    const flat: any[] = [];
    function recurse(comment: any, parentId: string | null, grandParentId?: string) {
      flat.push({
        ...comment,
        articleId: article.id,
        articleTitle: article.title,
        articleSlug: article.slug,
        authorName: article.author?.name || 'Anonymous',
        parentId,
        grandParentId,
        replyCount: Array.isArray(comment.replies) ? comment.replies.length : 0,
      });
      if (Array.isArray(comment.replies)) {
        comment.replies.forEach((reply: any) => recurse(reply, comment.id, parentId || undefined));
      }
    }
    comments.forEach(c => recurse(c, parentId, grandParentId));
    return flat;
  }

  // Memoize articles for comments and all comments calculation
  const articlesForComments = useMemo(() => 
    selectedStudy !== 'all' 
      ? articles.filter(article => {
          const articleStudyId = (article as any).studyId;
          return matchesStudy(articleStudyId, selectedStudy);
        })
      : articles,
    [articles, selectedStudy]
  );

  const allComments = useMemo(() => {
    // Always include user-submitted comments from the comments state (loaded from subcollections)
    // Group comments by article ID
    const commentsByArticle = comments.reduce((acc, comment) => {
      const articleId = comment.identifier || (comment as any).articleId;
      if (!acc[articleId]) {
        acc[articleId] = [];
      }
      acc[articleId].push(comment);
      return acc;
    }, {} as Record<string, LocalComment[]>);

    // Get user comments for all articles
    const userComments = articlesForComments.flatMap(article => {
      const articleComments = commentsByArticle[article.id] || [];
      return flattenComments(articleComments, article);
    });

    if (showDefaultComments) {
      // Show both default comments AND user-submitted comments
      const defaultComments = articlesForComments.flatMap(article =>
        flattenComments(
          Array.isArray(article.default_comments) && article.default_comments.length > 0
            ? article.default_comments
            : [],
          article
        )
      );
      return [...defaultComments, ...userComments];
    } else {
      // Show only user-submitted comments
      return userComments;
    }
  }, [articlesForComments, showDefaultComments, comments]);

  // Memoize filtered comments
  const filteredComments = useMemo(() => allComments.filter(comment => {
    const commentArticleId = comment.articleId || (comment as any).identifier;
    if (selectedArticle !== 'all' && commentArticleId !== selectedArticle) return false;
    // Filter by checkbox: show only comments with QT Response ID
    if (showOnlyWithQtResponseIdComments && !comment.qualtricsResponseId) return false;
    if (commentQtResponseIdFilter) {
      // If filtering by response ID, exclude comments without a response ID
      if (!comment.qualtricsResponseId) return false;
      // If response ID doesn't match the filter, exclude it
      if (!comment.qualtricsResponseId.toLowerCase().includes(commentQtResponseIdFilter.toLowerCase())) return false;
    }
    if (selectedCommentDateRange !== 'all') {
      let commentDate: Date;
      const rawDate = comment.createdAt;
      const isFirestoreTimestamp = (d: any): d is { toDate: () => Date } => d && typeof d.toDate === 'function';
      if (isFirestoreTimestamp(rawDate)) {
        commentDate = rawDate.toDate();
      } else if (typeof rawDate === 'string' || typeof rawDate === 'number') {
        commentDate = new Date(rawDate);
      } else {
        commentDate = new Date();
      }
      
      // Handle custom date range
      if (selectedCommentDateRange === 'custom') {
        if (commentCustomStartDate || commentCustomEndDate) {
          const startDate = commentCustomStartDate ? new Date(commentCustomStartDate) : null;
          const endDate = commentCustomEndDate ? new Date(commentCustomEndDate) : null;
          
          // Set end date to end of day if provided
          if (endDate) {
            endDate.setHours(23, 59, 59, 999);
          }
          
          if (startDate && commentDate < startDate) return false;
          if (endDate && commentDate > endDate) return false;
        }
      } else {
        // Handle preset ranges (1, 7, 30, 90 days)
        const now = new Date();
        const daysAgo = parseInt(selectedCommentDateRange);
        const cutoffDate = new Date(now.getTime() - (daysAgo * 24 * 60 * 60 * 1000));
        if (commentDate < cutoffDate) return false;
      }
    }
    if (searchTerm) {
      const searchLower = searchTerm.toLowerCase();
      return (
        comment.content.toLowerCase().includes(searchLower) ||
        comment.name.toLowerCase().includes(searchLower) ||
        comment.articleTitle.toLowerCase().includes(searchLower)
      );
    }
    return true;
  }), [allComments, selectedArticle, showOnlyWithQtResponseIdComments, commentQtResponseIdFilter, selectedCommentDateRange, commentCustomStartDate, commentCustomEndDate, searchTerm]);

  // Memoize sorted comments
  const sortedFilteredComments = useMemo(() => [...filteredComments].sort((a, b) => {
    if (commentSort === 'date-desc') {
      // Newest first
      const aDate = a.createdAt?.toDate ? a.createdAt.toDate() : new Date(a.createdAt);
      const bDate = b.createdAt?.toDate ? b.createdAt.toDate() : new Date(b.createdAt);
      return bDate - aDate;
    } else if (commentSort === 'date-asc') {
      // Oldest first
      const aDate = a.createdAt?.toDate ? a.createdAt.toDate() : new Date(a.createdAt);
      const bDate = b.createdAt?.toDate ? b.createdAt.toDate() : new Date(b.createdAt);
      return aDate - bDate;
    } else if (commentSort === 'upvotes-desc') {
      return (b.upvotes || 0) - (a.upvotes || 0);
    } else if (commentSort === 'upvotes-asc') {
      return (a.upvotes || 0) - (b.upvotes || 0);
    } else if (commentSort === 'downvotes-desc') {
      return (b.downvotes || 0) - (a.downvotes || 0);
    } else if (commentSort === 'downvotes-asc') {
      return (a.downvotes || 0) - (b.downvotes || 0);
    }
    return 0;
  }), [filteredComments, commentSort]);

  // Memoize normalized articles
  const normalizedFilteredArticles = useMemo(() => filteredArticles.map(article => {
    const { content, createdAt, ...rest } = article;
    const { id, title, ...otherFields } = rest;
    return {
      id,
      title,
      ...otherFields,
      comments: Array.isArray(article.comments) ? article.comments.length : 0,
      default_comments: Array.isArray(article.default_comments) ? article.default_comments.length : 0
    };
  }), [filteredArticles]);

  const handleTabChange = (tabId: string) => {
    setViewMode(tabId as any);
    setSearchTerm('');
  };

  function highlightMatch(text: string, query: string) {
    if (!query) return text;
    const regex = new RegExp(`(${query.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')})`, 'gi');
    const parts = text.split(regex);
    return parts.map((part, i) =>
      regex.test(part) ? <mark key={i} className="bg-yellow-200 px-0.5 rounded">{part}</mark> : part
    );
  }

  if (!userEmail) {
    return <ResearchDashboardLogin onLogin={() => {
      // Auth state change will be handled by useEffect
      const user = getCurrentUser();
      if (user && user.email) {
        setUserEmail(user.email);
        loadData();
        loadStudiesData();
      }
    }} />;
  }

  if (loading) {
    return (
      <div className="min-h-screen p-8 bg-gray-50">
        <div className="mx-auto max-w-7xl">
          <div className="text-center">
            <div className="w-12 h-12 mx-auto border-b-2 border-blue-600 rounded-full animate-spin"></div>
            <p className="mt-4 text-gray-600">Loading research data...</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen p-8 bg-gray-50">
      <div className={`mx-auto ${isFullWidth ? '' : 'max-w-7xl'}`}>
        <PageHeader 
          title="Research Data Dashboard" 
          subtitle="Interactive dashboard for researchers to explore user activity, articles, comments, and export data for analysis." 
        />

        {/* Navigation Tabs */}
        <div className="mb-8 bg-white rounded-lg shadow">
          <div className="border-b border-gray-200">
            {/* Desktop Navigation */}
            <div className="hidden md:block overflow-x-auto">
              <nav className="flex px-6 -mb-px space-x-8 items-center min-w-max">
                {[
                  { id: 'logs', label: 'User Activity', count: filteredLogs.length },
                  { id: 'articles', label: 'Articles', count: filteredArticles.length },
                  { id: 'comments', label: 'Comments', count: filteredComments.length }
                ].map((tab) => (
                  <button
                    key={tab.id}
                    onClick={() => handleTabChange(tab.id)}
                    className={`py-4 px-1 border-b-2 font-medium text-sm whitespace-nowrap flex-shrink-0 ${
                      viewMode === tab.id
                        ? 'border-blue-500 text-blue-600'
                        : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                    }`}
                  >
                    {tab.label}
                    {tab.count !== null && (
                      <span className="ml-2 bg-gray-100 text-gray-900 py-0.5 px-2.5 rounded-full text-xs">
                        {tab.count}
                      </span>
                    )}
                  </button>
                ))}
                <div className="ml-auto flex-shrink-0">
                  <button
                    onClick={() => setIsFullWidth(!isFullWidth)}
                    className={`py-2 px-3 text-sm font-medium rounded-md whitespace-nowrap ${
                      isFullWidth
                        ? 'bg-blue-100 text-blue-700 border border-blue-300'
                        : 'bg-gray-100 text-gray-700 border border-gray-300 hover:bg-gray-200'
                    }`}
                    title={isFullWidth ? 'Switch to constrained width' : 'Switch to full width'}
                  >
                    {isFullWidth ? '↔ Constrained' : '↔ Full Width'}
                  </button>
                </div>
              </nav>
            </div>

            {/* Mobile Navigation */}
            <div className="md:hidden relative">
              <div className="flex items-center justify-between px-6 py-4">
                {/* Active tab title */}
                <span className="text-sm font-medium text-gray-900">
                  {(() => {
                    const tabs = [
                      { id: 'logs', label: 'User Activity' },
                      { id: 'articles', label: 'Articles' },
                      { id: 'comments', label: 'Comments' }
                    ];
                    const activeTab = tabs.find(t => t.id === viewMode);
                    return activeTab?.label || 'User Activity';
                  })()}
                </span>

                {/* Hamburger button */}
                <button
                  onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
                  className="inline-flex items-center justify-center p-2 rounded-md text-gray-600 hover:text-gray-900 hover:bg-gray-100 focus:outline-none focus:ring-2 focus:ring-inset focus:ring-blue-500"
                  aria-expanded="false"
                >
                  <span className="sr-only">Open menu</span>
                  {!isMobileMenuOpen ? (
                    <svg className="block h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
                    </svg>
                  ) : (
                    <svg className="block h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                    </svg>
                  )}
                </button>
              </div>

              {/* Mobile dropdown menu */}
              {isMobileMenuOpen && (
                <div className="absolute right-0 top-full w-64 bg-white rounded-md shadow-lg border border-gray-200 py-1 z-50">
                  {[
                    { id: 'logs', label: 'User Activity', count: filteredLogs.length },
                    { id: 'articles', label: 'Articles', count: filteredArticles.length },
                    { id: 'comments', label: 'Comments', count: filteredComments.length }
                  ].map((tab) => (
                    <button
                      key={tab.id}
                      onClick={() => {
                        handleTabChange(tab.id);
                        setIsMobileMenuOpen(false);
                      }}
                      className={`w-full text-left px-4 py-2 text-sm font-medium transition-colors flex items-center justify-between ${
                        viewMode === tab.id
                          ? 'bg-blue-100 text-blue-700'
                          : 'text-gray-600 hover:bg-gray-100 hover:text-gray-900'
                      }`}
                    >
                      <span>{tab.label}</span>
                      {tab.count !== null && (
                        <span className="ml-2 bg-gray-100 text-gray-900 py-0.5 px-2.5 rounded-full text-xs">
                          {tab.count}
                        </span>
                      )}
                    </button>
                  ))}
                  <div className="border-t border-gray-200 mt-1 pt-1">
                    <button
                      onClick={() => {
                        setIsFullWidth(!isFullWidth);
                        setIsMobileMenuOpen(false);
                      }}
                      className={`w-full text-left px-4 py-2 text-sm font-medium transition-colors ${
                        isFullWidth
                          ? 'bg-blue-100 text-blue-700'
                          : 'text-gray-600 hover:bg-gray-100 hover:text-gray-900'
                      }`}
                    >
                      {isFullWidth ? '↔ Constrained Width' : '↔ Full Width'}
                    </button>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Content Based on View Mode */}
        {viewMode === 'logs' && (
          <>
            {/* Search and Filters */}
            <FilterSection
              studies={studies}
              selectedStudy={selectedStudy}
              onStudyChange={setSelectedStudy}
              dateRange={selectedDateRange}
              onDateRangeChange={setSelectedDateRange}
              customStartDate={customStartDate}
              customEndDate={customEndDate}
              onCustomStartDateChange={setCustomStartDate}
              onCustomEndDateChange={setCustomEndDate}
              qtResponseId={qtResponseIdFilter}
              onQtResponseIdChange={setQtResponseIdFilter}
              showOnlyWithQtResponseId={showOnlyWithQtResponseId}
              onShowOnlyWithQtResponseIdChange={setShowOnlyWithQtResponseId}
              selectedArticle={selectedArticle}
              onArticleChange={setSelectedArticle}
              articleOptions={filteredArticles.map(article => ({
                value: article.id,
                label: article.title
              }))}
              showArticleFilter={showArticleFilter}
              onShowArticleFilterChange={setShowArticleFilter}
              selectedActions={selectedActions}
              onSelectedActionsChange={setSelectedActions}
              availableActions={stats?.actionsByType}
              actionCounts={filteredActionCounts}
              onClearFilters={() => {
                setSelectedDateRange('7');
                setCustomStartDate('');
                setCustomEndDate('');
                setSelectedActions([]);
                setSelectedArticle('all');
                setQtResponseIdFilter('');
                setShowOnlyWithQtResponseId(false);
                setShowArticleFilter(false);
              }}
              className="search-and-filters-section"
            />
            <div className="bg-white rounded-lg shadow">
              <div className="flex flex-wrap md:flex-nowrap items-center justify-between p-6 border-b border-gray-200">
                <div className='grow-0 md:grow'>
                  <h2 className="text-xl font-semibold">User Activity Logs</h2>
                  <p className="text-gray-600">Showing {filteredLogs.length} of {logs.length} entries</p>
                </div>
                <button
                  type="button"
                  onClick={() => refreshLogsOnly()}
                  disabled={loading || refreshingLogs}
                  title="Refresh data from Firestore"
                  className="p-2 text-gray-600 hover:text-gray-900 hover:bg-gray-100 rounded-md disabled:opacity-50 disabled:cursor-not-allowed"
                  aria-label="Refresh data from Firestore"
                >
                  <BiRefresh className={`w-5 h-5 ${refreshingLogs ? 'animate-spin' : ''}`} />
                </button>
                <button
                  onClick={() => {
                    // Calculate date range from filtered logs
                    const validDates = extractValidDates(filteredLogs);
                    let dateRangeStr = '';
                    if (validDates.length > 0) {
                      const earliest = new Date(Math.min(...validDates.map(d => d.getTime())));
                      const latest = new Date(Math.max(...validDates.map(d => d.getTime())));
                      const formatDate = (date: Date) => date.toISOString().split('T')[0];
                      dateRangeStr = `${formatDate(earliest)}-to-${formatDate(latest)}`;
                    } else {
                      // Fallback to current date if no valid dates
                      dateRangeStr = new Date().toISOString().split('T')[0];
                    }
                    
                    const studyPrefix = selectedStudy !== 'all' ? `${selectedStudy}-` : '';
                    exportToCSV(
                      prepareLogExportRows(filteredLogs),
                      `${studyPrefix}filtered_logs_${dateRangeStr}.csv`
                    );
                  }}
                  className="px-4 py-2 text-white bg-blue-600 rounded-md hover:bg-blue-700 md:ml-2"
                >
                  Export Filtered Data
                </button>
              </div>
              <div className="overflow-x-auto">
                <table className="user-activity-table min-w-full divide-y divide-gray-200">
                  <thead className="bg-gray-50">
                    <tr>
                      <th className="px-6 py-3 text-xs font-medium tracking-wider text-left text-gray-500 uppercase">Time</th>
                      {/* <th className="px-6 py-3 text-xs font-medium tracking-wider text-left text-gray-500 uppercase">User</th> */}
                      <th className="px-6 py-3 text-xs font-medium tracking-wider text-left text-gray-500 uppercase">QT Response ID</th>
                      <th className="px-6 py-3 text-xs font-medium tracking-wider text-left text-gray-500 uppercase">Action</th>
                      <th className="px-6 py-3 text-xs font-medium tracking-wider text-left text-gray-500 uppercase">Details</th>
                      <th className="px-6 py-3 text-xs font-medium tracking-wider text-left text-gray-500 uppercase">Article</th>
                      <th className="px-6 py-3 text-xs font-medium tracking-wider text-left text-gray-500 uppercase">URL</th>
                      <th className="px-6 py-3 text-xs font-medium tracking-wider text-left text-gray-500 uppercase">Study</th>
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-gray-200">
                    {filteredLogs.slice(0, 100).map((log) => (
                      <tr key={log.id} className="hover:bg-gray-50">
                        <td className="time-column px-6 py-4 text-sm text-gray-900 whitespace-nowrap">
                          {log.timestamp?.toDate ? 
                            log.timestamp.toDate().toLocaleString() : 
                            new Date(log.timestamp).toLocaleString()
                          }
                        </td>
                        {/* <td className="user-column px-6 py-4 text-sm text-gray-900 whitespace-nowrap">
                          {log.userId}
                        </td> */}
                        <td className="qt-response-id-column px-6 py-4 text-sm text-gray-500 whitespace-nowrap">
                          {log.qualtricsResponseId || '-'}
                        </td>
                        <td className="action-column px-6 py-4 text-sm text-gray-900 whitespace-nowrap">
                          <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
                            {log.action}
                          </span>
                        </td>
                        <td className="details-column max-w-xs px-6 py-4 text-sm text-gray-900 truncate">
                          {log.details && (
                            <div
                              className="mt-1 text-xs text-gray-500"
                              title={log.details}
                            >
                              {`${log.details.substring(0, 50)}`}
                            </div>
                          )}
                        </td>
                        <td className="article-column px-6 py-4 text-sm text-gray-500 whitespace-nowrap">
                          {(() => {
                            // Prioritize articleTitle from log, then try to find article by identifier
                            if (log.articleTitle) {
                              return log.articleTitle;
                            }
                            // Try to find article by identifier
                            const matchedArticle = articles.find(a => a.id === log.identifier);
                            if (matchedArticle) {
                              return matchedArticle.title;
                            }
                            // Fallback to identifier if no article found
                            return log.identifier || '-';
                          })()}
                        </td>
                        <td className="url-column px-6 py-4 text-sm text-gray-500 break-all max-w-xs">
                          <a 
                            href={log.url} 
                            target="_blank" 
                            rel="noopener noreferrer"
                            className="text-blue-600 hover:text-blue-800 underline truncate block"
                            title={log.url}
                          >
                            {log.url}
                          </a>
                        </td>
                        <td className="study-column px-6 py-4 text-sm text-gray-500 whitespace-nowrap">
                          {(() => {
                            const logStudyId = (log as any).studyId;
                            return logStudyId ? getStudyName(logStudyId) : '-';
                          })()}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </>
        )}

        {viewMode === 'articles' && (
          <>
            <div className="article-filters-section p-6 mb-8 bg-white rounded-lg shadow">
              <div className="mb-4">
                <StudyDropdown
                  value={selectedStudy}
                  onChange={setSelectedStudy}
                  studies={studies}
                  label="Filter by Study"
                  className="w-full px-3 py-2 border border-gray-300 rounded-md"
                />
              </div>
              <div className="flex flex-col justify-center gap-4 md:flex-row md:items-end">
                <div className="flex-1 min-w-[220px]">
                  <TextInput
                    id="article-title-id-filter"
                    value={articleTitleIdFilter}
                    onChange={setArticleTitleIdFilter}
                    placeholder="Filter by Title or Article ID"
                    label="Filter by Title or Article ID"
                  />
                </div>
                <button
                  onClick={() => setArticleTitleIdFilter('')}
                  className="px-4 py-2 mt-6 text-white bg-gray-500 rounded-md hover:bg-gray-600 md:mt-0"
                >
                  Clear Filters
                </button>
              </div>
            </div>
            <div className="bg-white rounded-lg shadow">
              <div className="flex items-center justify-between p-6 border-b border-gray-200">
                <div>
                  <h2 className="text-xl font-semibold">Articles</h2>
                  <p className="text-gray-600">Showing {normalizedFilteredArticles.length} of {articles.length} articles</p>
                </div>
                <button
                  onClick={() => {
                    const dateStr = new Date().toISOString().split('T')[0];
                    const studyPrefix = selectedStudy !== 'all' ? `${selectedStudy}-` : '';
                    exportToCSV(
                      filteredArticles.map(a => ({ ...a, studyId: (a as any).studyId || 'N/A' })),
                      `${studyPrefix}articles_${dateStr}.csv`
                    );
                  }}
                  className="px-4 py-2 text-white bg-green-600 rounded-md hover:bg-green-700"
                >
                  Export Articles
                </button>
              </div>
              <div className="p-6 space-y-6">
                {normalizedFilteredArticles.map((article, idx) => {
                  const originalArticle = filteredArticles.find(a => a.id === article.id);
                  return (
                    <div key={article.id} className="p-4 border border-gray-200 rounded-lg">
                      <div className="flex items-start justify-between mb-2">
                        <h3 className="text-lg font-semibold text-gray-900">
                          <a
                            href={`/articles/${article.slug}`}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="text-blue-600 hover:underline"
                          >
                            {highlightMatch(article.title, articleTitleIdFilter)}
                          </a>
                        </h3>
                        <span className="text-sm text-gray-500">
                          ID: {highlightMatch(article.id, articleTitleIdFilter)}
                        </span>
                      </div>
                      <div className="mb-2 text-sm text-gray-600">
                        <span className="font-medium">Author:</span> {((article as any).metadata?.author?.name) || article.author?.name || 'Anonymous'}
                      </div>
                      <div className="mb-2 text-sm text-gray-600">
                        <span className="font-medium">Comments:</span> {article.comments} comments
                      </div>
                      <div className="mb-2 text-sm text-gray-600">
                        <span className="font-medium">Default Comments:</span> {article.default_comments} default comments
                      </div>
                      <div className="text-sm text-gray-700 line-clamp-3" dangerouslySetInnerHTML={{__html: `${DOMPurify.sanitize(originalArticle?.content?.substring(0, 80).trimEnd() || '')}...`}} />
                    </div>
                  );
                })}
              </div>
            </div>
          </>
        )}

        {viewMode === 'comments' && (
          <>
            {/* Search and Filters for Comments */}
            <FilterSection
              studies={studies}
              selectedStudy={selectedStudy}
              onStudyChange={setSelectedStudy}
              dateRange={selectedCommentDateRange}
              onDateRangeChange={setSelectedCommentDateRange}
              customStartDate={commentCustomStartDate}
              customEndDate={commentCustomEndDate}
              onCustomStartDateChange={setCommentCustomStartDate}
              onCustomEndDateChange={setCommentCustomEndDate}
              qtResponseId={commentQtResponseIdFilter}
              onQtResponseIdChange={setCommentQtResponseIdFilter}
              showOnlyWithQtResponseId={showOnlyWithQtResponseIdComments}
              onShowOnlyWithQtResponseIdChange={setShowOnlyWithQtResponseIdComments}
              selectedArticle={selectedArticle}
              onArticleChange={setSelectedArticle}
              articleOptions={filteredArticles.map(article => ({
                value: article.id,
                label: article.title
              }))}
              searchTerm={searchTerm}
              onSearchTermChange={setSearchTerm}
              searchPlaceholder="Search comments..."
              sortValue={commentSort}
              onSortChange={setCommentSort}
              sortOptions={[
                { value: 'date-desc', label: 'Sort By: Date Created (Newest First)' },
                { value: 'date-asc', label: 'Sort By: Date Created (Oldest First)' },
                { value: 'upvotes-desc', label: 'Sort By: Upvotes (Most First)' },
                { value: 'upvotes-asc', label: 'Sort By: Upvotes (Least First)' },
                { value: 'downvotes-desc', label: 'Sort By: Downvotes (Most First)' },
                { value: 'downvotes-asc', label: 'Sort By: Downvotes (Least First)' }
              ]}
              showDefaultComments={showDefaultComments}
              onShowDefaultCommentsChange={setShowDefaultComments}
              onClearFilters={() => {
                setSelectedStudy('all');
                setSelectedArticle('all');
                setCommentQtResponseIdFilter('');
                setShowOnlyWithQtResponseIdComments(false);
                setSelectedCommentDateRange('all');
                setCommentCustomStartDate('');
                setCommentCustomEndDate('');
                setSearchTerm('');
                setArticleTitleIdFilter('');
              }}
              className="comments-filters-section"
            />
            <div className="bg-white rounded-lg shadow">
              <div className="flex items-center justify-between p-6 border-b border-gray-200">
                <div>
                  <h2 className="text-xl font-semibold">Comments</h2>
                  <p className="text-gray-600">
                    Showing {filteredComments.length} comment{filteredComments.length !== 1 ? 's' : ''}
                    {selectedStudy !== 'all' && <span className="text-gray-500"> (filtered by study)</span>}
                  </p>
                </div>
                <div className="flex gap-2">
                  <button
                    onClick={() => exportToCSV(filteredComments, `filtered_comments_${new Date().toISOString().split('T')[0]}.csv`)}
                    className="px-4 py-2 text-white bg-purple-600 rounded-md hover:bg-purple-700"
                  >
                    Export Filtered Data
                  </button>
                </div>
              </div>
              <div className="flex flex-wrap justify-center gap-4 p-6">
                {sortedFilteredComments.slice(0, numShownComments).map((comment, index) => {
                  return (
                    <div
                      key={index}
                      className="relative flex-shrink p-4 transition-shadow duration-150 bg-white border border-gray-200 rounded-lg cursor-pointer grow w-3xl hover:shadow-lg focus-within:shadow-lg"
                      style={{ margin: '0 0.5rem 0.5rem 0' }}
                      onMouseEnter={e => {
                        tooltipTimeout = setTimeout(() => {
                          setShowTooltip(true);
                          setTooltipComment(comment);
                          setTooltipPos({ x: e.clientX, y: e.clientY });
                        }, 350);
                      }}
                      onMouseLeave={() => {
                        clearTimeout(tooltipTimeout);
                        setShowTooltip(false);
                        setTooltipComment(null);
                      }}
                    >
                      <div className="flex items-start justify-between mb-2">
                        <div className="text-[20px] text-gray-600">
                          <span className="font-medium">Article:</span> {typeof comment.articleTitle === 'string' ? comment.articleTitle : JSON.stringify(comment.articleTitle) || 'N/A'}
                        </div>
                        <div className="flex items-center gap-2">
                          {/* Tag for Comment or Reply */}
                          {comment.parentId ? (
                            <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-purple-100 text-purple-800 border border-purple-200">Reply</span>
                          ) : (
                            <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800 border border-blue-200">Comment</span>
                          )}
                          <span className="text-[20px] text-gray-500">
                            {comment.upvotes || 0} ↑ {comment.downvotes || 0} ↓
                          </span>
                        </div>
                      </div>
                      <div className="mb-2 text-[20px] text-gray-600">
                        <span className="font-medium">By:</span> {typeof comment.name === 'string' ? comment.name : JSON.stringify(comment.name) || 'Anonymous'}
                      </div>
                      <div className="text-gray-900 break-all text-[18px]" dangerouslySetInnerHTML={{__html: DOMPurify.sanitize(typeof comment.content === 'string' ? comment.content : JSON.stringify(comment.content) || 'No content')}}>
                        
                      </div>
                    </div>
                  );
                })}
                {/* Single tooltip for all comments */}
                {showTooltip && tooltipComment && (
                  <div
                    className="z-50 fixed flex flex-col bg-white border border-gray-300 rounded shadow-lg p-3 text-xs text-gray-800 whitespace-pre-line min-w-[220px] max-w-xs"
                    style={{ left: tooltipPos.x + 8, top: tooltipPos.y + 16, pointerEvents: 'none' }}
                    role="tooltip"
                  >
                    <div className="mb-1 font-semibold underline">Details - <span className="font-mono text-gray-700">{tooltipComment.id}</span></div>
                    <div><span className='font-semibold'>Author: </span>{`${typeof tooltipComment.name === 'string' ? tooltipComment.name : JSON.stringify(tooltipComment.name) || 'Anonymous'}`}</div>
                    <div><span className='font-semibold'>Parent ID: </span>{`${tooltipComment.parentId || 'None'}`}</div>
                    <div><span className='font-semibold'>Posted: </span>{(() => {
                      const rawDate = tooltipComment.createdAt;
                      if (rawDate) {
                        if (typeof rawDate === 'object' && typeof rawDate.toDate === 'function') {
                          return rawDate.toDate().toLocaleString();
                        } else if (typeof rawDate === 'string' || typeof rawDate === 'number') {
                          const d = new Date(rawDate);
                          if (!isNaN(d.getTime())) return d.toLocaleString();
                        }
                      }
                      return 'Unknown';
                    })()}</div>
                    <div className="break-words"><span className='font-semibold'>Content: </span>{`${typeof tooltipComment.content === 'string' ? tooltipComment.content : JSON.stringify(tooltipComment.content) || 'No content'}`}</div>
                  </div>
                )}
              </div>
              {filteredComments.length > numShownComments && (
                <div className="flex justify-center pb-8">
                  <button
                    onClick={() => setNumShownComments(n => Math.min(n + 50, filteredComments.length))}
                    className="px-6 py-2 text-white bg-blue-600 rounded-md shadow hover:bg-blue-700"
                  >
                    Show More
                  </button>

                </div>
              )}
            </div>
          </>
        )}
      </div>
    </div>
  );
}