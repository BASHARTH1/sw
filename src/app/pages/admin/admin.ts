import { Component, computed, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { supabase } from '../../core/supabase.client';
import { EVENT_DAYS, checkIn, dayLabel, isDoorStaff, shortRef, ticketUrl, todayInBahrain, undoCheckIn } from '../../core/tickets';

interface Submission {
  id: string;
  created_at: string;
  type: string;
  full_name: string | null;
  email: string | null;
  ticket_code: string | null;
  data: Record<string, unknown>;
}

interface CheckinRow {
  ticket_code: string;
  event_day: string;
  checked_in_at: string;
}

@Component({
  selector: 'app-admin',
  standalone: true,
  imports: [FormsModule],
  templateUrl: './admin.html',
  styleUrl: './admin.css'
})
export class AdminComponent {
  protected email = '';
  protected password = '';

  protected readonly authed = signal(false);
  protected readonly checking = signal(true);
  protected readonly loading = signal(false);
  protected readonly loginError = signal<string | null>(null);
  protected readonly subs = signal<Submission[]>([]);
  protected readonly filterType = signal('All');
  protected readonly expandedId = signal<string | null>(null);
  protected readonly search = signal('');
  /** ticket_code -> days checked in (ISO dates). */
  protected readonly checkins = signal<Record<string, string[]>>({});
  protected readonly checkingIn = signal<string | null>(null);
  protected readonly copiedCode = signal<string | null>(null);

  protected readonly days = EVENT_DAYS;
  protected readonly today = todayInBahrain();
  protected readonly shortRef = shortRef;
  protected readonly ticketUrl = ticketUrl;
  protected readonly dayLabel = dayLabel;

  /** Check-ins per event day, for the summary strip. */
  protected readonly dayCounts = computed(() => {
    const counts: Record<string, number> = {};
    for (const list of Object.values(this.checkins())) {
      for (const d of list) {
        counts[d] = (counts[d] ?? 0) + 1;
      }
    }
    return counts;
  });

  protected readonly types = ['All', 'Keynote Speaker', 'Sponsor', 'Exhibitor', 'Participant', 'Guest', 'EcoBot Challenge'];

  protected readonly filtered = computed(() => {
    const t = this.filterType();
    const q = this.search().trim().toLowerCase();
    let list = this.subs();
    if (t !== 'All') {
      list = list.filter((s) => s.type === t);
    }
    if (q) {
      list = list.filter(
        (s) =>
          (s.full_name ?? '').toLowerCase().includes(q) ||
          (s.email ?? '').toLowerCase().includes(q) ||
          (s.ticket_code ?? '').toLowerCase().startsWith(q)
      );
    }
    return list;
  });

  protected readonly counts = computed(() => {
    const map: Record<string, number> = {};
    for (const s of this.subs()) {
      map[s.type] = (map[s.type] ?? 0) + 1;
    }
    return map;
  });

  constructor() {
    void this.restore();
  }

  private async restore(): Promise<void> {
    const { data } = await supabase.auth.getSession();
    if (isDoorStaff(data.session?.user)) {
      location.replace('/scan');
      return;
    }
    if (data.session) {
      this.authed.set(true);
      await this.load();
    }
    this.checking.set(false);
  }

  protected async login(): Promise<void> {
    if (this.loading()) {
      return;
    }
    this.loading.set(true);
    this.loginError.set(null);
    const { data, error } = await supabase.auth.signInWithPassword({
      email: this.email.trim(),
      password: this.password
    });
    if (!error && isDoorStaff(data.user)) {
      location.replace('/scan');
      return;
    }
    if (error) {
      this.loginError.set('Invalid email or password.');
      this.loading.set(false);
      return;
    }
    this.password = '';
    this.authed.set(true);
    await this.load();
    this.loading.set(false);
  }

  protected async load(): Promise<void> {
    this.loading.set(true);
    const { data, error } = await supabase
      .from('registrations')
      .select('*')
      .order('created_at', { ascending: false });
    if (!error && data) {
      this.subs.set(data as Submission[]);
    }
    await this.loadCheckins();
    this.loading.set(false);
  }

  private async loadCheckins(): Promise<void> {
    const { data, error } = await supabase.from('checkins').select('ticket_code, event_day, checked_in_at');
    if (error || !data) {
      return;
    }
    const map: Record<string, string[]> = {};
    for (const row of data as CheckinRow[]) {
      (map[row.ticket_code] ??= []).push(row.event_day);
    }
    Object.values(map).forEach((list) => list.sort());
    this.checkins.set(map);
  }

  protected daysIn(s: Submission): string[] {
    return s.ticket_code ? (this.checkins()[s.ticket_code] ?? []) : [];
  }

  protected inToday(s: Submission): boolean {
    return this.daysIn(s).includes(this.today);
  }

  protected async checkInNow(s: Submission, event: Event): Promise<void> {
    event.stopPropagation();
    const code = s.ticket_code;
    if (!code || this.checkingIn()) {
      return;
    }
    this.checkingIn.set(code);
    try {
      const res = await checkIn(code);
      this.checkins.update((map) => ({ ...map, [code]: res.checked_in_days }));
    } catch {
      alert('Could not check in. Please try again.');
    }
    this.checkingIn.set(null);
  }

  /** Remove a check-in made by mistake, after confirming. */
  protected async undoDay(s: Submission, day: string, event: Event): Promise<void> {
    event.stopPropagation();
    const code = s.ticket_code;
    if (!code || this.checkingIn()) {
      return;
    }
    const who = s.full_name || 'this person';
    if (!confirm(`Remove the ${dayLabel(day)} check-in for ${who}?`)) {
      return;
    }
    this.checkingIn.set(code);
    try {
      const days = await undoCheckIn(code, day);
      this.checkins.update((map) => ({ ...map, [code]: days }));
    } catch {
      alert('Could not undo the check-in. Please try again.');
    }
    this.checkingIn.set(null);
  }

  protected async copyTicket(s: Submission, event: Event): Promise<void> {
    event.stopPropagation();
    const code = s.ticket_code;
    if (!code) {
      return;
    }
    try {
      await navigator.clipboard.writeText(ticketUrl(code));
      this.copiedCode.set(code);
      setTimeout(() => this.copiedCode.set(null), 2000);
    } catch {
      prompt('Copy the ticket link:', ticketUrl(code));
    }
  }

  protected async logout(): Promise<void> {
    await supabase.auth.signOut();
    this.authed.set(false);
    this.subs.set([]);
    this.checkins.set({});
    this.expandedId.set(null);
  }

  protected toggle(id: string): void {
    this.expandedId.set(this.expandedId() === id ? null : id);
  }

  protected entries(data: Record<string, unknown>): Array<[string, string]> {
    return Object.entries(data).map(([k, v]) => [k, Array.isArray(v) ? v.join(', ') : String(v ?? '')]);
  }

  protected fmtDate(value: string): string {
    return new Date(value).toLocaleString();
  }

  protected exportCsv(): void {
    const rows = this.filtered();
    if (!rows.length) {
      return;
    }
    // collect every field key across the filtered rows
    const keys = new Set<string>();
    for (const r of rows) {
      Object.keys(r.data).forEach((k) => keys.add(k));
    }
    const cols = ['created_at', 'type', 'full_name', 'email', 'ticket_url', 'days_checked_in', ...keys];
    const esc = (v: unknown) => {
      const s = Array.isArray(v) ? v.join('; ') : String(v ?? '');
      return /[",\n]/.test(s) ? '"' + s.replace(/"/g, '""') + '"' : s;
    };
    const lines = [cols.join(',')];
    for (const r of rows) {
      const flat: Record<string, unknown> = {
        created_at: r.created_at,
        type: r.type,
        full_name: r.full_name,
        email: r.email,
        ticket_url: r.ticket_code ? ticketUrl(r.ticket_code) : '',
        days_checked_in: this.daysIn(r).map(dayLabel),
        ...r.data
      };
      lines.push(cols.map((c) => esc(flat[c])).join(','));
    }
    const blob = new Blob([lines.join('\n')], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `registrations-${this.filterType().toLowerCase().replace(/\s+/g, '-')}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  }
}
