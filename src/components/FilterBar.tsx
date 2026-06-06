import { DISTRICTS } from '../lib/types'
import type { District, PropertyType, PropertyStatus } from '../lib/types'

export interface Filter {
  district: District | 'all'
  type: PropertyType | 'all'
  status: PropertyStatus | 'all'
  keyword: string
}

interface Props {
  value: Filter
  onChange: (v: Filter) => void
  total: number
  visible: number
}

function Tab({
  active,
  onClick,
  children,
}: {
  active: boolean
  onClick: () => void
  children: React.ReactNode
}) {
  return (
    <button
      onClick={onClick}
      className={`px-3 py-1.5 rounded-full text-sm transition-colors ${
        active
          ? 'bg-brand-500 text-white'
          : 'bg-white text-slate-600 border border-slate-200 hover:bg-slate-50'
      }`}
    >
      {children}
    </button>
  )
}

export default function FilterBar({ value, onChange, total, visible }: Props) {
  return (
    <div className="space-y-3">
      <div className="flex items-center gap-2">
        <input
          type="text"
          placeholder="搜索编号、地址…"
          className="input"
          value={value.keyword}
          onChange={(e) => onChange({ ...value, keyword: e.target.value })}
        />
      </div>

      <div className="flex flex-wrap gap-1.5 items-center">
        <span className="text-xs text-slate-500 mr-1">区:</span>
        <Tab
          active={value.district === 'all'}
          onClick={() => onChange({ ...value, district: 'all' })}
        >
          全部
        </Tab>
        {DISTRICTS.map((d) => (
          <Tab
            key={d}
            active={value.district === d}
            onClick={() => onChange({ ...value, district: d })}
          >
            {d}
          </Tab>
        ))}
      </div>

      <div className="flex flex-wrap gap-1.5 items-center">
        <span className="text-xs text-slate-500 mr-1">类型:</span>
        <Tab
          active={value.type === 'all'}
          onClick={() => onChange({ ...value, type: 'all' })}
        >
          全部
        </Tab>
        <Tab
          active={value.type === 'shop'}
          onClick={() => onChange({ ...value, type: 'shop' })}
        >
          商铺
        </Tab>
        <Tab
          active={value.type === 'parking'}
          onClick={() => onChange({ ...value, type: 'parking' })}
        >
          车位
        </Tab>

        <span className="text-xs text-slate-500 ml-3 mr-1">状态:</span>
        <Tab
          active={value.status === 'all'}
          onClick={() => onChange({ ...value, status: 'all' })}
        >
          全部
        </Tab>
        <Tab
          active={value.status === 'vacant'}
          onClick={() => onChange({ ...value, status: 'vacant' })}
        >
          空置
        </Tab>
        <Tab
          active={value.status === 'rented'}
          onClick={() => onChange({ ...value, status: 'rented' })}
        >
          已租
        </Tab>
      </div>

      <div className="text-xs text-slate-500">
        共 {total} 条，当前显示 {visible} 条
      </div>
    </div>
  )
}
