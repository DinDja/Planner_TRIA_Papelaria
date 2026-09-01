import type { ShoppingListKind } from './types'

export interface PresetItem {
  name: string
  quantity?: string
  category?: string
  dosage?: string
}

export interface PresetCombo {
  id: string
  label: string
  description: string
  items: PresetItem[]
}

export interface ListKindMeta {
  kind: ShoppingListKind
  label: string
  description: string
  defaultColor?: string
  presetCategories: string[]
  presetItems: PresetItem[]
  combos: PresetCombo[]
}

export const LIST_KINDS: ListKindMeta[] = [
  {
    kind: 'supermercado',
    label: 'Supermercado',
    description: 'Mercado, feira e despensa',
    defaultColor: '#7bb686',
    presetCategories: [
      'Grãos',
      'Laticínios',
      'Padaria',
      'Carnes',
      'Frutas',
      'Hortaliças',
      'Bebidas',
      'Limpeza',
      'Higiene',
      'Enlatados e conservas',
      'Temperos',
      'Congelados',
      'Doces e sobremesas',
    ],
    // Supermercado: sem presets fixos — o usuário cadastra os próprios
    // "prontos para usar" (coleção listPresets, ver use-lists-store).
    presetItems: [],
    combos: [],
  },
  {
    kind: 'farmacia',
    label: 'Farmácia',
    description: 'Medicamentos e cuidados com a saúde',
    defaultColor: '#5b8dbf',
    presetCategories: [
      'Medicamentos',
      'Vitaminas e suplementos',
      'Cuidados com a pele',
      'Higiene',
      'Primeiros socorros',
      'Infantil',
    ],
    presetItems: [
      
    ],
    combos: [
      {
        id: 'farma-resfriado',
        label: 'Kit resfriado',
        description: 'Dor, febre e nariz entupido',
        items: [
          { name: 'Paracetamol', quantity: '500mg', category: 'Medicamentos', dosage: 'Se dor ou febre' },
          { name: 'Dipirona', category: 'Medicamentos', dosage: 'Se dor ou febre' },
          { name: 'Antialérgico', category: 'Medicamentos' },
          { name: 'Xarope para tosse', category: 'Medicamentos', dosage: 'Conforme a bula' },
          { name: 'Soro fisiológico', category: 'Primeiros socorros' },
          { name: 'Vitamina C', category: 'Vitaminas e suplementos', dosage: '1x ao dia' },
        ],
      },
      {
        id: 'farma-primeiros',
        label: 'Kit primeiros socorros',
        description: 'Curativos e emergências leves',
        items: [
          { name: 'Curativos', category: 'Primeiros socorros' },
          { name: 'Atadura', category: 'Primeiros socorros' },
          { name: 'Gaze', category: 'Primeiros socorros' },
          { name: 'Soro fisiológico', category: 'Primeiros socorros' },
          { name: 'Termômetro', category: 'Primeiros socorros' },
          { name: 'Álcool em gel', category: 'Higiene' },
          { name: 'Paracetamol', quantity: '500mg', category: 'Medicamentos', dosage: 'Se dor ou febre' },
        ],
      },
      {
        id: 'farma-viagem',
        label: 'Kit viagem',
        description: 'O que não pode faltar na bolsa',
        items: [
          { name: 'Dramin', category: 'Medicamentos', dosage: 'Antes de viajar' },
          { name: 'Protetor solar', quantity: 'FPS 50', category: 'Cuidados com a pele' },
          { name: 'Repelente', category: 'Cuidados com a pele' },
          { name: 'Álcool em gel', category: 'Higiene' },
          { name: 'Curativos', category: 'Primeiros socorros' },
          { name: 'Dipirona', category: 'Medicamentos', dosage: 'Se dor ou febre' },
        ],
      },
      {
        id: 'farma-higiene',
        label: 'Higiene pessoal',
        description: 'Cuidado diário',
        items: [
          { name: 'Hidratante facial', category: 'Cuidados com a pele' },
          { name: 'Água micelar', category: 'Cuidados com a pele' },
          { name: 'Sabonete facial', category: 'Cuidados com a pele' },
          { name: 'Fio dental', category: 'Higiene' },
          { name: 'Cotonetes', category: 'Higiene' },
          { name: 'Algodão', category: 'Higiene' },
          { name: 'Desodorante', category: 'Higiene' },
        ],
      },
    ],
  },
  {
    kind: 'mala',
    label: 'Mala de viagem',
    description: 'Itens para não esquecer antes de viajar',
    defaultColor: '#c9b6e4',
    presetCategories: [
      'Documentos',
      'Vestuário',
      'Higiene e cosméticos',
      'Acessórios',
      'Saúde e farmácia',
      'Calçados',
      'Eletrônicos e cabos',
    ],
    presetItems: [
      { name: 'Passaporte', category: 'Documentos' },
      { name: 'RG', category: 'Documentos' },
      { name: 'Cartão de embarque', category: 'Documentos' },
      { name: 'Carteira de vacinação', category: 'Documentos' },
      { name: 'Seguro viagem', category: 'Documentos' },
      { name: 'Camisetas', quantity: '3 un', category: 'Vestuário' },
      { name: 'Calças', quantity: '2 un', category: 'Vestuário' },
      { name: 'Roupa íntima', quantity: '5 un', category: 'Vestuário' },
      { name: 'Meias', quantity: '5 pares', category: 'Vestuário' },
      { name: 'Casaco', category: 'Vestuário' },
      { name: 'Pijama', category: 'Vestuário' },
      { name: 'Protetor solar', category: 'Higiene e cosméticos' },
      { name: 'Repelente', category: 'Higiene e cosméticos' },
      { name: 'Escova de dente', category: 'Higiene e cosméticos' },
      { name: 'Pasta de dente', category: 'Higiene e cosméticos' },
      { name: 'Desodorante', category: 'Higiene e cosméticos' },
      { name: 'Shampoo', category: 'Higiene e cosméticos' },
      { name: 'Óculos de sol', category: 'Acessórios' },
      { name: 'Cinto', category: 'Acessórios' },
      { name: 'Remédios de uso contínuo', category: 'Saúde e farmácia' },
      { name: 'Analgésico', category: 'Saúde e farmácia' },
      { name: 'Dramin', category: 'Saúde e farmácia', dosage: 'Antes de viajar' },
      { name: 'Tênis', category: 'Calçados' },
      { name: 'Chinelo', category: 'Calçados' },
      { name: 'Sapatos', category: 'Calçados' },
      { name: 'Carregador do celular', category: 'Eletrônicos e cabos' },
      { name: 'Power bank', category: 'Eletrônicos e cabos' },
      { name: 'Fone de ouvido', category: 'Eletrônicos e cabos' },
      { name: 'Adaptador de tomada', category: 'Eletrônicos e cabos' },
    ],
    combos: [
      {
        id: 'mala-docs',
        label: 'Documentos e eletrônicos',
        description: 'O essencial para qualquer viagem',
        items: [
          { name: 'Passaporte', category: 'Documentos' },
          { name: 'RG', category: 'Documentos' },
          { name: 'Cartão de embarque', category: 'Documentos' },
          { name: 'Carteira de vacinação', category: 'Documentos' },
          { name: 'Seguro viagem', category: 'Documentos' },
          { name: 'Carregador do celular', category: 'Eletrônicos e cabos' },
          { name: 'Power bank', category: 'Eletrônicos e cabos' },
          { name: 'Fone de ouvido', category: 'Eletrônicos e cabos' },
          { name: 'Adaptador de tomada', category: 'Eletrônicos e cabos' },
        ],
      },
      {
        id: 'mala-praia',
        label: 'Combo praia',
        description: 'Sol, calor e pé na areia',
        items: [
          { name: 'Protetor solar', category: 'Higiene e cosméticos' },
          { name: 'Repelente', category: 'Higiene e cosméticos' },
          { name: 'Óculos de sol', category: 'Acessórios' },
          { name: 'Chinelo', category: 'Calçados' },
          { name: 'Camisetas', quantity: '3 un', category: 'Vestuário' },
          { name: 'Roupa íntima', quantity: '5 un', category: 'Vestuário' },
          { name: 'Meias', quantity: '5 pares', category: 'Vestuário' },
        ],
      },
      {
        id: 'mala-trabalho',
        label: 'Trabalho / passeio',
        description: 'Roupas e calçados para o dia',
        items: [
          { name: 'Camisetas', quantity: '3 un', category: 'Vestuário' },
          { name: 'Calças', quantity: '2 un', category: 'Vestuário' },
          { name: 'Roupa íntima', quantity: '5 un', category: 'Vestuário' },
          { name: 'Meias', quantity: '5 pares', category: 'Vestuário' },
          { name: 'Sapatos', category: 'Calçados' },
          { name: 'Cinto', category: 'Acessórios' },
          { name: 'Casaco', category: 'Vestuário' },
        ],
      },
      {
        id: 'mala-higiene',
        label: 'Higiene e remédios',
        description: 'Necessaire completa',
        items: [
          { name: 'Escova de dente', category: 'Higiene e cosméticos' },
          { name: 'Pasta de dente', category: 'Higiene e cosméticos' },
          { name: 'Desodorante', category: 'Higiene e cosméticos' },
          { name: 'Shampoo', category: 'Higiene e cosméticos' },
          { name: 'Protetor solar', category: 'Higiene e cosméticos' },
          { name: 'Remédios de uso contínuo', category: 'Saúde e farmácia' },
          { name: 'Analgésico', category: 'Saúde e farmácia' },
          { name: 'Dramin', category: 'Saúde e farmácia', dosage: 'Antes de viajar' },
        ],
      },
    ],
  },
  {
    kind: 'custom',
    label: 'Personalizada',
    description: 'Tarefas e listas livres',
    presetCategories: [],
    presetItems: [],
    combos: [],
  },
]

export function getListKindMeta(kind?: string): ListKindMeta {
  const meta = LIST_KINDS.find((k) => k.kind === kind) ?? LIST_KINDS[3]
  if (meta.kind === 'supermercado' || meta.kind === 'mala') {
    return { ...meta, presetItems: [], combos: [] }
  }
  return meta
}
