import { useEffect, useId, useRef, useState } from 'react'
import type { FormEvent } from 'react'
import { saveEvaluation } from './evaluations'
import type { ProcessingMode } from './evaluations'

const descriptions = [
  'Selecione uma nota para descrever a legibilidade do resultado.',
  'Ilegível. Não consegui compreender o texto.',
  'Pouco legível. A maior parte do texto continua difícil de ler.',
  'Parcialmente legível. Consegui ler parte do texto, com dificuldade.',
  'Legível. Consegui ler a maior parte do texto.',
  'Muito legível. Consegui ler o texto com facilidade.',
]

type EvaluationModalProps = {
  mode: ProcessingMode
  techniques: string[]
  onDismiss: () => void
  onSaved: () => void
}

export function EvaluationModal({ mode, techniques, onDismiss, onSaved }: EvaluationModalProps) {
  const dialogRef = useRef<HTMLDialogElement>(null)
  const submitted = useRef(false)
  const [id] = useState(() => crypto.randomUUID())
  const titleId = useId()
  const descriptionId = useId()
  const commentId = useId()
  const [score, setScore] = useState(0)
  const [comment, setComment] = useState('')
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    const dialog = dialogRef.current
    const previousFocus = document.activeElement instanceof HTMLElement ? document.activeElement : null
    dialog?.showModal()
    return () => {
      dialog?.close()
      previousFocus?.focus()
    }
  }, [])

  function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    if (score < 1 || submitted.current) return
    try {
      saveEvaluation({
        id, nota: score, comentario: comment, dataHora: new Date().toISOString(),
        modo: mode, tecnicas: techniques, simulado: false,
      })
      submitted.current = true
      onSaved()
    } catch {
      setError('Não foi possível salvar no navegador. Verifique se o armazenamento local está disponível e tente novamente.')
    }
  }

  return (
    <dialog className="evaluation-modal" ref={dialogRef} aria-labelledby={titleId} aria-describedby={descriptionId}
      onCancel={(event) => { event.preventDefault(); onDismiss() }}>
      <form onSubmit={submit}>
        <h2 id={titleId}>O quanto o documento ficou legível?</h2>
        <fieldset className="evaluation-rating">
          <legend>Nota de legibilidade</legend>
          <div className="evaluation-stars">
            {[1, 2, 3, 4, 5].map((value) => (
              <label key={value} className={value <= score ? 'selected' : ''}>
                <input type="radio" name="legibilidade" value={value} checked={score === value}
                  onChange={() => setScore(value)} aria-label={`${value} ${value === 1 ? 'estrela' : 'estrelas'}`} required />
                <svg viewBox="0 0 24 24" aria-hidden="true"><path d="m12 2.5 2.94 5.96 6.58.96-4.76 4.64 1.12 6.55L12 17.52l-5.88 3.09 1.12-6.55-4.76-4.64 6.58-.96Z" /></svg>
              </label>
            ))}
          </div>
        </fieldset>
        <p className="rating-description" id={descriptionId} aria-live="polite">{descriptions[score]}</p>
        <label className="evaluation-comment" htmlFor={commentId}>Comentário opcional
          <textarea id={commentId} value={comment} onChange={(event) => setComment(event.target.value)} rows={3} />
        </label>
        <p className="evaluation-local-note">A avaliação fica salva neste navegador. Evite incluir dados pessoais no comentário.</p>
        {error && <p className="error" role="alert">{error}</p>}
        <div className="actions">
          <button type="submit" disabled={!score}>Enviar avaliação</button>
          <button type="button" className="secondary" onClick={onDismiss}>Agora não</button>
        </div>
      </form>
    </dialog>
  )
}
