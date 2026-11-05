import { Component, DestroyRef, computed, inject, signal } from '@angular/core';
import { ScheduleComponent } from '../../components/schedule/schedule';

type IntroState = 'playing' | 'leaving' | 'done';

const INTRO_MS = 2800;
const LEAVE_MS = 650;
const FIRST_REVEAL_MS = 2000;

@Component({
  selector: 'app-agenda',
  standalone: true,
  imports: [ScheduleComponent],
  templateUrl: './agenda.html',
  styleUrl: './agenda.css'
})
export class AgendaComponent {
  private readonly timers: ReturnType<typeof setTimeout>[] = [];

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
