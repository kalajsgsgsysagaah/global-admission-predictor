import { useState } from 'react'
import Head from 'next/head'

const COUNTRIES: Record<string, string> = {
    Australia: '🇦🇺', Canada: '🇨🇦', France: '🇫🇷', Germany: '🇩🇪',
    Ireland: '🇮🇪', Netherlands: '🇳🇱', 'New Zealand': '🇳🇿', Singapore: '🇸🇬',
    Sweden: '🇸🇪', Switzerland: '🇨🇭', UAE: '🇦🇪', UK: '🇬🇧', USA: '🇺🇸',
}
const EXAMS = ['IELTS', 'TOEFL', 'PTE', 'DET', 'GRE']
const DEGREES = ['Undergraduate', 'Masters', 'PhD']
const EXAM_INFO: Record<string, string> = {
    IELTS: '0 – 9', TOEFL: '0 – 120', PTE: '10 – 90', DET: '10 – 160', GRE: '260 – 340',
}
const COLOR: Record<string, string> = {
    Strong: '#22c55e', Average: '#f59e0b', Weak: '#ef4444',
}

export default function Home() {
    const [form, setForm] = useState({
        degree: 'Masters', exam_type: 'IELTS', exam_score: '7',
        work_exp: '2', cgpa: '8.0', sop: '3', lor: '3', research: '0',
        country: 'Australia', internship: 'false',
    })
    const [result, setResult] = useState<any>(null)
    const [loading, setLoading] = useState(false)
    const [error, setError] = useState('')

    const set = (k: string) => (e: any) => setForm(f => ({ ...f, [k]: e.target.value }))
    const setVal = (k: string, v: string) => setForm(f => ({ ...f, [k]: v }))

    const predict = async () => {
        setLoading(true); setError(''); setResult(null)
        try {
            const res = await fetch('/api/predict', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    ...form,
                    exam_score: +form.exam_score, work_exp: +form.work_exp,
                    cgpa: +form.cgpa, sop: +form.sop, lor: +form.lor,
                    research: +form.research, internship: form.internship === 'true',
                }),
            })
            const data = await res.json()
            if (data.error) setError(data.error)
            else setResult(data)
        } catch { setError('Network error — is the API running?') }
        setLoading(false)
    }

    return (
        <>
            <Head>
                <title>🎓 Global Admission Predictor</title>
                <meta name="description" content="Predict your Masters admission chances across 13 countries" />
                <link href="https://fonts.googleapis.com/css2?family=Inter:wght@400;600;700;800&display=swap" rel="stylesheet" />
            </Head>

            <main style={{
                minHeight: '100vh', background: 'linear-gradient(135deg,#0d0d1a,#12122a,#0d1a2a)',
                fontFamily: "'Inter',sans-serif", padding: '32px 16px', color: '#e2e8f0'
            }}>

                {/* Header */}
                <div style={{
                    maxWidth: 900, margin: '0 auto 28px', textAlign: 'center',
                    background: 'linear-gradient(90deg,rgba(109,40,217,.18),rgba(79,70,229,.18))',
                    border: '1px solid rgba(139,92,246,.25)', borderRadius: 20, padding: '28px 20px'
                }}>
                    <h1 style={{
                        fontSize: '2.4rem', fontWeight: 800, margin: 0,
                        background: 'linear-gradient(90deg,#a78bfa,#818cf8)',
                        WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent'
                    }}>
                        🎓 Global Admission Predictor
                    </h1>
                </div>

                {/* Form */}
                <div style={{
                    maxWidth: 900, margin: '0 auto', display: 'grid',
                    gridTemplateColumns: 'repeat(auto-fit,minmax(380px,1fr))', gap: 20
                }}>
                    {/* Left — Academic */}
                    <Card title="🏫 Academic Profile">
                        <Field label="Degree Level">
                            <Select value={form.degree} onChange={set('degree')} options={DEGREES} />
                        </Field>

                        <SliderField
                            label="CGPA" unit="" min={6} max={10} step={0.1}
                            value={form.cgpa} onChange={v => setVal('cgpa', v)}
                        />
                        <SliderField
                            label="SOP Strength" unit="/5" min={1} max={5} step={0.5}
                            value={form.sop} onChange={v => setVal('sop', v)}
                        />
                        <SliderField
                            label="LOR Strength" unit="/5" min={1} max={5} step={0.5}
                            value={form.lor} onChange={v => setVal('lor', v)}
                        />
                        <SliderField
                            label="Work Experience" unit=" yrs" min={0} max={10} step={1}
                            value={form.work_exp} onChange={v => setVal('work_exp', v)}
                        />

                        <Field label="Research Experience">
                            <RadioGroup
                                options={[['0', 'No ❌'], ['1', 'Yes ✅']]}
                                value={form.research} onChange={v => setVal('research', v)}
                            />
                        </Field>
                        <Field label="💼 Internship / Project Experience">
                            <RadioGroup
                                options={[['false', 'No ❌'], ['true', 'Yes ✅']]}
                                value={form.internship} onChange={v => setVal('internship', v)}
                            />
                        </Field>
                    </Card>

                    {/* Right — Destination */}
                    <Card title="🌍 Destination & Exam">
                        <Field label="Target Country">
                            <Select value={form.country} onChange={set('country')}
                                options={Object.keys(COUNTRIES).map(c => `${COUNTRIES[c]} ${c}`)}
                                valueMap={Object.keys(COUNTRIES)} />
                        </Field>
                        <Field label="Exam Type">
                            <Select value={form.exam_type} onChange={set('exam_type')} options={EXAMS} />
                        </Field>
                        <Field label={`Exam Score  (${EXAM_INFO[form.exam_type]})`}>
                            <input type="number" value={form.exam_score} onChange={set('exam_score')}
                                style={{ ...inputStyle, width: '100%', boxSizing: 'border-box' as any }} />
                        </Field>
                    </Card>
                </div>

                {/* Predict button */}
                <div style={{ maxWidth: 900, margin: '24px auto 0', textAlign: 'center' }}>
                    <button onClick={predict} disabled={loading} style={{
                        background: 'linear-gradient(90deg,#6d28d9,#4f46e5)',
                        color: '#fff', border: 'none', borderRadius: 14, padding: '14px 48px',
                        fontSize: '1.05rem', fontWeight: 700, cursor: loading ? 'not-allowed' : 'pointer',
                        boxShadow: '0 4px 20px rgba(109,40,217,.45)', letterSpacing: '.04em',
                        opacity: loading ? .7 : 1, transition: 'all .25s'
                    }}>
                        {loading ? '⏳  Predicting...' : '🔮  Predict My Admission Chances'}
                    </button>
                </div>

                {/* Error */}
                {error && (
                    <div style={{
                        maxWidth: 900, margin: '20px auto 0', textAlign: 'center',
                        background: 'rgba(220,38,38,.15)', border: '1px solid rgba(220,38,38,.4)',
                        borderRadius: 12, padding: '14px', color: '#fca5a5'
                    }}>
                        ❌ {error}
                    </div>
                )}

                {/* Result */}
                {result && (
                    <div style={{
                        maxWidth: 900, margin: '24px auto 0',
                        background: 'linear-gradient(135deg,rgba(109,40,217,.22),rgba(79,70,229,.18))',
                        border: '1.5px solid rgba(139,92,246,.55)', borderRadius: 18,
                        padding: '28px', boxShadow: '0 0 32px rgba(109,40,217,.3)'
                    }}>
                        {/* Big number */}
                        <div style={{ textAlign: 'center', marginBottom: 20 }}>
                            <div style={{
                                fontSize: '3.4rem', fontWeight: 800, lineHeight: 1,
                                background: 'linear-gradient(90deg,#a78bfa,#818cf8)',
                                WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent'
                            }}>
                                {result.prediction >= 70 ? '🎉' : result.prediction >= 45 ? '🎯' : '📉'} {result.prediction}%
                            </div>
                            <div style={{ color: result.bar_color, fontWeight: 700, fontSize: '1.15rem', marginTop: 8 }}>
                                {result.verdict}
                            </div>
                        </div>

                        {/* Progress bar */}
                        <div style={{ background: 'rgba(255,255,255,.08)', borderRadius: 999, height: 10, overflow: 'hidden', marginBottom: 6 }}>
                            <div style={{
                                width: `${result.prediction}%`, height: '100%',
                                background: `linear-gradient(90deg,${result.bar_color},${result.bar_color}99)`,
                                borderRadius: 999, transition: 'width .6s ease'
                            }} />
                        </div>
                        <div style={{ display: 'flex', justifyContent: 'space-between', color: '#475569', fontSize: '.75rem', marginBottom: 20 }}>
                            <span>0%</span><span>45% Moderate</span><span>70% Strong</span>
                        </div>

                        <HR />
                        <SectionTitle>📋 Your Profile</SectionTitle>
                        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '6px 24px', fontSize: '.88rem', color: '#94a3b8', marginTop: 10 }}>
                            {[
                                ['Degree', form.degree], ['Country', `${COUNTRIES[form.country]} ${form.country}`],
                                ['Exam', `${form.exam_type} — ${form.exam_score}`], ['CGPA', form.cgpa],
                                ['SOP', `${form.sop}/5`], ['LOR', `${form.lor}/5`],
                                ['Research', form.research === '1' ? 'Yes ✅' : 'No ❌'],
                                ['Work Exp', `${form.work_exp} yr(s)`],
                                ['Internship', form.internship === 'true' ? 'Yes ✅' : 'No ❌'],
                            ].map(([k, v]) => (<span key={k}><b style={{ color: '#c4b5fd' }}>{k}</b> — {v}</span>))}
                        </div>

                        <HR />
                        <SectionTitle>📈 Profile Strength</SectionTitle>
                        <div style={{ marginTop: 10 }}>
                            {Object.entries(result.scorecard).map(([key, val]: any) => (
                                <div key={key} style={{ marginBottom: 10 }}>
                                    <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '.82rem', color: '#94a3b8', marginBottom: 3 }}>
                                        <span>{key}</span>
                                        <span style={{ color: COLOR[val.rating], fontWeight: 700 }}>
                                            {val.value}{key === 'CGPA' ? '' : key === 'Work Exp' ? ' yrs' : '/5'} — {val.rating}
                                        </span>
                                    </div>
                                    <div style={{ background: 'rgba(255,255,255,.08)', borderRadius: 999, height: 6 }}>
                                        <div style={{
                                            width: `${Math.min(100, (val.value / (key === 'CGPA' ? 9 : key === 'Work Exp' ? 4 : key === 'Research' ? 1 : 4.5)) * 100)}%`,
                                            height: '100%', background: COLOR[val.rating], borderRadius: 999
                                        }} />
                                    </div>
                                </div>
                            ))}
                        </div>

                        {result.tips.length > 0 && (
                            <>
                                <HR />
                                <SectionTitle>💡 Improvement Tips</SectionTitle>
                                <ul style={{ paddingLeft: 18, color: '#94a3b8', fontSize: '.85rem', lineHeight: 1.8, marginTop: 8 }}>
                                    {result.tips.map((t: string, i: number) => <li key={i}>{t}</li>)}
                                </ul>
                            </>
                        )}

                        {result.fit_warning && (
                            <>
                                <HR />
                                <div style={{
                                    background: 'rgba(251,191,36,.08)', border: '1px solid rgba(251,191,36,.3)',
                                    borderRadius: 10, padding: '12px 16px', color: '#fde68a', fontSize: '.85rem'
                                }}>
                                    ⚠️ {result.fit_warning}
                                </div>
                            </>
                        )}
                    </div>
                )}

                {/* Country chips */}
                <div style={{ maxWidth: 900, margin: '28px auto 0', textAlign: 'center' }}>
                    <div style={{ color: '#475569', fontSize: '.72rem', letterSpacing: '.06em', textTransform: 'uppercase', marginBottom: 10 }}>
                        🌍 Supported Countries
                    </div>
                    <div>
                        {Object.entries(COUNTRIES).map(([name, flag]) => (
                            <span key={name} style={{
                                display: 'inline-block', margin: '4px 5px', padding: '4px 14px',
                                borderRadius: 999, background: 'rgba(109,40,217,.18)',
                                border: '1px solid rgba(139,92,246,.35)', color: '#c4b5fd', fontSize: '.8rem', fontWeight: 600
                            }}>
                                {flag} {name}
                            </span>
                        ))}
                    </div>
                </div>
            </main>
        </>
    )
}

// ── Slider + manual input combo ────────────────────────
function SliderField({ label, unit, min, max, step, value, onChange }: {
    label: string; unit: string; min: number; max: number; step: number;
    value: string; onChange: (v: string) => void
}) {
    return (
        <Field label={`${label}${unit ? '  (' + min + ' – ' + max + unit + ')' : ''}`}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                <input type="range" min={min} max={max} step={step} value={value}
                    onChange={e => onChange(e.target.value)}
                    style={{ flex: 1, accentColor: '#7c3aed', cursor: 'pointer' }} />
                <input type="number" min={min} max={max} step={step} value={value}
                    onChange={e => onChange(e.target.value)}
                    style={{
                        ...inputStyle, width: 72, textAlign: 'center',
                        padding: '6px 8px', flexShrink: 0
                    }} />
            </div>
        </Field>
    )
}

// ── Radio group ────────────────────────────────────────
function RadioGroup({ options, value, onChange }: {
    options: [string, string][]; value: string; onChange: (v: string) => void
}) {
    return (
        <div style={{ display: 'flex', gap: 12, marginTop: 6 }}>
            {options.map(([v, l]) => (
                <label key={v} style={{
                    display: 'flex', alignItems: 'center', gap: 8, cursor: 'pointer',
                    color: value === v ? '#c4b5fd' : '#64748b', fontWeight: value === v ? 700 : 400
                }}>
                    <input type="radio" value={v} checked={value === v} onChange={() => onChange(v)} /> {l}
                </label>
            ))}
        </div>
    )
}

// ── Shared helpers ─────────────────────────────────────
const cardStyle: React.CSSProperties = {
    background: 'rgba(255,255,255,.04)', border: '1px solid rgba(139,92,246,.2)',
    borderRadius: 16, padding: '20px 22px',
}
function Card({ title, children }: { title: string; children: React.ReactNode }) {
    return (
        <div style={cardStyle}>
            <h3 style={{ color: '#a78bfa', margin: '0 0 16px', fontSize: '1rem', fontWeight: 700 }}>{title}</h3>
            {children}
        </div>
    )
}
function Field({ label, children }: { label: string; children: React.ReactNode }) {
    return (
        <div style={{ marginBottom: 16 }}>
            <label style={{ display: 'block', color: '#c4b5fd', fontSize: '.82rem', fontWeight: 600, marginBottom: 6 }}>
                {label}
            </label>
            {children}
        </div>
    )
}
function Select({ value, onChange, options, valueMap }: {
    value: string; onChange: any; options: string[]; valueMap?: string[]
}) {
    return (
        <select value={value} onChange={onChange} style={{ ...inputStyle, width: '100%', cursor: 'pointer' }}>
            {options.map((o, i) => (
                <option key={o} value={valueMap ? valueMap[i] : o}>{o}</option>
            ))}
        </select>
    )
}
function HR() {
    return <hr style={{ border: 'none', borderTop: '1px solid rgba(139,92,246,.2)', margin: '18px 0' }} />
}
function SectionTitle({ children }: { children: React.ReactNode }) {
    return (
        <div style={{ color: '#c4b5fd', fontWeight: 700, fontSize: '.8rem', letterSpacing: '.06em', textTransform: 'uppercase' }}>
            {children}
        </div>
    )
}
const inputStyle: React.CSSProperties = {
    background: 'rgba(20,10,50,.7)', border: '1px solid rgba(139,92,246,.35)',
    color: '#e2e8f0', borderRadius: 10, padding: '9px 12px', fontSize: '.9rem', outline: 'none',
}
