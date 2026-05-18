'use client'

import { useEffect, useState, useRef } from 'react'
import { AdmissionRecord } from '@/type/admission'
import {
  getAdmissions,
  addAdmission,
  updateAdmission,
  deleteAdmission,
} from '@/utils/actions/admissions'
import {
  SquarePen, Trash, Printer, RefreshCw,
  AlertTriangle, Download, KeyRound,
  Users, ChevronDown,
  Search, X, Plus,
} from 'lucide-react'

/* ─── Constants ────────────────────────────────────────────────────────── */
const STANDARDS = [
  "FS1 A", "FS1 B", "FS2 A", "FS2 B",
  "GRADE 1 A", "GRADE 2 A", "GRADE 2 B", "GRADE 3 A", "GRADE 4 A",
]
const VEHICLE_POINTS = [
  'Point 1', 'Point 2', 'Point 3', 'Point 4', 'Point 5',
  'Own Transport', 'Walking',
]

const EMPTY_FORM: AdmissionRecord = {
  admission_no: '', name: '', standard: '', date_of_birth: '',
  aadhar_no: '', parent_guardian: '', address: '', mobile_no: '',
  vehicle_point: '', gender: '',
}

/* ─── FIX: Explicit local type that includes parent auth fields ─────────
   Even if admission.ts is not yet updated, this ensures the page
   always carries parent_auth_user_id through state and rendering.        */
type AdmissionRecordWithAuth = AdmissionRecord & {
  parent_auth_user_id?: string | null
  parent_email?: string | null
}

/* ─── Style helpers ─────────────────────────────────────────────────────── */
const inputCls =
  'w-full bg-white border border-[#E2E8F0] text-[#0F172A] rounded-xl px-4 py-2.5 text-sm ' +
  'focus:outline-none focus:ring-2 focus:ring-[#6C63FF]/40 focus:border-[#6C63FF] ' +
  'placeholder-[#94A3B8] transition-all shadow-sm'

const selectCls = inputCls + ' appearance-none cursor-pointer'

/* ─── Sub-components ────────────────────────────────────────────────────── */
function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="flex flex-col gap-1.5">
      <label className="text-[11px] font-bold text-[#64748B] uppercase tracking-widest">
        {label}
      </label>
      {children}
    </div>
  )
}

function StatCard({ label, value, gradient, shadow }: { label: string; value: number; gradient: string; shadow: string }) {
  return (
    <div className={`relative overflow-hidden flex flex-col justify-between px-5 py-4 rounded-2xl ${gradient} shadow-lg ${shadow}`}>
      <div className="absolute -right-5 -top-5 w-24 h-24 rounded-full bg-white/10" />
      <div className="absolute right-3 bottom-2 w-12 h-12 rounded-full bg-black/10" />
      <div className="relative z-10">
        <p className="text-[10px] font-bold uppercase tracking-[.18em] text-white/60 mb-2">{label}</p>
        <p className="text-3xl font-black leading-none text-white">{value}</p>
      </div>
    </div>
  )
}

/* ─── CSV export ────────────────────────────────────────────────────────── */
function exportToExcel(data: AdmissionRecord[], filename = 'admissions.csv') {
  const headers = [
    'Admission No', 'Student Name', 'Standard', 'Gender',
    'Date of Birth', 'Aadhar No', 'Parent / Guardian',
    'Mobile No', 'Vehicle Point', 'Address',
  ]
  const rows = data.map(r => [
    r.admission_no, r.name, r.standard, r.gender, r.date_of_birth,
    r.aadhar_no, r.parent_guardian, r.mobile_no, r.vehicle_point || '',
    `"${r.address.replace(/"/g, '""')}"`,
  ])
  const csv = [headers, ...rows].map(row => row.join(',')).join('\n')
  const blob = new Blob(['\uFEFF' + csv], { type: 'text/csv;charset=utf-8;' })
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url; a.download = filename; a.click()
  URL.revokeObjectURL(url)
}

/* ═══════════════════════════════════════════════════════════════════════ */
export default function AdmissionRegisterPage() {
  const printRef = useRef<HTMLDivElement>(null)

  // FIX: All record state uses AdmissionRecordWithAuth so parent_auth_user_id
  // is preserved from getAdmissions() all the way to the Login badge render.
  const [records, setRecords]                     = useState<AdmissionRecordWithAuth[]>([])
  const [filtered, setFiltered]                   = useState<AdmissionRecordWithAuth[]>([])
  const [search, setSearch]                       = useState('')
  const [filterStd, setFilterStd]                 = useState('')
  const [filterGender, setFilterGender]           = useState('')
  const [showForm, setShowForm]                   = useState(false)
  const [editId, setEditId]                       = useState<number | null>(null)
  const [form, setForm]                           = useState<AdmissionRecord>(EMPTY_FORM)
  const [loading, setLoading]                     = useState(false)
  const [saving, setSaving]                       = useState(false)
  const [error, setError]                         = useState('')
  const [printRecord, setPrintRecord]             = useState<AdmissionRecord | null>(null)
  const [deleteConfirm, setDeleteConfirm]         = useState<AdmissionRecordWithAuth | null>(null)
  const [deleteConfirmName, setDeleteConfirmName] = useState('')
  const [generatingLogins, setGeneratingLogins]   = useState(false)
  const [genResult, setGenResult]                 = useState<{ created: number; failed: number } | null>(null)

  /* ─── Load records ──────────────────────────────────────────────────── */
  async function loadRecords() {
    setLoading(true)
    try {
      // getAdmissions returns the raw DB rows including parent_auth_user_id.
      // We cast to AdmissionRecordWithAuth so the field survives into state.
      const data = await getAdmissions() as AdmissionRecordWithAuth[]
      setRecords(data)
      setFiltered(data)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load records')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => { loadRecords() }, [])

  /* ─── Filter effect ─────────────────────────────────────────────────── */
  useEffect(() => {
    let r = [...records]
    if (search) {
      const q = search.toLowerCase()
      r = r.filter(x =>
        x.name.toLowerCase().includes(q) ||
        x.admission_no.toLowerCase().includes(q) ||
        x.mobile_no.includes(q)
      )
    }
    if (filterStd)    r = r.filter(x => x.standard === filterStd)
    if (filterGender) r = r.filter(x => x.gender   === filterGender)
    setFiltered(r)
  }, [search, filterStd, filterGender, records])

  const boyCount  = filtered.filter(r => r.gender === 'Male').length
  const girlCount = filtered.filter(r => r.gender === 'Female').length

  /* ─── Form helpers ──────────────────────────────────────────────────── */
  function openAdd()  { setForm(EMPTY_FORM); setEditId(null); setShowForm(true); setError('') }
  function openEdit(r: AdmissionRecord) { setForm({ ...r }); setEditId(r.id ?? null); setShowForm(true); setError('') }
  function closeForm() { setShowForm(false); setForm(EMPTY_FORM); setEditId(null); setError('') }

  function validate(): boolean {
    const req: (keyof AdmissionRecord)[] = [
      'admission_no', 'name', 'standard', 'date_of_birth',
      'aadhar_no', 'parent_guardian', 'address', 'mobile_no', 'gender',
    ]
    for (const k of req) {
      if (!form[k]) { setError(`${k.replace(/_/g, ' ')} is required.`); return false }
    }
    if (!/^\d{12}$/.test(form.aadhar_no)) { setError('Aadhar number must be exactly 12 digits.'); return false }
    if (!/^\d{10}$/.test(form.mobile_no)) { setError('Mobile number must be exactly 10 digits.');  return false }
    return true
  }

  /* ─── Save (add or edit) ────────────────────────────────────────────── */
  async function handleSave() {
    if (!validate()) return
    setSaving(true); setError('')
    try {
      if (editId) {
        const { id, ...safe } = form
        await updateAdmission(editId, safe)
      } else {
        await addAdmission(form)
      }
      closeForm(); await loadRecords()
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Failed to save record')
    } finally {
      setSaving(false)
    }
  }

  /* ─── Delete ────────────────────────────────────────────────────────── */
  async function handleDelete(id: number) {
    try {
      await deleteAdmission(id)
      await loadRecords()
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Failed to delete record')
    } finally {
      setDeleteConfirm(null)
      setDeleteConfirmName('')
    }
  }

  /* ─── Print single student ──────────────────────────────────────────── */
  function handlePrint(r: AdmissionRecord) {
    setPrintRecord(r)
    setTimeout(() => { window.print(); setPrintRecord(null) }, 300)
  }

  /* ─── CSV download ──────────────────────────────────────────────────── */
  function handleExcelDownload() {
    const parts = [filterGender, filterStd].filter(Boolean).join('_').replace(/\s/g, '_')
    exportToExcel(filtered, parts ? `admissions_${parts}.csv` : 'admissions_all.csv')
  }

  /* ─── Generate all parent logins ────────────────────────────────────── */
  async function handleGenerateAllLogins() {
    setGeneratingLogins(true)
    setGenResult(null)
    setError('')
    try {
      // NOTE: URL matches your actual folder name `create-parent-user`
      const res = await fetch('/api/admin/create-parent-user', { method: 'POST' })
      if (!res.ok) throw new Error(`Server error: ${res.status}`)
      const json = await res.json()
      setGenResult({ created: json.created ?? 0, failed: json.failed ?? 0 })
      // Reload so Login badges update immediately after generation
      await loadRecords()
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to generate logins')
    } finally {
      setGeneratingLogins(false)
    }
  }

  /* ─── Print login cards for all students ───────────────────────────── */
  function handlePrintLoginCards() {
    
    const cards = records.map(r => {
  const paddedId = String(r.admission_no).padEnd(6, '0');
  
  return `
    <div class="card">
      <div class="school">IQRAH SCHOOL — Parent Login Card</div>
      <div class="name">${r.name}</div>
      <div class="meta">Admission No: <strong>${r.admission_no}</strong> &nbsp;|&nbsp; Class: <strong>${r.standard}</strong></div>
      <div class="cred-box">
        <div class="cred-title">Login Credentials</div>
        <div class="cred-row"><span class="label">Email</span><span class="value">${r.admission_no}@iqra.school</span></div>
        <div class="cred-row"><span class="label">Password</span><span class="value">${paddedId}</span></div>
      </div>
      <div class="note">Login at: <strong>https://iqra-sms-next.vercel.app/login</strong></div>
    </div>`;
}).join('');
    const win = window.open('', '_blank')
    if (!win) return
    win.document.write(`<!DOCTYPE html><html><head><title>Parent Login Cards</title>
      <style>
        *{margin:0;padding:0;box-sizing:border-box}
        body{font-family:Arial,sans-serif;background:#fff;padding:12px}
        .grid{display:grid;grid-template-columns:repeat(2,1fr);gap:10px}
        .card{border:1.5px solid #6366f1;border-radius:10px;padding:12px 14px;page-break-inside:avoid;background:#fff}
        .school{font-size:9px;font-weight:bold;color:#6366f1;text-transform:uppercase;letter-spacing:.5px;margin-bottom:6px}
        .name{font-size:15px;font-weight:bold;color:#1e293b;margin-bottom:2px}
        .meta{font-size:10px;color:#64748b;margin-bottom:8px}
        .cred-box{background:#eef2ff;border:1px solid #c7d2fe;border-radius:6px;padding:8px 10px;margin-bottom:6px}
        .cred-title{font-size:9px;font-weight:bold;color:#3730a3;text-transform:uppercase;letter-spacing:.5px;margin-bottom:5px}
        .cred-row{display:flex;justify-content:space-between;margin-bottom:3px}
        .label{font-size:10px;color:#475569}
        .value{font-size:11px;font-weight:bold;color:#1e293b;font-family:monospace}
        .note{font-size:9px;color:#94a3b8}
        @media print{body{-webkit-print-color-adjust:exact;print-color-adjust:exact}@page{margin:8mm;size:A4}}
      </style></head><body>
      <div class="grid">${cards}</div>
      <script>window.onload=()=>{window.print();window.close()}<\/script>
      </body></html>`)
    win.document.close()
  }

  /* ─── Gender display helper ─────────────────────────────────────────── */
  function genderLabel(g: string) {
    if (g === 'Male')   return 'Boy'
    if (g === 'Female') return 'Girl'
    return g || '—'
  }

  /* ════════════════════════════ RENDER ════════════════════════════════════ */
  return (
    <div className="min-h-screen font-sans" style={{ background: '#F7F8FC' }}>

      {/* ── Single-student print view ── */}
      {printRecord && (
        <div ref={printRef} className="hidden print:block fixed inset-0 bg-white p-10 text-black z-50">
          <div className="border-2 border-slate-800 p-8 max-w-2xl mx-auto rounded-2xl">
            <div className="text-center mb-6 border-b pb-4 border-slate-300">
              <h1 className="text-2xl font-bold tracking-wide uppercase">Admission Extract</h1>
              <p className="text-sm text-slate-500 mt-1">Iqrah School Management System</p>
            </div>
            <div className="grid grid-cols-2 gap-x-8 gap-y-4 text-sm">
              {([
                ['Admission No.', printRecord.admission_no],
                ['Student Name',  printRecord.name],
                ['Standard',      printRecord.standard],
                ['Gender',        genderLabel(printRecord.gender)],
                ['Date of Birth', printRecord.date_of_birth],
                ['Aadhar No.',    printRecord.aadhar_no],
                ['Parent / Guardian', printRecord.parent_guardian],
                ['Mobile No.',    printRecord.mobile_no],
                ['Vehicle Point', printRecord.vehicle_point || '—'],
                ['Address',       printRecord.address],
              ] as [string, string][]).map(([label, value]) => (
                <div key={label} className={label === 'Address' ? 'col-span-2' : ''}>
                  <p className="text-slate-400 text-xs uppercase tracking-wider mb-0.5">{label}</p>
                  <p className="font-semibold text-slate-800">{value}</p>
                </div>
              ))}
            </div>
            <div className="mt-10 pt-4 border-t border-slate-200 flex justify-between text-xs text-slate-400">
              <span>Generated: {new Date().toLocaleDateString('en-IN')}</span>
              <span>Adm. No: {printRecord.admission_no}</span>
            </div>
          </div>
        </div>
      )}

      {/* ═══════════════════════ MAIN UI ═══════════════════════════════════ */}
      <div className="max-w-screen-xl mx-auto px-4 sm:px-6 py-8 print:hidden">

        {/* ── Header ── */}
        <div className="mb-8">
          <div className="flex flex-wrap items-center justify-end gap-4 mb-6">
            <div className="flex items-center gap-2 flex-wrap">

              <button
                onClick={handleExcelDownload}
                disabled={filtered.length === 0}
                className="inline-flex items-center gap-2 h-9 px-4 rounded-xl border border-[#BBF7D0] bg-[#F0FDF4] text-[#15803D] hover:bg-[#DCFCE7] disabled:opacity-40 text-xs font-bold transition-all"
              >
                <Download className="w-3.5 h-3.5" /> Export CSV
              </button>

              <button
                onClick={handleGenerateAllLogins}
                disabled={generatingLogins}
                className="inline-flex items-center gap-2 h-9 px-4 rounded-xl border border-[#FDE68A] bg-[#FFFBEB] text-[#B45309] hover:bg-[#FEF3C7] disabled:opacity-50 text-xs font-bold transition-all"
              >
                <KeyRound className="w-3.5 h-3.5" />
                {generatingLogins ? 'Generating…' : 'Generate Logins'}
              </button>

              <button
                onClick={handlePrintLoginCards}
                className="inline-flex items-center gap-2 h-9 px-4 rounded-xl border border-[#DDD6FE] bg-[#F5F3FF] text-[#6D28D9] hover:bg-[#EDE9FE] text-xs font-bold transition-all"
              >
                <Printer className="w-3.5 h-3.5" /> Login Cards
              </button>

              <button
                onClick={loadRecords}
                className="h-9 w-9 inline-flex items-center justify-center rounded-xl border border-[#E2E8F0] bg-white text-[#94A3B8] hover:text-[#6C63FF] hover:border-[#6C63FF]/30 transition-all shadow-sm"
                title="Refresh"
              >
                <RefreshCw className="w-4 h-4" />
              </button>

              <button
                onClick={openAdd}
                className="inline-flex items-center gap-2 h-9 px-5 rounded-xl text-white text-xs font-bold shadow-lg transition-all hover:opacity-90 active:scale-95"
                style={{ background: 'linear-gradient(135deg, #6C63FF 0%, #4F46E5 100%)', boxShadow: '0 4px 14px rgba(108,99,255,0.35)' }}
              >
                <Plus className="w-4 h-4" /> Add Student
              </button>
            </div>
          </div>

{/* ── Stat cards ── */}
<div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
  <StatCard
    label="Total Students"
    value={filtered.length}
    gradient="bg-[linear-gradient(135deg,_#7C3AED_0%,_#4F46E5_55%,_#3730A3_100%)]"
    shadow="shadow-violet-200"
  />
  <StatCard
    label="Boys"
    value={boyCount}
    gradient="bg-[linear-gradient(135deg,_#2563EB_0%,_#0D9488_55%,_#0891B2_100%)]"
    shadow="shadow-blue-200"
  />
  <StatCard
    label="Girls"
    value={girlCount}
    gradient="bg-[linear-gradient(135deg,_#DB2777_0%,_#EC4899_55%,_#9333EA_100%)]"
    shadow="shadow-pink-200"
  />
  <StatCard
    label="Active Logins"
    value={records.filter(r => !!r.parent_auth_user_id).length}
    gradient="bg-[linear-gradient(135deg,_#059669_0%,_#0D9488_55%,_#0891B2_100%)]"
    shadow="shadow-emerald-200"
  />
</div>
        </div>

        {/* ── Error banner ── */}
        {error && (
          <div className="mb-5 flex items-center gap-3 px-4 py-3 bg-[#FEF2F2] border border-[#FECACA] rounded-2xl text-sm text-[#DC2626]">
            <AlertTriangle className="w-4 h-4 shrink-0" />
            <span>{error}</span>
            <button onClick={() => setError('')} className="ml-auto">
              <X className="w-4 h-4" />
            </button>
          </div>
        )}

        {/* ── Login-gen result banner ── */}
        {genResult && (
          <div className="mb-5 flex items-center gap-3 px-4 py-3 bg-[#F0FDF4] border border-[#BBF7D0] rounded-2xl text-sm text-[#166534]">
            {genResult.created > 0
              ? <span>Created <strong>{genResult.created}</strong> parent login{genResult.created !== 1 ? 's' : ''}</span>
              : <span>All students already have parent logins</span>
            }
            {genResult.failed > 0 && (
              <span className="text-red-600 ml-2">({genResult.failed} failed)</span>
            )}
            <button onClick={() => setGenResult(null)} className="ml-auto text-[#4ADE80] hover:text-[#16A34A] transition-colors">
              <X className="w-4 h-4" />
            </button>
          </div>
        )}

        {/* ── Filters ── */}
        <div className="flex flex-col sm:flex-row gap-3 mb-5">
          <div className="relative flex-1">
            <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-[#94A3B8] pointer-events-none" />
            <input
              type="text"
              placeholder="Search by name, admission no, or mobile…"
              value={search}
              onChange={e => setSearch(e.target.value)}
              className="w-full pl-10 pr-4 py-2.5 bg-white border border-[#E2E8F0] rounded-xl text-sm text-[#0F172A] placeholder-[#94A3B8] focus:outline-none focus:ring-2 focus:ring-[#6C63FF]/30 focus:border-[#6C63FF] transition-all shadow-sm"
            />
            {search && (
              <button onClick={() => setSearch('')} className="absolute right-3 top-1/2 -translate-y-1/2 text-[#94A3B8] hover:text-[#475569]">
                <X className="w-3.5 h-3.5" />
              </button>
            )}
          </div>

          <div className="relative">
            <select
              value={filterStd}
              onChange={e => setFilterStd(e.target.value)}
              className="h-10 pl-3 pr-8 bg-white border border-[#E2E8F0] rounded-xl text-sm text-[#334155] focus:outline-none focus:ring-2 focus:ring-[#6C63FF]/30 appearance-none cursor-pointer min-w-[160px] shadow-sm"
            >
              <option value="">All Standards</option>
              {STANDARDS.map(s => <option key={s} value={s}>{s}</option>)}
            </select>
            <ChevronDown className="absolute right-2.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-[#94A3B8] pointer-events-none" />
          </div>

          <div className="relative">
            <select
              value={filterGender}
              onChange={e => setFilterGender(e.target.value)}
              className="h-10 pl-3 pr-8 bg-white border border-[#E2E8F0] rounded-xl text-sm text-[#334155] focus:outline-none focus:ring-2 focus:ring-[#6C63FF]/30 appearance-none cursor-pointer min-w-[130px] shadow-sm"
            >
              <option value="">All</option>
              <option value="Male">Boys</option>
              <option value="Female">Girls</option>
            </select>
            <ChevronDown className="absolute right-2.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-[#94A3B8] pointer-events-none" />
          </div>

          {(search || filterStd || filterGender) && (
            <button
              onClick={() => { setSearch(''); setFilterStd(''); setFilterGender('') }}
              className="inline-flex items-center gap-1.5 h-10 px-3 rounded-xl border border-[#E2E8F0] bg-white text-[#64748B] hover:text-[#334155] text-sm transition-colors shadow-sm"
            >
              <X className="w-3.5 h-3.5" /> Clear
            </button>
          )}
        </div>

        {/* ── Table ── */}
        <div className="bg-white rounded-2xl border border-[#E2E8F0] shadow-sm overflow-hidden">
          {loading ? (
            <div className="py-20 text-center">
              <div className="inline-flex items-center gap-2 text-[#94A3B8] text-sm">
                <RefreshCw className="w-4 h-4 animate-spin" /> Loading records…
              </div>
            </div>
          ) : filtered.length === 0 ? (
            <div className="py-20 text-center">
              <Users className="w-10 h-10 text-[#E2E8F0] mx-auto mb-3" />
              <p className="text-[#94A3B8] text-sm font-semibold">No records found</p>
              <p className="text-[#CBD5E1] text-xs mt-1">Try adjusting your filters or add a student</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr style={{ background: '#F8F9FF', borderBottom: '1.5px solid #EEF0FF' }}>
                    {[
                      'Adm. No', 'Student Name', 'Standard', 'Gender',
                      'Date of Birth', 'Guardian', 'Mobile',
                      'Vehicle Point', 'Login', 'Actions',
                    ].map(h => (
                      <th
                        key={h}
                        className="px-4 py-3.5 text-left text-[10px] font-extrabold text-[#94A3B8] uppercase tracking-widest whitespace-nowrap first:pl-5 last:pr-5"
                      >
                        {h}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {filtered.map((r, idx) => (
                    <tr
                      key={r.id}
                      className="transition-colors hover:bg-[#F8F9FF] group"
                      style={{ borderBottom: idx < filtered.length - 1 ? '1px solid #F1F5F9' : 'none' }}
                    >
                      {/* Admission No */}
                      <td className="px-4 py-3.5 pl-5">
                        <span className="font-mono text-xs font-black text-[#6C63FF] bg-[#EEF0FF] px-2.5 py-1 rounded-lg">
                          {r.admission_no}
                        </span>
                      </td>

                      {/* Name */}
                      <td className="px-4 py-3.5">
                        <span className="font-bold text-[#0F172A] whitespace-nowrap">{r.name}</span>
                      </td>

                      {/* Standard */}
                      <td className="px-4 py-3.5">
                        <span className="text-xs font-bold bg-[#F1F5F9] text-[#475569] px-2.5 py-1 rounded-lg whitespace-nowrap">
                          {r.standard}
                        </span>
                      </td>

                      {/* Gender */}
                      <td className="px-4 py-3.5">
                        <span className={`inline-flex items-center text-xs font-bold px-2.5 py-1 rounded-lg whitespace-nowrap ${
                          r.gender === 'Male'
                            ? 'bg-[#EFF6FF] text-[#1D4ED8]'
                            : r.gender === 'Female'
                              ? 'bg-[#FDF2F8] text-[#BE185D]'
                              : 'bg-[#F1F5F9] text-[#475569]'
                        }`}>
                          {genderLabel(r.gender)}
                        </span>
                      </td>

                      {/* DOB */}
                      <td className="px-4 py-3.5 text-[#64748B] whitespace-nowrap text-xs font-medium">
                        {r.date_of_birth}
                      </td>

                      {/* Parent */}
                      <td className="px-4 py-3.5 text-[#334155] whitespace-nowrap text-sm">
                        {r.parent_guardian}
                      </td>

                      {/* Mobile */}
                      <td className="px-4 py-3.5">
                        <span className="font-mono text-xs text-[#64748B]">{r.mobile_no}</span>
                      </td>

                      {/* Vehicle */}
                      <td className="px-4 py-3.5 text-[#64748B] text-xs whitespace-nowrap">
                        {r.vehicle_point || <span className="text-[#CBD5E1]">—</span>}
                      </td>

                      {/* ── Login status badge ──────────────────────────────
                          FIX: r is typed as AdmissionRecordWithAuth so
                          parent_auth_user_id is available here without
                          TypeScript stripping it.                          */}
                      <td className="px-4 py-3.5">
                        {r.parent_auth_user_id ? (
                          <span
                            title={`Email: ${r.parent_email ?? r.admission_no + '@iqra.school'}`}
                            className="inline-flex items-center gap-1 text-[10px] font-extrabold text-[#15803D] bg-[#F0FDF4] border border-[#BBF7D0] px-2.5 py-1 rounded-lg uppercase tracking-wide cursor-default"
                          >
                             Active
                          </span>
                        ) : (
                          <span className="inline-flex items-center gap-1 text-[10px] font-extrabold text-[#B45309] bg-[#FFFBEB] border border-[#FDE68A] px-2.5 py-1 rounded-lg uppercase tracking-wide">
                            None
                          </span>
                        )}
                      </td>

                      {/* Actions */}
                      <td className="px-4 py-3.5 pr-5">
                        <div className="flex items-center gap-1">
                          <button
                            onClick={() => openEdit(r)}
                            className="p-1.5 rounded-lg text-white transition-all hover:scale-105 active:scale-95"
                            style={{ background: 'linear-gradient(135deg,#3B82F6,#1D4ED8)' }}
                            title="Edit"
                          >
                            <SquarePen size={14} strokeWidth={2} />
                          </button>
                          <button
                            onClick={() => handlePrint(r)}
                            className="p-1.5 rounded-lg text-white transition-all hover:scale-105 active:scale-95"
                            style={{ background: 'linear-gradient(135deg,#64748B,#475569)' }}
                            title="Print Extract"
                          >
                            <Printer size={14} strokeWidth={2} />
                          </button>
                          <button
                            onClick={() => { setDeleteConfirm(r); setDeleteConfirmName('') }}
                            className="p-1.5 rounded-lg text-white transition-all hover:scale-105 active:scale-95"
                            style={{ background: 'linear-gradient(135deg,#EF4444,#B91C1C)' }}
                            title="Delete"
                          >
                            <Trash size={14} strokeWidth={2} />
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

        {filtered.length > 0 && (
          <p className="text-xs text-[#94A3B8] mt-3 text-right font-medium">
            Showing {filtered.length} of {records.length} records
          </p>
        )}
      </div>

      {/* ══════════════════ Add / Edit Modal ════════════════════════════════ */}
      {showForm && (
        <div className="fixed inset-0 z-40 flex items-center justify-center p-4 bg-black/40 backdrop-blur-sm print:hidden">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-2xl max-h-[92vh] flex flex-col overflow-hidden border border-[#E2E8F0]">

            {/* Modal header */}
            <div
              className="flex items-center justify-between px-6 py-4"
              style={{ borderBottom: '1px solid #F1F5F9', background: 'linear-gradient(135deg,#F8F9FF 0%,#F3F0FF 100%)' }}
            >
              <div>
                <h2 className="text-base font-black text-[#0F172A]">
                  {editId ? 'Edit Student Record' : 'New Admission'}
                </h2>
                <p className="text-xs text-[#64748B] mt-0.5">
                  {editId ? 'Update the student details below' : 'Fill in the student details to register'}
                </p>
              </div>
              <button
                onClick={closeForm}
                className="text-[#94A3B8] hover:text-[#334155] p-1.5 rounded-xl hover:bg-[#F1F5F9] transition-colors"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Modal body */}
            <div className="flex-1 overflow-y-auto px-6 py-5 space-y-5">
              {!editId && (
                <div className="flex items-start gap-3 p-3.5 bg-[#F5F3FF] border border-[#DDD6FE] rounded-xl">
                  <KeyRound className="w-4 h-4 text-[#6C63FF] mt-0.5 shrink-0" />
                  <p className="text-xs text-[#4C1D95] leading-relaxed">
                    A parent login will be <strong>automatically created</strong> when this student is added.
                    <br />
                    Login: <strong>{form.admission_no || '<adm_no>'}@iqra.school</strong>
                    &nbsp;/&nbsp;
                    Password: <strong>{form.admission_no || '<adm_no>'}</strong>
                  </p>
                </div>
              )}

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <Field label="Admission No. *">
                  <input type="text" value={form.admission_no}
                    onChange={e => setForm({ ...form, admission_no: e.target.value })}
                    placeholder="e.g. 2025001" className={inputCls} />
                </Field>

                <Field label="Student Name *">
                  <input type="text" value={form.name}
                    onChange={e => setForm({ ...form, name: e.target.value.toUpperCase() })}
                    placeholder="Full name" className={inputCls} />
                </Field>

                <Field label="Standard *">
                  <div className="relative">
                    <select value={form.standard}
                      onChange={e => setForm({ ...form, standard: e.target.value })}
                      className={selectCls}>
                      <option value="">Select standard</option>
                      {STANDARDS.map(s => <option key={s} value={s}>{s}</option>)}
                    </select>
                    <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-[#94A3B8] pointer-events-none" />
                  </div>
                </Field>

                <Field label="Gender *">
                  <div className="relative">
                    <select value={form.gender}
                      onChange={e => setForm({ ...form, gender: e.target.value })}
                      className={selectCls}>
                      <option value="">Select gender</option>
                      <option value="Male">Boy</option>
                      <option value="Female">Girl</option>
                    </select>
                    <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-[#94A3B8] pointer-events-none" />
                  </div>
                </Field>

                <Field label="Date of Birth *">
                  <input type="date" value={form.date_of_birth}
                    onChange={e => setForm({ ...form, date_of_birth: e.target.value })}
                    className={inputCls} />
                </Field>

                <Field label="Aadhar No. *">
                  <input type="text" value={form.aadhar_no}
                    onChange={e => setForm({ ...form, aadhar_no: e.target.value.replace(/\D/g, '').slice(0, 12) })}
                    placeholder="12-digit number" maxLength={12} className={inputCls} />
                </Field>

                <Field label="Mobile No. *">
                  <input type="tel" value={form.mobile_no}
                    onChange={e => setForm({ ...form, mobile_no: e.target.value.replace(/\D/g, '').slice(0, 10) })}
                    placeholder="10-digit mobile" maxLength={10} className={inputCls} />
                </Field>

                <Field label="Parent / Guardian *">
                  <input type="text" value={form.parent_guardian}
                    onChange={e => setForm({ ...form, parent_guardian: e.target.value })}
                    placeholder="Father / Mother / Guardian name" className={inputCls} />
                </Field>

                <Field label="Vehicle Point">
                  <div className="relative">
                    <select value={form.vehicle_point}
                      onChange={e => setForm({ ...form, vehicle_point: e.target.value })}
                      className={selectCls}>
                      <option value="">Select point</option>
                      {VEHICLE_POINTS.map(v => <option key={v} value={v}>{v}</option>)}
                    </select>
                    <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-[#94A3B8] pointer-events-none" />
                  </div>
                </Field>

                <div className="sm:col-span-2">
                  <Field label="Address *">
                    <textarea value={form.address}
                      onChange={e => setForm({ ...form, address: e.target.value })}
                      placeholder="Full residential address" rows={3}
                      className={inputCls + ' resize-none'} />
                  </Field>
                </div>
              </div>

              {error && (
                <div className="flex items-center gap-2.5 bg-[#FEF2F2] border border-[#FECACA] text-[#DC2626] text-sm rounded-xl px-4 py-3">
                  <AlertTriangle className="w-4 h-4 shrink-0" />
                  {error}
                </div>
              )}
            </div>

            {/* Modal footer */}
            <div className="flex items-center justify-end gap-3 px-6 py-4 border-t border-[#F1F5F9] bg-[#F8F9FF]">
              <button
                onClick={closeForm}
                className="px-4 py-2 text-sm font-semibold text-[#64748B] hover:bg-[#F1F5F9] rounded-xl transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={handleSave}
                disabled={saving}
                className="px-6 py-2 text-sm font-bold text-white rounded-xl transition-all hover:opacity-90 disabled:opacity-50 active:scale-95"
                style={{ background: 'linear-gradient(135deg,#6C63FF 0%,#4F46E5 100%)', boxShadow: '0 4px 12px rgba(108,99,255,0.3)' }}
              >
                {saving ? 'Saving…' : editId ? 'Save Changes' : 'Add Student'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ══════════════════ Delete Confirm Modal ════════════════════════════ */}
      {deleteConfirm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 backdrop-blur-sm print:hidden">
          <div className="bg-white rounded-2xl shadow-2xl p-6 w-full max-w-sm border border-[#E2E8F0]">
            <div className="flex items-center gap-3 mb-5">
              <div className="w-10 h-10 rounded-xl bg-[#FEF2F2] flex items-center justify-center shrink-0">
                <AlertTriangle className="w-5 h-5 text-[#DC2626]" />
              </div>
              <div>
                <h3 className="text-base font-black text-[#0F172A]">Delete Student Record?</h3>
                <p className="text-xs text-[#94A3B8] mt-0.5">This action cannot be undone</p>
              </div>
            </div>

            <div className="bg-[#F8F9FF] border border-[#E2E8F0] rounded-xl px-4 py-3 mb-5">
              <p className="text-[10px] font-extrabold text-[#94A3B8] uppercase tracking-widest mb-1">Student</p>
              <p className="text-sm font-black text-[#0F172A]">{deleteConfirm.name}</p>
              <p className="text-xs text-[#64748B] mt-1">
                {deleteConfirm.admission_no} · {deleteConfirm.standard} · {genderLabel(deleteConfirm.gender)}
              </p>
              {/* Show warning if parent login exists — deleting student won't remove auth account */}
              {deleteConfirm.parent_auth_user_id && (
                <p className="text-[10px] text-[#B45309] mt-2 bg-[#FFFBEB] border border-[#FDE68A] rounded-lg px-2 py-1">
                  ⚠️ Parent login account will NOT be deleted automatically
                </p>
              )}
            </div>

            <div className="mb-5">
              <label className="block text-[10px] font-extrabold text-[#64748B] uppercase tracking-widest mb-2">
                Type the student name to confirm
              </label>
              <input
                type="text"
                value={deleteConfirmName}
                onChange={e => setDeleteConfirmName(e.target.value)}
                placeholder={deleteConfirm.name}
                autoFocus
                className="w-full border border-[#E2E8F0] bg-[#F8F9FF] rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-red-300 placeholder-[#CBD5E1] text-[#0F172A] transition-all"
              />
              {deleteConfirmName.length > 0 && deleteConfirmName !== deleteConfirm.name && (
                <p className="text-xs text-[#DC2626] mt-1.5 flex items-center gap-1">
                  <X className="w-3 h-3" /> Name does not match
                </p>
              )}
              {deleteConfirmName === deleteConfirm.name && (
                <p className="text-xs text-[#16A34A] mt-1.5">✓ Name confirmed. You can now delete.</p>
              )}
            </div>

            <div className="flex gap-3 justify-end">
              <button
                onClick={() => { setDeleteConfirm(null); setDeleteConfirmName('') }}
                className="px-4 py-2 text-sm font-semibold text-[#64748B] hover:bg-[#F1F5F9] rounded-xl transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={() => handleDelete(deleteConfirm.id!)}
                disabled={deleteConfirmName !== deleteConfirm.name}
                className="px-4 py-2 text-sm font-bold text-white rounded-xl transition-all hover:opacity-90 disabled:opacity-40 disabled:cursor-not-allowed active:scale-95"
                style={{ background: 'linear-gradient(135deg,#EF4444,#B91C1C)', boxShadow: '0 4px 12px rgba(220,38,38,0.25)' }}
              >
                Delete
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}