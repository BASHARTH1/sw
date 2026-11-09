import { Routes } from '@angular/router';
import { HomeComponent } from './pages/home/home';

export const routes: Routes = [
  {
    path: 'admin',
    loadComponent: () => import('./pages/admin/admin').then((m) => m.AdminComponent)
  },
  {
    path: 'agenda',
    title: 'Agenda | GU Sustainability Week 2026',
    loadComponent: () => import('./pages/agenda/agenda').then((m) => m.AgendaComponent)
  },
  {
    path: 'ticket',
    title: 'My Ticket | GU Sustainability Week 2026',
    loadComponent: () => import('./pages/ticket/ticket').then((m) => m.TicketComponent)
  },
  {
    path: 'ticket/:code',
    title: 'My Ticket | GU Sustainability Week 2026',
    loadComponent: () => import('./pages/ticket/ticket').then((m) => m.TicketComponent)
  },
  {
    path: 'attending',
    title: "I'm Attending | GU Sustainability Week 2026",
    loadComponent: () => import('./pages/attending/attending').then((m) => m.AttendingComponent)
  },
  {
    path: 'scan',
    title: 'Ticket Scanner | GU Sustainability Week 2026',
    loadComponent: () => import('./pages/scan/scan').then((m) => m.ScanComponent)
  },
  { path: '', pathMatch: 'full', component: HomeComponent },
  { path: '**', redirectTo: '' }
];
