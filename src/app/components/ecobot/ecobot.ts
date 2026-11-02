import { afterNextRender, Component, effect, ElementRef, inject, Injector, viewChild } from '@angular/core';
import { RegistrationService } from '../registration/registration.service';
import { EcobotService } from './ecobot.service';

@Component({
  selector: 'app-ecobot',
  standalone: true,
  templateUrl: './ecobot.html',
  styleUrl: './ecobot.css',
  host: { '(document:keydown.escape)': 'onEscape()' }
})
export class EcobotComponent {
  protected readonly ecobot = inject(EcobotService);
  private readonly reg = inject(RegistrationService);
  private readonly injector = inject(Injector);
  private readonly dialog = viewChild<ElementRef<HTMLElement>>('dialog');

  protected readonly deadlines = [
    { date: '5 November', label: 'Registration and proposal deadline' },
    { date: '17 November', label: 'Final presentation' },
    { date: '19 November', label: 'Presentation and jury' }
  ];

  protected readonly participation = [
    'Students from Gulf University and Bahrain Polytechnic; teams of 3–5 students / Robotics Club in both Institutions & other Institutions.',
    'Each team has a team leader and faculty mentor. Mixed-institution teams are welcome.'
  ];

  protected readonly sdgs = [
    { icon: 'TGG_Icon_Color_02.png', name: '2 · Zero Hunger', example: 'Crop monitoring or smart irrigation' },
    { icon: 'TGG_Icon_Color_03.png', name: '3 · Good Health', example: 'Assistive or rehabilitation robots' },
    { icon: 'TGG_Icon_Color_06.png', name: '6 · Clean Water', example: 'Water-quality or pipeline inspection' },
    { icon: 'TGG_Icon_Color_07.png', name: '7 · Clean Energy', example: 'Solar-panel inspection or cleaning' },
    { icon: 'TGG_Icon_Color_09.png', name: '9 · Innovation', example: 'Infrastructure inspection or smart manufacturing' },
    { icon: 'TGG_Icon_Color_11.png', name: '11 · Sustainable Cities', example: 'Accessible mobility or urban services' },
    { icon: 'TGG_Icon_Color_12.png', name: '12 · Responsible Consumption', example: 'Waste sorting or material recovery' },
    { icon: 'TGG_Icon_Color_13.png', name: '13 · Climate Action', example: 'Environmental or disaster monitoring' },
    { icon: 'TGG_Icon_Color_14.png', name: '14 · Life Below Water', example: 'Marine litter detection and collection' },
    { icon: 'TGG_Icon_Color_15.png', name: '15 · Life on Land', example: 'Habitat monitoring or reforestation' }
  ];

  protected readonly slides = [
    { title: 'The problem', text: 'What sustainability issue are you solving?' },
    { title: 'Your robot idea', text: 'Include a labelled sketch, diagram or digital rendering.' },
    { title: 'How it works', text: 'Explain the main components and intended operation.' },
    { title: 'SDG contribution', text: 'State the primary SDG and expected benefit.' },
    { title: 'Feasibility and safeguards', text: 'Explain key limitations, safety and environmental considerations.' }
  ];

  protected readonly presentation = [
    { activity: 'Team presentation', time: '5 minutes' },
    { activity: 'Jury questions', time: 'Up to 2 minutes' }
  ];

  protected readonly criteria = [
    { name: 'Problem and SDG relevance', points: 20 },
    { name: 'Robot concept and technical feasibility', points: 30 },
    { name: 'Innovation and creativity', points: 20 },
    { name: 'Expected sustainability benefits and safeguards', points: 20 },
    { name: 'Clear presentation, teamwork and answers', points: 10 }
  ];

  protected readonly steps = [
    'Form a team',
    'Select an SDG challenge',
    'Design your robot concept',
    'Submit your PDF slides',
    'Present to the jury'
  ];

  protected readonly schedule = [
    { date: '25 October 2026', milestone: 'Competition announcement & registration opens', action: 'Official call for contributions and online registration.' },
    { date: '5 November 2026', milestone: 'Registration & proposal submission deadline', action: 'Register the team and submit a brief robotics concept identifying the sustainability challenge and relevant SDG(s).' },
    { date: '8–10 November 2026', milestone: 'Proposal review & shortlisting', action: 'Organising Committee reviews submissions and confirms eligible teams.' },
    { date: '11 November 2026', milestone: 'Notification of selected teams', action: 'Shortlisted teams receive confirmation and presentation guidelines.' },
    { date: '17 November 2026', milestone: 'Final presentation submission', action: 'Submit the final presentation (maximum five slides).' },
    { date: '19 November 2026', milestone: 'Final presentations & jury evaluation', action: 'Five-minute presentation and two-minute Q&A per team, followed by evaluation and results.' },
    { date: '19 November 2026', milestone: 'Winners announcement & awards', action: 'Announce winning teams and present awards or certificates, subject to confirmation.' }
  ];

  constructor() {
    effect(() => {
      if (this.ecobot.isOpen()) {
        afterNextRender(() => this.dialog()?.nativeElement.focus(), { injector: this.injector });
      }
    });
  }

  protected register(): void {
    this.ecobot.close(false);
    this.reg.openType('EcoBot Challenge');
  }

  protected onEscape(): void {
    if (this.ecobot.isOpen()) {
      this.ecobot.close();
    }
  }
}
