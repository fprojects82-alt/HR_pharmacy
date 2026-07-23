'use client'

/* Dependency-free, theme-aware, responsive SVG charts. */

interface DonutSlice {
  label: string
  value: number
  color: string
}

export function DonutChart({ data, centerLabel, centerValue }: { data: DonutSlice[]; centerLabel?: string; centerValue?: string | number }) {
  const total = data.reduce((s, d) => s + d.value, 0) || 1
  const radius = 60
  const circumference = 2 * Math.PI * radius
  let offset = 0

  return (
    <div className="flex items-center gap-6 flex-wrap">
      <div className="relative w-[160px] h-[160px] flex-shrink-0">
        <svg viewBox="0 0 160 160" className="w-full h-full -rotate-90">
          <circle cx="80" cy="80" r={radius} fill="none" stroke="currentColor" strokeWidth="16" className="text-slate-100 dark:text-slate-700" />
          {data.map((d, i) => {
            const dash = (d.value / total) * circumference
            const el = (
              <circle
                key={i}
                cx="80"
                cy="80"
                r={radius}
                fill="none"
                stroke={d.color}
                strokeWidth="16"
                strokeLinecap="round"
                strokeDasharray={`${dash} ${circumference - dash}`}
                strokeDashoffset={-offset}
                style={{ transition: 'stroke-dashoffset 0.8s ease, stroke-dasharray 0.8s ease' }}
              />
            )
            offset += dash
            return el
          })}
        </svg>
        <div className="absolute inset-0 flex flex-col items-center justify-center">
          <span className="text-2xl font-bold text-slate-900 dark:text-white tabular-nums">{centerValue ?? total}</span>
          {centerLabel && <span className="text-xs text-slate-500 dark:text-slate-400">{centerLabel}</span>}
        </div>
      </div>
      <div className="flex flex-col gap-2">
        {data.map((d, i) => (
          <div key={i} className="flex items-center gap-2 text-sm">
            <span className="w-3 h-3 rounded-sm flex-shrink-0" style={{ background: d.color }} />
            <span className="text-slate-600 dark:text-slate-300">{d.label}</span>
            <span className="font-semibold text-slate-900 dark:text-white tabular-nums ms-auto ps-3">{d.value}</span>
          </div>
        ))}
      </div>
    </div>
  )
}

export function ProgressRing({ value, max = 100, color = '#10b981', label, sub }: { value: number; max?: number; color?: string; label?: string; sub?: string }) {
  const pct = Math.min(value / (max || 1), 1)
  const r = 52
  const circ = 2 * Math.PI * r
  return (
    <div className="flex flex-col items-center">
      <div className="relative w-[140px] h-[140px]">
        <svg viewBox="0 0 140 140" className="w-full h-full -rotate-90">
          <circle cx="70" cy="70" r={r} fill="none" stroke="currentColor" strokeWidth="12" className="text-slate-100 dark:text-slate-700" />
          <circle
            cx="70" cy="70" r={r} fill="none" stroke={color} strokeWidth="12" strokeLinecap="round"
            strokeDasharray={`${circ * pct} ${circ}`}
            style={{ transition: 'stroke-dasharray 0.9s ease' }}
          />
        </svg>
        <div className="absolute inset-0 flex flex-col items-center justify-center">
          <span className="text-2xl font-bold text-slate-900 dark:text-white tabular-nums">{Math.round(pct * 100)}%</span>
          {label && <span className="text-xs text-slate-500 dark:text-slate-400">{label}</span>}
        </div>
      </div>
      {sub && <p className="text-xs text-slate-500 dark:text-slate-400 mt-2">{sub}</p>}
    </div>
  )
}

export function BarChart({ data, color = '#10b981' }: { data: { label: string; value: number }[]; color?: string }) {
  const max = Math.max(...data.map((d) => d.value), 1)
  return (
    <div className="w-full">
      <div className="flex items-end justify-between gap-2 h-40">
        {data.map((d, i) => (
          <div key={i} className="flex-1 flex flex-col items-center gap-2 h-full justify-end">
            <span className="text-xs font-semibold text-slate-700 dark:text-slate-200 tabular-nums">{d.value}</span>
            <div
              className="w-full rounded-t-lg origin-bottom"
              style={{
                height: `${(d.value / max) * 100}%`,
                minHeight: d.value > 0 ? '4px' : '0',
                background: `linear-gradient(to top, ${color}, ${color}bb)`,
                animation: `growBar 0.7s ease ${i * 0.05}s both`,
              }}
            />
            <span className="text-[11px] text-slate-500 dark:text-slate-400 truncate max-w-full">{d.label}</span>
          </div>
        ))}
      </div>
    </div>
  )
}

export function AreaChart({ data, color = '#10b981' }: { data: { label: string; value: number }[]; color?: string }) {
  const w = 320
  const h = 140
  const pad = 8
  const max = Math.max(...data.map((d) => d.value), 1)
  const step = data.length > 1 ? (w - pad * 2) / (data.length - 1) : 0
  const pts = data.map((d, i) => {
    const x = pad + i * step
    const y = h - pad - (d.value / max) * (h - pad * 2)
    return [x, y]
  })
  const line = pts.map((p, i) => `${i === 0 ? 'M' : 'L'}${p[0].toFixed(1)},${p[1].toFixed(1)}`).join(' ')
  const area = `${line} L${pts[pts.length - 1][0].toFixed(1)},${h - pad} L${pts[0][0].toFixed(1)},${h - pad} Z`
  const gid = `grad-${color.replace('#', '')}`

  return (
    <div className="w-full">
      <svg viewBox={`0 0 ${w} ${h}`} className="w-full" preserveAspectRatio="none" style={{ height: 160 }}>
        <defs>
          <linearGradient id={gid} x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor={color} stopOpacity="0.35" />
            <stop offset="100%" stopColor={color} stopOpacity="0" />
          </linearGradient>
        </defs>
        {[0.25, 0.5, 0.75].map((f) => (
          <line key={f} x1={pad} x2={w - pad} y1={h * f} y2={h * f} stroke="currentColor" strokeWidth="1" className="text-slate-100 dark:text-slate-700" />
        ))}
        <path d={area} fill={`url(#${gid})`} />
        <path
          d={line}
          fill="none"
          stroke={color}
          strokeWidth="2.5"
          strokeLinecap="round"
          strokeLinejoin="round"
          style={{ strokeDasharray: 1000, animation: 'drawLine 1.2s ease both' }}
        />
        {pts.map((p, i) => (
          <circle key={i} cx={p[0]} cy={p[1]} r="3" fill={color} className="animate-fade" />
        ))}
      </svg>
      <div className="flex justify-between mt-1">
        {data.map((d, i) => (
          <span key={i} className="text-[11px] text-slate-500 dark:text-slate-400">{d.label}</span>
        ))}
      </div>
    </div>
  )
}
