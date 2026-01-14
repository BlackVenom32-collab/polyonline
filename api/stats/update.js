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
    
    const now = new Date().toISOString();
    const oldStats = { ...userData.stats };
    
    // Update stats
    userData.stats = {
      ...userData.stats,
      ...stats,
      lastUpdated: now
    };
    
    // Track activities based on stat changes
    if (!userData.activities) {
      userData.activities = [];
    }
    
    // Check for new trades
    const newTrades = (userData.stats.totalTrades || 0) - (oldStats.totalTrades || 0);
    if (newTrades > 0) {
      // Check which market had activity
      const markets = [
        { name: 'BTC', profit: 'btcProfit', trades: 'btcTrades' },
        { name: 'ETH', profit: 'ethProfit', trades: 'ethTrades' },
        { name: 'SOL', profit: 'solProfit', trades: 'solTrades' },
        { name: 'XRP', profit: 'xrpProfit', trades: 'xrpTrades' }
      ];
      
      for (const market of markets) {
        const oldTrades = oldStats[market.trades] || 0;
        const newMarketTrades = (userData.stats[market.trades] || 0) - oldTrades;
        
        if (newMarketTrades > 0) {
          const profitChange = (userData.stats[market.profit] || 0) - (oldStats[market.profit] || 0);
          const profitStr = profitChange >= 0 
            ? `+$${profitChange.toFixed(2)}` 
            : `-$${Math.abs(profitChange).toFixed(2)}`;
          
          userData.activities.unshift({
            type: 'trade',
            message: `Gewinn: ${profitStr} (${market.name} Market)`,
            timestamp: now
          });
        }
      }
    }
    
    // Check for significant profit changes (even without new trades)
    const profitChange = (userData.stats.totalProfit || 0) - (oldStats.totalProfit || 0);
    if (Math.abs(profitChange) > 0.01 && newTrades === 0) {
      const profitStr = profitChange >= 0 
        ? `+$${profitChange.toFixed(2)}` 
        : `-$${Math.abs(profitChange).toFixed(2)}`;
      
      userData.activities.unshift({
        type: 'profit_update',
        message: `Profit Update: ${profitStr}`,
        timestamp: now
      });
    }
    
    // Keep only last 50 activities
    if (userData.activities.length > 50) {
      userData.activities = userData.activities.slice(0, 50);
    }
    
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
