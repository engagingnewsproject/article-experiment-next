/**
 * Configuration types and defaults for the article system.
 * 
 * This module:
 * - Defines interfaces for author and article configuration
 * - Provides default values for article metadata
 * - Ensures consistent author information across the application
 * - Maintains type safety for configuration objects
 * 
 * @module config
 */

/**
 * Interface for author configuration.
 * 
 * @interface AuthorConfig
 * @property {string} name - The author's full name
 * @property {Object} bio - Author biography information
 * @property {string} bio.personal - Detailed personal biography
 * @property {string} bio.basic - Concise professional biography
 * @property {Object} image - Author image information
 * @property {string} image.src - Path to the author's image
 * @property {string} image.alt - Alt text for the author's image
 */
export interface AuthorConfig {
  name: string;
  bio: {
    personal: string;
    basic: string;
  };
  image: {
    src: string;
    alt: string;
  };
}

/**
 * Interface for article configuration.
 * 
 * @interface ArticleConfig
 * @property {AuthorConfig} author - Author information
 * @property {string} pubdate - Publication date of the article
 * @property {string} siteName - Name of the publishing site
 */
export interface ArticleConfig {
  author: AuthorConfig;
  pubdate: string;
  siteName: string;
}

/**
 * Default configuration values for articles.
 * 
 * This object:
 * - Provides fallback values for article metadata
 * - Ensures consistent author information
 * - Maintains a standard format for publication dates
 * - Sets default site branding
 * 
 * @type {ArticleConfig}
 */
export const defaultConfig: ArticleConfig = {
  author: {
    name: "(default) Jim Phelps",
    bio: {
      personal: "(default) Jim Phelps is a science reporter for The Gazette Star. His coverage of energy and the environment has appeared in the Dallas Morning News, The Atlantic and Newsweek. A Colorado native and life-long Broncos fan, he began his career at the Denver Post, where he was part of a team that won a Pulitzer Prize for their story about the pollution of popular hot springs in Aspen. He graduated with a journalism degree from Vanderbilt University where he served as the editor-in-chief of the student newspaper. His simple pleasures in life include hiking with his wife and two sons and the smell of barbecue on the lakefront after surviving a cold winter.",
      basic: "(default) Jim Phelps is a science reporter for The Gazette Star. His coverage of energy and the environment has appeared in the Dallas Morning News, The Atlantic and Newsweek. He began his career at the Denver Post, where he was part of a team that won a Pulitzer Prize for their story about the pollution of popular hot springs in Aspen. He graduated with a journalism degree from Vanderbilt University and served as editor-in-chief of the student newspaper."
    },
    image: {
      src: "/images/author-image.jpg",
      alt: "(default) Author Image"
    }
  },
  pubdate: "(default) Aug. 6, 2019",
  siteName: "(default) The Gazette Star"
}; 