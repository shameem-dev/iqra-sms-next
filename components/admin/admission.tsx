'use client'

import { useEffect, useState, useRef } from 'react'
import { AdmissionRecord } from '@/type/admission'
import {
  getAdmissions,
  addAdmission,
  updateAdmission,
  deleteAdmission,
} from '@/utils/actions/admissions'
import { SquarePen , Trash, Printer } from 'lucide-react';

const STANDARDS = ['LKG', 'UKG', '1', '2', '3', '4', '5', '6', '7', '8', '9', '10']
const VEHICLE_POINTS = ['Point 1', 'Point 2', 'Point 3', 'Point 4', 'Point 5', 'Own Transport', 'Walking']

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
}

const inputCls =
  'w-full border border-gray-200  bg-white  text-gray-900  rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-teal-500 placeholder-gray-400'

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="flex flex-col gap-1.5">
      <label className="text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wide">
        {label}
      </label>
      {children}
    </div>
  )
}

export default function AdmissionRegisterPage() {
  const printRef = useRef<HTMLDivElement>(null)

  // ── State ──────────────────────────────────────────────
  const [records, setRecords]           = useState<AdmissionRecord[]>([])
  const [filtered, setFiltered]         = useState<AdmissionRecord[]>([])
  const [search, setSearch]             = useState('')
  const [filterStd, setFilterStd]       = useState('')
  const [showForm, setShowForm]         = useState(false)
  const [editId, setEditId]             = useState<number | null>(null)
  const [form, setForm]                 = useState<AdmissionRecord>(EMPTY_FORM)
  const [loading, setLoading]           = useState(false)
  const [saving, setSaving]             = useState(false)
  const [error, setError]               = useState('')
  const [printRecord, setPrintRecord]   = useState<AdmissionRecord | null>(null)
  const [deleteConfirm, setDeleteConfirm] = useState<number | null>(null)

  // ── Load ───────────────────────────────────────────────
  async function loadRecords() {
    setLoading(true)
    try {
      const data = await getAdmissions()   // ← from actions/admissions.ts
      setRecords(data)
      setFiltered(data)
    } catch (err: any) {
      setError(err.message)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => { loadRecords() }, [])

  // ── Filter ─────────────────────────────────────────────
  useEffect(() => {
    let result = records
    if (search) {
      const q = search.toLowerCase()
      result = result.filter(
        r =>
          r.name.toLowerCase().includes(q) ||
          r.admission_no.toLowerCase().includes(q) ||
          r.mobile_no.includes(q)
      )
    }
    if (filterStd) result = result.filter(r => r.standard === filterStd)
    setFiltered(result)
  }, [search, filterStd, records])

  // ── Form helpers ───────────────────────────────────────
  function openAdd() {
    setForm(EMPTY_FORM)
    setEditId(null)
    setShowForm(true)
    setError('')
  }

  function openEdit(record: AdmissionRecord) {
    setForm({ ...record })
    setEditId(record.id ?? null)
    setShowForm(true)
    setError('')
  }

  function closeForm() {
    setShowForm(false)
    setForm(EMPTY_FORM)
    setEditId(null)
    setError('')
  }

  // ── Validation ─────────────────────────────────────────
  function validate(): boolean {
    const required: (keyof AdmissionRecord)[] = [
      'admission_no', 'name', 'standard', 'date_of_birth',
      'aadhar_no', 'parent_guardian', 'address', 'mobile_no',
    ]
    for (const key of required) {
      if (!form[key]) {
        setError(`${key.replace(/_/g, ' ')} is required.`)
        return false
      }
    }
    if (!/^\d{12}$/.test(form.aadhar_no)) {
      setError('Aadhar number must be exactly 12 digits.')
      return false
    }
    if (!/^\d{10}$/.test(form.mobile_no)) {
      setError('Mobile number must be exactly 10 digits.')
      return false
    }
    return true
  }

  // ── Save (Add or Edit) — calls actions ─────────────────
  async function handleSave() {
  if (!validate()) return

  setSaving(true)
  setError('')

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

  // ── Delete — calls actions ─────────────────────────────
  async function handleDelete(id: number) {
    try {
      await deleteAdmission(id)             // ← actions/admissions.ts
      loadRecords()
    } catch (err: any) {
      setError(err.message)
    } finally {
      setDeleteConfirm(null)
    }
  }

  // ── Print ──────────────────────────────────────────────
  function handlePrint(record: AdmissionRecord) {
    setPrintRecord(record)
    setTimeout(() => {
      window.print()
      setPrintRecord(null)
    }, 300)
  }

  // ── Render ─────────────────────────────────────────────
  return (
    <div className="min-h-screen bg-gray-50  ">

      {/* ── Print Extract (only visible on print) ── */}
      {printRecord && (
        <div
          ref={printRef}
          className="hidden print:block fixed inset-0 bg-white p-10 text-black z-50"
        >
          <div className="border-2 border-gray-800 p-8 max-w-2xl mx-auto">
            <div className="text-center mb-6 border-b pb-4 border-gray-400">
              <h1 className="text-2xl font-bold tracking-wide">ADMISSION EXTRACT</h1>
              <p className="text-sm text-gray-600 mt-1">School Management System</p>
            </div>
            <div className="grid grid-cols-2 gap-x-8 gap-y-3 text-sm">
              {[
                ['Admission No.', printRecord.admission_no],
                ['Student Name',  printRecord.name],
                ['Standard',      printRecord.standard],
                ['Date of Birth', printRecord.date_of_birth],
                ['Aadhar No.',    printRecord.aadhar_no],
                ['Parent / Guardian', printRecord.parent_guardian],
                ['Mobile No.',    printRecord.mobile_no],
                ['Vehicle Point', printRecord.vehicle_point || '—'],
                ['Address',       printRecord.address],
              ].map(([label, value]) => (
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
        <div className="flex items-center justify-between mb-6">
          <div>
            <h1 className="text-2xl text-gray-700 font-semibold  ">
              Admission Register
            </h1>
            <p className="text-sm text-gray-500 dark:text-gray-400 mt-0.5">
              {records.length} student{records.length !== 1 ? 's' : ''} enrolled
            </p>
          </div>
          <button
            onClick={openAdd}
            className="flex items-center gap-2 bg-teal-600 hover:bg-teal-700 text-white text-sm font-medium px-4 py-2 rounded-lg transition-colors"
          >
            <span className="text-lg leading-none">+</span> Add Student
          </button>
        </div>

        {/* Filters */}
        <div className="flex flex-col sm:flex-row gap-3 mb-5">
          <input
            type="text"
            placeholder="Search by name, admission no, mobile..."
            value={search}
            onChange={e => setSearch(e.target.value)}
            className="flex-1 border border-gray-200  bg-white focus:outline-teal-500 hover:border-teal-500 rounded-lg px-3 py-2 text-sm text-gray-500 placeholder-gray-400 "
          />
          <select
            value={filterStd}
            onChange={e => setFilterStd(e.target.value)}
            className="border border-gray-200  bg-white  rounded-lg px-3 py-2 text-sm text-gray-900  focus:outline-none focus:ring-2 focus:ring-teal-400"
          >
            <option value="">All Standards</option>
            {STANDARDS.map(s => (
              <option key={s} value={s}>Standard {s}</option>
            ))}
          </select>
          {(search || filterStd) && (
            <button
              onClick={() => { setSearch(''); setFilterStd('') }}
              className="text-sm text-gray-500 hover:text-gray-700 dark:hover:text-gray-300 px-3"
            >
              Clear
            </button>
          )}
        </div>

        {/* Table */}
        <div className="bg-white  rounded-xl border border-gray-200 overflow-hidden">
          {loading ? (
            <div className="py-16 text-center text-gray-400 text-sm">Loading...</div>
          ) : filtered.length === 0 ? (
            <div className="py-16 text-center text-gray-400 text-sm">No records found.</div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-gray-300  bg-gray-100 ">
                    {['Adm. No', 'Name', 'Std', 'D.O.B', 'Parent / Guardian', 'Mobile', 'Vehicle Point', 'Actions'].map(h => (
                      <th
                        key={h}
                        className="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider whitespace-nowrap"
                      >
                        {h}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-50 ">
                  {filtered.map(r => (
                    <tr key={r.id} className="hover:bg-gray-50  transition-colors">
                      <td className="px-4 py-3 font-mono text-xs text-teal-600  font-semibold">{r.admission_no}</td>
                      <td className="px-4 py-3 font-medium text-gray-500  whitespace-nowrap">{r.name}</td>
                      <td className="px-4 py-3">
                        <span className="bg-teal-50  text-teal-700 text-xs font-medium px-2 py-0.5 rounded">
                          Std {r.standard}
                        </span>
                      </td>
                      <td className="px-4 py-3 text-gray-600  whitespace-nowrap">{r.date_of_birth}</td>
                      <td className="px-4 py-3 text-gray-600  whitespace-nowrap">{r.parent_guardian}</td>
                      <td className="px-4 py-3 text-gray-600  font-mono text-xs">{r.mobile_no}</td>
                      <td className="px-4 py-3 text-gray-600  text-xs">{r.vehicle_point || '—'}</td>
                      <td className="px-4 py-3">
                        <div className="flex items-center gap-1">
                          
                          <button
                            onClick={() => openEdit(r)}
                            className="p-1.5 rounded hover:bg-gray-100  text-gray-500 hover:text-teal-800  transition-colors"
                            title="Edit"
                          ><SquarePen size={20} strokeWidth={1} /></button>
                          <button
                            onClick={() => handlePrint(r)}
                            className="p-1.5 rounded hover:bg-teal-50  text-gray-500 hover:text-teal-800  transition-colors"
                            title="Print Extract"
                          ><Printer size={20} strokeWidth={1} /></button>
                          <button
                            onClick={() => setDeleteConfirm(r.id!)}
                            className="p-1.5 rounded hover:bg-red-50  text-gray-500 hover:text-red-600 transition-colors"
                            title="Delete"
                          ><Trash size={20} strokeWidth={1} /></button>
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
          <p className="text-xs text-gray-400 mt-3 text-right">
            Showing {filtered.length} of {records.length} records
          </p>
        )}
      </div>

      {/* ── Add / Edit Modal ── */}
      {showForm && (
        <div className="fixed inset-0 z-40 flex items-center justify-center p-4 bg-black/40 backdrop-blur-sm print:hidden">
          <div className="bg-white  rounded-2xl shadow-2xl w-full max-w-2xl max-h-[90vh] overflow-y-auto">

            <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100 ">
              <h2 className="text-lg font-semibold text-gray-900 dark:text-white">
                {editId ? 'Edit Student' : 'New Admission'}
              </h2>
              <button onClick={closeForm} className="text-gray-400 hover:text-gray-600  text-xl leading-none">✕</button>
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
                <div className="bg-red-50  border border-red-200  text-red-700  text-sm rounded-lg px-4 py-3">
                  {error}
                </div>
              )}
            </div>

            <div className="flex items-center justify-end gap-3 px-6 py-4 border-t border-gray-100 dark:border-gray-800">
              <button onClick={closeForm}
                className="px-4 py-2 text-sm text-gray-600  hover:bg-gray-100 cursor-pointer rounded-lg transition-colors">
                Cancel
              </button>
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
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 backdrop-blur-sm print:hidden ">
          <div className="bg-white  rounded-xl shadow-xl p-6 w-full max-w-sm ">
            <h3 className="text-base font-semibold text-gray-900  mb-2">Delete Record?</h3>
            <p className="text-sm text-gray-500  mb-5">
              This action cannot be undone. The admission record will be permanently removed.
            </p>
            <div className="flex gap-3 justify-end">
              <button onClick={() => setDeleteConfirm(null)}
                className="px-4 py-2 text-sm text-gray-600  hover:bg-gray-100 cursor-pointer rounded-lg transition-colors">
                Cancel
              </button>
              <button onClick={() => handleDelete(deleteConfirm)}
                className="px-4 py-2 text-sm font-medium bg-red-600 hover:bg-red-700 cursor-pointer text-white rounded-lg transition-colors">
                Delete
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}