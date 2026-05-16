import { Component, signal } from '@angular/core';

type SessionType = 'opening' | 'panel' | 'workshop' | 'session' | 'community' | 'competition' | 'awards' | 'exhibition';

interface ScheduleItem {
  slot: string;
  title: string;
  type: SessionType;
  sdgs: number[];
}

interface ScheduleDay {
  id: number;
  label: string;
  date: string;
  theme: string;
  sdgs: number[];
  items: ScheduleItem[];
}

const SDG_COLORS: Record<number, string> = {
  1: '#E5243B', 2: '#DDA63A', 3: '#4C9F38', 4: '#C5192D', 5: '#FF3A21',
  6: '#26BDE2', 7: '#FCC30B', 8: '#A21942', 9: '#FD6925', 10: '#DD1367',
  11: '#FD9D24', 12: '#BF8B2E', 13: '#3F7E44', 14: '#0A97D9', 15: '#56C02B',
  16: '#00689D', 17: '#19486A'
};

const SDG_TITLES: Record<number, string> = {
  1: 'No Poverty', 2: 'Zero Hunger', 3: 'Good Health and Well-being',
  4: 'Quality Education', 5: 'Gender Equality', 6: 'Clean Water and Sanitation',
  7: 'Affordable and Clean Energy', 8: 'Decent Work and Economic Growth',
  9: 'Industry, Innovation and Infrastructure', 10: 'Reduced Inequalities',
  11: 'Sustainable Cities and Communities', 12: 'Responsible Consumption and Production',
  13: 'Climate Action', 14: 'Life Below Water', 15: 'Life on Land',
  16: 'Peace, Justice and Strong Institutions', 17: 'Partnerships for the Goals'
};

@Component({
  selector: 'app-schedule',
  standalone: true,
  templateUrl: './schedule.html',
  styleUrl: './schedule.css'
})
export class ScheduleComponent {
  protected readonly days: ScheduleDay[] = [
    {
      id: 1,
      label: 'Day 1',
      date: '15th November, 2026',
      theme: 'Advancing Sustainable Futures through Research and Innovation',
      sdgs: [4, 9, 11, 12, 17],
      items: [
        { slot: 'Morning',     type: 'opening',     sdgs: [],           title: 'Event Inauguration: Opening Ceremony & Keynote Address  ·  SW2026 Conference / ICSDI 2nd Edition (Day 1)' },
        { slot: 'Morning',     type: 'session',     sdgs: [4, 9],       title: 'Expert Talk: The Role of Universities in Driving SDG 9.5' },
        { slot: 'Mid-day',     type: 'panel',       sdgs: [9, 11, 17],  title: 'Panel Discussion: Bridging Academia, Industry and Policy for SDGs in the era of AI' },
        { slot: 'Afternoon',   type: 'workshop',    sdgs: [9, 12],      title: 'Workshop: Design Thinking for Sustainable Solutions' },
        { slot: 'Afternoon',   type: 'exhibition',  sdgs: [9, 12],      title: 'Exhibition Launch: Sustainability & Innovation Expo 2026' }
      ]
    },
    {
      id: 2,
      label: 'Day 2',
      date: '16th November, 2026',
      theme: 'Smart Cities, Innovative Engineering and Digital Transformation for Sustainability',
      sdgs: [7, 9, 11, 12, 13],
      items: [
        { slot: 'Morning',     type: 'session',     sdgs: [9, 7, 11],   title: 'Presentation: AI & IoT Applications in Energy Efficiency and Sustainable Built Environments' },
        { slot: 'Mid-day',     type: 'panel',       sdgs: [9, 11, 13],  title: 'Panel Discussion: Green Infrastructure and Resilient Urban Systems' },
        { slot: 'Afternoon',   type: 'session',     sdgs: [9, 13],      title: 'Research Showcase: Innovative Engineering Solutions for Sustainable Development' },
        { slot: 'Afternoon',   type: 'competition', sdgs: [9, 12],      title: 'Competition Launch: Sustainable Innovation Challenge' },
        { slot: 'Parallel',    type: 'session',     sdgs: [],           title: 'Parallel Sessions: SW2026 Conference / ICSDI 2nd Edition (Day 2)' }
      ]
    },
    {
      id: 3,
      label: 'Day 3',
      date: '17th November, 2026',
      theme: 'Climate Action, Circular Economy Strategies in Design and Manufacturing',
      sdgs: [8, 9, 11, 12, 13, 14, 15],
      items: [
        { slot: 'Morning',     type: 'workshop',    sdgs: [12, 13],     title: 'Workshop: Sustainable Materials & Life Cycle Assessment' },
        { slot: 'Mid-day',     type: 'panel',       sdgs: [8, 9, 12],   title: 'Panel Discussion: Industry Perspectives on Sustainable Production & Consumption' },
        { slot: 'Afternoon',   type: 'workshop',    sdgs: [12],         title: 'Hands-on Activity: Upcycling Design Lab' },
        { slot: 'Afternoon',   type: 'session',     sdgs: [14],         title: 'Demo-Based Session: From Source to Sea — Demonstrating Water Pollution & Microplastics Impact' },
        { slot: 'Afternoon',   type: 'workshop',    sdgs: [15],         title: 'Workshop: Living Materials & Urban Biodiversity — Demonstrating Nature-Integrated Technologies' },
        { slot: 'Until 4 PM',  type: 'community',   sdgs: [11, 13],     title: 'Community Engagement Session: Campus Sustainability Awareness Campaign' }
      ]
    },
    {
      id: 4,
      label: 'Day 4',
      date: '18th November, 2026',
      theme: 'Community, Social Impact & Environmental Action',
      sdgs: [1, 2, 3, 5, 8, 9, 10, 11, 12, 13],
      items: [
        { slot: 'Morning',     type: 'community',   sdgs: [11, 13],        title: 'Community Service: Green Mobility Day — Zero Car Campus Initiative' },
        { slot: 'Mid-day',     type: 'community',   sdgs: [13, 15],        title: 'On-Campus / Field Activity: Tree Planting & Urban Greening Campaign' },
        { slot: 'Afternoon',   type: 'session',     sdgs: [13, 11],        title: 'Expert Talk: Climate Action and Local Community Resilience' },
        { slot: 'Afternoon',   type: 'panel',       sdgs: [17, 11],        title: 'Panel Discussion: Public–Private Partnerships for Sustainable Communities' },
        { slot: 'Afternoon',   type: 'workshop',    sdgs: [1, 2, 5],       title: 'Workshop: Design for Social Impact — Inclusive Design for Empowerment, Sustainable Living & Food Security Lab Supporting Women and Communities' },
        { slot: 'Afternoon',   type: 'session',     sdgs: [3],             title: 'Demo Session: Healthy Spaces in Action — Demonstrating Indoor Environmental Quality (IEQ) for Well-being' },
        { slot: 'Afternoon',   type: 'session',     sdgs: [10],            title: 'Think-Tank: Inclusive Innovation Lab — Bridging Research & Technology for Reduced Inequalities' },
        { slot: 'Afternoon',   type: 'exhibition',  sdgs: [9, 11, 17],     title: 'Exhibition: Sustainable Solutions for Society' }
      ]
    },
    {
      id: 5,
      label: 'Day 5',
      date: '19th November, 2026',
      theme: 'Future Visions & Closing',
      sdgs: [4, 9, 12, 16, 17],
      items: [
        { slot: 'Morning',     type: 'session',     sdgs: [9, 4],   title: 'Research Showcase: From Concept to Impact — Student & Research Projects' },
        { slot: 'Mid-day',     type: 'competition', sdgs: [9, 12],  title: 'Competition Finals: Sustainable Innovation Challenge Awards' },
        { slot: 'Afternoon',   type: 'session',     sdgs: [9],      title: 'Expert Talk: Future Trends in Sustainable Engineering and Design' },
        { slot: 'Afternoon',   type: 'session',     sdgs: [16],     title: 'Ethics, Governance & Accountability in Sustainable Development: Building Trustworthy Systems' },
        { slot: 'Afternoon',   type: 'panel',       sdgs: [9, 17],  title: 'Closing Panel: Strong Partnerships in Scaling Innovation for Global Sustainability Impact' },
        { slot: 'Afternoon',   type: 'session',     sdgs: [4, 9],   title: 'Special Talk: Recognition of Excellence in Sustainability & Innovation' },
        { slot: 'Afternoon',   type: 'awards',      sdgs: [],       title: 'Closing Ceremony, Honoring & Awards' }
      ]
    }
  ];

  protected readonly activeDayId = signal(1);

  protected selectDay(id: number) {
    this.activeDayId.set(id);
  }

  protected get activeDay(): ScheduleDay {
    return this.days.find(d => d.id === this.activeDayId())!;
  }

  protected sdgColor(num: number): string {
    return SDG_COLORS[num] ?? '#1e3a8a';
  }

  protected sdgImage(num: number): string {
    return `TGG_Icon_Color_${num.toString().padStart(2, '0')}.png`;
  }

  protected sdgTitle(num: number): string {
    return SDG_TITLES[num] ?? `SDG ${num}`;
  }

  protected iconFor(type: SessionType): string {
    return {
      opening:     'bi-megaphone-fill',
      panel:       'bi-chat-square-quote-fill',
      workshop:    'bi-tools',
      session:     'bi-easel2-fill',
      community:   'bi-people-fill',
      competition: 'bi-trophy-fill',
      awards:      'bi-award-fill',
      exhibition:  'bi-images'
    }[type];
  }
}
