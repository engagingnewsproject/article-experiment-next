// Simple authentication for research dashboard
// In a production environment, you'd want to use proper authentication

// ============================================================================
// CONFIGURATION - Update these values as needed
// ============================================================================

// Password for accessing the research dashboard
const RESEARCH_DASHBOARD_PASSWORD = 'research2025!';

// List of email addresses that are allowed to access the research dashboard
// Add or remove emails as needed for your research team
const ALLOWED_EMAILS = [
  'researcher@university.edu',
  'professor@college.edu', 
  'student@research.org',
  'luke@lukecarlhartman.com',  // Replace with your actual email
  // Add more emails as needed
];

// ============================================================================
// END CONFIGURATION
// ============================================================================

export interface AuthSession {
  isAuthenticated: boolean;
  email: string;
  timestamp: number;
}

export function validateCredentials(password: string, email: string): boolean {
  return password === RESEARCH_DASHBOARD_PASSWORD && ALLOWED_EMAILS.includes(email.toLowerCase());
}

export function createSession(email: string): AuthSession {
  return {
    isAuthenticated: true,
    email: email.toLowerCase(),
    timestamp: Date.now()
  };
}

export function getSessionFromStorage(): AuthSession | null {
  if (typeof window === 'undefined') return null;
  
  const sessionData = localStorage.getItem('research-dashboard-session');
  if (!sessionData) return null;
  
  try {
    const session: AuthSession = JSON.parse(sessionData);
    // Check if session is still valid (24 hours)
    if (Date.now() - session.timestamp > 24 * 60 * 60 * 1000) {
      localStorage.removeItem('research-dashboard-session');
      return null;
    }
    return session;
  } catch {
    localStorage.removeItem('research-dashboard-session');
    return null;
  }
}

export function saveSessionToStorage(session: AuthSession): void {
  if (typeof window === 'undefined') return;
  localStorage.setItem('research-dashboard-session', JSON.stringify(session));
}

export function clearSession(): void {
  if (typeof window === 'undefined') return;
  localStorage.removeItem('research-dashboard-session');
}

export function getAllowedEmails(): string[] {
  return [...ALLOWED_EMAILS];
} 