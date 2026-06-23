import { Injectable, computed, signal } from '@angular/core';
import { Observable, of, throwError } from 'rxjs';

export interface LoginRequest {
  email: string;
  password: string;
}

export interface LoginResponse {
  token: string;
}

@Injectable({ providedIn: 'root' })
export class AuthService {
  private readonly authTokenKey = 'crud-auth-token';
  private readonly validEmail = 'admin@gmail.com';
  private readonly validPassword = 'Mind@1234';

  private readonly authToken = signal<string | null>(this.readStoredToken());
  readonly isAuthenticated = computed(() => this.authToken() !== null);

  login(payload: LoginRequest): Observable<LoginResponse> {
    const normalizedEmail = payload.email.trim().toLowerCase();
    const normalizedPassword = payload.password.trim();

    if (normalizedEmail === this.validEmail && normalizedPassword === this.validPassword) {
      const response: LoginResponse = { token: 'crud-access-token' };
      this.authToken.set(response.token);
      this.persistToken(response.token);
      return of(response);
    }

    return throwError(() => new Error('Invalid email or password.'));
  }

  logout(): void {
    this.authToken.set(null);
    if (typeof localStorage !== 'undefined') {
      localStorage.removeItem(this.authTokenKey);
    }
  }

  getErrorMessage(error: unknown): string {
    if (error instanceof Error && error.message.trim().length > 0) {
      return error.message;
    }

    return 'Unable to login right now. Please try again.';
  }

  private readStoredToken(): string | null {
    if (typeof localStorage === 'undefined') {
      return null;
    }

    return localStorage.getItem(this.authTokenKey);
  }

  private persistToken(token: string): void {
    if (typeof localStorage === 'undefined') {
      return;
    }

    localStorage.setItem(this.authTokenKey, token);
  }
}
