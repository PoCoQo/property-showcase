import { useEffect, useRef, useState } from 'react'
import type { Property } from '../lib/types'

interface Props {
  properties: Property[]
  activeId?: string | null
  onMarkerClick?: (id: string) => void
  center?: { lat: number; lng: number }
}

const TENCENT_MAP_KEY = import.meta.env.VITE_TENCENT_MAP_KEY
const DEFAULT_CENTER = { lat: 23.1291, lng: 113.2644 } // 广州中心

// 声明腾讯地图全局类型
declare global {
  interface Window {
    TMap?: any
  }
}

function loadTMapScript(key: string): Promise<void> {
  return new Promise((resolve, reject) => {
    if (window.TMap) return resolve()
    const existing = document.querySelector('script[data-tmap]') as HTMLScriptElement | null
    if (existing) {
      existing.addEventListener('load', () => resolve())
      existing.addEventListener('error', () => reject(new Error('腾讯地图脚本加载失败')))
      return
    }
    const s = document.createElement('script')
    s.src = `https://map.qq.com/api/gljs?v=1.exp&key=${encodeURIComponent(key)}`
    s.async = true
    s.dataset.tmap = '1'
    s.addEventListener('load', () => resolve())
    s.addEventListener('error', () => reject(new Error('腾讯地图脚本加载失败')))
    document.head.appendChild(s)
  })
}

export default function MapView({ properties, activeId, onMarkerClick, center }: Props) {
  const containerRef = useRef<HTMLDivElement>(null)
  const mapRef = useRef<any>(null)
  const markersRef = useRef<Map<string, any>>(new Map())
  const [ready, setReady] = useState(false)
  const [error, setError] = useState<string | null>(null)

  // 初始化地图
  useEffect(() => {
    if (!TENCENT_MAP_KEY) {
      setError('未配置腾讯地图 Key (VITE_TENCENT_MAP_KEY)')
      return
    }
    let cancelled = false
    loadTMapScript(TENCENT_MAP_KEY)
      .then(() => {
        if (cancelled || !containerRef.current || !window.TMap) return
        const T = window.TMap
        const map = new T.Map(containerRef.current, {
          center: center || DEFAULT_CENTER,
          zoom: 11,
        })
        mapRef.current = map
        setReady(true)
      })
      .catch((e) => {
        if (!cancelled) setError(String(e?.message ?? e))
      })
    return () => {
      cancelled = true
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  // 渲染标记
  useEffect(() => {
    if (!ready || !mapRef.current || !window.TMap) return
    const T = window.TMap
    // 清除旧标记
    markersRef.current.forEach((m) => m.setMap(null))
    markersRef.current.clear()

    properties.forEach((p) => {
      if (p.latitude == null || p.longitude == null) return
      const marker = new T.MultiMarker({
        map: mapRef.current,
        styles: {
          marker: new T.MarkerStyle({
            src:
              p.status === 'vacant'
                ? 'https://mapapi.qq.com/web/lbs/javascriptGL/demo/img/marker-green.png'
                : p.status === 'rented'
                ? 'https://mapapi.qq.com/web/lbs/javascriptGL/demo/img/marker-gray.png'
                : 'https://mapapi.qq.com/web/lbs/javascriptGL/demo/img/marker-yellow.png',
            width: 28,
            height: 36,
          }),
        },
        geometries: [
          {
            id: p.id,
            styleId: 'marker',
            position: new T.LatLng(p.latitude, p.longitude),
            properties: { title: p.code },
          },
        ],
      })
      marker.on('click', (e: any) => {
        const id = e?.geometry?.id
        if (id && onMarkerClick) onMarkerClick(id)
      })
      markersRef.current.set(p.id, marker)
    })
  }, [ready, properties, onMarkerClick])

  // 选中标记时居中
  useEffect(() => {
    if (!ready || !activeId) return
    const p = properties.find((x) => x.id === activeId)
    if (p && p.latitude != null && p.longitude != null && mapRef.current && window.TMap) {
      mapRef.current.setCenter(new window.TMap.LatLng(p.latitude, p.longitude))
      mapRef.current.setZoom(16)
    }
  }, [activeId, ready, properties])

  if (error) {
    return (
      <div className="h-full w-full flex items-center justify-center bg-slate-50 text-slate-500 text-sm p-4 text-center">
        {error}
        <br />
        <span className="text-xs text-slate-400">
          请在 .env 中配置 VITE_TENCENT_MAP_KEY，或参考 README 申请 Key
        </span>
      </div>
    )
  }

  return <div ref={containerRef} className="h-full w-full" />
}
