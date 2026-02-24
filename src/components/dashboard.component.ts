import { Component, input, output, inject, signal, ChangeDetectionStrategy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { UserService } from '../services/user.service';
import { AuthService } from '../services/auth.service';

@Component({
  selector: 'app-dashboard',
  standalone: true,
  imports: [CommonModule, FormsModule],
  template: `
    <div class="flex flex-col gap-8 pb-12 animate-fade-in">
      
      <!-- Header / Streak Area -->
      <div class="flex flex-col md:flex-row justify-between items-end gap-4">
        <div>
           <h1 class="text-4xl font-black bg-clip-text text-transparent bg-gradient-to-r from-white via-gray-200 to-gray-400 drop-shadow-sm">
            Ready to learn?
          </h1>
          <p class="opacity-60 mt-1">Pick a path or search for any concept.</p>
        </div>
        
        <!-- Streak Capsule -->
        <div [class]="'px-4 py-2 rounded-full flex items-center gap-3 border ' + (darkMode() ? 'bg-white/5 border-white/10' : 'bg-white/40 border-white/20')">
            <div class="flex items-center gap-1.5">
                <svg xmlns="http://www.w3.org/2000/svg" class="w-5 h-5 text-orange-500" viewBox="0 0 24 24" fill="currentColor"><path d="M12 22a10 10 0 1 1 0-20 10 10 0 0 1 0 20zm0-2a8 8 0 1 0 0-16 8 8 0 0 0 0 16zm-1-6.57l-2.82-2.83 1.41-1.41L11 10.6l4.24-4.25 1.41 1.42L11 13.43z"/></svg>
                <span class="font-bold">{{ userService.streak() }} Day Streak</span>
            </div>
            <div class="w-[1px] h-4 bg-gray-500/30"></div>
            <div class="flex items-center gap-1.5 text-flash-accent">
                <svg xmlns="http://www.w3.org/2000/svg" class="w-5 h-5" viewBox="0 0 24 24" fill="currentColor"><path d="M12 2l2.4 7.2h7.6l-6 4.8 2.4 7.2-6-4.8-6 4.8 2.4-7.2-6-4.8h7.6z"/></svg>
                <span class="font-bold">{{ userService.xp() }} XP</span>
            </div>
             <div class="w-[1px] h-4 bg-gray-500/30"></div>
            <span class="text-xs font-bold uppercase tracking-wide opacity-70">Lvl {{ userService.level() }}</span>
        </div>
      </div>

      <!-- ADMIN ANALYTICS PANEL (Visible only to Admin) -->
      @if (authService.currentUser()?.isAdmin) {
          <div class="flex flex-col gap-6">
            <!-- Stats Cards -->
            <div class="grid grid-cols-1 md:grid-cols-4 gap-4 p-6 rounded-3xl border border-white/10 bg-gradient-to-r from-gray-900 to-black relative overflow-hidden group">
                <div class="absolute inset-0 bg-flash-primary/5 group-hover:bg-flash-primary/10 transition-colors"></div>
                <div class="md:col-span-4 flex items-center gap-2 mb-2 text-flash-primary font-bold uppercase tracking-wider text-xs z-10">
                    <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M12 2a10 10 0 1 0 10 10H12V2z"/><path d="M12 2a10 10 0 0 1 10 10h-10V2z"/><path d="M12 12 2.1 12a10.1 10.1 0 0 0 1.9 4.3"/></svg>
                    Admin Analytics
                </div>
                
                <div class="z-10">
                    <div class="text-3xl font-black">{{ authService.systemStats().totalUsers }}</div>
                    <div class="text-xs opacity-50 uppercase">Total Users</div>
                </div>
                <div class="z-10">
                    <div class="text-3xl font-black">{{ authService.systemStats().totalXP | number }}</div>
                    <div class="text-xs opacity-50 uppercase">Total XP Earned</div>
                </div>
                <div class="z-10">
                    <div class="text-3xl font-black">{{ authService.systemStats().totalLessons }}</div>
                    <div class="text-xs opacity-50 uppercase">Lessons Taken</div>
                </div>
                <div class="z-10">
                    <div class="text-3xl font-black text-green-400">{{ authService.systemStats().activeToday }}</div>
                    <div class="text-xs opacity-50 uppercase">Active Today</div>
                </div>
            </div>

            <!-- User Registry Table -->
            <div [class]="'rounded-3xl border overflow-hidden ' + (darkMode() ? 'bg-white/5 border-white/10' : 'bg-white/40 border-white/20')">
                <div class="px-6 py-4 border-b border-white/10 bg-white/5">
                    <h3 class="font-bold text-sm uppercase tracking-wider">User Registry</h3>
                </div>
                <div class="overflow-x-auto">
                    <table class="w-full text-left">
                        <thead>
                            <tr class="text-xs uppercase opacity-50 border-b border-white/10">
                                <th class="px-6 py-3 font-bold">User</th>
                                <th class="px-6 py-3 font-bold">Role</th>
                                <th class="px-6 py-3 font-bold">Level</th>
                                <th class="px-6 py-3 font-bold text-right">Total XP</th>
                                <th class="px-6 py-3 font-bold text-center">Streak</th>
                                <th class="px-6 py-3 font-bold text-right">Last Login</th>
                            </tr>
                        </thead>
                        <tbody class="text-sm">
                            @for (user of authService.allUsers(); track user.username) {
                                <tr [class]="'border-b border-white/5 hover:bg-white/5 transition-colors ' + (user.username === authService.currentUser()?.username ? 'bg-blue-500/10' : '')">
                                    <td class="px-6 py-3 font-medium flex items-center gap-2">
                                        <div class="w-6 h-6 rounded-full overflow-hidden bg-gray-500">
                                            <img [src]="user.isGoogle ? 'https://picsum.photos/seed/google/100/100' : 'https://picsum.photos/seed/' + user.username + '/100/100'" class="w-full h-full object-cover">
                                        </div>
                                        {{ user.username }}
                                    </td>
                                    <td class="px-6 py-3 opacity-80">
                                        <span [class]="'px-2 py-0.5 rounded text-[10px] font-bold uppercase ' + (user.isAdmin ? 'bg-purple-500/20 text-purple-300' : 'bg-gray-500/20 text-gray-400')">
                                            {{ user.isAdmin ? 'Admin' : 'Student' }}
                                        </span>
                                    </td>
                                    <td class="px-6 py-3">
                                        <span class="font-bold text-flash-accent">Lvl {{ authService.getLevel(user.xp) }}</span>
                                    </td>
                                    <td class="px-6 py-3 text-right font-mono opacity-80">{{ user.xp | number }}</td>
                                    <td class="px-6 py-3 text-center">
                                        <span class="text-orange-400 font-bold">🔥 {{ user.streak }}</span>
                                    </td>
                                    <td class="px-6 py-3 text-right opacity-60 text-xs">{{ user.lastLogin | date:'short' }}</td>
                                </tr>
                            }
                        </tbody>
                    </table>
                </div>
            </div>
          </div>
      }

      <!-- Main Layout: Content + Sidebar -->
      <div class="grid grid-cols-1 lg:grid-cols-4 gap-8">
        
        <!-- Left Column: Content (3 cols) -->
        <div class="lg:col-span-3 space-y-8">
            <!-- Quick Search -->
            <div [class]="'p-1.5 rounded-2xl flex items-center gap-2 focus-within:ring-2 focus-within:ring-flash-primary transition-all ' + (darkMode() ? 'bg-white/5 border border-white/10' : 'bg-white border border-white/30 shadow-sm')">
                <div class="pl-3 opacity-50">
                    <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="11" cy="11" r="8"/><path d="m21 21-4.3-4.3"/></svg>
                </div>
                <input 
                    type="text" 
                    [(ngModel)]="customTopic"
                    (keyup.enter)="startCustomLesson()"
                    placeholder="What do you want to master today? (e.g. 'Calculus', 'Photosynthesis')"
                    class="w-full bg-transparent border-none focus:outline-none p-2 placeholder-gray-400 font-medium"
                >
                <button 
                (click)="startCustomLesson()"
                [disabled]="!customTopic"
                class="px-6 py-2 rounded-xl bg-flash-primary text-white font-bold hover:bg-blue-600 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                aria-label="Start custom lesson"
                >
                    Go
                </button>
            </div>

            <!-- View Toggle (Paths vs History) -->
            <div class="flex gap-4 border-b border-white/10 pb-2">
                <button (click)="viewMode.set('paths')" [class]="'text-sm font-bold uppercase tracking-wide pb-2 border-b-2 transition-colors ' + (viewMode() === 'paths' ? 'border-flash-accent text-white' : 'border-transparent text-white/40 hover:text-white/70')">Learning Paths</button>
                <button (click)="viewMode.set('history')" [class]="'text-sm font-bold uppercase tracking-wide pb-2 border-b-2 transition-colors ' + (viewMode() === 'history' ? 'border-flash-accent text-white' : 'border-transparent text-white/40 hover:text-white/70')">Lesson History</button>
            </div>

             <!-- Learning Paths -->
             @if (viewMode() === 'paths') {
                <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 animate-fade-in">
                    @for (path of paths; track path.title) {
                        <div [class]="'group relative p-6 rounded-3xl overflow-hidden cursor-pointer transition-all hover:-translate-y-1 ' + (darkMode() ? 'glass-dark hover:bg-white/10' : 'glass hover:bg-white/60')">
                            <!-- Background Pattern -->
                            <div class="absolute -right-4 -top-4 opacity-10 group-hover:opacity-20 transition-opacity">
                                <svg width="120" height="120" viewBox="0 0 24 24" fill="currentColor"><path d="M12 2L2 7l10 5 10-5-10-5zm0 9l2.5-1.25L12 8.5l-2.5 1.25L12 11zm0 2.5l-5-2.5-5 2.5L12 22l10-8.5-5-2.5-5 2.5z"/></svg>
                            </div>

                            <div class="relative z-10">
                                <div [class]="'w-12 h-12 rounded-2xl mb-4 flex items-center justify-center text-xl ' + path.iconClass">
                                    {{ path.icon }}
                                </div>
                                <h3 class="text-xl font-bold mb-1">{{ path.title }}</h3>
                                <p class="text-sm opacity-60 mb-6 min-h-[40px]">{{ path.desc }}</p>

                                <div class="space-y-3">
                                    @for (topic of path.topics; track topic) {
                                        <button 
                                            (click)="startLesson(topic, path.title)"
                                            class="w-full text-left px-4 py-3 rounded-xl flex items-center justify-between group/btn hover:bg-white/10 transition-colors border border-white/5 hover:border-white/20"
                                            [attr.aria-label]="'Start lesson on ' + topic"
                                        >
                                            <span class="font-medium text-sm">{{ topic }}</span>
                                            <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="opacity-0 group-hover/btn:opacity-100 transform translate-x-[-10px] group-hover/btn:translate-x-0 transition-all text-flash-accent"><path d="M5 12h14"/><path d="m12 5 7 7-7 7"/></svg>
                                        </button>
                                    }
                                </div>
                            </div>
                            
                            <!-- Progress Bar at bottom -->
                            <div class="absolute bottom-0 left-0 w-full h-1.5 bg-black/20">
                                <div class="h-full bg-gradient-to-r from-flash-primary to-flash-accent" [style.width]="path.progress + '%'"></div>
                            </div>
                        </div>
                    }
                </div>
             } @else {
                <!-- History View -->
                <div class="space-y-4 animate-fade-in">
                    @if (userService.history().length === 0) {
                        <div class="p-12 text-center opacity-50 border border-dashed border-white/20 rounded-2xl">
                            <p>No lessons taken yet. Start learning!</p>
                        </div>
                    } @else {
                        @for (record of userService.history(); track record.id) {
                            <div [class]="'p-4 rounded-xl flex items-center justify-between ' + (darkMode() ? 'bg-white/5' : 'bg-white/40')">
                                <div>
                                    <h4 class="font-bold">{{ record.topic }}</h4>
                                    <div class="text-xs opacity-60 flex gap-2">
                                        <span>{{ record.domain }}</span>
                                        <span>•</span>
                                        <span>{{ record.date | date:'mediumDate' }}</span>
                                    </div>
                                </div>
                                <div class="text-right">
                                    <div class="font-bold text-flash-accent">+{{ record.xpEarned }} XP</div>
                                    <div class="text-xs opacity-70">Score: {{ record.score }}/{{ record.totalQuestions }}</div>
                                </div>
                            </div>
                        }
                    }
                </div>
             }
        </div>

        <!-- Right Column: Quests, Leaderboard & Tools -->
        <div class="flex flex-col gap-6">
            
            <!-- Global Leaderboard (New Backend Feature) -->
            <div [class]="'p-6 rounded-3xl ' + (darkMode() ? 'glass-dark' : 'glass')">
                <div class="flex items-center justify-between mb-4">
                    <h3 class="font-bold text-lg flex items-center gap-2">
                        <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="text-flash-accent"><path d="M6 9H4.5a2.5 2.5 0 0 1 0-5H6"/><path d="M18 9h1.5a2.5 2.5 0 0 0 0-5H18"/><path d="M4 22h16"/><path d="M10 14.66V17c0 .55-.47.98-.97 1.21C7.85 18.75 7 20.24 7 22"/><path d="M14 14.66V17c0 .55.47.98.97 1.21C16.15 18.75 17 20.24 17 22"/><path d="M18 2H6v7a6 6 0 0 0 12 0V2Z"/></svg>
                        Leaderboard
                    </h3>
                </div>
                
                <div class="space-y-3">
                    @for (user of authService.leaderboard(); track user.username; let i = $index) {
                         <div [class]="'flex items-center gap-3 p-2 rounded-xl transition-colors ' + (user.username === authService.currentUser()?.username ? 'bg-white/10 border border-white/10' : '')">
                            <div class="font-black opacity-40 w-5 text-center">{{ i + 1 }}</div>
                            <div class="w-8 h-8 rounded-full overflow-hidden bg-gray-500">
                                 <img [src]="user.isGoogle ? 'https://picsum.photos/seed/google/100/100' : 'https://picsum.photos/seed/' + user.username + '/100/100'" class="w-full h-full object-cover">
                            </div>
                            <div class="flex-1 min-w-0">
                                <div class="text-sm font-bold truncate">
                                    {{ user.username }} 
                                    @if(user.username === authService.currentUser()?.username) { <span class="text-xs opacity-50 font-normal">(You)</span> }
                                </div>
                            </div>
                            <div class="text-xs font-bold text-flash-accent">{{ user.xp }} XP</div>
                         </div>
                    }
                </div>
            </div>

            <!-- Curriculum Blender CTA -->
            <div [class]="'p-6 rounded-3xl relative overflow-hidden group cursor-pointer transition-transform hover:scale-[1.02] ' + (darkMode() ? 'bg-gradient-to-br from-purple-900/50 to-blue-900/50 border border-white/10' : 'bg-gradient-to-br from-purple-100 to-blue-100 border border-white/50')"
                 (click)="onOpenBlender.emit()">
                 <div class="relative z-10">
                    <div class="w-10 h-10 rounded-full bg-white/20 flex items-center justify-center mb-4 text-white">
                        <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="10"/><path d="m4.93 4.93 4.24 4.24"/><path d="m14.83 14.83 4.24 4.24"/><path d="m14.83 9.17 4.24-4.24"/><path d="m14.83 9.17-3.53-3.53"/><path d="m4.93 19.07 4.24-4.24"/></svg>
                    </div>
                    <h3 class="text-lg font-bold mb-1">Curriculum Blender</h3>
                    <p class="text-xs opacity-70 mb-0">Bridge local & global standards with AI.</p>
                 </div>
                 <div class="absolute -bottom-4 -right-4 w-24 h-24 bg-purple-500/20 rounded-full blur-xl group-hover:bg-purple-500/30 transition-colors"></div>
            </div>

            <!-- Daily Quests -->
            <div [class]="'p-6 rounded-3xl ' + (darkMode() ? 'glass-dark' : 'glass')">
                <div class="flex items-center justify-between mb-4">
                    <h3 class="font-bold text-lg">Daily Quests</h3>
                    <span class="text-xs font-bold uppercase text-flash-accent tracking-widest">Resets in 4h</span>
                </div>
                
                <div class="space-y-4">
                    @for (quest of userService.quests(); track quest.id) {
                        <div class="flex items-center gap-4">
                            <!-- Icon/Status -->
                            <div [class]="'w-10 h-10 rounded-xl flex items-center justify-center shrink-0 ' + (quest.completed ? 'bg-green-500 text-white' : 'bg-white/10')">
                                @if (quest.completed) {
                                    <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="3" stroke-linecap="round" stroke-linejoin="round"><polyline points="20 6 9 17 4 12"/></svg>
                                } @else {
                                    <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="opacity-50"><path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10"/></svg>
                                }
                            </div>
                            
                            <div class="flex-1">
                                <div class="flex justify-between items-center mb-1">
                                    <span [class]="'text-sm font-medium ' + (quest.completed ? 'opacity-50 line-through' : '')">{{ quest.title }}</span>
                                    <span class="text-xs font-bold text-flash-accent">+{{ quest.xpReward }} XP</span>
                                </div>
                                <!-- Progress Bar -->
                                <div class="h-1.5 bg-black/20 rounded-full overflow-hidden">
                                    <div class="h-full bg-flash-accent transition-all duration-500" [style.width]="(quest.progress / quest.total * 100) + '%'"></div>
                                </div>
                            </div>
                        </div>
                    }
                </div>
            </div>

            <!-- Promotion Box -->
            <div class="p-6 rounded-3xl bg-gradient-to-br from-flash-primary to-blue-700 text-white relative overflow-hidden">
                <div class="relative z-10">
                    <h3 class="font-bold text-lg mb-2">Try Super Learnix</h3>
                    <p class="text-sm opacity-90 mb-4">Unlimited hearts, personalized practice, and no ads.</p>
                    <button class="w-full py-2 bg-white text-blue-600 font-bold rounded-xl text-sm hover:bg-gray-100 transition-colors">
                        Free Trial
                    </button>
                </div>
                <div class="absolute top-0 right-0 -mr-4 -mt-4 w-24 h-24 rounded-full bg-white/20 blur-xl"></div>
            </div>
        </div>

      </div>
    </div>
  `,
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class DashboardComponent {
  darkMode = input.required<boolean>();
  userService = inject(UserService);
  authService = inject(AuthService);
  
  onStartLesson = output<{topic: string, domain: string}>();
  onOpenBlender = output<void>();
  
  customTopic = '';
  viewMode = signal<'paths' | 'history'>('paths');

  paths = [
    {
      title: 'Mathematics',
      desc: 'From Algebra to Calculus. Master the language of the universe.',
      icon: '∑',
      iconClass: 'bg-blue-500/20 text-blue-400',
      progress: 35,
      topics: ['Linear Algebra', 'Calculus I', 'Probability', 'Geometry', 'Number Theory']
    },
    {
      title: 'Science',
      desc: 'Physics, Chemistry, and Biology. Understand how the world works.',
      icon: '⚛',
      iconClass: 'bg-purple-500/20 text-purple-400',
      progress: 12,
      topics: ['Newtonian Physics', 'Organic Chemistry', 'Genetics', 'Astrophysics', 'Quantum Mechanics']
    },
    {
      title: 'Computer Science',
      desc: 'Algorithms, AI, and Systems. Build the future.',
      icon: '⌘',
      iconClass: 'bg-green-500/20 text-green-400',
      progress: 68,
      topics: ['Data Structures', 'Neural Networks', 'Cybersecurity', 'Web Development', 'Cloud Computing']
    },
    {
      title: 'Humanities',
      desc: 'History, Philosophy, and Art. Explore the human experience.',
      icon: '🏛️',
      iconClass: 'bg-yellow-500/20 text-yellow-400',
      progress: 8,
      topics: ['World War II', 'Ancient Rome', 'Modern Art', 'Philosophy 101', 'Renaissance']
    },
    {
      title: 'Economics',
      desc: 'Markets, Finance, and Strategy. Understand value and exchange.',
      icon: '📈',
      iconClass: 'bg-red-500/20 text-red-400',
      progress: 22,
      topics: ['Microeconomics', 'Game Theory', 'Personal Finance', 'Macroeconomics', 'Marketing']
    },
    {
      title: 'Geography',
      desc: 'Explore the world, cultures, physical landscapes, and human impact.',
      icon: '🌍',
      iconClass: 'bg-teal-500/20 text-teal-400',
      progress: 5,
      topics: ['Plate Tectonics', 'Climatology', 'Urbanization', 'Geopolitics', 'Cartography']
    }
  ];

  startLesson(topic: string, domain: string) {
    this.onStartLesson.emit({ topic, domain });
  }

  startCustomLesson() {
    if(!this.customTopic) return;
    this.onStartLesson.emit({ topic: this.customTopic, domain: 'General Knowledge' });
  }
}