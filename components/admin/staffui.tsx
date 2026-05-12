'use client';

import { useEffect, useState, useCallback } from 'react';
import {
  Plus, Search, Pencil, Trash2, Eye, Users,
  ChevronUp, ChevronDown, AlertCircle, X, RefreshCw,
  Banknote, CheckCircle2,
} from 'lucide-react';
import { Staff } from '@/type/staff';
import { deleteStaff, getAllStaff } from '@/utils/actions/staff-actions';
import { StaffModal } from './StaffModal';
import { StaffDetailDrawer } from './Staffdetaildrawer';
import PaySalaryModal from './PaySalaryModal';
import { getPayrollStatusForMonth, getPayrollForStaff, type PayrollRecord } from '@/utils/actions/payroll';

type SortKey = 'name' | 'department' | 'designation' | 'date_joined' | 'total_salary';
type SortDir  = 'asc' | 'desc';

// Status per staff member for the current month
interface PayStatus {
  totalPaid:        number
  isFullyPaid:      boolean
  isPartiallyPaid:  boolean
}

export default function StaffUI() {
  const [staff, setStaff]               = useState<Staff[]>([]);
  const [filtered, setFiltered]         = useState<Staff[]>([]);
  const [loading, setLoading]           = useState(true);
  const [error, setError]               = useState<string | null>(null);
  const [search, setSearch]             = useState('');
  const [sortKey, setSortKey]           = useState<SortKey>('name');
  const [sortDir, setSortDir]           = useState<SortDir>('asc');
  const [modalOpen, setModalOpen]       = useState(false);
  const [editingStaff, setEditingStaff] = useState<Staff | null>(null);
  const [viewingStaff, setViewingStaff] = useState<Staff | null>(null);
  const [deleteConfirm, setDeleteConfirm] = useState<string | null>(null);
  const [deleting, setDeleting]         = useState(false);

  // ── Payroll state ─────────────────────────────────────────────────────────
  const [payTarget, setPayTarget]               = useState<Staff | null>(null);
  const [payStatusMap, setPayStatusMap]         = useState<Record<string, PayStatus>>({});
  const [staffPayHistory, setStaffPayHistory]   = useState<PayrollRecord[]>([]);
  const [payHistoryLoading, setPayHistoryLoading] = useState(false);
  const [payToast, setPayToast]                 = useState<string | null>(null);

  const currentMonth = new Date().toISOString().slice(0, 7);

  // ── Fetch staff + payroll status ──────────────────────────────────────────
  const fetchStaff = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      const data = await getAllStaff();
      setStaff(data);
      setFiltered(data);

      // Build payroll status using full salary info per staff member
      const statusMap = await getPayrollStatusForMonth(
        currentMonth,
        data.map(s => ({
          id:           s.id,
          basic_salary: s.basic_salary,
          ta:           s.ta,
        }))
      );
      setPayStatusMap(statusMap);
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Failed to load staff data');
    } finally {
      setLoading(false);
    }
  }, [currentMonth]);

  useEffect(() => { fetchStaff(); }, [fetchStaff]);

  // ── Filter + sort ─────────────────────────────────────────────────────────
  useEffect(() => {
    const q = search.toLowerCase();
    const result = staff.filter(s =>
      s.name.toLowerCase().includes(q) ||
      (s.department   || '').toLowerCase().includes(q) ||
      (s.designation  || '').toLowerCase().includes(q) ||
      (s.mobile       || '').includes(q)
    );
    const sorted = [...result].sort((a, b) => {
      let av: string | number = a[sortKey] ?? '';
      let bv: string | number = b[sortKey] ?? '';
      if (sortKey === 'total_salary') { av = Number(av); bv = Number(bv); }
      return sortDir === 'asc'
        ? String(av).localeCompare(String(bv))
        : String(bv).localeCompare(String(av));
    });
    setFiltered(sorted);
  }, [search, staff, sortKey, sortDir]);

  const handleSort = (key: SortKey) => {
    if (sortKey === key) setSortDir(d => d === 'asc' ? 'desc' : 'asc');
    else { setSortKey(key); setSortDir('asc'); }
  };

  const handleDelete = async (id: string) => {
    try {
      setDeleting(true);
      await deleteStaff(id);
      setDeleteConfirm(null);
      fetchStaff();
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Failed to delete');
    } finally {
      setDeleting(false);
    }
  };

  // ── Open pay modal ────────────────────────────────────────────────────────
  const handleOpenPay = async (s: Staff) => {
    setPayHistoryLoading(true);
    try {
      const history = await getPayrollForStaff(s.id);
      setStaffPayHistory(history);
      setPayTarget(s);
    } catch {
      setStaffPayHistory([]);
      setPayTarget(s);
    } finally {
      setPayHistoryLoading(false);
    }
  };

  const handlePaySuccess = (msg: string) => {
    setPayToast(msg);
    setPayTarget(null);
    setStaffPayHistory([]);
    fetchStaff();
  };

  // ── Helpers ───────────────────────────────────────────────────────────────
  const SortIcon = ({ col }: { col: SortKey }) =>
    sortKey === col
      ? sortDir === 'asc'
        ? <ChevronUp   className="w-3 h-3 ml-1 text-teal-600" />
        : <ChevronDown className="w-3 h-3 ml-1 text-teal-600" />
      : <ChevronUp className="w-3 h-3 ml-1 opacity-20" />;

  const initials = (name: string) =>
    name.split(' ').map(n => n[0]).join('').slice(0, 2).toUpperCase();

  const AVATAR_COLORS = [
    'bg-teal-100 text-teal-700',
    'bg-blue-100 text-blue-700',
    'bg-violet-100 text-violet-700',
    'bg-amber-100 text-amber-700',
    'bg-rose-100 text-rose-700',
  ];
  const avatarColor = (name: string) =>
    AVATAR_COLORS[name.charCodeAt(0) % AVATAR_COLORS.length];

  // ── Render ────────────────────────────────────────────────────────────────
  return (
    <div className="w-full space-y-4">

      {/* ── Toolbar ── */}
      <div className="flex items-center justify-between gap-3 flex-wrap">
        <div className="relative flex-1 min-w-50 max-w-sm">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400 pointer-events-none" />
          <input
            type="text"
            placeholder="Search staff…"
            value={search}
            onChange={e => setSearch(e.target.value)}
            className="w-full h-9 pl-9 pr-8 text-sm bg-white border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-teal-500 focus:border-transparent placeholder:text-slate-400"
          />
          {search && (
            <button onClick={() => setSearch('')} className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600">
              <X className="w-3.5 h-3.5" />
            </button>
          )}
        </div>

        <div className="flex items-center gap-2">
          <span className="text-sm text-slate-400 tabular-nums">
            {filtered.length} {filtered.length === 1 ? 'member' : 'members'}
          </span>
          <div className="w-px h-5 bg-slate-200" />
          <button
            onClick={fetchStaff}
            className="h-9 w-9 flex items-center justify-center rounded-lg border border-slate-200 bg-white text-slate-500 hover:text-teal-600 hover:border-teal-300 transition-colors"
            title="Refresh"
          >
            <RefreshCw className="w-4 h-4" />
          </button>
          <button
            onClick={() => { setEditingStaff(null); setModalOpen(true); }}
            className="h-9 flex items-center gap-1.5 px-3.5 text-sm font-medium bg-teal-600 text-white rounded-lg hover:bg-teal-700 transition-colors"
          >
            <Plus className="w-4 h-4" /> Add Staff
          </button>
        </div>
      </div>

      {/* ── Error Banner ── */}
      {error && (
        <div className="flex items-center gap-3 px-4 py-3 bg-red-50 border border-red-200 rounded-lg text-sm text-red-700">
          <AlertCircle className="w-4 h-4 shrink-0" />
          <span className="flex-1">{error}</span>
          <button onClick={() => setError(null)} className="text-red-400 hover:text-red-600">
            <X className="w-4 h-4" />
          </button>
        </div>
      )}

      {/* ── Table ── */}
      <div className="rounded-xl border border-slate-200 bg-white overflow-hidden">
        {loading ? (
          <div className="flex flex-col items-center justify-center py-20 gap-3 text-slate-400">
            <div className="w-6 h-6 border-2 border-teal-500 border-t-transparent rounded-full animate-spin" />
            <span className="text-sm">Loading…</span>
          </div>
        ) : filtered.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-20 gap-4 text-slate-400">
            <Users className="w-10 h-10 text-slate-200" />
            <p className="text-sm">{search ? 'No staff match your search.' : 'No staff added yet.'}</p>
            {!search && (
              <button
                onClick={() => { setEditingStaff(null); setModalOpen(true); }}
                className="h-9 px-4 text-sm font-medium bg-teal-600 text-white rounded-lg hover:bg-teal-700 transition-colors"
              >
                Add first member
              </button>
            )}
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm min-w-230">
              <thead>
                <tr className="border-b border-slate-100 bg-slate-50">
                  <th className="w-10 px-4 py-3 text-left text-xs font-medium text-slate-400 select-none">s/no.</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-slate-500 cursor-pointer hover:text-slate-800 select-none whitespace-nowrap" onClick={() => handleSort('name')}>
                    <span className="inline-flex items-center">Name <SortIcon col="name" /></span>
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-slate-500 whitespace-nowrap">Mobile</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-slate-500 cursor-pointer hover:text-slate-800 select-none whitespace-nowrap" onClick={() => handleSort('designation')}>
                    <span className="inline-flex items-center">Designation <SortIcon col="designation" /></span>
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-slate-500 cursor-pointer hover:text-slate-800 select-none whitespace-nowrap" onClick={() => handleSort('department')}>
                    <span className="inline-flex items-center">Department <SortIcon col="department" /></span>
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-slate-500 cursor-pointer hover:text-slate-800 select-none whitespace-nowrap" onClick={() => handleSort('date_joined')}>
                    <span className="inline-flex items-center">Joined <SortIcon col="date_joined" /></span>
                  </th>
                  <th className="px-4 py-3 text-right text-xs font-medium text-slate-500 cursor-pointer hover:text-slate-800 select-none whitespace-nowrap" onClick={() => handleSort('total_salary')}>
                    <span className="inline-flex items-center justify-end">Salary <SortIcon col="total_salary" /></span>
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-slate-500 whitespace-nowrap">Status</th>
                  <th className="px-4 py-3 text-center text-xs font-medium text-slate-500 w-28">Actions</th>
                </tr>
              </thead>

              <tbody className="divide-y divide-slate-100">
                {filtered.map((s, i) => {
                  const isActive  = !s.date_left;
                  const hasSalary = Number(s.basic_salary) > 0;
                  const ps        = payStatusMap[s.id];

                  return (
                    <tr key={s.id} className="hover:bg-slate-50/60 transition-colors">

                      {/* # */}
                      <td className="px-4 py-3 text-xs text-slate-400 tabular-nums">{i + 1}</td>

                      {/* Name */}
                      <td className="px-4 py-3">
                        <div className="flex items-center gap-2.5 min-w-0">
                          
                          <div className="min-w-0">
                            <p className="font-medium text-slate-800 truncate">{s.name}</p>
                            {s.edu_qualification && (
                              <p className="text-xs text-slate-400 truncate">{s.edu_qualification}</p>
                            )}
                          </div>
                        </div>
                      </td>

                      {/* Mobile */}
                      <td className="px-4 py-3 text-slate-600 tabular-nums whitespace-nowrap">
                        {s.mobile
                          ? <a href={`tel:${s.mobile}`} className="hover:text-teal-600 transition-colors">{s.mobile}</a>
                          : <span className="text-slate-300">—</span>}
                      </td>

                      {/* Designation */}
                      <td className="px-4 py-3 text-slate-700 whitespace-nowrap">
                        {s.designation || <span className="text-slate-300">—</span>}
                      </td>

                      {/* Department */}
                      <td className="px-4 py-3">
                        {s.department
                          ? <span className="inline-flex items-center px-2 py-0.5 rounded-md text-xs font-medium bg-slate-100 text-slate-600">{s.department}</span>
                          : <span className="text-slate-300">—</span>}
                      </td>

                      {/* Joined */}
                      <td className="px-4 py-3 text-slate-500 whitespace-nowrap tabular-nums">
                        {s.date_joined
                          ? new Date(s.date_joined).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' })
                          : <span className="text-slate-300">—</span>}
                      </td>

                      {/* Salary */}
                      <td className="px-4 py-3 text-right whitespace-nowrap">
                        {s.total_salary
                          ? (
                            <div>
                              <p className="font-medium text-slate-800 tabular-nums">
                                ₹{Number(s.total_salary).toLocaleString('en-IN')}
                              </p>
                              <p className="text-xs text-slate-400 tabular-nums">
                                ₹{Number(s.basic_salary).toLocaleString('en-IN')} + ₹{Number(s.ta).toLocaleString('en-IN')} TA
                              </p>
                            </div>
                          )
                          : <span className="text-slate-300">—</span>}
                      </td>

                      <td className="px-4 py-3">
                        <div className="flex flex-col gap-1 ">
                          

                          {/* Salary payment badge — only for active staff with salary */}
                          {isActive && hasSalary && (
                            ps?.isFullyPaid ? (
                              <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-xs font-bold bg-teal-50 text-teal-700">
                               Paid
                              </span>
                            ) : ps?.isPartiallyPaid ? (
                              <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-xs font-bold bg-blue-50 text-blue-600">
                                <span className="w-1.5 h-1.5 rounded-full bg-blue-400 inline-block" />
                                Partial
                              </span>
                            ) : (
                              <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-xs font-bold bg-amber-50 text-amber-600">
                                <span className="w-1.5 h-1.5 rounded-full bg-amber-400 inline-block" />
                                Pending
                              </span>
                            )
                          )}
                        </div>
                      </td>

                      {/* Actions */}
                      <td className="px-4 py-3">
                        <div className="flex items-center justify-center gap-0.5">
                          <button
                            onClick={() => setViewingStaff(s)}
                            title="View"
                            className="p-1.5 rounded-md text-slate-50 hover:text-white bg-teal-600 hover:bg-teal-700 transition-colors"
                          >
                            <Eye className="w-3.5 h-3.5" />
                          </button>
                          <button
                            onClick={() => { setEditingStaff(s); setModalOpen(true); }}
                            title="Edit"
                            className="p-1.5 rounded-md text-slate-50 hover:text-white bg-blue-700 hover:bg-blue-800 transition-colors"
                          >
                            <Pencil className="w-3.5 h-3.5" />
                          </button>
                          {/* Pay button — only for active staff with salary */}
                          {isActive && hasSalary && (
                            <button
                              onClick={() => handleOpenPay(s)}
                              disabled={payHistoryLoading}
                              title={
                                ps?.isFullyPaid      ? 'Fully paid this month'
                                : ps?.isPartiallyPaid ? 'Partially paid — click to add more'
                                : 'Pay salary'
                              }
                              className={`p-1.5 rounded-md text-slate-50 hover:text-white transition-colors disabled:opacity-50
                                ${ps?.isFullyPaid
                                  ? 'bg-teal-600 hover:bg-teal-700'
                                  : ps?.isPartiallyPaid
                                    ? 'bg-blue-600 hover:bg-blue-700'
                                    : 'bg-rose-600 hover:bg-rose-700'
                                }`}
                            >
                              <Banknote className="w-3.5 h-3.5" />
                            </button>
                          )}
                          <button
                            onClick={() => setDeleteConfirm(s.id)}
                            title="Delete"
                            className="p-1.5 rounded-md text-slate-50 hover:text-white bg-red-700 hover:bg-red-800 transition-colors"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}

        {/* Table footer */}
        {!loading && filtered.length > 0 && (
          <div className="px-4 py-2.5 border-t border-slate-100 bg-slate-50 flex items-center justify-between">
            <p className="text-xs text-slate-400">
              Showing {filtered.length} of {staff.length} staff members
            </p>
            {search && (
              <button onClick={() => setSearch('')} className="text-xs text-teal-600 hover:text-teal-800 transition-colors">
                Clear filter
              </button>
            )}
          </div>
        )}
      </div>

      {/* ── Delete Dialog ── */}
      {deleteConfirm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/30 backdrop-blur-sm">
          <div className="bg-white rounded-xl shadow-xl border border-slate-200 p-6 w-full max-w-sm">
            <div className="flex items-start gap-3 mb-5">
              <div className="w-9 h-9 rounded-full bg-red-50 flex items-center justify-center shrink-0">
                <Trash2 className="w-4 h-4 text-red-500" />
              </div>
              <div>
                <h3 className="font-semibold text-slate-800 text-sm">Delete staff member?</h3>
                <p className="text-sm text-slate-500 mt-0.5">This action cannot be undone.</p>
              </div>
            </div>
            <div className="flex gap-2 justify-end">
              <button onClick={() => setDeleteConfirm(null)} className="h-9 px-4 text-sm text-slate-600 rounded-lg border border-slate-200 hover:bg-slate-50 transition-colors">
                Cancel
              </button>
              <button
                onClick={() => handleDelete(deleteConfirm)}
                disabled={deleting}
                className="h-9 px-4 text-sm font-medium bg-red-600 text-white rounded-lg hover:bg-red-700 disabled:opacity-60 transition-colors"
              >
                {deleting ? 'Deleting…' : 'Delete'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ── Staff Modals ── */}
      {modalOpen && (
        <StaffModal
          key={editingStaff?.id ?? 'new'}
          staff={editingStaff}
          onClose={() => { setModalOpen(false); setEditingStaff(null); }}
          onSaved={fetchStaff}
        />
      )}
      {viewingStaff && (
        <StaffDetailDrawer
          staff={viewingStaff}
          onClose={() => setViewingStaff(null)}
          onEdit={s => { setViewingStaff(null); setEditingStaff(s); setModalOpen(true); }}
        />
      )}

      {/* ── Pay Salary Modal ── */}
      {payTarget && (
        <PaySalaryModal
          staff={payTarget}
          paidMonths={staffPayHistory}
          onClose={() => { setPayTarget(null); setStaffPayHistory([]); }}
          onSuccess={handlePaySuccess}
        />
      )}

      {/* ── Pay Toast ── */}
      {payToast && (
        <div className="fixed bottom-6 right-6 z-50 flex items-center gap-3 px-4 py-3 rounded-xl shadow-lg text-sm font-medium border bg-teal-50 border-teal-200 text-teal-800">
          <CheckCircle2 className="w-4 h-4 text-teal-600 shrink-0" />
          <span>{payToast}</span>
          <button onClick={() => setPayToast(null)} className="ml-2 opacity-60 hover:opacity-100">
            <X className="w-3.5 h-3.5" />
          </button>
        </div>
      )}
    </div>
  );
}