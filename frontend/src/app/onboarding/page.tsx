'use client'

import AegisSidebar from '@/components/ui/AegisSidebar'
import AegisTopBar from '@/components/ui/AegisTopBar'
import GlassPanel from '@/components/ui/GlassPanel'
import MonoLabel from '@/components/ui/MonoLabel'

const steps = [
  {
    title: 'Clone and enter the repository',
    command: 'git clone <repo-url>\ncd Aegis-Agent',
    note: 'Use the project root as the working directory for both frontend and backend setup.',
  },
  {
    title: 'Start the backend',
    command: 'cd backend\npython -m venv venv\n.\\venv\\Scripts\\Activate.ps1\npip install -r requirements.txt\nCopy-Item .env.example .env\nuvicorn main:app --reload',
    note: 'Keep BAND_MOCK_MODE=true for local UI testing without external Band credentials.',
  },
  {
    title: 'Start the frontend',
    command: 'cd frontend\nnpm install\nnpm run dev',
    note: 'The app expects NEXT_PUBLIC_API_BASE_URL=http://localhost:8000 in frontend/.env.local.',
  },
  {
    title: 'Verify the flow',
    command: 'Open http://localhost:3000\nCreate an analysis\nWatch War Room handoffs\nOpen the final verdict',
    note: 'If the backend is offline, room creation and file upload will fail.',
  },
]

export default function OnboardingPage() {
  return (
    <div className="flex h-screen bg-surface overflow-hidden">
      <AegisSidebar />
      <div className="flex-1 md:ml-[280px] flex flex-col relative h-full">
        <AegisTopBar title="Setup Checklist" subtitle="Local Developer Runbook" status="idle" />
        <main className="flex-1 overflow-y-auto mt-14 p-8 xl:p-12">
          <div className="max-w-[1100px] mx-auto flex flex-col gap-8">
            <header>
              <h1 className="font-headline text-headline-lg font-bold text-on-surface tracking-tight mb-2">
                Local Setup Checklist
              </h1>
              <p className="text-sm text-on-surface-variant max-w-2xl">
                A practical runbook for getting a newly cloned Aegis Agent workspace running on a teammate&apos;s machine.
              </p>
            </header>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
              {steps.map((step, index) => (
                <GlassPanel key={step.title} className="p-6 border-l-2 border-l-primary">
                  <div className="flex items-start gap-4 mb-4">
                    <div className="w-8 h-8 rounded-lg bg-primary/10 border border-primary/30 text-primary font-mono text-xs flex items-center justify-center shrink-0">
                      {String(index + 1).padStart(2, '0')}
                    </div>
                    <div>
                      <h2 className="font-headline text-xl font-bold text-on-surface">{step.title}</h2>
                      <p className="text-sm text-on-surface-variant mt-1">{step.note}</p>
                    </div>
                  </div>
                  <pre className="bg-surface border border-border-subtle rounded-md p-4 overflow-x-auto text-xs text-on-surface-variant font-mono whitespace-pre-wrap">
                    {step.command}
                  </pre>
                </GlassPanel>
              ))}
            </div>

            <GlassPanel className="p-6 border-l-2 border-l-amber-agent">
              <MonoLabel className="text-amber-agent mb-3">SECRETS NOTE</MonoLabel>
              <p className="text-sm text-on-surface-variant leading-relaxed">
                Do not commit real API keys. Add provider credentials only to a private local <span className="font-mono text-on-surface">backend/.env</span> when testing online model calls.
              </p>
            </GlassPanel>
          </div>
        </main>
      </div>
    </div>
  )
}
