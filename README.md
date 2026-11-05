# projeto-final-pdi

## REDOC (anteriormente RestauraDoc)

> **Nome:** a proposta formal da Etapa 1 (29/10/2026) usa **REDOC**. "RestauraDoc" foi o nome provisório usado nos primeiros documentos e no nome da pasta de contexto; os dois se referem ao mesmo projeto. Os textos antigos que ainda citam RestauraDoc são históricos.

Projeto acadêmico de PDI para investigar o realce de texto desbotado em documentos antigos digitalizados, como certidões de nascimento. A equipe delimitou o foco à legibilidade de texto parcialmente apagado, sem tratamento de manchas ou reconstrução de conteúdo completamente perdido.

- [Validação de viabilidade e conteúdos de PDI](docs/validacao-pdi.md)
- [Plano enxuto de trabalho e validação](docs/plano-validacao.md)
- [Protocolo de comparação e critérios de sucesso](docs/protocolo-comparacao.md)
- [Contexto acadêmico e decisões da equipe](AGENTS.md)

### Legenda de status usada na documentação

| Rótulo | Significado |
| --- | --- |
| **Definido pela equipe** | Informado ou decidido pela equipe (proposta, issues, orientação da professora relatada) |
| **Proposta** | Recomendação técnica para revisão da equipe; ainda não aprovada |
| **Experimental** | Será testada e pode ser descartada (por exemplo, Otsu) |
| **Resultado não obtido** | Nenhum experimento foi executado; não há afirmação de eficácia |

**Estado atual:** estrutura inicial de API e interface. O processamento de documentos ainda não está implementado. As técnicas descritas na documentação são recomendações para investigação e revisão da equipe.

## Execução da estrutura atual

```
cd backend && uv run uvicorn app.main:app --reload   # :8000, docs em /docs
cd frontend && npm run dev                           # :5173
```

## Escopo excluído

Remoção de manchas, mofo, marcas de água, conteúdo encoberto, reparo de rasgos, reconstrução de letras ou campos perdidos e reconhecimento de caligrafia. O projeto realça apenas o sinal que ainda existe na imagem.

## Fluxo de contribuição

Branch própria a partir da `develop` atualizada, Pull Request para revisão do arquiteto ou de outro desenvolvedor e confirmação da branch de destino antes de abrir o PR. Não há merge direto na `develop`; a homologação depende de aprovação. Detalhes em [AGENTS.md](AGENTS.md).
