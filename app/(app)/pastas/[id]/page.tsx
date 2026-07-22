'use client'

import { useAppStore } from '@/lib/store/use-app-store'
import { FilteredPlannersPage } from '@/components/dashboard/filtered-planners-page'
import { useParams, useRouter } from 'next/navigation'
import { Button } from '@/components/ui/button'

export default function FolderPage() {
  const { id } = useParams<{ id: string }>()
  const router = useRouter()
  const folder = useAppStore((s) => s.folders.find((f) => f.id === id))
  const count = useAppStore((s) =>
    s.planners.filter((p) => p.folderId === id).length,
  )

  if (!folder) {
    return (
      <div className="flex h-screen items-center justify-center">
        <div className="text-center">
          <p className="text-lg font-semibold">Pasta não encontrada</p>
          <Button variant="link" onClick={() => router.push('/')} className="mt-2">
            Voltar ao Dashboard
          </Button>
        </div>
      </div>
    )
  }

  return (
    <FilteredPlannersPage
      kind="folder"
      id={folder.id}
      title={folder.name}
      color={folder.color}
      description={`${count} planner${count === 1 ? '' : 's'} nesta pasta.`}
    />
  )
}
