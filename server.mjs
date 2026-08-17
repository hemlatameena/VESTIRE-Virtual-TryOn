import http from 'node:http';
import fs from 'node:fs/promises';
import os from 'node:os';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { Client, handle_file } from '@gradio/client';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const PORT = Number(process.env.PORT || 3000);
const IDM_SPACE = process.env.IDM_VTON_SPACE || 'yisol/IDM-VTON';
const MAX_JSON_BYTES = 15 * 1024 * 1024;

const mimeTypes = {
  '.html': 'text/html; charset=utf-8',
  '.css': 'text/css; charset=utf-8',
  '.js': 'text/javascript; charset=utf-8',
  '.json': 'application/json; charset=utf-8',
};

function send(res, status, body, type='application/json; charset=utf-8') {
  res.writeHead(status, { 'Content-Type': type, 'Cache-Control': 'no-store' });
  res.end(body);
}

async function readBody(req) {
  return new Promise((resolve, reject) => {
    let size = 0;
    const chunks = [];
    req.on('data', chunk => {
      size += chunk.length;
      if (size > MAX_JSON_BYTES) {
        reject(Object.assign(new Error('Request is too large. Please use an image under 10 MB.'), { status: 413 }));
        req.destroy();
        return;
      }
      chunks.push(chunk);
    });
    req.on('end', () => resolve(Buffer.concat(chunks).toString('utf8')));
    req.on('error', reject);
  });
}

function parseDataUrl(dataUrl) {
  const match = /^data:(image\/(?:png|jpe?g|webp));base64,([A-Za-z0-9+/=]+)$/i.exec(dataUrl || '');
  if (!match) throw new Error('Uploaded image must be PNG, JPG/JPEG, or WEBP.');
  const mime = match[1].toLowerCase().replace('jpg', 'jpeg');
  const ext = mime === 'image/jpeg' ? 'jpg' : mime.split('/')[1];
  return { mime, ext, buffer: Buffer.from(match[2], 'base64') };
}

async function downloadToTemp(url, dir, filename) {
  const parsed = new URL(url);
  if (!['http:', 'https:'].includes(parsed.protocol)) throw new Error('Invalid product image URL.');
  const response = await fetch(url, { redirect: 'follow' });
  if (!response.ok) throw new Error(`Could not fetch the selected product image (${response.status}).`);
  const mime = (response.headers.get('content-type') || '').split(';')[0].toLowerCase();
  if (!['image/png', 'image/jpeg', 'image/webp'].includes(mime)) {
    throw new Error('Selected product image is not a supported image type.');
  }
  const ext = mime === 'image/jpeg' ? 'jpg' : mime.split('/')[1];
  const file = path.join(dir, `${filename}.${ext}`);
  await fs.writeFile(file, Buffer.from(await response.arrayBuffer()));
  return file;
}

function toImageEditorValue(fileRef) {
  // Gradio's ImageEditor expects a dict containing the background image.
  return {
    background: fileRef,
    layers: [],
    composite: fileRef,
  };
}

async function resultToDataUrl(value) {
  if (!value) throw new Error('IDM-VTON returned no generated image.');
  if (typeof value === 'string') {
    if (value.startsWith('data:image/')) return value;
    if (/^https?:\/\//i.test(value)) {
      const r = await fetch(value);
      if (!r.ok) throw new Error(`Could not download generated image (${r.status}).`);
      const mime = (r.headers.get('content-type') || 'image/png').split(';')[0];
      return `data:${mime};base64,${Buffer.from(await r.arrayBuffer()).toString('base64')}`;
    }
    const buf = await fs.readFile(value);
    return `data:image/png;base64,${buf.toString('base64')}`;
  }
  const candidate = value.url || value.path || value.image || value.file?.url || value.file?.path;
  if (!candidate) throw new Error('IDM-VTON returned an unexpected image format.');
  return resultToDataUrl(candidate);
}

async function tryOn(req, res) {
  let body;
  try {
    body = JSON.parse(await readBody(req));
  } catch (error) {
    return send(res, error.status || 400, JSON.stringify({ error: error.message || 'Invalid request.' }));
  }

  let tempDir;
  try {
    const person = parseDataUrl(body.personImage);
    const productUrl = String(body.productImage || '');
    const productName = String(body.productName || 'selected garment').slice(0, 160);
    tempDir = await fs.mkdtemp(path.join(os.tmpdir(), 'vestire-idmvton-'));

    const personPath = path.join(tempDir, `person.${person.ext}`);
    await fs.writeFile(personPath, person.buffer);
    const garmentPath = await downloadToTemp(productUrl, tempDir, 'garment');

    console.log(`IDM-VTON request: person=${person.buffer.length} bytes, garment=${path.basename(garmentPath)}, space=${IDM_SPACE}`);
    const app = await Client.connect(IDM_SPACE);

    const humanEditor = toImageEditorValue(handle_file(personPath));
    const garmentFile = handle_file(garmentPath);

    const result = await app.predict('/tryon', [
      humanEditor,
      garmentFile,
      productName,
      true,   // auto mask
      false,  // no auto crop
      30,     // denoise steps
      42,     // deterministic seed
    ]);

    const image = await resultToDataUrl(result?.data?.[0]);
    console.log('IDM-VTON generation complete.');
    return send(res, 200, JSON.stringify({ image }));
  } catch (error) {
    console.error('IDM-VTON failed:', error?.stack || error);
    return send(res, 502, JSON.stringify({
      error: error?.message || 'IDM-VTON virtual try-on failed. The free Hugging Face GPU may be busy or unavailable; please try again.'
    }));
  } finally {
    if (tempDir) await fs.rm(tempDir, { recursive: true, force: true }).catch(() => {});
  }
}

const server = http.createServer(async (req, res) => {
  try {
    if (req.method === 'POST' && req.url === '/api/try-on') return await tryOn(req, res);
    if (req.method !== 'GET') return send(res, 405, JSON.stringify({ error: 'Method not allowed.' }));

    let pathname = new URL(req.url, `http://${req.headers.host || 'localhost'}`).pathname;
    if (pathname === '/') pathname = '/index.html';
    const safePath = path.normalize(pathname).replace(/^([.][.][\\/])+/, '');
    const filePath = path.join(__dirname, safePath);
    if (!filePath.startsWith(__dirname)) return send(res, 403, JSON.stringify({ error: 'Forbidden.' }));
    const file = await fs.readFile(filePath);
    const ext = path.extname(filePath).toLowerCase();
    res.writeHead(200, { 'Content-Type': mimeTypes[ext] || 'application/octet-stream' });
    res.end(file);
  } catch (error) {
    if (error.code === 'ENOENT') return send(res, 404, 'Not found', 'text/plain; charset=utf-8');
    console.error(error);
    send(res, 500, 'Server error', 'text/plain; charset=utf-8');
  }
});

server.listen(PORT, () => {
  console.log(`VESTIRE Phase 2 running at http://localhost:${PORT}`);
  console.log(`Virtual try-on engine: IDM-VTON via Hugging Face Space (${IDM_SPACE})`);
  console.log('OpenAI is not used by this build.');
});
