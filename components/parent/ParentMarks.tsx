'use client'

import { useState, useEffect } from 'react'
import { createBrowserClient } from '@supabase/ssr'
import { Loader2 } from 'lucide-react'

interface Props { studentId: number; standard: string }

const ACADEMIC_YEAR = '2025-2026'
const EXAM_LABELS: Record<string, string> = {
  ut1: 'UT 1', ut2: 'UT 2', ut3: 'UT 3', ut4: 'UT 4',
  mid_term: 'Mid Term', half_yearly: 'Half Yearly', final: 'Final',
}

export default function ParentMarks({ studentId, standard }: Props) {
  const supabase = createBrowserClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_DEFAULT_KEY!
  )

  const [marksData, setMarksData] = useState<any[]>([])
  const [loading, setLoading]     = useState(true)

  useEffect(() => {
    ;(async () => {
      setLoading(true)
      const { data } = await supabase
        .from('marks')
        .select('*, subjects(id, name, max_ut1, max_ut2, max_ut3, max_ut4, max_mid_term, max_half_yearly, max_final)')
        .eq('student_id', studentId)
        .eq('academic_year', ACADEMIC_YEAR)
      setMarksData(data || [])
      setLoading(false)
    })()
  }, [studentId])

  if (loading) return (
    <div className="flex items-center justify-center py-16 text-slate-400 gap-2">
      <Loader2 className="w-5 h-5 animate-spin" /><span className="text-sm">Loading marks…</span>
    </div>
  )

  if (marksData.length === 0) return (
    <div className="text-center py-16 text-slate-400">
      <p className="text-sm">No marks entered yet for {ACADEMIC_YEAR}.</p>
    </div>
  )

  const examFields = ['ut1', 'ut2', 'ut3', 'ut4', 'mid_term', 'half_yearly', 'final']

  return (
    <div className="space-y-4">
      <h2 className="text-base font-bold text-slate-700">Marks — {ACADEMIC_YEAR}</h2>

      <div className="bg-white rounded-xl border border-slate-200 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm min-w-[600px]">
            <thead>
              <tr className="bg-slate-50 border-b border-slate-200">
                <th className="px-4 py-3 text-left text-xs font-medium text-slate-500">Subject</th>
                {examFields.map(f => (
                  <th key={f} className="px-3 py-3 text-center text-xs font-medium text-slate-500 whitespace-nowrap">
                    {EXAM_LABELS[f]}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {marksData.map(m => {
                const sub = m.subjects
                return (
                  <tr key={m.id} className="hover:bg-slate-50">
                    <td className="px-4 py-3 font-medium text-slate-700">{sub?.name}</td>
                    {examFields.map(f => {
                      const maxKey = `max_${f}`
                      const score  = m[f]
                      const max    = sub?.[maxKey]
                      const pct    = max && score !== null ? Math.round((score / max) * 100) : null
                      return (
                        <td key={f} className="px-3 py-3 text-center">
                          {score !== null && score !== undefined ? (
                            <div>
                              <span className={`text-sm font-semibold ${
                                pct !== null && pct >= 75 ? 'text-emerald-600'
                                : pct !== null && pct >= 50 ? 'text-amber-600'
                                : 'text-red-600'
                              }`}>{score}</span>
                              {max && <span className="text-xs text-slate-400">/{max}</span>}
                            </div>
                          ) : (
                            <span className="text-slate-300 text-xs">—</span>
                          )}
                        </td>
                      )
                    })}
                  </tr>
                )
              })}
            </tbody>
          </table>
        </div>
      </div>

      {/* Color legend */}
      <div className="flex items-center gap-4 text-xs text-slate-500">
        <span className="flex items-center gap-1"><span className="w-3 h-3 rounded-full bg-emerald-500 inline-block" /> 75%+ Good</span>
        <span className="flex items-center gap-1"><span className="w-3 h-3 rounded-full bg-amber-500 inline-block" /> 50–74% Average</span>
        <span className="flex items-center gap-1"><span className="w-3 h-3 rounded-full bg-red-500 inline-block" /> Below 50% Needs Improvement</span>
      </div>
    </div>
  )
}