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

/** CloudBase 文档（_id 主键）→ 业务 Property（id 字段）
 *  兜底：旧数据从 Supabase 迁过来时 price 字段只有单值、没有 price_min/price_max，
 *  这里统一补成 min=max=price，保证前端永远能渲染。
 */
function toProperty(doc) {
  if (!doc) return doc
  const { _id, ...rest } = doc
  // 兜底 1：旧 price 字段补成 price_min/price_max
  const legacyPrice = rest.price
  if (legacyPrice != null) {
    if (rest.price_min == null) rest.price_min = legacyPrice
    if (rest.price_max == null) rest.price_max = legacyPrice
    delete rest.price
  }
  // 兜底 2：DB 里同时存了 lat/lng 和 latitude/longitude 两套，
  // 前端只用 latitude/longitude。这里把 lat/lng 复制过去，统一字段名。
  if (rest.latitude == null && rest.lat != null) rest.latitude = rest.lat
  if (rest.longitude == null && rest.lng != null) rest.longitude = rest.lng
  // 兜底 3：name / title 双轨
  if (rest.name == null && rest.title != null) rest.name = rest.title
  // 兜底 4：media 缺省值（保证前端有数组可遍历）
  if (!Array.isArray(rest.media)) rest.media = []
  // code 从 _id 截前 8 位（统一展示编号）
  const code = rest.code || (_id ? String(_id).slice(0, 8).toUpperCase() : '')
  return { id: _id, ...rest, code }
}

/** 安全过滤：剔除不可更新的字段（_id / id），以及 undefined 值 */
function buildUpdate(data) {
  const out = {}
  for (const [k, v] of Object.entries(data || {})) {
    if (k === '_id' || k === 'id') continue
    if (v === undefined) continue
    out[k] = v
  }
  return out
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
      const safeData = buildUpdate(data)
      const doc = { ...safeData, created_at: now, updated_at: now }
      const res = await db.collection(COL).add(doc)
      return respond(200, { code: 0, data: { id: res.id, ...doc } })
    }

    if (action === 'update') {
      const { id, data } = params
      if (!id) return respond(400, { code: 400, message: 'id 必填' })
      if (!data || typeof data !== 'object') {
        return respond(400, { code: 400, message: 'data 必填' })
      }
      const safeData = buildUpdate(data)
      console.log('[properties.update]', id, JSON.stringify(safeData))
      // 显式 $set：只更新指定字段，绝不丢未传字段；防呆
      await db
        .collection(COL)
        .doc(id)
        .update({ $set: { ...safeData, updated_at: Date.now() } })
      return respond(200, { code: 0, data: { id, ...safeData, updated_at: Date.now() } })
    }

    if (action === 'delete') {
      const id = params.id
      if (!id) return respond(400, { code: 400, message: 'id 必填' })
      await db.collection(COL).doc(id).remove()
      return respond(200, { code: 0, data: { id } })
    }

    // 媒体上传：接收前端传来的 data URL（base64），写入 CloudBase 存储
    // 限制单文件 4MB（图片和短视频都够用；大视频以后升级到签名 URL 直传）
    if (action === 'upload_media') {
      const { fileName, dataUrl, mediaType } = params
      if (!fileName || !dataUrl) {
        return respond(400, { code: 400, message: 'fileName/dataUrl 必填' })
      }
      if (!['image', 'video'].includes(mediaType)) {
        return respond(400, { code: 400, message: 'mediaType 必须是 image 或 video' })
      }
      const m = /^data:([^;]+);base64,(.+)$/.exec(dataUrl)
      if (!m) {
        return respond(400, { code: 400, message: 'dataUrl 格式错误（需为 data:mime;base64,...）' })
      }
      const buffer = Buffer.from(m[2], 'base64')
      if (buffer.length > 4 * 1024 * 1024) {
        return respond(413, {
          code: 413,
          message: `文件 ${(buffer.length / 1024 / 1024).toFixed(1)}MB 超过 4MB 上限，请压缩后再上传`,
        })
      }
      // 安全化文件名 + 加时间戳避免重名
      const ext = (fileName.split('.').pop() || (mediaType === 'image' ? 'jpg' : 'mp4')).toLowerCase()
      const safeBase = fileName
        .replace(/\.[^.]+$/, '')
        .replace(/[^a-zA-Z0-9._-]/g, '_')
        .slice(0, 40) || 'file'
      const cloudPath = `property-media/${mediaType}s/${Date.now()}-${safeBase}.${ext}`
      try {
        const result = await app.uploadFile({ cloudPath, fileContent: buffer })
        return respond(200, {
          code: 0,
          data: {
            url: result.fileID, // cloud://... 格式
            download_url: result.download_url, // https:// 可直接用
            cloudPath,
            size: buffer.length,
            mediaType,
          },
        })
      } catch (e) {
        return respond(500, { code: 500, message: '上传失败：' + (e.message || String(e)) })
      }
    }

    return respond(400, { code: 400, message: '未知 action: ' + action })
  } catch (e) {
    return respond(500, {
      code: 500,
      message: '服务异常：' + (e && e.message ? e.message : String(e)),
    })
  }
}
