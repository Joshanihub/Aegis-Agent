import TaskInputForm from '@/components/config/TaskInputForm'
import DashedGrid from '@/components/ui/DashedGrid'
import TypewriterEffect from '@/components/ui/TypewriterEffect'
import AegisSidebar from '@/components/ui/AegisSidebar'
import AegisTopBar from '@/components/ui/AegisTopBar'
import Footer from '@/components/ui/Footer'

export default function ConfigPage() {
  return (
    <div className="flex h-screen bg-surface overflow-hidden">
      {/* Fixed Sidebar */}
      <AegisSidebar />

      {/* Main Content Area */}
      <div className="flex-1 md:ml-[280px] flex flex-col relative h-full">
        <AegisTopBar title="New Analysis" subtitle="Initialize Protocol" status="idle" />

        {/* Scrollable Content */}
        <main className="flex-1 overflow-y-auto mt-14 flex flex-col">
          <div className="flex flex-1">
            {/* Left: Input Form (Fixed Width) */}
            <div className="w-full xl:w-[480px] shrink-0 flex flex-col p-8 lg:p-12 z-10 bg-surface border-r border-border-subtle/50">
              <header className="mb-10">
                <h1 className="font-headline text-headline-lg font-bold text-on-surface tracking-tight leading-none mb-2">
                  Deploy Agents
                </h1>
                <p className="font-body text-sm text-on-surface-variant">
                  Configure parameters to initialize the autonomous investment committee.
                </p>
              </header>

              <div className="flex-1">
                <TaskInputForm />
              </div>
            </div>

            {/* Right: Cinematic Terminal Hero (Fluid Width) */}
            <div className="hidden xl:flex flex-1 relative items-center justify-center bg-surface-container-lowest overflow-hidden">
              <DashedGrid />
              <div className="absolute inset-0 bg-gradient-to-t from-surface via-transparent to-transparent opacity-50" />
              
              <div className="relative z-10 w-full max-w-2xl p-10 glass-panel animate-enter">
                <div className="flex items-center gap-3 mb-8 border-b border-border-subtle/50 pb-6">
                  <div className="w-12 h-12 rounded-xl border border-border-subtle/50 flex items-center justify-center bg-surface-glass backdrop-blur-md ambient-glow">
                    <div className="w-3 h-3 rounded-full bg-accent-luminous animate-pulse" />
                  </div>
                  <div>
                    <h2 className="font-mono text-base tracking-[0.1em] text-accent-luminous">AEGIS TERMINAL</h2>
                    <p className="font-mono text-[11px] text-on-surface-variant/50 tracking-[0.05em] uppercase">Secure Connection Established</p>
                  </div>
                </div>

                <div className="font-mono text-sm text-on-surface-variant leading-relaxed space-y-6">
                  <p className="flex gap-3">
                    <span className="text-primary opacity-50">{'>'}</span> 
                    <TypewriterEffect text="Initializing Multi-Agent Audit Protocol..." speed={10} />
                  </p>
                  <p className="flex gap-3 delay-1000">
                    <span className="text-primary opacity-50">{'>'}</span> 
                    <TypewriterEffect text="Awaiting target parameters for deployment." speed={15} />
                  </p>

                  <div className="mt-10 border border-border-subtle bg-surface-glass backdrop-blur-sm p-6 rounded-xl relative overflow-hidden group">
                    <div className="absolute top-0 left-0 w-1 h-full bg-border-subtle group-hover:bg-accent-luminous transition-colors duration-500" />
                    <p className="text-xs text-text-muted mb-4 font-semibold tracking-wide">DEPLOYMENT INSTRUCTIONS:</p>
                    <ul className="text-sm space-y-4 text-on-surface-variant/80">
                      <li className="flex items-start gap-3">
                        <span className="text-cyan-agent mt-0.5">01.</span> 
                        <span>Enter the target company <span className="text-on-surface">(e.g., Stripe)</span></span>
                      </li>
                      <li className="flex items-start gap-3">
                        <span className="text-indigo-init mt-0.5">02.</span> 
                        <span>Define the deal context and specific areas of focus</span>
                      </li>
                      <li className="flex items-start gap-3">
                        <span className="text-rose-agent mt-0.5">03.</span> 
                        <span>Set acceptable risk tolerance threshold</span>
                      </li>
                      <li className="flex items-start gap-3">
                        <span className="text-emerald-agent mt-0.5">04.</span> 
                        <span>Click INITIALIZE to dispatch the analyst committee</span>
                      </li>
                    </ul>
                  </div>
                </div>
              </div>
            </div>
          </div>
          <Footer />
        </main>
      </div>
    </div>
  )
}
