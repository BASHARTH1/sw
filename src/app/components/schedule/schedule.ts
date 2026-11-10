import { Component, OnInit, inject, input, signal } from '@angular/core';
import { RegistrationService } from '../registration/registration.service';

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
  isoDate: string;
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
export class ScheduleComponent implements OnInit {
  protected readonly reg = inject(RegistrationService);

  /** The /agenda page has no registration form, so it turns the button off. */
  readonly showRegister = input(true);

  /** The /agenda page opens on the current day of the event; outside the event it stays on Day 1. */
  readonly openOnToday = input(false);

  ngOnInit() {
    if (this.openOnToday()) {
      // en-CA formats as YYYY-MM-DD. The date is Bahrain's, wherever the phone's clock is set.
      const today = new Intl.DateTimeFormat('en-CA', { timeZone: 'Asia/Bahrain' }).format(new Date());
      this.activeDayId.set(this.days.find(d => d.isoDate === today)?.id ?? 1);
    }
  }

  /** "15th November, 2026" as "15th Nov", for tabs on narrow phones. */
  protected shortDate(day: ScheduleDay): string {
    const [date, month] = day.date.split(' ');
    return `${date} ${month.slice(0, 3)}`;
  }

  protected readonly days: ScheduleDay[] = [
    {
      id: 1,
      label: 'Day 1',
      date: '15th November, 2026',
      isoDate: '2026-11-15',
      theme: 'Advancing Sustainable Futures through Research and Innovation',
      sdgs: [4, 5, 9, 10, 11, 12, 17],
      items: [
        { slot: '09:00–10:00', type: 'opening',     sdgs: [],                title: 'Participants Registration & Welcome' },
        { slot: '10:00–10:25', type: 'opening',     sdgs: [],                title: 'Event Inauguration: Opening Ceremony & Speeches  ·  SW2026 & ICSDI Conference Inaugural  ·  Opening & Welcoming Speeches by Prof. Mohanad Al Firas (GU President), Prof. Ciarán Ó Catháin (CEO, Bahrain Polytechnic), Dr. Omar Blibech (Director of the SDM-C, GU) and Dr. Meryem Fati (Vice President for Academic Affairs, GU)  ·  Official Launch of Gulf University\'s "Sustainable Family Award" Initiative' },
        { slot: '10:25–10:45', type: 'session',     sdgs: [],                title: 'Keynote Speeches, Session 01: Prof. Sherine Farouk (ADU, UAE), "Beyond Innovation: The Power of Partnerships to Shape a Sustainable Future"  ·  Dr. Rossilah Jamil (UTM, Malaysia), "From Profit to Purpose: HRM as a Catalyst for Social Sustainability and Inclusive Workplace"' },
        { slot: '10:45–11:00', type: 'awards',      sdgs: [],                title: 'Honoring Distinguished Guests & Partners' },
        { slot: '11:00–11:30', type: 'exhibition',  sdgs: [],                title: 'SW2026 Exhibition Tour & Networking Break' },
        { slot: '11:30–11:50', type: 'session',     sdgs: [],                title: 'Keynote Speeches, Session 02: Dr. Laura Strachan (PMU, KSA), "The \'Paper Park\' Paradox: Structural Misalignments in Global Biodiversity Conservation"  ·  Ms. Anna Schmidt-Fiedler (AMU, Poland), Head of Social Innovations and Sustainability Office, International Project COCO' },
        { slot: '12:05–12:40', type: 'panel',       sdgs: [9, 11, 17],       title: 'Panel Discussion: Bridging Academia, Industry and Policy for SDGs in the Era of AI  ·  Chair: Dr. Meryem Fati, VPAA, GU' },
        { slot: '12:45–13:20', type: 'panel',       sdgs: [4, 5, 9, 10, 12], title: 'Panel Discussion & Interactive Session: Systems Thinking Design, Intellectual Property, Educational and Social Innovation for Sustainability  ·  Chair: Dr. Tamer Alkadash, GU' },
        { slot: '13:25–14:00', type: 'awards',      sdgs: [],                title: 'Honoring Panelists & Speakers' },
        { slot: '14:00–15:30', type: 'community',   sdgs: [],                title: 'Networking Lunch & Concluding Discussions' },
        { slot: '16:00–17:00', type: 'community',   sdgs: [11, 13, 15],      title: 'Community Environmental Action: Daily Tree Planting & Urban Greening Campaign in Partnership with the Ministry of Municipalities Affairs and Agriculture and STC Bahrain' }
      ]
    },
    {
      id: 2,
      label: 'Day 2',
      date: '16th November, 2026',
      isoDate: '2026-11-16',
      theme: 'SW2026 Conference / ICSDI 2nd Edition: Digital Transformation, Artificial Intelligence & Emerging Technologies',
      sdgs: [4, 5, 7, 8, 9, 10, 11, 12, 13, 16, 17],
      items: [
        { slot: 'All day',     type: 'opening',     sdgs: [],                           title: 'ICSDI 2026 — International Conference on Sustainable Development & Innovation: In-Person Sessions at Bahrain Polytechnic (16 November) and Online Sessions (17 November)' },
        { slot: '09:30–10:30', type: 'session',     sdgs: [4, 5, 7, 8, 9, 10, 11, 13],  title: 'Paper Session, Track A: Digital Transformation, Artificial Intelligence & Emerging Technologies (5 papers)' },
        { slot: '09:30–10:15', type: 'session',     sdgs: [7, 8, 9, 10, 13, 16, 17],    title: 'Paper Session, Track B: Digital Transformation, Artificial Intelligence & Emerging Technologies / Energy, Green Technologies & Sustainable Infrastructure (4 papers)' },
        { slot: '09:30–10:30', type: 'session',     sdgs: [5, 7, 8],                    title: 'Paper Session, Track C: Innovation, Entrepreneurship & Cross-Sector Collaboration / Energy, Green Technologies & Sustainable Infrastructure / Sustainable Business, Economics & Finance (5 papers)' },
        { slot: '11:15–12:15', type: 'session',     sdgs: [4, 8, 9, 12, 17],            title: 'Paper Session, Track D: Innovation, Entrepreneurship & Cross-Sector Collaboration / Sustainable Business, Economics & Finance (5 papers)' },
        { slot: '11:15–12:15', type: 'session',     sdgs: [8, 12, 16],                  title: 'Paper Session, Track E: Innovation, Entrepreneurship & Cross-Sector Collaboration (5 papers)' },
        { slot: '11:15–12:15', type: 'session',     sdgs: [8, 9, 16],                   title: 'Paper Session, Track F: Innovation, Entrepreneurship & Cross-Sector Collaboration (5 papers)' },
        { slot: '13:30–14:30', type: 'session',     sdgs: [4, 8, 9],                    title: 'Paper Session, Track G: Innovation, Entrepreneurship & Cross-Sector Collaboration (5 papers)' },
        { slot: '13:30–14:30', type: 'session',     sdgs: [4, 8, 9, 10, 16],            title: 'Paper Session, Track H: Innovation, Entrepreneurship & Cross-Sector Collaboration / Sustainable Business, Economics & Finance (5 papers)' },
        { slot: '13:30–14:30', type: 'session',     sdgs: [4, 8, 9, 10, 16],            title: 'Paper Session, Track I: Innovation, Entrepreneurship & Cross-Sector Collaboration / Health, Education, Society & Inclusive Development (5 papers)' },
        { slot: '15:15–16:00', type: 'session',     sdgs: [4, 8, 9],                    title: 'Paper Session, Track J: Health, Education, Society & Inclusive Development (4 papers)' },
        { slot: '15:15–16:15', type: 'session',     sdgs: [4, 8, 9, 10, 16],            title: 'Paper Session, Track K: Health, Education, Society & Inclusive Development (5 papers)' },
        { slot: '15:15–15:45', type: 'session',     sdgs: [4, 8, 9, 10],                title: 'Paper Session, Track L: Health, Education, Society & Inclusive Development (3 papers)' }
      ]
    },
    {
      id: 3,
      label: 'Day 3',
      date: '17th November, 2026',
      isoDate: '2026-11-17',
      theme: 'Climate Action, Circular Economy Strategies, Digitalization and Innovative Design and Manufacturing',
      sdgs: [6, 7, 8, 9, 11, 12, 13, 14, 15],
      items: [
        { slot: '10:00–10:30', type: 'workshop',    sdgs: [12, 13],            title: 'Workshop & Interactive Session: Sustainable Materials & Life Cycle Assessment  ·  Facilitator: Dr. Mahmood Hammad, Bahrain Polytechnic' },
        { slot: '10:30–11:00', type: 'panel',       sdgs: [8, 9, 12],          title: 'Panel Discussion: Industry Perspectives on Renewable Energy, Sustainable Production & Consumption  ·  Chair: Prof. Isa S. Qamber' },
        { slot: '11:00–11:30', type: 'workshop',    sdgs: [12, 13],            title: 'Hands-on Activity: Upcycling Design Lab  ·  Nidukki Bahrain & Zero Waste Bahrain' },
        { slot: '11:30–12:00', type: 'session',     sdgs: [6, 14],             title: 'Demo-Based Session: From Source to Sea — Demonstrating Water Pollution & Microplastics Impact  ·  Facilitator: Ms. Sandra Job, GU' },
        { slot: '12:20–13:00', type: 'session',     sdgs: [9, 12, 13, 15],     title: 'Presentation: Circular Economy and Sustainable Materials Innovation — Critical Resource Recovery and Next-Generation Recycling Technologies  ·  Facilitator: Dr. Wajid Ali Khan, Bahrain Polytechnic' },
        { slot: '13:00–13:30', type: 'workshop',    sdgs: [6, 7, 9, 11],       title: 'Workshop: AI & IoT Applications in Energy Efficiency, Sanitation and Sustainable Built Environments  ·  Facilitator: Dr. Walid Elfezzani, GU' },
        { slot: '13:30–14:00', type: 'panel',       sdgs: [6, 9, 11, 13, 15],  title: 'Panel Discussion & Presentation: Smart Cities, Green Infrastructure, Clean Water and Resilient Urban Systems  ·  Chair: Dr. Aseel Al-Ayash, GU' },
        { slot: '14:45–15:45', type: 'exhibition',  sdgs: [8, 9, 11, 12, 13],  title: 'Innovative Ideas & Entrepreneur Projects Showcase: Innovative Projects and Engineering Solutions for Sustainable Development  ·  Facilitator: Dr. Ahmad Alastal, GU' },
        { slot: '15:45–16:30', type: 'community',   sdgs: [11, 13],            title: 'Community Engagement Session: Campus Sustainability Awareness Campaign — GU Sustainability Club "The SDGs Quiz Wall" Challenge  ·  Coordinator: GUSC President & Members' }
      ]
    },
    {
      id: 4,
      label: 'Day 4',
      date: '18th November, 2026',
      isoDate: '2026-11-18',
      theme: 'Community, Socioeconomic Impact & Environmental Action',
      sdgs: [1, 2, 3, 4, 5, 8, 9, 10, 11, 12, 13],
      items: [
        { slot: '08:00–10:00', type: 'community',   sdgs: [],                  title: 'Off-Campus Activity (GU Sustainability Club): Guided Educational Tour and Awareness Session on Marine Conservation and the Protection of Life Below Water  ·  Tubli Bay Reserve / Bahrain Mangroves Tour' },
        { slot: '10:00–10:30', type: 'community',   sdgs: [3, 11, 12, 13],     title: 'Institutional Community Engagement Initiatives: "Green Mobility Day – Zero-Car Campus" & "Sustainable Family Award" Projects  ·  Moderator: Ms. Noor Ali AlSoufi, Bahrain Polytechnic' },
        { slot: '10:30–11:00', type: 'panel',       sdgs: [8, 9, 11],          title: 'Panel Discussion: Innovative Collaborative Initiatives for Economic Growth & Sustainable Communities  ·  Chair: Dr. Qais Almaamari, GU' },
        { slot: '11:00–11:30', type: 'workshop',    sdgs: [7, 9, 11, 13],      title: 'Workshop: Climate Action and Community Resilience through Sustainable Infrastructure and Energy Systems  ·  Facilitator: Dr. Abdulla Ali Desmal, Bahrain Polytechnic' },
        { slot: '11:30–12:00', type: 'workshop',    sdgs: [1, 2, 3, 5],        title: 'Workshop: Design for Social Impact — Inclusive Design for Empowerment: Sustainable Living & Food Security Lab Supporting Women and Healthy Communities  ·  Facilitator: Dr. Naglaa El Gammal, GU' },
        { slot: '12:20–12:50', type: 'session',     sdgs: [3, 11],             title: 'Demo Session: Healthy Spaces in Action — Demonstrating Indoor Environmental Quality (IEQ) for Healthy Buildings & Well-being  ·  Facilitator: Dr. Farrukh Hafeez, Bahrain Polytechnic' },
        { slot: '12:50–13:30', type: 'session',     sdgs: [3, 5, 8, 10],       title: 'Think-Tank: Inclusive Innovation Lab — Bridging Research & Technology for Healthy Communities & Reduced Inequalities  ·  Moderator: Dr. Nithin Kalorth, Bahrain Polytechnic' },
        { slot: '14:30–15:00', type: 'community',   sdgs: [5, 8, 9, 10, 12],   title: 'Campus Boost Initiative: Empowering People, Individual Innovation and Community Sustainability — Productive Families Exhibition, Clothing Swap and Donation Drive (KISWA Bahrain)  ·  Coordinators: Ms. Heba Nasseb & Mr. Ali Abdulla, GU' },
        { slot: '15:00–17:00', type: 'community',   sdgs: [],                  title: 'Off-Campus Activity (GU Students & Participants): Guided Field Trip and Nature Walk  ·  Karzakan Forest, Bahrain' }
      ]
    },
    {
      id: 5,
      label: 'Day 5',
      date: '19th November, 2026',
      isoDate: '2026-11-19',
      theme: 'Future Visions & Closing',
      sdgs: [4, 9, 10, 12, 16, 17],
      items: [
        { slot: '10:00–10:30', type: 'session',     sdgs: [4, 9],          title: 'Expert Talk & Research Showcase: Future Trends in Sustainable Engineering and Design  ·  Chair: Prof. Nikolaos Vasilikos, Bahrain Polytechnic' },
        { slot: '10:30–11:00', type: 'session',     sdgs: [4, 10, 16, 17], title: 'Special Talk: Advancing Peaceful Coexistence, Tolerance, and Social Sustainability through Education and Innovation  ·  Moderator: Prof. Firas Mohamed, GU' },
        { slot: '11:00–11:30', type: 'session',     sdgs: [16],            title: 'Presentation: Ethics, Governance & Accountability in Sustainable Development — Building Trustworthy Systems  ·  Facilitator: Dr. Siddiq Balal, GU' },
        { slot: '11:30–12:00', type: 'session',     sdgs: [10, 16, 17],    title: 'Special Session: Sustainable Leadership & Social Innovation for Advancing the SDGs  ·  Facilitator: Dr. Heba Alsaleh, GU' },
        { slot: '12:20–12:50', type: 'panel',       sdgs: [4, 9, 17],      title: 'Closing Panel: Advancing Sustainable Innovation through Strategic Partnerships, Knowledge Sharing, and Research Preservation  ·  Chair: Dr. Mahmood AlZghool' },
        { slot: '12:50–14:30', type: 'competition', sdgs: [9, 12],         title: 'Competition Finals: Sustainable Innovation "EcoBot" Challenge Awards  ·  Coordinators: Dr. Ahmad Assi, GU & Dr. Mahmood Hammad, Bahrain Polytechnic' },
        { slot: '14:30–15:30', type: 'awards',      sdgs: [],              title: 'Closing Ceremony, Honouring & Awards' }
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
