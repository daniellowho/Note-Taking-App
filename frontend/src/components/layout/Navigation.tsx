import React from "react";
import { Home, FileText, Sparkles, CheckSquare, Calendar, Settings, Mic } from "lucide-react";

interface NavigationProps {
  activeTab: string;
  setActiveTab: (tab: string) => void;
  onOpenSettings?: () => void;
}

export default function Navigation({
  activeTab,
  setActiveTab,
  onOpenSettings,
}: NavigationProps) {
  const tabs = [
    { id: "home", label: "Home", icon: Home },
    { id: "notes", label: "Notes", icon: FileText },
    { id: "voice", label: "Voice", icon: Mic },
    { id: "summary", label: "Summary", icon: Sparkles },
    { id: "tasks", label: "Tasks", icon: CheckSquare },
    { id: "calendar", label: "Calendar", icon: Calendar },
  ];

  return (
    <>
      {/* Bottom Bar: Mobile & Tablet View */}
      <nav className="fixed bottom-0 left-0 w-full z-50 flex justify-around items-end pb-4 pt-3 px-2 bg-white border-t border-slate-200/60 shadow-[0_-4px_30px_rgba(0,0,0,0.03)] md:hidden">
        {tabs.map((tab) => {
          const Icon = tab.icon;
          const isActive = activeTab === tab.id;
          const isSummary = tab.id === "summary";

          if (isSummary) {
            return (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className="relative flex flex-col items-center justify-center -translate-y-3 cursor-pointer select-none"
                title={tab.label}
              >
                <div className={`w-14 h-14 rounded-full flex items-center justify-center shadow-lg transition-all duration-300 ${
                  isActive 
                    ? "bg-[#006d36] text-white ring-4 ring-[#006d36]/20 scale-105" 
                    : "bg-[#006d36]/90 hover:bg-[#006d36] text-white"
                }`}>
                  <Icon size={24} strokeWidth={2.5} className="animate-pulse" />
                </div>
                <span className={`text-[10px] font-black mt-1 tracking-wider uppercase font-mono ${
                  isActive ? "text-[#006d36]" : "text-slate-505"
                }`}>
                  {tab.label}
                </span>
              </button>
            );
          }

          return (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`flex flex-col items-center justify-center py-1.5 px-3 rounded-2xl transition-all duration-300 select-none cursor-pointer ${
                isActive
                  ? "text-[#006d36] scale-105"
                  : "text-slate-400 hover:text-slate-700"
              }`}
            >
              <Icon size={20} strokeWidth={isActive ? 2.5 : 2} />
              <span className="text-[10px] font-bold mt-1 font-sans">
                {tab.label}
              </span>
            </button>
          );
        })}
      </nav>

      {/* Sidebar (Left Rail) - Desktop View */}
      <aside className="fixed left-0 top-0 h-full w-20 hidden md:flex flex-col items-center py-6 border-r border-slate-200 bg-white z-40 shadow-sm">
        
        {/* Workspace Brand Logo Icon Trigger */}
        <div className="mb-10 select-none" aria-label="Nova Workspace">
          <div className="w-12 h-12 bg-emerald-50 hover:bg-emerald-100/80 rounded-2xl flex items-center justify-center text-[#006d36] border border-[#006d36]/10 shadow-sm transition-all duration-300">
            <Sparkles size={22} strokeWidth={2.5} />
          </div>
        </div>

        {/* Buttons List Container */}
        <div className="flex flex-col gap-6 items-center w-full">
          {tabs.map((tab) => {
            const Icon = tab.icon;
            const isActive = activeTab === tab.id;
            const isSummary = tab.id === "summary";

            if (isSummary) {
              return (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id)}
                  className="relative flex flex-col items-center justify-center cursor-pointer select-none my-2"
                  title={tab.label}
                >
                  <div className={`w-14 h-14 rounded-2xl flex items-center justify-center shadow-md transition-all duration-300 ${
                    isActive 
                      ? "bg-[#006d36] text-white ring-4 ring-[#006d36]/20 scale-105" 
                      : "bg-[#006d36]/10 hover:bg-[#006d36]/20 text-[#006d36] hover:scale-102"
                  }`}>
                    <Icon size={24} strokeWidth={2.5} />
                  </div>
                  <span className={`text-[9px] font-black mt-1.5 uppercase tracking-widest font-mono ${
                    isActive ? "text-[#006d36]" : "text-slate-500"
                  }`}>
                    {tab.label}
                  </span>
                </button>
              );
            }

            return (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`w-14 h-14 flex flex-col items-center justify-center rounded-2xl cursor-pointer transition-all select-none ${
                  isActive
                    ? "text-[#006d36] scale-102 bg-slate-50 font-bold"
                    : "text-slate-400 hover:text-slate-700 hover:bg-slate-50/50"
                }`}
                title={tab.label}
              >
                <Icon size={20} strokeWidth={isActive ? 2.5 : 2} />
                <span className="text-[9px] font-extrabold font-sans mt-1 uppercase tracking-wider truncate max-w-full">
                  {tab.label}
                </span>
              </button>
            );
          })}
        </div>

        {/* Settings button pinned to left corner bottom */}
        {onOpenSettings && (
          <div className="mt-auto">
            <button
              onClick={onOpenSettings}
              className="w-12 h-12 flex items-center justify-center rounded-2xl text-slate-400 hover:text-[#006d36] hover:bg-emerald-50/55 cursor-pointer transition-colors"
              title="Nova Settings"
            >
              <Settings size={20} />
            </button>
          </div>
        )}
      </aside>
    </>
  );
}
