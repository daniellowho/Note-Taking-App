import React, { useState, useMemo, useEffect, useRef } from "react";
import {
  Pin,
  Clock,
  Calendar,
  Trash2,
  Search,
  Sparkles,
  Plus,
  Play,
  Pause,
  ChevronRight,
  Info,
  FileText,
  X,
  Share2,
  Mic,
  Volume2,
  ArrowRight,
  Sparkle
} from "lucide-react";
import { Note } from "../types";
import { ILLUSTRATION_WORKSPACE } from "../data";

interface DashboardViewProps {
  notes: Note[];
  searchQuery: string;
  onSelectNote: (note: Note) => void;
  onCreateNote: () => void;
  onAddNote: (note: Note) => void;
  onAddToast?: (text: string, type: "success" | "info" | "error") => void;
  onDeleteNote?: (id: string) => void;
}

// Conceptual terms mapping for Semantic AI Search (Synonyms and Intent Matching)
const LOGICAL_CONCEPTS: { [key: string]: { tags: string[]; terms: string[]; title: string } } = {
  roadmap: {
    title: "Strategic roadmap & allocation plans",
    tags: ["strategy", "planning", "system"],
    terms: ["roadmap", "allocation", "pillars", "growth", "quarters", "milestones", "priority", "strategic", "asset"]
  },
  design: {
    title: "Aesthetic rules & visual minimalism",
    tags: ["design", "guidelines", "sync"],
    terms: ["minimalism", "aesthetic", "cream", "white", "minimal", "shadows", "color", "transitions", "padding", "margins", "font", "css", "layout"]
  },
  aurora: {
    title: "Aurora project items & client logs",
    tags: ["project aurora", "client-feedback"],
    terms: ["aurora", "feedback", "client", "transitions", "speed", "react", "framer"]
  },
  voice: {
    title: "Audio transcribing & cognitive memos",
    tags: ["audio", "voice", "transcript", "feature"],
    terms: ["vocal", "voice", "memos", "microphone", "sound", "speak", "speaker", "speech", "transcribe", "listener", "audio", "recorder"]
  },
  focus: {
    title: "Focus, mindfulness & productivity",
    tags: ["strategy", "urgent", "milestone"],
    terms: ["cognitive", "whitespace", "fatigue", "calm", "productivity", "empowered", "priority", "high-energy", "efficiency"]
  }
};

export default function DashboardView({
  notes,
  searchQuery,
  onSelectNote,
  onCreateNote,
  onAddNote,
  onAddToast,
  onDeleteNote,
}: DashboardViewProps) {
  const [filterType, setFilterType] = useState<"all" | "voice" | "text">("all");
  const [localQuery, setLocalQuery] = useState(searchQuery);
  const [playingNoteId, setPlayingNoteId] = useState<string | null>(null);
  const [playbackSecs, setPlaybackSecs] = useState(0);
  const [expandedNotes, setExpandedNotes] = useState<Record<string, boolean>>({});
  const [waveformHeights, setWaveformHeights] = useState<number[]>([]);
  const [semanticResults, setSemanticResults] = useState<Record<string, { score: number; reason: string }> | null>(null);
  const [isSearchingAI, setIsSearchingAI] = useState(false);
  
  // Sync the local search query if the global search query changes
  useEffect(() => {
    setLocalQuery(searchQuery);
  }, [searchQuery]);

  // Debounced live Call to background /api/ai/semantic-search endpoint
  useEffect(() => {
    const q = localQuery.trim();
    if (!q) {
      setSemanticResults(null);
      setIsSearchingAI(false);
      return;
    }

    setIsSearchingAI(true);
    const delayDebounceFn = setTimeout(async () => {
      try {
        const response = await fetch("/api/ai/semantic-search", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ query: q, notes })
        });
        if (response.ok) {
          const data = await response.json();
          const indexing: Record<string, { score: number; reason: string }> = {};
          if (Array.isArray(data.results)) {
            data.results.forEach((match: any) => {
              indexing[match.id] = {
                score: match.score,
                reason: match.reason
              };
            });
          }
          setSemanticResults(indexing);
        }
      } catch (e) {
        console.error("Semantic search AI call error:", e);
      } finally {
        setIsSearchingAI(false);
      }
    }, 450);

    return () => clearTimeout(delayDebounceFn);
  }, [localQuery, notes]);

  // Handle waveform animation during speech synthesis playback
  useEffect(() => {
    if (!playingNoteId) {
      setPlaybackSecs(0);
      return;
    }

    const interval = setInterval(() => {
      setPlaybackSecs((prev) => prev + 1);
      // Randomize wave visual heights
      setWaveformHeights(Array.from({ length: 18 }, () => Math.floor(Math.random() * 24) + 6));
    }, 180);

    return () => clearInterval(interval);
  }, [playingNoteId]);

  // Semantic AI Search Scorer
  const scoredNotes = useMemo(() => {
    const q = localQuery.toLowerCase().trim();
    
    // Sort chronologically by default: newest first (newest IDs first, standard fallback)
    const sortedBaseNotes = [...notes].sort((a, b) => {
      const numA = parseInt(a.id.replace("note-", "")) || 0;
      const numB = parseInt(b.id.replace("note-", "")) || 0;
      if (numA && numB) {
        return numB - numA;
      }
      return b.id.localeCompare(a.id);
    });

    if (!q) {
      return sortedBaseNotes.map((note) => ({
        ...note,
        semanticScore: 100,
        matchedConcepts: [] as string[],
        searchExplanation: ""
      }));
    }

    // If we have AI-powered semantic search results back from the server
    if (semanticResults !== null) {
      return sortedBaseNotes
        .map((note) => {
          const match = semanticResults[note.id];
          const score = match ? match.score : 0;
          return {
            ...note,
            semanticScore: score,
            matchedConcepts: match ? [match.reason] : [],
            searchExplanation: match ? match.reason : ""
          };
        })
        .filter((note) => note.semanticScore > 15)
        .sort((a, b) => b.semanticScore - a.semanticScore);
    }

    // Local Concept Synonyms Fallback (while loading or offline)
    return sortedBaseNotes
      .map((note) => {
        const titleText = note.title.toLowerCase();
        const contentText = note.content.toLowerCase();
        const summaryText = (note.aiSummary || "").toLowerCase();
        const tagsJoined = note.tags.map((t) => t.toLowerCase()).join(" ");
        
        let score = 0;
        const matchedConcepts: string[] = [];

        // 1. Keyword keyword matches (direct overlap)
        const keywords = q.split(/\s+/).filter((w) => w.length > 1);
        keywords.forEach((word) => {
          if (titleText.includes(word)) score += 40;
          if (contentText.includes(word)) score += 20;
          if (summaryText.includes(word)) score += 25;
          if (tagsJoined.includes(word)) score += 30;
        });

        // 2. CONCEPTUAL SEMANTIC RELATION MAPPING
        Object.entries(LOGICAL_CONCEPTS).forEach(([conceptKey, meta]) => {
          const queryMatchesConcept = q.includes(conceptKey) || meta.terms.some((term) => q.includes(term));
          if (queryMatchesConcept) {
            let matchesRes = false;
            
            // Tag overlap
            const hasMatchedTag = note.tags.some((tag) => meta.tags.includes(tag.toLowerCase()));
            if (hasMatchedTag) {
              matchesRes = true;
              score += 35;
            }

            // Word overlap in note content
            const keytermsInNote = meta.terms.filter((term) => contentText.includes(term) || titleText.includes(term));
            if (keytermsInNote.length > 0) {
              matchesRes = true;
              score += Math.min(keytermsInNote.length * 15, 45);
            }

            if (matchesRes) {
              matchedConcepts.push(meta.title);
            }
          }
        });

        return {
          ...note,
          semanticScore: score,
          matchedConcepts: Array.from(new Set(matchedConcepts)),
          searchExplanation: matchedConcepts.length > 0 ? `Concept: ${matchedConcepts.join(", ")}` : "Keyword overlap match"
        };
      })
      .filter((note) => note.semanticScore > 0)
      .sort((a, b) => b.semanticScore - a.semanticScore);
  }, [notes, localQuery, semanticResults]);

  // Apply Filter Bar Options
  const filteredNotes = useMemo(() => {
    return scoredNotes.filter((note) => {
      const isVoice = note.source === "voice" || note.duration !== undefined || note.tags.includes("Audio") || note.tags.includes("Transcript");
      if (filterType === "voice") return isVoice;
      if (filterType === "text") return !isVoice;
      return true;
    });
  }, [scoredNotes, filterType]);

  // Determine active semantic search patterns to provide responsive feedback
  const activeSemanticMatchExplanation = useMemo(() => {
    if (!localQuery.trim()) return null;
    const matchedKeys = Object.keys(LOGICAL_CONCEPTS).filter(
      (key) =>
        localQuery.toLowerCase().includes(key) ||
        LOGICAL_CONCEPTS[key].terms.some((term) => localQuery.toLowerCase().includes(term))
    );
    if (matchedKeys.length === 0) return null;
    return matchedKeys.map((key) => LOGICAL_CONCEPTS[key].title).join(" & ");
  }, [localQuery]);

  // Toggle Play / Speech playback
  const handlePlayAudio = (note: Note, e: React.MouseEvent) => {
    e.stopPropagation();
    if (playingNoteId === note.id) {
      handleStopPlayback();
      return;
    }

    handleStopPlayback();
    setPlayingNoteId(note.id);
    onAddToast?.(`Playing digital audio playback: "${note.title}"`, "info");

    if (window.speechSynthesis) {
      window.speechSynthesis.cancel();
      const narrationText = `Note title is ${note.title}. Summary states: ${note.aiSummary || note.content.substring(0, 150)}`;
      const utterance = new SpeechSynthesisUtterance(narrationText);
      utterance.rate = 1.05;
      utterance.onend = () => setPlayingNoteId(null);
      utterance.onerror = () => setPlayingNoteId(null);
      window.speechSynthesis.speak(utterance);
    }
  };

  const handleStopPlayback = () => {
    setPlayingNoteId(null);
    if (window.speechSynthesis) {
      window.speechSynthesis.cancel();
    }
  };

  // Toggle expand summary transcript / full note
  const toggleExpand = (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    setExpandedNotes((prev) => ({
      ...prev,
      [id]: !prev[id],
    }));
  };

  // Mock Note Share functionality with beautiful toast copy confirmation
  const handleShareNote = (note: Note, e: React.MouseEvent) => {
    e.stopPropagation();
    const mockUrl = `${window.location.origin}/notes/${note.id}`;
    if (navigator.clipboard) {
      navigator.clipboard.writeText(mockUrl);
    }
    onAddToast?.(`Copied workspace intelligence link for "${note.title}" to clipboard!`, "success");
  };

  // Category visual themes matching our professional, high-contrast palette
  const getCategoryTheme = (category: string) => {
    switch (category) {
      case "Strategy":
        return "bg-primary/10 text-primary border border-primary/20";
      case "Draft":
        return "bg-indigo-50 text-indigo-600 border border-indigo-200/50";
      case "Urgent":
        return "bg-red-50 text-red-600 border border-red-200/50";
      case "Idea":
        return "bg-amber-50 text-amber-700 border border-amber-200/50";
      case "Reminder":
        return "bg-teal-50 text-teal-700 border border-teal-200/50";
      case "Event":
        return "bg-purple-50 text-purple-700 border border-purple-200/50";
      default:
        return "bg-gray-50 text-gray-700 border border-gray-200";
    }
  };

  return (
    <div className="w-full max-w-[1280px] mx-auto px-6 pb-24 pt-6 font-sans animate-fade-in">
      
      {/* Sleek Top Hero Row with Minimalist Actions */}
      <section className="flex flex-col md:flex-row justify-between items-start md:items-center gap-6 mb-10 pb-6 border-b border-outline-variant/15">
        <div>
          <div className="flex items-center gap-2.5 mb-1.5">
            <h1 className="text-3xl font-extrabold tracking-tight text-on-surface">
              All Notes Hub
            </h1>
            <span className="text-[10px] bg-primary/10 text-primary uppercase font-extrabold tracking-wider px-2.5 py-1 rounded-full border border-primary/15">
              Unified Feed
            </span>
          </div>
          <p className="text-sm text-secondary leading-relaxed max-w-2xl font-medium">
            Review your dynamic spoken transcriptions and typed project notes compiled securely side-by-side chronologically with automated AI digests.
          </p>
        </div>

        {/* Minimal compact quick-action trigger buttons instead of a massive create note box */}
        <div className="flex items-center gap-3 shrink-0">
          <button
            onClick={onCreateNote}
            className="px-5 py-3 rounded-2xl bg-primary text-on-primary hover:bg-primary/95 text-xs font-bold shadow-sm hover:scale-[1.02] active:scale-[0.98] transition-all flex items-center gap-2 cursor-pointer"
            title="Create Text Draft Note"
          >
            <Plus size={16} strokeWidth={2.5} />
            <span>New Note</span>
          </button>
        </div>
      </section>

      {/* Modern Filter, Search and Conceptual Match bar */}
      <section className="space-y-4 mb-8">
        
        {/* Search Input block */}
        <div className="w-full bg-surface-container-lowest border border-outline-variant/30 rounded-[32px] p-4 soft-shadow flex flex-col md:flex-row items-stretch md:items-center justify-between gap-4">
          <div className="flex-1 flex items-center gap-3 px-2">
            <Search size={20} className="text-primary shrink-0" />
            <input
              type="text"
              value={localQuery}
              onChange={(e) => setLocalQuery(e.target.value)}
              placeholder="Search concepts across both voice transcripts and written drafts..."
              className="w-full text-sm md:text-base bg-transparent border-none outline-none focus:ring-0 text-on-surface placeholder:text-secondary/50 font-medium"
            />
            {localQuery && (
              <button
                onClick={() => setLocalQuery("")}
                className="text-secondary hover:text-primary transition-colors cursor-pointer p-1 rounded-full hover:bg-surface-container"
              >
                <X size={16} />
              </button>
            )}
          </div>

          {/* Interactive filter toggle buttons inside search container */}
          <div className="flex items-center gap-1 bg-surface-container-low p-1.5 rounded-full border border-outline-variant/10">
            {(["all", "voice", "text"] as const).map((type) => (
              <button
                key={type}
                onClick={() => setFilterType(type)}
                className={`px-4 py-2 text-xs font-bold rounded-full capitalize transition-all cursor-pointer ${
                  filterType === type
                    ? "bg-primary text-on-primary shadow-sm"
                    : "text-secondary hover:text-primary"
                }`}
              >
                {type === "all" ? "All" : type === "voice" ? "Voice" : "Text"}
              </button>
            ))}
          </div>
        </div>

        {/* Semantic AI Synonym Feedback Banner */}
        {localQuery.trim() && (
          <div className="bg-primary/5 border border-primary/10 rounded-2xl p-4 flex items-start gap-3 animate-fade-in font-sans">
            <Sparkles size={16} className={`text-primary mt-0.5 shrink-0 ${isSearchingAI ? "animate-spin" : "animate-pulse"}`} />
            <div className="space-y-0.5 flex-1">
              <p className="text-xs font-bold text-primary flex items-center gap-2">
                <span>{isSearchingAI ? "Analyzing Concepts with Gemini..." : "Nova Semantic AI Search Active"}</span>
                <span className="text-[10px] font-mono font-semibold bg-primary/10 px-1.5 py-0.2 rounded-md">
                  Synonyms Enabled
                </span>
                {isSearchingAI && (
                  <span className="text-[10px] text-primary/70 animate-pulse font-normal">
                    (Contacting backend model...)
                  </span>
                )}
              </p>
              <p className="text-[11px] text-on-surface-variant font-medium leading-relaxed">
                Matches found: <span className="font-bold text-primary">{filteredNotes.length} notes</span>.
                {!isSearchingAI && activeSemanticMatchExplanation && (
                  <> Matched query synonyms: <span className="underline italic text-primary font-bold">{activeSemanticMatchExplanation}</span>.</>
                )}
              </p>
            </div>
          </div>
        )}
      </section>

      {/* Main Chronological Notes Feed */}
      <section className="space-y-6">
        {filteredNotes.length === 0 ? (
          <div className="text-center py-20 bg-surface-container-lowest border border-dashed border-outline-variant/30 rounded-[32px] space-y-4 max-w-xl mx-auto">
            <div className="w-16 h-16 rounded-full bg-surface-container flex items-center justify-center text-secondary mx-auto">
              <FileText size={28} className="stroke-[1.5]" />
            </div>
            <div className="space-y-1">
              <h4 className="font-bold text-on-surface text-base">No matches found</h4>
              <p className="text-xs text-secondary leading-relaxed max-w-sm mx-auto">
                {localQuery
                  ? "Our synonym mapping and content search scanned your database but yielded no results. Try adjusting your query keywords."
                  : "No items match the currently selected filter type."}
              </p>
            </div>
            {localQuery && (
              <button
                onClick={() => setLocalQuery("")}
                className="px-4 py-2 bg-primary/15 text-primary text-xs font-bold rounded-xl hover:bg-primary/20 transition-all cursor-pointer"
              >
                Clear Search Filter
              </button>
            )}
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {filteredNotes.map((note) => {
              const isVoice = note.source === "voice" || note.duration !== undefined || note.tags.includes("Audio") || note.tags.includes("Transcript");
              const isPlaying = playingNoteId === note.id;
              const isExpanded = !!expandedNotes[note.id];
              
              // Standardized consistent 1-2 sentence fallback summaries
              const primarySummary = note.aiSummary || (note.content ? note.content.split('.').slice(0, 2).join('.') + '.' : "Cognitive session summary pending compilation.");

              return (
                <div
                  key={note.id}
                  onClick={() => {
                    // Click collapses or expands note inline inside feed!
                    setExpandedNotes((prev) => ({
                      ...prev,
                      [note.id]: !prev[note.id]
                    }));
                  }}
                  className={`group relative rounded-[32px] border bg-surface-container-lowest p-6 md:p-8 soft-shadow hover:border-primary/30 transition-all duration-300 flex flex-col justify-between hover:-translate-y-1 overflow-hidden min-h-[380px] cursor-pointer ${
                    note.pinned ? "border-primary/20 ring-1 ring-primary/5 animate-pulse-subtle" : "border-outline-variant/30"
                  }`}
                >
                  {/* Pin status corner ribbon */}
                  {note.pinned && (
                    <div className="absolute top-0 right-0 p-3 bg-primary-container/20 border-l border-b border-primary/10 rounded-bl-2xl">
                      <Pin size={14} className="text-primary rotate-45 transform" />
                    </div>
                  )}

                  {/* Top Category and Badging Line */}
                  <div>
                    <div className="flex items-center justify-between gap-2.5 mb-5" onClick={(e) => e.stopPropagation()}>
                      <span className={`px-2.5 py-1 rounded-full text-[10px] font-extrabold uppercase tracking-widest ${getCategoryTheme(note.category)}`}>
                        {note.category}
                      </span>
                      
                      {/* Note Type Badge explicitly "Voice" or "Text" */}
                      <span className={`px-2.5 py-1 rounded-full text-[10px] font-bold flex items-center gap-1 shrink-0 ${
                        isVoice 
                          ? "bg-teal-50 text-teal-600 border border-teal-200/50" 
                          : "bg-indigo-50/70 text-indigo-600 border border-indigo-100"
                      }`}>
                        {isVoice ? <Mic size={10} className="text-teal-500 animate-pulse" /> : <FileText size={10} className="text-indigo-500" />}
                        <span>{isVoice ? "Voice" : "Text"}</span>
                      </span>
                    </div>

                    {/* AI Generated Title */}
                    <h3 className="text-lg font-extrabold text-on-surface mb-2.5 group-hover:text-primary transition-colors tracking-tight line-clamp-2">
                      {note.title || "Untitled Intelligence Brief"}
                    </h3>

                    {/* AI Generated 1-2 Sentence Summary (always shown instead of full content) */}
                    <div className="bg-surface-container-low/40 rounded-2xl p-4 border border-outline-variant/10 text-xs text-on-surface-variant font-medium leading-relaxed italic mb-4 relative">
                      <div className="flex items-center gap-1.5 text-primary text-[10px] font-bold uppercase tracking-wider mb-1.5">
                        <Sparkles size={11} />
                        <span>AI Executive Summary</span>
                      </div>
                      <p className="line-clamp-3">
                        {primarySummary}
                      </p>
                    </div>

                    {/* Semantic Match explanation Indicator */}
                    {localQuery.trim() && note.semanticScore && (
                      <div className="mb-4 p-2 bg-primary/10 rounded-xl border border-primary/15 text-[10px] text-primary leading-snug">
                        <div className="font-extrabold uppercase font-mono tracking-wider mb-0.5 flex items-center gap-1">
                          <Sparkle size={9} /> Matches query terms ({Math.min(note.semanticScore, 100)}% fit)
                        </div>
                        {note.searchExplanation && <p className="font-medium text-primary/80">{note.searchExplanation}</p>}
                      </div>
                    )}

                    {/* Tags section */}
                    {note.tags && note.tags.length > 0 && (
                      <div className="flex flex-wrap gap-1.5 mb-4" onClick={(e) => e.stopPropagation()}>
                        {note.tags.map((tag) => (
                          <span
                            key={tag}
                            className="text-[10px] bg-slate-100 hover:bg-slate-200 text-slate-600 font-bold px-2 py-0.5 rounded-lg transition-colors"
                          >
                            #{tag}
                          </span>
                        ))}
                      </div>
                    )}
                  </div>

                  {/* Expand / Collapsible transcript panel block */}
                  <div className="mt-2 space-y-4">
                    {isExpanded && (
                      <div
                        onClick={(e) => e.stopPropagation()}
                        className="bg-white/85 border border-outline-variant/25 rounded-2xl p-4 text-xs font-mono text-on-surface-variant leading-relaxed shadow-inner max-h-[160px] overflow-y-auto animate-slide-up whitespace-pre-wrap"
                      >
                        <p className="text-[9px] font-bold text-slate-400 uppercase tracking-widest border-b border-stroke pb-1 mb-2">
                          {isVoice ? "Full Audio Transcript" : "Full Written Note Contents"}
                        </p>
                        {note.content || "[No written content present in note.]"}
                      </div>
                    )}

                    {/* Play Audio Block for Voice Memos */}
                    {isVoice && isPlaying && (
                      <div
                        onClick={(e) => e.stopPropagation()}
                        className="bg-teal-50/50 border border-teal-100 rounded-2xl p-3 flex items-center justify-between gap-3 animate-pulse"
                      >
                        <span className="text-[10px] font-mono font-bold text-teal-600 uppercase tracking-wider flex items-center gap-1.5">
                          <Volume2 size={12} /> Playing Synthesis Memos...
                        </span>
                        
                        {/* Dynamic multi bar visualizer heights */}
                        <div className="flex items-center gap-0.5 h-4">
                          {(waveformHeights.length > 0 ? waveformHeights : [10, 15, 6, 12, 19, 8]).map((h, i) => (
                            <div
                              key={i}
                              className="w-1 rounded-full bg-teal-500 transition-all duration-150"
                              style={{ height: `${h}px` }}
                            ></div>
                          ))}
                        </div>
                      </div>
                    )}

                    {/* Card Actions Row */}
                    <div className="pt-4 border-t border-outline-variant/10 flex flex-col gap-3">
                      
                      {/* Date Indicator info etc */}
                      <div className="flex items-center justify-between font-semibold text-[11px] text-slate-400 font-sans" onClick={(e) => e.stopPropagation()}>
                        <div className="flex items-center gap-1.5">
                          <Clock size={12} />
                          <span>{note.date || "Just now"}</span>
                        </div>
                        {note.duration && (
                          <span className="font-mono bg-teal-100/50 text-teal-700 px-1.5 py-0.5 rounded font-bold text-[9px] tracking-wide shrink-0">
                            ⏱️ {note.duration}
                          </span>
                        )}
                      </div>

                      {/* Explicit Interactive Actions Row with Open, Edit, Delete, Share */}
                      <div className="flex flex-wrap items-center justify-between gap-1.5 pt-1.5" onClick={(e) => e.stopPropagation()}>
                        
                        <div className="flex items-center gap-1.5">
                          {/* Play Audio Button for Voicednotes */}
                          {isVoice && (
                            <button
                              onClick={(e) => handlePlayAudio(note, e)}
                              className={`px-2.5 py-1.5 rounded-xl transition-all font-bold text-[10px] uppercase tracking-wide shrink-0 flex items-center gap-1.5 cursor-pointer active:scale-95 ${
                                isPlaying 
                                  ? "bg-red-500 text-white hover:bg-red-600 shadow" 
                                  : "bg-teal-50 text-teal-700 hover:bg-teal-100 border border-teal-200"
                              }`}
                              title={isPlaying ? "Pause narrative speech output" : "Play vocal memo using AI TTS reader"}
                            >
                              {isPlaying ? <Pause size={10} className="fill-white" /> : <Play size={10} className="fill-teal-700 ml-0.5" />}
                              <span>{isPlaying ? "Pause" : "Play Audio"}</span>
                            </button>
                          )}

                          {/* Expand Content toggle trigger text labels */}
                          <button
                            onClick={(e) => toggleExpand(note.id, e)}
                            className="px-2.5 py-1.5 rounded-xl text-[10px] font-extrabold uppercase tracking-wide bg-slate-50 hover:bg-slate-100 border border-slate-200 text-slate-600 transition-all duration-200 cursor-pointer text-center"
                            title={isVoice ? "Toggle audio full transcript view" : "Toggle written draft document content"}
                          >
                            {isExpanded 
                              ? (isVoice ? "Collapse Transcript" : "Collapse Note") 
                              : (isVoice ? "Expand Transcript" : "Expand Note")}
                          </button>
                        </div>

                        {/* Open, Edit, Delete, Share button mappings */}
                        <div className="flex items-center gap-1 shrink-0">
                          {/* Open Note button */}
                          <button
                            onClick={() => onSelectNote(note)}
                            className="px-2 py-1 bg-primary/5 text-primary hover:bg-primary/10 rounded-lg text-[10px] font-bold transition-all cursor-pointer border border-primary/10"
                            title="Open note view"
                          >
                            Open
                          </button>

                          {/* Edit Note button */}
                          <button
                            onClick={() => onSelectNote(note)}
                            className="px-2 py-1 bg-indigo-50/80 text-indigo-600 hover:bg-indigo-100 rounded-lg text-[10px] font-bold transition-all cursor-pointer border border-indigo-200/20"
                            title="Edit rich content"
                          >
                            Edit
                          </button>

                          {/* Share button */}
                          <button
                            onClick={(e) => handleShareNote(note, e)}
                            className="p-1 px-1.5 text-slate-400 hover:text-primary hover:bg-primary-container/10 rounded-lg transition-colors cursor-pointer text-xs flex items-center justify-center"
                            title="Copy share link"
                          >
                            <Share2 size={12} className="mr-0.5" />
                            <span className="text-[10px] font-bold">Share</span>
                          </button>

                          {/* Delete Note button */}
                          {onDeleteNote && (
                            <button
                              onClick={(e) => {
                                if (window.confirm(`Are you sure you want to delete "${note.title || "this note"}"?`)) {
                                  onDeleteNote(note.id);
                                }
                              }}
                              className="p-1 px-1.5 text-slate-400 hover:text-red-500 hover:bg-red-50 rounded-lg transition-colors cursor-pointer text-xs flex items-center justify-center"
                              title="Delete note item"
                            >
                              <Trash2 size={12} className="mr-0.5" />
                              <span className="text-[10px] font-bold">Delete</span>
                            </button>
                          )}
                        </div>

                      </div>
                    </div>

                  </div>
                </div>
              );
            })}
          </div>
        )}
      </section>

      {/* Decorative Accomplishments Illustration card */}
      <section className="mt-16 flex flex-col items-center text-center py-8 bg-white/20 border border-outline-variant/10 rounded-[32px] p-8 max-w-2xl mx-auto soft-shadow animate-fade-in">
        <div className="relative w-40 h-40 mb-4">
          <div className="absolute inset-x-0 bottom-0 top-6 bg-primary/5 rounded-full blur-2xl"></div>
          <img
            className="relative z-10 w-full h-full object-contain opacity-95 hover:scale-105 duration-500"
            alt="Workspace illustrations"
            src={ILLUSTRATION_WORKSPACE}
          />
        </div>
        <h3 className="text-lg font-extrabold text-on-surface">You're making swift progress!</h3>
        <p className="text-xs text-secondary max-w-sm mt-1 leading-relaxed font-semibold">
          Your centralized knowledge repository is synchronized across device systems automatically. Keep up the brilliant focus.
        </p>
      </section>
    </div>
  );
}
