'use client';

import { useState, useEffect } from 'react';
import { collection, getDocs, query, orderBy, where, Timestamp } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import { getSessionFromStorage, clearSession } from '@/lib/auth';
import { ResearchDashboardLogin } from '@/components/admin/ResearchDashboardLogin';

interface LogEntry {
  id: string;
  url: string;
  identifier: string;
  userId: string;
  ipAddress?: string;
  action: string;
  label: string;
  comment: string;
  timestamp: any;
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
  default_comments?: any[];
  themes?: any[];
  summary?: string;
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

export default function ResearchDashboard() {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [userEmail, setUserEmail] = useState('');
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [logs, setLogs] = useState<LogEntry[]>([]);
  const [articles, setArticles] = useState<Article[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedDateRange, setSelectedDateRange] = useState('all');
  const [selectedAction, setSelectedAction] = useState('all');
  const [selectedArticle, setSelectedArticle] = useState('all');
  const [viewMode, setViewMode] = useState<'overview' | 'logs' | 'articles' | 'comments'>('overview');
  const [searchTerm, setSearchTerm] = useState('');

  useEffect(() => {
    // Check authentication on component mount
    const session = getSessionFromStorage();
    if (session && session.isAuthenticated) {
      setIsAuthenticated(true);
      setUserEmail(session.email);
      loadData();
    } else {
      setLoading(false);
    }
  }, []);

  const handleLogin = () => {
    const session = getSessionFromStorage();
    if (session && session.isAuthenticated) {
      setIsAuthenticated(true);
      setUserEmail(session.email);
      loadData();
    }
  };

  const handleLogout = () => {
    clearSession();
    setIsAuthenticated(false);
    setUserEmail('');
    setStats(null);
    setLogs([]);
    setArticles([]);
  };

  const loadData = async () => {
    try {
      setLoading(true);
      
      // Load logs
      const logsRef = collection(db, 'logs');
      const logsQuery = query(logsRef, orderBy('timestamp', 'desc'));
      const logsSnapshot = await getDocs(logsQuery);
      const logsData = logsSnapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      })) as LogEntry[];

      // Load articles
      const articlesRef = collection(db, 'articles');
      const articlesQuery = query(articlesRef, orderBy('createdAt', 'desc'));
      const articlesSnapshot = await getDocs(articlesQuery);
      const articlesData = articlesSnapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      })) as Article[];

      setLogs(logsData);
      setArticles(articlesData);

      // Calculate stats
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
      );

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
    const headers = Object.keys(data[0] || {});
    const csvContent = [
      headers.join(','),
      ...data.map(row => 
        headers.map(header => {
          const value = row[header];
          return typeof value === 'string' ? `"${value.replace(/"/g, '""')}"` : value;
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

  const filteredLogs = logs.filter(log => {
    if (selectedAction !== 'all' && log.action !== selectedAction) return false;
    if (selectedArticle !== 'all' && log.identifier !== selectedArticle) return false;
    if (selectedDateRange !== 'all') {
      const logDate = log.timestamp?.toDate ? log.timestamp.toDate() : new Date(log.timestamp);
      const now = new Date();
      const daysAgo = parseInt(selectedDateRange);
      const cutoffDate = new Date(now.getTime() - (daysAgo * 24 * 60 * 60 * 1000));
      if (logDate < cutoffDate) return false;
    }
    if (searchTerm) {
      const searchLower = searchTerm.toLowerCase();
      return (
        log.label.toLowerCase().includes(searchLower) ||
        log.comment.toLowerCase().includes(searchLower) ||
        log.url.toLowerCase().includes(searchLower)
      );
    }
    return true;
  });

  const filteredArticles = articles.filter(article => {
    if (searchTerm) {
      const searchLower = searchTerm.toLowerCase();
      return (
        article.title.toLowerCase().includes(searchLower) ||
        article.content.toLowerCase().includes(searchLower) ||
        (article.author?.name || '').toLowerCase().includes(searchLower)
      );
    }
    return true;
  });

  const allComments = articles.flatMap(article => 
    (article.default_comments || []).map(comment => ({
      ...comment,
      articleId: article.id,
      articleTitle: article.title,
      articleSlug: article.slug,
      authorName: article.author?.name || 'Anonymous'
    }))
  );

  const filteredComments = allComments.filter(comment => {
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

  if (!isAuthenticated) {
    return <ResearchDashboardLogin onLogin={handleLogin} />;
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 p-8">
        <div className="max-w-7xl mx-auto">
          <div className="text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
            <p className="mt-4 text-gray-600">Loading research data...</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 p-8">
      <div className="max-w-7xl mx-auto">
        {/* Header with Logout */}
        <div className="mb-8 flex justify-between items-start">
          <div>
            <h1 className="text-3xl font-bold text-gray-900 mb-2">Research Data Dashboard</h1>
            <p className="text-gray-600">Interactive data exploration and analysis for researchers</p>
            <p className="text-sm text-gray-500 mt-1">Logged in as: {userEmail}</p>
          </div>
          <div className="flex space-x-2">
            <a
              href="/admin"
              className="px-4 py-2 text-sm text-gray-600 hover:text-gray-800 border border-gray-300 rounded-md hover:bg-gray-50"
            >
              Admin
            </a>
            <button
              onClick={handleLogout}
              className="px-4 py-2 text-sm text-gray-600 hover:text-gray-800 border border-gray-300 rounded-md hover:bg-gray-50"
            >
              Sign Out
            </button>
          </div>
        </div>

        {/* Navigation Tabs */}
        <div className="bg-white rounded-lg shadow mb-8">
          <div className="border-b border-gray-200">
            <nav className="-mb-px flex space-x-8 px-6">
              {[
                { id: 'overview', label: 'Overview', count: null },
                { id: 'logs', label: 'User Activity', count: logs.length },
                { id: 'articles', label: 'Articles', count: articles.length },
                { id: 'comments', label: 'Comments', count: allComments.length }
              ].map((tab) => (
                <button
                  key={tab.id}
                  onClick={() => setViewMode(tab.id as any)}
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

        {/* Search and Filters */}
        <div className="bg-white rounded-lg shadow p-6 mb-8">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Search</label>
              <input
                type="text"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                placeholder="Search content..."
                className="w-full border border-gray-300 rounded-md px-3 py-2"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Date Range</label>
              <select 
                value={selectedDateRange} 
                onChange={(e) => setSelectedDateRange(e.target.value)}
                className="w-full border border-gray-300 rounded-md px-3 py-2"
              >
                <option value="all">All Time</option>
                <option value="1">Last 24 hours</option>
                <option value="7">Last 7 days</option>
                <option value="30">Last 30 days</option>
                <option value="90">Last 90 days</option>
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Action Type</label>
              <select 
                value={selectedAction} 
                onChange={(e) => setSelectedAction(e.target.value)}
                className="w-full border border-gray-300 rounded-md px-3 py-2"
              >
                <option value="all">All Actions</option>
                {stats?.actionsByType && Object.keys(stats.actionsByType).map(action => (
                  <option key={action} value={action}>{action}</option>
                ))}
              </select>
            </div>
            <div className="flex items-end">
              <button
                onClick={() => {
                  setSelectedDateRange('all');
                  setSelectedAction('all');
                  setSelectedArticle('all');
                  setSearchTerm('');
                }}
                className="w-full bg-gray-500 text-white px-4 py-2 rounded-md hover:bg-gray-600"
              >
                Clear Filters
              </button>
            </div>
          </div>
        </div>

        {/* Content Based on View Mode */}
        {viewMode === 'overview' && (
          <>
            {/* Stats Overview */}
            {stats && (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
                <div className="bg-white rounded-lg shadow p-6">
                  <h3 className="text-sm font-medium text-gray-500">Total User Actions</h3>
                  <p className="text-3xl font-bold text-gray-900">{stats.totalLogs.toLocaleString()}</p>
                  <p className="text-sm text-gray-600 mt-1">Unique users: {stats.uniqueUsers}</p>
                </div>
                <div className="bg-white rounded-lg shadow p-6">
                  <h3 className="text-sm font-medium text-gray-500">Articles</h3>
                  <p className="text-3xl font-bold text-gray-900">{stats.totalArticles}</p>
                  <p className="text-sm text-gray-600 mt-1">Avg {stats.averageWordCount} words</p>
                </div>
                <div className="bg-white rounded-lg shadow p-6">
                  <h3 className="text-sm font-medium text-gray-500">Comments</h3>
                  <p className="text-3xl font-bold text-gray-900">{stats.totalComments}</p>
                  <p className="text-sm text-gray-600 mt-1">{stats.articlesWithComments} articles have comments</p>
                </div>
                <div className="bg-white rounded-lg shadow p-6">
                  <h3 className="text-sm font-medium text-gray-500">Date Range</h3>
                  <p className="text-lg font-semibold text-gray-900">
                    {stats.dateRange.earliest ? new Date(stats.dateRange.earliest).toLocaleDateString() : 'N/A'}
                  </p>
                  <p className="text-sm text-gray-600 mt-1">to {stats.dateRange.latest ? new Date(stats.dateRange.latest).toLocaleDateString() : 'N/A'}</p>
                </div>
              </div>
            )}

            {/* Action Types Chart */}
            {stats && (
              <div className="bg-white rounded-lg shadow p-6 mb-8">
                <h2 className="text-xl font-semibold mb-4">User Actions by Type</h2>
                <div className="space-y-3">
                  {Object.entries(stats.actionsByType).map(([action, count]) => (
                    <div key={action} className="flex items-center">
                      <div className="w-32 text-sm font-medium text-gray-700">{action}</div>
                      <div className="flex-1 bg-gray-200 rounded-full h-2 mx-4">
                        <div 
                          className="bg-blue-600 h-2 rounded-full" 
                          style={{ width: `${(count / stats.totalActions) * 100}%` }}
                        ></div>
                      </div>
                      <div className="w-16 text-sm text-gray-600">{count}</div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Export Section */}
            <div className="bg-white rounded-lg shadow p-6">
              <h2 className="text-xl font-semibold mb-4">Export Data</h2>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                <button
                  onClick={() => exportToCSV(logs, `user_activity_${new Date().toISOString().split('T')[0]}.csv`)}
                  className="bg-blue-600 text-white px-4 py-2 rounded-md hover:bg-blue-700"
                >
                  Export User Activity (CSV)
                </button>
                <button
                  onClick={() => exportToCSV(articles, `articles_${new Date().toISOString().split('T')[0]}.csv`)}
                  className="bg-green-600 text-white px-4 py-2 rounded-md hover:bg-green-700"
                >
                  Export Articles (CSV)
                </button>
                <button
                  onClick={() => exportToCSV(allComments, `comments_${new Date().toISOString().split('T')[0]}.csv`)}
                  className="bg-purple-600 text-white px-4 py-2 rounded-md hover:bg-purple-700"
                >
                  Export Comments (CSV)
                </button>
                <button
                  onClick={() => {
                    const data = {
                      exportDate: new Date().toISOString(),
                      stats: stats,
                      filters: {
                        dateRange: selectedDateRange,
                        actionFilter: selectedAction,
                        searchTerm: searchTerm
                      }
                    };
                    const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
                    const url = window.URL.createObjectURL(blob);
                    const a = document.createElement('a');
                    a.href = url;
                    a.download = `research_summary_${new Date().toISOString().split('T')[0]}.json`;
                    a.click();
                    window.URL.revokeObjectURL(url);
                  }}
                  className="bg-orange-600 text-white px-4 py-2 rounded-md hover:bg-orange-700"
                >
                  Export Summary (JSON)
                </button>
              </div>
            </div>
          </>
        )}

        {viewMode === 'logs' && (
          <div className="bg-white rounded-lg shadow">
            <div className="p-6 border-b border-gray-200 flex justify-between items-center">
              <div>
                <h2 className="text-xl font-semibold">User Activity Logs</h2>
                <p className="text-gray-600">Showing {filteredLogs.length} of {logs.length} entries</p>
              </div>
              <button
                onClick={() => exportToCSV(filteredLogs, `filtered_logs_${new Date().toISOString().split('T')[0]}.csv`)}
                className="bg-blue-600 text-white px-4 py-2 rounded-md hover:bg-blue-700"
              >
                Export Filtered Data
              </button>
            </div>
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Time</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">User</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Action</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Description</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Page</th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {filteredLogs.slice(0, 100).map((log) => (
                    <tr key={log.id} className="hover:bg-gray-50">
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                        {log.timestamp?.toDate ? 
                          log.timestamp.toDate().toLocaleString() : 
                          new Date(log.timestamp).toLocaleString()
                        }
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                        {log.userId}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                        <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
                          {log.action}
                        </span>
                      </td>
                      <td className="px-6 py-4 text-sm text-gray-900 max-w-xs truncate">
                        {log.label}
                        {log.comment && (
                          <div className="text-gray-500 text-xs mt-1">{log.comment}</div>
                        )}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                        {log.url}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {viewMode === 'articles' && (
          <div className="bg-white rounded-lg shadow">
            <div className="p-6 border-b border-gray-200 flex justify-between items-center">
              <div>
                <h2 className="text-xl font-semibold">Articles</h2>
                <p className="text-gray-600">Showing {filteredArticles.length} of {articles.length} articles</p>
              </div>
              <button
                onClick={() => exportToCSV(filteredArticles, `filtered_articles_${new Date().toISOString().split('T')[0]}.csv`)}
                className="bg-green-600 text-white px-4 py-2 rounded-md hover:bg-green-700"
              >
                Export Filtered Data
              </button>
            </div>
            <div className="p-6 space-y-6">
              {filteredArticles.map((article) => (
                <div key={article.id} className="border border-gray-200 rounded-lg p-4">
                  <div className="flex justify-between items-start mb-2">
                    <h3 className="text-lg font-semibold text-gray-900">{article.title}</h3>
                    <span className="text-sm text-gray-500">ID: {article.id}</span>
                  </div>
                  <div className="text-sm text-gray-600 mb-2">
                    <span className="font-medium">Author:</span> {article.author?.name || 'Anonymous'}
                  </div>
                  <div className="text-sm text-gray-600 mb-2">
                    <span className="font-medium">Published:</span> {article.pubdate}
                  </div>
                  <div className="text-sm text-gray-600 mb-3">
                    <span className="font-medium">Comments:</span> {article.default_comments?.length || 0} default comments
                  </div>
                  <div className="text-sm text-gray-700 line-clamp-3">
                    {article.content.substring(0, 200)}...
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {viewMode === 'comments' && (
          <div className="bg-white rounded-lg shadow">
            <div className="p-6 border-b border-gray-200 flex justify-between items-center">
              <div>
                <h2 className="text-xl font-semibold">Comments</h2>
                <p className="text-gray-600">Showing {filteredComments.length} of {allComments.length} comments</p>
              </div>
              <button
                onClick={() => exportToCSV(filteredComments, `filtered_comments_${new Date().toISOString().split('T')[0]}.csv`)}
                className="bg-purple-600 text-white px-4 py-2 rounded-md hover:bg-purple-700"
              >
                Export Filtered Data
              </button>
            </div>
            <div className="p-6 space-y-4">
              {filteredComments.slice(0, 50).map((comment, index) => (
                <div key={index} className="border border-gray-200 rounded-lg p-4">
                  <div className="flex justify-between items-start mb-2">
                    <div className="text-sm text-gray-600">
                      <span className="font-medium">Article:</span> {comment.articleTitle}
                    </div>
                    <div className="text-sm text-gray-500">
                      {comment.upvotes || 0} ↑ {comment.downvotes || 0} ↓
                    </div>
                  </div>
                  <div className="text-sm text-gray-600 mb-2">
                    <span className="font-medium">By:</span> {comment.name}
                  </div>
                  <div className="text-gray-900">
                    {comment.content}
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
} 