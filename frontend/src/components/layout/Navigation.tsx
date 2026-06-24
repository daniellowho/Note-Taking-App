import React from "react";
import { Home, FileText, Sparkles, CheckSquare, Calendar, Settings, Mic } from "lucide-react";

interface NavigationProps {
  activeTab: string;
  setActiveTab: (tab: string) => void;
  onOpenSettings?: () => void;
}

const tabs = [
  { id: "home", label: "Home", icon: Home },
  { id: "notes", label: "Notes", icon: FileText },
  { id: "voice", label: "Voice", icon: Mic },
  { id: "summary", label: "Summary", icon: Sparkles },
  { id: "tasks", label: "Tasks", icon: CheckSquare },
  { id: "calendar", label: "Calendar", icon: Calendar },
];

export default function Navigation({ activeTab, setActiveTab, onOpenSettings }: NavigationProps) {
  return (
    <>
      {/* Compact bottom navigation remains touch-friendly on small screens. */}
      <nav className="fixed bottom-0 left-0 z-50 flex w-full items-center justify-around border-t border-slate-200/70 bg-white/95 px-2 py-2 shadow-[0_-4px_24px_rgba(15,23,42,0.04)] backdrop-blur-md md:hidden">
        {tabs.map((tab) => {
          const Icon = tab.icon;
          const isActive = activeTab === tab.id;
          return (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              aria-current={isActive ? "page" : undefined}
              className={`flex min-w-0 flex-col items-center gap-1 rounded-xl px-2 py-1.5 text-[10px] font-semibold transition-all duration-200 ${
                isActive ? "bg-emerald-50 text-[#006d36]" : "text-slate-400 hover:text-slate-700"
              }`}
            >
              <Icon size={20} strokeWidth={isActive ? 2.3 : 1.9} />
              <span>{tab.label}</span>
            </button>
          );
        })}
      </nav>

      {/* Desktop navigation: deliberately quiet, with room left around the controls. */}
      <aside className="fixed inset-y-0 left-0 z-40 hidden w-64 flex-col border-r border-slate-200/60 bg-white px-4 py-5 md:flex">
        <div className="mb-10 flex items-center gap-3 px-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-emerald-50 text-[#006d36] shadow-sm shadow-emerald-950/[0.03]">
            <Sparkles size={20} strokeWidth={2.2} />
          </div>
          <div>
            <p className="text-[15px] font-bold tracking-[-0.02em] text-slate-900">Nova Notes</p>
            <p className="mt-0.5 text-xs font-medium text-slate-400">Your calm workspace</p>
          </div>
        </div>

        <nav aria-label="Main navigation" className="flex flex-col gap-2">
          {tabs.map((tab) => {
            const Icon = tab.icon;
            const isActive = activeTab === tab.id;
            return (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                aria-current={isActive ? "page" : undefined}
                className={`group flex h-11 w-full items-center gap-3 rounded-xl px-3 text-left text-[15px] font-medium transition-all duration-200 ease-out ${
                  isActive
                    ? "bg-emerald-50 text-slate-900 shadow-sm shadow-emerald-950/[0.025]"
                    : "text-slate-400 hover:bg-slate-50 hover:text-slate-700"
                }`}
              >
                <Icon
                  size={20}
                  strokeWidth={isActive ? 2.25 : 1.85}
                  className={`shrink-0 transition-colors duration-200 ${isActive ? "text-[#006d36]" : "text-slate-400 group-hover:text-slate-600"}`}
                />
                <span>{tab.label}</span>
              </button>
            );
          })}
        </nav>

        {onOpenSettings && (
          <div className="mt-auto border-t border-slate-200/70 pt-4">
            <button
              onClick={onOpenSettings}
              className="group flex h-11 w-full items-center gap-3 rounded-xl px-3 text-[15px] font-medium text-slate-400 transition-all duration-200 hover:bg-slate-50 hover:text-slate-700"
              title="Nova Settings"
            >
              <Settings size={20} strokeWidth={1.85} className="text-slate-400 transition-colors group-hover:text-slate-600" />
              <span>Settings</span>
            </button>
          </div>
        )}
      </aside>
    </>
  );
}
