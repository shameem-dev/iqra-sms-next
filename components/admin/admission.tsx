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
  Users, UserCheck, UserX, ChevronDown,
  Search, X, Plus,
} from 'lucide-react'

const STANDARDS = [
  "FS1 A", "FS1 B", "FS2 A", "FS2 B",
  "GRADE 1 A", "GRADE 2 A", "GRADE 2 B", "GRADE 3 A", "GRADE 4 A",
]
const VEHICLE_POINTS = [
  'Point 1', 'Point 2', 'Point 3', 'Point 4', 'Point 5',
  'Own Transport', 'Walking',
]
const GENDERS = ['Male', 'Female']

const EMPTY_FORM: AdmissionRecord = {
  admission_no: '', name: '', standard: '', date_of_birth: '',
  aadhar_no: '', parent_guardian: '', address: '', mobile_no: '',
  vehicle_point: '', gender: '',
}

/* ─── tiny helpers ───────────────────────────────────────────────────── */
const inputCls =
  'w-full bg-slate-50 border border-slate-200 text-slate-900 rounded-lg px-3 py-2.5 text-sm ' +
  'focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent ' +
  'placeholder-slate-400 transition-all'

const selectCls = inputCls + ' appearance-none cursor-pointer'

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="flex flex-col gap-1.5">
      <label className="text-xs font-semibold text-slate-500 uppercase tracking-widest">
        {label}
      </label>
      {children}
    </div>
  )
}

function StatCard({
 label, value, color,
}: {
  label: string
  value: number
  color: string
}) {
  return (
    <div className={`flex items-center gap-3 px-4 py-3 rounded-xl border ${color}`}>
      <div>
        <p className="text-2xl font-bold leading-none">{value}</p>
        <p className="text-xs font-medium opacity-70 mt-0.5">{label}</p>
      </div>
    </div>
  )
}

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

  const [records, setRecords]                     = useState<AdmissionRecord[]>([])
  const [filtered, setFiltered]                   = useState<AdmissionRecord[]>([])
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
  const [deleteConfirm, setDeleteConfirm]         = useState<AdmissionRecord | null>(null)
  const [deleteConfirmName, setDeleteConfirmName] = useState('')
  const [generatingLogins, setGeneratingLogins]   = useState(false)
  const [genResult, setGenResult]                 = useState<{ created: number; failed: number } | null>(null)

  /* ── load ── */
  async function loadRecords() {
    setLoading(true)
    try {
      const data = await getAdmissions()
      setRecords(data)
      setFiltered(data)
    } catch (err: any) { setError(err.message) }
    finally { setLoading(false) }
  }
  useEffect(() => { loadRecords() }, [])

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

  const maleCount   = filtered.filter(r => r.gender === 'Male').length
  const femaleCount = filtered.filter(r => r.gender === 'Female').length

  /* ── form helpers ── */
  function openAdd()  { setForm(EMPTY_FORM); setEditId(null);           setShowForm(true); setError('') }
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
    } catch (err: any) { setError(err.message) }
    finally { setSaving(false) }
  }

  async function handleDelete(id: number) {
    try { await deleteAdmission(id); loadRecords() }
    catch (err: any) { setError(err.message) }
    finally { setDeleteConfirm(null); setDeleteConfirmName('') }
  }

  function handlePrint(r: AdmissionRecord) {
    setPrintRecord(r)
    setTimeout(() => { window.print(); setPrintRecord(null) }, 300)
  }

  function handleExcelDownload() {
    const parts = [filterGender, filterStd].filter(Boolean).join('_').replace(/\s/g, '_')
    exportToExcel(filtered, parts ? `admissions_${parts}.csv` : 'admissions_all.csv')
  }

  async function handleGenerateAllLogins() {
    setGeneratingLogins(true); setGenResult(null)
    const res  = await fetch('/api/admin/create-parent-bulk', { method: 'POST' })
    const json = await res.json()
    setGenResult({ created: json.created ?? 0, failed: json.failed ?? 0 })
    await loadRecords(); setGeneratingLogins(false)
  }

  function handlePrintLoginCards() {
    const cards = records.map(r => `
      <div class="card">
        <div class="school"> IQRAH SCHOOL — Parent Login Card</div>
        <div class="name">${r.name}</div>
        <div class="meta">Admission No: <strong>${r.admission_no}</strong> &nbsp;|&nbsp; Class: <strong>${r.standard}</strong></div>
        <div class="cred-box">
          <div class="cred-title">Login Credentials</div>
          <div class="cred-row"><span class="label">Email</span><span class="value">${r.admission_no}@iqra.school</span></div>
          <div class="cred-row"><span class="label">Password</span><span class="value">${r.admission_no}</span></div>
        </div>
        <div class="note">Login at: <strong>your-school-url.com/login</strong></div>
      </div>`).join('')

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

  /* ════════════════════════════ RENDER ════════════════════════════════════ */
  return (
    <div className="min-h-screen bg-slate-50 font-sans">

      {/* ── Print extract (single student) ── */}
      {printRecord && (
        <div ref={printRef} className="hidden print:block fixed inset-0 bg-white p-10 text-black z-50">
          <div className="border-2 border-slate-800 p-8 max-w-2xl mx-auto rounded-2xl">
            <div className="text-center mb-6 border-b pb-4 border-slate-300">
              <h1 className="text-2xl font-bold tracking-wide uppercase">Admission Extract</h1>
              <p className="text-sm text-slate-500 mt-1">Iqra School Management System</p>
            </div>
            <div className="grid grid-cols-2 gap-x-8 gap-y-4 text-sm">
              {([
                ['Admission No.', printRecord.admission_no],
                ['Student Name',  printRecord.name],
                ['Standard',      printRecord.standard],
                ['Gender',        printRecord.gender],
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

        {/* ── Page header ── */}
        <div className="mb-8">
          <div className="flex flex-wrap items-start justify-end gap-4">
          
            {/* Action buttons */}
            <div className="flex items-center gap-2 flex-wrap">
              <button
                onClick={handleExcelDownload}
                disabled={filtered.length === 0}
                className="inline-flex items-center gap-1.5 h-9 px-3.5 rounded-lg border border-emerald-200 bg-emerald-50 text-emerald-700 hover:bg-emerald-100 disabled:opacity-40 text-xs font-semibold transition-colors"
              >
                <Download className="w-3.5 h-3.5" /> Export CSV
              </button>

              <button
                onClick={handleGenerateAllLogins}
                disabled={generatingLogins}
                className="inline-flex items-center gap-1.5 h-9 px-3.5 rounded-lg border border-amber-200 bg-amber-50 text-amber-700 hover:bg-amber-100 disabled:opacity-50 text-xs font-semibold transition-colors"
              >
                <KeyRound className="w-3.5 h-3.5" />
                {generatingLogins ? 'Generating…' : 'Generate Logins'}
              </button>

              <button
                onClick={handlePrintLoginCards}
                className="inline-flex items-center gap-1.5 h-9 px-3.5 rounded-lg border border-violet-200 bg-violet-50 text-violet-700 hover:bg-violet-100 text-xs font-semibold transition-colors"
              >
                <Printer className="w-3.5 h-3.5" /> Login Cards
              </button>

              <button
                onClick={loadRecords}
                className="h-9 w-9 inline-flex items-center justify-center rounded-lg border border-slate-200 bg-white text-slate-500 hover:text-indigo-600 hover:border-indigo-300 transition-colors"
                title="Refresh"
              >
                <RefreshCw className="w-4 h-4" />
              </button>

              <button
                onClick={openAdd}
                className="inline-flex items-center gap-1.5 h-9 px-4 rounded-lg bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-semibold shadow-sm shadow-indigo-200 transition-colors"
              >
                <Plus className="w-4 h-4" /> Add Student
              </button>
            </div>
          </div>

          {/* ── Stat cards ── */}
          <div className="flex flex-wrap gap-3 mt-5">
            <StatCard
              label="Total Students"
              value={filtered.length}
              color="bg-white border-slate-200 text-slate-700"
            />
            <StatCard
              label="Male"
              value={maleCount}
              color="bg-blue-50 border-blue-200 text-blue-700"
            />
            <StatCard
              icon={<UserX className="w-5 h-5" />}
              label="Female"
              value={femaleCount}
              color="bg-pink-50 border-pink-200 text-pink-700"
            />
          </div>
        </div>

        {/* ── Generate-logins result banner ── */}
        {genResult && (
          <div className="mb-5 flex items-center gap-3 px-4 py-3 bg-emerald-50 border border-emerald-200 rounded-xl text-sm text-emerald-700">
            <span>✅ Created <strong>{genResult.created}</strong> parent login{genResult.created !== 1 ? 's' : ''}</span>
            {genResult.failed > 0 && (
              <span className="text-red-600">({genResult.failed} failed)</span>
            )}
            <button onClick={() => setGenResult(null)} className="ml-auto text-emerald-400 hover:text-emerald-600 transition-colors">
              <X className="w-4 h-4" />
            </button>
          </div>
        )}

        {/* ── Filters ── */}
        <div className="flex flex-col sm:flex-row gap-3 mb-5">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400 pointer-events-none" />
            <input
              type="text"
              placeholder="Search by name, admission no, or mobile…"
              value={search}
              onChange={e => setSearch(e.target.value)}
              className="w-full pl-9 pr-4 py-2.5 bg-white border border-slate-200 rounded-lg text-sm text-slate-900 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition-all"
            />
            {search && (
              <button onClick={() => setSearch('')} className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600">
                <X className="w-3.5 h-3.5" />
              </button>
            )}
          </div>

          <div className="relative">
            <select
              value={filterStd}
              onChange={e => setFilterStd(e.target.value)}
              className="h-10 pl-3 pr-8 bg-white border border-slate-200 rounded-lg text-sm text-slate-700 focus:outline-none focus:ring-2 focus:ring-indigo-500 appearance-none cursor-pointer min-w-[160px]"
            >
              <option value="">All Standards</option>
              {STANDARDS.map(s => <option key={s} value={s}>{s}</option>)}
            </select>
            <ChevronDown className="absolute right-2.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-slate-400 pointer-events-none" />
          </div>

          <div className="relative">
            <select
              value={filterGender}
              onChange={e => setFilterGender(e.target.value)}
              className="h-10 pl-3 pr-8 bg-white border border-slate-200 rounded-lg text-sm text-slate-700 focus:outline-none focus:ring-2 focus:ring-indigo-500 appearance-none cursor-pointer min-w-[130px]"
            >
              <option value="">All Genders</option>
              <option value="Male">Male</option>
              <option value="Female">Female</option>
            </select>
            <ChevronDown className="absolute right-2.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-slate-400 pointer-events-none" />
          </div>

          {(search || filterStd || filterGender) && (
            <button
              onClick={() => { setSearch(''); setFilterStd(''); setFilterGender('') }}
              className="inline-flex items-center gap-1.5 h-10 px-3 rounded-lg border border-slate-200 bg-white text-slate-500 hover:text-slate-700 text-sm transition-colors"
            >
              <X className="w-3.5 h-3.5" /> Clear
            </button>
          )}
        </div>

        {/* ── Table ── */}
        <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
          {loading ? (
            <div className="py-20 text-center">
              <div className="inline-flex items-center gap-2 text-slate-400 text-sm">
                <RefreshCw className="w-4 h-4 animate-spin" /> Loading records…
              </div>
            </div>
          ) : filtered.length === 0 ? (
            <div className="py-20 text-center">
              <Users className="w-10 h-10 text-slate-200 mx-auto mb-3" />
              <p className="text-slate-400 text-sm font-medium">No records found</p>
              <p className="text-slate-300 text-xs mt-1">Try adjusting your filters or add a student</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="bg-slate-50 border-b border-slate-100">
                    {[
                      'Adm. No', 'Student Name', 'Standard', 'Gender',
                      'Date of Birth', ' Guardian', 'Mobile',
                      'Vehicle Point', 'Login', 'Actions',
                    ].map(h => (
                      <th
                        key={h}
                        className="px-4 py-3 text-left text-[11px] font-semibold text-slate-400 uppercase tracking-widest whitespace-nowrap first:pl-5 last:pr-5"
                      >
                        {h}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-50">
                  {filtered.map(r => (
                    <tr key={r.id} className="hover:bg-slate-50/60 transition-colors group">
                      {/* Admission No */}
                      <td className="px-4 py-3.5 pl-5">
                        <span className="font-mono text-xs font-bold text-indigo-600 bg-indigo-50 px-2 py-1 rounded">
                          {r.admission_no}
                        </span>
                      </td>

                      {/* Name */}
                      <td className="px-4 py-3.5">
                        <span className="font-semibold text-slate-800 whitespace-nowrap">{r.name}</span>
                      </td>

                      {/* Standard */}
                      <td className="px-4 py-3.5">
                        <span className="text-xs font-semibold bg-slate-100 text-slate-600 px-2.5 py-1 rounded-full whitespace-nowrap">
                          {r.standard}
                        </span>
                      </td>

                      {/* Gender */}
                      <td className="px-4 py-3.5">
                        <span className={`inline-flex items-center text-xs font-semibold px-2.5 py-1 rounded-full whitespace-nowrap ${
                          r.gender === 'Male'
                            ? 'bg-blue-50 text-blue-700'
                            : r.gender === 'Female'
                              ? 'bg-pink-50 text-pink-700'
                              : 'bg-slate-100 text-slate-600'
                        }`}>
                          {r.gender || '—'}
                        </span>
                      </td>

                      {/* DOB */}
                      <td className="px-4 py-3.5 text-slate-500 whitespace-nowrap text-xs">
                        {r.date_of_birth}
                      </td>

                      {/* Parent */}
                      <td className="px-4 py-3.5 text-slate-600 whitespace-nowrap">{r.parent_guardian}</td>

                      {/* Mobile */}
                      <td className="px-4 py-3.5">
                        <span className="font-mono text-xs text-slate-500">{r.mobile_no}</span>
                      </td>

                      {/* Vehicle */}
                      <td className="px-4 py-3.5 text-slate-500 text-xs whitespace-nowrap">
                        {r.vehicle_point || <span className="text-slate-300">—</span>}
                      </td>

                      {/* Login status */}
                      <td className="px-4 py-3.5">
                        {(r as any).parent_auth_user_id ? (
                          <span className="inline-flex items-center gap-1 text-xs font-semibold text-emerald-700 bg-emerald-50 border border-emerald-100 px-2.5 py-1 rounded-full">
                            Active
                          </span>
                        ) : (
                          <span className="inline-flex items-center gap-1 text-xs font-semibold text-amber-600 bg-amber-50 border border-amber-100 px-2.5 py-1 rounded-full">
                           None
                          </span>
                        )}
                      </td>

                      {/* Actions */}
                      <td className="px-4 py-3.5 pr-5">
                        <div className="flex items-center gap-0.5  transition-opacity">
                          <button
                            onClick={() => openEdit(r)}
                            className="p-1.5 rounded-lg bg-blue-600 text-white hover:bg-blue-500 text-slate-400 hover:text-indigo-100 transition-colors"
                            title="Edit"
                          >
                            <SquarePen size={16} strokeWidth={1.5} />
                          </button>
                          <button
                            onClick={() => handlePrint(r)}
                            className="p-1.5 rounded-lg bg-slate-600 text-white hover:bg-slate-500 text-slate-100 hover:text-slate-100 transition-colors"
                            title="Print Extract"
                          >
                            <Printer size={16} strokeWidth={1.5} />
                          </button>
                          <button
                            onClick={() => { setDeleteConfirm(r); setDeleteConfirmName('') }}
                            className="p-1.5 rounded-lg bg-red-600 text-white hover:bg-red-500 text-slate-400 hover:text-red-50 transition-colors"
                            title="Delete"
                          >
                            <Trash size={16} strokeWidth={1.5} />
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

        {/* Table footer */}
        {filtered.length > 0 && (
          <p className="text-xs text-slate-400 mt-3 text-right">
            Showing {filtered.length} of {records.length} records
          </p>
        )}
      </div>

      {/* ══════════════════ Add / Edit Modal ════════════════════════════════ */}
      {showForm && (
        <div className="fixed inset-0 z-40 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm print:hidden">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-2xl max-h-[92vh] flex flex-col overflow-hidden">

            {/* Modal header */}
            <div className="flex items-center justify-between px-6 py-4 border-b border-slate-100">
              <div>
                <h2 className="text-base font-bold text-slate-900">
                  {editId ? 'Edit Student Record' : 'New Admission'}
                </h2>
                <p className="text-xs text-slate-400 mt-0.5">
                  {editId ? 'Update the student details below' : 'Fill in the student details to register'}
                </p>
              </div>
              <button onClick={closeForm} className="text-slate-400 hover:text-slate-600 p-1.5 rounded-lg hover:bg-slate-100 transition-colors">
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Modal body */}
            <div className="flex-1 overflow-y-auto px-6 py-5 space-y-5">
              {!editId && (
                <div className="flex items-start gap-3 p-3.5 bg-indigo-50 border border-indigo-100 rounded-xl">
                  <KeyRound className="w-4 h-4 text-indigo-500 mt-0.5 shrink-0" />
                  <p className="text-xs text-indigo-700 leading-relaxed">
                    A parent login will be <strong>automatically created</strong> when this student is added.
                    <br />
                    Login: <strong>{form.admission_no || '<adm_no>'}@iqra.school</strong> &nbsp;/&nbsp; Password: <strong>{form.admission_no || '<adm_no>'}</strong>
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
                    <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-slate-400 pointer-events-none" />
                  </div>
                </Field>

                <Field label="Gender *">
                  <div className="relative">
                    <select value={form.gender}
                      onChange={e => setForm({ ...form, gender: e.target.value })}
                      className={selectCls}>
                      <option value="">Select gender</option>
                      <option value="Male">Male</option>
                      <option value="Female">Female</option>
                    </select>
                    <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-slate-400 pointer-events-none" />
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
                    <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-slate-400 pointer-events-none" />
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
                <div className="flex items-center gap-2.5 bg-red-50 border border-red-200 text-red-700 text-sm rounded-xl px-4 py-3">
                  <AlertTriangle className="w-4 h-4 shrink-0" />
                  {error}
                </div>
              )}
            </div>

            {/* Modal footer */}
            <div className="flex items-center justify-end gap-3 px-6 py-4 border-t border-slate-100 bg-slate-50/50">
              <button onClick={closeForm}
                className="px-4 py-2 text-sm font-medium text-slate-600 hover:bg-slate-100 rounded-lg transition-colors">
                Cancel
              </button>
              <button onClick={handleSave} disabled={saving}
                className="px-5 py-2 text-sm font-semibold bg-indigo-600 hover:bg-indigo-700 disabled:bg-indigo-300 text-white rounded-lg shadow-sm shadow-indigo-200 transition-colors">
                {saving ? 'Saving…' : editId ? 'Save Changes' : 'Add Student'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ══════════════════ Delete Confirm Modal ════════════════════════════ */}
      {deleteConfirm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm print:hidden">
          <div className="bg-white rounded-2xl shadow-2xl p-6 w-full max-w-sm">
            <div className="flex items-center gap-3 mb-5">
              <div className="w-10 h-10 rounded-full bg-red-100 flex items-center justify-center shrink-0">
                <AlertTriangle className="w-5 h-5 text-red-600" />
              </div>
              <div>
                <h3 className="text-base font-bold text-slate-900">Delete Student Record?</h3>
                <p className="text-xs text-slate-400 mt-0.5">This action cannot be undone</p>
              </div>
            </div>

            <div className="bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 mb-5">
              <p className="text-xs font-semibold text-slate-400 uppercase tracking-widest mb-1">Student</p>
              <p className="text-sm font-bold text-slate-800">{deleteConfirm.name}</p>
              <p className="text-xs text-slate-400 mt-1">
                {deleteConfirm.admission_no} &middot; {deleteConfirm.standard} &middot; {deleteConfirm.gender}
              </p>
            </div>

            <div className="mb-5">
              <label className="block text-xs font-semibold text-slate-500 uppercase tracking-widest mb-2">
                Type the student name to confirm
              </label>
              <input
                type="text"
                value={deleteConfirmName}
                onChange={e => setDeleteConfirmName(e.target.value)}
                placeholder={deleteConfirm.name}
                autoFocus
                className="w-full border border-slate-200 bg-slate-50 rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-red-400 placeholder-slate-300 text-slate-900 transition-all"
              />
              {deleteConfirmName.length > 0 && deleteConfirmName !== deleteConfirm.name && (
                <p className="text-xs text-red-500 mt-1.5 flex items-center gap-1">
                  <X className="w-3 h-3" /> Name does not match
                </p>
              )}
              {deleteConfirmName === deleteConfirm.name && (
                <p className="text-xs text-emerald-600 mt-1.5">✓ Name confirmed. You can now delete.</p>
              )}
            </div>

            <div className="flex gap-3 justify-end">
              <button
                onClick={() => { setDeleteConfirm(null); setDeleteConfirmName('') }}
                className="px-4 py-2 text-sm font-medium text-slate-600 hover:bg-slate-100 rounded-lg transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={() => handleDelete(deleteConfirm.id!)}
                disabled={deleteConfirmName !== deleteConfirm.name}
                className="px-4 py-2 text-sm font-semibold bg-red-600 hover:bg-red-700 disabled:bg-red-200 disabled:text-red-400 disabled:cursor-not-allowed text-white rounded-lg transition-colors"
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