// 数据访问层
// 把 CloudBase 文档数据库的 API 封装成业务函数，
// 业务组件不需要直接碰 CloudBase SDK。

import { db } from './cloudbase'
import type { Property, PropertyInput } from './types'

const COL = 'properties'

/** CloudBase 文档（_id 主键）→ 业务 Property（id 字段） */
function toProperty(doc: any): Property {
  if (!doc) return doc
  const { _id, ...rest } = doc
  return { id: _id, ...rest } as Property
}

/** 读取所有物业（按区域、编号排序） */
export async function fetchProperties(): Promise<Property[]> {
  const res = await db
    .collection(COL)
    .orderBy('district', 'asc')
    .orderBy('code', 'asc')
    .get()
  return (res.data || []).map(toProperty)
}

/** 新增物业 */
export async function insertProperty(
  payload: PropertyInput
): Promise<{ error?: string }> {
  try {
    const now = Date.now()
    await db.collection(COL).add({
      ...payload,
      created_at: now,
      updated_at: now,
    })
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
    await db.collection(COL).doc(id).update({
      ...payload,
      updated_at: Date.now(),
    })
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
    await db.collection(COL).doc(id).remove()
    return {}
  } catch (e: any) {
    return { error: e?.message || '删除失败' }
  }
}
