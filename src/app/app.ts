import { Component } from '@angular/core';
import { HeaderComponent } from './components/header/header';
import { HeroComponent } from './components/hero/hero';
import { AboutComponent } from './components/about/about';
import { SdgsComponent } from './components/sdgs/sdgs';
import { RegistrationComponent } from './components/registration/registration';
import { ScheduleComponent } from './components/schedule/schedule';
import { VenueComponent } from './components/venue/venue';
import { FooterComponent } from './components/footer/footer';

@Component({
  selector: 'app-root',
  standalone: true,
  imports: [
    HeaderComponent,
    HeroComponent,
    AboutComponent,
    SdgsComponent,
    RegistrationComponent,
    ScheduleComponent,
    VenueComponent,
    FooterComponent
  ],
  templateUrl: './app.html',
  styleUrl: './app.css'
})
export class App {}
