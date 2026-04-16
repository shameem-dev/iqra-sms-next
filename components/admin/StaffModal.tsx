'use client';

import { useState, useEffect } from 'react';

import { X, Plus, Trash2, Save, Loader2 } from 'lucide-react';
import { CERTIFICATE_OPTIONS, DEPARTMENTS, DESIGNATIONS, Staff, StaffFormData, StaffFormData } from '@/type/staff';
import { createStaff, updateStaff } from '@/utils/actions/staff-actions';

interface Props {
  staff: Staff | null;
  onClose: () => void;
  onSaved: () => void;
}

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
    annual_used: 0, annual_remaining: 30,
    casual_used: 0, casual_remaining: 12,
    commuted_used: 0, commuted_remaining: 15,
    sick_used: 0, sick_remaining: 15,
    other_used: 0, other_remaining: 0,
  },
};

export function StaffModal({ staff, onClose, onSaved }: Props) {
  const [form, setForm] = useState<StaffFormData>(EMPTY_FORM);
  const [activeTab, setActiveTab] = useState(0);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (staff) {
      const outsideTrainings = (staff.trainings || []).filter(t => t.source === 'outside').map(t => t.training_name);
      const iqrahTrainings = (staff.trainings || []).filter(t => t.source === 'iqrah').map(t => t.training_name);
      const projects = (staff.projects || []).map(p => p.project_name);

      const leaveMap: Record<string, number> = {};
      (staff.leaves || []).forEach(l => {
        leaveMap[`${l.leave_type}_used`] = l.days_used;
        leaveMap[`${l.leave_type}_remaining`] = l.days_remaining;
      });

      setForm({
        name: staff.name,
        address: staff.address || '',
        mobile: staff.mobile || '',
        designation: staff.designation || '',
        department: staff.department || '',
        date_of_birth: staff.date_of_birth || '',
        date_joined: staff.date_joined || '',
        date_left: staff.date_left || '',
        basic_salary: staff.basic_salary,
        ta: staff.ta,
        medical_used: staff.medical_used,
        medical_remaining: staff.medical_remaining,
        edu_qualification: staff.edu_qualification || '',
        certificate_option: staff.certificate_option || '',
        remarks: staff.remarks || '',
        trainings_outside: outsideTrainings.length ? outsideTrainings : [''],
        trainings_iqrah: iqrahTrainings.length ? iqrahTrainings : [''],
        projects: projects.length ? projects : [''],
        leaves: {
          annual_used: leaveMap.annual_used ?? 0,
          annual_remaining: leaveMap.annual_remaining ?? 30,
          casual_used: leaveMap.casual_used ?? 0,
          casual_remaining: leaveMap.casual_remaining ?? 12,
          commuted_used: leaveMap.commuted_used ?? 0,
          commuted_remaining: leaveMap.commuted_remaining ?? 15,
          sick_used: leaveMap.sick_used ?? 0,
          sick_remaining: leaveMap.sick_remaining ?? 15,
          other_used: leaveMap.other_used ?? 0,
          other_remaining: leaveMap.other_remaining ?? 0,
        },
      });
    }
  }, [staff]);

  const set = (key: keyof StaffFormData, val: unknown) =>
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
      else await createStaff(form);
      onSaved(); onClose();
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Save failed');
    } finally { setSaving(false); }
  };

  const tabs = ['Personal', 'Financial', 'Education', 'Trainings', 'Leaves', 'Remarks'];

  const InputField = ({ label, name, type = 'text', required = false }: { label: string; name: keyof StaffFormData; type?: string; required?: boolean }) => (
    <div>
      <label className="block text-xs font-medium text-slate-600 mb-1">{label}{required && <span className="text-red-500 ml-0.5">*</span>}</label>
      <input
        type={type}
        value={String(form[name] ?? '')}
        onChange={e => set(name, type === 'number' ? Number(e.target.value) : e.target.value)}
        className="w-full px-3 py-2 text-sm border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-teal-500"
      />
    </div>
  );

  const SelectField = ({ label, name, options }: { label: string; name: keyof StaffFormData; options: readonly string[] }) => (
    <div>
      <label className="block text-xs font-medium text-slate-600 mb-1">{label}</label>
      <select
        value={String(form[name] ?? '')}
        onChange={e => set(name, e.target.value)}
        className="w-full px-3 py-2 text-sm border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-teal-500 bg-white"
      >
        <option value="">Select…</option>
        {options.map(o => <option key={o} value={o}>{o}</option>)}
      </select>
    </div>
  );

  return (
    <div className="fixed inset-0 bg-black/40 backdrop-blur-sm z-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-2xl max-h-[90vh] flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-100">
          <h2 className="text-base font-bold text-slate-800">
            {staff ? `Edit: ${staff.name}` : 'Add New Staff Member'}
          </h2>
          <button onClick={onClose} className="p-1.5 rounded-lg hover:bg-slate-100 text-slate-400 hover:text-slate-600 transition-colors">
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Tabs */}
        <div className="flex gap-1 px-6 pt-4 border-b border-slate-100 overflow-x-auto">
          {tabs.map((tab, i) => (
            <button
              key={tab}
              onClick={() => setActiveTab(i)}
              className={`pb-2.5 px-3 text-sm font-medium border-b-2 whitespace-nowrap transition-colors ${activeTab === i
                ? 'border-teal-600 text-teal-700'
                : 'border-transparent text-slate-500 hover:text-slate-700'
              }`}
            >
              {tab}
            </button>
          ))}
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto px-6 py-5">
          {error && (
            <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-lg text-red-700 text-sm flex items-center gap-2">
              <span>⚠️</span>{error}
            </div>
          )}

          {/* TAB 0: Personal */}
          {activeTab === 0 && (
            <div className="grid grid-cols-2 gap-4">
              <div className="col-span-2"><InputField label="Full Name" name="name" required /></div>
              <div className="col-span-2"><InputField label="Address" name="address" /></div>
              <InputField label="Mobile Number" name="mobile" />
              <SelectField label="Designation" name="designation" options={DESIGNATIONS} />
              <SelectField label="Department" name="department" options={DEPARTMENTS} />
              <InputField label="Date of Birth" name="date_of_birth" type="date" />
              <InputField label="Date Joined at Iqrah" name="date_joined" type="date" />
              <InputField label="Date Left" name="date_left" type="date" />
            </div>
          )}

          {/* TAB 1: Financial */}
          {activeTab === 1 && (
            <div className="grid grid-cols-2 gap-4">
              <InputField label="Basic Salary (AED)" name="basic_salary" type="number" />
              <InputField label="TA / Transport Allowance (AED)" name="ta" type="number" />
              <div className="col-span-2 p-4 bg-teal-50 rounded-xl">
                <div className="text-xs text-teal-600 font-medium mb-1">Total Salary</div>
                <div className="text-2xl font-bold text-teal-800">
                  AED {(Number(form.basic_salary) + Number(form.ta)).toLocaleString()}
                </div>
                <div className="text-xs text-teal-600 mt-1">
                  Basic: {form.basic_salary} + TA: {form.ta}
                </div>
              </div>
              <div className="col-span-2">
                <div className="text-sm font-semibold text-slate-700 mb-3">Medical Reimbursement</div>
                <div className="grid grid-cols-2 gap-4">
                  <InputField label="Used (AED)" name="medical_used" type="number" />
                  <InputField label="Remaining (AED)" name="medical_remaining" type="number" />
                </div>
              </div>
            </div>
          )}

          {/* TAB 2: Education */}
          {activeTab === 2 && (
            <div className="grid grid-cols-2 gap-4">
              <div className="col-span-2">
                <InputField label="Educational Qualification" name="edu_qualification" />
              </div>
              <div className="col-span-2">
                <SelectField label="Certificate Option" name="certificate_option" options={CERTIFICATE_OPTIONS} />
              </div>
            </div>
          )}

          {/* TAB 3: Trainings & Projects */}
          {activeTab === 3 && (
            <div className="space-y-6">
              {/* Trainings Outside */}
              <div>
                <div className="flex items-center justify-between mb-2">
                  <label className="text-sm font-semibold text-slate-700">Trainings Achieved (Outside Iqrah)</label>
                  <button onClick={() => addListItem('trainings_outside')} className="flex items-center gap-1 text-xs text-teal-600 hover:text-teal-800">
                    <Plus className="w-3 h-3" /> Add
                  </button>
                </div>
                <div className="space-y-2">
                  {form.trainings_outside.map((t, i) => (
                    <div key={i} className="flex gap-2">
                      <input value={t} onChange={e => updateListItem('trainings_outside', i, e.target.value)} placeholder="Training name…"
                        className="flex-1 px-3 py-2 text-sm border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-teal-500" />
                      {form.trainings_outside.length > 1 && (
                        <button onClick={() => removeListItem('trainings_outside', i)} className="p-2 text-red-400 hover:text-red-600">
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      )}
                    </div>
                  ))}
                </div>
              </div>

              {/* Trainings Through Iqrah */}
              <div>
                <div className="flex items-center justify-between mb-2">
                  <label className="text-sm font-semibold text-slate-700">Trainings (Through Iqrah)</label>
                  <button onClick={() => addListItem('trainings_iqrah')} className="flex items-center gap-1 text-xs text-teal-600 hover:text-teal-800">
                    <Plus className="w-3 h-3" /> Add
                  </button>
                </div>
                <div className="space-y-2">
                  {form.trainings_iqrah.map((t, i) => (
                    <div key={i} className="flex gap-2">
                      <input value={t} onChange={e => updateListItem('trainings_iqrah', i, e.target.value)} placeholder="Training name…"
                        className="flex-1 px-3 py-2 text-sm border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-teal-500" />
                      {form.trainings_iqrah.length > 1 && (
                        <button onClick={() => removeListItem('trainings_iqrah', i)} className="p-2 text-red-400 hover:text-red-600">
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      )}
                    </div>
                  ))}
                </div>
              </div>

              {/* Projects */}
              <div>
                <div className="flex items-center justify-between mb-2">
                  <label className="text-sm font-semibold text-slate-700">Projects Done</label>
                  <button onClick={() => addListItem('projects')} className="flex items-center gap-1 text-xs text-teal-600 hover:text-teal-800">
                    <Plus className="w-3 h-3" /> Add
                  </button>
                </div>
                <div className="space-y-2">
                  {form.projects.map((p, i) => (
                    <div key={i} className="flex gap-2">
                      <input value={p} onChange={e => updateListItem('projects', i, e.target.value)} placeholder="Project name…"
                        className="flex-1 px-3 py-2 text-sm border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-teal-500" />
                      {form.projects.length > 1 && (
                        <button onClick={() => removeListItem('projects', i)} className="p-2 text-red-400 hover:text-red-600">
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}

          {/* TAB 4: Leaves */}
          {activeTab === 4 && (
            <div className="space-y-4">
              <p className="text-xs text-slate-500 mb-2">Enter leave days for the current year ({new Date().getFullYear()})</p>
              {([
                ['annual', 'Annual Leave'],
                ['casual', 'Casual Leave'],
                ['commuted', 'Commuted Leave'],
                ['sick', 'Sick Leave'],
                ['other', 'Other Leave'],
              ] as [string, string][]).map(([type, label]) => (
                <div key={type} className="p-4 border border-slate-200 rounded-xl">
                  <div className="text-sm font-semibold text-slate-700 mb-3">{label}</div>
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="text-xs text-slate-500 mb-1 block">Days Used</label>
                      <input type="number" min="0"
                        value={form.leaves[`${type}_used` as keyof typeof form.leaves]}
                        onChange={e => setLeave(`${type}_used` as keyof StaffFormData['leaves'], Number(e.target.value))}
                        className="w-full px-3 py-2 text-sm border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-teal-500"
                      />
                    </div>
                    <div>
                      <label className="text-xs text-slate-500 mb-1 block">Days Remaining</label>
                      <input type="number" min="0"
                        value={form.leaves[`${type}_remaining` as keyof typeof form.leaves]}
                        onChange={e => setLeave(`${type}_remaining` as keyof StaffFormData['leaves'], Number(e.target.value))}
                        className="w-full px-3 py-2 text-sm border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-teal-500"
                      />
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}

          {/* TAB 5: Remarks */}
          {activeTab === 5 && (
            <div>
              <label className="block text-xs font-medium text-slate-600 mb-1">Remarks</label>
              <textarea
                value={form.remarks}
                onChange={e => set('remarks', e.target.value)}
                rows={6}
                placeholder="Add any notes or remarks about this staff member…"
                className="w-full px-3 py-2 text-sm border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-teal-500 resize-none"
              />
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="flex items-center justify-between px-6 py-4 border-t border-slate-100 bg-slate-50 rounded-b-2xl">
          <div className="flex gap-1">
            {tabs.map((_, i) => (
              <button
                key={i}
                onClick={() => setActiveTab(i)}
                className={`w-2 h-2 rounded-full transition-colors ${activeTab === i ? 'bg-teal-600' : 'bg-slate-300'}`}
              />
            ))}
          </div>
          <div className="flex gap-3">
            <button onClick={onClose} className="px-4 py-2 text-sm text-slate-600 hover:bg-slate-100 rounded-lg transition-colors">
              Cancel
            </button>
            {activeTab < tabs.length - 1 && (
              <button onClick={() => setActiveTab(t => t + 1)} className="px-4 py-2 text-sm text-teal-700 bg-teal-50 hover:bg-teal-100 rounded-lg transition-colors">
                Next →
              </button>
            )}
            <button
              onClick={handleSave}
              disabled={saving}
              className="flex items-center gap-2 px-5 py-2 text-sm bg-teal-600 text-white rounded-lg hover:bg-teal-700 disabled:opacity-60 transition-colors font-semibold"
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