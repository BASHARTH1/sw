// POST /api/send-ticket — email one attendee their ticket from sw@gulfuniversity.edu.bh.
//
// Called from the admin page with the signed-in admin's Supabase session token.
// Mail goes out through Microsoft Graph (the university uses Microsoft 365), using an
// Entra ID app registration with the Mail.Send application permission.
//
// Vercel environment variables:
//   MS_TENANT_ID, MS_CLIENT_ID, MS_CLIENT_SECRET   the app registration
//   MAIL_FROM                                      optional, defaults to sw@gulfuniversity.edu.bh

import QRCode from 'qrcode';
import { SITE, shortRef, ticketEmail, ticketEmailSubject, ticketLink } from './_lib/ticket-email.mjs';

const SUPABASE_URL = 'https://xgdtzkyhznxaebknfdkd.supabase.co';
const SUPABASE_KEY = 'sb_publishable_RMgZgRhsoF4Sow5yvtfBNw_W9MRXDIn';
const UUID_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const MAX_IMAGE_BYTES = 2_500_000;

function json(status, body) {
  return Response.json(body, { status });
}

/** Run a Supabase REST/RPC call as the signed-in admin, so Row Level Security still applies. */
async function supabase(path, token, init = {}) {
  return fetch(`${SUPABASE_URL}${path}`, {
    ...init,
    headers: { apikey: SUPABASE_KEY, Authorization: `Bearer ${token}`, 'Content-Type': 'application/json', ...init.headers }
  });
}

async function graphToken() {
  const { MS_TENANT_ID, MS_CLIENT_ID, MS_CLIENT_SECRET } = process.env;
  const res = await fetch(`https://login.microsoftonline.com/${MS_TENANT_ID}/oauth2/v2.0/token`, {
    method: 'POST',
    body: new URLSearchParams({
      client_id: MS_CLIENT_ID,
      client_secret: MS_CLIENT_SECRET,
      scope: 'https://graph.microsoft.com/.default',
      grant_type: 'client_credentials'
    })
  });
  const data = await res.json().catch(() => ({}));
  if (!res.ok || !data.access_token) {
    throw new Error(`Microsoft sign-in failed: ${data.error_description || data.error || res.status}`);
  }
  return data.access_token;
}

function inline(name, contentType, base64, contentId) {
  return { '@odata.type': '#microsoft.graph.fileAttachment', name, contentType, contentBytes: base64, contentId, isInline: true };
}

export async function POST(request) {
  const from = process.env.MAIL_FROM || 'sw@gulfuniversity.edu.bh';
  if (!process.env.MS_TENANT_ID || !process.env.MS_CLIENT_ID || !process.env.MS_CLIENT_SECRET) {
    return json(503, { error: 'Email sending is not set up yet (missing Microsoft 365 settings on the server).' });
  }

  // 1. Who is asking? Must be a signed-in admin, not a door-staff account.
  const token = (request.headers.get('authorization') || '').replace(/^Bearer\s+/i, '');
  if (!token) {
    return json(401, { error: 'Please sign in again.' });
  }
  const userRes = await supabase('/auth/v1/user', token);
  if (!userRes.ok) {
    return json(401, { error: 'Your session has expired. Please sign in again.' });
  }
  const user = await userRes.json();
  if (user?.app_metadata?.role === 'door-staff') {
    return json(403, { error: 'Door staff accounts cannot send emails.' });
  }

  // 2. Which ticket?
  const body = await request.json().catch(() => null);
  const code = String(body?.code || '').toLowerCase();
  if (!UUID_RE.test(code)) {
    return json(400, { error: 'Invalid ticket code.' });
  }
  const regRes = await supabase(`/rest/v1/registrations?ticket_code=eq.${code}&select=full_name,email,type`, token);
  const rows = regRes.ok ? await regRes.json() : [];
  const reg = rows[0];
  if (!reg) {
    return json(404, { error: 'Ticket not found.' });
  }
  const to = String(reg.email || '').trim();
  if (!EMAIL_RE.test(to)) {
    return json(400, { error: 'This registration has no valid email address.' });
  }

  // 3. Build the email: QR + logo inline, the full ticket image (rendered by the admin page) attached.
  const qr = await QRCode.toBuffer(ticketLink(code), {
    errorCorrectionLevel: 'M',
    margin: 2,
    width: 480,
    color: { dark: '#0b1437', light: '#ffffff' }
  });
  const attachments = [inline('ticket-qr.png', 'image/png', qr.toString('base64'), 'sw-qr')];

  const logoRes = await fetch(`${SITE}/sw2026-logo.png`).catch(() => null);
  if (logoRes?.ok) {
    attachments.push(inline('sw2026-logo.png', 'image/png', Buffer.from(await logoRes.arrayBuffer()).toString('base64'), 'sw-logo'));
  }

  const image = typeof body?.image === 'string' ? body.image.match(/^data:image\/(png|jpeg);base64,([A-Za-z0-9+/=]+)$/) : null;
  const hasImage = !!image && image[2].length * 0.75 <= MAX_IMAGE_BYTES;
  if (hasImage) {
    const ext = image[1] === 'png' ? 'png' : 'jpg';
    attachments.push({
      '@odata.type': '#microsoft.graph.fileAttachment',
      name: `SW2026-Ticket-${shortRef(code)}.${ext}`,
      contentType: `image/${image[1]}`,
      contentBytes: image[2]
    });
  }

  const { html } = ticketEmail({ code, name: reg.full_name, type: reg.type, hasImage });

  // 4. Send through Microsoft Graph, as the sw@ mailbox (a copy lands in its Sent Items).
  let accessToken;
  try {
    accessToken = await graphToken();
  } catch (e) {
    return json(502, { error: e.message });
  }
  const sendRes = await fetch(`https://graph.microsoft.com/v1.0/users/${encodeURIComponent(from)}/sendMail`, {
    method: 'POST',
    headers: { Authorization: `Bearer ${accessToken}`, 'Content-Type': 'application/json' },
    body: JSON.stringify({
      message: {
        subject: ticketEmailSubject(reg.full_name),
        body: { contentType: 'HTML', content: html },
        toRecipients: [{ emailAddress: { address: to, name: reg.full_name || undefined } }],
        attachments
      },
      saveToSentItems: true
    })
  });
  if (!sendRes.ok) {
    const err = await sendRes.json().catch(() => ({}));
    return json(502, { error: `Microsoft 365 refused the email: ${err?.error?.message || sendRes.status}` });
  }

  // 5. Remember that it was sent (ignored if supabase/ticket-email.sql hasn't been run yet).
  let sentAt = new Date().toISOString();
  const markRes = await supabase('/rest/v1/rpc/mark_ticket_emailed', token, {
    method: 'POST',
    body: JSON.stringify({ p_code: code })
  }).catch(() => null);
  if (markRes?.ok) {
    sentAt = (await markRes.json().catch(() => null)) || sentAt;
  }

  return json(200, { ok: true, to, sentAt });
}
