import { Component, signal, inject, effect, OnInit, ChangeDetectionStrategy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { DashboardComponent } from './components/dashboard.component';
import { LessonViewerComponent } from './components/lesson-viewer.component';
import { CurriculumBlenderComponent } from './components/curriculum-blender.component';
import { AuthComponent } from './components/auth.component';
import { AuthService } from './services/auth.service';

@Component({
  selector: 'app-root',
  standalone: true,
  imports: [CommonModule, DashboardComponent, LessonViewerComponent, CurriculumBlenderComponent, AuthComponent],
  templateUrl: './app.component.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
  styles: [`
    :host { display: block; }
    .intro-overlay {
        animation: fadeOutOverlay 0.8s cubic-bezier(0.7, 0, 0.3, 1) 2.5s forwards;
    }
    .intro-content {
        animation: zoomOut 0.8s cubic-bezier(0.7, 0, 0.3, 1) 2.5s forwards;
    }
    .intro-logo {
        animation: logoPop 1.2s cubic-bezier(0.34, 1.56, 0.64, 1) 0.2s both;
    }
    .intro-text {
        animation: textReveal 1s cubic-bezier(0.22, 1, 0.36, 1) 0.8s both;
    }
    .intro-sub {
        animation: subFade 1s ease-out 1.2s both;
    }
    
    @keyframes fadeOutOverlay {
        to { opacity: 0; visibility: hidden; }
    }
    @keyframes zoomOut {
        to { transform: scale(1.1); }
    }
    @keyframes logoPop {
        0% { transform: scale(0.5) rotate(-15deg); opacity: 0; filter: blur(10px); }
        100% { transform: scale(1) rotate(0); opacity: 1; filter: blur(0); }
    }
    @keyframes textReveal {
        0% { transform: translateY(40px); opacity: 0; clip-path: polygon(0 0, 100% 0, 100% 0, 0 0); }
        100% { transform: translateY(0); opacity: 1; clip-path: polygon(0 0, 100% 0, 100% 100%, 0 100%); }
    }
    @keyframes subFade {
        from { opacity: 0; transform: translateY(10px); }
        to { opacity: 1; transform: translateY(0); }
    }
  `]
})
export class AppComponent implements OnInit {
  authService = inject(AuthService);
  isDarkMode = signal(true);
  
  // State for View Management
  currentView = signal<'dashboard' | 'lesson' | 'blender'>('dashboard');
  
  // State for Active Lesson
  activeLessonTopic = signal<string>('');
  activeLessonDomain = signal<string>('');

  // Splash Screen State
  showSplash = signal(true);

  constructor() {
    // Initial theme setup
    this.updateHtmlClass();
    
    // Reset view if user logs out
    effect(() => {
        if (!this.authService.currentUser()) {
            this.currentView.set('dashboard');
        }
    });
  }

  ngOnInit() {
    // Splash screen timer
    setTimeout(() => {
        this.showSplash.set(false);
    }, 3300); // 2.5s animation + 0.8s fade out overlap
  }

  toggleTheme() {
    this.isDarkMode.update(v => !v);
    this.updateHtmlClass();
  }

  private updateHtmlClass() {
    const html = document.documentElement;
    if (this.isDarkMode()) {
      html.classList.add('dark');
    } else {
      html.classList.remove('dark');
    }
  }

  startLesson(data: {topic: string, domain: string}) {
    this.activeLessonTopic.set(data.topic);
    this.activeLessonDomain.set(data.domain);
    this.currentView.set('lesson');
  }
  
  openBlender() {
      this.currentView.set('blender');
  }

  exitLesson() {
    this.currentView.set('dashboard');
    this.activeLessonTopic.set('');
    this.activeLessonDomain.set('');
  }
}