import { Injectable } from '@angular/core';
import { GoogleGenAI, Type, Chat } from '@google/genai';

/**
 * Service for AI interactions.
 * Switched to Gemma 2 (Open Weights) and Pollinations.ai (Open Source Models)
 * to provide a more open-source friendly and reliable experience.
 *
 * Gemma 2 is an open-weights model by Google.
 * Pollinations.ai provides access to open-source image generation models like Stable Diffusion / Flux.
 */
@Injectable({
  providedIn: 'root'
})
export class GeminiService {
  private ai: GoogleGenAI;
  private imageCache = new Map<string, string>();

  // Using gemma-2-9b-it as a powerful, free, and open-weights alternative to proprietary models.
  private readonly LLM_MODEL = 'gemma-2-9b-it';

  constructor() {
    this.ai = new GoogleGenAI({ apiKey: ((globalThis as any).process?.env?.['GEMINI_API_KEY'] || (globalThis as any).process?.env?.['API_KEY'] || '') || '' });
  }

  private handleError(e: any, context: string): Error {
    console.error(`Error in ${context}:`, e);

    const getErrorDetails = (err: any): any => {
        if (!err) return null;
        if (err.error) return getErrorDetails(err.error);
        if (typeof err.message === 'string') {
            try {
                const parsed = JSON.parse(err.message);
                if (parsed.error) return getErrorDetails(parsed.error);
                return parsed;
            } catch (parseError) {}
        }
        return err;
    };

    const details = getErrorDetails(e) || {};
    const status = details.status || '';
    const message = (details.message || e.message || '').toString().toLowerCase();

    switch (status) {
        case 'RESOURCE_EXHAUSTED':
            return new Error('You\'ve made too many requests. Please wait a moment and try again.');
        case 'PERMISSION_DENIED':
            return new Error('API key permission denied. Please check your key\'s configuration.');
        case 'INVALID_ARGUMENT':
             return new Error('Invalid request. Please check your configuration.');
        case 'NOT_FOUND':
             return new Error(`The model "${this.LLM_MODEL}" was not found. Please check your API key's access.`);
    }

    if (message.includes('429') || message.includes('quota')) return new Error('You\'ve made too many requests.');
    if (message.includes('403')) return new Error('Permission denied.');
    if (message.includes('404')) return new Error(`Model "${this.LLM_MODEL}" not found.`);
    
    return new Error(`Could not ${context}. The AI model might be unavailable.`);
  }

  async generateInteractiveLesson(topic: string, domain: string) {
    const prompt = `
      Create an engaging, gamified, and interactive lesson for the topic "${topic}" in the domain of "${domain}".
      The lesson should be structured to build understanding from the ground up.
      Output MUST be strictly JSON.

      Structure:
      {
        "title": "Lesson Title",
        "introduction": "Engaging overview (2-3 sentences).",
        "coreConcepts": [
          {
            "title": "Concept Name",
            "explanation": "In-depth explanation (5-7 sentences) with real-world example.",
            "analogy": "Relatable story or analogy.",
            "visualPrompt": "Descriptive prompt for a photorealistic image.",
            "miniQuiz": [
              { "question": "...", "options": ["...", "..."], "correctIndex": 0 }
            ]
          }
        ],
        "challenges": [
          {
            "challengeType": "quiz",
            "role": "Professional Role",
            "question": "The problem.",
            "options": ["A", "B", "C"],
            "correctIndex": 0,
            "explanation": "Why it's correct.",
            "hint": "Subtle clue."
          }
        ]
      }
    `;

    const schema = {
      type: Type.OBJECT,
      properties: {
        title: { type: Type.STRING },
        introduction: { type: Type.STRING },
        coreConcepts: {
            type: Type.ARRAY,
            items: {
                type: Type.OBJECT,
                properties: {
                    title: { type: Type.STRING },
                    explanation: { type: Type.STRING },
                    analogy: { type: Type.STRING },
                    visualPrompt: { type: Type.STRING },
                    miniQuiz: {
                        type: Type.ARRAY,
                        items: {
                            type: Type.OBJECT,
                            properties: {
                                question: { type: Type.STRING },
                                options: { type: Type.ARRAY, items: { type: Type.STRING } },
                                correctIndex: { type: Type.INTEGER }
                            },
                            required: ["question", "options", "correctIndex"]
                        }
                    }
                },
                required: ["title", "explanation", "analogy", "visualPrompt", "miniQuiz"]
            }
        },
        challenges: {
          type: Type.ARRAY,
          items: {
            type: Type.OBJECT,
            properties: {
              challengeType: { type: Type.STRING },
              role: { type: Type.STRING },
              question: { type: Type.STRING },
              options: { type: Type.ARRAY, items: { type: Type.STRING } },
              initialCode: { type: Type.STRING },
              correctSolution: { type: Type.STRING },
              correctIndex: { type: Type.INTEGER },
              explanation: { type: Type.STRING },
              hint: { type: Type.STRING }
            },
            required: ["challengeType", "role", "question", "explanation", "hint"]
          }
        }
      },
      required: ["title", "introduction", "coreConcepts", "challenges"]
    };

    try {
      const response = await this.ai.models.generateContent({
        model: this.LLM_MODEL,
        contents: prompt,
        config: {
          responseMimeType: 'application/json',
          responseSchema: schema
        }
      });
      
      const jsonText = (response.text ?? '').trim();
      return JSON.parse(jsonText);
    } catch (e) {
      throw this.handleError(e, 'generate lesson');
    }
  }
  
  async blendCurriculum(topic: string, local: string, international: string) {
    const prompt = `
      Analyze the topic "${topic}" from:
      1. ${local} curriculum
      2. ${international} curriculum

      Return a JSON object with:
      "localPerspective": {"focus": "...", "methodology": "..."},
      "internationalPerspective": {"focus": "...", "methodology": "..."},
      "blendedSummary": "Synthesized paragraph.",
      "keyTakeaways": ["...", "..."],
      "quiz": [{"question": "...", "options": ["...", "..."], "correctIndex": 0}]
    `;

    const schema = {
        type: Type.OBJECT,
        properties: {
            localPerspective: {
                type: Type.OBJECT,
                properties: { focus: { type: Type.STRING }, methodology: { type: Type.STRING } },
                required: ["focus", "methodology"]
            },
            internationalPerspective: {
                type: Type.OBJECT,
                properties: { focus: { type: Type.STRING }, methodology: { type: Type.STRING } },
                required: ["focus", "methodology"]
            },
            blendedSummary: { type: Type.STRING },
            keyTakeaways: { type: Type.ARRAY, items: { type: Type.STRING } },
            quiz: {
                type: Type.ARRAY,
                items: {
                    type: Type.OBJECT,
                    properties: {
                        question: { type: Type.STRING },
                        options: { type: Type.ARRAY, items: { type: Type.STRING } },
                        correctIndex: { type: Type.INTEGER }
                    },
                     required: ["question", "options", "correctIndex"]
                }
            }
        },
        required: ["localPerspective", "internationalPerspective", "blendedSummary", "keyTakeaways", "quiz"]
    };

    try {
      const response = await this.ai.models.generateContent({
        model: this.LLM_MODEL,
        contents: prompt,
        config: {
          responseMimeType: 'application/json',
          responseSchema: schema
        }
      });
      const jsonText = (response.text ?? '').trim();
      return JSON.parse(jsonText);
    } catch (e) {
      throw this.handleError(e, 'blend curriculum');
    }
  }

  createTutorChat(topic: string, challengeContext: string, role?: string, challengeType?: string): Chat {
    const systemInstruction = `
        You are "Learnix Tutor," a friendly AI assistant.
        The current topic is "${topic}".
        The student role is "${role || 'learner'}" in a "${challengeType || 'quiz'}" challenge.
        Context: "${challengeContext}".

        RULES:
        - NEVER give direct answers.
        - Use the Socratic method.
        - Keep responses under 50 words.
        - Be supportive.
    `;

    return this.ai.chats.create({
      model: this.LLM_MODEL,
      config: {
        systemInstruction: systemInstruction
      },
    });
  }

  async evaluateCode(code: string, problem: string): Promise<{ isCorrect: boolean; feedback: string; output: string }> {
    const prompt = `
      Evaluate this Python code for the problem: "${problem}".
      Code:
      \`\`\`python
      ${code}
      \`\`\`
      
      Return JSON: { "isCorrect": boolean, "feedback": "...", "output": "..." }
    `;
    const schema = {
        type: Type.OBJECT,
        properties: {
            isCorrect: { type: Type.BOOLEAN },
            feedback: { type: Type.STRING },
            output: { type: Type.STRING }
        },
        required: ["isCorrect", "feedback", "output"]
    };

    try {
        const response = await this.ai.models.generateContent({
            model: this.LLM_MODEL,
            contents: prompt,
            config: {
              responseMimeType: 'application/json',
              responseSchema: schema
            }
        });
        const jsonText = (response.text ?? '').trim();
        return JSON.parse(jsonText);
    } catch(e) {
        const error = this.handleError(e, 'evaluate code');
        return { isCorrect: false, feedback: error.message, output: 'Evaluation failed.' };
    }
  }

  async generateImage(prompt: string): Promise<string> {
    if (this.imageCache.has(prompt)) {
      return this.imageCache.get(prompt)!;
    }

    // Using Pollinations.ai for free, reliable, open-source model based images (Stable Diffusion / Flux)
    // This provides a high-quality alternative without requiring proprietary API keys for images.
    try {
      const encodedPrompt = encodeURIComponent(`${prompt}, photorealistic, educational, high quality`);
      const imageUrl = `https://image.pollinations.ai/prompt/${encodedPrompt}?width=1024&height=1024&nologo=true&seed=${Math.floor(Math.random() * 1000000)}`;
      
      this.imageCache.set(prompt, imageUrl);
      return imageUrl;
    } catch (e) {
      return 'https://picsum.photos/seed/error/600/600';
    }
  }
}
