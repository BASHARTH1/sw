import { Component } from '@angular/core';

@Component({
  selector: 'app-footer',
  standalone: true,
  templateUrl: './footer.html',
  styleUrl: './footer.css'
})
export class FooterComponent {
  protected readonly year = new Date().getFullYear();

  protected readonly links = [
    { label: 'Home', href: '#home' },
    { label: 'About', href: '#about' },
    { label: 'Schedule', href: '#schedule' },
    { label: 'Sponsors', href: '#sponsors' },
    { label: 'Register', href: '#register' }
  ];
}
