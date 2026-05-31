'use client'

import { useEffect, useState, useCallback, useRef } from 'react'
import { Chart, ArcElement, Tooltip, Legend, PieController } from 'chart.js'
import {
  Users,
  GraduationCap,
  Wallet,
  RefreshCw,
  TrendingUp,
  AlertTriangle,
  BookOpen,
} from 'lucide-react'
import { getAllStaff } from '@/utils/actions/staff-actions'
import { getAdmissions } from '@/utils/actions/admissions'
import {
  fetchTotals,
  fetchCategorySummary,
  fetchEntries,
} from '@/utils/actions/Accounts'
import { createBrowserClient } from '@supabase/ssr'
import {
  getDailyAttendanceStats,
  DailyAttendanceStats,
  fmtDate,
  getDaysInMonth,
  Status,
} from '@/type/attedence'

Chart.register(PieController, ArcElement, Tooltip, Legend)

// ─── Supabase client (singleton) ─────────────────────────────────────────────
function getSupabase() {
  return createBrowserClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_DEFAULT_KEY!
  )
}

// ─── Fetch attendance for current month ──────────────────────────────────────
async function fetchAllAttendance(
  year: number,
  month: number
): Promise<Record<string, Record<number, Status>>> {
  const supabase = getSupabase()
  const daysInMonth = getDaysInMonth(year, month)
  const from = fmtDate(year, month, 1)
  const to = fmtDate(year, month, daysInMonth)

  const { data, error } = await supabase
    .from('attendance')
    .select('student_id, date, status')
    .gte('date', from)
    .lte('date', to)

  if (error) throw new Error(error.message)

  const attMap: Record<string, Record<number, Status>> = {}
  ;(data || []).forEach((a: any) => {
    if (!attMap[a.date]) attMap[a.date] = {}
    attMap[a.date][a.student_id] = a.status as Status
  })

  return attMap
}

// ─── Helpers ─────────────────────────────────────────────────────────────────
const fmtINR = (n: number) =>
  new Intl.NumberFormat('en-IN', {
    style: 'currency',
    currency: 'INR',
    maximumSignificantDigits: 3,
    notation: Math.abs(n) >= 100000 ? 'compact' : 'standard',
  }).format(n)

// ─── KPI Card ─────────────────────────────────────────────────────────────────
function KpiCard({
  label,
  value,
  sub,
  icon: Icon,
  gradient,
  badge,
  badgePositive,
}: any) {
  return (
    <div className={`relative overflow-hidden rounded-[24px] p-6 ${gradient} shadow-xl`}>
      <div className="absolute -right-8 -top-8 w-40 h-40 rounded-full bg-white/10" />
      <div className="absolute right-4 bottom-4 w-20 h-20 rounded-full bg-black/10" />
      <div className="absolute -left-4 -bottom-6 w-28 h-28 rounded-full bg-white/8" />

      <div className="relative z-10 flex flex-col gap-4">
        <div className="flex items-start justify-between">
          <span className="text-[10px] font-bold uppercase tracking-[.2em] text-white/60">
            {label}
          </span>
          <div className="w-10 h-10 rounded-2xl bg-white/20 backdrop-blur-sm flex items-center justify-center shadow-inner">
            <Icon size={18} className="text-white drop-shadow" />
          </div>
        </div>

        <p className="text-[2.4rem] font-black leading-none text-white tracking-tight drop-shadow-sm">
          {value}
        </p>

        {(sub || badge) && (
          <div className="flex items-center gap-2 flex-wrap">
            {badge && (
              <span className="text-[10px] font-bold px-2.5 py-1 rounded-full bg-black/20 text-white/90 backdrop-blur-sm">
                {badge}
              </span>
            )}
            {sub && (
              <span className="text-[11px] text-white/55 font-medium">{sub}</span>
            )}
          </div>
        )}
      </div>
    </div>
  )
}

// ─── Stream Row ───────────────────────────────────────────────────────────────
function StreamRow({ label, amount, total, colors }: any) {
  const p = total > 0 ? Math.min(Math.round((amount / total) * 100), 100) : 0
  return (
    <div className="py-0.5">
      <div className="flex justify-between items-center mb-2">
        <span className="text-[13px] text-slate-500 font-medium capitalize">
          {label.replace(/_/g, ' ')}
        </span>
        <span className="text-[13px] font-bold text-slate-800">
          {fmtINR(amount)}
        </span>
      </div>
      <div className="h-[5px] bg-slate-100 rounded-full overflow-hidden">
        <div
          className={`h-full rounded-full ${colors}`}
          style={{ width: `${p}%`, transition: 'width 1.2s cubic-bezier(.4,0,.2,1)' }}
        />
      </div>
    </div>
  )
}

// ─── Grade Chip ───────────────────────────────────────────────────────────────
const chipColors = [
  'bg-violet-100 text-violet-700 border-violet-200',
  'bg-sky-100 text-sky-700 border-sky-200',
  'bg-emerald-100 text-emerald-700 border-emerald-200',
  'bg-amber-100 text-amber-700 border-amber-200',
  'bg-rose-100 text-rose-700 border-rose-200',
  'bg-indigo-100 text-indigo-700 border-indigo-200',
]

function GradeChip({ grade, count, idx }: { grade: string; count: number; idx: number }) {
  const c = chipColors[idx % chipColors.length]
  return (
    <div className={`${c} border rounded-2xl py-3.5 text-center hover:-translate-y-1 transition-transform duration-150`}>
      <p className="text-[9px] font-bold uppercase tracking-[.12em] opacity-60 mb-1">Gr {grade}</p>
      <p className="text-xl font-black">{count}</p>
    </div>
  )
}

// ─── Pie Chart ────────────────────────────────────────────────────────────────
const SLICE_COLORS = [
  '#7C3AED','#6366F1','#3B82F6','#06B6D4','#10B981',
  '#F59E0B','#EF4444','#EC4899','#8B5CF6','#14B8A6',
  '#F97316','#84CC16',
]

function StudentsPieChart({ classes }: { classes: { s: string; c: number }[] }) {
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const chartRef  = useRef<Chart | null>(null)

  useEffect(() => {
    if (!canvasRef.current || !classes.length) return
    if (chartRef.current) chartRef.current.destroy()
    const total = classes.reduce((sum, c) => sum + c.c, 0)
    chartRef.current = new Chart(canvasRef.current, {
      type: 'pie',
      data: {
        labels: classes.map((c) => `Grade ${c.s}`),
        datasets: [{
          data: classes.map((c) => c.c),
          backgroundColor: classes.map((_, i) => SLICE_COLORS[i % SLICE_COLORS.length]),
          borderColor: '#ffffff',
          borderWidth: 2,
          hoverOffset: 6,
        }],
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        plugins: {
          legend: { display: false },
          tooltip: {
            callbacks: {
              label: (ctx) => {
                const val = ctx.parsed as number
                const pct = total > 0 ? Math.round((val / total) * 100) : 0
                return ` ${val} students (${pct}%)`
              },
            },
          },
        },
      },
    })
    return () => { chartRef.current?.destroy() }
  }, [classes])

  const total = classes.reduce((sum, c) => sum + c.c, 0)

  return (
    <div>
      <div className="flex flex-wrap gap-x-4 gap-y-2 mb-5">
        {classes.map((cls, i) => {
          const pct = total > 0 ? Math.round((cls.c / total) * 100) : 0
          return (
            <div key={cls.s} className="flex items-center gap-1.5">
              <span className="inline-block w-2.5 h-2.5 rounded-[3px] flex-shrink-0"
                style={{ background: SLICE_COLORS[i % SLICE_COLORS.length] }} />
              <span className="text-[11px] text-slate-500 font-medium">
                Gr {cls.s}<span className="text-slate-400 ml-1">{pct}%</span>
              </span>
            </div>
          )
        })}
      </div>
      <div className="relative w-full h-[220px]">
        <canvas ref={canvasRef} />
      </div>
      <div className="mt-4 text-center">
        <p className="text-[9px] font-bold uppercase tracking-[.18em] text-slate-400 mb-1">Total Students</p>
        <p className="text-2xl font-black text-slate-800">{total}</p>
      </div>
    </div>
  )
}

// ─── Category label resolvers ─────────────────────────────────────────────────
const INCOME_LABELS: Record<string, string> = {
  daily_fees: 'Daily Fees', book: 'Book Sales', receipt: 'Receipt', other: 'Others',
}
const EXPENDITURE_LABELS: Record<string, string> = {
  salary: 'Salary', vehicle_rent: 'Vehicle Rent', kseb_bill: 'KSEB Bill',
  gas: 'Gas', internet: 'Internet', stationary: 'Stationary', staff_ta: 'Staff TA',
  training: 'Training', medical: 'Medical', building_rent: 'Building Rent',
  kuri: 'Kuri Amount', trophy: 'Trophy & Awards', annual_day: 'Annual Day',
  iame: 'IAME Expenses', other: 'Others',
}
function resolveLabel(entry: any): string {
  if (entry.type === 'income') return INCOME_LABELS[entry.income_category] ?? entry.income_category ?? '—'
  return EXPENDITURE_LABELS[entry.expenditure_category] ?? entry.expenditure_category ?? '—'
}
function resolveSub(entry: any): string | null {
  return (
    entry.staff_name ??
    entry.vehicle_no ??
    (entry.book_no ? `Book: ${entry.book_no}` : null) ??
    (entry.receipt_no ? `Receipt: ${entry.receipt_no}` : null) ??
    entry.notes ??
    null
  )
}

// ─── Today's Summary ──────────────────────────────────────────────────────────
function TodaySummary({
  todayIncome, todayExpense, entryCount, recentEntries,
}: {
  todayIncome: number; todayExpense: number; entryCount: number; recentEntries: any[]
}) {
  const todayNet = todayIncome - todayExpense
  const isDeficit = todayNet < 0
  const dateLabel = new Date().toLocaleDateString('en-IN', {
    weekday: 'long', day: 'numeric', month: 'long', year: 'numeric',
  })

  return (
    <div className="bg-white rounded-[24px] border border-slate-100 shadow-sm p-7">
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-2.5">
          <div className="w-2.5 h-2.5 rounded-full bg-indigo-500 shadow-sm shadow-indigo-300 animate-pulse" />
          <h2 className="text-[10px] font-bold uppercase tracking-[.18em] text-slate-400">Today's Summary</h2>
        </div>
        <span className="text-[10px] text-slate-400 font-medium">{dateLabel}</span>
      </div>

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-7">
        <div className="rounded-2xl bg-slate-50 border border-slate-100 px-4 py-4">
          <p className="text-[9px] font-bold uppercase tracking-[.18em] text-slate-400 mb-2">Transactions</p>
          <p className="text-2xl font-black text-slate-800">{entryCount}</p>
          <p className="text-[12px] text-slate-800 mt-1">Entries recorded</p>
        </div>
        <div className="rounded-2xl bg-emerald-50 border border-emerald-100 px-4 py-4">
          <p className="text-[9px] font-bold uppercase tracking-[.18em] text-emerald-500 mb-2">Income</p>
          <p className="text-2xl font-black text-emerald-700">{fmtINR(todayIncome)}</p>
          <p className="text-[12px] text-emerald-800 font-medium mt-1">Collected today</p>
        </div>
        <div className="rounded-2xl bg-rose-50 border border-rose-100 px-4 py-4">
          <p className="text-[9px] font-bold uppercase tracking-[.18em] text-rose-500 mb-2">Expenditure</p>
          <p className="text-2xl font-black text-rose-600">{fmtINR(todayExpense)}</p>
          <p className="text-[12px] text-rose-400 font-medium mt-1">Spent today</p>
        </div>
        <div className={`rounded-2xl px-4 py-4 border${isDeficit ? 'text-rose-600 bg-rose-50 border-rose-100' : ' text-sky-700 bg-sky-50 border-sky-100'}`}>
          <p className={`text-[9px] font-bold uppercase tracking-[.18em] mb-2 ${isDeficit ? 'text-rose-500' : 'text-sky-500'}`}>
            Net Today
          </p>
          <p className={`text-2xl font-black ${isDeficit ? 'text-rose-600' : 'text-sky-700'}`}>
            {isDeficit ? '' : '+'}{fmtINR(todayNet)}
          </p>
          <p className={`text-[12px] mt-1 ${isDeficit ? 'text-rose-600' : 'text-sky-700'}`}>
            {isDeficit ? 'Deficit' : 'Surplus'} today
          </p>
        </div>
      </div>

      <div>
        <p className="text-[10px] font-bold uppercase tracking-[.15em] text-slate-300 mb-3">
          Last {recentEntries.length} Transactions
        </p>
        {recentEntries.length === 0 ? (
          <p className="text-[13px] text-slate-400 text-center py-6">No transactions today.</p>
        ) : (
          <div className="divide-y divide-slate-50">
            {recentEntries.map((entry: any) => {
              const isIncome = entry.type === 'income'
              const label = resolveLabel(entry)
              const sub = resolveSub(entry)
              const amount = Number(entry.amount)
              const time = entry.created_at
                ? new Date(entry.created_at).toLocaleTimeString('en-IN', {
                    hour: '2-digit', minute: '2-digit', hour12: true,
                  })
                : null
              return (
                <div key={entry.id} className="flex items-center justify-between py-3 gap-3">
                  <div className="flex items-center gap-3 min-w-0">
                    <div className={`w-7 h-7 rounded-xl flex items-center justify-center flex-shrink-0 ${isIncome ? 'bg-emerald-50' : 'bg-rose-50'}`}>
                      <span className={`text-[10px] font-black ${isIncome ? 'text-emerald-500' : 'text-rose-500'}`}>
                        {isIncome ? '↑' : '↓'}
                      </span>
                    </div>
                    <div className="min-w-0">
                      <p className="text-[13px] font-semibold text-slate-700 truncate">{label}</p>
                      {sub && <p className="text-[11px] text-slate-400 truncate">{sub}</p>}
                    </div>
                  </div>
                  <div className="flex flex-col items-end min-w-2xs shrink-0">
                    <span className={`text-[13px] font-bold tabular-nums ${isIncome ? 'text-emerald-600' : 'text-rose-500'}`}>
                      {isIncome ? '+' : '−'}{fmtINR(amount)}
                    </span>
                    {time && <span className="text-[10px] text-slate-300 mt-0.5">{time}</span>}
                  </div>
                </div>
              )
            })}
          </div>
        )}
      </div>
    </div>
  )
}

// ─── Daily Attendance Card ────────────────────────────────────────────────────
function DailyAttendanceCard({
  stats,
  dateLabel,
}: {
  stats: DailyAttendanceStats
  dateLabel: string
}) {
  const { present, absent, unmarked, total, pct } = stats
  const isLow = pct < 75
  const donutFilled = (Math.min(pct, 100) / 100) * 113

  return (
    <div className="bg-white rounded-[24px] border border-slate-100 shadow-sm p-7">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-2.5">
          <div className={`w-2.5 h-2.5 rounded-full ${isLow ? 'bg-rose-500' : 'bg-emerald-500'} shadow-sm`} />
          <h2 className="text-[10px] font-bold uppercase tracking-[.18em] text-slate-400">
            Today's Attendance
          </h2>
        </div>
        <span className="text-[10px] text-slate-400 font-medium">{dateLabel}</span>
      </div>

      {/* Donut + overall pct */}
      <div className="flex items-center gap-5 mb-6">
        <div className="relative w-[72px] h-[72px] shrink-0">
          <svg viewBox="0 0 44 44" className="w-full h-full -rotate-90">
            <circle cx="22" cy="22" r="18" fill="none"
              stroke={isLow ? '#fecdd3' : '#d1fae5'} strokeWidth="4" />
            <circle cx="22" cy="22" r="18" fill="none"
              stroke={isLow ? '#f43f5e' : '#10b981'} strokeWidth="4"
              strokeDasharray={`${donutFilled} 113`}
              strokeLinecap="round"
              style={{ transition: 'stroke-dasharray 1.2s cubic-bezier(.4,0,.2,1)' }}
            />
          </svg>
          <span className={`absolute inset-0 flex items-center justify-center text-[12px] font-black
            ${isLow ? 'text-rose-600' : 'text-emerald-600'}`}>
            {pct}%
          </span>
        </div>
        <div>
          <p className={`text-[2rem] font-black leading-none tracking-tight ${isLow ? 'text-rose-600' : 'text-emerald-600'}`}>
            {pct}%
          </p>
          <p className="text-[12px] text-slate-400 mt-1">Present today</p>
          <p className="text-[11px] text-slate-300 mt-0.5">{total} total students</p>
        </div>
      </div>

      {/* Present / Absent / Unmarked */}
      <div className="grid grid-cols-3 gap-3 mb-5">
        <div className="rounded-2xl bg-emerald-50 border border-emerald-100 px-3 py-3 text-center">
          <p className="text-[9px] font-bold uppercase tracking-[.15em] text-emerald-500 mb-1.5">Present</p>
          <p className="text-xl font-black text-emerald-700">{present}</p>
        </div>
        <div className="rounded-2xl bg-rose-50 border border-rose-100 px-3 py-3 text-center">
          <p className="text-[9px] font-bold uppercase tracking-[.15em] text-rose-500 mb-1.5">Absent</p>
          <p className="text-xl font-black text-rose-600">{absent}</p>
        </div>
        <div className="rounded-2xl bg-slate-50 border border-slate-100 px-3 py-3 text-center">
          <p className="text-[9px] font-bold uppercase tracking-[.15em] text-slate-400 mb-1.5">Unmarked</p>
          <p className="text-xl font-black text-slate-500">{unmarked}</p>
        </div>
      </div>

      {/* Progress bar */}
      {present + absent > 0 && (
        <div>
          <div className="h-2 bg-slate-100 rounded-full overflow-hidden flex">
            <div
              className="h-full bg-emerald-400 rounded-full"
              style={{
                width: `${Math.round((present / (present + absent)) * 100)}%`,
                transition: 'width 1.2s cubic-bezier(.4,0,.2,1)',
              }}
            />
          </div>
          <div className="flex justify-between mt-1.5">
            <span className="text-[10px] text-emerald-500 font-semibold">
              {Math.round((present / (present + absent)) * 100)}% present
            </span>
            <span className="text-[10px] text-rose-400 font-semibold">
              {Math.round((absent / (present + absent)) * 100)}% absent
            </span>
          </div>
        </div>
      )}

      {/* No data state */}
      {present + absent === 0 && (
        <p className="text-[13px] text-slate-400 text-center py-4">
          No attendance marked today.
        </p>
      )}
    </div>
  )
}

// ─── Net Summary Card ─────────────────────────────────────────────────────────
function NetSummaryCard({
  income, expense, balance, isDeficit, balancePct, donutFilled,
}: {
  income: number; expense: number; balance: number
  isDeficit: boolean; balancePct: number; donutFilled: number
}) {
  return (
    <div className="bg-white rounded-[24px] border border-slate-100 shadow-sm p-7">
      <div className="flex items-center gap-2.5 mb-6">
        <div className={`w-2.5 h-2.5 rounded-full ${isDeficit ? 'bg-rose-500' : 'bg-sky-500'}`} />
        <h2 className="text-[10px] font-bold uppercase tracking-[.18em] text-slate-400">Net Summary</h2>
      </div>
      <div className="space-y-0.5">
        {[
          { label: 'Gross income',   val: fmtINR(income),  color: 'text-emerald-600' },
          { label: 'Total expenses', val: fmtINR(expense), color: 'text-rose-500'    },
        ].map((r) => (
          <div key={r.label} className="flex justify-between items-center py-3 border-b border-slate-50">
            <span className="text-[13px] text-slate-500 font-medium">{r.label}</span>
            <span className={`text-[13px] font-bold ${r.color}`}>{r.val}</span>
          </div>
        ))}
      </div>
      <div className={`mt-5 rounded-2xl p-4 flex justify-between items-center border
        ${isDeficit ? 'bg-rose-50 border-rose-100' : 'bg-sky-50 border-sky-100'}`}>
        <div>
          <p className={`text-[9px] font-bold uppercase tracking-[.18em] mb-1.5 ${isDeficit ? 'text-rose-400' : 'text-sky-400'}`}>
            {isDeficit ? '⚠ Deficit' : 'Net Balance'}
          </p>
          <p className={`text-2xl font-black tracking-tight ${isDeficit ? 'text-rose-600' : 'text-sky-700'}`}>
            {fmtINR(balance)}
          </p>
        </div>
        <div className="relative w-14 h-14">
          <svg viewBox="0 0 44 44" className="w-full h-full -rotate-90">
            <circle cx="22" cy="22" r="18" fill="none"
              stroke={isDeficit ? '#fecdd3' : '#bae6fd'} strokeWidth="4" />
            <circle cx="22" cy="22" r="18" fill="none"
              stroke={isDeficit ? '#f43f5e' : '#0ea5e9'} strokeWidth="4"
              strokeDasharray={`${donutFilled} 113`} strokeLinecap="round" />
          </svg>
          <span className={`absolute inset-0 flex items-center justify-center text-[9px] font-black
            ${isDeficit ? 'text-rose-600' : 'text-sky-600'}`}>
            {balancePct}%
          </span>
        </div>
      </div>
    </div>
  )
}

// ─── Dashboard ────────────────────────────────────────────────────────────────
export default function Dashboard() {
  const [data, setData] = useState<any>(null)
  const [loading, setLoading] = useState(true)

  const now   = new Date()
  const year  = now.getFullYear()
  const month = now.getMonth()

  const todayStr  = now.toISOString().split('T')[0]
  const dateLabel = now.toLocaleDateString('en-IN', {
    weekday: 'short', day: 'numeric', month: 'short',
  })

  const load = useCallback(async () => {
    try {
      setLoading(true)
      const [staff, admissions, totals, categorySummary, allEntries, rawAttendance] =
        await Promise.all([
          getAllStaff(),
          getAdmissions(),
          fetchTotals(),
          fetchCategorySummary(),
          fetchEntries({}),
          fetchAllAttendance(year, month),
        ])

      // ── Today's financials ─────────────────────────────────────────────────
      const todayEntries = allEntries.filter((e: any) => e.date === todayStr)
      const todayIncome  = todayEntries
        .filter((e: any) => e.type === 'income')
        .reduce((s: number, e: any) => s + Number(e.amount), 0)
      const todayExpense = todayEntries
        .filter((e: any) => e.type === 'expenditure')
        .reduce((s: number, e: any) => s + Number(e.amount), 0)
      const recentEntries = [...todayEntries]
        .sort((a: any, b: any) => b.created_at.localeCompare(a.created_at))
        .slice(0, 5)

      // ── Class breakdown ────────────────────────────────────────────────────
      const byClass: Record<string, number> = {}
      admissions.forEach((a: any) => {
        byClass[a.standard] = (byClass[a.standard] || 0) + 1
      })

      // ── Daily attendance stats ─────────────────────────────────────────────
      const dailyAttendanceStats = getDailyAttendanceStats(
        rawAttendance,
        admissions,
        todayStr
      )

      setData({
        students: admissions.length,
        staff: staff.filter((s: any) => !s.date_left).length,
        income: totals.income,
        expense: totals.expenditure,
        balance: totals.balance,
        categories: categorySummary,
        classes: Object.entries(byClass)
          .map(([s, c]) => ({ s, c }))
          .sort((a, b) => Number(a.s) - Number(b.s)),
        todayIncome,
        todayExpense,
        todayCount: todayEntries.length,
        recentEntries,
        dailyAttendanceStats,
      })
    } catch (e) {
      console.error(e)
    } finally {
      setLoading(false)
    }
  }, [year, month, todayStr])

  useEffect(() => { load() }, [load])

  if (loading)
    return (
      <div className="h-screen flex items-center justify-center">
        <div className="w-10 h-10 border-[3px] border-violet-200 border-t-violet-600 rounded-full animate-spin" />
      </div>
    )

  const { balance, income, expense } = data
  const isDeficit   = balance < 0
  const balancePct  = income > 0 ? Math.round((Math.abs(balance) / income) * 100) : 0
  const donutFilled = (Math.min(balancePct, 100) / 100) * 113

  const incomeCategories  = data.categories.filter((c: any) => c.type === 'income')
  const expenseCategories = data.categories.filter((c: any) => c.type === 'expenditure')

  return (
    <div className="min-h-screen p-4 md:p-8"
      style={{ fontFamily: "'Plus Jakarta Sans', sans-serif" }}>
      <style>{`@import url('https://fonts.googleapis.com/css2?family=Plus+Jakarta+Sans:wght@400;500;600;700;800;900&display=swap');`}</style>

      <div className="max-w-7xl mx-auto space-y-5">

        {/* ── Topbar ──────────────────────────────────────────────────────── */}
        <header className="flex items-center justify-between bg-white rounded-[20px] border border-slate-100 shadow-sm px-5 py-3.5">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-[12px] bg-gradient-to-br from-violet-600 to-indigo-600 flex items-center justify-center shadow-md shadow-violet-200">
              <GraduationCap size={17} className="text-white" />
            </div>
            <span className="text-[17px] font-black text-slate-900 tracking-tight">
              Iqrah Public School
            </span>
          </div>
          <div className="flex items-center gap-3">
            <span className="flex items-center gap-1.5 text-[11px] font-bold text-emerald-600 bg-emerald-50 border border-emerald-100 px-3 py-1.5 rounded-full">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
              Live
            </span>
            <button onClick={load}
              className="flex items-center gap-1.5 text-[11px] font-semibold text-slate-500 hover:text-slate-700 bg-slate-50 hover:bg-slate-100 border border-slate-200 px-3.5 py-1.5 rounded-xl transition-all">
              <RefreshCw size={11} /> Refresh
            </button>
          </div>
        </header>

        {/* ── KPI Cards ────────────────────────────────────────────────────── */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          <KpiCard label="Students" value={String(data.students)} sub="enrolled this term"
            icon={Users}
            gradient="bg-[linear-gradient(135deg,_#7C3AED_0%,_#4F46E5_50%,_#3730A3_100%)]" />
          <KpiCard label="Revenue" value={fmtINR(income)} badge="+12.4%" badgePositive
            sub="vs last month" icon={TrendingUp}
            gradient="bg-[linear-gradient(135deg,_#059669_0%,_#0D9488_50%,_#0891B2_100%)]" />
          <KpiCard label="Faculty" value={String(data.staff)} sub="active members"
            icon={GraduationCap}
            gradient="bg-[linear-gradient(135deg,_#F59E0B_0%,_#EF4444_55%,_#EC4899_100%)]" />
          <KpiCard label="Treasury" value={fmtINR(balance)}
            badge={isDeficit ? `${balancePct}% deficit` : `${balancePct}% surplus`}
            badgePositive={!isDeficit}
            icon={isDeficit ? AlertTriangle : Wallet}
            gradient={isDeficit
              ? "bg-[linear-gradient(135deg,_#DC2626_0%,_#DB2777_60%,_#9333EA_100%)]"
              : "bg-[linear-gradient(135deg,_#2563EB_0%,_#7C3AED_55%,_#DB2777_100%)]"} />
        </div>

        {/* ── Today's Summary ──────────────────────────────────────────────── */}
        <TodaySummary
          todayIncome={data.todayIncome}
          todayExpense={data.todayExpense}
          entryCount={data.todayCount}
          recentEntries={data.recentEntries}
        />

        {/* ── Bottom Grid: Net + Attendance | Class density + Pie ───────────── */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">

          {/* Left column: Net Summary + Daily Attendance */}
          <div className="space-y-5">
            <NetSummaryCard
              income={income} expense={expense} balance={balance}
              isDeficit={isDeficit} balancePct={balancePct} donutFilled={donutFilled}
            />
            <DailyAttendanceCard
              stats={data.dailyAttendanceStats}
              dateLabel={dateLabel}
            />
          </div>

          {/* Right columns: Class density + Pie */}
          <div className="lg:col-span-2 grid grid-cols-1 md:grid-cols-2 gap-5">
            <div className="bg-white rounded-[24px] border border-slate-100 shadow-sm p-7">
              <div className="flex items-center gap-2.5 mb-6">
                <div className="w-2.5 h-2.5 rounded-full bg-violet-500 shadow-sm shadow-violet-300" />
                <h2 className="text-[10px] font-bold uppercase tracking-[.18em] text-slate-400">
                  Class Density
                </h2>
              </div>
              <div className="grid grid-cols-3 gap-3">
                {data.classes.map((cls: any, i: number) => (
                  <GradeChip key={cls.s} grade={cls.s} count={cls.c as number} idx={i} />
                ))}
              </div>
            </div>

            <div className="bg-white rounded-[24px] border border-slate-100 shadow-sm p-7">
              <div className="flex items-center gap-2.5 mb-6">
                <div className="w-2.5 h-2.5 rounded-full bg-indigo-500 shadow-sm shadow-indigo-300" />
                <h2 className="text-[10px] font-bold uppercase tracking-[.18em] text-slate-400">
                  Students by Grade
                </h2>
              </div>
              <StudentsPieChart classes={data.classes} />
            </div>
          </div>
        </div>

      </div>
    </div>
  )
}