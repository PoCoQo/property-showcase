import { useEffect, useRef, useState } from 'react'
import { Link, useParams } from 'react-router-dom'
import { fetchProperty } from '../lib/api'
import type { MediaItem, Property } from '../lib/types'
import { PROPERTY_STATUS_COLOR, PROPERTY_STATUS_LABEL, PROPERTY_TYPE_LABEL } from '../lib/types'

export default function PropertyDetail() {
  const { id } = useParams<{ id: string }>()
  const [p, setP] = useState<Property | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [activeMedia, setActiveMedia] = useState(0)

  useEffect(() => {
    if (!id) return
    setLoading(true)
    fetchProperty(id)
      .then((data) => {
        setP(data)
        setLoading(false)
      })
      .catch((e) => {
        setError(e.message || '加载失败')
        setLoading(false)
      })
  }, [id])

  if (loading) {
    return (
      <div className="max-w-4xl mx-auto px-4 py-12 text-center text-slate-400">加载中…</div>
    )
  }
  if (error || !p) {
    return (
      <div className="max-w-4xl mx-auto px-4 py-12 text-center">
        <div className="text-slate-500">{error || '未找到该物业'}</div>
        <Link to="/" className="text-brand-600 hover:underline mt-2 inline-block">
          ← 返回列表
        </Link>
      </div>
    )
  }

  const media: MediaItem[] = p.media || []
  // 当前展示的媒体（外层用 media.length > 0 守卫过，这里用断言收窄类型）
  const cur = media[activeMedia] as MediaItem | undefined
  const priceText = (() => {
    if (p.price_min == null && p.price_max == null) return null
    if (p.price_min === p.price_max || p.price_max == null) {
      return `¥${p.price_min}/月`
    }
    if (p.price_min == null) return `¥${p.price_max}/月`
    return `¥${p.price_min}–${p.price_max}/月`
  })()

  // 联系信息解析：可能包含 电话 + 微信，用换行 / 顿号 / 空格分隔
  const contactLines = (p.contact || '').split(/[\n\r,，;；\s]+/).filter(Boolean)

  return (
    <div className="max-w-4xl mx-auto px-4 py-4">
      <div className="mb-3">
        <Link to="/" className="text-sm text-brand-600 hover:underline">
          ← 返回列表
        </Link>
      </div>

      {/* 媒体轮播 */}
      {media.length > 0 && cur ? (
        <div className="bg-white rounded-2xl overflow-hidden shadow-sm mb-3">
          <div className="relative bg-slate-900" style={{ aspectRatio: '16/10' }}>
            {cur.type === 'image' ? (
              <img
                key={cur.url}
                src={cur.url}
                alt={cur.name || ''}
                className="absolute inset-0 w-full h-full object-contain"
              />
            ) : (
              <video
                key={cur.url}
                src={cur.url}
                controls
                playsInline
                className="absolute inset-0 w-full h-full object-contain"
              />
            )}
            {media.length > 1 && (
              <>
                <button
                  type="button"
                  onClick={() => setActiveMedia((i) => (i - 1 + media.length) % media.length)}
                  className="absolute left-2 top-1/2 -translate-y-1/2 bg-black/50 text-white w-9 h-9 rounded-full"
                >
                  ‹
                </button>
                <button
                  type="button"
                  onClick={() => setActiveMedia((i) => (i + 1) % media.length)}
                  className="absolute right-2 top-1/2 -translate-y-1/2 bg-black/50 text-white w-9 h-9 rounded-full"
                >
                  ›
                </button>
                <div className="absolute bottom-2 left-1/2 -translate-x-1/2 bg-black/50 text-white text-xs px-2 py-0.5 rounded">
                  {activeMedia + 1} / {media.length}
                </div>
              </>
            )}
          </div>
          {/* 缩略图条 */}
          {media.length > 1 && (
            <div className="flex gap-1 p-2 overflow-x-auto">
              {media.map((m, i) => (
                <button
                  key={i}
                  onClick={() => setActiveMedia(i)}
                  className={`flex-shrink-0 w-16 h-16 rounded overflow-hidden border-2 ${
                    i === activeMedia ? 'border-brand-500' : 'border-transparent'
                  }`}
                >
                  {m.type === 'image' ? (
                    <img src={m.url} className="w-full h-full object-cover" />
                  ) : (
                    <div className="w-full h-full bg-slate-800 text-white flex items-center justify-center text-xl">
                      ▶
                    </div>
                  )}
                </button>
              ))}
            </div>
          )}
        </div>
      ) : (
        <div className="bg-slate-50 rounded-2xl h-48 flex items-center justify-center text-slate-400 mb-3">
          暂无实拍图 / 视频
        </div>
      )}

      {/* 标题 + 状态 */}
      <div className="bg-white rounded-2xl p-5 shadow-sm mb-3">
        <div className="flex items-start justify-between gap-3 flex-wrap">
          <div>
            <div className="text-xs text-slate-400 mb-1">{p.code}</div>
            <h1 className="text-xl font-bold text-slate-800">
              {p.name || `${PROPERTY_TYPE_LABEL[p.type]} · ${p.district}`}
            </h1>
            <div className="text-sm text-slate-500 mt-1">📍 {p.address}</div>
          </div>
          <span
            className={`text-xs px-2 py-1 rounded border ${
              PROPERTY_STATUS_COLOR[p.status]
            }`}
          >
            {PROPERTY_STATUS_LABEL[p.status]}
          </span>
        </div>
        {priceText && (
          <div className="text-2xl font-bold text-brand-600 mt-3">{priceText}</div>
        )}
      </div>

      {/* 详细参数 */}
      <div className="bg-white rounded-2xl p-5 shadow-sm mb-3">
        <h2 className="text-sm font-semibold text-slate-700 mb-3">详细信息</h2>
        <dl className="grid grid-cols-2 gap-x-4 gap-y-2 text-sm">
          <dt className="text-slate-500">类型</dt>
          <dd className="text-slate-800">{PROPERTY_TYPE_LABEL[p.type]}</dd>
          <dt className="text-slate-500">区域</dt>
          <dd className="text-slate-800">{p.district}</dd>
          <dt className="text-slate-500">面积</dt>
          <dd className="text-slate-800">{p.area ? `${p.area} m²` : '—'}</dd>
          <dt className="text-slate-500">状态</dt>
          <dd className="text-slate-800">{PROPERTY_STATUS_LABEL[p.status]}</dd>
          {priceText && (
            <>
              <dt className="text-slate-500">租金</dt>
              <dd className="text-slate-800">{priceText}</dd>
            </>
          )}
          {p.latitude != null && p.longitude != null && (
            <>
              <dt className="text-slate-500">坐标</dt>
              <dd className="text-slate-800 text-xs">
                {p.latitude}, {p.longitude}
              </dd>
            </>
          )}
        </dl>
        {p.description && (
          <div className="mt-4 pt-4 border-t border-slate-100">
            <div className="text-sm text-slate-500 mb-1">备注</div>
            <div className="text-sm text-slate-800 whitespace-pre-wrap">{p.description}</div>
          </div>
        )}
      </div>

      {/* 联系信息 */}
      {contactLines.length > 0 && (
        <div className="bg-white rounded-2xl p-5 shadow-sm mb-3">
          <h2 className="text-sm font-semibold text-slate-700 mb-3">联系咨询</h2>
          <div className="space-y-2">
            {contactLines.map((line, i) => {
              const isPhone = /^[\d\-\+\s]{7,}$/.test(line)
              return (
                <div key={i} className="flex items-center gap-2 text-sm">
                  <span className="text-slate-500 w-12">联系方式 {i + 1}</span>
                  {isPhone ? (
                    <a
                      href={`tel:${line}`}
                      className="text-brand-600 hover:underline font-medium"
                    >
                      📞 {line}
                    </a>
                  ) : (
                    <span className="text-slate-800">💬 {line}</span>
                  )}
                </div>
              )
            })}
          </div>
        </div>
      )}

      {/* 小地图 */}
      {p.latitude != null && p.longitude != null && (
        <div className="bg-white rounded-2xl overflow-hidden shadow-sm mb-3">
          <div className="p-4 border-b border-slate-100">
            <h2 className="text-sm font-semibold text-slate-700">位置</h2>
          </div>
          <div className="h-64">
            <AMapMini lat={p.latitude} lng={p.longitude} title={p.name || p.code} />
          </div>
        </div>
      )}
    </div>
  )
}

/** 内嵌的 mini 地图（详情页专用，独立组件避免依赖主 MapView 的 activeId 状态） */
function AMapMini({ lat, lng, title }: { lat: number; lng: number; title: string }) {
  const ref = useRef<HTMLDivElement>(null)
  const [err, setErr] = useState<string | null>(null)

  useEffect(() => {
    const key = import.meta.env.VITE_AMAP_KEY
    if (!key) {
      setErr('未配置高德地图 Key')
      return
    }
    if (window.AMap) {
      initMap()
      return
    }
    const existing = document.querySelector('script[data-amap]')
    if (existing) {
      existing.addEventListener('load', initMap)
      return
    }
    const s = document.createElement('script')
    s.src = `https://webapi.amap.com/maps?v=2.0&key=${encodeURIComponent(key)}`
    s.async = true
    s.dataset.amap = '1'
    s.addEventListener('load', initMap)
    s.addEventListener('error', () => setErr('高德脚本加载失败'))
    document.head.appendChild(s)

    function initMap() {
      if (!ref.current || !window.AMap) return
      const map = new window.AMap.Map(ref.current, {
        zoom: 16,
        center: [lng, lat],
      })
      new window.AMap.Marker({
        position: [lng, lat],
        map,
        title,
      })
    }

    return () => {
      // no-op
    }
  }, [lat, lng, title])

  if (err) {
    return (
      <div className="h-full w-full flex items-center justify-center bg-slate-50 text-slate-400 text-sm">
        {err}
      </div>
    )
  }
  return <div ref={ref} className="h-full w-full" />
}
