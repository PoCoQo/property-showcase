// 数据访问层
// 业务组件只需要调这些函数，不直接碰 HTTP / CloudBase。
//
// 所有 CRUD 都走 CloudBase properties 云函数（HTTP 触发），
// 写操作需要带登录 token。

import { callFunction } from './http'
import type { Property, PropertyInput } from './types'

/** 读取所有物业（按区域、编号排序） */
export async function fetchProperties(): Promise<Property[]> {
  return callFunction<Property[]>('properties', { action: 'list' })
}

/** 读取单个物业（公开访问） */
export async function fetchProperty(id: string): Promise<Property> {
  return callFunction<Property>('properties', { action: 'get', id })
}

/** 新增物业 */
export async function insertProperty(
  payload: PropertyInput
): Promise<{ error?: string }> {
  try {
    const now = Date.now()
    await callFunction(
      'properties',
      {
        action: 'create',
        data: { ...payload, created_at: now, updated_at: now },
      },
      { requireAuth: true }
    )
    return {}
  } catch (e: any) {
    return { error: e?.message || '新增失败' }
  }
}

/** 更新物业 */
export async function updateProperty(
  id: string,
  payload: Partial<PropertyInput>
): Promise<{ error?: string }> {
  try {
    await callFunction(
      'properties',
      {
        action: 'update',
        id,
        data: { ...payload, updated_at: Date.now() },
      },
      { requireAuth: true }
    )
    return {}
  } catch (e: any) {
    return { error: e?.message || '更新失败' }
  }
}

/** 删除物业 */
export async function deleteProperty(
  id: string
): Promise<{ error?: string }> {
  try {
    await callFunction(
      'properties',
      { action: 'delete', id },
      { requireAuth: true }
    )
    return {}
  } catch (e: any) {
    return { error: e?.message || '删除失败' }
  }
}
