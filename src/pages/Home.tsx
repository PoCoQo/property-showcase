import { useEffect, useMemo, useState } from 'react'
import { fetchProperties } from '../lib/api'
import type { Property } from '../lib/types'
import FilterBar, { type Filter } from '../components/FilterBar'
import PropertyCard from '../components/PropertyCard'
import MapView from '../components/MapView'

export default function Home() {
  const [all, setAll] = useState<Property[]>([])
  const [loading, setLoading] = useState(true)
  const [view, setView] = useState<'list' | 'map' | 'split'>('split')
  const [activeId, setActiveId] = useState<string | null>(null)
  const [filter, setFilter] = useState<Filter>({
    district: 'all',
    type: 'all',
    status: 'all',
    keyword: '',
  })

  useEffect(() => {
    fetchProperties()
      .then((data) => {
        setAll(data)
        setLoading(false)
      })
      .catch((e) => {
        console.error(e)
        setLoading(false)
      })
  }, [])

  const filtered = useMemo(() => {
    const kw = filter.keyword.trim().toLowerCase()
    return all.filter((p) => {
      if (filter.district !== 'all' && p.district !== filter.district) return false
      if (filter.type !== 'all' && p.type !== filter.type) return false
      if (filter.status !== 'all' && p.status !== filter.status) return false
      if (kw) {
        const hay = `${p.code} ${p.name ?? ''} ${p.address}`.toLowerCase()
        if (!hay.includes(kw)) return false
      }
      return true
    })
  }, [all, filter])

  return (
    <div className="max-w-6xl mx-auto px-4 py-4">
      {/* Hero */}
      <div className="bg-gradient-to-br from-brand-500 to-brand-700 text-white rounded-2xl p-6 mb-4 shadow-sm">
        <h1 className="text-xl font-bold mb-1">白云城建 · 物业展示</h1>
        <p className="text-sm text-white/80">
          精选广州四区优质商铺与车位，欢迎咨询洽谈
        </p>
        <div className="mt-3 flex gap-2 text-xs">
          <div className="bg-white/15 rounded-full px-3 py-1">
            商铺 · 车位
          </div>
          <div className="bg-white/15 rounded-full px-3 py-1">
            覆盖 白云 / 荔湾 / 海珠 / 越秀
          </div>
        </div>
      </div>

      {/* 筛选条 */}
      <div className="card mb-3">
        <FilterBar
          value={filter}
          onChange={setFilter}
          total={all.length}
          visible={filtered.length}
        />
      </div>

      {/* 视图切换 */}
      <div className="flex items-center justify-between mb-3">
        <div className="text-sm text-slate-500">
          {loading ? '加载中…' : `共 ${filtered.length} 条结果`}
        </div>
        <div className="flex rounded-lg border border-slate-200 overflow-hidden text-sm">
          {(
            [
              ['split', '分屏'],
              ['list', '列表'],
              ['map', '地图'],
            ] as const
          ).map(([k, label]) => (
            <button
              key={k}
              onClick={() => setView(k)}
              className={`px-3 py-1.5 ${
                view === k ? 'bg-brand-500 text-white' : 'bg-white text-slate-600'
              }`}
            >
              {label}
            </button>
          ))}
        </div>
      </div>

      {/* 内容区 */}
      {loading ? (
        <div className="text-center py-12 text-slate-400">加载中…</div>
      ) : filtered.length === 0 ? (
        <div className="text-center py-12 text-slate-400">没有符合条件的物业</div>
      ) : view === 'list' ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
          {filtered.map((p) => (
            <PropertyCard key={p.id} p={p} />
          ))}
        </div>
      ) : (
        <div
          className={`grid gap-3 ${
            view === 'split' ? 'grid-cols-1 md:grid-cols-2' : 'grid-cols-1'
          }`}
        >
          {view === 'split' && (
            <div className="card p-0 overflow-hidden h-[500px]">
              <MapView
                properties={filtered}
                activeId={activeId}
                onMarkerClick={setActiveId}
              />
            </div>
          )}
          <div className="space-y-3 max-h-[500px] overflow-y-auto pr-1">
            {filtered.map((p) => (
              <PropertyCard
                key={p.id}
                p={p}
                active={activeId === p.id}
                onClick={() => setActiveId(p.id)}
              />
            ))}
          </div>
          {view === 'map' && (
            <div className="card p-0 overflow-hidden h-[500px]">
              <MapView
                properties={filtered}
                activeId={activeId}
                onMarkerClick={setActiveId}
              />
            </div>
          )}
        </div>
      )}
    </div>
  )
}
