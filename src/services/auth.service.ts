import { Injectable, signal, computed } from '@angular/core';

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
  password?: string;
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
  private usersSignal = signal<User[]>([]); 
  currentUser = signal<User | null>(null);

  leaderboard = computed(() => {
      return [...this.usersSignal()]
        .sort((a, b) => (b.xp || 0) - (a.xp || 0))
        .slice(0, 5);
  });
  
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
  }

  getLevel(xp: number): number {
    if (!xp || xp === 0) return 1;
    return Math.floor(0.1 * Math.sqrt(xp)) + 1;
  }

  private initDatabase() {
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
    this.usersSignal.set(users);
  }

  private persist(users: User[]) {
    this.usersSignal.set([...users]);
  }

  login(username: string, password?: string): boolean {
    const users = this.usersSignal();
    const user = users.find(u => u.username === username);

    if (user && user.password === password) {
      this.currentUser.set({ ...user });
      this.checkStreak({ ...user });
      return true;
    }
    return false;
  }

  signup(username: string, password?: string, isGoogle = false): boolean {
    const users = this.usersSignal();
    if (users.find(u => u.username === username)) {
      return false;
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

    this.persist([...users, newUser]);
    this.currentUser.set({ ...newUser });
    return true;
  }

  googleLoginMock(email: string) {
    const users = this.usersSignal();
    const user = users.find(u => u.username === email);
    
    if (user) {
      this.currentUser.set({ ...user });
      this.checkStreak({ ...user });
    } else {
      this.signup(email, undefined, true);
    }
  }

  logout() {
    this.currentUser.set(null);
  }

  updateUser(updatedUser: User) {
    this.usersSignal.update(users =>
        users.map(u => u.username === updatedUser.username ? { ...updatedUser } : u)
    );

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

    let updatedStreak = user.streak;
    let updatedQuests = user.quests;

    if (diffDays === 1) {
      updatedStreak += 1;
      updatedQuests = this.generateDailyQuests();
    } else if (diffDays > 1) {
      updatedStreak = 1;
      updatedQuests = this.generateDailyQuests();
    }

    this.updateUser({
        ...user,
        streak: updatedStreak,
        quests: updatedQuests,
        lastLogin: Date.now()
    });
  }

  private generateDailyQuests() {
    return [
        { id: 1, title: 'Complete 1 Lesson', progress: 0, total: 1, completed: false, xpReward: 50 },
        { id: 2, title: 'Get 3 Perfect Answers', progress: 0, total: 3, completed: false, xpReward: 30 },
        { id: 3, title: 'Use AI Tutor', progress: 0, total: 1, completed: false, xpReward: 20 }
    ];
  }
}