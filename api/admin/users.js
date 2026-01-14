// api/admin/users.js
const { kv } = require('@vercel/kv');
const crypto = require('crypto');

// ADMIN PASSWORD - ÄNDERE DAS!
const ADMIN_PASSWORD = 'admin123';  // <-- HIER ÄNDERN!

module.exports = async (req, res) => {
  // CORS headers
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');
  
  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }
  
  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' });
  }
  
  try {
    // Check admin auth
    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return res.status(401).json({ error: 'Unauthorized' });
    }
    
    const token = authHeader.substring(7);
    
    if (token !== ADMIN_PASSWORD) {
      return res.status(401).json({ error: 'Invalid admin password' });
    }
    
    // Get all usernames
    const usernames = await kv.smembers('users');
    
    if (!usernames || usernames.length === 0) {
      return res.status(200).json({ users: [] });
    }
    
    // Get all user data
    const users = [];
    for (const username of usernames) {
      const userData = await kv.get(`user:${username}`);
      if (userData) {
        const user = typeof userData === 'string' ? JSON.parse(userData) : userData;
        users.push({
          username: user.username,
          email: user.email,
          role: user.role,
          theme: user.theme,
          createdAt: user.createdAt,
          lastLogin: user.lastLogin,
          stats: user.stats
        });
      }
    }
    
    return res.status(200).json({ users });
    
  } catch (error) {
    console.error('Admin users error:', error);
    return res.status(500).json({ error: 'Internal server error' });
  }
};
