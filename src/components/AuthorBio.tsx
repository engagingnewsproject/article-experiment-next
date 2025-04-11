import React from 'react';
import styles from './AuthorBio.module.css';

interface AuthorBioProps {
  author: {
    name: string;
    bio: string;
    email: string;
    location: string;
    languages: string;
    expertise: string;
    recentStories?: string[];
  };
}

export const AuthorBio: React.FC<AuthorBioProps> = ({ author }) => {
  return (
    <section className={styles.author__content}>
      <div className={styles.author__bio}>
        <p>{author.bio}</p>

        {author.recentStories && author.recentStories.length > 0 && (
          <>
            <h4>Recent stories for The Gazette Star</h4>
            <ul>
              {author.recentStories.map((story, index) => (
                <li key={index}>{story}</li>
              ))}
            </ul>
          </>
        )}
      </div>
      <ul className={styles.author__facts}>
        <li>
          <h4>Contact details</h4>
          <p>{author.email}</p>
        </li>
        <li>
          <h4>Location</h4>
          <p>{author.location}</p>
        </li>
        <li>
          <h4>Languages spoken</h4>
          <p>{author.languages}</p>
        </li>
        <li>
          <h4>Areas of expertise</h4>
          <p>{author.expertise}</p>
        </li>
      </ul>
    </section>
  );
};
