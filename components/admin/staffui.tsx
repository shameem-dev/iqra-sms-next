'use client';

import { useEffect, useState, useCallback } from 'react';

import {
  Plus, Search, Pencil, Trash2, Eye, Users,
  ChevronUp, ChevronDown, AlertCircle, X, RefreshCw
} from 'lucide-react';
import { Staff } from '@/type/staff';
import { deleteStaff, getAllStaff } from '@/utils/supabase/staff-actions';
import { StaffModal } from './StaffModal';
import { StaffDetailDrawer } from './Staffdetaildrawer';

type SortKey = 'name' | 'department' | 'designation' | 'date_joined' | 'total_salary';
type SortDir = 'asc' | 'desc';

export default function StaffUI() {
  const [staff, setStaff] = useState<Staff[]>([]);
  const [filtered, setFiltered] = useState<Staff[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [search, setSearch] = useState('');
  const [sortKey, setSortKey] = useState<SortKey>('name');
  const [sortDir, setSortDir] = useState<SortDir>('asc');
  const [modalOpen, setModalOpen] = useState(false);
  const [editingStaff, setEditingStaff] = useState<Staff | null>(null);
  const [viewingStaff, setViewingStaff] = useState<Staff | null>(null);
  const [deleteConfirm, setDeleteConfirm] = useState<string | null>(null);
  const [deleting, setDeleting] = useState(false);

  const fetchStaff = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      const data = await getAllStaff();
      setStaff(data);
      setFiltered(data);
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Failed to load staff data');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { fetchStaff(); }, [fetchStaff]);

  useEffect(() => {
    const q = search.toLowerCase();
    const result = staff.filter(s =>
      s.name.toLowerCase().includes(q) ||
      (s.department || '').toLowerCase().includes(q) ||
      (s.designation || '').toLowerCase().includes(q) ||
      (s.mobile || '').includes(q)
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

  const SortIcon = ({ col }: { col: SortKey }) => (
    sortKey === col
      ? sortDir === 'asc' ? <ChevronUp className="w-3 h-3" /> : <ChevronDown className="w-3 h-3" />
      : <ChevronUp className="w-3 h-3 opacity-20" />
  );

  const ThCell = ({ col, label }: { col: SortKey; label: string }) => (
    <th
      className="px-4 py-3 text-left text-xs font-semibold text-slate-500 uppercase tracking-wider cursor-pointer hover:text-teal-700 select-none whitespace-nowrap"
      onClick={() => handleSort(col)}
    >
      <span className="flex items-center gap-1">{label}<SortIcon col={col} /></span>
    </th>
  );

  return (
    // No min-h-screen, no page header — just the section content
    <div className="w-full">

      {/* Toolbar: search + actions */}
      <div className="flex items-center justify-between gap-4 mb-5">
        <div className="flex items-center gap-3 flex-1">
          <div className="relative flex-1 max-w-md">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
            <input
              type="text"
              placeholder="Search by name, department, designation…"
              value={search}
              onChange={e => setSearch(e.target.value)}
              className="w-full pl-9 pr-4 py-2.5 text-sm bg-white border border-slate-200 rounded-xl shadow-sm focus:outline-none focus:ring-2 focus:ring-teal-500 focus:border-transparent"
            />
            {search && (
              <button onClick={() => setSearch('')} className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600">
                <X className="w-3.5 h-3.5" />
              </button>
            )}
          </div>
          <span className="text-sm text-slate-400 whitespace-nowrap">
            {filtered.length} result{filtered.length !== 1 ? 's' : ''}
          </span>
        </div>

        <div className="flex items-center gap-2 shrink-0">
          <button
            onClick={fetchStaff}
            className="p-2 rounded-lg text-slate-400 hover:text-teal-600 hover:bg-teal-50 transition-colors"
            title="Refresh"
          >
            <RefreshCw className="w-4 h-4" />
          </button>
          <button
            onClick={() => { setEditingStaff(null); setModalOpen(true); }}
            className="flex items-center gap-2 px-4 py-2 bg-teal-600 text-white text-sm font-semibold rounded-lg shadow hover:bg-teal-700 transition-colors"
          >
            <Plus className="w-4 h-4" /> Add Staff
          </button>
        </div>
      </div>

      {/* Error Banner */}
      {error && (
        <div className="mb-4 flex items-center gap-3 p-4 bg-red-50 border border-red-200 rounded-xl text-red-700 text-sm">
          <AlertCircle className="w-4 h-4 shrink-0" />
          <span className="flex-1">{error}</span>
          <button onClick={() => setError(null)}><X className="w-4 h-4" /></button>
        </div>
      )}

      {/* Table Card — w-full, overflow-x-auto handles the scroll */}
      <div className="bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden w-full">
        {loading ? (
          <div className="flex items-center justify-center py-24">
            <div className="flex flex-col items-center gap-3">
              <div className="w-8 h-8 border-2 border-teal-600 border-t-transparent rounded-full animate-spin" />
              <p className="text-sm text-slate-400">Loading staff data…</p>
            </div>
          </div>
        ) : filtered.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-24 gap-3">
            <Users className="w-12 h-12 text-slate-200" />
            <p className="text-slate-400 text-sm">
              {search ? 'No staff match your search.' : 'No staff added yet.'}
            </p>
            {!search && (
              <button
                onClick={() => { setEditingStaff(null); setModalOpen(true); }}
                className="mt-1 px-4 py-2 bg-teal-600 text-white text-sm rounded-lg hover:bg-teal-700"
              >
                Add First Staff Member
              </button>
            )}
          </div>
        ) : (
          // Scrollable table wrapper — fills the card width
          <div className="overflow-x-auto w-full">
            <table className="w-full text-sm min-w-[900px]">
              <thead className="bg-slate-50 border-b border-slate-200">
                <tr>
                  <th className="px-4 py-3 text-left text-xs font-semibold text-slate-500 uppercase tracking-wider w-8">#</th>
                  <ThCell col="name" label="Name" />
                  <th className="px-4 py-3 text-left text-xs font-semibold text-slate-500 uppercase tracking-wider whitespace-nowrap">Mobile</th>
                  <ThCell col="designation" label="Designation" />
                  <ThCell col="department" label="Department" />
                  <ThCell col="date_joined" label="Date Joined" />
                  <th className="px-4 py-3 text-left text-xs font-semibold text-slate-500 uppercase tracking-wider">Education</th>
                  <ThCell col="total_salary" label="Total Salary" />
                  <th className="px-4 py-3 text-left text-xs font-semibold text-slate-500 uppercase tracking-wider">Medical</th>
                  <th className="px-4 py-3 text-left text-xs font-semibold text-slate-500 uppercase tracking-wider">Status</th>
                  <th className="px-4 py-3 text-center text-xs font-semibold text-slate-500 uppercase tracking-wider w-24">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {filtered.map((s, i) => (
                  <tr key={s.id} className="hover:bg-slate-50 transition-colors">
                    <td className="px-4 py-3 text-slate-400 text-xs">{i + 1}</td>
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-2.5">
                        <div className="w-8 h-8 rounded-full bg-teal-100 flex items-center justify-center text-teal-700 font-bold text-xs shrink-0">
                          {s.name.split(' ').map(n => n[0]).join('').slice(0, 2).toUpperCase()}
                        </div>
                        <div>
                          <div className="font-semibold text-slate-800 whitespace-nowrap">{s.name}</div>
                          {s.address && <div className="text-xs text-slate-400 truncate max-w-[140px]">{s.address}</div>}
                        </div>
                      </div>
                    </td>
                    <td className="px-4 py-3 text-slate-600 whitespace-nowrap">{s.mobile || '—'}</td>
                    <td className="px-4 py-3 text-slate-700 whitespace-nowrap">{s.designation || '—'}</td>
                    <td className="px-4 py-3">
                      {s.department ? (
                        <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-blue-50 text-blue-700 whitespace-nowrap">
                          {s.department}
                        </span>
                      ) : '—'}
                    </td>
                    <td className="px-4 py-3 text-slate-600 whitespace-nowrap">
                      {s.date_joined
                        ? new Date(s.date_joined).toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' })
                        : '—'}
                    </td>
                    <td className="px-4 py-3 text-slate-600 text-xs">{s.edu_qualification || '—'}</td>
                    <td className="px-4 py-3 whitespace-nowrap">
                      <div className="font-semibold text-slate-800">
                        {s.total_salary ? `AED ${Number(s.total_salary).toLocaleString()}` : '—'}
                      </div>
                      {s.total_salary > 0 && (
                        <div className="text-xs text-slate-400">{s.basic_salary} + {s.ta} TA</div>
                      )}
                    </td>
                    <td className="px-4 py-3 text-xs whitespace-nowrap">
                      <div className="text-green-700">Used: {s.medical_used}</div>
                      <div className="text-slate-500">Rem: {s.medical_remaining}</div>
                    </td>
                    <td className="px-4 py-3">
                      {s.date_left ? (
                        <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-slate-100 text-slate-500">Left</span>
                      ) : (
                        <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-emerald-50 text-emerald-700">Active</span>
                      )}
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex items-center justify-center gap-1">
                        <button
                          onClick={() => setViewingStaff(s)}
                          className="p-1.5 rounded-lg text-slate-400 hover:text-teal-600 hover:bg-teal-50 transition-colors"
                          title="View details"
                        >
                          <Eye className="w-3.5 h-3.5" />
                        </button>
                        <button
                          onClick={() => { setEditingStaff(s); setModalOpen(true); }}
                          className="p-1.5 rounded-lg text-slate-400 hover:text-blue-600 hover:bg-blue-50 transition-colors"
                          title="Edit"
                        >
                          <Pencil className="w-3.5 h-3.5" />
                        </button>
                        <button
                          onClick={() => setDeleteConfirm(s.id)}
                          className="p-1.5 rounded-lg text-slate-400 hover:text-red-600 hover:bg-red-50 transition-colors"
                          title="Delete"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Delete Confirm Dialog */}
      {deleteConfirm && (
        <div className="fixed inset-0 bg-black/40 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl shadow-2xl p-6 max-w-sm w-full">
            <div className="flex items-center gap-3 mb-4">
              <div className="w-10 h-10 rounded-full bg-red-100 flex items-center justify-center">
                <AlertCircle className="w-5 h-5 text-red-600" />
              </div>
              <div>
                <h3 className="font-bold text-slate-800">Delete Staff Member?</h3>
                <p className="text-sm text-slate-500">This action cannot be undone.</p>
              </div>
            </div>
            <div className="flex gap-3 justify-end">
              <button
                onClick={() => setDeleteConfirm(null)}
                className="px-4 py-2 text-sm text-slate-600 hover:bg-slate-100 rounded-lg transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={() => handleDelete(deleteConfirm)}
                disabled={deleting}
                className="px-4 py-2 text-sm bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors disabled:opacity-60"
              >
                {deleting ? 'Deleting…' : 'Delete'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Add/Edit Modal */}
      {modalOpen && (
        <StaffModal
          staff={editingStaff}
          onClose={() => { setModalOpen(false); setEditingStaff(null); }}
          onSaved={fetchStaff}
        />
      )}

      {/* Detail Drawer */}
      {viewingStaff && (
        <StaffDetailDrawer
          staff={viewingStaff}
          onClose={() => setViewingStaff(null)}
          onEdit={(s) => { setViewingStaff(null); setEditingStaff(s); setModalOpen(true); }}
        />
      )}
    </div>
  );
}