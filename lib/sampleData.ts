import { db } from './firebase';
import { collection, addDoc, serverTimestamp } from 'firebase/firestore';

export const createSampleData = async () => {
  // Sample Article
  const articleRef = await addDoc(collection(db, 'articles'), {
    title: "The Future of Web Development",
    content: "Web development has evolved significantly over the years. From static HTML pages to dynamic, interactive applications, the web continues to push boundaries...",
    createdAt: serverTimestamp(),
    updatedAt: serverTimestamp(),
    status: "published",
    metadata: {
      author: "John Doe",
      category: "Technology",
      tags: ["web development", "javascript", "react"]
    }
  });

  const articleId = articleRef.id;

  // Sample Comments
  await addDoc(collection(db, 'comments'), {
    articleId,
    content: "Great article! I especially liked the section about modern frameworks.",
    createdAt: serverTimestamp(),
    status: "approved",
    metadata: {
      userAgent: "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7)",
      ipAddress: "192.168.1.1"
    }
  });

  await addDoc(collection(db, 'comments'), {
    articleId,
    content: "I have a question about the performance comparison section.",
    createdAt: serverTimestamp(),
    status: "pending",
    metadata: {
      userAgent: "Mozilla/5.0 (Windows NT 10.0; Win64; x64)",
      ipAddress: "192.168.1.2"
    }
  });

  // Sample User Interactions
  await addDoc(collection(db, 'userInteractions'), {
    articleId,
    type: "view",
    timestamp: serverTimestamp(),
    metadata: {
      userAgent: "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7)",
      ipAddress: "192.168.1.1",
      referrer: "https://google.com"
    }
  });

  await addDoc(collection(db, 'userInteractions'), {
    articleId,
    type: "share",
    timestamp: serverTimestamp(),
    metadata: {
      userAgent: "Mozilla/5.0 (Windows NT 10.0; Win64; x64)",
      ipAddress: "192.168.1.2",
      referrer: "https://twitter.com"
    }
  });

  return articleId;
}; 