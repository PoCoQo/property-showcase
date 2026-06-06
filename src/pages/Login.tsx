import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { adminLogin, rememberUsername } from '../lib/auth'

export default function Login() {
  const navigate = useNavigate()
  const [username, setUsername] = useState('')
  const [password, setPassword] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setError(null)
    try {
      await adminLogin(username, password)
      rememberUsername(username)
      navigate('/admin')
    } catch (e: any) {
      setError(e?.message || '登录失败')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="max-w-md mx-auto px-4 py-12">
      <div className="card">
        <h1 className="text-xl font-bold mb-1 text-slate-800">管理员登录</h1>
        <p className="text-sm text-slate-500 mb-4">
          用 CloudBase 中已创建的管理员账号登录
        </p>

        <form onSubmit={handleLogin} className="space-y-3">
          <div>
            <label className="label">用户名</label>
            <input
              className="input"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              required
              autoComplete="username"
            />
          </div>
          <div>
            <label className="label">密码</label>
            <input
              type="password"
              className="input"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              minLength={6}
              autoComplete="current-password"
            />
          </div>

          {error && (
            <div className="text-sm text-red-600 bg-red-50 border border-red-100 rounded-lg px-3 py-2">
              {error}
            </div>
          )}

          <button type="submit" className="btn-primary w-full" disabled={loading}>
            {loading ? '登录中…' : '登录'}
          </button>
        </form>
      </div>
    </div>
  )
}
