export default function Footer() {
  return (
    <footer className="w-full mt-12 py-6 border-t border-border-subtle flex flex-col sm:flex-row items-center justify-between px-8 text-[11px] font-mono tracking-widest text-on-surface-variant uppercase gap-4">
      <div className="flex gap-4">
        <span>Aegis Agent v1.0</span>
        <span className="opacity-50">|</span>
        <span>Investment Committee Protocol</span>
      </div>
      <div className="flex items-center gap-4">
        <span>Powered by</span>
        <a href="https://bandframework.dev" target="_blank" rel="noopener noreferrer" className="hover:text-primary transition-colors flex items-center gap-1.5">
          <span className="w-1.5 h-1.5 rounded-full bg-primary" /> Band
        </a>
        <a href="https://featherless.ai" target="_blank" rel="noopener noreferrer" className="hover:text-primary transition-colors flex items-center gap-1.5">
          <span className="w-1.5 h-1.5 rounded-full bg-primary" /> Featherless AI
        </a>
        <a href="https://aimlapi.com" target="_blank" rel="noopener noreferrer" className="hover:text-primary transition-colors flex items-center gap-1.5">
          <span className="w-1.5 h-1.5 rounded-full bg-primary" /> AI/ML API
        </a>
      </div>
    </footer>
  )
}
