import { useEffect, useRef, useState } from 'react'

declare global {
  interface Window {
    AMap?: any
  }
}

interface Props {
  lat: number | null
  lng: number | null
  onChange: (lat: number, lng: number) => void
  onClose: () => void
}

/**
 * 地图选点组件（后台用）
 * - 顶部搜索：直接 fetch 高德 POI Web API（不走 AMap 插件，避免加载顺序坑）
 * - 地图点选 / 拖拽 marker 微调
 */
export default function LocationPicker({ lat, lng, onChange, onClose }: Props) {
  const mapRef = useRef<HTMLDivElement>(null)
  const mapInstance = useRef<any>(null)
  const markerRef = useRef<any>(null)
  const [keyword, setKeyword] = useState('')
  const [searching, setSearching] = useState(false)
  const [pois, setPois] = useState<any[]>([])
  const [error, setError] = useState<string | null>(null)
  const [mapReady, setMapReady] = useState(false)

  // 广州默认
  const DEFAULT_CENTER: [number, number] = [113.2644, 23.1291]
  const initialCenter: [number, number] =
    lng != null && lat != null ? [lng, lat] : DEFAULT_CENTER

  // 初始化地图
  useEffect(() => {
    const key = import.meta.env.VITE_AMAP_KEY
    if (!key) {
      setError('未配置高德地图 Key (VITE_AMAP_KEY)')
      return
    }

    const init = () => {
      if (!window.AMap || !mapRef.current) return
      const map = new window.AMap.Map(mapRef.current, {
        zoom: lng != null ? 16 : 11,
        center: initialCenter,
      })
      mapInstance.current = map

      // 初始 marker
      if (lng != null && lat != null) {
        markerRef.current = new window.AMap.Marker({
          position: [lng, lat],
          map,
          draggable: true,
        })
        markerRef.current.on('dragend', (e: any) => {
          const pos = e.lnglat
          onChange(pos.lat, pos.lng)
        })
      }

      // 地图点击
      map.on('click', (e: any) => {
        const pos = e.lnglat
        if (markerRef.current) {
          markerRef.current.setPosition(pos)
        } else {
          markerRef.current = new window.AMap.Marker({
            position: pos,
            map,
            draggable: true,
          })
          markerRef.current.on('dragend', (ev: any) => {
            const p = ev.lnglat
            onChange(p.lat, p.lng)
          })
        }
        onChange(pos.lat, pos.lng)
      })

      setMapReady(true)
    }

    if (window.AMap) {
      init()
      return
    }
    const existing = document.querySelector('script[data-amap]')
    if (existing) {
      existing.addEventListener('load', init)
      return
    }
    const s = document.createElement('script')
    s.src = `https://webapi.amap.com/maps?v=2.0&key=${encodeURIComponent(key)}`
    s.async = true
    s.dataset.amap = '1'
    s.addEventListener('load', init)
    s.addEventListener('error', () => setError('高德脚本加载失败'))
    document.head.appendChild(s)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  // 搜索：直接调高德 Web API（REST，不用 AMap 插件）
  const handleSearch = async () => {
    const key = import.meta.env.VITE_AMAP_KEY
    const kw = keyword.trim()
    if (!kw || !key) return
    setSearching(true)
    setError(null)
    setPois([])
    try {
      const url = `https://restapi.amap.com/v3/place/text?key=${encodeURIComponent(
        key,
      )}&keywords=${encodeURIComponent(kw)}&city=广州&citylimit=true&offset=8&extensions=base&output=JSON`
      const res = await fetch(url)
      const data = await res.json()
      setSearching(false)
      if (data.status !== '1' || !data.pois?.length) {
        setError(`没搜到「${kw}」,试试换个关键词(如「江南西路」「白云万达」)`)
        return
      }
      setPois(data.pois)
    } catch (e: any) {
      setSearching(false)
      setError('搜索失败: ' + e.message)
    }
  }

  // 选中候选
  const pickPoi = (poi: any) => {
    if (!poi.location) return
    const newLng = parseFloat(poi.location.lng || poi.location.split(',')[0])
    const newLat = parseFloat(poi.location.lat || poi.location.split(',')[1])
    if (isNaN(newLat) || isNaN(newLng)) return

    const map = mapInstance.current
    if (map && window.AMap) {
      map.setZoomAndCenter(16, [newLng, newLat])
      if (markerRef.current) {
        markerRef.current.setPosition([newLng, newLat])
      } else {
        markerRef.current = new window.AMap.Marker({
          position: [newLng, newLat],
          map,
          draggable: true,
        })
        markerRef.current.on('dragend', (ev: any) => {
          const p = ev.lnglat
          onChange(p.lat, p.lng)
        })
      }
    }
    onChange(newLat, newLng)
    setPois([]) // 清空候选
    setKeyword('')
  }

  return (
    <div className="fixed inset-0 bg-black/50 z-[60] flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl shadow-xl w-full max-w-3xl max-h-[90vh] overflow-hidden flex flex-col">
        <div className="p-4 border-b border-slate-100 flex items-center justify-between">
          <h2 className="text-lg font-bold">在地图上选位置</h2>
          <button
            type="button"
            onClick={onClose}
            className="text-slate-400 hover:text-slate-700 text-2xl leading-none"
          >
            ×
          </button>
        </div>

        {/* 搜索框 */}
        <div className="p-3 border-b border-slate-100">
          <div className="flex gap-2">
            <input
              className="input flex-1"
              placeholder="搜索地址（如「江南西路」「白云万达」），按回车"
              value={keyword}
              onChange={(e) => setKeyword(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === 'Enter') {
                  e.preventDefault()
                  handleSearch()
                }
              }}
            />
            <button
              type="button"
              onClick={handleSearch}
              disabled={searching || !keyword.trim()}
              className="btn-primary disabled:opacity-50"
            >
              {searching ? '搜…' : '搜索'}
            </button>
          </div>
          {error && <div className="text-xs text-red-500 mt-1">{error}</div>}

          {/* 候选列表 */}
          {pois.length > 0 && (
            <div className="mt-2 max-h-48 overflow-y-auto border border-slate-200 rounded-lg divide-y divide-slate-100">
              {pois.map((p) => (
                <button
                  key={p.id}
                  type="button"
                  onClick={() => pickPoi(p)}
                  className="w-full text-left px-3 py-2 hover:bg-brand-50 text-sm"
                >
                  <div className="font-medium text-slate-800">{p.name}</div>
                  <div className="text-xs text-slate-500">
                    {p.address || p.location}
                  </div>
                </button>
              ))}
            </div>
          )}
          <div className="text-xs text-slate-400 mt-1">
            💡 也可以直接在地图上点,marker 可拖拽微调
          </div>
        </div>

        {/* 地图：固定高度 500px，避免 flex 坑 */}
        <div style={{ height: '500px', position: 'relative' }} className="bg-slate-100">
          {error ? (
            <div className="h-full flex items-center justify-center text-slate-400 text-sm p-4 text-center">
              {error}
            </div>
          ) : (
            <>
              <div ref={mapRef} className="w-full h-full" />
              {!mapReady && (
                <div className="absolute inset-0 flex items-center justify-center text-slate-400 text-sm bg-white/70">
                  地图加载中…
                </div>
              )}
            </>
          )}
        </div>

        {/* 底部当前坐标 + 确认 */}
        <div className="p-4 border-t border-slate-100 flex items-center justify-between bg-slate-50">
          <div className="text-sm">
            <span className="text-slate-500">当前坐标:</span>{' '}
            <span className="font-mono text-slate-800">
              {lat != null && lng != null
                ? `${lat.toFixed(6)}, ${lng.toFixed(6)}`
                : '未选'}
            </span>
          </div>
          <div className="flex gap-2">
            <button type="button" onClick={onClose} className="btn-secondary">
              取消
            </button>
            <button
              type="button"
              onClick={onClose}
              disabled={lat == null || lng == null}
              className="btn-primary disabled:opacity-50"
            >
              用这个位置
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}
