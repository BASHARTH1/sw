import { Component, inject, signal } from '@angular/core';
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
export class TicketComponent {
  private readonly route = inject(ActivatedRoute);

  protected readonly days = EVENT_DAYS;
  protected readonly today = todayInBahrain();
  protected readonly shortRef = shortRef;

  // ticket view
  protected readonly code = signal<string | null>(null);
  protected readonly ticket = signal<Ticket | null>(null);
  protected readonly qr = signal<string | null>(null);
  protected readonly loading = signal(false);
  protected readonly notFound = signal(false);
  protected readonly loadError = signal(false);
  protected readonly copied = signal(false);

  // find view
  protected email = '';
  protected name = '';
  protected readonly saved = signal<SavedTicket[]>([]);
  protected readonly searching = signal(false);
  protected readonly results = signal<SavedTicket[] | null>(null);
  protected readonly findError = signal<string | null>(null);

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
      }
    } catch {
      this.loadError.set(true);
    }
    this.loading.set(false);
  }

  protected isCheckedIn(iso: string): boolean {
    return this.ticket()?.checked_in_days.includes(iso) ?? false;
  }

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

  protected downloadQr(): void {
    const qr = this.qr();
    const code = this.code();
    if (!qr || !code) {
      return;
    }
    const a = document.createElement('a');
    a.href = qr;
    a.download = `SW2026-ticket-${shortRef(code)}.png`;
    a.click();
  }

  protected print(): void {
    window.print();
  }

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
