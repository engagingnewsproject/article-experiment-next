import styles from "@/components/ArticleSummary.module.css";
import { type ArticleTheme } from "@/lib/firestore";
import React from 'react';


export const ArticleSummary: React.FC<{
  articleSummary: string;
}> = ({
  articleSummary
}) => {
  return (
    <div className={styles.article_summary_block}>
      <div className={styles.article_summary_section}>
        <h2 className={styles.article_summary_title}>Comment Summary</h2>
        <p className={styles.article_summary}>{articleSummary}</p>
      </div>
    </div>
  )
}