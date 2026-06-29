'use client'

import { useState, useRef } from 'react'
import * as XLSX from 'xlsx'
import { AdmissionRecord } from '@/type/admission'
import { addAdmission } from '@/utils/actions/admissions'
import {
  Upload, X, AlertTriangle, CheckCircle2,
  FileSpreadsheet, Loader2,
} from 'lucide-react'

/* ─── Must match the constants in the main admissions page ──────────── */
const STANDARDS = [
  "LKG A", "LKG B", "UKG A", "UKG B",
  "GRADE 1 A", "GRADE 2 A", "GRADE 2 B", "GRADE 3 A", "GRADE 4 A",
]
const VEHICLE_POINTS = [
  'Karimukk', 'Cherad', 'Kottukkara', 'Kodangad', 'Evening Coffee Road',
  'Cheruparamba', 'Millumpadi', 'Meleparamba', 'Kizhakke Paramba',
  'Kizhakke Chungam', 'Chirayil Chungam', 'Own Transport', 'Walking',
]
const GENDERS = ['Male', 'Female']

const COLUMN_MAP: Record<string, keyof AdmissionRecord> = {
  'Admission No': 'admission_no',
  'Student Name': 'name',
  'Standard': 'standard',
  'Gender': 'gender',
  'Date of Birth (YYYY-MM-DD)': 'date_of_birth',
  'Date of Birth': 'date_of_birth',
  'Aadhar No': 'aadhar_no',
  'Parent / Guardian': 'parent_guardian',
  'Mobile No': 'mobile_no',
  'Vehicle Point': 'vehicle_point',
  'Address': 'address',
}

type RowResult = {
  rowNum: number
  name: string
  admissionNo: string
  errors: string[]
}

type Props = {
  existingRecords: AdmissionRecord[]
  onClose: () => void
  onComplete: () => void
}

function normalizeDate(val: unknown): string {
  if (!val) return ''
  if (typeof val === 'string') return val.trim()
  if (typeof val === 'number') {
    const date = XLSX.SSF.parse_date_code(val)
    if (!date) return ''
    return `${date.y}-${String(date.m).padStart(2, '0')}-${String(date.d).padStart(2, '0')}`
  }
  return String(val)
}

function buildRecord(raw: Record<string, string>): AdmissionRecord {
  return {
    admission_no: (raw['admission_no'] || '').toString().trim(),
    name: (raw['name'] || '').toString().trim().toUpperCase(),
    standard: (raw['standard'] || '').toString().trim(),
    gender: (raw['gender'] || '').toString().trim(),
    date_of_birth: normalizeDate(raw['date_of_birth']),
    aadhar_no: (raw['aadhar_no'] || '').toString().replace(/\D/g, ''),
    parent_guardian: (raw['parent_guardian'] || '').toString().trim(),
    address: (raw['address'] || '').toString().trim(),
    mobile_no: (raw['mobile_no'] || '').toString().replace(/\D/g, ''),
    vehicle_point: (raw['vehicle_point'] || '').toString().trim(),
  }
}

function validateRow(data: AdmissionRecord, seenInFile: Set<string>, existing: Set<string>): string[] {
  const errors: string[] = []
  const required: (keyof AdmissionRecord)[] = [
    'admission_no', 'name', 'standard', 'date_of_birth',
    'aadhar_no', 'parent_guardian', 'address', 'mobile_no', 'gender',
  ]
  for (const k of required) {
    if (!data[k]) errors.push(`${k.replace(/_/g, ' ')} is required`)
  }
  if (data.aadhar_no && !/^\d{12}$/.test(data.aadhar_no)) errors.push('Aadhar must be 12 digits')
  if (data.mobile_no && !/^\d{10}$/.test(data.mobile_no)) errors.push('Mobile must be 10 digits')
  if (data.standard && !STANDARDS.includes(data.standard)) errors.push(`Invalid standard "${data.standard}"`)
  if (data.gender && !GENDERS.includes(data.gender)) errors.push(`Gender must be Male or Female`)
  if (data.vehicle_point && !VEHICLE_POINTS.includes(data.vehicle_point)) errors.push(`Invalid vehicle point "${data.vehicle_point}"`)
  if (data.admission_no) {
    if (seenInFile.has(data.admission_no)) errors.push('Duplicate admission no. in file')
    if (existing.has(data.admission_no)) errors.push('Admission no. already exists')
  }
  return errors
}

export default function BulkImportModal({ existingRecords, onClose, onComplete }: Props) {
  const fileInputRef = useRef<HTMLInputElement>(null)
  const [fileName, setFileName] = useState('')
  const [busy, setBusy] = useState(false)
  const [errorRows, setErrorRows] = useState<RowResult[]>([])
  const [result, setResult] = useState<{ created: number; loginsCreated: number; loginsFailed: number } | null>(null)
  const [topError, setTopError] = useState('')

  function reset() {
    setFileName('')
    setErrorRows([])
    setResult(null)
    setTopError('')
    if (fileInputRef.current) fileInputRef.current.value = ''
  }

  function handleFileChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0]
    if (!file) return
    setFileName(file.name)
    setBusy(true)
    setErrorRows([])
    setResult(null)
    setTopError('')

    const reader = new FileReader()
    reader.onload = async (evt) => {
      try {
        const data = evt.target?.result
        const wb = XLSX.read(data, { type: 'binary' })
        const sheet = wb.Sheets[wb.SheetNames[0]]
        const json: Record<string, string>[] = XLSX.utils.sheet_to_json(sheet, { defval: '' })

        if (json.length === 0) {
          setTopError('This file has no rows to import.')
          setBusy(false)
          return
        }

        const existingNos = new Set(existingRecords.map(r => r.admission_no))
        const seenInFile = new Set<string>()
        const records: AdmissionRecord[] = []
        const problems: RowResult[] = []

        json.forEach((rawRow, idx) => {
          const mapped: Record<string, string> = {}
          for (const [header, value] of Object.entries(rawRow)) {
            const key = COLUMN_MAP[header.trim()]
            if (key) mapped[key] = value as string
          }
          const record = buildRecord(mapped)
          const errors = validateRow(record, seenInFile, existingNos)
          if (record.admission_no) seenInFile.add(record.admission_no)

          if (errors.length > 0) {
            problems.push({ rowNum: idx + 2, name: record.name || '—', admissionNo: record.admission_no || '—', errors })
          } else {
            records.push(record)
          }
        })

        // All-or-nothing: if anything failed validation, stop here and show errors. Nothing is saved.
        if (problems.length > 0) {
          setErrorRows(problems)
          setBusy(false)
          return
        }

        // Every row passed — save them all, then trigger login generation.
        let created = 0
        for (const record of records) {
          await addAdmission(record)
          created++
        }

        let loginsCreated = 0
        let loginsFailed = 0
        try {
          const res = await fetch('/api/admin/create-parent-user', { method: 'POST' })
          if (res.ok) {
            const json = await res.json()
            loginsCreated = json.created ?? 0
            loginsFailed = json.failed ?? 0
          }
        } catch {
          // login generation failure doesn't block showing the import result
        }

        setResult({ created, loginsCreated, loginsFailed })
        setBusy(false)
      } catch {
        setTopError('Could not read this file. Make sure it is a valid .xlsx file using the provided template.')
        setBusy(false)
      }
    }
    reader.onerror = () => {
      setBusy(false)
      setTopError('Failed to read the file.')
    }
    reader.readAsBinaryString(file)
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 backdrop-blur-sm print:hidden">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-2xl max-h-[92vh] flex flex-col overflow-hidden border border-[#E2E8F0]">

        {/* Header */}
        <div
          className="flex items-center justify-between px-6 py-4"
          style={{ borderBottom: '1px solid #F1F5F9', background: 'linear-gradient(135deg,#F8F9FF 0%,#F3F0FF 100%)' }}
        >
          <div>
            <h2 className="text-base font-black text-[#0F172A]">Bulk Import Students</h2>
            <p className="text-xs text-[#64748B] mt-0.5">Upload an Excel file — all rows must be valid to import</p>
          </div>
          <button onClick={onClose} className="text-[#94A3B8] hover:text-[#334155] p-1.5 rounded-xl hover:bg-[#F1F5F9] transition-colors">
            <X className="w-4 h-4" />
          </button>
        </div>

        <div className="flex-1 overflow-y-auto px-6 py-5 space-y-5">

          {/* ── Success result ── */}
          {result && (
            <div className="flex flex-col items-center text-center py-10 gap-3">
              <CheckCircle2 className="w-12 h-12 text-[#16A34A]" />
              <h3 className="text-lg font-black text-[#0F172A]">Import Complete</h3>
              <p className="text-sm text-[#475569]">
                <strong>{result.created}</strong> student{result.created !== 1 ? 's' : ''} added successfully
              </p>
              <p className="text-xs text-[#64748B]">
                Parent logins: <strong>{result.loginsCreated}</strong> created
                {result.loginsFailed > 0 && <span className="text-[#DC2626]"> · {result.loginsFailed} failed</span>}
              </p>
              <button
                onClick={onComplete}
                className="mt-3 px-6 py-2 text-sm font-bold text-white rounded-xl transition-all hover:opacity-90"
                style={{ background: 'linear-gradient(135deg,#6C63FF 0%,#4F46E5 100%)' }}
              >
                Done
              </button>
            </div>
          )}

          {/* ── File picker (shown when no result and no errors yet) ── */}
          {!result && errorRows.length === 0 && (
            <div className="flex flex-col items-center justify-center gap-3 py-12 border-2 border-dashed border-[#E2E8F0] rounded-2xl bg-[#F8F9FF]">
              <FileSpreadsheet className="w-10 h-10 text-[#6C63FF]" />
              <p className="text-sm font-semibold text-[#334155]">Choose an .xlsx file to import</p>
              <p className="text-xs text-[#94A3B8]">Use the templates column headers exactly</p>
              <input
                ref={fileInputRef}
                type="file"
                accept=".xlsx,.xls"
                onChange={handleFileChange}
                className="hidden"
                id="bulk-file-input"
              />
              <label
                htmlFor="bulk-file-input"
                className="cursor-pointer inline-flex items-center gap-2 mt-2 px-5 py-2.5 rounded-xl text-white text-sm font-bold shadow-lg transition-all hover:opacity-90"
                style={{ background: 'linear-gradient(135deg, #6C63FF 0%, #4F46E5 100%)' }}
              >
                <Upload className="w-4 h-4" /> Select File
              </label>
              {busy && (
                <span className="inline-flex items-center gap-2 text-xs text-[#94A3B8] mt-2">
                  <Loader2 className="w-3.5 h-3.5 animate-spin" /> Checking file…
                </span>
              )}
              {topError && (
                <div className="w-full flex items-center gap-2.5 bg-[#FEF2F2] border border-[#FECACA] text-[#DC2626] text-sm rounded-xl px-4 py-3 mt-2">
                  <AlertTriangle className="w-4 h-4 shrink-0" /> {topError}
                </div>
              )}
            </div>
          )}

          {/* ── Error report: nothing was saved ── */}
          {errorRows.length > 0 && (
            <>
              <div className="flex items-center gap-2.5 bg-[#FEF2F2] border border-[#FECACA] text-[#DC2626] text-sm rounded-xl px-4 py-3">
                <AlertTriangle className="w-4 h-4 shrink-0" />
                <span>
                  <strong>{errorRows.length}</strong> row{errorRows.length !== 1 ? 's' : ''} have errors.
                  Nothing was imported — fix these in <strong>{fileName}</strong> and re-upload.
                </span>
              </div>

              <div className="border border-[#E2E8F0] rounded-xl overflow-hidden max-h-80 overflow-y-auto">
                <table className="w-full text-xs">
                  <thead className="sticky top-0 bg-[#F8F9FF]">
                    <tr>
                      <th className="px-3 py-2 text-left font-bold text-[#64748B]">Row</th>
                      <th className="px-3 py-2 text-left font-bold text-[#64748B]">Admission No</th>
                      <th className="px-3 py-2 text-left font-bold text-[#64748B]">Name</th>
                      <th className="px-3 py-2 text-left font-bold text-[#64748B]">Errors</th>
                    </tr>
                  </thead>
                  <tbody>
                    {errorRows.map(r => (
                      <tr key={r.rowNum} className="border-t border-[#F1F5F9]">
                        <td className="px-3 py-2 text-[#94A3B8]">{r.rowNum}</td>
                        <td className="px-3 py-2 font-mono">{r.admissionNo}</td>
                        <td className="px-3 py-2">{r.name}</td>
                        <td className="px-3 py-2 text-[#DC2626]">{r.errors.join('; ')}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              <button onClick={reset} className="text-xs font-semibold text-[#6C63FF] hover:underline">
                Choose a different file
              </button>
            </>
          )}
        </div>
      </div>
    </div>
  )
}