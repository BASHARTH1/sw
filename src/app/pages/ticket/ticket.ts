import { Component, OnDestroy, inject, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { ActivatedRoute, RouterLink } from '@angular/router';
import {
  EVENT_DAYS,
  SavedTicket,
  Ticket,
  findTickets,
  getTicket,
  parseTicketCode,
  qrPng,
  rememberTicket,
  savedTickets,
  shortRef,
  ticketUrl,
  todayInBahrain
} from '../../core/tickets';

/** The 17 UN SDG colours, used for the ticket band and the confetti. */
const SDG_COLORS = [
  '#e5243b', '#dda63a', '#4c9f38', '#c5192d', '#ff3a21', '#26bde2', '#fcc30b', '#a21942', '#fd6925',
  '#dd1367', '#fd9d24', '#bf8b2e', '#3f7e44', '#0a97d9', '#56c02b', '#00689d', '#19486a'
];

interface Confetto {
  left: number;
  delay: number;
  duration: number;
  color: string;
  size: number;
  drift: number;
  spin: number;
}

/**
 * /ticket/:code — an attendee's QR ticket.
 * /ticket       — "Find my ticket": tickets saved on this device plus a lookup by email + name.
 */
@Component({
  selector: 'app-ticket',
  standalone: true,
  imports: [FormsModule, RouterLink],
  templateUrl: './ticket.html',
  styleUrl: './ticket.css'
})
export class TicketComponent implements OnDestroy {
  private readonly route = inject(ActivatedRoute);

  protected readonly days = EVENT_DAYS;
  protected readonly today = todayInBahrain();
  protected readonly shortRef = shortRef;
  protected readonly sdgColors = SDG_COLORS;

  // ticket view
  protected readonly code = signal<string | null>(null);
  protected readonly ticket = signal<Ticket | null>(null);
  protected readonly qr = signal<string | null>(null);
  protected readonly loading = signal(false);
  protected readonly notFound = signal(false);
  protected readonly loadError = signal(false);
  protected readonly copied = signal(false);
  protected readonly saving = signal(false);
  protected readonly confetti = signal<Confetto[]>([]);

  /** Tilt / shine position, as CSS custom properties on the ticket. */
  protected readonly tilt = signal({ rx: 0, ry: 0, mx: 50, my: 30, active: false });

  // find view
  protected email = '';
  protected name = '';
  protected readonly saved = signal<SavedTicket[]>([]);
  protected readonly searching = signal(false);
  protected readonly results = signal<SavedTicket[] | null>(null);
  protected readonly findError = signal<string | null>(null);

  private confettiTimer: ReturnType<typeof setTimeout> | null = null;

  constructor() {
    this.route.paramMap.subscribe((params) => {
      const raw = params.get('code');
      const code = raw ? parseTicketCode(raw) : null;
      this.code.set(code);
      this.ticket.set(null);
      this.qr.set(null);
      this.notFound.set(false);
      this.loadError.set(false);
      if (code) {
        void this.load(code);
      } else if (raw) {
        this.notFound.set(true);
      } else {
        this.saved.set(savedTickets());
      }
    });
  }

  ngOnDestroy(): void {
    if (this.confettiTimer) {
      clearTimeout(this.confettiTimer);
    }
  }

  protected async load(code: string): Promise<void> {
    this.loading.set(true);
    this.loadError.set(false);
    try {
      const [ticket, qr] = await Promise.all([getTicket(code), qrPng(ticketUrl(code))]);
      if (!ticket) {
        this.notFound.set(true);
      } else {
        this.ticket.set(ticket);
        this.qr.set(qr);
        rememberTicket({ code, name: ticket.full_name, type: ticket.type });
        this.celebrateOnce(code);
      }
    } catch {
      this.loadError.set(true);
    }
    this.loading.set(false);
  }

  protected isCheckedIn(iso: string): boolean {
    return this.ticket()?.checked_in_days.includes(iso) ?? false;
  }

  protected get inToday(): boolean {
    return this.isCheckedIn(this.today);
  }

  protected firstName(name: string | null): string {
    return (name ?? '').trim().split(/\s+/)[0] || 'there';
  }

  // ---------- tilt & shine ----------

  protected onPointerMove(event: PointerEvent): void {
    if (this.reducedMotion) {
      return;
    }
    const el = event.currentTarget as HTMLElement;
    const r = el.getBoundingClientRect();
    const x = Math.min(1, Math.max(0, (event.clientX - r.left) / r.width));
    const y = Math.min(1, Math.max(0, (event.clientY - r.top) / r.height));
    this.tilt.set({ rx: (0.5 - y) * 10, ry: (x - 0.5) * 12, mx: x * 100, my: y * 100, active: true });
  }

  protected onPointerLeave(): void {
    this.tilt.set({ rx: 0, ry: 0, mx: 50, my: 30, active: false });
  }

  private get reducedMotion(): boolean {
    return typeof matchMedia === 'function' && matchMedia('(prefers-reduced-motion: reduce)').matches;
  }

  // ---------- confetti (first view of a ticket on this device) ----------

  private celebrateOnce(code: string): void {
    const key = `sw2026.celebrated.${code}`;
    try {
      if (localStorage.getItem(key) || this.reducedMotion) {
        return;
      }
      localStorage.setItem(key, '1');
    } catch {
      return;
    }
    const pieces: Confetto[] = Array.from({ length: 90 }, () => ({
      left: Math.random() * 100,
      delay: Math.random() * 0.6,
      duration: 2.4 + Math.random() * 1.8,
      color: SDG_COLORS[Math.floor(Math.random() * SDG_COLORS.length)],
      size: 6 + Math.random() * 7,
      drift: (Math.random() - 0.5) * 160,
      spin: 360 + Math.random() * 720
    }));
    this.confetti.set(pieces);
    this.confettiTimer = setTimeout(() => this.confetti.set([]), 5000);
  }

  // ---------- actions ----------

  protected async copyLink(): Promise<void> {
    const code = this.code();
    if (!code) {
      return;
    }
    try {
      await navigator.clipboard.writeText(ticketUrl(code));
      this.copied.set(true);
      setTimeout(() => this.copied.set(false), 2000);
    } catch {
      // Clipboard blocked — the address bar still has the link.
    }
  }

  protected async share(): Promise<void> {
    const code = this.code();
    if (!code) {
      return;
    }
    if (navigator.share) {
      try {
        await navigator.share({ title: 'My Sustainability Week 2026 ticket', url: ticketUrl(code) });
      } catch {
        // User cancelled.
      }
    } else {
      await this.copyLink();
    }
  }

  protected get canShare(): boolean {
    return typeof navigator !== 'undefined' && typeof navigator.share === 'function';
  }

  protected print(): void {
    window.print();
  }

  /** Draw the whole ticket as a phone-sized PNG (1080×1920) and download it. */
  protected async saveImage(): Promise<void> {
    const t = this.ticket();
    const qr = this.qr();
    if (!t || !qr || this.saving()) {
      return;
    }
    this.saving.set(true);
    try {
      const url = await this.renderTicketImage(t, qr);
      const a = document.createElement('a');
      a.href = url;
      a.download = `SW2026-Ticket-${shortRef(t.ticket_code)}.png`;
      a.click();
    } catch {
      // Fall back to the plain QR image.
      const a = document.createElement('a');
      a.href = qr;
      a.download = `SW2026-ticket-${shortRef(t.ticket_code)}.png`;
      a.click();
    }
    this.saving.set(false);
  }

  private async renderTicketImage(t: Ticket, qrSrc: string): Promise<string> {
    const W = 1080;
    const H = 1920;
    const canvas = document.createElement('canvas');
    canvas.width = W;
    canvas.height = H;
    const ctx = canvas.getContext('2d')!;
    await document.fonts?.ready;

    const [logo, qr] = await Promise.all([loadImage('sw2026-logo.png'), loadImage(qrSrc)]);

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
    const name = t.full_name || 'Guest';
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

    return canvas.toDataURL('image/png');
  }

  // ---------- find view ----------

  protected async find(): Promise<void> {
    if (this.searching()) {
      return;
    }
    const email = this.email.trim();
    const name = this.name.trim();
    if (!email || !name) {
      this.findError.set('Please enter both your email and your name.');
      return;
    }
    this.searching.set(true);
    this.findError.set(null);
    this.results.set(null);
    try {
      this.results.set(await findTickets(email, name));
    } catch {
      this.findError.set('Something went wrong. Please try again.');
    }
    this.searching.set(false);
  }
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
