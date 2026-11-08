import { supabase } from './supabase.client';

/** The five event days, in order. Check-in is once per ticket per day. */
export const EVENT_DAYS: ReadonlyArray<{ iso: string; label: string; short: string; venue: string }> = [
  { iso: '2026-11-15', label: 'Day 1', short: 'Sun 15', venue: 'The Art Hotel, Amwaj' },
  { iso: '2026-11-16', label: 'Day 2', short: 'Mon 16', venue: 'Gulf University & Bahrain Polytechnic' },
  { iso: '2026-11-17', label: 'Day 3', short: 'Tue 17', venue: 'Gulf University & Bahrain Polytechnic' },
  { iso: '2026-11-18', label: 'Day 4', short: 'Wed 18', venue: 'Gulf University & Bahrain Polytechnic' },
  { iso: '2026-11-19', label: 'Day 5', short: 'Thu 19', venue: 'Gulf University & Bahrain Polytechnic' }
];

export interface Ticket {
  ticket_code: string;
  full_name: string | null;
  type: string;
  created_at: string;
  checked_in_days: string[];
}

export interface CheckInResult {
  status: 'ok' | 'already' | 'invalid';
  full_name: string | null;
  type: string | null;
  event_day: string;
  checked_in_at: string | null;
  checked_in_days: string[];
}

const UUID_RE = /[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}/i;
const STORAGE_KEY = 'sw2026.tickets';

/** Public link to a ticket. The QR code encodes this, so a normal phone camera opens the ticket page. */
export function ticketUrl(code: string): string {
  return `${location.origin}/ticket/${code}`;
}

/** Pull a ticket code out of whatever a scanner read: a ticket URL or a bare code. */
export function parseTicketCode(text: string): string | null {
  const match = UUID_RE.exec(text.trim());
  return match ? match[0].toLowerCase() : null;
}

/** Short, human-readable reference printed under the QR (first 8 characters). */
export function shortRef(code: string): string {
  return code.slice(0, 8).toUpperCase();
}

export function dayLabel(iso: string): string {
  return EVENT_DAYS.find((d) => d.iso === iso)?.label ?? iso;
}

/** Today's date in Bahrain as YYYY-MM-DD — matches how the database records check-ins. */
export function todayInBahrain(): string {
  return new Intl.DateTimeFormat('en-CA', { timeZone: 'Asia/Bahrain' }).format(new Date());
}

/** QR as a PNG data URL. The library is loaded on demand to keep it off the home page's initial bundle. */
export async function qrPng(text: string): Promise<string> {
  const QRCode = await import('qrcode');
  return QRCode.toDataURL(text, {
    errorCorrectionLevel: 'M',
    margin: 2,
    width: 720,
    color: { dark: '#0b1437', light: '#ffffff' }
  });
}

export function newTicketCode(): string {
  if (typeof crypto.randomUUID === 'function') {
    return crypto.randomUUID();
  }
  // Fallback for older browsers: RFC 4122 v4 from getRandomValues.
  const b = crypto.getRandomValues(new Uint8Array(16));
  b[6] = (b[6] & 0x0f) | 0x40;
  b[8] = (b[8] & 0x3f) | 0x80;
  const h = Array.from(b, (x) => x.toString(16).padStart(2, '0')).join('');
  return `${h.slice(0, 8)}-${h.slice(8, 12)}-${h.slice(12, 16)}-${h.slice(16, 20)}-${h.slice(20)}`;
}

// ---------- tickets remembered on this device ----------

export interface SavedTicket {
  code: string;
  name: string | null;
  type: string;
}

export function savedTickets(): SavedTicket[] {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    const list = raw ? (JSON.parse(raw) as SavedTicket[]) : [];
    return Array.isArray(list) ? list.filter((t) => t && typeof t.code === 'string') : [];
  } catch {
    return [];
  }
}

export function rememberTicket(ticket: SavedTicket): void {
  try {
    const list = savedTickets().filter((t) => t.code !== ticket.code);
    list.unshift(ticket);
    localStorage.setItem(STORAGE_KEY, JSON.stringify(list.slice(0, 10)));
  } catch {
    // Storage blocked (private mode etc.) — the ticket link still works.
  }
}

// ---------- database calls ----------

export async function getTicket(code: string): Promise<Ticket | null> {
  const { data, error } = await supabase.rpc('get_ticket', { p_code: code });
  if (error) {
    throw error;
  }
  const rows = (data ?? []) as Ticket[];
  return rows[0] ?? null;
}

export async function findTickets(email: string, name: string): Promise<SavedTicket[]> {
  const { data, error } = await supabase.rpc('find_tickets', { p_email: email, p_name: name });
  if (error) {
    throw error;
  }
  return ((data ?? []) as Array<{ ticket_code: string; full_name: string | null; type: string }>).map((r) => ({
    code: r.ticket_code,
    name: r.full_name,
    type: r.type
  }));
}

export async function checkIn(code: string): Promise<CheckInResult> {
  const { data, error } = await supabase.rpc('check_in', { p_code: code });
  if (error) {
    throw error;
  }
  return ((data ?? []) as CheckInResult[])[0];
}
