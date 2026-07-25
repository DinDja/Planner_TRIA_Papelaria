# PlannerHub — Firestore Schema

> Plataforma-alvo: Firebase Firestore (modo nativo / Native mode).
> Regras em [`firestore/firestore.rules`](./firestore.rules).

## Princípios

1. **Raiz = usuário.** Todo dado vive em `/users/{uid}/...`. Não há collections
   globais. O produto hoje é single-user privado, sem features sociais ou
   colaborativas — então o isolamento é estrito e as regras só liberam o dono.
2. **Subcollections > documentos gigantes.** Páginas de planner, transações
   financeiras e habit logs crescem sem born; cada um vira subcollection para
   não estourar o limite de 1MB/doc do Firestore.
3. **Arrays embutidos só para filhos pequenos com pai único.** Items de
   checklist/lista de compras e actions de retrospectiva têm identidade só
   dentro do pai e são pequenos — ficar embutidos evita um `read` extra e
   espelha como as stores já reescrevem o array inteiro.
4. **Timestamps como strings ISO 8601 (UTC)** enviadas pelo cliente. As regras
   só validam `is string`; não forçam `serverTimestamp()` porque isso
   aumentaria a complexidade do cliente sem ganho real de segurança. O risco
   de clock skew é mitigado em camada de app.
5. **Validação estrutural, não comportamental.** Regras de negócio (amount
   positivo, deadline > startDate) vivem no cliente; as regras Firestore só
   conferem tipos e propriedade.
6. **Money em centavos (int).** `amount` sempre inteiro; nunca `float`.

## Mapeamento das stores → Firestore

| Store Zustand                          | Path Firestore                            | Notas |
| -------------------------------------- | ----------------------------------------- | ----- |
| `useAppStore` (planners/folders/tags) | `users/{uid}` (folders/tags no doc-raiz) + `users/{uid}/planners` + `planners/{pid}/pages` | folders e tags viram arrays no doc-raiz (pequenos, single-ownership) |
| `useProfileStore`                      | `users/{uid}` (name, avatar, email)       |       |
| `useSettingsStore`                     | `users/{uid}` (settings map)              | theme fica no doc-raiz também |
| `useDiarioStore` (V2)                  | `users/{uid}/diarios`                     | unifica Journal + Retro |
| `useJournalStore` (legado)             | `users/{uid}/journalEntries`              | mantido p/ migração gradativa |
| `useRetroStore` (legado)               | `users/{uid}/retroEntries`                | mantido p/ migração gradativa |
| `useNotesStore`                        | `users/{uid}/notes`                       | folders no doc-raiz (`noteFolders`) |
| `useListsStore`                        | `users/{uid}/shoppingLists`               | items embutidos |
| `useChecklistsStore`                   | `users/{uid}/checklists`                  | items embutidos |
| `useQuotesStore`                       | `users/{uid}/quotes`                      |       |
| `useMemoriesStore`                     | `users/{uid}/memories`                    |       |
| `usePasswordsStore`                    | `users/{uid}/passwords`                   | ⚠️ ver nota de segurança |
| `useWishlistStore`                     | `users/{uid}/wishlist`                    |       |
| `useHealthStore` (escalares)           | `users/{uid}` (height, goalWeight, sex, onboarded) |       |
| `useHealthStore` (records)             | `weights`, `bodyMeasurements`, `symptomLogs`, `medications`, `cycleRecords`, `doctors`, `appointments`, `exams` | 8 subcollections |
| `useHabitsStore`                       | `users/{uid}/habits` + `users/{uid}/habitLogs` |       |
| `useRoutineStore`                      | `tasks`, `recurringTasks`, `pendingItems`, `routineSlots` | 4 subcollections |
| `useCalendarStore`                     | `users/{uid}/calendarEvents`              |       |
| `useFinanceStore`                      | `transactions`, `fixedBills`, `subscriptions`, `creditCards`, `installments`, `financialGoals`, `goalDeposits`, `savingsBoxes` | 8 subcollections |
| `useTrashStore`                        | `users/{uid}/trashItems`                   | capped 100 no cliente |

> As stores de UI transient (editor, dialogs, sidebar) **não** vão pro Firestore
> — permanecem Zustand puramente em memória.

---

## Documento-raiz: `users/{uid}`

```
users/{uid} {
  name:        string                            // ProfileStore
  avatar:      string                            // ProfileStore (emoji)
  email:       string                            // ProfileStore
  theme:       string                            // AppStore ('light'|'dark')
  settings:    map                               // SettingsStore
    palette:         string                      //   'amber'|'rose'|'ocean'|'forest'|'lavender'|'sunset'|'mono'
    gradients:      map<bool>                    //   dashboard, covers, charts, badges
    radius:          string                      //   'sharp'|'soft'|'rounded'|'pill'
    fontScale:       string                      //   'sm'|'base'|'lg'
    paperGrain:      bool
    glassUI:         bool
    deskBackground:  bool
    reduceMotion:    bool
    confirmDelete:   bool
    autoSave:        bool
  height:      number                            // HealthStore (cm)
  goalWeight:  number|null                       // HealthStore (kg)
  sex:         string|null                       // HealthStore ('male'|'female')
  onboarded:   bool                              // HealthStore
  masterPin:   string                            // PasswordsStore  ⚠️ não usar em prod
  folders:        list<map>                      // AppStore Folder
    { id: string, name: string, color: string }
  plannerTags:    list<map>                      // AppStore Tag
    { id: string, name: string, color: string }
  noteFolders:    list<map>                      // NotesStore NoteFolder
    { id: string, name: string, color: string, icon?: string }
  updatedAt:   string  // ISO 8601
}
```

---

## Subcollections

### Diário Digital (V2)

```
users/{uid}/diarios/{diarioId} {
  id, periodo: 'dia'|'semana'|'mes',
  data:        string   // YYYY-MM-DD
  dataFim?:    string   // YYYY-MM-DD (só semana/mes)
  criadoEm, atualizadoEm: string ISO,
  titulo?:     string,
  emocoes:     list<string>,     // até 3
  energia:     int 1..5,
  cor:         string,
  tags:        list<string>,
  rabisco?:    list<map> { x, y, pressure, tiltX?, tiltY?, twist?, pointerType? },
  fixado?:     bool,
  momento?:    'madrugada'|'manha'|'tarde'|'anoitecer'|'noite',
  prompt?:     string,
  texto?:      string,
  retro?:      { fora: list<string>, dentro: list<string>, proximo: list<string> },
  notas?:      string,
}
```

### Journal (legado)

```
users/{uid}/journalEntries/{entryId} {
  id, title, content, date, timeOfDay: 'morning'|'afternoon'|'evening'|'night',
  mood: { emotions: list<string>, energy: int 1..5, note?: string },
  prompt?, tags: list<string>, color, createdAt, updatedAt, pinned?, drawing?: list<map>
}
```

### Retrospectiva (legado)

```
users/{uid}/retroEntries/{entryId} {
  id, type: 'daily'|'weekly'|'monthly', date, endDate?, mood: string,
  wentWell: list<string>, toImprove: list<string>,
  actions: list<map { id, text, done, createdAt }>,
  notes?, createdAt
}
```

### Planners + Páginas

```
users/{uid}/planners/{plannerId} {
  id, name, description?, category: 'diario'|'estudos'|'trabalho'|'fitness'|'financas'|'bullet',
  color, icon, favorite: bool, folderId: string|null,
  tags: list<string>, createdAt, updatedAt
}

users/{uid}/planners/{plannerId}/pages/{pageId} {
  id, title, template: string,
  data: map {                     // CanvasData
    strokes:     list<map>,
    stickers:    list<map>,
    texts:       list<map>,
    shapes:      list<map>,
    stickyNotes: list<map>,
    bgColor?:    string,
  },
  updatedAt?: string,
}
```

### Notas

```
users/{uid}/notes/{noteId} {
  id, title, content, folderId: string|null,
  tags: list<string>, color, pinned: bool, createdAt, updatedAt
}
```

### Listas (items embutidos)

```
users/{uid}/shoppingLists/{listId} {
  id, name, color,
  items: list<map {
    id, name, quantity?, category?, notes?, checked: bool, createdAt
  }>,
  createdAt, updatedAt
}
```

### Checklists (items embutidos)

```
users/{uid}/checklists/{checklistId} {
  id, title, color,
  items: list<map { id, text, checked: bool, createdAt }>,
  createdAt, updatedAt
}
```

### Frases, Memórias

```
users/{uid}/quotes/{quoteId}     { id, text, author?, tags: list<string>, color, createdAt }
users/{uid}/memories/{memoryId} {
  id, title, description, date, mood: 'great'|'good'|'neutral'|'bad'|'tough',
  tags: list<string>, color, createdAt
}
```

### Cofre de senhas ⚠️

```
users/{uid}/passwords/{passwordId} {
  id, title, username?, password, url?, category?, notes?, color, createdAt, updatedAt
}
```

> **Segurança:** este schema espelha fielmente o `usePasswordsStore` atual. Em
> produção, NÃO armazene `password` em texto. Implemente:
> - Criptografia client-side com Web Crypto (AES-GCM) antes de escrever no Firestore;
> - `masterPin` derivado via Argon2/bcrypt server-side (Cloud Function) — nunca
>   armazenado como string comparável;
> - Considere mover o cofre para Firebase + secrets manager dedicado, fora do
> Firestore, antes de qualquer release público.

### Wishlist

```
users/{uid}/wishlist/{itemId} {
  id, name, url?, price?: int (centavos),
  priority: 'low'|'medium'|'high', category?, notes?,
  purchased: bool, purchasedAt?: string ISO,
  createdAt, updatedAt
}
```

### Saúde (8 subcollections)

```
weights/{id}            { id, date, weight: number (kg), notes?, createdAt }
bodyMeasurements/{id}  { id, date, waist?, hips?, chest?, arm?, thigh?, notes?, createdAt }
symptomLogs/{id}       { id, date, symptom, severity: int 1..5, notes?, createdAt }
medications/{id}       { id, name, dosage, frequency, startDate, endDate?, notes?, color, createdAt }
cycleRecords/{id}      { id, startDate, endDate?, flow: 'light'|'medium'|'heavy', symptoms: list<string>, notes?, createdAt }
doctors/{id}           { id, name, specialty, phone?, email?, address?, notes?, color, createdAt }
appointments/{id}      { id, doctorId?, doctorName, specialty, date, time, location?, notes?, status: 'scheduled'|'done'|'cancelled', createdAt }
exams/{id}             { id, name, date, doctor?, laboratory?, result?, fileUrl?, notes?, status: 'pending'|'done'|'reviewed', color, createdAt }
```

### Hábitos

```
habits/{id}    { id, name, description?, color, frequency: 'daily'|'weekly'|'monthly', weekdays?: list<int>, dayOfMonth?: int, createdAt, archived: bool }
habitLogs/{id} { id, habitId, date, completed: bool, createdAt }
```

### Rotina (4 subcollections)

```
tasks/{id}           { id, title, notes?, date, priority, done: bool, createdAt, completedAt? }
recurringTasks/{id}  { id, title, notes?, frequency, weekdays?, dayOfMonth?, priority, lastDone?, nextDue, active: bool, createdAt }
pendingItems/{id}    { id, title, notes?, priority, createdAt }
routineSlots/{id}    { id, time, endTime?, title, weekdays: list<int>, color? }
```

### Calendário

```
calendarEvents/{id} { id, title, date, startTime, endTime?, allDay?: bool, color, notes?, taskId?, plannerId?, createdAt }
```

### Finanças (8 subcollections)

```
transactions/{id}    { id, title, amount: int (centavos), type: 'income'|'expense', date, category, notes?, fixedBillId?, createdAt }
fixedBills/{id}      { id, title, amount, category, dayOfMonth: int 1..31, notes?, active: bool, createdAt }
subscriptions/{id}   { id, name, amount, billingCycle: 'monthly'|'yearly'|'weekly', category, nextBilling: date, active: bool, notes?, createdAt }
creditCards/{id}     { id, name, limit: int, closingDay, dueDay, color, createdAt }
installments/{id}    { id, title, totalAmount, installmentAmount, totalInstallments: int, currentInstallment: int, cardId, category, notes?, createdAt }
financialGoals/{id}  { id, title, targetAmount, currentAmount, deadline?, color, notes?, icon?, createdAt }
goalDeposits/{id}    { id, goalId, amount: int (signed), date, notes?, createdAt }
savingsBoxes/{id}    { id, name, targetAmount, currentAmount, color, deadline?, notes?, createdAt }
```

### Lixeira (capped 100 no cliente)

```
trashItems/{id} {
  id, type: string, label, detail?, deletedAt: int (ms epoch),
  originalModule: string, data: map
}
```

---

## Estratégia de migração (localStorage → Firestore)

1. **Bootstrap**: criar `users/{uid}` documento no primeiro login (antes, todo
   dado vivia em `localStorage/plannerhub-*`). Fazer `set()` no doc-raiz com
   `merge: true` preservando o que já existia em localStorage.
2. **Migração por módulo**: subir cada store em paralelo, lendo do localStorage
   existente e fazendo `batch().set()` para as subcollections correspondentes.
   Sugerir ordem:
   - 1ª onda (pequenos, frequentemente lidos): profile, settings, diario,
     notes, habits, calendar, finance (escalares);
   - 2ª onda (escrita contínua, latência ok): finance transactions, habitLogs,
     weights, tasks, wishlist;
   - 3ª onda (raro): retro legado, journal legado, memories, quotes, passwords;
   - 4ª onda (volumoso): planners + plannerPages (.items CanvasData podem ser
     grandes — paginar se necessário).
3. **Modo offline**: Firestore SDK já mantém cache offline automaticamente,
   substituindo a persistência manual do Zustand. Stores podem ser
   "sombras" lendo do Firestore via `onSnapshot` e mantendo API Zustand para
   os componentes não precisarem mudar.
4. **Bumps de contagem**: clientes que disparam "limpeza" (ex.: deletar planner
   remove `creditCards` via cascata) devem usar `batch()` para atomicidade.

## Segurança

- `masterPin` armazenado em texto é的危害 — ver nota em "Cofre de senhas".
- Regras não protegem contra leakage via `request.resource.data.x` — qualquer
  collection específica pode ser apertada depois, mas mantivemos `write: if owns(uid)`
  para todas as subcollections internas para clareza e manutenção. Apertar
  validação por subcollection (por ex.: exigir `amount: number` em
  `transactions`) é direto: trocar `if owns(uid)` por uma função
  `validTransaction()` que confere campos.
- Custo: regras proprietárias são O(1) — não há busca cruzada. Custo de reads
  é dominated pela query, não pelas regras.
