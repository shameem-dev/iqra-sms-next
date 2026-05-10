'use client';

import { useState, useEffect, useMemo } from 'react';
import { Staff } from '@/type/staff';
import { createBrowserClient } from '@supabase/ssr';
import {
  X, Pencil, MapPin, Phone, Calendar, GraduationCap,
  Briefcase, Heart, BookOpen, FolderKanban,
  FileText, Download, Loader2, File, Eye,
} from 'lucide-react';

// ─────────────────────────────────────────────
// CONSTANTS
// ─────────────────────────────────────────────
const LEAVE_LABELS: Record<string, string> = {
  annual:    'Annual Leave',
  sick:      'Sick Leave',
  casual:    'Casual Leave',
  commuted:  'Commuted Leave',
  other:     'Other Leave',
  maternity: 'Maternity Leave',
  paternity: 'Paternity Leave',
  unpaid:    'Unpaid Leave',
  emergency: 'Emergency Leave',
};

// ─────────────────────────────────────────────
// TYPES
// ─────────────────────────────────────────────
interface StaffDocument {
  id: string;
  staff_id: string;
  title: string;
  file_name: string;
  file_path: string;
  file_size: number;
  uploaded_at: string;
}

// ─────────────────────────────────────────────
// SUB-COMPONENTS
// ─────────────────────────────────────────────
function Section({
  icon: Icon,
  title,
  children,
}: {
  icon: React.ElementType;
  title: string;
  children: React.ReactNode;
}) {
  return (
    <div className="mb-6">
      <div className="flex items-center gap-2 mb-3">
        <Icon className="w-4 h-4 text-teal-600" />
        <h3 className="text-sm font-bold text-slate-700">{title}</h3>
      </div>
      <div className="pl-6">{children}</div>
    </div>
  );
}

function Row({ label, value }: { label: string; value: React.ReactNode }) {
  return (
    <div className="flex justify-between items-start py-1.5 border-b border-slate-50 last:border-0">
      <span className="text-xs text-slate-500 w-36 shrink-0">{label}</span>
      <span className="text-xs text-slate-800 font-medium text-right">{value || '—'}</span>
    </div>
  );
}

// ─────────────────────────────────────────────
// HELPERS
// ─────────────────────────────────────────────
function fmt(d: string | null) {
  return d
    ? new Date(d).toLocaleDateString('en-GB', {
        day: '2-digit',
        month: 'short',
        year: 'numeric',
      })
    : '—';
}

function formatBytes(bytes: number) {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(2)} MB`;
}

// ─────────────────────────────────────────────
// MAIN COMPONENT
// ─────────────────────────────────────────────
interface Props {
  staff: Staff;
  onClose: () => void;
  onEdit: (staff: Staff) => void;
}

export function StaffDetailDrawer({ staff, onClose, onEdit }: Props) {
  const supabase = useMemo(() => createBrowserClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_DEFAULT_KEY!
  ), []);

  const [docs, setDocs]               = useState<StaffDocument[]>([]);
  const [docsLoading, setDocsLoading] = useState(false);
  const [downloadingId, setDownloadingId] = useState<string | null>(null);
  const [previewLoadingId, setPreviewLoadingId] = useState<string | null>(null);

  // Fetch documents whenever the staff changes
  useEffect(() => {
    if (!staff?.id) return;
    setDocsLoading(true);
    supabase
      .from('staff_documents')
      .select('*')
      .eq('staff_id', staff.id)
      .order('uploaded_at', { ascending: false })
      .then(({ data }) => {
        setDocs(data ?? []);
        setDocsLoading(false);
      });
  }, [staff?.id, supabase]);

  // ── Preview handler ──
  const handlePreview = async (doc: StaffDocument) => {
    setPreviewLoadingId(doc.id);
    const { data, error } = await supabase.storage
      .from('staff-documents')
      .createSignedUrl(doc.file_path, 300);

    if (!error && data?.signedUrl) {
      window.open(data.signedUrl, '_blank');
    }
    setPreviewLoadingId(null);
  };

  // ── Download handler ──
  const handleDownload = async (doc: StaffDocument) => {
    setDownloadingId(doc.id);
    const { data, error } = await supabase.storage
      .from('staff-documents')
      .createSignedUrl(doc.file_path, 60);

    if (!error && data?.signedUrl) {
      const a = document.createElement('a');
      a.href = data.signedUrl;
      a.download = doc.file_name;
      a.click();
    }
    setDownloadingId(null);
  };

  return (
    <div className="fixed inset-0 z-50 flex justify-end">
      <div className="absolute inset-0 bg-black/30 backdrop-blur-sm" onClick={onClose} />
      <div className="relative w-full max-w-md bg-white shadow-2xl flex flex-col h-full overflow-hidden">

        {/* ── Header ── */}
        <div className="bg-teal-600 px-6 py-5 text-white">
          <div className="flex items-start justify-between mb-4">
            <button onClick={onClose} className="p-1.5 rounded-lg hover:bg-teal-500 transition-colors">
              <X className="w-4 h-4" />
            </button>
            <button
              onClick={() => onEdit(staff)}
className="flex items-center gap-1.5 px-3 py-1.5 bg-blue-500 hover:bg-blue-400 rounded-lg text-xs font-medium transition-colors"            >
              <Pencil className="w-3.5 h-3.5" /> Edit
            </button>
          </div>
          <div className="flex items-center gap-4">
            <div className="w-14 h-14 rounded-2xl bg-white/20 flex items-center justify-center text-white font-bold text-xl">
              {staff.name.split(' ').map(n => n[0]).join('').slice(0, 2).toUpperCase()}
            </div>
            <div>
              <h2 className="text-lg font-bold">{staff.name}</h2>
              <p className="text-teal-200 text-sm">{staff.designation || 'No Designation'}</p>
              <p className="text-teal-100 text-xs mt-0.5">{staff.department || 'No Department'}</p>
            </div>
          </div>
          {staff.date_left && (
            <div className="mt-3 px-3 py-1 bg-white/20 rounded-full inline-block text-xs">
              Left on {fmt(staff.date_left)}
            </div>
          )}
        </div>

        {/* ── Body ── */}
        <div className="flex-1 overflow-y-auto px-6 py-5">

          <Section icon={MapPin} title="Personal Info">
            <Row label="Address" value={staff.address} />
            <Row
              label="Mobile"
              value={
                staff.mobile
                  ? <a href={`tel:${staff.mobile}`} className="text-teal-600 hover:underline">{staff.mobile}</a>
                  : null
              }
            />
            <Row label="Date of Birth" value={fmt(staff.date_of_birth)} />
            <Row label="Date Joined"   value={fmt(staff.date_joined)} />
            <Row label="Date Left"     value={fmt(staff.date_left)} />
          </Section>

          <Section icon={Briefcase} title="Financial Details">
            <Row label="Basic Salary" value={`₹ ${Number(staff.basic_salary).toLocaleString()}`} />
            <Row label="TA"           value={`₹ ${Number(staff.ta).toLocaleString()}`} />
            <Row
              label="Total Salary"
              value={<span className="text-teal-700 font-bold">₹ {Number(staff.total_salary).toLocaleString()}</span>}
            />
          </Section>

          <Section icon={Heart} title="Medical Reimbursement">
            <Row label="Used"      value={`₹ ${Number(staff.medical_used).toLocaleString()}`} />
            <Row label="Remaining" value={`₹ ${Number(staff.medical_remaining).toLocaleString()}`} />
          </Section>

          <Section icon={GraduationCap} title="Education">
            <Row label="Qualification" value={staff.edu_qualification} />
            <Row label="Certificate"   value={staff.certificate_option} />
          </Section>

          {(staff.trainings || []).length > 0 && (
            <Section icon={BookOpen} title="Trainings">
              {(staff.trainings || []).filter(t => t.source === 'outside').length > 0 && (
                <div className="mb-3">
                  <p className="text-xs text-slate-500 mb-1.5">Outside Iqrah</p>
                  <ul className="space-y-1">
                    {(staff.trainings || []).filter(t => t.source === 'outside').map(t => (
                      <li key={t.id} className="flex items-center gap-2 text-xs text-slate-700">
                        <span className="w-1.5 h-1.5 rounded-full bg-teal-400 shrink-0" />
                        {t.training_name}
                      </li>
                    ))}
                  </ul>
                </div>
              )}
              {(staff.trainings || []).filter(t => t.source === 'iqrah').length > 0 && (
                <div>
                  <p className="text-xs text-slate-500 mb-1.5">Through Iqrah</p>
                  <ul className="space-y-1">
                    {(staff.trainings || []).filter(t => t.source === 'iqrah').map(t => (
                      <li key={t.id} className="flex items-center gap-2 text-xs text-slate-700">
                        <span className="w-1.5 h-1.5 rounded-full bg-blue-400 shrink-0" />
                        {t.training_name}
                      </li>
                    ))}
                  </ul>
                </div>
              )}
            </Section>
          )}

          {(staff.projects || []).length > 0 && (
            <Section icon={FolderKanban} title="Projects">
              <ul className="space-y-1">
                {(staff.projects || []).map(p => (
                  <li key={p.id} className="flex items-center gap-2 text-xs text-slate-700">
                    <span className="w-1.5 h-1.5 rounded-full bg-purple-400 shrink-0" />
                    {p.project_name}
                  </li>
                ))}
              </ul>
            </Section>
          )}

          {(staff.leaves || []).length > 0 && (
            <Section icon={Calendar} title="Leaves">
              <div className="space-y-2">
                {(staff.leaves || []).map(l => (
                  <div key={l.id} className="flex items-center justify-between bg-slate-50 rounded-lg px-3 py-2">
                    <span className="text-xs text-slate-600">{LEAVE_LABELS[l.leave_type] ?? l.leave_type}</span>
                    <div className="flex items-center gap-2 text-xs">
                      <span className="text-orange-600">Used: {l.days_used}</span>
                      <span className="text-slate-300">|</span>
                      <span className="text-green-600">Left: {l.days_remaining}</span>
                    </div>
                  </div>
                ))}
              </div>
            </Section>
          )}

          {staff.remarks && (
            <Section icon={BookOpen} title="Remarks">
              <p className="text-xs text-slate-700 bg-slate-50 rounded-lg p-3 leading-relaxed">{staff.remarks}</p>
            </Section>
          )}

          {/* ── Documents Section ── */}
          <Section icon={FileText} title="Documents">
            {docsLoading ? (
              <div className="flex items-center gap-2 text-slate-400 text-xs py-3">
                <Loader2 className="w-3.5 h-3.5 animate-spin" /> Loading documents…
              </div>
            ) : docs.length === 0 ? (
              <div className="flex flex-col items-center py-5 text-slate-400 gap-2">
                <File className="w-6 h-6 text-slate-300" />
                <p className="text-xs">No documents uploaded yet.</p>
              </div>
            ) : (
              <div className="space-y-2">
                {docs.map(doc => (
                  <div
                    key={doc.id}
                    className="flex items-center gap-3 p-2.5 bg-white border border-slate-200 rounded-xl group hover:border-teal-200 hover:shadow-sm transition-all"
                  >
                    {/* Visual Placeholder (mimics thumbnail from image_81c0dd.png) */}
                    <div className="p-2 bg-red-50 border border-red-100 rounded-lg shrink-0">
                      <FileText className="w-4 h-4 text-red-500" />
                    </div>

                    {/* Info */}
                    <div className="flex-1 min-w-0">
                      <p className="text-xs font-bold text-slate-800 truncate">{doc.title}</p>
                      <p className="text-[10px] text-slate-400 truncate mt-0.5">
                        {formatBytes(doc.file_size)} • {new Date(doc.uploaded_at).toLocaleDateString('en-GB')}
                      </p>
                    </div>

                   {/* Action Buttons */}
<div className="flex items-center gap-1.5 shrink-0">
  {/* View */}
  <button
    onClick={() => handlePreview(doc)}
    disabled={previewLoadingId === doc.id}
    title="View PDF"
    className="p-1.5 bg-slate-800 text-white hover:bg-black border border-slate-700 rounded-lg transition-all disabled:opacity-50"
  >
    {previewLoadingId === doc.id
      ? <Loader2 className="w-3.5 h-3.5 animate-spin" />
      : <Eye className="w-3.5 h-3.5" />
    }
  </button>

  {/* Download */}
  <button
    onClick={() => handleDownload(doc)}
    disabled={downloadingId === doc.id}
    title="Download"
    className="p-1.5 bg-teal-50 text-teal-600 hover:bg-teal-600 hover:text-white border border-teal-100 rounded-lg transition-all disabled:opacity-50"
  >
    {downloadingId === doc.id
      ? <Loader2 className="w-3.5 h-3.5 animate-spin" />
      : <Download className="w-3.5 h-3.5" />
    }
  </button>
</div>
                  </div>
                ))}

                {/* Summary pill */}
                <p className="text-[10px] text-slate-400 text-right pt-1 italic">
                  {docs.length} document{docs.length !== 1 ? 's' : ''} • To upload/delete, use Edit
                </p>
              </div>
            )}
          </Section>

        </div>
      </div>
    </div>
  );
}