import { useCallback, useEffect, useId, useState } from 'react'
import { clearDemoEvaluations, EVALUATION_PREFIX, filterEvaluations, loadDemoEvaluations, readEvaluations, summarizeEvaluations } from './evaluations'
import type { Evaluation } from './evaluations'

const numberFormatter = new Intl.NumberFormat('pt-BR', { maximumFractionDigits: 2 })
const dateFormatter = new Intl.DateTimeFormat('pt-BR', {
  timeZone: 'America/Fortaleza', dateStyle: 'short', timeStyle: 'short',
})

function readSnapshot() {
  try {
    return { ...readEvaluations(), loaded: true, error: null as string | null }
  } catch {
    return {
      evaluations: [] as Evaluation[], invalidCount: 0, loaded: false,
      error: 'Não foi possível acessar as avaliações deste navegador. Verifique a disponibilidade do armazenamento local.',
    }
  }
}

function EvaluationSummary({ evaluations, simulated }: { evaluations: Evaluation[]; simulated: boolean }) {
  const titleId = useId()
  const { count, average, distribution } = summarizeEvaluations(evaluations)
  return (
    <section className="panel evaluation-summary" aria-labelledby={titleId} data-type={simulated ? 'simulated' : 'real'}>
      <h2 id={titleId}>{simulated ? 'Dados simulados · demonstração' : 'Indicadores acadêmicos · avaliações reais'}</h2>
      <p>{simulated ? 'Avaliações fictícias para demonstrar o painel no período selecionado.' : 'Calculados exclusivamente com avaliações reais no período selecionado.'}</p>
      <dl className="evaluation-totals">
        <div><dt>Quantidade de avaliações</dt><dd data-metric="count">{count}</dd></div>
        <div><dt>Média de estrelas</dt><dd data-metric="average">{average === null ? '—' : `${numberFormatter.format(average)} / 5`}</dd></div>
      </dl>
      <h3>Distribuição das notas</h3>
      <ol className="evaluation-distribution" aria-label="Distribuição das notas">
        {distribution.map((frequency, index) => (
          <li key={index}>
            <span>{index + 1} {index === 0 ? 'estrela' : 'estrelas'}</span>
            <meter min={0} max={Math.max(1, count)} value={frequency} aria-label={`${index + 1} estrelas: ${frequency} avaliações`} />
            <span>{frequency} <small>({count ? Math.round(frequency / count * 100) : 0}%)</small></span>
          </li>
        ))}
      </ol>
    </section>
  )
}

export default function Admin() {
  const [snapshot, setSnapshot] = useState(readSnapshot)
  const { evaluations, invalidCount, loaded, error } = snapshot
  const [notice, setNotice] = useState('')
  const [from, setFrom] = useState('')
  const [to, setTo] = useState('')
  const [type, setType] = useState('real')
  const invalidPeriod = Boolean(from && to && from > to)

  const refresh = useCallback(() => setSnapshot(readSnapshot()), [])

  useEffect(() => {
    function onStorage(event: StorageEvent) {
      if (event.key === null || event.key.startsWith(EVALUATION_PREFIX)) refresh()
    }
    window.addEventListener('storage', onStorage)
    return () => window.removeEventListener('storage', onStorage)
  }, [refresh])

  function loadDemo() {
    try {
      const added = loadDemoEvaluations()
      refresh()
      setType('simulated')
      setNotice(added ? `${added} avaliações simuladas adicionadas.` : 'Os registros de demonstração já estão carregados.')
    } catch {
      setSnapshot({ ...readSnapshot(), error: 'Não foi possível concluir a carga. Verifique o espaço disponível e tente novamente para completar os registros restantes.' })
    }
  }

  function clearDemo() {
    try {
      const removed = clearDemoEvaluations()
      refresh()
      setNotice(`${removed} avaliações simuladas removidas.`)
    } catch {
      setSnapshot({ ...readSnapshot(), error: 'Não foi possível concluir a remoção dos dados simulados. Tente novamente.' })
    }
  }

  const realEvaluations = filterEvaluations(evaluations, { from, to, simulado: false })
  const simulatedEvaluations = filterEvaluations(evaluations, { from, to, simulado: true })
  const history = type === 'simulated' ? simulatedEvaluations : realEvaluations
  const hasSimulated = evaluations.some((entry) => entry.simulado)

  return (
    <main className="app admin-app">
      <header className="admin-header">
        <a href="/">Voltar ao REDOC</a>
        <h1>Avaliações de legibilidade</h1>
        <p>Recurso administrativo demonstrativo. Os dados ficam neste navegador e neste endereço, com acesso local sem autenticação.</p>
      </header>
      <section className="panel admin-filters" aria-label="Filtros de avaliações">
        <div className="evaluation-filters">
          <label>De<input type="date" value={from} max={to || undefined} onChange={(event) => setFrom(event.target.value)} /></label>
          <label>Até<input type="date" value={to} min={from || undefined} onChange={(event) => setTo(event.target.value)} /></label>
          <label>Tipo de avaliação<select value={type} onChange={(event) => setType(event.target.value)}>
            <option value="real">Reais</option><option value="simulated">Simuladas</option>
          </select></label>
          <button type="button" className="secondary" onClick={() => { setFrom(''); setTo(''); setType('real') }}>Limpar filtros</button>
        </div>
        <p>Datas e horários de Fortaleza (UTC−3). O período inclui as duas datas selecionadas.</p>
        {invalidPeriod && <p className="error" role="alert">A data inicial deve ser anterior ou igual à data final.</p>}
      </section>
      <section className="panel admin-demo" aria-label="Dados de demonstração">
        <h2>Dados de demonstração</h2>
        <p>24 avaliações fictícias entre 12 e 17 de novembro de 2026, identificadas como simuladas.</p>
        <div className="actions">
          <button type="button" onClick={loadDemo}>Carregar dados de demonstração</button>
          <button type="button" className="secondary" disabled={!hasSimulated} onClick={clearDemo}>Limpar dados simulados</button>
        </div>
        {notice && <p role="status" className="evaluation-notice">{notice}</p>}
      </section>
      {error && <div className="panel"><p className="error" role="alert">{error}</p><button className="secondary" onClick={refresh}>Tentar novamente</button></div>}
      {invalidCount > 0 && <p className="evaluation-storage-warning" role="status">{invalidCount} registros locais inválidos foram ignorados.</p>}
      {loaded && !invalidPeriod && (
        <>
          <EvaluationSummary evaluations={realEvaluations} simulated={false} />
          {type === 'simulated' && <EvaluationSummary evaluations={simulatedEvaluations} simulated />}
          <section className="panel" aria-labelledby="evaluation-history-title">
            <h2 id="evaluation-history-title">Histórico de avaliações {type === 'simulated' ? 'simuladas' : 'reais'}</h2>
            <p>{history.length} avaliações no período selecionado.</p>
            {history.length === 0 ? <p className="evaluation-empty">Nenhuma avaliação encontrada para estes filtros.</p> : (
              <ol className="evaluation-history">
                {history.map((entry) => (
                  <li key={entry.id}>
                    <div className="evaluation-history-heading">
                      <strong className="evaluation-score" aria-label={`${entry.nota} de 5 estrelas`}>{entry.nota}<span> / 5</span></strong>
                      <span className={`evaluation-kind ${entry.simulado ? 'simulated' : ''}`}>{entry.simulado ? 'Simulada · dado fictício' : 'Real'}</span>
                      <time dateTime={entry.dataHora}>{dateFormatter.format(new Date(entry.dataHora))}</time>
                    </div>
                    <p className="evaluation-history-comment">{entry.comentario || 'Sem comentário.'}</p>
                    <p className="evaluation-history-mode">{entry.modo === 'passo-a-passo' ? 'Passo a passo' : 'Resultado final'}</p>
                    <details><summary>Técnicas aplicadas</summary><p>{entry.tecnicas.join(' · ')}</p></details>
                  </li>
                ))}
              </ol>
            )}
          </section>
        </>
      )}
    </main>
  )
}
