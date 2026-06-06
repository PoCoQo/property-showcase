import { Routes, Route, Navigate } from 'react-router-dom'
import { useEffect, useState } from 'react'
import Home from './pages/Home'
import Login from './pages/Login'
import Admin from './pages/Admin'
import Header from './components/Header'
import { auth } from './lib/cloudbase'
import { getCurrentAdmin, type AdminUser } from './lib/auth'

export default function App() {
  const [admin, setAdmin] = useState<AdminUser | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    let mounted = true
    getCurrentAdmin().then((u) => {
      if (!mounted) return
      setAdmin(u)
      setLoading(false)
    })
    // 监听登录态变化
    const handler = () => {
      getCurrentAdmin().then((u) => {
        if (mounted) setAdmin(u)
      })
    }
    // CloudBase Web SDK 提供 onLoginStateChanged
    // 用 type assertion 兼容不同 SDK 版本
    const a: any = auth
    if (typeof a.onLoginStateChanged === 'function') {
      a.onLoginStateChanged(handler)
    }
    return () => {
      mounted = false
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
