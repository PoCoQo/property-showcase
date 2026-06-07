// CloudBase 云函数：properties
// 用途：物业数据的 CRUD（list / get / create / update / delete）
//
// 调用方式：HTTP 触发访问（POST application/json）
//   - URL:      https://${ENV_ID}.ap-shanghai.tencentscf.com/properties
//   - Header:   Authorization: Bearer <token>     ← 写操作必填
//   - Header:   Content-Type: application/json
//   - Body:     { "action": "list" | "get" | "create" | "update" | "delete", ... }
//
// 读操作（list/get）公开访问，写操作（create/update/delete）必须带登录 token。
//
// 配套数据集合：properties 集合（_id 主键，字段同前端 Property 类型）

const cloudbase = require('@cloudbase/node-sdk')
const crypto = require('crypto')

// 跟 adminLogin 共用同一份环境配置和密钥
const ENV_ID = 'bycjh5-d9g7g8uuk3d4137d2'
const TOKEN_SECRET = 'byc-token-secret-2026-change-me'

const COL = 'properties'

/** 验证 HMAC token，返回 payload；过期/伪造返回 null */
function verifyToken(token) {
  if (!token) return null
  const [body, sig] = String(token).split('.')
  if (!body || !sig) return null
  const expected = crypto
    .createHmac('sha256', TOKEN_SECRET)
    .update(body)
    .digest('base64url')
  if (expected !== sig) return null
  try {
    const payload = JSON.parse(Buffer.from(body, 'base64url').toString('utf8'))
    if (!payload.exp || payload.exp < Date.now()) return null
    return payload
  } catch {
    return null
  }
}

function getToken(event) {
  const h = event.headers || event.multiValueHeaders || {}
  const a = h.Authorization || h.authorization || ''
  if (a.startsWith('Bearer ')) return a.slice(7)
  if (event.queryStringParameters && event.queryStringParameters.token) {
    return event.queryStringParameters.token
  }
  return null
}

function getParams(event) {
  // 兼容 HTTP 触发（body 是字符串）、直接调用、query
  if (event.body && typeof event.body === 'string') {
    try { return JSON.parse(event.body) } catch {}
  }
  if (event.queryStringParameters) {
    // 简单合并 query
    return { ...event, ...event.queryStringParameters }
  }
  return event
}

/** 统一返回 + CORS */
function respond(statusCode, payload) {
  return {
    statusCode,
    headers: {
      'Content-Type': 'application/json; charset=utf-8',
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Headers': 'Content-Type, Authorization',
      'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
      'Access-Control-Max-Age': '86400',
    },
    body: JSON.stringify(payload),
  }
}

/** CloudBase 文档（_id 主键）→ 业务 Property（id 字段） */
function toProperty(doc) {
  if (!doc) return doc
  const { _id, ...rest } = doc
  return { id: _id, ...rest }
}

exports.main = async (event, context) => {
  // 处理 CORS 预检
  if (event && event.httpMethod === 'OPTIONS') {
    return respond(200, { code: 0, data: 'ok' })
  }

  const params = getParams(event) || {}
  const action = params.action
  const tokenPayload = verifyToken(getToken(event))

  // 数据库连接（云函数内 SDK 是好用的）
  const app = cloudbase.init({ env: ENV_ID })
  const db = app.database()

  try {
    // 读操作：公开
    if (action === 'list') {
      const res = await db
        .collection(COL)
        .orderBy('district', 'asc')
        .orderBy('code', 'asc')
        .get()
      return respond(200, { code: 0, data: (res.data || []).map(toProperty) })
    }

    if (action === 'get') {
      const id = params.id
      if (!id) return respond(400, { code: 400, message: 'id 必填' })
      const res = await db.collection(COL).doc(id).get()
      if (!res.data || !res.data[0]) {
        return respond(404, { code: 404, message: '未找到' })
      }
      return respond(200, { code: 0, data: toProperty(res.data[0]) })
    }

    // 写操作：必须登录
    if (!tokenPayload) {
      return respond(401, { code: 401, message: '未登录或登录已过期' })
    }

    if (action === 'create') {
      const data = params.data
      if (!data || typeof data !== 'object') {
        return respond(400, { code: 400, message: 'data 必填' })
      }
      const now = Date.now()
      const doc = { ...data, created_at: now, updated_at: now }
      const res = await db.collection(COL).add(doc)
      return respond(200, { code: 0, data: { id: res.id, ...doc } })
    }

    if (action === 'update') {
      const { id, data } = params
      if (!id) return respond(400, { code: 400, message: 'id 必填' })
      if (!data || typeof data !== 'object') {
        return respond(400, { code: 400, message: 'data 必填' })
      }
      const update = { ...data, updated_at: Date.now() }
      await db.collection(COL).doc(id).update(update)
      return respond(200, { code: 0, data: { id, ...update } })
    }

    if (action === 'delete') {
      const id = params.id
      if (!id) return respond(400, { code: 400, message: 'id 必填' })
      await db.collection(COL).doc(id).remove()
      return respond(200, { code: 0, data: { id } })
    }

    return respond(400, { code: 400, message: '未知 action: ' + action })
  } catch (e) {
    return respond(500, {
      code: 500,
      message: '服务异常：' + (e && e.message ? e.message : String(e)),
    })
  }
}
