import { Injectable, signal } from '@angular/core';

/** Shared open state so the hero button can open the pop-up rendered at page level. */
@Injectable({ providedIn: 'root' })
export class EcobotService {
  readonly isOpen = signal(false);
  private trigger: HTMLElement | null = null;

  open(): void {
    this.trigger = document.activeElement as HTMLElement | null;
    this.isOpen.set(true);
    document.body.style.overflow = 'hidden';
  }

  close(restoreFocus = true): void {
    this.isOpen.set(false);
    document.body.style.overflow = '';
    if (restoreFocus) {
      this.trigger?.focus();
    }
    this.trigger = null;
  }
}
