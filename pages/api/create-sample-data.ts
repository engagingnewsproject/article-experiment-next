import { createSampleData } from '../../lib/sampleData';
import type { NextApiRequest, NextApiResponse } from 'next';

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  if (req.method !== 'POST') {
    return res.status(405).json({ message: 'Method not allowed' });
  }

  try {
    const articleId = await createSampleData();
    res.status(200).json({ 
      success: true, 
      message: 'Sample data created successfully',
      articleId 
    });
  } catch (error) {
    console.error('Error creating sample data:', error);
    res.status(500).json({ 
      success: false, 
      message: 'Error creating sample data',
      error: error instanceof Error ? error.message : 'Unknown error'
    });
  }
} 