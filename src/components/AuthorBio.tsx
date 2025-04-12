import React from 'react';
import styles from './AuthorBio.module.css';

interface AuthorBioProps {
  author: {
    name: string;
    bio: {
      personal: string;
      basic: string;
    };
    image?: {
      src: string;
      alt: string;
    };
  };
  bioType?: 'personal' | 'basic';
}

export const AuthorBio: React.FC<AuthorBioProps> = ({ author, bioType = 'basic' }) => {
  return (
    <section className={styles.author__content}>
      <div className={styles.author__bio}>
        <p>{author.bio[bioType]}</p>
      </div>
    </section>
  );
};
