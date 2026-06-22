import React, { useState, useMemo } from "react";
import { Calendar as CalendarIcon, Clock, MapPin, ChevronLeft, ChevronRight, Sparkles } from "lucide-react";
import { Note } from "../types";

interface CalendarViewProps {
  notes?: Note[];
}

export default function CalendarView({ notes = [] }: CalendarViewProps) {
  const [currentMonth, setCurrentMonth] = useState("June 2026");
  const [calendarScope, setCalendarScope] = useState<"day" | "week" | "month">("week");

  const meetings = [
    {
      time: "10:00 AM - 11:00 AM",
      title: "Stakeholder Sync",
      location: "Room 402 or Zoom",
      dateLabel: "Today",
    },
    {
      time: "2:00 PM - 3:00 PM",
      title: "Design Review",
      location: "Main Board Room",
      dateLabel: "Tomorrow",
    },
    {
      time: "11:30 AM - 12:30 PM",
      title: "Q4 Marketing Assets Alignment",
      location: "Huddle Area",
      dateLabel: "June 19, 2026",
    },
  ];

  // Dynamic user-authored scheduled reminders and events parsed via NLP helper
  const userEvents = notes
    .filter((n) => (n.category === "Reminder" || n.category === "Event") && n.reminderTime)
    .map((n) => ({
      time: n.category === "Reminder" ? "09:00 AM - Reminder" : "02:00 PM - Scheduled Event",
      title: n.title,
      location: "Nova Voice/Type Capture",
      dateLabel: n.reminderTime || "Scheduled",
    }));

  const allEvents = [...userEvents, ...meetings];

  // Scope Filtering Core
  const filteredEvents = useMemo(() => {
    if (calendarScope === "day") {
      return allEvents.filter(e => e.dateLabel.toLowerCase().includes("today"));
    }
    if (calendarScope === "week") {
      // Show Today, Tomorrow, specific week days, or voice-scheduled entries
      return allEvents.filter(e => 
        e.dateLabel.toLowerCase().includes("today") || 
        e.dateLabel.toLowerCase().includes("tomorrow") || 
        e.dateLabel.toLowerCase().includes("june 19") ||
        e.dateLabel.toLowerCase().includes("scheduled")
      );
    }
    return allEvents; // Month shows everything
  }, [calendarScope, allEvents]);

  // Highlight Different Days in Distinct Elegant Colors
  const getDayColorStyles = (dayNum: number) => {
    const isToday = dayNum === 17; // Current date is June 17, 2026
    if (isToday) {
      return "bg-[#006d36] text-white ring-4 ring-[#006d36]/10 scale-108 font-black shadow-sm z-10";
    }

    // June 1, 2026 is Monday.
    // Sunday = 0, Monday = 1, Tuesday = 2, Wednesday = 3, Thursday = 4, Friday = 5, Saturday = 6
    const dayOfWeek = dayNum % 7; 

    switch (dayOfWeek) {
      case 0: // Sunday: Soft Rose
        return "bg-rose-50/55 hover:bg-rose-100/60 text-rose-700 border border-rose-100/30";
      case 1: // Monday: Soft Lavender
        return "bg-purple-50/55 hover:bg-purple-100/60 text-purple-700 border border-purple-100/30";
      case 2: // Tuesday: Soft Sky Blue
        return "bg-sky-50/55 hover:bg-sky-100/60 text-sky-700 border border-sky-100/30";
      case 3: // Wednesday: Soft Indigo
        return "bg-indigo-50/55 hover:bg-indigo-100/60 text-indigo-700 border border-indigo-100/30";
      case 4: // Thursday: Soft Amber
        return "bg-amber-50/55 hover:bg-amber-100/60 text-amber-700 border border-amber-100/30";
      case 5: // Friday: Soft Emerald
        return "bg-emerald-50/55 hover:bg-emerald-100/60 text-[#006d36] border border-emerald-100/30";
      case 6: // Saturday: Soft Cyan
        return "bg-cyan-50/55 hover:bg-cyan-100/60 text-cyan-700 border border-cyan-100/30";
      default:
        return "bg-slate-50/50 hover:bg-slate-100 text-slate-750";
    }
  };

  // Highly customizable badge color tags for task lists
  const getDateBadgeColor = (str: string) => {
    const s = str.toLowerCase();
    if (s.includes("today")) {
      return "bg-emerald-50 text-[#006d36] border border-emerald-100/70";
    }
    if (s.includes("tomorrow")) {
      return "bg-blue-50 text-blue-700 border border-blue-100/70";
    }
    if (s.includes("june 19") || s.includes("friday")) {
      return "bg-purple-50 text-purple-700 border border-purple-100/70";
    }
    return "bg-amber-50 text-amber-700 border border-amber-100/70";
  };

  return (
    <div className="w-full max-w-[800px] mx-auto px-6 pb-24 pt-4 font-sans animate-fade-in text-slate-800">
      
      {/* 1. Header with custom icon and subtitle */}
      <div className="flex items-center gap-3 mb-8 border-b border-slate-100 pb-4">
        <div className="w-10 h-10 rounded-xl bg-emerald-50 border border-emerald-100/30 flex items-center justify-center text-[#006d36] shadow-sm">
          <CalendarIcon size={20} />
        </div>
        <div>
          <h2 className="text-xl md:text-2xl font-black text-slate-900">Calendar Schedule</h2>
          <p className="text-xs text-slate-400 font-semibold mt-0.5">Coordinate and align your weekday timelines</p>
        </div>
      </div>

      {/* 2. Simplified Pills: scope switch triggers with Green default on This Week */}
      <div className="flex justify-between items-center mb-6 bg-slate-50 border border-slate-100/80 p-3 rounded-2xl">
        <div className="flex gap-2" id="calendar-timeline-toggles">
          {[
            { id: "day", label: "Today" },
            { id: "week", label: "This Week" },
            { id: "month", label: "Month" }
          ].map((scope) => {
            const isActive = calendarScope === scope.id;
            return (
              <button
                key={scope.id}
                onClick={() => setCalendarScope(scope.id as any)}
                className={`px-3.5 py-1.5 rounded-full text-xs font-bold transition-all cursor-pointer active:scale-95 border ${
                  isActive
                    ? "bg-[#006d36] text-white border-[#006d36] shadow-sm"
                    : "bg-white text-slate-500 border-slate-200 hover:text-slate-900 hover:bg-slate-50"
                }`}
              >
                {scope.label}
              </button>
            );
          })}
        </div>

        {/* Month Navigation Title */}
        <div className="flex items-center gap-3">
          <span className="font-bold text-xs text-slate-700 select-none font-sans bg-white border border-slate-200 px-3 py-1 rounded-xl">
            {currentMonth}
          </span>
          <div className="flex gap-1 select-none">
            <button className="p-1 hover:bg-slate-100 border border-slate-250/10 rounded-lg text-slate-500 transition-colors cursor-pointer">
              <ChevronLeft size={14} />
            </button>
            <button className="p-1 hover:bg-slate-100 border border-slate-250/10 rounded-lg text-slate-500 transition-colors cursor-pointer">
              <ChevronRight size={14} />
            </button>
          </div>
        </div>
      </div>

      {/* 3. The Interactive Masterpiece Layout Container */}
      <div className="grid grid-cols-1 md:grid-cols-12 gap-6 items-start">
        
        {/* Visual Calendar grid (Col 5) with custom colored days */}
        <div className="md:col-span-5 bg-white rounded-3xl border border-slate-100 p-5 shadow-sm">
          <div className="grid grid-cols-7 gap-2 text-center text-[10px] font-extrabold uppercase tracking-wide text-slate-400 font-mono mb-3">
            <span>S</span><span>M</span><span>T</span><span>W</span><span>T</span><span>F</span><span>S</span>
          </div>
          <div className="grid grid-cols-7 gap-1.5 text-center text-xs font-bold font-mono">
            {Array.from({ length: 31 }, (_, idx) => {
              const day = idx + 1;
              const isToday = day === 17;
              const hasMeeting = day === 17 || day === 18 || day === 19;
              return (
                <div
                  key={idx}
                  className={`relative p-2 rounded-xl flex items-center justify-center cursor-pointer transition-all duration-200 hover:scale-102 ${getDayColorStyles(day)}`}
                >
                  <span>{day}</span>
                  {hasMeeting && !isToday && (
                    <span className="absolute bottom-1 w-1.5 h-1.5 rounded-full bg-slate-400/80 ring-2 ring-white"></span>
                  )}
                </div>
              );
            })}
          </div>
        </div>

        {/* Dynamic filtered list of events (Col 7) */}
        <div className="md:col-span-7 space-y-3">
          {filteredEvents.length > 0 ? (
            filteredEvents.map((meet, idx) => (
              <div
                key={idx}
                className="bg-white border border-slate-100/95 rounded-2xl p-4.5 shadow-sm hover:border-[#006d36]/20 transition-all duration-300 cursor-pointer"
              >
                <div className="flex items-center justify-between gap-2 mb-2">
                  <span className={`text-[10px] font-black uppercase px-2 py-0.5 rounded-md ${getDateBadgeColor(meet.dateLabel)}`}>
                    {meet.dateLabel}
                  </span>
                  <div className="w-1.5 h-1.5 rounded-full bg-slate-200" />
                </div>
                <h4 className="font-extrabold text-sm text-slate-900 leading-snug mb-3">
                  {meet.title}
                </h4>
                <div className="space-y-1.5 text-xs text-slate-500 font-semibold">
                  <div className="flex items-center gap-2">
                    <Clock size={11} className="text-slate-400" />
                    <span>{meet.time}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <MapPin size={11} className="text-slate-400" />
                    <span>{meet.location}</span>
                  </div>
                </div>
              </div>
            ))
          ) : (
            <div className="text-center py-12 bg-white border border-slate-100 rounded-2xl p-6">
              <Sparkles size={18} className="text-slate-300 mx-auto mb-2" />
              <p className="text-xs text-slate-400 font-semibold">No active schedule matches this view scope.</p>
            </div>
          )}
        </div>

      </div>
    </div>
  );
}
