'use client'

interface StudentResult {
  student_id: number
  name: string
  admission_no: string
  total: number
  maxTotal: number
  percent: string
}

interface Props {
  selectedStandard: string
  toppers: StudentResult[]
  loading: boolean
}

const trophyStyles = [
  { border: 'border-yellow-400', bg: 'bg-yellow-50', emoji: '🥇' },
  { border: 'border-gray-400', bg: 'bg-gray-50', emoji: '🥈' },
  { border: 'border-orange-300', bg: 'bg-orange-50', emoji: '🥉' },
]

export default function ClassTopper({ selectedStandard, toppers, loading }: Props) {
  if (loading) {
    return (
      <div className="mt-6 border-t pt-6">
        <p className="text-xs text-gray-400">Calculating class toppers...</p>
      </div>
    )
  }

  if (toppers.length === 0) return null

  return (
    <div className="mt-6 border-t pt-6">
      <h3 className="font-semibold text-base mb-4 text-gray-600">
        🎓 Class Topper — {selectedStandard}
      </h3>
      <div className="flex flex-col sm:flex-row gap-3">
        {toppers.map((student, i) => {
          const style = trophyStyles[i]
          return (
            <div
              key={student.student_id}
              className={`flex-1 border-2 ${style.border} ${style.bg} rounded-xl p-4 flex items-center gap-4`}
            >
              <div className="text-3xl">{style.emoji}</div>
              <div className="flex-1 min-w-0">
                <p className="font-bold text-gray-700 truncate">{student.name}</p>
                <p className="text-xs text-gray-400">{student.admission_no}</p>
                <p className="text-xs text-gray-500 mt-1">
                  {student.total} / {student.maxTotal} marks
                </p>
              </div>
              <div className="text-right    shrink-0">
                <p className="text-2xl font-bold text-teal-600">{student.percent}%</p>
                <p className="text-xs text-gray-400">overall</p>
              </div>
            </div>
          )
        })}
      </div>
    </div>
  )
}