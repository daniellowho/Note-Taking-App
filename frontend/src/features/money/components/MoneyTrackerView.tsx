import React, { useState, useMemo } from "react";
import {
  IndianRupee,
  TrendingUp,
  TrendingDown,
  ArrowDownLeft,
  ArrowUpRight,
  Download,
  Search,
  CheckCircle,
  Clock,
  Trash2,
  ChevronDown,
  Inbox,
  Sparkles,
  Filter,
} from "lucide-react";
import { MoneyTransaction } from "../../../types";
import { motion, AnimatePresence } from "motion/react";

interface MoneyTrackerViewProps {
  transactions: MoneyTransaction[];
  onUpdateTransaction: (id: string, updates: Partial<MoneyTransaction>) => void;
  onDeleteTransaction: (id: string) => void;
  onAddToast: (text: string, type: "success" | "info" | "error") => void;
}

type FilterType = "All" | "I Owe" | "Owes Me" | "Expense" | "Income";
type StatusFilter = "All" | "Pending" | "Paid" | "Received" | "Settled";

const DIRECTION_CONFIG = {
  "I Owe": {
    label: "I Owe",
    color: "text-rose-600",
    bg: "bg-rose-50",
    border: "border-rose-100",
    Icon: ArrowUpRight,
    iconColor: "text-rose-500",
  },
  "Owes Me": {
    label: "Owes Me",
    color: "text-emerald-700",
    bg: "bg-emerald-50",
    border: "border-emerald-100",
    Icon: ArrowDownLeft,
    iconColor: "text-emerald-600",
  },
  Expense: {
    label: "Expense",
    color: "text-amber-700",
    bg: "bg-amber-50",
    border: "border-amber-100",
    Icon: TrendingDown,
    iconColor: "text-amber-600",
  },
  Income: {
    label: "Income",
    color: "text-blue-700",
    bg: "bg-blue-50",
    border: "border-blue-100",
    Icon: TrendingUp,
    iconColor: "text-blue-600",
  },
};

const STATUS_CONFIG = {
  Pending: { label: "Pending", color: "text-amber-700", bg: "bg-amber-50", dot: "bg-amber-400" },
  Paid: { label: "Paid", color: "text-emerald-700", bg: "bg-emerald-50", dot: "bg-emerald-500" },
  Received: { label: "Received", color: "text-emerald-700", bg: "bg-emerald-50", dot: "bg-emerald-500" },
  Settled: { label: "Settled", color: "text-slate-600", bg: "bg-slate-100", dot: "bg-slate-400" },
};

function formatAmount(currency: string, amount: number) {
  return `${currency}${amount.toLocaleString("en-IN")}`;
}

function formatDate(iso: string) {
  try {
    return new Date(iso).toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "numeric" });
  } catch {
    return iso;
  }
}

export default function MoneyTrackerView({
  transactions,
  onUpdateTransaction,
  onDeleteTransaction,
  onAddToast,
}: MoneyTrackerViewProps) {
  const [search, setSearch] = useState("");
  const [directionFilter, setDirectionFilter] = useState<FilterType>("All");
  const [statusFilter, setStatusFilter] = useState<StatusFilter>("All");
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [showFilters, setShowFilters] = useState(false);

  // Summary calculations
  const summary = useMemo(() => {
    const pending = transactions.filter((t) => t.status === "Pending");
    const toReceive = pending
      .filter((t) => t.direction === "Owes Me")
      .reduce((sum, t) => sum + t.amount, 0);
    const toPay = pending
      .filter((t) => t.direction === "I Owe")
      .reduce((sum, t) => sum + t.amount, 0);
    const totalExpenses = transactions
      .filter((t) => t.direction === "Expense")
      .reduce((sum, t) => sum + t.amount, 0);
    const totalIncome = transactions
      .filter((t) => t.direction === "Income")
      .reduce((sum, t) => sum + t.amount, 0);
    const pendingCount = pending.length;
    const currency = transactions[0]?.currency || "₹";
    return { toReceive, toPay, totalExpenses, totalIncome, pendingCount, currency };
  }, [transactions]);

  // Filtered + searched transactions
  const filtered = useMemo(() => {
    return transactions.filter((t) => {
      const matchesDir = directionFilter === "All" || t.direction === directionFilter;
      const matchesStatus = statusFilter === "All" || t.status === statusFilter;
      const q = search.toLowerCase();
      const matchesSearch =
        !q ||
        t.person?.toLowerCase().includes(q) ||
        t.amount.toString().includes(q) ||
        t.originalNote.toLowerCase().includes(q) ||
        t.direction.toLowerCase().includes(q) ||
        t.status.toLowerCase().includes(q);
      return matchesDir && matchesStatus && matchesSearch;
    });
  }, [transactions, directionFilter, statusFilter, search]);

  // Natural language query resolver
  const resolveNLQuery = (q: string) => {
    const lower = q.toLowerCase();
    if (lower.includes("owe me") || lower.includes("owes me")) setDirectionFilter("Owes Me");
    else if (lower.includes("i owe") || lower.includes("i need to pay")) setDirectionFilter("I Owe");
    else if (lower.includes("expense")) setDirectionFilter("Expense");
    else if (lower.includes("income")) setDirectionFilter("Income");
    if (lower.includes("pending")) setStatusFilter("Pending");
    else if (lower.includes("paid") || lower.includes("settled")) setStatusFilter("Settled");
  };

  const handleMarkStatus = (id: string, newStatus: MoneyTransaction["status"]) => {
    onUpdateTransaction(id, { status: newStatus, lastUpdated: new Date().toISOString() });
    onAddToast(
      newStatus === "Paid" ? "Marked as paid." : newStatus === "Received" ? "Marked as received." : "Status updated.",
      "success"
    );
  };

  const handleDelete = (id: string) => {
    onDeleteTransaction(id);
    if (expandedId === id) setExpandedId(null);
    onAddToast("Transaction removed.", "info");
  };

  const exportCSV = () => {
    if (transactions.length === 0) {
      onAddToast("No transactions to export.", "info");
      return;
    }
    const headers = [
      "Date Created",
      "Time Created",
      "Person",
      "Amount",
      "Currency",
      "Direction",
      "Status",
      "Due Date",
      "Category",
      "Original Note",
      "Last Updated",
    ];
    const rows = transactions.map((t) => {
      const d = new Date(t.createdAt);
      return [
        d.toLocaleDateString("en-IN"),
        d.toLocaleTimeString("en-IN", { hour: "2-digit", minute: "2-digit" }),
        t.person || "",
        t.amount.toString(),
        t.currency,
        t.direction,
        t.status,
        t.dueDate || "",
        "Money Tracker",
        `"${(t.originalNote || "").replace(/"/g, '""')}"`,
        new Date(t.lastUpdated).toLocaleDateString("en-IN"),
      ];
    });
    const csv = [headers, ...rows].map((r) => r.join(",")).join("\n");
    const blob = new Blob(["﻿" + csv], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `money-tracker-${new Date().toISOString().split("T")[0]}.csv`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
    onAddToast("Exported to CSV. Open in Excel.", "success");
  };

  return (
    <div className="w-full max-w-[800px] mx-auto px-4 md:px-6 pb-28 pt-10 font-sans animate-fade-in text-slate-800">

      {/* Header */}
      <motion.header
        initial={{ opacity: 0, y: 15 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, ease: "easeOut" }}
        className="mb-10 flex items-start justify-between gap-4"
      >
        <div className="space-y-1">
          <span className="text-[10px] font-extrabold text-[#006d36] uppercase tracking-widest font-mono">
            Nova Workspace
          </span>
          <h1 className="text-3xl md:text-4xl font-black tracking-tight text-slate-900 leading-tight">
            Money Tracker
          </h1>
          <p className="text-sm text-slate-500 font-medium max-w-md leading-relaxed">
            AI-powered ledger. Speak or write naturally — every transaction is captured automatically.
          </p>
        </div>
        <button
          onClick={exportCSV}
          className="shrink-0 flex items-center gap-2 px-4 py-2.5 bg-[#006d36] hover:bg-[#005128] text-white text-xs font-bold rounded-2xl transition-all active:scale-95 shadow-sm"
        >
          <Download size={14} />
          Export Excel
        </button>
      </motion.header>

      {/* Summary Cards */}
      <section className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-8">
        {[
          {
            label: "To Receive",
            value: formatAmount(summary.currency, summary.toReceive),
            sub: `${transactions.filter((t) => t.direction === "Owes Me" && t.status === "Pending").length} pending`,
            color: "text-emerald-700",
            bg: "bg-emerald-50",
            border: "border-emerald-100",
            Icon: ArrowDownLeft,
          },
          {
            label: "To Pay",
            value: formatAmount(summary.currency, summary.toPay),
            sub: `${transactions.filter((t) => t.direction === "I Owe" && t.status === "Pending").length} pending`,
            color: "text-rose-600",
            bg: "bg-rose-50",
            border: "border-rose-100",
            Icon: ArrowUpRight,
          },
          {
            label: "Expenses",
            value: formatAmount(summary.currency, summary.totalExpenses),
            sub: `${transactions.filter((t) => t.direction === "Expense").length} entries`,
            color: "text-amber-700",
            bg: "bg-amber-50",
            border: "border-amber-100",
            Icon: TrendingDown,
          },
          {
            label: "Income",
            value: formatAmount(summary.currency, summary.totalIncome),
            sub: `${transactions.filter((t) => t.direction === "Income").length} entries`,
            color: "text-blue-700",
            bg: "bg-blue-50",
            border: "border-blue-100",
            Icon: TrendingUp,
          },
        ].map(({ label, value, sub, color, bg, border, Icon }) => (
          <motion.div
            key={label}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.4, delay: 0.1 }}
            className={`${bg} border ${border} rounded-2xl p-4 flex flex-col gap-1`}
          >
            <div className="flex items-center justify-between">
              <span className="text-[10px] font-black uppercase tracking-wider text-slate-500">{label}</span>
              <Icon size={14} className={color} strokeWidth={2.5} />
            </div>
            <span className={`text-lg font-black ${color} font-mono leading-none`}>{value}</span>
            <span className="text-[10px] text-slate-400 font-semibold">{sub}</span>
          </motion.div>
        ))}
      </section>

      {/* Search + Filter Bar */}
      <div className="mb-6 space-y-3">
        <div className="flex gap-2">
          <div className="relative flex-1">
            <Search size={14} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none" />
            <input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              onKeyDown={(e) => { if (e.key === "Enter") resolveNLQuery(search); }}
              placeholder='Search by name, amount… or ask "who owes me money?"'
              className="w-full pl-9 pr-4 py-2.5 bg-white border border-slate-200 rounded-xl text-sm text-slate-800 placeholder:text-slate-400 focus:outline-none focus:border-[#006d36]/50 focus:ring-1 focus:ring-[#006d36]/20 transition-all"
            />
          </div>
          <button
            onClick={() => setShowFilters((v) => !v)}
            className={`flex items-center gap-1.5 px-3.5 py-2.5 border rounded-xl text-xs font-bold transition-all ${
              showFilters || directionFilter !== "All" || statusFilter !== "All"
                ? "bg-[#006d36] text-white border-[#006d36]"
                : "bg-white border-slate-200 text-slate-600 hover:border-slate-300"
            }`}
          >
            <Filter size={13} />
            Filter
          </button>
        </div>

        <AnimatePresence>
          {showFilters && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: "auto" }}
              exit={{ opacity: 0, height: 0 }}
              className="overflow-hidden"
            >
              <div className="flex flex-wrap gap-2 pt-1">
                <div className="flex items-center gap-1.5 flex-wrap">
                  <span className="text-[10px] font-black uppercase tracking-wider text-slate-400">Direction:</span>
                  {(["All", "I Owe", "Owes Me", "Expense", "Income"] as FilterType[]).map((f) => (
                    <button
                      key={f}
                      onClick={() => setDirectionFilter(f)}
                      className={`px-2.5 py-1 rounded-lg text-[11px] font-bold transition-all ${
                        directionFilter === f
                          ? "bg-slate-800 text-white"
                          : "bg-slate-100 text-slate-600 hover:bg-slate-200"
                      }`}
                    >
                      {f}
                    </button>
                  ))}
                </div>
                <div className="flex items-center gap-1.5 flex-wrap mt-1">
                  <span className="text-[10px] font-black uppercase tracking-wider text-slate-400">Status:</span>
                  {(["All", "Pending", "Paid", "Received", "Settled"] as StatusFilter[]).map((s) => (
                    <button
                      key={s}
                      onClick={() => setStatusFilter(s)}
                      className={`px-2.5 py-1 rounded-lg text-[11px] font-bold transition-all ${
                        statusFilter === s
                          ? "bg-slate-800 text-white"
                          : "bg-slate-100 text-slate-600 hover:bg-slate-200"
                      }`}
                    >
                      {s}
                    </button>
                  ))}
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* AI badge */}
      <div className="flex items-center gap-1.5 mb-4">
        <Sparkles size={11} className="text-[#006d36]" strokeWidth={2.5} />
        <span className="text-[10px] font-black uppercase tracking-widest text-[#006d36] font-mono">
          AI Ledger — {filtered.length} {filtered.length === 1 ? "entry" : "entries"}
        </span>
      </div>

      {/* Ledger List */}
      {filtered.length === 0 ? (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="flex flex-col items-center justify-center py-20 text-center bg-white border border-slate-200 rounded-3xl"
        >
          <div className="w-14 h-14 rounded-2xl bg-slate-50 flex items-center justify-center mb-4">
            <IndianRupee size={22} className="text-slate-300" />
          </div>
          <p className="text-sm font-bold text-slate-500">No transactions yet</p>
          <p className="text-xs text-slate-400 mt-1 max-w-xs leading-relaxed">
            Just write or speak naturally about money — "Rahul owes me ₹500" — and AI will auto-capture it here.
          </p>
        </motion.div>
      ) : (
        <div className="space-y-2">
          <AnimatePresence>
            {filtered.map((txn) => {
              const cfg = DIRECTION_CONFIG[txn.direction];
              const statusCfg = STATUS_CONFIG[txn.status];
              const DirectionIcon = cfg.Icon;
              const isExpanded = expandedId === txn.id;
              const isPending = txn.status === "Pending";

              return (
                <motion.div
                  key={txn.id}
                  layout
                  initial={{ opacity: 0, y: 8 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, scale: 0.96 }}
                  transition={{ duration: 0.25 }}
                  className={`bg-white border rounded-2xl overflow-hidden transition-shadow ${
                    isExpanded ? "border-slate-200 shadow-md" : "border-slate-100 hover:border-slate-200 hover:shadow-sm"
                  }`}
                >
                  {/* Main Row */}
                  <div
                    className="flex items-center gap-4 p-4 cursor-pointer"
                    onClick={() => setExpandedId(isExpanded ? null : txn.id)}
                  >
                    {/* Direction Icon */}
                    <div className={`w-10 h-10 rounded-xl ${cfg.bg} border ${cfg.border} flex items-center justify-center shrink-0`}>
                      <DirectionIcon size={18} className={cfg.iconColor} strokeWidth={2.3} />
                    </div>

                    {/* Main info */}
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className="text-sm font-black text-slate-900">
                          {txn.person || cfg.label}
                        </span>
                        <span className={`text-[10px] font-bold px-1.5 py-0.5 rounded-md ${cfg.bg} ${cfg.color} border ${cfg.border}`}>
                          {cfg.label}
                        </span>
                        <span className={`flex items-center gap-1 text-[10px] font-bold px-1.5 py-0.5 rounded-md ${statusCfg.bg} ${statusCfg.color}`}>
                          <span className={`w-1.5 h-1.5 rounded-full ${statusCfg.dot}`} />
                          {statusCfg.label}
                        </span>
                      </div>
                      <div className="flex items-center gap-2 mt-0.5 text-[10px] text-slate-400 font-semibold">
                        <span>{formatDate(txn.createdAt)}</span>
                        {txn.dueDate && (
                          <>
                            <span>•</span>
                            <span className="flex items-center gap-0.5 text-amber-600">
                              <Clock size={9} strokeWidth={2.5} />
                              Due: {txn.dueDate}
                            </span>
                          </>
                        )}
                      </div>
                    </div>

                    {/* Amount */}
                    <div className="shrink-0 text-right">
                      <span className={`text-lg font-black font-mono ${cfg.color}`}>
                        {formatAmount(txn.currency, txn.amount)}
                      </span>
                    </div>

                    {/* Expand chevron */}
                    <ChevronDown
                      size={16}
                      className={`text-slate-300 shrink-0 transition-transform duration-200 ${isExpanded ? "rotate-180" : ""}`}
                    />
                  </div>

                  {/* Expanded Panel */}
                  <AnimatePresence>
                    {isExpanded && (
                      <motion.div
                        initial={{ height: 0, opacity: 0 }}
                        animate={{ height: "auto", opacity: 1 }}
                        exit={{ height: 0, opacity: 0 }}
                        transition={{ duration: 0.2 }}
                        className="overflow-hidden border-t border-slate-50"
                      >
                        <div className="px-4 py-4 space-y-4 bg-slate-50/50">
                          {/* Original Note */}
                          <div>
                            <span className="text-[9px] font-black uppercase tracking-wider text-slate-400 block mb-1">
                              Original Note
                            </span>
                            <p className="text-xs text-slate-700 font-medium leading-relaxed bg-white border border-slate-100 rounded-xl px-3 py-2.5 italic">
                              "{txn.originalNote}"
                            </p>
                          </div>

                          {/* Action Buttons */}
                          <div className="flex items-center gap-2 flex-wrap">
                            {isPending && txn.direction === "I Owe" && (
                              <button
                                onClick={(e) => { e.stopPropagation(); handleMarkStatus(txn.id, "Paid"); }}
                                className="flex items-center gap-1.5 px-3 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold rounded-xl transition-all active:scale-95"
                              >
                                <CheckCircle size={13} />
                                Mark as Paid
                              </button>
                            )}
                            {isPending && txn.direction === "Owes Me" && (
                              <button
                                onClick={(e) => { e.stopPropagation(); handleMarkStatus(txn.id, "Received"); }}
                                className="flex items-center gap-1.5 px-3 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold rounded-xl transition-all active:scale-95"
                              >
                                <CheckCircle size={13} />
                                Mark as Received
                              </button>
                            )}
                            {!isPending && (
                              <button
                                onClick={(e) => { e.stopPropagation(); handleMarkStatus(txn.id, "Pending"); }}
                                className="flex items-center gap-1.5 px-3 py-1.5 bg-amber-500 hover:bg-amber-600 text-white text-xs font-bold rounded-xl transition-all active:scale-95"
                              >
                                <Clock size={13} />
                                Mark Pending
                              </button>
                            )}
                            {(txn.direction === "I Owe" || txn.direction === "Owes Me") && txn.status !== "Settled" && (
                              <button
                                onClick={(e) => { e.stopPropagation(); handleMarkStatus(txn.id, "Settled"); }}
                                className="flex items-center gap-1.5 px-3 py-1.5 bg-slate-200 hover:bg-slate-300 text-slate-700 text-xs font-bold rounded-xl transition-all active:scale-95"
                              >
                                Mark Settled
                              </button>
                            )}
                            <button
                              onClick={(e) => { e.stopPropagation(); handleDelete(txn.id); }}
                              className="flex items-center gap-1.5 px-3 py-1.5 bg-rose-50 hover:bg-rose-100 text-rose-600 text-xs font-bold rounded-xl transition-all active:scale-95 ml-auto"
                            >
                              <Trash2 size={13} />
                              Remove
                            </button>
                          </div>

                          {/* Meta */}
                          <div className="text-[9px] text-slate-400 font-mono font-semibold">
                            Last updated: {formatDate(txn.lastUpdated)}
                          </div>
                        </div>
                      </motion.div>
                    )}
                  </AnimatePresence>
                </motion.div>
              );
            })}
          </AnimatePresence>
        </div>
      )}
    </div>
  );
}
