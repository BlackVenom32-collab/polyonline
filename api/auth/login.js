// api/auth/login.js
const { head, download } = require('@vercel/blob');
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
    const { username, password } = req.body;
    
    if (!username || !password) {
      return res.status(400).json({ error: 'Username and password required' });
    }
    
    // Get user from Blob Storage
    let userBlob;
    try {
      userBlob = await download(`users/${username.toLowerCase()}.json`);
    } catch (e) {
      return res.status(401).json({ error: 'Invalid credentials' });
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
    
    // Decrypt private key
    const privateKey = Buffer.from(userData.encryptedPrivateKey, 'base64').toString();
    
    // Update last login (we'll store it but can't update blob easily)
    userData.lastLogin = new Date().toISOString();
    
    // Return user data
    return res.status(200).json({
      success: true,
      user: {
        username: userData.username,
        email: userData.email,
        privateKey: privateKey,
        funderAddress: userData.funderAddress,
        theme: userData.theme,
        role: userData.role,
        stats: userData.stats
      }
    });
    
  } catch (error) {
    console.error('Login error:', error);
    return res.status(500).json({ error: 'Internal server error' });
  }
};
