import { Component, inject } from '@angular/core';
import { EcobotService } from '../ecobot/ecobot.service';
import { RegistrationService } from '../registration/registration.service';

@Component({
  selector: 'app-hero',
  standalone: true,
  templateUrl: './hero.html',
  styleUrl: './hero.css'
})
export class HeroComponent {
  protected readonly reg = inject(RegistrationService);
  protected readonly ecobot = inject(EcobotService);
}
