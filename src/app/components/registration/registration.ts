import { Component, inject, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { RegistrationService } from './registration.service';

@Component({
  selector: 'app-registration',
  standalone: true,
  imports: [FormsModule],
  templateUrl: './registration.html',
  styleUrl: './registration.css'
})
export class RegistrationComponent {
  protected readonly reg = inject(RegistrationService);

  protected readonly packagesOpen = signal(false);
  protected readonly packageIndex = signal(0);
  protected readonly packageZoomed = signal(false);

  protected readonly packageSlides = Array.from(
    { length: 7 },
    (_, i) => `packages/slide-${String(i + 1).padStart(2, '0')}.png`
  );

  protected readonly packagesPdf = 'SW2026-SponsorshipPackages.pdf';

  protected openPackages(): void {
    this.packageIndex.set(0);
    this.packageZoomed.set(false);
    this.packagesOpen.set(true);
  }

  protected closePackages(): void {
    this.packagesOpen.set(false);
  }

  protected toggleZoom(): void {
    this.packageZoomed.update((z) => !z);
  }

  protected goToSlide(i: number): void {
    const max = this.packageSlides.length - 1;
    this.packageZoomed.set(false);
    this.packageIndex.set(Math.min(Math.max(i, 0), max));
  }

  protected nextSlide(): void {
    this.goToSlide(this.packageIndex() + 1);
  }

  protected prevSlide(): void {
    this.goToSlide(this.packageIndex() - 1);
  }
}
