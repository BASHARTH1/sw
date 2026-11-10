import { Component, computed, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { supabase } from '../../core/supabase.client';
import { EVENT_DAYS, checkIn, dayLabel, isDoorStaff, qrPng, shortRef, ticketUrl, todayInBahrain, undoCheckIn } from '../../core/tickets';
import { renderTicketImage } from '../../core/ticket-image';

interface Submission {
  id: string;
  created_at: string;
  type: string;
  full_name: string | null;
  email: string | null;
  ticket_code: string | null;
  ticket_emailed_at?: string | null;
  data: Record<string, unknown>;
}

interface AttendingPost {
  created_at: string;
  name: string;
  organization: string | null;
  action: 'download' | 'share';
  device_id: string | null;
}

/** One person who made an "I'm attending" post (repeat downloads merged). */
interface Poster {
  name: string;
  organization: string | null;
  last: string;
  times: number;
  shared: boolean;
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
  /** ticket_code currently being emailed. */
  protected readonly emailing = signal<string | null>(null);
  /** Per ticket: result of the last email attempt in this session. */
  protected readonly emailNote = signal<Record<string, { ok: boolean; text: string }>>({});
  /** Progress of "Email all unsent"; null when not running. */
  protected readonly bulk = signal<{ done: number; total: number; sent: number; failed: number; running: boolean } | null>(null);
  private stopBulk = false;

  // "Add person" form
  protected readonly addOpen = signal(false);
  protected readonly adding = signal(false);
  protected readonly addError = signal<string | null>(null);
  protected readonly added = signal<{ code: string; name: string; email: string } | null>(null);
  protected addName = '';
  protected addOrg = '';
  protected addEmail = '';
  protected addType = 'Guest';

  /** "I'm attending" posts made on /attending. */
  protected readonly posts = signal<AttendingPost[]>([]);
  protected readonly postsOpen = signal(false);
  /** Unique people, newest first: same device + same name counts once. */
  protected readonly posters = computed<Poster[]>(() => {
    const map = new Map<string, Poster>();
    for (const p of this.posts()) {
      const key = (p.device_id ?? p.created_at) + '|' + p.name.trim().toLowerCase();
      const cur = map.get(key);
      if (cur) {
        cur.times++;
        cur.shared ||= p.action === 'share';
        cur.organization ||= p.organization;
        if (p.created_at > cur.last) {
          cur.last = p.created_at;
        }
      } else {
        map.set(key, { name: p.name, organization: p.organization, last: p.created_at, times: 1, shared: p.action === 'share' });
      }
    }
    return [...map.values()].sort((a, b) => b.last.localeCompare(a.last));
  });

  /** Registrations with an email address whose ticket hasn't been emailed yet. */
  protected readonly unsent = computed(() => this.subs().filter((s) => s.ticket_code && s.email && !s.ticket_emailed_at));

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
    await Promise.all([this.loadCheckins(), this.loadPosts()]);
    this.loading.set(false);
  }

  private async loadPosts(): Promise<void> {
    const { data, error } = await supabase
      .from('attending_posts')
      .select('created_at, name, organization, action, device_id')
      .order('created_at', { ascending: false })
      .limit(5000);
    if (!error && data) {
      this.posts.set(data as AttendingPost[]);
    }
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

  protected openAdd(): void {
    this.addName = '';
    this.addOrg = '';
    this.addEmail = '';
    this.addError.set(null);
    this.added.set(null);
    this.addOpen.set(true);
  }

  protected closeAdd(): void {
    if (!this.adding()) {
      this.addOpen.set(false);
    }
  }

  /** Register someone who didn't sign up; they get a ticket straight away. */
  protected async addPerson(): Promise<void> {
    const name = this.addName.trim();
    if (this.adding()) {
      return;
    }
    if (!name) {
      this.addError.set('Please enter a name.');
      return;
    }
    const email = this.addEmail.trim().toLowerCase();
    if (email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      this.addError.set('Please check the email address, or leave it empty.');
      return;
    }
    this.adding.set(true);
    this.addError.set(null);
    const { data, error } = await supabase.rpc('admin_add_registration', {
      p_name: name,
      p_org: this.addOrg.trim(),
      p_type: this.addType,
      ...(email ? { p_email: email } : {})
    });
    this.adding.set(false);
    if (error || !data) {
      this.addError.set(
        error?.code === 'PGRST202'
          ? 'Run supabase/admin-add.sql in Supabase first.'
          : `Could not add this person${error?.message ? `: ${error.message}` : '.'}`
      );
      return;
    }
    this.added.set({ code: data as string, name, email });
    this.filterType.set('All');
    this.search.set('');
    await this.load();
  }

  /** The just-added person's row, once the list has reloaded. */
  protected addedSub(): Submission | undefined {
    const a = this.added();
    return a ? this.subs().find((s) => s.ticket_code === a.code) : undefined;
  }

  protected async emailAdded(): Promise<void> {
    const s = this.addedSub();
    if (s && !this.emailing() && !this.bulk()?.running) {
      await this.sendTicket(s);
    }
  }

  protected addAnother(): void {
    this.addName = '';
    this.addOrg = '';
    this.addEmail = '';
    this.added.set(null);
  }

  protected async copyLink(code: string): Promise<void> {
    try {
      await navigator.clipboard.writeText(ticketUrl(code));
      this.copiedCode.set(code);
      setTimeout(() => this.copiedCode.set(null), 2000);
    } catch {
      prompt('Copy the ticket link:', ticketUrl(code));
    }
  }

  /** Ticket email status for the row icon: green sent, red failed, orange not sent yet. */
  protected mailState(s: Submission): 'sending' | 'sent' | 'error' | 'none' | 'na' {
    const code = s.ticket_code;
    if (!code || !s.email) {
      return 'na';
    }
    if (this.emailing() === code) {
      return 'sending';
    }
    const note = this.emailNote()[code];
    if (note) {
      return note.ok ? 'sent' : 'error';
    }
    return s.ticket_emailed_at ? 'sent' : 'none';
  }

  /** Email this person their ticket from sw@gulfuniversity.edu.bh. */
  protected async emailTicket(s: Submission, event: Event): Promise<void> {
    event.stopPropagation();
    if (!this.emailing() && !this.bulk()?.running) {
      await this.sendTicket(s);
    }
  }

  /**
   * Email every ticket that hasn't been sent yet, one at a time.
   * Paced to stay under Microsoft 365's limit of 30 messages a minute per mailbox.
   */
  protected async emailAllUnsent(): Promise<void> {
    const list = this.unsent();
    if (!list.length || this.emailing() || this.bulk()?.running) {
      return;
    }
    if (!confirm(`Email tickets to ${list.length} ${list.length === 1 ? 'person' : 'people'} who haven't received one yet?\n\nThis takes about ${Math.max(1, Math.ceil((list.length * 2.2) / 60))} min. Keep this page open.`)) {
      return;
    }
    this.stopBulk = false;
    const progress = { done: 0, total: list.length, sent: 0, failed: 0, running: true };
    this.bulk.set({ ...progress });
    let failedInARow = 0;
    for (const s of list) {
      if (this.stopBulk) {
        break;
      }
      const started = Date.now();
      const ok = await this.sendTicket(s);
      progress.done++;
      progress[ok ? 'sent' : 'failed']++;
      this.bulk.set({ ...progress });
      // Stop early if every send is failing (e.g. a setup problem) instead of failing the whole list.
      failedInARow = ok ? 0 : failedInARow + 1;
      if (failedInARow >= 3) {
        break;
      }
      const wait = 2200 - (Date.now() - started);
      if (wait > 0 && progress.done < progress.total) {
        await new Promise((r) => setTimeout(r, wait));
      }
    }
    this.bulk.set({ ...progress, running: false });
  }

  protected stopEmailAll(): void {
    this.stopBulk = true;
  }

  /** Send one ticket email; returns true when it went out. */
  private async sendTicket(s: Submission): Promise<boolean> {
    const code = s.ticket_code;
    if (!code || !s.email) {
      return false;
    }
    let ok = false;
    this.emailing.set(code);
    const note = (ok: boolean, text: string) => this.emailNote.update((m) => ({ ...m, [code]: { ok, text } }));
    try {
      const { data } = await supabase.auth.getSession();
      const token = data.session?.access_token;
      if (!token) {
        throw new Error('Your session has expired. Please sign in again.');
      }
      // The full ticket as an image, attached to the email. JPEG keeps it small; skip it if drawing fails.
      const image = await qrPng(ticketUrl(code))
        .then((qr) => renderTicketImage({ ticket_code: code, full_name: s.full_name, type: s.type }, qr, 'image/jpeg'))
        .catch(() => null);
      const res = await fetch('/api/send-ticket', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body: JSON.stringify({ code, image })
      });
      const body = (await res.json().catch(() => ({}))) as { error?: string; sentAt?: string; to?: string };
      if (!res.ok) {
        throw new Error(body.error || `Sending failed (${res.status}).`);
      }
      const sentAt = body.sentAt || new Date().toISOString();
      this.subs.update((list) => list.map((x) => (x.id === s.id ? { ...x, ticket_emailed_at: sentAt } : x)));
      note(true, `Sent to ${body.to || s.email}`);
      ok = true;
    } catch (e) {
      note(false, e instanceof Error ? e.message : 'Sending failed.');
    }
    this.emailing.set(null);
    return ok;
  }

  protected async logout(): Promise<void> {
    await supabase.auth.signOut();
    this.authed.set(false);
    this.subs.set([]);
    this.checkins.set({});
    this.posts.set([]);
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

  protected exportPostsCsv(): void {
    const esc = (v: unknown) => {
      const s = String(v ?? '');
      return /[",\n]/.test(s) ? '"' + s.replace(/"/g, '""') + '"' : s;
    };
    const lines = ['name,organization,last_made,times,shared'];
    for (const p of this.posters()) {
      lines.push([p.name, p.organization, p.last, p.times, p.shared ? 'yes' : 'no'].map(esc).join(','));
    }
    const url = URL.createObjectURL(new Blob([lines.join('\n')], { type: 'text/csv;charset=utf-8;' }));
    const a = document.createElement('a');
    a.href = url;
    a.download = 'im-attending-posts.csv';
    a.click();
    URL.revokeObjectURL(url);
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
