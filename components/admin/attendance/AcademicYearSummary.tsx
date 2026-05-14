'use client'

import { useState, useEffect } from 'react'
import { createBrowserClient } from '@supabase/ssr'
import {
  GraduationCap, TrendingUp, TrendingDown, Users,
  AlertTriangle, CheckCircle2, Loader2, ChevronDown, ChevronUp,
  BarChart3, CalendarDays, Award, BookOpen
} from 'lucide-react'
import { Student, Status, fmtDate, getDaysInMonth } from '@/type/attedence'
import { getAcademicYear, academicMonths } from '@/lib/academicYear'

// ── Types ────────────────────────────────────────────────────────────────────

interface Props {
  students: Student[]
  selectedStandard: string
}

interface MonthStat {
  year: number
  month: number
  present: number
  absent: number
  marked: number
  pct: number | null
}

interface StudentYearStat {
  student: Student
  present: number
  absent: number
  marked: number
  pct: number | null
  months: MonthStat[]
  risk: 'good' | 'warning' | 'danger'
}

interface HolidayMap {
  [dateStr: string]: string
}

// ── Helpers ──────────────────────────────────────────────────────────────────

function riskLevel(pct: number | null): 'good' | 'warning' | 'danger' {
  if (pct === null) return 'warning'
  if (pct >= 75)   return 'good'
  if (pct >= 60)   return 'warning'
  return 'danger'
}

const MONTH_LABELS = ['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec']

// ── Component ────────────────────────────────────────────────────────────────

export default function AcademicYearSummary({ students, selectedStandard }: Props) {
  const supabase = createBrowserClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_DEFAULT_KEY!
  )

  const academicYearStr = getAcademicYear()
  const [startYear, endYear] = academicYearStr.split('-').map(Number)
  const months = academicMonths(startYear)

  const [loading, setLoading]         = useState(false)
  const [yearStats, setYearStats]     = useState<StudentYearStat[]>([])
  const [holidays, setHolidays]       = useState<HolidayMap>({})
  const [expandedId, setExpandedId]   = useState<number | null>(null)
  const [sortBy, setSortBy]           = useState<'name' | 'pct' | 'absent'>('name')
  const [sortDir, setSortDir]         = useState<'asc' | 'desc'>('asc')

  // ── Load all attendance for the academic year ─────────────────────────────
  useEffect(() => {
    if (!students.length) return
    ;(async () => {
      setLoading(true)

      const fromDate = `${startYear}-05-01`
      const toDate   = `${endYear}-03-31`

      // 1. Fetch all holidays in academic year
      const { data: hData } = await supabase
        .from('school_holidays')
        .select('date, title')
        .gte('date', fromDate)
        .lte('date', toDate)
      const hMap: HolidayMap = {}
      ;(hData || []).forEach((h: any) => { hMap[h.date] = h.title })
      setHolidays(hMap)

      // 2. Fetch all attendance records for this class in the academic year
      const { data: attData } = await supabase
        .from('attendance')
        .select('date, student_id, status')
        .eq('standard', selectedStandard)
        .gte('date', fromDate)
        .lte('date', toDate)

      // Build map: dateStr → { studentId → status }
      const attMap: Record<string, Record<number, Status>> = {}
      ;(attData || []).forEach((r: any) => {
        if (!attMap[r.date]) attMap[r.date] = {}
        attMap[r.date][r.student_id] = r.status as Status
      })

      // 3. Compute per-student stats
      const stats: StudentYearStat[] = students.map(student => {
        let totalPresent = 0, totalAbsent = 0, totalMarked = 0

        const monthStats: MonthStat[] = months.map(({ year, month }) => {
          const daysInMonth = getDaysInMonth(year, month)
          let present = 0, absent = 0, marked = 0

          for (let d = 1; d <= daysInMonth; d++) {
            const dateStr = fmtDate(year, month, d)
            if (hMap[dateStr]) continue

            const status = attMap[dateStr]?.[student.id]
            if (status === 'present') { present++; marked++ }
            else if (status === 'absent') { absent++; marked++ }
          }

          totalPresent += present
          totalAbsent  += absent
          totalMarked  += marked

          return {
            year, month, present, absent, marked,
            pct: marked > 0 ? Math.round((present / marked) * 100) : null,
          }
        })

        const pct = totalMarked > 0 ? Math.round((totalPresent / totalMarked) * 100) : null

        return {
          student,
          present: totalPresent,
          absent:  totalAbsent,
          marked:  totalMarked,
          pct,
          months: monthStats,
          risk: riskLevel(pct),
        }
      })

      setYearStats(stats)
      setLoading(false)
    })()
  }, [students, selectedStandard, startYear, endYear])

  // ── Sort ──────────────────────────────────────────────────────────────────
  const sorted = [...yearStats].sort((a, b) => {
    let cmp = 0
    if (sortBy === 'name')   cmp = a.student.name.localeCompare(b.student.name)
    if (sortBy === 'pct')    cmp = (a.pct ?? -1) - (b.pct ?? -1)
    if (sortBy === 'absent') cmp = a.absent - b.absent
    return sortDir === 'asc' ? cmp : -cmp
  })

  function toggleSort(field: typeof sortBy) {
    if (sortBy === field) setSortDir(d => d === 'asc' ? 'desc' : 'asc')
    else { setSortBy(field); setSortDir('asc') }
  }

  // ── Derived class-level stats ─────────────────────────────────────────────
  const classPresent  = yearStats.reduce((s, st) => s + st.present, 0)
  const classAbsent   = yearStats.reduce((s, st) => s + st.absent,  0)
  const classMarked   = yearStats.reduce((s, st) => s + st.marked,  0)
  const classAvgPct   = classMarked > 0 ? Math.round((classPresent / classMarked) * 100) : null
  const atRiskCount   = yearStats.filter(s => s.risk === 'danger').length
  const warningCount  = yearStats.filter(s => s.risk === 'warning').length
  const goodCount     = yearStats.filter(s => s.risk === 'good').length

  if (!students.length) return null

  return (
    <div className="bg-white rounded-xl border border-slate-200 overflow-hidden">

      {/* ── Header ── */}
      <div className="px-4 py-3 border-b border-slate-100 bg-slate-50 flex items-center justify-between flex-wrap gap-2">
        <div className="flex items-center gap-2">
          <GraduationCap className="w-4 h-4 text-teal-600" />
          <p className="text-sm font-bold text-slate-700">Academic Year Summary</p>
          <span className="text-xs text-teal-700 bg-teal-50 border border-teal-200 px-2 py-0.5 rounded-full font-medium">
            {academicYearStr}
          </span>
        </div>
        <div className="flex items-center gap-1 text-xs text-slate-400">
          <CalendarDays className="w-3.5 h-3.5" />
          <span>May {startYear} → March {endYear}</span>
        </div>
      </div>

      {/* ── Loading ── */}
      {loading && (
        <div className="flex items-center justify-center py-10 gap-2 text-slate-400">
          <Loader2 className="w-4 h-4 animate-spin" />
          <span className="text-sm">Computing annual stats…</span>
        </div>
      )}

      {!loading && (
        <>
          {/* ── Class-level KPI cards ── */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 p-4 border-b border-slate-100">

            <div className="bg-slate-50 rounded-xl p-3 border border-slate-100">
              <div className="flex items-center gap-2 mb-1">
                <BarChart3 className="w-3.5 h-3.5 text-slate-400" />
                <span className="text-xs text-slate-400">Class Avg</span>
              </div>
              <p className={`text-2xl font-bold ${
                classAvgPct === null      ? 'text-slate-300' :
                classAvgPct >= 75        ? 'text-emerald-600' :
                classAvgPct >= 60        ? 'text-amber-600'  : 'text-red-600'
              }`}>
                {classAvgPct !== null ? `${classAvgPct}%` : '—'}
              </p>
            </div>

            <div className="bg-emerald-50 rounded-xl p-3 border border-emerald-100">
              <div className="flex items-center gap-2 mb-1">
                <CheckCircle2 className="w-3.5 h-3.5 text-emerald-500" />
                <span className="text-xs text-emerald-600">On Track</span>
              </div>
              <p className="text-2xl font-bold text-emerald-700">{goodCount}</p>
              <p className="text-[10px] text-emerald-500 mt-0.5">≥ 75% attendance</p>
            </div>

            <div className="bg-amber-50 rounded-xl p-3 border border-amber-100">
              <div className="flex items-center gap-2 mb-1">
                <AlertTriangle className="w-3.5 h-3.5 text-amber-500" />
                <span className="text-xs text-amber-600">Warning</span>
              </div>
              <p className="text-2xl font-bold text-amber-700">{warningCount}</p>
              <p className="text-[10px] text-amber-500 mt-0.5">60–74% attendance</p>
            </div>

            <div className="bg-red-50 rounded-xl p-3 border border-red-100">
              <div className="flex items-center gap-2 mb-1">
                <TrendingDown className="w-3.5 h-3.5 text-red-500" />
                <span className="text-xs text-red-600">At Risk</span>
              </div>
              <p className="text-2xl font-bold text-red-700">{atRiskCount}</p>
              <p className="text-[10px] text-red-500 mt-0.5">&lt; 60% attendance</p>
            </div>
          </div>

          {/* ── Month-wise heatmap header ── */}
          <div className="overflow-x-auto">
            <table className="w-full text-xs border-collapse" style={{ minWidth: '700px' }}>
              <thead>
                <tr className="border-b border-slate-200 bg-slate-50">
                  <th
                    className="sticky left-0 z-10 bg-slate-50 px-3 py-2 text-left font-semibold text-slate-600 border-r border-slate-200 min-w-[160px] cursor-pointer select-none hover:text-teal-600"
                    onClick={() => toggleSort('name')}>
                    <span className="flex items-center gap-1">
                      <Users className="w-3 h-3" />
                      Student
                      {sortBy === 'name' && (sortDir === 'asc' ? <ChevronUp className="w-3 h-3" /> : <ChevronDown className="w-3 h-3" />)}
                    </span>
                  </th>

                  {months.map(({ year, month }) => (
                    <th key={`${year}-${month}`}
                      className="px-1 py-2 text-center font-medium text-slate-500 border-r border-slate-100 w-12 whitespace-nowrap">
                      <div>{MONTH_LABELS[month]}</div>
                      <div className="text-[9px] font-normal text-slate-400">{String(year).slice(2)}</div>
                    </th>
                  ))}

                  <th
                    className="px-2 py-2 text-center font-semibold text-red-500 border-r border-slate-100 w-14 cursor-pointer select-none hover:text-red-700"
                    onClick={() => toggleSort('absent')}>
                    <span className="flex flex-col items-center gap-0.5">
                      <span>Absent</span>
                      {sortBy === 'absent' && (sortDir === 'asc' ? <ChevronUp className="w-3 h-3" /> : <ChevronDown className="w-3 h-3" />)}
                    </span>
                  </th>

                  <th
                    className="px-2 py-2 text-center font-semibold text-slate-600 w-20 cursor-pointer select-none hover:text-teal-600"
                    onClick={() => toggleSort('pct')}>
                    <span className="flex flex-col items-center gap-0.5">
                      <span>Annual %</span>
                      {sortBy === 'pct' && (sortDir === 'asc' ? <ChevronUp className="w-3 h-3" /> : <ChevronDown className="w-3 h-3" />)}
                    </span>
                  </th>
                </tr>
              </thead>

              <tbody>
                {sorted.map(stat => {
                  const isExpanded = expandedId === stat.student.id

                  return (
                    <>
                      <tr
                        key={stat.student.id}
                        className={`border-b border-slate-100 transition-colors cursor-pointer group
                          ${isExpanded ? 'bg-slate-50' : 'hover:bg-slate-50'}
                        `}
                        onClick={() => setExpandedId(isExpanded ? null : stat.student.id)}>

                        <td className={`sticky left-0 z-10 px-3 py-2 border-r border-slate-200 transition-colors
                          ${isExpanded ? 'bg-slate-50' : 'bg-white group-hover:bg-slate-50'}
                        `}>
                          <div className="flex items-center justify-between gap-2">
                            <div className="min-w-0">
                              <p className="font-medium text-slate-700 text-xs truncate max-w-[120px]">{stat.student.name}</p>
                              <p className="text-slate-400 text-[10px]">{stat.student.admission_no}</p>
                            </div>
                            <span className={`shrink-0 text-[9px] font-bold px-1.5 py-0.5 rounded-full border ${
                              stat.risk === 'good'    ? 'bg-emerald-50 text-emerald-700 border-emerald-200' :
                              stat.risk === 'warning' ? 'bg-amber-50 text-amber-700 border-amber-200'       :
                                                        'bg-red-50 text-red-700 border-red-200'
                            }`}>
                              {stat.risk === 'good' ? 'OK' : stat.risk === 'warning' ? 'WARN' : 'RISK'}
                            </span>
                          </div>
                        </td>

                        {stat.months.map((m, idx) => {
                          const pct = m.pct
                          const bg =
                            pct === null  ? 'bg-slate-100 text-slate-300'          :
                            pct >= 90     ? 'bg-emerald-500 text-white'             :
                            pct >= 75     ? 'bg-emerald-300 text-emerald-900'       :
                            pct >= 60     ? 'bg-amber-300 text-amber-900'           :
                            pct > 0       ? 'bg-red-400 text-white'                 :
                                            'bg-slate-100 text-slate-300'

                          return (
                            <td key={idx} className="px-0.5 py-1 text-center border-r border-slate-100">
                              <div className={`mx-auto w-9 h-6 rounded text-[10px] font-semibold flex items-center justify-center ${bg}`}>
                                {pct !== null ? `${pct}%` : '—'}
                              </div>
                            </td>
                          )
                        })}

                        <td className="px-2 py-2 text-center border-r border-slate-100">
                          <span className={`inline-flex items-center justify-center w-8 h-6 rounded text-xs font-semibold ${
                            stat.absent > 20 ? 'bg-red-100 text-red-700' :
                            stat.absent > 10 ? 'bg-amber-100 text-amber-700' :
                                               'bg-slate-100 text-slate-600'
                          }`}>
                            {stat.absent}
                          </span>
                        </td>

                        <td className="px-3 py-2">
                          {stat.pct !== null ? (
                            <div className="flex items-center gap-1.5">
                              <div className="flex-1 bg-slate-100 rounded-full h-1.5 overflow-hidden">
                                <div
                                  className={`h-full rounded-full transition-all ${
                                    stat.pct >= 75 ? 'bg-emerald-500' :
                                    stat.pct >= 60 ? 'bg-amber-500'   : 'bg-red-500'
                                  }`}
                                  style={{ width: `${stat.pct}%` }}
                                />
                              </div>
                              <span className={`text-xs font-bold w-9 text-right ${
                                stat.pct >= 75 ? 'text-emerald-600' :
                                stat.pct >= 60 ? 'text-amber-600'   : 'text-red-600'
                              }`}>{stat.pct}%</span>
                            </div>
                          ) : (
                            <span className="text-xs text-slate-300 ml-1">—</span>
                          )}
                        </td>
                      </tr>

                      {isExpanded && (
                        <tr key={`${stat.student.id}-expanded`} className="border-b border-slate-200">
                          <td colSpan={months.length + 3} className="px-4 py-3 bg-slate-50">
                            <div className="flex items-center gap-2 mb-2">
                              <BookOpen className="w-3.5 h-3.5 text-slate-400" />
                              <p className="text-xs font-semibold text-slate-600">
                                Month-by-month breakdown — {stat.student.name}
                              </p>
                            </div>
                            <div className="flex flex-wrap gap-2">
                              {stat.months.map((m, idx) => (
                                <div key={idx}
                                  className={`rounded-lg border px-3 py-2 text-center min-w-[72px] ${
                                    m.pct === null    ? 'bg-white border-slate-200 text-slate-400'      :
                                    m.pct >= 75       ? 'bg-emerald-50 border-emerald-200'              :
                                    m.pct >= 60       ? 'bg-amber-50 border-amber-200'                  :
                                                        'bg-red-50 border-red-200'
                                  }`}>
                                  <p className="text-[10px] font-semibold text-slate-500">
                                    {MONTH_LABELS[m.month]} '{String(m.year).slice(2)}
                                  </p>
                                  <p className={`text-sm font-bold mt-0.5 ${
                                    m.pct === null ? 'text-slate-300' :
                                    m.pct >= 75   ? 'text-emerald-700' :
                                    m.pct >= 60   ? 'text-amber-700'   : 'text-red-700'
                                  }`}>
                                    {m.pct !== null ? `${m.pct}%` : '—'}
                                  </p>
                                  <p className="text-[9px] text-slate-400 mt-0.5">
                                    {m.present}P / {m.absent}A
                                  </p>
                                </div>
                              ))}
                              <div className="rounded-lg border-2 border-teal-300 bg-teal-50 px-3 py-2 text-center min-w-[72px]">
                                <p className="text-[10px] font-bold text-teal-600">FULL YEAR</p>
                                <p className={`text-sm font-bold mt-0.5 ${
                                  stat.pct === null ? 'text-slate-300' :
                                  stat.pct >= 75   ? 'text-emerald-700' :
                                  stat.pct >= 60   ? 'text-amber-700'   : 'text-red-700'
                                }`}>
                                  {stat.pct !== null ? `${stat.pct}%` : '—'}
                                </p>
                                <p className="text-[9px] text-slate-500 mt-0.5">
                                  {stat.present}P / {stat.absent}A
                                </p>
                              </div>
                            </div>
                          </td>
                        </tr>
                      )}
                    </>
                  )
                })}
              </tbody>

              {/* ── Footer totals ── */}
              <tfoot>
                <tr className="border-t-2 border-slate-300 bg-slate-50">
                  <td className="sticky left-0 z-10 bg-slate-50 px-3 py-2 font-semibold text-slate-600 border-r border-slate-200">
                    <div className="flex items-center gap-1.5">
                      <Award className="w-3.5 h-3.5 text-teal-500" />
                      Class Total
                    </div>
                  </td>

                  {months.map(({ year, month }, idx) => {
                    const monthPresent = yearStats.reduce((s, st) => s + (st.months[idx]?.present ?? 0), 0)
                    const monthAbsent  = yearStats.reduce((s, st) => s + (st.months[idx]?.absent ?? 0), 0)
                    const monthMarked  = monthPresent + monthAbsent
                    const monthPct     = monthMarked > 0 ? Math.round((monthPresent / monthMarked) * 100) : null
                    return (
                      <td key={`${year}-${month}`} className="px-0.5 py-1.5 text-center border-r border-slate-100">
                        {monthPct !== null ? (
                          <div className="text-[10px] leading-tight">
                            <div className={`font-bold ${
                              monthPct >= 75 ? 'text-emerald-600' :
                              monthPct >= 60 ? 'text-amber-600'   : 'text-red-600'
                            }`}>{monthPct}%</div>
                          </div>
                        ) : (
                          <span className="text-[10px] text-slate-300">—</span>
                        )}
                      </td>
                    )
                  })}

                  <td className="px-2 py-2 text-center border-r border-slate-100">
                    <span className="text-xs font-bold text-red-600">{classAbsent}</span>
                  </td>
                  <td className="px-3 py-2">
                    {classAvgPct !== null ? (
                      <span className={`text-xs font-bold ${
                        classAvgPct >= 75 ? 'text-emerald-600' :
                        classAvgPct >= 60 ? 'text-amber-600'   : 'text-red-600'
                      }`}>{classAvgPct}%</span>
                    ) : (
                      <span className="text-xs text-slate-300">—</span>
                    )}
                  </td>
                </tr>
              </tfoot>
            </table>
          </div>

          {/* ── Legend ── */}
          <div className="flex items-center flex-wrap gap-4 px-4 py-3 border-t border-slate-100 bg-slate-50 text-xs text-slate-500">
            <span className="font-medium text-slate-600">Heatmap:</span>
            <span className="flex items-center gap-1.5">
              <span className="w-8 h-5 rounded bg-emerald-500 inline-block" />
              ≥ 90%
            </span>
            <span className="flex items-center gap-1.5">
              <span className="w-8 h-5 rounded bg-emerald-300 inline-block" />
              75–89%
            </span>
            <span className="flex items-center gap-1.5">
              <span className="w-8 h-5 rounded bg-amber-300 inline-block" />
              60–74%
            </span>
            <span className="flex items-center gap-1.5">
              <span className="w-8 h-5 rounded bg-red-400 inline-block" />
              &lt; 60%
            </span>
            <span className="flex items-center gap-1.5">
              <span className="w-8 h-5 rounded bg-slate-100 inline-block" />
              Not marked
            </span>
            <span className="ml-auto text-slate-400 flex items-center gap-1">
              <TrendingUp className="w-3 h-3" />
              Click a row to expand month details
            </span>
          </div>
        </>
      )}
    </div>
  )
}