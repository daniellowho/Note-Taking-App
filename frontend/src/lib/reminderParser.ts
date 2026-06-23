/**
 * Natural language helper to recognize dates, days, and times for automatic reminders.
 * Supports parsing both typed and voice transcribing speech streams.
 */
export interface ParsedReminderResult {
  recognized: boolean;
  timeLabel: string;
}

export function parseReminderDetails(text: string): ParsedReminderResult {
  const lowercase = text.toLowerCase();
  
  // 1. Check relative days
  if (lowercase.includes("tomorrow at")) {
    const timeMatch = lowercase.match(/tomorrow at\s*(\d+(?::\d+)?\s*(?:am|pm|am|pm)?)/i);
    return {
      recognized: true,
      timeLabel: `Tomorrow at ${timeMatch ? timeMatch[1].toUpperCase() : "9:00 AM"}`
    };
  }
  if (lowercase.includes("tomorrow")) {
    return { recognized: true, timeLabel: "Tomorrow at 9:00 AM" };
  }
  if (lowercase.includes("today at")) {
    const timeMatch = lowercase.match(/today at\s*(\d+(?::\d+)?\s*(?:am|pm)?)/i);
    return {
      recognized: true,
      timeLabel: `Today at ${timeMatch ? timeMatch[1].toUpperCase() : "5:00 PM"}`
    };
  }
  if (lowercase.includes("tonight")) {
    return { recognized: true, timeLabel: "Tonight at 8:00 PM" };
  }
  if (lowercase.includes("this evening")) {
    return { recognized: true, timeLabel: "This evening at 6:00 PM" };
  }
  
  // 2. Specific Days of the Week
  const days = ["sunday", "monday", "tuesday", "wednesday", "thursday", "friday", "saturday"];
  const dayAbbrevs: Record<string, string> = {
    "mon": "Monday",
    "tue": "Tuesday",
    "wed": "Wednesday",
    "thu": "Thursday",
    "fri": "Friday",
    "sat": "Saturday",
    "sun": "Sunday"
  };

  for (const day of days) {
    if (lowercase.includes(`on ${day}`) || lowercase.includes(`next ${day}`) || lowercase.includes(day)) {
      const timeMatch = lowercase.match(new RegExp(`${day}\\s*(?:at)?\\s*(\\d+(?::\\d+)?\\s*(?:am|pm)?)`, "i"));
      const dayCapitalized = day.charAt(0).toUpperCase() + day.slice(1);
      return {
        recognized: true,
        timeLabel: `${dayCapitalized} at ${timeMatch ? timeMatch[1].toUpperCase() : "10:00 AM"}`
      };
    }
  }

  // Check abbreviated days
  for (const [abbrev, fullName] of Object.entries(dayAbbrevs)) {
    const regex = new RegExp(`\\b${abbrev}\\b`, "i");
    if (regex.test(lowercase)) {
      const timeMatch = lowercase.match(new RegExp(`\\b${abbrev}\\b\\s*(?:at)?\\s*(\\d+(?::\\d+)?\\s*(?:am|pm)?)`, "i"));
      return {
        recognized: true,
        timeLabel: `${fullName} at ${timeMatch ? timeMatch[1].toUpperCase() : "10:00 AM"}`
      };
    }
  }

  // 3. Match generic times like "at 3 pm" or "at 5:30 pm"
  const genericTimeMatch = lowercase.match(/at\s*(\d+(?::\d+)?\s*(?:am|pm))/i);
  if (genericTimeMatch) {
    return {
      recognized: true,
      timeLabel: `Today at ${genericTimeMatch[1].toUpperCase()}`
    };
  }

  // 4. Match specific dates like "on June 18th" or "on June 18" or "on 18th June"
  const monthRegex = /on\s*(january|february|march|april|may|june|july|august|september|october|november|december|jan|feb|mar|apr|may|jun|jul|aug|sep|oct|nov|dec)\s*(\d+(?:st|nd|rd|th)?)/i;
  const monthMatch = lowercase.match(monthRegex);
  if (monthMatch) {
    const month = monthMatch[1].charAt(0).toUpperCase() + monthMatch[1].slice(1).toLowerCase();
    const dayNumeric = monthMatch[2].replace(/(st|nd|rd|th)/, "");
    return {
      recognized: true,
      timeLabel: `${month} ${dayNumeric} at 12:00 PM`
    };
  }
  
  // Default fallback if marked as Reminder or Event category but no specific date found
  return { recognized: true, timeLabel: "Tomorrow at 9:00 AM" };
}
