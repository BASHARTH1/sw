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

  // Rows of partner tiles; each innermost array is a group that must stay side by side.
  protected readonly partnerRows = [
    [
      [{ name: 'Supreme Council for Environment', logo: 'partners/supreme-council-for-environment.png' }],
      [{ name: 'Ministry of Information', logo: 'partners/ministry-of-information.png' }],
      [{ name: 'Ministry of Works', logo: 'partners/ministry-of-works.png' }],
      [{ name: 'Ministry of Transportation and Telecommunications', logo: 'partners/ministry-of-transportation-and-telecommunications.png' }]
    ],
    [
      [
        { name: 'United Nations Industrial Development Organization', logo: 'partners/unido.png' },
        { name: 'UNIDO Investment and Technology Promotion Office, Manama, Bahrain', logo: 'partners/itpo-bahrain.png' }
      ],
      [{ name: 'Bahrain Intellectual Property Society', logo: 'partners/bips.png' }],
      [{ name: 'Bahrain Smart City Society', logo: 'partners/bahrain-smart-city-society.png' }],
      [{ name: 'Bahrain Library & Information Association', logo: 'partners/bahrain-library-information-association.png' }],
      [{ name: 'Ebdaa for Microfinance', logo: 'partners/ebdaa-microfinance.png' }]
    ]
  ];

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
