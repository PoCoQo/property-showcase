// 管理员登录
// 调 adminLogin 云函数拿到 token，存到 localStorage。
// 不再用 @cloudbase/js-sdk 的 signInWithCustomAuth（跟 HMAC token 不兼容）。

import { callFunction, getRememberedUsername, getToken, rememberUsername, setToken } from './http'

export interface AdminUser {
  uid: string
  username: string
}

interface LoginResult {
  token: string
  user: AdminUser
}

/** 登录：调 adminLogin，存 token 和 username */
export async function adminLogin(
  username: string,
  password: string
): Promise<AdminUser> {
  const data = await callFunction<LoginResult>('adminLogin', {
    username,
    password,
  })
  setToken(data.token)
  rememberUsername(username)
  return data.user
}

/** 登出：清 token */
export async function adminLogout(): Promise<void> {
  setToken(null)
}

/** 取当前登录用户（没登录返回 null） */
export async function getCurrentAdmin(): Promise<AdminUser | null> {
  if (!getToken()) return null
  // 简单策略：localStorage 里有 token 就算登录态
  // 真正严谨的做法是再发一个 me 请求验证；这里先这样，等遇到 token 过期问题再加
  return {
    uid: 'self',
    username: getRememberedUsername(),
  }
}
