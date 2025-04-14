/**
 * AuthorBio component that displays author information and biography.
 * 
 * This component:
 * - Shows the author's biography text
 * - Supports different types of biographies (personal or basic)
 * - Provides consistent styling for author information
 * 
 * @component
 * @param {Object} props - Component props
 * @param {Object} props.author - Author information
 * @param {string} [props.bioType='basic'] - Type of biography to display
 * @returns {JSX.Element} The author biography section
 */
import React from 'react';
import styles from './AuthorBio.module.css';

/**
 * Props interface for the AuthorBio component.
 * 
 * @interface AuthorBioProps
 * @property {Object} author - Author information
 * @property {string} author.name - The author's name
 * @property {Object} author.bio - Biography content
 * @property {string} author.bio.personal - Personal biography text
 * @property {string} author.bio.basic - Basic biography text
 * @property {Object} [author.image] - Optional author image
 * @property {string} author.image.src - Image source URL
 * @property {string} author.image.alt - Image alt text
 * @property {'personal' | 'basic'} [bioType='basic'] - Type of biography to display
 */
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

/**
 * AuthorBio component that renders the author's biography section.
 * 
 * This component:
 * - Displays the selected type of biography (personal or basic)
 * - Uses CSS modules for styling
 * - Provides a consistent layout for author information
 * 
 * @param {AuthorBioProps} props - Component props
 * @returns {JSX.Element} The rendered author biography section
 */
export const AuthorBio: React.FC<AuthorBioProps> = ({ author, bioType = 'basic' }) => {
  return (
    <section className={styles.author__content}>
      <div className={styles.author__bio}>
        <p>{author.bio[bioType]}</p>
      </div>
    </section>
  );
};
