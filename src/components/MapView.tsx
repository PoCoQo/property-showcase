import { useEffect, useRef, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import type { Property } from '../lib/types'

interface Props {
  properties: Property[]
  activeId?: string | null
  onMarkerClick?: (id: string) => void
  center?: { lat: number; lng: number }
}

/**
 * 地图：高德地图 JS API 2.0
 * 切到高德的原因：腾讯地图新版 LBS 控制台不再支持 JS API 类型 key 申请
 *   （只让勾选 WebServiceAPI，不让勾选 Javascript API / GL）。
 * 高德地图的 GCJ-02 坐标系与腾讯地图一致，之前数据里的 lat/lng 可以直接用。
 */
const AMAP_KEY = import.meta.env.VITE_AMAP_KEY
const DEFAULT_CENTER = { lat: 23.1291, lng: 113.2644 } // 广州中心（GCJ-02）

// 声明高德地图全局类型
declare global {
  interface Window {
    AMap?: any
  }
}

function loadAMapScript(key: string): Promise<void> {
  return new Promise((resolve, reject) => {
    if (window.AMap) return resolve()
    const existing = document.querySelector('script[data-amap]') as HTMLScriptElement | null
    if (existing) {
      existing.addEventListener('load', () => resolve())
      existing.addEventListener('error', () => reject(new Error('高德地图脚本加载失败')))
      return
    }
    const s = document.createElement('script')
    s.src = `https://webapi.amap.com/maps?v=2.0&key=${encodeURIComponent(key)}`
    s.async = true
    s.dataset.amap = '1'
    s.addEventListener('load', () => resolve())
    s.addEventListener('error', () => reject(new Error('高德地图脚本加载失败')))
    document.head.appendChild(s)
  })
}

// 不同状态用不同颜色 pin
const MARKER_ICON: Record<string, string> = {
  vacant: 'https://webapi.amap.com/theme/v1.3/markers/n/mark_b.png',   // 蓝 = 空置
  rented: 'https://webapi.amap.com/theme/v1.3/markers/n/mark_g.png',   // 灰 = 已租
  reserved: 'https://webapi.amap.com/theme/v1.3/markers/n/mark_r.png', // 红 = 已预订
}

export default function MapView({ properties, activeId, onMarkerClick, center }: Props) {
  const containerRef = useRef<HTMLDivElement>(null)
  const mapRef = useRef<any>(null)
  const markersRef = useRef<Map<string, any>>(new Map())
  const [ready, setReady] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const navigate = useNavigate()

  // 初始化地图
  useEffect(() => {
    if (!AMAP_KEY) {
      setError('未配置高德地图 Key (VITE_AMAP_KEY)')
      return
    }
    let cancelled = false
    loadAMapScript(AMAP_KEY)
      .then(() => {
        if (cancelled || !containerRef.current || !window.AMap) return
        const map = new window.AMap.Map(containerRef.current, {
          zoom: 11,
          // AMap 坐标是 [lng, lat] 数组（经度在前），不是 {lat, lng} 对象
          center: [
            center?.lng ?? DEFAULT_CENTER.lng,
            center?.lat ?? DEFAULT_CENTER.lat,
          ],
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
    if (!ready || !mapRef.current || !window.AMap) return
    // 清除旧标记
    markersRef.current.forEach((m) => mapRef.current.remove(m))
    markersRef.current.clear()

    properties.forEach((p) => {
      if (p.latitude == null || p.longitude == null) return
      const marker = new window.AMap.Marker({
        position: [p.longitude, p.latitude],  // [lng, lat]
        map: mapRef.current,
        icon: MARKER_ICON[p.status] ?? MARKER_ICON.vacant,
        offset: new window.AMap.Pixel(-13, -30),
        title: p.code,
      })
      marker.on('click', () => {
        // 标记点点击：跳详情页（保留 onMarkerClick 是为了 Home 里高亮联动）
        if (onMarkerClick) onMarkerClick(p.id)
        navigate(`/property/${p.id}`)
      })
      markersRef.current.set(p.id, marker)
    })
  }, [ready, properties, onMarkerClick])

  // 选中标记时居中
  useEffect(() => {
    if (!ready || !activeId) return
    const p = properties.find((x) => x.id === activeId)
    if (p && p.latitude != null && p.longitude != null && mapRef.current) {
      mapRef.current.setZoomAndCenter(16, [p.longitude, p.latitude])
    }
  }, [activeId, ready, properties])

  if (error) {
    return (
      <div className="h-full w-full flex items-center justify-center bg-slate-50 text-slate-500 text-sm p-4 text-center">
        {error}
        <br />
        <span className="text-xs text-slate-400">
          请在 .env 中配置 VITE_AMAP_KEY（高德地图 Web 端 JS API），或参考 README 申请 Key
        </span>
      </div>
    )
  }

  return <div ref={containerRef} className="h-full w-full" />
}
