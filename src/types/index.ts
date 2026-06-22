export interface Note {
  id: string;
  title: string;
  content: string;
  category: 'Strategy' | 'Draft' | 'Urgent' | 'Idea' | 'General' | 'Reminder' | 'Event';
  date: string;
  pinned: boolean;
  collaborators: string[];
  aiSummary?: string;
  tags: string[];
  audioUrl?: string;
  duration?: string;
  source?: 'voice' | 'uploaded' | 'typed';
  reminderTime?: string;
  reminderActive?: boolean;
  aiSuggestions?: Array<{ type: "event" | "reminder"; title: string; time?: string }>;
  relatedNoteIds?: string[];
}

export interface Task {
  id: string;
  title: string;
  completed: boolean;
  priority: "low" | "medium" | "high";
  dueDate?: string; // Relative or date category e.g. "Today", "2026-06-18", etc.
  dueTime?: string; // e.g. "10:30 AM"
  description?: string; // Optional AI one-line briefing description
  category?: "Personal" | "Work" | "School" | "General";
  estimatedDuration?: string; // e.g. "30 mins", "1 hour"
  pinned?: boolean;
  reminderActive?: boolean;
  reminderTime?: string; // e.g. "09:00 AM"
}

export interface HighlightItem {
  id: string;
  title: string;
  description: string;
  icon: 'lightbulb' | 'trending_up' | 'auto_awesome' | 'alarm';
}

export interface UpcomingPriority {
  id: string;
  title: string;
  description: string;
  timeLabel: string;
  isUrgent?: boolean;
  avatarUrls?: string[];
  attachmentsCount?: number;
}
