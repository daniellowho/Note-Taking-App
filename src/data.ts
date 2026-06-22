import { Note, Task, HighlightItem, UpcomingPriority } from "./types";

// User profiles hotlinked from screenshots
export const PROFILE_ME = "https://lh3.googleusercontent.com/aida-public/AB6AXuD5weVX2ORZSXMNnQlltB8VSoUd-TCHkxWygVKKwgJkGWBmqoBCii6hYNQxybFLaFg7BEhac_leHRFJlMl0EmQ9h4BjBgCiikd6hY4MTF-u_-NDOLTA3wY9KIEMjddbXwIysxB97lp4dFwDPsmvVA1hxuWyLh6_V-18Ea5E8iNqKQe8hH5JFsOAr6zy5TcOqlcdoShkAC-y1678sI9o_PG0IVaFqmmm8kSHKXnMRadWfCQxXroGVgcE54YszGD2OiVc7FG5aLdLSqY";
export const PROFILE_USER_2 = "https://lh3.googleusercontent.com/aida-public/AB6AXuDlgxAyTE-m-gNWVxRs_dxB-LA52POpEJOx39S8o2ZU9uYsu4AS-_8YsvyCkWs6p73hnIs-YX-XUx9HMtM5bGU5L6IDvwqrh_eHY0GcK0UGyQ9GdOyFWJv1h6X1-E_MwjTXxZuzoupBXpeUXYbFIdcwkjw1uKw2cvOGRyFHTDIY0-kI7nl1-jwZNqACgK9_uwRgyh1RKuzRI8c0ELcwnAZnVgBZEI6IGp662tkJJfNibxRZqQv3-ozb7-yD7VHiqO_HBcgdwFXSfMI";
export const PROFILE_USER_3 = "https://lh3.googleusercontent.com/aida-public/AB6AXuD8sRcFDwpZTgju6zOxFE9Iqj3TCOZtDQPQg9oLoV995k94v0uc84Haw2-gtONR2TXDcGti97TBFdx817hpE0N4ugvh17ru2GQocrdtTbpZaHgMFR4TyjzOPLkTOewa7x8IamFHbUpDo9aGJHjPdwbM5EEykK36BDuVWfkhelwvoQWcsGKOul9LvfaFVMtteLGgzagK2lPriNKtg_tXXfrCC4ntnDpdANlAc0-bnGin-mLr79eDvx9Nnz8HQIsxK5QcB44cwMg0WIo";
export const PROFILE_USER_4 = "https://lh3.googleusercontent.com/aida-public/AB6AXuBaIU6idMyH56b_rt3KClA-ecKYX6Ezw008BYBIsXlIICPK4sTUgEgY7n7ifRDe-2THsye3_lBgt4ABo6ZMdQn8rWtQCbiksZoOiNQ7urNxV9uK8cwPdZqW7IJpSaaIy0PRP45VgI6FWtvX-aixBDsooGdJZdVFjuTH6piKOmRwzvW-yM58-0j3o-qYBf4uMmYpBSRG-xs5YCQyXgU6rD0iZWil6cxXiAtstk2PaugwZwFgqZpR5JzZUY2IpKJX75Pd7vkljS7PWc4";
export const PROFILE_USER_5 = "https://lh3.googleusercontent.com/aida-public/AB6AXuDegFpOtnqNqunTw67nKL8RdUIPWfjIz7s5E0RThmAjkAv0M1MepNS53_IBR3TM6DnOrA2gFnLl827T3yGnTIQnW9CRbdcmEQS7qhBC1wCjP81Ty-mrmPpeQWjiIYZ5F_L58kywL7tipRpkOhA2vv1n7_gzGZxIC6anWu_8zylSUcS_u8kwj812Poy6IrfbPs6OkciY9c_wDLBzqha-cB_1dlucyhH0a-pQu1cxrfqRCUMdLEVdkXWZHhyGYD2uHV_7MTPbpnavVKg";

// Aesthetic image vectors
export const ILLUSTRATION_WORKSPACE = "https://lh3.googleusercontent.com/aida-public/AB6AXuAp3V3rMtleR7O4m8Sxrz35RgGn0gSzjOu7b3cl0Vol1GZ2bjdJtnnb7ubSUuX5knTyxxmgx8SRBmMcKaJ_MXvnwV3HHDyc4z4yZEK8gGc2IRpX84ALfqeRvrZD2aYd2OmNm3qpncck1tDXNgksSAdu03nHLdrNs_9MaT1KwWjY6ZcyvMwmev8ebah8upcLSIaw7cD4c33GcPkHV-Nz30jDuVCW5RrNIZiNO5BsDKFJc5y1gFgsFJB43J0LfDm-NHLvwiO6yWiWcYw";
export const IMAGE_OFFICE_REF = "https://lh3.googleusercontent.com/aida-public/AB6AXuDnBy1W9QT-U2AyweRL1wb-em88z6_WCz6CalVIqro40M1l3g_3EiljEcu6TaBXDMzy7Ex-LUIT4CRFzCqsCBm9ShWZs61Q8WRYQ3P28ZKT447oko8wX_vroel0UYdWPHo3aSkOFmKpa9QxTJUuihXuTVVisZ_p_kdqdfVYOrpFt7FjefKvEsY3WWrzHvfX--r5nzklRSIEGbRbyQhxDqNs8ESPAizARnxAqkgc_msbeKYCia-3RJtlNBo02TW72_tRZvOOhtsLuAI";

export const INITIAL_NOTES: Note[] = [
  {
    id: "note-1",
    title: "Q4 Growth Roadmap and Resource Allocation",
    content: `Our primary focus for the upcoming quarter is transitioning from high-energy gamified triggers to a more sophisticated workspace environment. This shift aims to support long-term productivity and user focus through "calm productivity" principles.

Key pillars include:
* Reducing cognitive load through generous whitespace.
* Utilizing tonal layering instead of heavy drop shadows.
* Implementing a 1280px container to reduce eye-travel fatigue on desktop.

The design system must emphasize tactile softness. We want users to feel empowered and in control, rather than rushed by urgent notifications or high-contrast UI elements. Initial projections suggest a 15% increase in user focus when utilizing the calm productivity palette. We need to finalize the allocation of our primary green assets across the new vertical to keep timelines green.`,
    category: "Strategy",
    date: "2 hours ago",
    pinned: false,
    collaborators: [PROFILE_USER_2, PROFILE_USER_3],
    tags: ["Strategy", "System", "Milestone"],
    aiSummary: `* Strategy Shift: Transitioning from high-energy gamified triggers to a calm, sophisticated workspace environment.\n* Key Architecture: Focusing on generous negative space, tonal layering, and comfortable 1280px desktop containers.\n* Asset Allocation: Finalizing green marketing assets for the upcoming Q4 verticals will yield a projected 15% increase in focus duration.`
  },
  {
    id: "note-2",
    title: "Weekly Sync Notes",
    content: "Reviewing the soft minimalism guidelines for the new dashboard component. Focus on breathing room and micro-shadows. The team needs to simplify user operations in the custom text tools panel, ensuring that essential configurations are always 1-click away while secondary elements map to context drawers.",
    category: "Draft",
    date: "Yesterday",
    pinned: true,
    collaborators: [],
    tags: ["Design", "Guidelines", "Sync"],
    source: "typed",
    aiSummary: `* Minimalism Theme: Adopted soft minimalism visual rules centering substantial margins.\n* Dashboard Upgrades: Streamlined text widget behaviors by routing high-density parameters into animated context folders.`
  },
  {
    id: "note-3",
    title: "Project Aurora Feedback",
    content: "Client requested softer transitions and warmer cream tones in the main container. They emphasized that high contrast transitions feel jarring on desktop grids. We should update the animation speeds in our react hooks to range between 150-300ms.",
    category: "Urgent",
    date: "Yesterday",
    pinned: false,
    collaborators: [PROFILE_USER_4],
    tags: ["Project Aurora", "Client-Feedback", "Framer-Motion"],
    source: "typed",
    aiSummary: `* Transitions Update: Client requested softer transitions and warmer cream tones in the container.\n* Motion Timing: Update animation speeds to 150-300ms to reduce desktop grid jarring.`
  },
  {
    id: "note-4",
    title: "AI Summary Integration",
    content: "Explore how Nova AI can highlight key action items from voice memos. We will construct server bridges to analyze incoming voice recording transcripts and render them in a clean highlights drawer.",
    category: "Idea",
    date: "3 days ago",
    pinned: false,
    collaborators: [],
    tags: ["AI", "Voice", "Feature", "Transcript"],
    source: "voice",
    duration: "02:15",
    aiSummary: `* Voice Features: Exploring method for Nova AI to emphasize core action bullets from spoken memos.\n* Strategic Integration: Develop dedicated backend streams to parse transcript data and populate highlights.`
  }
];

export const INITIAL_TASKS: Task[] = [
  {
    id: "task-1",
    title: "Review Nova Notes UI design tokens",
    completed: true,
    priority: "high",
    dueDate: "Today",
    dueTime: "09:30 AM",
    description: "Align Tailwind variables with calm system requirements.",
    category: "Work",
    estimatedDuration: "45 mins",
    pinned: true
  },
  {
    id: "task-2",
    title: "Complete Q4 focus group audio transcription",
    completed: false,
    priority: "high",
    dueDate: "Today",
    dueTime: "02:00 PM",
    description: "Convert recorded voice sessions to structured strategy notes.",
    category: "Work",
    estimatedDuration: "90 mins",
    pinned: true,
    reminderActive: true,
    reminderTime: "01:30 PM"
  },
  {
    id: "task-3",
    title: "Resolve local file lag in server.ts",
    completed: false,
    priority: "medium",
    dueDate: "Yesterday", // Overdue!
    dueTime: "04:00 PM",
    description: "Optimize middleware delay loops to prevent preview freezing.",
    category: "Work",
    estimatedDuration: "60 mins"
  },
  {
    id: "task-4",
    title: "Review typography and contrast scaling rules",
    completed: false,
    priority: "low",
    dueDate: "Tomorrow",
    dueTime: "11:00 AM",
    description: "Double check text size accessibility ratios for low contrast users.",
    category: "School",
    estimatedDuration: "30 mins"
  },
  {
    id: "task-5",
    title: "Audit personal data security rules",
    completed: false,
    priority: "medium",
    dueDate: "In 2 Days",
    dueTime: "03:00 PM",
    description: "Document local storage fallbacks and server safety layers.",
    category: "Personal",
    estimatedDuration: "120 mins"
  }
];

export const HIGHLIGHTS_DATA: HighlightItem[] = [
  {
    id: "hl-1",
    title: "Project Nova Launch",
    description: "The AI identified 3 critical tasks remaining for Friday's deployment. Most notes focus on API optimization.",
    icon: "lightbulb"
  },
  {
    id: "hl-2",
    title: "Productivity Peak",
    description: "Your peak focus time yesterday was between 10 AM and 1 PM. 4 major documents were synthesized completely.",
    icon: "trending_up"
  }
];

export const UPCOMING_PRIORITIES: UpcomingPriority[] = [
  {
    id: "up-1",
    title: "Stakeholder Sync",
    description: "Room 402 or Zoom Link",
    timeLabel: "In 2 Hours",
    isUrgent: true,
    avatarUrls: [PROFILE_USER_2, PROFILE_USER_3],
  },
  {
    id: "up-2",
    title: "Design Review",
    description: "Main Design Board",
    timeLabel: "Tomorrow",
    attachmentsCount: 3
  }
];
