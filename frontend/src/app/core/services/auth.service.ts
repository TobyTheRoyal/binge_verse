import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, BehaviorSubject } from 'rxjs';
import { tap, catchError } from 'rxjs/operators';
import { throwError } from 'rxjs';
import { environment } from '../../../environments/environment';
import { debugLog, debugError } from '../utils/logger';

@Injectable({
  providedIn: 'root',
})
export class AuthService {
  private apiUrl = `${environment.apiUrl}/auth`;
  private tokenKey = 'auth_token';
  private isLoggedInSubject = new BehaviorSubject<boolean>(this.hasToken());

  constructor(private http: HttpClient) {}

  register(credentials: { username: string; email: string; password: string }): Observable<{ access_token: string }> {
    return this.http.post<{ access_token: string }>(`${this.apiUrl}/register`, credentials).pipe(
      tap((response) => {
        debugLog('Registration successful, response:', response);
        if (response.access_token) {
          localStorage.setItem(this.tokenKey, response.access_token);
          this.isLoggedInSubject.next(true);
          debugLog('Stored token:', response.access_token);
        } else {
          console.warn('No token received:', response);
        }
      }),
      catchError(this.handleError('register'))
    );
  }

  login(credentials: { email: string; password: string }): Observable<{ access_token: string }> {
    return this.http.post<{ access_token: string }>(`${this.apiUrl}/login`, credentials).pipe(
      tap((response) => {
        if (response.access_token) {
          localStorage.setItem(this.tokenKey, response.access_token);
          this.isLoggedInSubject.next(true);
          debugLog('Login successful, token saved:', response.access_token);
        }
      }),
      catchError(this.handleError('login'))
    );
  }

  logout(): void {
    localStorage.removeItem(this.tokenKey);
    this.isLoggedInSubject.next(false);
    debugLog('Logged out, token removed');
  }

  getToken(): string | null {
    const token = localStorage.getItem(this.tokenKey);
    debugLog('Retrieved token:', token);
    return token;
  }

  isLoggedIn(): Observable<boolean> {
    return this.isLoggedInSubject.asObservable();
  }

  hasToken(): boolean {
    return !!this.getToken();
  }

  private handleError(operation = 'operation') {
    return (error: any): Observable<never> => {
      debugError(`${operation} failed: ${error.message}`);
      return throwError(() => new Error(`${operation} failed: ${error.message}`));
    };
  }
}