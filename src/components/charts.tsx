'use client'

import { useState } from 'react'

/* Dependency-free, theme-aware, responsive, INTERACTIVE SVG charts. */

interface DonutSlice { label: string; value: number; color: string }

export function DonutChart({ data, centerLabel, centerValue }: { data: DonutSlice[]; centerLabel?: string; centerValue?: string | number }) {
  const total = data.reduce((s, d) => s + d.value, 0) || 1
  const radius = 60
  const circumference = 2 * Math.PI * radius
  const [hover, setHover] = useState<number | null>(null)
  let offset = 0

  const shown = hover !== null ? data[hover] : null

  return (
    <div className="flex items-center gap-6 flex-wrap">
      <div className="relative w-[160px] h-[160px] flex-shrink-0">
        <svg viewBox="0 0 160 160" className="w-full h-full -rotate-90">
          <circle cx="80" cy="80" r={radius} fill="none" stroke="currentColor" strokeWidth="16" className="text-slate-100 dark:text-slate-700" />
          {data.map((d, i) => {
            const dash = (d.value / total) * circumference
            const el = (
              <circle
                key={i} cx="80" cy="80" r={radius} fill="none" stroke={d.color}
                strokeWidth={hover === i ? 20 : 16} strokeLinecap="round"
                strokeDasharray={`${dash} ${circumference - dash}`} strokeDashoffset={-offset}
                onMouseEnter={() => setHover(i)} onMouseLeave={() => setHover(null)}
                className="cursor-pointer"
                style={{ transition: 'stroke-dashoffset 0.8s ease, stroke-dasharray 0.8s ease, stroke-width 0.2s ease', opacity: hover === null || hover === i ? 1 : 0.4 }}
              />
            )
            offset += dash
            return el
          })}
        </svg>
        <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none">
          <span className="text-2xl font-bold text-slate-900 dark:text-white tabular-nums">{shown ? shown.value : (centerValue ?? total)}</span>
          <span className="text-xs text-slate-500 dark:text-slate-400">{shown ? `${Math.round((shown.value / total) * 100)}%` : (centerLabel || '')}</span>
        </div>
      </div>
      <div className="flex flex-col gap-2">
        {data.map((d, i) => (
          <div key={i} className="flex items-center gap-2 text-sm cursor-pointer" onMouseEnter={() => setHover(i)} onMouseLeave={() => setHover(null)} style={{ opacity: hover === null || hover === i ? 1 : 0.5 }}>
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
          <circle cx="70" cy="70" r={r} fill="none" stroke={color} strokeWidth="12" strokeLinecap="round" strokeDasharray={`${circ * pct} ${circ}`} style={{ transition: 'stroke-dasharray 0.9s ease' }} />
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

export function BarChart({ data, color = '#8b5cf6' }: { data: { label: string; value: number }[]; color?: string }) {
  const max = Math.max(...data.map((d) => d.value), 1)
  const [hover, setHover] = useState<number | null>(null)
  return (
    <div className="w-full relative">
      {hover !== null && (
        <div className="absolute top-0 start-1/2 -translate-x-1/2 z-10 bg-slate-900 dark:bg-slate-700 text-white text-xs px-3 py-1.5 rounded-lg shadow-lg pointer-events-none whitespace-nowrap">
          {data[hover].label}: <span className="font-bold tabular-nums">{data[hover].value}</span>
        </div>
      )}
      <div className="flex items-end justify-between gap-2 h-40 pt-6">
        {data.map((d, i) => (
          <div key={i} className="flex-1 flex flex-col items-center gap-2 h-full justify-end cursor-pointer" onMouseEnter={() => setHover(i)} onMouseLeave={() => setHover(null)}>
            <span className="text-xs font-semibold text-slate-700 dark:text-slate-200 tabular-nums">{d.value}</span>
            <div
              className="w-full rounded-t-lg origin-bottom transition-all"
              style={{
                height: `${(d.value / max) * 100}%`,
                minHeight: d.value > 0 ? '4px' : '0',
                background: `linear-gradient(to top, ${color}, ${color}bb)`,
                opacity: hover === null || hover === i ? 1 : 0.5,
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

interface Series { name: string; color: string; data: number[] }

export function MultiAreaChart({ series, labels }: { series: Series[]; labels: string[] }) {
  const w = 320, h = 150, pad = 8
  const max = Math.max(...series.flatMap((s) => s.data), 1)
  const n = labels.length
  const step = n > 1 ? (w - pad * 2) / (n - 1) : 0
  const [hover, setHover] = useState<number | null>(null)

  const pathFor = (data: number[]) => {
    const pts = data.map((v, i) => [pad + i * step, h - pad - (v / max) * (h - pad * 2)])
    const line = pts.map((p, i) => `${i === 0 ? 'M' : 'L'}${p[0].toFixed(1)},${p[1].toFixed(1)}`).join(' ')
    const area = `${line} L${pts[pts.length - 1][0].toFixed(1)},${h - pad} L${pts[0][0].toFixed(1)},${h - pad} Z`
    return { line, area, pts }
  }

  const onMove = (e: React.MouseEvent<HTMLDivElement>) => {
    const rect = e.currentTarget.getBoundingClientRect()
    setHover(Math.max(0, Math.min(n - 1, Math.round(((e.clientX - rect.left) / rect.width) * (n - 1)))))
  }

  return (
    <div className="w-full">
      <div className="flex items-center gap-4 mb-2">
        {series.map((s) => (
          <span key={s.name} className="flex items-center gap-1.5 text-xs text-slate-600 dark:text-slate-300">
            <span className="w-2.5 h-2.5 rounded-full" style={{ background: s.color }} /> {s.name}
          </span>
        ))}
      </div>
      <div className="w-full relative" dir="ltr" onMouseMove={onMove} onMouseLeave={() => setHover(null)}>
        {hover !== null && (
          <div className="absolute -top-1 z-10 bg-slate-900 dark:bg-slate-700 text-white text-xs px-3 py-2 rounded-lg shadow-lg pointer-events-none -translate-x-1/2 space-y-0.5" style={{ left: `${(hover / Math.max(n - 1, 1)) * 100}%` }}>
            <div className="font-medium mb-1">{labels[hover]}</div>
            {series.map((s) => (<div key={s.name} className="flex items-center gap-1.5"><span className="w-2 h-2 rounded-full" style={{ background: s.color }} />{s.name}: <b className="tabular-nums">{s.data[hover]}</b></div>))}
          </div>
        )}
        <svg viewBox={`0 0 ${w} ${h}`} className="w-full" preserveAspectRatio="none" style={{ height: 170 }}>
          <defs>
            {series.map((s) => (
              <linearGradient key={s.name} id={`mg-${s.color.replace('#', '')}`} x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor={s.color} stopOpacity="0.3" />
                <stop offset="100%" stopColor={s.color} stopOpacity="0" />
              </linearGradient>
            ))}
          </defs>
          {[0.25, 0.5, 0.75].map((f) => (<line key={f} x1={pad} x2={w - pad} y1={h * f} y2={h * f} stroke="currentColor" strokeWidth="1" className="text-slate-100 dark:text-slate-700" />))}
          {series.map((s) => {
            const { line, area, pts } = pathFor(s.data)
            return (
              <g key={s.name}>
                <path d={area} fill={`url(#mg-${s.color.replace('#', '')})`} />
                <path d={line} fill="none" stroke={s.color} strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" style={{ strokeDasharray: 1000, animation: 'drawLine 1.2s ease both' }} />
                {hover !== null && <circle cx={pts[hover][0]} cy={pts[hover][1]} r="4" fill={s.color} stroke="var(--card)" strokeWidth="2" />}
              </g>
            )
          })}
          {hover !== null && <line x1={pad + hover * step} x2={pad + hover * step} y1={pad} y2={h - pad} stroke="currentColor" strokeWidth="1" strokeDasharray="3 3" className="text-slate-300 dark:text-slate-600" />}
        </svg>
        <div className="flex justify-between mt-1">
          {labels.map((l, i) => (<span key={i} className={`text-[11px] ${hover === i ? 'text-slate-900 dark:text-white font-medium' : 'text-slate-500 dark:text-slate-400'}`}>{l}</span>))}
        </div>
      </div>
    </div>
  )
}

export function HBarChart({ data }: { data: { label: string; value: number; color?: string }[] }) {
  const max = Math.max(...data.map((d) => d.value), 1)
  const [hover, setHover] = useState<number | null>(null)
  const palette = ['#10b981', '#8b5cf6', '#f59e0b', '#3b82f6', '#ef4444', '#14b8a6', '#ec4899']
  return (
    <div className="space-y-3">
      {data.map((d, i) => (
        <div key={i} className="flex items-center gap-3 cursor-pointer" onMouseEnter={() => setHover(i)} onMouseLeave={() => setHover(null)}>
          <span className="text-xs text-slate-600 dark:text-slate-300 w-24 truncate text-end">{d.label}</span>
          <div className="flex-1 h-6 rounded-lg bg-slate-100 dark:bg-slate-800 overflow-hidden">
            <div className="h-full rounded-lg flex items-center justify-end pe-2 transition-all" style={{ width: `${Math.max((d.value / max) * 100, 6)}%`, background: d.color || palette[i % palette.length], opacity: hover === null || hover === i ? 1 : 0.55, animation: `growBarH 0.7s ease ${i * 0.05}s both` }}>
              <span className="text-[11px] font-semibold text-white tabular-nums">{d.value}</span>
            </div>
          </div>
        </div>
      ))}
    </div>
  )
}

export function AreaChart({ data, color = '#10b981' }: { data: { label: string; value: number }[]; color?: string }) {
  const w = 320, h = 140, pad = 8
  const max = Math.max(...data.map((d) => d.value), 1)
  const step = data.length > 1 ? (w - pad * 2) / (data.length - 1) : 0
  const pts = data.map((d, i) => [pad + i * step, h - pad - (d.value / max) * (h - pad * 2)])
  const line = pts.map((p, i) => `${i === 0 ? 'M' : 'L'}${p[0].toFixed(1)},${p[1].toFixed(1)}`).join(' ')
  const area = `${line} L${pts[pts.length - 1][0].toFixed(1)},${h - pad} L${pts[0][0].toFixed(1)},${h - pad} Z`
  const gid = `grad-${color.replace('#', '')}`
  const [hover, setHover] = useState<number | null>(null)

  const onMove = (e: React.MouseEvent<HTMLDivElement>) => {
    const rect = e.currentTarget.getBoundingClientRect()
    const ratio = (e.clientX - rect.left) / rect.width
    setHover(Math.max(0, Math.min(data.length - 1, Math.round(ratio * (data.length - 1)))))
  }

  return (
    <div className="w-full relative" dir="ltr" onMouseMove={onMove} onMouseLeave={() => setHover(null)}>
      {hover !== null && (
        <div className="absolute -top-1 z-10 bg-slate-900 dark:bg-slate-700 text-white text-xs px-3 py-1.5 rounded-lg shadow-lg pointer-events-none whitespace-nowrap -translate-x-1/2"
          style={{ left: `${(hover / Math.max(data.length - 1, 1)) * 100}%` }}>
          {data[hover].label}: <span className="font-bold tabular-nums">{data[hover].value}</span>
        </div>
      )}
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
        <path d={line} fill="none" stroke={color} strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" style={{ strokeDasharray: 1000, animation: 'drawLine 1.2s ease both' }} />
        {hover !== null && <line x1={pts[hover][0]} x2={pts[hover][0]} y1={pad} y2={h - pad} stroke={color} strokeWidth="1" strokeDasharray="3 3" opacity="0.5" />}
        {pts.map((p, i) => (
          <circle key={i} cx={p[0]} cy={p[1]} r={hover === i ? 5 : 3} fill={color} stroke="var(--card)" strokeWidth={hover === i ? 2 : 0} className="transition-all" />
        ))}
      </svg>
      <div className="flex justify-between mt-1">
        {data.map((d, i) => (
          <span key={i} className={`text-[11px] transition-colors ${hover === i ? 'text-slate-900 dark:text-white font-medium' : 'text-slate-500 dark:text-slate-400'}`}>{d.label}</span>
        ))}
      </div>
    </div>
  )
}
