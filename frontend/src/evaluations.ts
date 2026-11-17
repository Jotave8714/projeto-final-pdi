export type ProcessingMode = 'passo-a-passo' | 'resultado-final'

export type Evaluation = {
  id: string
  nota: number
  comentario?: string
  dataHora: string
  modo: ProcessingMode
  tecnicas: string[]
  simulado: boolean
}

export const EVALUATION_PREFIX = 'redoc:avaliacao:v1:'

const dayFormatter = new Intl.DateTimeFormat('en-CA', {
  timeZone: 'America/Fortaleza', year: 'numeric', month: '2-digit', day: '2-digit',
})

function isEvaluation(value: unknown): value is Evaluation {
  if (typeof value !== 'object' || value === null) return false
  const entry = value as Record<string, unknown>
  return typeof entry.id === 'string' && entry.id.length > 0
    && Number.isInteger(entry.nota) && Number(entry.nota) >= 1 && Number(entry.nota) <= 5
    && (entry.comentario === undefined || typeof entry.comentario === 'string')
    && typeof entry.dataHora === 'string'
    && /^\d{4}-\d{2}-\d{2}T/.test(entry.dataHora) && Number.isFinite(Date.parse(entry.dataHora))
    && (entry.modo === 'passo-a-passo' || entry.modo === 'resultado-final')
    && Array.isArray(entry.tecnicas) && entry.tecnicas.length > 0
    && entry.tecnicas.every((technique) => typeof technique === 'string' && technique.length > 0)
    && typeof entry.simulado === 'boolean'
}

export function readEvaluations(storage: Storage = window.localStorage) {
  const evaluations: Evaluation[] = []
  let invalidCount = 0
  for (let index = 0; index < storage.length; index++) {
    const key = storage.key(index)
    if (!key?.startsWith(EVALUATION_PREFIX)) continue
    try {
      const entry: unknown = JSON.parse(storage.getItem(key) ?? 'null')
      if (!isEvaluation(entry) || key !== EVALUATION_PREFIX + entry.id) {
        invalidCount++
        continue
      }
      evaluations.push(entry)
    } catch (error) {
      if (!(error instanceof SyntaxError)) throw error
      invalidCount++
    }
  }
  evaluations.sort((a, b) => Date.parse(b.dataHora) - Date.parse(a.dataHora) || a.id.localeCompare(b.id))
  return { evaluations, invalidCount }
}

export function saveEvaluation(evaluation: Evaluation, storage: Storage = window.localStorage) {
  if (!isEvaluation(evaluation)) throw new Error('Os dados da avaliação são inválidos.')
  // Cada registro tem sua própria chave para preservar gravações de abas diferentes.
  const record: Evaluation = {
    id: evaluation.id,
    nota: evaluation.nota,
    dataHora: evaluation.dataHora,
    modo: evaluation.modo,
    tecnicas: [...evaluation.tecnicas],
    simulado: evaluation.simulado,
  }
  const comment = evaluation.comentario?.trim()
  if (comment) record.comentario = comment
  storage.setItem(EVALUATION_PREFIX + record.id, JSON.stringify(record))
}

export function evaluationDay(evaluation: Evaluation) {
  const parts = dayFormatter.formatToParts(new Date(evaluation.dataHora))
  const part = (type: Intl.DateTimeFormatPartTypes) => parts.find((entry) => entry.type === type)?.value
  return `${part('year')}-${part('month')}-${part('day')}`
}

export function filterEvaluations(evaluations: Evaluation[], filters: { from: string; to: string; simulado: boolean }) {
  return evaluations.filter((entry) => {
    const day = evaluationDay(entry)
    return entry.simulado === filters.simulado
      && (!filters.from || day >= filters.from) && (!filters.to || day <= filters.to)
  })
}

export function summarizeEvaluations(evaluations: Evaluation[]) {
  const distribution = [0, 0, 0, 0, 0]
  let sum = 0
  for (const entry of evaluations) {
    distribution[entry.nota - 1]++
    sum += entry.nota
  }
  return {
    count: evaluations.length,
    average: evaluations.length ? sum / evaluations.length : null,
    distribution,
  }
}

const demoComments = [
  'As letras ficaram mais nítidas e consegui ler quase todo o texto.',
  'A leitura melhorou, mas alguns trechos ainda exigem atenção.',
  'O contraste ajudou em parte do documento; outras linhas continuam fracas.',
  'Alguns traços finos desapareceram no resultado final.',
  'Os títulos e as linhas principais ficaram mais fáceis de acompanhar.',
  'Consegui ler as palavras que estavam com pouco contraste.',
  'A melhoria foi discreta nos trechos mais apagados.',
  'O resultado dificultou a leitura de várias letras pequenas.',
  'O texto ficou mais definido, com pequenas perdas nos detalhes.',
  'Algumas palavras ficaram claras, mas ainda há dúvidas na leitura.',
  'A separação entre o texto e o fundo ficou bem visível.',
  'O resultado ficou muito escuro em algumas linhas.',
  'A maioria dos trechos está legível após o processamento.',
  'Melhorou a leitura geral, principalmente nos parágrafos centrais.',
  'Ainda precisei consultar o original para interpretar algumas palavras.',
  'Os caracteres estão bem destacados e a leitura ficou confortável.',
  'A imagem binária perdeu detalhes importantes das letras.',
  'O ganho de contraste facilitou a consulta do documento.',
  'O resultado ficou claro e consegui acompanhar todas as linhas.',
  'Houve melhora, mas as letras menores continuam difíceis.',
  'O texto ficou menos legível depois de todas as etapas.',
  'As palavras estão mais fáceis de distinguir, com poucos trechos fracos.',
  'A leitura ficou razoável, sem resolver os trechos mais apagados.',
  'A nitidez do texto melhorou bastante para a leitura.',
]
const demoScores = [5, 4, 3, 2, 4, 5, 3, 1, 4, 3, 5, 2, 4, 4, 3, 5, 2, 4, 5, 3, 1, 4, 3, 5]

export function loadDemoEvaluations(storage: Storage = window.localStorage) {
  let added = 0
  for (let index = 0; index < 24; index++) {
    const id = `demo-202611-${String(index + 1).padStart(2, '0')}`
    if (storage.getItem(EVALUATION_PREFIX + id) !== null) continue
    const day = 12 + Math.floor(index / 4)
    const hour = String(9 + (index % 4) * 3).padStart(2, '0')
    const minute = String((index * 7) % 60).padStart(2, '0')
    saveEvaluation({
      id,
      nota: demoScores[index],
      comentario: demoComments[index],
      dataHora: new Date(`2026-11-${day}T${hour}:${minute}:00-03:00`).toISOString(),
      modo: index % 2 === 0 ? 'passo-a-passo' : 'resultado-final',
      tecnicas: ['Escala de cinza', 'CLAHE', 'Equalização global', 'Ajuste de contraste', 'Filtro de Fourier', 'Otsu'],
      simulado: true,
    }, storage)
    added++
  }
  return added
}

export function clearDemoEvaluations(storage: Storage = window.localStorage) {
  const { evaluations } = readEvaluations(storage)
  let removed = 0
  for (const entry of evaluations) {
    if (!entry.simulado) continue
    storage.removeItem(EVALUATION_PREFIX + entry.id)
    removed++
  }
  return removed
}
