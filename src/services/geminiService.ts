import { GoogleGenAI, Type } from "@google/genai";
import { NewTaskPayload, TaskCategory, TaskPriority, RecurrenceFrequency } from "../types";

// Helper to get the API key from local storage
const getApiKey = (): string | null => {
  try {
    return window.localStorage.getItem('gemini_api_key');
  } catch (error) {
    console.error("Could not access localStorage:", error);
    return null;
  }
};

const getLocalTimezoneInfo = () => {
    const now = new Date();
    const timezoneOffset = now.getTimezoneOffset();
    const offsetHours = Math.floor(Math.abs(timezoneOffset) / 60);
    const offsetMinutes = Math.abs(timezoneOffset) % 60;
    const sign = timezoneOffset > 0 ? "-" : "+";
    const timezoneString = `UTC${sign}${String(offsetHours).padStart(2, '0')}:${String(offsetMinutes).padStart(2, '0')}`;
    
    return {
        timezoneString,
        localTimeString: now.toString(),
    };
};

const { timezoneString, localTimeString } = getLocalTimezoneInfo();

const systemInstruction = `You are an intelligent task parsing assistant. Your role is to analyze user-provided text and convert it into a structured JSON object representing a task.
- **CONTEXT**: The user is in timezone ${timezoneString}. The current local time for the user is ${localTimeString}.
- **TIME INTERPRETATION**: All relative times in the user's query (e.g., "2pm", "tomorrow morning") must be interpreted according to the user's local timezone.
- **CRITICAL OUTPUT FORMAT**: The final 'startTime' and 'endTime' values in the JSON output MUST be converted to UTC and formatted as a full ISO 8601 string (YYYY-MM-DDTHH:mm:ss.sssZ).
- For the 'category' field, you must choose one of the following values: ${Object.values(TaskCategory).join(', ')}. If no category fits, use '${TaskCategory.OTHER}'.
- For the 'priority' field, you must choose one of the following values: ${Object.values(TaskPriority).join(', ')}. If no priority is mentioned, default to '${TaskPriority.MEDIUM}'.
- If no specific time is mentioned for a task on a certain day (e.g., "report due Friday"), treat it as an all-day event by setting the time to T00:00:00.000Z for the user's local date, and then converting that start-of-day timestamp to UTC.
- If an end time is not specified but a duration is (e.g., "for 1 hour"), calculate the endTime based on the startTime.
- If no description is provided, use the task title as the description.
- If the user provides a checklist or a list of items, parse them into the 'subtasks' array.
- **RECURRENCE RULES**:
  - For recurring tasks ("every day", "weekly", etc.), parse them into the 'recurring' object.
  - If a recurring task does NOT have a specified end date, omit the 'endDate' field entirely. Do not invent an end date.
  - If a weekly recurrence specifies certain days (e.g., "every Monday and Wednesday"), populate the 'daysOfWeek' array with numbers (Sunday=0, ..., Saturday=6).
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
    },
    recurring: {
      type: Type.OBJECT,
      description: "Information about the task's recurrence, if any.",
      properties: {
        frequency: {
          type: Type.STRING,
          description: `The frequency of recurrence. Must be one of: ${Object.values(RecurrenceFrequency).join(', ')}.`,
        },
        interval: {
          type: Type.INTEGER,
          description: "The interval of recurrence, e.g., every 2 days. Defaults to 1.",
        },
        endDate: {
          type: Type.STRING,
          description: "The optional end date for the recurrence in YYYY-MM-DD format. Omit this field if the recurrence is indefinite or no end date is specified by the user.",
        },
        daysOfWeek: {
            type: Type.ARRAY,
            description: "For weekly recurrences, an array of numbers representing days of the week (0=Sunday, 1=Monday, ... 6=Saturday).",
            items: {
                type: Type.INTEGER
            }
        }
      },
      required: ['frequency', 'interval']
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