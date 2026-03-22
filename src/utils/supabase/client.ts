import { createBrowserClient } from '@supabase/ssr'

export function createClient() {
  // ブラウザ側で動作し、クッキーを正しく扱うためのクライアント
  return createBrowserClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  )
}