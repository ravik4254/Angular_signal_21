import { Routes } from '@angular/router';
import { SignalInDepth } from './signal-in-depth/signal-in-depth';
import { Crud } from './crud/crud';
import { LoginForm } from './login-form/login-form';
import { authGuard, guestGuard } from './services/auth.guard';

export const routes: Routes = [
  { path: '', redirectTo: 'login', pathMatch: 'full' },
  { path: 'login', component: LoginForm, canActivate: [guestGuard] },
  { path: 'crud', component: Crud, canActivate: [authGuard] },
  { path: 'signal-form', component: SignalInDepth },
  { path: 'signal-form-simple', redirectTo: 'login', pathMatch: 'full' },
  { path: '**', redirectTo: 'login' }
];
