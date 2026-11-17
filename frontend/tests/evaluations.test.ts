import test from 'node:test'
import assert from 'node:assert/strict'
import {
  clearDemoEvaluations, EVALUATION_PREFIX, evaluationDay, filterEvaluations,
  loadDemoEvaluations, readEvaluations, saveEvaluation, summarizeEvaluations,
} from '../src/evaluations.ts'
import type { Evaluation } from '../src/evaluations.ts'

class MemoryStorage implements Storage {
  entries = new Map<string, string>()
  get length() { return this.entries.size }
  key(index: number) { return [...this.entries.keys()][index] ?? null }
  getItem(key: string) { return this.entries.get(key) ?? null }
  setItem(key: string, value: string) { this.entries.set(key, value) }
  removeItem(key: string) { this.entries.delete(key) }
  clear() { this.entries.clear() }
}

function real(id = 'real-1', nota = 4): Evaluation {
  return {
    id, nota, comentario: 'Leitura melhorou.', dataHora: '2026-11-17T15:30:00.000Z',
    modo: 'resultado-final', tecnicas: ['Escala de cinza', 'CLAHE', 'Otsu'], simulado: false,
  }
}

test('salva somente os campos da avaliação e mantém o comentário opcional', () => {
  const storage = new MemoryStorage()
  saveEvaluation({ ...real(), comentario: '  Texto mais claro.  ', imagem: 'dados privados' } as Evaluation, storage)
  const stored = JSON.parse(storage.getItem(EVALUATION_PREFIX + 'real-1')!)
  assert.deepEqual(Object.keys(stored).sort(), ['id', 'nota', 'comentario', 'dataHora', 'modo', 'tecnicas', 'simulado'].sort())
  assert.equal(stored.comentario, 'Texto mais claro.')
  saveEvaluation({ ...real('real-2'), comentario: '   ' }, storage)
  assert.equal('comentario' in readEvaluations(storage).evaluations.find((entry) => entry.id === 'real-2')!, false)
})

test('rejeita notas e metadados inválidos antes da gravação', () => {
  const storage = new MemoryStorage()
  for (const nota of [0, 6, 2.5, NaN]) assert.throws(() => saveEvaluation(real('invalid', nota), storage))
  assert.throws(() => saveEvaluation({ ...real(), dataHora: '17/11/2026' }, storage))
  assert.throws(() => saveEvaluation({ ...real(), tecnicas: [] }, storage))
  assert.equal(storage.length, 0)
})

test('cada ID tem sua chave e reenviar o mesmo ID não duplica a avaliação', () => {
  const storage = new MemoryStorage()
  saveEvaluation(real('a'), storage)
  saveEvaluation(real('b', 2), storage)
  saveEvaluation(real('a'), storage)
  assert.equal(readEvaluations(storage).evaluations.length, 2)
})

test('a carga gera exatamente 230 registros identificados e é idempotente', () => {
  const storage = new MemoryStorage()
  assert.equal(loadDemoEvaluations(storage), 230)
  assert.equal(loadDemoEvaluations(storage), 0)
  const { evaluations } = readEvaluations(storage)
  assert.equal(evaluations.length, 230)
  assert.equal(new Set(evaluations.map((entry) => entry.id)).size, 230)
  assert(evaluations.every((entry) => entry.simulado === true))
  assert.equal(new Set(evaluations.map((entry) => entry.nota)).size, 3)
  assert.equal(summarizeEvaluations(evaluations).average, 4.5)
  const days = evaluations.map(evaluationDay).sort()
  assert.equal(days[0], '2026-11-12')
  assert.equal(days.at(-1), '2026-11-17')
  for (let day = 12; day <= 17; day++) assert.equal(days.filter((entry) => entry === `2026-11-${day}`).length, day <= 13 ? 39 : 38)
})

test('carga interrompida pode ser completada sem duplicações', () => {
  class LimitedStorage extends MemoryStorage {
    remaining = 5
    setItem(key: string, value: string) {
      if (this.remaining-- === 0) throw new Error('QuotaExceededError')
      super.setItem(key, value)
    }
  }
  const storage = new LimitedStorage()
  assert.throws(() => loadDemoEvaluations(storage))
  assert.equal(storage.length, 5)
  storage.remaining = 300
  assert.equal(loadDemoEvaluations(storage), 225)
  assert.equal(storage.length, 230)
})

test('limpar simulações preserva avaliações reais e outras chaves', () => {
  const storage = new MemoryStorage()
  saveEvaluation(real(), storage)
  storage.setItem('outra-chave', 'preservar')
  loadDemoEvaluations(storage)
  assert.equal(clearDemoEvaluations(storage), 230)
  assert.deepEqual(readEvaluations(storage).evaluations, [real()])
  assert.equal(storage.getItem('outra-chave'), 'preservar')
  assert.equal(clearDemoEvaluations(storage), 0)
})

test('filtros incluem os limites do período no fuso de Fortaleza e separam os tipos', () => {
  const storage = new MemoryStorage()
  loadDemoEvaluations(storage)
  saveEvaluation(real(), storage)
  const { evaluations } = readEvaluations(storage)
  assert.equal(filterEvaluations(evaluations, { from: '2026-11-12', to: '2026-11-12', simulado: true }).length, 39)
  assert.equal(filterEvaluations(evaluations, { from: '2026-11-12', to: '2026-11-17', simulado: true }).length, 230)
  assert.equal(filterEvaluations(evaluations, { from: '', to: '', simulado: false }).length, 1)
  assert.equal(evaluationDay({ ...real(), dataHora: '2026-11-13T01:00:00.000Z' }), '2026-11-12')
})

test('indicadores reais mantêm a média e a distribuição após carregar simulações', () => {
  const storage = new MemoryStorage()
  saveEvaluation(real('a', 5), storage)
  saveEvaluation(real('b', 2), storage)
  loadDemoEvaluations(storage)
  const records = filterEvaluations(readEvaluations(storage).evaluations, { from: '', to: '', simulado: false })
  assert.deepEqual(summarizeEvaluations(records), { count: 2, average: 3.5, distribution: [0, 1, 0, 0, 1] })
  assert.equal(summarizeEvaluations([]).average, null)
})

test('registros inválidos são informados e preservados junto dos registros válidos', () => {
  const storage = new MemoryStorage()
  saveEvaluation(real(), storage)
  storage.setItem(EVALUATION_PREFIX + 'broken', '{')
  storage.setItem(EVALUATION_PREFIX + 'nota-invalida', JSON.stringify(real('nota-invalida', 9)))
  const result = readEvaluations(storage)
  assert.equal(result.invalidCount, 2)
  assert.deepEqual(result.evaluations, [real()])
  assert.equal(storage.getItem(EVALUATION_PREFIX + 'broken'), '{')
})

test('falhas de acesso e de gravação são propagadas para a interface', () => {
  class BlockedStorage extends MemoryStorage {
    getItem(): never { throw new Error('SecurityError') }
    setItem(): never { throw new Error('QuotaExceededError') }
  }
  const storage = new BlockedStorage()
  storage.entries.set(EVALUATION_PREFIX + 'a', '{}')
  assert.throws(() => readEvaluations(storage), /SecurityError/)
  assert.throws(() => saveEvaluation(real(), storage), /QuotaExceededError/)
})
