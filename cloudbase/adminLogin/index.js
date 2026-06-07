// CloudBase 云函数：adminLogin
// 用途：管理员登录验证，签发 HMAC token
//
// 调用方式：HTTP 触发访问（POST application/json）
//   - URL:    https://${ENV_ID}.ap-shanghai.tencentscf.com/adminLogin
//   - Header: Content-Type: application/json
//   - Body:   { "username": "...", "password": "..." }
//
// 返回：{ code: 0, data: { token, user: { uid, username } } }
//
// 配套数据集合：admins（字段：username, password）

const cloudbase = require('@cloudbase/node-sdk')
const crypto = require('crypto')

// 环境 ID 与 token 签名密钥（演示用，生产请挪到 env / KMS）
const ENV_ID = 'bycjh5-d9g7g8uuk3d4137d2'
const TOKEN_SECRET = 'byc-token-secret-2026-change-me'

/** 简单的 HMAC 签名 token */
function signToken(payload) {
  const body = Buffer.from(JSON.stringify(payload)).toString('base64url')
  const sig = crypto
    .createHmac('sha256', TOKEN_SECRET)
    .update(body)
    .digest('base64url')
  return `${body}.${sig}`
}

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

function getParams(event) {
  if (event.body && typeof event.body === 'string') {
    try { return JSON.parse(event.body) } catch {}
  }
  if (event.queryStringParameters) {
    return { ...event, ...event.queryStringParameters }
  }
  return event || {}
}

exports.main = async (event, context) => {
  // CORS 预检
  if (event && event.httpMethod === 'OPTIONS') {
    return respond(200, { code: 0, data: 'ok' })
  }

  const params = getParams(event)
  const { username, password } = params

  if (!username || !password) {
    return respond(400, { code: 400, message: '用户名或密码不能为空' })
  }

  // 云函数内 SDK 是好用的，直接 init
  const app = cloudbase.init({ env: ENV_ID })
  const db = app.database()

  try {
    const res = await db.collection('admins').where({ username }).limit(1).get()
    if (!res.data || res.data.length === 0) {
      return respond(401, { code: 401, message: '账号或密码错误' })
    }
    const admin = res.data[0]
    if (admin.password !== password) {
      return respond(401, { code: 401, message: '账号或密码错误' })
    }

    // 签发 token（有效期 7 天）
    const token = signToken({
      uid: admin._id,
      username: admin.username,
      exp: Date.now() + 7 * 24 * 60 * 60 * 1000,
    })

    return respond(200, {
      code: 0,
      data: {
        token,
        user: { uid: admin._id, username: admin.username },
      },
    })
  } catch (e) {
    return respond(500, {
      code: 500,
      message: '服务异常：' + (e && e.message ? e.message : String(e)),
    })
  }
}
