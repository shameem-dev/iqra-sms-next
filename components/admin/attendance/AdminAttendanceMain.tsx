'use client'

import { useState, useEffect } from 'react'
import { Save, Loader2, RefreshCw } from 'lucide-react'
import { createBrowserClient } from '@supabase/ssr'
import { useAttendance } from '@/utils/actions/useAttendance'
import AttendanceControls from './AttendanceControls'
import AttendanceGrid from './AttendanceGrid'
import AttendanceSummary from './AttendanceSummary'
import HolidayManager from './HolidayManager'

export default function AdminAttendance() {
  const today = new Date()
  const supabase = createBrowserClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_DEFAULT_KEY!
  )

  const [selectedStandard, setSelectedStandard] = useState('FS1 A')
  const [year, setYear]   = useState(today.getFullYear())
  const [month, setMonth] = useState(today.getMonth())
  const [holidays, setHolidays] = useState<Record<string, string>>({})
  // holidays = { 'YYYY-MM-DD': 'Holiday Title' }

  const {
    students, attendance, dirtyDates,
    loading, saving, saved, error,
    loadData, toggleStatus, markDayAll, markStudentAll, handleSave,
    getDayStats, getStudentStats,
  } = useAttendance(selectedStandard, year, month)

  // ── Load holidays for current month ──────────────────────────────────────
  useEffect(() => {
    ;(async () => {
      const from = `${year}-${String(month + 1).padStart(2, '0')}-01`
      const lastDay = new Date(year, month + 1, 0).getDate()
      const to   = `${year}-${String(month + 1).padStart(2, '0')}-${String(lastDay).padStart(2, '0')}`
      const { data } = await supabase
        .from('school_holidays')
        .select('date, title')
        .gte('date', from)
        .lte('date', to)
      const map: Record<string, string> = {}
      ;(data || []).forEach((h: any) => { map[h.date] = h.title })
      setHolidays(map)
    })()
  }, [year, month])

  function prevMonth() {
    if (month === 0) { setMonth(11); setYear(y => y - 1) }
    else setMonth(m => m - 1)
  }
  function nextMonth() {
    if (month === 11) { setMonth(0); setYear(y => y + 1) }
    else setMonth(m => m + 1)
  }

  return (
    <div className="w-full space-y-4">

      {/* ── Header ── */}
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div>
          <h2 className="text-lg font-bold text-slate-700">Attendance Register</h2>
          <p className="text-xs text-slate-400 mt-0.5">View and edit attendance for any class</p>
        </div>
        <div className="flex items-center gap-2">
          {dirtyDates.size > 0 && (
            <span className="text-xs text-amber-600 bg-amber-50 border border-amber-200 px-3 py-1.5 rounded-lg">
              {dirtyDates.size} date{dirtyDates.size > 1 ? 's' : ''} unsaved
            </span>
          )}
          <button onClick={loadData} disabled={loading}
            className="h-9 w-9 flex items-center justify-center rounded-lg border border-slate-200 text-slate-500 hover:text-teal-600 hover:border-teal-300 transition-colors">
            <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
          </button>
          <button onClick={handleSave}
            disabled={saving || dirtyDates.size === 0}
            className="h-9 flex items-center gap-2 px-4 text-sm font-semibold bg-teal-600 text-white rounded-lg hover:bg-teal-700 disabled:opacity-50 transition-colors">
            {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
            {saving ? 'Saving…' : 'Save Changes'}
          </button>
        </div>
      </div>

      {/* ── Messages ── */}
      {saved && (
        <div className="p-3 bg-green-50 border border-green-200 rounded-lg text-green-700 text-sm">
          Attendance saved successfully!
        </div>
      )}
      {error && (
        <div className="p-3 bg-red-50 border border-red-200 rounded-lg text-red-700 text-sm">
          {error}
        </div>
      )}

      {/* ── Holiday Manager ── */}
      <HolidayManager />

      {/* ── Controls ── */}
      <AttendanceControls
        selectedStandard={selectedStandard}
        onSelectStandard={setSelectedStandard}
        year={year}
        month={month}
        onPrevMonth={prevMonth}
        onNextMonth={nextMonth}
      />

      {/* ── Empty state ── */}
      {!selectedStandard && (
        <div className="bg-white rounded-xl border border-slate-200 py-16 text-center text-slate-400">
          <p className="text-sm">Select a class above to view attendance</p>
        </div>
      )}

      {/* ── Loading ── */}
      {selectedStandard && loading && (
        <div className="flex items-center justify-center py-16 text-slate-400 gap-2">
          <Loader2 className="w-5 h-5 animate-spin" />
          <span className="text-sm">Loading attendance…</span>
        </div>
      )}

      {/* ── No students ── */}
      {selectedStandard && !loading && students.length === 0 && (
        <div className="bg-white rounded-xl border border-slate-200 py-16 text-center text-slate-400">
          <p className="text-sm">No students found in {selectedStandard}</p>
        </div>
      )}

      {/* ── Grid + Summary ── */}
      {selectedStandard && !loading && students.length > 0 && (
        <>
          <AttendanceGrid
            students={students}
            attendance={attendance}
            dirtyDates={dirtyDates}
            year={year}
            month={month}
            holidays={holidays}
            onToggle={toggleStatus}
            onMarkDayAll={markDayAll}
            onMarkStudentAll={markStudentAll}
            getDayStats={getDayStats}
            getStudentStats={getStudentStats}
          />
          <AttendanceSummary
            students={students}
            attendance={attendance}
            year={year}
            month={month}
          />
        </>
      )}
    </div>
  )
}