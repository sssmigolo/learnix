import { Injectable, signal, computed, effect } from '@angular/core';

export interface LessonRecord {
  id: string;
  topic: string;
  domain: string;
  date: number;
  score: number;
  totalQuestions: number;
  xpEarned: number;
}

export interface User {
  username: string;
  password?: string; // Optional for google users
  isGoogle?: boolean;
  isAdmin?: boolean;
  xp: number;
  streak: number;
  lastLogin: number;
  quests: any[];
  history: LessonRecord[];
}

@Injectable({
  providedIn: 'root'
})
export class AuthService {
  // "Backend" State is now fully in-memory
  private usersSignal = signal<User[]>([]); 
  currentUser = signal<User | null>(null);

  // Computed Backend Views
  leaderboard = computed(() => {
      // Return Top 5 Users by XP
      return [...this.usersSignal()]
        .sort((a, b) => (b.xp || 0) - (a.xp || 0))
        .slice(0, 5);
  });
  
  // Admin View: All Users
  allUsers = computed(() => {
      return [...this.usersSignal()].sort((a, b) => b.lastLogin - a.lastLogin);
  });

  systemStats = computed(() => {
      const users = this.usersSignal();
      return {
          totalUsers: users.length,
          totalXP: users.reduce((acc, u) => acc + (u.xp || 0), 0),
          totalLessons: users.reduce((acc, u) => acc + (u.history?.length || 0), 0),
          activeToday: users.filter(u => new Date(u.lastLogin).toDateString() === new Date().toDateString()).length
      };
  });
  
  constructor() {
    this.initDatabase();
    // No session to restore from localStorage
  }

  // Utility to calculate level globally
  getLevel(xp: number): number {
    if (!xp || xp === 0) return 1;
    return Math.floor(0.1 * Math.sqrt(xp)) + 1;
  }

  private initDatabase() {
    // Seed Admin Account into the in-memory signal
    const users: User[] = [{
      username: 'admin',
      password: 'admin',
      isAdmin: true,
      xp: 99999, 
      streak: 365,
      lastLogin: Date.now(),
      quests: this.generateDailyQuests(),
      history: []
    }];
    
    // Initialize state
    this.usersSignal.set(users);
  }

  // Persist now only updates the in-memory signal
  private persist(users: User[]) {
    this.usersSignal.set(users);
  }

  login(username: string, password?: string): boolean {
    const users = this.usersSignal();
    const user = users.find(u => u.username === username);

    if (user && user.password === password) {
      this.currentUser.set(user);
      this.checkStreak(user);
      return true;
    }
    return false;
  }

  signup(username: string, password?: string, isGoogle = false): boolean {
    const trimmedUsername = username.trim();
    if (!trimmedUsername || (!isGoogle && (!password || !password.trim()))) {
        return false;
    }

    const users = [...this.usersSignal()];
    if (users.find(u => u.username === trimmedUsername)) {
      return false; // User exists
    }

    const newUser: User = {
      username,
      password,
      isGoogle,
      isAdmin: false,
      xp: 0,
      streak: 1,
      lastLogin: Date.now(),
      quests: this.generateDailyQuests(),
      history: []
    };

    users.push(newUser);
    this.persist(users);
    
    this.currentUser.set(newUser);
    return true;
  }

  googleLoginMock(email: string) {
    const users = this.usersSignal();
    const user = users.find(u => u.username === email);
    
    if (user) {
      this.currentUser.set(user);
      this.checkStreak(user);
    } else {
      this.signup(email, undefined, true);
    }
  }

  logout() {
    this.currentUser.set(null);
  }

  updateUser(updatedUser: User) {
    const currentUsers = this.usersSignal();
    const updatedUsers = currentUsers.map(u =>
      u.username === updatedUser.username ? { ...updatedUser } : u
    );

    this.persist(updatedUsers);

    // Also update currentUser if the updated user is the one logged in
    if (this.currentUser()?.username === updatedUser.username) {
        this.currentUser.set({ ...updatedUser });
    }
  }

  private checkStreak(user: User) {
    const lastLogin = new Date(user.lastLogin);
    const now = new Date();

    const lastLoginDate = new Date(lastLogin.getFullYear(), lastLogin.getMonth(), lastLogin.getDate());
    const nowDate = new Date(now.getFullYear(), now.getMonth(), now.getDate());

    const diffTime = nowDate.getTime() - lastLoginDate.getTime();
    const diffDays = Math.round(diffTime / (1000 * 60 * 60 * 24));

    if (diffDays === 1) {
      user.streak += 1;
      user.quests = this.generateDailyQuests();
    } else if (diffDays > 1) {
      user.streak = 1;
      user.quests = this.generateDailyQuests();
    }

    user.lastLogin = Date.now();
    this.updateUser(user);
  }

  private generateDailyQuests() {
    return [
        { id: 1, title: 'Complete 1 Lesson', progress: 0, total: 1, completed: false, xpReward: 50 },
        { id: 2, title: 'Get 3 Perfect Answers', progress: 0, total: 3, completed: false, xpReward: 30 },
        { id: 3, title: 'Use AI Tutor', progress: 0, total: 1, completed: false, xpReward: 20 }
    ];
  }
}