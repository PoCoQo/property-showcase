import { Routes, Route, Navigate } from 'react-router-dom'
import { useEffect, useState } from 'react'
import Home from './pages/Home'
import Login from './pages/Login'
import Admin from './pages/Admin'
import PropertyDetail from './pages/PropertyDetail'
import Header from './components/Header'
import { getCurrentAdmin, type AdminUser } from './lib/auth'

/** 全局事件名：登录态变化（登录/登出后 dispatch） */
export const AUTH_CHANGED_EVENT = 'auth-changed'

export default function App() {
  const [admin, setAdmin] = useState<AdminUser | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    let mounted = true
    const refresh = () => {
      getCurrentAdmin().then((u) => {
        if (mounted) setAdmin(u)
      })
    }
    refresh()
    setLoading(false)
    // 监听 Login / Logout 触发的事件
    window.addEventListener(AUTH_CHANGED_EVENT, refresh)
    return () => {
      mounted = false
      window.removeEventListener(AUTH_CHANGED_EVENT, refresh)
    }
  }, [])

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center text-slate-500">
        加载中…
      </div>
    )
  }

  return (
    <div className="min-h-screen flex flex-col">
      <Header session={admin} />
      <main className="flex-1">
        <Routes>
          <Route path="/" element={<Home />} />
          <Route path="/property/:id" element={<PropertyDetail />} />
          <Route
            path="/admin"
            element={admin ? <Admin /> : <Navigate to="/login" replace />}
          />
          <Route
            path="/login"
            element={admin ? <Navigate to="/admin" replace /> : <Login />}
          />
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </main>
      <footer className="py-4 text-center text-xs text-slate-400 border-t border-slate-100">
        © 白云城建 · 物业展示系统
      </footer>
    </div>
  )
}
