import React, { useState, useEffect, useMemo } from "react";
import { 
  FileText, 
  Mic, 
  CheckSquare, 
  Calendar, 
  Clock, 
  ChevronRight, 
  Plus, 
  Bell, 
  Briefcase, 
  Square, 
  CheckCircle, 
  Sparkles,
  Inbox
} from "lucide-react";
import { Note, Task } from "../types";
import { motion, AnimatePresence } from "motion/react";

interface HomeViewProps {
  notes: Note[];
  onSelectNote: (note: Note) => void;
  onCreateNote: () => void;
  setActiveTab: (tab: string) => void;
  onAddToast: (text: string, type: "success" | "info" | "error") => void;
  handleNewVoiceNoteAction?: () => void;
  handleNewTaskAction?: () => void;
}

export default function HomeView({
  notes,
  onSelectNote,
  onCreateNote,
  setActiveTab,
  onAddToast,
  handleNewVoiceNoteAction,
  handleNewTaskAction,
}: HomeViewProps) {
  const [greeting, setGreeting] = useState("Good Morning");
  const [tasks, setTasks] = useState<Task[]>([]);
  const [timeStr, setTimeStr] = useState("");

  // Track dynamic greeting based on actual local hours
  useEffect(() => {
    const hrs = new Date().getHours();
    if (hrs < 12) setGreeting("Good morning");
    else if (hrs < 17) setGreeting("Good afternoon");
    else setGreeting("Good evening");

    // Dynamic timer
    const updateTime = () => {
      const now = new Date();
      setTimeStr(now.toLocaleTimeString(undefined, { hour: "2-digit", minute: "2-digit" }));
    };
    updateTime();
    const interval = setInterval(updateTime, 30000);
    return () => clearInterval(interval);
  }, []);

  // Hydrate tasks from localStorage
  const loadTasks = () => {
    const saved = localStorage.getItem("nova_tasks_data");
    if (saved) {
      try {
        setTasks(JSON.parse(saved));
      } catch (e) {
        console.error("Failed to parse cached tasks in HomeView:", e);
      }
    }
  };

  useEffect(() => {
    loadTasks();
    window.addEventListener("storage", loadTasks);
    return () => window.removeEventListener("storage", loadTasks);
  }, []);

  // Filter tasks due today
  const activeTodayTasks = useMemo(() => {
    return tasks.filter(t => !t.completed && t.dueDate === "Today");
  }, [tasks]);

  // Standard meetings matching app schedule
  const todayMeetings = [
    { time: "10:00 AM", title: "Stakeholder Sync", location: "Zoom Sync" },
    { time: "2:00 PM", title: "Design Review", location: "Board Room" }
  ];

  // Upcoming reminders parsed dynamically
  const upcomingReminder = useMemo(() => {
    const taskReminder = tasks.find(t => t.reminderActive && t.reminderTime && !t.completed);
    if (taskReminder) {
      return {
        title: taskReminder.title,
        time: taskReminder.reminderTime,
        source: "Task Reminder"
      };
    }
    const noteReminder = notes.find(n => n.reminderActive && n.reminderTime);
    if (noteReminder) {
      return {
        title: noteReminder.title,
        time: noteReminder.reminderTime,
        source: "Note Reminder"
      };
    }
    // Hardcoded fallback matching initial states
    return {
      title: "Q4 focus group transcript review",
      time: "01:30 PM",
      source: "Scheduled Reminder"
    };
  }, [tasks, notes]);

  // Toggle tasks completion inline from the Home widget
  const handleToggleTask = (taskId: string, e: React.MouseEvent) => {
    e.stopPropagation();
    const updated = tasks.map(t => {
      if (t.id === taskId) {
        const nextCompleted = !t.completed;
        onAddToast(nextCompleted ? "Task completed! Beautiful focus." : "Task marked active.", "success");
        return { ...t, completed: nextCompleted };
      }
      return t;
    });
    setTasks(updated);
    localStorage.setItem("nova_tasks_data", JSON.stringify(updated));
    // Dispatch event to keep other tabs updated in real-time
    window.dispatchEvent(new Event("storage"));
  };

  // Extract the 4-5 most recent notes
  const recentNotes = useMemo(() => {
    return [...notes].slice(0, 5);
  }, [notes]);

  return (
    <div className="w-full max-w-[960px] mx-auto px-6 pb-28 pt-10 font-sans animate-fade-in text-slate-800">
      
      {/* 1. CALM HERO GREETING BLOCK */}
      <header className="mb-14 flex justify-between items-start">
        <motion.div 
          initial={{ opacity: 0, y: 15 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, ease: "easeOut" }}
          className="space-y-2"
        >
          <span className="text-[10px] font-extrabold text-[#006d36] uppercase tracking-widest font-mono">
            Nova Workspace
          </span>
          <h1 className="text-4xl md:text-5xl font-black tracking-tight text-slate-900 leading-none">
            {greeting}, Felix
          </h1>
          <p className="text-secondary text-sm font-medium pr-6 leading-relaxed max-w-lg antialiased">
            Simplify your productivity. What do you want to capture right now?
          </p>
        </motion.div>
        
        {timeStr && (
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 0.8 }}
            className="text-right shrink-0 select-none hidden sm:block font-mono bg-white border border-slate-200/80 rounded-2xl px-4 py-2.5 shadow-sm"
          >
            <span className="text-sm font-bold text-slate-700 block tracking-wider flex items-center gap-1.5 justify-end">
              <Clock size={13} strokeWidth={2.5} className="text-[#006d36]" />
              {timeStr}
            </span>
            <span className="text-[9px] text-slate-400 font-semibold block mt-0.5 uppercase tracking-widest">
              Live Coordinate
            </span>
          </motion.div>
        )}
      </header>

      {/* 2. PROMINENT PRIMARY WORKSPACE CAPTURE BUTTONS */}
      <section className="grid grid-cols-1 md:grid-cols-2 gap-5 mb-14">
        
        {/* NEW TEXT NOTE BUTTON */}
        <motion.button
          whileHover={{ y: -4, scale: 1.01 }}
          whileTap={{ scale: 0.99 }}
          onClick={onCreateNote}
          className="group relative overflow-hidden bg-white hover:bg-slate-50/50 border border-slate-200 shadow-sm rounded-[28px] p-8 text-left transition-all duration-300 cursor-pointer flex flex-col justify-between min-h-[170px]"
        >
          <div className="absolute top-0 right-0 w-32 h-32 bg-slate-50 rounded-full filter blur-3xl group-hover:bg-indigo-50/30 transition-colors pointer-events-none"></div>
          
          <div className="flex justify-between items-start">
            <div className="w-12 h-12 rounded-2xl bg-slate-100 group-hover:bg-emerald-50 text-slate-700 group-hover:text-[#006d36] flex items-center justify-center transition-all duration-300">
              <FileText size={22} className="transition-transform group-hover:scale-110" />
            </div>
            <span className="text-slate-300 group-hover:text-primary transition-colors">
              <ChevronRight size={18} strokeWidth={2.5} />
            </span>
          </div>

          <div className="space-y-1 mt-6">
            <h3 className="text-lg font-extrabold text-slate-900 group-hover:text-[#006d36] transition-colors leading-tight">
              New Text Note
            </h3>
            <p className="text-xs text-secondary font-medium tracking-wide leading-relaxed">
              Draft layout, projects, strategic memos, or simple ideas.
            </p>
          </div>
        </motion.button>

        {/* NEW VOICE NOTE BUTTON */}
        <motion.button
          whileHover={{ y: -4, scale: 1.01 }}
          whileTap={{ scale: 0.99 }}
          onClick={() => {
            if (handleNewVoiceNoteAction) {
              handleNewVoiceNoteAction();
            } else {
              setActiveTab("voice");
            }
          }}
          className="group relative overflow-hidden bg-white hover:bg-slate-50/50 border border-slate-200 shadow-sm rounded-[28px] p-8 text-left transition-all duration-300 cursor-pointer flex flex-col justify-between min-h-[170px]"
        >
          <div className="absolute top-0 right-0 w-32 h-32 bg-slate-50 rounded-full filter blur-3xl group-hover:bg-emerald-50/30 transition-colors pointer-events-none"></div>
          
          <div className="flex justify-between items-start">
            <div className="w-12 h-12 rounded-2xl bg-slate-100 group-hover:bg-emerald-50 text-slate-700 group-hover:text-[#006d36] flex items-center justify-center transition-all duration-300">
              <Mic size={22} className="transition-transform group-hover:scale-110" />
            </div>
            <span className="text-slate-300 group-hover:text-primary transition-colors">
              <ChevronRight size={18} strokeWidth={2.5} />
            </span>
          </div>

          <div className="space-y-1 mt-6">
            <h3 className="text-lg font-extrabold text-slate-900 group-hover:text-[#006d36] transition-colors leading-tight">
              New Voice Note
            </h3>
            <p className="text-xs text-secondary font-medium tracking-wide leading-relaxed">
              Record conversations, meetings, or thoughts with AI audio sync.
            </p>
          </div>
        </motion.button>

      </section>

      {/* 3. TODAY'S OVERVIEW: BENTO INSIGHTS CARD GRID */}
      <h2 className="text-[10px] font-black uppercase tracking-widest text-[#006d36] font-mono mb-5 flex items-center gap-2">
        <span className="inline-block w-1.5 h-1.5 bg-[#006d36] rounded-full animate-ping"></span>
        Today's parameters
      </h2>

      <section className="grid grid-cols-1 lg:grid-cols-12 gap-6 mb-14">
        
        {/* TODAY'S TASKS COMPONENT (Col: 4) */}
        <div className="lg:col-span-4 bg-white border border-slate-200 rounded-[28px] p-6 shadow-sm flex flex-col justify-between min-h-[220px]">
          <div>
            <div className="flex justify-between items-center mb-4 pb-2 border-b border-slate-100">
              <h3 className="text-xs font-extrabold uppercase tracking-wider text-slate-500 font-mono flex items-center gap-1.5">
                <CheckSquare size={14} className="text-[#006d36]" />
                Today's Tasks
              </h3>
              <div className="flex items-center gap-1.5">
                {activeTodayTasks.length > 0 && (
                  <span className="text-[10px] bg-emerald-50 text-[#006d36] font-bold px-2 py-0.5 rounded-full font-mono">
                    {activeTodayTasks.length} pending
                  </span>
                )}
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    setActiveTab("tasks");
                    if (handleNewTaskAction) {
                      setTimeout(() => handleNewTaskAction(), 150);
                    }
                  }}
                  className="w-5 h-5 rounded-full bg-slate-50 hover:bg-emerald-50 text-slate-500 hover:text-[#006d36] border border-slate-200/80 flex items-center justify-center transition-all cursor-pointer hover:border-[#006d36]/30 active:scale-90"
                  title="Quick Add Task"
                >
                  <Plus size={10} strokeWidth={3} />
                </button>
              </div>
            </div>

            {activeTodayTasks.length > 0 ? (
              <div className="space-y-2 max-h-[140px] overflow-y-auto pr-1">
                {activeTodayTasks.map(t => (
                  <div 
                    key={t.id} 
                    onClick={(e) => handleToggleTask(t.id, e)}
                    className="flex items-center gap-2.5 p-2 hover:bg-slate-50 rounded-xl transition-all cursor-pointer group/task"
                  >
                    <button 
                      className="w-4 h-4 rounded-md border border-slate-300 group-hover/task:border-[#006d36] flex items-center justify-center transition-colors shrink-0 bg-transparent cursor-pointer"
                    >
                      <span className="w-1.5 h-1.5 bg-[#006d36] rounded-sm opacity-0 group-hover/task:opacity-40"></span>
                    </button>
                    <span className="text-xs font-semibold text-slate-800 truncate select-none flex-1">
                      {t.title}
                    </span>
                  </div>
                ))}
              </div>
            ) : (
              <div className="py-4 text-center space-y-1.5 flex flex-col items-center">
                <Inbox size={18} className="text-slate-300" />
                <p className="text-xs font-medium text-slate-400 italic">No tasks set for today.</p>
              </div>
            )}
          </div>

          <button 
            onClick={() => setActiveTab("tasks")}
            className="w-full text-center text-[10px] font-bold text-[#006d36] hover:underline pt-3 border-t border-slate-50 cursor-pointer flex items-center justify-center gap-1"
          >
            <span>Manage Focus Tasks</span>
            <ChevronRight size={10} />
          </button>
        </div>

        {/* TODAY'S MEETINGS COMPONENT (Col: 4) */}
        <div className="lg:col-span-4 bg-white border border-slate-200 rounded-[28px] p-6 shadow-sm flex flex-col justify-between min-h-[220px]">
          <div>
            <div className="flex justify-between items-center mb-4 pb-2 border-b border-slate-100">
              <h3 className="text-xs font-extrabold uppercase tracking-wider text-slate-500 font-mono flex items-center gap-1.5">
                <Calendar size={14} className="text-[#006d36]" />
                Today's Meetings
              </h3>
              <span className="text-[10px] bg-slate-100 text-slate-600 font-bold px-2 py-0.5 rounded-full font-mono">
                {todayMeetings.length} scheduled
              </span>
            </div>

            <div className="space-y-3">
              {todayMeetings.map((meet, idx) => (
                <div key={idx} className="flex items-start gap-2.5">
                  <div className="bg-indigo-50 text-indigo-700 font-bold text-[9px] font-mono px-1.5 py-0.5 rounded shrink-0 mt-0.5">
                    {meet.time}
                  </div>
                  <div className="space-y-0.5 leading-tight truncate flex-1">
                    <span className="text-xs font-bold text-slate-800 block truncate">
                      {meet.title}
                    </span>
                    <span className="text-[10px] text-slate-400 font-medium">
                      {meet.location}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </div>

          <button 
            onClick={() => setActiveTab("calendar")}
            className="w-full text-center text-[10px] font-bold text-[#006d36] hover:underline pt-3 border-t border-slate-50 cursor-pointer flex items-center justify-center gap-1"
          >
            <span>Open Calendar Schedule</span>
            <ChevronRight size={10} />
          </button>
        </div>

        {/* UPCOMING REMINDER COMPONENT (Col: 4) */}
        <div className="lg:col-span-4 bg-white border border-slate-200 rounded-[28px] p-6 shadow-sm flex flex-col justify-between min-h-[220px]">
          <div>
            <div className="flex justify-between items-center mb-4 pb-2 border-b border-slate-100">
              <h3 className="text-xs font-extrabold uppercase tracking-wider text-slate-500 font-mono flex items-center gap-1.5">
                <Bell size={14} className="text-[#006d36]" />
                Upcoming Reminder
              </h3>
            </div>

            {upcomingReminder ? (
              <div className="space-y-3 bg-slate-50 border border-slate-100 p-3.5 rounded-2xl flex items-start gap-2.5">
                <div className="w-1.5 h-1.5 rounded-full bg-[#006d36] mt-1.5 shrink-0 animate-pulse"></div>
                <div className="space-y-1 truncate flex-1">
                  <div className="flex items-center gap-1.5 justify-between">
                    <span className="font-mono text-[9px] font-bold text-slate-400 uppercase tracking-wider block">
                      {upcomingReminder.source}
                    </span>
                    <span className="text-[10px] font-bold font-mono text-[#006d36]">
                      {upcomingReminder.time}
                    </span>
                  </div>
                  <p className="text-xs font-bold text-slate-800 truncate pr-2">
                    {upcomingReminder.title}
                  </p>
                </div>
              </div>
            ) : (
              <div className="py-4 text-center flex flex-col items-center">
                <Inbox size={18} className="text-slate-300" />
                <p className="text-xs font-medium text-slate-400 italic">No reminders scheduled.</p>
              </div>
            )}
          </div>

          <button 
            onClick={() => setActiveTab("summary")}
            className="w-full text-center text-[10px] font-bold text-[#006d36] hover:underline pt-3 border-t border-slate-50 cursor-pointer flex items-center justify-center gap-1"
          >
            <span>View Brief Summary insights</span>
            <ChevronRight size={10} />
          </button>
        </div>

      </section>

      {/* 4. CLEAN RECENT NOTES SECTION */}
      <section className="space-y-4">
        <div className="flex justify-between items-end border-b border-slate-200/60 pb-3">
          <h2 className="text-lg font-black text-slate-900 tracking-tight flex items-center gap-2">
            <span className="w-1.5 h-4 bg-[#006d36] rounded-full" />
            Recent Notes
          </h2>
          <button 
            onClick={() => setActiveTab("notes")}
            className="text-xs font-bold text-secondary hover:text-[#006d36] tracking-wide flex items-center gap-1 cursor-pointer"
          >
            <span>View Note Repository</span>
            <ChevronRight size={14} />
          </button>
        </div>

        {recentNotes.length === 0 ? (
          <div className="text-center py-12 bg-white border border-slate-200 rounded-[28px] space-y-3">
            <FileText size={24} className="text-slate-300 mx-auto" />
            <p className="text-sm text-secondary font-medium">No notes available. Start capturing right now!</p>
            <button 
              onClick={onCreateNote}
              className="px-4 py-2 bg-primary text-on-primary font-bold text-xs rounded-xl hover:opacity-90 active:scale-95 transition-all text-center ml-auto"
            >
              Spawn First Note
            </button>
          </div>
        ) : (
          <div className="bg-white border border-slate-200 rounded-[28px] overflow-hidden shadow-sm divide-y divide-slate-100">
            {recentNotes.map((note) => {
              const isVoice = note.source === "voice" || note.duration !== undefined || note.tags.includes("Audio") || note.tags.includes("Transcript");
              return (
                <div
                  key={note.id}
                  onClick={() => onSelectNote(note)}
                  className="flex items-center justify-between p-5 hover:bg-slate-50/70 transition-all cursor-pointer group"
                >
                  <div className="flex items-center gap-4 min-w-0 pr-4">
                    <div className="w-10 h-10 rounded-xl bg-slate-100 text-slate-600 flex items-center justify-center shrink-0 group-hover:bg-[#006d36]/10 group-hover:text-[#006d36] transition-colors">
                      {isVoice ? <Mic size={16} /> : <FileText size={16} />}
                    </div>
                    
                    <div className="min-w-0 select-none">
                      <div className="flex items-center gap-2.5">
                        <span className="font-bold text-sm text-slate-900 truncate group-hover:text-[#006d36] transition-colors block leading-tight pr-1">
                          {note.title || "Untitled draft"}
                        </span>
                        {note.pinned && (
                          <span className="text-[9px] bg-primary-container text-on-primary-container font-extrabold uppercase px-1.5 py-0.2 rounded tracking-wide">
                            Pinned
                          </span>
                        )}
                      </div>
                      <div className="flex items-center gap-2 text-[10px] text-slate-400 mt-1 font-semibold">
                        <span>{note.date || "Just now"}</span>
                        <span>•</span>
                        <span className="px-1.5 py-0.2 rounded bg-slate-100 text-slate-500 text-[9px] uppercase tracking-wider font-bold">
                          {note.category}
                        </span>
                      </div>
                    </div>
                  </div>

                  <span className="text-slate-300 group-hover:text-[#006d36] transition-colors shrink-0 group-hover:translate-x-1 duration-200">
                    <ChevronRight size={18} strokeWidth={2.5} />
                  </span>
                </div>
              );
            })}
          </div>
        )}
      </section>

    </div>
  );
}
