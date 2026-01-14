// api/auth/login.js
import { head } from '@vercel/blob';
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
    const { username, password } = req.body;
    
    if (!username || !password) {
      return res.status(400).json({ error: 'Username and password required' });
    }
    
    const usernameLower = username.toLowerCase();
    
    // Get user blob URL
    let blobInfo;
    try {
      blobInfo = await head(`users/${usernameLower}.json`);
    } catch (e) {
      return res.status(401).json({ error: 'Invalid credentials' });
    }
    
    // Fetch user data from blob URL
    const response = await fetch(blobInfo.url);
    if (!response.ok) {
      return res.status(401).json({ error: 'Invalid credentials' });
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
    
    // Decrypt private key
    const privateKey = Buffer.from(userData.encryptedPrivateKey, 'base64').toString();
    
    console.log('User logged in:', userData.username);
    
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
    return res.status(500).json({ 
      error: 'Internal server error',
      details: error.message 
    });
  }
}
