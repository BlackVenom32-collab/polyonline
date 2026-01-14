// api/admin/users.js
const { list, download } = require('@vercel/blob');

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
    
    // Get all user files
    const { blobs } = await list({ prefix: 'users/' });
    
    if (!blobs || blobs.length === 0) {
      return res.status(200).json({ users: [] });
    }
    
    // Download all user data
    const users = [];
    for (const blob of blobs) {
      try {
        const userBlob = await download(blob.url);
        const userData = await userBlob.json();
        
        users.push({
          username: userData.username,
          email: userData.email,
          role: userData.role,
          theme: userData.theme,
          createdAt: userData.createdAt,
          lastLogin: userData.lastLogin,
          stats: userData.stats
        });
      } catch (e) {
        console.error('Error loading user:', e);
      }
    }
    
    return res.status(200).json({ users });
    
  } catch (error) {
    console.error('Admin users error:', error);
    return res.status(500).json({ error: 'Internal server error' });
  }
};
