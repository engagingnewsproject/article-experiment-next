import styles from "@/components/ArticleThemes.module.css";
import { type ArticleTheme } from "@/lib/firestore";
import React from 'react';


const ArticleThemeItem: React.FC<{
  index: number
  articleTheme: ArticleTheme
}> = ({
  index,
  articleTheme
}) => {
  return (
      <div className={styles.theme}>
        <h3 className={styles["theme-title"]}>Theme {String.fromCharCode(65 + index)}</h3>
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
          index={index}
          articleTheme={theme}
        />
      ))}
    </div>
  )
}