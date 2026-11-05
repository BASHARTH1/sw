import { Component, DestroyRef, computed, inject, signal } from '@angular/core';
import { ScheduleComponent, SDG_COLORS } from '../../components/schedule/schedule';

type IntroState = 'playing' | 'leaving' | 'done';

const INTRO_MS = 2800;
const LEAVE_MS = 650;
const FIRST_REVEAL_MS = 2000;

/** One slice of the SDG wheel, as an SVG path in a 200 x 200 viewBox. */
function wheelSegment(index: number, total: number): string {
  const [centre, inner, outer, gap] = [100, 62, 96, 2.5];
  const point = (radius: number, degrees: number) => {
    const rad = (degrees * Math.PI) / 180;
    return `${(centre + radius * Math.cos(rad)).toFixed(2)} ${(centre + radius * Math.sin(rad)).toFixed(2)}`;
  };
  const size = 360 / total;
  const start = index * size - 90 + gap / 2;
  const end = start + size - gap;
  return `M${point(inner, start)} L${point(outer, start)} A${outer} ${outer} 0 0 1 ${point(outer, end)} L${point(inner, end)} A${inner} ${inner} 0 0 0 ${point(inner, start)}Z`;
}

@Component({
  selector: 'app-agenda',
  standalone: true,
  imports: [ScheduleComponent],
  templateUrl: './agenda.html',
  styleUrl: './agenda.css'
})
export class AgendaComponent {
  private readonly timers: ReturnType<typeof setTimeout>[] = [];

  protected readonly wheel = Object.values(SDG_COLORS).map((color, i, all) => ({
    color,
    path: wheelSegment(i, all.length)
  }));

  protected readonly intro = signal<IntroState>(
    window.matchMedia('(prefers-reduced-motion: reduce)').matches ? 'done' : 'playing'
  );

  /** The page animates in as the intro starts to lift. */
  protected readonly ready = computed(() => this.intro() !== 'playing');

  /** While true, the sessions wait for the intro to clear; later day changes animate at once. */
  protected readonly firstReveal = signal(true);

  constructor() {
    if (this.intro() === 'playing') {
      document.body.style.overflow = 'hidden';
      this.timers.push(setTimeout(() => this.leaveIntro(), INTRO_MS));
    }
    inject(DestroyRef).onDestroy(() => {
      this.timers.forEach(clearTimeout);
      document.body.style.overflow = '';
    });
  }

  protected leaveIntro(): void {
    if (this.intro() !== 'playing') {
      return;
    }
    this.intro.set('leaving');
    document.body.style.overflow = '';
    this.timers.push(
      setTimeout(() => this.intro.set('done'), LEAVE_MS),
      setTimeout(() => this.firstReveal.set(false), FIRST_REVEAL_MS)
    );
  }
}
