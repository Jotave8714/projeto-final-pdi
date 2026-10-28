# projeto-final-pdi

## RestauraDoc

Projeto acadêmico de PDI para investigar o realce de texto desbotado em documentos antigos digitalizados, como certidões de nascimento. A equipe delimitou o foco à legibilidade de texto parcialmente apagado, sem tratamento de manchas ou reconstrução de conteúdo completamente perdido.

- [Validação de viabilidade e conteúdos de PDI](docs/validacao-pdi.md)
- [Plano enxuto de trabalho e validação](docs/plano-validacao.md)
- [Contexto acadêmico e decisões da equipe](AGENTS.md)

**Estado atual:** estrutura inicial de API e interface. O processamento de documentos ainda não está implementado. As técnicas descritas na documentação são recomendações para investigação e revisão da equipe.

## Execução da estrutura atual

```
cd backend && uv run uvicorn app.main:app --reload   # :8000, docs em /docs
cd frontend && npm run dev                           # :5173
```
