'use client'

import { getStudentsWithMarks, StudentMarks, StudentWithMarks, upsertStudentMarks } from '@/utils/actions/certicate';
import {  Mark } from '@/type/mark';
import { useState, useEffect, useRef } from 'react';

// ── Grade Scale ────────────────────────────────────────────────────────────
const GRADE_SCALE = [
  { grade: 'A+', min: 90 }, { grade: 'A', min: 80 }, { grade: 'B+', min: 70 },
  { grade: 'B',  min: 60 }, { grade: 'C+', min: 50 }, { grade: 'C', min: 40 },
  { grade: 'D+', min: 30 }, { grade: 'D', min: 20 },  { grade: 'E', min: 0 },
]

function calcGrade(obt: number, full: number) {
  if (full === 0) return '—'
  const pct = (obt / full) * 100
  return GRADE_SCALE.find(g => pct >= g.min)?.grade ?? 'E'
}

// ── Moral subjects (fixed, from student_marks table) ──────────────────────
const MORAL_SUBJECTS = [
  { name: "Qur'an & Hifz",    key: 'quran',    full: 100 },
  { name: 'Ahkaamu Thajveed', key: 'thajveed', full: 100 },
  { name: 'Masaa-ilul Fiqh',  key: 'fiqh',     full: 100 },
  { name: 'Uloomuddeen',      key: 'uloom',    full: 100 },
]

// ── Theme ──────────────────────────────────────────────────────────────────
const NAVY = '#1A2C6B', GOLD = '#B8862D'
const LIGHT = '#F4F6FB', BORDER = '#C5CDE8'
const WHITE = '#FFFFFF', TEXT_S = '#6B7A99'

// ── Shared print base CSS ──────────────────────────────────────────────────
const PRINT_BASE = `
  @import url('https://fonts.googleapis.com/css2?family=EB+Garamond:ital,wght@0,400;0,600;1,400&family=Outfit:wght@300;400;500;600&display=swap');
  * { box-sizing: border-box; margin: 0; padding: 0; }
  body { font-family: 'Outfit', sans-serif; background: #fff; color: #111; }
  .page { width: 210mm; min-height: 297mm; padding: 14mm 16mm; margin: 0 auto; }
  @media print { @page { size: A4; margin: 0; } }
`

const LOGO_IMG = `<img src="/images/logo.png" alt="Iqrah Logo" style="width:56px;height:56px;object-fit:contain;" />`

// ── TC overrides type ──────────────────────────────────────────────────────
type TCOverrides = {
  nationality: string
  religion: string
  caste: string
  category: string
  admission_date: string
  qualified: boolean
  fees_paid: boolean
  fee_concession: boolean
  last_attendance: string
  next_school: string
  vaccinated: boolean
  school_days: string
  days_attended: string
  conduct: string
  rank: string
  moral_rank: string
}

function marksToOverrides(m: StudentMarks): TCOverrides {
  return {
    nationality:    m.nationality,
    religion:       m.religion,
    caste:          m.caste,
    category:       m.category,
    admission_date: m.admission_date,
    qualified:      m.qualified,
    fees_paid:      m.fees_paid,
    fee_concession: m.fee_concession,
    last_attendance:m.last_attendance,
    next_school:    m.next_school ?? '',
    vaccinated:     m.vaccinated,
    school_days:    String(m.school_days),
    days_attended:  String(m.days_attended),
    conduct:        m.conduct,
    rank:           m.rank !== null ? String(m.rank) : '',
    moral_rank:     m.moral_rank !== null ? String(m.moral_rank) : '',
  }
}

// ── Transfer Certificate ───────────────────────────────────────────────────
function buildTC(s: StudentWithMarks, ov: TCOverrides) {
  const tcNo  = `${Math.floor(Math.random() * 30) + 1} / 2025-2026`
  const today = new Date().toLocaleDateString('en-GB')

  const rows = [
    ['1',  'Whether the school is Govt. / Aided / Recognized', 'NIOS (National Institute Of Open Schooling)'],
    ['2',  'Accreditation Number', 'MB 0913616'],
    ['3',  'Name of pupil', s.name.toUpperCase()],
    ['4',  'Name of parent/guardian', s.parent_guardian.toUpperCase()],
    ['5',  'Nationality', ov.nationality.toUpperCase()],
    ['6',  'Religion & Caste', `${ov.religion.toUpperCase()} — ${ov.caste.toUpperCase()}`],
    ['7',  'Whether SC / ST / OBC', ov.category],
    ['8',  'Date of birth', s.date_of_birth],
    ['9',  'Standard last enrolled', s.standard.toUpperCase()],
    ['10', 'Date of admission/promotion', ov.admission_date || '—'],
    ['11', 'Qualified for promotion', ov.qualified ? 'YES' : 'NO'],
    ['12', 'Fees paid', ov.fees_paid ? 'YES' : 'NO'],
    ['13', 'Fee concession', ov.fee_concession ? 'YES' : 'NO'],
    ['14', 'Date of last attendance', ov.last_attendance || '—'],
    ['15', 'Date name removed from rolls', ov.last_attendance || '—'],
    ['16', 'Date of application', today],
    ['17', 'Date of issue', today],
    ['18', 'Reason of leaving', 'HIGHER STUDY'],
    ['19', 'School proceeding to', (ov.next_school || '—').toUpperCase()],
    ['20', 'Date of last vaccination', ov.vaccinated ? 'VACCINATED' : '—'],
    ['21', 'Number of school days', ov.school_days || '0'],
    ['22', 'Days attended', ov.days_attended || '0'],
  ]

  return `<!DOCTYPE html><html><head><meta charset="utf-8">
<style>
${PRINT_BASE}
.hdr{text-align:center;margin-bottom:16px}
.logo-row{display:flex;align-items:center;justify-content:center;gap:14px;margin-bottom:6px}
.school{font-family:'EB Garamond',serif;font-size:25px;font-weight:600;color:#1A2C6B}
.addr{font-size:11px;color:#555;margin-top:2px}
.title-bar{text-align:center;border-top:2.5px solid #1A2C6B;border-bottom:2.5px solid #1A2C6B;padding:7px 0;margin:14px 0}
.title-bar .from{font-size:10px;letter-spacing:1px;color:#777}
.title-bar .main{font-family:'EB Garamond',serif;font-size:22px;font-weight:600;letter-spacing:2px;color:#1A2C6B}
.meta{display:flex;justify-content:space-between;font-size:11px;margin-bottom:12px;color:#333}
table{width:100%;border-collapse:collapse;font-size:11.5px}
td{border:0.5px solid #aaa;padding:5px 8px;vertical-align:top}
td:first-child{width:30px;text-align:center;font-weight:500;background:#f4f6fb;color:#1A2C6B}
td:nth-child(2){width:54%}
td:nth-child(3){font-weight:500}
tr:nth-child(even) td:nth-child(2),tr:nth-child(even) td:nth-child(3){background:#fafbff}
.sig-row{display:flex;justify-content:space-between;margin-top:28px;font-size:11px}
.sig-block{text-align:center}
.sig-line{width:120px;border-bottom:0.5px solid #444;margin:0 auto 4px}
.gold{color:#B8862D;font-weight:600}
</style></head><body>
<div class="page">
  <div class="hdr">
    <div class="logo-row">
      ${LOGO_IMG}
      <div>
        <div class="school">IQRAH ENGLISH MEDIUM SCHOOL</div>
        <div class="addr">Nediyiruppu, Kondotty (Po) – 673638, Malappuram (Dt), Kerala, India</div>
        <div class="addr">PH: 9744636329, 9544696668 &nbsp;|&nbsp; iemskdy@gmail.com</div>
      </div>
    </div>
  </div>
  <div class="title-bar">
    <div class="from">FROM 5 [SEE RULE VI-17(1)]</div>
    <div class="main">TRANSFER CERTIFICATE</div>
  </div>
  <div class="meta">
    <span><strong>TC No:</strong> <span class="gold">${tcNo}</span></span>
    <span><strong>Admission Date:</strong> ${ov.admission_date || '—'}</span>
    <span><strong>Admission No:</strong> <span class="gold">${s.admission_no}</span></span>
  </div>
  <table>
    ${rows.map(([n, q, a]) => `<tr><td>${n}</td><td>${q}</td><td>${a}</td></tr>`).join('')}
  </table>
  <div class="sig-row">
    <div class="sig-block"><div class="sig-line">&nbsp;</div>Place : NEDIYIRUPPU<br>Date : ${today}</div>
    <div class="sig-block"><div class="sig-line">&nbsp;</div>School Stamp</div>
    <div class="sig-block"><div class="sig-line">&nbsp;</div>Principal</div>
  </div>
</div></body></html>`
}

// ── Conduct Certificate ────────────────────────────────────────────────────
function buildCC(s: StudentWithMarks, ov: TCOverrides) {
  const certNo = `CC/${s.admission_no}/${new Date().getFullYear()}`
  const today  = new Date().toLocaleDateString('en-GB', { day: 'numeric', month: 'long', year: 'numeric' })

  return `<!DOCTYPE html><html><head><meta charset="utf-8">
<style>
${PRINT_BASE}
.page{display:flex;flex-direction:column;align-items:center}
.border-frame{width:100%;min-height:260mm;border:3px double #1A2C6B;padding:10mm;position:relative}
.inner-frame{border:0.5px solid #c5cde8;width:100%;min-height:240mm;padding:10mm;display:flex;flex-direction:column}
.hdr{text-align:center;margin-bottom:16px}
.school{font-family:'EB Garamond',serif;font-size:23px;font-weight:600;color:#1A2C6B}
.addr{font-size:11px;color:#555}
.divider{border:none;border-top:0.5px solid #c5cde8;margin:12px 0}
.cert-title{font-family:'EB Garamond',serif;font-size:28px;font-weight:600;text-align:center;letter-spacing:2px;color:#1A2C6B;margin:14px 0 4px}
.cert-sub{text-align:center;font-size:11px;color:#777;margin-bottom:22px}
.body-text{font-size:13px;line-height:2.1;text-align:justify;flex:1}
.name-hl{font-family:'EB Garamond',serif;font-size:16px;font-weight:600;border-bottom:1.5px solid #1A2C6B;padding-bottom:1px;color:#1A2C6B}
.gold{color:#B8862D;font-weight:600}
.sig-row{display:flex;justify-content:space-between;margin-top:32px;font-size:11px}
.sig-block{text-align:center}
.sig-line{width:140px;border-bottom:0.5px solid #444;margin:0 auto 4px}
.corner{position:absolute;width:18px;height:18px;border-color:#B8862D;border-style:solid}
.tl{top:5px;left:5px;border-width:2px 0 0 2px}
.tr{top:5px;right:5px;border-width:2px 2px 0 0}
.bl{bottom:5px;left:5px;border-width:0 0 2px 2px}
.br{bottom:5px;right:5px;border-width:0 2px 2px 0}
</style></head><body>
<div class="page">
  <div class="border-frame">
    <div class="corner tl"></div><div class="corner tr"></div>
    <div class="corner bl"></div><div class="corner br"></div>
    <div class="inner-frame">
      <div class="hdr">
        ${LOGO_IMG}
        <div class="school">IQRAH ENGLISH MEDIUM SCHOOL</div>
        <div class="addr">Nediyiruppu, Kondotty – 673638 | Ph: 9744636329</div>
      </div>
      <hr class="divider">
      <div class="cert-title">Conduct Certificate</div>
      <div class="cert-sub">Certificate No: <span class="gold">${certNo}</span> &nbsp;|&nbsp; Date: ${today}</div>
      <div class="body-text">
        <p>This is to certify that <span class="name-hl">${s.name}</span>,
        ${s.gender === 'Female' ? 'daughter' : 'son'} of <strong>${s.parent_guardian}</strong>,
        bearing Admission Number <span class="gold">${s.admission_no}</span>,
        was a bonafide student of this institution.</p><br>
        <p>During the period of study, the student was enrolled in
        <strong>${s.standard}</strong> for the academic year <strong>2025–2026</strong>.
        The student attended <strong>${ov.days_attended}</strong> out of
        <strong>${ov.school_days}</strong> school days.</p><br>
        <p>To the best of our knowledge and belief, the student bears a
        <span class="gold">${ov.conduct}</span> moral character.
        His / Her conduct and behaviour throughout the period of study has been
        <strong>${ov.conduct}</strong> and he / she has abided by the rules and
        regulations of the institution.</p><br>
        <p>This certificate is issued upon request for the purpose of admission to a
        higher institution, and is provided without any prejudice.</p><br>
        <p>We wish him / her every success in all future endeavours.</p>
      </div>
      <div class="sig-row">
        <div class="sig-block"><div class="sig-line">&nbsp;</div>Class Teacher</div>
        <div class="sig-block"><div class="sig-line">&nbsp;</div>School Stamp</div>
        <div class="sig-block"><div class="sig-line">&nbsp;</div>Principal</div>
      </div>
    </div>
  </div>
</div></body></html>`
}

// ── Shared PR HTML builder ─────────────────────────────────────────────────
// mode: 'hy' = Half-Yearly only | 'final' = Half-Yearly + Final combined
function buildPRDoc(s: StudentWithMarks, ov: TCOverrides, mode: 'hy' | 'final') {
  const markMap          = s.marks as unknown as Record<string, number>
  const academicSubjects = s.subjects
  const isFinal          = mode === 'final'
  const year             = new Date().getFullYear()
  const examTitle        = isFinal ? `FINAL EXAMINATION – ${year}` : `HALF YEARLY EXAMINATION – ${year}`
  const moralTitle       = isFinal ? `MORAL EXAMINATION – ${year} (Final)` : `MORAL EXAMINATION – ${year}`
  const pronoun          = s.gender === 'Female' ? 'Girl' : 'Boy'

  // ── Build subject rows ─────────────────────────────────────────────────
  let subjectRows = ''
  let totalHY = 0, totalHYMax = 0, totalFinalMark = 0, totalFinalMax = 0
  let totalObt = 0, totalFull = 0

  for (const sub of academicSubjects) {
    const examRow: Mark | undefined = s.examMarks[sub.name.toLowerCase()]
    const hyMax  = sub.max_half_yearly ?? 0
    const finMax = sub.max_final ?? 0
    const hy     = examRow?.half_yearly ?? 0
    const fin    = examRow?.final       ?? 0

    if (isFinal) {
      // Final table: HY Mark | HY Max | Final Mark | Final Max | Total | Grade
      const total    = hy + fin
      const fullMark = hyMax + finMax
      totalHY        += hy;    totalHYMax    += hyMax
      totalFinalMark += fin;   totalFinalMax += finMax
      totalObt       += total; totalFull     += fullMark
      subjectRows += `<tr>
        <td>${sub.name}</td>
        <td class="tc">${hy}</td><td class="tc">${hyMax}</td>
        <td class="tc">${fin}</td><td class="tc">${finMax}</td>
        <td class="tc fw">${total}</td>
        <td class="gc">${calcGrade(total, fullMark)}</td>
      </tr>`
    } else {
      // Half-yearly table: Subject | Full | Obtained | Grade
      totalObt  += hy;    totalFull += hyMax
      subjectRows += `<tr>
        <td>${sub.name}</td>
        <td class="tc">${hyMax}</td>
        <td class="tc">${hy}</td>
        <td class="gc">${calcGrade(hy, hyMax)}</td>
      </tr>`
    }
  }

  // ── Table header + total row depending on mode ─────────────────────────
  const academicThead = isFinal
    ? `<tr>
        <th>Subject</th>
        <th class="tc">HY<br><span style="font-weight:400;font-size:9px">Obtained</span></th>
        <th class="tc">HY<br><span style="font-weight:400;font-size:9px">Max</span></th>
        <th class="tc">Final<br><span style="font-weight:400;font-size:9px">Obtained</span></th>
        <th class="tc">Final<br><span style="font-weight:400;font-size:9px">Max</span></th>
        <th class="tc">Total</th>
        <th class="tc">Grade</th>
      </tr>`
    : `<tr><th>Subject</th><th class="tc">Full</th><th class="tc">Obtained</th><th class="tc">Grade</th></tr>`

  const academicTfoot = academicSubjects.length > 0
    ? isFinal
      ? `<tr class="total-row">
          <td>Total</td>
          <td class="tc">${totalHY}</td><td class="tc">${totalHYMax}</td>
          <td class="tc">${totalFinalMark}</td><td class="tc">${totalFinalMax}</td>
          <td class="tc">${totalObt}</td>
          <td class="gc">${calcGrade(totalObt, totalFull)}</td>
        </tr>`
      : `<tr class="total-row">
          <td>Total</td>
          <td class="tc">${totalFull}</td>
          <td class="tc">${totalObt}</td>
          <td class="gc">${calcGrade(totalObt, totalFull)}</td>
        </tr>`
    : ''

  const noSubjects = academicSubjects.length === 0
    ? `<tr><td colspan="${isFinal ? 7 : 4}" class="no-data">No subjects configured for ${s.standard}</td></tr>`
    : ''

  // ── Moral subjects ─────────────────────────────────────────────────────
  const moralRows = MORAL_SUBJECTS.map(sub => {
    const obt = markMap[sub.key] ?? 0
    return `<tr><td>${sub.name}</td><td class="tc">${sub.full}</td><td class="tc">${obt}</td><td class="gc">${calcGrade(obt, sub.full)}</td></tr>`
  }).join('')
  const moralObt  = MORAL_SUBJECTS.reduce((a, sub) => a + (markMap[sub.key] ?? 0), 0)
  const moralFull = MORAL_SUBJECTS.reduce((a, sub) => a + sub.full, 0)

  return `<!DOCTYPE html><html><head><meta charset="utf-8">
<style>
${PRINT_BASE}
.page{padding:10mm 14mm}
.hdr{display:flex;align-items:center;gap:14px;border-bottom:2.5px solid #1A2C6B;padding-bottom:10px;margin-bottom:10px}
.school{font-family:'EB Garamond',serif;font-size:21px;font-weight:600;color:#1A2C6B}
.addr{font-size:10px;color:#666}
.report-title{text-align:center;font-family:'EB Garamond',serif;font-size:18px;font-weight:600;letter-spacing:1.5px;color:#1A2C6B;margin:6px 0 2px}
.year-badge{text-align:center;font-size:11px;color:#777;margin-bottom:10px}
.student-info{display:grid;grid-template-columns:1fr 1fr;gap:4px 20px;font-size:11.5px;background:#f4f6fb;border:0.5px solid #c5cde8;border-radius:6px;padding:8px 12px;margin-bottom:12px}
.info-row{display:flex;gap:6px}
.info-label{color:#777;min-width:90px}
.info-val{font-weight:500;color:#1A2C6B}
.section-title{font-size:11.5px;font-weight:600;letter-spacing:0.8px;color:#1A2C6B;text-transform:uppercase;margin:10px 0 5px;padding-bottom:3px;border-bottom:0.5px solid #c5cde8}
table{width:100%;border-collapse:collapse;font-size:11px}
th{background:#1A2C6B;color:#fff;padding:5px 6px;text-align:left;font-weight:500;font-size:10px;line-height:1.3}
td{border:0.5px solid #ddd;padding:4px 6px}
tr:nth-child(even) td{background:#f7f8fd}
.tc{text-align:center}
.fw{font-weight:600}
.gc{font-weight:600;color:#B8862D;text-align:center}
.total-row td{font-weight:600;background:#e8ecf8 !important;color:#1A2C6B}
.two-col{display:grid;grid-template-columns:${isFinal ? '2fr 1fr' : '1fr 1fr'};gap:16px}
.grade-key{display:flex;flex-wrap:wrap;gap:4px 12px;font-size:10px;color:#666;margin-top:8px}
.grade-key strong{color:#1A2C6B}
.sig-row{display:flex;justify-content:space-between;margin-top:20px;font-size:10.5px}
.sig-block{text-align:center}
.sig-line{width:110px;border-bottom:0.5px solid #444;margin:0 auto 3px}
.att-box{background:#e8ecf8;border-radius:5px;padding:5px 10px;font-size:11px;display:inline-block;margin-top:6px;color:#1A2C6B;font-weight:500}
.no-data{font-size:11px;color:#aaa;text-align:center;padding:12px 0;font-style:italic}
</style></head><body>
<div class="page">
  <div class="hdr">
    ${LOGO_IMG}
    <div>
      <div class="school">IQRAH ENGLISH MEDIUM SCHOOL</div>
      <div class="addr">Nediyiruppu, Kondotty – 673638, Malappuram | Ph: 9744636329 | iemskdy@gmail.com</div>
    </div>
  </div>
  <div class="report-title">PROGRESS REPORT</div>
  <div class="year-badge">Academic Year : 2025–2026</div>
  <div class="student-info">
    <div class="info-row"><span class="info-label">Name</span><span class="info-val">: ${s.name}</span></div>
    <div class="info-row"><span class="info-label">Standard</span><span class="info-val">: ${s.standard}</span></div>
    <div class="info-row"><span class="info-label">Admission No</span><span class="info-val">: ${s.admission_no}</span></div>
    <div class="info-row"><span class="info-label">Gender</span><span class="info-val">: ${pronoun}</span></div>
  </div>
  <div class="two-col">
    <div>
      <div class="section-title">${examTitle}</div>
      <table>
        <thead>${academicThead}</thead>
        <tbody>
          ${noSubjects || subjectRows}
          ${academicTfoot}
        </tbody>
      </table>
      <div class="att-box">Rank : ${ov.rank || '—'} &nbsp;|&nbsp; Attendance : ${ov.days_attended} / ${ov.school_days}</div>
    </div>
    <div>
      <div class="section-title">${moralTitle}</div>
      <table>
        <thead><tr><th>Subject</th><th class="tc">Full</th><th class="tc">Obtained</th><th class="tc">Grade</th></tr></thead>
        <tbody>
          ${moralRows}
          <tr class="total-row"><td>Total</td><td class="tc">${moralFull}</td><td class="tc">${moralObt}</td><td class="gc">${calcGrade(moralObt, moralFull)}</td></tr>
        </tbody>
      </table>
      <div class="att-box">Moral Rank : ${ov.moral_rank || '—'}</div>
    </div>
  </div>
  <div class="grade-key">
    <span><strong>A+</strong> 90–100%</span><span><strong>A</strong> 80–89%</span>
    <span><strong>B+</strong> 70–79%</span><span><strong>B</strong> 60–69%</span>
    <span><strong>C+</strong> 50–59%</span><span><strong>C</strong> 40–49%</span>
    <span><strong>D+</strong> 30–39%</span><span><strong>D</strong> 20–29%</span>
    <span><strong>E</strong> Below 20%</span>
  </div>
  <div class="sig-row">
    <div class="sig-block"><div class="sig-line">&nbsp;</div>Class Teacher</div>
    <div class="sig-block"><div class="sig-line">&nbsp;</div>Mu'allim</div>
    <div class="sig-block"><div class="sig-line">&nbsp;</div>Principal</div>
    <div class="sig-block"><div class="sig-line">&nbsp;</div>Parent</div>
  </div>
</div></body></html>`
}

// Convenience wrappers
function buildPRHalfYearly(s: StudentWithMarks, ov: TCOverrides) { return buildPRDoc(s, ov, 'hy') }
function buildPRFinal(s: StudentWithMarks, ov: TCOverrides)      { return buildPRDoc(s, ov, 'final') }

// ── Small reusable field components ───────────────────────────────────────
const fieldStyle: React.CSSProperties = {
  fontSize: 12, padding: '5px 8px', borderRadius: 6,
  border: `1px solid ${BORDER}`, background: LIGHT,
  color: NAVY, outline: 'none', fontFamily: 'inherit', width: '100%',
}

function Field({ label, value, onChange, type = 'text', placeholder }: {
  label: string; value: string; onChange: (v: string) => void
  type?: string; placeholder?: string
}) {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 3 }}>
      <label style={{ fontSize: 10, fontWeight: 600, color: TEXT_S, textTransform: 'uppercase', letterSpacing: '0.5px' }}>{label}</label>
      <input
        type={type} value={value} onChange={e => onChange(e.target.value)}
        placeholder={placeholder} style={fieldStyle}
        onFocus={e => (e.target.style.borderColor = NAVY)}
        onBlur={e  => (e.target.style.borderColor = BORDER)}
      />
    </div>
  )
}

function Toggle({ label, value, onChange }: { label: string; value: boolean; onChange: (v: boolean) => void }) {
  return (
    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '4px 0' }}>
      <span style={{ fontSize: 12, color: NAVY }}>{label}</span>
      <div onClick={() => onChange(!value)} style={{ width: 36, height: 20, borderRadius: 10, cursor: 'pointer', background: value ? NAVY : BORDER, position: 'relative', transition: 'background 0.2s' }}>
        <div style={{ position: 'absolute', top: 3, left: value ? 18 : 3, width: 14, height: 14, borderRadius: '50%', background: WHITE, transition: 'left 0.2s' }} />
      </div>
    </div>
  )
}

function SelectField({ label, value, onChange, options }: {
  label: string; value: string; onChange: (v: string) => void; options: string[]
}) {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 3 }}>
      <label style={{ fontSize: 10, fontWeight: 600, color: TEXT_S, textTransform: 'uppercase', letterSpacing: '0.5px' }}>{label}</label>
      <select value={value} onChange={e => onChange(e.target.value)} style={{ ...fieldStyle, appearance: 'none' as const }}
        onFocus={e => (e.target.style.borderColor = NAVY)}
        onBlur={e  => (e.target.style.borderColor = BORDER)}
      >
        {options.map(o => <option key={o} value={o}>{o}</option>)}
      </select>
    </div>
  )
}

type TCUpdater = (prev: TCOverrides) => TCOverrides

function TCEditPanel({ ov, setOv, onSave, saving }: {
  ov: TCOverrides; setOv: (updater: TCUpdater) => void; onSave: () => void; saving: boolean
}) {
  const set = (k: keyof TCOverrides) => (v: string | boolean) =>
    setOv(prev => ({ ...prev, [k]: v }))

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
      <div style={{ fontSize: 10, fontWeight: 700, color: NAVY, letterSpacing: '0.8px', textTransform: 'uppercase', borderBottom: `1px solid ${BORDER}`, paddingBottom: 4 }}>Personal Details</div>
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8 }}>
        <Field label="Nationality"    value={ov.nationality} onChange={set('nationality')} />
        <Field label="Religion"       value={ov.religion}    onChange={set('religion')} />
        <Field label="Caste"          value={ov.caste}       onChange={set('caste')} />
        <SelectField label="Category" value={ov.category}    onChange={set('category')} options={['General', 'OBC', 'SC', 'ST']} />
      </div>
      <div style={{ fontSize: 10, fontWeight: 700, color: NAVY, letterSpacing: '0.8px', textTransform: 'uppercase', borderBottom: `1px solid ${BORDER}`, paddingBottom: 4, marginTop: 4 }}>Dates</div>
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8 }}>
        <Field label="Admission Date"  value={ov.admission_date}  onChange={set('admission_date')}  type="date" />
        <Field label="Last Attendance" value={ov.last_attendance} onChange={set('last_attendance')} type="date" />
      </div>
      <Field label="School Proceeding To" value={ov.next_school} onChange={set('next_school')} placeholder="Next school name" />
      <div style={{ fontSize: 10, fontWeight: 700, color: NAVY, letterSpacing: '0.8px', textTransform: 'uppercase', borderBottom: `1px solid ${BORDER}`, paddingBottom: 4, marginTop: 4 }}>Attendance & Academic</div>
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8 }}>
        <Field label="Total School Days" value={ov.school_days}   onChange={set('school_days')}   type="number" />
        <Field label="Days Attended"     value={ov.days_attended} onChange={set('days_attended')} type="number" />
        <Field label="Academic Rank"     value={ov.rank}          onChange={set('rank')}          type="number" placeholder="—" />
        <Field label="Moral Rank"        value={ov.moral_rank}    onChange={set('moral_rank')}    type="number" placeholder="—" />
      </div>
      <SelectField label="Conduct" value={ov.conduct} onChange={set('conduct')} options={['Excellent', 'Very Good', 'Good', 'Satisfactory', 'Needs Improvement']} />
      <div style={{ fontSize: 10, fontWeight: 700, color: NAVY, letterSpacing: '0.8px', textTransform: 'uppercase', borderBottom: `1px solid ${BORDER}`, paddingBottom: 4, marginTop: 4 }}>Status Flags</div>
      <div style={{ display: 'flex', flexDirection: 'column', gap: 4, background: LIGHT, borderRadius: 7, padding: '8px 12px', border: `1px solid ${BORDER}` }}>
        <Toggle label="Qualified for promotion" value={ov.qualified}      onChange={v => setOv(prev => ({ ...prev, qualified: v }))} />
        <Toggle label="Fees paid"               value={ov.fees_paid}      onChange={v => setOv(prev => ({ ...prev, fees_paid: v }))} />
        <Toggle label="Fee concession"          value={ov.fee_concession} onChange={v => setOv(prev => ({ ...prev, fee_concession: v }))} />
        <Toggle label="Vaccinated"              value={ov.vaccinated}     onChange={v => setOv(prev => ({ ...prev, vaccinated: v }))} />
      </div>
      <button onClick={onSave} disabled={saving} style={{ marginTop: 4, padding: '8px', fontSize: 12, fontWeight: 600, borderRadius: 7, border: `1px solid ${NAVY}`, background: NAVY, color: WHITE, cursor: saving ? 'not-allowed' : 'pointer', fontFamily: 'inherit', opacity: saving ? 0.7 : 1, transition: 'opacity 0.15s' }}>
        {saving ? 'Saving…' : ' Save Changes'}
      </button>
    </div>
  )
}

function EditModal({ ov, setOv, onSave, saving, saveMsg, onClose }: {
  ov: TCOverrides; setOv: (updater: TCUpdater) => void
  onSave: () => void; saving: boolean; saveMsg: string; onClose: () => void
}) {
  function handleBackdrop(e: React.MouseEvent<HTMLDivElement>) {
    if (e.target === e.currentTarget) onClose()
  }
  useEffect(() => {
    function onKey(e: KeyboardEvent) { if (e.key === 'Escape') onClose() }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [onClose])

  return (
    <div onClick={handleBackdrop} style={{ position: 'fixed', inset: 0, zIndex: 1000, background: 'rgba(10, 18, 50, 0.55)', backdropFilter: 'blur(4px)', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 24, animation: 'fadeIn 0.18s ease' }}>
      <style>{`@keyframes fadeIn{from{opacity:0}to{opacity:1}} @keyframes slideUp{from{opacity:0;transform:translateY(18px)}to{opacity:1;transform:translateY(0)}}`}</style>
      <div style={{ background: WHITE, borderRadius: 14, width: '100%', maxWidth: 560, maxHeight: '90vh', display: 'flex', flexDirection: 'column', boxShadow: '0 24px 64px rgba(10,18,50,0.28)', border: `1px solid ${BORDER}`, animation: 'slideUp 0.2s ease', overflow: 'hidden' }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '14px 20px', borderBottom: `1px solid ${BORDER}`, background: NAVY, flexShrink: 0 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke={GOLD} strokeWidth="2.2">
              <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"/>
              <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"/>
            </svg>
            <span style={{ fontSize: 13, fontWeight: 700, color: WHITE, letterSpacing: '0.3px' }}>Edit TC Fields</span>
          </div>
          <button onClick={onClose} style={{ background: 'rgba(255,255,255,0.12)', border: 'none', borderRadius: 7, width: 28, height: 28, cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', color: WHITE, fontSize: 16, lineHeight: 1, transition: 'background 0.15s', fontFamily: 'inherit' }}
            onMouseEnter={e => (e.currentTarget.style.background = 'rgba(255,255,255,0.22)')}
            onMouseLeave={e => (e.currentTarget.style.background = 'rgba(255,255,255,0.12)')}
            aria-label="Close"
          >×</button>
        </div>
        <div style={{ overflowY: 'auto', padding: '18px 20px', flex: 1 }}>
          <TCEditPanel ov={ov} setOv={setOv} onSave={onSave} saving={saving} />
          {saveMsg && (
            <div style={{ marginTop: 10, fontSize: 12, fontWeight: 600, textAlign: 'center', padding: '8px 12px', borderRadius: 7, color: saveMsg.startsWith('✓') ? '#1D9E75' : '#c0392b', background: saveMsg.startsWith('✓') ? '#edfaf5' : '#fdf2f2', border: `1px solid ${saveMsg.startsWith('✓') ? '#a3e4cf' : '#f5c6cb'}` }}>
              {saveMsg}
            </div>
          )}
        </div>
        <div style={{ padding: '10px 20px', borderTop: `1px solid ${BORDER}`, display: 'flex', justifyContent: 'flex-end', flexShrink: 0, background: LIGHT }}>
          <button onClick={onClose} style={{ padding: '7px 18px', fontSize: 12, fontWeight: 500, borderRadius: 7, border: `1px solid ${BORDER}`, background: WHITE, color: TEXT_S, cursor: 'pointer', fontFamily: 'inherit', transition: 'all 0.15s' }}
            onMouseEnter={e => { e.currentTarget.style.borderColor = NAVY; e.currentTarget.style.color = NAVY }}
            onMouseLeave={e => { e.currentTarget.style.borderColor = BORDER; e.currentTarget.style.color = TEXT_S }}
          >Close</button>
        </div>
      </div>
    </div>
  )
}

// ── Main Component ─────────────────────────────────────────────────────────
export default function DocumentGenerator() {
  const [students, setStudents] = useState<StudentWithMarks[]>([])
  const [loading, setLoading]   = useState(true)
  const [error, setError]       = useState<string | null>(null)
  const [selected, setSelected] = useState<StudentWithMarks | null>(null)
  const [docType, setDocType]   = useState<'tc' | 'cc' | 'pr_hy' | 'pr_f'>('tc')
  const [search, setSearch]     = useState('')
  const [classFilter, setClassFilter] = useState<string>('All')
  const [showModal, setShowModal] = useState(false)
  const [ov, setOv]               = useState<TCOverrides | null>(null)
  const [saving, setSaving]       = useState(false)
  const [saveMsg, setSaveMsg]     = useState('')
  const iframeRef                 = useRef<HTMLIFrameElement>(null)

  useEffect(() => {
    getStudentsWithMarks()
      .then(data => {
        setStudents(data)
        if (data.length > 0) {
          setSelected(data[0])
          setOv(marksToOverrides(data[0].marks))
        }
      })
      .catch((e: unknown) => setError(e instanceof Error ? e.message : 'Failed to load'))
      .finally(() => setLoading(false))
  }, [])

  function selectStudent(s: StudentWithMarks) {
    setSelected(s)
    setOv(marksToOverrides(s.marks))
    setSaveMsg('')
  }

  const uniqueClasses = ['All', ...Array.from(new Set(students.map(s => s.standard))).sort()]
  const filtered = students.filter(s => {
    const matchesSearch = s.name.toLowerCase().includes(search.toLowerCase()) || s.admission_no.includes(search)
    const matchesClass  = classFilter === 'All' || s.standard === classFilter
    return matchesSearch && matchesClass
  })

  function buildDoc(s: StudentWithMarks, overrides: TCOverrides) {
    if (docType === 'tc')    return buildTC(s, overrides)
    if (docType === 'cc')    return buildCC(s, overrides)
    if (docType === 'pr_hy') return buildPRHalfYearly(s, overrides)
    return buildPRFinal(s, overrides)
  }

  function handlePrint() {
    if (!selected || !ov) return
    const win = window.open('', '_blank')!
    win.document.write(buildDoc(selected, ov))
    win.document.close()
    win.onload = () => win.print()
  }

  async function handleSave() {
    if (!selected || !ov) return
    setSaving(true); setSaveMsg('')
    try {
      await upsertStudentMarks({
        student_id:      selected.id!,
        arabic:          selected.marks.arabic,
        malayalam:       selected.marks.malayalam,
        it:              selected.marks.it,
        gk:              selected.marks.gk,
        science:         selected.marks.science,
        social:          selected.marks.social,
        maths:           selected.marks.maths,
        english:         selected.marks.english,
        hindi:           selected.marks.hindi,
        quran:           selected.marks.quran,
        thajveed:        selected.marks.thajveed,
        fiqh:            selected.marks.fiqh,
        uloom:           selected.marks.uloom,
        school_days:     parseInt(ov.school_days)  || 0,
        days_attended:   parseInt(ov.days_attended) || 0,
        rank:            ov.rank      ? parseInt(ov.rank)       : null,
        moral_rank:      ov.moral_rank ? parseInt(ov.moral_rank) : null,
        conduct:         ov.conduct,
        qualified:       ov.qualified,
        fees_paid:       ov.fees_paid,
        fee_concession:  ov.fee_concession,
        last_attendance: ov.last_attendance,
        next_school:     ov.next_school || null,
        vaccinated:      ov.vaccinated,
        nationality:     ov.nationality,
        religion:        ov.religion,
        caste:           ov.caste,
        category:        ov.category,
        admission_date:  ov.admission_date,
      })
      setSaveMsg('✓ Saved')
    } catch (e: unknown) {
      setSaveMsg('✗ ' + (e instanceof Error ? e.message : 'Save failed'))
    } finally {
      setSaving(false)
    }
  }

  const docLabels = {
    tc:    'Transfer Certificate',
    cc:    'Conduct Certificate',
    pr_hy: 'Half-Yearly Report',
    pr_f:  'Final Report',
  } as const
  type DocType = keyof typeof docLabels

  if (loading) return (
    <div style={{ display:'flex', flexDirection:'column', alignItems:'center', justifyContent:'center', height:400, gap:16, fontFamily:"'Outfit',sans-serif" }}>
      <div style={{ width:40, height:40, borderRadius:'50%', border:`3px solid ${BORDER}`, borderTopColor:NAVY, animation:'spin 0.8s linear infinite' }} />
      <style>{`@keyframes spin{to{transform:rotate(360deg)}}`}</style>
      <span style={{ fontSize:13, color:TEXT_S }}>Loading students…</span>
    </div>
  )

  if (error) return (
    <div style={{ padding:24, color:'#c0392b', fontSize:13, background:'#fdf2f2', borderRadius:8, border:'1px solid #f5c6cb', fontFamily:"'Outfit',sans-serif" }}>
      <strong>Error:</strong> {error}
    </div>
  )

  return (
    <div style={{ fontFamily:"'Outfit',sans-serif", display:'flex', gap:16, minHeight:600, background:LIGHT, borderRadius:12, padding:16 }}>

      {showModal && ov && (
        <EditModal
          ov={ov}
          setOv={(updater: TCUpdater) => setOv(prev => prev ? updater(prev) : prev)}
          onSave={handleSave}
          saving={saving}
          saveMsg={saveMsg}
          onClose={() => setShowModal(false)}
        />
      )}

      {/* Sidebar */}
      <div style={{ width:210, flexShrink:0, display:'flex', flexDirection:'column', gap:8, background:WHITE, borderRadius:10, padding:12, border:`1px solid ${BORDER}`, boxShadow:'0 2px 8px rgba(26,44,107,0.06)' }}>
        <div style={{ display:'flex', alignItems:'center', gap:8, paddingBottom:10, borderBottom:`1px solid ${BORDER}`, marginBottom:4 }}>
          <img src="/images/logo.png" alt="Iqrah" style={{ width:32, height:32, objectFit:'contain' }} />
          <div>
            <div style={{ fontSize:11, fontWeight:600, color:NAVY, lineHeight:1.2 }}>IQRAH</div>
            <div style={{ fontSize:9.5, color:TEXT_S }}>Docs</div>
          </div>
        </div>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
          <div style={{ fontSize:9, fontWeight:700, color:TEXT_S, letterSpacing:'0.8px', textTransform:'uppercase' }}>Filter by Class</div>
          <select value={classFilter} onChange={e => setClassFilter(e.target.value)} style={{ fontSize:11.5, padding:'5px 8px', borderRadius:7, border:`1px solid ${BORDER}`, background:LIGHT, color:NAVY, outline:'none', cursor:'pointer' }}>
            {uniqueClasses.map(c => <option key={c} value={c}>{c}</option>)}
          </select>
          <div style={{ fontSize:9, fontWeight:700, color:TEXT_S, letterSpacing:'0.8px', textTransform:'uppercase', marginTop: 4 }}>Search Name/No.</div>
          <input value={search} onChange={e => setSearch(e.target.value)} placeholder="Type to search..." style={{ fontSize:11.5, padding:'6px 10px', borderRadius:7, border:`1px solid ${BORDER}`, background:LIGHT, color:NAVY, outline:'none' }} />
        </div>
        <div style={{ fontSize:10, fontWeight:600, color:TEXT_S, marginTop: 8 }}>Results: {filtered.length}</div>
        <div style={{ flex:1, overflowY:'auto', display:'flex', flexDirection:'column', gap:4, marginTop: 4 }}>
          {filtered.length === 0
            ? <div style={{ fontSize:12, color:TEXT_S, textAlign:'center', padding:'12px 0' }}>No matches</div>
            : filtered.map(s => {
                const active = selected?.id === s.id
                return (
                  <div key={s.id} onClick={() => selectStudent(s)} style={{ padding:'7px 9px', borderRadius:7, border:`1px solid ${active ? NAVY : BORDER}`, background:active ? NAVY : WHITE, cursor:'pointer', transition:'all 0.15s' }}>
                    <div style={{ fontSize:11.5, fontWeight:500, color:active ? WHITE : NAVY }}>{s.name}</div>
                    <div style={{ fontSize:10, color:active ? 'rgba(255,255,255,0.6)' : TEXT_S, marginTop:1 }}>{s.standard} · #{s.admission_no}</div>
                  </div>
                )
              })
          }
        </div>
      </div>

      {/* Main panel */}
      <div style={{ flex:1, display:'flex', flexDirection:'column', gap:10, minWidth:0 }}>
        <div style={{ display:'flex', gap:8, alignItems:'center', flexWrap:'wrap', background:WHITE, borderRadius:10, padding:'9px 14px', border:`1px solid ${BORDER}`, boxShadow:'0 2px 8px rgba(26,44,107,0.06)' }}>
          <div style={{ display:'flex', gap:6 }}>
            {(Object.entries(docLabels) as [keyof typeof docLabels, string][]).map(([key, label]) => {
              const active = docType === key
              return (
                <button key={key} onClick={() => { setDocType(key); if (key !== 'tc') setShowModal(false) }}
                  style={{ padding:'5px 13px', fontSize:12, fontWeight:500, borderRadius:7, border:`1px solid ${active ? NAVY : BORDER}`, background:active ? NAVY : WHITE, color:active ? WHITE : NAVY, cursor:'pointer', fontFamily:'inherit', transition:'all 0.15s' }}
                >{label}</button>
              )
            })}
          </div>
          <div style={{ flex:1 }} />
          {selected && docType === 'tc' && (
            <button onClick={() => setShowModal(true)} style={{ padding:'5px 13px', fontSize:12, fontWeight:500, borderRadius:7, border:`1px solid ${GOLD}`, background:'#FDF3E3', color:GOLD, cursor:'pointer', fontFamily:'inherit', display:'flex', alignItems:'center', gap:5 }}>
              Edit Fields
            </button>
          )}
          {selected && (
            <button onClick={handlePrint} style={{ padding:'5px 16px', fontSize:12, fontWeight:600, borderRadius:7, border:`1px solid ${GOLD}`, background:GOLD, color:WHITE, cursor:'pointer', display:'flex', alignItems:'center', gap:6 }}>
              Print / PDF
            </button>
          )}
        </div>
        <div style={{ flex:1, minHeight:0 }}>
          {selected && ov ? (
            <div style={{ height:'100%', border:`1px solid ${BORDER}`, borderRadius:10, overflow:'hidden', background:WHITE, display:'flex', flexDirection:'column' }}>
              <div style={{ padding:'7px 14px', background:NAVY, fontSize:11.5, display:'flex', justifyContent:'space-between', alignItems:'center' }}>
                <span style={{ color:'rgba(255,255,255,0.6)' }}>Preview — <span style={{ color:WHITE, fontWeight:500 }}>{docLabels[docType]}</span></span>
                <span style={{ color:GOLD, fontWeight:600, fontSize:12 }}>{selected.name} · {selected.standard}</span>
              </div>
              <iframe ref={iframeRef} srcDoc={buildDoc(selected, ov)} style={{ flex:1, width:'100%', minHeight:520, border:'none', display:'block' }} title="Document Preview" />
            </div>
          ) : (
            <div style={{ height:'100%', display:'flex', alignItems:'center', justifyContent:'center', color:TEXT_S, background:WHITE, borderRadius:10, border:`1px dashed ${BORDER}` }}>
              Select a student to preview
            </div>
          )}
        </div>
      </div>
    </div>
  )
}