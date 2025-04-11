export interface Article {
  id: string;
  author: {
    name: string;
    photo?: string;
    bio?: string;
  };
  pubdate: string;
  title: string;
  featuredImage?: string;
  comments_display: boolean;
  anonymous: boolean;
  who_spoke_to?: string[];
  where_written?: string;
  editor?: string;
  corrections?: string;
  version_history?: string;
  content: string;
  comments?: Array<{
    userId: string;
    content: string;
    timestamp?: string;
  }>;
  explainBox?: {
    enabled: boolean;
    content?: string;
  };
} 