import { Component, signal } from '@angular/core';
import { RouterOutlet } from '@angular/router';

@Component({
  selector: 'app-root',
  standalone: true,
  imports: [RouterOutlet],
  templateUrl: './app.html',
  styleUrl: './app.css',
  host: {
    '(document:pointermove)': 'onMove($event)',
    '(document:pointerleave)': 'onLeave()',
    '(document:pointerdown)': 'onDown()',
    '(document:pointerup)': 'onUp()',
  },
})
export class App {
  /** Cursor position (viewport coordinates) for the spotlight beam. */
  readonly mx = signal(-9999);
  readonly my = signal(-9999);
  readonly visible = signal(false);
  readonly pressed = signal(false);

  onMove(e: PointerEvent) {
    this.mx.set(e.clientX);
    this.my.set(e.clientY);
    this.visible.set(true);
  }

  onLeave() {
    this.visible.set(false);
  }

  onDown() {
    this.pressed.set(true);
  }

  onUp() {
    this.pressed.set(false);
  }
}
