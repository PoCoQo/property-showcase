import { Link } from 'react-router-dom'
import type { Property } from '../lib/types'
import {
  PROPERTY_TYPE_LABEL,
  PROPERTY_STATUS_LABEL,
  PROPERTY_STATUS_COLOR,
} from '../lib/types'

interface Props {
  p: Property
  active?: boolean
  onClick?: () => void
  /** 当只有 1 个图时直接显示主图，否则用首图 */
  showThumb?: boolean
}

function formatPrice(p: Property): string {
  if (p.price_min == null && p.price_max == null) return '面议'
  if (p.price_min != null && p.price_max != null) {
    if (p.price_min === p.price_max) return `¥${p.price_min}/月`
    return `¥${p.price_min}–${p.price_max}/月`
  }
  return `¥${p.price_min ?? p.price_max}/月`
}

function formatArea(p: Property): string {
  if (p.area == null) return '—'
  return `${p.area} m²`
}

export default function PropertyCard({ p, onClick, active, showThumb = true }: Props) {
  const media = p.media || []
  const mainImage = media.find((m) => m.type === 'image')?.url
  const mediaCount = media.length

  return (
    <Link
      to={`/property/${p.id}`}
      onClick={onClick}
      className={`card block transition-all hover:shadow-md overflow-hidden p-0 ${
        active ? 'ring-2 ring-brand-500 border-brand-200' : ''
      }`}
    >
      {showThumb && (
        <div className="relative h-32 bg-slate-100">
          {mainImage ? (
            <img src={mainImage} alt={p.name || p.code} className="w-full h-full object-cover" />
          ) : (
            <div className="w-full h-full flex items-center justify-center text-slate-300 text-3xl">
              🏠
            </div>
          )}
          {mediaCount > 0 && (
            <div className="absolute bottom-1 right-1 bg-black/60 text-white text-[10px] px-1.5 py-0.5 rounded">
              📷 {mediaCount}
            </div>
          )}
          <span className={`badge absolute top-1 right-1 ${PROPERTY_STATUS_COLOR[p.status]}`}>
            {PROPERTY_STATUS_LABEL[p.status]}
          </span>
        </div>
      )}
      <div className="p-3">
        <div className="flex items-start justify-between gap-2 mb-1">
          <div className="min-w-0">
            <div className="font-semibold text-slate-800 truncate text-sm">
              {p.code}
              {p.name && <span className="text-slate-500 font-normal ml-1">· {p.name}</span>}
            </div>
            <div className="text-xs text-slate-500 mt-0.5">
              {PROPERTY_TYPE_LABEL[p.type]} · {p.district}
            </div>
          </div>
        </div>
        <div className="text-xs text-slate-600 line-clamp-2 mb-2">{p.address}</div>
        <div className="flex items-end justify-between text-xs">
          <div className="text-slate-500">{formatArea(p)}</div>
          <div className="font-semibold text-brand-600">{formatPrice(p)}</div>
        </div>
      </div>
    </Link>
  )
}
