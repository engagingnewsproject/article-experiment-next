import React from "react"
import styles from "./Header.module.css"

export const Header: React.FC = () => {
	return (
		<header className={`container container--wide ${styles.header}`} role='banner'>
			<div className={styles.siteTitle}>
				The Gazette Star
				<span>
					{process.env.NODE_ENV === "development" && (
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
