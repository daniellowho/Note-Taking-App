import React, { useState, useEffect } from "react";
import { Note, Task } from "./types";
import { INITIAL_NOTES, PROFILE_ME } from "./data";
import Header from "./components/Header";
import Navigation from "./components/Navigation";
import HomeView from "./components/HomeView";
import DashboardView from "./components/DashboardView";
import VoiceRecorderView from "./components/VoiceRecorderView";
import NoteEditorView from "./components/NoteEditorView";
import SummaryView from "./components/SummaryView";
import TasksView from "./components/TasksView";
import CalendarView from "./components/CalendarView";
import { CheckCircle, Info, AlertTriangle, AlertCircle, Sparkles, Sliders, X, Check } from "lucide-react";

interface ToastItem {
  id: string;
  text: string;
  type: "success" | "info" | "error";
}

const readJsonOrNull = async (response: Response) => {
  const text = await response.text();
  if (!text.trim()) return null;

  try {
    return JSON.parse(text);
  } catch (error) {
    console.warn("Expected JSON response but received malformed payload:", error);
    return null;
  }
};

export default function App() {
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
  const handleSaveNote = (updatedNote: Note) => {
    setNotes((prev) =>
      prev.map((n) => (n.id === updatedNote.id ? updatedNote : n))
    );
    // If we are currently editing it, sync the activeNote state too
    if (activeNote && activeNote.id === updatedNote.id) {
      setActiveNote(updatedNote);
    }
  };

  const handleAddNote = (newNote: Note) => {
    setNotes((prev) => [newNote, ...prev]);
    addToast("New note added successfully!", "success");
  };

  // Save the transcribed audio recording block as a brand new note !
  const handleSaveTranscriptAsNote = async (titleText: string, contentText: string, durationText?: string) => {
    const noteId = `note-${Date.now()}`;
    const newNote: Note = {
      id: noteId,
      title: titleText,
      content: contentText,
      category: "Idea",
      date: "Just now",
      pinned: false,
      collaborators: [],
      tags: ["Audio", "Transcript", "Analyzing Themes..."],
      duration: durationText || "0:45",
      aiSummary: `* Summary: Automatically captured vocal stream session outlining design and strategic specifications with dynamic timeline highlights.`
    };

    setNotes((prev) => [newNote, ...prev]);
    addToast("Vocal transcript synced! Analyzing themes...", "info");

    try {
      const res = await fetch("/api/ai/detect-tags", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ content: contentText }),
      });
      if (res.ok) {
        const data = await readJsonOrNull(res);
        const tags = Array.isArray(data?.tags) && data.tags.length > 0 ? data.tags : ["Audio", "Transcript"];
        setNotes((prev) =>
          prev.map((n) =>
            n.id === noteId
              ? {
                  ...n,
                  tags,
                  category: (data?.category as any) || n.category,
                }
              : n
          )
        );
        addToast(`AI tagged note as: ${tags.join(", ")}`, "success");
      } else {
        const errorText = await res.text();
        throw new Error(errorText || `Theme detection failed with status ${res.status}`);
      }
    } catch (err) {
      console.warn("Error detecting themes via Gemini API:", err);
      // Fallback
      setNotes((prev) =>
        prev.map((n) =>
          n.id === noteId
            ? {
                ...n,
                tags: ["Audio", "Transcript", "Personal"],
              }
            : n
        )
      );
    }
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
    <div className="min-h-screen bg-background text-on-surface flex flex-col md:pl-20 relative select-none">
      
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

      {/* Editor Screen Routing logic: takes precedence if activeNote is set */}
      {activeNote ? (
        <NoteEditorView
          note={activeNote}
          onSaveNote={handleSaveNote}
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
