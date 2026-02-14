import { Component, signal, inject, output, computed, ChangeDetectionStrategy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { GeminiService } from '../services/gemini.service';

@Component({
  selector: 'app-curriculum-blender',
  standalone: true,
  imports: [CommonModule, FormsModule],
  template: `
    <div class="h-full flex flex-col space-y-6">
      <!-- Input Section -->
      <div [class]="'p-6 rounded-2xl transition-all duration-300 ' + (darkMode() ? 'glass-dark text-white' : 'glass text-gray-800')">
        <h2 class="text-2xl font-bold mb-4 flex items-center gap-2">
          <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="text-flash-accent"><circle cx="12" cy="12" r="10"/><path d="m4.93 4.93 4.24 4.24"/><path d="m14.83 14.83 4.24 4.24"/><path d="m14.83 9.17 4.24-4.24"/><path d="m14.83 9.17-3.53-3.53"/><path d="m4.93 19.07 4.24-4.24"/></svg>
          Curriculum Blender
        </h2>
        
        <div class="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
          <div class="flex flex-col">
            <label class="text-sm font-medium mb-1 opacity-80">Topic</label>
            <input 
              type="text" 
              [(ngModel)]="topic" 
              placeholder="e.g. Photosynthesis, WW2, Algebra"
              class="w-full px-4 py-2 rounded-lg bg-white/10 border border-white/20 focus:outline-none focus:ring-2 focus:ring-flash-accent placeholder-gray-400 backdrop-blur-sm transition-all"
            />
          </div>
          <div class="flex flex-col">
            <label class="text-sm font-medium mb-1 opacity-80">Local Curriculum</label>
            <input 
              type="text" 
              [(ngModel)]="localRegion" 
              placeholder="e.g. California State, CBSE India"
              class="w-full px-4 py-2 rounded-lg bg-white/10 border border-white/20 focus:outline-none focus:ring-2 focus:ring-flash-accent placeholder-gray-400 backdrop-blur-sm transition-all"
            />
          </div>
          <div class="flex flex-col">
            <label class="text-sm font-medium mb-1 opacity-80">Intl. Standard</label>
            <input 
              type="text" 
              [(ngModel)]="intlStandard" 
              placeholder="e.g. IB, Cambridge IGCSE"
              class="w-full px-4 py-2 rounded-lg bg-white/10 border border-white/20 focus:outline-none focus:ring-2 focus:ring-flash-accent placeholder-gray-400 backdrop-blur-sm transition-all"
            />
          </div>
        </div>

        <div class="flex justify-end">
          <button 
            (click)="generateBlend()" 
            [disabled]="isLoading() || !topic"
            class="px-6 py-2 rounded-full font-semibold bg-flash-accent text-gray-900 hover:bg-yellow-300 disabled:opacity-50 disabled:cursor-not-allowed shadow-lg hover:shadow-xl transition-all transform hover:-translate-y-0.5 active:translate-y-0 flex items-center gap-2"
          >
            @if (isLoading()) {
              <svg class="animate-spin h-5 w-5 text-gray-900" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                <circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"></circle>
                <path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
              </svg>
              Blending...
            } @else {
              <span>Blend & Learn</span>
              <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="m21 21-6-6m6 6v-4.8m0 4.8h-4.8"/></svg>
            }
          </button>
        </div>
      </div>

      <!-- Results Section -->
      @if (result()) {
        <div class="grid grid-cols-1 md:grid-cols-2 gap-6 animate-fade-in-up">
          
          <!-- Perspectives Comparison -->
          <div [class]="'col-span-1 md:col-span-2 p-6 rounded-2xl ' + (darkMode() ? 'glass-dark' : 'glass')">
            <div class="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 mb-4">
                <h3 class="text-xl font-bold flex items-center gap-2 text-flash-primary">
                  <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M22 21v-2a4 4 0 0 0-3-3.87"/><path d="M16 3.13a4 4 0 0 1 0 7.75"/></svg>
                  Comparative Analysis
                </h3>
                
                <button 
                  (click)="launchLesson()"
                  class="px-6 py-2 bg-flash-primary text-white rounded-full font-bold shadow-lg hover:bg-blue-600 transition-colors flex items-center gap-2 text-sm"
                >
                    <span>Start Interactive Lesson</span>
                    <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><polygon points="5 3 19 12 5 21 5 3"/></svg>
                </button>
            </div>
            
            <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div class="p-4 rounded-xl bg-white/5 border border-white/10">
                <div class="uppercase text-xs font-bold tracking-wider opacity-60 mb-2">Local Context</div>
                <div class="font-semibold text-lg mb-1">{{ result().localPerspective.focus }}</div>
                <p class="opacity-80 text-sm leading-relaxed">{{ result().localPerspective.methodology }}</p>
              </div>
              <div class="p-4 rounded-xl bg-white/5 border border-white/10">
                <div class="uppercase text-xs font-bold tracking-wider opacity-60 mb-2">Global Standard</div>
                <div class="font-semibold text-lg mb-1">{{ result().internationalPerspective.focus }}</div>
                <p class="opacity-80 text-sm leading-relaxed">{{ result().internationalPerspective.methodology }}</p>
              </div>
            </div>
          </div>

          <!-- Blended Summary -->
          <div [class]="'p-6 rounded-2xl ' + (darkMode() ? 'glass-dark' : 'glass')">
             <h3 class="text-xl font-bold mb-4 flex items-center gap-2 text-green-400">
              <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M12 2v8"/><path d="m4.93 10.93 1.41 1.41"/><path d="M2 18h2"/><path d="M20 18h2"/><path d="m19.07 10.93-1.41 1.41"/><path d="M22 22H2"/><path d="m8 22 4-10 4 10"/></svg>
              The Learnix Blend
            </h3>
            <p class="leading-relaxed opacity-90 mb-4">{{ result().blendedSummary }}</p>
            <div class="space-y-2">
              @for (takeaway of result().keyTakeaways; track takeaway) {
                <div class="flex items-start gap-2 text-sm">
                  <span class="mt-1 block w-2 h-2 rounded-full bg-flash-accent"></span>
                  <span class="opacity-80">{{ takeaway }}</span>
                </div>
              }
            </div>
          </div>

          <!-- Quick Quiz -->
          <div [class]="'p-6 rounded-2xl ' + (darkMode() ? 'glass-dark' : 'glass')">
            <h3 class="text-xl font-bold mb-4 flex items-center gap-2 text-pink-400">
              <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="m9 11-6 6v3h9l3-3"/><path d="m22 12-4.6 4.6a2 2 0 0 1-2.8 0l-5.2-5.2a2 2 0 0 1 0-2.8L14 4"/></svg>
              Knowledge Check
            </h3>
            @if (currentQuestionIndex() < result().quiz.length) {
              <div class="flex flex-col h-full justify-between">
                <div>
                  <div class="flex justify-between items-center mb-2">
                    <span class="text-xs font-bold bg-white/10 px-2 py-1 rounded">Q{{ currentQuestionIndex() + 1 }}/{{ result().quiz.length }}</span>
                  </div>
                  <p class="font-medium mb-4">{{ result().quiz[currentQuestionIndex()].question }}</p>
                  <div class="space-y-2">
                    @for (option of result().quiz[currentQuestionIndex()].options; track $index) {
                      <button 
                        (click)="checkAnswer($index)"
                        [class]="getOptionClass($index)"
                        class="w-full text-left px-4 py-2 rounded-lg border transition-all text-sm"
                      >
                        {{ option }}
                      </button>
                    }
                  </div>
                </div>
                
                @if (selectedAnswer() !== null) {
                  <div class="mt-4 pt-4 border-t border-white/10 flex justify-between items-center">
                    <span [class]="isCorrect() ? 'text-green-400 font-bold' : 'text-red-400 font-bold'">
                      {{ isCorrect() ? 'Correct!' : 'Incorrect.' }}
                    </span>
                    <button (click)="nextQuestion()" class="px-4 py-1 bg-white/20 hover:bg-white/30 rounded text-sm transition-colors">
                      {{ currentQuestionIndex() === result().quiz.length - 1 ? 'Finish' : 'Next' }}
                    </button>
                  </div>
                }
              </div>
            } @else {
              <div class="flex flex-col items-center justify-center h-full text-center bg-gradient-to-br from-green-500/10 to-transparent p-6 rounded-xl">
                <div class="w-16 h-16 bg-green-500/20 text-green-300 rounded-full flex items-center justify-center text-3xl mb-4">
                    <span>🏆</span>
                </div>
                <h4 class="text-xl font-bold">{{ completionMessage().title }}</h4>
                <p class="opacity-80 mb-2">{{ completionMessage().message }}</p>
                <p class="font-black text-4xl my-3">{{ score() }}<span class="text-lg opacity-50">/{{ result().quiz.length }}</span></p>
                <button (click)="resetQuiz()" class="mt-4 px-6 py-2 bg-white/20 hover:bg-white/30 rounded-full text-sm font-bold transition-all flex items-center gap-2">
                    <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M1 4v6h6"/><path d="M3.51 15a9 9 0 1 0 2.13-9.36L1 10"/></svg>
                    Retry Quiz
                </button>
              </div>
            }
          </div>

        </div>
      }
    </div>
  `,
  changeDetection: ChangeDetectionStrategy.OnPush,
  styles: [`
    .animate-fade-in-up {
      animation: fadeInUp 0.5s ease-out forwards;
    }
    @keyframes fadeInUp {
      from { opacity: 0; transform: translateY(20px); }
      to { opacity: 1; transform: translateY(0); }
    }
  `]
})
export class CurriculumBlenderComponent {
  geminiService = inject(GeminiService);
  onStartBlendedLesson = output<{topic: string, domain: string}>();
  
  // Inputs
  topic = '';
  localRegion = '';
  intlStandard = '';
  
  // State
  isLoading = signal(false);
  result = signal<any>(null);
  
  darkMode = signal(true); 

  // Quiz State
  currentQuestionIndex = signal(0);
  selectedAnswer = signal<number | null>(null);
  isCorrect = signal(false);
  score = signal(0);

  completionMessage = computed(() => {
    if (!this.result()) return { title: '', message: '' };
    const quizLength = this.result().quiz.length;
    const userScore = this.score();
    const percentage = quizLength > 0 ? (userScore / quizLength) * 100 : 0;

    if (percentage === 100) {
        return { title: 'Perfect Score!', message: 'You aced it!' };
    } else if (percentage >= 75) {
        return { title: 'Excellent Work!', message: 'You have a great grasp of the material.' };
    } else if (percentage >= 50) {
        return { title: 'Good Job!', message: 'You\'re on the right track.' };
    } else {
        return { title: 'Nice Try!', message: 'Review the concepts and try again.' };
    }
  });

  constructor() {
    // Check initial theme
    this.updateThemeCheck();
    // Watch for class changes on html element
    const observer = new MutationObserver(() => this.updateThemeCheck());
    observer.observe(document.documentElement, { attributes: true, attributeFilter: ['class'] });
  }

  updateThemeCheck() {
    this.darkMode.set(document.documentElement.classList.contains('dark'));
  }

  async generateBlend() {
    if (!this.topic) return;
    
    this.isLoading.set(true);
    this.result.set(null); // clear previous
    this.resetQuiz();

    try {
      const data = await this.geminiService.blendCurriculum(
        this.topic, 
        this.localRegion || 'General Local Curriculum', 
        this.intlStandard || 'International Standard'
      );
      this.result.set(data);
    } catch (e) {
      alert('Failed to generate blend. Please check your API key or try again.');
    } finally {
      this.isLoading.set(false);
    }
  }

  launchLesson() {
      if(!this.result()) return;
      // Pass a specific blended string to the lesson generator
      const blendedTopic = `${this.topic} (Blending ${this.result().localPerspective.focus} with ${this.result().internationalPerspective.focus})`;
      const domain = `Integrated Curriculum: ${this.localRegion} & ${this.intlStandard}`;
      this.onStartBlendedLesson.emit({ topic: blendedTopic, domain });
  }

  checkAnswer(index: number) {
    if (this.selectedAnswer() !== null) return; // already answered
    
    this.selectedAnswer.set(index);
    const correctIdx = this.result().quiz[this.currentQuestionIndex()].correctIndex;
    const correct = index === correctIdx;
    this.isCorrect.set(correct);
    
    if (correct) {
      this.score.update(s => s + 1);
    }
  }

  nextQuestion() {
    this.currentQuestionIndex.update(i => i + 1);
    this.selectedAnswer.set(null);
    this.isCorrect.set(false);
  }

  resetQuiz() {
    this.currentQuestionIndex.set(0);
    this.selectedAnswer.set(null);
    this.score.set(0);
    this.isCorrect.set(false);
  }

  getOptionClass(index: number): string {
    const selected = this.selectedAnswer();
    const correctIdx = this.result().quiz[this.currentQuestionIndex()].correctIndex;
    
    if (selected === null) {
      return 'bg-white/5 border-white/10 hover:bg-white/10';
    }
    
    if (index === correctIdx) {
      return 'bg-green-500/20 border-green-500 text-green-200';
    }
    
    if (selected === index && index !== correctIdx) {
      return 'bg-red-500/20 border-red-500 text-red-200';
    }
    
    return 'opacity-50 border-transparent';
  }
}