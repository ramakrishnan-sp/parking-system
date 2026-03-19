import { useEffect, useState } from 'react'

const BRANDS = [
  { key: 'purple', label: 'Purple', color: '#9333ea' },
  { key: 'blue',   label: 'Blue',   color: '#2563eb' },
  { key: 'teal',   label: 'Teal',   color: '#0d9488' },
  { key: 'orange', label: 'Orange', color: '#ea580c' },
  { key: 'pink',   label: 'Pink',   color: '#db2777' },
]

export function ColorThemePicker() {
  const [current, setCurrent] = useState('purple')

  useEffect(() => {
    const saved = localStorage.getItem('parkease-brand') || 'purple'
    setCurrent(saved)
    document.documentElement.setAttribute('data-brand', saved)
  }, [])

  function setBrand(key) {
    setCurrent(key)
    document.documentElement.setAttribute('data-brand', key)
    localStorage.setItem('parkease-brand', key)
  }

  return (
    <div className="px-1 pb-1">
      <p className="mb-2 text-xs text-muted-foreground px-1">Brand color</p>
      <div className="flex items-center gap-2 px-1">
        {BRANDS.map((b) => (
          <button
            key={b.key}
            aria-label={`Use ${b.label} theme`}
            onClick={() => setBrand(b.key)}
            className={`size-6 rounded-full ring-offset-2 ring-offset-background transition-all focus-visible:outline-none focus-visible:ring-2 ${
              current === b.key ? 'ring-2 ring-ring scale-110' : 'ring-transparent hover:scale-105'
            }`}
            style={{ backgroundColor: b.color }}
          />
        ))}
      </div>
    </div>
  )
}
