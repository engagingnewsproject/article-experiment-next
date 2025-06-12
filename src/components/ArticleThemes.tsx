import styles from "@/components/ArticleThemes.module.css";
import { type ArticleTheme } from "@/lib/firestore";
import React from 'react';


const ArticleThemeItem: React.FC<{
  articleTheme: ArticleTheme
}> = ({
  articleTheme
}) => {
  return (
    <div className={styles.theme}>
      <p>{articleTheme.content}</p>
    </div>
  );

}

export const ArticleThemeList: React.FC<{
  articleThemes: ArticleTheme[]
}> = ({
  articleThemes
}) => {
  return (
    <div className={styles.themes_section}>
      {articleThemes && articleThemes.map((theme, index) => (
        <ArticleThemeItem
          key={index} 
          articleTheme={theme}
        />
      ))}
    </div>
  )
}