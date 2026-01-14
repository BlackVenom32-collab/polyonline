// api/stats/update.js
const { kv } = require('@vercel/kv');
const crypto = require('crypto');

module.exports = async (req, res) => {
  // CORS headers
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
    
    // Get user
    const userData = await kv.get(`user:${username.toLowerCase()}`);
    
    if (!userData) {
      return res.status(401).json({ error: 'User not found' });
    }
    
    const user = typeof userData === 'string' ? JSON.parse(userData) : userData;
    
    // Verify password
    const passwordHash = crypto
      .createHash('sha256')
      .update(password)
      .digest('hex');
    
    if (user.passwordHash !== passwordHash) {
      return res.status(401).json({ error: 'Invalid credentials' });
    }
    
    // Update stats
    user.stats = {
      ...user.stats,
      ...stats,
      lastUpdated: new Date().toISOString()
    };
    
    await kv.set(`user:${username.toLowerCase()}`, JSON.stringify(user));
    
    return res.status(200).json({
      success: true,
      message: 'Stats updated successfully'
    });
    
  } catch (error) {
    console.error('Stats update error:', error);
    return res.status(500).json({ error: 'Internal server error' });
  }
};
