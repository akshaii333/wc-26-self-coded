const API_BASE = 'https://api.football-data.org/v4';
const API_KEY = process.env.FOOTBALL_DATA_KEY || 'c195099010824ca28d43d228d541ffba';

function sendJson(res, statusCode, payload) {
  res.statusCode = statusCode;
  res.setHeader('Content-Type', 'application/json; charset=utf-8');
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.end(JSON.stringify(payload));
}

async function readBody(request) {
  const chunks = [];
  for await (const chunk of request) {
    chunks.push(chunk);
  }
  return Buffer.concat(chunks).toString('utf8');
}

export default async function handler(request, response) {
  if (request.method === 'OPTIONS') {
    response.statusCode = 204;
    response.setHeader('Access-Control-Allow-Origin', '*');
    response.setHeader('Access-Control-Allow-Methods', 'GET, OPTIONS');
    response.setHeader('Access-Control-Allow-Headers', 'Content-Type');
    response.end();
    return;
  }

  const url = new URL(request.url || '/', 'http://localhost');
  const path = url.pathname.replace(/^\/api\/?/, '');

  if (path === 'health') {
    sendJson(response, 200, { ok: true });
    return;
  }

  const upstreamUrl = new URL(`${API_BASE}/${path}`);
  url.searchParams.forEach((value, key) => upstreamUrl.searchParams.set(key, value));

  try {
    const upstream = await fetch(upstreamUrl, {
      method: request.method,
      headers: {
        'X-Auth-Token': API_KEY,
        'User-Agent': 'wc26-vercel-proxy',
      },
      redirect: 'follow',
    });

    const contentType = upstream.headers.get('content-type') || 'application/json; charset=utf-8';
    const body = await upstream.text();

    response.statusCode = upstream.status;
    response.setHeader('Content-Type', contentType);
    response.setHeader('Access-Control-Allow-Origin', '*');
    response.end(body);
  } catch (error) {
    sendJson(response, 500, { error: error?.message || 'Proxy request failed' });
  }
}
