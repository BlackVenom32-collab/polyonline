// api/stats/update.js
const { download, put } = require('@vercel/blob');
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
    let userBlob;
    try {
      userBlob = await download(`users/${username.toLowerCase()}.json`);
    } catch (e) {
      return res.status(401).json({ error: 'User not found' });
    }
    
    const userData = await userBlob.json();
    
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
      `users/${username.toLowerCase()}.json`,
      JSON.stringify(userData),
      { access: 'public', addRandomSuffix: false }
    );
    
    return res.status(200).json({
      success: true,
      message: 'Stats updated successfully'
    });
    
  } catch (error) {
    console.error('Stats update error:', error);
    return res.status(500).json({ error: 'Internal server error' });
  }
};
