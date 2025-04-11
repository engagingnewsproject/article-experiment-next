export interface Article {
  id: string;
  title: string;
  content: string;
  pubdate: string;
  author: {
    name: string;
    photo?: string;
    bio?: string;
  };
  featuredImage?: string;
  comments_display: boolean;
  anonymous: boolean;
  explain_box?: string[];
  where_written?: string;
  editor?: string;
  corrections?: string;
  version_history?: string;
  comments?: Array<{
    userId: string;
    content: string;
    timestamp?: string;
  }>;
  explainBox?: {
    enabled: boolean;
    content?: string;
  };
  metadata?: {
    who_spoke_to?: string[];
    where_written?: string;
    editor?: string;
    corrections?: string;
    version_history?: string;
    category?: string;
    tags?: string[];
  };
  slug?: string;
  createdAt?: typeof Timestamp;
  updatedAt?: typeof Timestamp;
  status?: 'draft' | 'published';
} 