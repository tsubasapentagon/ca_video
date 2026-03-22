// src/app/dashboard/admin/activity/page.tsx
'use client'

import { useEffect, useState } from 'react'
import { createClient } from '../../../../utils/supabase/client'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import Link from 'next/link'

export default function AdminActivity() {
  const [stats, setStats] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const supabase = createClient()

  useEffect(() => {
    const fetchActivity = async () => {
      const { data: profiles } = await supabase.from('profiles').select('*').order('name')
      const { data: videos } = await supabase.from('videos').select('*')

      if (profiles && videos) {
        const todayStr = new Date().toLocaleDateString('ja-JP')
        const yesterday = new Date()
        yesterday.setDate(yesterday.getDate() - 1)
        const yesterdayStr = yesterday.toLocaleDateString('ja-JP')

        const computed = profiles.map(p => {
          const userVideos = videos.filter(v => v.ca_id === p.id)
          return {
            id: p.id,
            name: p.name,
            todayUp: userVideos.filter(v => new Date(v.created_at).toLocaleDateString('ja-JP') === todayStr).length,
            yesterdayUp: userVideos.filter(v => new Date(v.created_at).toLocaleDateString('ja-JP') === yesterdayStr).length,
            todayDone: userVideos.filter(v => v.status === 'completed' && new Date(v.updated_at).toLocaleDateString('ja-JP') === todayStr).length,
            yesterdayDone: userVideos.filter(v => v.status === 'completed' && new Date(v.updated_at).toLocaleDateString('ja-JP') === yesterdayStr).length,
          }
        })
        setStats(computed)
      }
      setLoading(false)
    }
    fetchActivity()
  }, [])

  if (loading) return <div className="p-8 text-zinc-500 text-sm">読み込み中...</div>

  return (
    <div className="p-8">
      <div className="mb-6">
        <h1 className="text-xl font-bold text-zinc-900">直近アクション</h1>
        <p className="text-sm text-zinc-500">メンバー名をクリックすると詳細な活動ログを確認できます</p>
      </div>

      <div className="bg-white rounded-xl border border-zinc-200 overflow-hidden shadow-sm">
        <Table>
          <TableHeader className="bg-zinc-50">
            <TableRow>
              <TableHead>メンバー名</TableHead>
              <TableHead className="text-center">今日アップロード</TableHead>
              <TableHead className="text-center">昨日アップロード</TableHead>
              <TableHead className="text-center">今日視聴完了</TableHead>
              <TableHead className="text-center">昨日視聴完了</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {stats.map(s => (
              <TableRow key={s.id} className="hover:bg-zinc-50/50 transition-colors">
                <TableCell className="font-medium">
                  <Link 
                    href={`/dashboard/admin/users/${s.id}`}
                    className="text-blue-600 hover:text-blue-800 hover:underline underline-offset-4 decoration-blue-300"
                  >
                    {s.name}
                  </Link>
                </TableCell>
                <TableCell className="text-center">
                  <span className={s.todayUp > 0 ? "text-blue-600 font-bold" : "text-zinc-300"}>
                    {s.todayUp > 0 ? `+${s.todayUp}` : '0'}
                  </span>
                </TableCell>
                <TableCell className="text-center text-zinc-500">{s.yesterdayUp}</TableCell>
                <TableCell className="text-center">
                  <span className={s.todayDone > 0 ? "text-green-600 font-bold" : "text-zinc-300"}>
                    {s.todayDone > 0 ? `✓ ${s.todayDone}` : '0'}
                  </span>
                </TableCell>
                <TableCell className="text-center text-zinc-500">{s.yesterdayDone}</TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>
    </div>
  )
}