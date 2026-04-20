'use client';

import { useState, useEffect } from 'react';
import { X, Plus, Trash2, Save, Loader2 } from 'lucide-react';
import { CERTIFICATE_OPTIONS, DEPARTMENTS, DESIGNATIONS, Staff, StaffFormData } from '@/type/staff';
import { createStaff, updateStaff } from '@/utils/actions/staff-actions';

interface Props {
  staff: Staff | null;
  onClose: () => void;
  onSaved: () => void;
}

// ── Shared input classes ──────────────────────────────────────────────────────
const inputCls = 
  'w-full px-3 py-2 text-sm text-slate-800 bg-white border border-slate-200 rounded-lg ' +
  'focus:outline-none focus:ring-2 focus:ring-teal-500 focus:border-transparent ' +
  'placeholder:text-slate-400';

const selectCls =
  'w-full px-3 py-2 text-sm text-slate-800 bg-white border border-slate-200 rounded-lg ' +
  'focus:outline-none focus:ring-2 focus:ring-teal-500 focus:border-transparent';

// ── Field sub-components (defined OUTSIDE parent so they never remount) ───────
interface InputFieldProps {
  label: string;
  value: string | number;
  onChange: (val: string | number) => void;
  type?: string;
  required?: boolean;
  placeholder?: string;
}

function InputField({ label, value, onChange, type = 'text', required = false, placeholder }: InputFieldProps) {
  return (
    <div>
      <label className="block text-xs font-medium text-slate-600 mb-1">
        {label}{required && <span className="text-red-500 ml-0.5">*</span>}
      </label>
      <input
        type={type}
        value={value}
        placeholder={placeholder}
        onChange={e => onChange(type === 'number' ? Number(e.target.value) : e.target.value)}
        className={inputCls}
      />
    </div>
  );
}

interface SelectFieldProps {
  label: string;
  value: string;
  onChange: (val: string) => void;
  options: readonly string[];
}

function SelectField({ label, value, onChange, options }: SelectFieldProps) {
  return (
    <div>
      <label className="block text-xs font-medium text-slate-600 mb-1">{label}</label>
      <select
        value={value}
        onChange={e => onChange(e.target.value)}
        className={selectCls}
      >
        <option value="">Select…</option>
        {options.map(o => <option key={o} value={o}>{o}</option>)}
      </select>
    </div>
  );
}

// ── Constants ─────────────────────────────────────────────────────────────────
const EMPTY_FORM: StaffFormData = {
  name: '',
  address: '',
  mobile: '',
  designation: '',
  department: '',
  date_of_birth: '',
  date_joined: '',
  date_left: '',
  basic_salary: 0,
  ta: 0,
  medical_used: 0,
  medical_remaining: 0,
  edu_qualification: '',
  certificate_option: '',
  remarks: '',
  trainings_outside: [''],
  trainings_iqrah: [''],
  projects: [''],
  leaves: {
    annual_used: 0,    annual_remaining: 30,
    casual_used: 0,    casual_remaining: 12,
    commuted_used: 0,  commuted_remaining: 15,
    sick_used: 0,      sick_remaining: 15,
    other_used: 0,     other_remaining: 0,
  },
};

const LEAVE_TYPES: [string, string][] = [
  ['annual',   'Annual Leave'],
  ['casual',   'Casual Leave'],
  ['commuted', 'Commuted Leave'],
  ['sick',     'Sick Leave'],
  ['other',    'Other Leave'],
];

const TABS = ['Personal', 'Financial', 'Education', 'Trainings', 'Leaves', 'Remarks'];

// ── Main component ────────────────────────────────────────────────────────────
export function StaffModal({ staff, onClose, onSaved }: Props) {
  const [form, setForm] = useState<StaffFormData>(EMPTY_FORM);
  const [activeTab, setActiveTab] = useState(0);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!staff) { setForm(EMPTY_FORM); return; }

    const outsideTrainings = (staff.trainings || []).filter(t => t.source === 'outside').map(t => t.training_name);
    const iqrahTrainings   = (staff.trainings || []).filter(t => t.source === 'iqrah').map(t => t.training_name);
    const projects         = (staff.projects  || []).map(p => p.project_name);
    const leaveMap: Record<string, number> = {};
    (staff.leaves || []).forEach(l => {
      leaveMap[`${l.leave_type}_used`]      = l.days_used;
      leaveMap[`${l.leave_type}_remaining`] = l.days_remaining;
    });

    setForm({
      name:               staff.name,
      address:            staff.address            || '',
      mobile:             staff.mobile             || '',
      designation:        staff.designation        || '',
      department:         staff.department         || '',
      date_of_birth:      staff.date_of_birth      || '',
      date_joined:        staff.date_joined        || '',
      date_left:          staff.date_left          || '',
      basic_salary:       staff.basic_salary,
      ta:                 staff.ta,
      medical_used:       staff.medical_used,
      medical_remaining:  staff.medical_remaining,
      edu_qualification:  staff.edu_qualification  || '',
      certificate_option: staff.certificate_option || '',
      remarks:            staff.remarks            || '',
      trainings_outside: outsideTrainings.length ? outsideTrainings : [''],
      trainings_iqrah:   iqrahTrainings.length   ? iqrahTrainings   : [''],
      projects:          projects.length          ? projects         : [''],
      leaves: {
        annual_used:       leaveMap.annual_used       ?? 0,
        annual_remaining:  leaveMap.annual_remaining  ?? 30,
        casual_used:       leaveMap.casual_used       ?? 0,
        casual_remaining:  leaveMap.casual_remaining  ?? 12,
        commuted_used:     leaveMap.commuted_used     ?? 0,
        commuted_remaining:leaveMap.commuted_remaining ?? 15,
        sick_used:         leaveMap.sick_used         ?? 0,
        sick_remaining:    leaveMap.sick_remaining    ?? 15,
        other_used:        leaveMap.other_used        ?? 0,
        other_remaining:   leaveMap.other_remaining   ?? 0,
      },
    });
  }, [staff]);

  // ── Helpers ────────────────────────────────────────────────────────────────
  const set = <K extends keyof StaffFormData>(key: K, val: StaffFormData[K]) =>
    setForm(f => ({ ...f, [key]: val }));

  const setLeave = (key: keyof StaffFormData['leaves'], val: number) =>
    setForm(f => ({ ...f, leaves: { ...f.leaves, [key]: val } }));

  const addListItem = (key: 'trainings_outside' | 'trainings_iqrah' | 'projects') =>
    setForm(f => ({ ...f, [key]: [...f[key], ''] }));

  const updateListItem = (key: 'trainings_outside' | 'trainings_iqrah' | 'projects', idx: number, val: string) =>
    setForm(f => ({ ...f, [key]: f[key].map((v, i) => i === idx ? val : v) }));

  const removeListItem = (key: 'trainings_outside' | 'trainings_iqrah' | 'projects', idx: number) =>
    setForm(f => ({ ...f, [key]: f[key].filter((_, i) => i !== idx) }));

  const handleSave = async () => {
    if (!form.name.trim()) { setError('Name is required'); return; }
    try {
      setSaving(true); setError(null);
      if (staff) await updateStaff(staff.id, form);
      else       await createStaff(form);
      onSaved(); onClose();
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Save failed');
    } finally { setSaving(false); }
  };

  // ── Render ─────────────────────────────────────────────────────────────────
  return (
    <div className="fixed inset-0 bg-black/40 backdrop-blur-sm z-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-2xl max-h-[90vh] flex flex-col">

        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-100 shrink-0">
          <h2 className="text-base font-semibold text-slate-800">
            {staff ? `Edit: ${staff.name}` : 'Add New Staff Member'}
          </h2>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg hover:bg-slate-100 text-slate-400 hover:text-slate-600 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Tabs */}
        <div className="flex gap-0 px-6 border-b border-slate-100 overflow-x-auto shrink-0">
          {TABS.map((tab, i) => (
            <button
              key={tab}
              onClick={() => setActiveTab(i)}
              className={`px-4 py-3 text-sm font-medium border-b-2 whitespace-nowrap transition-colors ${
                activeTab === i
                  ? 'border-teal-600 text-teal-700'
                  : 'border-transparent text-slate-500 hover:text-slate-700'
              }`}
            >
              {tab}
            </button>
          ))}
        </div>

        {/* Body */}
        <div className="flex-1 overflow-y-auto px-6 py-5">

          {error && (
            <div className="mb-4 flex items-center gap-2 p-3 bg-red-50 border border-red-200 rounded-lg text-red-700 text-sm">
              <span>⚠️</span>{error}
            </div>
          )}

          {/* ── Personal ── */}
          {activeTab === 0 && (
            <div className="grid grid-cols-2 gap-4">
              <div className="col-span-2">
                <InputField label="Full Name" value={form.name} onChange={v => set('name', v as string)} required />
              </div>
              <div className="col-span-2">
                <InputField label="Address" value={form.address} onChange={v => set('address', v as string)} />
              </div>
              <InputField label="Mobile Number" value={form.mobile} onChange={v => set('mobile', v as string)} />
              <SelectField label="Designation" value={form.designation} onChange={v => set('designation', v)} options={DESIGNATIONS} />
              <SelectField label="Department"  value={form.department}  onChange={v => set('department', v)}  options={DEPARTMENTS} />
              <InputField label="Date of Birth"        value={form.date_of_birth} onChange={v => set('date_of_birth', v as string)} type="date" />
              <InputField label="Date Joined at Iqrah" value={form.date_joined}   onChange={v => set('date_joined', v as string)}   type="date" />
              <div className="col-span-2">
                <InputField label="Date Left" value={form.date_left} onChange={v => set('date_left', v as string)} type="date" />
              </div>
            </div>
          )}

          {/* ── Financial ── */}
          {activeTab === 1 && (
            <div className="grid grid-cols-2 gap-4">
              <InputField label="Basic Salary (₹)" value={form.basic_salary} onChange={v => set('basic_salary', v as number)} type="number" />
              <InputField label="TA / Transport Allowance (₹)" value={form.ta} onChange={v => set('ta', v as number)} type="number" />

              <div className="col-span-2 p-4 bg-teal-50 rounded-xl">
                <div className="text-xs text-teal-600 font-medium mb-1">Total Salary</div>
                <div className="text-2xl font-bold text-teal-800">
                  ₹{(Number(form.basic_salary) + Number(form.ta)).toLocaleString('en-IN')}
                </div>
                <div className="text-xs text-teal-600 mt-1">
                  Basic: ₹{Number(form.basic_salary).toLocaleString('en-IN')} + TA: ₹{Number(form.ta).toLocaleString('en-IN')}
                </div>
              </div>

              <div className="col-span-2">
                <p className="text-sm font-semibold text-slate-700 mb-3">Medical Reimbursement</p>
                <div className="grid grid-cols-2 gap-4">
                  <InputField label="Used (₹)"      value={form.medical_used}      onChange={v => set('medical_used', v as number)}      type="number" />
                  <InputField label="Remaining (₹)" value={form.medical_remaining} onChange={v => set('medical_remaining', v as number)} type="number" />
                </div>
              </div>
            </div>
          )}

          {/* ── Education ── */}
          {activeTab === 2 && (
            <div className="grid grid-cols-2 gap-4">
              <div className="col-span-2">
                <InputField label="Educational Qualification" value={form.edu_qualification} onChange={v => set('edu_qualification', v as string)} />
              </div>
              <div className="col-span-2">
                <SelectField label="Certificate Option" value={form.certificate_option} onChange={v => set('certificate_option', v)} options={CERTIFICATE_OPTIONS} />
              </div>
            </div>
          )}

          {/* ── Trainings & Projects ── */}
          {activeTab === 3 && (
            <div className="space-y-6">
              {(
                [
                  ['trainings_outside', 'Trainings Achieved (Outside Iqrah)', 'Training name…'],
                  ['trainings_iqrah',   'Trainings (Through Iqrah)',           'Training name…'],
                  ['projects',          'Projects Done',                       'Project name…'],
                ] as [('trainings_outside' | 'trainings_iqrah' | 'projects'), string, string][]
              ).map(([key, heading, placeholder]) => (
                <div key={key}>
                  <div className="flex items-center justify-between mb-2">
                    <label className="text-sm font-semibold text-slate-700">{heading}</label>
                    <button
                      onClick={() => addListItem(key)}
                      className="flex items-center gap-1 text-xs text-teal-600 hover:text-teal-800 transition-colors"
                    >
                      <Plus className="w-3 h-3" /> Add
                    </button>
                  </div>
                  <div className="space-y-2">
                    {form[key].map((val, i) => (
                      <div key={i} className="flex gap-2">
                        <input
                          value={val}
                          placeholder={placeholder}
                          onChange={e => updateListItem(key, i, e.target.value)}
                          className={`flex-1 ${inputCls}`}
                        />
                        {form[key].length > 1 && (
                          <button
                            onClick={() => removeListItem(key, i)}
                            className="p-2 text-slate-400 hover:text-red-500 transition-colors"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        )}
                      </div>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          )}

          {/* ── Leaves ── */}
          {activeTab === 4 && (
            <div className="space-y-3">
              <p className="text-xs text-slate-400">Enter leave days for the current year ({new Date().getFullYear()})</p>
              {LEAVE_TYPES.map(([type, label]) => (
                <div key={type} className="p-4 border border-slate-200 rounded-xl">
                  <p className="text-sm font-semibold text-slate-700 mb-3">{label}</p>
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-xs text-slate-500 mb-1">Days Used</label>
                      <input
                        type="number" min="0"
                        value={form.leaves[`${type}_used` as keyof typeof form.leaves]}
                        onChange={e => setLeave(`${type}_used` as keyof StaffFormData['leaves'], Number(e.target.value))}
                        className={inputCls}
                      />
                    </div>
                    <div>
                      <label className="block text-xs text-slate-500 mb-1">Days Remaining</label>
                      <input
                        type="number" min="0"
                        value={form.leaves[`${type}_remaining` as keyof typeof form.leaves]}
                        onChange={e => setLeave(`${type}_remaining` as keyof StaffFormData['leaves'], Number(e.target.value))}
                        className={inputCls}
                      />
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}

          {/* ── Remarks ── */}
          {activeTab === 5 && (
            <div>
              <label className="block text-xs font-medium text-slate-600 mb-1">Remarks</label>
              <textarea
                value={form.remarks}
                onChange={e => set('remarks', e.target.value)}
                rows={6}
                placeholder="Add any notes or remarks about this staff member…"
                className={`${inputCls} resize-none`}
              />
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="flex items-center justify-between px-6 py-4 border-t border-slate-100 bg-slate-50 rounded-b-2xl shrink-0">
          <div className="flex gap-1.5">
            {TABS.map((_, i) => (
              <button
                key={i}
                onClick={() => setActiveTab(i)}
                className={`w-2 h-2 rounded-full transition-colors ${activeTab === i ? 'bg-teal-600' : 'bg-slate-300 hover:bg-slate-400'}`}
              />
            ))}
          </div>
          <div className="flex gap-2">
            <button
              onClick={onClose}
              className="h-9 px-4 text-sm text-slate-600 rounded-lg border border-slate-200 hover:bg-slate-100 transition-colors"
            >
              Cancel
            </button>
            {activeTab < TABS.length - 1 && (
              <button
                onClick={() => setActiveTab(t => t + 1)}
                className="h-9 px-4 text-sm text-teal-700 bg-teal-50 border border-teal-200 hover:bg-teal-100 rounded-lg transition-colors"
              >
                Next →
              </button>
            )}
            <button
              onClick={handleSave}
              disabled={saving}
              className="h-9 flex items-center gap-2 px-5 text-sm font-semibold bg-teal-600 text-white rounded-lg hover:bg-teal-700 disabled:opacity-60 transition-colors"
            >
              {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
              {saving ? 'Saving…' : 'Save Staff'}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}