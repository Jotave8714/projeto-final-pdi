import { useId } from 'react'

export type HistogramData = {
  histogram: number[]
  mean: number
  standard_deviation: number
}

const formatCount = new Intl.NumberFormat('pt-BR')
const formatIntensity = new Intl.NumberFormat('pt-BR', { maximumFractionDigits: 2 })

type HistogramProps = {
  data: HistogramData
  title?: string
  maximum?: number
  compact?: boolean
}

export function Histogram({ data, title = 'Histograma de intensidades', maximum, compact = false }: HistogramProps) {
  const titleId = useId()
  const descriptionId = useId()
  const scaleMaximum = Math.max(1, maximum ?? 0, ...data.histogram)
  const chartTop = 38
  const chartHeight = 180
  const chartLeft = 82
  const chartWidth = 512
  const ticks = [...new Set([0, Math.round(scaleMaximum / 2), scaleMaximum])]

  return (
    <figure className="histogram">
      <figcaption>{title}</figcaption>
      <svg viewBox="0 0 620 278" role="img" aria-labelledby={`${titleId} ${descriptionId}`}>
        <title id={titleId}>{title}</title>
        <desc id={descriptionId}>
          Distribuição de {formatCount.format(data.histogram.reduce((sum, count) => sum + count, 0))} pixels
          em 256 níveis de intensidade, de 0 (preto) a 255 (branco).
        </desc>
        <text x={chartLeft} y="18" className="histogram-axis-title">Quantidade de pixels</text>
        {ticks.map((count) => {
          const y = chartTop + chartHeight * (1 - count / scaleMaximum)
          return (
            <g key={count} className="histogram-tick">
              <line x1={chartLeft} x2={chartLeft + chartWidth} y1={y} y2={y} />
              <text x={chartLeft - 10} y={y + 4} textAnchor="end">{formatCount.format(count)}</text>
            </g>
          )
        })}
        {data.histogram.map((count, intensity) => {
          const height = count / scaleMaximum * chartHeight
          return (
            <rect key={intensity} x={chartLeft + intensity * 2} y={chartTop + chartHeight - height}
              width="2" height={height} className="histogram-bar">
              <title>{`Intensidade ${intensity} · ${formatCount.format(count)} pixels`}</title>
            </rect>
          )
        })}
        <path className="histogram-axes" d={`M${chartLeft},${chartTop}V${chartTop + chartHeight}H${chartLeft + chartWidth}`} />
        {[0, 64, 128, 192, 255].map((intensity) => (
          <text key={intensity} x={chartLeft + (intensity + 0.5) * 2} y="239" textAnchor="middle">{intensity}</text>
        ))}
        <text x={chartLeft + chartWidth / 2} y="267" textAnchor="middle" className="histogram-axis-title">Intensidade (0–255)</text>
      </svg>
      <dl className="histogram-stats">
        <div><dt>Intensidade média</dt><dd>{formatIntensity.format(data.mean)}</dd></div>
        <div><dt>Desvio-padrão</dt><dd>{formatIntensity.format(data.standard_deviation)}</dd></div>
      </dl>
      {!compact && <p>O histograma representa a distribuição dos níveis de intensidade da imagem, permitindo identificar a concentração de pixels em regiões escuras, intermediárias ou claras.</p>}
      <details>
        <summary>Consultar frequências por intensidade</summary>
        <div className="histogram-table" tabIndex={0} role="region" aria-label="Frequências dos 256 níveis de intensidade">
          <table>
            <caption className="sr-only">{title} · Contagem de pixels</caption>
            <thead><tr><th scope="col">Intensidade</th><th scope="col">Quantidade de pixels</th></tr></thead>
            <tbody>{data.histogram.map((count, intensity) => (
              <tr key={intensity}><th scope="row">{intensity}</th><td>{formatCount.format(count)}</td></tr>
            ))}</tbody>
          </table>
        </div>
      </details>
    </figure>
  )
}

export function HistogramComparison({ initial, final }: { initial: HistogramData; final: HistogramData }) {
  const maximum = Math.max(1, ...initial.histogram, ...final.histogram)
  return (
    <div className="histogram-comparison" role="group" aria-label="Comparação dos histogramas inicial e final">
      <p>Inicial após a conversão para cinza e final após Otsu, na mesma escala de pixels. Na imagem binária final, as frequências se concentram em 0 e 255.</p>
      <div className="histogram-grid">
        <Histogram data={initial} title="Histograma inicial" maximum={maximum} compact />
        <Histogram data={final} title="Histograma final" maximum={maximum} compact />
      </div>
    </div>
  )
}
