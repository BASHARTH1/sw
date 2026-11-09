import { Ticket, shortRef } from './tickets';

/** The 17 UN SDG colours, used for the ticket band and the confetti. */
export const SDG_COLORS = [
  '#e5243b', '#dda63a', '#4c9f38', '#c5192d', '#ff3a21', '#26bde2', '#fcc30b', '#a21942', '#fd6925',
  '#dd1367', '#fd9d24', '#bf8b2e', '#3f7e44', '#0a97d9', '#56c02b', '#00689d', '#19486a'
];

/** Draw the whole ticket as a phone-sized image (1080×1920) and return it as a data URL. */
export async function renderTicketImage(
  t: Pick<Ticket, 'ticket_code' | 'full_name' | 'type'>,
  qrSrc: string,
  format: 'image/png' | 'image/jpeg' = 'image/png'
): Promise<string> {
  const W = 1080;
  const H = 1920;
  const canvas = document.createElement('canvas');
  canvas.width = W;
  canvas.height = H;
  const ctx = canvas.getContext('2d')!;
  await document.fonts?.ready;

  const [logo, qr] = await Promise.all([loadImage('/sw2026-logo.png'), loadImage(qrSrc)]);

  // background
  const bg = ctx.createLinearGradient(0, 0, W, H);
  bg.addColorStop(0, '#050a24');
  bg.addColorStop(0.45, '#0b1437');
  bg.addColorStop(1, '#1e3a8a');
  ctx.fillStyle = bg;
  ctx.fillRect(0, 0, W, H);
  glow(ctx, 180, 260, 520, 'rgba(96,165,250,0.35)');
  glow(ctx, 940, 1700, 560, 'rgba(212,160,23,0.28)');
  glow(ctx, 980, 520, 380, 'rgba(76,159,56,0.18)');

  // logo
  const lw = 760;
  const lh = (logo.height / logo.width) * lw;
  ctx.drawImage(logo, (W - lw) / 2, 90, lw, lh);

  // card
  const cx = 90;
  const cy = 120 + lh + 50;
  const cw = W - 180;
  const ch = H - cy - 110;
  const perfY = cy + 590;
  ctx.save();
  ctx.shadowColor = 'rgba(0,0,0,0.5)';
  ctx.shadowBlur = 60;
  ctx.shadowOffsetY = 24;
  ticketPath(ctx, cx, cy, cw, ch, 40, perfY, 30);
  ctx.fillStyle = '#ffffff';
  ctx.fill();
  ctx.restore();

  // card header
  ctx.save();
  ticketPath(ctx, cx, cy, cw, ch, 40, perfY, 30);
  ctx.clip();
  const hg = ctx.createLinearGradient(cx, cy, cx + cw, cy + 300);
  hg.addColorStop(0, '#111b4d');
  hg.addColorStop(1, '#2545b3');
  ctx.fillStyle = hg;
  ctx.fillRect(cx, cy, cw, 300);
  const bandW = cw / SDG_COLORS.length;
  SDG_COLORS.forEach((c, i) => {
    ctx.fillStyle = c;
    ctx.fillRect(cx + i * bandW, cy, bandW + 1, 14);
  });
  ctx.restore();

  ctx.textAlign = 'center';
  ctx.fillStyle = '#facc15';
  ctx.font = '600 28px Poppins, sans-serif';
  spaced(ctx, 'ENTRY TICKET  ·  ADMIT ONE', W / 2, cy + 82, 6);
  ctx.fillStyle = '#ffffff';
  ctx.font = '700 64px "Playfair Display", serif';
  ctx.fillText('Sustainability Week 2026', W / 2, cy + 170);
  ctx.fillStyle = 'rgba(255,255,255,0.85)';
  ctx.font = 'italic 400 32px Poppins, sans-serif';
  ctx.fillText('15 – 19 November 2026  ·  Kingdom of Bahrain', W / 2, cy + 232);

  // attendee
  ctx.fillStyle = '#5b6593';
  ctx.font = '600 26px Poppins, sans-serif';
  spaced(ctx, 'ATTENDEE', W / 2, cy + 370, 5);
  ctx.fillStyle = '#0b1437';
  let size = 68;
  const name = (t.full_name || 'Guest').toUpperCase();
  do {
    ctx.font = `700 ${size}px "Playfair Display", serif`;
    size -= 4;
  } while (ctx.measureText(name).width > cw - 120 && size > 36);
  ctx.fillText(name, W / 2, cy + 448);

  // type pill
  ctx.font = '700 30px Poppins, sans-serif';
  const tw = ctx.measureText(t.type).width + 64;
  const pg = ctx.createLinearGradient(W / 2 - tw / 2, 0, W / 2 + tw / 2, 0);
  pg.addColorStop(0, '#fde68a');
  pg.addColorStop(0.5, '#facc15');
  pg.addColorStop(1, '#d4a017');
  ctx.fillStyle = pg;
  roundRect(ctx, W / 2 - tw / 2, cy + 470, tw, 56, 28);
  ctx.fill();
  ctx.fillStyle = '#7c5a0b';
  ctx.fillText(t.type, W / 2, cy + 509);

  // perforation
  ctx.strokeStyle = 'rgba(30,58,138,0.22)';
  ctx.lineWidth = 4;
  ctx.setLineDash([14, 12]);
  ctx.beginPath();
  ctx.moveTo(cx + 50, perfY);
  ctx.lineTo(cx + cw - 50, perfY);
  ctx.stroke();
  ctx.setLineDash([]);

  // QR
  const qs = 540;
  const qy = perfY + 70;
  ctx.drawImage(qr, (W - qs) / 2, qy, qs, qs);
  brackets(ctx, (W - qs) / 2 - 24, qy - 24, qs + 48, '#d4a017');

  ctx.fillStyle = '#5b6593';
  ctx.font = '500 30px ui-monospace, Menlo, Consolas, monospace';
  spaced(ctx, `REF ${shortRef(t.ticket_code)}`, W / 2, qy + qs + 76, 6);
  ctx.fillStyle = '#1f2a5e';
  ctx.font = '500 30px Poppins, sans-serif';
  ctx.fillText('Show this code at the entrance each day', W / 2, qy + qs + 132);
  ctx.fillStyle = '#5b6593';
  ctx.font = '400 26px Poppins, sans-serif';
  ctx.fillText('Day 1: The Art Hotel, Amwaj  ·  Days 2–5: Gulf University & Bahrain Polytechnic', W / 2, qy + qs + 180, cw - 80);

  return canvas.toDataURL(format, 0.92);
}

// ---------- canvas helpers ----------

function loadImage(src: string): Promise<HTMLImageElement> {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.onload = () => resolve(img);
    img.onerror = reject;
    img.src = src;
  });
}

function glow(ctx: CanvasRenderingContext2D, x: number, y: number, r: number, color: string): void {
  const g = ctx.createRadialGradient(x, y, 0, x, y, r);
  g.addColorStop(0, color);
  g.addColorStop(1, 'rgba(0,0,0,0)');
  ctx.fillStyle = g;
  ctx.fillRect(x - r, y - r, r * 2, r * 2);
}

function roundRect(ctx: CanvasRenderingContext2D, x: number, y: number, w: number, h: number, r: number): void {
  ctx.beginPath();
  ctx.moveTo(x + r, y);
  ctx.arcTo(x + w, y, x + w, y + h, r);
  ctx.arcTo(x + w, y + h, x, y + h, r);
  ctx.arcTo(x, y + h, x, y, r);
  ctx.arcTo(x, y, x + w, y, r);
  ctx.closePath();
}

/** Rounded card with two half-circle notches at the perforation line. */
function ticketPath(
  ctx: CanvasRenderingContext2D, x: number, y: number, w: number, h: number, r: number, notchY: number, nr: number
): void {
  ctx.beginPath();
  ctx.moveTo(x + r, y);
  ctx.arcTo(x + w, y, x + w, y + h, r);
  ctx.lineTo(x + w, notchY - nr);
  ctx.arc(x + w, notchY, nr, -Math.PI / 2, Math.PI / 2, true);
  ctx.arcTo(x + w, y + h, x, y + h, r);
  ctx.arcTo(x, y + h, x, y, r);
  ctx.lineTo(x, notchY + nr);
  ctx.arc(x, notchY, nr, Math.PI / 2, -Math.PI / 2, true);
  ctx.arcTo(x, y, x + w, y, r);
  ctx.closePath();
}

function brackets(ctx: CanvasRenderingContext2D, x: number, y: number, s: number, color: string): void {
  const l = 56;
  ctx.strokeStyle = color;
  ctx.lineWidth = 8;
  ctx.lineCap = 'round';
  const corners: Array<[number, number, number, number]> = [
    [x, y, 1, 1], [x + s, y, -1, 1], [x, y + s, 1, -1], [x + s, y + s, -1, -1]
  ];
  for (const [cx, cy, dx, dy] of corners) {
    ctx.beginPath();
    ctx.moveTo(cx, cy + dy * l);
    ctx.lineTo(cx, cy);
    ctx.lineTo(cx + dx * l, cy);
    ctx.stroke();
  }
}

/** fillText with letter spacing (canvas letterSpacing isn't available everywhere). */
function spaced(ctx: CanvasRenderingContext2D, text: string, cx: number, y: number, spacing: number): void {
  const chars = [...text];
  const total = chars.reduce((sum, ch) => sum + ctx.measureText(ch).width, 0) + spacing * (chars.length - 1);
  const align = ctx.textAlign;
  ctx.textAlign = 'left';
  let x = cx - total / 2;
  for (const ch of chars) {
    ctx.fillText(ch, x, y);
    x += ctx.measureText(ch).width + spacing;
  }
  ctx.textAlign = align;
}
