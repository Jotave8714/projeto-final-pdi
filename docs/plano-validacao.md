# Plano enxuto de trabalho e validação

Proposta para uma equipe de três pessoas. Relacionada ao [parecer técnico](validacao-pdi.md). Não há cronograma final aprovado além do pitch informado para 29/10/2026.

## Divisão da equipe

| Integrante informado | Responsabilidade conhecida | Pendente |
| --- | --- | --- |
| Ricardo André | Planejamento das issues e pitch de 4 a 5 minutos | Matrícula e eventual função adicional |
| Rafa | Ainda não informada | Nome completo, matrícula e função |
| João Victor | Ainda não informada | Nome completo, matrícula e função |

Representante formal a confirmar. Sugestão de divisão, sem atribuição individual aprovada: uma pessoa organiza a pesquisa/amostras e avaliação, outra conduz os experimentos/PDI e outra coordena documentação/interface. As funções podem se sobrepor; todos revisam as escolhas e os resultados.

## Backlog mínimo proposto

IDs abaixo são locais, não números de issues publicadas. Antes de cadastrar, conferir o estado do GitHub para evitar duplicação.

| ID | Entrega | Critérios de aceite | Dependência |
| --- | --- | --- | --- |
| V1 | Formalizar equipe, público e proposta para o pitch | Identidades conferidas, representante escolhido, público delimitado, evidências identificadas, objetivos e pelo menos três métricas descritos | Nenhuma |
| V2 | Selecionar amostras de texto desbotado | Origem e condições de uso registradas, traços ainda visíveis, ausência de manchas relevantes, tipo de texto identificado e referência textual verificável | Recorte deste parecer |
| V3 | Comparar realces globais e CLAHE | Original, ajuste de contraste, equalização global e CLAHE com parâmetros registrados; histogramas e exemplos de piora incluídos | V2 |
| V4 | Avaliar se Otsu ajuda a leitura | Comparação com cinza realçado; perda de letras documentada; manter ou descartar a saída binária com justificativa | V3 |
| V5 | Definir abordagem e implementar fluxo mínimo | Equipe registra a escolha; envio de uma imagem, processamento, comparação na mesma escala e download; entrada inválida tratada | V3 e V4 |
| V6 | Avaliar e documentar resultados | Protocolo fixado antes da avaliação, três métricas relatadas, limitações explícitas e execução reproduzível | V2 a V5 |

Até o dia 29, a prioridade é V1, com as decisões de V2 planejadas. Não pressupor implementação antes do pitch: a orientação da Etapa 1 permite apresentar a proposta e as técnicas a investigar.

## Experimento de tamanho controlado

Sugestão inicial, não requisito da disciplina: reunir 12 imagens ou recortes de documentos distintos, com variações de desbotamento e fundo relativamente uniforme. Usar seis documentos para ajuste e seis para avaliação. Não colocar recortes do mesmo documento nos dois grupos. Se só houver menos amostras, registrar o estudo como exploratório e sua limitação.

Preservar originais, IDs, resolução, tipo de texto e origem. Certidões de demonstração podem ser fictícias com campos textuais conhecidos. Se produzirmos desbotamento sintético, identificar as imagens como sintéticas e relatar esses resultados separadamente dos documentos reais. Exemplos artificiais não comprovam eficácia sobre acervos reais.

Não é necessário publicar certidões pessoais no GitHub. Usar exemplos fictícios ou cópias cuja utilização tenha sido autorizada, evitando expor dados pessoais nas imagens e nos relatórios públicos.

Comparar quatro condições iniciais: original, ajuste de contraste, equalização global e CLAHE. Elas são alternativas independentes. Otsu é uma comparação adicional em cinza, sem obrigar que toda entrada passe por binarização. Congelar método e parâmetros antes de medir o conjunto de avaliação.

## Três métricas propostas sem exigir OCR

| Métrica | Como medir | Direção desejada e cuidado |
| --- | --- | --- |
| Acerto de palavras na leitura | Palavras corretamente transcritas em alinhamento com referência / total de palavras da referência × 100 | Maior é melhor. Referência revisada e regras de espaços, acentos e pontuação fixadas antes |
| Tempo da tarefa de leitura | Segundos para transcrever trechos comparáveis, com condição de parada e limite de tempo predefinidos | Menor tempo só representa melhora quando a precisão é mantida. Registrar omissões e tarefas incompletas |
| Legibilidade percebida | Nota de 1 a 5: 1 = muito difícil, 2 = difícil, 3 = intermediária, 4 = fácil, 5 = muito fácil | Maior é melhor. Medida subjetiva complementar, com número de leitores e distribuição das notas |

Sugestão de piloto: três leitores, sem pretensão de generalização estatística. Apresentar versões sem o nome da técnica, na mesma escala e em ordem aleatória. Evitar que uma pessoa transcreva repetidamente o mesmo trecho em versões diferentes: distribuir condições por trechos/leitores e contrabalançar sua atribuição. Se isso não for possível, declarar o risco de memória e não interpretar ganho como efeito isolado do processamento.

Referências textuais devem vir de conteúdo verificável. Se ninguém conhece a leitura correta de uma região, registrar incerteza e não inventar gabarito. Nesse trecho, é possível analisar preferência visual, mas não afirmar acerto textual objetivo.

O critério de sucesso deve priorizar a leitura correta e a preservação dos traços, com tempo e nota subjetiva como apoio. Ganhos numéricos e tolerâncias devem ser combinados antes da avaliação final, após o piloto, sem ajustar a regra aos resultados de teste. Relatar resultados por imagem, pioras e agregados adequados, sem prometer percentual de recuperação antecipadamente.

CER de um OCR fixo pode complementar o estudo posteriormente se houver transcrições confiáveis e suporte ao tipo de texto. Não é requisito do protótipo e não substitui leitura humana. PSNR/SSIM não são recomendadas como métricas centrais para este recorte sem uma imagem limpa de referência compatível.

## O que foi verificado nesta branch

- O repositório foi clonado integralmente e a `develop` foi atualizada antes da criação de `docs/validacao-escopo-pdi`.
- A API atual contém apenas `GET /api/health`; não há endpoint de processamento.
- O frontend contém o modelo inicial React/Vite.
- Os conteúdos das aulas e a documentação oficial foram cruzados com o recorte informado.
- As alterações são documentais. Nenhuma técnica foi implementada, dependência adicionada ou amostra experimental coletada.
- A aplicação não foi executada para esta validação conceitual. Não há resultado experimental que sustente uma taxa de recuperação.

## Frase recomendada para o pitch

“O RestauraDoc investiga o uso de transformações de intensidade e equalização de histograma para melhorar a legibilidade de texto desbotado em documentos antigos digitalizados, como certidões. Vamos comparar técnicas de realce e avaliar a leitura antes e depois. O foco é ampliar a visibilidade dos traços ainda presentes, com um protótipo simples e sem tratamento de manchas.”

O documento formal ainda precisa de público específico com evidências, nomes completos, matrículas e representante. A proposta técnica não substitui esses requisitos.
