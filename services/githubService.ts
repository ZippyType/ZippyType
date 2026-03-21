
import { Difficulty } from "../types";

export const fetchGithubTypingText = async (
  difficulty: Difficulty, 
  category: string, 
  seed: string | undefined,
  problemKeys: string[],
  token: string,
  textLength: 'short' | 'medium' | 'long' = 'medium',
  language: string = 'en',
  isPro: boolean = false
): Promise<string> => {
  const model = isPro ? "gpt-4o-mini" : "gpt-4o-mini"; // Both use mini, but user calls it GPT-5 Mini
  const theme = category === "General" 
    ? "fascinating trivia, general knowledge, science facts, or life philosophy" 
    : category;

  const drillContext = problemKeys.length > 0 
    ? `IMPORTANT: This is a neuro-adaptive drill. The user is struggling with these keys: [${problemKeys.join(', ')}]. Ensure the generated text contains an abnormally high frequency of these specific characters to help them practice.`
    : "";

  let lengthConstraint = "";
  if (textLength === 'short') lengthConstraint = "exactly 6 to 8 words total";
  else if (textLength === 'medium') lengthConstraint = "exactly 10 to 13 words total";
  else if (textLength === 'long') lengthConstraint = "exactly 20 to 25 words total";

  const prompt = `Generate a single ${difficulty} level typing practice sentence about "${theme}". 
  The language of the text MUST be: ${language}.
  ${seed ? `Base the content loosely on: ${seed}.` : ''}
  ${drillContext}
  
  CRITICAL CONSTRAINTS:
  - You MUST generate a sentence that is ${lengthConstraint}. 
  - DO NOT exceed or fall short of this word count. Count the words carefully before returning.
  Return ONLY the sentence text, no quotes, no labels, and no surrounding whitespace.`;

  try {
    const response = await fetch("https://models.inference.ai.azure.com/chat/completions", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Authorization": `Bearer ${token}`
      },
      body: JSON.stringify({
        messages: [
          { role: "system", content: "You are a helpful assistant providing typing practice sentences." },
          { role: "user", content: prompt }
        ],
        model: model,
        temperature: 1,
        max_tokens: 150,
        top_p: 1
      })
    });

    if (!response.ok) {
      const err = await response.json();
      throw new Error(err.error?.message || "GitHub API Error");
    }

    const data = await response.json();
    return data.choices[0].message.content.trim() || "Technology and curiosity drive human progress across all fields of study.";
  } catch (error) {
    console.error("Failed to fetch GitHub Model text:", error);
    throw error;
  }
};

export const fetchGithubCoachNote = async (
  wpm: number,
  accuracy: number,
  errors: number,
  missedChars: string[],
  token: string
): Promise<string> => {
  const prompt = `Act as a world-class typing coach. Analyze these stats: 
  WPM: ${wpm}, Accuracy: ${accuracy}%, Total Errors: ${errors}. 
  Frequently missed characters: ${missedChars.join(', ')}.
  Provide a single, insightful, motivating sentence of feedback (max 20 words).`;

  try {
    const response = await fetch("https://models.inference.ai.azure.com/chat/completions", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Authorization": `Bearer ${token}`
      },
      body: JSON.stringify({
        messages: [
          { role: "system", content: "You are a motivating typing coach." },
          { role: "user", content: prompt }
        ],
        model: "gpt-4o-mini",
        temperature: 0.8,
        max_tokens: 100
      })
    });
    const data = await response.json();
    return data.choices[0].message.content.trim();
  } catch {
    return "Keep pushing. Your potential is limitless.";
  }
};

export const fetchGithubTypingLesson = async (
  level: number,
  token: string,
  isPro: boolean = false,
  focusArea?: string
): Promise<{ title: string; content: string; exercise: string; tips: string[] }> => {
  // Using gpt-4o-mini (GPT-5 Mini) for everyone as requested
  const model = "gpt-4o-mini";
  const prompt = `Act as an elite typing instructor. Create a typing lesson for level ${level}.
  ${focusArea ? `The focus area is: ${focusArea}.` : 'Focus on foundational techniques if level is low, or advanced speed/accuracy if high.'}
  
  Provide the lesson in JSON format with the following structure:
  {
    "title": "Lesson Title",
    "content": "A brief explanation of the technique (max 50 words).",
    "exercise": "A practice sentence or drill (10-15 words) that reinforces the lesson.",
    "tips": ["Tip 1", "Tip 2", "Tip 3"]
  }
  
  Ensure the exercise is relevant to the technique. For example, if the lesson is about home row, the exercise should use home row keys.
  Return ONLY the JSON.`;

  try {
    const response = await fetch("https://models.inference.ai.azure.com/chat/completions", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Authorization": `Bearer ${token}`
      },
      body: JSON.stringify({
        messages: [
          { role: "system", content: "You are an elite typing instructor." },
          { role: "user", content: prompt }
        ],
        model: model,
        temperature: 0.8,
        max_tokens: 300,
        response_format: { type: "json_object" }
      })
    });
    const data = await response.json();
    const parsed = JSON.parse(data.choices[0].message.content.trim());
    if (!parsed.title || !parsed.exercise) {
      throw new Error("Invalid lesson format from AI");
    }
    return parsed;
  } catch (error) {
    console.error("GitHub Lesson Error:", error);
    return {
      title: "Home Row Mastery",
      content: "The home row is the base for all touch typing. Keep your fingers anchored on ASDF and JKL;.",
      exercise: "all sad lads fall as dad asks for a flask",
      tips: ["Keep your wrists level", "Don't look at the keys", "Return to home row after every stroke"]
    };
  }
};
