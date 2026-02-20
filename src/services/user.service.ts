import { Injectable, computed, inject } from '@angular/core';
import { AuthService, LessonRecord } from './auth.service';

@Injectable({
  providedIn: 'root'
})
export class UserService {
  private auth = inject(AuthService);

  xp = computed(() => this.auth.currentUser()?.xp || 0);
  streak = computed(() => this.auth.currentUser()?.streak || 0);
  quests = computed(() => this.auth.currentUser()?.quests || []);
  
  level = computed(() => {
    const xp = this.xp();
    if (xp === 0) return 1;
    return Math.floor(0.1 * Math.sqrt(xp)) + 1;
  });

  history = computed(() => this.auth.currentUser()?.history || []);

  addXp(amount: number) {
    const user = this.auth.currentUser();
    if (user) {
      this.auth.updateUser({
          ...user,
          xp: user.xp + amount
      });
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
          this.auth.updateUser({
              ...user,
              history: [record, ...user.history]
          });
      }
  }

  updateQuestProgress(questId: number, amount: number = 1) {
    const user = this.auth.currentUser();
    if (!user) return;

    let totalXpReward = 0;
    let questsUpdated = false;

    const newQuests = user.quests.map(q => {
        if (q.id === questId && !q.completed) {
          const newProgress = Math.min(q.progress + amount, q.total);
          const isCompleted = newProgress === q.total;
          
          if (isCompleted) {
             totalXpReward += q.xpReward;
          }
          questsUpdated = true;
          return { ...q, progress: newProgress, completed: isCompleted };
        }
        return { ...q };
    });

    if (questsUpdated) {
        this.auth.updateUser({
            ...user,
            xp: user.xp + totalXpReward,
            quests: newQuests
        });
    }
  }
}