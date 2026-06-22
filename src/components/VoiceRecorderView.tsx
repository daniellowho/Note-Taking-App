import React, { useState, useEffect, useRef, useMemo } from "react";
import {
  Mic,
  StopCircle,
  Info,
  Bookmark,
  PlusCircle,
  CheckCircle,
  Play,
  Pause,
  Square,
  Volume2,
  Trash2,
  Bell,
  ChevronRight,
  Sparkles,
  Clock,
  Search,
  FileText,
  X,
  ExternalLink,
  AlertCircle
} from "lucide-react";
import { Note } from "../types";

interface VoiceRecorderViewProps {
  notes?: Note[];
  onSelectNote?: (note: Note) => void;
  onDeleteNote?: (id: string) => void;
  onSaveTranscriptAsNote: (title: string, text: string, duration?: string) => void;
  onAddToast: (text: string, type: "success" | "info" | "error") => void;
  autoStart?: boolean;
  onResetAutoStart?: () => void;
}

export default function VoiceRecorderView({
  notes = [],
  onSelectNote,
  onDeleteNote,
  onSaveTranscriptAsNote,
  onAddToast,
  autoStart = false,
  onResetAutoStart,
}: VoiceRecorderViewProps) {
  // Active Recording States
  const [isRecording, setIsRecording] = useState(false);
  const [seconds, setSeconds] = useState(0);
  const [waveformHeights, setWaveformHeights] = useState<number[]>([]);
  const [transcriptBlocks, setTranscriptBlocks] = useState<Array<{ time: string; text: string; tag: string }>>([]);
  const [currentSpeech, setCurrentSpeech] = useState("");
  const recognitionRef = useRef<any>(null);

  // Archive and Playback States
  const [searchQuery, setSearchQuery] = useState("");
  const [recentSavedId, setRecentSavedId] = useState<string | null>(null);
  const [expandedSummaryId, setExpandedSummaryId] = useState<string | null>(null);

  // Playback Animation States
  const [playingNoteId, setPlayingNoteId] = useState<string | null>(null);
  const [playbackProgress, setPlaybackProgress] = useState(0);
  const [playbackSeconds, setPlaybackSeconds] = useState(0);
  const playbackIntervalRef = useRef<any>(null);

  // Derive audio recordings list from notes prop
  const audioRecordings = useMemo(() => {
    return notes.filter(
      (n) => n.tags.includes("Audio") || n.tags.includes("Transcript") || n.audioUrl !== undefined
    );
  }, [notes]);

  // Find the details of the most recently saved recording to show as on-screen notification
  const recentSavedNote = useMemo(() => {
    if (!recentSavedId) return null;
    return notes.find((n) => n.id === recentSavedId) || null;
  }, [recentSavedId, notes]);

  // Filter archived vocal sessions
  const filteredRecordings = useMemo(() => {
    if (!searchQuery.trim()) return audioRecordings;
    const q = searchQuery.toLowerCase();
    return audioRecordings.filter(
      (r) =>
        r.title.toLowerCase().includes(q) ||
        r.content.toLowerCase().includes(q) ||
        (r.aiSummary && r.aiSummary.toLowerCase().includes(q))
    );
  }, [audioRecordings, searchQuery]);

  // Initialize simulated waveform heights for the recording screen
  useEffect(() => {
    const barsCount = 24;
    setWaveformHeights(Array.from({ length: barsCount }, () => Math.floor(Math.random() * 60) + 10));

    if (!isRecording) return;

    // Pulse the wave bars during recording
    const waveInterval = setInterval(() => {
      setWaveformHeights((prev) =>
        prev.map(() => Math.floor(Math.random() * 85) + 15)
      );
    }, 120);

    // Increment clock timer
    const timerInterval = setInterval(() => {
      setSeconds((prev) => prev + 1);
    }, 1000);

    return () => {
      clearInterval(waveInterval);
      clearInterval(timerInterval);
    };
  }, [isRecording]);

  // Handle active audio playback simulations
  useEffect(() => {
    if (playingNoteId) {
      const activeNote = notes.find(n => n.id === playingNoteId);
      const totalSecs = activeNote ? 45 : 30; // mock total duration
      
      playbackIntervalRef.current = setInterval(() => {
        setPlaybackSeconds((prev) => {
          if (prev >= totalSecs) {
            handleStopPlayback();
            return 0;
          }
          const nextSecs = prev + 1;
          setPlaybackProgress(Math.floor((nextSecs / totalSecs) * 100));
          return nextSecs;
        });
      }, 1000);
    } else {
      if (playbackIntervalRef.current) clearInterval(playbackIntervalRef.current);
    }

    return () => {
      if (playbackIntervalRef.current) clearInterval(playbackIntervalRef.current);
    };
  }, [playingNoteId, notes]);

  // Integrated Web Speech Recognition API
  useEffect(() => {
    const SpeechRecognition =
      (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;

    if (SpeechRecognition && isRecording) {
      try {
        const rec = new SpeechRecognition();
        rec.continuous = true;
        rec.interimResults = true;
        rec.lang = "en-US";

        rec.onresult = (event: any) => {
          let chunk = "";
          for (let i = event.resultIndex; i < event.results.length; ++i) {
            if (event.results[i].isFinal) {
              const text = event.results[i][0].transcript;
              addSpeechBlock(text);
              setCurrentSpeech("");
            } else {
              chunk += event.results[i][0].transcript;
              setCurrentSpeech(chunk);
            }
          }
        };

        rec.onerror = (e: any) => {
          console.warn("Speech recognition error:", e.error);
        };

        rec.onend = () => {
          if (isRecording) {
            try {
              rec.start();
            } catch {}
          }
        };

        rec.start();
        recognitionRef.current = rec;
      } catch (e) {
        console.warn("Speech initialization error", e);
      }
    }

    return () => {
      if (recognitionRef.current) {
        try {
          recognitionRef.current.stop();
        } catch {}
      }
    };
  }, [isRecording]);

  const addSpeechBlock = (text: string) => {
    if (!text.trim()) return;
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    const timeStr = `${mins.toString().padStart(2, "0")}:${secs
      .toString()
      .padStart(2, "0")}`;

    setTranscriptBlocks((prev) => [
      ...prev,
      { time: timeStr, text: text.trim(), tag: "" },
    ]);
  };

  // Automated background simulated transcript blocks during recording
  useEffect(() => {
    if (!isRecording) return;

    const simulations = [
      "Let's establish a high-fidelity visual grid centering on a comfortable 1280px desktop width.",
      "The layout should leverage warm cream colors and deep forest greens to minimize optical fatigue.",
      "Integrate floating notification cards to keep users updated on background AI operations and file digests.",
      "Make sure users can play back previous memos directly using browser-speech synthesizers."
    ];
    let simIdx = 0;

    const simInterval = setInterval(() => {
      if (simIdx < simulations.length) {
        addSpeechBlock(simulations[simIdx]);
        simIdx++;
      }
    }, 12000);

    return () => clearInterval(simInterval);
  }, [isRecording, seconds]);

  // Format clock timer 00:00
  const formatTimeStr = (totalSecs: number) => {
    const mins = Math.floor(totalSecs / 60);
    const secs = totalSecs % 60;
    return `${mins.toString().padStart(2, "0")}:${secs.toString().padStart(2, "0")}`;
  };

  // Start new Voice session
  const handleStartRecording = () => {
    setSeconds(0);
    setTranscriptBlocks([
      {
        time: "00:02",
        text: "Initiating live vocal session. Speech engine initialized.",
        tag: "System",
      }
    ]);
    setCurrentSpeech("");
    setIsRecording(true);
    // clear previous saved highlight notification
    setRecentSavedId(null);
    onAddToast("Recording session started...", "success");
  };

  // Watch for shortcut autoStart signal
  useEffect(() => {
    if (autoStart) {
      handleStartRecording();
      if (onResetAutoStart) {
        onResetAutoStart();
      }
    }
  }, [autoStart]);

  // End active recording session
  const handleEndSession = () => {
    setIsRecording(false);
    if (recognitionRef.current) {
      try {
        recognitionRef.current.stop();
      } catch {}
    }

    // Capture duration minutes:seconds
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    const durationLabel = `${mins}:${secs.toString().padStart(2, "0")}`;

    // Combine blocks into text
    const fullText = transcriptBlocks
      .map((b) => `[${b.time}] ${b.text}${b.tag ? ` (${b.tag})` : ""}`)
      .join("\n\n");

    let finalContent = fullText || "[No voice input detected in this session.]";
    if (currentSpeech) {
      finalContent += `\n\n[Ending Block] ${currentSpeech}`;
    }

    const stamp = Date.now();
    const mockId = `note-${stamp}`;
    const generatedTitle = `Audio Session - ${new Date().toLocaleDateString("en-US", {
      month: "short",
      day: "numeric",
      year: "numeric",
    })} at ${new Date().toLocaleTimeString("en-US", {
      hour: "2-digit",
      minute: "2-digit",
    })}`;

    // Trigger parent save callback
    onSaveTranscriptAsNote(generatedTitle, finalContent, durationLabel);

    // Set mock saved ID so we stay in page but can display the processed notification
    setRecentSavedId(mockId);
  };

  // Tag specific lines in live transcript with custom insights
  const handleTagInsight = (index: number, tagLabel: string) => {
    setTranscriptBlocks((prev) =>
      prev.map((item, idx) => (idx === index ? { ...item, tag: tagLabel } : item))
    );
    onAddToast(`Tagged snippet as "${tagLabel}"`, "info");
  };

  // Playback functions
  const handlePlayRecording = (note: Note) => {
    if (playingNoteId === note.id) {
      handleStopPlayback();
      return;
    }

    // Stop current playback if active
    if (playingNoteId) {
      handleStopPlayback();
    }

    setPlayingNoteId(note.id);
    setPlaybackProgress(0);
    setPlaybackSeconds(0);
    onAddToast(`Playing voice playback: "${note.title}"`, "info");

    // Optional audio narrator readout using browser SpeechSynthesis API
    if (window.speechSynthesis) {
      window.speechSynthesis.cancel();
      const utterance = new SpeechSynthesisUtterance(
        `Playing recording, title is ${note.title}. Transcript starts now: ${note.content.substring(0, 160)}`
      );
      utterance.rate = 1.05;
      utterance.onend = () => {
        handleStopPlayback();
      };
      utterance.onerror = () => {
        handleStopPlayback();
      };
      window.speechSynthesis.speak(utterance);
    }
  };

  const handleStopPlayback = () => {
    setPlayingNoteId(null);
    setPlaybackProgress(0);
    setPlaybackSeconds(0);
    if (window.speechSynthesis) {
      window.speechSynthesis.cancel();
    }
  };

  return (
    <div className="w-full max-w-[1280px] mx-auto px-6 pb-24 pt-4 font-sans animate-fade-in">
      
      {/* 1. ACTIVE RECORDING VIEW */}
      {isRecording ? (
        <div className="flex flex-col lg:flex-row gap-8">
          {/* Waveform Controls */}
          <div className="flex-grow flex flex-col items-center justify-center bg-surface-container-lowest border border-outline-variant/30 rounded-3xl p-8 shadow-sm">
            
            {/* Pulsing state badge */}
            <div className="flex flex-col items-center gap-4 mb-8 text-center">
              <div className="flex items-center gap-2 px-4 py-1.5 rounded-full bg-error-container text-on-error-container font-semibold text-xs tracking-wide shadow-sm">
                <span className="w-2.5 h-2.5 rounded-full bg-error animate-pulse"></span>
                <span className="uppercase tracking-widest text-[10px]">Recording Live Session</span>
              </div>

              <div className="text-5xl md:text-6xl font-bold tracking-tight text-on-surface font-mono mt-2">
                {formatTimeStr(seconds)}
              </div>
            </div>

            {/* Live recording wave visualization */}
            <div className="w-full max-w-xl h-48 flex items-center justify-center gap-2 px-6 mb-8 bg-surface-container-low/40 rounded-3xl border border-outline-variant/10">
              {waveformHeights.map((ht, idx) => {
                const isPrimary = idx % 3 === 0;
                return (
                  <div
                    key={idx}
                    className={`w-2.5 max-w-[12px] rounded-full transition-all duration-150 ${
                      isPrimary ? "bg-primary" : "bg-primary-container"
                    }`}
                    style={{ height: `${ht}%` }}
                  ></div>
                );
              })}
            </div>

            {/* Main Stop Circle */}
            <div className="mt-4 flex flex-col items-center gap-2">
              <button
                onClick={handleEndSession}
                className="group flex flex-col items-center gap-3 cursor-pointer"
                id="voice-end-session"
              >
                <div className="w-20 h-20 rounded-full bg-error flex items-center justify-center shadow-lg hover:shadow-error/20 hover:scale-105 active:scale-95 duration-200">
                  <Square size={28} className="text-white fill-white" />
                </div>
                <span className="text-xs font-bold text-secondary tracking-widest uppercase mt-2">
                  Stop & Sync Memo
                </span>
              </button>
            </div>
          </div>

          {/* Right Live Transcript Sidecar */}
          <aside className="w-full lg:w-[420px] flex flex-col gap-6">
            <div className="bg-surface-container-lowest border border-outline-variant/30 rounded-3xl p-6 flex flex-col h-[500px] shadow-sm">
              <div className="flex items-center justify-between mb-4 border-b border-outline-variant/10 pb-3">
                <h2 className="text-lg font-bold text-on-surface">Live Transcription</h2>
                <span className="px-2 py-0.5 rounded bg-surface-container-high text-primary font-bold text-[9px] tracking-widest uppercase">
                  NATIVE AI
                </span>
              </div>

              {/* Live blocks area */}
              <div className="flex-grow overflow-y-auto space-y-5 pr-1 hide-scrollbar">
                {transcriptBlocks.map((b, i) => {
                  const isLast = i === transcriptBlocks.length - 1;
                  return (
                    <div
                      key={i}
                      className={`space-y-1 relative pl-4 transition-all ${
                        isLast ? "opacity-100" : "opacity-75"
                      }`}
                    >
                      <div
                        className={`absolute left-0 top-1 bottom-1 w-0.5 rounded-full ${
                          isLast ? "bg-primary animate-pulse" : "bg-outline-variant/50"
                        }`}
                      ></div>
                      
                      <div className="flex items-center justify-between gap-2">
                        <p className="text-[10px] font-bold text-primary font-mono">{b.time}</p>
                        {b.tag && (
                          <span className="text-[9px] font-bold px-2 py-0.5 rounded bg-primary-container/20 text-on-primary-container">
                            {b.tag}
                          </span>
                        )}
                      </div>
                      
                      <p className="text-xs text-on-surface-variant leading-relaxed">
                        {b.text}
                      </p>
                      
                      {/* Real-time category tagging button utilities */}
                      {!b.tag && (
                        <div className="flex items-center gap-1.5 pt-1">
                          <button
                            onClick={() => handleTagInsight(i, "Action Item")}
                            className="text-[9px] bg-surface-container hover:bg-primary-container hover:text-on-primary-container text-secondary font-medium py-0.5 px-2 rounded-md transition-all cursor-pointer"
                          >
                            + Action Item
                          </button>
                          <button
                            onClick={() => handleTagInsight(i, "Strategic KPI")}
                            className="text-[9px] bg-surface-container hover:bg-primary-container hover:text-on-primary-container text-secondary font-medium py-0.5 px-2 rounded-md transition-all cursor-pointer"
                          >
                            + KPI
                          </button>
                        </div>
                      )}
                    </div>
                  );
                })}

                {/* Interim speech recognition text */}
                {currentSpeech && (
                  <div className="space-y-1 pl-4 opacity-70">
                    <p className="text-[10px] font-bold text-primary/70 font-mono">Listening...</p>
                    <p className="text-xs text-on-surface-variant italic">
                      {currentSpeech}...
                      <span className="inline-block w-1.5 h-3 bg-primary/75 ml-1 animate-pulse"></span>
                    </p>
                  </div>
                )}
              </div>

              {/* Bottom tagger utility */}
              <div className="mt-4 pt-3 border-t border-outline-variant/10 flex gap-2">
                <button
                  onClick={() => {
                    addSpeechBlock("Action Point: Revise tactical mobile screen margins to align on comfortable ratios.");
                    onAddToast("Tactical insight tagged", "success");
                  }}
                  className="flex-1 py-2 rounded-xl bg-surface-container hover:bg-surface-container-high text-on-surface text-xs font-semibold flex items-center justify-center gap-1.5 transition-colors cursor-pointer"
                >
                  <Bookmark size={13} />
                  Inject Key Milestone
                </button>
              </div>
            </div>

            {/* Notice card */}
            <div className="bg-primary/5 border border-primary/10 rounded-2xl p-4 flex items-start gap-3">
              <Info size={16} className="text-primary mt-1 shrink-0" />
              <div className="space-y-0.5">
                <p className="text-xs font-bold text-primary">Microphone Active</p>
                <p className="text-[11px] text-on-surface-variant leading-relaxed">
                  Real-time cognitive audio stream processed on-device. Ending the session compiles the notes safely.
                </p>
              </div>
            </div>
          </aside>
        </div>
      ) : (
        
        // 2. IDLE HUB PAGE (Voice Library + Saved Archive)
        <div className="space-y-8">
          
          {/* Header Description */}
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-outline-variant/10 pb-6">
            <div className="space-y-1">
              <h2 className="text-2xl md:text-3xl font-extrabold tracking-tight text-on-surface">Vocal Studio & Audio Archive</h2>
              <p className="text-sm text-on-surface-variant font-medium">
                Review, filter, play back, and edit automatically generated transcripts compiled from strategic voice sessions.
              </p>
            </div>
            
            {/* New Recording Button */}
            <button
              onClick={handleStartRecording}
              className="px-6 py-3 bg-primary text-on-primary hover:bg-primary/95 font-semibold text-sm rounded-2xl shadow-md hover:scale-[1.02] active:scale-[0.98] transition-all flex items-center gap-2 shrink-0 cursor-pointer"
              id="start-new-session-btn"
            >
              <Mic size={18} className="animate-pulse" />
              Start New Recording
            </button>
          </div>

          {/* 3. TRANSCRIPT SAVED NOTIFICATION ALERT BANNER */}
          {recentSavedNote && (
            <div className="bg-primary-container/20 border border-primary/20 rounded-3xl p-5 md:p-6 shadow-sm animate-fade-in relative overflow-hidden">
              <div className="absolute top-0 right-0 w-44 h-44 bg-primary/5 rounded-full filter blur-xl pointer-events-none"></div>
              <div className="flex items-start gap-4">
                <div className="w-12 h-12 rounded-2xl bg-primary/10 text-primary flex items-center justify-center shrink-0">
                  <Bell size={22} className="animate-bounce" />
                </div>
                <div className="flex-1 space-y-2">
                  <div className="flex items-center gap-2">
                    <span className="text-[10px] font-bold text-primary uppercase tracking-widest bg-primary/10 px-2 py-0.5 rounded-full">
                      AI Digest Processed
                    </span>
                    <span className="text-[10px] text-secondary font-mono">Just Now</span>
                  </div>
                  
                  <h4 className="text-lg font-bold text-on-surface leading-tight">
                    {recentSavedNote.title}
                  </h4>
                  
                  <p className="text-xs text-on-surface-variant leading-relaxed max-w-3xl">
                    Your speech session was analyzed successfully. Action marks, bullet points, and high-level milestones have been compiled together with a dedicated intelligence brief.
                  </p>

                  {/* Highlights Brief Preview */}
                  <div className="bg-white/80 border border-outline-variant/20 p-3.5 rounded-2xl text-xs text-on-surface-variant leading-relaxed shadow-inner">
                    <p className="font-bold text-primary text-[11px] uppercase tracking-wider mb-1 flex items-center gap-1">
                      <Sparkles size={11} /> AI Highlights Briefing
                    </p>
                    {recentSavedNote.aiSummary || "* Summary generated from voice patterns."}
                  </div>

                  {/* Notification Action Buttons */}
                  <div className="flex flex-wrap items-center gap-2.5 pt-2">
                    {onSelectNote && (
                      <button
                        onClick={() => onSelectNote(recentSavedNote)}
                        className="px-4 py-2 bg-primary text-on-primary hover:bg-primary/95 text-xs font-bold rounded-xl flex items-center gap-1.5 shadow-sm transition-all cursor-pointer"
                      >
                        <ExternalLink size={13} />
                        Open Transcript in Editor
                      </button>
                    )}
                    <button
                      onClick={() => setRecentSavedId(null)}
                      className="px-4 py-2 bg-surface-container hover:bg-surface-container-high text-on-surface text-xs font-bold rounded-xl transition-all cursor-pointer"
                    >
                      Dismiss Alert
                    </button>
                  </div>
                </div>

                <button
                  onClick={() => setRecentSavedId(null)}
                  className="text-secondary hover:text-on-surface p-1.5 rounded-full hover:bg-surface-container/50 transition-colors cursor-pointer"
                  title="Close Alert"
                >
                  <X size={16} />
                </button>
              </div>
            </div>
          )}

          {/* Quick Hub Stats Panels */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="p-5 rounded-2xl bg-surface-container-lowest border border-outline-variant/20 flex items-center gap-4 shadow-sm">
              <div className="w-10 h-10 rounded-xl bg-primary/10 text-primary flex items-center justify-center shrink-0">
                <FileText size={18} />
              </div>
              <div>
                <p className="text-[10px] font-bold text-secondary uppercase tracking-widest">Saved Recordings</p>
                <p className="text-xl font-black text-on-surface mt-0.5">{audioRecordings.length} Memos</p>
              </div>
            </div>

            <div className="p-5 rounded-2xl bg-surface-container-lowest border border-outline-variant/20 flex items-center gap-4 shadow-sm">
              <div className="w-10 h-10 rounded-xl bg-orange-500/10 text-orange-600 flex items-center justify-center shrink-0">
                <Sparkles size={18} />
              </div>
              <div>
                <p className="text-[10px] font-bold text-secondary uppercase tracking-widest">AI Summarized</p>
                <p className="text-xl font-black text-on-surface mt-0.5">
                  {audioRecordings.filter(r => r.aiSummary).length} Synced
                </p>
              </div>
            </div>

            <div className="p-5 rounded-2xl bg-surface-container-lowest border border-outline-variant/20 flex items-center gap-4 shadow-sm">
              <div className="w-10 h-10 rounded-xl bg-blue-500/10 text-blue-600 flex items-center justify-center shrink-0">
                <Volume2 size={18} />
              </div>
              <div>
                <p className="text-[10px] font-bold text-secondary uppercase tracking-widest">Synthesizer Status</p>
                <p className="text-md font-bold text-green-600 mt-1 flex items-center gap-1.5">
                  <span className="w-2 h-2 rounded-full bg-green-500 animate-pulse"></span>
                  Active Reader
                </p>
              </div>
            </div>
          </div>

          {/* Search Bar filter */}
          <div className="flex items-center gap-3 bg-surface-container-low/70 border border-outline-variant/20 px-4 py-2.5 rounded-full max-w-md shadow-sm">
            <Search size={18} className="text-primary shrink-0" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Filter audio logs or transcripts..."
              className="bg-transparent border-none text-sm outline-none focus:ring-0 text-on-surface placeholder-on-surface-variant/60 w-full"
            />
            {searchQuery && (
              <button
                onClick={() => setSearchQuery("")}
                className="text-on-surface-variant hover:text-primary cursor-pointer"
              >
                <X size={15} />
              </button>
            )}
          </div>

          {/* 4. SAVED RECORDINGS GALLERY LIST */}
          <div className="space-y-4">
            <div className="flex items-center justify-between border-b border-outline-variant/10 pb-3">
              <h3 className="text-lg font-bold text-on-surface flex items-center gap-2">
                <Clock size={16} /> Tracked Sessions Archive
              </h3>
              <span className="text-xs text-secondary font-semibold">
                Showing {filteredRecordings.length} of {audioRecordings.length} recordings
              </span>
            </div>

            {filteredRecordings.length === 0 ? (
              <div className="flex flex-col items-center justify-center text-center p-12 bg-surface-container-lowest border border-dashed border-outline-variant/40 rounded-3xl space-y-4">
                <div className="w-16 h-16 rounded-full bg-surface-container flex items-center justify-center text-secondary">
                  <Mic size={30} className="stroke-[1.5]" />
                </div>
                <div className="space-y-1">
                  <h4 className="font-bold text-on-surface">No Voice Transcripts Found</h4>
                  <p className="text-xs text-secondary max-w-sm leading-relaxed">
                    {searchQuery
                      ? "No records matched your search filters. Try typing a different keyword."
                      : "Your vocal archives library is currently empty. Click the record button above to capture your first thoughts."}
                  </p>
                </div>
                {!searchQuery && (
                  <button
                    onClick={handleStartRecording}
                    className="mt-2 px-5 py-2 bg-primary/10 hover:bg-primary/15 text-primary font-bold text-xs rounded-xl transition-all cursor-pointer"
                  >
                    Create Your First Transcript
                  </button>
                )}
              </div>
            ) : (
              <div className="grid grid-cols-1 xl:grid-cols-2 gap-6">
                {filteredRecordings.map((rec) => {
                  const isPlaying = playingNoteId === rec.id;
                  const isExpandedBrief = expandedSummaryId === rec.id;
                  
                  return (
                    <div
                      key={rec.id}
                      className="p-6 rounded-[28px] bg-surface-container-lowest border border-outline-variant/30 shadow-sm flex flex-col justify-between space-y-4 hover:shadow-md transition-all relative overflow-hidden"
                    >
                      {/* Left border badge based on category */}
                      <div className="absolute top-0 bottom-0 left-0 w-1.5 bg-primary/20"></div>

                      <div className="space-y-2">
                        {/* Title and Badge timeline */}
                        <div className="flex items-start justify-between gap-4 pl-1">
                          <div className="space-y-1">
                            <h4 className="font-extrabold text-on-surface text-base pr-4 leading-tight">
                              {rec.title}
                            </h4>
                            <div className="flex items-center gap-2 text-[11px] text-secondary font-semibold">
                              <span className="font-mono">{rec.date || "Saved today"}</span>
                              <span>•</span>
                              <span className="px-1.5 py-0.5 rounded bg-surface-container font-mono flex items-center gap-1 text-[10px]">
                                <Clock size={10} />
                                {rec.duration || "0:45"}
                              </span>
                            </div>
                          </div>

                          <div className="flex items-center gap-1.5 shrink-0">
                            {onDeleteNote && (
                              <button
                                onClick={() => onDeleteNote(rec.id)}
                                className="p-2 text-secondary hover:text-error hover:bg-error/10 rounded-xl transition-colors cursor-pointer"
                                title="Delete Recording"
                              >
                                <Trash2 size={15} />
                              </button>
                            )}
                          </div>
                        </div>

                        {/* Text Excerpt transcript preview */}
                        <p className="text-xs text-on-surface-variant font-medium leading-relaxed pl-1 line-clamp-3">
                          {rec.content || "No transcript text available."}
                        </p>
                      </div>

                      {/* 5. INTERACTIVE WAVEFORM PLAYBACK PREVIEWER */}
                      <div className="bg-surface-container-low/40 border border-outline-variant/10 rounded-2xl p-3.5 flex items-center gap-3.5">
                        
                        <button
                          onClick={() => handlePlayRecording(rec)}
                          className={`w-10 h-10 rounded-full flex items-center justify-center shrink-0 shadow-sm transition-all cursor-pointer ${
                            isPlaying
                              ? "bg-error text-white"
                              : "bg-primary text-on-primary hover:scale-105"
                          }`}
                          title={isPlaying ? "Pause playback" : "Play transcript aloud"}
                        >
                          {isPlaying ? (
                            <Pause size={16} className="fill-white text-white" />
                          ) : (
                            <Play size={16} className="fill-white text-white ml-0.5" />
                          )}
                        </button>

                        <div className="flex-1 space-y-1">
                          {/* Play progress bar waveform simulator */}
                          <div className="relative">
                            {isPlaying ? (
                              <div className="h-4 flex items-center justify-start gap-1">
                                {Array.from({ length: 18 }).map((_, waveIdx) => {
                                  const h = Math.floor(Math.sin((playbackSeconds + waveIdx) * 0.8) * 12) + 16;
                                  return (
                                    <div
                                      key={waveIdx}
                                      className="w-1.5 rounded-full bg-primary animate-pulse transition-all duration-300"
                                      style={{ height: `${h}px` }}
                                    ></div>
                                  );
                                })}
                              </div>
                            ) : (
                              <div className="h-1 w-full bg-outline-variant/30 rounded-full overflow-hidden">
                                <div className="h-full bg-primary/40 rounded-full w-[25%]"></div>
                              </div>
                            )}
                          </div>

                          <div className="flex justify-between items-center text-[9px] font-mono font-bold text-secondary">
                            <span>{isPlaying ? formatTimeStr(playbackSeconds) : "00:00"}</span>
                            <span className="flex items-center gap-1 uppercase">
                              <Volume2 size={10} /> {isPlaying ? "Synthesizing Vocal Text" : "Click to Listen"}
                            </span>
                          </div>
                        </div>
                      </div>

                      {/* AI Summary Highlight Brief Drawer */}
                      {rec.aiSummary && (
                        <div className="space-y-2 border-t border-outline-variant/15 pt-3.5">
                          <button
                            onClick={() => setExpandedSummaryId(isExpandedBrief ? null : rec.id)}
                            className="text-xs text-primary font-bold hover:text-primary/80 flex items-center gap-1 cursor-pointer transition-colors"
                          >
                            <Sparkles size={13} className="text-primary" />
                            {isExpandedBrief ? "Hide AI Intelligence Briefing" : "Reveal AI Intelligence Briefing"}
                          </button>

                          {isExpandedBrief && (
                            <div className="p-3 rounded-2xl bg-primary/5 border border-primary/10 text-xs text-on-surface-variant leading-relaxed animate-fade-in">
                              {rec.aiSummary}
                            </div>
                          )}
                        </div>
                      )}

                      {/* Open Editor Link */}
                      {onSelectNote && (
                        <div className="flex justify-end pt-2">
                          <button
                            onClick={() => onSelectNote(rec)}
                            className="text-xs text-on-surface hover:text-primary font-bold flex items-center gap-1 cursor-pointer"
                          >
                            <span>Open Transcript Editor</span>
                            <ChevronRight size={14} />
                          </button>
                        </div>
                      )}

                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
