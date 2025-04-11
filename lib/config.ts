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

export interface ArticleConfig {
  author: AuthorConfig;
  pubdate: string;
  siteName: string;
}

export const defaultConfig: ArticleConfig = {
  author: {
    name: "Jim Phelps",
    bio: {
      personal: "<p>Jim Phelps is a science reporter for The Gazette Star. His coverage of energy and the environment has appeared in the Dallas Morning News, The Atlantic and Newsweek. A Colorado native and life-long Broncos fan, he began his career at the Denver Post, where he was part of a team that won a Pulitzer Prize for their story about the pollution of popular hot springs in Aspen. He graduated with a journalism degree from Vanderbilt University where he served as the editor-in-chief of the student newspaper. His simple pleasures in life include hiking with his wife and two sons and the smell of barbecue on the lakefront after surviving a cold winter.</p>",
      basic: "<p>Jim Phelps is a science reporter for The Gazette Star. His coverage of energy and the environment has appeared in the Dallas Morning News, The Atlantic and Newsweek. He began his career at the Denver Post, where he was part of a team that won a Pulitzer Prize for their story about the pollution of popular hot springs in Aspen. He graduated with a journalism degree from Vanderbilt University and served as editor-in-chief of the student newspaper.</p>"
    },
    image: {
      src: "/images/author-image.jpg",
      alt: "Author Image"
    }
  },
  pubdate: "Aug. 6, 2019",
  siteName: "The Gazette Star"
}; 