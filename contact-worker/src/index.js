import { EmailMessage } from 'cloudflare:email';

const ALLOWED_ORIGINS = ['https://isaachartman.com', 'https://www.isaachartman.com'];
const FROM = 'contact@isaachartman.com';
const TO = 'isaac.hartman@gmail.com';

const MAX = { name: 100, email: 200, message: 5000 };

const clean = (v) => String(v || '').replace(/[\r\n]+/g, ' ').trim();

function cors(origin) {
  return {
    'Access-Control-Allow-Origin': origin,
    'Access-Control-Allow-Methods': 'POST, OPTIONS',
    'Access-Control-Allow-Headers': 'Content-Type, Accept',
    'Vary': 'Origin',
  };
}

function json(body, status, origin) {
  return new Response(JSON.stringify(body), {
    status,
    headers: { 'Content-Type': 'application/json', ...cors(origin) },
  });
}

// RFC 2047 encoded-word so non-ASCII names/subjects survive.
function encodeHeader(text) {
  if (/^[\x20-\x7e]*$/.test(text)) return text;
  const bytes = new TextEncoder().encode(text);
  let bin = '';
  bytes.forEach((b) => (bin += String.fromCharCode(b)));
  return `=?UTF-8?B?${btoa(bin)}?=`;
}

function buildMime({ name, email, message }) {
  const subject = encodeHeader(`Portfolio contact: ${name}`);
  const body = btoa(
    String.fromCharCode(...new TextEncoder().encode(`From: ${name} <${email}>\n\n${message}\n`))
  ).replace(/(.{76})/g, '$1\r\n');

  return [
    `From: Portfolio Contact Form <${FROM}>`,
    `To: ${TO}`,
    `Reply-To: ${email}`,
    `Subject: ${subject}`,
    `Message-ID: <${crypto.randomUUID()}@isaachartman.com>`,
    `Date: ${new Date().toUTCString()}`,
    'MIME-Version: 1.0',
    'Content-Type: text/plain; charset=UTF-8',
    'Content-Transfer-Encoding: base64',
    '',
    body,
  ].join('\r\n');
}

export default {
  async fetch(request, env) {
    const origin = request.headers.get('Origin') || '';
    const allowed = ALLOWED_ORIGINS.includes(origin);

    if (request.method === 'OPTIONS') {
      return new Response(null, { status: allowed ? 204 : 403, headers: allowed ? cors(origin) : {} });
    }
    if (request.method !== 'POST') return new Response('Method not allowed', { status: 405 });
    if (!allowed) return new Response('Forbidden', { status: 403 });

    let form;
    try {
      form = await request.formData();
    } catch {
      return json({ ok: false, error: 'Invalid request' }, 400, origin);
    }

    // Honeypot: bots fill this hidden field. Pretend success, send nothing.
    if (clean(form.get('_gotcha'))) return json({ ok: true }, 200, origin);

    const name = clean(form.get('name'));
    const email = clean(form.get('email'));
    const message = String(form.get('message') || '').trim();

    if (!name || !email || !message) return json({ ok: false, error: 'Missing fields' }, 400, origin);
    if (name.length > MAX.name || email.length > MAX.email || message.length > MAX.message) {
      return json({ ok: false, error: 'Too long' }, 400, origin);
    }
    if (!/^[^\s@<>]+@[^\s@<>]+\.[^\s@<>]+$/.test(email)) {
      return json({ ok: false, error: 'Invalid email' }, 400, origin);
    }

    try {
      await env.SEND_EMAIL.send(new EmailMessage(FROM, TO, buildMime({ name, email, message })));
    } catch (err) {
      console.error('send failed', err && err.message);
      return json({ ok: false, error: 'Could not send' }, 502, origin);
    }
    return json({ ok: true }, 200, origin);
  },
};
