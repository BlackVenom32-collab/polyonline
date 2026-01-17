// api/admin/edit-user.js
import { head, put } from '@vercel/blob';

// ADMIN PASSWORD - MUSS MIT users.js ÜBEREINSTIMMEN!
const ADMIN_PASSWORD = 'admin123';  // <-- HIER ÄNDERN!

export default async function handler(req, res) {
  // CORS
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'PUT, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');
  
  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }
  
  if (req.method !== 'PUT') {
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
    
    const { username, email, role, theme, stats, hwid } = req.body;
    
    if (!username) {
      return res.status(400).json({ error: 'Username required' });
    }
    
    const usernameLower = username.toLowerCase();
    
    // Check if user exists
    let blobInfo;
    try {
      blobInfo = await head(`users/${usernameLower}.json`);
    } catch (e) {
      return res.status(404).json({ error: 'User not found' });
    }
    
    // Fetch current user data
    const response = await fetch(blobInfo.url);
    if (!response.ok) {
      return res.status(404).json({ error: 'User not found' });
    }
    
    const userData = await response.json();
    
    // Update user data
    if (email) userData.email = email;
    if (role) userData.role = role;
    if (theme) userData.theme = theme;
    
    // Handle HWID Reset/Update
    // If hwid is explicitly null or empty string, we reset it.
    if (hwid === null || hwid === "") {
        userData.hwid = null;
        console.log(`HWID reset for user ${usernameLower}`);
    } else if (hwid) {
        userData.hwid = hwid;
    }
    
    if (stats) {
      userData.stats = {
        ...userData.stats,
        ...stats,
        lastUpdated: new Date().toISOString()
      };
    }
    
    // Save updated user
    await put(
      `users/${usernameLower}.json`,
      JSON.stringify(userData, null, 2),
      { 
        access: 'public',
        addRandomSuffix: false
      }
    );
    
    console.log(`User updated by admin: ${usernameLower}`);
    
    return res.status(200).json({
      success: true,
      message: 'User updated successfully'
    });
    
  } catch (error) {
    console.error('Edit user error:', error);
    return res.status(500).json({ 
      error: 'Internal server error',
      details: error.message 
    });
  }
}
