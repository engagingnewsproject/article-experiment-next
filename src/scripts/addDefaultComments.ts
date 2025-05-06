import { updateArticleWithDefaultComments } from '@/lib/firestore';

async function addDefaultCommentsToArticle(articleId: string) {
  const defaultComments = [
    {
      content: "This article raises some interesting points about media engagement. I particularly found the discussion about user interaction patterns to be thought-provoking.",
      name: "Research Participant",
      createdAt: new Date(Date.now() - 86400000).toISOString(),
      replies: [
        {
          content: "I agree with your point about user interaction patterns. It would be interesting to see more research on this topic.",
          name: "Anonymous User",
          createdAt: new Date(Date.now() - 43200000).toISOString()
        }
      ]
    },
    {
      content: "I appreciate how this piece addresses both the challenges and opportunities in modern media consumption. The examples provided really helped illustrate the key concepts.",
      name: "Anonymous User",
      createdAt: new Date(Date.now() - 172800000).toISOString(),
      replies: []
    },
    {
      content: "As someone studying media, I found this analysis very relevant to current trends. Would love to see more content like this!",
      name: "Media Student",
      createdAt: new Date(Date.now() - 259200000).toISOString(),
      replies: [
        {
          content: "I'm also studying media! What aspects did you find most interesting?",
          name: "Research Participant",
          createdAt: new Date(Date.now() - 216000000).toISOString()
        }
      ]
    }
  ];

  try {
    await updateArticleWithDefaultComments(articleId, defaultComments);
    console.log('Successfully added default comments to article:', articleId);
  } catch (error) {
    console.error('Error adding default comments:', error);
  }
}

// Example usage:
// Replace 'your-article-id' with the actual article ID
// addDefaultCommentsToArticle('your-article-id');

export { addDefaultCommentsToArticle }; 