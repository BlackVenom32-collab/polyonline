// api/stats/update.js
import { head, put } from '@vercel/blob';
import crypto from 'crypto';

export default async function handler(req, res) {
  // CORS
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
  
  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }
  
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }
  
  try {
    const { username, password, stats } = req.body;
    
    if (!username || !password || !stats) {
      return res.status(400).json({ error: 'Missing required fields' });
    }
    
    const usernameLower = username.toLowerCase();
    
    // Get user blob
    let blobInfo;
    try {
      blobInfo = await head(`users/${usernameLower}.json`);
    } catch (e) {
      return res.status(401).json({ error: 'User not found' });
    }
    
    // Fetch current user data
    const response = await fetch(blobInfo.url);
    if (!response.ok) {
      return res.status(401).json({ error: 'User not found' });
    }
    
    const userData = await response.json();
    
    // Verify password
    const passwordHash = crypto
      .createHash('sha256')
      .update(password)
      .digest('hex');
    
    if (userData.passwordHash !== passwordHash) {
      return res.status(401).json({ error: 'Invalid credentials' });
    }
    
    // Update stats
    userData.stats = {
      ...userData.stats,
      ...stats,
      lastUpdated: new Date().toISOString()
    };
    
    // Save updated user
    await put(
      `users/${usernameLower}.json`,
      JSON.stringify(userData, null, 2),
      { 
        access: 'public',
        addRandomSuffix: false
      }
    );
    
    console.log('Stats updated for:', userData.username);
    
    return res.status(200).json({
      success: true,
      message: 'Stats updated successfully'
    });
    
  } catch (error) {
    console.error('Stats update error:', error);
    return res.status(500).json({ 
      error: 'Internal server error',
      details: error.message 
    });
  }
}
