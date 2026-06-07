import { Link, useNavigate } from 'react-router-dom'
import type { AdminUser } from '../lib/auth'
import { adminLogout } from '../lib/auth'
import { AUTH_CHANGED_EVENT } from '../App'

interface Props {
  session: AdminUser | null
}

export default function Header({ session }: Props) {
  const navigate = useNavigate()
  const handleLogout = async () => {
    await adminLogout()
    window.dispatchEvent(new Event(AUTH_CHANGED_EVENT))
    navigate('/')
  }

  return (
    <header className="bg-white border-b border-slate-100 sticky top-0 z-30">
      <div className="max-w-6xl mx-auto px-4 h-14 flex items-center justify-between">
        <Link to="/" className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-lg bg-brand-500 text-white flex items-center justify-center font-bold">
            云
          </div>
          <span className="font-semibold text-slate-800">白云城建物业</span>
        </Link>
        <nav className="flex items-center gap-2 text-sm">
          {session ? (
            <>
              <Link to="/admin" className="btn-secondary">管理后台</Link>
              <button onClick={handleLogout} className="btn-secondary">退出</button>
            </>
          ) : (
            <Link to="/login" className="btn-secondary">管理员登录</Link>
          )}
        </nav>
      </div>
    </header>
  )
}
