// src/app/dashboard/page.tsx
'use client'

import { useEffect, useState } from 'react'
import { createClient } from '../../utils/supabase/client'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { useRouter } from 'next/navigation'
import { Youtube, LogOut, Loader2, Plus, Trash2, ShieldCheck, PlayCircle } from 'lucide-react'

export default function Dashboard() {
  const [user, setUser] = useState<any>(null)
  const [userRole, setUserRole] = useState<string | null>(null)
  const [videos, setVideos] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [youtubeUrl, setYoutubeUrl] = useState('')
  const [submitting, setSubmitting] = useState(false)
  
  const supabase = createClient()
  const router = useRouter()

  useEffect(() => {
    const getData = async () => {
      const { data: { user: authUser } } = await supabase.auth.getUser()
      if (!authUser) {
        router.push('/')
        return
      }
      setUser(authUser)

      // 1. ユーザーの権限(role)を取得（ボタンの表示・非表示判定用）
      const { data: profile } = await supabase
        .from('profiles')
        .select('role')
        .eq('id', authUser.id)
        .single()
      
      if (profile) setUserRole(profile.role)

      // 2. 【修正】誰であっても、ここ（自分のダッシュボード）では自分の動画だけを表示
      const { data } = await supabase
        .from('videos')
        .select('*')
        .eq('ca_id', authUser.id) // ログインしている自分のIDで固定
        .order('created_at', { ascending: false })
      
      setVideos(data || [])
      setLoading(false)
    }
    getData()
  }, [])

  const getYouTubeId = (url: string) => {
    const regExp = /^.*(youtu.be\/|v\/|u\/\w\/|embed\/|watch\?v=|\&v=)([^#\&\?]*).*/
    const match = url.match(regExp)
    return (match && match[2].length === 11) ? match[2] : null
  }

  const handleAddVideo = async (e: React.FormEvent) => {
    e.preventDefault()
    const videoId = getYouTubeId(youtubeUrl)
    if (!videoId) {
      alert('有効なYouTubeのURLを入力してください')
      return
    }

    try {
      setSubmitting(true)
      // シンプルにするためタイトルは「面談動画 + 日時」等で暫定保存（後で詳細で編集可とする運用が楽です）
      const videoTitle = `面談動画_${new Date().toLocaleDateString()}`

      const { error } = await supabase.from('videos').insert({
        ca_id: user.id,
        title: videoTitle, 
        youtube_id: videoId,
        status: 'unwatched',
        progress: 0
      })

      if (error) throw error
      setYoutubeUrl('')
      window.location.reload()
    } catch (error) {
      alert('登録に失敗しました')
    } finally {
      setSubmitting(false)
    }
  }

  const handleDelete = async (e: React.MouseEvent, id: string) => {
    e.stopPropagation()
    if (!confirm('この動画をアーカイブから削除しますか？')) return
    const { error } = await supabase.from('videos').delete().eq('id', id)
    if (!error) window.location.reload()
  }

  const handleLogout = async () => {
    await supabase.auth.signOut()
    router.push('/')
  }

  if (loading) return <div className="flex h-screen items-center justify-center bg-zinc-50"><Loader2 className="animate-spin text-zinc-400 w-6 h-6" /></div>

  return (
    <div className="min-h-screen bg-zinc-50 p-8">
      <div className="max-w-6xl mx-auto">
        
        {/* ヘッダーエリア */}
        <div className="flex justify-between items-end mb-12">
          <div>
            <h1 className="text-2xl font-bold text-zinc-900 tracking-tight">面談リフレクション</h1>
            <p className="text-zinc-400 text-xs font-medium uppercase tracking-widest mt-1">{user.email}</p>
          </div>
          <div className="flex items-center gap-3">
            {/* 管理者ボタン: roleがadminの場合のみ表示 */}
            {userRole === 'admin' && (
              <Button 
                variant="outline" 
                onClick={() => router.push('/dashboard/admin')}
                className="border-zinc-800 text-zinc-800 hover:bg-zinc-100 font-bold text-xs px-4 h-9"
              >
                <ShieldCheck className="w-4 h-4 mr-2" />
                管理コンソール
              </Button>
            )}
            <Button variant="ghost" onClick={handleLogout} className="text-zinc-400 hover:text-zinc-900 text-xs">
              <LogOut className="w-3 h-3 mr-2" /> LOGOUT
            </Button>
          </div>
        </div>

        {/* 追加セクション */}
        <Card className="mb-12 bg-white border-zinc-200 shadow-sm rounded-xl overflow-hidden">
          <CardHeader className="bg-zinc-50/50 border-b border-zinc-100 py-4">
            <CardTitle className="text-xs font-bold text-zinc-500 uppercase tracking-widest flex items-center gap-2">
              <Plus className="w-4 h-4" /> 新規動画登録
            </CardTitle>
          </CardHeader>
          <CardContent className="pt-6">
            <form onSubmit={handleAddVideo} className="flex gap-3">
              <Input 
                placeholder="YouTube URL (https://...)" 
                value={youtubeUrl}
                onChange={(e) => setYoutubeUrl(e.target.value)}
                disabled={submitting}
                className="flex-1 bg-zinc-50 border-zinc-200 focus-visible:ring-zinc-900"
              />
              <Button type="submit" disabled={submitting} className="bg-zinc-900 hover:bg-zinc-800 text-white px-6">
                {submitting ? <Loader2 className="animate-spin" /> : "ADD VIDEO"}
              </Button>
            </form>
          </CardContent>
        </Card>

        {/* リストセクション */}
        <div className="flex items-center gap-2 mb-6 border-b border-zinc-200 pb-2">
          <PlayCircle className="w-4 h-4 text-zinc-400" />
          <h2 className="text-xs font-bold text-zinc-500 uppercase tracking-widest">アーカイブ一覧</h2>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
          {videos.length === 0 ? (
            <div className="col-span-full text-center py-24 bg-white rounded-xl border border-dashed border-zinc-300">
              <p className="text-zinc-400 text-sm italic">登録済みの動画はありません</p>
            </div>
          ) : (
            videos.map((video) => (
              <div 
                key={video.id} 
                className="group cursor-pointer"
                onClick={() => router.push(`/dashboard/video/${video.id}`)}
              >
                <div className="relative aspect-video bg-zinc-200 rounded-lg overflow-hidden mb-3">
                  <img 
                    src={`https://img.youtube.com/vi/${video.youtube_id}/mqdefault.jpg`} 
                    alt={video.title}
                    className="w-full h-full object-cover grayscale-[0.5] group-hover:grayscale-0 transition-all duration-500 group-hover:scale-105"
                  />
                  {/* 削除 */}
                  <button 
                    onClick={(e) => handleDelete(e, video.id)}
                    className="absolute top-2 right-2 p-2 bg-white/90 rounded text-zinc-900 opacity-0 group-hover:opacity-100 transition-opacity hover:bg-zinc-900 hover:text-white"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                  {/* Progress Bar */}
                  <div className="absolute bottom-0 left-0 w-full h-1 bg-black/20">
                    <div 
                      className="h-full bg-zinc-900" 
                      style={{ width: `${video.progress}%` }}
                    />
                  </div>
                </div>
                
                <div className="space-y-1">
                  <h3 className="text-sm font-bold text-zinc-900 line-clamp-1 group-hover:text-blue-600 transition-colors italic">
                    {video.title}
                  </h3>
                  <div className="flex justify-between items-center">
                    <span className="text-[10px] text-zinc-400 font-mono">
                      {new Date(video.created_at).toLocaleDateString('ja-JP')}
                    </span>
                    <span className={`text-[9px] font-bold px-2 py-0.5 rounded uppercase tracking-tighter ${
                      video.status === 'completed' ? 'bg-green-100 text-green-700' : 'bg-zinc-200 text-zinc-500'
                    }`}>
                      {video.status === 'completed' ? '視聴済' : '未視聴'}
                    </span>
                  </div>
                </div>
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  )
}