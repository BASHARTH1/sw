import { Injectable, signal } from '@angular/core';
import { supabase } from '../../core/supabase.client';

export interface RegOption {
  title: string;
  description: string;
  icon: string;
  /** Theme color for the card + its form (hex). */
  color: string;
  /** Soft tint derived from the color, used for backgrounds. */
  soft: string;
  featured?: boolean;
}

export type FieldType = 'text' | 'email' | 'tel' | 'textarea' | 'radio' | 'checkbox';

export interface FormField {
  id: string;
  label: string;
  type: FieldType;
  required?: boolean;
  options?: string[];
  hint?: string;
  maxSelect?: number;
}

export interface FormSection {
  title: string;
  fields: FormField[];
}

export interface RegForm {
  notes: string[];
  sections: FormSection[];
}

type Step = 'choose' | 'form';

const SECTORS = [
  'Government Agency',
  'Private Company',
  'Non-Profit Organization',
  'Education',
  'Startup',
  'Other'
];

@Injectable({ providedIn: 'root' })
export class RegistrationService {
  readonly options: RegOption[] = [
    {
      title: 'Keynote Speaker',
      description: 'Join us as a Keynote Speaker and share your insights with our audience.',
      icon: 'bi-mic-fill',
      color: '#d4a017',
      soft: 'rgba(212, 160, 23, 0.12)',
      featured: true
    },
    {
      title: 'Sponsor',
      description: 'Become a valued Sponsor and showcase your brand to a wider audience.',
      icon: 'bi-award-fill',
      color: '#16a34a',
      soft: 'rgba(22, 163, 74, 0.12)'
    },
    {
      title: 'Exhibitor',
      description: 'Register as an Exhibitor to display and showcase your products or services.',
      icon: 'bi-easel2-fill',
      color: '#0d9488',
      soft: 'rgba(13, 148, 136, 0.12)'
    },
    {
      title: 'Participant',
      description: 'Sign up as a Participant to attend sessions and engage with the community.',
      icon: 'bi-people-fill',
      color: '#2545b3',
      soft: 'rgba(37, 69, 179, 0.12)'
    },
    {
      title: 'Guest',
      description: 'Join as a Guest to explore sessions and experience the event atmosphere.',
      icon: 'bi-person-heart',
      color: '#7c3aed',
      soft: 'rgba(124, 58, 237, 0.12)'
    }
  ];

  private readonly forms: Record<string, RegForm> = {
    'Keynote Speaker': {
      notes: [
        'Deadline to register: 30th September 2026',
        'A confirmation email will be sent upon review',
        'Event Date: 16th to 20th November 2026'
      ],
      sections: [
        {
          title: 'Personal Information',
          fields: [
            { id: 'fullName', label: 'Full Name', type: 'text', required: true },
            { id: 'email', label: 'Email address', type: 'email', required: true },
            { id: 'phone', label: 'Phone number', type: 'tel', required: true },
            { id: 'nationality', label: 'Nationality', type: 'text', required: true },
            { id: 'link', label: 'LinkedIn or Official Website link', type: 'text' },
            { id: 'sector', label: 'Sector', type: 'radio', required: true, options: SECTORS }
          ]
        },
        {
          title: 'Professional Background',
          fields: [
            { id: 'position', label: 'Current Position', type: 'text', required: true },
            { id: 'organization', label: 'Organization', type: 'text', required: true },
            { id: 'countryOfWork', label: 'Country of Work', type: 'text', required: true },
            {
              id: 'expertise',
              label: 'Areas of Expertise',
              type: 'text',
              required: true,
              hint: 'e.g., renewable energy, climate policy, circular economy, etc.'
            },
            { id: 'biography', label: 'Biography', type: 'textarea', required: true, hint: 'Max. 150 words' }
          ]
        },
        {
          title: 'Speaking Details',
          fields: [
            { id: 'talkTitle', label: 'Proposed Talk Title', type: 'text', required: true },
            {
              id: 'talkDuration',
              label: 'Talk Duration Preference',
              type: 'radio',
              required: true,
              options: ['20 minutes', '30 minutes (including Q&A)', 'Flexible']
            },
            {
              id: 'talkAbstract',
              label: 'Talk Description / Abstract',
              type: 'textarea',
              required: true,
              hint: 'Max. 200 words'
            },
            {
              id: 'mode',
              label: 'Preferred Mode of Attendance',
              type: 'radio',
              required: true,
              options: ['In-person', 'Virtual']
            },
            {
              id: 'equipment',
              label: 'Do you require any special presentation equipment or support?',
              type: 'checkbox',
              options: ['Projector', 'Microphone', 'Internet Access', 'Translation Services']
            },
            {
              id: 'engagements',
              label: 'Please list up to three recent speaking engagements related to sustainability',
              type: 'text'
            }
          ]
        }
      ]
    },

    Sponsor: {
      notes: [
        'Deadline to register: 30th September 2026',
        'A confirmation email will be sent upon review',
        'Sponsor Booth Setup Date: 15 November 2026',
        'Event Date: 16th to 20th November 2026'
      ],
      sections: [
        {
          title: 'Company/Organization Information',
          fields: [
            { id: 'company', label: 'Company/Organization Name', type: 'text', required: true },
            { id: 'sector', label: 'Sector', type: 'radio', required: true, options: SECTORS },
            { id: 'contact', label: 'Contact person', type: 'text', required: true },
            { id: 'phone', label: 'Phone number', type: 'tel', required: true },
            { id: 'email', label: 'Email address', type: 'email', required: true }
          ]
        },
        {
          title: 'Sponsorship Package Selection',
          fields: [
            {
              id: 'package',
              label: 'Please select the sponsorship package you are interested in',
              type: 'radio',
              required: true,
              options: [
                'Platinum Sponsor: Full branding, keynote speaking slot, VIP access, logo on all promotional materials.',
                'Gold Sponsor: Prominent branding, featured session, logo on website and printed programs.',
                'Silver Sponsor: Logo placement on banners and digital platforms, social media promotion.',
                'Bronze Sponsor: Recognition on event banners and official website.',
                'In-Kind Sponsor: Support through goods or services.'
              ]
            }
          ]
        },
        {
          title: 'Branding & Visibility Preferences',
          fields: [
            {
              id: 'branding',
              label: 'Please indicate your preferred branding opportunities',
              type: 'checkbox',
              required: true,
              maxSelect: 3,
              hint: 'Choose up to 3 options',
              options: [
                'Logo on Event Website & Social Media',
                'Logo on Printed Programs & Banners',
                'Speaking/Keynote Opportunity',
                'Booth Space at the Exhibition',
                'Sponsored Giveaways or Materials',
                'Mention in Press Releases',
                'Featured in Opening/Closing Ceremony',
                'Other'
              ]
            }
          ]
        },
        {
          title: 'Sustainability Commitment',
          fields: [
            {
              id: 'supportSdg',
              label: 'We support sustainable development goals and environmentally responsible practices.',
              type: 'radio',
              options: ['Yes', 'No']
            },
            {
              id: 'ongoingInitiatives',
              label: 'Does your organization have any ongoing sustainability initiatives?',
              type: 'radio',
              required: true,
              options: ['No', 'Yes']
            },
            {
              id: 'joinInitiative',
              label:
                'Are you interested in co-developing a joint sustainability initiative or campaign with Gulf University?',
              type: 'radio',
              required: true,
              options: ['Yes', 'No']
            }
          ]
        }
      ]
    },

    Exhibitor: {
      notes: [
        'Setup Date: 15 November 2026',
        'Event Date — The Art Hotel & Resort: 16th–17th November 2026 | Gulf University Campus: 18th to 20th November 2026'
      ],
      sections: [
        {
          title: 'Company/Organization Information',
          fields: [
            { id: 'company', label: 'Company/Organization Name', type: 'text', required: true },
            {
              id: 'logoConsent',
              label: 'I will send a high-quality logo to: sw@gulfuniversity.edu.bh',
              type: 'radio',
              required: true,
              options: ['Yes']
            },
            { id: 'sector', label: 'Sector', type: 'radio', required: true, options: SECTORS },
            { id: 'contact', label: 'Contact person for your booth setup', type: 'text', required: true },
            { id: 'phone', label: 'Phone number', type: 'tel', required: true },
            { id: 'email', label: 'Email address', type: 'email', required: true },
            {
              id: 'days',
              label: 'Organization/Company Participation Days',
              type: 'checkbox',
              required: true,
              hint: 'We would love to see you on all the days!',
              options: [
                'Day 1 | 16/11/2026 | 09:00 am to 04:00 pm | The Art Hotel & Resort',
                'Day 2 | 17/11/2026 | 09:00 am to 02:00 pm | The Art Hotel & Resort',
                'Day 3 | 18/11/2026 | 10:00 am to 04:00 pm | Gulf University Campus',
                'Day 4 | 19/11/2026 | 10:00 am to 04:00 pm | Gulf University Campus',
                'Day 5 | 20/11/2026 | 10:00 am to 04:00 pm | Gulf University Campus'
              ]
            }
          ]
        },
        {
          title: 'Sustainability Commitment',
          fields: [
            {
              id: 'minimizeImpact',
              label: 'We commit to minimizing our environmental impact during setup and exhibition.',
              type: 'radio',
              options: ['Yes', 'No']
            },
            {
              id: 'ecoMaterial',
              label:
                'Will you bring promotional material that is eco-friendly (e.g., digital brochures, recycled paper)?',
              type: 'radio',
              options: ['Yes', 'No', 'Maybe']
            },
            {
              id: 'wasteReduction',
              label: 'Do you have any waste reduction or carbon offset initiatives in place?',
              type: 'radio',
              options: ['No', 'Yes']
            }
          ]
        }
      ]
    },

    Participant: {
      notes: [
        'Deadline to register: 30th September 2026',
        'A confirmation email will be sent upon review',
        'Event Date: 16th to 20th November 2026'
      ],
      sections: [
        {
          title: 'Personal Information',
          fields: [
            { id: 'fullName', label: 'Full Name', type: 'text', required: true },
            { id: 'email', label: 'Email address', type: 'email', required: true },
            { id: 'phone', label: 'Phone number', type: 'tel', required: true },
            { id: 'sector', label: 'Sector', type: 'radio', required: true, options: SECTORS }
          ]
        },
        {
          title: 'Affiliation & Participation Details',
          fields: [
            {
              id: 'affiliation',
              label: 'Which of the following best describes you?',
              type: 'checkbox',
              required: true,
              options: [
                'Student',
                'Faculty/Staff (Gulf University)',
                'Government Representative',
                'Industry Professional',
                'NGO/NPO Representative',
                'Startup Founder or Entrepreneur',
                'Independent Researcher',
                'Other'
              ]
            },
            {
              id: 'mode',
              label: 'Preferred Mode of Attendance',
              type: 'radio',
              required: true,
              options: ['In-person', 'Virtual']
            },
            {
              id: 'sessions',
              label: 'Which sessions are you most interested in?',
              type: 'checkbox',
              required: true,
              maxSelect: 3,
              hint: 'Select up to 3',
              options: [
                'Keynote Talks',
                'Panel Discussions',
                'Interactive Workshops',
                'Networking Sessions',
                'Career & Opportunities Fair',
                'Innovation Showcase',
                'Other'
              ]
            },
            {
              id: 'accommodations',
              label: 'Do you require any special accommodations?',
              type: 'checkbox',
              options: [
                'Wheelchair Access',
                'Sign Language Interpreter',
                'Visual Aids',
                'Dietary Restrictions',
                'Other'
              ]
            }
          ]
        }
      ]
    },

    Guest: {
      notes: ['Deadline to register: 15th November 2026', 'Event Date: 16th to 20th November 2026'],
      sections: [
        {
          title: 'Personal Information',
          fields: [
            { id: 'fullName', label: 'Full Name', type: 'text', required: true },
            { id: 'email', label: 'Email Address', type: 'email', required: true },
            { id: 'mobile', label: 'Mobile', type: 'tel', required: true },
            { id: 'organization', label: 'Organization Name', type: 'text', required: true },
            {
              id: 'businessType',
              label: 'Business Type',
              type: 'radio',
              required: true,
              options: [
                'Government Representative',
                'Diplomatic/Embassy Representative',
                'Industry Leader',
                'Academic Dignitary',
                'NGO/NPO Representative',
                'Media Representative',
                'Special Invitee',
                'Other'
              ]
            },
            {
              id: 'mode',
              label: 'Preferred mode of attendance',
              type: 'radio',
              required: true,
              options: ['In-person', 'Virtual (for international guests)']
            },
            {
              id: 'speaking',
              label: 'Will you be making a speech or participating in a session?',
              type: 'radio',
              required: true,
              options: ['Yes', 'No']
            },
            {
              id: 'visa',
              label: 'Do you require visa or/and invitation letter?',
              type: 'radio',
              required: true,
              options: ['Yes', 'No', 'N/A']
            }
          ]
        }
      ]
    }
  };

  // ---- modal state ----
  readonly isOpen = signal(false);
  readonly step = signal<Step>('choose');
  readonly selectedType = signal<string | null>(null);
  readonly attempted = signal(false);
  readonly submitted = signal(false);
  /** Index of the section currently shown in the wizard. */
  readonly sectionIndex = signal(0);
  /** True while the submission is being saved to the database. */
  readonly saving = signal(false);
  /** Set when the submission fails so the UI can show a retry message. */
  readonly errorMsg = signal<string | null>(null);

  /** Plain mutable object bound through ngModel; replaced on each open. */
  formData: Record<string, string | string[]> = {};

  get currentForm(): RegForm | null {
    const type = this.selectedType();
    return type ? this.forms[type] : null;
  }

  get currentSection(): FormSection | null {
    return this.currentForm?.sections[this.sectionIndex()] ?? null;
  }

  get sectionCount(): number {
    return this.currentForm?.sections.length ?? 0;
  }

  get isLastSection(): boolean {
    return this.sectionIndex() >= this.sectionCount - 1;
  }

  get isFirstSection(): boolean {
    return this.sectionIndex() === 0;
  }

  /** Options shown in the "Register" chooser modal. Excludes Keynote Speaker,
     which is reachable only via the hero "Be A Keynote Speaker" button. */
  get chooserOptions(): RegOption[] {
    return this.options.filter((o) => o.title !== 'Keynote Speaker');
  }

  get currentOption(): RegOption | null {
    const type = this.selectedType();
    return this.options.find((o) => o.title === type) ?? null;
  }

  /** Open with the type chooser first (e.g. hero "Register Now"). */
  openChooser(): void {
    this.reset();
    this.selectedType.set(null);
    this.step.set('choose');
    this.isOpen.set(true);
    this.lockScroll(true);
  }

  /** Open straight into a specific type's form (e.g. a registration card). */
  openType(title: string): void {
    if (!this.forms[title]) {
      return;
    }
    this.reset();
    this.selectType(title);
    this.isOpen.set(true);
    this.lockScroll(true);
  }

  selectType(title: string): void {
    if (!this.forms[title]) {
      return;
    }
    this.selectedType.set(title);
    this.formData = {};
    this.attempted.set(false);
    this.submitted.set(false);
    this.sectionIndex.set(0);
    this.step.set('form');
  }

  back(): void {
    this.selectedType.set(null);
    this.step.set('choose');
    this.attempted.set(false);
    this.sectionIndex.set(0);
  }

  /** Advance to the next section, or submit on the last one. */
  async next(): Promise<void> {
    if (this.saving()) {
      return;
    }
    this.attempted.set(true);
    if (this.sectionHasErrors()) {
      return;
    }
    if (this.isLastSection) {
      await this.submitToDb();
      return;
    }
    this.sectionIndex.update((i) => i + 1);
    this.attempted.set(false);
    this.scrollDialogTop();
  }

  private async submitToDb(): Promise<void> {
    const type = this.selectedType();
    if (!type) {
      return;
    }
    this.saving.set(true);
    this.errorMsg.set(null);

    const fd = this.formData;
    const pick = (key: string): string | null =>
      typeof fd[key] === 'string' && (fd[key] as string).trim() ? (fd[key] as string).trim() : null;

    const fullName = pick('fullName') ?? pick('company') ?? pick('contact') ?? pick('organization');
    const email = pick('email');

    const { error } = await supabase
      .from('registrations')
      .insert({ type, full_name: fullName, email, data: fd });

    this.saving.set(false);

    if (error) {
      this.errorMsg.set('Sorry, we could not submit your registration. Please try again.');
      return;
    }
    this.submitted.set(true);
    this.scrollDialogTop();
  }

  /** Go back a section, or return to the type chooser from the first one. */
  prev(): void {
    if (this.isFirstSection) {
      this.back();
      return;
    }
    this.sectionIndex.update((i) => i - 1);
    this.attempted.set(false);
    this.scrollDialogTop();
  }

  close(): void {
    this.isOpen.set(false);
    this.lockScroll(false);
  }

  isChecked(fieldId: string, option: string): boolean {
    const value = this.formData[fieldId];
    return Array.isArray(value) && value.includes(option);
  }

  toggleCheck(field: FormField, option: string): void {
    let value = this.formData[field.id];
    if (!Array.isArray(value)) {
      value = [];
      this.formData[field.id] = value;
    }
    const index = value.indexOf(option);
    if (index >= 0) {
      value.splice(index, 1);
    } else {
      if (field.maxSelect && value.length >= field.maxSelect) {
        return;
      }
      value.push(option);
    }
  }

  isMissing(field: FormField): boolean {
    if (!field.required) {
      return false;
    }
    const value = this.formData[field.id];
    if (field.type === 'checkbox') {
      return !Array.isArray(value) || value.length === 0;
    }
    return typeof value !== 'string' || value.trim().length === 0;
  }

  showError(field: FormField): boolean {
    return this.attempted() && this.isMissing(field);
  }

  private sectionHasErrors(): boolean {
    const section = this.currentSection;
    return section ? section.fields.some((field) => this.isMissing(field)) : false;
  }

  private reset(): void {
    this.formData = {};
    this.attempted.set(false);
    this.submitted.set(false);
    this.sectionIndex.set(0);
    this.saving.set(false);
    this.errorMsg.set(null);
  }

  private lockScroll(locked: boolean): void {
    if (typeof document !== 'undefined') {
      document.body.style.overflow = locked ? 'hidden' : '';
    }
  }

  private scrollDialogTop(): void {
    if (typeof document !== 'undefined') {
      document.querySelector('.reg-modal')?.scrollTo({ top: 0 });
    }
  }
}
