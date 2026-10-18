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
    [
      [{ name: 'Supreme Council for Environment', logo: 'partners/supreme-council-for-environment.png' }],
      [{ name: 'Ministry of Information', logo: 'partners/ministry-of-information.png' }],
      [{ name: 'Ministry of Works', logo: 'partners/ministry-of-works.png' }],
      [{ name: 'Ministry of Transportation and Telecommunications', logo: 'partners/ministry-of-transportation-and-telecommunications.png' }]
    ],
    [
      [
        { name: 'United Nations Industrial Development Organization', logo: 'partners/unido.png' },
        { name: 'UNIDO Investment and Technology Promotion Office, Manama, Bahrain', logo: 'partners/itpo-bahrain.png' }
      ],
      [{ name: 'Bahrain Intellectual Property Society', logo: 'partners/bips.png' }],
      [{ name: 'Bahrain Smart City Society', logo: 'partners/bahrain-smart-city-society.png' }],
      [{ name: 'Bahrain Library & Information Association', logo: 'partners/bahrain-library-information-association.png' }],
      [{ name: 'Ebdaa for Microfinance', logo: 'partners/ebdaa-microfinance.png' }]
    ]
  ];
}
