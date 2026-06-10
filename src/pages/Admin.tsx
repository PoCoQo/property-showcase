import { useEffect, useState } from 'react'
import {
  fetchProperties,
  insertProperty,
  updateProperty,
  deleteProperty,
} from '../lib/api'
import {
  DISTRICTS,
  PROPERTY_STATUS_LABEL,
  PROPERTY_TYPE_LABEL,
} from '../lib/types'
import type {
  District,
  MediaItem,
  Property,
  PropertyInput,
  PropertyStatus,
  PropertyType,
} from '../lib/types'
import MediaUploader from '../components/MediaUploader'

const EMPTY_FORM: PropertyInput = {
  code: '',
  name: '',
  type: 'shop',
  district: '白云区',
  address: '',
  area: null,
  status: 'vacant',
  price_min: null,
  price_max: null,
  latitude: null,
  longitude: null,
  description: '',
  contact: '',
  media: [],
}

export default function Admin() {
  const [list, setList] = useState<Property[]>([])
  const [loading, setLoading] = useState(true)
  const [editing, setEditing] = useState<Property | 'new' | null>(null)
  const [form, setForm] = useState<PropertyInput>(EMPTY_FORM)
  const [saving, setSaving] = useState(false)
  const [search, setSearch] = useState('')

  const load = async () => {
    setLoading(true)
    try {
      const data = await fetchProperties()
      setList(data)
    } catch (e) {
      console.error(e)
    }
    setLoading(false)
  }

  useEffect(() => {
    load()
  }, [])

  const openNew = () => {
    setForm(EMPTY_FORM)
    setEditing('new')
  }

  const openEdit = (p: Property) => {
    setForm({
      code: p.code,
      name: p.name ?? '',
      type: p.type,
      district: p.district,
      address: p.address,
      area: p.area,
      status: p.status,
      price_min: p.price_min,
      price_max: p.price_max,
      latitude: p.latitude,
      longitude: p.longitude,
      description: p.description ?? '',
      contact: p.contact ?? '',
      media: p.media ?? [],
    })
    setEditing(p)
  }

  const close = () => {
    setEditing(null)
    setForm(EMPTY_FORM)
  }

  const save = async (e: React.FormEvent) => {
    e.preventDefault()
    setSaving(true)
    // 清洗：空字符串转 null
    const payload: PropertyInput = {
      ...form,
      name: form.name?.trim() || null,
      address: form.address.trim(),
      description: form.description?.trim() || null,
      contact: form.contact?.trim() || null,
      area: form.area === ('' as any) || form.area == null ? null : Number(form.area),
      price_min: form.price_min === ('' as any) || form.price_min == null ? null : Number(form.price_min),
      price_max: form.price_max === ('' as any) || form.price_max == null ? null : Number(form.price_max),
      latitude: form.latitude === ('' as any) || form.latitude == null ? null : Number(form.latitude),
      longitude: form.longitude === ('' as any) || form.longitude == null ? null : Number(form.longitude),
    } as PropertyInput

    let result: { error?: string }
    if (editing && editing !== 'new') {
      result = await updateProperty(editing.id, payload)
    } else {
      result = await insertProperty(payload)
    }
    setSaving(false)
    if (result.error) {
      alert('保存失败: ' + result.error)
    } else {
      close()
      load()
    }
  }

  const remove = async (p: Property) => {
    if (!confirm(`确认删除「${p.code}」？此操作不可恢复。`)) return
    const result = await deleteProperty(p.id)
    if (result.error) alert('删除失败: ' + result.error)
    else load()
  }

  const filtered = list.filter((p) => {
    if (!search.trim()) return true
    const kw = search.toLowerCase()
    return (
      p.code.toLowerCase().includes(kw) ||
      (p.name ?? '').toLowerCase().includes(kw) ||
      p.address.toLowerCase().includes(kw)
    )
  })

  return (
    <div className="max-w-6xl mx-auto px-4 py-4">
      <div className="flex items-center justify-between mb-4 flex-wrap gap-2">
        <h1 className="text-xl font-bold text-slate-800">管理后台</h1>
        <button onClick={openNew} className="btn-primary">+ 新增物业</button>
      </div>

      <div className="card mb-3">
        <input
          className="input"
          placeholder="搜索编号、名称、地址…"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
        />
      </div>

      {loading ? (
        <div className="text-center py-12 text-slate-400">加载中…</div>
      ) : (
        <div className="card overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="text-left text-slate-500 border-b border-slate-100">
              <tr>
                <th className="py-2 pr-3">编号</th>
                <th className="py-2 pr-3">类型</th>
                <th className="py-2 pr-3">区</th>
                <th className="py-2 pr-3">地址</th>
                <th className="py-2 pr-3">面积</th>
                <th className="py-2 pr-3">状态</th>
                <th className="py-2 pr-3">租金</th>
                <th className="py-2 pr-3">操作</th>
              </tr>
            </thead>
            <tbody>
              {filtered.map((p) => (
                <tr key={p.id} className="border-b border-slate-50 hover:bg-slate-50">
                  <td className="py-2 pr-3 font-medium text-slate-800">{p.code}</td>
                  <td className="py-2 pr-3">{PROPERTY_TYPE_LABEL[p.type]}</td>
                  <td className="py-2 pr-3">{p.district}</td>
                  <td className="py-2 pr-3 text-slate-600 max-w-[200px] truncate">
                    {p.address}
                  </td>
                  <td className="py-2 pr-3">{p.area ?? '—'}</td>
                  <td className="py-2 pr-3">{PROPERTY_STATUS_LABEL[p.status]}</td>
                  <td className="py-2 pr-3 text-brand-600">
                    {p.price_min ?? p.price_max
                      ? `¥${p.price_min ?? '?'}–${p.price_max ?? '?'}`
                      : '—'}
                  </td>
                  <td className="py-2 pr-3">
                    <div className="flex gap-2">
                      <button
                        onClick={() => openEdit(p)}
                        className="text-brand-600 hover:underline"
                      >
                        编辑
                      </button>
                      <button
                        onClick={() => remove(p)}
                        className="text-red-500 hover:underline"
                      >
                        删除
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
              {filtered.length === 0 && (
                <tr>
                  <td colSpan={8} className="py-8 text-center text-slate-400">
                    暂无数据
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      )}

      {/* 编辑弹窗 */}
      {editing && (
        <div className="fixed inset-0 bg-black/40 z-50 flex items-center justify-center p-4">
          <form
            onSubmit={save}
            className="bg-white rounded-2xl shadow-xl w-full max-w-2xl max-h-[90vh] overflow-y-auto"
          >
            <div className="p-5 border-b border-slate-100 sticky top-0 bg-white">
              <h2 className="text-lg font-bold text-slate-800">
                {editing === 'new' ? '新增物业' : `编辑 ${editing.code}`}
              </h2>
            </div>

            <div className="p-5 grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="label">编号 *</label>
                <input
                  className="input"
                  value={form.code}
                  onChange={(e) => setForm({ ...form, code: e.target.value })}
                  required
                />
              </div>
              <div>
                <label className="label">名称（可选）</label>
                <input
                  className="input"
                  value={form.name ?? ''}
                  onChange={(e) => setForm({ ...form, name: e.target.value })}
                />
              </div>

              <div>
                <label className="label">类型 *</label>
                <select
                  className="input"
                  value={form.type}
                  onChange={(e) => setForm({ ...form, type: e.target.value as PropertyType })}
                >
                  <option value="shop">商铺</option>
                  <option value="parking">车位</option>
                </select>
              </div>

              <div>
                <label className="label">区 *</label>
                <select
                  className="input"
                  value={form.district}
                  onChange={(e) => setForm({ ...form, district: e.target.value as District })}
                >
                  {DISTRICTS.map((d) => (
                    <option key={d} value={d}>
                      {d}
                    </option>
                  ))}
                </select>
              </div>

              <div className="sm:col-span-2">
                <label className="label">详细地址 *</label>
                <input
                  className="input"
                  value={form.address}
                  onChange={(e) => setForm({ ...form, address: e.target.value })}
                  required
                />
              </div>

              <div>
                <label className="label">面积 (m²)</label>
                <input
                  type="number"
                  step="0.01"
                  className="input"
                  value={form.area ?? ''}
                  onChange={(e) =>
                    setForm({ ...form, area: e.target.value === '' ? null : Number(e.target.value) })
                  }
                />
              </div>

              <div>
                <label className="label">状态 *</label>
                <select
                  className="input"
                  value={form.status}
                  onChange={(e) => setForm({ ...form, status: e.target.value as PropertyStatus })}
                >
                  <option value="vacant">空置</option>
                  <option value="rented">已租</option>
                  <option value="reserved">已预订</option>
                </select>
              </div>

              <div>
                <label className="label">租金下限 (元/月)</label>
                <input
                  type="number"
                  className="input"
                  value={form.price_min ?? ''}
                  onChange={(e) =>
                    setForm({ ...form, price_min: e.target.value === '' ? null : Number(e.target.value) })
                  }
                />
              </div>
              <div>
                <label className="label">租金上限 (元/月)</label>
                <input
                  type="number"
                  className="input"
                  value={form.price_max ?? ''}
                  onChange={(e) =>
                    setForm({ ...form, price_max: e.target.value === '' ? null : Number(e.target.value) })
                  }
                />
              </div>

              <div>
                <label className="label">纬度（地图用）</label>
                <input
                  type="number"
                  step="0.000001"
                  className="input"
                  value={form.latitude ?? ''}
                  onChange={(e) =>
                    setForm({ ...form, latitude: e.target.value === '' ? null : Number(e.target.value) })
                  }
                  placeholder="如 23.1291"
                />
              </div>
              <div>
                <label className="label">经度（地图用）</label>
                <input
                  type="number"
                  step="0.000001"
                  className="input"
                  value={form.longitude ?? ''}
                  onChange={(e) =>
                    setForm({ ...form, longitude: e.target.value === '' ? null : Number(e.target.value) })
                  }
                  placeholder="如 113.2644"
                />
              </div>

              <div className="sm:col-span-2">
                <label className="label">联系电话 / 微信</label>
                <input
                  className="input"
                  value={form.contact ?? ''}
                  onChange={(e) => setForm({ ...form, contact: e.target.value })}
                />
              </div>

              <div className="sm:col-span-2">
                <label className="label">备注</label>
                <textarea
                  className="input min-h-[80px]"
                  value={form.description ?? ''}
                  onChange={(e) => setForm({ ...form, description: e.target.value })}
                />
              </div>

              <div className="sm:col-span-2">
                <MediaUploader
                  value={form.media ?? []}
                  onChange={(media: MediaItem[]) => setForm({ ...form, media })}
                  disabled={saving}
                />
              </div>
            </div>

            <div className="p-5 border-t border-slate-100 flex justify-end gap-2 sticky bottom-0 bg-white">
              <button type="button" onClick={close} className="btn-secondary">
                取消
              </button>
              <button type="submit" className="btn-primary" disabled={saving}>
                {saving ? '保存中…' : '保存'}
              </button>
            </div>
          </form>
        </div>
      )}
    </div>
  )
}
