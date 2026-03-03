import { Injectable } from '@angular/core';
import { GoogleGenAI, Type, Chat } from '@google/genai';

@Injectable({
  providedIn: 'root'
})
export class GeminiService {
  private ai: GoogleGenAI;
  private imageCache = new Map<string, string>();

  constructor() {
    const apiKey = (globalThis as any).process?.env?.['GEMINI_API_KEY'] || (globalThis as any).process?.env?.['API_KEY'] || '';
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
            return new Error('API key permission denied. Please check your key\'s configuration for the required model.');
        case 'INVALID_ARGUMENT':
             return new Error('Invalid request. Please check if your API key is configured correctly.');
        case 'UNKNOWN':
            return new Error('The AI model experienced an internal error. This is often temporary. Please try again in a few moments.');
    }

    if (message.includes('429') || message.includes('quota') || message.includes('resource_exhausted')) {
        return new Error('You\'ve made too many requests. Please wait a moment and try again.');
    }
    if (message.includes('403') || message.includes('permission_denied')) {
        return new Error('API key permission denied. Please check your key\'s configuration for the required model.');
    }
    if (message.includes('api key not valid')) {
        return new Error('Your API key is not valid. Please check your configuration.');
    }
    if (message.includes('500') || message.includes('xhr error') || message.includes('internal error')) {
        return new Error('The AI model experienced an internal error. This is often temporary. Please try again in a few moments.');
    }
    
    return new Error(`Could not ${context}. The AI model might be unavailable or an unknown error occurred.`);
  }

  async generateInteractiveLesson(topic: string, domain: string) {
    const model = 'gemma-2-9b-it';
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
        introduction: { type: Type.STRING, description: "A brief, engaging overview of the topic." },
        coreConcepts: {
            type: Type.ARRAY,
            description: "An array of key concepts that break down the topic.",
            items: {
                type: Type.OBJECT,
                properties: {
                    title: { type: Type.STRING },
                    explanation: { type: Type.STRING },
                    analogy: { type: Type.STRING },
                    visualPrompt: { type: Type.STRING },
                    miniQuiz: {
                        type: Type.ARRAY,
                        description: "A small quiz to reinforce the concept.",
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
              challengeType: { 
                  type: Type.STRING, 
                  enum: ["quiz", "code"],
                  description: "Use 'code' if the user needs to write/fix code, otherwise 'quiz'."
              },
              role: { type: Type.STRING, description: "The role the user is playing, e.g. 'NASA Engineer'" },
              question: { type: Type.STRING, description: "The problem statement." },
              options: { type: Type.ARRAY, items: { type: Type.STRING }, description: "Only required for 'quiz' type." },
              initialCode: { type: Type.STRING, description: "Starting code snippet for 'code' type challenges. Leave empty for quizzes." },
              correctSolution: { type: Type.STRING, description: "A correct, working code solution. ONLY for 'code' type." },
              correctIndex: { type: Type.INTEGER, description: "Only required for 'quiz' type." },
              explanation: { type: Type.STRING, description: "Why the answer is correct or what the code does." },
              hint: { type: Type.STRING, description: "A short, subtle clue." }
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
      
      const jsonText = (response.text ?? '').trim();
      return JSON.parse(jsonText);
    } catch (e) {
      throw this.handleError(e, 'generate lesson');
    }
  }
  
  async blendCurriculum(topic: string, local: string, international: string) {
    const model = 'gemma-2-9b-it';
    const prompt = `
      Analyze the topic "${topic}" from two educational perspectives:
      1. ${local} curriculum
      2. ${international} curriculum

      Provide a comparative analysis and a blended summary.
      The output must be a JSON object.

      Structure:
      - "localPerspective": {"focus": "Primary area of focus, e.g., 'Historical Impact'", "methodology": "How it's typically taught, e.g., 'Through case studies of local events'"}
      - "internationalPerspective": {"focus": "Primary area of focus, e.g., 'Theoretical Principles'", "methodology": "How it's taught, e.g., 'Focus on global economic models'"}
      - "blendedSummary": A paragraph that synthesizes both perspectives into a holistic understanding.
      - "keyTakeaways": An array of 3-4 bullet points highlighting the most important combined insights.
      - "quiz": An array of 2 multiple-choice questions designed to test the blended understanding. Each question object should have "question", an array of 4 "options", and the "correctIndex".
    `;

    const schema = {
        type: Type.OBJECT,
        properties: {
            localPerspective: {
                type: Type.OBJECT,
                properties: {
                    focus: { type: Type.STRING },
                    methodology: { type: Type.STRING }
                },
                required: ["focus", "methodology"]
            },
            internationalPerspective: {
                type: Type.OBJECT,
                properties: {
                    focus: { type: Type.STRING },
                    methodology: { type: Type.STRING }
                },
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
      const jsonText = (response.text ?? '').trim();
      return JSON.parse(jsonText);
    } catch (e) {
      throw this.handleError(e, 'blend curriculum');
    }
  }

  createTutorChat(topic: string, challengeContext: string, role?: string, challengeType?: string): Chat {
    const model = 'gemma-2-9b-it';
    const systemInstruction = `
        You are "Learnix Tutor," a friendly and encouraging AI assistant for a gamified learning platform.
        Your goal is to help students understand concepts without giving away direct answers to challenges.
        The current lesson topic is "${topic}".
        The student is currently playing the role of a "${role || 'learner'}" in a "${challengeType || 'quiz'}" type challenge.
        The current challenge context is: "${challengeContext}".

        RULES:
        - NEVER give the direct answer to the challenge.
        - Guide the student by asking leading questions.
        - Use the Socratic method.
        - If asked for a definition, explain the concept in a different way than the lesson did.
        - Keep responses concise and easy to understand (under 50 words).
        - Maintain a positive and supportive tone.
    `;

    return this.ai.chats.create({
      model: model,
      config: {
        systemInstruction: systemInstruction
      },
    });
  }

  async evaluateCode(code: string, problem: string): Promise<{ isCorrect: boolean; feedback: string; output: string }> {
    const model = 'gemma-2-9b-it';
    const prompt = `
      You are a Python code interpreter and grader.
      The user was given this problem: "${problem}".
      The user submitted this Python code:
      \`\`\`python
      ${code}
      \`\`\`
      
      Analyze the code's execution and correctness based on the problem.
      1. Determine if the code correctly solves the problem.
      2. Simulate the code's output (stdout). If there's an error, describe it.
      3. Provide brief, constructive feedback.

      Return the result as a JSON object.
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
            model: model,
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
        return {
            isCorrect: false,
            feedback: error.message,
            output: 'Evaluation failed.'
        };
    }
  }

  async generateImage(prompt: string): Promise<string> {
    if (this.imageCache.has(prompt)) {
      return this.imageCache.get(prompt)!;
    }
    const pollinationsUrl = `https://image.pollinations.ai/prompt/${encodeURIComponent(prompt)}?width=600&height=600&model=flux&nologo=true&seed=${Math.floor(Math.random() * 1000000)}`;
    this.imageCache.set(prompt, pollinationsUrl);
    return pollinationsUrl;
  }
}
