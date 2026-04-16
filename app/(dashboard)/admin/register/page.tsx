'use client'
import { useState } from 'react'
import SchoolSidebar from '../componetns/sidebar'

interface Student {
  admNo: string
  name: string
  std: string
  dob: string
  aadhar: string
  parent: string
  mobile: string
  vehicle: string
  address: string
}

const empty: Student = {
  admNo: '', name: '', std: '', dob: '',
  aadhar: '', parent: '', mobile: '', vehicle: '', address: ''
}

export default function AdmissionRegister() {
  const [view, setView] = useState<'form' | 'list'>('form')
  const [form, setForm] = useState<Student>(empty)
  const [students, setStudents] = useState<Student[]>([])
  const [editIdx, setEditIdx] = useState<number | null>(null)
  const [search, setSearch] = useState('')

  const set = (k: keyof Student, v: string) =>
    setForm(p => ({ ...p, [k]: v }))

  const save = () => {
    if (!form.admNo || !form.name) return alert('Admission no. and name are required')
    if (editIdx !== null) {
      setStudents(p => p.map((s, i) => i === editIdx ? form : s))
      setEditIdx(null)
    } else {
      if (students.find(s => s.admNo === form.admNo)) return alert('Admission no. already exists')
      setStudents(p => [...p, form])
    }
    setForm(empty)
    alert('Saved successfully!')
  }

  const edit = (i: number) => {
    setForm(students[i])
    setEditIdx(i)
    setView('form')
  }

  const del = (i: number) => {
    if (!confirm('Delete this student?')) return
    setStudents(p => p.filter((_, idx) => idx !== i))
  }

  const print = (s: Student) => {
    const win = window.open('', '_blank')
    win?.document.write(`
      <html><head><title>Admission Extract</title>
      <style>
        body{font-family:Arial;padding:40px;max-width:560px;margin:auto}
        h2{text-align:center;margin-bottom:2px}
        p.sub{text-align:center;color:#888;font-size:13px;margin-bottom:28px}
        table{width:100%;border-collapse:collapse}
        td{padding:10px 14px;border:1px solid #e0e0e0;font-size:14px}
        td:first-child{font-weight:600;background:#f7f7f7;width:38%;color:#444}
        .sig{display:flex;justify-content:space-between;margin-top:48px;font-size:13px;color:#666}
      </style></head><body>
      <h2>IQRA School</h2><p class="sub">Admission extract</p>
      <table>
        <tr><td>Admission no.</td><td>${s.admNo}</td></tr>
        <tr><td>Name</td><td>${s.name}</td></tr>
        <tr><td>Standard</td><td>${s.std || '—'}</td></tr>
        <tr><td>Date of birth</td><td>${s.dob || '—'}</td></tr>
        <tr><td>Aadhar no.</td><td>${s.aadhar || '—'}</td></tr>
        <tr><td>Parent / guardian</td><td>${s.parent || '—'}</td></tr>
        <tr><td>Mobile no.</td><td>${s.mobile || '—'}</td></tr>
        <tr><td>Vehicle point</td><td>${s.vehicle || '—'}</td></tr>
        <tr><td>Address</td><td>${s.address || '—'}</td></tr>
      </table>
      <div class="sig">
        <span>Date: ${new Date().toLocaleDateString('en-IN')}</span>
        <span>Signature: _______________</span>
      </div>
      <script>window.print()<\/script>
      </body></html>
    `)
    win?.document.close()
  }

  const initials = (name: string) =>
    name.split(' ').slice(0, 2).map(w => w[0]).join('').toUpperCase()

  const filtered = students.filter(s =>
    s.name.toLowerCase().includes(search.toLowerCase()) ||
    s.admNo.includes(search)
  )

  const classes = ['LKG','UKG','1','2','3','4','5','6','7','8','9','10']

  return (
    <div>
        
        <div className="min-h-screen bg-gray-50 flex">

        <SchoolSidebar />
        <div className="min-w-3xl mx-auto pt-4">

            {/* Topbar */}
            <div className="flex justify-between items-center mb-8">
            <h1 className="font-medium text-2xl  font-bold text-gray-900">Admission register</h1>
            <div className="flex gap-0.5 bg-gray-100 rounded-lg p-1">
                {(['form', 'list'] as const).map(t => (
                <button
                    key={t}
                    onClick={() => setView(t)}
                    className={`px-4 py-1.5 text-sm rounded-md transition-all ${
                    view === t
                        ? 'bg-white text-gray-900 font-medium shadow-sm border border-gray-200'
                        : 'text-gray-500 hover:text-gray-700'
                    }`}
                >
                    {t === 'form' ? 'New admission' : `Register${students.length ? ` (${students.length})` : ''}`}
                </button>
                ))}
            </div>
            </div>

            {/* Form */}
            {view === 'form' && (
            <div className="bg-white border border-gray-100 rounded-2xl p-6">

                <p className="text-xs font-medium text-gray-400 uppercase tracking-wider mb-4 pb-3 border-b border-gray-100">
                Student details
                </p>
                <div className="grid grid-cols-3 gap-4 mb-6">
                <Field label="Admission no. *">
                    <input value={form.admNo} onChange={e => set('admNo', e.target.value)}
                    placeholder="2024-001" className={input} />
                </Field>
                <Field label="Full name *" className="col-span-2">
                    <input value={form.name} onChange={e => set('name', e.target.value)}
                    placeholder="Student full name" className={input} />
                </Field>
                <Field label="Standard">
                    <select value={form.std} onChange={e => set('std', e.target.value)} className={input}>
                    <option value="">Select</option>
                    {classes.map(c => <option key={c}>{c}</option>)}
                    </select>
                </Field>
                <Field label="Date of birth">
                    <input type="date" value={form.dob} onChange={e => set('dob', e.target.value)} className={input} />
                </Field>
                <Field label="Aadhar no.">
                    <input value={form.aadhar} onChange={e => set('aadhar', e.target.value)}
                    placeholder="xxxx xxxx xxxx" maxLength={14} className={input} />
                </Field>
                </div>

                <p className="text-xs font-medium text-gray-400 uppercase tracking-wider mb-4 pb-3 border-b border-gray-100">
                Contact & transport
                </p>
                <div className="grid grid-cols-2 gap-4">
                <Field label="Parent / guardian">
                    <input value={form.parent} onChange={e => set('parent', e.target.value)}
                    placeholder="Parent name" className={input} />
                </Field>
                <Field label="Mobile no.">
                    <input type="tel" value={form.mobile} onChange={e => set('mobile', e.target.value)}
                    placeholder="10-digit number" maxLength={10} className={input} />
                </Field>
                <Field label="Vehicle point">
                    <input value={form.vehicle} onChange={e => set('vehicle', e.target.value)}
                    placeholder="Bus stop or pickup point" className={input} />
                </Field>
                <Field label="Address">
                    <textarea value={form.address} onChange={e => set('address', e.target.value)}
                    placeholder="Full address" rows={2}
                    className={`${input} resize-none`} />
                </Field>
                </div>

                <div className="flex justify-end gap-2 mt-6 pt-4 border-t border-gray-100">
                <button onClick={() => { setForm(empty); setEditIdx(null) }}
                    className="px-4 py-2 text-sm text-gray-600 border border-gray-200 rounded-lg hover:bg-gray-50">
                    Clear
                </button>
                <button onClick={save}
                    className="px-4 py-2 text-sm bg-blue-600 text-white rounded-lg hover:bg-blue-700">
                    {editIdx !== null ? 'Update student' : 'Save admission'}
                </button>
                </div>
            </div>
            )}

            {/* List */}
            {view === 'list' && (
            <div className="bg-white border border-gray-100 rounded-2xl p-6">
                <div className="flex gap-2 mb-5">
                <input value={search} onChange={e => setSearch(e.target.value)}
                    placeholder="Search by name or admission no."
                    className={`${input} flex-1`} />
                <button onClick={() => setView('form')}
                    className="px-4 py-2 text-sm bg-emerald-700 text-white rounded-lg hover:bg-emerald-800 whitespace-nowrap">
                    + New
                </button>
                </div>

                {filtered.length === 0 ? (
                <p className="text-center text-gray-400 text-sm py-16">
                    {students.length === 0 ? 'No students yet — add from New admission' : 'No results found'}
                </p>
                ) : (
                <table className="w-full text-sm" style={{ tableLayout: 'fixed' }}>
                    <thead>
                    <tr>
                        {['Student', 'Std', 'Parent', 'Mobile', 'Vehicle', ''].map(h => (
                        <th key={h} className="text-left text-xs font-medium text-gray-400 pb-3 border-b border-gray-100 px-2 first:pl-0">
                            {h}
                        </th>
                        ))}
                    </tr>
                    </thead>
                    <tbody>
                    {filtered.map((s, i) => (
                        <tr key={s.admNo} className="group">
                        <td className="py-3 px-2 pl-0">
                            <div className="flex items-center gap-2">
                            <div className="w-8 h-8 rounded-full bg-blue-50 flex items-center justify-center text-xs font-medium text-blue-700 shrink-0">
                                {initials(s.name)}
                            </div>
                            <div>
                                <p className="font-medium text-gray-900 truncate">{s.name}</p>
                                <p className="text-xs text-gray-400">{s.admNo}</p>
                            </div>
                            </div>
                        </td>
                        <td className="py-3 px-2">
                            <span className="text-xs px-2 py-0.5 bg-blue-50 text-blue-700 rounded-full">{s.std || '—'}</span>
                        </td>
                        <td className="py-3 px-2 text-gray-600 truncate">{s.parent || '—'}</td>
                        <td className="py-3 px-2 text-gray-600">{s.mobile || '—'}</td>
                        <td className="py-3 px-2 text-gray-600 truncate">{s.vehicle || '—'}</td>
                        <td className="py-3 px-2">
                            <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                            <button onClick={() => edit(i)}
                                className="text-xs px-2 py-1 border border-gray-200 rounded-md hover:bg-gray-50 text-gray-600">
                                Edit
                            </button>
                            <button onClick={() => print(s)}
                                className="text-xs px-2 py-1 border border-gray-200 rounded-md hover:bg-gray-50 text-gray-600">
                                Print
                            </button>
                            <button onClick={() => del(i)}
                                className="text-xs px-2 py-1 border border-gray-200 rounded-md hover:bg-red-50 text-red-500">
                                Del
                            </button>
                            </div>
                        </td>
                        </tr>
                    ))}
                    </tbody>
                </table>
                )}
            </div>
            )}
        </div>
        </div>
    </div>
  )
}

const input = "w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white"

function Field({ label, children, className = '' }: {
  label: string
  children: React.ReactNode
  className?: string
}) {
  return (
    <div className={`flex flex-col gap-1.5 ${className}`}>
      <label className="text-xs text-gray-500">{label}</label>
      {children}
    </div>
  )
}