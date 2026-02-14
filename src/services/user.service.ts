import { Injectable, computed, inject, signal } from '@angular/core';
import { AuthService, LessonRecord } from './auth.service';

@Injectable({
  providedIn: 'root'
})
export class UserService {
  private auth = inject(AuthService);

  // Derived state from Auth Service
  xp = computed(() => this.auth.currentUser()?.xp || 0);
  streak = computed(() => this.auth.currentUser()?.streak || 0);
  quests = computed(() => this.auth.currentUser()?.quests || []);
  
  // Accurate Leveling Curve: Level increases difficulty as you go.
  // Example: 100 XP = Lvl 2. 400 XP = Lvl 3. 10000 XP = Lvl 11.
  level = computed(() => {
    const xp = this.xp();
    if (xp === 0) return 1;
    return Math.floor(0.1 * Math.sqrt(xp)) + 1;
  });

  // History tracking
  history = computed(() => this.auth.currentUser()?.history || []);

  addXp(amount: number) {
    const user = this.auth.currentUser();
    if (user) {
      user.xp += amount;
      this.auth.updateUser(user);
    }
  }

  recordLesson(topic: string, domain: string, score: number, total: number, xp: number) {
      const user = this.auth.currentUser();
      if (user) {
          const record: LessonRecord = {
              id: crypto.randomUUID(),
              topic,
              domain,
              date: Date.now(),
              score,
              totalQuestions: total,
              xpEarned: xp
          };
          user.history.unshift(record); // Add to front
          this.auth.updateUser(user);
      }
  }

  updateQuestProgress(questId: number, amount: number = 1) {
    const user = this.auth.currentUser();
    if (!user) return;

    let questsUpdated = false;
    const newQuests = user.quests.map(q => {
        if (q.id === questId && !q.completed) {
          const newProgress = Math.min(q.progress + amount, q.total);
          const isCompleted = newProgress === q.total;
          
          if (isCompleted && !q.completed) {
             // Reward XP immediately
             user.xp += q.xpReward;
          }
          questsUpdated = true;
          return { ...q, progress: newProgress, completed: isCompleted };
        }
        return q;
    });

    if (questsUpdated) {
        user.quests = newQuests;
        this.auth.updateUser(user);
    }
  }
}