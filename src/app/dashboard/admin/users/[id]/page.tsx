'use client'

import { useEffect, useState, use } from 'react'
import { createClient } from '../../../../../utils/supabase/client'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { Badge } from '@/components/ui/badge'
import { ChevronLeft, Video, CheckCircle, Clock } from 'lucide-react'
import { useRouter } from 'next/navigation'
import { Button } from '@/components/ui/button'

export default function UserDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params)
  const [user, setUser] = useState<any>(null)
  const [videos, setVideos] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const supabase = createClient()
  const router = useRouter()

  useEffect(() => {
    const fetchData = async () => {
      // 1. ユーザープロファイル取得
      const { data: profile } = await supabase.from('profiles').select('*').eq('id', id).single()
      
      // 2. そのユーザーが担当（アップロード）した全動画を取得
      const { data: videoList } = await supabase
        .from('videos')
        .select('*')
        .eq('ca_id', id)
        .order('created_at', { ascending: false })

      if (profile) setUser(profile)
      if (videoList) setVideos(videoList)
      setLoading(false)
    }
    fetchData()
  }, [id])

  if (loading) return <div className="p-8 text-zinc-500 text-sm">読み込み中...</div>
  if (!user) return <div className="p-8 text-zinc-500 text-sm">ユーザーが見つかりません</div>

  const today = new Date().toLocaleDateString('ja-JP')
  const yesterday = new Date(Date.now() - 86400000).toLocaleDateString('ja-JP')

  return (
    <div className="p-8 max-w-5xl mx-auto">
      <Button 
        variant="ghost" 
        onClick={() => router.back()} 
        className="mb-6 text-zinc-500 hover:text-zinc-900 transition-colors"
      >
        <ChevronLeft className="w-4 h-4 mr-1" /> 戻る
      </Button>

      <div className="mb-10 border-b border-zinc-100 pb-6">
        <h1 className="text-2xl font-bold text-zinc-900">{user.name} 活動詳細</h1>
        <div className="flex gap-4 mt-2">
          <p className="text-zinc-400 text-xs font-mono uppercase tracking-tighter">{user.email}</p>
          <Badge variant="outline" className="text-[10px] uppercase font-bold tracking-widest px-2 py-0">
            {user.role}
          </Badge>
        </div>
      </div>

      <div className="space-y-12">
        {/* --- セクション: 全てのアップロード動画 --- */}
        <section>
          <div className="flex items-center gap-2 mb-4">
            <Video className="w-4 h-4 text-zinc-400" />
            <h2 className="text-xs font-bold text-zinc-500 uppercase tracking-widest">動画別 視聴ログ</h2>
          </div>
          
          <div className="bg-white rounded-xl border border-zinc-200 overflow-hidden shadow-sm">
            <Table>
              <TableHeader className="bg-zinc-50">
                <TableRow>
                  <TableHead className="w-[40%]">動画タイトル</TableHead>
                  <TableHead>アップロード日</TableHead>
                  <TableHead>視聴進捗</TableHead>
                  <TableHead className="text-right">ステータス</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {videos.length > 0 ? videos.map(v => {
                  const createdDate = new Date(v.created_at).toLocaleDateString('ja-JP')
                  const isRecent = createdDate === today || createdDate === yesterday
                  
                  return (
                    <TableRow key={v.id} className={isRecent ? "bg-zinc-50/50" : ""}>
                      <TableCell className="font-medium text-zinc-900">
                        {v.title}
                        {createdDate === today && (
                          <span className="ml-2 text-[8px] bg-blue-600 text-white px-1 py-0.5 rounded font-bold uppercase tracking-tighter">NEW</span>
                        )}
                      </TableCell>
                      <TableCell className="text-zinc-400 text-xs font-medium">{createdDate}</TableCell>
                      <TableCell>
                        <div className="flex items-center gap-3">
                          <div className="w-20 h-1 bg-zinc-100 rounded-full overflow-hidden">
                            <div 
                              className={`h-full transition-all ${v.progress >= 70 ? "bg-green-600" : "bg-zinc-400"}`}
                              style={{ width: `${v.progress}%` }}
                            />
                          </div>
                          <span className={`text-[10px] font-mono ${v.progress >= 70 ? "text-green-600 font-bold" : "text-zinc-400"}`}>
                            {v.progress}%
                          </span>
                        </div>
                      </TableCell>
                      <TableCell className="text-right">
                        <Badge 
                          variant={v.status === 'completed' ? 'default' : 'secondary'} 
                          className={v.status === 'completed' ? 'bg-green-600 text-white border-none' : 'text-zinc-400 bg-transparent'}
                        >
                          {v.status === 'completed' ? 'COMPLETED' : 'WATCHING'}
                        </Badge>
                      </TableCell>
                    </TableRow>
                  )
                }) : (
                  <TableRow>
                    <TableCell colSpan={4} className="text-center py-12 text-zinc-400 text-xs italic">
                      アップロードされた動画がまだありません
                    </TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          </div>
        </section>

        {/* --- セクション: 最近完了したアクション --- */}
        <section>
          <div className="flex items-center gap-2 mb-4">
            <CheckCircle className="w-4 h-4 text-zinc-400" />
            <h2 className="text-xs font-bold text-zinc-500 uppercase tracking-widest">完了報告履歴</h2>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {videos.filter(v => v.status === 'completed').slice(0, 6).map(v => (
              <div key={v.id} className="p-4 bg-white border border-zinc-200 rounded-lg shadow-sm flex flex-col justify-between h-24">
                <div className="text-[11px] font-bold text-zinc-900 line-clamp-2 leading-snug">{v.title}</div>
                <div className="flex justify-between items-end">
                  <span className="text-[9px] text-zinc-400 font-mono uppercase font-medium">Done: {new Date(v.updated_at).toLocaleDateString('ja-JP')}</span>
                  <span className="text-[9px] font-bold text-green-600 tracking-tighter underline underline-offset-2 italic">VERIFIED</span>
                </div>
              </div>
            ))}
          </div>
        </section>
      </div>
    </div>
  )
}