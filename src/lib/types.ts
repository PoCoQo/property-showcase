// 业务类型定义

export type PropertyType = 'shop' | 'parking'
export type PropertyStatus = 'vacant' | 'rented' | 'reserved'
export type District = '白云区' | '荔湾区' | '海珠区' | '越秀区'

export const DISTRICTS: District[] = ['白云区', '荔湾区', '海珠区', '越秀区']

export const PROPERTY_TYPE_LABEL: Record<PropertyType, string> = {
  shop: '商铺',
  parking: '车位',
}

export const PROPERTY_STATUS_LABEL: Record<PropertyStatus, string> = {
  vacant: '空置',
  rented: '已租',
  reserved: '已预订',
}

export const PROPERTY_STATUS_COLOR: Record<PropertyStatus, string> = {
  vacant: 'bg-emerald-100 text-emerald-700 border-emerald-200',
  rented: 'bg-slate-100 text-slate-600 border-slate-200',
  reserved: 'bg-amber-100 text-amber-700 border-amber-200',
}

export interface Property {
  id: string
  code: string
  name: string | null
  type: PropertyType
  district: District
  address: string
  area: number | null
  status: PropertyStatus
  price_min: number | null
  price_max: number | null
  latitude: number | null
  longitude: number | null
  description: string | null
  contact: string | null
  created_at: number
  updated_at: number
}

export type PropertyInput = Omit<Property, 'id' | 'created_at' | 'updated_at'>
