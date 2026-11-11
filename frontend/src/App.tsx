import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import type { ChangeEvent, DragEvent } from 'react'
import mascote from './assets/mascote.png'
import './App.css'

type Method = 'clahe' | 'equalize' | 'contrast' | 'fourier' | 'otsu'

type ProcessResponse = {
  method: Method
  params: Record<string, number | string>
  width: number
  height: number
  processed_png_base64: string
}

type View = 'choice' | 'steps' | 'result'

type FinalResult = { blob: Blob; steps: { label: string; params: Record<string, number | string> }[] }

type Tuning = { alpha: number; beta: number; clipLimit: number; tileGrid: number }

type Preview = { blob: Blob; params: Record<string, number | string>; width: number; height: number }

// Ordem fixa do pipeline: cada etapa recebe a saída da anterior.
const STEPS: { value: Method; label: string; hint: string }[] = [
  { value: 'clahe', label: 'CLAHE', hint: 'Realce local com limite de amplificação' },
  { value: 'equalize', label: 'Equalização global', hint: 'Redistribui intensidades em toda a imagem' },
  { value: 'contrast', label: 'Ajuste de contraste', hint: 'g = α·f + β com saturação em 8 bits' },
  { value: 'fourier', label: 'Filtro de Fourier', hint: 'Remove listras periódicas no domínio da frequência' },
  { value: 'otsu', label: 'Otsu (binária)', hint: 'Experimental: traços fracos podem desaparecer' },
]

const ACCEPTED = ['image/png', 'image/jpeg']
const MAX_BYTES = 20 * 1024 * 1024

function formatBytes(n: number) {
  if (n < 1024 * 1024) return `${Math.max(1, Math.round(n / 1024))} KB`
  return `${(n / (1024 * 1024)).toFixed(1)} MB`
}

function useObjectUrl(blob: Blob | null) {
  const url = useMemo(() => (blob ? URL.createObjectURL(blob) : null), [blob])
  useEffect(() => () => {
    if (url) URL.revokeObjectURL(url)
  }, [url])
  return url
}

// Imagem com skeleton: o shimmer aparece até o navegador terminar de carregar o arquivo.
function Frame({ src, alt }: { src: string; alt: string }) {
  const [loaded, setLoaded] = useState(false)
  const ref = useRef<HTMLImageElement>(null)
  useEffect(() => {
    if (ref.current?.complete) setLoaded(true)
  }, [])
  return (
    <div className={`frame${loaded ? ' is-loaded' : ''}`}>
      <img ref={ref} src={src} alt={alt} onLoad={() => setLoaded(true)} />
    </div>
  )
}

function Skeleton({ label }: { label: string }) {
  return (
    <div className="frame skeleton" role="status" aria-label={label}>
      <span>{label}</span>
    </div>
  )
}

function base64ToBlob(b64: string): Blob {
  const bin = atob(b64)
  const bytes = new Uint8Array(bin.length)
  for (let i = 0; i < bin.length; i++) bytes[i] = bin.charCodeAt(i)
  return new Blob([bytes], { type: 'image/png' })
}

async function callProcess(file: Blob, method: Method, t: Tuning, signal: AbortSignal): Promise<ProcessResponse> {
  const body = new FormData()
  body.append('file', file, 'atual.png')
  body.append('method', method)
  if (method === 'contrast') {
    body.append('alpha', String(t.alpha))
    body.append('beta', String(t.beta))
  }
  if (method === 'clahe') {
    body.append('clip_limit', String(t.clipLimit))
    body.append('tile_grid_size', String(t.tileGrid))
  }
  const res = await fetch('/api/process', { method: 'POST', body, signal })
  if (!res.ok) {
    const detail = await res.json().catch(() => null)
    throw new Error(typeof detail?.detail === 'string' ? detail.detail : `Erro ${res.status} ao processar a imagem.`)
  }
  return (await res.json()) as ProcessResponse
}

function App() {
  const [original, setOriginal] = useState<File | null>(null)
  // history[0] = original; history[k] = imagem após k etapas aplicadas.
  const [history, setHistory] = useState<Blob[]>([])
  const [alpha, setAlpha] = useState(1.5)
  const [beta, setBeta] = useState(0)
  const [clipLimit, setClipLimit] = useState(2)
  const [tileGrid, setTileGrid] = useState(8)
  const [preview, setPreview] = useState<Preview | null>(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [dragging, setDragging] = useState(false)
  const [view, setView] = useState<View>('choice')
  const [finalResult, setFinalResult] = useState<FinalResult | null>(null)
  const [finalProgress, setFinalProgress] = useState(0)
  const [finalError, setFinalError] = useState<string | null>(null)

  const stepIndex = Math.max(history.length - 1, 0)
  const finished = history.length > 0 && stepIndex >= STEPS.length
  const step = history.length > 0 && !finished ? STEPS[stepIndex] : null
  const current = history.length > 0 ? history[history.length - 1] : null

  const originalUrl = useObjectUrl(original)
  const currentUrl = useObjectUrl(current)
  const futureUrl = useObjectUrl(preview?.blob ?? null)
  const finalUrl = useObjectUrl(finalResult?.blob ?? null)

  // Prévia: resultado da etapa atual aplicado à imagem atual (com debounce nos parâmetros).
  useEffect(() => {
    if (view !== 'steps' || !current || !step) return
    const controller = new AbortController()
    const timer = setTimeout(async () => {
      setLoading(true)
      setError(null)
      try {
        const data = await callProcess(current, step.value, { alpha, beta, clipLimit, tileGrid }, controller.signal)
        setPreview({
          blob: base64ToBlob(data.processed_png_base64),
          params: data.params,
          width: data.width,
          height: data.height,
        })
      } catch (err) {
        if (controller.signal.aborted) return
        setPreview(null)
        setError(err instanceof Error ? err.message : 'Falha de conexão com a API.')
      } finally {
        if (!controller.signal.aborted) setLoading(false)
      }
    }, 300)
    return () => {
      clearTimeout(timer)
      controller.abort()
    }
  }, [view, current, step, alpha, beta, clipLimit, tileGrid])

  // Resultado final: aplica as quatro etapas em sequência sobre o original.
  useEffect(() => {
    if (view !== 'result' || !original) return
    const controller = new AbortController()
    ;(async () => {
      setFinalResult(null)
      setFinalError(null)
      setFinalProgress(0)
      try {
        let atual: Blob = original
        const aplicadas: FinalResult['steps'] = []
        for (const [i, st] of STEPS.entries()) {
          setFinalProgress(i)
          const data = await callProcess(atual, st.value, { alpha, beta, clipLimit, tileGrid }, controller.signal)
          atual = base64ToBlob(data.processed_png_base64)
          aplicadas.push({ label: st.label, params: data.params })
        }
        setFinalProgress(STEPS.length)
        setFinalResult({ blob: atual, steps: aplicadas })
      } catch (err) {
        if (controller.signal.aborted) return
        setFinalError(err instanceof Error ? err.message : 'Falha de conexão com a API.')
      }
    })()
    return () => controller.abort()
  }, [view, original, alpha, beta, clipLimit, tileGrid])

  function handleFile(f: File | null) {
    setPreview(null)
    setError(null)
    if (!f) return
    if (!ACCEPTED.includes(f.type)) {
      setOriginal(null)
      setHistory([])
      setError('Formato não suportado. Envie um arquivo PNG ou JPEG.')
      return
    }
    if (f.size > MAX_BYTES) {
      setOriginal(null)
      setHistory([])
      setError('Arquivo maior que 20 MB. Reduza a imagem e envie de novo.')
      return
    }
    setOriginal(f)
    setHistory([f])
    setFinalResult(null)
    setView('choice')
  }

  function onInput(e: ChangeEvent<HTMLInputElement>) {
    handleFile(e.target.files?.[0] ?? null)
    e.target.value = ''
  }

  function onDragOver(e: DragEvent<HTMLLabelElement>) {
    e.preventDefault()
    e.dataTransfer.dropEffect = 'copy'
    setDragging(true)
  }

  function onDragLeave(e: DragEvent<HTMLLabelElement>) {
    if (!e.currentTarget.contains(e.relatedTarget as Node | null)) setDragging(false)
  }

  function onDrop(e: DragEvent<HTMLLabelElement>) {
    e.preventDefault()
    setDragging(false)
    handleFile(e.dataTransfer.files?.[0] ?? null)
  }

  const advance = useCallback(() => {
    if (!preview) return
    setHistory((h) => [...h, preview.blob])
    setPreview(null)
  }, [preview])

  function back() {
    setPreview(null)
    setHistory((h) => (h.length > 1 ? h.slice(0, -1) : h))
  }

  function restart() {
    if (original) setHistory([original])
    setPreview(null)
    setError(null)
  }

  function openSteps() {
    if (original) setHistory([original])
    setPreview(null)
    setError(null)
    setView('steps')
  }

  function reset() {
    setView('choice')
    setFinalResult(null)
    setOriginal(null)
    setHistory([])
    setPreview(null)
    setError(null)
  }

  const baseName = original ? original.name.replace(/\.[^.]+$/, '') : 'redoc'
  const downloadName = `${baseName}-redoc-etapa${stepIndex}.png`
  const appliedLabel =
    stepIndex === 0 ? 'Original (nenhuma etapa aplicada)' : `Após ${STEPS[stepIndex - 1].label}`

  const mascotSays = !original
    ? 'Envie o documento que eu cuido do resto.'
    : view === 'choice'
      ? 'Recebi o documento! Como você quer acompanhar?'
      : view === 'steps'
        ? finished
          ? 'Tudo aplicado. Confira o resultado final.'
          : `Etapa ${stepIndex + 1} de ${STEPS.length}. Confira a prévia antes de aplicar.`
        : finalResult
          ? 'Pronto! Aqui está o documento tratado.'
          : finalError
            ? 'Algo falhou no processamento.'
            : 'Lapidando o documento…'

  return (
    <main className="app">
      <div className={`masthead${original ? ' compact' : ''}`}>
      <header>
        <p className="eyebrow">Processamento Digital de Imagens</p>
        <h1>RE<span>DOC</span></h1>
        <p>
          Realce de texto desbotado em documentos antigos digitalizados. Envie o original: ele passa por {STEPS.length} etapas em
          sequência (CLAHE, equalização global, ajuste de contraste, filtro de Fourier e Otsu) e nunca é alterado.
        </p>
      </header>
      <div className="mascot">
        <p className="bubble" role="status">{mascotSays}</p>
        <img src={mascote} alt="Mascote do REDOC: uma lontra de terno segurando documentos" />
      </div>
      </div>

      {!original ? (
        <section className="upload">
          <label
            className={`drop${dragging ? ' is-over' : ''}`}
            onDragEnter={onDragOver}
            onDragOver={onDragOver}
            onDragLeave={onDragLeave}
            onDrop={onDrop}
          >
            <input className="sr-only" type="file" accept="image/png,image/jpeg" onChange={onInput} />
            <div className="sheet" aria-hidden="true">
              <i className="mark tl" /><i className="mark tr" /><i className="mark bl" /><i className="mark br" />
              <div className="scan" />
            </div>
            <div className="drop-body">
              <span className="drop-icon" aria-hidden="true">
                <svg viewBox="0 0 24 24" width="26" height="26" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M12 16V4" /><path d="m7 9 5-5 5 5" /><path d="M4 16v3a1 1 0 0 0 1 1h14a1 1 0 0 0 1-1v-3" />
                </svg>
              </span>
              <strong>{dragging ? 'Solte para começar' : 'Arraste o documento digitalizado'}</strong>
              <span className="drop-sub">ou <u>escolha um arquivo</u> no computador</span>
              <span className="drop-hint">PNG ou JPEG · até 20 MB</span>
            </div>
          </label>
          {error && <p role="alert" className="error">{error}</p>}
        </section>
      ) : view === 'choice' ? (
        <section className="choice">
          <div className="choice-preview">
            <p className="label">Documento enviado</p>
            {originalUrl ? <Frame key={originalUrl} src={originalUrl} alt="Pré-visualização do documento enviado" /> : <Skeleton label="Carregando" />}
          </div>
          <div className="choice-side">
            <div>
              <h2>Documento pronto para tratar</h2>
              <p className="choice-meta">{original.name} · {formatBytes(original.size)} · o original nunca é alterado</p>
            </div>
            <button type="button" className="option primary" onClick={openSteps}>
              <span className="option-title">Ver o processo passo a passo</span>
              <span className="option-sub">Acompanhe CLAHE, equalização, contraste e Otsu, uma etapa por vez, com prévia antes de aplicar.</span>
            </button>
            <button type="button" className="option" onClick={() => setView('result')}>
              <span className="option-title">Ver o resultado final</span>
              <span className="option-sub">Aplica as {STEPS.length} etapas de uma vez e mostra o original ao lado da imagem tratada.</span>
            </button>
            <button type="button" className="secondary" onClick={reset}>Trocar imagem</button>
            {error && <p role="alert" className="error">{error}</p>}
          </div>
        </section>
      ) : (
        <section className="filebar">
          {originalUrl ? <img src={originalUrl} alt="" /> : <span className="thumb-skeleton" />}
          <div>
            <strong>{original.name}</strong>
            <span>{formatBytes(original.size)} · original preservado</span>
          </div>
          <button type="button" className="secondary" onClick={reset}>Trocar imagem</button>
          {error && <p role="alert" className="error">{error}</p>}
        </section>
      )}


      {original && view === 'steps' && (
        <>
          <ol className="steps" aria-label="Etapas do pipeline">
            {STEPS.map((s, i) => (
              <li key={s.value} className={i < stepIndex ? 'done' : i === stepIndex && !finished ? 'active' : ''}>
                <span className="num">{i < stepIndex ? '✓' : i + 1}</span>
                <strong>{s.label}</strong>
                <small>{s.hint}</small>
              </li>
            ))}
          </ol>

          {step && (
            <section className="panel">
              <h2>Etapa {stepIndex + 1} de {STEPS.length}: {step.label}</h2>
              {step.value === 'contrast' && (
                <div className="params">
                  <label>α (ganho)<input type="number" step="0.1" min="0.1" max="5" value={alpha} onChange={(e) => setAlpha(Number(e.target.value))} /></label>
                  <label>β (brilho)<input type="number" step="1" min="-255" max="255" value={beta} onChange={(e) => setBeta(Number(e.target.value))} /></label>
                </div>
              )}
              {step.value === 'clahe' && (
                <div className="params">
                  <label>clipLimit<input type="number" step="0.5" min="0.5" max="40" value={clipLimit} onChange={(e) => setClipLimit(Number(e.target.value))} /></label>
                  <label>tileGridSize<input type="number" step="1" min="2" max="32" value={tileGrid} onChange={(e) => setTileGrid(Number(e.target.value))} /></label>
                </div>
              )}
              <div className="actions">
                <button type="button" onClick={advance} disabled={!preview || loading}>
                  {stepIndex + 1 < STEPS.length ? 'Aplicar e ir para a próxima etapa' : 'Aplicar e concluir'}
                </button>
                <button type="button" className="secondary" onClick={back} disabled={stepIndex === 0}>Voltar etapa</button>
                <button type="button" className="secondary" onClick={() => setView('choice')}>Voltar à escolha</button>
              </div>
            </section>
          )}

          {finished && (
            <section className="panel">
              <h2>Pipeline concluído</h2>
              <div className="actions">
                {currentUrl && <a className="button" href={currentUrl} download={downloadName}>Baixar resultado final</a>}
                <button type="button" className="secondary" onClick={back}>Voltar etapa</button>
                <button type="button" className="secondary" onClick={restart}>Reiniciar etapas</button>
                <button type="button" className="secondary" onClick={() => setView('choice')}>Voltar à escolha</button>
              </div>
            </section>
          )}

          <section className="compare three" aria-live="polite">
            <figure>
              <figcaption>Original</figcaption>
              {originalUrl ? <Frame key={originalUrl} src={originalUrl} alt="Documento original enviado" /> : <Skeleton label="Carregando" />}
            </figure>
            <figure>
              <figcaption>Atual: {appliedLabel}</figcaption>
              {currentUrl ? <Frame key={currentUrl} src={currentUrl} alt="Imagem atual do pipeline" /> : <Skeleton label="Carregando" />}
            </figure>
            <figure className={finished ? 'is-done' : undefined}>
              <figcaption>{step ? `Futura: ${step.label}` : finished ? 'Resultado final' : 'Futura'}</figcaption>
              {finished ? (
                <div className="done-card">
                  <span className="seal" aria-hidden="true">
                    <svg viewBox="0 0 24 24" width="34" height="34" fill="none" stroke="currentColor" strokeWidth="2.6" strokeLinecap="round" strokeLinejoin="round">
                      <path d="m5 12.5 4.5 4.5L19 7.5" />
                    </svg>
                  </span>
                  <strong>Todas as etapas foram aplicadas</strong>
                  <span>A imagem do meio é o resultado final. Baixe a cópia ou volte uma etapa para ajustar.</span>
                </div>
              ) : futureUrl && step ? (
                <Frame key={futureUrl} src={futureUrl} alt={`Prévia após ${step.label}`} />
              ) : error ? (
                <div className="placeholder">Prévia indisponível. Ajuste os parâmetros ou tente de novo.</div>
              ) : (
                <Skeleton label="Processando a prévia" />
              )}
            </figure>
          </section>

          {step && preview && (
            <section className="panel meta">
              <h2>Parâmetros da prévia</h2>
              <dl>
                <dt>Método</dt><dd>{step.value}</dd>
                {Object.entries(preview.params).map(([k, v]) => (
                  <div key={k}><dt>{k}</dt><dd>{String(v)}</dd></div>
                ))}
                <dt>Tamanho</dt><dd>{preview.width}×{preview.height}px</dd>
              </dl>
            </section>
          )}
        </>
      )}

      {original && view === 'result' && (
        <>
          <section className="panel">
            <h2>{finalResult ? 'Resultado final' : finalError ? 'Não foi possível tratar a imagem' : `Aplicando ${STEPS[Math.min(finalProgress, STEPS.length - 1)].label}…`}</h2>
            {!finalResult && !finalError && (
              <div className="progress" role="progressbar" aria-valuemin={0} aria-valuemax={STEPS.length} aria-valuenow={finalProgress}>
                <span style={{ width: `${(finalProgress / STEPS.length) * 100}%` }} />
              </div>
            )}
            {finalError && <p role="alert" className="error">{finalError}</p>}
            <div className="actions">
              {finalUrl && <a className="button" href={finalUrl} download={`${baseName}-redoc-final.png`}>Baixar imagem tratada</a>}
              <button type="button" className="secondary" onClick={openSteps}>Ver passo a passo</button>
              <button type="button" className="secondary" onClick={() => setView('choice')}>Voltar à escolha</button>
            </div>
          </section>

          <section className="compare" aria-live="polite">
            <figure>
              <figcaption>Original</figcaption>
              {originalUrl ? <Frame key={originalUrl} src={originalUrl} alt="Documento original enviado" /> : <Skeleton label="Carregando" />}
            </figure>
            <figure className={finalResult ? 'is-done' : undefined}>
              <figcaption>Tratada: após as {STEPS.length} etapas</figcaption>
              {finalUrl ? (
                <Frame key={finalUrl} src={finalUrl} alt="Documento tratado após todas as etapas" />
              ) : finalError ? (
                <div className="placeholder">Resultado indisponível. Volte e tente de novo.</div>
              ) : (
                <Skeleton label={`Etapa ${Math.min(finalProgress + 1, STEPS.length)} de ${STEPS.length}`} />
              )}
            </figure>
          </section>

          {finalResult && (
            <section className="panel meta">
              <h2>Etapas aplicadas</h2>
              <dl>
                {finalResult.steps.map((st) => (
                  <div key={st.label}>
                    <dt>{st.label}</dt>
                    <dd>{Object.keys(st.params).length ? Object.entries(st.params).map(([k, v]) => `${k}: ${v}`).join(' · ') : 'sem parâmetros'}</dd>
                  </div>
                ))}
              </dl>
            </section>
          )}
        </>
      )}
    </main>
  )
}

export default App
