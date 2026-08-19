const http = require('node:http');
const fs = require('node:fs');
const path = require('node:path');
const { URL } = require('node:url');

const PORT = Number(process.env.PORT) || 3000;
const ROOT = __dirname;
const DATA_DIR = path.join(ROOT, 'data');
const MESSAGES_FILE = path.join(DATA_DIR, 'messages.json');

const MIME_TYPES = {
  '.css': 'text/css; charset=utf-8',
  '.html': 'text/html; charset=utf-8',
  '.js': 'text/javascript; charset=utf-8',
  '.pdf': 'application/pdf',
  '.png': 'image/png',
  '.jpg': 'image/jpeg',
  '.svg': 'image/svg+xml',
  '.woff2': 'font/woff2'
};

function sendJson(response, statusCode, payload) {
  response.writeHead(statusCode, { 'Content-Type': 'application/json; charset=utf-8' });
  response.end(JSON.stringify(payload));
}

function readRequestBody(request) {
  return new Promise((resolve, reject) => {
    let body = '';
    request.setEncoding('utf8');

    request.on('data', chunk => {
      body += chunk;
      if (body.length > 1024 * 1024) {
        reject(new Error('Request body is too large.'));
        request.destroy();
      }
    });
    request.on('end', () => resolve(body));
    request.on('error', reject);
  });
}

function saveMessage(message) {
  fs.mkdirSync(DATA_DIR, { recursive: true });
  let messages = [];

  if (fs.existsSync(MESSAGES_FILE)) {
    messages = JSON.parse(fs.readFileSync(MESSAGES_FILE, 'utf8'));
  }

  messages.push(message);
  fs.writeFileSync(MESSAGES_FILE, JSON.stringify(messages, null, 2) + '\n');
}

function serveStatic(request, response) {
  const requestUrl = new URL(request.url, `http://${request.headers.host || 'localhost'}`);
  const requestedPath = requestUrl.pathname === '/' ? '/index.html' : requestUrl.pathname;
  const filePath = path.resolve(ROOT, `.${requestedPath}`);

  if (!filePath.startsWith(ROOT + path.sep)) {
    response.writeHead(403);
    response.end('Forbidden');
    return;
  }

  fs.readFile(filePath, (error, content) => {
    if (error) {
      response.writeHead(error.code === 'ENOENT' ? 404 : 500);
      response.end(error.code === 'ENOENT' ? 'Not found' : 'Server error');
      return;
    }

    response.writeHead(200, {
      'Content-Type': MIME_TYPES[path.extname(filePath).toLowerCase()] || 'application/octet-stream'
    });
    response.end(content);
  });
}

const server = http.createServer(async (request, response) => {
  const requestUrl = new URL(request.url, `http://${request.headers.host || 'localhost'}`);

  if (request.method === 'POST' && requestUrl.pathname === '/api/contact') {
    try {
      const payload = JSON.parse(await readRequestBody(request));
      const name = String(payload.name || '').trim();
      const email = String(payload.email || '').trim();
      const message = String(payload.message || '').trim();

      if (!name || !email || !message) {
        sendJson(response, 400, { error: 'Please complete all fields.' });
        return;
      }
      if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
        sendJson(response, 400, { error: 'Please enter a valid email address.' });
        return;
      }
      if (name.length > 100 || email.length > 254 || message.length > 5000) {
        sendJson(response, 400, { error: 'One or more fields are too long.' });
        return;
      }

      saveMessage({
        id: Date.now().toString(36),
        name,
        email,
        message,
        createdAt: new Date().toISOString()
      });
      sendJson(response, 201, { message: 'Your message has been received.' });
    } catch (error) {
      sendJson(response, 400, { error: error.message === 'Request body is too large' ? error.message : 'Invalid request.' });
    }
    return;
  }

  if (request.method === 'GET' || request.method === 'HEAD') {
    serveStatic(request, response);
    return;
  }

  sendJson(response, 405, { error: 'Method not allowed.' });
});

server.listen(PORT, () => {
  console.log(`Portfolio running at http://localhost:${PORT}`);
});
