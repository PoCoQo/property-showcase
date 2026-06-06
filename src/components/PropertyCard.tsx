import type { Property } from '../lib/types'
import {
  PROPERTY_TYPE_LABEL,
  PROPERTY_STATUS_LABEL,
  PROPERTY_STATUS_COLOR,
} from '../lib/types'

interface Props {
  p: Property
  onClick?: () => void
  active?: boolean
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

export default function PropertyCard({ p, onClick, active }: Props) {
  return (
    <div
      onClick={onClick}
      className={`card cursor-pointer transition-all hover:shadow-md ${
        active ? 'ring-2 ring-brand-500 border-brand-200' : ''
      }`}
    >
      <div className="flex items-start justify-between gap-2 mb-2">
        <div className="min-w-0">
          <div className="font-semibold text-slate-800 truncate">
            {p.code}
            {p.name && <span className="text-slate-500 font-normal ml-1">· {p.name}</span>}
          </div>
          <div className="text-xs text-slate-500 mt-0.5">
            {PROPERTY_TYPE_LABEL[p.type]} · {p.district}
          </div>
        </div>
        <span className={`badge ${PROPERTY_STATUS_COLOR[p.status]}`}>
          {PROPERTY_STATUS_LABEL[p.status]}
        </span>
      </div>

      <div className="text-sm text-slate-600 line-clamp-2 mb-3">{p.address}</div>

      <div className="flex items-end justify-between text-sm">
        <div className="text-slate-500">{formatArea(p)}</div>
        <div className="font-semibold text-brand-600">{formatPrice(p)}</div>
      </div>
    </div>
  )
}
