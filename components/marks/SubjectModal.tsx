'use client'

import { Subject, SubjectFormData } from '@/type/mark'

interface Props {
  show: boolean
  onClose: () => void
  onSubmit: (e: React.FormEvent) => void
  form: SubjectFormData
  setForm: (form: SubjectFormData) => void
  editingSubject: Subject | null
  saving: boolean
  selectedStandard: string
}

const subjectFormFields = [
  { label: 'UT1', key: 'max_ut1' },
  { label: 'UT2', key: 'max_ut2' },
  { label: 'UT3', key: 'max_ut3' },
  { label: 'UT4', key: 'max_ut4' },
  { label: 'Mid Term', key: 'max_mid_term' },
  { label: 'Half Yearly', key: 'max_half_yearly' },
  { label: 'Final', key: 'max_final' },
]

export default function SubjectModal({
  show,
  onClose,
  onSubmit,
  form,
  setForm,
  editingSubject,
  saving,
  selectedStandard,
}: Props) {
  if (!show) return null

  return (
    <div className="fixed inset-0 bg-black/40 z-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl shadow-xl w-full max-w-lg p-6">

        {/* Header */}
        <div className="flex justify-between items-center mb-5">
          <div>
            <h2 className="text-lg font-semibold text-gray-600">
              {editingSubject ? 'Edit Subject' : 'Add Subject'}
            </h2>
            <p className="text-xs text-gray-400 mt-0.5">{selectedStandard}</p>
          </div>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600 text-2xl font-bold leading-none"
          >
            ×
          </button>
        </div>

        <form onSubmit={onSubmit} className="space-y-4">
          {/* Subject Name */}
          <div>
            <label className="block text-sm font-medium mb-1 text-gray-600">
              Subject Name
            </label>
            <input
              type="text"
              value={form.name}
              onChange={e => setForm({ ...form, name: e.target.value })}
              placeholder="e.g. Mathematics"
              className="w-full border rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-teal-400 text-gray-600"
              required
            />
          </div>

          {/* Max Marks */}
          <div>
            <p className="text-sm font-medium mb-1 text-gray-600">Max Marks per Exam</p>
            <p className="text-xs text-gray-400 mb-3">
              Set 0 for exams this subject does not have
            </p>
            <div className="grid grid-cols-4 gap-3">
              {subjectFormFields.map(({ label, key }) => (
                <div key={key}>
                  <label className="block text-xs text-gray-400 mb-1">{label}</label>
                  <input
                    type="number"
                    min={0}
                    value={form[key as keyof SubjectFormData] as number}
                    onChange={e =>
                      setForm({
                        ...form,
                        [key]: parseInt(e.target.value) || 0,
                      })
                    }
                    className="w-full border rounded-lg px-2 py-1.5 text-sm focus:outline-none focus:border-teal-400 text-gray-600"
                  />
                </div>
              ))}
            </div>
          </div>

          {/* Buttons */}
          <div className="flex gap-3 pt-2">
            <button
              type="submit"
              disabled={saving}
              className="flex-1 bg-teal-600 text-white py-2 rounded-lg text-sm font-medium hover:bg-teal-700 disabled:opacity-50"
            >
              {saving ? 'Saving...' : editingSubject ? 'Update Subject' : 'Add Subject'}
            </button>
            <button
              type="button"
              onClick={onClose}
              className="flex-1 border border-gray-300 text-gray-500 py-2 rounded-lg text-sm font-medium hover:bg-gray-50"
            >
              Cancel
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}