'use client';

import { useState, useEffect } from 'react';
import { createBrowserClient } from '@supabase/ssr';
import { X, Plus, Trash2, Save, Loader2, KeyRound, ShieldCheck, CheckCircle2 } from 'lucide-react';
import { CERTIFICATE_OPTIONS, DEPARTMENTS, DESIGNATIONS, Staff, StaffFormData } from '@/type/staff';
import { createStaff, updateStaff } from '@/utils/actions/staff-actions';

interface Props {
  staff: Staff | null;
  onClose: () => void;
  onSaved: () => void;
}

const inputCls =
  'w-full px-3 py-2 text-sm text-slate-800 bg-white border border-slate-200 rounded-lg ' +
  'focus:outline-none focus:ring-2 focus:ring-teal-500 focus:border-transparent placeholder:text-slate-400';
const selectCls =
  'w-full px-3 py-2 text-sm text-slate-800 bg-white border border-slate-200 rounded-lg ' +
  'focus:outline-none focus:ring-2 focus:ring-teal-500 focus:border-transparent';

interface InputFieldProps {
  label: string; value: string | number;
  onChange: (val: string | number) => void;
  type?: string; required?: boolean; placeholder?: string;
}
function InputField({ label, value, onChange, type = 'text', required = false, placeholder }: InputFieldProps) {
  return (
    <div>
      <label className="block text-xs font-medium text-slate-600 mb-1">
        {label}{required && <span className="text-red-500 ml-0.5">*</span>}
      </label>
      <input type={type} value={value} placeholder={placeholder}
        onChange={e => onChange(type === 'number' ? Number(e.target.value) : e.target.value)}
        className={inputCls} />
    </div>
  );
}

interface SelectFieldProps {
  label: string; value: string;
  onChange: (val: string) => void; options: readonly string[];
}
function SelectField({ label, value, onChange, options }: SelectFieldProps) {
  return (
    <div>
      <label className="block text-xs font-medium text-slate-600 mb-1">{label}</label>
      <select value={value} onChange={e => onChange(e.target.value)} className={selectCls}>
        <option value="">Select…</option>
        {options.map(o => <option key={o} value={o}>{o}</option>)}
      </select>
    </div>
  );
}

const EMPTY_FORM: StaffFormData = {
  name: '', address: '', mobile: '', designation: '', department: '',
  date_of_birth: '', date_joined: '', date_left: '',
  basic_salary: 0, ta: 0, medical_used: 0, medical_remaining: 0,
  edu_qualification: '', certificate_option: '', remarks: '',
  trainings_outside: [''], trainings_iqrah: [''], projects: [''],
  leaves: {
    annual_used: 0, annual_remaining: 30, casual_used: 0, casual_remaining: 12,
    commuted_used: 0, commuted_remaining: 15, sick_used: 0, sick_remaining: 15,
    other_used: 0, other_remaining: 0,
  },
};

const LEAVE_TYPES: [string, string][] = [
  ['annual', 'Annual Leave'], ['casual', 'Casual Leave'],
  ['commuted', 'Commuted Leave'], ['sick', 'Sick Leave'], ['other', 'Other Leave'],
];

interface Subject { id: number; name: string; standard: string }

interface SubjectAssignment {
  standard: string        // which class
  subjectIds: number[]    // which subjects in that class
}

export function StaffModal({ staff, onClose, onSaved }: Props) {
  const supabase = createBrowserClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_DEFAULT_KEY!
  )

  const [form, setForm]           = useState<StaffFormData>(EMPTY_FORM);
  const [activeTab, setActiveTab] = useState(0);
  const [saving, setSaving]       = useState(false);
  const [error, setError]         = useState<string | null>(null);

  // ── Login tab state ───────────────────────────────────────────────────────
  const [loginEmail, setLoginEmail]       = useState('');
  const [loginPassword, setLoginPassword] = useState('');
  const [loginLoading, setLoginLoading]   = useState(false);
  const [loginSuccess, setLoginSuccess]   = useState('');
  const [loginError, setLoginError]       = useState('');

  // Class teacher assignment — ONE class for attendance
  const [classTeacherStandard, setClassTeacherStandard] = useState('');

  // Subject teacher assignment — multiple (class + subjects) pairs
  const [subjectAssignments, setSubjectAssignments] = useState<SubjectAssignment[]>([
    { standard: '', subjectIds: [] }
  ])

  // Subjects + standards from DB
  const [subjects, setSubjects]   = useState<Subject[]>([]);
  const [standards, setStandards] = useState<string[]>([]);

  // Existing assignments loaded from DB
  const [existingAssignments, setExistingAssignments] = useState<any[]>([]);

  const hasLogin    = !!staff?.auth_user_id;
  // Show Login tab only if designation is Teacher
  const isTeacher   = (staff?.designation || form.designation) === 'Teacher';
  const TABS        = isTeacher
    ? ['Personal', 'Financial', 'Education', 'Trainings', 'Leaves', 'Remarks', 'Login']
    : ['Personal', 'Financial', 'Education', 'Trainings', 'Leaves', 'Remarks'];

  // ── Load subjects ─────────────────────────────────────────────────────────
  useEffect(() => {
    ;(async () => {
      const { data } = await supabase
        .from('subjects').select('id, name, standard')
        .eq('is_active', true).order('standard')
      if (data) {
        setSubjects(data)
        setStandards([...new Set(data.map((s: Subject) => s.standard))])
      }
    })()
  }, [])

  // ── Load existing assignments when Login tab opens ────────────────────────
  useEffect(() => {
    if (!staff?.id || activeTab !== 6) return
    ;(async () => {
      const { data } = await supabase
        .from('teacher_assignments')
        .select('id, type, standard, subject_id, subjects(name)')
        .eq('staff_id', staff.id)

      if (data) {
        setExistingAssignments(data)

        // Pre-fill class teacher
        const classTa = data.find((d: any) => d.type === 'class_teacher')
        if (classTa) setClassTeacherStandard(classTa.standard)

        // Pre-fill subject assignments grouped by standard
        const subjectTa = data.filter((d: any) => d.type === 'subject_teacher')
        if (subjectTa.length > 0) {
          const grouped: Record<string, number[]> = {}
          subjectTa.forEach((d: any) => {
            if (!grouped[d.standard]) grouped[d.standard] = []
            grouped[d.standard].push(d.subject_id)
          })
          setSubjectAssignments(
            Object.entries(grouped).map(([standard, subjectIds]) => ({ standard, subjectIds }))
          )
        }
      }
    })()
  }, [staff, activeTab])

  // ── Reset login state when staff changes ──────────────────────────────────
  useEffect(() => {
    if (!staff) { setForm(EMPTY_FORM); return; }
    setLoginEmail(staff.email || '')
    setLoginPassword(''); setLoginSuccess(''); setLoginError('')
    setClassTeacherStandard('')
    setSubjectAssignments([{ standard: '', subjectIds: [] }])

    const outsideTrainings = (staff.trainings || []).filter(t => t.source === 'outside').map(t => t.training_name);
    const iqrahTrainings   = (staff.trainings || []).filter(t => t.source === 'iqrah').map(t => t.training_name);
    const projects         = (staff.projects  || []).map(p => p.project_name);
    const leaveMap: Record<string, number> = {};
    (staff.leaves || []).forEach(l => {
      leaveMap[`${l.leave_type}_used`]      = l.days_used;
      leaveMap[`${l.leave_type}_remaining`] = l.days_remaining;
    });

    setForm({
      name: staff.name, address: staff.address || '', mobile: staff.mobile || '',
      designation: staff.designation || '', department: staff.department || '',
      date_of_birth: staff.date_of_birth || '', date_joined: staff.date_joined || '',
      date_left: staff.date_left || '', basic_salary: staff.basic_salary, ta: staff.ta,
      medical_used: staff.medical_used, medical_remaining: staff.medical_remaining,
      edu_qualification: staff.edu_qualification || '',
      certificate_option: staff.certificate_option || '', remarks: staff.remarks || '',
      trainings_outside: outsideTrainings.length ? outsideTrainings : [''],
      trainings_iqrah:   iqrahTrainings.length   ? iqrahTrainings   : [''],
      projects:          projects.length          ? projects         : [''],
      leaves: {
        annual_used:        leaveMap.annual_used        ?? 0,
        annual_remaining:   leaveMap.annual_remaining   ?? 30,
        casual_used:        leaveMap.casual_used        ?? 0,
        casual_remaining:   leaveMap.casual_remaining   ?? 12,
        commuted_used:      leaveMap.commuted_used      ?? 0,
        commuted_remaining: leaveMap.commuted_remaining ?? 15,
        sick_used:          leaveMap.sick_used          ?? 0,
        sick_remaining:     leaveMap.sick_remaining     ?? 15,
        other_used:         leaveMap.other_used         ?? 0,
        other_remaining:    leaveMap.other_remaining    ?? 0,
      },
    });
  }, [staff]);

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

  // ── Subject assignment helpers ────────────────────────────────────────────
  const addSubjectRow = () =>
    setSubjectAssignments(prev => [...prev, { standard: '', subjectIds: [] }])

  const removeSubjectRow = (idx: number) =>
    setSubjectAssignments(prev => prev.filter((_, i) => i !== idx))

  const updateSubjectRowStandard = (idx: number, standard: string) =>
    setSubjectAssignments(prev => prev.map((r, i) =>
      i === idx ? { standard, subjectIds: [] } : r
    ))

  const toggleSubjectInRow = (idx: number, subjectId: number) =>
    setSubjectAssignments(prev => prev.map((r, i) =>
      i === idx
        ? { ...r, subjectIds: r.subjectIds.includes(subjectId)
            ? r.subjectIds.filter(s => s !== subjectId)
            : [...r.subjectIds, subjectId] }
        : r
    ))

  // ── Create teacher login ──────────────────────────────────────────────────
  async function handleCreateLogin() {
    if (!staff) return
    if (!loginEmail.trim() || !loginPassword.trim()) {
      setLoginError('Email and password are required'); return
    }
    if (loginPassword.length < 6) {
      setLoginError('Password must be at least 6 characters'); return
    }

    // Build assignments array
    const assignments: { type: string; standard: string; subject_id: number | null }[] = []

    // Class teacher assignment
    if (classTeacherStandard) {
      assignments.push({ type: 'class_teacher', standard: classTeacherStandard, subject_id: null })
    }

    // Subject teacher assignments
    subjectAssignments.forEach(row => {
      if (row.standard && row.subjectIds.length > 0) {
        row.subjectIds.forEach(subjectId => {
          assignments.push({ type: 'subject_teacher', standard: row.standard, subject_id: subjectId })
        })
      }
    })

    if (assignments.length === 0) {
      setLoginError('Please add at least one class or subject assignment'); return
    }

    setLoginLoading(true); setLoginError(''); setLoginSuccess('')

    const res = await fetch('/api/admin/create-staff-user', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        email: loginEmail,
        password: loginPassword,
        staffId: staff.id,
        staffName: staff.name,
        role: 'teacher',
        assignments,
      }),
    })

    const json = await res.json()
    if (!res.ok) { setLoginError(json.error || 'Failed to create login') }
    else {
      setLoginSuccess(`Teacher login created! ${staff.name} can now sign in with ${loginEmail}`)
      setLoginPassword('')
      onSaved()
    }
    setLoginLoading(false)
  }

  // ── Reset password ────────────────────────────────────────────────────────
  async function handleResetPassword() {
    if (!staff?.auth_user_id) return
    if (loginPassword.length < 6) { setLoginError('Password must be at least 6 characters'); return }
    setLoginLoading(true); setLoginError(''); setLoginSuccess('')

    const res = await fetch('/api/admin/reset-password', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ userId: staff.auth_user_id, password: loginPassword }),
    })

    const json = await res.json()
    if (!res.ok) { setLoginError(json.error || 'Failed to reset password') }
    else { setLoginSuccess('Password updated successfully!'); setLoginPassword('') }
    setLoginLoading(false)
  }

  return (
    <div className="fixed inset-0 bg-black/40 backdrop-blur-sm z-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-2xl max-h-[90vh] flex flex-col">

        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-100 shrink-0">
          <h2 className="text-base font-semibold text-slate-800">
            {staff ? `Edit: ${staff.name}` : 'Add New Staff Member'}
          </h2>
          <button onClick={onClose} className="p-1.5 rounded-lg hover:bg-slate-100 text-slate-400 hover:text-slate-600 transition-colors">
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Tabs */}
        <div className="flex gap-0 px-6 border-b border-slate-100 overflow-x-auto shrink-0">
          {TABS.map((tab, i) => (
            <button key={tab} onClick={() => setActiveTab(i)}
              className={`px-4 py-3 text-sm font-medium border-b-2 whitespace-nowrap transition-colors flex items-center gap-1.5 ${
                activeTab === i ? 'border-teal-600 text-teal-700' : 'border-transparent text-slate-500 hover:text-slate-700'
              }`}>
              {tab === 'Login' && <KeyRound className="w-3.5 h-3.5" />}
              {tab}
              {tab === 'Login' && hasLogin && (
                <span className="w-2 h-2 rounded-full bg-emerald-500 inline-block" />
              )}
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

          {/* ── Trainings ── */}
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
                    <button onClick={() => addListItem(key)} className="flex items-center gap-1 text-xs text-teal-600 hover:text-teal-800 transition-colors">
                      <Plus className="w-3 h-3" /> Add
                    </button>
                  </div>
                  <div className="space-y-2">
                    {form[key].map((val, i) => (
                      <div key={i} className="flex gap-2">
                        <input value={val} placeholder={placeholder}
                          onChange={e => updateListItem(key, i, e.target.value)}
                          className={`flex-1 ${inputCls}`} />
                        {form[key].length > 1 && (
                          <button onClick={() => removeListItem(key, i)} className="p-2 text-slate-400 hover:text-red-500 transition-colors">
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
                      <input type="number" min="0"
                        value={form.leaves[`${type}_used` as keyof typeof form.leaves]}
                        onChange={e => setLeave(`${type}_used` as keyof StaffFormData['leaves'], Number(e.target.value))}
                        className={inputCls} />
                    </div>
                    <div>
                      <label className="block text-xs text-slate-500 mb-1">Days Remaining</label>
                      <input type="number" min="0"
                        value={form.leaves[`${type}_remaining` as keyof typeof form.leaves]}
                        onChange={e => setLeave(`${type}_remaining` as keyof StaffFormData['leaves'], Number(e.target.value))}
                        className={inputCls} />
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
              <textarea value={form.remarks} onChange={e => set('remarks', e.target.value)}
                rows={6} placeholder="Add any notes or remarks about this staff member…"
                className={`${inputCls} resize-none`} />
            </div>
          )}

          {/* ── Login Tab (Teachers only) ── */}
          {activeTab === 6 && isTeacher && (
            <div className="space-y-5">
              {!staff ? (
                <div className="flex flex-col items-center justify-center py-10 text-slate-400 gap-3">
                  <KeyRound className="w-8 h-8 text-slate-300" />
                  <p className="text-sm text-center">Save the staff member first, then set login credentials.</p>
                </div>
              ) : (
                <>
                  {/* Status banner */}
                  {hasLogin ? (
                    <div className="flex items-start gap-3 p-4 bg-emerald-50 border border-emerald-200 rounded-xl">
                      <ShieldCheck className="w-5 h-5 text-emerald-600 shrink-0 mt-0.5" />
                      <div className="space-y-1">
                        <p className="text-sm font-semibold text-emerald-800">Login Active</p>
                        <p className="text-xs text-emerald-600">
                          {staff.name} signs in with <strong>{staff.email}</strong>
                        </p>
                        {existingAssignments.filter(a => a.type === 'class_teacher').map(a => (
                          <p key={a.id} className="text-xs text-emerald-700">
                            🏫 Class Teacher of <strong>{a.standard}</strong>
                          </p>
                        ))}
                        {existingAssignments.filter(a => a.type === 'subject_teacher').map(a => (
                          <p key={a.id} className="text-xs text-emerald-700">
                            📚 {a.subjects?.name} in <strong>{a.standard}</strong>
                          </p>
                        ))}
                      </div>
                    </div>
                  ) : (
                    <div className="flex items-center gap-3 p-4 bg-amber-50 border border-amber-200 rounded-xl">
                      <KeyRound className="w-5 h-5 text-amber-600 shrink-0" />
                      <div>
                        <p className="text-sm font-semibold text-amber-800">No Login Yet</p>
                        <p className="text-xs text-amber-600 mt-0.5">Set up login and assign classes/subjects.</p>
                      </div>
                    </div>
                  )}

                  {loginSuccess && (
                    <div className="flex items-center gap-2 p-3 bg-green-50 border border-green-200 rounded-lg text-green-700 text-sm">
                      <CheckCircle2 className="w-4 h-4 shrink-0" />{loginSuccess}
                    </div>
                  )}
                  {loginError && (
                    <div className="p-3 bg-red-50 border border-red-200 rounded-lg text-red-700 text-sm">
                      ⚠️ {loginError}
                    </div>
                  )}

                  {/* ── Assignments (only when creating) ── */}
                  {!hasLogin && (
                    <div className="space-y-4">

                      {/* Section 1: Class Teacher */}
                      <div className="p-4 bg-blue-50 border border-blue-200 rounded-xl space-y-3">
                        <div>
                          <p className="text-xs font-bold text-blue-800 uppercase tracking-wide">🏫 Class Teacher Assignment</p>
                          <p className="text-xs text-blue-600 mt-0.5">Gives attendance access for this class</p>
                        </div>
                        <select value={classTeacherStandard}
                          onChange={e => setClassTeacherStandard(e.target.value)}
                          className={selectCls}>
                          <option value="">— None (not a class teacher) —</option>
                          {standards.map(s => <option key={s} value={s}>{s}</option>)}
                        </select>
                      </div>

                      {/* Section 2: Subject Teacher */}
                      <div className="p-4 bg-violet-50 border border-violet-200 rounded-xl space-y-3">
                        <div className="flex items-center justify-between">
                          <div>
                            <p className="text-xs font-bold text-violet-800 uppercase tracking-wide">📚 Subject Teacher Assignment</p>
                            <p className="text-xs text-violet-600 mt-0.5">Gives marks entry access per subject</p>
                          </div>
                          <button onClick={addSubjectRow}
                            className="flex items-center gap-1 text-xs text-violet-700 hover:text-violet-900 font-medium">
                            <Plus className="w-3.5 h-3.5" /> Add Row
                          </button>
                        </div>

                        {subjectAssignments.map((row, idx) => (
                          <div key={idx} className="bg-white rounded-lg border border-violet-200 p-3 space-y-2">
                            <div className="flex items-center gap-2">
                              <select value={row.standard}
                                onChange={e => updateSubjectRowStandard(idx, e.target.value)}
                                className={`flex-1 ${selectCls}`}>
                                <option value="">Select class…</option>
                                {standards.map(s => <option key={s} value={s}>{s}</option>)}
                              </select>
                              {subjectAssignments.length > 1 && (
                                <button onClick={() => removeSubjectRow(idx)}
                                  className="p-1.5 text-slate-400 hover:text-red-500 transition-colors">
                                  <Trash2 className="w-3.5 h-3.5" />
                                </button>
                              )}
                            </div>

                            {row.standard && (
                              <div className="flex flex-wrap gap-1.5">
                                {subjects.filter(s => s.standard === row.standard).map(s => (
                                  <button key={s.id}
                                    onClick={() => toggleSubjectInRow(idx, s.id)}
                                    className={`px-2.5 py-1 rounded-lg text-xs font-medium border transition-all ${
                                      row.subjectIds.includes(s.id)
                                        ? 'bg-violet-600 text-white border-violet-600'
                                        : 'bg-white text-slate-600 border-slate-200 hover:border-violet-300'
                                    }`}>
                                    {s.name}
                                  </button>
                                ))}
                                {subjects.filter(s => s.standard === row.standard).length === 0 && (
                                  <p className="text-xs text-slate-400">No subjects for this class</p>
                                )}
                              </div>
                            )}
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Email + Password */}
                  <div className="space-y-3">
                    <div>
                      <label className="block text-xs font-medium text-slate-600 mb-1">
                        Email Address <span className="text-red-500">*</span>
                      </label>
                      <input type="email" value={loginEmail}
                        onChange={e => setLoginEmail(e.target.value)}
                        disabled={hasLogin}
                        placeholder="teacher@school.com"
                        className={`${inputCls} ${hasLogin ? 'opacity-60 cursor-not-allowed bg-slate-50' : ''}`}
                      />
                      {hasLogin && (
                        <p className="text-xs text-slate-400 mt-1">Email cannot be changed after login is created.</p>
                      )}
                    </div>

                    <div>
                      <label className="block text-xs font-medium text-slate-600 mb-1">
                        {hasLogin ? 'New Password' : 'Password'} <span className="text-red-500">*</span>
                      </label>
                      <input type="password" value={loginPassword}
                        onChange={e => setLoginPassword(e.target.value)}
                        placeholder={hasLogin ? 'Enter new password…' : 'Min 6 characters'}
                        className={inputCls}
                      />
                    </div>

                    <button
                      onClick={hasLogin ? handleResetPassword : handleCreateLogin}
                      disabled={loginLoading}
                      className="w-full h-10 flex items-center justify-center gap-2 text-sm font-semibold bg-teal-600 text-white rounded-lg hover:bg-teal-700 disabled:opacity-60 transition-colors"
                    >
                      {loginLoading ? <Loader2 className="w-4 h-4 animate-spin" /> : <KeyRound className="w-4 h-4" />}
                      {loginLoading ? 'Processing…' : hasLogin ? 'Reset Password' : 'Create Teacher Login'}
                    </button>
                  </div>
                </>
              )}
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="flex items-center justify-between px-6 py-4 border-t border-slate-100 bg-slate-50 rounded-b-2xl shrink-0">
          <div className="flex gap-1.5">
            {TABS.map((_, i) => (
              <button key={i} onClick={() => setActiveTab(i)}
                className={`w-2 h-2 rounded-full transition-colors ${activeTab === i ? 'bg-teal-600' : 'bg-slate-300 hover:bg-slate-400'}`} />
            ))}
          </div>
          <div className="flex gap-2">
            <button onClick={onClose} className="h-9 px-4 text-sm text-slate-600 rounded-lg border border-slate-200 hover:bg-slate-100 transition-colors">
              Cancel
            </button>
            {activeTab < TABS.length - 1 && (
              <button onClick={() => setActiveTab(t => t + 1)} className="h-9 px-4 text-sm text-teal-700 bg-teal-50 border border-teal-200 hover:bg-teal-100 rounded-lg transition-colors">
                Next →
              </button>
            )}
            {activeTab !== 6 && (
              <button onClick={handleSave} disabled={saving}
                className="h-9 flex items-center gap-2 px-5 text-sm font-semibold bg-teal-600 text-white rounded-lg hover:bg-teal-700 disabled:opacity-60 transition-colors">
                {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
                {saving ? 'Saving…' : 'Save Staff'}
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}