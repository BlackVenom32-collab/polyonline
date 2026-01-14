// api/user/change-password.js
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
    const { username, currentPassword, newPassword } = req.body;
    
    if (!username || !currentPassword || !newPassword) {
      return res.status(400).json({ error: 'All fields required' });
    }
    
    if (newPassword.length < 6) {
      return res.status(400).json({ error: 'New password must be at least 6 characters' });
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
    
    // Verify current password
    const currentPasswordHash = crypto
      .createHash('sha256')
      .update(currentPassword)
      .digest('hex');
    
    if (userData.passwordHash !== currentPasswordHash) {
      return res.status(401).json({ error: 'Current password is incorrect' });
    }
    
    // Hash new password
    const newPasswordHash = crypto
      .createHash('sha256')
      .update(newPassword)
      .digest('hex');
    
    // Update password
    userData.passwordHash = newPasswordHash;
    
    // Save updated user
    await put(
      `users/${usernameLower}.json`,
      JSON.stringify(userData, null, 2),
      { 
        access: 'public',
        addRandomSuffix: false
      }
    );
    
    console.log('Password changed for:', userData.username);
    
    return res.status(200).json({
      success: true,
      message: 'Password changed successfully'
    });
    
  } catch (error) {
    console.error('Change password error:', error);
    return res.status(500).json({ 
      error: 'Internal server error',
      details: error.message 
    });
  }
}
