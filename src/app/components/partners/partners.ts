import { Component } from '@angular/core';

@Component({
  selector: 'app-partners',
  standalone: true,
  templateUrl: './partners.html',
  styleUrl: './partners.css'
})
export class PartnersComponent {
  // Rows of partner tiles; each innermost array is a group that must stay side by side.
  protected readonly partnerRows = [
    // Government row. Requested order reads right-to-left (Supreme Council on the far right,
    // Bahrainuna on the far left), so the array is listed left-to-right in reverse.
    [
      [{ name: 'Bahrainuna', logo: 'partners/bahrainuna.png' }],
      [{ name: 'Southern Governorate', logo: 'partners/southern-governorate.png' }],
      [{ name: 'Ministry of Housing and Urban Planning', logo: 'partners/ministry-of-housing-and-urban-planning.png' }],
      [{ name: 'Ministry of Information', logo: 'partners/ministry-of-information.png' }],
      [{ name: 'Ministry of Transportation and Telecommunications', logo: 'partners/ministry-of-transportation-and-telecommunications.png' }],
      [{ name: 'Ministry of Interior', logo: 'partners/ministry-of-interior.png' }],
      [{ name: 'Ministry of Youth and Sport Affairs', logo: 'partners/ministry-of-youth-and-sport-affairs.png' }],
      [{ name: 'Ministry of Health', logo: 'partners/ministry-of-health.png' }],
      [{ name: 'Ministry of Works', logo: 'partners/ministry-of-works.png' }],
      [{ name: 'Supreme Council for Environment', logo: 'partners/supreme-council-for-environment.png' }]
    ],
    [
      [
        { name: 'United Nations Industrial Development Organization', logo: 'partners/unido.png' },
        { name: 'UNIDO Investment and Technology Promotion Office, Manama, Bahrain', logo: 'partners/itpo-bahrain.png' }
      ],
      [{ name: 'Bahrain Intellectual Property Society', logo: 'partners/bips.png' }],
      [{ name: 'Bahrain Smart City Society', logo: 'partners/bahrain-smart-city-society.png' }],
      [{ name: 'Bahrain Library & Information Association', logo: 'partners/bahrain-library-information-association.png' }],
      [{ name: 'Ebdaa for Microfinance', logo: 'partners/ebdaa-microfinance.png' }],
      [{ name: 'RAM Clinics', logo: 'partners/ram-clinics.png' }],
      [{ name: 'stc Bahrain', logo: 'partners/stc.png' }]
    ]
  ];
}
