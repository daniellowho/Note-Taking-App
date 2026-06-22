import React, { useState, useEffect, useMemo, useRef } from "react";
import { 
  Check, 
  Plus, 
  Trash2, 
  Copy, 
  Pin, 
  Edit2, 
  MoreVertical, 
  Calendar, 
  Sparkles, 
  AlertTriangle,
  X,
  FileText
} from "lucide-react";
import { Task, Note } from "../types";
import { INITIAL_TASKS } from "../data";
import { motion, AnimatePresence } from "motion/react";

interface TasksViewProps {
  onAddToast: (text: string, type: "success" | "info" | "error") => void;
  onAddNote?: (note: Note) => void;
  setActiveTab?: (tab: string) => void;
  autoOpenCreator?: boolean;
  onResetAutoOpen?: () => void;
}

export default function TasksView({ 
  onAddToast, 
  onAddNote, 
  setActiveTab,
  autoOpenCreator,
  onResetAutoOpen
}: TasksViewProps) {
  // Syncing list using local storage persistence
  const [tasks, setTasks] = useState<Task[]>(() => {
    const saved = localStorage.getItem("nova_tasks_data");
    if (saved) {
      try {
        return JSON.parse(saved);
      } catch (e) {
        console.error("Failed to parse cached tasks:", e);
      }
    }
    return INITIAL_TASKS;
  });

  // Watch for autoOpenCreator command
  useEffect(() => {
    if (autoOpenCreator) {
      handleOpenCreate();
      if (onResetAutoOpen) onResetAutoOpen();
    }
  }, [autoOpenCreator]);

  useEffect(() => {
    localStorage.setItem("nova_tasks_data", JSON.stringify(tasks));
  }, [tasks]);

  // Active filter state: "all" | "upcoming" | "completed"
  const [activeFilter, setActiveFilter] = useState<"all" | "upcoming" | "completed">("all");

  // Dialog & edit states
  const [showModal, setShowModal] = useState(false);
  const [editingTask, setEditingTask] = useState<Task | null>(null);
  const [activeMenuTaskId, setActiveMenuTaskId] = useState<string | null>(null);

  // Form states
  const [formTitle, setFormTitle] = useState("");
  const [formPriority, setFormPriority] = useState<"low" | "medium" | "high">("medium");
  const [formCategory, setFormCategory] = useState<"Personal" | "Work" | "School" | "General">("General");
  const [formDueDate, setFormDueDate] = useState("Today");
  const [formDueTime, setFormDueTime] = useState("");
  const [formDuration, setFormDuration] = useState("");
  const [formPinned, setFormPinned] = useState(false);
  const [formDescription, setFormDescription] = useState("");

  // Statistics
  const totalCount = tasks.length;
  const completedCount = tasks.filter(t => t.completed).length;

  // Progress Bar percentage calculation
  const progressPercent = totalCount > 0 ? Math.round((completedCount / totalCount) * 100) : 0;

  // Dropdown menu ref for closing when clicking outside
  const menuRef = useRef<HTMLDivElement | null>(null);
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
        setActiveMenuTaskId(null);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const handleOpenCreate = () => {
    setEditingTask(null);
    setFormTitle("");
    setFormPriority("medium");
    setFormCategory("General");
    setFormDueDate("Today");
    setFormDueTime("12:00 PM");
    setFormDuration("30 mins");
    setFormPinned(false);
    setFormDescription("");
    setShowModal(true);
  };

  const handleOpenEdit = (task: Task) => {
    setEditingTask(task);
    setFormTitle(task.title);
    setFormPriority(task.priority);
    setFormCategory(task.category || "General");
    setFormDueDate(task.dueDate || "Today");
    setFormDueTime(task.dueTime || "");
    setFormDuration(task.estimatedDuration || "");
    setFormPinned(task.pinned || false);
    setFormDescription(task.description || "");
    setShowModal(true);
  };

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();
    if (!formTitle.trim()) {
      onAddToast("Please enter a task title.", "error");
      return;
    }

    if (editingTask) {
      // Edit mode
      setTasks(prev => prev.map(t => {
        if (t.id === editingTask.id) {
          return {
            ...t,
            title: formTitle,
            priority: formPriority,
            category: formCategory,
            dueDate: formDueDate,
            dueTime: formDueTime,
            estimatedDuration: formDuration,
            pinned: formPinned,
            description: formDescription
          };
        }
        return t;
      }));
      onAddToast("Task updated successfully.", "success");
    } else {
      // New task mode
      const newTask: Task = {
        id: `task-${Date.now()}`,
        title: formTitle,
        completed: false,
        priority: formPriority,
        category: formCategory,
        dueDate: formDueDate,
        dueTime: formDueTime,
        estimatedDuration: formDuration,
        pinned: formPinned,
        description: formDescription
      };
      setTasks(prev => [newTask, ...prev]);
      onAddToast("New task created.", "success");
    }
    setShowModal(false);
  };

  const handleDelete = (id: string, title: string) => {
    setTasks(prev => prev.filter(t => t.id !== id));
    onAddToast(`"${title}" deleted.`, "info");
    setActiveMenuTaskId(null);
  };

  const handleDuplicate = (task: Task) => {
    const duplicated: Task = {
      ...task,
      id: `task-${Date.now()}`,
      title: `${task.title} (Copy)`,
      completed: false
    };
    setTasks(prev => {
      const idx = prev.findIndex(t => t.id === task.id);
      if (idx === -1) return [duplicated, ...prev];
      const nextList = [...prev];
      nextList.splice(idx + 1, 0, duplicated);
      return nextList;
    });
    onAddToast("Task duplicated.", "success");
    setActiveMenuTaskId(null);
  };

  // Quick action: Complete toggle
  const handleToggleComplete = (id: string) => {
    const task = tasks.find(t => t.id === id);
    if (!task) return;
    const nextCompleted = !task.completed;
    onAddToast(nextCompleted ? "Task completed! Well done." : "Task marked active.", "success");
    setTasks(prev => prev.map(t => t.id === id ? { ...t, completed: nextCompleted } : t));
  };

  // Quick action: Toggle Pin
  const handleTogglePin = (id: string) => {
    const task = tasks.find(t => t.id === id);
    if (!task) return;
    const nextPinned = !task.pinned;
    onAddToast(nextPinned ? "Task pinned." : "Task unpinned.", "info");
    setTasks(prev => prev.map(t => t.id === id ? { ...t, pinned: nextPinned } : t));
    setActiveMenuTaskId(null);
  };

  // Quick action: Convert to Note
  const handleConvertToNote = (task: Task) => {
    if (!onAddNote || !setActiveTab) {
      onAddToast("Action not available at the moment.", "error");
      return;
    }
    const cleanContent = `### Task details converted to static note

- **Title**: ${task.title}
- **Category**: ${task.category || "General"}
- **Estimated duration**: ${task.estimatedDuration || "Not Specified"}
- **Due**: ${task.dueDate} ${task.dueTime ? `at ${task.dueTime}` : ""}

**Context details:**
${task.description || "No description provided."}

Created via Convert to Note action on ${new Date().toLocaleDateString()}.`;

    const note: Note = {
      id: `note-${Date.now()}`,
      title: `[Task] ${task.title}`,
      content: cleanContent,
      category: "General",
      date: "Just now",
      pinned: true,
      collaborators: [],
      tags: ["task-migration", task.category || "General"],
      aiSummary: `Migrated task item "${task.title}" to strategy log notes.`
    };

    onAddNote(note);
    onAddToast("Task converted to Note!", "success");
    setActiveMenuTaskId(null);
    setTimeout(() => {
      setActiveTab("notes");
    }, 200);
  };

  // Filter and sort computation
  const displayedActiveTasks = useMemo(() => {
    return tasks
      .filter(t => !t.completed)
      .filter(t => {
        if (activeFilter === "completed") return false;
        return true;
      })
      .sort((a, b) => {
        // Pinned on top
        if (a.pinned && !b.pinned) return -1;
        if (!a.pinned && b.pinned) return 1;
        return b.id.localeCompare(a.id);
      });
  }, [tasks, activeFilter]);

  const displayedCompletedTasks = useMemo(() => {
    return tasks
      .filter(t => t.completed)
      .filter(t => {
        if (activeFilter === "upcoming") return false;
        return true;
      })
      .sort((a, b) => b.id.localeCompare(a.id)); // Newest completed first
  }, [tasks, activeFilter]);

  const matchesAny = displayedActiveTasks.length > 0 || displayedCompletedTasks.length > 0;

  return (
    <div className="w-full max-w-[620px] mx-auto px-4 md:px-6 py-8 font-sans select-none relative pb-24 animate-fade-in text-slate-800">
      
      {/* 1. Header with clean title & progress indicators */}
      <header className="mb-8">
        <div className="flex justify-between items-center mb-5">
          <div>
            <h1 className="text-3xl font-black tracking-tight text-slate-900" id="tasks-title-header">
              Tasks
            </h1>
            <p className="text-xs text-slate-500 font-semibold mt-1">
              Active milestones and checklist targets.
            </p>
          </div>

          <button
            onClick={handleOpenCreate}
            className="w-9 h-9 rounded-full bg-[#006d36] hover:bg-[#005228] text-white flex items-center justify-center shadow-md hover:shadow-lg active:scale-95 transition-all cursor-pointer shrink-0"
            title="Add Task"
          >
            <Plus size={18} strokeWidth={2.5} />
          </button>
        </div>

        {/* Progress stats and thin beautiful bar stacked nicely */}
        <div className="bg-slate-50 border border-slate-100/90 rounded-2xl p-4">
          <div className="flex items-center justify-between text-xs text-slate-600 font-bold mb-2">
            <span>Checklist Progress</span>
            <span className="font-mono text-[#006d36] font-black">{completedCount} of {totalCount} tasks completed ({progressPercent}%)</span>
          </div>
          <div className="w-full bg-slate-200/70 h-1.5 rounded-full overflow-hidden shadow-inner font-sans">
            <motion.div
              className="bg-[#006d36] h-full rounded-full transition-all duration-500 ease-out"
              style={{ width: `${progressPercent}%` }}
              layoutId="progress-bar-line"
            />
          </div>
        </div>
      </header>

      {/* 2. Simple pill style Filters bar */}
      <section className="mb-6 flex space-x-2" id="tasks-pill-filters">
        {(["all", "upcoming", "completed"] as const).map((filterOpt) => {
          const isActive = activeFilter === filterOpt;
          return (
            <button
              key={filterOpt}
              onClick={() => {
                setActiveFilter(filterOpt);
                setActiveMenuTaskId(null);
              }}
              className={`px-4 py-1.5 rounded-full text-xs font-bold transition-all capitalize border cursor-pointer active:scale-95 ${
                isActive
                  ? "bg-[#006d36] text-white border-[#006d36] shadow-sm"
                  : "bg-white text-slate-600 border-slate-200 hover:text-slate-900 hover:bg-slate-50"
              }`}
            >
              {filterOpt}
            </button>
          );
        })}
      </section>

      {/* 3. The Checklist Row feed */}
      <main className="space-y-1 relative">
        <AnimatePresence mode="popLayout">
          {displayedActiveTasks.map(task => (
            <TaskRow 
              key={task.id}
              task={task}
              activeMenuTaskId={activeMenuTaskId}
              setActiveMenuTaskId={setActiveMenuTaskId}
              onToggleComplete={handleToggleComplete}
              onOpenEdit={handleOpenEdit}
              onDuplicate={handleDuplicate}
              onDelete={handleDelete}
              onTogglePin={handleTogglePin}
              onConvertToNote={handleConvertToNote}
              menuRef={menuRef}
            />
          ))}
        </AnimatePresence>

        {/* Separator block if we have both active & completed showing on "All" filter */}
        {activeFilter === "all" && displayedActiveTasks.length > 0 && displayedCompletedTasks.length > 0 && (
          <div className="pt-6 pb-2">
            <h2 className="text-[11px] font-black uppercase tracking-wider text-slate-500 font-mono border-b border-slate-100 pb-1">
              Completed
            </h2>
          </div>
        )}

        <AnimatePresence mode="popLayout">
          {displayedCompletedTasks.map(task => (
            <TaskRow 
              key={task.id}
              task={task}
              activeMenuTaskId={activeMenuTaskId}
              setActiveMenuTaskId={setActiveMenuTaskId}
              onToggleComplete={handleToggleComplete}
              onOpenEdit={handleOpenEdit}
              onDuplicate={handleDuplicate}
              onDelete={handleDelete}
              onTogglePin={handleTogglePin}
              onConvertToNote={handleConvertToNote}
              menuRef={menuRef}
            />
          ))}
        </AnimatePresence>

        {/* 4. Empty State template */}
        {!matchesAny && (
          <div className="text-center py-20 px-6 max-w-sm mx-auto">
            <div className="w-12 h-12 bg-slate-50 rounded-full flex items-center justify-center mx-auto mb-4 border border-slate-200">
              <Check size={20} strokeWidth={2.5} className="text-slate-500" />
            </div>
            <h4 className="text-sm font-bold text-slate-800">You're all caught up</h4>
            <p className="text-xs text-slate-500 mt-1.5 max-w-xs mx-auto leading-relaxed font-semibold">
              Create a new task to stay organized and maintain structured daily progress.
            </p>
            <button
              onClick={handleOpenCreate}
              className="mt-5 inline-flex items-center gap-1.5 bg-[#006d36] text-white py-2 px-4 rounded-xl text-xs font-bold hover:bg-[#005228] transition-all shadow-sm cursor-pointer active:scale-95"
            >
              <Plus size={14} strokeWidth={2.5} />
              <span>Create Task</span>
            </button>
          </div>
        )}
      </main>

      {/* 6. Pure Elegance modal popup box */}
      {showModal && (
        <>
          <div 
            onClick={() => setShowModal(false)}
            className="fixed inset-0 bg-black/40 backdrop-blur-[2px] z-[90] animate-fade-in"
          />
          <div className="fixed top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 z-[100] max-w-md w-[92%] bg-white border border-slate-200 p-6 rounded-[24px] shadow-2xl animate-scale-up">
            
            <div className="flex justify-between items-center mb-5 pb-3 border-b border-slate-200">
              <h3 className="text-base font-bold text-slate-900">
                {editingTask ? "Update Task" : "New Task"}
              </h3>
              <button
                onClick={() => setShowModal(false)}
                className="text-slate-400 hover:text-slate-600 p-1 rounded-full hover:bg-slate-100 transition-all cursor-pointer"
              >
                <X size={16} />
              </button>
            </div>

            <form onSubmit={handleSave} className="space-y-4">
              
              <div className="space-y-1">
                <label className="text-[10px] font-bold text-slate-500 uppercase tracking-wider font-mono">
                  Task title
                </label>
                <input
                  type="text"
                  required
                  autoFocus
                  value={formTitle}
                  onChange={(e) => setFormTitle(e.target.value)}
                  placeholder="Review contrast ratios..."
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-sm text-slate-900 focus:outline-none focus:ring-1 focus:ring-primary placeholder:text-slate-400 font-semibold"
                />
              </div>

              <div className="space-y-1">
                <label className="text-[10px] font-bold text-slate-500 uppercase tracking-wider font-mono">
                  Category Tag
                </label>
                <select
                  value={formCategory}
                  onChange={(e) => setFormCategory(e.target.value as any)}
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl px-2.5 py-2 text-xs text-slate-900 focus:outline-none focus:ring-1 focus:ring-primary font-bold"
                >
                  <option value="General">General</option>
                  <option value="Work">Work</option>
                  <option value="School">School</option>
                  <option value="Personal">Personal</option>
                </select>
              </div>

              <div className="grid grid-cols-3 gap-2">
                <div className="space-y-1">
                  <label className="text-[10px] font-bold text-slate-500 uppercase tracking-wider font-mono">
                    Due date
                  </label>
                  <select
                    value={formDueDate}
                    onChange={(e) => setFormDueDate(e.target.value)}
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl px-2.5 py-1.5 text-xs text-slate-905 focus:outline-none focus:ring-1 focus:ring-primary font-bold"
                  >
                    <option value="Today">Today</option>
                    <option value="Yesterday">Yesterday</option>
                    <option value="Tomorrow">Tomorrow</option>
                    <option value="In 2 Days">In 2 Days</option>
                  </select>
                </div>

                <div className="space-y-1">
                  <label className="text-[10px] font-bold text-slate-500 uppercase tracking-wider font-mono">
                    Hour limit
                  </label>
                  <input
                    type="text"
                    value={formDueTime}
                    onChange={(e) => setFormDueTime(e.target.value)}
                    placeholder="2:00 PM"
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl px-2.5 py-1.5 text-xs text-slate-900 focus:outline-none focus:ring-1 focus:ring-primary placeholder:text-slate-400 font-bold"
                  />
                </div>

                <div className="space-y-1">
                  <label className="text-[10px] font-bold text-slate-500 uppercase tracking-wider font-mono">
                    Duration
                  </label>
                  <input
                    type="text"
                    value={formDuration}
                    onChange={(e) => setFormDuration(e.target.value)}
                    placeholder="30 mins"
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl px-2.5 py-1.5 text-xs text-slate-900 focus:outline-none focus:ring-1 focus:ring-primary placeholder:text-slate-400 font-bold"
                  />
                </div>
              </div>

              <div className="space-y-1">
                <label className="text-[10px] font-bold text-slate-500 uppercase tracking-wider font-mono">
                  Description
                </label>
                <textarea
                  value={formDescription}
                  onChange={(e) => setFormDescription(e.target.value)}
                  placeholder="Add descriptive context guide steps..."
                  rows={2}
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs text-slate-900 focus:outline-none focus:ring-1 focus:ring-primary resize-none placeholder:text-slate-450 font-semibold"
                />
              </div>

              <div className="pt-2 flex items-center justify-between">
                <label className="flex items-center gap-1.5 text-xs font-bold text-slate-600 cursor-pointer">
                  <input 
                    type="checkbox"
                    checked={formPinned}
                    onChange={(e) => setFormPinned(e.target.checked)}
                    className="w-3.5 h-3.5 text-primary border-slate-300 rounded focus:ring-primary cursor-pointer"
                  />
                  <span>Pin to top</span>
                </label>

                <div className="flex space-x-2">
                  <button
                    type="button"
                    onClick={() => setShowModal(false)}
                    className="px-3.5 py-2 hover:bg-slate-100 rounded-xl text-xs font-bold text-slate-500 cursor-pointer active:scale-95"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className="px-4 py-2 bg-primary text-white rounded-xl text-xs font-bold hover:bg-primary/95 cursor-pointer active:scale-95 animate-fade-in"
                  >
                    Save Task
                  </button>
                </div>
              </div>

            </form>
          </div>
        </>
      )}

    </div>
  );
}

/* Redesigned Compact Row Task checklist item */
interface TaskRowProps {
  key?: string;
  task: Task;
  activeMenuTaskId: string | null;
  setActiveMenuTaskId: (id: string | null) => void;
  onToggleComplete: (id: string) => void;
  onOpenEdit: (task: Task) => void;
  onDuplicate: (task: Task) => void;
  onDelete: (id: string, title: string) => void;
  onTogglePin: (id: string) => void;
  onConvertToNote: (task: Task) => void;
  menuRef: React.RefObject<HTMLDivElement | null>;
}

function TaskRow({
  task,
  activeMenuTaskId,
  setActiveMenuTaskId,
  onToggleComplete,
  onOpenEdit,
  onDuplicate,
  onDelete,
  onTogglePin,
  onConvertToNote,
  menuRef
}: TaskRowProps) {

  const isMenuOpen = activeMenuTaskId === task.id;

  return (
    <motion.div
      layout
      initial={{ opacity: 0, y: 4 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, scale: 0.95 }}
      transition={{ duration: 0.2 }}
      className={`group flex items-start justify-between p-4 bg-white border border-slate-100 hover:border-slate-200/80 hover:bg-slate-50/30 rounded-2xl transition-all duration-200 relative mb-3 hover:shadow-sm ${
        task.completed ? "opacity-60" : ""
      }`}
    >
      <div className="flex items-start space-x-3.5 flex-1 min-w-0 pr-2">
        
        {/* Completion checkbox circle with high visibility click actions */}
        <button
          onClick={() => onToggleComplete(task.id)}
          className={`w-5 h-5 rounded-full border flex items-center justify-center transition-all cursor-pointer mt-0.5 shrink-0 ${
            task.completed
              ? "bg-[#006d36] border-[#006d36] shadow-sm animate-scale-up"
              : "border-slate-300 hover:border-[#006d36] bg-slate-50/50"
          }`}
          aria-label={task.completed ? "Mark incomplete" : "Mark complete"}
        >
          {task.completed && (
            <Check size={11} strokeWidth={3.5} className="text-white" />
          )}
        </button>
 
        {/* Task Details Content Stack */}
        <div className="flex-1 min-w-0 flex flex-col">
          <div className="flex flex-wrap items-center gap-2">
            <span 
              className={`text-sm font-bold tracking-tight text-slate-900 ${
                task.completed ? "line-through text-slate-400 font-medium" : ""
              }`}
            >
              {task.title}
            </span>
 
            {/* Inline Badges/Icons that belong next to the title */}
            {task.pinned && (
              <Pin size={11} className="text-[#006d36] fill-[#006d36] rotate-45 shrink-0" title="Pinned focus task" />
            )}
          </div>

          {/* Description step - fully visible and high contrast */}
          {task.description && (
            <p 
              className={`text-xs text-slate-500 mt-1.5 leading-relaxed font-semibold ${
                task.completed ? "line-through opacity-70" : ""
              }`}
            >
              {task.description}
            </p>
          )}

          {/* Compact Labels Row underneath */}
          {(task.dueDate || (task.category && task.category !== "General") || task.estimatedDuration) && (
            <div className="flex flex-wrap items-center gap-x-2 gap-y-1 mt-2.5">
              {task.dueDate && (
                <span className="text-[10px] font-bold text-slate-500 font-mono flex items-center gap-1 bg-slate-50 border border-slate-100 px-2 py-0.5 rounded-md">
                  <Calendar size={10} strokeWidth={2.5} className="text-slate-400" />
                  {task.dueDate} {task.dueTime ? `@ ${task.dueTime}` : ""}
                </span>
              )}
              
              {task.category && task.category !== "General" && (
                <span className="text-[9px] font-bold uppercase tracking-wider text-[#006d36] bg-[#006d36]/5 border border-[#006d36]/10 px-2 py-0.5 rounded-md">
                  {task.category}
                </span>
              )}

              {task.estimatedDuration && (
                <span className="text-[10px] font-bold text-slate-500 font-mono flex items-center gap-1 bg-slate-50 border border-slate-100 px-1.5 py-0.5 rounded-md">
                  <span className="text-[11px] scale-90 select-none">⏱️</span> {task.estimatedDuration}
                </span>
              )}
            </div>
          )}
        </div>

      </div>

      {/* Right side Menu dropdown element */}
      <div className="relative shrink-0 flex items-center mt-0.5">
        <button
          onClick={(e) => {
            e.stopPropagation();
            setActiveMenuTaskId(isMenuOpen ? null : task.id);
          }}
          className="text-slate-400 hover:text-slate-600 p-1.5 rounded-full hover:bg-slate-100 transition-colors cursor-pointer"
          title="Actions menu"
        >
          <MoreVertical size={15} />
        </button>

        {isMenuOpen && (
          <div 
            ref={menuRef}
            className="absolute right-0 top-8 w-38 bg-white border border-slate-200 rounded-xl shadow-xl py-1 z-50 animate-scale-up font-sans"
          >
            {/* PIN OPTION */}
            <button
              onClick={() => onTogglePin(task.id)}
              className="w-full text-left px-3 py-1.5 text-xs text-slate-800 hover:bg-slate-50 flex items-center gap-1.5 font-bold cursor-pointer"
            >
              <Pin size={12} className="rotate-45 text-slate-400" />
              <span>{task.pinned ? "Unpin task" : "Pin task"}</span>
            </button>

            {/* EDIT OPTION */}
            <button
              onClick={() => onOpenEdit(task)}
              className="w-full text-left px-3 py-1.5 text-xs text-slate-800 hover:bg-slate-50 flex items-center gap-1.5 font-bold cursor-pointer"
            >
              <Edit2 size={12} className="text-slate-400" />
              <span>Edit</span>
            </button>

            {/* DUPLICATE OPTION */}
            <button
              onClick={() => onDuplicate(task)}
              className="w-full text-left px-3 py-1.5 text-xs text-slate-800 hover:bg-slate-50 flex items-center gap-1.5 font-bold cursor-pointer"
            >
              <Copy size={12} className="text-slate-400" />
              <span>Duplicate</span>
            </button>

            {/* CONVERT TO NOTE OPTION */}
            <button
              onClick={() => onConvertToNote(task)}
              className="w-full text-left px-3 py-1.5 text-xs text-emerald-800 hover:bg-emerald-50 flex items-center gap-1.5 font-bold cursor-pointer"
            >
              <FileText size={12} className="text-emerald-600" />
              <span>Convert to Note</span>
            </button>

            <div className="border-t border-slate-100 my-0.5" />

            {/* DELETE OPTION */}
            <button
              onClick={() => onDelete(task.id, task.title)}
              className="w-full text-left px-3 py-1.5 text-xs text-rose-700 hover:bg-rose-50 flex items-center gap-1.5 font-bold cursor-pointer"
            >
              <Trash2 size={12} className="text-rose-500" />
              <span>Delete</span>
            </button>
          </div>
        )}
      </div>

    </motion.div>
  );
}
