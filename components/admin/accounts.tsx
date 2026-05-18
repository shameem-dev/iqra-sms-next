'use client';

import { useState, useEffect, useCallback } from 'react';
import {
  Plus, Trash2, Save, Loader2,
  AlertCircle, X, Search, FileText, RefreshCw,
  CheckCircle2, FilePen, CalendarDays, 
  ChevronLeft, ChevronRight,
} from 'lucide-react';
import {
  fetchEntries, createEntry, updateEntry, deleteEntry,
  fetchTotals,
  type AccountEntry, type NewEntry, type EntryType,
  type IncomeCategory, type ExpenditureCategory,
} from '@/utils/actions/Accounts';
import { useAccountsRealtime } from '@/hooks/useAccountsRealtime';

// ─── Constants ────────────────────────────────────────────────────────────────

export const INCOME_CATEGORIES: { value: IncomeCategory; label: string }[] = [
  { value: 'daily_fees', label: 'Daily Fees Collected' },
  { value: 'book',       label: 'Book Sales' },
  { value: 'receipt',    label: 'Receipt' },
  { value: 'other',      label: 'Others' },
];

export const EXPENDITURE_CATEGORIES: { value: ExpenditureCategory; label: string }[] = [
  { value: 'salary',        label: 'Salary' },
  { value: 'vehicle_rent',  label: 'Vehicle Rent' },
  { value: 'kseb_bill',     label: 'KSEB Bill' },
  { value: 'gas',           label: 'Gas' },
  { value: 'internet',      label: 'Internet' },
  { value: 'stationary',    label: 'Stationary' },
  { value: 'staff_ta',      label: 'Staff TA' },
  { value: 'training',      label: 'Training Expenses for Staff' },
  { value: 'medical',       label: 'Medical Expenses' },
  { value: 'building_rent', label: 'Building Rent' },
  { value: 'kuri',          label: 'Kuri Amount' },
  { value: 'trophy',        label: 'Trophy & Awards' },
  { value: 'annual_day',    label: 'Annual Day Celebration' },
  { value: 'iame',          label: 'IAME Expenses' },
  { value: 'other',         label: 'Others' },
];

type TypeFilter = 'all' | 'income' | 'expenditure';

// ─── Style helpers ────────────────────────────────────────────────────────────

const inputCls =
  'w-full px-3 py-2 text-sm text-slate-800 bg-white border border-slate-200 rounded-lg ' +
  'focus:outline-none focus:ring-2 focus:ring-teal-500 focus:border-transparent ' +
  'placeholder:text-slate-400 transition-colors';

const selectCls =
  'w-full px-3 py-2 text-sm text-slate-800 bg-white border border-slate-200 rounded-lg ' +
  'focus:outline-none focus:ring-2 focus:ring-teal-500 focus:border-transparent transition-colors';

// ─── Helpers ──────────────────────────────────────────────────────────────────

export function fmt(n: number) {
  return n.toLocaleString('en-IN', { minimumFractionDigits: 2 });
}

function monthLabel(ym: string) {
  if (!ym) return '';
  const [y, m] = ym.split('-');
  return new Date(Number(y), Number(m) - 1).toLocaleString('en-IN', { month: 'long', year: 'numeric' });
}

export function resolveIncomeLabel(raw: string | null | undefined): string {
  if (!raw) return '—';
  return INCOME_CATEGORIES.find(c => c.value === raw)?.label ?? raw;
}

export function resolveExpenditureLabel(raw: string | null | undefined): string {
  if (!raw) return '—';
  return EXPENDITURE_CATEGORIES.find(c => c.value === raw)?.label ?? raw;
}

function stepDate(dateStr: string, days: number): string {
  const d = new Date(dateStr + 'T00:00:00');
  d.setDate(d.getDate() + days);
  return d.toISOString().split('T')[0];
}

// ─── Merge helper ─────────────────────────────────────────────────────────────

function mergeWithDefaults<T extends Record<string, unknown>>(
  base: T,
  overrides: Partial<T>,
): T {
  const result = { ...base };
  for (const key in overrides) {
    const val = overrides[key];
    result[key] = (val !== null && val !== undefined ? val : base[key]) as T[typeof key];
  }
  return result;
}

// ─── Field wrapper ────────────────────────────────────────────────────────────

function Field({ label, required, children }: {
  label: string; required?: boolean; children: React.ReactNode;
}) {
  return (
    <div>
      <label className="block text-xs font-medium text-slate-500 mb-1.5">
        {label}{required && <span className="text-red-500 ml-0.5">*</span>}
      </label>
      {children}
    </div>
  );
}

// ─── Toast ────────────────────────────────────────────────────────────────────

function Toast({ message, type, onClose }: {
  message: string; type: 'success' | 'error'; onClose: () => void;
}) {
  useEffect(() => {
    const t = setTimeout(onClose, 3500);
    return () => clearTimeout(t);
  }, [onClose]);

  return (
    <div className={`fixed bottom-6 right-6 z-50 flex items-center gap-3 px-4 py-3 rounded-xl shadow-lg text-sm font-medium border transition-all
      ${type === 'success' ? 'bg-teal-50 border-teal-200 text-teal-800' : 'bg-red-50 border-red-200 text-red-800'}`}>
      {type === 'success'
        ? <CheckCircle2 className="w-4 h-4 shrink-0" />
        : <AlertCircle className="w-4 h-4 shrink-0" />}
      {message}
      <button onClick={onClose} className="ml-2 opacity-60 hover:opacity-100">
        <X className="w-3.5 h-3.5" />
      </button>
    </div>
  );
}

// ─── Empty form factories ─────────────────────────────────────────────────────

function emptyIncome() {
  return {
    date:            new Date().toISOString().split('T')[0],
    amount:          '' as unknown as number,
    bill_voucher_no: '',
    notes:           '',
    income_category: 'daily_fees' as IncomeCategory,
    book_no:         '',
    receipt_no:      '',
  };
}

function emptyExpenditure() {
  return {
    date:                 new Date().toISOString().split('T')[0],
    amount:               '' as unknown as number,
    bill_voucher_no:      '',
    notes:                '',
    expenditure_category: 'salary' as ExpenditureCategory,
    staff_name:           '',
    vehicle_no:           '',
  };
}

// ─── Income Form ──────────────────────────────────────────────────────────────

interface IncomeFormProps {
  initial?: Partial<AccountEntry>;
  onSave: (entry: NewEntry) => Promise<void>;
  onCancel: () => void;
  saving: boolean;
}

function IncomeForm({ initial, onSave, onCancel, saving }: IncomeFormProps) {
  const [form, setForm] = useState(() =>
    initial
      ? mergeWithDefaults(emptyIncome(), initial as Partial<ReturnType<typeof emptyIncome>>)
      : emptyIncome()
  );
  const [error, setError] = useState<string | null>(null);

  const set = <K extends keyof typeof form>(key: K, val: (typeof form)[K]) =>
    setForm(f => ({ ...f, [key]: val }));

  const handleSave = async () => {
    if (!form.amount || Number(form.amount) <= 0) { setError('Enter a valid amount'); return; }
    if (!form.date) { setError('Date is required'); return; }
    await onSave({
      type:            'income',
      date:            form.date,
      amount:          Number(form.amount),
      bill_voucher_no: form.bill_voucher_no || null,
      notes:           form.notes || null,
      income_category: form.income_category,
      book_no:         form.book_no || null,
      receipt_no:      form.receipt_no || null,
    });
  };

  return (
    <div className="space-y-4">
      {error && (
        <div className="flex items-center gap-2 p-3 bg-red-50 border border-red-200 rounded-lg text-red-700 text-sm">
          <AlertCircle className="w-4 h-4 shrink-0" />{error}
          <button onClick={() => setError(null)} className="ml-auto"><X className="w-3.5 h-3.5" /></button>
        </div>
      )}
      <div className="grid grid-cols-2 gap-4">
        <div className="col-span-2">
          <Field label="Income Category" required>
            <select value={form.income_category} onChange={e => set('income_category', e.target.value as IncomeCategory)} className={selectCls}>
              {INCOME_CATEGORIES.map(c => <option key={c.value} value={c.value}>{c.label}</option>)}
            </select>
          </Field>
        </div>
        <Field label="Date" required>
          <input type="date" value={form.date} onChange={e => set('date', e.target.value)} className={inputCls} />
        </Field>
        <Field label="Amount (₹)" required>
          <input type="number" min="0" step="0.01" value={form.amount} onChange={e => set('amount', e.target.value as unknown as number)} placeholder="0.00" className={inputCls} />
        </Field>
        <Field label="Bill / Voucher No.">
          <input type="text" value={form.bill_voucher_no} onChange={e => set('bill_voucher_no', e.target.value)} placeholder="e.g. INV-0042" className={inputCls} />
        </Field>
        {(form.income_category === 'receipt' || form.income_category === 'daily_fees') && (
          <Field label="Receipt No.">
            <input type="text" value={form.receipt_no} onChange={e => set('receipt_no', e.target.value)} placeholder="e.g. RCP-001" className={inputCls} />
          </Field>
        )}
        {form.income_category === 'book' && (
          <Field label="Book No.">
            <input type="text" value={form.book_no} onChange={e => set('book_no', e.target.value)} placeholder="e.g. BK-07" className={inputCls} />
          </Field>
        )}
        <div className="col-span-2">
          <Field label="Notes">
            <textarea value={form.notes} onChange={e => set('notes', e.target.value)} rows={3} placeholder="Additional details…" className={`${inputCls} resize-none`} />
          </Field>
        </div>
      </div>
      <div className="flex justify-end gap-2 pt-3 border-t border-slate-100">
        <button onClick={onCancel} className="h-9 px-4 text-sm text-slate-600 rounded-lg border border-slate-200 hover:bg-slate-50 transition-colors">Cancel</button>
        <button onClick={handleSave} disabled={saving} className="h-9 flex items-center gap-2 px-5 text-sm font-semibold bg-teal-600 text-white rounded-lg hover:bg-teal-700 disabled:opacity-60 transition-colors">
          {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
          {saving ? 'Saving…' : 'Save Entry'}
        </button>
      </div>
    </div>
  );
}

// ─── Expenditure Form ─────────────────────────────────────────────────────────

interface ExpenditureFormProps {
  initial?: Partial<AccountEntry>;
  onSave: (entry: NewEntry) => Promise<void>;
  onCancel: () => void;
  saving: boolean;
  staffList: string[];
}

function ExpenditureForm({ initial, onSave, onCancel, saving, staffList }: ExpenditureFormProps) {
  const [form, setForm] = useState(() =>
    initial
      ? mergeWithDefaults(emptyExpenditure(), initial as Partial<ReturnType<typeof emptyExpenditure>>)
      : emptyExpenditure()
  );
  const [error, setError] = useState<string | null>(null);

  const set = <K extends keyof typeof form>(key: K, val: (typeof form)[K]) =>
    setForm(f => ({ ...f, [key]: val }));

  const handleSave = async () => {
    if (!form.amount || Number(form.amount) <= 0) { setError('Enter a valid amount'); return; }
    if (!form.date) { setError('Date is required'); return; }
    await onSave({
      type:                 'expenditure',
      date:                 form.date,
      amount:               Number(form.amount),
      bill_voucher_no:      form.bill_voucher_no || null,
      notes:                form.notes || null,
      expenditure_category: form.expenditure_category,
      staff_name:           form.staff_name || null,
      vehicle_no:           form.vehicle_no || null,
    });
  };

  const needsStaff   = ['salary', 'staff_ta', 'training', 'medical'].includes(form.expenditure_category);
  const needsVehicle = form.expenditure_category === 'vehicle_rent';

  return (
    <div className="space-y-4">
      {error && (
        <div className="flex items-center gap-2 p-3 bg-red-50 border border-red-200 rounded-lg text-red-700 text-sm">
          <AlertCircle className="w-4 h-4 shrink-0" />{error}
          <button onClick={() => setError(null)} className="ml-auto"><X className="w-3.5 h-3.5" /></button>
        </div>
      )}
      <div className="grid grid-cols-2 gap-4">
        <div className="col-span-2">
          <Field label="Expenditure Category" required>
            <select value={form.expenditure_category} onChange={e => set('expenditure_category', e.target.value as ExpenditureCategory)} className={selectCls}>
              {EXPENDITURE_CATEGORIES.map(c => <option key={c.value} value={c.value}>{c.label}</option>)}
            </select>
          </Field>
        </div>
        {needsStaff && (
          <div className="col-span-2">
            <Field label="Staff Member">
              {staffList.length > 0 ? (
                <select value={form.staff_name} onChange={e => set('staff_name', e.target.value)} className={selectCls}>
                  <option value="">— All / General —</option>
                  {staffList.map(s => <option key={s} value={s}>{s}</option>)}
                </select>
              ) : (
                <input type="text" value={form.staff_name} onChange={e => set('staff_name', e.target.value)} placeholder="Staff member name" className={inputCls} />
              )}
            </Field>
          </div>
        )}
        {needsVehicle && (
          <div className="col-span-2">
            <Field label="Vehicle Number">
              <input type="text" value={form.vehicle_no} onChange={e => set('vehicle_no', e.target.value)} placeholder="e.g. KL-07 AB 1234" className={inputCls} />
            </Field>
          </div>
        )}
        <Field label="Date" required>
          <input type="date" value={form.date} onChange={e => set('date', e.target.value)} className={inputCls} />
        </Field>
        <Field label="Amount (₹)" required>
          <input type="number" min="0" step="0.01" value={form.amount} onChange={e => set('amount', e.target.value as unknown as number)} placeholder="0.00" className={inputCls} />
        </Field>
        <Field label="Bill / Voucher No.">
          <input type="text" value={form.bill_voucher_no} onChange={e => set('bill_voucher_no', e.target.value)} placeholder="e.g. VCH-0099" className={inputCls} />
        </Field>
        <div className="col-span-2">
          <Field label="Notes">
            <textarea value={form.notes} onChange={e => set('notes', e.target.value)} rows={3} placeholder="Additional details…" className={`${inputCls} resize-none`} />
          </Field>
        </div>
      </div>
      <div className="flex justify-end gap-2 pt-3 border-t border-slate-100">
        <button onClick={onCancel} className="h-9 px-4 text-sm text-slate-600 rounded-lg border border-slate-200 hover:bg-slate-50 transition-colors">Cancel</button>
        <button onClick={handleSave} disabled={saving} className="h-9 flex items-center gap-2 px-5 text-sm font-semibold bg-rose-600 text-white rounded-lg hover:bg-rose-700 disabled:opacity-60 transition-colors">
          {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
          {saving ? 'Saving…' : 'Save Entry'}
        </button>
      </div>
    </div>
  );
}

// ─── Balance Sheet Row ────────────────────────────────────────────────────────

function BSRow({ entry, index, onDelete, onEdit }: {
  entry: AccountEntry;
  index: number;
  onDelete: (id: string) => void;
  onEdit: (entry: AccountEntry) => void;
}) {
  const isIncome = entry.type === 'income';
  const categoryLabel = isIncome
    ? resolveIncomeLabel(entry.income_category)
    : resolveExpenditureLabel(entry.expenditure_category);

  const subLabel = entry.staff_name
    ? entry.staff_name
    : entry.vehicle_no
      ? entry.vehicle_no
      : entry.book_no
        ? `Book: ${entry.book_no}`
        : entry.receipt_no
          ? `Receipt: ${entry.receipt_no}`
          : entry.notes ?? null;

  const amount = Number(entry.amount);

  return (
    <tr className="hover:bg-slate-50/60 transition-colors">
      <td className="px-3 py-2.5 text-xs text-slate-300 tabular-nums w-8">{index + 1}</td>
      <td className="px-3 py-2.5 text-slate-500 whitespace-nowrap text-xs tabular-nums">
        {new Date(entry.date + 'T00:00:00').toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' })}
      </td>
      <td className="px-3 py-2.5">
        <p className="text-sm text-slate-800 font-medium leading-tight">{categoryLabel}</p>
        {subLabel && <p className="text-xs text-slate-400 mt-0.5 truncate max-w-50">{subLabel}</p>}
      </td>
      <td className="px-3 py-2.5 text-xs text-slate-400 whitespace-nowrap">
        {entry.bill_voucher_no || entry.receipt_no || <span className="text-slate-200">—</span>}
      </td>
      <td className="px-3 py-2.5 text-right whitespace-nowrap border-l border-slate-100">
        {isIncome
          ? <span className="text-sm font-semibold tabular-nums text-teal-700">₹{fmt(amount)}</span>
          : <span className="text-slate-200 text-sm">—</span>}
      </td>
      <td className="px-3 py-2.5 text-right whitespace-nowrap border-l border-slate-100">
        {!isIncome
          ? <span className="text-sm font-semibold tabular-nums text-rose-600">₹{fmt(amount)}</span>
          : <span className="text-slate-200 text-sm">—</span>}
      </td>
      <td className="px-3 py-2.5 w-16 border-l border-slate-100">
        <div className="flex items-center justify-center gap-0.5">
          <button onClick={() => onEdit(entry)} className="p-1.5 text-slate-50 hover:text-white bg-blue-700 hover:bg-blue-800 rounded-md transition-colors" title="Edit">
            <FilePen className="w-3.5 h-3.5" />
          </button>
          <button onClick={() => onDelete(entry.id)} className="p-1.5 rounded-md text-slate-50 hover:text-white bg-red-700 hover:bg-red-800 transition-colors" title="Delete">
            <Trash2 className="w-3.5 h-3.5" />
          </button>
        </div>
      </td>
    </tr>
  );
}

// ─── Delete Confirm Dialog ────────────────────────────────────────────────────

function ConfirmDialog({ message, onConfirm, onCancel }: {
  message: string; onConfirm: () => void; onCancel: () => void;
}) {
  return (
    <div className="fixed inset-0 z-40 flex items-center justify-center bg-black/30 backdrop-blur-sm">
      <div className="bg-white rounded-xl border border-slate-200 shadow-xl p-6 max-w-sm w-full mx-4">
        <p className="text-sm text-slate-700 mb-5">{message}</p>
        <div className="flex justify-end gap-2">
          <button onClick={onCancel} className="h-9 px-4 text-sm text-slate-600 rounded-lg border border-slate-200 hover:bg-slate-50 transition-colors">Cancel</button>
          <button onClick={onConfirm} className="h-9 px-4 text-sm font-semibold bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors">Delete</button>
        </div>
      </div>
    </div>
  );
}

// ─── Day Balance Modal ────────────────────────────────────────────────────────

function DayBalanceModal({
  entries,
  initialDate,
  onClose,
}: {
  entries: AccountEntry[];
  initialDate: string;
  onClose: () => void;
}) {
  const todayStr = new Date().toISOString().split('T')[0];
  const [selectedDate, setSelectedDate] = useState(initialDate);

  const isFuture = selectedDate > todayStr;
  const isSelectedToday = selectedDate === todayStr;

  // Opening balance = everything strictly before selected date
  const openingBalance = entries
    .filter(e => e.date < selectedDate)
    .reduce((sum, e) => sum + (e.type === 'income' ? Number(e.amount) : -Number(e.amount)), 0);

  const dayEntries = entries
    .filter(e => e.date === selectedDate)
    .sort((a, b) => a.created_at.localeCompare(b.created_at));

  const dayIncome = dayEntries
    .filter(e => e.type === 'income')
    .reduce((s, e) => s + Number(e.amount), 0);

  const dayExpenditure = dayEntries
    .filter(e => e.type === 'expenditure')
    .reduce((s, e) => s + Number(e.amount), 0);

  const dayNet         = dayIncome - dayExpenditure;
  const closingBalance = openingBalance + dayNet;

  const dateLabel = new Date(selectedDate + 'T00:00:00').toLocaleDateString('en-IN', {
    weekday: 'long', day: 'numeric', month: 'long', year: 'numeric',
  });

  const goToPrev  = () => setSelectedDate(d => stepDate(d, -1));
  const goToNext  = () => setSelectedDate(d => stepDate(d, +1));
  const goToToday = () => setSelectedDate(todayStr);

  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
      if (e.key === 'ArrowLeft')  goToPrev();
      if (e.key === 'ArrowRight' && !isFuture) goToNext();
    };
    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, [onClose, isFuture]);

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/35 backdrop-blur-sm px-4"
      onClick={e => { if (e.target === e.currentTarget) onClose(); }}
    >
      <div className="bg-white rounded-xl border border-slate-200 shadow-xl w-full max-w-lg overflow-hidden">

        {/* ── Header ───────────────────────────────────── */}
        <div className="flex items-center justify-between px-5 py-4 border-b border-slate-100">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-lg bg-blue-50 flex items-center justify-center text-blue-600">
              <CalendarDays className="w-4 h-4" />
            </div>
            <div>
              <p className="text-sm font-semibold text-slate-800">Daily balance summary</p>
              <p className="text-xs text-slate-400">{dateLabel}</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg border bg-red-500 border-slate-200 text-slate-50 hover:text-slate-100 hover:bg-red-600 transition-colors"
            aria-label="Close"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* ── Date navigator ───────────────────────────── */}
        <div className="flex items-center gap-2 px-4 py-2.5 border-b border-slate-100 bg-slate-50/70">
          <button
            onClick={goToPrev}
            className="h-8 w-8 flex items-center justify-center rounded-lg border border-slate-200 bg-white text-slate-500 hover:text-slate-800 hover:bg-slate-100 transition-colors shrink-0"
            title="Previous day (←)"
          >
            <ChevronLeft className="w-4 h-4" />
          </button>

          <input
            type="date"
            value={selectedDate}
            onChange={e => { if (e.target.value) setSelectedDate(e.target.value); }}
            className="flex-1 h-8 px-3 text-sm text-slate-700 bg-white border border-slate-200 rounded-lg
              focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-colors"
          />

          <button
            onClick={goToNext}
            disabled={isSelectedToday}
            className="h-8 w-8 flex items-center justify-center rounded-lg border border-slate-200 bg-white text-slate-500 hover:text-slate-800 hover:bg-slate-100 transition-colors disabled:opacity-30 disabled:cursor-not-allowed shrink-0"
            title="Next day (→)"
          >
            <ChevronRight className="w-4 h-4" />
          </button>

          {!isSelectedToday && (
            <button
              onClick={goToToday}
              className="h-8 px-3 text-xs font-medium text-blue-600 border border-blue-200 bg-blue-50 hover:bg-blue-100 rounded-lg transition-colors whitespace-nowrap shrink-0"
            >
              Today
            </button>
          )}

          {isSelectedToday && (
            <span className="h-8 px-3 flex items-center text-xs font-medium text-blue-600 bg-blue-50 border border-blue-200 rounded-lg shrink-0">
              Today
            </span>
          )}
        </div>

        {/* ── Balance strip ─────────────────────────────── */}
        <div className="grid grid-cols-3 divide-x divide-slate-100 border-b border-slate-100">
          <div className="px-4 py-3.5">
            <p className="text-[11px] text-slate-400 uppercase tracking-wide mb-1.5">Opening balance</p>
            <p className={`text-sm font-bold tabular-nums ${openingBalance >= 0 ? 'text-blue-700' : 'text-rose-600'}`}>
              {openingBalance < 0 ? '−' : ''}₹{fmt(Math.abs(openingBalance))}
            </p>
            <p className="text-[10px] text-slate-400 mt-0.5">Before this day</p>
          </div>

          <div className="px-4 py-3.5">
            <p className="text-[11px] text-slate-400 uppercase tracking-wide mb-1.5">Day's net</p>
            {isFuture ? (
              <p className="text-sm font-bold text-slate-300">—</p>
            ) : (
              <>
                <p className={`text-sm font-bold tabular-nums ${dayNet >= 0 ? 'text-teal-700' : 'text-rose-600'}`}>
                  {dayNet >= 0 ? '+' : ''}₹{fmt(dayNet)}
                </p>
                <p className="text-[10px] mt-0.5 flex items-center gap-1">
                  <span className="text-teal-600 font-medium tabular-nums">+₹{fmt(dayIncome)}</span>
                  <span className="text-slate-300">/</span>
                  <span className="text-rose-500 font-medium tabular-nums">−₹{fmt(dayExpenditure)}</span>
                </p>
              </>
            )}
          </div>

          <div className="px-4 py-3.5">
            <p className="text-[11px] text-slate-400 uppercase tracking-wide mb-1.5">Closing balance</p>
            {isFuture ? (
              <p className="text-sm font-bold text-slate-300">—</p>
            ) : (
              <>
                <p className={`text-sm font-bold tabular-nums ${closingBalance >= 0 ? 'text-teal-700' : 'text-rose-600'}`}>
                  {closingBalance < 0 ? '−' : ''}₹{fmt(Math.abs(closingBalance))}
                </p>
                <p className="text-[10px] text-slate-400 mt-0.5">Next day's opening</p>
              </>
            )}
          </div>
        </div>

        {/* ── Transaction list ──────────────────────────── */}
        <div className="px-5 pt-3.5 pb-1 max-h-60 overflow-y-auto">
          <p className="text-[11px] font-semibold text-slate-400 uppercase tracking-wide mb-2">
            {isFuture
              ? 'Future date — no transactions'
              : `Transactions — ${dayEntries.length} ${dayEntries.length === 1 ? 'entry' : 'entries'}`}
          </p>

          {isFuture ? (
            <div className="flex flex-col items-center justify-center py-7 gap-2 text-slate-300">
              <CalendarDays className="w-8 h-8" />
              <p className="text-sm">No data available for future dates.</p>
            </div>
          ) : dayEntries.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-7 gap-2 text-slate-400">
              <FileText className="w-8 h-8 text-slate-200" />
              <p className="text-sm">No transactions on this day.</p>
            </div>
          ) : (
            <div className="divide-y divide-slate-100">
              {dayEntries.map(e => {
                const isIncome = e.type === 'income';
                const label    = isIncome
                  ? resolveIncomeLabel(e.income_category)
                  : resolveExpenditureLabel(e.expenditure_category);
                const sub = e.staff_name
                  ?? e.vehicle_no
                  ?? (e.book_no    ? `Book: ${e.book_no}`       : null)
                  ?? (e.receipt_no ? `Receipt: ${e.receipt_no}` : null)
                  ?? e.notes
                  ?? null;

                return (
                  <div key={e.id} className="flex items-center justify-between py-2.5 gap-3">
                    <div className="flex items-center gap-2.5 min-w-0">
                      <span className={`w-2 h-2 rounded-full shrink-0 ${isIncome ? 'bg-teal-500' : 'bg-rose-500'}`} />
                      <div className="min-w-0">
                        <p className="text-sm text-slate-800 truncate">{label}</p>
                        {sub && <p className="text-xs text-slate-400 truncate">{sub}</p>}
                      </div>
                    </div>
                    <div className="flex items-center gap-2 shrink-0">
                      {e.bill_voucher_no && (
                        <span className="text-[10px] text-slate-400 bg-slate-100 px-1.5 py-0.5 rounded font-mono">
                          {e.bill_voucher_no}
                        </span>
                      )}
                      <span className={`text-sm font-semibold tabular-nums ${isIncome ? 'text-teal-700' : 'text-rose-600'}`}>
                        {isIncome ? '+' : '−'}₹{fmt(Number(e.amount))}
                      </span>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* ── Footer ───────────────────────────────────── */}
        <div className="flex items-center justify-end px-5 py-3 mt-2 border-t border-slate-100 bg-slate-50/60">
        
          <button
            onClick={onClose}
            className="h-8 px-4 text-xs font-medium bg-red-600 text-slate-50 rounded-lg border border-slate-200 hover:bg-red-700 transition-colors"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
}

// ─── Main Component ───────────────────────────────────────────────────────────

interface AccountsUIProps {
  staffList?: string[];
}

type ActiveView = 'list' | 'add' | 'edit';

export default function AccountsUI({ staffList = [] }: AccountsUIProps) {
  const [entries, setEntries]             = useState<AccountEntry[]>([]);
  const [activeSection, setActiveSection] = useState<EntryType>('income');
  const [view, setView]                   = useState<ActiveView>('list');
  const [saving, setSaving]               = useState(false);
  const [loading, setLoading]             = useState(true);
  const [search, setSearch]               = useState('');
  const [dateFrom, setDateFrom]           = useState('');
  const [dateTo, setDateTo]               = useState('');
  const [filterMonth, setFilterMonth]     = useState('');
  const [typeFilter, setTypeFilter]       = useState<TypeFilter>('all');
  const [totals, setTotals]               = useState({ income: 0, expenditure: 0, balance: 0 });
  const [editTarget, setEditTarget]       = useState<AccountEntry | null>(null);
  const [deleteTarget, setDeleteTarget]   = useState<string | null>(null);
  const [toast, setToast]                 = useState<{ message: string; type: 'success' | 'error' } | null>(null);
  const [showDayModal, setShowDayModal]   = useState(false);

  // ── Load data ─────────────────────────────────────────
  const loadData = useCallback(async () => {
    try {
      setLoading(true);
      const [data, t] = await Promise.all([fetchEntries({}), fetchTotals()]);
      setEntries(data);
      setTotals(t);
    } catch (e: unknown) {
      const message = e instanceof Error ? e.message : 'Failed to load entries';
      setToast({ message, type: 'error' });
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { loadData(); }, [loadData]);
  useAccountsRealtime(loadData);

  // ── Sync filterMonth → dateFrom / dateTo ─────────────
  useEffect(() => {
    if (filterMonth) {
      const [y, m] = filterMonth.split('-').map(Number);
      const lastDay = new Date(y, m, 0).getDate();
      setDateFrom(`${filterMonth}-01`);
      setDateTo(`${filterMonth}-${String(lastDay).padStart(2, '0')}`);
    }
  }, [filterMonth]);

  const handleDateFromChange = (v: string) => { setDateFrom(v); setFilterMonth(''); };
  const handleDateToChange   = (v: string) => { setDateTo(v);   setFilterMonth(''); };

  // ── Sorted & filtered entries ─────────────────────────
  const sortedAll = [...entries].sort((a, b) => a.date.localeCompare(b.date));

  const effectiveDateFrom = dateFrom;
  const effectiveDateTo   = dateTo;
  const isFiltered        = !!(effectiveDateFrom || effectiveDateTo || typeFilter !== 'all' || search);

  const openingBalance = effectiveDateFrom
    ? sortedAll
        .filter(e => e.date < effectiveDateFrom)
        .reduce((sum, e) => sum + (e.type === 'income' ? Number(e.amount) : -Number(e.amount)), 0)
    : 0;

  const filtered = sortedAll.filter(e => {
    const q       = search.toLowerCase();
    const inLabel = resolveIncomeLabel(e.income_category).toLowerCase().includes(q);
    const exLabel = resolveExpenditureLabel(e.expenditure_category).toLowerCase().includes(q);
    const matchSearch = !q || inLabel || exLabel
      || (e.staff_name      ?? '').toLowerCase().includes(q)
      || (e.vehicle_no      ?? '').toLowerCase().includes(q)
      || (e.bill_voucher_no ?? '').toLowerCase().includes(q)
      || (e.notes           ?? '').toLowerCase().includes(q)
      || (e.receipt_no      ?? '').toLowerCase().includes(q);
    const matchFrom = !effectiveDateFrom || e.date >= effectiveDateFrom;
    const matchTo   = !effectiveDateTo   || e.date <= effectiveDateTo;
    const matchType = typeFilter === 'all' || e.type === typeFilter;
    return matchSearch && matchFrom && matchTo && matchType;
  });

  const filteredIncome      = filtered.filter(e => e.type === 'income').reduce((s, e) => s + Number(e.amount), 0);
  const filteredExpenditure = filtered.filter(e => e.type === 'expenditure').reduce((s, e) => s + Number(e.amount), 0);
  const filteredNet         = filteredIncome - filteredExpenditure;
  const closingBalance      = openingBalance + filteredNet;

  // ── Handlers ──────────────────────────────────────────
  const handleSave = async (data: NewEntry) => {
    setSaving(true);
    try {
      if (editTarget) {
        await updateEntry(editTarget.id, data);
        setToast({ message: 'Entry updated successfully', type: 'success' });
      } else {
        await createEntry(data);
        setToast({ message: 'Entry saved successfully', type: 'success' });
      }
      await loadData();
      setView('list');
      setEditTarget(null);
    } catch (e: unknown) {
      const message = e instanceof Error ? e.message : 'Failed to save entry';
      setToast({ message, type: 'error' });
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (id: string) => {
    try {
      await deleteEntry(id);
      setEntries(prev => prev.filter(e => e.id !== id));
      const t = await fetchTotals();
      setTotals(t);
      setToast({ message: 'Entry deleted', type: 'success' });
    } catch (e: unknown) {
      const message = e instanceof Error ? e.message : 'Failed to delete entry';
      setToast({ message, type: 'error' });
    } finally {
      setDeleteTarget(null);
    }
  };

  const openEdit  = (entry: AccountEntry) => { setEditTarget(entry); setActiveSection(entry.type); setView('edit'); };
  const openAdd   = (type: EntryType)     => { setEditTarget(null);  setActiveSection(type);       setView('add'); };
  const closeForm = ()                    => { setEditTarget(null);  setView('list'); };

  const clearFilters = () => {
    setDateFrom(''); setDateTo(''); setFilterMonth('');
    setSearch(''); setTypeFilter('all');
  };

  const hasActiveFilter = !!(dateFrom || dateTo || filterMonth || search || typeFilter !== 'all');

  // ── Render ────────────────────────────────────────────
  return (
    <div className="w-full space-y-4">

      {toast && <Toast message={toast.message} type={toast.type} onClose={() => setToast(null)} />}

      {deleteTarget && (
        <ConfirmDialog
          message="Delete this entry? This action cannot be undone."
          onConfirm={() => handleDelete(deleteTarget)}
          onCancel={() => setDeleteTarget(null)}
        />
      )}

      {showDayModal && (
        <DayBalanceModal
          entries={entries}
          initialDate={new Date().toISOString().split('T')[0]}
          onClose={() => setShowDayModal(false)}
        />
      )}

 {/* ── Summary Cards ─────────────────────────────── */}
<div className="grid grid-cols-3 gap-3">
  <div className="relative overflow-hidden rounded-2xl px-5 py-4 bg-[linear-gradient(135deg,_#059669_0%,_#0D9488_55%,_#0891B2_100%)] shadow-lg shadow-emerald-200">
    <div className="absolute -right-5 -top-5 w-24 h-24 rounded-full bg-white/10" />
    <div className="absolute right-3 bottom-2 w-12 h-12 rounded-full bg-black/10" />
    <div className="relative z-10">
      <p className="text-[10px] font-bold uppercase tracking-[.18em] text-white/60 mb-2">Total Income</p>
      <p className="text-xl font-black text-white tabular-nums">₹{fmt(totals.income)}</p>
    </div>
  </div>

  <div className="relative overflow-hidden rounded-2xl px-5 py-4 bg-[linear-gradient(135deg,_#DC2626_0%,_#DB2777_60%,_#9333EA_100%)] shadow-lg shadow-rose-200">
    <div className="absolute -right-5 -top-5 w-24 h-24 rounded-full bg-white/10" />
    <div className="absolute right-3 bottom-2 w-12 h-12 rounded-full bg-black/10" />
    <div className="relative z-10">
      <p className="text-[10px] font-bold uppercase tracking-[.18em] text-white/60 mb-2">Total Expenditure</p>
      <p className="text-xl font-black text-white tabular-nums">₹{fmt(totals.expenditure)}</p>
    </div>
  </div>

  <div className={`relative overflow-hidden rounded-2xl px-5 py-4 shadow-lg ${
    totals.balance >= 0
      ? 'bg-[linear-gradient(135deg,_#2563EB_0%,_#7C3AED_55%,_#DB2777_100%)] shadow-blue-200'
      : 'bg-[linear-gradient(135deg,_#F59E0B_0%,_#EF4444_55%,_#EC4899_100%)] shadow-amber-200'
  }`}>
    <div className="absolute -right-5 -top-5 w-24 h-24 rounded-full bg-white/10" />
    <div className="absolute right-3 bottom-2 w-12 h-12 rounded-full bg-black/10" />
    <div className="relative z-10">
      <p className="text-[10px] font-bold uppercase tracking-[.18em] text-white/60 mb-2">Balance</p>
      <p className="text-xl font-black text-white tabular-nums">
        {totals.balance >= 0 ? '+' : ''}₹{fmt(totals.balance)}
      </p>
    </div>
  </div>
</div>
      {/* ── Opening / Closing Balance Bar ─────────────── */}
      {isFiltered && effectiveDateFrom && (
        <div className="grid grid-cols-3 gap-3">
          <div className="bg-slate-50 rounded-xl border border-slate-200 px-4 py-3 shadow-sm">
            <p className="text-xs text-slate-400 mb-1 font-medium uppercase tracking-wide">Opening Balance</p>
            <p className={`text-lg font-bold tabular-nums ${openingBalance >= 0 ? 'text-slate-700' : 'text-red-600'}`}>
              {openingBalance >= 0 ? '+' : ''}₹{fmt(openingBalance)}
            </p>
            <p className="text-[11px] text-slate-400 mt-0.5">Before {effectiveDateFrom}</p>
          </div>
          <div className="bg-slate-50 rounded-xl border border-slate-200 px-4 py-3 shadow-sm">
            <div className="flex justify-between items-start">
              <div>
                <p className="text-xs text-slate-400 mb-1 font-medium uppercase tracking-wide">Period Activity</p>
                <p className="text-xs text-teal-700 font-semibold tabular-nums">+₹{fmt(filteredIncome)}</p>
                <p className="text-xs text-rose-600 font-semibold tabular-nums">−₹{fmt(filteredExpenditure)}</p>
              </div>
              <div className="text-right">
                <p className="text-xs text-slate-400 mb-1 font-medium uppercase tracking-wide">Net</p>
                <p className={`text-lg font-bold tabular-nums ${filteredNet >= 0 ? 'text-teal-700' : 'text-rose-600'}`}>
                  {filteredNet >= 0 ? '+' : ''}₹{fmt(filteredNet)}
                </p>
              </div>
            </div>
            {filterMonth && <p className="text-[11px] text-slate-400 mt-1">{monthLabel(filterMonth)}</p>}
            {!filterMonth && (effectiveDateFrom || effectiveDateTo) && (
              <p className="text-[11px] text-slate-400 mt-1">{effectiveDateFrom || '…'} → {effectiveDateTo || '…'}</p>
            )}
          </div>
          <div className={`rounded-xl border px-4 py-3 shadow-sm ${closingBalance >= 0 ? 'bg-teal-50 border-teal-200' : 'bg-red-50 border-red-200'}`}>
            <p className="text-xs text-slate-400 mb-1 font-medium uppercase tracking-wide">Closing Balance</p>
            <p className={`text-lg font-bold tabular-nums ${closingBalance >= 0 ? 'text-teal-700' : 'text-red-600'}`}>
              {closingBalance >= 0 ? '+' : ''}₹{fmt(closingBalance)}
            </p>
            {effectiveDateTo && <p className="text-[11px] text-slate-400 mt-0.5">As of {effectiveDateTo}</p>}
          </div>
        </div>
      )}

      {/* ── Add / Edit Form ───────────────────────────── */}
      {(view === 'add' || view === 'edit') && (
        <div className="bg-white rounded-xl border border-slate-200 p-5 shadow-sm">
          <h3 className="text-sm font-semibold text-slate-800 mb-4">
            {view === 'edit' ? 'Edit Entry' : activeSection === 'income' ? 'New Income Entry' : 'New Expenditure Entry'}
          </h3>
          {activeSection === 'income' ? (
            <IncomeForm initial={editTarget ?? undefined} onSave={handleSave} onCancel={closeForm} saving={saving} />
          ) : (
            <ExpenditureForm initial={editTarget ?? undefined} onSave={handleSave} onCancel={closeForm} saving={saving} staffList={staffList} />
          )}
        </div>
      )}

      {/* ── List Panel ────────────────────────────────── */}
      {view === 'list' && (
        <div className="bg-white rounded-xl border border-slate-200 overflow-hidden shadow-sm">

          {/* Toolbar */}
          <div className="flex items-center gap-2 px-4 py-3 border-b border-slate-100 flex-wrap">
            <div className="relative min-w-37.5 max-w-50 flex-1">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-slate-400 pointer-events-none" />
              <input
                type="text" placeholder="Search…" value={search}
                onChange={e => setSearch(e.target.value)}
                className="w-full h-8 pl-8 pr-3 text-sm text-slate-800 bg-slate-50 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-teal-500 focus:bg-white placeholder:text-slate-400 transition-colors"
              />
            </div>
            <input
              type="month" value={filterMonth}
              onChange={e => setFilterMonth(e.target.value)}
              title="Filter by month"
              className="h-8 px-3 text-sm text-slate-700 bg-slate-50 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-teal-500 focus:bg-white transition-colors"
            />
            <div className="flex items-center gap-1.5">
              <input type="date" value={dateFrom} onChange={e => handleDateFromChange(e.target.value)} title="From date"
                className="h-8 px-2 text-sm text-slate-700 bg-slate-50 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-teal-500 focus:bg-white transition-colors" />
              <span className="text-xs text-slate-400">–</span>
              <input type="date" value={dateTo} onChange={e => handleDateToChange(e.target.value)} title="To date"
                className="h-8 px-2 text-sm text-slate-700 bg-slate-50 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-teal-500 focus:bg-white transition-colors" />
            </div>
            <div className="flex items-center gap-1 rounded-lg border border-slate-200 bg-slate-50 p-0.5">
              {(['all', 'income', 'expenditure'] as TypeFilter[]).map(t => (
                <button key={t} onClick={() => setTypeFilter(t)}
                  className={`h-6 px-3 text-xs font-medium rounded-md transition-all capitalize ${
                    typeFilter === t
                      ? t === 'income'      ? 'bg-teal-600 text-white shadow-sm'
                      : t === 'expenditure' ? 'bg-rose-600 text-white shadow-sm'
                      :                       'bg-white text-slate-700 shadow-sm'
                      : 'text-slate-500 hover:text-slate-700'
                  }`}>
                  {t === 'all' ? 'All' : t === 'income' ? 'Income' : 'Expense'}
                </button>
              ))}
            </div>
            {hasActiveFilter && (
              <button onClick={clearFilters} className="h-8 px-3 text-xs text-slate-500 rounded-lg border border-slate-200 hover:bg-slate-50 transition-colors flex items-center gap-1">
                <X className="w-3 h-3" /> Clear
              </button>
            )}
            <button onClick={loadData} disabled={loading}
              className="h-8 w-8 flex items-center justify-center rounded-lg border border-slate-200 text-slate-400 hover:text-slate-700 hover:bg-slate-50 transition-colors" title="Refresh">
              <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
            </button>
            <span className="text-xs text-slate-400 tabular-nums ml-auto">
              {filtered.length} {filtered.length === 1 ? 'entry' : 'entries'}
            </span>
            <button
              onClick={() => setShowDayModal(true)}
              className="h-8 flex items-center gap-1.5 px-3 text-sm font-medium text-white rounded-lg bg-blue-600 hover:bg-blue-700 transition-colors"
              title="View daily balance summary"
            >
              <CalendarDays className="w-3.5 h-3.5" />
              Daily Summary
            </button>
            <button onClick={() => openAdd('income')} className="h-8 flex items-center gap-1.5 px-3 text-sm font-medium text-white rounded-lg bg-teal-600 hover:bg-teal-700 transition-colors">
              <Plus className="w-3.5 h-3.5" /> Income
            </button>
            <button onClick={() => openAdd('expenditure')} className="h-8 flex items-center gap-1.5 px-3 text-sm font-medium text-white rounded-lg bg-rose-600 hover:bg-rose-700 transition-colors">
              <Plus className="w-3.5 h-3.5" /> Expense
            </button>
          </div>

          {loading && (
            <div className="flex items-center justify-center py-16 gap-3 text-slate-400">
              <Loader2 className="w-5 h-5 animate-spin" />
              <span className="text-sm">Loading entries…</span>
            </div>
          )}

          {!loading && filtered.length === 0 && (
            <div className="flex flex-col items-center justify-center py-16 gap-3 text-slate-400">
              <FileText className="w-10 h-10 text-slate-200" />
              <p className="text-sm">{hasActiveFilter ? 'No entries match your filter.' : 'No entries yet.'}</p>
              {!hasActiveFilter && (
                <div className="flex gap-2">
                  <button onClick={() => openAdd('income')} className="h-8 px-4 text-sm font-medium text-white rounded-lg bg-teal-600 hover:bg-teal-700 transition-colors">Add income</button>
                  <button onClick={() => openAdd('expenditure')} className="h-8 px-4 text-sm font-medium text-white rounded-lg bg-rose-600 hover:bg-rose-700 transition-colors">Add expense</button>
                </div>
              )}
            </div>
          )}

          {!loading && filtered.length > 0 && (
            <div className="overflow-x-auto">
              <table className="w-full text-sm min-w-195">
                <thead>
                  <tr className="border-b border-slate-200 bg-slate-50">
                    <th className="px-3 py-2.5 text-left text-xs font-medium text-slate-400 w-8">#</th>
                    <th className="px-3 py-2.5 text-left text-xs font-semibold text-slate-500 whitespace-nowrap">Date</th>
                    <th className="px-3 py-2.5 text-left text-xs font-semibold text-slate-500">Particulars</th>
                    <th className="px-3 py-2.5 text-left text-xs font-semibold text-slate-500 whitespace-nowrap">Bill / Voucher</th>
                    <th className="px-3 py-2.5 text-right text-xs font-semibold text-teal-700 whitespace-nowrap border-l border-slate-200 bg-teal-50/40">Income (₹)</th>
                    <th className="px-3 py-2.5 text-right text-xs font-semibold text-rose-600 whitespace-nowrap border-l border-slate-200 bg-rose-50/40">Expenditure (₹)</th>
                    <th className="px-3 py-2.5 w-16 border-l border-slate-200" />
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {effectiveDateFrom && (
                    <tr className="bg-slate-50/80">
                      <td colSpan={4} className="px-3 py-2 text-xs font-semibold text-slate-500 italic">
                        Opening Balance
                        <span className="ml-2 font-normal text-slate-400 not-italic">(as of {effectiveDateFrom})</span>
                      </td>
                      <td className="px-3 py-2 text-right border-l border-slate-200 bg-teal-50/20">
                        {openingBalance > 0 && <span className="text-xs font-semibold text-teal-700 tabular-nums">₹{fmt(openingBalance)}</span>}
                      </td>
                      <td className="px-3 py-2 text-right border-l border-slate-200 bg-rose-50/20">
                        {openingBalance < 0 && <span className="text-xs font-semibold text-rose-600 tabular-nums">₹{fmt(Math.abs(openingBalance))}</span>}
                        {openingBalance === 0 && <span className="text-slate-300 text-xs">—</span>}
                      </td>
                      <td className="border-l border-slate-200" />
                    </tr>
                  )}
                  {filtered.map((entry, i) => (
                    <BSRow key={entry.id} entry={entry} index={i} onDelete={id => setDeleteTarget(id)} onEdit={openEdit} />
                  ))}
                </tbody>
                <tfoot>
                  <tr className="border-t-2 border-slate-300 bg-slate-100">
                    <td colSpan={4} className="px-3 py-2.5 text-xs font-semibold text-slate-600">
                      Total ({filtered.length} {filtered.length === 1 ? 'entry' : 'entries'})
                      {filterMonth && <span className="ml-2 font-normal text-slate-400">— {monthLabel(filterMonth)}</span>}
                    </td>
                    <td className="px-3 py-2.5 text-right border-l border-slate-200 bg-teal-50">
                      <span className="text-sm font-bold tabular-nums text-teal-700">₹{fmt(filteredIncome)}</span>
                    </td>
                    <td className="px-3 py-2.5 text-right border-l border-slate-200 bg-rose-50">
                      <span className="text-sm font-bold tabular-nums text-rose-600">₹{fmt(filteredExpenditure)}</span>
                    </td>
                    <td className="border-l border-slate-200" />
                  </tr>
                  <tr className={`border-t border-slate-200 ${filteredNet >= 0 ? 'bg-teal-50/60' : 'bg-rose-50/60'}`}>
                    <td colSpan={4} className="px-3 py-2 text-xs font-semibold text-slate-600">
                      {effectiveDateFrom ? 'Closing Balance' : 'Net Balance'}
                      {effectiveDateTo && <span className="ml-2 font-normal text-slate-400">— as of {effectiveDateTo}</span>}
                    </td>
                    <td colSpan={2} className="px-3 py-2 text-right border-l border-slate-200">
                      <span className={`text-sm font-bold tabular-nums ${
                        (effectiveDateFrom ? closingBalance : filteredNet) >= 0 ? 'text-teal-700' : 'text-rose-600'
                      }`}>
                        {(effectiveDateFrom ? closingBalance : filteredNet) >= 0 ? '+' : ''}
                        ₹{fmt(effectiveDateFrom ? closingBalance : filteredNet)}
                      </span>
                    </td>
                    <td className="border-l border-slate-200" />
                  </tr>
                </tfoot>
              </table>
            </div>
          )}
        </div>
      )}
    </div>
  );
}