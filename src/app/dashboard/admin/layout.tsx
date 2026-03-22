'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { Video, Activity, UserCog, ShieldCheck } from 'lucide-react'
import { cn } from '@/lib/utils'

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname()

  const menuItems = [
    { name: '動画一覧', href: '/dashboard/admin', icon: Video },
    { name: '直近アクション', href: '/dashboard/admin/activity', icon: Activity },
    { name: 'メンバー管理', href: '/dashboard/admin/users', icon: UserCog },
  ]

  return (
    <div className="flex min-h-screen bg-zinc-50">
      {/* Sidebar */}
      <aside className="w-64 bg-white border-r border-zinc-200 hidden md:flex flex-col fixed inset-y-0">
        <div className="p-6 border-b border-zinc-100">
          <div className="flex items-center gap-2 font-bold text-zinc-900">
            <ShieldCheck className="w-5 h-5" />
            <span>管理者コンソール</span>
          </div>
        </div>
        <nav className="flex-1 p-4 space-y-1">
          {menuItems.map((item) => (
            <Link
              key={item.href}
              href={item.href}
              className={cn(
                "flex items-center gap-3 px-3 py-2 text-sm font-medium rounded-lg transition-colors",
                pathname === item.href
                  ? "bg-zinc-900 text-white"
                  : "text-zinc-600 hover:bg-zinc-100"
              )}
            >
              <item.icon className="w-4 h-4" />
              {item.name}
            </Link>
          ))}
        </nav>
      </aside>

      {/* Main Content */}
      <main className="flex-1 md:ml-64">
        {children}
      </main>
    </div>
  )
}