import { useEffect, useRef, useState } from 'react'

declare global {
  interface Window {
    AMap?: any
  }
}

interface Props {
  /** 当前纬度（可空） */
  lat: number | null
  /** 当前经度（可空） */
  lng: number | null
  /** 选点后回调 */
  onChange: (lat: number, lng: number) => void
  /** 关闭弹窗 */
  onClose: () => void
}

/**
 * 地图选点组件（后台用）
 * - 顶部搜索框：输入地址关键词，用高德 POI 搜索 API 找候选位置
 * - 地图点选：在地图任意位置点击，自动定位到该点
 * - marker 拖拽：精确微调
 */
export default function LocationPicker({ lat, lng, onChange, onClose }: Props) {
  const mapRef = useRef<any>(null)
  const markerRef = useRef<any>(null)
  const inputRef = useRef<HTMLInputElement>(null)
  const [keyword, setKeyword] = useState('')
  const [searching, setSearching] = useState(false)
  const [error, setError] = useState<string | null>(null)

  // 默认中心：广州
  const DEFAULT_CENTER: [number, number] = [113.2644, 23.1291]
  const initialCenter: [number, number] =
    lng != null && lat != null ? [lng, lat] : DEFAULT_CENTER

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

      // 初始 marker（如果有的话）
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

      // 点击地图
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

      // 暴露给搜索回调用
      ;(mapRef as any)._mapInstance = map
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

  // 搜索地址 → 高德 POI 搜索
  const handleSearch = async () => {
    if (!keyword.trim() || !window.AMap) return
    setSearching(true)
    setError(null)
    try {
      window.AMap.plugin('AMap.PlaceSearch', () => {
        const search = new window.AMap.PlaceSearch({
          city: '广州',
          pageSize: 8,
        })
        search.search(keyword, (status: string, result: any) => {
          setSearching(false)
          if (status !== 'complete' || !result.poiList?.pois?.length) {
            setError('没搜到结果,试试换个关键词(如「海珠江南西路」)')
            return
          }
          const pois = result.poiList.pois
          showPoiList(pois)
        })
      })
    } catch (e: any) {
      setSearching(false)
      setError('搜索失败: ' + e.message)
    }
  }

  const showPoiList = (pois: any[]) => {
    // 简单粗暴：列表塞到 input 下方
    const existing = document.getElementById('poi-result-list')
    if (existing) existing.remove()

    const div = document.createElement('div')
    div.id = 'poi-result-list'
    div.className =
      'absolute z-10 bg-white border border-slate-200 rounded-lg shadow-lg mt-1 max-h-60 overflow-y-auto w-full'
    pois.forEach((poi: any) => {
      const btn = document.createElement('button')
      btn.type = 'button'
      btn.className =
        'w-full text-left px-3 py-2 hover:bg-brand-50 text-sm border-b border-slate-100 last:border-0'
      btn.innerHTML = `
        <div class="font-medium text-slate-800">${poi.name}</div>
        <div class="text-xs text-slate-500">${poi.address || ''}</div>
      `
      btn.onclick = () => {
        const loc = poi.location
        const newLng = loc.lng || loc.getLng?.()
        const newLat = loc.lat || loc.getLat?.()
        if (newLat == null || newLng == null) return
        const map = (mapRef as any)._mapInstance
        if (map) {
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
        div.remove()
      }
      div.appendChild(btn)
    })
    if (inputRef.current?.parentElement) {
      inputRef.current.parentElement.appendChild(div)
    }
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
        <div className="p-3 border-b border-slate-100 relative">
          <div className="flex gap-2">
            <input
              ref={inputRef}
              className="input flex-1"
              placeholder="搜索地址（如「海珠江南西路 66 号」），按回车"
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
              disabled={searching}
              className="btn-primary"
            >
              {searching ? '搜…' : '搜索'}
            </button>
          </div>
          {error && <div className="text-xs text-red-500 mt-1">{error}</div>}
          <div className="text-xs text-slate-400 mt-1">
            💡 也可以直接在地图上点一下,marker 可拖拽微调
          </div>
        </div>

        {/* 地图 */}
        <div className="flex-1 min-h-[400px] relative">
          {error ? (
            <div className="h-full flex items-center justify-center text-slate-400 text-sm">
              {error}
            </div>
          ) : (
            <div ref={mapRef} className="w-full h-full" />
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
              className="btn-primary"
            >
              用这个位置
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}
