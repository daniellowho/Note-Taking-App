import React, { useState } from "react";
import { Calendar as CalendarIcon, Clock, MapPin, ChevronLeft, ChevronRight } from "lucide-react";
import { Note } from "../types";

interface CalendarViewProps {
  notes?: Note[];
}

export default function CalendarView({ notes = [] }: CalendarViewProps) {
  const [currentMonth, setCurrentMonth] = useState("June 2026");

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

  return (
    <div className="w-full max-w-[800px] mx-auto px-6 pb-24 pt-4 font-sans animate-fade-in">
      <div className="flex items-center gap-3 mb-8 border-b border-outline-variant/15 pb-4">
        <div className="w-10 h-10 rounded-xl bg-primary-container flex items-center justify-center text-on-primary-container shadow-sm">
          <CalendarIcon size={20} />
        </div>
        <div>
          <h2 className="text-xl md:text-2xl font-bold text-on-surface">Calendar Schedule</h2>
          <p className="text-xs text-secondary font-medium">Coordinate your priority syncs</p>
        </div>
      </div>

      {/* Navigation of Month */}
      <div className="flex items-center justify-between mb-6 bg-surface-container-low/40 p-4 rounded-2xl border border-outline-variant/10">
        <h3 className="font-bold text-base text-on-surface select-none">{currentMonth}</h3>
        <div className="flex gap-1.5 select-none">
          <button className="p-1.5 hover:bg-surface-container rounded-lg text-secondary transition-colors cursor-pointer">
            <ChevronLeft size={16} />
          </button>
          <button className="p-1.5 hover:bg-surface-container rounded-lg text-secondary transition-colors cursor-pointer">
            <ChevronRight size={16} />
          </button>
        </div>
      </div>

      {/* Grid Calendarium elements */}
      <div className="grid grid-cols-1 md:grid-cols-12 gap-6 items-start">
        
        {/* Calendar visual Grid (Col 5) */}
        <div className="md:col-span-5 bg-surface-container-lowest rounded-3xl border border-outline-variant/30 p-5 soft-shadow">
          <div className="grid grid-cols-7 gap-2 text-center text-xs font-semibold text-secondary mb-3">
            <span>S</span><span>M</span><span>T</span><span>W</span><span>T</span><span>F</span><span>S</span>
          </div>
          <div className="grid grid-cols-7 gap-2 text-center text-xs font-medium text-on-surface">
            {Array.from({ length: 31 }, (_, idx) => {
              const day = idx + 1;
              const isToday = day === 17; // Current date in ADD_METADATA is June 17, 2026 
              const hasMeeting = day === 17 || day === 18 || day === 19;
              return (
                <div
                  key={idx}
                  className={`relative p-2.5 rounded-lg flex items-center justify-center font-bold font-sans cursor-pointer transition-all hover:bg-surface-container-low ${
                    isToday ? "bg-primary text-white scale-110 shadow-sm" : ""
                  }`}
                >
                  {day}
                  {hasMeeting && !isToday && (
                    <span className="absolute bottom-1 w-1 h-1 rounded-full bg-primary"></span>
                  )}
                </div>
              );
            })}
          </div>
        </div>

        {/* Meetings List (Col 7) */}
        <div className="md:col-span-7 space-y-4">
          {allEvents.map((meet, idx) => (
            <div
              key={idx}
              className="bg-surface-container-lowest border border-outline-variant/30 rounded-2xl p-5 soft-shadow hover:border-primary/20 transition-all cursor-pointer"
            >
              <div className="flex items-center justify-between gap-2 mb-2">
                <span className="text-[10px] font-bold px-2 py-0.5 rounded bg-primary-container/20 text-on-primary-container uppercase">
                  {meet.dateLabel}
                </span>
                <span className="text-secondary/70 text-xs font-semibold select-none">● ● ●</span>
              </div>
              <h4 className="font-bold text-base text-on-surface leading-snug mb-3">
                {meet.title}
              </h4>
              <div className="space-y-1.5 text-xs text-on-surface-variant font-medium">
                <div className="flex items-center gap-1.5">
                  <Clock size={12} className="text-primary" />
                  <span>{meet.time}</span>
                </div>
                <div className="flex items-center gap-1.5">
                  <MapPin size={12} className="text-primary" />
                  <span>{meet.location}</span>
                </div>
              </div>
            </div>
          ))}
        </div>

      </div>
    </div>
  );
}
