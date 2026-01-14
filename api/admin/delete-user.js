// api/admin/delete-user.js
import { del, head } from '@vercel/blob';

// ADMIN PASSWORD - MUSS MIT users.js ÜBEREINSTIMMEN!
const ADMIN_PASSWORD = 'admin123';  // <-- HIER ÄNDERN!

export default async function handler(req, res) {
  // CORS
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'DELETE, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');
  
  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }
  
  if (req.method !== 'DELETE') {
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
    
    const { username } = req.body;
    
    if (!username) {
      return res.status(400).json({ error: 'Username required' });
    }
    
    const usernameLower = username.toLowerCase();
    
    // Check if user exists
    try {
      await head(`users/${usernameLower}.json`);
    } catch (e) {
      return res.status(404).json({ error: 'User not found' });
    }
    
    // Delete user blob
    await del(`users/${usernameLower}.json`);
    
    console.log(`User deleted by admin: ${usernameLower}`);
    
    return res.status(200).json({
      success: true,
      message: 'User deleted successfully'
    });
    
  } catch (error) {
    console.error('Delete user error:', error);
    return res.status(500).json({ 
      error: 'Internal server error',
      details: error.message 
    });
  }
}
