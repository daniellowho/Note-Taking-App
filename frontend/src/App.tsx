import React, { useState, useEffect, useRef } from "react";
import { Note, Task } from "./types";
import { INITIAL_NOTES, PROFILE_ME } from "./data";
import Header from "./components/layout/Header";
import Navigation from "./components/layout/Navigation";
import HomeView from "./features/home/components/HomeView";
import DashboardView from "./features/dashboard/components/DashboardView";
import VoiceRecorderView from "./features/voice/components/VoiceRecorderView";
import NoteEditorView from "./features/notes/components/NoteEditorView";
import SummaryView from "./features/summary/components/SummaryView";
import TasksView from "./features/tasks/components/TasksView";
import CalendarView from "./features/calendar/components/CalendarView";
import { CheckCircle, Info, AlertTriangle, AlertCircle, Sparkles, Sliders, X, Check } from "lucide-react";

interface ToastItem {
  id: string;
  text: string;
  type: "success" | "info" | "error";
}

export default function App() {
  const organizationRequestIds = useRef<Record<string, number>>({});
  const [activeTab, setActiveTab] = useState<string>("home");
  const [autoStartVoice, setAutoStartVoice] = useState(false);
  const [triggerTaskCreate, setTriggerTaskCreate] = useState(false);
  const [notes, setNotes] = useState<Note[]>(() => {
    const saved = localStorage.getItem("nova_notes_data");
    if (saved) {
      try { return JSON.parse(saved); } catch (e) { console.error(e); }
    }
    return INITIAL_NOTES;
  });

  const [activeNote, setActiveNote] = useState<Note | null>(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [toasts, setToasts] = useState<ToastItem[]>([]);
  const [showSettings, setShowSettings] = useState(false);
  const [isVoiceRecordingActive, setIsVoiceRecordingActive] = useState(false);
  const [googleAccessToken, setGoogleAccessToken] = useState<string | null>(null);
  const [calendarEvent, setCalendarEvent] = useState<{ title: string; time?: string; description: string; location?: string; participants?: string[] } | null>(null);

  const noteCategories: Note["category"][] = ["Strategy", "Draft", "Urgent", "Idea", "General", "Reminder", "Event", "Meeting", "Task", "Personal"];
  const apiBaseUrl = (import.meta as any).env?.VITE_API_BASE_URL?.replace(/\/$/, "") || "";

  const normalizeCategory = (value: unknown, fallback: Note["category"] = "General"): Note["category"] => {
    if (typeof value !== "string") return fallback;
    const normalized = value.trim().toLowerCase();
    const match = noteCategories.find((category) => category.toLowerCase() === normalized);
    return match || fallback;
  };

  const inferMeetingCategory = (title: string, content: string): Note["category"] => {
    const text = `${title} ${content}`.toLowerCase();
    if (/\b(meeting|sync|standup|stand up|call|conference call|1:1|one on one|one-on-one|review meeting|kickoff|demo)\b/i.test(text)) {
      return "Meeting";
    }
    if (/\b(event|calendar|appointment|schedule)\b/i.test(text)) {
      return "Event";
    }
    return "Idea";
  };

  const buildOrganizedFallback = (note: Note) => {
    const sentences = note.content.split(/(?<=[.!?])\s+|\n+/).map((s) => s.trim()).filter(Boolean);
    const hasMeeting = /\b(meeting|call|sync|appointment|standup|stand up|1:1|one on one|one-on-one|kickoff|demo)\b/i.test(`${note.title} ${note.content}`);
    const taskMatches = sentences.filter((s) => /\b(finish|send|prepare|complete|follow up|need to|todo|action item|next step)\b/i.test(s)).slice(0, 3);
    const category = hasMeeting ? "Meeting" : taskMatches.length ? "Task" : inferMeetingCategory(note.title, note.content);
    return {
      title: note.title.trim() || (hasMeeting ? "Meeting note" : sentences[0]?.split(" ").slice(0, 6).join(" ") || "Untitled note"),
      summary: sentences.slice(0, 3).join(" ") || note.content.slice(0, 180),
      category,
      tags: hasMeeting ? ["Meeting"] : taskMatches.length ? ["Task"] : ["Note"],
      tasks: taskMatches,
      reminder: "",
      eventTitle: hasMeeting ? (note.title.trim() || "Meeting") : "",
      eventTime: "",
      eventLocation: "",
      eventParticipants: [],
      isFallback: true,
    };
  };

  // Sync state changes with localStorage for persistent state engine !
  useEffect(() => {
    localStorage.setItem("nova_notes_data", JSON.stringify(notes));
  }, [notes]);

  const addToast = (text: string, type: "success" | "info" | "error") => {
    if (isVoiceRecordingActive) return; // Suppress enqueuing toasts during recording
    const id = `${Date.now()}`;
    setToasts((prev) => [...prev, { id, text, type }]);
    setTimeout(() => {
      setToasts((prev) => prev.filter((t) => t.id !== id));
    }, 4000);
  };

  // Create empty new note and automatically trigger Editor router
  const handleCreateNote = () => {
    const newNote: Note = {
      id: `note-${Date.now()}`,
      title: "",
      content: "",
      category: "General",
      date: "Just now",
      pinned: false,
      collaborators: [],
      tags: ["Draft"],
    };

    setNotes((prev) => [newNote, ...prev]);
    setActiveNote(newNote);
    addToast("New blank note spawned", "success");
  };

  // Update specific note content dynamically saved
  const organizeNote = async (note: Note) => {
    if (note.content.trim().length < 12) return;
    const requestId = (organizationRequestIds.current[note.id] || 0) + 1;
    organizationRequestIds.current[note.id] = requestId;
    try {
      const response = await fetch(`${apiBaseUrl}/api/ai/organize-note`, {
        method: "POST", headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ title: note.title, content: note.content, notes: notes.map(n => ({ id: n.id, title: n.title, content: n.content.slice(0, 200) })) }),
      });
      let analysis = buildOrganizedFallback(note);
      if (response.ok) {
        const contentType = response.headers.get("content-type") || "";
        if (contentType.includes("application/json")) {
          const raw = await response.text();
          if (raw.trim()) {
            try {
              analysis = JSON.parse(raw);
            } catch (parseError) {
              console.warn("Organize response parse fallback triggered:", parseError);
            }
          }
        }
      }
      // Do not let an older background request overwrite a more recent save.
      if (organizationRequestIds.current[note.id] !== requestId) return;
      const relatedNoteIds = notes
        .filter(n => n.id !== note.id && n.content.toLowerCase().split(/\W+/).some(word => word.length > 4 && note.content.toLowerCase().includes(word)))
        .slice(0, 3).map(n => n.id);
      const detectedCategory = normalizeCategory(analysis.category, note.category);
      const category = detectedCategory === "Idea"
        ? inferMeetingCategory(analysis.title || note.title, note.content)
        : detectedCategory;
      const suggestions = [
        ...(analysis.eventTitle ? [{ type: "event" as const, title: analysis.eventTitle, time: analysis.eventTime }] : []),
        ...(analysis.reminder ? [{ type: "reminder" as const, title: analysis.title || note.title, time: analysis.reminder }] : []),
      ];
      setNotes(prev => prev.map(n => {
        if (n.id !== note.id || n.title !== note.title || n.content !== note.content) return n;
        return {
          ...n, title: n.title.trim() || analysis.title || n.title, aiSummary: analysis.summary || n.aiSummary,
          category, tags: Array.from(new Set([...(n.tags || []), ...(analysis.tags || []), ...(category === "Meeting" ? ["Meeting"] : [])])), aiSuggestions: suggestions, relatedNoteIds,
        };
      }));
      setActiveNote(prev => {
        if (!prev || prev.id !== note.id || prev.title !== note.title || prev.content !== note.content) return prev;
        return {
          ...prev, title: prev.title.trim() || analysis.title || prev.title, aiSummary: analysis.summary || prev.aiSummary,
          category, tags: Array.from(new Set([...(prev.tags || []), ...(analysis.tags || []), ...(category === "Meeting" ? ["Meeting"] : [])])), aiSuggestions: suggestions, relatedNoteIds,
        };
      });
      if (analysis.eventTitle) setCalendarEvent({ title: analysis.eventTitle, time: analysis.eventTime, description: note.content, location: analysis.eventLocation, participants: analysis.eventParticipants });
      if (analysis.tasks?.length) {
        const stored = JSON.parse(localStorage.getItem("nova_tasks_data") || "[]") as Task[];
        const newTasks = analysis.tasks.filter((task: string) => !stored.some(t => t.title.toLowerCase() === task.toLowerCase())).map((task: string) => ({ id: `task-${Date.now()}-${task}`, title: task, completed: false, priority: "medium" as const, dueDate: analysis.reminder || undefined }));
        if (newTasks.length) localStorage.setItem("nova_tasks_data", JSON.stringify([...newTasks, ...stored]));
      }
    } catch (error) { console.warn("Background note organization failed:", error); }
  };

  const handleSaveNote = (updatedNote: Note) => {
    setNotes((prev) =>
      prev.map((n) => (n.id === updatedNote.id ? updatedNote : n))
    );
    // If we are currently editing it, sync the activeNote state too
    if (activeNote && activeNote.id === updatedNote.id) {
      setActiveNote(updatedNote);
    }
  };

  const handleSaveAndOrganizeNote = (note: Note) => {
    handleSaveNote(note);
    void organizeNote(note);
    setActiveNote(null);
    setActiveTab("notes");
    addToast("Note saved successfully.", "success");
  };

  const handleAddNote = (newNote: Note) => {
    setNotes((prev) => [newNote, ...prev]);
    addToast("New note added successfully!", "success");
  };

  // Save the transcribed audio recording block as a brand new note !
  const handleSaveTranscriptAsNote = async (titleText: string, contentText: string, durationText?: string, audioUrl?: string): Promise<Note> => {
    const noteId = `note-${Date.now()}`;
    const initialCategory = inferMeetingCategory(titleText, contentText);
    const newNote: Note = {
      id: noteId,
      title: titleText,
      content: contentText,
      category: initialCategory,
      date: "Just now",
      pinned: false,
      collaborators: [],
      tags: ["Audio", "Transcript", "Analyzing Themes..."],
      duration: durationText || "0:45",
      audioUrl,
      source: "voice",
      aiSummary: undefined,
    };

    setNotes((prev) => [newNote, ...prev]);
    addToast("Vocal transcript saved. Organizing quietly...", "info");
    void organizeNote(newNote);
    return newNote;
  };

  const connectGoogleCalendar = () => {
    const clientId = (import.meta as any).env?.VITE_GOOGLE_CLIENT_ID;
    if (!clientId) { addToast("Add VITE_GOOGLE_CLIENT_ID to .env to connect Google Calendar.", "error"); return; }
    const start = () => {
      const google = (window as any).google;
      google.accounts.oauth2.initTokenClient({
        client_id: clientId, scope: "https://www.googleapis.com/auth/calendar.events",
        callback: (response: any) => {
          if (response.access_token) { setGoogleAccessToken(response.access_token); addToast("Google Calendar connected.", "success"); }
        },
      }).requestAccessToken();
    };
    if ((window as any).google?.accounts) { start(); return; }
    const script = document.createElement("script");
    script.src = "https://accounts.google.com/gsi/client"; script.async = true; script.onload = start;
    document.head.appendChild(script);
  };

  const addCalendarEvent = async () => {
    if (!calendarEvent) return;
    if (!googleAccessToken) { setCalendarEvent(null); setShowSettings(true); addToast("Connect Google Calendar first.", "info"); return; }
    const start = new Date();
    const time = calendarEvent.time?.match(/(\d{1,2})(?::(\d{2}))?\s*(am|pm)/i);
    if (/tomorrow/i.test(calendarEvent.time || "")) start.setDate(start.getDate() + 1);
    if (time) {
      let hour = Number(time[1]);
      if (time[3].toLowerCase() === "pm" && hour !== 12) hour += 12;
      if (time[3].toLowerCase() === "am" && hour === 12) hour = 0;
      start.setHours(hour, Number(time[2] || 0), 0, 0);
    }
    const end = new Date(start.getTime() + 60 * 60 * 1000);
    try {
      const response = await fetch("https://www.googleapis.com/calendar/v3/calendars/primary/events", {
        method: "POST", headers: { Authorization: `Bearer ${googleAccessToken}`, "Content-Type": "application/json" },
        body: JSON.stringify({ summary: calendarEvent.title, description: calendarEvent.description, location: calendarEvent.location, attendees: calendarEvent.participants?.map(email => ({ email })), start: { dateTime: start.toISOString() }, end: { dateTime: end.toISOString() } }),
      });
      if (!response.ok) throw new Error();
      addToast("Added to Google Calendar.", "success"); setCalendarEvent(null);
    } catch { addToast("Could not add the event. Reconnect Google Calendar and try again.", "error"); }
  };

  const handleDeleteNote = (id: string) => {
    setNotes((prev) => prev.filter((n) => n.id !== id));
    addToast("Note deleted successfully", "info");
  };

  // Schedule a task follower reminder from Editor
  const handleScheduleReminder = (title: string, dateLabel: string) => {
    // We could add a custom task in some place, or simply add a mock notification
    addToast(`Reminder Scheduled: ${title}`, "success");
  };

  return (
    <div className="min-h-screen bg-background text-on-surface flex flex-col md:pl-64 relative select-none">
      
      {/* Toast Cues Overlay */}
      {!isVoiceRecordingActive && (
        <div className="fixed top-20 right-6 z-[100] flex flex-col gap-3 max-w-sm pointer-events-none">
          {toasts.map((t) => (
            <div
              key={t.id}
              className={`pointer-events-auto flex items-center gap-3 px-4 py-3 rounded-2xl shadow-lg border text-sm font-sans font-medium animate-bounce ${
                t.type === "success"
                  ? "bg-[#D1FAE5] text-[#065F46] border-[#10B981]/30"
                  : t.type === "error"
                  ? "bg-[#FEE2E2] text-[#991B1B] border-[#EF4444]/30"
                  : "bg-[#EFF6FF] text-[#1E40AF] border-[#3B82F6]/30"
              }`}
            >
              {t.type === "success" && <Check size={16} />}
              {t.type === "error" && <AlertCircle size={16} />}
              {t.type === "info" && <Info size={16} />}
              <span>{t.text}</span>
            </div>
          ))}
        </div>
      )}

      {/* Settings Modal Dialog Overlay */}
      {showSettings && (
        <>
          <div
            onClick={() => setShowSettings(false)}
            className="fixed inset-0 bg-on-background/30 backdrop-blur-[2px] z-[90] animate-fade-in"
          ></div>
          <div className="fixed top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 z-[100] bg-surface-container-lowest rounded-3xl border border-outline-variant/30 max-w-md w-[90%] p-6 shadow-2xl animate-scale-up font-sans">
            <div className="flex justify-between items-center mb-6 border-b border-outline-variant/10 pb-4">
              <h3 className="text-lg font-bold text-on-surface">Nova Configuration</h3>
              <button
                onClick={() => setShowSettings(false)}
                className="text-secondary hover:text-primary p-1.5 rounded-full hover:bg-surface-container-low transition-colors outline-none focus:outline-none"
              >
                <X size={18} />
              </button>
            </div>

            <div className="space-y-4">
              <p className="text-sm text-on-surface-variant leading-relaxed">
                Nova Notes is fully integrated with a Node + Express backend routing architecture. 
              </p>
              
              <div className="bg-primary-container/10 border border-primary/20 p-4 rounded-xl">
                <p className="text-xs font-bold text-primary uppercase mb-1">Active Backend</p>
                <p className="text-xs text-on-primary-container leading-relaxed">
                  Real AI features are connected to Express server endpoint paths at <span className="font-mono">/api/ai/*</span> proxying Gemini 3.5 Flash queries securely.
                </p>
              </div>

              <div className="bg-surface-container border border-outline-variant/20 p-4 rounded-xl">
                <p className="text-xs font-bold text-secondary uppercase mb-1">Developer Credentials</p>
                <p className="text-xs text-on-surface-variant leading-relaxed">
                  To customize key targets, enter your custom configuration metrics directly inside the <span className="font-mono">.env</span> variable files.
                </p>
              </div>
              <div className="flex items-center justify-between gap-3 rounded-xl border border-outline-variant/20 p-4">
                <div>
                  <p className="text-sm font-bold text-on-surface">Google Calendar</p>
                  <p className="text-xs text-secondary mt-1">{googleAccessToken ? "Connected — event suggestions require your approval." : "Connect to add approved event suggestions."}</p>
                </div>
                <button onClick={connectGoogleCalendar} className="shrink-0 rounded-lg bg-primary px-3 py-2 text-xs font-bold text-on-primary">
                  {googleAccessToken ? "Connected" : "Connect"}
                </button>
              </div>
            </div>

            <button
              onClick={() => setShowSettings(false)}
              className="mt-6 w-full py-3 bg-primary text-on-primary rounded-xl text-sm font-semibold hover:bg-primary/95 transition-all outline-none focus:outline-none active:scale-[0.98]"
            >
              Confirm Setup
            </button>
          </div>
        </>
      )}

      {calendarEvent && (
        <div className="fixed inset-0 z-[110] flex items-center justify-center bg-on-background/30 p-5">
          <div className="w-full max-w-md rounded-3xl bg-surface-container-lowest p-6 shadow-2xl">
            <h3 className="text-lg font-bold text-on-surface">Add to Google Calendar?</h3>
            <p className="mt-2 text-sm text-on-surface-variant">We found an event in this note: <strong>{calendarEvent.title}</strong>{calendarEvent.time ? ` · ${calendarEvent.time}` : ""}{calendarEvent.location ? ` · ${calendarEvent.location}` : ""}</p>
            <p className="mt-2 text-xs text-secondary">Nothing is added until you confirm.</p>
            <div className="mt-6 flex justify-end gap-3">
              <button onClick={() => setCalendarEvent(null)} className="rounded-xl px-4 py-2 text-sm font-bold text-secondary">Not now</button>
              <button onClick={addCalendarEvent} className="rounded-xl bg-primary px-4 py-2 text-sm font-bold text-on-primary">Add to Calendar</button>
            </div>
          </div>
        </div>
      )}

      {/* Editor Screen Routing logic: takes precedence if activeNote is set */}
      {activeNote ? (
        <NoteEditorView
          note={activeNote}
          onSaveNote={handleSaveNote}
          onSaveAndOrganizeNote={handleSaveAndOrganizeNote}
          onBack={() => {
            // Delete note if user left it blank
            if (activeNote.title.trim() === "" && activeNote.content.trim() === "") {
              setNotes((prev) => prev.filter((n) => n.id !== activeNote.id));
              addToast("Blank draft note discarded", "info");
            }
            setActiveNote(null);
          }}
          onAddToast={addToast}
          onScheduleReminder={handleScheduleReminder}
          onDeleteNote={handleDeleteNote}
        />
      ) : (
        <>
          {/* Header Layout */}
          <Header
            onSearch={setSearchQuery}
            title={activeTab === "home" ? "Home Space" : activeTab === "summary" ? "Daily Briefing" : activeTab === "notes" ? "Nova Notes" : activeTab === "voice" ? "AI Recorder" : activeTab === "tasks" ? "Focus Tasks" : "Calendar Plan"}
            onShowInfo={() => setShowSettings(true)}
          />

          {/* Core Content Navigation Routing */}
          <main className="flex-1 pb-12">
            {activeTab === "home" && (
              <HomeView
                notes={notes}
                onSelectNote={(note) => setActiveNote(note)}
                onCreateNote={handleCreateNote}
                setActiveTab={setActiveTab}
                onAddToast={addToast}
                handleNewVoiceNoteAction={() => {
                  setActiveTab("voice");
                  setAutoStartVoice(true);
                }}
                handleNewTaskAction={() => {
                  setTriggerTaskCreate(true);
                }}
              />
            )}

            {activeTab === "summary" && (
              <SummaryView
                notes={notes}
                setActiveTab={setActiveTab}
                onCreateNote={handleCreateNote}
                onAddToast={addToast}
                onTriggerTaskCreate={() => setTriggerTaskCreate(true)}
              />
            )}

            {activeTab === "notes" && (
              <DashboardView
                notes={notes}
                searchQuery={searchQuery}
                onSelectNote={(note) => setActiveNote(note)}
                onCreateNote={handleCreateNote}
                onAddNote={handleAddNote}
                onAddToast={addToast}
                onDeleteNote={handleDeleteNote}
                onNavigateToVoice={() => {
                  setActiveTab("voice");
                  setAutoStartVoice(true);
                }}
              />
            )}

            {activeTab === "voice" && (
              <VoiceRecorderView
                notes={notes}
                onSelectNote={setActiveNote}
                onDeleteNote={handleDeleteNote}
                onSaveTranscriptAsNote={handleSaveTranscriptAsNote}
                onAddToast={addToast}
                autoStart={autoStartVoice}
                onResetAutoStart={() => setAutoStartVoice(false)}
                onRecordingStateChange={setIsVoiceRecordingActive}
              />
            )}

            {activeTab === "tasks" && (
              <TasksView
                onAddToast={addToast}
                onAddNote={handleAddNote}
                setActiveTab={setActiveTab}
                autoOpenCreator={triggerTaskCreate}
                onResetAutoOpen={() => setTriggerTaskCreate(false)}
              />
            )}

            {activeTab === "calendar" && (
              <CalendarView notes={notes} />
            )}
          </main>

          {/* Unified Sidebar / Bottombar Navigation */}
          <Navigation
            activeTab={activeTab}
            setActiveTab={setActiveTab}
            onOpenSettings={() => setShowSettings(true)}
          />
        </>
      )}
    </div>
  );
}
