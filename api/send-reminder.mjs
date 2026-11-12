// POST /api/send-reminder — email a "please register" reminder from sw@gulfuniversity.edu.bh.
//
// Body: { emails: string[], dryRun?: boolean }
// Admin only (same Supabase session check as /api/send-ticket). Each address gets its own
// email, so recipients never see each other. Addresses that already have a registration are skipped.

import { SITE } from './_lib/ticket-email.mjs';
import { reminderEmail, reminderSubject } from './_lib/reminder-email.mjs';

const SUPABASE_URL = 'https://xgdtzkyhznxaebknfdkd.supabase.co';
const SUPABASE_KEY = 'sb_publishable_RMgZgRhsoF4Sow5yvtfBNw_W9MRXDIn';
const EMAIL_RE = /^[^\s@",()]+@[^\s@",()]+\.[^\s@",()]+$/;
const MAX_RECIPIENTS = 60;

function json(status, body) {
  return Response.json(body, { status });
}

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

export async function POST(request) {
  const from = process.env.MAIL_FROM || 'sw@gulfuniversity.edu.bh';
  if (!process.env.MS_TENANT_ID || !process.env.MS_CLIENT_ID || !process.env.MS_CLIENT_SECRET) {
    return json(503, { error: 'Email sending is not set up yet (missing Microsoft 365 settings on the server).' });
  }

  const token = (request.headers.get('authorization') || '').replace(/^Bearer\s+/i, '');
  if (!token) return json(401, { error: 'Please sign in again.' });
  const userRes = await supabase('/auth/v1/user', token);
  if (!userRes.ok) return json(401, { error: 'Your session has expired. Please sign in again.' });
  const user = await userRes.json();
  if (user?.app_metadata?.role === 'door-staff') return json(403, { error: 'Door staff accounts cannot send emails.' });

  const body = await request.json().catch(() => null);
  const seen = new Set();
  const emails = [];
  const invalid = [];
  for (const raw of Array.isArray(body?.emails) ? body.emails : []) {
    const e = String(raw || '').trim();
    if (!e) continue;
    if (!EMAIL_RE.test(e)) { invalid.push(e); continue; }
    if (seen.has(e.toLowerCase())) continue;
    seen.add(e.toLowerCase());
    emails.push(e);
  }
  if (!emails.length) return json(400, { error: 'No valid email addresses.', invalid });
  if (emails.length > MAX_RECIPIENTS) return json(400, { error: `At most ${MAX_RECIPIENTS} addresses per request.` });

  // Who already registered? (case-insensitive match on the registrations table; admin RLS allows reading it)
  const or = emails.map((e) => `email.ilike."${e.replace(/[%_]/g, '\\$&')}"`).join(',');
  const regRes = await supabase(`/rest/v1/registrations?select=email&or=(${encodeURIComponent(or)})`, token);
  if (!regRes.ok) return json(502, { error: `Could not check existing registrations (${regRes.status}).` });
  const registered = new Set((await regRes.json()).map((r) => String(r.email || '').trim().toLowerCase()));
  const skipped = emails.filter((e) => registered.has(e.toLowerCase()));
  const targets = emails.filter((e) => !registered.has(e.toLowerCase()));

  if (body?.dryRun) return json(200, { dryRun: true, wouldSend: targets, skipped, invalid });

  const attachments = [];
  const logoRes = await fetch(`${SITE}/sw2026-logo.png`).catch(() => null);
  if (logoRes?.ok) {
    attachments.push({
      '@odata.type': '#microsoft.graph.fileAttachment',
      name: 'sw2026-logo.png',
      contentType: 'image/png',
      contentBytes: Buffer.from(await logoRes.arrayBuffer()).toString('base64'),
      contentId: 'sw-logo',
      isInline: true
    });
  }
  const { html } = reminderEmail();

  let accessToken;
  try {
    accessToken = await graphToken();
  } catch (e) {
    return json(502, { error: e.message });
  }

  const sent = [];
  const failed = [];
  for (const to of targets) {
    const res = await fetch(`https://graph.microsoft.com/v1.0/users/${encodeURIComponent(from)}/sendMail`, {
      method: 'POST',
      headers: { Authorization: `Bearer ${accessToken}`, 'Content-Type': 'application/json' },
      body: JSON.stringify({
        message: {
          subject: reminderSubject,
          body: { contentType: 'HTML', content: html },
          toRecipients: [{ emailAddress: { address: to } }],
          attachments
        },
        saveToSentItems: true
      })
    }).catch((e) => ({ ok: false, statusText: e.message, json: async () => ({}) }));
    if (res.ok) {
      sent.push(to);
    } else {
      const err = await res.json().catch(() => ({}));
      failed.push({ to, error: err?.error?.message || res.status || res.statusText });
    }
  }

  return json(200, { ok: failed.length === 0, sent, skipped, failed, invalid });
}
