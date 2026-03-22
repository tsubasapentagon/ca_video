'use client'

import { useEffect, useState } from 'react'
import { createClient } from '../../../../utils/supabase/client'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'

export default function AdminUsers() {
  const [users, setUsers] = useState<any[]>([])
  const supabase = createClient()

  const fetchUsers = async () => {
    const { data } = await supabase.from('profiles').select('*').order('name')
    if (data) setUsers(data)
  }

  useEffect(() => { fetchUsers() }, [])

  const toggleRole = async (id: string, currentRole: string) => {
    const newRole = currentRole === 'admin' ? 'ca' : 'admin'
    if (!confirm(`権限を ${newRole} に変更しますか？`)) return
    await supabase.from('profiles').update({ role: newRole }).eq('id', id)
    fetchUsers()
  }

  return (
    <div className="p-8">
      <h1 className="text-xl font-bold text-zinc-900 mb-6">メンバー管理</h1>
      <div className="bg-white rounded-xl border border-zinc-200 overflow-hidden shadow-sm">
        <Table>
          <TableHeader className="bg-zinc-50">
            <TableRow>
              <TableHead>名前</TableHead>
              <TableHead>メールアドレス</TableHead>
              <TableHead>現在の権限</TableHead>
              <TableHead className="text-right">操作</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {users.map(u => (
              <TableRow key={u.id}>
                <TableCell className="font-medium">{u.name}</TableCell>
                <TableCell className="text-zinc-500 text-sm">{u.email || '---'}</TableCell>
                <TableCell>
                  <Badge variant={u.role === 'admin' ? 'default' : 'secondary'} className="rounded-md">
                    {u.role === 'admin' ? '管理者' : 'CA'}
                  </Badge>
                </TableCell>
                <TableCell className="text-right">
                  <Button variant="outline" size="sm" onClick={() => toggleRole(u.id, u.role)}>
                    権限変更
                  </Button>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>
    </div>
  )
}