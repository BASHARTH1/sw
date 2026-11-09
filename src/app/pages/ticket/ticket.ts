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
import { SDG_COLORS, renderTicketImage } from '../../core/ticket-image';


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
      const url = await renderTicketImage(t, qr);
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
