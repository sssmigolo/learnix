import { Component, inject, signal, ChangeDetectionStrategy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { AuthService } from '../services/auth.service';

@Component({
  selector: 'app-auth',
  standalone: true,
  imports: [CommonModule, FormsModule],
  template: `
    <div class="min-h-screen flex items-center justify-center p-4">
      <div class="glass-dark w-full max-w-md p-8 rounded-3xl text-white shadow-2xl relative overflow-hidden animate-fade-in">
        
        <!-- Decorative bg -->
        <div class="absolute top-0 left-0 w-full h-2 bg-gradient-to-r from-flash-primary to-flash-accent"></div>

        <div class="text-center mb-8">
            <h1 class="text-3xl font-black tracking-tight mb-2">Welcome to Learnix</h1>
            <p class="opacity-60 text-sm">Your intelligent learning companion.</p>
        </div>

        <div class="flex gap-4 mb-6 p-1 bg-white/5 rounded-xl">
            <button (click)="mode.set('login')" [class]="'flex-1 py-2 rounded-lg text-sm font-bold transition-all ' + (mode() === 'login' ? 'bg-white/10 text-white shadow' : 'text-white/50 hover:text-white')">Login</button>
            <button (click)="mode.set('signup')" [class]="'flex-1 py-2 rounded-lg text-sm font-bold transition-all ' + (mode() === 'signup' ? 'bg-white/10 text-white shadow' : 'text-white/50 hover:text-white')">Sign Up</button>
        </div>

        <form (submit)="onSubmit()" class="space-y-4">
            <div>
                <label class="block text-xs font-bold uppercase tracking-wider opacity-50 mb-1">Username / Email</label>
                <input type="text" [(ngModel)]="username" name="username" class="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 focus:outline-none focus:border-flash-primary transition-colors" placeholder="Enter username" required>
            </div>
            
            <div>
                <label class="block text-xs font-bold uppercase tracking-wider opacity-50 mb-1">Password</label>
                <input type="password" [(ngModel)]="password" name="password" class="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 focus:outline-none focus:border-flash-primary transition-colors" placeholder="••••••••" required>
            </div>

            @if (error()) {
                <div class="text-red-400 text-sm text-center font-bold bg-red-500/10 py-2 rounded-lg border border-red-500/20">
                    {{ error() }}
                </div>
            }

            <button type="submit" class="w-full bg-gradient-to-r from-flash-primary to-blue-600 py-3 rounded-xl font-bold text-white shadow-lg hover:shadow-xl hover:scale-[1.02] transition-all">
                {{ mode() === 'login' ? 'Log In' : 'Create Account' }}
            </button>
        </form>

        <div class="relative my-6">
            <div class="absolute inset-0 flex items-center"><div class="w-full border-t border-white/10"></div></div>
            <div class="relative flex justify-center text-xs uppercase"><span class="bg-black/40 px-2 text-white/40">Or continue with</span></div>
        </div>

        <button (click)="googleLogin()" class="w-full bg-white text-gray-900 py-3 rounded-xl font-bold flex items-center justify-center gap-2 hover:bg-gray-100 transition-colors">
            <svg class="w-5 h-5" viewBox="0 0 24 24"><path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4"/><path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853"/><path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05"/><path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335"/></svg>
            Google
        </button>

        @if (mode() === 'login') {
            <p class="mt-6 text-center text-xs opacity-40">
                Try Admin Account: <span class="font-mono bg-white/10 px-1 rounded">admin</span> / <span class="font-mono bg-white/10 px-1 rounded">admin</span>
            </p>
        }
      </div>
    </div>
  `,
  changeDetection: ChangeDetectionStrategy.OnPush,
  styles: [`
    .animate-fade-in { animation: fadeIn 0.5s ease-out; }
    @keyframes fadeIn { from { opacity: 0; transform: translateY(10px); } to { opacity: 1; transform: translateY(0); } }
  `]
})
export class AuthComponent {
  authService = inject(AuthService);
  mode = signal<'login' | 'signup'>('login');
  
  username = '';
  password = '';
  error = signal('');

  onSubmit() {
    this.error.set('');
    
    if (this.mode() === 'login') {
        const success = this.authService.login(this.username, this.password);
        if (!success) this.error.set('Invalid credentials.');
    } else {
        const success = this.authService.signup(this.username, this.password);
        if (!success) this.error.set('Username already exists.');
    }
  }

  googleLogin() {
      // Simulate Google Auth
      const email = prompt("Enter an email for Google Sign-In Simulation:", "student@gmail.com");
      if (email) {
          this.authService.googleLoginMock(email);
      }
  }
}