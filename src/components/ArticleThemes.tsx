import styles from "@/components/ArticleThemes.module.css";
import { type ArticleTheme } from "@/lib/firestore";
import React from 'react';



const ArticleThemeItem: React.FC<{
  index: number
  articleTheme: ArticleTheme
  label?: string
}> = ({
  index,
  articleTheme,
  label
}) => {
  const displayLabel = label && label.trim() ? label : null;
  return (
    <div className={styles.theme}>
      {displayLabel &&
        <h3 className={styles["theme-title"]}>{displayLabel}</h3>
      }
      <p>{articleTheme.content}</p>
    </div>
  );
}

export const ArticleThemeList: React.FC<{
  articleThemes: ArticleTheme[],
  themeLabels?: string[]
}> = ({
  articleThemes,
}) => {
  return (
    <div className={styles.themes_section}>
      {articleThemes && articleThemes.map((theme, index) => (
        <ArticleThemeItem
          key={index}
          index={index}
          articleTheme={theme}
          label={theme.label}
        />
      ))}
    </div>
  )
}