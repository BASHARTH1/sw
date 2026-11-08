import { Component, ElementRef, OnDestroy, signal, viewChild } from '@angular/core';
import { FormsModule } from '@angular/forms';
import jsQR from 'jsqr';
import { supabase } from '../../core/supabase.client';
import { CheckInResult, checkIn, dayLabel, isDoorStaff, parseTicketCode, todayInBahrain } from '../../core/tickets';

type ScanState = 'idle' | 'starting' | 'scanning' | 'denied' | 'unsupported';

interface Detector {
  detect(source: CanvasImageSource): Promise<Array<{ rawValue: string }>>;
}

/** Ignore the same QR for this long after its result is dismissed, so it isn't re-read while still in view. */
const REPEAT_GUARD_MS = 4000;
const AUTO_DISMISS_MS = 3500;

/**
 * /scan — door staff scan attendee QR tickets with the phone camera.
 * Requires the same Supabase staff login as /admin. Each ticket checks in once per day.
 */
@Component({
  selector: 'app-scan',
  standalone: true,
  imports: [FormsModule],
  templateUrl: './scan.html',
  styleUrl: './scan.css'
})
export class ScanComponent implements OnDestroy {
  private readonly video = viewChild<ElementRef<HTMLVideoElement>>('video');

  protected email = '';
  protected password = '';
  protected manualCode = '';

  protected readonly checking = signal(true);
  protected readonly authed = signal(false);
  /** Door staff can only scan, so links to the admin page are hidden for them. */
  protected readonly doorStaff = signal(false);
  protected readonly loggingIn = signal(false);
  protected readonly loginError = signal<string | null>(null);

  protected readonly state = signal<ScanState>('idle');
  protected readonly busy = signal(false);
  protected readonly result = signal<CheckInResult | null>(null);
  protected readonly error = signal<string | null>(null);
  protected readonly todayCount = signal<number | null>(null);
  protected readonly todayLabel = dayLabel(todayInBahrain());

  private stream: MediaStream | null = null;
  private detector: Detector | null = null;
  private canvas: HTMLCanvasElement | null = null;
  private loopTimer: ReturnType<typeof setTimeout> | null = null;
  private dismissTimer: ReturnType<typeof setTimeout> | null = null;
  private lastCode: string | null = null;
  private lastCodeAt = 0;
  private audio: AudioContext | null = null;

  constructor() {
    void this.restore();
  }

  ngOnDestroy(): void {
    this.stopCamera();
    this.clearDismiss();
    void this.audio?.close();
  }

  // ---------- auth ----------

  private async restore(): Promise<void> {
    const { data } = await supabase.auth.getSession();
    if (data.session) {
      this.authed.set(true);
      this.doorStaff.set(isDoorStaff(data.session.user));
      void this.loadCount();
    }
    this.checking.set(false);
  }

  protected async login(): Promise<void> {
    if (this.loggingIn()) {
      return;
    }
    this.loggingIn.set(true);
    this.loginError.set(null);
    const { data, error } = await supabase.auth.signInWithPassword({ email: this.email.trim(), password: this.password });
    this.loggingIn.set(false);
    if (error) {
      this.loginError.set('Invalid email or password.');
      return;
    }
    this.password = '';
    this.authed.set(true);
    this.doorStaff.set(isDoorStaff(data.user));
    void this.loadCount();
  }

  protected async logout(): Promise<void> {
    this.stopCamera();
    await supabase.auth.signOut();
    this.authed.set(false);
    this.result.set(null);
  }

  private async loadCount(): Promise<void> {
    const { count, error } = await supabase
      .from('checkins')
      .select('id', { count: 'exact', head: true })
      .eq('event_day', todayInBahrain());
    if (!error) {
      this.todayCount.set(count ?? 0);
    }
  }

  // ---------- camera ----------

  protected async startCamera(): Promise<void> {
    if (!navigator.mediaDevices?.getUserMedia) {
      this.state.set('unsupported');
      return;
    }
    this.state.set('starting');
    try {
      this.stream = await navigator.mediaDevices.getUserMedia({
        video: { facingMode: { ideal: 'environment' }, width: { ideal: 1280 }, height: { ideal: 720 } },
        audio: false
      });
    } catch {
      this.state.set('denied');
      return;
    }

    const BD = (window as unknown as { BarcodeDetector?: new (o: { formats: string[] }) => Detector }).BarcodeDetector;
    if (BD) {
      try {
        this.detector = new BD({ formats: ['qr_code'] });
      } catch {
        this.detector = null;
      }
    }

    this.state.set('scanning');
    // Wait a tick so the <video> element is rendered.
    setTimeout(async () => {
      const el = this.video()?.nativeElement;
      if (!el || !this.stream) {
        return;
      }
      el.srcObject = this.stream;
      el.setAttribute('playsinline', 'true');
      try {
        await el.play();
      } catch {
        // Autoplay restrictions — the user already tapped, so this is rare.
      }
      this.scheduleScan();
    });

    // Unlock audio on this user gesture (iOS needs it).
    try {
      this.audio ??= new AudioContext();
      void this.audio.resume();
    } catch {
      this.audio = null;
    }
  }

  protected stopCamera(): void {
    if (this.loopTimer) {
      clearTimeout(this.loopTimer);
      this.loopTimer = null;
    }
    this.stream?.getTracks().forEach((t) => t.stop());
    this.stream = null;
    if (this.state() === 'scanning' || this.state() === 'starting') {
      this.state.set('idle');
    }
  }

  private scheduleScan(): void {
    this.loopTimer = setTimeout(() => void this.scanFrame(), 120);
  }

  private async scanFrame(): Promise<void> {
    if (!this.stream) {
      return;
    }
    const el = this.video()?.nativeElement;
    if (el && el.readyState >= 2 && !this.busy() && !this.result()) {
      const text = await this.readQr(el);
      const code = text ? parseTicketCode(text) : null;
      if (code && !(code === this.lastCode && Date.now() - this.lastCodeAt < REPEAT_GUARD_MS)) {
        await this.submit(code);
      }
    }
    if (this.stream) {
      this.scheduleScan();
    }
  }

  private async readQr(el: HTMLVideoElement): Promise<string | null> {
    if (this.detector) {
      try {
        const found = await this.detector.detect(el);
        return found[0]?.rawValue ?? null;
      } catch {
        this.detector = null; // fall back to jsQR
      }
    }
    const w = el.videoWidth;
    const h = el.videoHeight;
    if (!w || !h) {
      return null;
    }
    // Downscale for speed; QR tickets are large on screen.
    const scale = Math.min(1, 640 / Math.max(w, h));
    const cw = Math.round(w * scale);
    const ch = Math.round(h * scale);
    this.canvas ??= document.createElement('canvas');
    this.canvas.width = cw;
    this.canvas.height = ch;
    const ctx = this.canvas.getContext('2d', { willReadFrequently: true });
    if (!ctx) {
      return null;
    }
    ctx.drawImage(el, 0, 0, cw, ch);
    const img = ctx.getImageData(0, 0, cw, ch);
    return jsQR(img.data, cw, ch, { inversionAttempts: 'dontInvert' })?.data ?? null;
  }

  // ---------- check-in ----------

  protected async submitManual(): Promise<void> {
    const code = parseTicketCode(this.manualCode);
    if (!code) {
      this.error.set('That is not a valid ticket code or link.');
      return;
    }
    this.manualCode = '';
    await this.submit(code);
  }

  private async submit(code: string): Promise<void> {
    this.busy.set(true);
    this.error.set(null);
    try {
      const res = await checkIn(code);
      this.result.set(res);
      this.feedback(res.status);
      if (res.status === 'ok') {
        this.todayCount.update((n) => (n ?? 0) + 1);
      }
    } catch (e) {
      const msg = (e as { message?: string })?.message ?? '';
      if (/sign-in|JWT|42501/i.test(msg)) {
        this.error.set('Your session expired. Please sign in again.');
        this.authed.set(false);
        this.stopCamera();
      } else {
        this.error.set('Could not reach the server. Check the connection and scan again.');
      }
    }
    this.lastCode = code;
    this.lastCodeAt = Date.now();
    this.busy.set(false);
    if (this.result()) {
      this.clearDismiss();
      this.dismissTimer = setTimeout(() => this.dismiss(), AUTO_DISMISS_MS);
    }
  }

  protected dismiss(): void {
    this.clearDismiss();
    this.result.set(null);
    this.lastCodeAt = Date.now();
  }

  private clearDismiss(): void {
    if (this.dismissTimer) {
      clearTimeout(this.dismissTimer);
      this.dismissTimer = null;
    }
  }

  protected dayLabel = dayLabel;

  protected fmtTime(value: string | null): string {
    return value
      ? new Date(value).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', timeZone: 'Asia/Bahrain' })
      : '';
  }

  /** Vibrate and beep: one high beep for OK, two low beeps for a problem. */
  private feedback(status: CheckInResult['status']): void {
    try {
      navigator.vibrate?.(status === 'ok' ? 120 : [80, 60, 80, 60, 80]);
    } catch {
      // Not supported.
    }
    const ctx = this.audio;
    if (!ctx) {
      return;
    }
    const beep = (freq: number, start: number, dur: number) => {
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.frequency.value = freq;
      osc.type = 'sine';
      gain.gain.setValueAtTime(0.25, ctx.currentTime + start);
      gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + start + dur);
      osc.connect(gain).connect(ctx.destination);
      osc.start(ctx.currentTime + start);
      osc.stop(ctx.currentTime + start + dur);
    };
    if (status === 'ok') {
      beep(1320, 0, 0.18);
    } else {
      beep(330, 0, 0.15);
      beep(330, 0.22, 0.15);
    }
  }
}
