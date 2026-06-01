'use client'

import { useState, useEffect } from 'react'
import { Save, Loader2, RefreshCw } from 'lucide-react'
import { createBrowserClient } from '@supabase/ssr'
import { useAttendance } from '@/utils/actions/useAttendance'
import AttendanceControls from './AttendanceControls'
import AttendanceGrid from './AttendanceGrid'
import AttendanceSummary from './AttendanceSummary'
import HolidayManager from './HolidayManager'
import AcademicYearSummary from './AcademicYearSummary'

export default function AdminAttendance() {
  const today = new Date()
  const supabase = createBrowserClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_DEFAULT_KEY!
  )

  const [selectedStandard, setSelectedStandard] = useState('LKG A')
  const [year, setYear]   = useState(today.getFullYear())
  const [month, setMonth] = useState(today.getMonth())
  const [holidays, setHolidays] = useState<Record<string, string>>({})

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

  // ── Derived stats ─────────────────────────────────────────────────────────
  const todayStr = `${year}-${String(month + 1).padStart(2, '0')}-${String(today.getDate()).padStart(2, '0')}`
  const todayStats = getDayStats(todayStr)
  const avgPct = students.length > 0
    ? Math.round(
        students.reduce((sum, s) => {
          const stats = getStudentStats(s.id)
          const total = (stats?.present ?? 0) + (stats?.absent ?? 0)
          return sum + (total > 0 ? ((stats?.present ?? 0) / total) * 100 : 0)
        }, 0) / students.length
      )
    : 0

  return (
    <div className="w-full space-y-4">

      {/* ── Header ── */}
      <div className="flex items-center justify-end flex-wrap gap-3">
     
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

      {/* ── Stats Cards ── */}
      {selectedStandard && !loading && students.length > 0 && (
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
          {/* Students */}
          <div className="relative overflow-hidden rounded-2xl px-5 py-4 bg-[linear-gradient(135deg,_#7C3AED_0%,_#4F46E5_55%,_#3730A3_100%)] shadow-lg shadow-violet-200">
            <div className="absolute -right-5 -top-5 w-24 h-24 rounded-full bg-white/10" />
            <div className="absolute right-3 bottom-2 w-12 h-12 rounded-full bg-black/10" />
            <div className="relative z-10">
              <p className="text-[10px] font-bold uppercase tracking-[.18em] text-white/60 mb-2">Students</p>
              <p className="text-2xl font-black text-white leading-none">{students.length}</p>
              <p className="text-[11px] text-white/50 mt-1">{selectedStandard}</p>
            </div>
          </div>

          {/* Present Today */}
          <div className="relative overflow-hidden rounded-2xl px-5 py-4 bg-[linear-gradient(135deg,_#059669_0%,_#0D9488_55%,_#0891B2_100%)] shadow-lg shadow-emerald-200">
            <div className="absolute -right-5 -top-5 w-24 h-24 rounded-full bg-white/10" />
            <div className="absolute right-3 bottom-2 w-12 h-12 rounded-full bg-black/10" />
            <div className="relative z-10">
              <p className="text-[10px] font-bold uppercase tracking-[.18em] text-white/60 mb-2">Present Today</p>
              <p className="text-2xl font-black text-white leading-none">{todayStats?.present ?? 0}</p>
              <p className="text-[11px] text-white/50 mt-1">of {students.length} students</p>
            </div>
          </div>

          {/* Absent Today */}
          <div className="relative overflow-hidden rounded-2xl px-5 py-4 bg-[linear-gradient(135deg,_#F59E0B_0%,_#EF4444_55%,_#EC4899_100%)] shadow-lg shadow-amber-200">
            <div className="absolute -right-5 -top-5 w-24 h-24 rounded-full bg-white/10" />
            <div className="absolute right-3 bottom-2 w-12 h-12 rounded-full bg-black/10" />
            <div className="relative z-10">
              <p className="text-[10px] font-bold uppercase tracking-[.18em] text-white/60 mb-2">Absent Today</p>
              <p className="text-2xl font-black text-white leading-none">{todayStats?.absent ?? 0}</p>
              <p className="text-[11px] text-white/50 mt-1">of {students.length} students</p>
            </div>
          </div>

          {/* Avg Attendance */}
          <div className="relative overflow-hidden rounded-2xl px-5 py-4 bg-[linear-gradient(135deg,_#2563EB_0%,_#7C3AED_55%,_#DB2777_100%)] shadow-lg shadow-blue-200">
            <div className="absolute -right-5 -top-5 w-24 h-24 rounded-full bg-white/10" />
            <div className="absolute right-3 bottom-2 w-12 h-12 rounded-full bg-black/10" />
            <div className="relative z-10">
              <p className="text-[10px] font-bold uppercase tracking-[.18em] text-white/60 mb-2">Avg Attendance</p>
              <p className="text-2xl font-black text-white leading-none">{avgPct}%</p>
              <p className="text-[11px] text-white/50 mt-1">this month</p>
            </div>
          </div>
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

      {/* ── Grid + Monthly Summary + Annual Summary ── */}
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
          <AcademicYearSummary
            students={students}
            selectedStandard={selectedStandard}
          />
        </>
      )}
    </div>
  )
}