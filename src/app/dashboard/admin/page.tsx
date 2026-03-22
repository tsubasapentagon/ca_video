'use client'

import { useEffect, useState } from 'react'
import { createClient } from '../../../utils/supabase/client'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { Badge } from '@/components/ui/badge'
import { cn } from "@/lib/utils"

export default function AdminVideoList() {
  const [videos, setVideos] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const supabase = createClient()

  useEffect(() => {
    const fetchVideos = async () => {
      const { data } = await supabase
        .from('videos')
        .select(`
          *,
          profiles ( name )
        `)
        .order('created_at', { ascending: false })
      
      if (data) setVideos(data)
      setLoading(false)
    }
    fetchVideos()
  }, [])

  if (loading) return <div className="p-8 text-zinc-500 text-sm">読み込み中...</div>

  return (
    <div className="p-8">
      <div className="mb-6">
        <h1 className="text-xl font-bold text-zinc-900">動画一覧</h1>
        <p className="text-sm text-zinc-500">全てのCAがアップロードした動画の視聴状況を確認できます</p>
      </div>

      <div className="bg-white rounded-xl border border-zinc-200 overflow-hidden shadow-sm">
        <Table>
          <TableHeader className="bg-zinc-50">
            <TableRow>
              <TableHead className="w-[30%]">動画タイトル</TableHead>
              <TableHead>CA名</TableHead>
              <TableHead>進捗率</TableHead>
              <TableHead>ステータス</TableHead>
              <TableHead className="text-right">アップロード日</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {videos.map((video) => (
              <TableRow key={video.id} className="hover:bg-zinc-50/50">
                <TableCell className="font-medium text-zinc-900">{video.title}</TableCell>
                <TableCell className="text-zinc-600">{video.profiles?.name}</TableCell>
                <TableCell>
                  <div className="flex items-center gap-3">
                    <div className="w-24 h-1.5 bg-zinc-100 rounded-full overflow-hidden">
                      <div 
                        className={cn(
                          "h-full transition-all",
                          video.progress >= 70 ? "bg-green-600" : "bg-zinc-400"
                        )}
                        style={{ width: `${video.progress}%` }}
                      />
                    </div>
                    <span className="text-xs font-mono text-zinc-500">{video.progress}%</span>
                  </div>
                </TableCell>
                <TableCell>
                  <Badge 
                    variant={video.status === 'completed' ? 'default' : 'outline'}
                    className={video.status === 'completed' ? "bg-green-600 text-white border-none" : "text-zinc-400"}
                  >
                    {video.status === 'completed' ? '視聴完了' : '未完了'}
                  </Badge>
                </TableCell>
                <TableCell className="text-right text-zinc-400 text-xs">
                  {new Date(video.created_at).toLocaleDateString('ja-JP')}
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>
    </div>
  )
}