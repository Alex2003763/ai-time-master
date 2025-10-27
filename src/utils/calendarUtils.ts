import { Task, NewTaskPayload, RecurrenceFrequency, Recurring, TaskPriority, TaskCategory } from "../types";

// Helper to format a date into the YYYYMMDDTHHMMSSZ format for iCalendar
const toICSDate = (date: Date): string => {
    return date.getUTCFullYear() +
        String(date.getUTCMonth() + 1).padStart(2, '0') +
        String(date.getUTCDate()).padStart(2, '0') +
        'T' +
        String(date.getUTCHours()).padStart(2, '0') +
        String(date.getUTCMinutes()).padStart(2, '0') +
        String(date.getUTCSeconds()).padStart(2, '0') +
        'Z';
};

// Helper to format a date-only value (YYYYMMDD) for all-day events
const toICSDateOnly = (date: Date): string => {
    return date.getUTCFullYear() +
        String(date.getUTCMonth() + 1).padStart(2, '0') +
        String(date.getUTCDate()).padStart(2, '0');
};

const mapPriorityToICal = (priority: TaskPriority): number => {
    switch (priority) {
        case TaskPriority.HIGH: return 1;
        case TaskPriority.MEDIUM: return 5;
        case TaskPriority.LOW: return 9;
        default: return 5;
    }
};

const generateRRule = (recurring: Recurring): string => {
    const { frequency, interval, endDate } = recurring;
    let rule = `FREQ=${frequency.toUpperCase()}`;
    if (interval > 1) {
        rule += `;INTERVAL=${interval}`;
    }
    if (endDate) {
        const untilDate = new Date(endDate);
        // End date in iCal is inclusive, so set to end of day.
        untilDate.setHours(23, 59, 59, 999);
        rule += `;UNTIL=${toICSDate(untilDate)}`;
    }
    return rule;
};


export const generateICS = (tasks: Task[]): string => {
    const icsEvents = tasks.map(task => {
        const startDate = new Date(task.startTime);
        const isAllDay = task.startTime.endsWith('T00:00:00.000Z') && !task.endTime;
        
        let eventString = 'BEGIN:VEVENT\r\n';
        eventString += `UID:${task.id}\r\n`;
        eventString += `DTSTAMP:${toICSDate(new Date())}\r\n`;
        
        if (isAllDay) {
            eventString += `DTSTART;VALUE=DATE:${toICSDateOnly(startDate)}\r\n`;
        } else {
            eventString += `DTSTART:${toICSDate(startDate)}\r\n`;
            if (task.endTime) {
                eventString += `DTEND:${toICSDate(new Date(task.endTime))}\r\n`;
            }
        }
        
        eventString += `SUMMARY:${task.title}\r\n`;
        
        let description = task.description;
        if (task.subtasks && task.subtasks.length > 0) {
            description += '\\n\\nSubtasks:\\n' + task.subtasks.map(st => `- ${st.text}`).join('\\n');
        }
        eventString += `DESCRIPTION:${description.replace(/\n/g, '\\n')}\r\n`;

        eventString += `CATEGORIES:${task.category}\r\n`;
        eventString += `PRIORITY:${mapPriorityToICal(task.priority)}\r\n`;
        
        if (task.recurring) {
            eventString += `RRULE:${generateRRule(task.recurring)}\r\n`;
        }
        
        eventString += 'END:VEVENT\r\n';
        return eventString;
    }).join('');

    return `BEGIN:VCALENDAR\r\nVERSION:2.0\r\nPRODID:-//AI Time Master//EN\r\n${icsEvents}END:VCALENDAR\r\n`;
};


// --- PARSING LOGIC ---

const parseICSToDate = (dateStr: string, isEndDate = false): Date => {
    // Regex to capture date parts and optional time parts
    const match = /^(\d{4})(\d{2})(\d{2})(T(\d{2})(\d{2})(\d{2})(Z)?)?$/.exec(dateStr);
    if (!match) throw new Error(`Invalid date format: ${dateStr}`);
    
    const [, year, month, day, , hour = '00', minute = '00', second = '00', isUTC] = match;

    if (isUTC) {
        const date = new Date(Date.UTC(Number(year), Number(month) - 1, Number(day), Number(hour), Number(minute), Number(second)));
        // For all-day DTEND, iCal is exclusive, so subtract one day
        if (isEndDate && !hour) {
            date.setUTCDate(date.getUTCDate() - 1);
        }
        return date;
    }
    
    // If not UTC, treat as local time and convert
    return new Date(Number(year), Number(month) - 1, Number(day), Number(hour), Number(minute), Number(second));
};


const parseRRule = (rruleStr: string): Recurring => {
    const parts = rruleStr.split(';');
    const rule: Partial<Recurring> & { frequency: RecurrenceFrequency } = { frequency: RecurrenceFrequency.DAILY, interval: 1 };
    
    parts.forEach(part => {
        const [key, value] = part.split('=');
        switch (key.toUpperCase()) {
            case 'FREQ':
                rule.frequency = value.toLowerCase() as RecurrenceFrequency;
                break;
            case 'INTERVAL':
                rule.interval = parseInt(value, 10);
                break;
            case 'UNTIL':
                rule.endDate = parseICSToDate(value).toISOString().split('T')[0];
                break;
        }
    });
    
    return rule as Recurring;
};

const mapICalToPriority = (priority: string | undefined): TaskPriority => {
    const pNum = priority ? parseInt(priority, 10) : 5;
    if (pNum >= 1 && pNum <= 4) return TaskPriority.HIGH;
    if (pNum === 5) return TaskPriority.MEDIUM;
    return TaskPriority.LOW;
};

export const parseICS = (icsContent: string): NewTaskPayload[] => {
    const events: NewTaskPayload[] = [];
    const eventBlocks = icsContent.split('BEGIN:VEVENT');
    
    for (const block of eventBlocks.slice(1)) {
        try {
            const eventData: { [key: string]: string } = {};
            // Unfold lines (lines starting with a space are continuations)
            const unfoldedBlock = block.replace(/\r\n\s/g, '');
            const lines = unfoldedBlock.split(/\r\n/);

            for (const line of lines) {
                const [keyWithParams, ...valueParts] = line.split(':');
                const value = valueParts.join(':');
                const key = keyWithParams.split(';')[0].toUpperCase();
                if (key && value) {
                    eventData[key] = value;
                }
            }

            if (!eventData.SUMMARY || !eventData.DTSTART) {
                continue;
            }

            const startTime = parseICSToDate(eventData.DTSTART).toISOString();
            const endTime = eventData.DTEND ? parseICSToDate(eventData.DTEND, true).toISOString() : undefined;

            const categoryStr = eventData.CATEGORIES?.toUpperCase();
            const category = Object.values(TaskCategory).find(c => c.toUpperCase() === categoryStr) || TaskCategory.OTHER;

            const task: NewTaskPayload = {
                title: eventData.SUMMARY,
                description: eventData.DESCRIPTION?.replace(/\\n/g, '\n') || '',
                startTime,
                endTime,
                category,
                priority: mapICalToPriority(eventData.PRIORITY),
                recurring: eventData.RRULE ? parseRRule(eventData.RRULE) : undefined,
            };
            events.push(task);
        } catch (e) {
            console.warn("Skipping invalid VEVENT block:", e);
        }
    }

    return events;
};
