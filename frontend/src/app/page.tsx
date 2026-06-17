import Link from 'next/link'
import { Metadata } from 'next'

export const metadata: Metadata = {
  title: 'Aegis Agent — AI-Powered Investment Intelligence',
  description: 'Multi-agent autonomous investment analysis platform. Forensic due diligence powered by AI.',
}

const FEATURES = [
  {
    icon: (
      <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
        <circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/>
      </svg>
    ),
    label: 'Forensic Auditor',
    color: 'text-cyan-agent',
    border: 'border-cyan-agent/30',
    glow: 'rgba(6,182,212,0.15)',
    desc: 'Cross-references SEC filings, market data, and regulatory dockets to surface hidden risks with evidence-backed confidence scores.',
  },
  {
    icon: (
      <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
        <polyline points="22 12 18 12 15 21 9 3 6 12 2 12"/>
      </svg>
    ),
    label: 'Market Analyst',
    color: 'text-indigo-init',
    border: 'border-indigo-init/30',
    glow: 'rgba(99,102,241,0.15)',
    desc: 'Runs deep quantitative correlation matrices against industry benchmarks, identifying macro divergences and growth trajectory anomalies.',
  },
  {
    icon: (
      <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
        <path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z"/>
        <line x1="12" y1="9" x2="12" y2="13"/><line x1="12" y1="17" x2="12.01" y2="17"/>
      </svg>
    ),
    label: 'Risk Auditor',
    color: 'text-rose-agent',
    border: 'border-rose-agent/30',
    glow: 'rgba(244,63,94,0.15)',
    desc: 'Performs adversarial red-teaming on all analyst findings. Pressure-tests every assumption with synthetic stress scenarios and regulatory exposure checks.',
  },
  {
    icon: (
      <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
        <path d="M9 12l2 2 4-4"/>
        <path d="M21 12c0 4.97-4.03 9-9 9s-9-4.03-9-9 4.03-9 9-9 9 4.03 9 9z"/>
      </svg>
    ),
    label: 'Executive Finalizer',
    color: 'text-emerald-agent',
    border: 'border-emerald-agent/30',
    glow: 'rgba(16,185,129,0.15)',
    desc: 'Synthesizes all findings into a board-ready executive dossier with a decisive verdict: Approve, Caution, or Reject — with no hedging.',
  },
]

const STATS = [
  { value: '4', label: 'Specialized AI Agents' },
  { value: '<90s', label: 'Average Analysis Time' },
  { value: '2', label: 'Inference Providers' },
  { value: '∞', label: 'Refinement Cycles' },
]

const HOW_IT_WORKS = [
  { step: '01', title: 'Configure Target', desc: 'Enter the company name, deal context, and acceptable risk threshold.' },
  { step: '02', title: 'Agents Deploy', desc: 'The committee of 4 AI agents activates in parallel, each with a distinct role.' },
  { step: '03', title: 'Live War Room', desc: 'Watch every agent\'s real-time reasoning stream in a cinematic live terminal.' },
  { step: '04', title: 'Executive Dossier', desc: 'Receive a structured final verdict with risk scoring and actionable conditions.' },
]

export default function LandingPage() {
  return (
    <div className="min-h-screen bg-surface text-on-surface" style={{ fontFamily: 'var(--font-body)' }}>

      {/* ─── HEADER ─── */}
      <header className="fixed top-0 left-0 right-0 z-50 border-b border-border-subtle"
        style={{ background: 'rgba(19,19,19,0.8)', backdropFilter: 'blur(20px)' }}>
        <div className="max-w-7xl mx-auto px-6 h-16 flex items-center justify-between">
          <Link href="/" className="flex items-center gap-3 group">
            <div className="w-8 h-8 rounded-lg border border-primary/30 bg-primary/10 flex items-center justify-center">
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="var(--accent-luminous)" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M12 2L2 7l10 5 10-5-10-5z"/>
                <path d="M2 17l10 5 10-5"/>
                <path d="M2 12l10 5 10-5"/>
              </svg>
            </div>
            <span className="font-headline font-bold text-primary tracking-tight text-base" style={{ fontFamily: 'var(--font-display)' }}>AEGIS</span>
            <span className="font-mono text-[10px] text-on-surface-variant tracking-widest hidden sm:block">INVESTMENT COMMITTEE</span>
          </Link>

          <nav className="hidden md:flex items-center gap-8">
            <a href="#how-it-works" className="font-mono text-xs text-on-surface-variant hover:text-on-surface transition-colors tracking-widest uppercase">How It Works</a>
            <a href="#agents" className="font-mono text-xs text-on-surface-variant hover:text-on-surface transition-colors tracking-widest uppercase">Agents</a>
            <Link href="/support" className="font-mono text-xs text-on-surface-variant hover:text-on-surface transition-colors tracking-widest uppercase">Docs</Link>
          </nav>

          <Link href="/dashboard"
            className="px-5 py-2 rounded-md bg-primary text-on-primary font-mono text-xs font-bold tracking-widest uppercase hover:bg-accent-luminous transition-colors">
            LAUNCH APP →
          </Link>
        </div>
      </header>

      {/* ─── HERO ─── */}
      <section className="relative min-h-screen flex items-center justify-center overflow-hidden pt-16">
        {/* Background grid lines */}
        <div className="absolute inset-0 opacity-[0.04]"
          style={{ backgroundImage: 'linear-gradient(var(--on-surface) 1px, transparent 1px), linear-gradient(90deg, var(--on-surface) 1px, transparent 1px)', backgroundSize: '80px 80px' }} />

        {/* Ambient glows */}
        <div className="absolute top-1/4 left-1/4 w-[600px] h-[600px] rounded-full pointer-events-none" style={{ background: 'radial-gradient(circle, rgba(6,182,212,0.06) 0%, transparent 70%)' }} />
        <div className="absolute bottom-1/4 right-1/4 w-[600px] h-[600px] rounded-full pointer-events-none" style={{ background: 'radial-gradient(circle, rgba(99,102,241,0.06) 0%, transparent 70%)' }} />

        <div className="relative z-10 max-w-5xl mx-auto px-6 text-center">
          <h1 className="text-5xl md:text-7xl font-bold tracking-tight leading-none mb-6 text-on-surface" style={{ fontFamily: 'var(--font-display)' }}>
            The Autonomous<br />
            <span style={{ color: 'var(--accent-luminous)' }}>Investment Committee</span>
          </h1>

          <p className="text-lg md:text-xl text-on-surface-variant max-w-2xl mx-auto leading-relaxed mb-10">
            Deploy 4 specialized AI agents — Planner, Analyst, Risk Reviewer, and Finalizer — that collaborate in real time to produce a signed executive dossier on any investment target.
          </p>

          <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
            <Link href="/dashboard"
              className="w-full sm:w-auto px-10 py-4 rounded-md font-mono font-bold text-sm uppercase tracking-widest text-on-primary inline-flex items-center justify-center gap-2 transition-all"
              style={{ background: 'var(--primary)', boxShadow: '0 0 40px rgba(240,242,203,0.15)' }}>
              Launch Application
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><line x1="5" y1="12" x2="19" y2="12"/><polyline points="12 5 19 12 12 19"/></svg>
            </Link>
            <Link href="/support"
              className="w-full sm:w-auto px-10 py-4 rounded-md font-mono font-bold text-sm uppercase tracking-widest text-on-surface-variant border border-border-subtle inline-flex items-center justify-center gap-2 hover:bg-surface-container-low transition-colors">
              Read the Docs
            </Link>
          </div>

          {/* Live terminal preview chip */}
          <div className="mt-16 max-w-2xl mx-auto rounded-xl border border-border-subtle overflow-hidden text-left"
            style={{ background: 'rgba(14,14,14,0.9)', backdropFilter: 'blur(20px)' }}>
            <div className="flex items-center gap-2 px-4 py-3 border-b border-border-subtle">
              <div className="w-3 h-3 rounded-full bg-rose-agent/60" />
              <div className="w-3 h-3 rounded-full bg-amber-agent/60" />
              <div className="w-3 h-3 rounded-full bg-emerald-agent/60" />
              <span className="font-mono text-[10px] text-on-surface-variant ml-2 tracking-widest">AEGIS TERMINAL — LIVE STREAM</span>
            </div>
            <div className="p-5 space-y-2 font-mono text-xs">
              <p className="text-cyan-agent">[PLANNER] <span className="text-on-surface-variant">Decomposing OpenAI investment thesis into 4 subtasks...</span></p>
              <p className="text-on-surface-variant/50">{'>'} Establishing regulatory risk vector... <span className="text-emerald-agent">DONE</span></p>
              <p className="text-indigo-init">[ANALYST] <span className="text-on-surface-variant">Fetching SEC filings and market data correlation matrix...</span></p>
              <p className="text-on-surface-variant/50">{'>'} Revenue divergence detected vs. peer median — <span className="text-rose-agent">FLAGGED</span></p>
              <p className="text-rose-agent">[REVIEWER] <span className="text-on-surface-variant">Initiating adversarial review protocol...</span></p>
              <p className="text-on-surface-variant/50">{'>'} Injecting synthetic market shock scenario... <span className="text-amber-agent">CAUTION</span></p>
              <p className="text-emerald-agent">[FINALIZER] <span className="text-on-surface-variant">Compiling executive dossier...</span></p>
              <p className="text-on-surface-variant/50 flex items-center gap-2">{'>'} Verdict: <span className="text-emerald-agent font-bold">APPROVE WITH CONDITIONS</span> <span className="inline-block w-2 h-4 bg-accent-luminous/80 animate-pulse" /></p>
            </div>
          </div>
        </div>
      </section>

      {/* ─── STATS ─── */}
      <section className="border-y border-border-subtle">
        <div className="max-w-5xl mx-auto px-6 py-12 grid grid-cols-2 md:grid-cols-4 gap-8">
          {STATS.map((s) => (
            <div key={s.label} className="text-center">
              <p className="text-4xl md:text-5xl font-bold tracking-tight mb-2" style={{ fontFamily: 'var(--font-display)', color: 'var(--accent-luminous)' }}>{s.value}</p>
              <p className="font-mono text-xs text-on-surface-variant tracking-widest uppercase">{s.label}</p>
            </div>
          ))}
        </div>
      </section>

      {/* ─── HOW IT WORKS ─── */}
      <section id="how-it-works" className="py-24 px-6">
        <div className="max-w-5xl mx-auto">
          <div className="text-center mb-16">
            <p className="font-mono text-xs text-on-surface-variant tracking-widest uppercase mb-4">The Protocol</p>
            <h2 className="text-4xl md:text-5xl font-bold tracking-tight" style={{ fontFamily: 'var(--font-display)' }}>
              From Input to Verdict<br />in 4 Steps
            </h2>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {HOW_IT_WORKS.map((item) => (
              <div key={item.step} className="rounded-xl border border-border-subtle p-8 relative overflow-hidden group hover:border-border-subtle/80 transition-colors"
                style={{ background: 'rgba(255,255,255,0.02)' }}>
                <div className="absolute top-4 right-4 font-mono text-5xl font-bold text-on-surface-variant/5 select-none">{item.step}</div>
                <p className="font-mono text-xs text-on-surface-variant tracking-widest mb-3" style={{ color: 'var(--accent-luminous)' }}>{item.step}</p>
                <h3 className="text-xl font-bold text-on-surface mb-3" style={{ fontFamily: 'var(--font-display)' }}>{item.title}</h3>
                <p className="text-sm text-on-surface-variant leading-relaxed">{item.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ─── AGENTS ─── */}
      <section id="agents" className="py-24 px-6 border-t border-border-subtle" style={{ background: 'rgba(255,255,255,0.01)' }}>
        <div className="max-w-5xl mx-auto">
          <div className="text-center mb-16">
            <p className="font-mono text-xs text-on-surface-variant tracking-widest uppercase mb-4">The Intelligence Nodes</p>
            <h2 className="text-4xl md:text-5xl font-bold tracking-tight" style={{ fontFamily: 'var(--font-display)' }}>
              Meet the Committee
            </h2>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {FEATURES.map((f) => (
              <div key={f.label} className={`rounded-xl border ${f.border} p-8 group transition-all duration-300`}
                style={{ background: 'rgba(255,255,255,0.02)' }}>
                <div className={`mb-5 ${f.color}`}>{f.icon}</div>
                <h3 className={`font-mono text-sm tracking-widest font-bold uppercase mb-3 ${f.color}`}>{f.label}</h3>
                <p className="text-sm text-on-surface-variant leading-relaxed">{f.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ─── CTA ─── */}
      <section className="py-32 px-6 text-center relative overflow-hidden">
        <div className="absolute inset-0 pointer-events-none" style={{ background: 'radial-gradient(ellipse at center, rgba(240,242,203,0.04) 0%, transparent 70%)' }} />
        <div className="relative z-10 max-w-2xl mx-auto">
          <h2 className="text-4xl md:text-5xl font-bold tracking-tight mb-6" style={{ fontFamily: 'var(--font-display)' }}>
            Ready to Analyze?
          </h2>
          <p className="text-on-surface-variant mb-10 text-lg leading-relaxed">
            Deploy your investment committee now. No setup required.
          </p>
          <Link href="/dashboard"
            className="inline-flex items-center gap-3 px-12 py-5 rounded-md font-mono font-bold text-sm uppercase tracking-widest text-on-primary transition-all"
            style={{ background: 'var(--primary)', boxShadow: '0 0 60px rgba(240,242,203,0.2)' }}>
            Launch Aegis Agent
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><line x1="5" y1="12" x2="19" y2="12"/><polyline points="12 5 19 12 12 19"/></svg>
          </Link>
        </div>
      </section>

      {/* ─── FOOTER ─── */}
      <footer className="border-t border-border-subtle py-10 px-6">
        <div className="max-w-7xl mx-auto flex flex-col md:flex-row items-center justify-between gap-6">
          <div className="flex items-center gap-3">
            <div className="w-7 h-7 rounded-lg border border-primary/30 bg-primary/10 flex items-center justify-center">
              <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="var(--accent-luminous)" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M12 2L2 7l10 5 10-5-10-5z"/>
                <path d="M2 17l10 5 10-5"/>
                <path d="M2 12l10 5 10-5"/>
              </svg>
            </div>
            <span className="font-mono text-xs text-on-surface-variant tracking-widest">AEGIS AGENT v1.0 · INVESTMENT COMMITTEE PROTOCOL</span>
          </div>
          <div className="flex items-center gap-6 font-mono text-[11px] text-on-surface-variant tracking-widest uppercase">
            <span>Powered by</span>
            <a href="https://featherless.ai" target="_blank" rel="noopener noreferrer" className="hover:text-primary transition-colors">Featherless AI</a>
            <a href="https://aimlapi.com" target="_blank" rel="noopener noreferrer" className="hover:text-primary transition-colors">AI/ML API</a>
            <Link href="/support" className="hover:text-primary transition-colors">Docs</Link>
          </div>
        </div>
      </footer>
    </div>
  )
}
