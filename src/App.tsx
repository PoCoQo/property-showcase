import { Routes, Route, Navigate } from 'react-router-dom'
import Home from './pages/Home'
import Login from './pages/Login'
import Admin from './pages/Admin'
import Header from './components/Header'
import { useEffect, useState } from 'react'
import { supabase } from './lib/supabase'
import type { Session } from '@supabase/supabase-js'

export default function App() {
  const [session, setSession] = useState<Session | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    supabase.auth.getSession().then(({ data }) => {
      setSession(data.session)
      setLoading(false)
    })
    const { data: sub } = supabase.auth.onAuthStateChange((_e, s) => {
      setSession(s)
    })
    return () => sub.subscription.unsubscribe()
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
      <Header session={session} />
      <main className="flex-1">
        <Routes>
          <Route path="/" element={<Home />} />
          <Route
            path="/admin"
            element={session ? <Admin /> : <Navigate to="/login" replace />}
          />
          <Route
            path="/login"
            element={session ? <Navigate to="/admin" replace /> : <Login />}
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
