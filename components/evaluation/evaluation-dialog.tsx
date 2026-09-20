import { useEvaluationStore } from '@/lib/store/use-evaluation-store'
import type { EvaluationEntry, EvaluationType } from '@/lib/types'
import { Star } from 'lucide-react'
import { useEffect, useState } from 'react'
import { Button } from '../ui/button'
import { Dialog, DialogContent } from '../ui/overlays'
import { Input, Textarea } from '../ui/primitives'
import { toast } from '../ui/toaster'

const TYPE_LABELS: Record<EvaluationType, string> = {
  filme: 'Filme',
  serie: 'Série',
  livro: 'Livro',
}

export function EvaluationDialog({
  open,
  onClose,
  defaultType,
  editId,
}: {
  open: boolean
  onClose: () => void
  defaultType: EvaluationType
  editId?: string
}) {
  const addEntry = useEvaluationStore((state) => state.addEntry)
  const updateEntry = useEvaluationStore((state) => state.updateEntry)
  const existing = useEvaluationStore((state) => editId
    ? state.entries.find((entry) => entry.id === editId)
    : undefined)
  const [type, setType] = useState<EvaluationType>(defaultType)
  const [name, setName] = useState('')
  const [rating, setRating] = useState<0 | EvaluationEntry['rating']>(0)
  const [seasons, setSeasons] = useState('')
  const [publisher, setPublisher] = useState('')
  const [observation, setObservation] = useState('')

  useEffect(() => {
    if (!open) return
    if (existing) {
      setType(existing.type)
      setName(existing.name)
      setRating(existing.rating)
      setSeasons(existing.seasons?.toString() ?? '')
      setPublisher(existing.publisher ?? '')
      setObservation(existing.observation ?? '')
    } else if (!editId) {
      setType(defaultType)
      setName('')
      setRating(0)
      setSeasons('')
      setPublisher('')
      setObservation('')
    }
  }, [open, editId, existing, defaultType])

  const handleSave = () => {
    if (!name.trim()) {
      toast({ title: `Digite o nome do ${TYPE_LABELS[type].toLowerCase()}`, variant: 'error' })
      return
    }
    if (rating === 0) {
      toast({ title: 'Selecione uma nota de 1 a 5 estrelas', variant: 'error' })
      return
    }

    const parsedSeasons = seasons.trim() ? Number.parseInt(seasons, 10) : undefined
    if (type === 'serie' && (!parsedSeasons || parsedSeasons < 1)) {
      toast({ title: 'Informe o número de temporadas', variant: 'error' })
      return
    }
    if (type === 'livro' && !publisher.trim()) {
      toast({ title: 'Informe o nome da editora', variant: 'error' })
      return
    }

    const data = {
      type,
      name: name.trim(),
      rating,
      ...(type === 'serie' ? { seasons: parsedSeasons } : {}),
      ...(type === 'livro' ? { publisher: publisher.trim() } : {}),
      observation: observation.trim() || undefined,
    }

    if (editId) {
      updateEntry(editId, data)
      toast({ title: 'Avaliação atualizada!', variant: 'success' })
    } else {
      addEntry(data)
      toast({ title: 'Avaliação registrada!', variant: 'success' })
    }
    onClose()
  }

  return (
    <Dialog open={open} onOpenChange={(value) => !value && onClose()}>
      <DialogContent
        title={editId ? 'Editar avaliação' : `Avaliar ${TYPE_LABELS[type].toLowerCase()}`}
        description="Registre sua opinião para consultar depois."
      >
        <div className="flex flex-col gap-4">
          <div>
            <label className="text-sm font-medium mb-1.5 block">Tipo</label>
            <div className="grid grid-cols-3 gap-2">
              {(Object.keys(TYPE_LABELS) as EvaluationType[]).map((value) => (
                <button
                  key={value}
                  type="button"
                  onClick={() => setType(value)}
                  className={`rounded-xl border px-3 py-2 text-sm font-medium transition-colors cursor-pointer ${
                    type === value
                      ? 'border-primary/50 bg-primary/10 text-primary'
                      : 'border-border/60 text-muted-foreground hover:bg-muted/50'
                  }`}
                >
                  {TYPE_LABELS[value]}
                </button>
              ))}
            </div>
          </div>

          <div>
            <label className="text-sm font-medium mb-1.5 block">Nome</label>
            <Input
              value={name}
              onChange={(event) => setName(event.target.value)}
              placeholder={`Nome do ${TYPE_LABELS[type].toLowerCase()}`}
              autoFocus
            />
          </div>

          <div>
            <label className="text-sm font-medium mb-2 block">Nota</label>
            <div className="flex items-center gap-1" role="radiogroup" aria-label="Nota de 1 a 5 estrelas">
              {[1, 2, 3, 4, 5].map((value) => (
                <button
                  key={value}
                  type="button"
                  onClick={() => setRating(value as EvaluationEntry['rating'])}
                  className="rounded-lg p-1 transition-colors hover:bg-primary/10 cursor-pointer"
                  aria-label={`${value} ${value === 1 ? 'estrela' : 'estrelas'}`}
                  aria-checked={rating === value}
                  role="radio"
                >
                  <Star
                    size={25}
                    className={rating >= value ? 'text-primary fill-primary' : 'text-muted-foreground/30'}
                  />
                </button>
              ))}
            </div>
          </div>

          {type === 'serie' && (
            <div>
              <label className="text-sm font-medium mb-1.5 block">Número de temporadas</label>
              <Input
                type="number"
                min="1"
                step="1"
                value={seasons}
                onChange={(event) => setSeasons(event.target.value)}
                placeholder="Ex: 3"
              />
            </div>
          )}

          {type === 'livro' && (
            <div>
              <label className="text-sm font-medium mb-1.5 block">Editora</label>
              <Input
                value={publisher}
                onChange={(event) => setPublisher(event.target.value)}
                placeholder="Nome da editora"
              />
            </div>
          )}

          <div>
            <label className="text-sm font-medium mb-1.5 block">Observação (opcional)</label>
            <Textarea
              value={observation}
              onChange={(event) => setObservation(event.target.value)}
              placeholder="O que você achou?"
              rows={4}
            />
          </div>

          <div className="flex flex-col-reverse gap-2 pt-1 sm:flex-row sm:justify-end">
            <Button variant="outline" onClick={onClose} className="rounded-xl">Cancelar</Button>
            <Button onClick={handleSave} className="rounded-xl shadow-md">
              {editId ? 'Salvar alterações' : 'Registrar avaliação'}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  )
}
