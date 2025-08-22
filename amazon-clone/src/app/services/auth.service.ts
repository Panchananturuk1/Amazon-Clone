import { Injectable } from '@angular/core';
import { BehaviorSubject, Observable, of, throwError } from 'rxjs';
import { delay, map } from 'rxjs/operators';

export interface User {
  id: string;
  email: string;
  name: string;
  createdAt: Date;
}

export interface LoginCredentials {
  email: string;
  password: string;
}

export interface RegisterData {
  name: string;
  email: string;
  password: string;
  confirmPassword: string;
}

export interface AuthResponse {
  success: boolean;
  message: string;
  user?: User;
  token?: string;
}

@Injectable({
  providedIn: 'root'
})
export class AuthService {
  private currentUserSubject = new BehaviorSubject<User | null>(null);
  public currentUser$ = this.currentUserSubject.asObservable();
  
  private isLoggedInSubject = new BehaviorSubject<boolean>(false);
  public isLoggedIn$ = this.isLoggedInSubject.asObservable();

  constructor() {
    // Check if user is already logged in from localStorage
    this.checkStoredAuth();
  }

  private isLocalStorageAvailable(): boolean {
    try {
      return typeof window !== 'undefined' && typeof localStorage !== 'undefined';
    } catch {
      return false;
    }
  }

  private checkStoredAuth(): void {
    if (!this.isLocalStorageAvailable()) return;
    
    const storedUser = localStorage.getItem('currentUser');
    const storedToken = localStorage.getItem('authToken');
    
    if (storedUser && storedToken) {
      const user = JSON.parse(storedUser);
      this.currentUserSubject.next(user);
      this.isLoggedInSubject.next(true);
    }
  }

  login(credentials: LoginCredentials): Observable<AuthResponse> {
    // Simulate API call with delay
    return of(null).pipe(
      delay(1000),
      map(() => {
        // Basic email validation
        if (!this.isValidEmail(credentials.email)) {
          throw new Error('Please enter a valid email address');
        }

        if (credentials.password.length < 6) {
          throw new Error('Password must be at least 6 characters long');
        }

        // Simulate successful login
        const user: User = {
          id: '1',
          email: credentials.email,
          name: credentials.email.split('@')[0],
          createdAt: new Date()
        };

        const token = 'mock-jwt-token-' + Date.now();
        
        // Store in localStorage
        if (this.isLocalStorageAvailable()) {
          localStorage.setItem('currentUser', JSON.stringify(user));
          localStorage.setItem('authToken', token);
        }
        
        // Update subjects
        this.currentUserSubject.next(user);
        this.isLoggedInSubject.next(true);

        return {
          success: true,
          message: 'Login successful',
          user,
          token
        };
      })
    );
  }

  register(data: RegisterData): Observable<AuthResponse> {
    // Simulate API call with delay
    return of(null).pipe(
      delay(1000),
      map(() => {
        // Validation
        if (!data.name.trim()) {
          throw new Error('Name is required');
        }

        if (!this.isValidEmail(data.email)) {
          throw new Error('Please enter a valid email address');
        }

        if (data.password.length < 6) {
          throw new Error('Password must be at least 6 characters long');
        }

        if (data.password !== data.confirmPassword) {
          throw new Error('Passwords do not match');
        }

        // Simulate successful registration
        const user: User = {
          id: '1',
          email: data.email,
          name: data.name,
          createdAt: new Date()
        };

        const token = 'mock-jwt-token-' + Date.now();
        
        // Store in localStorage
        if (this.isLocalStorageAvailable()) {
          localStorage.setItem('currentUser', JSON.stringify(user));
          localStorage.setItem('authToken', token);
        }
        
        // Update subjects
        this.currentUserSubject.next(user);
        this.isLoggedInSubject.next(true);

        return {
          success: true,
          message: 'Registration successful',
          user,
          token
        };
      })
    );
  }

  logout(): void {
    // Clear localStorage
    if (this.isLocalStorageAvailable()) {
      localStorage.removeItem('currentUser');
      localStorage.removeItem('authToken');
    }
    
    // Update subjects
    this.currentUserSubject.next(null);
    this.isLoggedInSubject.next(false);
  }

  getCurrentUser(): User | null {
    return this.currentUserSubject.value;
  }

  isLoggedIn(): boolean {
    return this.isLoggedInSubject.value;
  }

  getToken(): string | null {
    if (!this.isLocalStorageAvailable()) return null;
    return localStorage.getItem('authToken');
  }

  private isValidEmail(email: string): boolean {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
  }
}
