import { Component, inject } from '@angular/core';
import { RegistrationService } from '../registration/registration.service';

@Component({
  selector: 'app-hero',
  standalone: true,
  templateUrl: './hero.html',
  styleUrl: './hero.css'
})
export class HeroComponent {
  protected readonly reg = inject(RegistrationService);
}
