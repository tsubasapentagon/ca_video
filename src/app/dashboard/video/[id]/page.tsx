// src/app/dashboard/video/[id]/page.tsx
'use client'

import { useEffect, useState, use, useRef } from 'react'
import { createClient } from '../../../../utils/supabase/client'
import { Button } from '@/components/ui/button'
import { Card } from '@/components/ui/card'
import { ChevronLeft, PlayCircle, CheckCircle, Clock } from 'lucide-react'
import { useRouter } from 'next/navigation'

declare global {
    interface Window {
      onYouTubeIframeAPIReady: () => void;
      YT: any; // これが重要
    }
  }

export default function VideoDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params)
  const [video, setVideo] = useState<any>(null)
  const [status, setStatus] = useState<string>('')
  const [currentProgress, setCurrentProgress] = useState<number>(0)
  
  const supabase = createClient()
  const router = useRouter()
  const playerRef = useRef<any>(null)
  const timerRef = useRef<NodeJS.Timeout | null>(null)

  // 1. データ取得
  useEffect(() => {
    const fetchVideo = async () => {
      const { data } = await supabase.from('videos').select('*').eq('id', id).single()
      if (data) {
        setVideo(data)
        setStatus(data.status)
        setCurrentProgress(data.progress || 0)
      }
    }
    fetchVideo()
    return () => { if (timerRef.current) clearInterval(timerRef.current) }
  }, [id])

  // 2. YouTube API初期化
  useEffect(() => {
    if (!video) return
    const tag = document.createElement('script')
    tag.src = "https://www.youtube.com/iframe_api"
    const firstScriptTag = document.getElementsByTagName('script')[0]
    firstScriptTag.parentNode?.insertBefore(tag, firstScriptTag)

    window.onYouTubeIframeAPIReady = () => {
      playerRef.current = new window.YT.Player('youtube-player', {
        events: {
          'onStateChange': onPlayerStateChange
        }
      })
    }
    return () => { window.onYouTubeIframeAPIReady = () => {} }
  }, [video])

  // 3. 視聴進捗の監視 (修正版)
  const onPlayerStateChange = (event: any) => {
    // 1 = PLAYING (再生中)
    if (event.data === window.YT.PlayerState.PLAYING) {
      if (status === 'unwatched') updateStatus('watching')

      if (!timerRef.current) {
        console.log("視聴監視を開始しました")
        timerRef.current = setInterval(async () => {
          // プレイヤーの状態をチェック
          if (playerRef.current && typeof playerRef.current.getCurrentTime === 'function') {
            const currentTime = playerRef.current.getCurrentTime()
            const duration = playerRef.current.getDuration()

            if (duration > 0) {
              const progressPercent = Math.round((currentTime / duration) * 100)
              
              // 【重要】進捗が1%でも更新されたらDBに保存するように条件を緩和
              // ただし、現在の値より小さい場合は保存しない（巻き戻し対策）
              if (progressPercent > currentProgress) {
                console.log(`進捗更新試行: ${progressPercent}%`)
                
                const { error } = await supabase
                  .from('videos')
                  .update({ progress: progressPercent })
                  .eq('id', id)
                
                if (error) {
                  console.error("進捗保存エラー:", error.message)
                } else {
                  setCurrentProgress(progressPercent)
                }
              }
            }
          }
        }, 2000) // 2秒ごとにチェック
      }
    } else {
      // 再生中以外はタイマーを止める
      if (timerRef.current) {
        clearInterval(timerRef.current)
        timerRef.current = null
        console.log("視聴監視を停止しました")
      }
    }
  }

  const updateStatus = async (newStatus: string) => {
    if (status === newStatus) return
    const { error } = await supabase
      .from('videos')
      .update({ 
        status: newStatus,
        updated_at: new Date().toISOString()
      })
      .eq('id', id)
    if (!error) setStatus(newStatus)
  }

  if (!video) return <div className="p-8 text-center text-zinc-500 text-sm">読み込み中...</div>

  return (
    <div className="min-h-screen bg-zinc-50 p-6">
      <div className="max-w-5xl mx-auto">
        <Button variant="ghost" onClick={() => router.back()} className="mb-4 text-zinc-500 hover:text-zinc-900 transition-colors">
          <ChevronLeft className="w-4 h-4 mr-1" /> 戻る
        </Button>

        <Card className="overflow-hidden border-none shadow-2xl bg-black rounded-2xl">
          <div className="aspect-video w-full">
            <iframe
              id="youtube-player"
              width="100%"
              height="100%"
              src={`https://www.youtube.com/embed/${video.youtube_id}?enablejsapi=1`}
              title="YouTube video player"
              frameBorder="0"
              allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
              allowFullScreen
            ></iframe>
          </div>
        </Card>

        <div className="mt-8 bg-white p-8 rounded-2xl shadow-sm border border-zinc-100">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
            <div>
              <h1 className="text-2xl font-bold text-zinc-900 tracking-tight">{video.title}</h1>
              <div className="flex items-center gap-4 mt-3">
                <StatusBadge status={status} />
                <span className="text-zinc-400 text-xs font-medium uppercase tracking-wider">
                  Added: {new Date(video.created_at).toLocaleDateString('ja-JP')}
                </span>
              </div>
            </div>
            
            <Button 
              size="lg"
              variant={status === 'completed' ? "outline" : "default"}
              onClick={() => updateStatus(status === 'completed' ? 'watching' : 'completed')}
              className={status === 'completed' ? "border-zinc-200 text-zinc-500" : "bg-zinc-900 text-white hover:bg-zinc-800 shadow-lg shadow-zinc-200"}
            >
              {status === 'completed' ? (
                <span className="flex items-center gap-2"><Clock className="w-4 h-4" /> 未完了に戻す</span>
              ) : (
                <span className="flex items-center gap-2"><CheckCircle className="w-4 h-4" /> 視聴完了を報告</span>
              )}
            </Button>
          </div>
        </div>
      </div>
    </div>
  )
}

function StatusBadge({ status }: { status: string }) {
  const commonClasses = "px-3 py-1 rounded-full text-[10px] font-bold uppercase tracking-widest border"
  if (status === 'completed') {
    return <span className={`${commonClasses} bg-green-50 text-green-700 border-green-100`}>視聴済</span>
  }
  if (status === 'watching') {
    return <span className={`${commonClasses} bg-zinc-900 text-white border-zinc-900`}>未視聴</span>
  }
  return <span className={`${commonClasses} bg-zinc-100 text-zinc-400 border-zinc-200`}>Unwatched</span>
}