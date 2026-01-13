/**
 * Header component that displays the site title and navigation elements.
 * 
 * This component:
 * - Shows the site title (The Gazette Star)
 * - Provides a development-only home link
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
 * Header component that renders the application's header section.
 * 
 * This component:
 * - Displays the site title prominently
 * - Includes a development-only home link
 * - Uses CSS modules for styling
 * - Maintains accessibility standards
 * - Adapts to different environments (development/production)
 * 
 * @param {Object} props - Component props
 * @param {string} [props.siteName] - The site name to display (from project config)
 * @returns {JSX.Element} The rendered header section
 */
interface HeaderProps {
	siteName?: string;
}

export const Header: React.FC<HeaderProps> = ({ siteName = 'The Gazette Star' }) => {
	const [isAuthenticated, setIsAuthenticated] = useState(false);
	
	// Subscribe to Firebase Auth state changes to detect authentication
	// This ensures the Home link appears even after page refresh when Firebase Auth initializes
	useEffect(() => {
		// Check initial auth state
		const user = getCurrentUser();
		setIsAuthenticated(user !== null);
		
		// Subscribe to auth state changes
		const unsubscribe = onAuthChange((user: User | null) => {
			setIsAuthenticated(user !== null);
		});
		
		return () => unsubscribe();
	}, []);
	
	return (
		<header className={`container container--wide ${styles.header}`} role='banner'>
			<div className={styles.siteTitle}>
				{siteName}
				{isAuthenticated && (
					<span>
						<a href='/admin' className={styles.homeLink}>
							Home
						</a>
					</span>
				)}
			</div>
			{/* would like to add a link to the base url here that is only visible on local development */}
		</header>
	)
}
