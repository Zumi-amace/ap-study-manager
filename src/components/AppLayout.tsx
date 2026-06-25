import {
  BarChart3,
  BookOpenCheck,
  History,
  Home,
  Menu,
  Settings,
  Target,
  X
} from 'lucide-react';
import { useState } from 'react';
import { NavLink, Outlet } from 'react-router-dom';

const navigation = [
  { to: '/', label: 'ホーム', icon: Home },
  { to: '/log/new', label: 'ログ登録', icon: BookOpenCheck },
  { to: '/review', label: '復習予定', icon: Target },
  { to: '/weakness', label: '弱点分析', icon: BarChart3 },
  { to: '/history', label: '学習履歴', icon: History },
  { to: '/dashboard', label: 'ダッシュボード', icon: BarChart3 },
  { to: '/settings', label: '設定', icon: Settings }
];

export function AppLayout() {
  const [menuOpen, setMenuOpen] = useState(false);

  return (
    <div className="min-h-screen min-w-0 overflow-x-hidden bg-slate-50">
      <header className="sticky top-0 z-40 border-b border-slate-200 bg-white/95 backdrop-blur">
        <div className="mx-auto flex h-16 max-w-7xl items-center justify-between gap-2 px-3 sm:px-6">
          <NavLink
            to="/"
            className="flex min-w-0 items-center gap-2.5 sm:gap-3"
            onClick={() => setMenuOpen(false)}
          >
            <span className="grid h-10 w-10 shrink-0 place-items-center rounded-xl bg-brand-700 text-lg font-black text-white">
              AP
            </span>
            <div className="min-w-0">
              <p className="truncate text-sm font-bold leading-tight text-slate-900 sm:text-base">
                AP Study Manager
              </p>
              <p className="text-xs text-slate-500">午前対策・学習管理</p>
            </div>
          </NavLink>
          <button
            type="button"
            className="grid h-11 w-11 place-items-center rounded-xl text-slate-700 hover:bg-slate-100 md:hidden"
            aria-label="メニューを開く"
            onClick={() => setMenuOpen((open) => !open)}
          >
            {menuOpen ? <X /> : <Menu />}
          </button>
        </div>
      </header>

      <div className="mx-auto flex max-w-7xl">
        <aside
          className={`${menuOpen ? 'block' : 'hidden'} fixed inset-x-0 top-16 z-30 max-h-[calc(100dvh-4rem)] overflow-y-auto border-b border-slate-200 bg-white p-3 shadow-lg md:sticky md:top-16 md:block md:h-[calc(100vh-4rem)] md:max-h-none md:w-60 md:shrink-0 md:border-b-0 md:border-r md:p-4 md:shadow-none`}
        >
          <nav className="grid grid-cols-2 gap-1 max-[350px]:grid-cols-1 md:block">
            {navigation.map(({ to, label, icon: Icon }) => (
              <NavLink
                key={to}
                to={to}
                end={to === '/'}
                onClick={() => setMenuOpen(false)}
                className={({ isActive }) =>
                  `flex min-h-12 items-center gap-3 rounded-xl px-3 py-3 text-sm font-semibold transition ${
                    isActive
                      ? 'bg-brand-50 text-brand-800'
                      : 'text-slate-600 hover:bg-slate-100 hover:text-slate-900'
                  }`
                }
              >
                <Icon size={19} />
                {label}
              </NavLink>
            ))}
          </nav>
        </aside>

        <main className="min-w-0 max-w-full flex-1 px-3 py-4 sm:px-6 sm:py-6 lg:px-8">
          <Outlet />
        </main>
      </div>
    </div>
  );
}
