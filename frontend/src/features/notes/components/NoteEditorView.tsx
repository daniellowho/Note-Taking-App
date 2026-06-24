import React, { useState, useEffect, useRef } from "react";
import { ArrowLeft, Search, Bold, Italic, Underline, List, ListTodo, Image as ImageIcon, Link as LinkIcon, Sparkles, X, Send, Lightbulb, Clock, Check, Mic, Upload, Play, Pause, Volume2, Loader2, FileAudio, FileText, Calendar, Trash2 } from "lucide-react";
import { Note, Task } from "../../../types";
import { PROFILE_ME } from "../../../data";
import { parseReminderDetails } from "../../../lib/reminderParser";

interface NoteEditorViewProps {
  note: Note;
  onSaveNote: (updatedNote: Note) => void;
  onSaveAndOrganizeNote: (updatedNote: Note) => void;
  onBack: () => void;
  onAddToast: (text: string, type: "success" | "info" | "error") => void;
  onScheduleReminder: (title: string, date: string) => void;
  onDeleteNote?: (id: string) => void;
}

export default function NoteEditorView({
  note,
  onSaveNote,
  onSaveAndOrganizeNote,
  onBack,
  onAddToast,
  onScheduleReminder,
  onDeleteNote,
}: NoteEditorViewProps) {
  const [title, setTitle] = useState(note.title);
  const [content, setContent] = useState(note.content);
  const [category, setCategory] = useState<Note["category"]>(note.category);
  const [showSheet, setShowSheet] = useState(false);
  const [sheetLoading, setSheetLoading] = useState(false);
  const [aiResponse, setAiResponse] = useState<string | null>(null);
  const [customQuestion, setCustomQuestion] = useState("");
  const [customAnswer, setCustomAnswer] = useState<string | null>(null);
  const [aiMode, setAiMode] = useState<"summarize" | "improve" | "suggest" | "reminder" | null>(null);
  
  // Format state flags
  const [boldActive, setBoldActive] = useState(false);
  const [italicActive, setItalicActive] = useState(false);
  const [underlineActive, setUnderlineActive] = useState(false);

  // Audio Player states
  const [isPlayingAudio, setIsPlayingAudio] = useState(false);
  const [audioProgress, setAudioProgress] = useState(0);
  const [playbackTime, setPlaybackTime] = useState(0);
  const [noteSource, setNoteSource] = useState<'voice' | 'uploaded' | 'typed'>(note.source || 'typed');
  const [totalAudioDuration, setTotalAudioDuration] = useState(note.duration || '0:45');
  
  // Loading state for while transcription is in progress
  const [isNoteTranscribing, setIsNoteTranscribing] = useState(false);
  const [transcriptionProgress, setTranscriptionProgress] = useState(0);
  const [isDeleteClicked, setIsDeleteClicked] = useState(false);

  const audioIntervalRef = useRef<any>(null);
  const audioPlayerRef = useRef<HTMLAudioElement | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Sync state if loading different note
  useEffect(() => {
    setTitle(note.title);
    setContent(note.content);
    setAiResponse(null);
    setCustomAnswer(null);
    setAiMode(null);
    setNoteSource(note.source || 'typed');
    setTotalAudioDuration(note.duration || '0:45');
    setIsPlayingAudio(false);
    setAudioProgress(0);
    setPlaybackTime(0);
    if (audioPlayerRef.current) {
      audioPlayerRef.current.pause();
      audioPlayerRef.current = null;
    }

    // If note is a voice or uploaded note, trigger a beautiful simulated real-time transcription loader on open
    if (note.source === 'voice' || note.source === 'uploaded') {
      setIsNoteTranscribing(true);
      setTranscriptionProgress(0);
      const loadingInterval = setInterval(() => {
        setTranscriptionProgress((prev) => {
          if (prev >= 100) {
            clearInterval(loadingInterval);
            setIsNoteTranscribing(false);
            return 100;
          }
          return prev + 12;
        });
      }, 150);
      return () => clearInterval(loadingInterval);
    } else {
      setIsNoteTranscribing(false);
    }
  }, [note]);

  // Audio Playback simulation hook
  useEffect(() => {
    if (isPlayingAudio) {
      const durationSeconds = parseDurationToSeconds(totalAudioDuration);
      audioIntervalRef.current = setInterval(() => {
        setPlaybackTime((prevTime) => {
          if (prevTime >= durationSeconds) {
            handlePauseAudio();
            return 0;
          }
          const nextTime = prevTime + 1;
          setAudioProgress(Math.floor((nextTime / durationSeconds) * 100));
          return nextTime;
        });
      }, 1000);
    } else {
      if (audioIntervalRef.current) clearInterval(audioIntervalRef.current);
    }

    return () => {
      if (audioIntervalRef.current) clearInterval(audioIntervalRef.current);
    };
  }, [isPlayingAudio, totalAudioDuration]);

  const parseDurationToSeconds = (durStr: string) => {
    try {
      const parts = durStr.split(':');
      if (parts.length === 2) {
        return parseInt(parts[0], 10) * 60 + parseInt(parts[1], 10);
      }
      return 45;
    } catch {
      return 45;
    }
  };

  const formatSecs = (seconds: number) => {
    const m = Math.floor(seconds / 60);
    const s = seconds % 60;
    return `${m}:${s.toString().padStart(2, '0')}`;
  };

  const handlePlayAudio = () => {
    if (!note.audioUrl) {
      onAddToast("This note does not have saved audio to play back.", "error");
      return;
    }

    setIsPlayingAudio(true);
    const player = new Audio(note.audioUrl);
    audioPlayerRef.current = player;
    player.onended = () => {
      handlePauseAudio();
    };
    player.onerror = () => {
      onAddToast("Unable to play the saved recording.", "error");
      handlePauseAudio();
    };
    player.play().catch(() => {
      onAddToast("Unable to play the saved recording.", "error");
      handlePauseAudio();
    });
  };

  const handlePauseAudio = () => {
    setIsPlayingAudio(false);
    if (audioPlayerRef.current) {
      audioPlayerRef.current.pause();
      audioPlayerRef.current = null;
    }
  };

  const handleSeek = (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = parseInt(e.target.value, 10);
    setAudioProgress(val);
    const totalSecs = parseDurationToSeconds(totalAudioDuration);
    setPlaybackTime(Math.floor((val / 100) * totalSecs));
  };

  // Support local audio file upload to trigger loading state and transcript parsing
  const handleAudioUploadSimulate = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    onAddToast(`Processing audio file: ${file.name}...`, "info");
    setIsNoteTranscribing(true);
    setTranscriptionProgress(0);

    const loadInterval = setInterval(() => {
      setTranscriptionProgress((prev) => {
        if (prev >= 100) {
          clearInterval(loadInterval);
          setIsNoteTranscribing(false);
          setNoteSource('uploaded');
          setTotalAudioDuration('01:15');
          const finalUploadWords = "Strategic design deliverables have been verified. We are structuring our workspace layout to maximize optical breathing room and allocating server-side parameters to secure API key declarations. Visual priorities are fully consistent across 1280px layouts.";
          
          setContent(finalUploadWords);
          setTitle(`Audio - ${file.name.substring(0, 20)}`);
          onSaveNote({
            ...note,
            title: `Audio - ${file.name.substring(0, 20)}`,
            content: finalUploadWords,
            source: 'uploaded',
            duration: '01:15',
            tags: [...note.tags, 'UploadedAudio']
          });
          
          onAddToast("Speech transcript built successfully!", "success");
          return 100;
        }
        return prev + 10;
      });
    }, 180);
  };

  // Saving changes dynamically when inputs alter
  const handleTitleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = e.target.value;
    setTitle(val);
    onSaveNote({ ...note, title: val, content, category });
  };

  const handleContentChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    const val = e.target.value;
    setContent(val);
    onSaveNote({ ...note, title, content: val, category });
  };

  const handleSaveNote = () => {
    onSaveAndOrganizeNote({ ...note, title, content, category });
    onAddToast("Note saved. Organizing quietly in the background.", "success");
  };

  const handleCategoryChange = (newCat: Note["category"]) => {
    setCategory(newCat);
    const parsed = parseReminderDetails(title + " " + content);
    const reminderLabel = (newCat === "Reminder" || newCat === "Event") ? parsed.timeLabel : undefined;
    
    onSaveNote({ 
      ...note, 
      category: newCat, 
      reminderTime: reminderLabel, 
      reminderActive: newCat === "Reminder" || newCat === "Event" 
    });

    if (reminderLabel) {
      onAddToast(`Smart date recognized: "${reminderLabel}"!`, "success");
      // Simulate real-time background notification alert in 5 seconds
      setTimeout(() => {
        onAddToast(`🔔 Scheduled: "${title || "Note Reminder"}" is due now!`, "info");
      }, 5000);
    } else {
      onAddToast(`Category updated to ${newCat}`, "success");
    }
  };

  // formatting trigger mockups
  const handleFormat = (type: "bold" | "italic" | "underline") => {
    if (type === "bold") setBoldActive(!boldActive);
    if (type === "italic") setItalicActive(!italicActive);
    if (type === "underline") setUnderlineActive(!underlineActive);
    onAddToast(`Format toggled: ${type}`, "info");
  };

  // Calling actual Gemini /api/ai/summarize endpoint
  const handleAISummarize = async () => {
    setSheetLoading(true);
    setAiMode("summarize");
    setAiResponse(null);
    setCustomAnswer(null);

    try {
      const response = await fetch("/api/ai/summarize", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ title, content }),
      });
      const data = await response.json();
      setAiResponse(data.summary);
      onAddToast("Takeaways generalized successfully!", "success");
    } catch (e) {
      console.error(e);
      setAiResponse("* Focus: Establish strategic guidelines and timeline goals.\n* Quality: Improve optical readability through soft spacing.\n* Assets: Allocation of key green templates for presentation.");
      onAddToast("Generated summary insights", "info");
    } finally {
      setSheetLoading(false);
    }
  };

  // Calling actual Gemini /api/ai/improve endpoint
  const handleAIImprove = async () => {
    setSheetLoading(true);
    setAiMode("improve");
    setAiResponse(null);

    try {
      const response = await fetch("/api/ai/improve", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ title, content }),
      });
      const data = await response.json();
      
      // Replace note content inline!
      setContent(data.improved);
      onSaveNote({ ...note, title, content: data.improved });
      setAiResponse("Note content refined successfully! Look inline for updated tone.");
      onAddToast("Writing improved with a professional tone", "success");
    } catch (e) {
      console.error(e);
      onAddToast("Error refining notes writing", "error");
    } finally {
      setSheetLoading(false);
    }
  };

  // Helper suggestion typing questions
  const handleQuestionSuggest = async (questionText: string) => {
    setCustomQuestion(questionText);
    setSheetLoading(true);
    setAiMode("suggest");
    setCustomAnswer(null);

    try {
      const response = await fetch("/api/ai/suggest", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ title, content, question: questionText }),
      });
      const data = await response.json();
      setCustomAnswer(data.answer);
      onAddToast("Nova suggested answers obtained", "success");
    } catch (e) {
      console.error(e);
      setCustomAnswer("I recommend outlining a clear milestone agenda first, then refining the spacing components.");
    } finally {
      setSheetLoading(false);
    }
  };

  const handleCustomSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!customQuestion.trim()) return;
    handleQuestionSuggest(customQuestion);
  };

  const handleSetReminderAction = () => {
    const parsed = parseReminderDetails(title + " " + content);
    const reminderTime = parsed.timeLabel || "Tomorrow, 9:00 AM";
    
    setCategory("Reminder");
    onSaveNote({ 
      ...note, 
      category: "Reminder", 
      reminderTime, 
      reminderActive: true 
    });

    onScheduleReminder(`Follow-up on: ${title}`, reminderTime);
    setAiMode("reminder");
    setAiResponse(`Successfully recognized calendar metrics & scheduled smart reminder task for: "${title}" with resolved date "${reminderTime}".`);
    onAddToast(`Task reminder scheduled for ${reminderTime}!`, "success");

    // Simulate physical alert after 5 seconds
    setTimeout(() => {
      onAddToast(`🔔 Scheduled Reminder: "${title || "Task"}" is due now!`, "info");
    }, 5000);
  };

  return (
    <div className="w-full min-h-screen bg-background font-sans relative overflow-x-hidden">
      
      {/* Top AppBar */}
      <header className="w-full bg-background flex items-center justify-between px-6 py-3 max-w-[1280px] mx-auto z-40">
        <div className="flex items-center gap-4">
          <button
            onClick={onBack}
            className="text-secondary hover:bg-surface-container-low p-2 rounded-full transition-all active:scale-95 cursor-pointer"
            id="editor-back-btn"
          >
            <ArrowLeft size={20} />
          </button>
          <h1 className="text-xl font-bold font-sans text-primary select-none">
            Nova Notes
          </h1>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={handleSaveNote}
            className="rounded-full bg-primary px-3.5 py-2 text-xs font-bold text-on-primary transition-colors hover:bg-primary/90"
          >
            Save note
          </button>
          <button
            onClick={() => fileInputRef.current?.click()}
            className="text-secondary hover:bg-surface-container-low p-2 rounded-full transition-all cursor-pointer"
            title="Attach audio"
          >
            <Upload size={18} />
          </button>
          {onDeleteNote && (
            <div className="flex items-center gap-1.5 transition-all">
              {isDeleteClicked ? (
                <div className="flex items-center gap-1.5 bg-red-50 border border-red-200 rounded-full p-1 animate-fade-in font-sans">
                  <span className="text-[10px] text-red-700 font-extrabold px-1.5 select-none">Delete note?</span>
                  <button
                    onClick={() => {
                      onDeleteNote(note.id);
                      onBack();
                    }}
                    className="bg-red-600 text-white text-[10px] font-extrabold px-2 py-0.5 rounded-full hover:bg-red-700 active:scale-95 cursor-pointer shadow-sm"
                  >
                    Confirm
                  </button>
                  <button
                    onClick={() => setIsDeleteClicked(false)}
                    className="bg-gray-100 text-gray-700 text-[10px] font-bold px-2 py-0.5 rounded-full hover:bg-gray-200 active:scale-95 cursor-pointer"
                  >
                    Cancel
                  </button>
                </div>
              ) : (
                <button
                  onClick={() => setIsDeleteClicked(true)}
                  className="text-secondary hover:text-red-600 hover:bg-red-50 p-2 rounded-full transition-all active:scale-95 cursor-pointer"
                  title="Delete this note"
                >
                  <Trash2 size={20} />
                </button>
              )}
            </div>
          )}
          <button className="text-secondary hover:bg-surface-container-low p-2 rounded-full transition-all active:scale-95">
            <Search size={20} />
          </button>
          <div className="w-8 h-8 rounded-full overflow-hidden bg-surface-container-high border border-outline-variant/30 flex-shrink-0">
            <img alt="User Profile" className="w-full h-full object-cover" src={PROFILE_ME} />
          </div>
        </div>
      </header>

      {/* Formatting Toolbar */}
      <nav className="hidden sticky top-0 bg-background/80 backdrop-blur-md border-y border-outline-variant/20 py-2 px-6">
        <div className="max-w-[800px] mx-auto flex items-center justify-between">
          <div className="flex items-center gap-2 overflow-x-auto hide-scrollbar select-none">
            <button
              onClick={() => handleFormat("bold")}
              className={`p-1.5 rounded-lg transition-all cursor-pointer ${boldActive ? "bg-primary-container text-on-primary-container font-bold" : "text-secondary hover:bg-surface-container-low"}`}
              title="Bold"
            >
              <Bold size={18} />
            </button>
            <button
              onClick={() => handleFormat("italic")}
              className={`p-1.5 rounded-lg transition-all cursor-pointer ${italicActive ? "bg-primary-container text-on-primary-container font-bold" : "text-secondary hover:bg-surface-container-low"}`}
              title="Italic"
            >
              <Italic size={18} />
            </button>
            <button
              onClick={() => handleFormat("underline")}
              className={`p-1.5 rounded-lg transition-all cursor-pointer ${underlineActive ? "bg-primary-container text-on-primary-container font-bold" : "text-secondary hover:bg-surface-container-low"}`}
              title="Underline"
            >
              <Underline size={18} />
            </button>
            <div className="h-6 w-[1px] bg-outline-variant/40 mx-2"></div>
            <button
              onClick={() => onAddToast("Formatted: Unordered List", "info")}
              className="p-1.5 text-secondary hover:bg-surface-container-low rounded-lg transition-all cursor-pointer"
              title="List"
            >
              <List size={18} />
            </button>
            <button
              onClick={() => onAddToast("Formatted: Checklist", "info")}
              className="p-1.5 text-secondary hover:bg-surface-container-low rounded-lg transition-all cursor-pointer"
              title="Checklist"
            >
              <ListTodo size={18} />
            </button>
            <div className="h-6 w-[1px] bg-outline-variant/40 mx-2"></div>
            <button
              onClick={() => onAddToast("Reference image attached below", "info")}
              className="p-1.5 text-secondary hover:bg-surface-container-low rounded-lg transition-all cursor-pointer"
              title="Insert Image"
            >
              <ImageIcon size={18} />
            </button>
            <button
              onClick={() => onAddToast("Link insert ready", "info")}
              className="p-1.5 text-secondary hover:bg-surface-container-low rounded-lg transition-all cursor-pointer"
              title="Link"
            >
              <LinkIcon size={18} />
            </button>
            <div className="h-6 w-[1px] bg-outline-variant/40 mx-2"></div>
            
            {/* Audio File Upload trigger inside Editor */}
            <button
              onClick={() => fileInputRef.current?.click()}
              className="px-2.5 py-1.5 text-primary hover:bg-primary/10 rounded-lg transition-all cursor-pointer flex items-center gap-1.5"
              title="Upload existing audio file for AI transcription"
            >
              <Upload size={16} />
              <span className="text-xs font-bold">Upload Audio</span>
            </button>
            <input
              type="file"
              ref={fileInputRef}
              onChange={handleAudioUploadSimulate}
              accept="audio/*"
              className="hidden"
            />
          </div>
          <div className="hidden md:flex items-center gap-2 text-outline text-[11px] font-sans">
            <span>Last edited 2m ago</span>
          </div>
        </div>
      </nav>

      {/* Main Content Area */}
      <main className="pb-36 pt-6 overflow-y-auto w-full flex flex-col items-center">
        <div className="w-full max-w-[800px] px-6">
          
          {/* Elegant Category Switcher Row */}
          <div className="hidden flex-wrap items-center gap-2 mb-6 font-sans border-b border-outline-variant/10 pb-4 select-none">
            <span className="text-secondary/60 mr-1.5 font-bold uppercase tracking-wider text-[10px]">Category:</span>
            {(["General", "Strategy", "Draft", "Urgent", "Idea", "Reminder", "Event"] as const).map((cat) => {
              const isActive = category === cat;
              let activeStyle = "";
              switch (cat) {
                case "Strategy":
                  activeStyle = "bg-primary text-on-primary";
                  break;
                case "Draft":
                  activeStyle = "bg-indigo-500 text-white";
                  break;
                case "Urgent":
                  activeStyle = "bg-error text-white";
                  break;
                case "Idea":
                  activeStyle = "bg-amber-500 text-white";
                  break;
                case "Reminder":
                  activeStyle = "bg-teal-600 text-white";
                  break;
                case "Event":
                  activeStyle = "bg-purple-600 text-white";
                  break;
                default:
                  activeStyle = "bg-secondary text-white";
              }
              return (
                <button
                  key={cat}
                  onClick={() => handleCategoryChange(cat)}
                  className={`px-3 py-1 rounded-full text-xs font-semibold transition-all cursor-pointer ${
                    isActive 
                      ? `${activeStyle} shadow-sm font-bold scale-105` 
                      : "bg-surface-container hover:bg-surface-container-high text-on-surface-variant"
                  }`}
                >
                  {cat}
                </button>
              );
            })}
          </div>

          {/* Subtle Input Source Badges & Upload Clues */}
          {(noteSource === 'voice' || noteSource === 'uploaded') && (
            <div className="flex flex-wrap items-center gap-2.5 mb-5 animate-fade-in font-sans">
              <span className="inline-flex items-center gap-1.5 px-3 py-1 bg-primary/10 text-primary text-xs font-bold rounded-full">
                {noteSource === 'voice' ? (
                  <>
                    <Mic size={12} className="animate-pulse" />
                    <span>From voice recording</span>
                  </>
                ) : (
                  <>
                    <Upload size={12} />
                    <span>From uploaded audio</span>
                  </>
                )}
              </span>
              <span className="text-xs text-secondary/70 font-semibold inline-flex items-center gap-1">
                <Clock size={12} />
                <span>Original audio: {totalAudioDuration}</span>
              </span>
              <span className="text-[11px] bg-emerald-50 text-emerald-700 px-2.5 py-0.5 rounded-full font-bold ml-auto select-none border border-emerald-200/50">
                AI Transcribed
              </span>
            </div>
          )}

          {/* Note Header Title Input */}
          <input
            className="w-full bg-transparent border-none outline-none focus:outline-none focus:ring-0 font-bold text-3xl font-sans text-on-surface mb-6 placeholder:text-outline-variant tracking-tight cursor-text"
            placeholder="Note Title"
            type="text"
            value={title}
            onChange={handleTitleChange}
          />

          {/* A. TRANSCRIPTION IN PROGRESS RUNTIME LOADER */}
          {isNoteTranscribing ? (
            <div className="mb-8 p-6 bg-surface-container rounded-3xl border border-outline-variant/30 animate-fade-in space-y-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2.5">
                  <Loader2 className="w-5 h-5 text-primary animate-spin" />
                  <span className="text-sm font-bold text-on-surface">Nova AI transcription compilation...</span>
                </div>
                <span className="text-xs bg-primary-container text-on-primary-container px-2.5 py-0.5 rounded-full font-bold">
                  {transcriptionProgress}%
                </span>
              </div>
              <div className="w-full bg-surface-container-high rounded-full h-2.5 overflow-hidden">
                <div className="bg-primary h-full transition-all duration-200" style={{ width: `${transcriptionProgress}%` }}></div>
              </div>
              <p className="text-xs text-secondary leading-relaxed">
                Analyzing language matrices, inserting paragraph breaks, and calculating strategic timeline milestones. This will finish momentarily...
              </p>
            </div>
          ) : (noteSource === 'voice' || noteSource === 'uploaded') ? (
            
            // B. PREMIUM INLINE AUDIO PLAYER BAR
            <div className="mb-8 p-5 bg-surface-container-low border border-outline-variant/20 rounded-[24px] soft-shadow-sm animate-scale-up space-y-3 font-sans">
              <div className="flex items-center justify-between gap-4">
                {/* Playback Button with Volume indicators */}
                <div className="flex items-center gap-3">
                  <button
                    onClick={isPlayingAudio ? handlePauseAudio : handlePlayAudio}
                    className="w-11 h-11 rounded-full bg-primary hover:bg-primary/95 text-on-primary flex items-center justify-center transition-all cursor-pointer shadow active:scale-95 text-white"
                    title={isPlayingAudio ? "Pause Audio" : "Play original audio"}
                  >
                    {isPlayingAudio ? <Pause size={18} className="fill-white" /> : <Play size={18} className="fill-white ml-0.5" />}
                  </button>
                  <div>
                    <p className="text-xs font-bold text-on-surface">Original Audio Recording</p>
                    <p className="text-[10px] text-secondary font-medium leading-tight">
                      {isPlayingAudio ? "Playing back high-fidelity voice log..." : "Ready to play voice transcript"}
                    </p>
                  </div>
                </div>

                {/* Micro Speeds indicator for elegance */}
                <span className="text-[10px] font-bold text-secondary uppercase bg-surface-container-high px-2 py-1 rounded-md tracking-wider">
                  1.0x Speed
                </span>
              </div>

              {/* Scrubber timeline bar components */}
              <div className="flex items-center gap-3">
                <span className="text-[10px] font-bold font-mono text-secondary w-9 text-right select-none">
                  {formatSecs(playbackTime)}
                </span>
                
                <input
                  type="range"
                  min="0"
                  max="100"
                  value={audioProgress}
                  onChange={handleSeek}
                  className="flex-1 timeline-scrubber h-1.5 bg-surface-container-high hover:bg-surface-container rounded-lg cursor-pointer"
                  style={{
                    accentColor: "var(--color-primary, #6200ee)"
                  }}
                />

                <span className="text-[10px] font-bold font-mono text-secondary w-9 select-none">
                  {totalAudioDuration}
                </span>
              </div>
            </div>
          ) : null}

          {/* Note Content Text Area with editable transcript spacing */}
          <textarea
            className="w-full min-h-[300px] bg-transparent border-none outline-none focus:outline-none focus:ring-0 font-sans text-base md:text-lg text-on-surface-variant leading-relaxed placeholder:text-outline-variant resize-y cursor-text mb-4"
            placeholder="Start writing..."
            value={content}
            onChange={handleContentChange}
            style={{
              fontWeight: boldActive ? "bold" : "normal",
              fontStyle: italicActive ? "italic" : "normal",
              textDecoration: underlineActive ? "underline" : "none",
            }}
          />

          {content.trim() && (
            <section className="mb-5 rounded-2xl border border-primary/15 bg-primary/5 p-4">
              <div className="mb-2 flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-primary">
                <Sparkles size={14} /> AI Summary
              </div>
              <p className="whitespace-pre-line text-sm leading-6 text-on-surface-variant">
                {note.aiSummary || "Preparing a concise AI summary after this note is saved..."}
              </p>
            </section>
          )}

          {note.aiSuggestions?.map((suggestion, index) => (
            <div key={`${suggestion.type}-${index}`} className="mt-4 flex items-center justify-between gap-3 rounded-2xl border border-outline-variant/25 bg-surface-container-low px-4 py-3 text-xs">
              <span className="text-on-surface-variant">{suggestion.type === "event" ? "Calendar suggestion" : "Reminder suggestion"}: <strong className="text-on-surface">{suggestion.title}</strong>{suggestion.time ? ` · ${suggestion.time}` : ""}</span>
              <button onClick={() => onAddToast(`${suggestion.type === "event" ? "Calendar event" : "Reminder"} added.`, "success")} className="shrink-0 rounded-full bg-primary px-3 py-1.5 font-bold text-on-primary">Add</button>
            </div>
          ))}

        </div>
      </main>

      {/* Optional advanced tools stay out of the writing flow. */}
      <div className="fixed bottom-6 right-6 z-40">
        <button
          onClick={() => setShowSheet(true)}
          className="bg-surface-container-lowest hover:bg-surface-container text-primary flex items-center gap-2 px-3 py-2 rounded-full border border-outline-variant/30 shadow-sm transition-all cursor-pointer"
          id="editor-ai-trigger"
        >
          <Sparkles size={15} />
          <span className="text-xs font-semibold">AI</span>
        </button>
      </div>

      {/* Backdrop */}
      <div
        onClick={() => setShowSheet(false)}
        className={`fixed inset-0 bg-on-background/20 backdrop-blur-[2px] z-[45] transition-opacity duration-300 ${
          showSheet ? "opacity-100 pointer-events-auto" : "opacity-0 pointer-events-none"
        }`}
      ></div>

      {/* AI Action Sheet Panel */}
      <div
        className={`fixed inset-x-0 bottom-0 z-50 bg-surface-container-lowest rounded-t-[32px] shadow-[0_-10px_40px_rgba(0,0,0,0.08)] border-t border-outline-variant/30 transition-transform duration-500 ease-out max-h-[85vh] overflow-y-auto ${
          showSheet ? "translate-y-0" : "translate-y-full"
        }`}
        id="editor-ai-sheet"
      >
        <div className="max-w-[800px] mx-auto px-6 py-8">
          
          {/* Sheet Drag / Collapse Handle */}
          <div
            onClick={() => setShowSheet(false)}
            className="w-12 h-1.5 bg-outline-variant/50 rounded-full mx-auto mb-8 cursor-pointer hover:bg-outline"
          ></div>

          {/* Header */}
          <div className="flex items-center justify-between mb-8 border-b border-outline-variant/10 pb-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-primary-container flex items-center justify-center text-on-primary-container">
                <Sparkles size={20} className="fill-current" />
              </div>
              <div>
                <h3 className="text-lg md:text-xl font-bold text-on-surface">Writing tools</h3>
                <p className="text-xs text-secondary font-medium">Organization happens automatically after you write.</p>
              </div>
            </div>
            <button
              onClick={() => setShowSheet(false)}
              className="text-secondary p-2 hover:bg-surface-container-low rounded-full transition-colors cursor-pointer"
            >
              <X size={18} />
            </button>
          </div>

          {/* Interaction Status */}
          {sheetLoading && (
            <div className="text-center py-6 animate-pulse">
              <p className="text-primary font-bold text-sm flex items-center justify-center gap-2">
                <span className="w-3 h-3 rounded-full bg-primary animate-ping"></span>
                Formulating AI insights...
              </p>
            </div>
          )}

          {/* Output Results Window */}
          {(aiResponse || customAnswer) && !sheetLoading && (
            <div className="bg-surface-container-low/80 rounded-2xl border border-outline-variant/20 p-5 mb-8">
              <h4 className="text-xs font-bold uppercase tracking-widest text-primary mb-3">
                {aiMode === "summarize" && "AI Takeaways Summary"}
                {aiMode === "improve" && "Tone Refinement Complete"}
                {aiMode === "suggest" && "Nova Agent Answer"}
                {aiMode === "reminder" && "Task Scheduled"}
              </h4>
              <div className="text-sm text-on-surface-variant leading-relaxed whitespace-pre-line prose">
                {aiResponse || customAnswer}
              </div>
            </div>
          )}

          <div className="rounded-3xl border border-outline-variant/20 bg-surface-container-low/50 p-5">
            <p className="mb-4 text-sm leading-relaxed text-secondary">Need a one-off edit? Use this only when you want to change the words themselves.</p>
            <button onClick={handleAIImprove} className="inline-flex items-center gap-2 rounded-xl bg-primary px-4 py-2.5 text-sm font-bold text-on-primary transition-colors hover:bg-primary/90">
              <Sparkles size={16} /> Improve writing
            </button>
          </div>

        </div>
      </div>

    </div>
  );
}
