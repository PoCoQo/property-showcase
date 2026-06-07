// 通用 HTTP 客户端
// 直接 fetch CloudBase 云函数的 HTTP 触发端点，绕开 @cloudbase/js-sdk 在浏览器里的 endpoint 解析坑
//
// 所有云函数统一 POST application/json，body 里放 { action, ...params }
// 登录态：localStorage 里存 'admin_token'，请求时塞到 Authorization: Bearer <token>

const BASE_URL = (import.meta.env.VITE_CLOUDBASE_HTTP_URL || '').replace(/\/$/, '')

if (!BASE_URL) {
  // 静默：本地 dev 不会立刻用到，build 时会有
  // eslint-disable-next-line no-console
  console.warn(
    '[http] VITE_CLOUDBASE_HTTP_URL 未配置，云函数请求会失败'
  )
}

const TOKEN_KEY = 'admin_token'
const USERNAME_KEY = 'admin_username'

export function getToken(): string | null {
  try {
    return localStorage.getItem(TOKEN_KEY)
  } catch {
    return null
  }
}

export function setToken(token: string | null) {
  try {
    if (token) localStorage.setItem(TOKEN_KEY, token)
    else localStorage.removeItem(TOKEN_KEY)
  } catch {}
}

export function getRememberedUsername(): string {
  try {
    return localStorage.getItem(USERNAME_KEY) || ''
  } catch {
    return ''
  }
}

export function rememberUsername(username: string) {
  try {
    localStorage.setItem(USERNAME_KEY, username)
  } catch {}
}

export class ApiError extends Error {
  code: number
  status: number
  constructor(status: number, code: number, message: string) {
    super(message)
    this.name = 'ApiError'
    this.status = status
    this.code = code
  }
}

interface CallOptions {
  /** 是否需要登录（默认 false）。为 true 时 token 缺失会直接抛错。 */
  requireAuth?: boolean
}

/** 调一个云函数 */
export async function callFunction<T = any>(
  functionName: string,
  body: Record<string, any> = {},
  options: CallOptions = {}
): Promise<T> {
  if (!BASE_URL) {
    throw new ApiError(0, 0, 'VITE_CLOUDBASE_HTTP_URL 未配置')
  }

  const token = getToken()
  if (options.requireAuth && !token) {
    throw new ApiError(401, 401, '请先登录')
  }

  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
  }
  if (token) headers.Authorization = `Bearer ${token}`

  let res: Response
  try {
    res = await fetch(`${BASE_URL}/${functionName}`, {
      method: 'POST',
      headers,
      body: JSON.stringify(body),
    })
  } catch (e: any) {
    // 网络层错误：DNS / CORS / 离线
    throw new ApiError(0, 0, '网络请求失败：' + (e?.message || String(e)))
  }

  // 尝试读 body（即使是错误响应）
  let data: any = null
  try {
    data = await res.json()
  } catch {
    // 非 JSON 响应
    throw new ApiError(res.status, res.status, `HTTP ${res.status}`)
  }

  if (data && typeof data.code === 'number' && data.code !== 0) {
    throw new ApiError(res.status, data.code, data.message || '请求失败')
  }

  return (data && data.data !== undefined ? data.data : data) as T
}
