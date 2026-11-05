import { Component } from '@angular/core';
import { ScheduleComponent } from '../../components/schedule/schedule';

@Component({
  selector: 'app-agenda',
  standalone: true,
  imports: [ScheduleComponent],
  templateUrl: './agenda.html',
  styleUrl: './agenda.css'
})
export class AgendaComponent {}
