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

const API_BASE_URL = 'https://rainbow-gumption-2fc85c.netlify.app';

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

const schema = {
  type: "OBJECT",
  properties: {
    title: { type: "STRING", description: "The title of the task." },
    description: { type: "STRING", description: "A detailed description of the task." },
    startTime: { type: "STRING", description: "The start time of the task in UTC ISO 8601 format." },
    endTime: { type: "STRING", description: "The optional end time of the task in UTC ISO 8601 format." },
    category: {
      type: "STRING",
      enum: Object.values(TaskCategory),
      description: `The category of the task. Must be one of: ${Object.values(TaskCategory).join(', ')}.`,
    },
    priority: {
      type: "STRING",
      enum: Object.values(TaskPriority),
      description: `The priority of the task. Must be one of: ${Object.values(TaskPriority).join(', ')}.`,
    },
    subtasks: {
      type: "ARRAY",
      description: "A list of sub-tasks or checklist items derived from the main description.",
      items: {
        type: "OBJECT",
        properties: {
          text: { type: "STRING", description: "The content of the sub-task." },
          completed: { type: "BOOLEAN", description: "Whether the sub-task is completed. Always defaults to false during parsing." }
        },
        required: ['text']
      }
    },
    recurring: {
      type: "OBJECT",
      description: "Information about the task's recurrence, if any.",
      properties: {
        frequency: {
          type: "STRING",
          enum: Object.values(RecurrenceFrequency),
          description: `The frequency of recurrence. Must be one of: ${Object.values(RecurrenceFrequency).join(', ')}.`,
        },
        interval: {
          type: "INTEGER",
          description: "The interval of recurrence, e.g., every 2 days. Defaults to 1.",
        },
        endDate: {
          type: "STRING",
          description: "The optional end date for the recurrence in YYYY-MM-DD format. Omit this field if the recurrence is indefinite or no end date is specified by the user.",
        },
        daysOfWeek: {
            type: "ARRAY",
            description: "For weekly recurrences, an array of numbers representing days of the week (0=Sunday, 1=Monday, ... 6=Saturday).",
            items: {
                type: "INTEGER"
            }
        }
      },
      required: ['frequency', 'interval']
    }
  },
  required: ['title', 'description', 'startTime', 'category', 'priority'],
};

const buildPrompt = (text: string) => `You are an intelligent task parsing assistant. Your role is to analyze user-provided text and convert it into a structured JSON object.
- **CONTEXT**: The user is in timezone ${timezoneString}. The current local time for the user is ${localTimeString}.
- **CRITICAL OUTPUT FORMAT**: You MUST output a valid JSON object that adheres to the provided schema. Do not output any other text, explanations, or markdown backticks. Just the raw JSON object.
- **SCHEMA**: ${JSON.stringify(schema)}
- **RULES**:
  - For 'startTime' and 'endTime', provide the full date and time in UTC ISO 8601 format (YYYY-MM-DDTHH:mm:ss.sssZ).
  - If the user specifies a time without a date (e.g., "at 2pm"), assume it's for today unless specified otherwise.
  - If no specific time is mentioned for a task on a certain day (e.g., "report due Friday"), treat it as an all-day event by setting the time to T00:00:00.000Z for the user's local date, and then converting that start-of-day timestamp to UTC.
  - If no description is provided, use the task title as the description.
  - If the user provides a checklist or a list of items, parse them into the 'subtasks' array.
  - If a weekly recurrence specifies certain days (e.g., "every Monday and Wednesday"), populate the 'daysOfWeek' array with numbers (Sunday=0, ..., Saturday=6).

---
Parse the following task: "${text}"`;


export const parseTaskFromText = async (text: string): Promise<NewTaskPayload> => {
  const apiKey = getApiKey();
  if (!apiKey) {
    throw new Error("Gemini API key not set. Please add your key in the Settings page.");
  }
  
  const model = 'gemini-2.5-flash';
  const url = `${API_BASE_URL}/v1/models/${model}:generateContent?key=${apiKey}`;
  const prompt = buildPrompt(text);

  try {
    const fetchResponse = await fetch(url, {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          contents: [{
            parts: [{ text: prompt }]
          }]
        })
    });

    if (!fetchResponse.ok) {
        const errorData = await fetchResponse.json();
        console.error("API Error:", errorData);
        if (errorData.error?.message.includes('API key not valid')) {
            throw new Error("Your Gemini API key is invalid. Please check it in the Settings page.");
        }
        throw new Error(errorData.error?.message || `API request failed with status ${fetchResponse.status}`);
    }

    const responseData = await fetchResponse.json();
    const responseText = responseData.candidates?.[0]?.content?.parts?.[0]?.text;

    if (!responseText) {
        throw new Error("Received an empty or invalid response from the AI. This might be due to a content safety filter.");
    }
    
    // Handle markdown-wrapped JSON responses
    let jsonText = responseText.trim();
    const jsonMatch = jsonText.match(/```(?:json)?\s*([\s\S]*?)```/);
    if (jsonMatch) {
        jsonText = jsonMatch[1].trim();
    }

    const parsed = JSON.parse(jsonText);

    // Basic validation
    if (typeof parsed.title !== 'string' || typeof parsed.startTime !== 'string') {
        throw new Error("AI response is missing required fields or has incorrect types.");
    }

    // Ensure category and priority are valid enum values
    if (!Object.values(TaskCategory).includes(parsed.category)) {
      parsed.category = TaskCategory.OTHER;
    }
    if (!Object.values(TaskPriority).includes(parsed.priority)) {
      parsed.priority = TaskPriority.MEDIUM;
    }
    
    // Ensure subtasks are correctly formatted
    if (parsed.subtasks && Array.isArray(parsed.subtasks)) {
      parsed.subtasks = parsed.subtasks.map((st: any) => ({ text: st.text || '', completed: false })).filter((st:any) => st.text);
    }

    return parsed as NewTaskPayload;
  } catch (error: any) {
    console.error("Error parsing task with Gemini:", error);
    if (error.message && (error.message.includes('API key') || error.message.includes('invalid'))) {
       throw new Error("Your Gemini API key is invalid. Please check it in the Settings page.");
    }
    throw new Error(`Could not understand the task. Please try rephrasing. Details: ${error.message}`);
  }
};
