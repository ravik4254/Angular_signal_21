import { Component, inject, signal } from '@angular/core';
import { email, form, FormField, required } from '@angular/forms/signals';
import { MatButtonModule } from '@angular/material/button';
import { MatCardModule } from '@angular/material/card';
import { MatGridListModule } from '@angular/material/grid-list';
import { MatIconModule } from '@angular/material/icon';
import { MatInputModule } from '@angular/material/input';
import { finalize } from 'rxjs';
import { Router } from '@angular/router';
import { AuthService, LoginResponse } from '../services/auth.service';

interface LoginData {
  email: string;
  password: string;
}

@Component({
  selector: 'app-login-form',
  imports: [MatCardModule, MatGridListModule, MatInputModule, MatIconModule, FormField, MatButtonModule],
  templateUrl: './login-form.html',
  styleUrl: './login-form.css',
})
export class LoginForm {
  private readonly authService = inject(AuthService);
  private readonly router = inject(Router);

  loginModel = signal<LoginData>({ email: '', password: '' });
  isSubmitting = signal(false);
  apiError = signal<string | null>(null);
  loginToken = signal<string | null>(null);
  showPassword = signal(false);

  loginForm = form(this.loginModel, (f) => {
    required(f.email, { message: 'Email is required' });
    email(f.email, { message: 'Please enter a valid email' });
    required(f.password, { message: 'Password is required' });
  });

  onSubmit(event: Event) {
    event.preventDefault();
    if (this.loginForm().invalid()) {
      return;
    }

    this.apiError.set(null);
    this.loginToken.set(null);
    this.isSubmitting.set(true);

    this.authService
      .login(this.loginModel())
      .pipe(finalize(() => this.isSubmitting.set(false)))
      .subscribe({
        next: (response: LoginResponse) => {
          this.loginToken.set(response.token);
          void this.router.navigateByUrl('/crud');
        },
        error: (error: unknown) => {
          this.apiError.set(this.authService.getErrorMessage(error));
        },
      });
  }

  togglePasswordVisibility(): void {
    this.showPassword.update((current) => !current);
  }
}
