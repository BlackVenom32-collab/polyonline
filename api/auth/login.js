// api/auth/login.js
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
    const { username, password } = req.body;
    
    if (!username || !password) {
      return res.status(400).json({ error: 'Username and password required' });
    }
    
    // Get user
    const userData = await kv.get(`user:${username.toLowerCase()}`);
    
    if (!userData) {
      return res.status(401).json({ error: 'Invalid credentials' });
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
    
    // Decrypt private key
    const privateKey = Buffer.from(user.encryptedPrivateKey, 'base64').toString();
    
    // Update last login
    user.lastLogin = new Date().toISOString();
    await kv.set(`user:${username.toLowerCase()}`, JSON.stringify(user));
    
    // Return user data
    return res.status(200).json({
      success: true,
      user: {
        username: user.username,
        email: user.email,
        privateKey: privateKey,
        funderAddress: user.funderAddress,
        theme: user.theme,
        role: user.role,
        stats: user.stats
      }
    });
    
  } catch (error) {
    console.error('Login error:', error);
    return res.status(500).json({ error: 'Internal server error' });
  }
};
