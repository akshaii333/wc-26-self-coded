import http from 'http';
import https from 'https';
import { URL } from 'url';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const PORT = process.env.PORT ? Number(process.env.PORT) : 8787;
const API_KEY = process.env.FOOTBALL_DATA_KEY || 'c195099010824ca28d43d228d541ffba';
const API_BASE = 'https://api.football-data.org/v4';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const PAGES_DIR = path.join(__dirname, 'wc26 pages');

function sendJson(res, statusCode, payload) {
  const body = JSON.stringify(payload);
  res.writeHead(statusCode, {
    'Content-Type': 'application/json; charset=utf-8',
    'Access-Control-Allow-Origin': '*',
  });
  res.end(body);
}

function proxyRequest(pathname, searchParams, res) {
  const upstreamPath = pathname.replace(/^\/api\/?/, '');
  const upstreamUrl = new URL(`${API_BASE}/${upstreamPath}`);
  searchParams.forEach((value, key) => upstreamUrl.searchParams.set(key, value));

  const fetchWithRedirects = (url, redirectsLeft) => {
    const request = https.request(
      url,
      {
        method: 'GET',
        headers: {
          'X-Auth-Token': API_KEY,
          'User-Agent': 'wc26-self-coded-proxy',
        },
      },
      (upstreamRes) => {
        const statusCode = upstreamRes.statusCode || 500;
        const redirectLocation = upstreamRes.headers.location;

        if (
          redirectLocation &&
          [301, 302, 303, 307, 308].includes(statusCode) &&
          redirectsLeft > 0
        ) {
          const nextUrl = new URL(redirectLocation, url);
          upstreamRes.resume();
          fetchWithRedirects(nextUrl, redirectsLeft - 1);
          return;
        }

        let data = '';
        upstreamRes.setEncoding('utf8');
        upstreamRes.on('data', (chunk) => {
          data += chunk;
        });
        upstreamRes.on('end', () => {
          const headers = {
            'Content-Type': upstreamRes.headers['content-type'] || 'application/json; charset=utf-8',
            'Access-Control-Allow-Origin': '*',
          };
          res.writeHead(statusCode, headers);
          res.end(data);
        });
      }
    );

    request.on('error', (error) => {
      sendJson(res, 500, { error: error.message });
    });

    request.end();
  };

  fetchWithRedirects(upstreamUrl, 3);
}

const server = http.createServer((req, res) => {
  if (req.method === 'OPTIONS') {
    res.writeHead(204, {
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'GET, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type',
    });
    res.end();
    return;
  }

  const requestUrl = new URL(req.url || '/', 'http://localhost');

  if (requestUrl.pathname === '/health') {
    sendJson(res, 200, { ok: true });
    return;
  }

  if (requestUrl.pathname.startsWith('/api/')) {
    proxyRequest(requestUrl.pathname, requestUrl.searchParams, res);
    return;
  }

    // Serve static files from wc26 pages directory
    let filePath = requestUrl.pathname === '/' ? 'code homepage.html' : requestUrl.pathname;
    filePath = path.join(PAGES_DIR, decodeURIComponent(filePath));

    // Security: prevent directory traversal
    if (!filePath.startsWith(PAGES_DIR)) {
      sendJson(res, 403, { error: 'Forbidden' });
      return;
    }

    // Serve the file
    fs.readFile(filePath, (err, data) => {
      if (err) {
        sendJson(res, 404, { error: 'File not found' });
        return;
      }
      const ext = path.extname(filePath).toLowerCase();
      const contentTypeMap = {
        '.html': 'text/html; charset=utf-8',
        '.css': 'text/css',
        '.js': 'application/javascript',
        '.json': 'application/json',
        '.png': 'image/png',
        '.jpg': 'image/jpeg',
        '.jpeg': 'image/jpeg',
        '.gif': 'image/gif',
        '.svg': 'image/svg+xml',
      };
      const contentType = contentTypeMap[ext] || 'application/octet-stream';
      res.writeHead(200, {
        'Content-Type': contentType,
        'Access-Control-Allow-Origin': '*',
      });
      res.end(data);
    });
});

server.listen(PORT, () => {
  console.log(`UEFA proxy listening on http://127.0.0.1:${PORT}`);
  console.log('Example: http://127.0.0.1:8787/api/competitions/CL/standings?season=2025');
});
