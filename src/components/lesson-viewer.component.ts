import { Component, input, output, signal, inject, effect, computed, ViewChild, ElementRef, OnDestroy, ChangeDetectionStrategy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { GeminiService } from '../services/gemini.service';
import { UserService } from '../services/user.service';
import { Chat } from '@google/genai';

declare var hljs: any;

@Component({
  selector: 'app-lesson-viewer',
  standalone: true,
  imports: [CommonModule, FormsModule],
  template: `
    <div class="h-full flex flex-col relative overflow-hidden">
      
      <!-- Confetti Canvas -->
      <canvas #confettiCanvas class="absolute inset-0 pointer-events-none z-50"></canvas>

      <!-- Top Bar: Progress & Lives -->
      @if (!error()) {
        <div class="flex items-center justify-between p-4 pb-0 z-10 relative">
          <button (click)="exitAndClearProgress()" class="p-2 rounded-full hover:bg-white/10 transition-colors" aria-label="Exit lesson">
            <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M18 6 6 18"/><path d="m6 6 12 12"/></svg>
          </button>
          
          <!-- Progress Bar -->
          <div class="flex-1 mx-6 h-2 bg-gray-200/20 rounded-full overflow-hidden">
            <div 
              class="h-full bg-flash-accent transition-all duration-500 ease-out"
              [style.width]="progressPercentage() + '%'"
            ></div>
          </div>

          <!-- Stats -->
          <div class="flex items-center gap-4">
               <!-- Combo Counter -->
               @if (combo() > 1) {
                  <div class="flex items-center gap-1 font-black text-orange-400 animate-bounce">
                      <span class="text-lg">x{{ combo() }}</span>
                      <span class="text-xs uppercase">Combo</span>
                  </div>
               }

              <!-- Hints Counter -->
               <div class="flex items-center gap-1 text-yellow-400 font-bold" title="Hints Remaining">
                  <span>{{ hintsAvailable() }}</span>
                  <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="currentColor" stroke="none"><path d="M9 21c0 .55.45 1 1 1h4c.55 0 1-.45 1-1v-1H9v1zm3-19C8.14 2 5 5.14 5 9c0 2.38 1.19 4.47 3 5.74V17c0 .55.45 1 1 1h6c.55 0 1-.45 1-1v-2.26c1.81-1.27 3-3.36 3-5.74 0-3.86-3.14-7-7-7zm2.85 11.1l-.85.6V16h-4v-2.3l-.85-.6A4.997 4.997 0 0 1 7 9c0-2.76 2.24-5 5-5s5 2.24 5 5c0 1.63-.8 3.16-2.15 4.1z"/></svg>
               </div>

              <!-- Hearts / Lives -->
              <div class="flex items-center gap-1 text-red-500 font-bold transition-transform" [class.scale-125]="livesChanged()">
                <span>{{ lives() }}</span>
                <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="currentColor" stroke="none"><path d="M19 14c1.49-1.28 3.6-2.34 4.58-3.72a6.93 6.93 0 0 0-1.6-8.86 6.93 6.93 0 0 0-8.98.7L12 3.16l-1-1.04A6.93 6.93 0 0 0 2.02 2.12a6.93 6.93 0 0 0-1.6 8.86c.98 1.38 3.1 2.44 4.58 3.72L12 22l7-8z"/></svg>
              </div>
          </div>
        </div>
      }

      <!-- Loading State -->
      @if (isLoading()) {
        <div class="flex-1 flex flex-col items-center justify-center animate-pulse space-y-4">
          <div class="w-16 h-16 border-4 border-flash-accent border-t-transparent rounded-full animate-spin"></div>
          <p class="text-lg font-medium opacity-80">Generating Interactive Lesson...</p>
          <p class="text-sm opacity-50">Crafting challenges for {{ topic() }}</p>
        </div>
      } @else if (error()) {
        <div class="flex-1 flex flex-col items-center justify-center text-center p-8 animate-fade-in">
            <div class="w-16 h-16 bg-red-500/10 text-red-400 rounded-full flex items-center justify-center mb-4">
                <svg xmlns="http://www.w3.org/2000/svg" width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="12"/><line x1="12" y1="16" x2="12.01" y2="16"/></svg>
            </div>
            <h2 class="text-xl font-bold text-red-400">Lesson Generation Failed</h2>
            <p class="opacity-70 mt-2 mb-6 max-w-md">{{ error() }}</p>
            <div class="flex gap-4">
                <button (click)="exitAndClearProgress()" class="px-6 py-2 bg-white/5 hover:bg-white/10 rounded-full font-bold">Back to Dashboard</button>
                <button (click)="loadLesson()" class="px-6 py-2 bg-flash-primary text-white hover:bg-blue-600 rounded-full font-bold">Try Again</button>
            </div>
        </div>
      } @else if (lessonData()) {
        <div class="flex-1 overflow-y-auto p-4 md:p-6 custom-scrollbar">
            <div class="max-w-3xl mx-auto w-full animate-fade-in space-y-8">
                <!-- Lesson Intro -->
                <div class="text-center">
                    <h1 class="text-4xl font-black mb-2 leading-tight">{{ lessonData()?.title }}</h1>
                    <p class="text-lg leading-relaxed opacity-80 max-w-2xl mx-auto">{{ lessonData()?.introduction }}</p>
                </div>

                <!-- Core Concepts Section -->
                <div>
                    <h2 class="text-2xl font-bold mb-6 text-center">Let's Break It Down</h2>
                    <div class="space-y-12">
                        @for(concept of lessonData()?.coreConcepts; track concept.title; let cIdx = $index) {
                            @if (cIdx === 0 || areMiniQuizzesCompleteForConcept()[cIdx - 1]) {
                                <div class="animate-fade-in">
                                    <!-- Concept Details Card -->
                                    <div [class]="'p-6 rounded-3xl flex flex-col md:flex-row gap-6 items-center ' + (darkMode() ? 'glass-dark' : 'glass')">
                                        <div class="md:w-1/3 w-full shrink-0">
                                            <div class="w-full aspect-square md:aspect-auto md:h-full rounded-2xl overflow-hidden shadow-2xl border border-white/10 relative group">
                                                 <img 
                                                    [src]="concept.imageUrl" 
                                                    class="w-full h-full object-cover transition-transform duration-700 group-hover:scale-110"
                                                    [alt]="concept.title"
                                                    loading="lazy"
                                                >
                                            </div>
                                        </div>
                                        <div class="flex-1">
                                            <h3 class="font-bold text-xl mb-2 text-flash-accent">{{ concept.title }}</h3>
                                            <p class="text-base leading-relaxed mb-4 opacity-90">{{ concept.explanation }}</p>
                                            <div class="bg-blue-500/10 border-l-4 border-blue-500 p-3 rounded-r-lg text-sm">
                                                <p class="italic opacity-90">{{ concept.analogy }}</p>
                                            </div>
                                        </div>
                                    </div>
                                    
                                    <!-- Mini Quiz for the Concept -->
                                    @if (concept.miniQuiz && concept.miniQuiz.length > 0) {
                                        <div class="mt-8 pt-6 border-t border-white/10">
                                            <h4 class="text-base font-bold text-center mb-4">Quick Knowledge Check</h4>
                                            @for(quiz of concept.miniQuiz; track $index; let qIdx = $index) {
                                                <div [class]="'p-4 rounded-2xl mb-4 ' + (darkMode() ? 'bg-black/20' : 'bg-white/20')">
                                                    <p class="font-medium text-base mb-4 leading-tight">{{ qIdx + 1 }}. {{ quiz.question }}</p>
                                                    <div class="grid grid-cols-1 sm:grid-cols-2 gap-3">
                                                        @for(option of quiz.options; track $index; let oIdx = $index) {
                                                            <button 
                                                                (click)="selectMiniQuizOption(cIdx, qIdx, oIdx)"
                                                                [disabled]="miniQuizState()[cIdx][qIdx].selected !== null"
                                                                [class]="getMiniQuizOptionClass(cIdx, qIdx, oIdx)"
                                                            >
                                                                <span class="flex-1 pr-2">{{ option }}</span>
                                                                @if (miniQuizState()[cIdx][qIdx].selected !== null) {
                                                                    @if (oIdx === quiz.correctIndex) {
                                                                        <!-- Correct answer icon -->
                                                                        <div class="w-5 h-5 flex items-center justify-center rounded-full bg-green-500 text-white shrink-0">
                                                                            <svg xmlns="http://www.w3.org/2000/svg" width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="4" stroke-linecap="round" stroke-linejoin="round"><polyline points="20 6 9 17 4 12"/></svg>
                                                                        </div>
                                                                    } @else if (oIdx === miniQuizState()[cIdx][qIdx].selected) {
                                                                        <!-- Incorrect selected answer icon -->
                                                                        <div class="w-5 h-5 flex items-center justify-center rounded-full bg-red-500 text-white shrink-0">
                                                                            <svg xmlns="http://www.w3.org/2000/svg" width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="4" stroke-linecap="round" stroke-linejoin="round"><line x1="18" y1="6" x2="6" y2="18"></line><line x1="6" y1="6" x2="18" y2="18"></line></svg>
                                                                        </div>
                                                                    }
                                                                }
                                                            </button>
                                                        }
                                                    </div>

                                                    <!-- Feedback text -->
                                                    @if (miniQuizState()[cIdx][qIdx].selected !== null) {
                                                        @let quizState = miniQuizState()[cIdx][qIdx];
                                                        <div class="mt-3 text-sm p-3 rounded-lg animate-fade-in flex items-start gap-2"
                                                            [class]="quizState.correct ? 'bg-green-500/10 text-green-300 border border-green-500/20' : 'bg-red-500/10 text-red-300 border border-red-500/20'">
                                                            @if(quizState.correct) {
                                                                <svg class="w-4 h-4 mt-0.5 shrink-0" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor"><path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm-2 15l-5-5 1.41-1.41L10 14.17l7.59-7.59L19 8l-9 9z"/></svg>
                                                                <div>
                                                                   <span class="font-bold">Correct!</span> 
                                                                   <span class="opacity-80"> Great job. (+5 XP)</span>
                                                                </div>
                                                            } @else {
                                                                <svg class="w-4 h-4 mt-0.5 shrink-0" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor"><path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm1 15h-2v-2h2v2zm0-4h-2V7h2v6z"/></svg>
                                                                 <div>
                                                                    <span class="font-bold">Not quite.</span> 
                                                                    <span class="opacity-80">The correct answer was "{{ quiz.options[quiz.correctIndex] }}".</span>
                                                                 </div>
                                                            }
                                                        </div>
                                                    }
                                                </div>
                                            }
                                        </div>
                                    }
                                </div>
                            } @else {
                                <div class="p-6 rounded-3xl flex items-center justify-center gap-4 text-white/50 border-2 border-dashed border-white/20">
                                    <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect x="3" y="11" width="18" height="11" rx="2" ry="2"/><path d="M7 11V7a5 5 0 0 1 10 0v4"/></svg>
                                    <span class="font-bold">Complete the previous knowledge check to unlock.</span>
                                </div>
                            }
                        }
                    </div>
                </div>

                <!-- Challenges Section -->
                @if (allMiniQuizzesCompleted()) {
                    <div class="pt-8 text-center animate-fade-in">
                        <h2 class="text-3xl font-bold mb-2">Ready for the Main Event?</h2>
                        <p class="opacity-70">Apply what you've learned in these final challenges.</p>
                    </div>
                    
                    <div class="w-full max-w-xl mx-auto animate-fade-in">
                        @if (!isLessonComplete() && currentChallenge()) {
                            <div [class]="'p-6 rounded-3xl transition-all duration-300 backdrop-blur-2xl shadow-2xl relative flex flex-col ' + (shake() ? 'animate-shake ' : '') + (darkMode() ? 'bg-gradient-to-br from-gray-900/95 via-black/90 to-gray-900/95 border border-white/25 ring-1 ring-white/5 shadow-black/50' : 'bg-gradient-to-br from-white/95 via-white/80 to-white/95 border border-white/60 shadow-xl ring-1 ring-white/40')">
                              
                              <!-- Gamified Header -->
                              <div class="flex items-center justify-between mb-4">
                                <div class="flex items-center gap-2 opacity-60 text-sm font-bold tracking-widest uppercase">
                                    <span>Challenge {{ currentChallengeIndex() + 1 }} of {{ lessonData()?.challenges?.length || 0 }}</span>
                                </div>
                                
                                @if (currentChallenge()?.role) {
                                    <div class="px-3 py-1 bg-purple-500/20 text-purple-300 rounded-lg text-xs font-bold border border-purple-500/30">
                                        Role: {{ currentChallenge()?.role }}
                                    </div>
                                }
                              </div>
    
                              <h3 class="text-xl font-bold mb-4 leading-relaxed">{{ currentChallenge()?.question }}</h3>
    
                              <!-- Hint Section -->
                              <div class="mb-4">
                                 @if (!hintRevealed()) {
                                    <button 
                                        (click)="useHint()" 
                                        [disabled]="hintsAvailable() <= 0"
                                        [class]="'text-xs font-bold flex items-center gap-2 px-3 py-1.5 rounded-full transition-all border ' + (hintsAvailable() > 0 ? 'bg-yellow-500/10 text-yellow-500 border-yellow-500/30 hover:bg-yellow-500/20' : 'bg-gray-500/10 text-gray-500 border-gray-500/20 cursor-not-allowed')"
                                        aria-label="Use hint"
                                    >
                                        <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M9 21c0 .55.45 1 1 1h4c.55 0 1-.45 1-1v-1H9v1zm3-19C8.14 2 5 5.14 5 9c0 2.38 1.19 4.47 3 5.74V17c0 .55.45 1 1 1h6c.55 0 1-.45 1-1v-2.26c1.81-1.27 3-3.36 3-5.74 0-3.86-3.14-7-7-7z"/></svg>
                                        {{ hintsAvailable() > 0 ? 'Use Hint (-1)' : 'No Hints Left' }}
                                    </button>
                                 } @else {
                                    <div class="animate-fade-in p-3 rounded-lg bg-yellow-500/10 border border-yellow-500/30 text-yellow-200 text-sm flex gap-3 items-start">
                                         <svg class="shrink-0 mt-0.5" xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="currentColor" stroke="none"><path d="M9 21c0 .55.45 1 1 1h4c.55 0 1-.45 1-1v-1H9v1zm3-19C8.14 2 5 5.14 5 9c0 2.38 1.19 4.47 3 5.74V17c0 .55.45 1 1 1h6c.55 0 1-.45 1-1v-2.26c1.81-1.27 3-3.36 3-5.74 0-3.86-3.14-7-7-7z"/></svg>
                                         <div>
                                            <span class="font-bold uppercase text-xs tracking-wider opacity-70 block mb-1">Hint Revealed</span>
                                            <span class="opacity-90 italic">{{ currentChallenge()?.hint || 'Think about the core concept!' }}</span>
                                         </div>
                                    </div>
                                 }
                              </div>
    
                              <!-- INTERACTION AREA: SWITCH BASED ON TYPE -->
                              @if (currentChallenge()?.challengeType === 'code') {
                                  <!-- CODE EDITOR UI -->
                                    <div class="flex flex-col gap-3">
                                        <div class="relative group bg-gray-900 rounded-xl border border-white/20">
                                            <div class="absolute top-0 right-0 p-2 opacity-50 text-[10px] font-mono tracking-widest pointer-events-none z-10">PYTHON</div>
                                            
                                            <!-- Highlighted code block (behind textarea) -->
                                            <pre #codeHighlightPre class="w-full h-40 font-mono text-sm p-4 rounded-xl leading-relaxed overflow-auto custom-scrollbar m-0"><code #codeHighlightBlock class="language-python bg-transparent"></code></pre>
                                            
                                            <!-- Actual textarea (on top) -->
                                            <textarea 
                                                [(ngModel)]="userCode"
                                                (scroll)="syncScroll($event)"
                                                spellcheck="false"
                                                class="editor-textarea absolute inset-0 w-full h-40 bg-transparent text-transparent caret-white font-mono text-sm p-4 rounded-xl border-transparent focus:outline-none focus:border-flash-accent focus:ring-1 focus:ring-flash-accent resize-none leading-relaxed overflow-auto custom-scrollbar"
                                            ></textarea>
                                        </div>
                                        
                                        <div class="flex gap-2">
                                            <button 
                                                (click)="showExample()"
                                                [disabled]="exampleSolutionCooldown() > 0 || hasAnswered()"
                                                class="flex-1 py-2 text-sm rounded-lg font-bold bg-yellow-600/50 text-yellow-300 hover:bg-yellow-600/70 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2 transition-all shadow-lg active:scale-95"
                                                aria-label="Show example solution"
                                              >
                                                @if (exampleSolutionCooldown() > 0) {
                                                  <span>Show Example ({{ exampleSolutionCooldown() }}s)</span>
                                                } @else {
                                                  <span>Show Example</span>
                                                }
                                              </button>
                                            <button 
                                                (click)="runCode()" 
                                                [disabled]="isEvaluating() || hasAnswered()"
                                                class="flex-1 py-2 rounded-lg font-bold bg-green-600 text-white hover:bg-green-500 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2 transition-all shadow-lg active:scale-95"
                                                aria-label="Run code"
                                            >
                                                @if(isEvaluating()) {
                                                    <svg class="animate-spin h-4 w-4" viewBox="0 0 24 24"><circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"></circle><path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path></svg>
                                                    Running...
                                                } @else {
                                                    <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="currentColor"><path d="M5 3l14 9-14 9V3z"/></svg>
                                                    Run Code
                                                }
                                            </button>
                                        </div>
        
                                        <!-- CONSOLE OUTPUT -->
                                        <div class="bg-gray-900 rounded-lg font-mono text-xs h-24 overflow-y-auto border border-white/10 shadow-inner">
                                            <div class="text-gray-500 p-3 mb-1 border-b border-white/10 pb-1 sticky top-0 bg-gray-900">CONSOLE >_</div>
                                            @if (codeOutput()) {
                                                <pre class="p-3 pt-0 m-0"><code #consoleHighlightBlock class="language-shell text-white/90 whitespace-pre-wrap"></code></pre>
                                            } @else {
                                                <span class="text-gray-700 italic p-3">Ready for execution...</span>
                                            }
                                        </div>
                                    </div>
    
                              } @else {
                                <!-- REGULAR QUIZ UI -->
                                <div class="space-y-3">
                                    @for (option of currentChallenge()?.options; track $index) {
                                    <button 
                                        (click)="selectOption($index)"
                                        [class]="getOptionClass($index)"
                                        [disabled]="hasAnswered()"
                                        class="w-full p-4 rounded-xl text-left border-2 transition-all duration-200 relative overflow-hidden group transform hover:scale-[1.01] active:scale-[0.99]"
                                    >
                                        <div class="relative z-10 flex items-center justify-between">
                                        <span class="font-medium">{{ option }}</span>
                                        @if (hasAnswered() && $index === selectedOption()) {
                                            @if (isCorrect()) {
                                            <div class="bg-green-500 text-white rounded-full p-1 animate-bounce-small">
                                                <svg class="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="3" d="M5 13l4 4L19 7"/></svg>
                                            </div>
                                            } @else {
                                            <div class="bg-red-500 text-white rounded-full p-1">
                                                <svg class="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="3" d="M6 18L18 6M6 6l12 12"/></svg>
                                            </div>
                                            }
                                        }
                                        </div>
                                    </button>
                                    }
                                </div>
                              }
    
                              <!-- Feedback Area -->
                              @if (hasAnswered()) {
                                @if (showExampleSolution()) {
                                    <div class="mt-4 p-4 rounded-xl bg-yellow-500/10 border border-yellow-500/30 animate-fade-in">
                                        <h4 class="font-bold text-yellow-300 mb-2 flex items-center gap-2">
                                        <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="currentColor"><path d="M9 21c0 .55.45 1 1 1h4c.55 0 1-.45 1-1v-1H9v1zm3-19C8.14 2 5 5.14 5 9c0 2.38 1.19 4.47 3 5.74V17c0 .55.45 1 1 1h6c.55 0 1-.45 1-1v-2.26c1.81-1.27 3-3.36 3-5.74 0-3.86-3.14-7-7-7z"/></svg>
                                        Example Solution
                                        </h4>
                                        <div class="bg-gray-900 rounded-lg">
                                            <pre class="m-0"><code #exampleSolutionBlock class="language-python"></code></pre>
                                        </div>
                                    </div>
                                }
                                <div [class]="'mt-6 p-4 rounded-xl animate-fade-in ' + (isCorrect() ? 'bg-green-500/10 border border-green-500/30' : 'bg-red-500/10 border border-red-500/30')">
                                  <div class="flex justify-between items-start mb-2">
                                    <p class="font-bold text-lg {{ isCorrect() ? 'text-green-400' : 'text-red-400' }}">
                                        {{ isCorrect() ? 'Excellent!' : 'Needs work.' }}
                                    </p>
                                    @if (isCorrect()) {
                                         <span class="text-xs font-bold px-2 py-1 bg-green-500/20 rounded text-green-300">
                                            +{{ xpGained() }} XP
                                         </span>
                                    }
                                  </div>
                                  <p class="text-sm opacity-90 leading-relaxed">
                                    {{ currentChallenge()?.explanation }}
                                    @if(currentChallenge()?.challengeType === 'code' && codeFeedback()) {
                                         <br><br><strong>Interpreter:</strong> {{ codeFeedback() }}
                                    }
                                  </p>
                                </div>
    
                                <button 
                                  (click)="nextChallenge()"
                                  class="w-full mt-6 py-3 rounded-xl font-bold bg-white text-black hover:bg-gray-100 transition-transform active:scale-95 shadow-lg"
                                  [attr.aria-label]="currentChallengeIndex() === (lessonData()?.challenges?.length || 0) - 1 ? 'Finish Lesson' : 'Continue to next challenge'"
                                >
                                  {{ currentChallengeIndex() === (lessonData()?.challenges?.length || 0) - 1 ? 'Finish Lesson' : 'Continue' }}
                                </button>
                              }
                            </div>
                         } @else if (!currentChallenge() && !isLessonComplete()) {
                            <div class="p-8 text-center opacity-70">
                                <p>Failed to load challenge data. Please try again.</p>
                            </div>
                         } @else {
                           <!-- Completion State -->
                           <div class="text-center p-8 animate-scale-up">
                             <div class="w-32 h-32 bg-gradient-to-tr from-yellow-400 to-orange-500 rounded-full flex items-center justify-center mx-auto mb-6 shadow-2xl shadow-orange-500/40 relative">
                                <div class="absolute inset-0 rounded-full bg-white/20 animate-ping opacity-20"></div>
                                <svg xmlns="http://www.w3.org/2000/svg" width="64" height="64" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="3" stroke-linecap="round" stroke-linejoin="round" class="text-white"><polyline points="20 6 9 17 4 12"/></svg>
                             </div>
                             <h2 class="text-4xl font-black mb-2">Lesson Mastered!</h2>
                             <p class="opacity-70 mb-8 text-lg">You've gained <span class="text-flash-accent font-bold text-xl">+{{ totalXpGained() }} XP</span> today!</p>
                             
                             <div class="grid grid-cols-2 gap-4 max-w-sm mx-auto mb-8">
                                <div class="p-4 rounded-2xl bg-white/5 border border-white/10">
                                    <div class="text-2xl font-bold text-green-400">{{ correctAnswers() }}/{{ lessonData()?.challenges?.length || 0 }}</div>
                                    <div class="text-xs uppercase tracking-wider opacity-60">Accuracy</div>
                                </div>
                                <div class="p-4 rounded-2xl bg-white/5 border border-white/10">
                                    <div class="text-2xl font-bold text-orange-400">x{{ maxCombo() }}</div>
                                    <div class="text-xs uppercase tracking-wider opacity-60">Best Combo</div>
                                </div>
                             </div>
    
                             <button (click)="exitAndClearProgress()" class="px-10 py-4 bg-white text-black hover:bg-gray-200 rounded-full font-bold text-lg transition-all shadow-xl hover:shadow-2xl transform hover:-translate-y-1">
                               Back to Dashboard
                             </button>
                           </div>
                         }
                    </div>
                }
            </div>
        </div>
      }

      <!-- AI Tutor FAB -->
      @if (lessonData() && !isLessonComplete()) {
          <button 
            (click)="toggleChat()"
            class="absolute bottom-6 right-6 w-14 h-14 rounded-full bg-flash-primary text-white shadow-2xl flex items-center justify-center hover:scale-110 transition-transform z-30"
          >
            <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"/></svg>
          </button>
      }

      <!-- Chat Drawer -->
      @if (showChat()) {
        <div class="absolute bottom-24 right-6 w-80 md:w-96 rounded-2xl overflow-hidden flex flex-col shadow-2xl z-40 animate-slide-up h-[500px] border border-white/10 backdrop-blur-3xl bg-black/60 text-white">
            <div class="p-4 bg-white/5 border-b border-white/10 flex justify-between items-center">
                <div class="flex items-center gap-2">
                    <div class="w-2 h-2 rounded-full bg-green-400 animate-pulse"></div>
                    <span class="font-bold text-sm">AI Tutor</span>
                </div>
                <button (click)="toggleChat()" class="opacity-60 hover:opacity-100">
                    <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><line x1="18" y1="6" x2="6" y2="18"></line><line x1="6" y1="6" x2="18" y2="18"></line></svg>
                </button>
            </div>
            
            <div class="flex-1 overflow-y-auto p-4 space-y-4" #chatContainer>
                @for (msg of chatMessages(); track $index) {
                    <div [class]="'flex ' + (msg.role === 'user' ? 'justify-end' : 'justify-start')">
                        <div [class]="'max-w-[85%] p-3 rounded-2xl text-sm ' + (msg.role === 'user' ? 'bg-flash-primary text-white' : 'bg-white/10 border border-white/5')">
                            {{ msg.text }}
                        </div>
                    </div>
                }
                @if (isChatLoading()) {
                    <div class="flex justify-start">
                        <div class="bg-white/10 p-3 rounded-2xl flex gap-1">
                            <span class="w-1.5 h-1.5 bg-white/50 rounded-full animate-bounce"></span>
                            <span class="w-1.5 h-1.5 bg-white/50 rounded-full animate-bounce delay-100"></span>
                            <span class="w-1.5 h-1.5 bg-white/50 rounded-full animate-bounce delay-200"></span>
                        </div>
                    </div>
                }
            </div>

            <div class="p-3 bg-white/5 border-t border-white/10">
                <div class="flex gap-2 items-center">
                    <button 
                        (click)="toggleListening()"
                        [class]="'p-2 rounded-xl transition-all ' + (isListening() ? 'bg-red-500 text-white animate-pulse' : 'bg-white/10 hover:bg-white/20 text-white/70')"
                        title="Use Microphone"
                    >
                         <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M12 2a3 3 0 0 0-3 3v7a3 3 0 0 0 6 0V5a3 3 0 0 0-3-3Z"/><path d="M19 10v2a7 7 0 0 1-14 0v-2"/><line x1="12" y1="19" x2="12" y2="22"/></svg>
                    </button>
                    
                    <input 
                        type="text" 
                        [(ngModel)]="chatInput"
                        (keyup.enter)="sendMessage()"
                        [placeholder]="isListening() ? 'Listening...' : 'Ask a question...'" 
                        class="flex-1 bg-white/5 rounded-xl px-3 py-2 text-sm focus:outline-none focus:ring-1 focus:ring-flash-primary"
                    >
                    <button (click)="sendMessage()" [disabled]="!chatInput || isChatLoading()" class="p-2 bg-flash-primary rounded-xl disabled:opacity-50">
                        <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><line x1="22" y1="2" x2="11" y2="13"></line><polygon points="22 2 15 22 11 13 2 9 22 2"></polygon></svg>
                    </button>
                </div>
            </div>
        </div>
      }

    </div>
  `,
  changeDetection: ChangeDetectionStrategy.OnPush,
  styles: [`
    .animate-scale-up { animation: scaleUp 0.5s cubic-bezier(0.175, 0.885, 0.32, 1.275) forwards; }
    @keyframes scaleUp { from { transform: scale(0.8); opacity: 0; } to { transform: scale(1); opacity: 1; } }
    .animate-fade-in { animation: fadeIn 0.3s ease-out forwards; }
    @keyframes fadeIn { from { opacity: 0; transform: translateY(5px); } to { opacity: 1; transform: translateY(0); } }
    .animate-slide-up { animation: slideUp 0.3s ease-out forwards; }
    @keyframes slideUp { from { opacity: 0; transform: translateY(20px); } to { opacity: 1; transform: translateY(0); } }
    .animate-shake { animation: shake 0.5s cubic-bezier(.36,.07,.19,.97) both; }
    @keyframes shake { 10%, 90% { transform: translate3d(-1px, 0, 0); } 20%, 80% { transform: translate3d(2px, 0, 0); } 30%, 50%, 70% { transform: translate3d(-4px, 0, 0); } 40%, 60% { transform: translate3d(4px, 0, 0); } }
    .animate-bounce-small { animation: bounceSmall 0.5s; }
    @keyframes bounceSmall { 0%, 100% { transform: translateY(0); } 50% { transform: translateY(-3px); } }

    .custom-scrollbar::-webkit-scrollbar {
        width: 6px;
    }
    .custom-scrollbar::-webkit-scrollbar-track {
        background: transparent;
    }
    .custom-scrollbar::-webkit-scrollbar-thumb {
        background: rgba(156, 163, 175, 0.3);
        border-radius: 3px;
    }
    .custom-scrollbar::-webkit-scrollbar-thumb:hover {
        background: rgba(107, 114, 128, 0.5);
    }
    
    .editor-textarea {
      -webkit-text-fill-color: transparent;
    }
    .editor-textarea::selection {
      background-color: #49483E; /* Monokai selection color */
      -webkit-text-fill-color: #F8F8F2 !important; /* Monokai text color for selection */
    }
  `]
})
export class LessonViewerComponent implements OnDestroy {
  topic = input.required<string>();
  domain = input.required<string>();
  darkMode = input.required<boolean>();
  onExit = output<void>();
  
  geminiService = inject(GeminiService);
  userService = inject(UserService);

  @ViewChild('confettiCanvas') confettiCanvas!: ElementRef<HTMLCanvasElement>;
  @ViewChild('chatContainer') chatContainer!: ElementRef;
  @ViewChild('codeHighlightPre') codeHighlightPre!: ElementRef<HTMLPreElement>;
  @ViewChild('codeHighlightBlock') codeHighlightBlock!: ElementRef<HTMLElement>;
  @ViewChild('consoleHighlightBlock') consoleHighlightBlock!: ElementRef<HTMLElement>;
  @ViewChild('exampleSolutionBlock') exampleSolutionBlock!: ElementRef<HTMLElement>;

  lessonData = signal<any>(null);
  isLoading = signal(true);
  error = signal<string | null>(null);
  
  currentChallengeIndex = signal(0);
  lives = signal(3);
  livesChanged = signal(false); // For animation
  
  // Interaction State
  selectedOption = signal<number | null>(null);
  hasAnswered = signal(false);
  isCorrect = signal(false);
  isLessonComplete = signal(false);
  shake = signal(false);

  // Coding Challenge State
  userCode = signal('');
  codeOutput = signal('');
  codeFeedback = signal('');
  isEvaluating = signal(false);
  showExampleSolution = signal(false);
  exampleSolutionCooldown = signal(0);
  private exampleCooldownInterval: any = null;

  // Hints State
  hintsAvailable = signal(3);
  hintRevealed = signal(false);

  // Mini Quiz State
  miniQuizState = signal<{[key: number]: {[key: number]: {selected: number | null, correct: boolean | null}}}>({});

  // Gamification State
  combo = signal(0);
  maxCombo = signal(0);
  xpGained = signal(0);
  totalXpGained = signal(0);
  correctAnswers = signal(0);

  // Chat State
  showChat = signal(false);
  chatInput = '';
  chatMessages = signal<{role: 'user' | 'model', text: string}[]>([{role: 'model', text: 'Hi! I\'m your AI tutor. Stuck on a concept? Ask me anything!'}]);
  isChatLoading = signal(false);
  isListening = signal(false);
  private chatSession: Chat | null = null;
  private recognition: any; // SpeechRecognition type not standard in TS yet

  private readonly PROGRESS_KEY = 'learnix-lesson-progress';

  // Computed
  currentChallenge = computed(() => { 
     const data = this.lessonData();
     if (!data || !data.challenges || !data.challenges[this.currentChallengeIndex()]) {
         return null; 
     }
     return data.challenges[this.currentChallengeIndex()]; 
  });
  
  progressPercentage = computed(() => {
    if (!this.lessonData() || !this.lessonData().challenges) return 0;
    if (this.isLessonComplete()) return 100;
    return (this.currentChallengeIndex() / this.lessonData().challenges.length) * 100;
  });

  areMiniQuizzesCompleteForConcept = computed(() => {
    const state = this.miniQuizState();
    const concepts = this.lessonData()?.coreConcepts;
    if (!concepts) return [];
    
    return concepts.map((concept: any, cIdx: number) => {
        if (!concept.miniQuiz || concept.miniQuiz.length === 0) {
            return true; // No quiz, so it's "complete"
        }
        return concept.miniQuiz.every((_: any, qIdx: number) => {
            return state[cIdx]?.[qIdx]?.selected !== null;
        });
    });
  });

  allMiniQuizzesCompleted = computed(() => {
    if (!this.lessonData()) return false;
    return this.areMiniQuizzesCompleteForConcept().every((status: boolean) => status);
  });

  constructor() {
    effect(() => {
      // Trigger load when topic changes
      if(this.topic()) {
        this.loadLesson();
      }
    });

    // Effect for saving progress
    effect(() => {
        // Run this effect only in the browser and when a lesson is active.
        if (typeof localStorage !== 'undefined' && this.lessonData() && !this.isLessonComplete() && !this.isLoading()) {
            this.saveProgress();
        }
    });

    // Effect for confetti on lesson completion
    effect(() => {
      if (this.isLessonComplete()) {
        // A small delay to allow the completion UI to render first
        setTimeout(() => this.fireConfetti(), 100);
      }
    });

    // Effect for code editor syntax highlighting
    effect(() => {
        const codeBlock = this.codeHighlightBlock?.nativeElement;
        if (this.currentChallenge()?.challengeType === 'code' && codeBlock) {
            codeBlock.textContent = this.userCode();
            hljs.highlightElement(codeBlock);
        }
    });

    // Effect for console output syntax highlighting
    effect(() => {
        const consoleBlock = this.consoleHighlightBlock?.nativeElement;
        if (this.codeOutput() && consoleBlock) {
            consoleBlock.textContent = this.codeOutput();
            hljs.highlightElement(consoleBlock);
        }
    });

    // Effect for example solution syntax highlighting
    effect(() => {
        const solutionBlock = this.exampleSolutionBlock?.nativeElement;
        if (this.showExampleSolution() && solutionBlock && this.currentChallenge()?.correctSolution) {
            solutionBlock.textContent = this.currentChallenge()!.correctSolution;
            hljs.highlightElement(solutionBlock);
        }
    });

    this.initSpeechRecognition();
  }

  ngOnDestroy() {
    this.stopExampleCooldown();
  }

  initSpeechRecognition() {
    if (typeof window !== 'undefined') {
        const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
        if (SpeechRecognition) {
            this.recognition = new SpeechRecognition();
            this.recognition.continuous = false;
            this.recognition.lang = 'en-US';
            this.recognition.interimResults = false;
            this.recognition.maxAlternatives = 1;

            this.recognition.onresult = (event: any) => {
                const transcript = event.results[0][0].transcript;
                this.chatInput = transcript;
                this.isListening.set(false);
            };
            
            this.recognition.onerror = (event: any) => {
                console.error('Speech recognition error', event.error);
                this.isListening.set(false);
            };
            
            this.recognition.onend = () => {
                 this.isListening.set(false);
            };
        }
    }
  }

  toggleListening() {
    if (!this.recognition) {
        alert("Speech recognition is not supported in this browser. Please use Chrome or Edge.");
        return;
    }
    
    if (this.isListening()) {
        this.recognition.stop();
        this.isListening.set(false);
    } else {
        this.recognition.start();
        this.isListening.set(true);
    }
  }

  async loadLesson() {
    // Check for saved progress first
    const savedProgress = this.loadProgressFromStorage();
    if (savedProgress && savedProgress.topic === this.topic() && savedProgress.domain === this.domain()) {
        this.restoreProgress(savedProgress);
        return; // Stop here, progress is restored
    }
    
    // If no matching saved progress, clear any old progress and start fresh.
    this.clearProgress();
    
    this.isLoading.set(true);
    this.error.set(null);
    this.lessonData.set(null);
    this.currentChallengeIndex.set(0);
    this.isLessonComplete.set(false);
    this.lives.set(3);
    this.combo.set(0);
    this.maxCombo.set(0);
    this.totalXpGained.set(0);
    this.correctAnswers.set(0);
    this.chatMessages.set([{role: 'model', text: 'Hi! I\'m your AI tutor. Stuck on a concept? Ask me anything!'}]);
    this.hintsAvailable.set(3);
    this.hintRevealed.set(false);
    this.resetInteraction();
    
    try {
      const data = await this.geminiService.generateInteractiveLesson(this.topic(), this.domain());
      if (data && data.challenges) {
          // Generate images for concepts
          const imagePromises = data.coreConcepts.map((concept: any) => 
            this.geminiService.generateImage(concept.visualPrompt)
          );
          const imageUrls = await Promise.all(imagePromises);
          
          const conceptsWithImages = data.coreConcepts.map((concept: any, index: number) => ({
            ...concept,
            imageUrl: imageUrls[index]
          }));

          const finalLessonData = { ...data, coreConcepts: conceptsWithImages };
          this.lessonData.set(finalLessonData);
          
          // Initialize mini-quiz state
          const miniQuizInitialState: {[key: number]: {[key: number]: {selected: number | null, correct: boolean | null}}} = {};
          finalLessonData.coreConcepts.forEach((concept: any, cIdx: number) => {
              miniQuizInitialState[cIdx] = {};
              if (concept.miniQuiz) {
                  concept.miniQuiz.forEach((quiz: any, qIdx: number) => {
                      miniQuizInitialState[cIdx][qIdx] = { selected: null, correct: null };
                  });
              }
          });
          this.miniQuizState.set(miniQuizInitialState);

          if (finalLessonData.challenges[0]?.challengeType === 'code') {
              this.userCode.set(finalLessonData.challenges[0].initialCode || '# Write your code here');
          }
          
          const firstChallenge = finalLessonData.challenges[0];
          this.chatSession = this.geminiService.createTutorChat(
              this.topic(),
              firstChallenge?.question || 'Getting started.',
              'Data Scientist',
              firstChallenge?.challengeType
          );
          this.startExampleCooldown();
      } else {
          console.error("Invalid lesson data structure");
          this.error.set('The AI returned an invalid lesson format. Please try again.');
          this.lessonData.set(null);
      }
    } catch (err: any) {
      console.error(err);
      this.error.set(err.message || 'An unexpected error occurred while generating the lesson.');
    } finally {
      this.isLoading.set(false);
    }
  }

  toggleChat() {
      this.showChat.update(v => !v);
      setTimeout(() => this.scrollToBottom(), 100);
  }

  async sendMessage() {
      if (!this.chatInput.trim() || !this.chatSession) return;
      
      const msg = this.chatInput;
      this.chatInput = '';
      this.chatMessages.update(m => [...m, {role: 'user', text: msg}]);
      this.isChatLoading.set(true);
      this.scrollToBottom();
      
      // Quest Update
      this.userService.updateQuestProgress(3); // Quest ID 3 is "Use AI Tutor"

      try {
          const response = await this.chatSession.sendMessage({ message: msg });
          this.chatMessages.update(m => [...m, {role: 'model', text: response.text || ''}]);
      } catch(e) {
          this.chatMessages.update(m => [...m, {role: 'model', text: "Sorry, I lost my train of thought. Try again?"}]);
      } finally {
          this.isChatLoading.set(false);
          this.scrollToBottom();
      }
  }
  
  scrollToBottom() {
      if (this.chatContainer) {
          const el = this.chatContainer.nativeElement;
          setTimeout(() => el.scrollTop = el.scrollHeight, 50);
      }
  }

  // Hint Logic
  useHint() {
      if (this.hintsAvailable() > 0 && !this.hintRevealed()) {
          this.hintsAvailable.update(v => v - 1);
          this.hintRevealed.set(true);
      }
  }

  // Code Execution Logic
  async runCode() {
    const current = this.currentChallenge();
    if (!current || this.isEvaluating()) return;

    this.isEvaluating.set(true);
    this.codeOutput.set('');
    
    try {
        const result = await this.geminiService.evaluateCode(this.userCode(), current.question);
        this.codeOutput.set(result.output);
        this.codeFeedback.set(result.feedback);
        
        this.processAnswer(result.isCorrect);
        this.hasAnswered.set(true);
    } catch (e) {
        this.codeOutput.set("Runtime Error during simulation.");
        this.processAnswer(false);
    } finally {
        this.isEvaluating.set(false);
    }
  }

  showExample() {
    if (this.exampleSolutionCooldown() > 0 || this.hasAnswered()) return;
    
    this.showExampleSolution.set(true);
    this.processAnswer(false); // Process as incorrect answer
    this.hasAnswered.set(true);
    this.codeFeedback.set("Example solution revealed. Study it and then continue.");
    this.codeOutput.set("Execution disabled.");
  }

  selectOption(index: number) {
    if (this.hasAnswered() || !this.currentChallenge()) return;
    this.selectedOption.set(index);
    this.hasAnswered.set(true);
    
    const correctIdx = this.currentChallenge()?.correctIndex;
    this.processAnswer(index === correctIdx);
  }

  processAnswer(isCorrect: boolean) {
    this.isCorrect.set(isCorrect);
    
    if (isCorrect) {
        // Correct Logic
        this.correctAnswers.update(c => c + 1);
        this.combo.update(c => c + 1);
        if (this.combo() > this.maxCombo()) this.maxCombo.set(this.combo());
        
        // Calculate XP with Combo Multiplier
        const baseXp = 20;
        const multiplier = Math.min(this.combo(), 5); 
        const bonus = (multiplier - 1) * 5;
        const total = baseXp + bonus;
        
        this.xpGained.set(total);
        this.totalXpGained.update(t => t + total);
        
        this.userService.addXp(total);
        this.userService.updateQuestProgress(2); 
    } else {
      // Incorrect Logic
      this.combo.set(0);
      this.xpGained.set(0);
      this.shake.set(true);
      setTimeout(() => this.shake.set(false), 500);
      
      this.lives.update(l => Math.max(0, l - 1));
      this.livesChanged.set(true);
      setTimeout(() => this.livesChanged.set(false), 300);
    }
  }

  nextChallenge() {
    const data = this.lessonData();
    if (!data || !data.challenges) return;

    if (this.currentChallengeIndex() < data.challenges.length - 1) {
      this.currentChallengeIndex.update(i => i + 1);
      this.resetInteraction();
      
      const nextChallenge = data.challenges[this.currentChallengeIndex()];
      if (nextChallenge.challengeType === 'code') {
          this.userCode.set(nextChallenge.initialCode || '# Write code here');
      }

      // Re-initialize tutor for the new challenge
      this.chatSession = this.geminiService.createTutorChat(
          this.topic(),
          nextChallenge?.question || 'Challenge information unavailable.',
          'Data Scientist',
          nextChallenge?.challengeType
      );
      // Also reset the visible chat messages for a clean slate
      this.chatMessages.set([{role: 'model', text: 'Great work! I\'m ready to help with this new challenge.'}]);

    } else {
      // Bonus for completion
      const completionBonus = 100;
      this.totalXpGained.update(t => t + completionBonus);
      this.userService.addXp(completionBonus);
      
      this.isLessonComplete.set(true);
      
      // RECORD ACCURATE LESSON HISTORY
      this.userService.recordLesson(
          this.topic(),
          this.domain(),
          this.correctAnswers(),
          data.challenges.length,
          this.totalXpGained()
      );

      this.clearProgress(); // CLEAR PROGRESS ON COMPLETION

      this.userService.updateQuestProgress(1); // Quest ID 1 is Complete Lesson
    }
  }

  resetInteraction() {
    this.selectedOption.set(null);
    this.hasAnswered.set(false);
    this.isCorrect.set(false);
    this.hintRevealed.set(false);
    this.codeOutput.set('');
    this.codeFeedback.set('');
    this.userCode.set('');
    this.showExampleSolution.set(false);
    this.startExampleCooldown();
  }

  getOptionClass(index: number): string {
    const base = 'border-white/10 hover:bg-white/5';
    if (!this.hasAnswered()) {
        return this.selectedOption() === index ? 'bg-white/10 border-flash-primary' : base;
    }

    const current = this.currentChallenge();
    if (!current) return base;

    const correctIdx = current.correctIndex;
    
    if (index === correctIdx) {
        return 'bg-green-500/10 border-green-500/50';
    }
    
    if (index === this.selectedOption() && index !== correctIdx) {
        return 'bg-red-500/10 border-red-500/50';
    }

    return 'opacity-50 border-transparent';
  }

  selectMiniQuizOption(cIdx: number, qIdx: number, optionIdx: number) {
    const currentState = this.miniQuizState();
    if (currentState[cIdx][qIdx].selected !== null) return;

    const concept = this.lessonData().coreConcepts[cIdx];
    const quiz = concept.miniQuiz[qIdx];
    const isCorrect = optionIdx === quiz.correctIndex;

    this.miniQuizState.update(current => {
        const newState = JSON.parse(JSON.stringify(current)); // simple deep copy
        newState[cIdx][qIdx] = { selected: optionIdx, correct: isCorrect };
        return newState;
    });

    if (isCorrect) {
        this.userService.addXp(5); // Award small XP for mini-quiz
        this.totalXpGained.update(t => t + 5);
    }
  }

  getMiniQuizOptionClass(cIdx: number, qIdx: number, optionIdx: number): string {
    const base = 'w-full text-left px-4 py-3 rounded-xl border transition-all text-sm disabled:cursor-not-allowed flex items-center justify-between';
    
    const state = this.miniQuizState()[cIdx]?.[qIdx];
    if (!state || state.selected === null) {
      return `${base} bg-white/5 border-white/10 hover:bg-white/10`;
    }
    
    const correctIdx = this.lessonData().coreConcepts[cIdx].miniQuiz[qIdx].correctIndex;

    if (optionIdx === correctIdx) {
      // Style for the correct answer, always shown after selection.
      return `${base} bg-green-500/20 border-green-500 text-green-200`;
    }
    
    if (optionIdx === state.selected && !state.correct) {
      // Style for the user's incorrect choice.
      return `${base} bg-red-500/20 border-red-500 text-red-200 line-through`;
    }
    
    // Style for other, non-selected incorrect options.
    return `${base} opacity-50 border-transparent`;
  }

  fireConfetti() {
    const canvas = this.confettiCanvas.nativeElement;
    const ctx = canvas.getContext('2d');
    if(!ctx) return;

    canvas.width = window.innerWidth;
    canvas.height = window.innerHeight;

    const particles: any[] = [];
    const colors = ['#FACC15', '#3B82F6', '#EC4899', '#10B981'];

    for(let i=0; i<150; i++) {
        particles.push({
            x: canvas.width / 2,
            y: canvas.height / 2,
            vx: (Math.random() - 0.5) * 25,
            vy: (Math.random() - 0.5) * 25,
            life: 150,
            color: colors[Math.floor(Math.random() * colors.length)],
            size: Math.random() * 8 + 4
        });
    }

    const animate = () => {
        ctx.clearRect(0, 0, canvas.width, canvas.height);
        let active = false;
        
        particles.forEach(p => {
            if(p.life > 0) {
                active = true;
                p.x += p.vx;
                p.y += p.vy;
                p.vy += 0.5; // gravity
                p.life--;
                
                ctx.fillStyle = p.color;
                ctx.beginPath();
                ctx.arc(p.x, p.y, p.size, 0, Math.PI * 2);
                ctx.fill();
            }
        });

        if(active) requestAnimationFrame(animate);
    };

    animate();
  }

  syncScroll(event: Event) {
    if (this.codeHighlightPre) {
        const textarea = event.target as HTMLTextAreaElement;
        this.codeHighlightPre.nativeElement.scrollTop = textarea.scrollTop;
        this.codeHighlightPre.nativeElement.scrollLeft = textarea.scrollLeft;
    }
  }

  private startExampleCooldown() {
    this.stopExampleCooldown();
    if (this.currentChallenge()?.challengeType !== 'code') return;
    
    this.showExampleSolution.set(false);
    this.exampleSolutionCooldown.set(30);
    
    this.exampleCooldownInterval = setInterval(() => {
        this.exampleSolutionCooldown.update(v => {
            if (v > 0) {
                return v - 1;
            } else {
                this.stopExampleCooldown();
                return 0;
            }
        });
    }, 1000);
  }

  private stopExampleCooldown() {
    if (this.exampleCooldownInterval) {
        clearInterval(this.exampleCooldownInterval);
        this.exampleCooldownInterval = null;
    }
  }

  private saveProgress(): void {
    if (typeof localStorage === 'undefined') return;

    const progress = {
        topic: this.topic(),
        domain: this.domain(),
        lessonData: this.lessonData(),
        currentChallengeIndex: this.currentChallengeIndex(),
        lives: this.lives(),
        hintsAvailable: this.hintsAvailable(),
        miniQuizState: this.miniQuizState(),
        totalXpGained: this.totalXpGained(),
        combo: this.combo(),
        maxCombo: this.maxCombo(),
        correctAnswers: this.correctAnswers()
    };
    localStorage.setItem(this.PROGRESS_KEY, JSON.stringify(progress));
  }

  private loadProgressFromStorage(): any | null {
    if (typeof localStorage === 'undefined') return null;
    const data = localStorage.getItem(this.PROGRESS_KEY);
    return data ? JSON.parse(data) : null;
  }

  private clearProgress(): void {
    if (typeof localStorage === 'undefined') return;
    localStorage.removeItem(this.PROGRESS_KEY);
  }

  private restoreProgress(progress: any): void {
    this.lessonData.set(progress.lessonData);
    this.currentChallengeIndex.set(progress.currentChallengeIndex);
    this.lives.set(progress.lives);
    this.hintsAvailable.set(progress.hintsAvailable);
    this.miniQuizState.set(progress.miniQuizState);
    this.totalXpGained.set(progress.totalXpGained);
    this.combo.set(progress.combo);
    this.maxCombo.set(progress.maxCombo);
    this.correctAnswers.set(progress.correctAnswers);
    
    this.isLessonComplete.set(false);
    this.isLoading.set(false);
    
    const current = this.currentChallenge();
    this.chatSession = this.geminiService.createTutorChat(
        this.topic(),
        current?.question || 'Resuming lesson.',
        'Data Scientist',
        current?.challengeType
    );
    this.startExampleCooldown();
  }

  exitAndClearProgress(): void {
    this.clearProgress();
    this.stopExampleCooldown();
    this.onExit.emit();
  }
}