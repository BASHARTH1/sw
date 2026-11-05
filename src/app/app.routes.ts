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
  { path: '', pathMatch: 'full', component: HomeComponent },
  { path: '**', redirectTo: '' }
];
