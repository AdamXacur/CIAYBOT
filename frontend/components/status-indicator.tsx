"use client"

export function StatusIndicator() {
  return (
    <div className="flex items-center gap-2 px-3 py-1.5 rounded-full bg-slate-800/80 border border-green-500/30">
      <div className="relative flex h-2 w-2">
        <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-green-400 opacity-75"></span>
        <span className="relative inline-flex rounded-full h-2 w-2 bg-green-500"></span>
      </div>
      <span className="text-[10px] font-bold text-green-400 tracking-wider">ONLINE</span>
    </div>
  )
}