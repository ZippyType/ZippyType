import { GoogleGenAI } from "@google/genai";
import { AIProvider, Difficulty, GameMode } from "../types";

export const generateText = async (
  provider: AIProvider,
  token: string | undefined, // GitHub token or undefined for Gemini
  isPro: boolean,
  difficulty: Difficulty,
  category: string,
  seed: string | undefined,
  problemKeys: string[],
  textLength: 'short' | 'medium' | 'long',
  language: string,
  mode: GameMode,
  subMode: 'daily' | 'speed' | 'accuracy' | 'themed' = 'daily'
): Promise<string> => {
  if (provider === AIProvider.GITHUB) {
    // If Pro, use the server-side pooled tokens for better performance and security
    if (isPro) {
      try {
        const response = await fetch('/api/generate-pro-text', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ difficulty, topic: category, textLength, language, mode })
        });
        if (!response.ok) {
          const err = await response.json();
          throw new Error(err.error || "Failed to generate Pro text");
        }
        const data = await response.json();
        return data.text;
      } catch (error) {
        console.warn("Server-side Pro generation failed, falling back to client-side:", error);
        // Fallback to client-side if server fails
      }
    }

    if (!token) throw new Error("GitHub token is required for GitHub AI provider.");
    // Import dynamically or use the existing service
    const { fetchGithubTypingText } = await import("./githubService");
    return await fetchGithubTypingText(difficulty, category, seed, problemKeys, token, textLength, language, isPro);
  } else {
    // Gemini
    const { fetchTypingText } = await import("./geminiService");
    return await fetchTypingText(difficulty, category, seed, problemKeys, textLength, language, mode, subMode, isPro);
  }
};

export const generateCoachNote = async (
  provider: AIProvider,
  token: string | undefined,
  isPro: boolean,
  wpm: number,
  accuracy: number,
  errors: number,
  missedChars: string[],
  isGuest: boolean = false
): Promise<string> => {
  if (isGuest || !token) {
    try {
      const res = await fetch('/api/generate-pro-coach-note', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ wpm, accuracy, errors, missedChars, isGuest: true })
      });
      if (res.ok) {
        const data = await res.json();
        return data.note;
      }
    } catch (e) {
      console.error("Failed to fetch guest coach report:", e);
    }
    return "Great run! Focus on maintaining rhythm during difficult transitions.";
  }

  if (provider === AIProvider.GITHUB) {
    const { fetchGithubCoachNote } = await import("./githubService");
    return await fetchGithubCoachNote(wpm, accuracy, errors, missedChars, token);
  } else {
    const { fetchCoachNote } = await import("./geminiService");
    return await fetchCoachNote(wpm, accuracy, errors, missedChars);
  }
};

export const generateTypingLesson = async (
  provider: AIProvider,
  token: string | undefined,
  isPro: boolean,
  level: number,
  focusArea?: string,
  isGuest: boolean = false
): Promise<{ title: string; content: string; exercise: string; tips: string[] }> => {
  if (isGuest || !token) {
    try {
      const res = await fetch('/api/generate-pro-lesson', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ level, focusArea, isGuest: true })
      });
      if (res.ok) {
        return await res.json();
      }
    } catch (e) {
      console.error("Failed to fetch guest lesson:", e);
    }
    return {
      title: `Level ${level}: Foundation Mastery`,
      content: "Practice key home row and finger transitions.",
      exercise: "the quick brown fox jumps over the lazy dog",
      tips: ["Keep your wrists level", "Accuracy first, speed second"]
    };
  }

  if (provider === AIProvider.GITHUB) {
    const { fetchGithubTypingLesson } = await import("./githubService");
    return await fetchGithubTypingLesson(level, token, isPro, focusArea);
  } else {
    const { fetchTypingLesson } = await import("./geminiService");
    return await fetchTypingLesson(level, isPro, focusArea);
  }
};
