import { describe, it, expect } from 'vitest'
import { resolveRoutePlan, EDITOR_PLAN, minimalCollectionSet } from '@/lib/db/route-collections'

const plan = (path: string) => resolveRoutePlan(path)

describe('route-collections — pathname resolve plano de coleções', () => {
  it('rotas de mesmo módulo devolvem coleção esperada', () => {
    // Cenário chave: antes ~35 listeners em qualquer rota;
    // agora cada página só carrega o que precisa.
    expect(plan('/diario').collections).toEqual(['diarios'])
    expect(plan('/checklists').collections).toEqual(['checklists'])
    expect(plan('/listas').collections).toEqual(['shoppingLists', 'shoppingListPresets'])
    expect(plan('/wishlist').collections).toEqual(['wishlist'])
    expect(plan('/frases').collections).toEqual(['quotes'])
    expect(plan('/memorias').collections).toEqual(['memories'])
    expect(plan('/notas').collections).toEqual(['notes'])
    expect(plan('/calendario').collections).toEqual(['calendarEvents'])
  })

  it('rota de saúde carrega as 8 coleções de saúde', () => {
    expect(plan('/saude').collections.sort()).toEqual(
      [
        'weights',
        'bodyMeasurements',
        'symptomLogs',
        'medications',
        'cycleRecords',
        'doctors',
        'appointments',
        'exams',
      ].sort(),
    )
  })

  it('rota de finanças carrega 8 coleções, metas só 3', () => {
    expect(plan('/financas').collections).toHaveLength(8)
    expect(plan('/metas').collections.sort()).toEqual(
      ['financialGoals', 'goalDeposits', 'savingsBoxes'].sort(),
    )
  })

  it('rota /rotina carrega 4 coleções de rotina', () => {
    expect(plan('/rotina').collections.sort()).toEqual(
      ['tasks', 'recurringTasks', 'pendingItems', 'routineSlots'].sort(),
    )
  })

  it('rota /habitos carrega habits + habitLogs', () => {
    expect(plan('/habitos').collections.sort()).toEqual(['habits', 'habitLogs'].sort())
  })

  it('/retrospectiva carrega retroEntries + journalEntries', () => {
    expect(plan('/retrospectiva').collections.sort()).toEqual(
      ['retroEntries', 'journalEntries'].sort(),
    )
  })

  it('/cofre carrega passwords e pede masterPin do root', () => {
    expect(plan('/cofre').collections).toEqual(['passwords'])
    expect(plan('/cofre').rootFields).toContain('masterPin')
  })

  it('dashboard agrega 4 coleções de 3 módulos diferentes', () => {
    const collections = plan('/').collections
    expect(collections.sort()).toEqual(
      ['planners', 'diarios', 'calendarEvents', 'financialGoals'].sort(),
    )
  })

  it('/dashboard redirige mas também mapeia o mesmo plano de /', () => {
    expect(plan('/dashboard').collections).toEqual(plan('/').collections)
  })
})

describe('route-collections — rootFields por rota', () => {
  it('/menu pede só modules + theme (não abre coleções)', () => {
    const p = plan('/menu')
    expect(p.collections).toEqual([])
    expect(p.rootFields).toContain('modules')
  })

  it('/perfil pede rootFields de perfil + assinatura (sem coleções)', () => {
    const p = plan('/perfil')
    expect(p.collections).toEqual([])
    expect(p.rootFields).toContain('name')
    expect(p.rootFields).toContain('avatar')
    expect(p.rootFields).toContain('subscription.role')
  })

  it('/lixeira carrega trashItems', () => {
    expect(plan('/lixeira').collections).toEqual(['trashItems'])
  })

  it('rotas nested /pastas/[id] e /tags/[tag] carregam planners', () => {
    expect(plan('/pastas/abc').collections).toEqual(['planners'])
    expect(plan('/tags/foo').collections).toEqual(['planners'])
    expect(plan('/tags/foo').rootFields).toContain('plannerTags')
    expect(plan('/pastas/abc').rootFields).toContain('folders')
  })

  it('rota desconhecida → plano vazio (sem listeners)', () => {
    const p = plan('/qualquer-coisa-nope')
    expect(p.collections).toEqual([])
    expect(p.rootFields).toEqual([])
  })
})

describe('route-collections — EDITOR_PLAN', () => {
  it('editor carrega só planners + root de tema/folders/tags', () => {
    expect(EDITOR_PLAN.collections).toEqual(['planners'])
    expect(EDITOR_PLAN.rootFields).toContain('theme')
    expect(EDITOR_PLAN.rootFields).toContain('folders')
    expect(EDITOR_PLAN.rootFields).toContain('plannerTags')
  })
})

describe('route-collections — minimalCollectionSet (Set utility)', () => {
  it('retorna Set de coleções para uso em lookup', () => {
    const fakeUser = { uid: 'x' } as any
    const set = minimalCollectionSet(fakeUser, '/saude')
    expect(set.size).toBe(8)
    expect(set.has('weights')).toBe(true)
    expect(set.has('planners')).toBe(false)
  })
})
