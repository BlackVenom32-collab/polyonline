// api/global/stats.js
import { list } from '@vercel/blob';

export default async function handler(req, res) {
  // CORS
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
  
  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }
  
  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' });
  }
  
  try {
    // Get all user files
    const { blobs } = await list({ prefix: 'users/' });
    
    if (!blobs || blobs.length === 0) {
      return res.status(200).json({
        totalUsers: 0,
        totalProfit: 0,
        totalTrades: 0,
        activeUsers: 0
      });
    }
    
    // Fetch all user data and calculate totals
    let totalUsers = 0;
    let totalProfit = 0;
    let totalTrades = 0;
    let activeUsers = 0;
    const oneDayAgo = new Date();
    oneDayAgo.setDate(oneDayAgo.getDate() - 1);
    
    for (const blob of blobs) {
      try {
        const response = await fetch(blob.url);
        if (!response.ok) continue;
        
        const userData = await response.json();
        totalUsers++;
        
        // Add to totals
        totalProfit += userData.stats?.totalProfit || 0;
        totalTrades += userData.stats?.totalTrades || 0;
        
        // Check if active (logged in within last 24 hours)
        if (userData.lastLogin) {
          const lastLogin = new Date(userData.lastLogin);
          if (lastLogin > oneDayAgo) {
            activeUsers++;
          }
        }
      } catch (e) {
        console.error('Error loading user:', e);
      }
    }
    
    return res.status(200).json({
      totalUsers,
      totalProfit: Math.round(totalProfit * 100) / 100, // Round to 2 decimals
      totalTrades,
      activeUsers
    });
    
  } catch (error) {
    console.error('Global stats error:', error);
    return res.status(500).json({ 
      error: 'Internal server error',
      details: error.message 
    });
  }
}
