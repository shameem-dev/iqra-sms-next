'use client';

import { useState, useEffect, useMemo, useRef } from 'react';
import { createBrowserClient } from '@supabase/ssr';
import {
  X, Plus, Trash2, Save, Loader2, KeyRound, ShieldCheck,
  CheckCircle2, School, BookOpen, Pencil,
  FileText, Upload, AlertCircle, Download, File, Eye,
} from 'lucide-react';
import { CERTIFICATE_OPTIONS, DEPARTMENTS, DESIGNATIONS, Staff, StaffFormData } from '@/type/staff';
import { createStaff, updateStaff } from '@/utils/actions/staff-actions';



interface Props {
  staff: Staff | null;
  onClose: () => void;
  onSaved: () => void;
}

interface Subject { id: number; name: string; standard: string }

interface SubjectAssignment {
  standard: string;
  subjectIds: number[];
}

interface StaffDocument {
  id: string;
  staff_id: string;
  title: string;
  file_name: string;
  file_path: string;
  file_size: number;
  uploaded_at: string;
}

// ─────────────────────────────────────────────────────────────────────────────
// CONSTANTS
// ─────────────────────────────────────────────────────────────────────────────

const inputCls =
  'w-full px-3 py-2 text-sm text-slate-800 bg-white border border-slate-200 rounded-lg ' +
  'focus:outline-none focus:ring-2 focus:ring-teal-500 focus:border-transparent placeholder:text-slate-400';
const selectCls =
  'w-full px-3 py-2 text-sm text-slate-800 bg-white border border-slate-200 rounded-lg ' +
  'focus:outline-none focus:ring-2 focus:ring-teal-500 focus:border-transparent';

const EMPTY_FORM: StaffFormData = {
  name: '', address: '', mobile: '', designation: '', department: '',
  date_of_birth: '', date_joined: '', date_left: '',
  basic_salary: 0, ta: 0,
  medical_allowance: 0, medical_used: 0, medical_remaining: 0,
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

// ─────────────────────────────────────────────────────────────────────────────
// HELPERS
// ─────────────────────────────────────────────────────────────────────────────

function formatBytes(bytes: number) {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(2)} MB`;
}

// ─────────────────────────────────────────────────────────────────────────────
// SMALL FIELD COMPONENTS
// ─────────────────────────────────────────────────────────────────────────────

interface InputFieldProps {
  label: string; value: string | number;
  onChange: (val: string | number) => void;
  type?: string; required?: boolean; placeholder?: string; readOnly?: boolean;
}
function InputField({ label, value, onChange, type = 'text', required = false, placeholder, readOnly = false }: InputFieldProps) {
  return (
    <div>
      <label className="block text-xs font-medium text-slate-600 mb-1">
        {label}{required && <span className="text-red-500 ml-0.5">*</span>}
      </label>
      <input
        type={type} value={value} placeholder={placeholder} readOnly={readOnly}
        onChange={e => !readOnly && onChange(type === 'number' ? Number(e.target.value) : e.target.value)}
        className={`${inputCls} ${readOnly ? 'bg-slate-50 cursor-not-allowed text-slate-500' : ''}`}
      />
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

// ─────────────────────────────────────────────────────────────────────────────
// MAIN COMPONENT
// ─────────────────────────────────────────────────────────────────────────────

export function StaffModal({ staff, onClose, onSaved }: Props) {
  const supabase = useMemo(() => createBrowserClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_DEFAULT_KEY!
  ), []);

  // ── Core form state ───────────────────────────────────────────────────────
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
  const [editingAssignments, setEditingAssignments] = useState(false);
  const [assignSaving, setAssignSaving]   = useState(false);

  // Class teacher assignment
  const [classTeacherStandard, setClassTeacherStandard] = useState('');

  // Subject teacher assignments
  const [subjectAssignments, setSubjectAssignments] = useState<SubjectAssignment[]>([
    { standard: '', subjectIds: [] },
  ]);

  // Subjects + standards from DB
  const [subjects, setSubjects]   = useState<Subject[]>([]);
  const [standards, setStandards] = useState<string[]>([]);

  // Existing assignments loaded from DB
  const [existingAssignments, setExistingAssignments] = useState<any[]>([]);

  // ── Documents tab state ───────────────────────────────────────────────────
  const fileInputRef                            = useRef<HTMLInputElement>(null);
  const [docs, setDocs]                         = useState<StaffDocument[]>([]);
  const [docsLoading, setDocsLoading]           = useState(false);
  const [docTitle, setDocTitle]                 = useState('');
  const [selectedFile, setSelectedFile]         = useState<File | null>(null);
  const [uploading, setUploading]               = useState(false);
  const [docError, setDocError]                 = useState('');
  const [docSuccess, setDocSuccess]             = useState('');
  const [deletingDocId, setDeletingDocId]       = useState<string | null>(null);
  const [downloadingDocId, setDownloadingDocId] = useState<string | null>(null);
  const [previewLoadingId, setPreviewLoadingId] = useState<string | null>(null);

  // ── Derived ───────────────────────────────────────────────────────────────
  const hasLogin  = !!staff?.auth_user_id;
  const isTeacher = (staff?.designation || form.designation) === 'Teacher';

  const TABS = isTeacher
    ? ['Personal', 'Financial', 'Education', 'Trainings', 'Leaves', 'Remarks', 'Documents', 'Login']
    : ['Personal', 'Financial', 'Education', 'Trainings', 'Leaves', 'Remarks', 'Documents'];

  const DOC_TAB_IDX   = 6;
  const LOGIN_TAB_IDX = 7;

  // ── Load subjects ─────────────────────────────────────────────────────────
  useEffect(() => {
    (async () => {
      const { data } = await supabase
        .from('subjects').select('id, name, standard')
        .eq('is_active', true).order('standard');
      if (data) {
        setSubjects(data);
        setStandards([...new Set(data.map((s: Subject) => s.standard))]);
      }
    })();
  }, [supabase]);

  // ── Load teacher assignments when Login tab opens ─────────────────────────
  useEffect(() => {
    if (!staff?.id || activeTab !== LOGIN_TAB_IDX) return;
    (async () => {
      const { data } = await supabase
        .from('teacher_assignments')
        .select('id, type, standard, subject_id, subjects(name)')
        .eq('staff_id', staff.id);

      if (data) {
        setExistingAssignments(data);
        const classTa = data.find((d: any) => d.type === 'class_teacher');
        if (classTa) setClassTeacherStandard(classTa.standard);
        const subjectTa = data.filter((d: any) => d.type === 'subject_teacher');
        if (subjectTa.length > 0) {
          const grouped: Record<string, number[]> = {};
          subjectTa.forEach((d: any) => {
            if (!grouped[d.standard]) grouped[d.standard] = [];
            grouped[d.standard].push(d.subject_id);
          });
          setSubjectAssignments(
            Object.entries(grouped).map(([standard, subjectIds]) => ({ standard, subjectIds }))
          );
        }
      }
    })();
  }, [staff, activeTab, supabase]);

  // ── Load documents when Documents tab opens ───────────────────────────────
  useEffect(() => {
    if (!staff?.id || activeTab !== DOC_TAB_IDX) return;
    fetchDocs();
  }, [staff?.id, activeTab]); // eslint-disable-line

  const fetchDocs = async () => {
    if (!staff?.id) return;
    setDocsLoading(true);
    const { data } = await supabase
      .from('staff_documents')
      .select('*')
      .eq('staff_id', staff.id)
      .order('uploaded_at', { ascending: false });
    if (data) setDocs(data);
    setDocsLoading(false);
  };

  // ── Reset state when staff prop changes ───────────────────────────────────
  useEffect(() => {
    setDocTitle(''); setSelectedFile(null); setDocError(''); setDocSuccess('');
    setDocs([]);
    if (fileInputRef.current) fileInputRef.current.value = '';

    if (!staff) { setForm(EMPTY_FORM); return; }

    setLoginEmail(staff.email || '');
    setLoginPassword(''); setLoginSuccess(''); setLoginError('');
    setEditingAssignments(false);
    setClassTeacherStandard('');
    setSubjectAssignments([{ standard: '', subjectIds: [] }]);

    const outsideTrainings = (staff.trainings || []).filter(t => t.source === 'outside').map(t => t.training_name);
    const iqrahTrainings   = (staff.trainings || []).filter(t => t.source === 'iqrah').map(t => t.training_name);
    const projects         = (staff.projects  || []).map(p => p.project_name);
    const leaveMap: Record<string, number> = {};
    (staff.leaves || []).forEach(l => {
      leaveMap[`${l.leave_type}_used`]      = l.days_used;
      leaveMap[`${l.leave_type}_remaining`] = l.days_remaining;
    });

    const allowance = staff.medical_allowance ?? 0;
    const used      = staff.medical_used      ?? 0;

    setForm({
      name: staff.name, address: staff.address || '', mobile: staff.mobile || '',
      designation: staff.designation || '', department: staff.department || '',
      date_of_birth: staff.date_of_birth || '', date_joined: staff.date_joined || '',
      date_left: staff.date_left || '', basic_salary: staff.basic_salary, ta: staff.ta,
      medical_allowance: allowance,
      medical_used: used,
      medical_remaining: allowance - used,
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

  // ─────────────────────────────────────────────────────────────────────────
  // FORM HELPERS
  // ─────────────────────────────────────────────────────────────────────────

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

  // ── Medical allowance auto-calc helpers ───────────────────────────────────

  const setMedicalAllowance = (allowance: number) => {
    setForm(f => ({
      ...f,
      medical_allowance: allowance,
      medical_remaining: allowance - f.medical_used,
    }));
  };

  const setMedicalUsed = (used: number) => {
    setForm(f => ({
      ...f,
      medical_used: used,
      medical_remaining: f.medical_allowance - used,
    }));
  };

  // ─────────────────────────────────────────────────────────────────────────
  // SAVE STAFF
  // ─────────────────────────────────────────────────────────────────────────

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

  // ─────────────────────────────────────────────────────────────────────────
  // SUBJECT ASSIGNMENT HELPERS
  // ─────────────────────────────────────────────────────────────────────────

  const addSubjectRow = () =>
    setSubjectAssignments(prev => [...prev, { standard: '', subjectIds: [] }]);

  const removeSubjectRow = (idx: number) =>
    setSubjectAssignments(prev => prev.filter((_, i) => i !== idx));

  const updateSubjectRowStandard = (idx: number, standard: string) =>
    setSubjectAssignments(prev => prev.map((r, i) =>
      i === idx ? { standard, subjectIds: [] } : r
    ));

  const toggleSubjectInRow = (idx: number, subjectId: number) =>
    setSubjectAssignments(prev => prev.map((r, i) =>
      i === idx
        ? { ...r, subjectIds: r.subjectIds.includes(subjectId)
            ? r.subjectIds.filter(s => s !== subjectId)
            : [...r.subjectIds, subjectId] }
        : r
    ));




  async function validateAssignments() {
  if (!staff) return null;

  // Check class teacher duplicate
  if (classTeacherStandard) {
    const { data: existingClass } = await supabase
      .from('teacher_assignments')
      .select('id, staff_id')
      .eq('type', 'class_teacher')
      .eq('standard', classTeacherStandard)
      .neq('staff_id', staff.id)
      .maybeSingle();

    if (existingClass) {
      return `Class ${classTeacherStandard} is already assigned to another teacher`;
    }
  }

  // Check subject teacher duplicate
  for (const row of subjectAssignments) {
    for (const subjectId of row.subjectIds) {
      const { data: existingSubject } = await supabase
        .from('teacher_assignments')
        .select('id, staff_id')
        .eq('type', 'subject_teacher')
        .eq('standard', row.standard)
        .eq('subject_id', subjectId)
        .neq('staff_id', staff.id)
        .maybeSingle();

      if (existingSubject) {
        const subject = subjects.find(s => s.id === subjectId);

        return `${subject?.name} in ${row.standard} is already assigned to another teacher`;
      }
    }
  }

  return null;
}

  // ─────────────────────────────────────────────────────────────────────────
  // LOGIN ACTIONS
  // ─────────────────────────────────────────────────────────────────────────

  async function handleCreateLogin() {
    if (!staff) return;
    if (!loginEmail.trim() || !loginPassword.trim()) { setLoginError('Email and password are required'); return; }
    if (loginPassword.length < 6) { setLoginError('Password must be at least 6 characters'); return; }

    const assignments: { type: string; standard: string; subject_id: number | null }[] = [];
    if (classTeacherStandard)
      assignments.push({ type: 'class_teacher', standard: classTeacherStandard, subject_id: null });
    subjectAssignments.forEach(row => {
      if (row.standard && row.subjectIds.length > 0)
        row.subjectIds.forEach(subjectId =>
          assignments.push({ type: 'subject_teacher', standard: row.standard, subject_id: subjectId })
        );
    });

    if (assignments.length === 0) { setLoginError('Please add at least one class or subject assignment'); return; }


    const validationError = await validateAssignments();

      if (validationError) {
        setLoginError(validationError);
        return;
      }

    setLoginLoading(true); setLoginError(''); setLoginSuccess('');
    const res  = await fetch('/api/admin/create-staff-user', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        email: loginEmail, password: loginPassword,
        staffId: staff.id, staffName: staff.name,
        role: 'teacher', assignments,
      }),
    });
    const json = await res.json();
    if (!res.ok) { setLoginError(json.error || 'Failed to create login'); }
    else {
      setLoginSuccess(`Teacher login created! ${staff.name} can now sign in with ${loginEmail}`);
      setLoginPassword('');
      onSaved();
    }
    setLoginLoading(false);
  }

  async function handleResetPassword() {
    if (!staff?.auth_user_id) return;
    if (loginPassword.length < 6) { setLoginError('Password must be at least 6 characters'); return; }
    setLoginLoading(true); setLoginError(''); setLoginSuccess('');
    const res  = await fetch('/api/admin/reset-password', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ userId: staff.auth_user_id, password: loginPassword }),
    });
    const json = await res.json();
    if (!res.ok) { setLoginError(json.error || 'Failed to reset password'); }
    else { setLoginSuccess('Password updated successfully!'); setLoginPassword(''); }
    setLoginLoading(false);
  }

  async function handleSaveAssignments() {
    if (!staff) return;
    setAssignSaving(true); setLoginError(''); setLoginSuccess('');

    const validationError = await validateAssignments();

    if (validationError) {
      setLoginError(validationError);
      setAssignSaving(false);
      return;
    }

    const assignments: { type: string; standard: string; subject_id: number | null }[] = [];
    if (classTeacherStandard)
      assignments.push({ type: 'class_teacher', standard: classTeacherStandard, subject_id: null });
    subjectAssignments.forEach(row => {
      if (row.standard && row.subjectIds.length > 0)
        row.subjectIds.forEach(subjectId =>
          assignments.push({ type: 'subject_teacher', standard: row.standard, subject_id: subjectId })
        );
    });

    const { error: delError } = await supabase
      .from('teacher_assignments').delete().eq('staff_id', staff.id);
    if (delError) { setLoginError(delError.message); setAssignSaving(false); return; }

    if (assignments.length > 0) {
      const { error: insError } = await supabase
        .from('teacher_assignments')
        .insert(assignments.map(a => ({ ...a, staff_id: staff.id })));
      if (insError) { setLoginError(insError.message); setAssignSaving(false); return; }
    }

    const { data } = await supabase
      .from('teacher_assignments')
      .select('id, type, standard, subject_id, subjects(name)')
      .eq('staff_id', staff.id);
    if (data) setExistingAssignments(data);

    setLoginSuccess('Assignments updated successfully!');
    setEditingAssignments(false);
    setAssignSaving(false);
    onSaved();
  }

  // ─────────────────────────────────────────────────────────────────────────
  // DOCUMENTS ACTIONS
  // ─────────────────────────────────────────────────────────────────────────

  const handleFilePick = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (file.type !== 'application/pdf') { setDocError('Only PDF files are supported.'); return; }
    if (file.size > 50 * 1024 * 1024)   { setDocError('File must be under 50 MB.'); return; }
    setSelectedFile(file);
    setDocError('');
    setDocSuccess('');
  };

  const handleDocUpload = async () => {
    if (!staff?.id)       { setDocError('Save the staff member first before uploading documents.'); return; }
    if (!selectedFile)    { setDocError('Please select a PDF file.'); return; }
    if (!docTitle.trim()) { setDocError('Please enter a document title.'); return; }

    setUploading(true); setDocError(''); setDocSuccess('');
    try {
      const originalSize = selectedFile.size;

      const form = new FormData();
      form.append('file', selectedFile);
      const res = await fetch('/api/compress-pdf', { method: 'POST', body: form });

      let uploadBlob: Blob = selectedFile;
      if (res.ok) {
        const compressed = await res.blob();
        if (compressed.size < originalSize) uploadBlob = compressed;
      }

      const filePath = `${staff.id}/${Date.now()}_${selectedFile.name.replace(/[^a-z0-9._-]/gi, '_')}`;

      const { error: uploadErr } = await supabase.storage
        .from('staff-documents')
        .upload(filePath, uploadBlob, { contentType: 'application/pdf', upsert: false });
      if (uploadErr) throw new Error(uploadErr.message);

      const { error: dbErr } = await supabase.from('staff_documents').insert({
        staff_id: staff.id, title: docTitle.trim(),
        file_name: selectedFile.name, file_path: filePath,
        file_size: uploadBlob.size, mime_type: 'application/pdf',
      });
      if (dbErr) {
        await supabase.storage.from('staff-documents').remove([filePath]);
        throw new Error(dbErr.message);
      }

      const saved = Math.round((1 - uploadBlob.size / originalSize) * 100);
      setDocSuccess(
        uploadBlob.size < originalSize
          ? `Uploaded & compressed! ${formatBytes(originalSize)} → ${formatBytes(uploadBlob.size)} (${saved}% saved)`
          : `Uploaded successfully! (${formatBytes(uploadBlob.size)})`
      );

      setDocTitle(''); setSelectedFile(null);
      if (fileInputRef.current) fileInputRef.current.value = '';
      fetchDocs();
    } catch (err: unknown) {
      setDocError(err instanceof Error ? err.message : 'Upload failed');
    } finally { setUploading(false); }
  };

  const handleDocPreview = async (doc: StaffDocument) => {
    setPreviewLoadingId(doc.id);
    const { data, error } = await supabase.storage
      .from('staff-documents')
      .createSignedUrl(doc.file_path, 300);
    if (!error && data?.signedUrl) window.open(data.signedUrl, '_blank');
    setPreviewLoadingId(null);
  };

  const handleDocDownload = async (doc: StaffDocument) => {
    setDownloadingDocId(doc.id);
    const { data, error } = await supabase.storage
      .from('staff-documents').createSignedUrl(doc.file_path, 60);
    if (!error && data?.signedUrl) {
      const a = document.createElement('a');
      a.href = data.signedUrl; a.download = doc.file_name; a.click();
    }
    setDownloadingDocId(null);
  };

  const handleDocDelete = async (doc: StaffDocument) => {
    if (!confirm(`Delete "${doc.title}"? This cannot be undone.`)) return;
    setDeletingDocId(doc.id);
    const { error: storageErr } = await supabase.storage
      .from('staff-documents').remove([doc.file_path]);
    if (!storageErr) await supabase.from('staff_documents').delete().eq('id', doc.id);
    setDeletingDocId(null);
    fetchDocs();
  };

  // ─────────────────────────────────────────────────────────────────────────
  // SHARED JSX — Assignment form
  // ─────────────────────────────────────────────────────────────────────────

  const assignmentFormJSX = (
    <div className="space-y-3">
      {/* Class Teacher */}
      <div className="p-3 bg-blue-50 border border-blue-200 rounded-xl space-y-2">
        <div className="flex items-center gap-2">
          <School className="w-3.5 h-3.5 text-blue-700" />
          <p className="text-xs font-bold text-blue-800 uppercase tracking-wide">Class Teacher</p>
        </div>
        <p className="text-xs text-blue-600">Gives attendance access for this class</p>
        <select value={classTeacherStandard} onChange={e => setClassTeacherStandard(e.target.value)} className={selectCls}>
          <option value="">— None (not a class teacher) —</option>
          {standards.map(s => <option key={s} value={s}>{s}</option>)}
        </select>
      </div>

      {/* Subject Teacher */}
      <div className="p-3 bg-violet-50 border border-violet-200 rounded-xl space-y-2">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <BookOpen className="w-3.5 h-3.5 text-violet-700" />
            <p className="text-xs font-bold text-violet-800 uppercase tracking-wide">Subject Teacher</p>
          </div>
          <button onClick={addSubjectRow}
            className="flex items-center gap-1 text-xs text-violet-700 hover:text-violet-900 font-medium">
            <Plus className="w-3.5 h-3.5" /> Add Row
          </button>
        </div>
        <p className="text-xs text-violet-600">Gives marks entry access per subject</p>

        {subjectAssignments.map((row, idx) => (
          <div key={idx} className="bg-white rounded-lg border border-violet-200 p-2 space-y-2">
            <div className="flex items-center gap-2">
              <select value={row.standard} onChange={e => updateSubjectRowStandard(idx, e.target.value)}
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
                  {subjects
                    .filter(s => s.standard === row.standard)
                    .map(s => {
                      const alreadyAssigned = existingAssignments.some(
                        a =>
                          a.type === 'subject_teacher' &&
                          a.standard === row.standard &&
                          a.subject_id === s.id
                      );

                      return (
                        <button
                          key={s.id}
                          disabled={alreadyAssigned}
                          title={alreadyAssigned ? 'Assigned to another teacher' : ''}
                          onClick={() => toggleSubjectInRow(idx, s.id)}
                          className={`px-2.5 py-1 rounded-lg text-xs font-medium border transition-all ${
                            alreadyAssigned
                              ? 'bg-slate-100 text-slate-400 border-slate-200 cursor-not-allowed'
                              : row.subjectIds.includes(s.id)
                              ? 'bg-violet-600 text-white border-violet-600'
                              : 'bg-white text-slate-600 border-slate-200 hover:border-violet-300'
                          }`}
                        >
                          {s.name}
                          {alreadyAssigned && ' • Assigned'}
                        </button>
                      );
                    })}

                  {subjects.filter(s => s.standard === row.standard).length === 0 && (
                    <p className="text-xs text-slate-400">
                      No subjects for this class
                    </p>
                  )}
                </div>
)}
          </div>
        ))}
      </div>
    </div>
  );

  // ─────────────────────────────────────────────────────────────────────────
  // RENDER
  // ─────────────────────────────────────────────────────────────────────────

  return (
    <div className="fixed inset-0 bg-black/40 backdrop-blur-sm z-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-2xl max-h-[90vh] flex flex-col">

        {/* ── Header ── */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-100 shrink-0">
          <h2 className="text-base font-semibold text-slate-800">
            {staff ? `Edit: ${staff.name}` : 'Add New Staff Member'}
          </h2>
          <button onClick={onClose} className="p-1.5 rounded-lg hover:bg-slate-100 text-slate-400 hover:text-slate-600 transition-colors">
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* ── Tabs ── */}
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

        {/* ── Body ── */}
        <div className="flex-1 overflow-y-auto px-6 py-5">
          {error && (
            <div className="mb-4 flex items-center gap-2 p-3 bg-red-50 border border-red-200 rounded-lg text-red-700 text-sm">
              <span>⚠️</span>{error}
            </div>
          )}

          {/* ── Tab 0: Personal ── */}
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

          {/* ── Tab 1: Financial ── */}
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

              {/* ── Medical Reimbursement ── */}
              <div className="col-span-2">
                <p className="text-sm font-semibold text-slate-700 mb-3">Medical Reimbursement</p>
                <div className="grid grid-cols-2 gap-4">
                  {/* Allowance — editable */}
                  <div>
                    <label className="block text-xs font-medium text-slate-600 mb-1">Allowance (₹)</label>
                    <input
                      type="number" min="0"
                      value={form.medical_allowance}
                      onChange={e => setMedicalAllowance(Number(e.target.value))}
                      className={inputCls}
                    />
                  </div>
                  {/* Used — editable */}
                  <div>
                    <label className="block text-xs font-medium text-slate-600 mb-1">Used (₹)</label>
                    <input
                      type="number" min="0"
                      value={form.medical_used}
                      onChange={e => setMedicalUsed(Number(e.target.value))}
                      className={inputCls}
                    />
                  </div>
                </div>
                {/* Remaining — auto-calculated, read-only display */}
                <div className="mt-3 p-3 bg-teal-50 border border-teal-100 rounded-xl flex items-center justify-between">
                  <div>
                    <div className="text-xs text-teal-600 font-medium">Remaining</div>
                    <div className={`text-xl font-bold mt-0.5 ${form.medical_remaining < 0 ? 'text-red-600' : 'text-teal-800'}`}>
                      ₹{Number(form.medical_remaining).toLocaleString('en-IN')}
                    </div>
                  </div>
                  <div className="text-right text-xs text-teal-500 space-y-0.5">
                    <div>Allowance: ₹{Number(form.medical_allowance).toLocaleString('en-IN')}</div>
                    <div>Used: ₹{Number(form.medical_used).toLocaleString('en-IN')}</div>
                  </div>
                </div>
                {form.medical_remaining < 0 && (
                  <p className="text-xs text-red-500 mt-1.5 flex items-center gap-1">
                    <AlertCircle className="w-3 h-3" /> Used exceeds allowance
                  </p>
                )}
              </div>
            </div>
          )}

          {/* ── Tab 2: Education ── */}
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

          {/* ── Tab 3: Trainings ── */}
          {activeTab === 3 && (
            <div className="space-y-6">
              {(
                [
                  ['trainings_outside', 'Trainings Achieved (Outside Iqrah)', 'Training name…'],
                  ['trainings_iqrah',   'Trainings (Through Iqrah)',           'Training name…'],
                  ['projects',          'Projects Done',                       'Project name…'],
                ] as ['trainings_outside' | 'trainings_iqrah' | 'projects', string, string][]
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

          {/* ── Tab 4: Leaves ── */}
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

          {/* ── Tab 5: Remarks ── */}
          {activeTab === 5 && (
            <div>
              <label className="block text-xs font-medium text-slate-600 mb-1">Remarks</label>
              <textarea value={form.remarks} onChange={e => set('remarks', e.target.value)}
                rows={6} placeholder="Add any notes or remarks about this staff member…"
                className={`${inputCls} resize-none`} />
            </div>
          )}

          {/* ── Tab 6: Documents ── */}
          {activeTab === DOC_TAB_IDX && (
            <div className="space-y-5">
              {!staff ? (
                <div className="flex flex-col items-center justify-center py-10 text-slate-400 gap-3">
                  <FileText className="w-8 h-8 text-slate-300" />
                  <p className="text-sm text-center">Save the staff member first, then upload documents.</p>
                </div>
              ) : (
                <>
                  {/* ── Upload card ── */}
                  <div className="p-4 bg-slate-50 border border-slate-200 rounded-xl space-y-3">
                    <p className="text-sm font-semibold text-slate-700">Upload Document</p>

                    <div>
                      <label className="block text-xs font-medium text-slate-600 mb-1">
                        Document Title <span className="text-red-500">*</span>
                      </label>
                      <input type="text" value={docTitle} onChange={e => setDocTitle(e.target.value)}
                        placeholder="e.g. Appointment Letter, Certificate…"
                        className={inputCls} />
                    </div>

                    <div>
                      <label className="block text-xs font-medium text-slate-600 mb-1">
                        PDF File <span className="text-red-500">*</span>
                      </label>
                      <div
                        onClick={() => fileInputRef.current?.click()}
                        className="flex items-center gap-3 px-4 py-3 border-2 border-dashed border-slate-300 rounded-xl cursor-pointer hover:border-teal-400 hover:bg-teal-50 transition-colors group"
                      >
                        <Upload className="w-4 h-4 text-slate-400 group-hover:text-teal-500 transition-colors shrink-0" />
                        <span className="text-sm text-slate-500 group-hover:text-teal-600 truncate">
                          {selectedFile
                            ? `${selectedFile.name} (${formatBytes(selectedFile.size)})`
                            : 'Click to choose a PDF (max 50 MB)'}
                        </span>
                        {selectedFile && (
                          <button
                            onClick={e => {
                              e.stopPropagation();
                              setSelectedFile(null);
                              if (fileInputRef.current) fileInputRef.current.value = '';
                            }}
                            className="ml-auto p-0.5 text-slate-400 hover:text-red-500"
                          >
                            <X className="w-3.5 h-3.5" />
                          </button>
                        )}
                      </div>
                      <input ref={fileInputRef} type="file" accept="application/pdf"
                        className="hidden" onChange={handleFilePick} />
                    </div>

                    {docError && (
                      <div className="flex items-center gap-2 p-3 bg-red-50 border border-red-200 rounded-lg text-red-700 text-xs">
                        <AlertCircle className="w-3.5 h-3.5 shrink-0" />{docError}
                      </div>
                    )}

                    {docSuccess && (
                      <div className="flex items-center gap-2 p-3 bg-green-50 border border-green-200 rounded-lg text-green-700 text-xs">
                        <CheckCircle2 className="w-3.5 h-3.5 shrink-0" />{docSuccess}
                      </div>
                    )}

                    <button
                      onClick={handleDocUpload}
                      disabled={uploading || !selectedFile || !docTitle.trim()}
                      className="w-full h-9 flex items-center justify-center gap-2 text-sm font-semibold bg-teal-600 text-white rounded-lg hover:bg-teal-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                    >
                      {uploading
                        ? <><Loader2 className="w-4 h-4 animate-spin" />Compressing & Uploading…</>
                        : <><Upload className="w-4 h-4" />Upload & Compress</>
                      }
                    </button>
                  </div>

                  {/* ── Document list ── */}
                  <div className="space-y-2">
                    <p className="text-sm font-semibold text-slate-700">
                      Uploaded Documents
                      {docs.length > 0 && (
                        <span className="ml-2 text-xs font-normal text-slate-400">({docs.length})</span>
                      )}
                    </p>

                    {docsLoading && (
                      <div className="flex items-center gap-2 text-slate-400 text-sm py-4 justify-center">
                        <Loader2 className="w-4 h-4 animate-spin" /> Loading…
                      </div>
                    )}

                    {!docsLoading && docs.length === 0 && (
                      <div className="flex flex-col items-center py-8 text-slate-400 gap-2">
                        <File className="w-7 h-7 text-slate-300" />
                        <p className="text-sm">No documents uploaded yet.</p>
                      </div>
                    )}

                    {!docsLoading && docs.map(doc => (
                      <div key={doc.id}
                        className="flex items-center gap-3 p-3 bg-white border border-slate-200 rounded-xl hover:shadow-sm transition-all"
                      >
                        <div className="p-3 bg-red-50 rounded-xl shrink-0 border border-red-100">
                          <FileText className="w-6 h-6 text-red-500" />
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-bold text-slate-800 truncate">{doc.title}</p>
                          <p className="text-xs text-slate-500 truncate">{doc.file_name}</p>
                          <p className="text-[10px] text-slate-400 mt-0.5">
                            {formatBytes(doc.file_size)} • {new Date(doc.uploaded_at).toLocaleDateString('en-IN', {
                              day: '2-digit', month: 'short', year: 'numeric',
                            })}
                          </p>
                        </div>
                        <div className="flex items-center gap-1.5 shrink-0">
                          <button
                            onClick={() => handleDocPreview(doc)}
                            disabled={previewLoadingId === doc.id}
                            title="View PDF"
                            className="p-2 bg-slate-800 text-white hover:bg-black rounded-lg transition-all border border-slate-700 disabled:opacity-50"
                          >
                            {previewLoadingId === doc.id
                              ? <Loader2 className="w-3.5 h-3.5 animate-spin" />
                              : <Eye className="w-3.5 h-3.5" />
                            }
                          </button>
                          <button
                            onClick={() => handleDocDownload(doc)}
                            disabled={downloadingDocId === doc.id}
                            title="Download"
                            className="p-2 bg-teal-50 text-teal-600 hover:bg-teal-600 hover:text-white rounded-lg transition-all border border-teal-100 disabled:opacity-50"
                          >
                            {downloadingDocId === doc.id
                              ? <Loader2 className="w-3.5 h-3.5 animate-spin" />
                              : <Download className="w-3.5 h-3.5" />
                            }
                          </button>
                          <button
                            onClick={() => handleDocDelete(doc)}
                            disabled={deletingDocId === doc.id}
                            title="Delete"
                            className="p-2 bg-red-500 text-white hover:bg-red-600 rounded-lg transition-all border border-red-500 disabled:opacity-50"
                          >
                            {deletingDocId === doc.id
                              ? <Loader2 className="w-3.5 h-3.5 animate-spin" />
                              : <Trash2 className="w-3.5 h-3.5" />
                            }
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                </>
              )}
            </div>
          )}

          {/* ── Tab 7: Login (Teachers only) ── */}
          {activeTab === LOGIN_TAB_IDX && isTeacher && (
            <div className="space-y-5">
              {!staff ? (
                <div className="flex flex-col items-center justify-center py-10 text-slate-400 gap-3">
                  <KeyRound className="w-8 h-8 text-slate-300" />
                  <p className="text-sm text-center">Save the staff member first, then set login credentials.</p>
                </div>
              ) : (
                <>
                  {hasLogin ? (
                    <div className="bg-emerald-50 border border-emerald-200 rounded-xl p-4 space-y-3">
                      <div className="flex items-start justify-between gap-3">
                        <div className="flex items-start gap-3">
                          <ShieldCheck className="w-5 h-5 text-emerald-600 shrink-0 mt-0.5" />
                          <div className="space-y-1.5">
                            <p className="text-sm font-semibold text-emerald-800">Login Active</p>
                            <p className="text-xs text-emerald-600">
                              {staff.name} signs in with <strong>{staff.email}</strong>
                            </p>
                            {existingAssignments.filter(a => a.type === 'class_teacher').map(a => (
                              <div key={a.id} className="flex items-center gap-1.5 text-xs text-emerald-700">
                                <School className="w-3.5 h-3.5 text-emerald-500 shrink-0" />
                                Class Teacher of <strong>{a.standard}</strong>
                              </div>
                            ))}
                            {existingAssignments.filter(a => a.type === 'subject_teacher').map(a => (
                              <div key={a.id} className="flex items-center gap-1.5 text-xs text-emerald-700">
                                <BookOpen className="w-3.5 h-3.5 text-emerald-500 shrink-0" />
                                {a.subjects?.name} in <strong>{a.standard}</strong>
                              </div>
                            ))}
                          </div>
                        </div>
                        <button
                          onClick={() => setEditingAssignments(e => !e)}
                          className={`shrink-0 flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium rounded-lg border transition-colors ${
                            editingAssignments
                              ? 'bg-slate-100 text-slate-600 border-slate-300 hover:bg-slate-200'
                              : 'bg-white text-emerald-700 border-emerald-300 hover:bg-emerald-100'
                          }`}
                        >
                          <Pencil className="w-3.5 h-3.5" />
                          {editingAssignments ? 'Cancel' : 'Edit Assignments'}
                        </button>
                      </div>

                      {editingAssignments && (
                        <div className="pt-3 border-t border-emerald-200 space-y-3">
                          {assignmentFormJSX}
                          <button
                            onClick={handleSaveAssignments}
                            disabled={assignSaving}
                            className="w-full h-9 flex items-center justify-center gap-2 text-sm font-semibold bg-emerald-600 text-white rounded-lg hover:bg-emerald-700 disabled:opacity-60 transition-colors"
                          >
                            {assignSaving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
                            {assignSaving ? 'Saving…' : 'Save Assignments'}
                          </button>
                        </div>
                      )}
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

                  {!hasLogin && assignmentFormJSX}

                  <div className="space-y-3">
                    <div>
                      <label className="block text-xs font-medium text-slate-600 mb-1">
                        Email Address <span className="text-red-500">*</span>
                      </label>
                      <input type="email" value={loginEmail} onChange={e => setLoginEmail(e.target.value)}
                        disabled={hasLogin} placeholder="teacher@school.com"
                        className={`${inputCls} ${hasLogin ? 'opacity-60 cursor-not-allowed bg-slate-50' : ''}`} />
                      {hasLogin && (
                        <p className="text-xs text-slate-400 mt-1">Email cannot be changed after login is created.</p>
                      )}
                    </div>

                    <div>
                      <label className="block text-xs font-medium text-slate-600 mb-1">
                        {hasLogin ? 'New Password' : 'Password'} <span className="text-red-500">*</span>
                      </label>
                      <input type="password" value={loginPassword} onChange={e => setLoginPassword(e.target.value)}
                        placeholder={hasLogin ? 'Enter new password…' : 'Min 6 characters'}
                        className={inputCls} />
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

        {/* ── Footer ── */}
        <div className="flex items-center justify-between px-6 py-4 border-t border-slate-100 bg-slate-50 rounded-b-2xl shrink-0">
          <div className="flex gap-1.5">
            {TABS.map((_, i) => (
              <button key={i} onClick={() => setActiveTab(i)}
                className={`w-2 h-2 rounded-full transition-colors ${
                  activeTab === i ? 'bg-teal-600' : 'bg-slate-300 hover:bg-slate-400'
                }`} />
            ))}
          </div>

          <div className="flex gap-2">
            <button onClick={onClose} className="h-9 px-4 text-sm text-slate-600 rounded-lg border border-slate-200 hover:bg-slate-100 transition-colors">
              Cancel
            </button>

            {activeTab < TABS.length - 1 && (
              <button onClick={() => setActiveTab(t => t + 1)}
                className="h-9 px-4 text-sm text-teal-700 bg-teal-50 border border-teal-200 hover:bg-teal-100 rounded-lg transition-colors">
                Next →
              </button>
            )}

            {activeTab !== DOC_TAB_IDX && activeTab !== LOGIN_TAB_IDX && (
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