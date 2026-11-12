// HTML "please register" reminder for Sustainability Week 2026.
// Same look as the ticket email (tables + inline styles for Outlook/Gmail); the logo is sent inline as cid:sw-logo.

import { SITE } from './ticket-email.mjs';

const SDG = [
  '#e5243b', '#dda63a', '#4c9f38', '#c5192d', '#ff3a21', '#26bde2', '#fcc30b', '#a21942', '#fd6925',
  '#dd1367', '#fd9d24', '#bf8b2e', '#3f7e44', '#0a97d9', '#56c02b', '#00689d', '#19486a'
];

const DAYS = [
  ['Sun 15 Nov', 'Day 1', 'The Art Hotel, Amwaj'],
  ['Mon 16 Nov', 'Day 2', 'Gulf University &amp; Bahrain Polytechnic'],
  ['Tue 17 Nov', 'Day 3', 'Gulf University &amp; Bahrain Polytechnic'],
  ['Wed 18 Nov', 'Day 4', 'Gulf University &amp; Bahrain Polytechnic'],
  ['Thu 19 Nov', 'Day 5', 'Gulf University &amp; Bahrain Polytechnic']
];

const SERIF = "'Playfair Display', Georgia, 'Times New Roman', serif";
const SANS = "'Poppins', 'Segoe UI', Helvetica, Arial, sans-serif";
const NAVY = '#0b1437';
const GOLD = '#facc15';
const MUTED = '#5b6593';

export const REGISTER_URL = `${SITE}/#register`;
export const reminderSubject = 'Reminder: register for Sustainability Week 2026 · 15–19 November';

export function reminderEmail() {
  const band = SDG.map((c) => `<td height="8" style="height:8px;line-height:8px;font-size:0;background:${c};">&nbsp;</td>`).join('');
  const days = DAYS.map(
    ([date, label, venue], i) => `
              <tr>
                <td width="96" valign="top" style="padding:12px 0;${i ? 'border-top:1px solid #e6eaf3;' : ''}font-family:${SANS};font-size:13px;font-weight:700;color:${NAVY};">${date}</td>
                <td valign="top" style="padding:12px 0;${i ? 'border-top:1px solid #e6eaf3;' : ''}font-family:${SANS};font-size:13px;color:${MUTED};">
                  <span style="color:#b8860b;font-weight:700;">${label}</span> &nbsp;·&nbsp; ${venue}
                </td>
              </tr>`
  ).join('');
  const step = (n, title, text) => `
              <tr>
                <td width="46" valign="top" style="padding:10px 0;">
                  <table role="presentation" cellpadding="0" cellspacing="0" border="0"><tr><td align="center" width="32" height="32" style="width:32px;height:32px;border-radius:999px;background:${GOLD};font-family:${SANS};font-size:14px;font-weight:700;color:${NAVY};">${n}</td></tr></table>
                </td>
                <td valign="top" style="padding:10px 0;font-family:${SANS};font-size:14px;line-height:1.5;color:${MUTED};">
                  <strong style="color:${NAVY};">${title}</strong><br />${text}
                </td>
              </tr>`;

  const html = `<!doctype html>
<html lang="en" xmlns="http://www.w3.org/1999/xhtml">
<head>
<meta charset="utf-8" />
<meta name="viewport" content="width=device-width, initial-scale=1" />
<meta name="x-apple-disable-message-reformatting" />
<meta name="color-scheme" content="light only" />
<meta name="supported-color-schemes" content="light" />
<title>Register for Sustainability Week 2026</title>
<link href="https://fonts.googleapis.com/css2?family=Playfair+Display:wght@700;800&family=Poppins:wght@400;600;700&display=swap" rel="stylesheet" />
<style>
  body { margin:0; padding:0; }
  a { text-decoration:none; }
  @media (max-width:620px) {
    .px { padding-left:18px !important; padding-right:18px !important; }
    .h1 { font-size:26px !important; }
    .meta td { display:block !important; width:100% !important; padding:6px 0 !important; }
    .btn a { display:block !important; }
  }
</style>
</head>
<body style="margin:0;padding:0;background:#eef2f8;">
<div style="display:none;max-height:0;overflow:hidden;opacity:0;color:transparent;">
  Sustainability Week 2026 starts Sunday 15 November. Register in one minute and get your QR entry ticket by email.
</div>
<table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" bgcolor="#eef2f8" style="background:#eef2f8;">
<tr><td align="center" style="padding:28px 12px;">
  <table role="presentation" width="600" cellpadding="0" cellspacing="0" border="0" style="width:100%;max-width:600px;">

    <!-- hero -->
    <tr><td class="px" align="center" bgcolor="${NAVY}" style="background:${NAVY};background-image:linear-gradient(180deg,#050a24 0%,#0b1437 55%,#1e3a8a 100%);border-radius:24px 24px 0 0;padding:36px 32px 34px;">
      <img src="cid:sw-logo" width="300" alt="Bahrain Polytechnic · Sustainability Week 2026 · Gulf University" style="display:block;width:300px;max-width:80%;height:auto;border:0;margin:0 auto;" />
      <table role="presentation" cellpadding="0" cellspacing="0" border="0" style="margin:26px auto 0;">
        <tr><td style="background:${GOLD};background-image:linear-gradient(135deg,#fde68a,#facc15 50%,#d4a017);border-radius:999px;padding:6px 16px;font-family:${SANS};font-size:11px;font-weight:700;letter-spacing:2px;color:${NAVY};">
          ✦ STARTS THIS SUNDAY
        </td></tr>
      </table>
      <h1 class="h1" style="margin:16px 0 10px;font-family:${SERIF};font-size:32px;line-height:1.2;font-weight:800;color:#ffffff;">Don't miss Sustainability Week <span style="color:${GOLD};">2026</span></h1>
      <p style="margin:0 auto;max-width:450px;font-family:${SANS};font-size:15px;line-height:1.6;color:#c7d2fe;">
        Five days of talks, panels and workshops on building a sustainable future,
        hosted by <strong style="color:#ffffff;">Gulf University</strong> and <strong style="color:#ffffff;">Bahrain Polytechnic</strong>.
      </p>
      <p style="margin:10px 0 0;font-family:${SANS};font-size:13px;font-style:italic;color:#a5b4fc;">“Co-innovating, Leading, Sustaining…”</p>

      <table class="meta" role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" style="margin-top:26px;background:#16245a;border:1px solid #2a3c7c;border-radius:14px;">
        <tr>
          <td width="34%" align="center" valign="top" style="padding:14px 10px;">
            <p style="margin:0;font-family:${SANS};font-size:10px;font-weight:700;letter-spacing:2px;color:#a5b4fc;">DATES</p>
            <p style="margin:4px 0 0;font-family:${SANS};font-size:14px;font-weight:700;color:#ffffff;">15 – 19 Nov 2026</p>
          </td>
          <td width="30%" align="center" valign="top" style="padding:14px 10px;">
            <p style="margin:0;font-family:${SANS};font-size:10px;font-weight:700;letter-spacing:2px;color:#a5b4fc;">PROGRAMME</p>
            <p style="margin:4px 0 0;font-family:${SANS};font-size:14px;font-weight:700;color:#ffffff;">5 days</p>
          </td>
          <td align="center" valign="top" style="padding:14px 10px;">
            <p style="margin:0;font-family:${SANS};font-size:10px;font-weight:700;letter-spacing:2px;color:#a5b4fc;">WHERE</p>
            <p style="margin:4px 0 0;font-family:${SANS};font-size:14px;font-weight:700;color:#ffffff;">Kingdom of Bahrain</p>
          </td>
        </tr>
      </table>

      <table class="btn" role="presentation" cellpadding="0" cellspacing="0" border="0" style="margin:28px auto 0;">
        <tr><td align="center" bgcolor="${GOLD}" style="background:${GOLD};background-image:linear-gradient(135deg,#fde68a,#facc15 45%,#d4a017);border-radius:999px;">
          <a href="${REGISTER_URL}" style="display:inline-block;padding:16px 38px;font-family:${SANS};font-size:16px;font-weight:700;color:${NAVY};text-decoration:none;">Register now &rarr;</a>
        </td></tr>
      </table>
      <p style="margin:12px 0 0;font-family:${SANS};font-size:12px;color:#a5b4fc;">It takes less than a minute.</p>
    </td></tr>

    <!-- SDG band -->
    <tr><td style="padding:0;font-size:0;line-height:0;">
      <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0"><tr>${band}</tr></table>
    </td></tr>

    <!-- how it works -->
    <tr><td class="px" bgcolor="#ffffff" style="background:#ffffff;padding:32px 32px 6px;">
      <p style="margin:0 0 4px;font-family:${SANS};font-size:11px;font-weight:700;letter-spacing:3px;color:${MUTED};">HOW IT WORKS</p>
      <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0">${step(1, 'Register online', 'Fill in your name and details on the event website.')}${step(2, 'Get your QR ticket', 'Your personal entry ticket arrives by email straight away.')}${step(3, 'Show it at the door', 'Scan the same QR code at the entrance each day you attend.')}
      </table>
    </td></tr>

    <!-- schedule -->
    <tr><td class="px" bgcolor="#ffffff" style="background:#ffffff;padding:22px 32px 30px;">
      <p style="margin:0 0 4px;font-family:${SANS};font-size:11px;font-weight:700;letter-spacing:3px;color:${MUTED};">THE FIVE DAYS</p>
      <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0">${days}
      </table>
      <p style="margin:16px 0 0;font-family:${SANS};font-size:13px;line-height:1.6;color:${MUTED};">
        See the full programme on the <a href="${SITE}/agenda" style="color:#2545b3;font-weight:600;text-decoration:underline;">event agenda</a>.
      </p>
    </td></tr>

    <!-- second call to action -->
    <tr><td class="px" bgcolor="#ffffff" style="background:#ffffff;padding:0 32px 34px;">
      <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" style="background:#fffbea;background-image:linear-gradient(135deg,#fff8db,#eef4ff);border:1px solid #f5d76e;border-radius:18px;">
        <tr><td align="center" style="padding:26px 24px;">
          <p style="margin:0 0 6px;font-family:${SERIF};font-size:22px;font-weight:800;color:${NAVY};">Save your seat today</p>
          <p style="margin:0 auto 18px;max-width:420px;font-family:${SANS};font-size:14px;line-height:1.6;color:${MUTED};">
            Register before Sunday so your ticket is ready on your phone when you arrive.
          </p>
          <table class="btn" role="presentation" cellpadding="0" cellspacing="0" border="0" style="margin:0 auto;">
            <tr><td align="center" bgcolor="${NAVY}" style="background:${NAVY};background-image:linear-gradient(135deg,#0b1437,#2545b3);border-radius:999px;">
              <a href="${REGISTER_URL}" style="display:inline-block;padding:13px 30px;font-family:${SANS};font-size:14px;font-weight:700;color:#ffffff;text-decoration:none;">Register for Sustainability Week &rarr;</a>
            </td></tr>
          </table>
          <p style="margin:12px 0 0;font-family:${SANS};font-size:12px;"><a href="${REGISTER_URL}" style="color:#2545b3;text-decoration:underline;">sw.gulfuniversity.edu.bh</a></p>
        </td></tr>
      </table>
    </td></tr>

    <!-- footer -->
    <tr><td class="px" align="center" bgcolor="${NAVY}" style="background:${NAVY};border-radius:0 0 24px 24px;padding:0 32px 26px;">
      <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" style="margin-bottom:22px;"><tr>${band}</tr></table>
      <p style="margin:0;font-family:${SANS};font-size:13px;line-height:1.6;color:#c7d2fe;">
        Hosted by <strong style="color:#ffffff;">Gulf University</strong> &amp; <strong style="color:#ffffff;">Bahrain Polytechnic</strong>
      </p>
      <p style="margin:6px 0 0;font-family:${SANS};font-size:13px;">
        <a href="${SITE}" style="color:${GOLD};text-decoration:none;font-weight:600;">sw.gulfuniversity.edu.bh</a>
        <span style="color:#6b7bb8;">&nbsp;·&nbsp;</span>
        <a href="mailto:sw@gulfuniversity.edu.bh" style="color:${GOLD};text-decoration:none;font-weight:600;">sw@gulfuniversity.edu.bh</a>
      </p>
      <p style="margin:14px 0 0;font-family:${SANS};font-size:11px;line-height:1.6;color:#8b97c9;">
        Already registered? Thank you, you can ignore this reminder. Find your ticket any time at
        <a href="${SITE}/ticket" style="color:#c7d2fe;text-decoration:underline;">sw.gulfuniversity.edu.bh/ticket</a>.
      </p>
    </td></tr>

  </table>
</td></tr>
</table>
</body>
</html>`;
  return { html };
}
