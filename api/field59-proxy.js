/**
 * Vercel Serverless Function to proxy Field59 API requests
 * This avoids CORS issues by making server-side requests to Field59 API
 */

const https = require('https');

module.exports = async (req, res) => {
  // Enable CORS
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, PATCH, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'X-Requested-With, content-type, Authorization');

  // Handle preflight OPTIONS request
  if (req.method === 'OPTIONS') {
    res.status(200).end();
    return;
  }

  // Extract the Field59 path from query parameter
  const { path } = req.query;
  if (!path) {
    res.status(400).json({ error: 'Missing path parameter' });
    return;
  }

  // Get authorization header from the request
  const authHeader = req.headers.authorization;
  if (!authHeader) {
    res.status(401).json({ error: 'Missing Authorization header' });
    return;
  }

  // Build the full Field59 API URL
  const field59Url = `https://api.field59.com${path}`;

  console.log(`Proxying ${req.method} request to: ${field59Url}`);

  // Create options for the HTTPS request
  const options = {
    method: req.method,
    headers: {
      'Authorization': authHeader,
      'Accept': 'application/xml',
      'Content-Type': req.headers['content-type'] || 'application/x-www-form-urlencoded',
    }
  };

  // Make the request to Field59 API
  return new Promise((resolve) => {
    const proxyReq = https.request(field59Url, options, (proxyRes) => {
      let data = '';

      proxyRes.on('data', (chunk) => {
        data += chunk;
      });

      proxyRes.on('end', () => {
        // Set response headers
        res.setHeader('Content-Type', proxyRes.headers['content-type'] || 'application/xml');
        res.status(proxyRes.statusCode);
        res.send(data);
        resolve();
      });
    });

    proxyReq.on('error', (error) => {
      console.error('Proxy request error:', error);
      res.status(500).json({ error: 'Failed to proxy request to Field59', details: error.message });
      resolve();
    });

    // If there's a request body (POST, PUT, etc.), write it
    if (req.body && req.method !== 'GET') {
      const bodyData = typeof req.body === 'string' ? req.body : JSON.stringify(req.body);
      proxyReq.write(bodyData);
    }

    proxyReq.end();
  });
};
