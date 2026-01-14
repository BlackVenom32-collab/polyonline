// api/auth/register.js
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
    const { username, password, email, private_key, funder_address } = req.body;
    
    // Validation
    if (!username || !password || !email || !private_key || !funder_address) {
      return res.status(400).json({ error: 'All fields required' });
    }
    
    if (username.length < 3) {
      return res.status(400).json({ error: 'Username must be at least 3 characters' });
    }
    
    if (password.length < 6) {
      return res.status(400).json({ error: 'Password must be at least 6 characters' });
    }
    
    // Check if username exists
    const existingUser = await kv.get(`user:${username.toLowerCase()}`);
    if (existingUser) {
      return res.status(400).json({ error: 'Username already exists' });
    }
    
    // Check if email exists
    const emailExists = await kv.get(`email:${email.toLowerCase()}`);
    if (emailExists) {
      return res.status(400).json({ error: 'Email already registered' });
    }
    
    // Hash password
    const passwordHash = crypto
      .createHash('sha256')
      .update(password)
      .digest('hex');
    
    // Encrypt private key
    const encryptedKey = Buffer.from(private_key).toString('base64');
    
    // Create user object
    const user = {
      username: username.toLowerCase(),
      email: email.toLowerCase(),
      passwordHash,
      encryptedPrivateKey: encryptedKey,
      funderAddress: funder_address,
      theme: 'Midnight',
      role: 'user',
      createdAt: new Date().toISOString(),
      lastLogin: null,
      stats: {
        totalProfit: 0,
        totalTrades: 0,
        winningTrades: 0,
        btcProfit: 0,
        ethProfit: 0,
        solProfit: 0,
        xrpProfit: 0
      }
    };
    
    // Save user
    await kv.set(`user:${username.toLowerCase()}`, JSON.stringify(user));
    await kv.set(`email:${email.toLowerCase()}`, username.toLowerCase());
    await kv.sadd('users', username.toLowerCase());
    
    return res.status(201).json({
      success: true,
      message: 'Account created successfully',
      username: user.username
    });
    
  } catch (error) {
    console.error('Registration error:', error);
    return res.status(500).json({ error: 'Internal server error' });
  }
};
