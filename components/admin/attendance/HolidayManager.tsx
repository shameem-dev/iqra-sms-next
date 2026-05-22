'use client'

import { useState, useEffect } from 'react'
import { createBrowserClient } from '@supabase/ssr'
import { Plus, Trash2, Loader2, CalendarX } from 'lucide-react'

interface Holiday {
  id: string
  date: string
  title: string
  type: string
}

const TYPE_OPTIONS = [
  { value: 'holiday', label: 'Public Holiday', color: 'bg-emerald-50 text-emerald-700 border-emerald-200' },
  { value: 'leave',   label: 'School Leave',   color: 'bg-blue-50 text-blue-700 border-blue-200'         },
  { value: 'exam',    label: 'Exam Day',        color: 'bg-violet-50 text-violet-700 border-violet-200'   },
  { value: 'event',   label: 'School Event',    color: 'bg-amber-50 text-amber-700 border-amber-200'      },
]

function getTypeStyle(type: string) {
  return TYPE_OPTIONS.find(t => t.value === type)?.color || 'bg-slate-50 text-slate-600 border-slate-200'
}

function getTypeLabel(type: string) {
  return TYPE_OPTIONS.find(t => t.value === type)?.label || type
}

export default function HolidayManager() {
  const supabase = createBrowserClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_DEFAULT_KEY!
  )

  const [holidays, setHolidays]       = useState<Holiday[]>([])
  const [loading, setLoading]         = useState(true)
  const [saving, setSaving]           = useState(false)
  const [deletingId, setDeletingId]   = useState<string | null>(null)
  const [error, setError]             = useState('')
  const [showForm, setShowForm]       = useState(false)

  // Form state
  const [date, setDate]   = useState('')
  const [title, setTitle] = useState('')
  const [type, setType]   = useState('holiday')

  async function loadHolidays() {
    setLoading(true)
    const { data, error } = await supabase
      .from('school_holidays')
      .select('*')
      .order('date', { ascending: true })
    if (error) setError(error.message)
    setHolidays(data || [])
    setLoading(false)
  }

  useEffect(() => { loadHolidays() }, [])

  async function handleAdd() {
    if (!date || !title.trim()) { setError('Date and title are required'); return }
    setSaving(true); setError('')
    const { error: err } = await supabase
      .from('school_holidays')
      .insert({ date, title: title.trim(), type })
    if (err) { setError(err.message); setSaving(false); return }
    setDate(''); setTitle(''); setType('holiday'); setShowForm(false)
    await loadHolidays()
    setSaving(false)
  }

  // ── Fixed delete with error handling ─────────────────────────────────────
  async function handleDelete(id: string) {
    setDeletingId(id); setError('')
    const { error: err } = await supabase
      .from('school_holidays')
      .delete()
      .eq('id', id)
    if (err) {
      setError(`Delete failed: ${err.message}`)
      setDeletingId(null)
      return
    }
    // Remove from local state immediately — no need to reload
    setHolidays(prev => prev.filter(h => h.id !== id))
    setDeletingId(null)
  }

  // Group by month
  const grouped: Record<string, Holiday[]> = {}
  holidays.forEach(h => {
    const key = h.date.slice(0, 7)
    if (!grouped[key]) grouped[key] = []
    grouped[key].push(h)
  })

  return (
    <div className="bg-white rounded-xl border border-slate-200 overflow-hidden">

      {/* Header */}
      <div className="flex items-center justify-between px-4 py-3 border-b border-slate-100 bg-slate-50">
        <div className="flex items-center gap-2">
          <CalendarX className="w-4 h-4 text-slate-500" />
          <p className="text-sm font-bold text-slate-700">Holidays & Leave Days</p>
          <span className="text-xs text-slate-400 bg-slate-100 px-2 py-0.5 rounded-full">
            {holidays.length} days
          </span>
        </div>
        <button
          onClick={() => { setShowForm(s => !s); setError('') }}
          className="flex items-center gap-1.5 h-8 px-3 text-xs font-medium bg-teal-600 text-white rounded-lg hover:bg-teal-700 transition-colors">
          <Plus className="w-3.5 h-3.5" />
          Add Day
        </button>
      </div>

      {/* Add form */}
      {showForm && (
        <div className="px-4 py-4 border-b border-slate-100 bg-teal-50/30 space-y-3">
          <p className="text-xs font-semibold text-slate-600">Add Holiday / Leave Day</p>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <div>
              <label className="block text-xs text-slate-500 mb-1">Date *</label>
              <input type="date" value={date} onChange={e => setDate(e.target.value)}
                className="w-full h-8 px-2 text-sm border text-black border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-teal-500" />
            </div>
            <div>
              <label className="block text-xs text-slate-500 mb-1">Title *</label>
              <input type="text" value={title} onChange={e => setTitle(e.target.value)}
                placeholder="e.g. Eid Al-Fitr"
                className="w-full h-8 px-2 text-sm  text-black border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-teal-500" />
            </div>
            <div>
              <label className="block text-xs text-slate-500 mb-1">Type *</label>
              <select value={type} onChange={e => setType(e.target.value)}
                className="w-full h-8 px-2 text-sm border text-black border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-teal-500">
                {TYPE_OPTIONS.map(t => (
                  <option key={t.value} value={t.value}>{t.label}</option>
                ))}
              </select>
            </div>
          </div>
          {error && <p className="text-xs text-red-600">{error}</p>}
          <div className="flex gap-2">
            <button onClick={handleAdd} disabled={saving}
              className="h-8 flex items-center gap-1.5 px-4 text-xs font-semibold bg-teal-600 text-white rounded-lg hover:bg-teal-700 disabled:opacity-60 transition-colors">
              {saving ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Plus className="w-3.5 h-3.5" />}
              {saving ? 'Adding…' : 'Add'}
            </button>
            <button onClick={() => { setShowForm(false); setError('') }}
              className="h-8 px-4 text-xs text-slate-600 border border-slate-200 rounded-lg hover:bg-slate-50 transition-colors">
              Cancel
            </button>
          </div>
        </div>
      )}

      {/* Error banner */}
      {error && !showForm && (
        <div className="mx-4 mt-3 p-3 bg-red-50 border border-red-200 rounded-lg text-red-700 text-xs flex items-center justify-between">
          <span>{error}</span>
          <button onClick={() => setError('')} className="text-red-400 hover:text-red-600 ml-2">✕</button>
        </div>
      )}

      {/* Holiday list */}
      {loading ? (
        <div className="flex items-center justify-center py-8 text-slate-400 gap-2">
          <Loader2 className="w-4 h-4 animate-spin" />
          <span className="text-xs">Loading…</span>
        </div>
      ) : holidays.length === 0 ? (
        <div className="py-10 text-center text-slate-400">
          <CalendarX className="w-8 h-8 mx-auto mb-2 text-slate-200" />
          <p className="text-sm">No holidays added yet</p>
          <p className="text-xs mt-1">Add holidays to block attendance for those days</p>
        </div>
      ) : (
        <div className="divide-y divide-slate-100 max-h-64 overflow-y-auto">
          {Object.entries(grouped).map(([monthKey, days]) => (
            <div key={monthKey}>
              <div className="px-4 py-1.5 bg-slate-50 text-xs font-semibold text-slate-500">
                {new Date(monthKey + '-01').toLocaleString('en-IN', { month: 'long', year: 'numeric' })}
              </div>
              {days.map(h => (
                <div key={h.id}
                  className="flex items-center justify-between px-4 py-2.5 hover:bg-slate-50 transition-colors">
                  <div className="flex items-center gap-3">
                    <span className="text-xs font-mono text-slate-500 w-16">
                      {new Date(h.date + 'T00:00:00').toLocaleDateString('en-IN', { day: '2-digit', month: 'short' })}
                    </span>
                    <span className={`text-xs font-medium px-2 py-0.5 rounded-full border ${getTypeStyle(h.type)}`}>
                      {getTypeLabel(h.type)}
                    </span>
                    <span className="text-sm text-slate-700">{h.title}</span>
                  </div>
                  <button
                    onClick={() => handleDelete(h.id)}
                    disabled={deletingId === h.id}
                    className="p-1.5 text-slate-300 hover:text-red-500 hover:bg-red-50 rounded-lg transition-colors disabled:opacity-50">
                    {deletingId === h.id
                      ? <Loader2 className="w-3.5 h-3.5 animate-spin" />
                      : <Trash2 className="w-3.5 h-3.5" />
                    }
                  </button>
                </div>
              ))}
            </div>
          ))}
        </div>
      )}
    </div>
  )
}