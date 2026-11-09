import { AfterViewInit, Component, ElementRef, OnDestroy, inject, signal, viewChild } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { ActivatedRoute } from '@angular/router';

/** The 17 UN SDG colours, used for the ring around the portrait. */
const SDG_COLORS = [
  '#e5243b', '#dda63a', '#4c9f38', '#c5192d', '#ff3a21', '#26bde2', '#fcc30b', '#a21942', '#fd6925',
  '#dd1367', '#fd9d24', '#bf8b2e', '#3f7e44', '#0a97d9', '#56c02b', '#00689d', '#19486a'
];

const W = 1080;
const H = 1350;
/** Portrait circle on the artwork. */
const PC = { x: W / 2, y: 690, r: 258 };
const MAX_BYTES = 15 * 1024 * 1024;

export const ATTENDING_CAPTION =
  "I'm attending Sustainability Week 2026! 🌿 Co-innovating, Leading, Sustaining… " +
  'Join me 15–19 November 2026 in Bahrain, hosted by Gulf University & Bahrain Polytechnic. ' +
  'https://sw.gulfuniversity.edu.bh #SW2026 #SustainabilityWeek #SDGs #GulfUniversity #BahrainPolytechnic';

/**
 * /attending — "I'm attending" social post generator.
 * Name + portrait photo dropped into the Sustainability Week 2026 artwork, downloaded as a
 * 1080×1350 PNG or shared with a ready caption. The photo never leaves the browser.
 */
@Component({
  selector: 'app-attending',
  standalone: true,
  imports: [FormsModule],
  templateUrl: './attending.html',
  styleUrl: './attending.css'
})
export class AttendingComponent implements AfterViewInit, OnDestroy {
  private readonly route = inject(ActivatedRoute);
  private readonly canvasRef = viewChild.required<ElementRef<HTMLCanvasElement>>('canvas');
  private readonly fileRef = viewChild.required<ElementRef<HTMLInputElement>>('file');

  protected name = '';
  protected org = '';
  protected readonly caption = ATTENDING_CAPTION;

  protected readonly hasPhoto = signal(false);
  protected readonly zoom = signal(1);
  protected readonly dragOver = signal(false);
  protected readonly busy = signal(false);
  protected readonly message = signal<{ kind: 'ok' | 'error'; text: string } | null>(null);
  protected readonly copied = signal(false);
  protected readonly ready = signal(false);

  private photo: HTMLImageElement | null = null;
  private photoUrl: string | null = null;
  private logo: HTMLImageElement | null = null;
  /** Photo offset from the circle centre, in artwork pixels. */
  private offX = 0;
  private offY = 0;
  private pointers = new Map<number, { x: number; y: number }>();
  private pinchStart: { dist: number; zoom: number } | null = null;
  private frame = 0;

  constructor() {
    const q = this.route.snapshot.queryParamMap;
    this.name = (q.get('name') ?? '').slice(0, 40);
  }

  async ngAfterViewInit(): Promise<void> {
    try {
      await Promise.all([
        document.fonts?.load('700 80px "Playfair Display"'),
        document.fonts?.load('italic 400 30px Poppins'),
        document.fonts?.load('700 60px Poppins'),
        document.fonts?.load('600 30px Poppins')
      ]);
    } catch {
      // Fonts unavailable — the canvas falls back to system fonts.
    }
    try {
      this.logo = await loadImage('sw2026-logo.png');
    } catch {
      this.logo = null;
    }
    this.ready.set(true);
    this.draw();
  }

  ngOnDestroy(): void {
    cancelAnimationFrame(this.frame);
    if (this.photoUrl) {
      URL.revokeObjectURL(this.photoUrl);
    }
  }

  // ---------- photo ----------

  protected browse(): void {
    this.fileRef().nativeElement.click();
  }

  protected onFile(event: Event): void {
    const input = event.target as HTMLInputElement;
    const file = input.files?.[0];
    input.value = '';
    if (file) {
      void this.loadPhoto(file);
    }
  }

  protected onDragOver(event: DragEvent): void {
    event.preventDefault();
    this.dragOver.set(true);
  }

  protected onDrop(event: DragEvent): void {
    event.preventDefault();
    this.dragOver.set(false);
    const file = event.dataTransfer?.files?.[0];
    if (file) {
      void this.loadPhoto(file);
    }
  }

  private async loadPhoto(file: File): Promise<void> {
    this.message.set(null);
    if (!/^image\/(jpeg|png|webp|heic|heif)$/i.test(file.type) && !/\.(jpe?g|png|webp|heic)$/i.test(file.name)) {
      this.message.set({ kind: 'error', text: 'Choose a JPG, PNG or WebP photo.' });
      return;
    }
    if (file.size > MAX_BYTES) {
      this.message.set({ kind: 'error', text: 'That photo is larger than 15 MB. Choose a smaller one.' });
      return;
    }
    const url = URL.createObjectURL(file);
    try {
      const img = await loadImage(url);
      if (this.photoUrl) {
        URL.revokeObjectURL(this.photoUrl);
      }
      this.photoUrl = url;
      this.photo = img;
      this.offX = 0;
      this.offY = 0;
      this.zoom.set(1);
      this.hasPhoto.set(true);
      this.draw();
    } catch {
      URL.revokeObjectURL(url);
      this.message.set({ kind: 'error', text: "This photo couldn't be opened. Try a JPG or PNG." });
    }
  }

  protected removePhoto(): void {
    if (this.photoUrl) {
      URL.revokeObjectURL(this.photoUrl);
    }
    this.photo = null;
    this.photoUrl = null;
    this.hasPhoto.set(false);
    this.draw();
  }

  // ---------- reposition (drag, pinch, wheel, keys) ----------

  private toArtwork(): number {
    const rect = this.canvasRef().nativeElement.getBoundingClientRect();
    return W / rect.width;
  }

  protected onPointerDown(event: PointerEvent): void {
    if (!this.photo) {
      this.browse();
      return;
    }
    (event.target as HTMLElement).setPointerCapture(event.pointerId);
    this.pointers.set(event.pointerId, { x: event.clientX, y: event.clientY });
    if (this.pointers.size === 2) {
      const [a, b] = [...this.pointers.values()];
      this.pinchStart = { dist: Math.hypot(a.x - b.x, a.y - b.y), zoom: this.zoom() };
    }
  }

  protected onPointerMove(event: PointerEvent): void {
    const prev = this.pointers.get(event.pointerId);
    if (!prev || !this.photo) {
      return;
    }
    const next = { x: event.clientX, y: event.clientY };
    this.pointers.set(event.pointerId, next);
    if (this.pointers.size >= 2 && this.pinchStart) {
      const [a, b] = [...this.pointers.values()];
      const dist = Math.hypot(a.x - b.x, a.y - b.y);
      this.setZoom(this.pinchStart.zoom * (dist / this.pinchStart.dist));
      return;
    }
    const k = this.toArtwork();
    this.offX += (next.x - prev.x) * k;
    this.offY += (next.y - prev.y) * k;
    this.clamp();
    this.draw();
  }

  protected onPointerUp(event: PointerEvent): void {
    this.pointers.delete(event.pointerId);
    if (this.pointers.size < 2) {
      this.pinchStart = null;
    }
  }

  protected onWheel(event: WheelEvent): void {
    if (!this.photo) {
      return;
    }
    event.preventDefault();
    this.setZoom(this.zoom() * (event.deltaY < 0 ? 1.06 : 1 / 1.06));
  }

  protected onKey(event: KeyboardEvent): void {
    if (!this.photo) {
      return;
    }
    const step = event.shiftKey ? 40 : 12;
    const moves: Record<string, [number, number]> = {
      ArrowLeft: [-step, 0],
      ArrowRight: [step, 0],
      ArrowUp: [0, -step],
      ArrowDown: [0, step]
    };
    const m = moves[event.key];
    if (m) {
      event.preventDefault();
      this.offX += m[0];
      this.offY += m[1];
      this.clamp();
      this.draw();
    } else if (event.key === '+' || event.key === '=') {
      this.setZoom(this.zoom() * 1.08);
    } else if (event.key === '-') {
      this.setZoom(this.zoom() / 1.08);
    }
  }

  protected onZoomInput(value: number | string): void {
    this.setZoom(Number(value));
  }

  private setZoom(z: number): void {
    this.zoom.set(Math.min(4, Math.max(1, z)));
    this.clamp();
    this.draw();
  }

  /** Size of the drawn photo: cover the circle, then apply zoom. */
  private photoSize(): { w: number; h: number } {
    const img = this.photo!;
    const d = PC.r * 2;
    const cover = Math.max(d / img.naturalWidth, d / img.naturalHeight) * this.zoom();
    return { w: img.naturalWidth * cover, h: img.naturalHeight * cover };
  }

  /** Keep the circle fully covered by the photo. */
  private clamp(): void {
    if (!this.photo) {
      return;
    }
    const { w, h } = this.photoSize();
    const mx = Math.max(0, w / 2 - PC.r);
    const my = Math.max(0, h / 2 - PC.r);
    this.offX = Math.min(mx, Math.max(-mx, this.offX));
    this.offY = Math.min(my, Math.max(-my, this.offY));
  }

  // ---------- drawing ----------

  protected draw(): void {
    cancelAnimationFrame(this.frame);
    this.frame = requestAnimationFrame(() => this.render(this.canvasRef().nativeElement));
  }

  private render(canvas: HTMLCanvasElement): void {
    const ctx = canvas.getContext('2d');
    if (!ctx) {
      return;
    }
    ctx.clearRect(0, 0, W, H);

    // background
    const bg = ctx.createLinearGradient(0, 0, W, H);
    bg.addColorStop(0, '#050a24');
    bg.addColorStop(0.5, '#0b1437');
    bg.addColorStop(1, '#1e3a8a');
    ctx.fillStyle = bg;
    ctx.fillRect(0, 0, W, H);
    glow(ctx, 120, 160, 520, 'rgba(96,165,250,0.35)');
    glow(ctx, 980, 1250, 600, 'rgba(212,160,23,0.30)');
    glow(ctx, 1000, 420, 360, 'rgba(76,159,56,0.20)');
    glow(ctx, 60, 1100, 340, 'rgba(229,36,59,0.12)');

    // subtle dotted texture
    ctx.fillStyle = 'rgba(255,255,255,0.05)';
    for (let y = 30; y < H; y += 44) {
      for (let x = (y / 44) % 2 ? 30 : 52; x < W; x += 44) {
        ctx.beginPath();
        ctx.arc(x, y, 1.6, 0, Math.PI * 2);
        ctx.fill();
      }
    }

    // SDG band
    const bw = W / SDG_COLORS.length;
    SDG_COLORS.forEach((c, i) => {
      ctx.fillStyle = c;
      ctx.fillRect(i * bw, 0, bw + 1, 14);
    });

    // logo
    if (this.logo) {
      const lw = 640;
      const lh = (this.logo.naturalHeight / this.logo.naturalWidth) * lw;
      ctx.drawImage(this.logo, (W - lw) / 2, 50, lw, lh);
    }

    // headline
    ctx.textAlign = 'center';
    ctx.textBaseline = 'alphabetic';
    const gold = ctx.createLinearGradient(W / 2 - 330, 0, W / 2 + 330, 0);
    gold.addColorStop(0, '#fde68a');
    gold.addColorStop(0.5, '#facc15');
    gold.addColorStop(1, '#d4a017');
    ctx.fillStyle = gold;
    ctx.font = '700 92px "Playfair Display", Georgia, serif';
    ctx.shadowColor = 'rgba(0,0,0,0.35)';
    ctx.shadowBlur = 20;
    ctx.fillText("I'm attending", W / 2, 352);
    ctx.shadowBlur = 0;

    // SDG ring
    const ringR = PC.r + 26;
    const seg = (Math.PI * 2) / SDG_COLORS.length;
    ctx.lineWidth = 22;
    SDG_COLORS.forEach((c, i) => {
      ctx.strokeStyle = c;
      ctx.beginPath();
      ctx.arc(PC.x, PC.y, ringR, -Math.PI / 2 + i * seg + 0.025, -Math.PI / 2 + (i + 1) * seg - 0.025);
      ctx.stroke();
    });
    ctx.strokeStyle = 'rgba(255,255,255,0.9)';
    ctx.lineWidth = 6;
    ctx.beginPath();
    ctx.arc(PC.x, PC.y, PC.r + 6, 0, Math.PI * 2);
    ctx.stroke();

    // portrait
    ctx.save();
    ctx.beginPath();
    ctx.arc(PC.x, PC.y, PC.r, 0, Math.PI * 2);
    ctx.clip();
    if (this.photo) {
      const { w, h } = this.photoSize();
      ctx.drawImage(this.photo, PC.x - w / 2 + this.offX, PC.y - h / 2 + this.offY, w, h);
    } else {
      const pg = ctx.createLinearGradient(0, PC.y - PC.r, 0, PC.y + PC.r);
      pg.addColorStop(0, '#1f2a5e');
      pg.addColorStop(1, '#111b4d');
      ctx.fillStyle = pg;
      ctx.fillRect(PC.x - PC.r, PC.y - PC.r, PC.r * 2, PC.r * 2);
      ctx.fillStyle = 'rgba(255,255,255,0.18)';
      ctx.beginPath();
      ctx.arc(PC.x, PC.y - 50, 92, 0, Math.PI * 2);
      ctx.fill();
      ctx.beginPath();
      ctx.ellipse(PC.x, PC.y + 210, 180, 150, 0, Math.PI, 0);
      ctx.fill();
      ctx.fillStyle = 'rgba(255,255,255,0.75)';
      ctx.font = '600 30px Poppins, sans-serif';
      ctx.fillText('Tap to add your photo', PC.x, PC.y + 120);
    }
    ctx.restore();

    // name
    const name = (this.name.trim() || 'YOUR NAME').toUpperCase();
    let size = 66;
    do {
      ctx.font = `700 ${size}px Poppins, sans-serif`;
      size -= 2;
    } while (ctx.measureText(name).width > W - 140 && size > 34);
    ctx.fillStyle = this.name.trim() ? '#ffffff' : 'rgba(255,255,255,0.45)';
    ctx.fillText(name, W / 2, 1084);

    const org = this.org.trim();
    if (org) {
      let os = 32;
      do {
        ctx.font = `600 ${os}px Poppins, sans-serif`;
        os -= 1;
      } while (ctx.measureText(org).width > W - 180 && os > 20);
      ctx.fillStyle = '#facc15';
      ctx.fillText(org, W / 2, 1130);
    }

    // event footer
    const fy = org ? 1192 : 1170;
    ctx.strokeStyle = 'rgba(255,255,255,0.25)';
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.moveTo(W / 2 - 160, fy - 34);
    ctx.lineTo(W / 2 + 160, fy - 34);
    ctx.stroke();

    ctx.fillStyle = '#ffffff';
    ctx.font = '700 40px "Playfair Display", Georgia, serif';
    ctx.fillText('Sustainability Week 2026', W / 2, fy + 10);
    ctx.fillStyle = 'rgba(255,255,255,0.85)';
    ctx.font = '500 27px Poppins, sans-serif';
    ctx.fillText('15 – 19 November 2026  ·  Kingdom of Bahrain', W / 2, fy + 52);
    ctx.fillStyle = 'rgba(253,230,138,0.9)';
    ctx.font = 'italic 400 25px Poppins, sans-serif';
    ctx.fillText('"Co-innovating, Leading, Sustaining…"', W / 2, fy + 90);

    ctx.fillStyle = 'rgba(255,255,255,0.55)';
    ctx.font = '500 22px Poppins, sans-serif';
    ctx.fillText('sw.gulfuniversity.edu.bh   #SW2026', W / 2, H - 26);
  }

  // ---------- export ----------

  private async blob(): Promise<Blob> {
    const canvas = document.createElement('canvas');
    canvas.width = W;
    canvas.height = H;
    this.render(canvas);
    return new Promise((resolve, reject) =>
      canvas.toBlob((b) => (b ? resolve(b) : reject(new Error('toBlob failed'))), 'image/png')
    );
  }

  private fileName(): string {
    const slug = this.name.trim().replace(/[^\p{L}\p{N}]+/gu, '-').replace(/^-|-$/g, '') || 'post';
    return `SW2026-Im-attending-${slug}.png`;
  }

  private checkReady(): boolean {
    if (!this.name.trim()) {
      this.message.set({ kind: 'error', text: 'Add your name first.' });
      return false;
    }
    if (!this.photo) {
      this.message.set({ kind: 'error', text: 'Add a photo first.' });
      return false;
    }
    return true;
  }

  protected async download(): Promise<void> {
    if (!this.checkReady() || this.busy()) {
      return;
    }
    this.busy.set(true);
    this.message.set(null);
    try {
      const url = URL.createObjectURL(await this.blob());
      const a = document.createElement('a');
      a.href = url;
      a.download = this.fileName();
      a.click();
      setTimeout(() => URL.revokeObjectURL(url), 2000);
      this.message.set({ kind: 'ok', text: 'Saved! Post it with the caption below.' });
    } catch {
      this.message.set({ kind: 'error', text: "The image couldn't be created. Please try again." });
    }
    this.busy.set(false);
  }

  protected get canShareFiles(): boolean {
    try {
      const probe = new File([''], 'x.png', { type: 'image/png' });
      return typeof navigator.canShare === 'function' && navigator.canShare({ files: [probe] });
    } catch {
      return false;
    }
  }

  protected async share(): Promise<void> {
    if (!this.checkReady() || this.busy()) {
      return;
    }
    this.busy.set(true);
    this.message.set(null);
    try {
      const file = new File([await this.blob()], this.fileName(), { type: 'image/png' });
      // Many apps drop the text when sharing a file, so copy the caption too.
      void navigator.clipboard?.writeText(this.caption).catch(() => undefined);
      await navigator.share({ files: [file], text: this.caption, title: "I'm attending Sustainability Week 2026" });
      this.message.set({ kind: 'ok', text: 'Shared! The caption is also copied — paste it into your post.' });
    } catch (e) {
      if ((e as DOMException)?.name !== 'AbortError') {
        this.message.set({ kind: 'error', text: "Sharing didn't open. Use Download instead." });
      }
    }
    this.busy.set(false);
  }

  protected async copyCaption(): Promise<void> {
    try {
      await navigator.clipboard.writeText(this.caption);
      this.copied.set(true);
      setTimeout(() => this.copied.set(false), 2000);
    } catch {
      // Clipboard blocked — the caption is visible to copy manually.
    }
  }
}

function loadImage(src: string): Promise<HTMLImageElement> {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.decoding = 'async';
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
