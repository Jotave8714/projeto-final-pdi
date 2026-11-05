# Protocolo de comparação e critérios de sucesso

**Versão 1.0 - rascunho para congelar pela equipe antes dos testes finais.** Issue #6.

Status: **Proposta**. Nada aqui foi executado; **resultado não obtido**. Os valores marcados como *(a definir)* precisam ser fixados pela equipe após o piloto e **antes** da avaliação final. Depois do congelamento, qualquer mudança deve gerar nova versão deste arquivo, com data e justificativa, e registrar que a avaliação anterior ficou invalidada.

Contexto: [validacao-pdi.md](validacao-pdi.md) e [plano-validacao.md](plano-validacao.md).

## 1. Pergunta e hipótese de trabalho

Em quais condições o realce de contraste global ou local melhora a leitura de texto desbotado em documentos antigos digitalizados com fundo relativamente uniforme? Não se assume melhora; piora é um resultado válido e deve ser relatado.

## 2. Condições comparadas

| Código | Condição | Observação |
| --- | --- | --- |
| C0 | Original em escala de cinza | Referência. O arquivo original nunca é alterado |
| C1 | Ajuste global de contraste (`g = alpha * f + beta` ou expansão de faixa) | Parâmetros registrados |
| C2 | Equalização global de histograma | Aplicada diretamente ao cinza original |
| C3 | CLAHE (`clipLimit`, `tileGridSize`) | Parâmetros registrados |
| C4 | Otsu (**opcional**, issue #13) | Só entra se a equipe decidir; sempre com a alternativa em cinza |

As condições são independentes: cada uma parte do cinza original, sem encadear métodos.

## 3. Conjuntos e seleção de parâmetros

- Piloto de até 12 imagens ou recortes de documentos distintos, divididos em **conjunto de ajuste** e **conjunto de avaliação** (sugestão: 6 e 6; *a definir*, ver issue #5).
- Nenhum recorte do mesmo documento aparece nos dois conjuntos.
- Os parâmetros de C1, C3 (e C4, se houver) são escolhidos **somente com o conjunto de ajuste**. Registrar a faixa testada, o critério de escolha e a imagem usada.
- Ao final do ajuste, método e parâmetros são **congelados** (registro com data) e só então o conjunto de avaliação é processado. Proibido reajustar após ver os resultados da avaliação.
- Imagens reais e sintéticas ficam identificadas e são relatadas separadamente. Resultados sintéticos não sustentam conclusões sobre acervos reais.
- Sem dados pessoais públicos no repositório; usar exemplos fictícios ou com autorização registrada.

## 4. Preparação do material de leitura

- Todas as condições de uma mesma imagem são exibidas na **mesma escala**, mesma resolução de exibição e mesmo recorte.
- Os trechos têm tamanho comparável (número de palavras *a definir*).
- Arquivos sem o nome da técnica (códigos neutros), de modo que o leitor não saiba qual condição está vendo.
- Referência textual (gabarito) de cada trecho vem de conteúdo verificável. Se ninguém conhece a leitura correta, o trecho recebe a marca "referência incerta": entra apenas na legibilidade percebida, nunca no acerto de palavras.

## 5. Instruções aos leitores

Texto-base *(a revisar pela equipe)*:

1. Você verá trechos de documentos antigos. Transcreva o que conseguir ler, na ordem, da forma mais fiel possível.
2. Se uma palavra for ilegível, escreva `[?]` no lugar. Não chute nem complete por contexto.
3. Ao terminar (ou ao fim do limite de tempo), avance e dê uma nota de 1 a 5 para a dificuldade de leitura.
4. Não volte a trechos anteriores nem consulte outras fontes.

Escala de legibilidade: 1 = muito difícil, 2 = difícil, 3 = intermediária, 4 = fácil, 5 = muito fácil.

## 6. Limite de tempo e parada

- Limite por trecho: *(a definir após o piloto)*.
- O tempo corre da exibição até o leitor declarar que terminou ou o limite acabar.
- Trecho que estoura o limite é registrado como **incompleto**, com o tempo máximo, e **não** é descartado.

## 7. Regras de transcrição e pontuação

Fixadas antes da avaliação:

- Comparação de palavra a palavra após alinhamento da transcrição com a referência.
- Maiúsculas/minúsculas ignoradas; espaços repetidos normalizados.
- Acentos: *(a definir)* (sugestão: erro de acento conta como erro de palavra, para não premiar adivinhação).
- Pontuação ignorada, exceto quando muda o sentido (*a definir*).
- `[?]` conta como palavra errada. Palavra omitida conta como errada.
- Palavras extras inseridas são registradas à parte e não somam acerto.
- Quem pontua não sabe a condição de cada transcrição.

## 8. Ordem controlada e mitigação do efeito de memória

- Cada leitor transcreve um dado trecho **uma única vez**, em uma única condição.
- A atribuição trecho-condição-leitor é balanceada (quadrado latino ou rodízio simples, *a definir*), de modo que cada condição apareça igualmente entre leitores e posições.
- A ordem de apresentação é aleatória e registrada (semente da aleatorização guardada).
- Se o balanceamento for impossível com poucos leitores, declarar o risco de memória e **não** interpretar o ganho como efeito isolado do processamento.
- Piloto previsto: 3 leitores, sem pretensão de generalização estatística.

## 9. Métricas

| Métrica | Cálculo | Direção | Cuidado |
| --- | --- | --- | --- |
| Acerto de palavras (%) | palavras corretas alinhadas / total de palavras da referência × 100 | Maior é melhor | Referência revisada; regras da seção 7 |
| Tempo de leitura (s) | segundos por trecho comparável | Menor é melhor, só se a precisão se mantém | Registrar incompletos |
| Legibilidade percebida (1-5) | nota do leitor | Maior é melhor | Subjetiva e complementar; relatar número de leitores e distribuição |

PSNR/SSIM não são métricas centrais por não existir imagem limpa de referência. CER por OCR é complemento opcional futuro, nunca substitui a leitura humana.

## 10. Critérios de sucesso

O critério prioriza leitura correta e preservação dos traços; tempo e nota são apoio.

- Uma condição é considerada **promissora** se, no conjunto de avaliação, o acerto de palavras mediano superar o de C0 por uma margem *(a definir após o piloto, antes da avaliação final)*, sem aumento de omissões/incompletos e sem perda documentada de caracteres.
- Tempo menor só conta como melhora se o acerto não cair.
- Casos em que a condição piora (perda de letras, realce da textura do papel, saturação) são listados por imagem.
- Relatar resultados por imagem e por condição, com o tamanho da amostra, antes de qualquer agregado.
- Não prometer percentual de recuperação. Ausência de melhora é um resultado aceitável.

## 11. Limitações e riscos metodológicos

- Amostra muito pequena (≤ 12 imagens, 3 leitores): resultado exploratório, sem inferência estatística.
- Efeito de memória e de aprendizado entre trechos; mitigado, não eliminado.
- Subjetividade da nota de legibilidade.
- Referência textual incerta em alguns trechos.
- Dependência dos documentos escolhidos; imagens sintéticas não representam acervos reais.
- Parâmetros ajustados em poucas imagens podem não generalizar.
- O leitor pode inferir palavras pelo contexto; as instruções pedem que não o faça, mas não há como impedir totalmente.
- Resultados da avaliação ainda **não obtidos**.

## 12. Congelamento

| Item | Status |
| --- | --- |
| Condições C0 a C3 | Proposta |
| C4 (Otsu) | Experimental, decisão pendente |
| Tamanho de trecho, limite de tempo, margem de sucesso, regras de acento/pontuação | A definir pela equipe |
| Data do congelamento e responsável | Pendente |
