// 自定义登录 - 管理员认证
// 通过云函数 adminLogin 验证账号密码，返回 CloudBase 自定义登录 ticket
// 前端用 ticket 调 auth.signInWithCustomAuth() 完成登录

import { auth, app } from './cloudbase'

export interface AdminUser {
  uid: string
  username: string
}

/** 调云函数验证账号密码，拿到自定义登录 ticket */
async function getTicket(
  username: string,
  password: string
): Promise<string> {
  const res = await app.callFunction({
    name: 'adminLogin',
    data: { username, password },
  })
  if (res?.result?.code !== 0) {
    throw new Error(res?.result?.message || '登录失败')
  }
  return res.result.data.ticket
}

/** 登录 */
export async function adminLogin(
  username: string,
  password: string
): Promise<AdminUser> {
  const ticket = await getTicket(username, password)
  // 用 ticket 完成自定义登录
  await auth.signInWithCustomAuth!(ticket)
  const state = await auth.getLoginState()
  return {
    uid: state?.userInfo?.uid || state?.userInfo?.uuid || '',
    username,
  }
}

/** 登出 */
export async function adminLogout(): Promise<void> {
  try {
    await auth.signOut()
  } catch {
    // 静默
  }
}

/** 取当前登录用户（没登录返回 null） */
export async function getCurrentAdmin(): Promise<AdminUser | null> {
  const has = await auth.hasLoginState()
  if (!has) return null
  const state = await auth.getLoginState()
  if (!state) return null
  // CloudBase 自定义登录态里 userInfo 可能没有 username 字段，
  // 这里从本地 localStorage 读上次登录时存的 username
  let username = ''
  try {
    username = localStorage.getItem('admin_username') || ''
  } catch {}
  return {
    uid: state?.userInfo?.uid || state?.userInfo?.uuid || '',
    username,
  }
}

/** 记住 username（用于 getCurrentAdmin 展示） */
export function rememberUsername(username: string) {
  try {
    localStorage.setItem('admin_username', username)
  } catch {}
}
