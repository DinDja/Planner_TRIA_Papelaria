'use client'

import { useAppStore } from '@/lib/store/use-app-store'
import { FilteredPlannersPage } from '@/components/dashboard/filtered-planners-page'
import { useParams, useRouter } from 'next/navigation'
import { Button } from '@/components/ui/button'

export default function TagPage() {
  const { tag } = useParams<{ tag: string }>()
  const router = useRouter()
  const decodedId = decodeURIComponent(tag)
  const tagObj = useAppStore((s) => s.tags.find((t) => t.id === decodedId))
  const count = useAppStore((s) =>
    s.planners.filter((p) => p.tags.includes(decodedId)).length,
  )

  if (!tagObj) {
    return (
      <div className="flex h-screen items-center justify-center">
        <div className="text-center">
          <p className="text-lg font-semibold">Tag não encontrada</p>
          <Button variant="link" onClick={() => router.push('/')} className="mt-2">
            Voltar ao Dashboard
          </Button>
        </div>
      </div>
    )
  }

  return (
    <FilteredPlannersPage
      kind="tag"
      id={tagObj.id}
      title={`#${tagObj.name}`}
      color={tagObj.color}
      description={`${count} planner${count === 1 ? '' : 's'} com esta tag.`}
    />
  )
}
