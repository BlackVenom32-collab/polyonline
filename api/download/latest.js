// api/download/latest.js
const { download, put } = require('@vercel/blob');

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
    // Try to get version info
    let versionData;
    try {
      const versionBlob = await download('config/version.json');
      versionData = await versionBlob.json();
    } catch (e) {
      // Create default version
      versionData = {
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
      
      // Save default version
      await put(
        'config/version.json',
        JSON.stringify(versionData),
        { access: 'public', addRandomSuffix: false }
      );
    }
    
    return res.status(200).json(versionData);
    
  } catch (error) {
    console.error('Download info error:', error);
    return res.status(500).json({ error: 'Internal server error' });
  }
};
