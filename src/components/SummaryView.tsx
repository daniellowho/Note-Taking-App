import React, { useState, useEffect, useMemo } from "react";
import { 
  Sparkles, 
  Calendar, 
  Clock, 
  CheckSquare, 
  FileText, 
  AlertCircle, 
  ChevronRight,
  Bell
} from "lucide-react";
import { Note, Task } from "../types";
import { motion } from "motion/react";

interface SummaryViewProps {
  notes: Note[];
  setActiveTab: (tab: string) => void;
  onCreateNote: () => void;
  onAddToast: (text: string, type: "success" | "info" | "error") => void;
  onTriggerTaskCreate?: () => void;
}

export default function SummaryView({
  notes,
  setActiveTab,
  onCreateNote,
  onAddToast,
  onTriggerTaskCreate
}: SummaryViewProps) {
  const [loading, setLoading] = useState(true);
  const [insights, setInsights] = useState<string[]>([]);
  const [tasks, setTasks] = useState<Task[]>([]);
  const [timeStr, setTimeStr] = useState("");

  // Hydrate tasks from localStorage
  const loadTasks = () => {
    const saved = localStorage.getItem("nova_tasks_data");
    if (saved) {
      try {
        setTasks(JSON.parse(saved));
      } catch (e) {
        console.error("Failed to parse cached tasks in SummaryView:", e);
      }
    }
  };

  useEffect(() => {
    loadTasks();
    
    // Smooth time display update
    const updateTime = () => {
      const now = new Date();
      setTimeStr(now.toLocaleTimeString(undefined, { hour: "2-digit", minute: "2-digit" }));
    };
    updateTime();
    const timerInterval = setInterval(updateTime, 30000);

    // Keep state fully synchronized on back-and-forth updates
    window.addEventListener("storage", loadTasks);
    return () => {
      clearInterval(timerInterval);
      window.removeEventListener("storage", loadTasks);
    };
  }, []);

  // Fetch or trigger calculation
  useEffect(() => {
    const fetchSummary = async () => {
      setLoading(true);
      try {
        const response = await fetch("/api/ai/productivity-summary", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            notes,
            tasks,
            hourStr: timeStr
          })
        });
        
        if (!response.ok) throw new Error("Backend error");
        const data = await response.json();
        if (data.insights && Array.isArray(data.insights)) {
          setInsights(data.insights);
        } else {
          throw new Error("Invalid format");
        }
      } catch (err) {
        // Dynamic frontend local fallback calculations
        const activeTasksCount = tasks.filter(t => !t.completed).length;
        const overdueCount = tasks.filter(t => !t.completed && (t.dueDate === "Yesterday" || t.dueDate === "Overdue")).length;
        const fallbackInsights = [];
        
        fallbackInsights.push("You have 2 meetings scheduled today.");
        if (overdueCount > 0) {
          fallbackInsights.push(`${overdueCount} task${overdueCount > 1 ? "s are" : " is"} currently overdue.`);
        } else {
          fallbackInsights.push("All your high-priority targets are fully on track.");
        }
        fallbackInsights.push(`${activeTasksCount || 0} active task${activeTasksCount === 1 ? "" : "s"} left in your queue.`);
        
        setInsights(fallbackInsights.slice(0, 3));
      } finally {
        setLoading(false);
      }
    };

    fetchSummary();
  }, [notes.length, tasks.length]);

  // --- DATA INTERPRETATION CORES ---

  // 1. Today's Focus
  const tasksDueToday = useMemo(() => {
    return tasks.filter(t => !t.completed && t.dueDate === "Today");
  }, [tasks]);

  const meetingsToday = useMemo(() => {
    return [
      { id: "meet-1", time: "10:00 AM", title: "Stakeholder Sync", location: "Zoom Coordinator" },
      { id: "meet-2", time: "2:00 PM", title: "Design Review", location: "Main Board" }
    ];
  }, []);

  const eventsToday = useMemo(() => {
    const customEvents = notes.filter(n => n.category === "Event" && (n.date === "Today" || n.date === new Date().toISOString().split("T")[0]));
    if (customEvents.length > 0) {
      return customEvents.map(e => ({ id: e.id, title: e.title, time: e.reminderTime || "All Day" }));
    }
    return [{ id: "fallback-ev-1", title: "Nova Project v1.1 Deployment Warm-up", time: "All Day" }];
  }, [notes]);

  const remindersToday = useMemo(() => {
    const activeReminders = [
      ...tasks.filter(t => !t.completed && t.reminderActive && t.reminderTime).map(t => ({
        id: `task-rem-${t.id}`,
        title: t.title,
        time: t.reminderTime || "09:00 AM"
      })),
      ...notes.filter(n => n.reminderActive && n.reminderTime).map(n => ({
        id: `note-rem-${n.id}`,
        title: n.title,
        time: n.reminderTime || "09:00 AM"
      }))
    ];

    if (activeReminders.length > 0) return activeReminders;

    return [{
      id: "fallback-rem-1",
      title: "Review Q4 focus group audio transcripts",
      time: "01:30 PM"
    }];
  }, [tasks, notes]);

  // 2. This Week
  const upcomingMeetingsList = useMemo(() => {
    return [
      { id: "meet-wk-1", day: "Tomorrow", time: "2:00 PM", title: "Design Review Showcase", location: "Board Room" },
      { id: "meet-wk-2", day: "Thursday", time: "10:30 AM", title: "Quarterly alignment sync", location: "Google Meet" }
    ];
  }, []);

  const upcomingDeadlinesList = useMemo(() => {
    return tasks.filter(t => !t.completed && t.dueDate !== "Today" && t.dueDate !== "Yesterday" && t.dueDate !== "Overdue").slice(0, 3);
  }, [tasks]);

  const upcomingEventsList = useMemo(() => {
    const customUpcomingEvents = notes.filter(n => n.category === "Event" && n.date !== "Today" && n.date !== "Yesterday");
    if (customUpcomingEvents.length > 0) {
      return customUpcomingEvents.map(e => ({ id: e.id, title: e.title, detail: `${e.date} at ${e.reminderTime || "All Day"}` }));
    }
    return [{ id: "fallback-wk-ev", title: "Cross-team Innovation Demo Showcase", detail: "Friday at 3:00 PM" }];
  }, [notes]);

  // 3. Needs Attention
  const overdueTasksList = useMemo(() => {
    return tasks.filter(t => !t.completed && (t.dueDate === "Yesterday" || t.dueDate === "Overdue"));
  }, [tasks]);

  const unfinishedHighPriority = useMemo(() => {
    return tasks.filter(t => !t.completed && t.priority === "high" && t.dueDate !== "Yesterday" && t.dueDate !== "Overdue");
  }, [tasks]);

  const missedRemindersList = useMemo(() => {
    // Collect active reminders on any past tasks/notes
    return tasks.filter(t => !t.completed && t.reminderActive && (t.dueDate === "Yesterday" || t.dueDate === "Overdue"));
  }, [tasks]);

  // Determine section show state
  const hasItemsUnderAttention = overdueTasksList.length > 0 || unfinishedHighPriority.length > 0 || missedRemindersList.length > 0;

  // 4. Recent Activity
  const recentNotesList = useMemo(() => {
    return [...notes].slice(0, 3);
  }, [notes]);

  // Distinct visual colored tags for day highlights
  const getDayColorTag = (dayStr: string) => {
    const d = dayStr.toLowerCase();
    if (d.includes("today")) {
      return "bg-emerald-50 text-[#006d36] border border-emerald-100/60 font-black px-2 py-0.5 rounded-md";
    }
    if (d.includes("tomorrow")) {
      return "bg-blue-50 text-blue-700 border border-blue-100/60 font-bold px-2 py-0.5 rounded-md";
    }
    if (d.includes("thursday")) {
      return "bg-amber-50 text-amber-700 border border-amber-100/60 font-semibold px-2 py-0.5 rounded-md";
    }
    if (d.includes("friday") || d.includes("june 19")) {
      return "bg-purple-50 text-purple-700 border border-purple-100/60 font-semibold px-2 py-0.5 rounded-md";
    }
    if (d.includes("saturday") || d.includes("sunday")) {
      return "bg-rose-50 text-rose-700 border border-rose-100/60 font-bold px-2 py-0.5 rounded-md";
    }
    return "bg-slate-50 text-slate-500 border border-slate-150 px-2 py-0.5 rounded-md font-medium";
  };

  return (
    <div className="w-full max-w-[620px] mx-auto px-4 md:px-6 py-8 font-sans select-none relative pb-28 animate-fade-in text-slate-800">
      
      {/* HEADER: Minimal title & dynamic synced clock */}
      <header className="mb-8 flex justify-between items-baseline">
        <div>
          <span className="text-[10px] font-extrabold text-[#006d36] uppercase tracking-widest font-mono">
            Felix's Agenda
          </span>
          <h1 className="text-3xl font-black text-slate-900 mt-0.5">
            At a Glance
          </h1>
        </div>
        <div className="text-right flex items-center gap-1.5 text-slate-400 font-mono text-xs font-bold leading-none">
          <Clock size={12} strokeWidth={2.5} />
          {timeStr || "11:00 AM"}
        </div>
      </header>

      {/* QUIET AI ROLE: Minimal glanceable insights */}
      <section className="mb-6" id="ai-quick-glance-insights">
        <div className="bg-emerald-50/60 border border-emerald-100/80 rounded-2xl p-4">
          <div className="flex items-center gap-1.5 text-[10px] text-[#006d36] font-extrabold uppercase tracking-wider font-mono mb-2">
            <Sparkles size={11} strokeWidth={2.8} />
            AI Highlights
          </div>
          
          {loading ? (
            <div className="space-y-1.5 animate-pulse py-1">
              <div className="h-3 bg-slate-200/80 rounded w-[85%]" />
              <div className="h-3 bg-slate-200/80 rounded w-[72%]" />
            </div>
          ) : (
            <ul className="space-y-1 text-xs text-slate-700 font-semibold leading-relaxed">
              {insights.map((insight, index) => (
                <li key={index} className="flex items-start gap-2">
                  <span className="text-[#006d36] select-none text-xs leading-none">•</span>
                  <span>{insight}</span>
                </li>
              ))}
            </ul>
          )}
        </div>
      </section>

      {/* SECTION 1: TODAY'S FOCUS (First thing user sees) */}
      <section className="mb-8" id="section-todays-focus">
        <h2 className="text-[10px] font-extrabold uppercase tracking-widest text-[#006d36] font-mono mb-3">
          Today's Focus
        </h2>
        
        <div className="bg-white border border-slate-100 rounded-2xl p-4.5 shadow-sm space-y-4">
          
          {/* Due Today Tasks */}
          <div>
            <span className="text-[9px] font-black uppercase text-slate-400 tracking-wider">
              Due Today
            </span>
            {tasksDueToday.length > 0 ? (
              <div className="mt-1.5 space-y-1.5">
                {tasksDueToday.map(t => (
                  <div key={t.id} className="flex items-center gap-2.5">
                    <CheckSquare size={13} className="text-[#006d36]" />
                    <span className="text-xs font-bold text-slate-800 truncate">{t.title}</span>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-xs text-slate-400 italic font-medium mt-1">No tasks due today.</p>
            )}
          </div>

          {/* Meetings Today */}
          <div className="pt-3 border-t border-slate-50">
            <span className="text-[9px] font-black uppercase text-slate-400 tracking-wider">
              Meetings
            </span>
            <div className="mt-1.5 space-y-1.5">
              {meetingsToday.map(m => (
                <div key={m.id} className="flex items-baseline justify-between gap-4">
                  <span className="text-xs font-bold text-slate-800 truncate">{m.title}</span>
                  <span className={`text-[10px] font-mono shrink-0 border ${getDayColorTag("Today")}`}>{m.time}</span>
                </div>
              ))}
            </div>
          </div>

          {/* Events Today */}
          <div className="pt-3 border-t border-slate-50">
            <span className="text-[9px] font-black uppercase text-slate-400 tracking-wider">
              Events
            </span>
            <div className="mt-1.5 space-y-1.5">
              {eventsToday.map(e => (
                <div key={e.id} className="flex items-baseline justify-between gap-4">
                  <span className="text-xs font-bold text-slate-850 truncate">{e.title}</span>
                  <span className={`text-[10px] font-mono shrink-0 border ${getDayColorTag("Today")}`}>{e.time}</span>
                </div>
              ))}
            </div>
          </div>

          {/* Reminders Today */}
          <div className="pt-3 border-t border-slate-50">
            <span className="text-[9px] font-black uppercase text-slate-400 tracking-wider">
              Reminders
            </span>
            <div className="mt-1.5 space-y-1.5">
              {remindersToday.map(r => (
                <div key={r.id} className="flex items-baseline justify-between gap-4">
                  <span className="text-xs font-semibold text-slate-700 truncate">{r.title}</span>
                  <span className={`text-[10px] font-mono shrink-0 border ${getDayColorTag("Today")}`}>{r.time}</span>
                </div>
              ))}
            </div>
          </div>

        </div>
      </section>

      {/* SECTION 2: THIS WEEK (concise agenda outlook) */}
      <section className="mb-8" id="section-upcoming-week">
        <div className="flex justify-between items-center mb-3">
          <h2 className="text-[10px] font-extrabold uppercase tracking-widest text-[#006d36] font-mono flex items-center gap-1.5">
            <span className="w-1.5 h-1.5 bg-[#006d36] rounded-full" />
            This Week
          </h2>
          <button
            onClick={() => setActiveTab("calendar")}
            className="px-3 py-1 bg-[#006d36] hover:bg-[#005128] text-white text-[10px] font-black uppercase tracking-wider rounded-lg cursor-pointer transition-all duration-200 border border-[#006d36]"
          >
            This Week Button
          </button>
        </div>
        
        <div className="bg-white border border-slate-100 rounded-2xl p-4.5 shadow-sm space-y-4">
          
          {/* Upcoming Meetings */}
          <div>
            <span className="text-[9px] font-black uppercase text-slate-400 tracking-wider">
              Upcoming Meetings
            </span>
            <div className="mt-1.5 space-y-2">
              {upcomingMeetingsList.map(m => (
                <div key={m.id} className="flex items-baseline justify-between gap-4">
                  <span className="text-xs font-bold text-slate-800 truncate">{m.title}</span>
                  <span className={`text-[10px] font-mono shrink-0 border ${getDayColorTag(m.day)}`}>{m.day} @ {m.time}</span>
                </div>
              ))}
            </div>
          </div>

          {/* Upcoming Deadlines */}
          <div className="pt-3 border-t border-slate-50">
            <span className="text-[9px] font-black uppercase text-slate-400 tracking-wider">
              Upcoming Deadlines
            </span>
            {upcomingDeadlinesList.length > 0 ? (
              <div className="mt-1.5 space-y-2">
                {upcomingDeadlinesList.map(t => (
                  <div key={t.id} className="flex items-baseline justify-between gap-4">
                    <span className="text-xs font-semibold text-slate-700 truncate">{t.title}</span>
                    <span className={`text-[10px] font-mono shrink-0 border ${getDayColorTag(t.dueDate)}`}>{t.dueDate}</span>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-xs text-slate-400 italic font-medium mt-1">No deadlines scheduled.</p>
            )}
          </div>

          {/* Upcoming Events */}
          <div className="pt-3 border-t border-slate-50">
            <span className="text-[9px] font-black uppercase text-slate-400 tracking-wider">
              Upcoming Events
            </span>
            <div className="mt-1.5 space-y-2">
              {upcomingEventsList.map(e => (
                <div key={e.id} className="flex items-baseline justify-between gap-4">
                  <span className="text-xs font-bold text-slate-850 truncate">{e.title}</span>
                  <span className={`text-[10px] font-mono shrink-0 border ${getDayColorTag("Friday")}`}>{e.detail}</span>
                </div>
              ))}
            </div>
          </div>

        </div>
      </section>

      {/* SECTION 3: NEEDS ATTENTION (Overdue, high-priority, missed - hidden if empty) */}
      {hasItemsUnderAttention && (
        <section className="mb-8 animate-fade-in" id="section-needs-attention">
          <h2 className="text-[10px] font-extrabold uppercase tracking-widest text-rose-600 font-mono mb-3">
            Needs Attention
          </h2>
          
          <div className="bg-rose-50/40 border border-rose-100 rounded-2xl p-4.5 space-y-3">
            
            {/* Overdue Tasks */}
            {overdueTasksList.length > 0 && (
              <div className="space-y-1.5">
                <span className="text-[9px] font-black uppercase text-rose-600 tracking-wider block">
                  Overdue Tasks
                </span>
                {overdueTasksList.map(t => (
                  <div key={t.id} className="flex items-center gap-2 text-xs font-bold text-slate-900 bg-white/70 px-2.5 py-1.5 rounded-xl border border-rose-100/30">
                    <AlertCircle size={12} className="text-rose-600 shrink-0" />
                    <span className="truncate flex-1">{t.title}</span>
                    <span className={`text-[9px] font-mono border ${getDayColorTag("Overdue")}`}>{t.dueDate}</span>
                  </div>
                ))}
              </div>
            )}

            {/* Unfinished Important Items */}
            {unfinishedHighPriority.length > 0 && (
              <div className="pt-2">
                <span className="text-[9px] font-black uppercase text-rose-600 tracking-wider block mb-1.5">
                  Action Items
                </span>
                <div className="space-y-1">
                  {unfinishedHighPriority.map(t => (
                    <div key={t.id} className="flex items-center gap-2 text-xs font-semibold text-slate-800">
                      <span className="w-1.5 h-1.5 rounded-full bg-rose-500 shrink-0" />
                      <span className="truncate flex-1">{t.title}</span>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Missed active reminders */}
            {missedRemindersList.length > 0 && (
              <div className="pt-2">
                <span className="text-[9px] font-black uppercase text-rose-600 tracking-wider block mb-1">
                  Missed Reminders
                </span>
                <div className="space-y-1">
                  {missedRemindersList.map(m => (
                    <div key={m.id} className="text-xs text-slate-705 flex items-center gap-2">
                      <Bell size={11} className="text-rose-500 shrink-0 animate-bounce" />
                      <span className="truncate flex-1 font-semibold">{m.title}</span>
                      <span className="text-[9px] font-mono text-slate-400 font-bold">{m.reminderTime}</span>
                    </div>
                  ))}
                </div>
              </div>
            )}

          </div>
        </section>
      )}

      {/* SECTION 4: RECENT ACTIVITY (Continue where you left off) */}
      <section className="mb-12" id="section-recent-activity">
        <h2 className="text-[10px] font-extrabold uppercase tracking-widest text-slate-400 font-mono mb-3">
          Recent Activity
        </h2>
        
        {recentNotesList.length > 0 ? (
          <div className="space-y-2.5">
            {recentNotesList.map(note => (
              <button
                key={note.id}
                onClick={() => setActiveTab("notes")}
                className="w-full text-left bg-white border border-slate-100 hover:border-slate-200 rounded-2xl p-3.5 shadow-sm hover:shadow transition-all duration-200 cursor-pointer flex items-center justify-between group active:scale-[0.99]"
              >
                <div className="flex items-center gap-3 min-w-0 pr-3">
                  <div className="w-8 h-8 rounded-xl bg-slate-50 text-slate-400 group-hover:bg-[#006d36]/5 group-hover:text-[#006d36] flex items-center justify-center shrink-0 transition-colors">
                    <FileText size={14} />
                  </div>
                  <div className="min-w-0">
                    <span className="text-xs font-bold text-slate-800 truncate block">
                      {note.title || "Untitled Note"}
                    </span>
                    <span className="text-[10px] text-slate-400 uppercase tracking-widest font-extrabold mt-0.5 block font-mono">
                      {note.category} • {note.date}
                    </span>
                  </div>
                </div>
                <ChevronRight size={14} className="text-slate-300 group-hover:text-slate-500 transition-colors shrink-0" />
              </button>
            ))}
          </div>
        ) : (
          <p className="text-xs text-slate-400 italic font-semibold pl-1">No notes created yet.</p>
        )}
      </section>

    </div>
  );
}
