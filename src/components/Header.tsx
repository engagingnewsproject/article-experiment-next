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
import React from "react"
import styles from "./Header.module.css"
import { getSessionFromStorage } from "@/lib/auth"

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
 * @returns {JSX.Element} The rendered header section
 */
export const Header: React.FC = () => {
	return (
		<header className={`container container--wide ${styles.header}`} role='banner'>
			<div className={styles.siteTitle}>
				The Gazette Star
				<span>
					{(process.env.NODE_ENV === "development" || getSessionFromStorage()?.isAuthenticated) && (
						<a href='http://localhost:3000' className={styles.homeLink}>
							Home
						</a>
					)}
				</span>
			</div>
			{/* would like to add a link to the base url here that is only visible on local development */}
		</header>
	)
}
