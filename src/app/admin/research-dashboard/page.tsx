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
import { signOut, getCurrentUser, onAuthChange } from '@/lib/auth';
import { User } from 'firebase/auth';
import { db } from '@/lib/firebase';
import { loadStudies, StudyDefinition, getStudyAliases, getStudyName } from '@/lib/studies';
import DOMPurify from 'dompurify';
import { collection, getDocs, orderBy, query, Timestamp, where } from 'firebase/firestore';
import { useEffect, useState } from 'react';

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
 */
function matchesStudy(studyId: string | undefined, selectedStudy: string): boolean {
  if (selectedStudy === 'all') return true;
  if (!studyId) return false;
  const aliases = getStudyAliases(selectedStudy);
  return aliases.includes(studyId);
}

export default function ResearchDashboard() {
  const [userEmail, setUserEmail] = useState('');
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [logs, setLogs] = useState<LogEntry[]>([]);
  const [articles, setArticles] = useState<Article[]>([]);
  const [comments, setComments] = useState<LocalComment[]>([]);
  const [loading, setLoading] = useState(true);
  const [studies, setStudies] = useState<StudyDefinition[]>([]);
  const [selectedDateRange, setSelectedDateRange] = useState('all');
  const [selectedAction, setSelectedAction] = useState('all');
  const [selectedArticle, setSelectedArticle] = useState('all');
  const [selectedStudy, setSelectedStudy] = useState<string>('all'); // Filter by study ID
  const [viewMode, setViewMode] = useState<'overview' | 'logs' | 'articles' | 'comments'>('overview');
  const [searchTerm, setSearchTerm] = useState('');

  // Add a new state for user and date filter in comments
  const [selectedUser, setSelectedUser] = useState('');
  const [selectedCommentDateRange, setSelectedCommentDateRange] = useState('all');

  // Add a new state for article title/id filter in comments
  const [articleTitleIdFilter, setArticleTitleIdFilter] = useState('');

  // Add a new state for user input filter in logs
  const [logUserFilter, setLogUserFilter] = useState('');

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
      const logsRef = collection(db, 'logs');
      const logsQuery = query(logsRef, orderBy('timestamp', 'desc'));
      const logsSnapshot = await getDocs(logsQuery);
      const logsData = logsSnapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      })) as LogEntry[];

      const articlesRef = collection(db, 'articles');
      const articlesQuery = query(articlesRef, orderBy('createdAt', 'desc'));
      const articlesSnapshot = await getDocs(articlesQuery);

      async function fetchRepliesRecursively(articleId: string, parentPath: string[], parentId?: string, grandParentId?: string): Promise<LocalComment[]> {
        const repliesRef = collection(db, ...((parentPath as unknown) as [string, ...string[]]));
        const repliesSnapshot = await getDocs(repliesRef);
        return Promise.all(repliesSnapshot.docs.map(async replyDoc => {
          const replyData = replyDoc.data();
          const reply: LocalComment = {
            id: replyDoc.id,
            content: replyData.content || '',
            name: replyData.name || 'Anonymous',
            createdAt: replyData.createdAt,
            parentId: parentId,
            upvotes: replyData.upvotes,
            downvotes: replyData.downvotes,
            identifier: articleId,
            ...replyData
          };
          // Recursively fetch all nested replies
          const subReplies = await fetchRepliesRecursively(
            articleId,
            [...parentPath, replyDoc.id, 'replies'],
            replyDoc.id,
            parentId
          );
          return { ...reply, replies: subReplies };
        }));
      }

      const articlesData = await Promise.all(
        articlesSnapshot.docs.map(async doc => {
          const articleData = doc.data();
          const comments = await fetchRepliesRecursively(doc.id, ['articles', doc.id, 'comments']);
          console.log(comments);
          return {
            ...(articleData as Article),
            id: doc.id,
            comments
          };
        })
      );

      // Load comments from each article's subcollection
      const allUserComments: LocalComment[] = [];
      for (const article of articlesData) {
        try {
          const commentsRef = collection(db, 'articles', article.id, 'comments');
          const commentsQuery = query(commentsRef, orderBy('createdAt', 'desc'));
          const commentsSnapshot = await getDocs(commentsQuery);
          const articleComments = commentsSnapshot.docs.map(doc => ({
            id: doc.id,
            ...doc.data(),
            identifier: article.id // Add the article ID for reference
          })) as LocalComment[];
          allUserComments.push(...articleComments);
        } catch (error) {
          console.log(`No comments collection for article ${article.id} or error loading:`, error);
        }
      }

      console.log('Loaded user comments:', allUserComments.length, allUserComments);
      console.log('Loaded articles:', articlesData.length);
      console.log('Default comments count:', articlesData.reduce((sum, article) => 
        sum + (Array.isArray(article.default_comments) ? article.default_comments.length : 0), 0
      ));

      setLogs(logsData);
      setArticles(articlesData);
      setComments(allUserComments);

      const uniqueUsers = new Set(logsData.map(log => log.userId)).size;
      const actionsByType: Record<string, number> = {};
      logsData.forEach(log => {
        actionsByType[log.action] = (actionsByType[log.action] || 0) + 1;
      });

      const timestamps = logsData.map(log => log.timestamp).filter(Boolean);
      const dateRange = {
        earliest: timestamps.length > 0 ? new Date(Math.min(...timestamps.map(t => t.toDate ? t.toDate() : new Date(t)))).toISOString() : '',
        latest: timestamps.length > 0 ? new Date(Math.max(...timestamps.map(t => t.toDate ? t.toDate() : new Date(t)))).toISOString() : ''
      };

      const articlesWithComments = articlesData.filter(article => 
        Array.isArray(article.default_comments) && article.default_comments.length > 0
      ).length;

      const totalWordCount = articlesData.reduce((sum, article) => 
        sum + (article.content ? article.content.split(/\s+/).length : 0), 0
      );

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
        averageWordCount: Math.round(totalWordCount / articlesData.length) || 0
      });

    } catch (error) {
      console.error('Error loading data:', error);
    } finally {
      setLoading(false);
    }
  };

  const exportToCSV = (data: any[], filename: string) => {
    if (!data.length) return;
    const headers = Object.keys(data[0] || {});
    const csvContent = [
      headers.join(','),
      ...data.map(row => 
        headers.map(header => {
          let value = row[header];
          if ((header === 'timestamp' || header === 'createdAt') && value) {
            if (typeof value === 'object' && typeof value.toDate === 'function') {
              value = value.toDate().toISOString();
            } else if (typeof value === 'string' || typeof value === 'number') {
              const d = new Date(value);
              if (!isNaN(d.getTime())) value = d.toISOString();
            }
          }
          // For objects, convert to JSON string if they exist
          else if (typeof value === 'object' && value !== null && header !== 'timestamp' && header !== 'createdAt') {
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
          // keep id first
          id: row.id ?? '',
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
        };
      });
    };

  const filteredLogs = logs.filter(log => {
    if (selectedAction !== 'all' && log.action !== selectedAction) return false;
    if (selectedArticle !== 'all' && log.identifier !== selectedArticle) return false;
    // Filter by studyId if selected
    if (selectedStudy !== 'all') {
      const logStudyId = (log as any).studyId;
      if (!matchesStudy(logStudyId, selectedStudy)) return false;
    }
    if (selectedDateRange !== 'all') {
      const logDate = log.timestamp?.toDate ? log.timestamp.toDate() : new Date(log.timestamp);
      const now = new Date();
      const daysAgo = parseInt(selectedDateRange);
      const cutoffDate = new Date(now.getTime() - (daysAgo * 24 * 60 * 60 * 1000));
      if (logDate < cutoffDate) return false;
    }
    if (logUserFilter && log.userId && !log.userId.toLowerCase().includes(logUserFilter.toLowerCase())) return false;
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
  });

  // Filter articles by studyId and other filters
  const filteredArticles = articles.filter(article => {
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
  });

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

  // Filter articles by study first, then get comments from those articles
  const articlesForComments = selectedStudy !== 'all' 
    ? articles.filter(article => {
        const articleStudyId = (article as any).studyId;
        return matchesStudy(articleStudyId, selectedStudy);
      })
    : articles;

  const allComments = articlesForComments.flatMap(article =>
    flattenComments(
      showDefaultComments && Array.isArray(article.default_comments) && article.default_comments.length > 0
        ? article.default_comments
        : (article.comments || []),
      article
    )
  );

  const filteredComments = allComments.filter(comment => {
    if (selectedArticle !== 'all' && comment.articleId !== selectedArticle) return false;
    if (selectedUser !== 'all' && selectedUser.trim() !== '' && !comment.name.toLowerCase().includes(selectedUser.toLowerCase())) return false;
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
      const now = new Date();
      const daysAgo = parseInt(selectedCommentDateRange);
      const cutoffDate = new Date(now.getTime() - (daysAgo * 24 * 60 * 60 * 1000));
      if (commentDate < cutoffDate) return false;
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
  });

  // Sort filteredComments based on commentSort
  const sortedFilteredComments = [...filteredComments].sort((a, b) => {
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
  });

  const normalizedFilteredArticles = filteredArticles.map(article => {
    const { content, createdAt, ...rest } = article;
    const { id, title, ...otherFields } = rest;
    return {
      id,
      title,
      ...otherFields,
      comments: Array.isArray(article.comments) ? article.comments.length : 0,
      default_comments: Array.isArray(article.default_comments) ? article.default_comments.length : 0
    };
  });

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
      <div className="mx-auto max-w-7xl">
        <PageHeader 
          title="Research Data Dashboard" 
          subtitle="Interactive dashboard for researchers to explore user activity, articles, comments, and export data for analysis." 
        />

        {/* Navigation Tabs */}
        <div className="mb-8 bg-white rounded-lg shadow">
          <div className="border-b border-gray-200">
            <nav className="flex px-6 -mb-px space-x-8">
              {[
                { id: 'overview', label: 'Overview', count: null },
                { id: 'logs', label: 'User Activity', count: filteredLogs.length },
                { id: 'articles', label: 'Articles', count: filteredArticles.length },
                { id: 'comments', label: 'Comments', count: filteredComments.length }
              ].map((tab) => (
                <button
                  key={tab.id}
                  onClick={() => handleTabChange(tab.id)}
                  className={`py-4 px-1 border-b-2 font-medium text-sm ${
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
            </nav>
          </div>
        </div>

        {/* Content Based on View Mode */}
        {viewMode === 'overview' && (
          <>
            {/* Study Filter */}
            <div className="p-4 mb-6 bg-white rounded-lg shadow">
              <StudyDropdown
                value={selectedStudy}
                onChange={setSelectedStudy}
                studies={studies}
                label="Filter by Study"
                className="w-full max-w-xs px-3 py-2 border border-gray-300 rounded-md"
              />
              {selectedStudy !== 'all' && (
                <p className="mt-2 text-sm text-gray-500">
                  Showing data for: <span className="font-semibold">
                    {getStudyName(selectedStudy)}
                  </span>
                </p>
              )}
            </div>

            {/* Stats Overview */}
            {stats && (
              <div className="grid grid-cols-1 gap-6 mb-8 md:grid-cols-2 lg:grid-cols-4">
                <div className="p-6 bg-white rounded-lg shadow">
                  <h3 className="text-sm font-medium text-gray-500">Total User Actions</h3>
                  <p className="text-3xl font-bold text-gray-900">{filteredLogs.length.toLocaleString()}</p>
                  <p className="mt-1 text-sm text-gray-600">
                    {new Set(filteredLogs.map(log => log.userId)).size} unique users
                    {selectedStudy !== 'all' && <span className="text-gray-500"> (filtered)</span>}
                  </p>
                </div>
                <div className="p-6 bg-white rounded-lg shadow">
                  <h3 className="text-sm font-medium text-gray-500">Articles</h3>
                  <p className="text-3xl font-bold text-gray-900">{filteredArticles.length}</p>
                  <p className="mt-1 text-sm text-gray-600">
                    Avg {filteredArticles.length > 0 ? Math.round(filteredArticles.reduce((sum, a) => sum + (a.content ? a.content.split(/\s+/).length : 0), 0) / filteredArticles.length) : 0} words
                    {selectedStudy !== 'all' && <span className="text-gray-500"> (filtered)</span>}
                  </p>
                </div>
                <div className="p-6 bg-white rounded-lg shadow">
                  <h3 className="text-sm font-medium text-gray-500">Comments</h3>
                  <p className="text-3xl font-bold text-gray-900">
                    {/* Default comments from filtered articles + user comments (already filtered by study) */}
                    {filteredArticles.reduce((sum, article) => 
                      sum + (Array.isArray(article.default_comments) ? article.default_comments.length : 0), 0
                    ) + allComments.length}
                  </p>
                  <p className="mt-1 text-sm text-gray-600">
                    {filteredArticles.filter(article => 
                      Array.isArray(article.default_comments) && article.default_comments.length > 0
                    ).length} articles have comments
                    {selectedStudy !== 'all' && <span className="text-gray-500"> (filtered)</span>}
                  </p>
                </div>
                <div className="p-6 bg-white rounded-lg shadow">
                  <h3 className="text-sm font-medium text-gray-500">Date Range</h3>
                  <p className="text-lg font-semibold text-gray-900">
                    {filteredLogs.length > 0 && filteredLogs[0]?.timestamp ? 
                      (new Date(filteredLogs[filteredLogs.length - 1]?.timestamp?.toDate ? filteredLogs[filteredLogs.length - 1].timestamp.toDate() : filteredLogs[filteredLogs.length - 1].timestamp)).toLocaleDateString() : 'N/A'}
                  </p>
                  <p className="mt-1 text-sm text-gray-600">
                    to {filteredLogs.length > 0 && filteredLogs[0]?.timestamp ? 
                      (new Date(filteredLogs[0]?.timestamp?.toDate ? filteredLogs[0].timestamp.toDate() : filteredLogs[0].timestamp)).toLocaleDateString() : 'N/A'}
                    {selectedStudy !== 'all' && <span className="text-gray-500"> (filtered)</span>}
                  </p>
                </div>
              </div>
            )}

            {/* Export Section */}
            <div className="flex flex-col p-6 bg-white rounded-lg shadow">
              <h2 className="mb-4 text-xl font-semibold text-center">Export Data</h2>
              <div className="flex justify-center space-x-4">
                <button
                  onClick={() => exportToCSV(
                    prepareLogExportRows(filteredLogs),
                    `user_activity_${selectedStudy !== 'all' ? selectedStudy + '_' : ''}${new Date().toISOString().split('T')[0]}.csv`
                  )}
                  className="px-4 py-2 mt-4 text-white bg-blue-600 rounded-md hover:bg-blue-700"
                >
                  Export User Activity (CSV)
                </button>
                <button
                  onClick={() => exportToCSV(
                    filteredArticles.map(a => ({ ...a, studyId: (a as any).studyId || 'N/A' })),
                    `articles_${selectedStudy !== 'all' ? selectedStudy + '_' : ''}${new Date().toISOString().split('T')[0]}.csv`
                  )}
                  className="px-4 py-2 mt-4 text-white bg-green-600 rounded-md hover:bg-green-700"
                >
                  Export Articles (CSV)
                </button>
              </div>
            </div>
          </>
        )}

        {viewMode === 'logs' && (
          <>
            {/* Search and Filters */}
            <div className="p-6 mb-8 bg-white rounded-lg shadow">
              <div className="grid grid-cols-1 gap-4 md:grid-cols-6">
                <StudyDropdown
                  value={selectedStudy}
                  onChange={setSelectedStudy}
                  studies={studies}
                />
                <div>
                  <label className="block mb-2 text-sm font-medium text-gray-700">User</label>
                  <input
                    type="text"
                    value={logUserFilter}
                    onChange={e => setLogUserFilter(e.target.value)}
                    placeholder="Filter by user ID..."
                    className="w-full px-3 py-2 border border-gray-300 rounded-md"
                  />
                </div>
                <div>
                  <label className="block mb-2 text-sm font-medium text-gray-700">Date Range</label>
                  <select 
                    value={selectedDateRange} 
                    onChange={(e) => setSelectedDateRange(e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md"
                  >
                    <option value="all">All Time</option>
                    <option value="1">Last 24 hours</option>
                    <option value="7">Last 7 days</option>
                    <option value="30">Last 30 days</option>
                    <option value="90">Last 90 days</option>
                  </select>
                </div>
                <div>
                  <label className="block mb-2 text-sm font-medium text-gray-700">Action Type</label>
                  <select 
                    value={selectedAction} 
                    onChange={(e) => setSelectedAction(e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md"
                  >
                    <option value="all">All Actions</option>
                    {stats?.actionsByType && Object.keys(stats.actionsByType).map(action => (
                      <option key={action} value={action}>{action}</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block mb-2 text-sm font-medium text-gray-700">Article</label>
                  <select
                    value={selectedArticle}
                    onChange={e => setSelectedArticle(e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md"
                  >
                    <option value="all">All Articles</option>
                    {filteredArticles.map(article => (
                      <option key={article.id} value={article.id}>{article.title}</option>
                    ))}
                  </select>
                </div>
                <div className="flex items-end">
                  <button
                    onClick={() => {
                      setSelectedDateRange('all');
                      setSelectedAction('all');
                      setSelectedArticle('all');
                      setLogUserFilter('');
                    }}
                    className="w-full px-4 py-2 text-white bg-gray-500 rounded-md hover:bg-gray-600"
                  >
                    Clear Filters
                  </button>
                </div>
              </div>
            </div>
            <div className="bg-white rounded-lg shadow">
              <div className="flex items-center justify-between p-6 border-b border-gray-200">
                <div>
                  <h2 className="text-xl font-semibold">User Activity Logs</h2>
                  <p className="text-gray-600">Showing {filteredLogs.length} of {logs.length} entries</p>
                </div>
                <button
                  onClick={() => exportToCSV(
                    prepareLogExportRows(filteredLogs),
                    `filtered_logs_${new Date().toISOString().split('T')[0]}.csv`
                  )}
                  className="px-4 py-2 text-white bg-blue-600 rounded-md hover:bg-blue-700"
                >
                  Export Filtered Data
                </button>
              </div>
              <div className="overflow-x-auto">
                <table className="min-w-full divide-y divide-gray-200">
                  <thead className="bg-gray-50">
                    <tr>
                      <th className="px-6 py-3 text-xs font-medium tracking-wider text-left text-gray-500 uppercase">Time</th>
                      <th className="px-6 py-3 text-xs font-medium tracking-wider text-left text-gray-500 uppercase">User</th>
                      <th className="px-6 py-3 text-xs font-medium tracking-wider text-left text-gray-500 uppercase">Study</th>
                      <th className="px-6 py-3 text-xs font-medium tracking-wider text-left text-gray-500 uppercase">Action</th>
                      <th className="px-6 py-3 text-xs font-medium tracking-wider text-left text-gray-500 uppercase">Details</th>
                      <th className="px-6 py-3 text-xs font-medium tracking-wider text-left text-gray-500 uppercase">Article</th>
                      <th className="px-6 py-3 text-xs font-medium tracking-wider text-left text-gray-500 uppercase">QT Response ID</th>
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-gray-200">
                    {filteredLogs.slice(0, 100).map((log) => (
                      <tr key={log.id} className="hover:bg-gray-50">
                        <td className="px-6 py-4 text-sm text-gray-900 whitespace-nowrap">
                          {log.timestamp?.toDate ? 
                            log.timestamp.toDate().toLocaleString() : 
                            new Date(log.timestamp).toLocaleString()
                          }
                        </td>
                        <td className="px-6 py-4 text-sm text-gray-900 whitespace-nowrap">
                          {log.userId}
                        </td>
                        <td className="px-6 py-4 text-sm text-gray-500 whitespace-nowrap">
                          {(() => {
                            const logStudyId = (log as any).studyId;
                            return logStudyId ? getStudyName(logStudyId) : '-';
                          })()}
                        </td>
                        <td className="px-6 py-4 text-sm text-gray-900 whitespace-nowrap">
                          <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
                            {log.action}
                          </span>
                        </td>
                        <td className="max-w-xs px-6 py-4 text-sm text-gray-900 truncate">
                          {log.details && (
                            <div
                              className="mt-1 text-xs text-gray-500"
                              title={log.details}
                            >
                              {`${log.details.substring(0, 50)}`}
                            </div>
                          )}
                        </td>
                        <td className="px-6 py-4 text-sm text-gray-500 whitespace-nowrap">
                          {log.label || log.url}
                        </td>
                        <td className="px-6 py-4 text-sm text-gray-500 whitespace-nowrap">
                          {log.qualtricsResponseId || '-'}
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
            <div className="p-6 mb-8 bg-white rounded-lg shadow">
              <div className="flex flex-col justify-center max-w-3xl gap-4 mx-auto md:flex-row md:items-end">
                <div className="flex-1 min-w-[180px]">
                  <label className="block mb-2 text-sm font-medium text-gray-700">Study</label>
                  <select
                    value={selectedStudy}
                    onChange={e => setSelectedStudy(e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md"
                  >
                    <option value="all">All Studies</option>
                    {studies.map(study => (
                      <option key={study.id} value={study.id}>
                        {study.name} ({study.id.toUpperCase()})
                      </option>
                    ))}
                  </select>
                </div>
                <div className="flex-1 min-w-[220px]">
                  <label className="block mb-2 text-sm font-medium text-gray-700">Filter by Title or Article ID</label>
                  <input
                    type="text"
                    value={articleTitleIdFilter}
                    onChange={e => setArticleTitleIdFilter(e.target.value)}
                    placeholder="Type to filter articles..."
                    className="w-full px-3 py-2 border border-gray-300 rounded-md"
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
                {/* Export filtered articles button removed per request */}
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
            <div className="p-6 mb-8 bg-white rounded-lg shadow">
              <div className="grid grid-cols-1 gap-4 md:grid-cols-6">
                <StudyDropdown
                  value={selectedStudy}
                  onChange={setSelectedStudy}
                  studies={studies}
                />
                <div>
                  <label className="block mb-2 text-sm font-medium text-gray-700">Search</label>
                  <input
                    type="text"
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    placeholder="Search comments..."
                    className="w-full px-3 py-2 border border-gray-300 rounded-md"
                  />
                </div>
                <div>
                  <label className="block mb-2 text-sm font-medium text-gray-700">User</label>
                  <input
                    type="text"
                    value={selectedUser}
                    onChange={e => setSelectedUser(e.target.value)}
                    placeholder="Filter by username..."
                    className="w-full px-3 py-2 border border-gray-300 rounded-md"
                  />
                </div>
                <div>
                  <label className="block mb-2 text-sm font-medium text-gray-700">Article</label>
                  <select
                    value={selectedArticle}
                    onChange={(e) => setSelectedArticle(e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md"
                  >
                    <option value="all">All Articles</option>
                    {filteredArticles.map(article => (
                      <option key={article.id} value={article.id}>{article.title}</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block mb-2 text-sm font-medium text-gray-700">Date Range</label>
                  <select
                    value={selectedCommentDateRange}
                    onChange={(e) => setSelectedCommentDateRange(e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md"
                  >
                    <option value="all">All Time</option>
                    <option value="1">Last 24 hours</option>
                    <option value="7">Last 7 days</option>
                    <option value="30">Last 30 days</option>
                    <option value="90">Last 90 days</option>
                  </select>
                </div>
                <div className="flex items-end space-x-2">
                  <button
                    onClick={() => {
                      setSelectedStudy('all');
                      setSelectedArticle('all');
                      setSelectedUser('');
                      setSelectedCommentDateRange('all');
                      setSearchTerm('');
                      setArticleTitleIdFilter('');
                    }}
                    className="w-full px-4 py-2 text-white bg-gray-500 rounded-md hover:bg-gray-600"
                  >
                    Clear Filters
                  </button>
                </div>
              </div>
              {/* Sorting Row */}
              <div className="grid grid-cols-1 gap-4 mt-4 md:grid-cols-5">
                <div className="md:col-span-2">
                  <label className="block mb-2 text-sm font-medium text-gray-700">Sort By</label>
                  <select
                    value={commentSort}
                    onChange={e => setCommentSort(e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md"
                  >
                    <option value="date-desc">Date Created (Newest First)</option>
                    <option value="date-asc">Date Created (Oldest First)</option>
                    <option value="upvotes-desc">Upvotes (Most First)</option>
                    <option value="upvotes-asc">Upvotes (Least First)</option>
                    <option value="downvotes-desc">Downvotes (Most First)</option>
                    <option value="downvotes-asc">Downvotes (Least First)</option>
                  </select>
                </div>
              </div>
            </div>
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
                    type="button"
                    onClick={() => setShowDefaultComments((v) => !v)}
                    className={`px-4 py-2 text-white rounded-md ${!showDefaultComments ? 'bg-blue-600 hover:bg-blue-700' : 'bg-gray-400 hover:bg-gray-500'}`}
                  >
                    {showDefaultComments ? 'Hide Default Comments' : 'Show Default Comments'}
                  </button>
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