import { Injectable } from '@angular/core';
import { GoogleGenAI, Type, Chat } from '@google/genai';

@Injectable({
  providedIn: 'root'
})
export class GeminiService {
  private ai: GoogleGenAI;
  private imageCache = new Map<string, string>();

  constructor() {
    // Priority: GEMINI_API_KEY -> API_KEY -> globalThis.GEMINI_API_KEY
    const apiKey = process.env['GEMINI_API_KEY'] || process.env['API_KEY'] || (globalThis as any).GEMINI_API_KEY || '';
    this.ai = new GoogleGenAI({ apiKey });
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
        case 'UNKNOWN':
            return new Error('The AI model experienced an internal error. Please try again.');
    }

    if (message.includes('429') || message.includes('quota')) {
        return new Error('You\'ve made too many requests. Please wait.');
    }
    if (message.includes('403') || message.includes('api key not valid')) {
        return new Error('Invalid or unauthorized API key.');
    }
    
    return new Error(`Could not ${context}. The AI model might be unavailable.`);
  }

  async generateInteractiveLesson(topic: string, domain: string) {
    const model = 'gemini-1.5-flash';
    const prompt = `
      Create an engaging, gamified, and interactive lesson for the topic "${topic}" in the domain of "${domain}".
      The lesson should be structured to build understanding from the ground up.
      The lesson must have a "title" property.

      1. "introduction": A brief, engaging overview of the topic (2-3 sentences).
      2. "coreConcepts": An array of 2-4 key concepts that break down the topic. For each concept:
         - "title": The name of the concept.
         - "explanation": An in-depth explanation of the concept, 5-7 sentences long. This explanation must include a clear, real-world example of the concept in action.
         - "analogy": A relatable real-world story or analogy.
         - "visualPrompt": A descriptive prompt for a PHOTOREALISTIC image that VISUALIZES this specific concept.
         - "miniQuiz": An array of 1-2 multiple choice questions to reinforce understanding of THIS specific concept. Each question must have a 'question', an array of 'options', and a 'correctIndex'.
      3. "challenges": An array of 3 progressive challenge scenarios where the user plays a specific professional ROLE (e.g. "Role: City Planner"). These challenges should test the understanding of the core concepts provided. Each challenge must include a "hint" property, which is a short, subtle clue to guide the user without giving away the answer.
         - Challenge 1: Intuition (Easy, based on one concept).
         - Challenge 2: Application (Medium, may combine concepts).
         - Challenge 3: Mastery (Hard, requires deeper application).
         
      IF the domain is related to "Computer Science" or "Programming", ensure at least one challenge is a "code" type challenge where the user must fix or write a snippet.
      Each "code" type challenge MUST include a "correctSolution" property containing a working example of the correct code.
      
      Output strictly in JSON. Ensure "coreConcepts" has between 2 and 4 items, and "challenges" has exactly 3 items.
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
              challengeType: { type: Type.STRING, enum: ["quiz", "code"] },
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
        model: model,
        contents: prompt,
        config: {
          responseMimeType: 'application/json',
          responseSchema: schema
        }
      });
      
      if (!response || !response.text) {
          throw new Error('Empty response from AI model.');
      }

      const jsonText = (response.text || '').trim();
      return JSON.parse(jsonText);
    } catch (e) {
      throw this.handleError(e, 'generate lesson');
    }
  }
  
  async blendCurriculum(topic: string, local: string, international: string) {
    const model = 'gemini-1.5-flash';
    const prompt = `
      Analyze the topic "${topic}" from two educational perspectives:
      1. ${local} curriculum
      2. ${international} curriculum
      Provide a comparative analysis and a blended summary.
      Output strictly in JSON.
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
        model: model,
        contents: prompt,
        config: {
          responseMimeType: 'application/json',
          responseSchema: schema
        }
      });
      if (!response || !response.text) throw new Error('Empty response from AI model.');
      const jsonText = (response.text || '').trim();
      return JSON.parse(jsonText);
    } catch (e) {
      throw this.handleError(e, 'blend curriculum');
    }
  }

  createTutorChat(topic: string, challengeContext: string, role?: string, challengeType?: string): Chat {
    const model = 'gemini-1.5-flash';
    const systemInstruction = `
        You are "Learnix Tutor," a friendly AI assistant.
        Lesson: "${topic}". Role: "${role || 'learner'}". Type: "${challengeType || 'quiz'}".
        Context: "${challengeContext}".
        Rules: Never give direct answers. Guide using Socratic method. Concise responses (<50 words).
    `;

    return this.ai.chats.create({
      model: model,
      config: {
        systemInstruction: systemInstruction
      },
    });
  }

  async evaluateCode(code: string, problem: string): Promise<{ isCorrect: boolean; feedback: string; output: string }> {
    const model = 'gemini-1.5-flash';
    const prompt = `Evaluate this Python code for the problem: "${problem}". Code: \`${code}\`. Return JSON.`;
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
            model: model,
            contents: prompt,
            config: {
              responseMimeType: 'application/json',
              responseSchema: schema
            }
        });
        if (!response || !response.text) throw new Error('Empty response.');
        return JSON.parse((response.text || '').trim());
    } catch(e) {
        return { isCorrect: false, feedback: 'Evaluation failed.', output: '' };
    }
  }

  async generateImage(prompt: string): Promise<string> {
    if (this.imageCache.has(prompt)) return this.imageCache.get(prompt)!;
    const model = 'imagen-3.0-generate-001'; // Falling back to 3.0 as 4.0 might not be available in all regions
    try {
      const response = await this.ai.models.generateImages({
        model: model,
        prompt: `${prompt}, photorealistic, high quality`,
        config: { numberOfImages: 1, aspectRatio: '1:1' },
      });

      const bytes = response.generatedImages?.[0]?.image?.imageBytes;
      if (bytes) {
        const url = `data:image/jpeg;base64,${bytes}`;
        this.imageCache.set(prompt, url);
        return url;
      }
      return 'https://picsum.photos/seed/fallback/600/600';
    } catch (e) {
      return 'https://picsum.photos/seed/error/600/600';
    }
  }
}