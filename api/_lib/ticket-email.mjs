// HTML email for a Sustainability Week 2026 ticket.
// Built with tables and inline styles so it renders in Outlook, Gmail and Apple Mail.
// Images are referenced by Content-ID (cid:) and sent as inline attachments,
// so they show without the reader having to "load remote images".

export const SITE = 'https://sw.gulfuniversity.edu.bh';

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
const MONO = "Consolas, Menlo, 'Courier New', monospace";

const NAVY = '#0b1437';
const DEEP = '#16276b';
const GOLD = '#facc15';
const MUTED = '#5b6593';

function esc(value) {
  return String(value ?? '').replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' })[c]);
}

export function shortRef(code) {
  return code.slice(0, 8).toUpperCase();
}

export function ticketLink(code) {
  return `${SITE}/ticket/${code}`;
}

export function attendingLink(name) {
  return `${SITE}/attending` + (name ? `?name=${encodeURIComponent(name)}` : '');
}

export function ticketEmailSubject(name) {
  return `Your ticket for Sustainability Week 2026${name ? ` — ${name}` : ''}`;
}

/**
 * @param {{ code: string, name: string | null, type: string, hasImage?: boolean }} t
 * @returns {{ html: string }}
 */
export function ticketEmail(t) {
  const name = (t.name || 'Guest').trim();
  const first = name.split(/\s+/)[0];
  const ref = shortRef(t.code);
  const ticketUrl = ticketLink(t.code);
  const postUrl = attendingLink(t.name || '');

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

  const html = `<!doctype html>
<html lang="en" xmlns="http://www.w3.org/1999/xhtml">
<head>
<meta charset="utf-8" />
<meta name="viewport" content="width=device-width, initial-scale=1" />
<meta name="x-apple-disable-message-reformatting" />
<meta name="color-scheme" content="light only" />
<meta name="supported-color-schemes" content="light" />
<title>Your Sustainability Week 2026 ticket</title>
<link href="https://fonts.googleapis.com/css2?family=Playfair+Display:wght@700;800&family=Poppins:wght@400;600;700&display=swap" rel="stylesheet" />
<style>
  body { margin:0; padding:0; }
  a { text-decoration:none; }
  @media (max-width:620px) {
    .px { padding-left:18px !important; padding-right:18px !important; }
    .h1 { font-size:26px !important; }
    .name { font-size:26px !important; }
    .meta td { display:block !important; width:100% !important; padding:6px 0 !important; }
    .btn a { display:block !important; }
  }
</style>
</head>
<body style="margin:0;padding:0;background:#eef2f8;">
<div style="display:none;max-height:0;overflow:hidden;opacity:0;color:transparent;">
  Your QR entry ticket for Sustainability Week 2026 · 15–19 November · Bahrain. Ref ${ref}.
</div>
<table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" bgcolor="#eef2f8" style="background:#eef2f8;">
<tr><td align="center" style="padding:28px 12px;">

  <table role="presentation" width="600" cellpadding="0" cellspacing="0" border="0" style="width:100%;max-width:600px;">

    <!-- ===== hero ===== -->
    <tr><td class="px" align="center" bgcolor="${NAVY}" style="background:${NAVY};background-image:linear-gradient(180deg,#050a24 0%,#0b1437 55%,#1e3a8a 100%);border-radius:24px 24px 0 0;padding:36px 32px 28px;">
      <img src="cid:sw-logo" width="300" alt="Bahrain Polytechnic · Sustainability Week 2026 · Gulf University" style="display:block;width:300px;max-width:80%;height:auto;border:0;margin:0 auto;" />
      <table role="presentation" cellpadding="0" cellspacing="0" border="0" style="margin:26px auto 0;">
        <tr><td style="background:${GOLD};background-image:linear-gradient(135deg,#fde68a,#facc15 50%,#d4a017);border-radius:999px;padding:6px 16px;font-family:${SANS};font-size:11px;font-weight:700;letter-spacing:2px;color:${NAVY};">
          ✦ YOUR TICKET IS READY
        </td></tr>
      </table>
      <h1 class="h1" style="margin:16px 0 8px;font-family:${SERIF};font-size:32px;line-height:1.2;font-weight:800;color:#ffffff;">Hi ${esc(first)}, you're in!</h1>
      <p style="margin:0 auto;max-width:440px;font-family:${SANS};font-size:15px;line-height:1.6;color:#c7d2fe;">
        Here is your personal entry ticket for <strong style="color:#ffffff;">Sustainability Week 2026</strong>.
        Show the QR code at the entrance each day.
      </p>
    </td></tr>

    <!-- ===== ticket ===== -->
    <tr><td class="px" bgcolor="${DEEP}" style="background:${DEEP};background-image:linear-gradient(180deg,#1e3a8a 0%,${DEEP} 100%);padding:4px 32px 36px;">

      <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" bgcolor="#ffffff" style="background:#ffffff;border-radius:22px;overflow:hidden;box-shadow:0 24px 48px rgba(0,0,0,0.35);">

        <!-- SDG band -->
        <tr><td style="padding:0;font-size:0;line-height:0;">
          <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0"><tr>${band}</tr></table>
        </td></tr>

        <!-- ticket header -->
        <tr><td align="center" bgcolor="#111b4d" style="background:#111b4d;background-image:linear-gradient(135deg,#111b4d,#2545b3);padding:26px 24px 24px;">
          <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0"><tr>
            <td align="left" style="font-family:${SANS};font-size:11px;font-weight:700;letter-spacing:2px;color:${GOLD};">✦ ADMIT ONE</td>
            <td align="right" style="font-family:${MONO};font-size:12px;letter-spacing:1px;color:#c7d2fe;">No. ${ref}</td>
          </tr></table>
          <p style="margin:18px 0 4px;font-family:${SANS};font-size:11px;font-weight:600;letter-spacing:3px;color:#a5b4fc;">ENTRY TICKET</p>
          <p style="margin:0;font-family:${SERIF};font-size:30px;line-height:1.2;font-weight:800;color:#ffffff;">Sustainability Week <span style="color:${GOLD};">2026</span></p>
          <p style="margin:8px 0 0;font-family:${SANS};font-size:13px;font-style:italic;color:#c7d2fe;">“Co-innovating, Leading, Sustaining…”</p>
        </td></tr>

        <!-- attendee -->
        <tr><td align="center" style="padding:28px 24px 8px;">
          <p style="margin:0 0 6px;font-family:${SANS};font-size:11px;font-weight:600;letter-spacing:3px;color:${MUTED};">ATTENDEE</p>
          <p class="name" style="margin:0;font-family:${SERIF};font-size:30px;line-height:1.2;font-weight:800;letter-spacing:0.5px;color:${NAVY};text-transform:uppercase;">${esc(name.toUpperCase())}</p>
          <table role="presentation" cellpadding="0" cellspacing="0" border="0" style="margin:14px auto 0;">
            <tr><td style="background:${GOLD};background-image:linear-gradient(90deg,#fde68a,#facc15 50%,#d4a017);border-radius:999px;padding:7px 18px;font-family:${SANS};font-size:13px;font-weight:700;color:#7c5a0b;">${esc(t.type)}</td></tr>
          </table>
        </td></tr>

        <!-- meta -->
        <tr><td style="padding:18px 24px 24px;">
          <table class="meta" role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" style="background:#f5f7fc;border-radius:14px;">
            <tr>
              <td width="33%" valign="top" style="padding:14px 16px;">
                <p style="margin:0;font-family:${SANS};font-size:10px;font-weight:700;letter-spacing:2px;color:${MUTED};">DATES</p>
                <p style="margin:4px 0 0;font-family:${SANS};font-size:14px;font-weight:700;color:${NAVY};">15 – 19 Nov 2026</p>
              </td>
              <td width="27%" valign="top" style="padding:14px 16px;">
                <p style="margin:0;font-family:${SANS};font-size:10px;font-weight:700;letter-spacing:2px;color:${MUTED};">ACCESS</p>
                <p style="margin:4px 0 0;font-family:${SANS};font-size:14px;font-weight:700;color:${NAVY};">All 5 days</p>
              </td>
              <td valign="top" style="padding:14px 16px;">
                <p style="margin:0;font-family:${SANS};font-size:10px;font-weight:700;letter-spacing:2px;color:${MUTED};">WHERE</p>
                <p style="margin:4px 0 0;font-family:${SANS};font-size:14px;font-weight:700;color:${NAVY};">Kingdom of Bahrain</p>
              </td>
            </tr>
          </table>
        </td></tr>

        <!-- perforation with notches -->
        <tr><td style="padding:0;font-size:0;line-height:0;">
          <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0"><tr>
            <td width="14" height="28" bgcolor="${DEEP}" style="width:14px;height:28px;background:${DEEP};border-radius:0 14px 14px 0;font-size:0;">&nbsp;</td>
            <td style="padding:0 12px;"><div style="border-top:2px dashed #cdd5ea;height:0;font-size:0;line-height:0;">&nbsp;</div></td>
            <td width="14" height="28" bgcolor="${DEEP}" style="width:14px;height:28px;background:${DEEP};border-radius:14px 0 0 14px;font-size:0;">&nbsp;</td>
          </tr></table>
        </td></tr>

        <!-- QR -->
        <tr><td align="center" style="padding:22px 24px 30px;">
          <table role="presentation" cellpadding="0" cellspacing="0" border="0" style="border:3px solid #d4a017;border-radius:18px;">
            <tr><td style="padding:12px;"><img src="cid:sw-qr" width="220" height="220" alt="Your ticket QR code" style="display:block;width:220px;height:220px;border:0;" /></td></tr>
          </table>
          <p style="margin:16px 0 0;font-family:${MONO};font-size:14px;letter-spacing:3px;color:${MUTED};">REF ${ref}</p>
          <p style="margin:6px 0 0;font-family:${SANS};font-size:14px;font-weight:600;color:#1f2a5e;">Show this code at the entrance each day</p>
        </td></tr>
      </table>

      <!-- button -->
      <table class="btn" role="presentation" cellpadding="0" cellspacing="0" border="0" style="margin:26px auto 0;">
        <tr><td align="center" bgcolor="${GOLD}" style="background:${GOLD};background-image:linear-gradient(135deg,#fde68a,#facc15 45%,#d4a017);border-radius:999px;">
          <a href="${ticketUrl}" style="display:inline-block;padding:15px 34px;font-family:${SANS};font-size:15px;font-weight:700;color:${NAVY};text-decoration:none;">Open my ticket &rarr;</a>
        </td></tr>
      </table>
      <p style="margin:12px 0 0;text-align:center;font-family:${SANS};font-size:12px;color:#a5b4fc;">
        ${t.hasImage ? 'Your ticket is also attached as an image, so you can keep it on your phone.' : 'Save this email or bookmark the link to keep your ticket handy.'}
      </p>
    </td></tr>

    <!-- ===== I'm attending ===== -->
    <tr><td class="px" bgcolor="#ffffff" style="background:#ffffff;padding:34px 32px 8px;">
      <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" style="background:#fffbea;background-image:linear-gradient(135deg,#fff8db,#eef4ff);border:1px solid #f5d76e;border-radius:18px;">
        <tr><td align="center" style="padding:26px 24px;">
          <p style="margin:0;font-size:30px;line-height:1;">📣</p>
          <p style="margin:10px 0 6px;font-family:${SERIF};font-size:22px;font-weight:800;color:${NAVY};">Tell the world you're attending</p>
          <p style="margin:0 auto 18px;max-width:420px;font-family:${SANS};font-size:14px;line-height:1.6;color:${MUTED};">
            Create your personal <strong style="color:${NAVY};">“I'm attending”</strong> post in seconds — add your photo
            and share it on LinkedIn, Instagram or X.
          </p>
          <table class="btn" role="presentation" cellpadding="0" cellspacing="0" border="0" style="margin:0 auto;">
            <tr><td align="center" bgcolor="${NAVY}" style="background:${NAVY};background-image:linear-gradient(135deg,#0b1437,#2545b3);border-radius:999px;">
              <a href="${postUrl}" style="display:inline-block;padding:13px 28px;font-family:${SANS};font-size:14px;font-weight:700;color:#ffffff;text-decoration:none;">Create my post &rarr;</a>
            </td></tr>
          </table>
          <p style="margin:12px 0 0;font-family:${SANS};font-size:12px;"><a href="${postUrl}" style="color:#2545b3;text-decoration:underline;">sw.gulfuniversity.edu.bh/attending</a></p>
        </td></tr>
      </table>
    </td></tr>

    <!-- ===== schedule ===== -->
    <tr><td class="px" bgcolor="#ffffff" style="background:#ffffff;padding:26px 32px 30px;">
      <p style="margin:0 0 4px;font-family:${SANS};font-size:11px;font-weight:700;letter-spacing:3px;color:${MUTED};">YOUR FIVE DAYS</p>
      <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0">${days}
      </table>
      <p style="margin:16px 0 0;font-family:${SANS};font-size:13px;line-height:1.6;color:${MUTED};">
        See the full programme on the <a href="${SITE}/agenda" style="color:#2545b3;font-weight:600;text-decoration:underline;">event agenda</a>.
      </p>
    </td></tr>

    <!-- ===== footer ===== -->
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
        This ticket is personal — please don't share your QR code.
      </p>
    </td></tr>

  </table>
</td></tr>
</table>
</body>
</html>`;

  return { html };
}
