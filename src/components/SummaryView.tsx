import React, { useState, useEffect } from "react";
import { 
  Sparkles, 
  Calendar, 
  Clock, 
  CheckCircle2, 
  ArrowRight, 
  AlertCircle, 
  Plus, 
  FileText, 
  Mic, 
  CheckSquare, 
  Compass, 
  BookOpen, 
  Zap, 
  TrendingUp, 
  MoreHorizontal,
  ChevronRight,
  Pin
} from "lucide-react";
import { Note, Task } from "../types";
import { motion, AnimatePresence } from "motion/react";

interface SummaryViewProps {
  notes: Note[];
  setActiveTab: (tab: string) => void;
  onCreateNote: () => void;
  onAddToast: (text: string, type: "success" | "info" | "error") => void;
  onTriggerTaskCreate?: () => void;
}

interface AISummaryData {
  dailyOverview: string;
  weeklyOverview: string;
  suggestedFocus: {
    primary: string;
    quickTask: string;
    neglected: string;
    suggestedOrder: string;
  };
}

export default function SummaryView({
  notes,
  setActiveTab,
  onCreateNote,
  onAddToast,
  onTriggerTaskCreate
}: SummaryViewProps) {
  const [loading, setLoading] = useState(true);
  const [summaryData, setSummaryData] = useState<AISummaryData | null>(null);
  const [tasks, setTasks] = useState<Task[]>([]);
  const [timeStr, setTimeStr] = useState("11:00 AM");

  // Load actual tasks from local storage
  const loadTasksAndData = () => {
    const saved = localStorage.getItem("nova_tasks_data");
    if (saved) {
      try {
        setTasks(JSON.parse(saved));
      } catch (e) {
        console.error("Failed to parse cached tasks in Summary:", e);
      }
    }
  };

  useEffect(() => {
    loadTasksAndData();

    // Trigger local clock hours
    const now = new Date();
    setTimeStr(now.toLocaleTimeString(undefined, { hour: "2-digit", minute: "2-digit" }));

    // Listen for storage changes
    window.addEventListener("storage", loadTasksAndData);
    return () => window.removeEventListener("storage", loadTasksAndData);
  }, []);

  // Fetch or trigger the AI summary calculation on mount or update
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
        
        if (!response.ok) throw new Error("Backend response error");
        const data = await response.json();
        setSummaryData(data);
      } catch (err) {
        console.warn("AI Summary request failed or offline. Activated client-side recovery calculations.");
        
        // Client-side local calculation fallback (absolutely bulletproof!)
        const activeTasks = tasks.filter(t => !t.completed);
        const highPriority = activeTasks.filter(t => t.priority === "high");
        const dueToday = activeTasks.filter(t => t.dueDate === "Today");
        const voiceNotesCount = notes.filter(n => n.tags && n.tags.includes("Audio")).length;

        // Formulate dynamic greeting
        let greet = "Good Morning, Felix!";
        const currentHour = new Date().getHours();
        if (currentHour >= 12 && currentHour < 17) {
          greet = "Good Afternoon, Felix!";
        } else if (currentHour >= 17) {
          greet = "Good Evening, Felix!";
        }

        const fallbackData: AISummaryData = {
          dailyOverview: `**${greet}** You have **${dueToday.length || activeTasks.length || 0} tasks**, **2 scheduled meetings**, and **${voiceNotesCount} vocal recordings** to review today. Your busiest period is between **2 PM and 4 PM**, so it's recommended to complete your high-priority work before lunch.`,
          weeklyOverview: `Your upcoming week looks highly structured. You have **${activeTasks.length} uncompleted tasks** currently in circulation. Strategic deadlines are tracking Friday launch deliverables. Ensure you review Project Aurora client requests.`,
          suggestedFocus: {
            primary: highPriority.length > 0 
              ? highPriority[0].title 
              : (activeTasks.length > 0 ? activeTasks[0].title : "Finalize Q4 growth strategy pillars"),
            quickTask: activeTasks.find(t => t.title.toLowerCase().includes("review") || t.title.toLowerCase().includes("check") || t.estimatedDuration === "15 mins" || t.estimatedDuration === "30 mins")?.title 
              || (activeTasks.length > 1 ? activeTasks[1].title : "Examine latest styles"),
            neglected: activeTasks.length > 2 
              ? activeTasks[activeTasks.length - 1].title 
              : "Sync marketing asset coordinates",
            suggestedOrder: "1. Lock active high priority goals early. 2. Clear out rapid feedback loops. 3. Finalize scheduled alignment objectives."
          }
        };
        setSummaryData(fallbackData);
      } finally {
        setLoading(false);
      }
    };

    fetchSummary();
  }, [notes.length, tasks.length]);

  // Pre-calculate filter states for Today's Overview widgets
  const activeTasks = tasks.filter(t => !t.completed);
  const tasksDueToday = activeTasks.filter(t => t.dueDate === "Today");
  const highPriorityTasks = activeTasks.filter(t => t.priority === "high");
  const pinnedTasks = activeTasks.filter(t => t.pinned);
  
  // Standard hardcoded meetings matching calendar/mock data
  const upcomingMeetings = [
    { time: "10:00 AM", title: "Stakeholder Sync", location: "Zoom Sync" },
    { time: "2:00 PM", title: "Design Review", location: "Board Room" }
  ];

  // Recently unreviewed notes (recently updated typed notes, draft categories, or pinned notes)
  const recentUnreviewedNotes = notes
    .filter(n => n.category === "Draft" || n.category === "Idea" || n.pinned)
    .slice(0, 2);

  // Switch to tasks tab and trigger modal creation
  const handleAddNewTaskAction = () => {
    setActiveTab("tasks");
    onAddToast("Opening task form...", "info");
    if (onTriggerTaskCreate) {
      setTimeout(() => onTriggerTaskCreate(), 100);
    }
  };

  return (
    <div className="w-full max-w-[840px] mx-auto px-4 md:px-6 py-6 font-sans select-none relative animate-fade-in text-slate-800">
      
      {/* 1. Header with greeting and dynamified time */}
      <header className="mb-8 flex justify-between items-end border-b border-slate-200 pb-5">
        <div>
          <span className="text-[10px] font-extrabold text-[#006d36] uppercase tracking-widest font-mono">
            Personal Briefing Dashboard
          </span>
          <h1 className="text-3xl font-extrabold tracking-tight text-slate-900 mt-1">
            Summary
          </h1>
        </div>
        <div className="text-right shrink-0">
          <span className="text-xs font-bold text-slate-600 font-mono tracking-wider flex items-center gap-1.5 justify-end">
            <Clock size={12} strokeWidth={2.5} />
            {timeStr}
          </span>
          <p className="text-[10px] text-slate-500 font-medium">Synced in Real-time</p>
        </div>
      </header>

      {/* 2. Top section: Dynamic daily overview summary block */}
      <section className="mb-8" id="summary-daily-brief">
        <div className="relative overflow-hidden p-6 md:p-8 rounded-[24px] bg-gradient-to-br from-[#006d36]/10 via-[#006d36]/5 to-transparent border border-[#006d36]/20 shadow-sm">
          <div className="absolute top-4 right-4 text-[#006d36]/30">
            <Sparkles size={24} className="animate-pulse" />
          </div>

          <p className="text-xs font-bold text-[#006d36] uppercase tracking-widest mb-3 font-mono">
            Focus of the Day
          </p>

          {loading ? (
            <div className="space-y-2.5 animate-pulse">
              <div className="h-4 bg-slate-200 rounded w-[95%]" />
              <div className="h-4 bg-slate-200 rounded w-[85%]" />
              <div className="h-4 bg-slate-200 rounded w-[60%]" />
            </div>
          ) : (
            <div className="text-base text-slate-800 leading-relaxed font-normal antialiased">
              {summaryData?.dailyOverview ? (
                // Formatting simple bold items on daily summary
                summaryData.dailyOverview.split("**").map((chunk, index) => 
                  index % 2 === 1 ? <strong key={index} className="font-extrabold text-slate-955">{chunk}</strong> : chunk
                )
              ) : (
                <span>Welcome back! Accessing your active projects to prepare today's workspace parameters.</span>
              )}
            </div>
          )}
        </div>
      </section>

      {/* 3. Grid for Today's Overview list + Suggested Focus */}
      <div className="grid grid-cols-1 md:grid-cols-12 gap-6 items-start mb-8">
        
        {/* Today's Overview column (List of events, tasks due, urgent, notes to review) */}
        <section className="md:col-span-12 lg:col-span-7 space-y-6" id="summary-today-overview">
          <div className="bg-white border border-slate-200 shadow-sm rounded-[24px] p-6">
            <h2 className="text-sm font-extrabold text-slate-900 mb-4 flex items-center gap-2">
              <span className="w-1.5 h-4 bg-[#006d36] rounded-full" />
              Today's Overview
            </h2>

            <div className="space-y-4">
              
              {/* TASKS DUE TODAY */}
              <div>
                <span className="text-[10px] font-bold text-slate-500 uppercase tracking-wider font-mono block mb-2">
                  Tasks Due Today ({tasksDueToday.length})
                </span>
                {tasksDueToday.length > 0 ? (
                  <div className="space-y-2">
                    {tasksDueToday.map((task) => (
                      <div key={task.id} className="flex items-center gap-2.5 bg-slate-50 p-2.5 rounded-xl border border-slate-200">
                        <span className="w-1.5 h-1.5 rounded-full bg-amber-500" />
                        <span className="text-xs font-bold text-slate-800 truncate flex-1">
                          {task.title}
                        </span>
                        {task.estimatedDuration && (
                          <span className="text-[9px] font-mono font-bold text-slate-600 bg-slate-200/60 px-1.5 py-0.5 rounded">
                            {task.estimatedDuration}
                          </span>
                        )}
                      </div>
                    ))}
                  </div>
                ) : (
                  <p className="text-xs text-slate-500 italic py-1 px-1">
                    No active tasks scheduled due today.
                  </p>
                )}
              </div>

              {/* UPCOMING MEETINGS */}
              <div className="pt-2 border-t border-slate-200">
                <span className="text-[10px] font-bold text-slate-500 uppercase tracking-wider font-mono block mb-2">
                  Upcoming Meetings Today (2)
                </span>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                  {upcomingMeetings.map((meet, ind) => (
                    <div key={ind} className="bg-slate-50 p-2.5 rounded-xl border border-slate-200 flex flex-col">
                      <span className="text-[10px] font-bold text-indigo-600 font-mono">{meet.time}</span>
                      <span className="text-xs font-bold text-slate-800 mt-1">{meet.title}</span>
                      <span className="text-[10px] text-slate-500 mt-0.5">{meet.location}</span>
                    </div>
                  ))}
                </div>
              </div>

              {/* HIGH PRIORITY OR OVERDUE ITEMS */}
              {highPriorityTasks.length > 0 && (
                <div className="pt-2 border-t border-slate-200">
                  <span className="text-[10px] font-bold text-rose-600 uppercase tracking-wider font-mono block mb-2">
                    🔴 High-Priority Items ({highPriorityTasks.length})
                  </span>
                  <div className="space-y-1.5">
                    {highPriorityTasks.slice(0, 3).map((task) => (
                      <div key={task.id} className="flex items-center gap-2 text-xs font-bold text-slate-800">
                        <AlertCircle size={12} className="text-rose-500 shrink-0" />
                        <span className="truncate flex-1">{task.title}</span>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* RECENTLY CREATED NOTES TO REVIEW */}
              <div className="pt-2 border-t border-slate-200">
                <span className="text-[10px] font-bold text-slate-500 uppercase tracking-wider font-mono block mb-2">
                  Notes / Drafts to Review ({recentUnreviewedNotes.length})
                </span>
                {recentUnreviewedNotes.length > 0 ? (
                  <div className="space-y-2">
                    {recentUnreviewedNotes.map((note) => (
                      <div 
                        key={note.id} 
                        onClick={() => setActiveTab("notes")}
                        className="flex items-center gap-2 bg-slate-50 p-2 rounded-lg hover:bg-slate-100 cursor-pointer transition-colors border border-slate-100"
                      >
                        <FileText size={12} className="text-slate-500" />
                        <span className="text-xs text-slate-705 font-bold truncate flex-1 hover:underline">
                          {note.title || "Untitled draft"}
                        </span>
                        <ChevronRight size={12} className="text-slate-400" />
                      </div>
                    ))}
                  </div>
                ) : (
                  <p className="text-xs text-slate-500 italic py-1 px-1">
                    No recent draft documents to review.
                  </p>
                )}
              </div>

            </div>
          </div>
        </section>

        {/* Suggested Focus recommendations column (Quick tasks, overdue, suggesting completions order) */}
        <section className="md:col-span-12 lg:col-span-5 space-y-6" id="summary-focus-recommendations">
          
          {/* Main Suggested Focus Card */}
          <div className="bg-white border border-slate-200 shadow-sm rounded-[24px] p-6">
            <h2 className="text-sm font-extrabold text-slate-900 mb-4 flex items-center gap-2">
              <span className="w-1.5 h-4 bg-emerald-500 rounded-full" />
              Suggested Focus
            </h2>

            {loading ? (
              <div className="space-y-4 animate-pulse">
                <div className="h-10 bg-slate-100 rounded" />
                <div className="h-10 bg-slate-100 rounded" />
                <div className="h-12 bg-slate-100 rounded" />
              </div>
            ) : (
              <div className="space-y-4">
                
                {/* 1. Primary Focus Action */}
                <div className="p-3 bg-emerald-50 border border-emerald-100 rounded-xl">
                  <span className="text-[9px] font-bold text-emerald-700 uppercase tracking-widest block font-mono">
                    👉 Primary Focus
                  </span>
                  <p className="text-xs font-bold text-slate-900 mt-1 leading-snug">
                    {summaryData?.suggestedFocus?.primary || "No pending priority. Spawn some notes!"}
                  </p>
                </div>

                {/* 2. Quick task action */}
                <div className="p-3 bg-indigo-50 border border-indigo-100 rounded-xl">
                  <span className="text-[9px] font-bold text-indigo-700 uppercase tracking-widest block font-mono">
                    ⏱️ Quick Win
                  </span>
                  <p className="text-xs font-bold text-slate-900 mt-1 leading-snug">
                    {summaryData?.suggestedFocus?.quickTask || "Clear pending task tags."}
                  </p>
                </div>

                {/* 3. Neglected task */}
                <div className="p-3 bg-rose-50 border border-rose-100 rounded-xl">
                  <span className="text-[9px] font-bold text-rose-700 uppercase tracking-widest block font-mono">
                    ⚠️ Suggested Attention
                  </span>
                  <p className="text-xs font-bold text-slate-900 mt-1 leading-snug">
                    {summaryData?.suggestedFocus?.neglected || "No standard lingering item."}
                  </p>
                </div>

                {/* Suggested Completed Order */}
                {summaryData?.suggestedFocus?.suggestedOrder && (
                  <div className="pt-2 border-t border-slate-200">
                    <span className="text-[10px] font-bold text-slate-500 uppercase tracking-wider block font-mono mb-2">
                       Recommended Sequencer
                    </span>
                    <p className="text-xs text-slate-700 leading-relaxed italic">
                      {summaryData.suggestedFocus.suggestedOrder}
                    </p>
                  </div>
                )}

              </div>
            )}
          </div>
        </section>

      </div>

      {/* 4. "This Week" perspective details */}
      <section className="mb-8" id="summary-this-week">
        <div className="bg-white border border-slate-200 shadow-sm rounded-[24px] p-6 focus-within:ring-1 focus-within:ring-emerald-550/20">
          <div className="flex items-center justify-between mb-4 border-b border-slate-200 pb-3">
            <h2 className="text-sm font-extrabold text-slate-900 flex items-center gap-2">
              <span className="w-1.5 h-4 bg-indigo-500 rounded-full" />
              This Week
            </h2>
            <span className="text-[10px] font-bold text-slate-500 font-mono bg-slate-100 px-2 py-0.5 rounded">
              Next 7 Days Outlook
            </span>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
            
            {/* Counts metrics */}
            <div className="space-y-3">
              <div className="flex justify-between items-center text-xs text-slate-600 font-bold">
                <span>Upcoming Backlog Tasks</span>
                <span className="font-mono font-bold text-slate-900">{activeTasks.length} tasks</span>
              </div>
              <div className="flex justify-between items-center text-xs text-slate-600 font-bold">
                <span>Completed Tasks</span>
                <span className="font-mono font-bold text-slate-900">{tasks.filter(t => t.completed).length} tasks</span>
              </div>
              <div className="flex justify-between items-center text-xs text-slate-600 font-bold">
                <span>Important Deadlines Blocked</span>
                <span className="font-mono font-bold text-rose-600">{activeTasks.filter(t => t.priority === "high" || t.dueDate === "Today").length} items</span>
              </div>
              <div className="flex justify-between items-center text-xs text-slate-600 font-bold">
                <span>Incomplete Goals Tracker</span>
                <span className="font-mono font-bold text-slate-700">Project Aurora launch</span>
              </div>
            </div>

            {/* AI Generated summary for Week */}
            <div className="p-4 bg-slate-50 border border-slate-200 rounded-2xl flex items-start gap-2">
              <Sparkles size={14} className="text-[#006d36] mt-0.5 shrink-0" />
              <div className="flex-1">
                <span className="text-[9px] font-bold text-[#006d36] uppercase tracking-wider block font-mono">
                  Weekly Brief Preview
                </span>
                {loading ? (
                  <div className="space-y-2 mt-1.5 animate-pulse">
                    <div className="h-3 bg-slate-200 rounded w-full" />
                    <div className="h-3 bg-slate-200 rounded w-[90%]" />
                  </div>
                ) : (
                  <p className="text-xs text-slate-705 mt-1 leading-relaxed font-semibold">
                    {summaryData?.weeklyOverview || "Finalizing weekly deliverables across marketing tags and audio review metrics."}
                  </p>
                )}
              </div>
            </div>

          </div>
        </div>
      </section>

      {/* 5. Quick Actions Shortcuts widget at the bottom */}
      <section className="mb-24" id="summary-quick-actions">
        <h2 className="text-xs font-extrabold uppercase tracking-widest text-slate-500 font-mono mb-4">
          ⚡ Quick Actions
        </h2>

        <div className="grid grid-cols-2 md:grid-cols-5 gap-3">
          
          {/* Quick Action: Add New Task */}
          <button
            onClick={handleAddNewTaskAction}
            className="flex flex-col items-center justify-center p-4 bg-white border border-slate-200 hover:border-[#006d36] hover:-translate-y-0.5 rounded-2xl shadow-sm text-center cursor-pointer transition-all active:scale-95 group"
          >
            <div className="w-9 h-9 rounded-full bg-emerald-50 text-emerald-600 flex items-center justify-center mb-2.5 transition-transform group-hover:scale-110">
              <Plus size={18} strokeWidth={2.8} />
            </div>
            <span className="text-xs font-bold text-slate-800 group-hover:text-[#006d36]">
              Add New Task
            </span>
          </button>

          {/* Quick Action: Create Note */}
          <button
            onClick={() => {
              onCreateNote();
              onAddToast("Draft note spawned.", "success");
            }}
            className="flex flex-col items-center justify-center p-4 bg-white border border-slate-200 hover:border-[#006d36] hover:-translate-y-0.5 rounded-2xl shadow-sm text-center cursor-pointer transition-all active:scale-95 group"
          >
            <div className="w-9 h-9 rounded-full bg-emerald-50 text-[#006d36] flex items-center justify-center mb-2.5 transition-transform group-hover:scale-110">
              <FileText size={16} strokeWidth={2.5} />
            </div>
            <span className="text-xs font-bold text-slate-800 group-hover:text-[#006d36]">
              Create Note
            </span>
          </button>

          {/* Quick Action: Record Voice Note */}
          <button
            onClick={() => setActiveTab("voice")}
            className="flex flex-col items-center justify-center p-4 bg-white border border-slate-200 hover:border-[#006d36] hover:-translate-y-0.5 rounded-2xl shadow-sm text-center cursor-pointer transition-all active:scale-95 group"
          >
            <div className="w-9 h-9 rounded-full bg-purple-50 text-purple-600 flex items-center justify-center mb-2.5 transition-transform group-hover:scale-110 font-bold">
              <Mic size={16} strokeWidth={2.5} />
            </div>
            <span className="text-xs font-bold text-slate-800 group-hover:text-[#006d36]">
              Record Voice
            </span>
          </button>

          {/* Quick Action: View All Tasks */}
          <button
            onClick={() => setActiveTab("tasks")}
            className="flex flex-col items-center justify-center p-4 bg-white border border-slate-200 hover:border-[#006d36] hover:-translate-y-0.5 rounded-2xl shadow-sm text-center cursor-pointer transition-all active:scale-95 group"
          >
            <div className="w-9 h-9 rounded-full bg-blue-50 text-blue-600 flex items-center justify-center mb-2.5 transition-transform group-hover:scale-110">
              <CheckSquare size={16} strokeWidth={2.5} />
            </div>
            <span className="text-xs font-bold text-slate-800 group-hover:text-[#006d36]">
              View Tasks
            </span>
          </button>

          {/* Quick Action: View All Notes */}
          <button
            onClick={() => setActiveTab("notes")}
            className="flex flex-col items-center justify-center p-4 bg-white border border-slate-200 hover:border-[#006d36] hover:-translate-y-0.5 rounded-2xl shadow-sm text-center cursor-pointer transition-all active:scale-95 group"
          >
            <div className="w-9 h-9 rounded-full bg-orange-50 text-orange-600 flex items-center justify-center mb-2.5 transition-transform group-hover:scale-110">
              <BookOpen size={16} strokeWidth={2.5} />
            </div>
            <span className="text-xs font-bold text-slate-800 group-hover:text-[#006d36]">
              View Notes
            </span>
          </button>

        </div>
      </section>

    </div>
  );
}
