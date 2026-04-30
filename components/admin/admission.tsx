'use client'

import { useEffect, useState, useRef } from 'react'
import { AdmissionRecord } from '@/type/admission'
import {
  getAdmissions,
  addAdmission,
  updateAdmission,
  deleteAdmission,
} from '@/utils/actions/admissions'
import { SquarePen, Trash, Printer, RefreshCw, AlertTriangle, Download } from 'lucide-react';

const STANDARDS = [
  "FS1 A", "FS1 B", "FS2 A", "FS2 B",
  "GRADE 1 A", "GRADE 2 A", "GRADE 2 B", "GRADE 3 A", "GRADE 4 A"
]
const VEHICLE_POINTS = ['Point 1', 'Point 2', 'Point 3', 'Point 4', 'Point 5', 'Own Transport', 'Walking']
const GENDERS = ['Male', 'Female']

// Gender sort order: Male → Female → anything else
const GENDER_ORDER: Record<string, number> = { Male: 0, Female: 1 }
const genderSort = (a: AdmissionRecord, b: AdmissionRecord) =>
  (GENDER_ORDER[a.gender] ?? 2) - (GENDER_ORDER[b.gender] ?? 2)

const EMPTY_FORM: AdmissionRecord = {
  admission_no: '',
  name: '',
  standard: '',
  date_of_birth: '',
  aadhar_no: '',
  parent_guardian: '',
  address: '',
  mobile_no: '',
  vehicle_point: '',
  gender: '',
}

const inputCls =
  'w-full border border-gray-200 bg-white text-gray-900 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-teal-500 placeholder-gray-400'

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="flex flex-col gap-1.5">
      <label className="text-xs font-semibold text-gray-500 uppercase tracking-wide">
        {label}
      </label>
      {children}
    </div>
  )
}

// ── Excel Export (CSV) ─────────────────────────────────────
function exportToExcel(data: AdmissionRecord[], filename = 'admissions.csv') {
  const headers = [
    'Admission No', 'Student Name', 'Standard', 'Gender',
    'Date of Birth', 'Aadhar No', 'Parent / Guardian',
    'Mobile No', 'Vehicle Point', 'Address',
  ]
  const rows = data.map(r => [
    r.admission_no,
    r.name,
    r.standard,
    r.gender,
    r.date_of_birth,
    r.aadhar_no,
    r.parent_guardian,
    r.mobile_no,
    r.vehicle_point || '',
    `"${r.address.replace(/"/g, '""')}"`,
  ])

  const csvContent = [headers, ...rows].map(row => row.join(',')).join('\n')
  const blob = new Blob(['\uFEFF' + csvContent], { type: 'text/csv;charset=utf-8;' })
  const url  = URL.createObjectURL(blob)
  const link = document.createElement('a')
  link.href = url
  link.download = filename
  link.click()
  URL.revokeObjectURL(url)
}

export default function AdmissionRegisterPage() {
  const printRef = useRef<HTMLDivElement>(null)

  // ── State ──────────────────────────────────────────────
  const [records, setRecords]               = useState<AdmissionRecord[]>([])
  const [filtered, setFiltered]             = useState<AdmissionRecord[]>([])
  const [search, setSearch]                 = useState('')
  const [filterStd, setFilterStd]           = useState('')
  const [filterGender, setFilterGender]     = useState('')
  const [showForm, setShowForm]             = useState(false)
  const [editId, setEditId]                 = useState<number | null>(null)
  const [form, setForm]                     = useState<AdmissionRecord>(EMPTY_FORM)
  const [loading, setLoading]               = useState(false)
  const [saving, setSaving]                 = useState(false)
  const [error, setError]                   = useState('')
  const [printRecord, setPrintRecord]       = useState<AdmissionRecord | null>(null)
  const [deleteConfirm, setDeleteConfirm]   = useState<AdmissionRecord | null>(null)
  const [deleteConfirmName, setDeleteConfirmName] = useState('')

  // ── Load ───────────────────────────────────────────────
  async function loadRecords() {
    setLoading(true)
    try {
      const data = await getAdmissions()
      setRecords(data)
      setFiltered([...data].sort(genderSort))
    } catch (err: any) {
      setError(err.message)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => { loadRecords() }, [])

  // ── Filter + Sort (Male → Female → Other, always) ──────
  useEffect(() => {
    let result = [...records]
    if (search) {
      const q = search.toLowerCase()
      result = result.filter(
        r =>
          r.name.toLowerCase().includes(q) ||
          r.admission_no.toLowerCase().includes(q) ||
          r.mobile_no.includes(q)
      )
    }
    if (filterStd)    result = result.filter(r => r.standard === filterStd)
    if (filterGender) result = result.filter(r => r.gender   === filterGender)
    result.sort(genderSort)
    setFiltered(result)
  }, [search, filterStd, filterGender, records])

  // ── Gender summary counts ──────────────────────────────
  const maleCount   = filtered.filter(r => r.gender === 'Male').length
  const femaleCount = filtered.filter(r => r.gender === 'Female').length

  // ── Form helpers ───────────────────────────────────────
  function openAdd() { setForm(EMPTY_FORM); setEditId(null); setShowForm(true); setError('') }
  function openEdit(record: AdmissionRecord) {
    setForm({ ...record }); setEditId(record.id ?? null); setShowForm(true); setError('')
  }
  function closeForm() { setShowForm(false); setForm(EMPTY_FORM); setEditId(null); setError('') }

  // ── Validation ─────────────────────────────────────────
  function validate(): boolean {
    const required: (keyof AdmissionRecord)[] = [
      'admission_no', 'name', 'standard', 'date_of_birth',
      'aadhar_no', 'parent_guardian', 'address', 'mobile_no', 'gender',
    ]
    for (const key of required) {
      if (!form[key]) { setError(`${key.replace(/_/g, ' ')} is required.`); return false }
    }
    if (!/^\d{12}$/.test(form.aadhar_no)) { setError('Aadhar number must be exactly 12 digits.'); return false }
    if (!/^\d{10}$/.test(form.mobile_no)) { setError('Mobile number must be exactly 10 digits.'); return false }
    return true
  }

  // ── Save ──────────────────────────────────────────────
  async function handleSave() {
    if (!validate()) return
    setSaving(true); setError('')
    try {
      if (editId) {
        const { id, ...safeForm } = form
        await updateAdmission(editId, safeForm)
      } else {
        await addAdmission(form)
      }
      closeForm()
      await loadRecords()
    } catch (err: any) {
      setError(err.message)
    } finally {
      setSaving(false)
    }
  }

  // ── Delete ────────────────────────────────────────────
  async function handleDelete(id: number) {
    try {
      await deleteAdmission(id)
      loadRecords()
    } catch (err: any) {
      setError(err.message)
    } finally {
      setDeleteConfirm(null); setDeleteConfirmName('')
    }
  }
  function openDeleteConfirm(record: AdmissionRecord) { setDeleteConfirm(record); setDeleteConfirmName('') }
  function closeDeleteConfirm() { setDeleteConfirm(null); setDeleteConfirmName('') }

  // ── Print ─────────────────────────────────────────────
  function handlePrint(record: AdmissionRecord) {
    setPrintRecord(record)
    setTimeout(() => { window.print(); setPrintRecord(null) }, 300)
  }

  // ── Excel Download ────────────────────────────────────
  function handleExcelDownload() {
    const parts = [filterGender, filterStd].filter(Boolean).join('_').replace(/\s/g, '_')
    const filename = parts ? `admissions_${parts}.csv` : 'admissions_all.csv'
    exportToExcel(filtered, filename)
  }

  // ── Render ────────────────────────────────────────────
  return (
    <div className="min-h-screen bg-gray-50">

      {/* ── Print Extract ── */}
      {printRecord && (
        <div ref={printRef} className="hidden print:block fixed inset-0 bg-white p-10 text-black z-50">
          <div className="border-2 border-gray-800 p-8 max-w-2xl mx-auto">
            <div className="text-center mb-6 border-b pb-4 border-gray-400">
              <h1 className="text-2xl font-bold tracking-wide">ADMISSION EXTRACT</h1>
              <p className="text-sm text-gray-600 mt-1">School Management System</p>
            </div>
            <div className="grid grid-cols-2 gap-x-8 gap-y-3 text-sm">
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
                  <p className="text-gray-500 text-xs uppercase tracking-wider">{label}</p>
                  <p className="font-medium mt-0.5">{value}</p>
                </div>
              ))}
            </div>
            <div className="mt-10 pt-6 border-t border-gray-300 flex justify-between text-xs text-gray-400">
              <span>Generated: {new Date().toLocaleDateString('en-IN')}</span>
              <span>Admission No: {printRecord.admission_no}</span>
            </div>
          </div>
        </div>
      )}

      {/* ── Main UI ── */}
      <div className="max-w-7xl mx-auto print:hidden">

        {/* Header */}
        <div className="flex flex-wrap items-center justify-between gap-3 mb-6">
          <div className="flex items-center gap-3 flex-wrap">
            <p className="text-sm text-gray-500">
              {records.length} student{records.length !== 1 ? 's' : ''} enrolled
            </p>
            {filtered.length > 0 && (
              <div className="flex items-center gap-1.5">
                <span className="inline-flex items-center gap-1 bg-blue-50 text-blue-700 text-xs font-medium px-2 py-0.5 rounded-full">
                  ♂ {maleCount} Male
                </span>
                <span className="inline-flex items-center gap-1 bg-pink-50 text-pink-700 text-xs font-medium px-2 py-0.5 rounded-full">
                  ♀ {femaleCount} Female
                </span>
              </div>
            )}
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={handleExcelDownload}
              disabled={filtered.length === 0}
              className="flex items-center gap-1.5 h-9 px-3 rounded-lg border border-green-200 bg-green-50 text-green-700 hover:bg-green-100 disabled:opacity-40 disabled:cursor-not-allowed text-xs font-medium transition-colors"
              title="Download filtered data as CSV (opens in Excel)"
            >
              <Download className="w-3.5 h-3.5" />
              Export Excel
            </button>
            <button
              onClick={loadRecords}
              className="h-9 w-9 flex items-center justify-center rounded-lg border border-slate-200 bg-white text-slate-500 hover:text-teal-600 hover:border-teal-300 transition-colors"
              title="Refresh"
            >
              <RefreshCw className="w-4 h-4" />
            </button>
            <button
              onClick={openAdd}
              className="flex items-center gap-2 bg-teal-600 hover:bg-teal-700 text-white text-sm font-medium px-4 py-2 rounded-lg transition-colors"
            >
              <span className="text-lg leading-none">+</span> Add Student
            </button>
          </div>
        </div>

        {/* Filters */}
        <div className="flex flex-col sm:flex-row gap-3 mb-5">
          <input
            type="text"
            placeholder="Search by name, admission no, mobile..."
            value={search}
            onChange={e => setSearch(e.target.value)}
            className="flex-1 border border-gray-200 bg-white focus:outline-teal-500 hover:border-teal-500 rounded-lg px-3 py-2 text-sm text-gray-500 placeholder-gray-400"
          />
          <select
            value={filterStd}
            onChange={e => setFilterStd(e.target.value)}
            className="border border-gray-200 bg-white rounded-lg px-3 py-2 text-sm text-gray-900 focus:outline-none focus:ring-2 focus:ring-teal-400"
          >
            <option value="">All Standards</option>
            {STANDARDS.map(s => <option key={s} value={s}>Standard {s}</option>)}
          </select>
          <select
            value={filterGender}
            onChange={e => setFilterGender(e.target.value)}
            className="border border-gray-200 bg-white rounded-lg px-3 py-2 text-sm text-gray-900 focus:outline-none focus:ring-2 focus:ring-teal-400"
          >
            <option value="">All Genders</option>
            <option value="Male">Male</option>
            <option value="Female">Female</option>
          </select>
          {(search || filterStd || filterGender) && (
            <button
              onClick={() => { setSearch(''); setFilterStd(''); setFilterGender('') }}
              className="text-sm text-gray-500 hover:text-gray-700 px-3"
            >
              Clear
            </button>
          )}
        </div>

        {/* Table */}
        <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
          {loading ? (
            <div className="py-16 text-center text-gray-400 text-sm">Loading...</div>
          ) : filtered.length === 0 ? (
            <div className="py-16 text-center text-gray-400 text-sm">No records found.</div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-gray-300 bg-gray-100">
                    {['Adm. No', 'Name', 'Std', 'Gender ↑', 'D.O.B', 'Parent / Guardian', 'Mobile', 'Vehicle Point', 'Actions'].map(h => (
                      <th
                        key={h}
                        className="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider whitespace-nowrap"
                      >
                        {h}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {filtered.map((r, idx) => {
                    const prevGender  = idx > 0 ? filtered[idx - 1].gender : null
                    const isNewGroup  = idx > 0 && r.gender !== prevGender
                    const isFirstRow  = idx === 0

                    return (
                      <>
                        {/* Group header divider row */}
                        {(isFirstRow || isNewGroup) && (
                          <tr key={`group-${r.gender}-${idx}`}>
                            <td colSpan={9} className={`px-4 py-1.5 ${
                              r.gender === 'Male'
                                ? 'bg-blue-50 border-t border-blue-100'
                                : r.gender === 'Female'
                                ? 'bg-pink-50 border-t border-pink-100'
                                : 'bg-gray-50 border-t border-gray-200'
                            }`}>
                              <span className={`text-xs font-bold uppercase tracking-widest ${
                                r.gender === 'Male'
                                  ? 'text-blue-500'
                                  : r.gender === 'Female'
                                  ? 'text-pink-500'
                                  : 'text-gray-400'
                              }`}>
                                {r.gender === 'Male' ? '♂' : r.gender === 'Female' ? '♀' : '⚧'} {r.gender}
                              </span>
                            </td>
                          </tr>
                        )}
                        <tr key={r.id} className="hover:bg-gray-50 transition-colors border-b border-gray-50">
                          <td className="px-4 py-3 font-mono text-xs text-teal-600 font-semibold">{r.admission_no}</td>
                          <td className="px-4 py-3 font-medium text-gray-500 whitespace-nowrap">{r.name}</td>
                          <td className="px-4 py-3">
                            <span className="bg-teal-50 text-teal-700 text-xs font-medium px-2 py-0.5 rounded">
                              Std {r.standard}
                            </span>
                          </td>
                          <td className="px-4 py-3">
                            <span className={`text-xs font-medium px-2 py-0.5 rounded ${
                              r.gender === 'Male'
                                ? 'bg-blue-50 text-blue-700'
                                : r.gender === 'Female'
                                ? 'bg-pink-50 text-pink-700'
                                : 'bg-gray-100 text-gray-600'
                            }`}>
                              {r.gender}
                            </span>
                          </td>
                          <td className="px-4 py-3 text-gray-600 whitespace-nowrap">{r.date_of_birth}</td>
                          <td className="px-4 py-3 text-gray-600 whitespace-nowrap">{r.parent_guardian}</td>
                          <td className="px-4 py-3 text-gray-600 font-mono text-xs">{r.mobile_no}</td>
                          <td className="px-4 py-3 text-gray-600 text-xs">{r.vehicle_point || '—'}</td>
                          <td className="px-4 py-3">
                            <div className="flex items-center gap-1">
                              <button onClick={() => openEdit(r)} className="p-1.5 rounded hover:bg-gray-100 text-gray-500 hover:text-teal-800 transition-colors" title="Edit">
                                <SquarePen size={20} strokeWidth={1} />
                              </button>
                              <button onClick={() => handlePrint(r)} className="p-1.5 rounded hover:bg-teal-50 text-gray-500 hover:text-teal-800 transition-colors" title="Print Extract">
                                <Printer size={20} strokeWidth={1} />
                              </button>
                              <button onClick={() => openDeleteConfirm(r)} className="p-1.5 rounded hover:bg-red-50 text-gray-500 hover:text-red-600 transition-colors" title="Delete">
                                <Trash size={20} strokeWidth={1} />
                              </button>
                            </div>
                          </td>
                        </tr>
                      </>
                    )
                  })}
                </tbody>
              </table>
            </div>
          )}
        </div>

        {filtered.length > 0 && (
          <p className="text-xs text-gray-400 mt-3 text-right">
            Showing {filtered.length} of {records.length} records · Sorted: Male → Female
          </p>
        )}
      </div>

      {/* ── Add / Edit Modal ── */}
      {showForm && (
        <div className="fixed inset-0 z-40 flex items-center justify-center p-4 bg-black/40 backdrop-blur-sm print:hidden">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-2xl max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100">
              <h2 className="text-lg font-semibold text-gray-900">
                {editId ? 'Edit Student' : 'New Admission'}
              </h2>
              <button onClick={closeForm} className="text-gray-400 hover:text-gray-600 text-xl leading-none">✕</button>
            </div>
            <div className="p-6 space-y-5">
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
                  <select value={form.standard}
                    onChange={e => setForm({ ...form, standard: e.target.value })}
                    className={inputCls}>
                    <option value="">Select standard</option>
                    {STANDARDS.map(s => <option key={s} value={s}>{s}</option>)}
                  </select>
                </Field>
                <Field label="Gender *">
                  <select value={form.gender}
                    onChange={e => setForm({ ...form, gender: e.target.value })}
                    className={inputCls}>
                    <option value="">Select gender</option>
                    {GENDERS.map(g => <option key={g} value={g}>{g}</option>)}
                  </select>
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
                  <select value={form.vehicle_point}
                    onChange={e => setForm({ ...form, vehicle_point: e.target.value })}
                    className={inputCls}>
                    <option value="">Select point</option>
                    {VEHICLE_POINTS.map(v => <option key={v} value={v}>{v}</option>)}
                  </select>
                </Field>
                <div className="sm:col-span-2">
                  <Field label="Address *">
                    <textarea value={form.address}
                      onChange={e => setForm({ ...form, address: e.target.value })}
                      placeholder="Full address" rows={3}
                      className={inputCls + ' resize-none'} />
                  </Field>
                </div>
              </div>
              {error && (
                <div className="bg-red-50 border border-red-200 text-red-700 text-sm rounded-lg px-4 py-3">
                  {error}
                </div>
              )}
            </div>
            <div className="flex items-center justify-end gap-3 px-6 py-4 border-t border-gray-100">
              <button onClick={closeForm} className="px-4 py-2 text-sm text-gray-600 hover:bg-gray-100 cursor-pointer rounded-lg transition-colors">Cancel</button>
              <button onClick={handleSave} disabled={saving}
                className="px-5 py-2 text-sm font-medium bg-teal-600 hover:bg-teal-700 cursor-pointer disabled:bg-teal-400 text-white rounded-lg transition-colors">
                {saving ? 'Saving...' : editId ? 'Update' : 'Add Student'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ── Delete Confirm Modal ── */}
      {deleteConfirm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 backdrop-blur-sm print:hidden">
          <div className="bg-white rounded-xl shadow-xl p-6 w-full max-w-sm">
            <div className="flex items-center gap-3 mb-4">
              <div className="w-10 h-10 rounded-full bg-red-100 flex items-center justify-center flex-shrink-0">
                <AlertTriangle size={18} className="text-red-600" />
              </div>
              <div>
                <h3 className="text-base font-semibold text-gray-900">Delete Student Record?</h3>
                <p className="text-xs text-gray-400 mt-0.5">This action cannot be undone</p>
              </div>
            </div>
            <div className="bg-gray-50 border border-gray-200 rounded-lg px-4 py-3 mb-4">
              <p className="text-xs text-gray-400 uppercase tracking-wide mb-1">Student</p>
              <p className="text-sm font-semibold text-gray-800">{deleteConfirm.name}</p>
              <p className="text-xs text-gray-500 mt-0.5">
                Adm. No: {deleteConfirm.admission_no} &nbsp;·&nbsp; Std: {deleteConfirm.standard} &nbsp;·&nbsp; {deleteConfirm.gender}
              </p>
            </div>
            <div className="mb-5">
              <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wide mb-1.5">
                Type the student name to confirm
              </label>
              <input
                type="text"
                value={deleteConfirmName}
                onChange={e => setDeleteConfirmName(e.target.value)}
                placeholder={deleteConfirm.name}
                autoFocus
                className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-red-400 placeholder-gray-300 text-gray-900"
              />
              {deleteConfirmName.length > 0 && deleteConfirmName !== deleteConfirm.name && (
                <p className="text-xs text-red-500 mt-1.5">Name does not match. Please type exactly as shown.</p>
              )}
              {deleteConfirmName === deleteConfirm.name && (
                <p className="text-xs text-green-600 mt-1.5">✓ Name confirmed. You can now delete.</p>
              )}
            </div>
            <div className="flex gap-3 justify-end">
              <button onClick={closeDeleteConfirm} className="px-4 py-2 text-sm text-gray-600 hover:bg-gray-100 cursor-pointer rounded-lg transition-colors">Cancel</button>
              <button
                onClick={() => handleDelete(deleteConfirm.id!)}
                disabled={deleteConfirmName !== deleteConfirm.name}
                className="px-4 py-2 text-sm font-medium bg-red-600 hover:bg-red-700 disabled:bg-red-200 disabled:text-red-400 disabled:cursor-not-allowed cursor-pointer text-white rounded-lg transition-colors"
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