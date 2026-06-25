import { Component, computed, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { supabase } from '../../core/supabase.client';

interface Submission {
  id: string;
  created_at: string;
  type: string;
  full_name: string | null;
  email: string | null;
  data: Record<string, unknown>;
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

  protected readonly types = ['All', 'Keynote Speaker', 'Sponsor', 'Exhibitor', 'Participant', 'Guest'];

  protected readonly filtered = computed(() => {
    const t = this.filterType();
    const list = this.subs();
    return t === 'All' ? list : list.filter((s) => s.type === t);
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
    const { error } = await supabase.auth.signInWithPassword({
      email: this.email.trim(),
      password: this.password
    });
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
    this.loading.set(false);
  }

  protected async logout(): Promise<void> {
    await supabase.auth.signOut();
    this.authed.set(false);
    this.subs.set([]);
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
    const cols = ['created_at', 'type', 'full_name', 'email', ...keys];
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
