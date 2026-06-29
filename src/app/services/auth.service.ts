import { Injectable, PLATFORM_ID, inject } from '@angular/core';
import { isPlatformBrowser } from '@angular/common';
import { HttpClient, HttpErrorResponse } from '@angular/common/http';
import { MatSnackBar } from '@angular/material/snack-bar';
import { Observable, tap, map, catchError, of } from 'rxjs';
import { environment } from '../../environments/environment';

@Injectable({
  providedIn: 'root',
})
export class AuthService {
  private readonly TOKEN_KEY = 'enduro_admin_token';
  private readonly API_URL = environment.apiUrl;

  private platformId = inject(PLATFORM_ID);
  private isBrowser = isPlatformBrowser(this.platformId);
  private http = inject(HttpClient);
  private snackBar = inject(MatSnackBar);

  login(username: string, password: string): Observable<boolean> {
    return this.http
      .post<{ access_token: string }>(`${this.API_URL}/auth/login`, {
        username,
        password,
      })
      .pipe(
        tap((res) => {
          if (this.isBrowser) {
            localStorage.setItem(this.TOKEN_KEY, res.access_token);
          }
        }),
        map(() => true),
        catchError(() => of(false))
      );
  }

  logout(): void {
    if (!this.isBrowser) return;
    localStorage.removeItem(this.TOKEN_KEY);
  }

  isAuthenticated(): boolean {
    if (!this.isBrowser) return false;
    return !!localStorage.getItem(this.TOKEN_KEY);
  }

  verify(): Observable<boolean> {
    const token = this.getToken();
    if (!token) return of(false);
    return this.http
      .get(`${this.API_URL}/auth/me`, {
        headers: { Authorization: `Bearer ${token}` },
      })
      .pipe(
        map(() => true),
        catchError((err: HttpErrorResponse) => {
          // Only clear the token on actual auth failures — not network errors,
          // otherwise a brief connectivity hiccup would log a real admin out.
          if (err.status === 401 || err.status === 403) {
            this.logout();
            if (this.isBrowser) {
              this.snackBar.open('Your session has expired. Please log in again.', 'Close', {
                duration: 5000,
              });
            }
          }
          return of(false);
        })
      );
  }

  getToken(): string | null {
    if (!this.isBrowser) return null;
    return localStorage.getItem(this.TOKEN_KEY);
  }
}
