import { useEffect, useMemo, useState } from 'react'
import type { ChangeEvent, FormEvent } from 'react'
import './App.css'

type Method = 'contrast' | 'equalize' | 'clahe' | 'otsu'

type ProcessResponse = {
  method: Method
  params: Record<string, number | string>
  width: number
  height: number
  processed_png_base64: string
}

const METHODS: { value: Method; label: string; hint: string }[] = [
  { value: 'clahe', label: 'CLAHE', hint: 'Realce local com limite de amplificação' },
  { value: 'equalize', label: 'Equalização global', hint: 'Redistribui intensidades em toda a imagem' },
  { value: 'contrast', label: 'Ajuste de contraste', hint: 'g = α·f + β com saturação em 8 bits' },
  { value: 'otsu', label: 'Otsu (binária)', hint: 'Experimental: traços fracos podem desaparecer' },
]

const ACCEPTED = ['image/png', 'image/jpeg']

function App() {
  const [file, setFile] = useState<File | null>(null)
  const [method, setMethod] = useState<Method>('clahe')
  const [alpha, setAlpha] = useState(1.5)
  const [beta, setBeta] = useState(0)
  const [clipLimit, setClipLimit] = useState(2)
  const [tileGrid, setTileGrid] = useState(8)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [result, setResult] = useState<ProcessResponse | null>(null)

  const originalUrl = useMemo(() => (file ? URL.createObjectURL(file) : null), [file])
  useEffect(() => {
    return () => {
      if (originalUrl) URL.revokeObjectURL(originalUrl)
    }
  }, [originalUrl])

  function onFile(e: ChangeEvent<HTMLInputElement>) {
    const f = e.target.files?.[0] ?? null
    setResult(null)
    setError(null)
    if (f && !ACCEPTED.includes(f.type)) {
      setFile(null)
      setError('Formato não suportado. Envie um arquivo PNG ou JPEG.')
      return
    }
    setFile(f)
  }

  async function onSubmit(e: FormEvent) {
    e.preventDefault()
    if (!file) return
    setLoading(true)
    setError(null)
    setResult(null)
    const body = new FormData()
    body.append('file', file)
    body.append('method', method)
    if (method === 'contrast') {
      body.append('alpha', String(alpha))
      body.append('beta', String(beta))
    }
    if (method === 'clahe') {
      body.append('clip_limit', String(clipLimit))
      body.append('tile_grid_size', String(tileGrid))
    }
    try {
      const res = await fetch('/api/process', { method: 'POST', body })
      if (!res.ok) {
        const detail = await res.json().catch(() => null)
        throw new Error(
          typeof detail?.detail === 'string' ? detail.detail : `Erro ${res.status} ao processar a imagem.`,
        )
      }
      setResult((await res.json()) as ProcessResponse)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Falha de conexão com a API.')
    } finally {
      setLoading(false)
    }
  }

  function reset() {
    setFile(null)
    setResult(null)
    setError(null)
  }

  const processedUrl = result ? `data:image/png;base64,${result.processed_png_base64}` : null
  const downloadName = file ? `${file.name.replace(/\.[^.]+$/, '')}-${result?.method ?? 'processada'}.png` : 'processada.png'

  return (
    <main className="app">
      <header>
        <h1>REDOC</h1>
        <p>Realce de texto desbotado em documentos antigos digitalizados. O original nunca é alterado.</p>
      </header>

      <form onSubmit={onSubmit} className="panel">
        <label className="field">
          <span>Imagem (PNG ou JPEG)</span>
          <input type="file" accept="image/png,image/jpeg" onChange={onFile} />
        </label>

        <fieldset className="field">
          <legend>Método</legend>
          {METHODS.map((m) => (
            <label key={m.value} className="radio">
              <input type="radio" name="method" value={m.value} checked={method === m.value} onChange={() => setMethod(m.value)} />
              <span>
                <strong>{m.label}</strong>
                <small>{m.hint}</small>
              </span>
            </label>
          ))}
        </fieldset>

        {method === 'contrast' && (
          <div className="params">
            <label>α (ganho)<input type="number" step="0.1" min="0.1" max="5" value={alpha} onChange={(e) => setAlpha(Number(e.target.value))} /></label>
            <label>β (brilho)<input type="number" step="1" min="-255" max="255" value={beta} onChange={(e) => setBeta(Number(e.target.value))} /></label>
          </div>
        )}
        {method === 'clahe' && (
          <div className="params">
            <label>clipLimit<input type="number" step="0.5" min="0.5" max="40" value={clipLimit} onChange={(e) => setClipLimit(Number(e.target.value))} /></label>
            <label>tileGridSize<input type="number" step="1" min="2" max="32" value={tileGrid} onChange={(e) => setTileGrid(Number(e.target.value))} /></label>
          </div>
        )}

        <div className="actions">
          <button type="submit" disabled={!file || loading}>{loading ? 'Processando…' : 'Processar'}</button>
          <button type="button" className="secondary" onClick={reset} disabled={!file && !result && !error}>Novo envio</button>
        </div>
        {error && <p role="alert" className="error">{error}</p>}
      </form>

      {originalUrl && (
        <section className="compare" aria-live="polite">
          <figure>
            <figcaption>Original</figcaption>
            <img src={originalUrl} alt="Documento original enviado" />
          </figure>
          <figure>
            <figcaption>
              {loading ? 'Processando…' : result ? `Processada (${METHODS.find((m) => m.value === result.method)?.label})` : 'Processada'}
            </figcaption>
            {processedUrl ? (
              <img src={processedUrl} alt="Documento processado" />
            ) : (
              <div className="placeholder">{loading ? 'Aguarde…' : 'O resultado aparece aqui.'}</div>
            )}
          </figure>
        </section>
      )}

      {result && processedUrl && (
        <section className="panel meta">
          <h2>Parâmetros aplicados</h2>
          <dl>
            <dt>Método</dt><dd>{result.method}</dd>
            {Object.entries(result.params).map(([k, v]) => (
              <div key={k}><dt>{k}</dt><dd>{String(v)}</dd></div>
            ))}
            <dt>Tamanho</dt><dd>{result.width}×{result.height}px</dd>
          </dl>
          <a className="button" href={processedUrl} download={downloadName}>Baixar cópia processada</a>
        </section>
      )}
    </main>
  )
}

export default App
