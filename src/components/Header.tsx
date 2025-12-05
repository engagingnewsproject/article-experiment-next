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

import { getSessionFromStorage } from "@/lib/auth";
import React, { useEffect, useState } from "react";
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
	
	// Check authentication after component mounts to avoid hydration mismatch
	useEffect(() => {
		const session = getSessionFromStorage();
		setIsAuthenticated(session?.isAuthenticated || false);
	}, []);
	
	return (
		<header className={`container container--wide ${styles.header}`} role='banner'>
			<div className={styles.siteTitle}>
				{siteName}
				{isAuthenticated && (
					<span>
						<a href='/' className={styles.homeLink}>
							Home
						</a>
					</span>
				)}
			</div>
			{/* would like to add a link to the base url here that is only visible on local development */}
		</header>
	)
}
