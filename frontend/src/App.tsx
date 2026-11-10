import { useCallback, useEffect, useMemo, useState } from 'react'
import type { ChangeEvent } from 'react'
import './App.css'

type Method = 'clahe' | 'equalize' | 'contrast' | 'otsu'

type ProcessResponse = {
  method: Method
  params: Record<string, number | string>
  width: number
  height: number
  processed_png_base64: string
}

type Preview = { blob: Blob; params: Record<string, number | string>; width: number; height: number }

// Ordem fixa do pipeline: cada etapa recebe a saída da anterior.
const STEPS: { value: Method; label: string; hint: string }[] = [
  { value: 'clahe', label: 'CLAHE', hint: 'Realce local com limite de amplificação' },
  { value: 'equalize', label: 'Equalização global', hint: 'Redistribui intensidades em toda a imagem' },
  { value: 'contrast', label: 'Ajuste de contraste', hint: 'g = α·f + β com saturação em 8 bits' },
  { value: 'otsu', label: 'Otsu (binária)', hint: 'Experimental: traços fracos podem desaparecer' },
]

const ACCEPTED = ['image/png', 'image/jpeg']

function useObjectUrl(blob: Blob | null) {
  const url = useMemo(() => (blob ? URL.createObjectURL(blob) : null), [blob])
  useEffect(() => () => {
    if (url) URL.revokeObjectURL(url)
  }, [url])
  return url
}

function base64ToBlob(b64: string): Blob {
  const bin = atob(b64)
  const bytes = new Uint8Array(bin.length)
  for (let i = 0; i < bin.length; i++) bytes[i] = bin.charCodeAt(i)
  return new Blob([bytes], { type: 'image/png' })
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

  const stepIndex = Math.max(history.length - 1, 0)
  const finished = history.length > 0 && stepIndex >= STEPS.length
  const step = history.length > 0 && !finished ? STEPS[stepIndex] : null
  const current = history.length > 0 ? history[history.length - 1] : null

  const originalUrl = useObjectUrl(original)
  const currentUrl = useObjectUrl(current)
  const futureUrl = useObjectUrl(preview?.blob ?? null)

  // Prévia: resultado da etapa atual aplicado à imagem atual (com debounce nos parâmetros).
  useEffect(() => {
    if (!current || !step) return
    const controller = new AbortController()
    const timer = setTimeout(async () => {
      setLoading(true)
      setError(null)
      const body = new FormData()
      body.append('file', current, 'atual.png')
      body.append('method', step.value)
      if (step.value === 'contrast') {
        body.append('alpha', String(alpha))
        body.append('beta', String(beta))
      }
      if (step.value === 'clahe') {
        body.append('clip_limit', String(clipLimit))
        body.append('tile_grid_size', String(tileGrid))
      }
      try {
        const res = await fetch('/api/process', { method: 'POST', body, signal: controller.signal })
        if (!res.ok) {
          const detail = await res.json().catch(() => null)
          throw new Error(
            typeof detail?.detail === 'string' ? detail.detail : `Erro ${res.status} ao processar a imagem.`,
          )
        }
        const data = (await res.json()) as ProcessResponse
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
  }, [current, step, alpha, beta, clipLimit, tileGrid])

  function onFile(e: ChangeEvent<HTMLInputElement>) {
    const f = e.target.files?.[0] ?? null
    setPreview(null)
    setError(null)
    if (!f) return
    if (!ACCEPTED.includes(f.type)) {
      setOriginal(null)
      setHistory([])
      setError('Formato não suportado. Envie um arquivo PNG ou JPEG.')
      return
    }
    setOriginal(f)
    setHistory([f])
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

  function reset() {
    setOriginal(null)
    setHistory([])
    setPreview(null)
    setError(null)
  }

  const downloadName = original ? `${original.name.replace(/\.[^.]+$/, '')}-redoc-etapa${stepIndex}.png` : 'redoc.png'
  const appliedLabel =
    stepIndex === 0 ? 'Original (nenhuma etapa aplicada)' : `Após ${STEPS[stepIndex - 1].label}`

  return (
    <main className="app">
      <header>
        <h1>REDOC</h1>
        <p>
          Realce de texto desbotado em documentos antigos digitalizados. Envie o original: ele passa por quatro etapas em
          sequência (CLAHE, equalização global, ajuste de contraste e Otsu) e nunca é alterado.
        </p>
      </header>

      <section className="panel">
        <label className="field">
          <span>Imagem original (PNG ou JPEG)</span>
          <input type="file" accept="image/png,image/jpeg" onChange={onFile} />
        </label>
        {error && <p role="alert" className="error">{error}</p>}
      </section>

      {original && (
        <>
          <ol className="steps" aria-label="Etapas do pipeline">
            {STEPS.map((s, i) => (
              <li key={s.value} className={i < stepIndex ? 'done' : i === stepIndex && !finished ? 'active' : ''}>
                <strong>{i + 1}. {s.label}</strong>
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
                <button type="button" className="secondary" onClick={reset}>Novo envio</button>
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
                <button type="button" className="secondary" onClick={reset}>Novo envio</button>
              </div>
            </section>
          )}

          <section className="compare three" aria-live="polite">
            <figure>
              <figcaption>Original</figcaption>
              {originalUrl && <img src={originalUrl} alt="Documento original enviado" />}
            </figure>
            <figure>
              <figcaption>Atual: {appliedLabel}</figcaption>
              {currentUrl && <img src={currentUrl} alt="Imagem atual do pipeline" />}
            </figure>
            <figure>
              <figcaption>{step ? `Futura: ${step.label}` : 'Futura'}</figcaption>
              {futureUrl && step ? (
                <img src={futureUrl} alt={`Prévia após ${step.label}`} />
              ) : (
                <div className="placeholder">
                  {finished ? 'Todas as etapas foram aplicadas.' : loading ? 'Processando…' : 'A prévia aparece aqui.'}
                </div>
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
    </main>
  )
}

export default App
