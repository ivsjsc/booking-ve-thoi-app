import { Injectable, signal } from '@angular/core';

export interface User {
  name: string;
  email: string;
  phone: string;
  avatarUrl: string;
}

@Injectable({
  providedIn: 'root'
})
export class AuthService {
  isAuthenticated = signal(false);
  isGuest = signal(false);
  currentUser = signal<User | null>(null);

  private readonly AUTH_KEY = 've_thoi_auth_state';

  constructor() {
    // Check for persisted login state on initialization
    if (typeof localStorage !== 'undefined') {
        const persistedState = localStorage.getItem(this.AUTH_KEY);
        if (persistedState) {
            this.isAuthenticated.set(true);
            this.isGuest.set(false); // Persisted user is not a guest
            this.currentUser.set(JSON.parse(persistedState));
        }
    }
  }
  
  loginAsGuest(): void {
    this.isAuthenticated.set(true);
    this.isGuest.set(true);
    this.currentUser.set(null);
  }

  login(email: string, pass: string): boolean {
    // Mock login logic
    const mockUser: User = {
      name: 'Nguyễn Văn A',
      email: 'nguyenvana@email.com',
      phone: '0987 654 321',
      avatarUrl: 'https://i.pravatar.cc/150?u=user1'
    };
    this.isAuthenticated.set(true);
    this.isGuest.set(false);
    this.currentUser.set(mockUser);
    if (typeof localStorage !== 'undefined') {
        localStorage.setItem(this.AUTH_KEY, JSON.stringify(mockUser));
    }
    return true;
  }

  signup(name: string, email: string, pass: string): boolean {
    // Mock signup logic
    const newUser: User = {
      name: name,
      email: email,
      phone: 'Chưa cập nhật',
      avatarUrl: `https://i.pravatar.cc/150?u=${email}`
    };
    this.isAuthenticated.set(true);
    this.isGuest.set(false);
    this.currentUser.set(newUser);
    if (typeof localStorage !== 'undefined') {
        localStorage.setItem(this.AUTH_KEY, JSON.stringify(newUser));
    }
    return true;
  }

  logout(): void {
    this.isAuthenticated.set(false);
    this.isGuest.set(false);
    this.currentUser.set(null);
     if (typeof localStorage !== 'undefined') {
        localStorage.removeItem(this.AUTH_KEY);
    }
  }
}
