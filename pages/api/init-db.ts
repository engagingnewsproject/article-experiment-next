import { createArticle } from '../../lib/firestore';
import type { NextApiRequest, NextApiResponse } from 'next';

// Helper function to generate slug from title
const generateSlug = (title: string): string => {
  return title
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/(^-|-$)/g, '');
};

const sampleArticles = [
  {
    title: "Solidarity: Understanding Community Support",
    content: "In times of crisis, communities often come together to support one another...",
    status: "published" as const,
    slug: "solidarity-understanding-community-support",
    metadata: {
      author: "Jane Smith",
      category: "solidarity",
      tags: ["community", "support", "social"]
    }
  },
  {
    title: "Monitorial Citizenship in the Digital Age",
    content: "The concept of monitorial citizenship has evolved with the rise of digital media...",
    status: "published" as const,
    slug: "monitorial-citizenship-in-the-digital-age",
    metadata: {
      author: "John Doe",
      category: "monitorial",
      tags: ["citizenship", "digital", "media"]
    }
  },
  {
    title: "Understanding Inflation: Causes and Effects",
    content: "Inflation is a complex economic phenomenon that affects everyone...",
    status: "published" as const,
    slug: "understanding-inflation-causes-and-effects",
    metadata: {
      author: "Alice Johnson",
      category: "inflation",
      tags: ["economics", "finance", "markets"]
    }
  },
  {
    title: "The Future of Web Development",
    content: "Web development continues to evolve at a rapid pace...",
    status: "published" as const,
    slug: "the-future-of-web-development",
    metadata: {
      author: "Bob Wilson",
      category: "technology",
      tags: ["web", "development", "future"]
    }
  }
];

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  if (req.method !== 'POST') {
    return res.status(405).json({ message: 'Method not allowed' });
  }

  try {
    const results = await Promise.all(
      sampleArticles.map(article => createArticle(article))
    );
    
    res.status(200).json({ 
      success: true, 
      message: 'Database initialized successfully',
      articleIds: results
    });
  } catch (error) {
    console.error('Error initializing database:', error);
    res.status(500).json({ 
      success: false, 
      message: 'Error initializing database',
      error: error instanceof Error ? error.message : 'Unknown error'
    });
  }
} 