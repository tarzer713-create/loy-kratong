const http = require('http');
const fs = require('fs');
const path = require('path');

const root = __dirname;
const port = Number(process.env.PORT || 3000);
const users = new Map();
let sequence = 0;
const events = [];

function sendJson(response, status, value) {
  response.writeHead(status, {
    'Content-Type': 'application/json; charset=utf-8',
    'Cache-Control': 'no-store',
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Methods': 'GET,POST,OPTIONS',
    'Access-Control-Allow-Headers': '*'
  });
  response.end(JSON.stringify(value));
}

function readJson(request) {
  return new Promise((resolve, reject) => {
    let body = '';
    request.on('data', chunk => {
      body += chunk;
      if (body.length > 300000) {
        reject(new Error('payload too large'));
        request.destroy();
      }
    });
    request.on('end', () => {
      try { resolve(body ? JSON.parse(body) : {}); }
      catch (error) { reject(error); }
    });
  });
}

function activeUsers() {
  const now = Date.now();
  for (const [id, seen] of users) if (now - seen > 30000) users.delete(id);
  return users.size;
}

const server = http.createServer(async (request, response) => {
  const url = new URL(request.url, `http://${request.headers.host || 'localhost'}`);

  if (request.method === 'OPTIONS') {
    response.writeHead(204, {
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Headers': 'Content-Type',
      'Access-Control-Allow-Methods': 'GET,POST,OPTIONS'
    });
    return response.end();
  }

  if (request.method === 'POST' && url.pathname === '/api/heartbeat') {
    try {
      const body = await readJson(request);
      if (!body.id) return sendJson(response, 400, { error: 'missing id' });
      users.set(String(body.id).slice(0, 100), Date.now());
      return sendJson(response, 200, { users: activeUsers() });
    } catch { return sendJson(response, 400, { error: 'invalid request' }); }
  }

  if (request.method === 'POST' && url.pathname === '/api/action') {
    try {
      const body = await readJson(request);
      if (!body.type || !body.data || typeof body.data !== 'object') {
        return sendJson(response, 400, { error: 'invalid action' });
      }
      const event = { seq: ++sequence, type: String(body.type).slice(0, 20), data: body.data };
      events.push(event);
      if (events.length > 300) events.shift();
      return sendJson(response, 200, { seq: event.seq });
    } catch { return sendJson(response, 400, { error: 'invalid request' }); }
  }

  if (request.method === 'GET' && url.pathname === '/api/state') {
    const after = Math.max(0, Number(url.searchParams.get('after') || 0));
    return sendJson(response, 200, {
      users: activeUsers(),
      sequence,
      events: events.filter(event => event.seq > after)
    });
  }

  let pathname;
  try { pathname = decodeURIComponent(url.pathname); }
  catch { return sendJson(response, 400, { error: 'bad path' }); }
  if (pathname === '/') pathname = '/index.html';
  const file = path.resolve(root, '.' + pathname);
  if (file !== root && !file.startsWith(root + path.sep)) return sendJson(response, 403, { error: 'forbidden' });

  fs.readFile(file, (error, data) => {
    if (error) return sendJson(response, 404, { error: 'not found' });
    const type = {
      '.html': 'text/html; charset=utf-8',
      '.js': 'text/javascript; charset=utf-8',
      '.css': 'text/css; charset=utf-8',
      '.mp3': 'audio/mpeg'
    }[path.extname(file)] || 'application/octet-stream';
    response.writeHead(200, { 'Content-Type': type, 'Cache-Control': 'no-cache' });
    response.end(data);
  });
});

server.listen(port, '0.0.0.0', () => {
  console.log(`ลอยกระทงออนไลน์ที่ http://localhost:${port}`);
});
