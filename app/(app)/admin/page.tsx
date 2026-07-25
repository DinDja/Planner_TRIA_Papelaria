'use client'

import { AdminPage } from '@/components/admin/admin-page'
import { RequireAdmin } from '@/components/auth/require-admin'

export default function Page() {
  return (
    <RequireAdmin>
      <AdminPage />
    </RequireAdmin>
  )
}
