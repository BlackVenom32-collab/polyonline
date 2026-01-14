// api/auth/register.js
import { put, list } from '@vercel/blob';
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
    
    const usernameLower = username.toLowerCase();
    
    // Check if username exists
    try {
      const { blobs } = await list({ 
        prefix: `users/${usernameLower}`,
        limit: 1
      });
      
      if (blobs && blobs.length > 0) {
        return res.status(400).json({ error: 'Username already exists' });
      }
    } catch (listError) {
      console.log('List error (ok if first user):', listError.message);
    }
    
    // Hash password
    const passwordHash = crypto
      .createHash('sha256')
      .update(password)
      .digest('hex');
    
    // Encrypt private key (simple base64)
    const encryptedKey = Buffer.from(private_key).toString('base64');
    
    // Create user object
    const user = {
      username: usernameLower,
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
    
    // Save to Blob
    const blob = await put(
      `users/${usernameLower}.json`,
      JSON.stringify(user, null, 2),
      { 
        access: 'public',
        addRandomSuffix: false
      }
    );
    
    console.log('User created:', blob.url);
    
    return res.status(201).json({
      success: true,
      message: 'Account created successfully',
      username: user.username
    });
    
  } catch (error) {
    console.error('Registration error:', error);
    return res.status(500).json({ 
      error: 'Internal server error',
      details: error.message 
    });
  }
}
