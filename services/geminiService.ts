import { GoogleGenAI, Type } from "@google/genai";
import { NewTaskPayload, TaskCategory, TaskPriority } from "../types";

// Helper to get the API key from local storage
const getApiKey = (): string | null => {
  try {
    return window.localStorage.getItem('gemini_api_key');
  } catch (error) {
    console.error("Could not access localStorage:", error);
    return null;
  }
};

const systemInstruction = `You are an intelligent task parsing assistant. Your role is to analyze user-provided text and convert it into a structured JSON object representing a task.
- Assume today's date is ${new Date().toISOString()} when interpreting relative dates like "tomorrow".
- Always output a valid JSON object that adheres to the provided schema. Do not output any other text or explanations.
- For the 'category' field, you must choose one of the following values: ${Object.values(TaskCategory).join(', ')}. If no category fits, use '${TaskCategory.OTHER}'.
- For the 'priority' field, you must choose one of the following values: ${Object.values(TaskPriority).join(', ')}. If no priority is mentioned, default to '${TaskPriority.MEDIUM}'.
- For 'startTime' and 'endTime', provide the full date and time in UTC ISO 8601 format (YYYY-MM-DDTHH:mm:ss.sssZ).
- If the user specifies a time without a date (e.g., "at 2pm"), assume it's for today unless specified otherwise.
- If no specific time is mentioned for a task on a certain day, treat it as an all-day event by setting the time to T00:00:00.000Z.
- If an end time is not specified but a duration is (e.g., "for 1 hour"), calculate the endTime based on the startTime.
- If no description is provided, use the task title as the description.
- If the user provides a checklist or a list of items, parse them into the 'subtasks' array. Each subtask should be an object with a 'text' property.
`;

const schema = {
  type: Type.OBJECT,
  properties: {
    title: { type: Type.STRING, description: "The title of the task." },
    description: { type: Type.STRING, description: "A detailed description of the task." },
    startTime: { type: Type.STRING, description: "The start time of the task in UTC ISO 8601 format." },
    endTime: { type: Type.STRING, description: "The optional end time of the task in UTC ISO 8601 format." },
    category: {
      type: Type.STRING,
      description: `The category of the task. Must be one of: ${Object.values(TaskCategory).join(', ')}.`,
    },
    priority: {
      type: Type.STRING,
      description: `The priority of the task. Must be one of: ${Object.values(TaskPriority).join(', ')}.`,
    },
    subtasks: {
      type: Type.ARRAY,
      description: "A list of sub-tasks or checklist items derived from the main description.",
      items: {
        type: Type.OBJECT,
        properties: {
          text: { type: Type.STRING, description: "The content of the sub-task." },
          completed: { type: Type.BOOLEAN, description: "Whether the sub-task is completed. Always defaults to false during parsing." }
        },
        required: ['text']
      }
    }
  },
  required: ['title', 'description', 'startTime', 'category', 'priority'],
};

export const parseTaskFromText = async (text: string): Promise<NewTaskPayload> => {
  const apiKey = getApiKey();
  if (!apiKey) {
    throw new Error("Gemini API key not set. Please add your key in the Settings page.");
  }
  
  const ai = new GoogleGenAI({ apiKey });
  const model = 'gemini-2.5-flash';

  try {
    const response = await ai.models.generateContent({
      model,
      contents: `Parse the following task: "${text}"`,
      config: {
        systemInstruction,
        responseMimeType: "application/json",
        responseSchema: schema,
      }
    });

    const jsonString = response.text?.trim();
    if (!jsonString) {
        throw new Error("Received an empty response from the AI.");
    }

    const parsed = JSON.parse(jsonString);

    // Basic validation to ensure the AI's response is in the correct shape
    if (typeof parsed.title !== 'string' || typeof parsed.startTime !== 'string') {
        throw new Error("AI response is missing required fields or has incorrect types.");
    }

    // Ensure category and priority are valid enum values, otherwise default them.
    if (!Object.values(TaskCategory).includes(parsed.category)) {
      console.warn(`Invalid category from AI: ${parsed.category}. Defaulting to OTHER.`);
      parsed.category = TaskCategory.OTHER;
    }
    if (!Object.values(TaskPriority).includes(parsed.priority)) {
      console.warn(`Invalid priority from AI: ${parsed.priority}. Defaulting to MEDIUM.`);
      parsed.priority = TaskPriority.MEDIUM;
    }
    
    // Ensure subtasks are correctly formatted
    if (parsed.subtasks && Array.isArray(parsed.subtasks)) {
      parsed.subtasks = parsed.subtasks.map((st: any) => ({ text: st.text || '', completed: false })).filter((st:any) => st.text);
    }


    return parsed as NewTaskPayload;
  } catch (error: any) {
    console.error("Error parsing task with Gemini:", error);
    if (error.message && error.message.includes('API key not valid')) {
       throw new Error("Your Gemini API key is invalid. Please check it in the Settings page.");
    }
    throw new Error("Could not understand the task. Please try rephrasing your request.");
  }
};