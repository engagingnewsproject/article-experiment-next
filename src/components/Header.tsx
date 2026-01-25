/**
 * Header component that displays the site title and navigation elements.
 * 
 * This component:
 * - Shows the site title (The Gazette Star)
 * - Provides a development-only home link
 * - Optionally shows page load time for authenticated admin users
 * - Uses CSS modules for consistent styling
 * - Maintains accessibility with proper ARIA roles
 * 
 * @component
 * @returns {JSX.Element} The header section
 */
"use client";

import { onAuthChange, getCurrentUser } from "@/lib/auth";
import React, { useEffect, useState } from "react";
import { User } from "firebase/auth";
import styles from "./Header.module.css";

/**
 * Formats load time in ms as human-readable string (e.g. "1.2s" or "450ms").
 */
function formatLoadTime(ms: number): string {
	if (ms < 1000) return `${Math.round(ms)}ms`;
	return `${(ms / 1000).toFixed(1)}s`;
}

/**
 * Header component that renders the application's header section.
 * 
 * This component:
 * - Displays the site title prominently
 * - Includes a development-only home link
 * - Shows load-time timer for admins when loadTimeMs is provided
 * - Uses CSS modules for styling
 * - Maintains accessibility standards
 * 
 * @param {Object} props - Component props
 * @param {string} [props.siteName] - The site name to display (from project config)
 * @param {number} [props.loadTimeMs] - Page load duration in ms; when set, shown to authenticated users
 * @returns {JSX.Element} The rendered header section
 */
interface HeaderProps {
	siteName?: string;
	/** Page load duration in ms; shown next to Home link for authenticated admin users */
	loadTimeMs?: number;
}

export const Header: React.FC<HeaderProps> = ({ siteName = 'The Gazette Star', loadTimeMs }) => {
	const [isAuthenticated, setIsAuthenticated] = useState(false);
	
	// Subscribe to Firebase Auth state changes to detect authentication
	useEffect(() => {
		const user = getCurrentUser();
		setIsAuthenticated(user !== null);
		const unsubscribe = onAuthChange((user: User | null) => {
			setIsAuthenticated(user !== null);
		});
		return () => unsubscribe();
	}, []);
	
	const showLoadTime = isAuthenticated && loadTimeMs != null && loadTimeMs >= 0;
	
	return (
		<header className={`container container--wide ${styles.header}`} role='banner'>
			<div className={styles.siteTitle}>
				{siteName}
				{isAuthenticated && (
					<span className={styles.adminMeta}>
						<a href='/admin' className={styles.homeLink}>
							Home
						</a>
						{showLoadTime && (
							<span className={styles.loadTime} title="Time to load article and comments">
								{formatLoadTime(loadTimeMs)}
							</span>
						)}
					</span>
				)}
			</div>
		</header>
	)
}
