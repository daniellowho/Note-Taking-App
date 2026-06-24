import React, { useState } from "react";
import { Search, Info, Sliders, X } from "lucide-react";
import { PROFILE_ME } from "../../data";

interface HeaderProps {
  onSearch: (query: string) => void;
  title?: string;
  onShowInfo?: () => void;
  avatarUrl?: string;
}

export default function Header({
  onSearch,
  title = "Nova Notes",
  onShowInfo,
  avatarUrl = PROFILE_ME,
}: HeaderProps) {
  const [showSearch, setShowSearch] = useState(false);
  const [searchVal, setSearchVal] = useState("");

  const handleSearchChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = e.target.value;
    setSearchVal(val);
    onSearch(val);
  };

  return (
    <header className="w-full top-0 sticky z-40 bg-background/80 backdrop-blur-md border-b border-outline-variant/10">
      <div className="flex items-center justify-between px-6 py-3 max-w-[1280px] mx-auto">
        <div className="flex items-center gap-4">
          <div className="w-10 h-10 rounded-full overflow-hidden bg-surface-container-high border border-outline-variant/20 flex-shrink-0 shadow-sm">
            <img
              alt="User profile photo"
              className="w-full h-full object-cover"
              src={avatarUrl}
            />
          </div>
          <h1 className="text-xl md:text-2xl font-bold font-sans text-primary tracking-tight">
            {title}
          </h1>
        </div>

        <div className="flex items-center gap-2">
          {showSearch ? (
            <div className="flex items-center gap-2 bg-surface-container-low max-w-[200px] md:max-w-md px-3 py-1.5 rounded-full border border-outline-variant/30">
              <input
                type="text"
                value={searchVal}
                onChange={handleSearchChange}
                placeholder="Search notes..."
                className="bg-transparent border-none text-sm outline-none focus:ring-0 text-on-surface placeholder-on-surface-variant/60 w-32 md:w-48"
                autoFocus
              />
              <button
                onClick={() => {
                  setShowSearch(false);
                  setSearchVal("");
                  onSearch("");
                }}
                className="text-on-surface-variant hover:text-primary"
              >
                <X size={16} />
              </button>
            </div>
          ) : (
            <button
              onClick={() => setShowSearch(true)}
              className="p-2 rounded-full hover:bg-surface-container-low transition-colors duration-200"
              title="Search"
              id="header-search-btn"
            >
              <Search size={20} className="text-primary hover:scale-105 active:scale-95 transition-transform" />
            </button>
          )}

          {onShowInfo && (
            <button
              onClick={onShowInfo}
              className="p-2 rounded-full hover:bg-surface-container-low transition-colors duration-200"
              title="App Info"
              id="header-info-btn"
            >
              <Info size={19} className="text-on-surface-variant hover:text-primary transition-colors" />
            </button>
          )}
        </div>
      </div>
    </header>
  );
}
