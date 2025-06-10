import React from 'react';
import { type ArticleHighlight } from "@/lib/firestore";
import styles from "@/components/ArticleHighlights.module.css";


const ArticleHighlightItem: React.FC<{
  articleHighlight: ArticleHighlight
}> = ({
  articleHighlight
}) => {
  return (
    <div className={styles.highlight}>
      <p>{articleHighlight.content}</p>
    </div>
  );

}

export const ArticleHighlightList: React.FC<{
  articleHighlights: ArticleHighlight[]
}> = ({
  articleHighlights
}) => {
  return (
    <div className={styles.highlights_section}>
      {articleHighlights.map((highlight, index) => (
        <ArticleHighlightItem
          key={index} 
          articleHighlight={highlight}
        />
      ))}
    </div>
  )
}