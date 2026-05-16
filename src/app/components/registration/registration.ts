import { Component } from '@angular/core';

interface RegOption {
  title: string;
  description: string;
  icon: string;
  accent: 'green' | 'gold' | 'teal' | 'blue' | 'plum';
  featured?: boolean;
}

@Component({
  selector: 'app-registration',
  standalone: true,
  templateUrl: './registration.html',
  styleUrl: './registration.css'
})
export class RegistrationComponent {
  protected readonly options: RegOption[] = [
    {
      title: 'Keynote Speaker',
      description: 'Join us as a Keynote Speaker and share your insights with our audience.',
      icon: 'bi-mic-fill',
      accent: 'gold',
      featured: true
    },
    {
      title: 'Sponsor',
      description: 'Become a valued Sponsor and showcase your brand to a wider audience.',
      icon: 'bi-award-fill',
      accent: 'green'
    },
    {
      title: 'Exhibitor',
      description: 'Register as an Exhibitor to display and showcase your products or services.',
      icon: 'bi-easel2-fill',
      accent: 'teal'
    },
    {
      title: 'Participant',
      description: 'Sign up as a Participant to attend sessions and engage with the community.',
      icon: 'bi-people-fill',
      accent: 'blue'
    },
    {
      title: 'Guest',
      description: 'Join as a Guest to explore sessions and experience the event atmosphere.',
      icon: 'bi-person-heart',
      accent: 'plum'
    }
  ];
}
