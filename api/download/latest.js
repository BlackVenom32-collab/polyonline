// api/download/latest.js
const { kv } = require('@vercel/kv');

module.exports = async (req, res) => {
  // CORS headers
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
  
  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }
  
  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' });
  }
  
  try {
    // Get latest version info
    let latestVersion = await kv.get('bot:latest_version');
    
    if (!latestVersion) {
      // Set default version info
      const defaultVersion = {
        version: 'v25',
        releaseDate: new Date().toISOString(),
        downloadUrl: 'https://github.com/YOUR_USERNAME/polymarket-bot/releases/latest',
        changelog: [
          'Cloud-connected trading bot',
          'Multi-market support (BTC, ETH, SOL, XRP)',
          '6 color themes',
          'Cloud statistics sync',
          'Admin dashboard'
        ],
        size: '2.5 MB',
        requiresAuth: true
      };
      
      await kv.set('bot:latest_version', JSON.stringify(defaultVersion));
      latestVersion = defaultVersion;
    } else if (typeof latestVersion === 'string') {
      latestVersion = JSON.parse(latestVersion);
    }
    
    return res.status(200).json(latestVersion);
    
  } catch (error) {
    console.error('Download info error:', error);
    return res.status(500).json({ error: 'Internal server error' });
  }
};
