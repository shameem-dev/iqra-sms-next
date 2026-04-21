'use client';

import { Staff } from '@/type/staff';
import { X, Pencil, MapPin, Phone, Calendar, GraduationCap, Briefcase, Heart, BookOpen, FolderKanban } from 'lucide-react';

// ─────────────────────────────────────────────
// CONSTANTS
// ─────────────────────────────────────────────
const LEAVE_LABELS: Record<string, string> = {
  annual:    'Annual Leave',
  sick:      'Sick Leave',
  casual:    'Casual Leave',
  maternity: 'Maternity Leave',
  paternity: 'Paternity Leave',
  unpaid:    'Unpaid Leave',
  emergency: 'Emergency Leave',
};


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

// ─────────────────────────────────────────────
// MAIN COMPONENT
// ─────────────────────────────────────────────
interface Props {
  staff: Staff;
  onClose: () => void;
  onEdit: (staff: Staff) => void;
}

export function StaffDetailDrawer({ staff, onClose, onEdit }: Props) {
  return (
    <div className="fixed inset-0 z-50 flex justify-end">
      <div className="absolute inset-0 bg-black/30 backdrop-blur-sm" onClick={onClose} />
      <div className="relative w-full max-w-md bg-white shadow-2xl flex flex-col h-full overflow-hidden">

        {/* Header */}
        <div className="bg-teal-600 px-6 py-5 text-white">
          <div className="flex items-start justify-between mb-4">
            <button onClick={onClose} className="p-1.5 rounded-lg hover:bg-teal-500 transition-colors">
              <X className="w-4 h-4" />
            </button>
            <button
              onClick={() => onEdit(staff)}
              className="flex items-center gap-1.5 px-3 py-1.5 bg-white/20 hover:bg-white/30 rounded-lg text-xs font-medium transition-colors"
            >
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

        {/* Body */}
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
            <Row label="Date of Birth"  value={fmt(staff.date_of_birth)} />
            <Row label="Date Joined"    value={fmt(staff.date_joined)} />
            <Row label="Date Left"      value={fmt(staff.date_left)} />
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
                    <span className="text-xs text-slate-600">{LEAVE_LABELS[l.leave_type]}</span>
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

        </div>
      </div>
    </div>
  );
}