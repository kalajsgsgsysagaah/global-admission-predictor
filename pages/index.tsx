import { useState } from 'react'
import Head from 'next/head'

const COUNTRIES: Record<string, string> = {
    Australia: '🇦🇺', Canada: '🇨🇦', France: '🇫🇷', Germany: '🇩🇪',
    Ireland: '🇮🇪', Netherlands: '🇳🇱', 'New Zealand': '🇳🇿', Singapore: '🇸🇬',
    Sweden: '🇸🇪', Switzerland: '🇨🇭', UAE: '🇦🇪', UK: '🇬🇧', USA: '🇺🇸',
}
const COUNTRY_ISO: Record<string, string> = {
    Australia: 'au', Canada: 'ca', France: 'fr', Germany: 'de',
    Ireland: 'ie', Netherlands: 'nl', 'New Zealand': 'nz', Singapore: 'sg',
    Sweden: 'se', Switzerland: 'ch', UAE: 'ae', UK: 'gb', USA: 'us',
}

const EXAMS = ['IELTS', 'TOEFL', 'PTE', 'DET', 'GRE']
const DEGREES = ['Undergraduate', 'Masters', 'PhD']
const EXAM_INFO: Record<string, string> = {
    IELTS: '0 – 9', TOEFL: '0 – 120', PTE: '10 – 90', DET: '10 – 160', GRE: '260 – 340',
}
const COLOR: Record<string, string> = {
    Strong: '#10b981', Average: '#f59e0b', Weak: '#ef4444',
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
                <title>Admission Chance Predictor</title>
                <meta name="description" content="Predict your Masters admission chances" />
                <link href="https://fonts.googleapis.com/css2?family=Plus+Jakarta+Sans:wght@400;500;600;700;800&display=swap" rel="stylesheet" />
            </Head>

            <main style={{
                minHeight: '100vh',
                background: 'radial-gradient(circle at 50% -20%, #2e1065, #0f172a 40%, #020617 100%)',
                fontFamily: "'Plus Jakarta Sans', sans-serif", padding: '40px 16px', color: '#e2e8f0',
                overflowX: 'hidden'
            }}>

                {/* Header */}
                <div style={{
                    maxWidth: 900, margin: '0 auto 32px', textAlign: 'center',
                    background: 'rgba(30, 41, 59, 0.4)',
                    border: '1px solid rgba(139, 92, 246, 0.2)',
                    borderRadius: 24, padding: '36px 20px',
                    boxShadow: '0 20px 40px -10px rgba(0,0,0,0.5), inset 0 1px 1px rgba(255,255,255,0.05)',
                    backdropFilter: 'blur(20px)'
                }}>
                    <h1 style={{
                        fontSize: '3.2rem', fontWeight: 800, margin: 0,
                        background: 'linear-gradient(135deg, #c4b5fd 0%, #a78bfa 40%, #8b5cf6 100%)',
                        WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent',
                        filter: 'drop-shadow(0px 4px 12px rgba(139, 92, 246, 0.3))',
                        letterSpacing: '-0.02em', lineHeight: 1.1
                    }}>
                        Admission Chance Predictor
                    </h1>
                    <p style={{ color: '#94a3b8', marginTop: 14, fontSize: '1.05rem', fontWeight: 500 }}>
                        Enter your academic profile below to estimate your probability of acceptance.
                    </p>
                </div>

                {/* Form */}
                <div style={{
                    maxWidth: 900, margin: '0 auto', display: 'grid',
                    gridTemplateColumns: 'repeat(auto-fit,minmax(380px,1fr))', gap: 24
                }}>
                    {/* Left — Academic */}
                    <Card title="🏫 Academic Profile" glowColor="rgba(139,92,246,0.15)">
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

                        <Field label="🔬 Research Experience">
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
                    <Card title="🌍 Destination & Exam" glowColor="rgba(56,189,248,0.15)">
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
                <div style={{ maxWidth: 900, margin: '32px auto 0', textAlign: 'center' }}>
                    <button onClick={predict} disabled={loading} style={{
                        background: 'linear-gradient(135deg, #7c3aed, #4f46e5)',
                        color: '#fff', border: '1px solid rgba(255,255,255,0.15)',
                        borderRadius: 16, padding: '16px 56px',
                        fontSize: '1.2rem', fontWeight: 800, cursor: loading ? 'wait' : 'pointer',
                        boxShadow: '0 10px 30px -5px rgba(124, 58, 237, 0.6), inset 0 2px 4px rgba(255,255,255,0.2)',
                        letterSpacing: '0.04em', textTransform: 'uppercase',
                        opacity: loading ? 0.8 : 1, transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
                        transform: loading ? 'scale(0.98)' : 'translateY(-2px)'
                    }}
                        onMouseOver={e => !loading && (e.currentTarget.style.transform = 'translateY(-4px) scale(1.02)')}
                        onMouseOut={e => !loading && (e.currentTarget.style.transform = 'translateY(-2px) scale(1)')}
                    >
                        {loading ? '⏳  Analyzing Data...' : '🔮  Predict Admission'}
                    </button>
                </div>

                {/* Error */}
                {error && (
                    <div style={{
                        maxWidth: 900, margin: '24px auto 0', textAlign: 'center',
                        background: 'rgba(220, 38, 38, 0.15)', border: '1px solid rgba(220, 38, 38, 0.4)',
                        borderRadius: 16, padding: '16px', color: '#fca5a5', fontWeight: 600,
                        boxShadow: '0 10px 25px -5px rgba(220,38,38,0.2)'
                    }}>
                        ⚠️ {error}
                    </div>
                )}

                {/* Result */}
                {result && (
                    <div style={{
                        maxWidth: 900, margin: '32px auto 0',
                        background: 'linear-gradient(135deg, rgba(30, 41, 59, 0.7), rgba(15, 23, 42, 0.9))',
                        border: '1px solid rgba(139, 92, 246, 0.3)', borderRadius: 24,
                        padding: '36px', boxShadow: '0 25px 50px -12px rgba(0,0,0,0.6), inset 0 1px 1px rgba(255,255,255,0.05)',
                        backdropFilter: 'blur(20px)',
                        animation: 'slideUp 0.6s cubic-bezier(0.16, 1, 0.3, 1) forwards'
                    }}>
                        <style>{`
              @keyframes slideUp {
                from { opacity: 0; transform: translateY(30px); }
                to { opacity: 1; transform: translateY(0); }
              }
            `}</style>

                        {/* Big number */}
                        <div style={{ textAlign: 'center', marginBottom: 24 }}>
                            <div style={{
                                fontSize: '4.5rem', fontWeight: 900, lineHeight: 1,
                                background: 'linear-gradient(135deg, #e2e8f0 0%, #cbd5e1 100%)',
                                WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent',
                                filter: `drop-shadow(0 0 25px ${result.bar_color}88)`,
                                letterSpacing: '-0.03em'
                            }}>
                                {result.prediction >= 70 ? '🎉' : result.prediction >= 45 ? '🎯' : '📉'} {result.prediction}%
                            </div>
                            <div style={{
                                color: result.bar_color, fontWeight: 800, fontSize: '1.4rem',
                                marginTop: 12, textTransform: 'uppercase', letterSpacing: '0.05em',
                                textShadow: `0 0 15px ${result.bar_color}66`
                            }}>
                                {result.verdict}
                            </div>
                        </div>

                        {/* Progress bar */}
                        <div style={{
                            background: 'rgba(0,0,0,0.4)', borderRadius: 999, height: 16,
                            overflow: 'hidden', marginBottom: 8,
                            boxShadow: 'inset 0 2px 10px rgba(0,0,0,0.5)', border: '1px solid rgba(255,255,255,0.05)'
                        }}>
                            <div style={{
                                width: `${result.prediction}%`, height: '100%',
                                background: `linear-gradient(90deg, ${result.bar_color}, ${result.bar_color}dd)`,
                                boxShadow: `0 0 20px ${result.bar_color}aa, inset 0 2px 5px rgba(255,255,255,0.4)`,
                                borderRadius: 999, transition: 'width 1s cubic-bezier(0.16, 1, 0.3, 1)'
                            }} />
                        </div>
                        <div style={{ display: 'flex', justifyContent: 'space-between', color: '#64748b', fontSize: '.8rem', marginBottom: 24, fontWeight: 600 }}>
                            <span>0%</span><span>45% Moderate</span><span>70% Strong</span>
                        </div>

                        <HR />
                        <SectionTitle icon="📋">Your Profile</SectionTitle>
                        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px 24px', fontSize: '.95rem', color: '#cbd5e1', marginTop: 16 }}>
                            {[
                                ['Degree', form.degree],
                                ['Country', <span key="c" style={{ display: 'inline-flex', alignItems: 'center', gap: 6 }}><img src={`https://flagcdn.com/w20/${COUNTRY_ISO[form.country]}.png`} alt={form.country} style={{ width: 18, borderRadius: 2, boxShadow: '0 2px 4px rgba(0,0,0,0.3)' }} /> {form.country}</span>],
                                ['Exam', `${form.exam_type} — ${form.exam_score}`], ['CGPA', form.cgpa],
                                ['SOP', `${form.sop}/5`], ['LOR', `${form.lor}/5`],
                                ['Research', form.research === '1' ? 'Yes ✅' : 'No ❌'],
                                ['Work Exp', `${form.work_exp} yr(s)`],
                                ['Internship', form.internship === 'true' ? 'Yes ✅' : 'No ❌'],
                            ].map(([k, v]) => (<span key={k as string} style={{ padding: '6px 12px', background: 'rgba(0,0,0,0.2)', borderRadius: 8, border: '1px solid rgba(255,255,255,0.03)' }}><b style={{ color: '#c4b5fd' }}>{k}</b> — {v}</span>))}
                        </div>

                        <HR />
                        <SectionTitle icon="📈">Profile Strength</SectionTitle>
                        <div style={{ marginTop: 16, display: 'grid', gap: 14 }}>
                            {Object.entries(result.scorecard).map(([key, val]: any) => (
                                <div key={key} style={{ padding: '12px 16px', background: 'rgba(0,0,0,0.2)', borderRadius: 12, border: '1px solid rgba(255,255,255,0.03)' }}>
                                    <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '.9rem', color: '#cbd5e1', marginBottom: 8 }}>
                                        <span style={{ fontWeight: 600 }}>{key}</span>
                                        <span style={{ color: COLOR[val.rating], fontWeight: 800 }}>
                                            {(key === 'Research' || key === 'Internship')
                                                ? (val.value ? 'Yes' : 'No')
                                                : key === 'Work Exp' ? `${val.value} yrs` : `${val.value}${key === 'CGPA' ? '' : '/5'}`
                                            } — {val.rating}
                                        </span>
                                    </div>
                                    <div style={{ background: 'rgba(0,0,0,0.5)', borderRadius: 999, height: 8, border: '1px solid rgba(255,255,255,0.05)', overflow: 'hidden' }}>
                                        <div style={{
                                            width: `${Math.min(100, (val.value / (key === 'CGPA' ? 9 : key === 'Work Exp' ? 4 : (key === 'Research' || key === 'Internship') ? 1 : 4.5)) * 100)}%`,
                                            height: '100%', background: COLOR[val.rating], borderRadius: 999,
                                            boxShadow: `0 0 10px ${COLOR[val.rating]}88`
                                        }} />
                                    </div>
                                </div>
                            ))}
                        </div>

                        {result.tips.length > 0 && (
                            <>
                                <HR />
                                <SectionTitle icon="💡">Improvement Tips</SectionTitle>
                                <ul style={{ paddingLeft: 20, color: '#cbd5e1', fontSize: '.95rem', lineHeight: 1.8, marginTop: 12 }}>
                                    {result.tips.map((t: string, i: number) => <li key={i} style={{ marginBottom: 6 }}>{t}</li>)}
                                </ul>
                            </>
                        )}

                        {result.fit_warning && (
                            <>
                                <HR />
                                <div style={{
                                    background: 'linear-gradient(90deg, rgba(234, 179, 8, 0.1), rgba(202, 138, 4, 0.05))',
                                    borderLeft: '4px solid #eab308',
                                    borderRadius: '0 12px 12px 0', padding: '16px 20px', color: '#fef08a', fontSize: '.95rem',
                                    fontWeight: 500, boxShadow: '0 4px 12px rgba(0,0,0,0.2)'
                                }}>
                                    ⚠️ {result.fit_warning}
                                </div>
                            </>
                        )}
                    </div>
                )}

                {/* Footer Clickable Country Chips with FlagCDN */}
                <div style={{ maxWidth: 900, margin: '48px auto 0', textAlign: 'center' }}>
                    <div style={{ color: '#64748b', fontSize: '.8rem', letterSpacing: '.1em', textTransform: 'uppercase', marginBottom: 16, fontWeight: 700 }}>
                        🌍 Click a Country to View Top Universities
                    </div>
                    <div style={{ display: 'flex', flexWrap: 'wrap', justifyContent: 'center', gap: 12 }}>
                        {Object.keys(COUNTRIES).map((name) => (
                            <a key={name} href={`https://www.google.com/search?q=Top+masters+universities+in+${name}`} target="_blank" rel="noopener noreferrer" style={{
                                display: 'flex', alignItems: 'center', gap: 10, padding: '10px 20px',
                                borderRadius: 14, background: 'rgba(30, 41, 59, 0.6)',
                                border: '1px solid rgba(139, 92, 246, 0.2)', color: '#c4b5fd', fontSize: '.95rem', fontWeight: 600,
                                textDecoration: 'none', boxShadow: '0 4px 12px rgba(0,0,0,0.2)',
                                backdropFilter: 'blur(10px)', transition: 'all 0.2s cubic-bezier(0.4, 0, 0.2, 1)'
                            }}
                                onMouseOver={e => { e.currentTarget.style.transform = 'translateY(-4px)'; e.currentTarget.style.borderColor = 'rgba(139,92,246,0.6)'; e.currentTarget.style.boxShadow = '0 12px 24px rgba(139,92,246,0.3)'; }}
                                onMouseOut={e => { e.currentTarget.style.transform = 'translateY(0)'; e.currentTarget.style.borderColor = 'rgba(139,92,246,0.2)'; e.currentTarget.style.boxShadow = '0 4px 12px rgba(0,0,0,0.2)'; }}
                            >
                                <img src={`https://flagcdn.com/w20/${COUNTRY_ISO[name]}.png`} alt={name} style={{ width: 22, height: 'auto', borderRadius: 3, boxShadow: '0 2px 4px rgba(0,0,0,0.4)' }} />
                                {name}
                            </a>
                        ))}
                    </div>
                </div>

                {/* Tech stack */}
                <div style={{ maxWidth: 900, margin: '40px auto 40px', textAlign: 'center' }}>
                    <div style={{ color: '#475569', fontSize: '.75rem', letterSpacing: '.1em', textTransform: 'uppercase', marginBottom: 16, fontWeight: 700 }}>
                        🛠️ Built With
                    </div>
                    <div style={{ display: 'flex', flexWrap: 'wrap', justifyContent: 'center', gap: 10 }}>
                        {([
                            ['🐍 Python', '#3b82f6'], ['🌲 scikit-learn', '#22c55e'], ['🐼 pandas', '#f59e0b'],
                            ['⚛️ Next.js', '#94a3b8'], ['📘 TypeScript', '#60a5fa'], ['▲ Vercel', '#a78bfa'],
                            ['🤗 Gradio', '#f472b6'], ['⚡ FastAPI', '#34d399'],
                        ] as [string, string][]).map(([name, color]) => (
                            <span key={name} style={{
                                display: 'inline-block', padding: '6px 16px',
                                borderRadius: 999, background: 'rgba(15, 23, 42, 0.6)',
                                border: `1px solid ${color}55`, color, fontSize: '.85rem', fontWeight: 600,
                                boxShadow: `0 2px 10px ${color}22`
                            }}>{name}</span>
                        ))}
                    </div>
                </div>
            </main>
        </>
    )
}

// ── Shared UI Components ─────────────────────────────────────
function Card({ title, children, glowColor }: { title: string; children: React.ReactNode; glowColor: string }) {
    return (
        <div style={{
            background: 'rgba(30, 41, 59, 0.4)', border: '1px solid rgba(255,255,255,0.05)',
            borderRadius: 20, padding: '28px',
            boxShadow: `0 15px 35px -10px rgba(0,0,0,0.5), inset 0 1px 1px rgba(255,255,255,0.05), inset 0 0 40px ${glowColor}`,
            backdropFilter: 'blur(20px)'
        }}>
            <h3 style={{ color: '#f8fafc', margin: '0 0 20px', fontSize: '1.15rem', fontWeight: 800, textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                {title}
            </h3>
            {children}
        </div>
    )
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
    return (
        <div style={{ marginBottom: 20 }}>
            <label style={{ display: 'block', color: '#cbd5e1', fontSize: '.85rem', fontWeight: 700, marginBottom: 8, letterSpacing: '0.02em' }}>
                {label}
            </label>
            {children}
        </div>
    )
}

function SliderField({ label, unit, min, max, step, value, onChange }: {
    label: string; unit: string; min: number; max: number; step: number;
    value: string; onChange: (v: string) => void
}) {
    return (
        <Field label={`${label}${unit ? '  (' + min + ' – ' + max + unit + ')' : ''}`}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 14 }}>
                <input type="range" min={min} max={max} step={step} value={value}
                    onChange={e => onChange(e.target.value)}
                    style={{
                        flex: 1, accentColor: '#8b5cf6', cursor: 'pointer',
                        filter: 'drop-shadow(0 2px 4px rgba(0,0,0,0.5))'
                    }} />
                <input type="number" min={min} max={max} step={step} value={value}
                    onChange={e => onChange(e.target.value)}
                    style={{
                        ...inputStyle, width: 76, textAlign: 'center',
                        padding: '8px 10px', flexShrink: 0
                    }} />
            </div>
        </Field>
    )
}

function RadioGroup({ options, value, onChange }: {
    options: [string, string][]; value: string; onChange: (v: string) => void
}) {
    return (
        <div style={{ display: 'flex', gap: 12, marginTop: 4 }}>
            {options.map(([v, l]) => (
                <label key={v} style={{
                    display: 'flex', alignItems: 'center', gap: 8, cursor: 'pointer',
                    color: value === v ? '#e2e8f0' : '#64748b', fontWeight: value === v ? 700 : 500,
                    background: value === v ? 'rgba(139,92,246,0.2)' : 'rgba(0,0,0,0.2)',
                    border: `1px solid ${value === v ? 'rgba(139,92,246,0.5)' : 'rgba(255,255,255,0.05)'}`,
                    padding: '8px 16px', borderRadius: 10, transition: 'all 0.2s'
                }}>
                    <input type="radio" value={v} checked={value === v} onChange={() => onChange(v)} style={{ accentColor: '#8b5cf6' }} /> {l}
                </label>
            ))}
        </div>
    )
}

function Select({ value, onChange, options, valueMap }: {
    value: string; onChange: any; options: string[]; valueMap?: string[]
}) {
    return (
        <div style={{ position: 'relative' }}>
            <select value={value} onChange={onChange} style={{
                ...inputStyle, width: '100%', cursor: 'pointer', appearance: 'none', paddingRight: 40
            }}>
                {options.map((o, i) => (
                    <option key={o} value={valueMap ? valueMap[i] : o} style={{ background: '#0f172a', color: '#f8fafc' }}>
                        {o}
                    </option>
                ))}
            </select>
            <div style={{ position: 'absolute', right: 14, top: '50%', transform: 'translateY(-50%)', pointerEvents: 'none', fontSize: '0.8rem' }}>
                ▼
            </div>
        </div>
    )
}

function HR() {
    return <hr style={{ border: 'none', borderTop: '1px solid rgba(255,255,255,0.1)', margin: '24px 0', boxShadow: '0 1px 0 rgba(0,0,0,0.5)' }} />
}

function SectionTitle({ children, icon }: { children: React.ReactNode; icon: string }) {
    return (
        <div style={{ display: 'flex', alignItems: 'center', gap: 8, color: '#f8fafc', fontWeight: 800, fontSize: '0.95rem', letterSpacing: '0.08em', textTransform: 'uppercase' }}>
            <span style={{ fontSize: '1.2rem', filter: 'drop-shadow(0 2px 4px rgba(0,0,0,0.5))' }}>{icon}</span>
            {children}
        </div>
    )
}

const inputStyle: React.CSSProperties = {
    background: 'rgba(0,0,0,0.3)', border: '1px solid rgba(255,255,255,0.1)',
    color: '#f8fafc', borderRadius: 12, padding: '12px 14px', fontSize: '.95rem', outline: 'none',
    boxShadow: 'inset 0 2px 4px rgba(0,0,0,0.3)', fontWeight: 600, transition: 'border-color 0.2s',
}
