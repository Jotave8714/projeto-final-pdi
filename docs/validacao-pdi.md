# Validação do recorte e dos conteúdos de PDI

Data: 27/10/2026. Base de código analisada: `develop`, commit `a2bf1856f12c21cb66b8cabd1701d0b45ad1bf50`.

## Parecer

O recorte é tecnicamente plausível e tem complexidade compatível com um projeto acadêmico de PDI: melhorar a legibilidade de texto desbotado que ainda esteja representado na imagem. O núcleo pode se limitar a transformações de intensidade e processamento de histogramas, com binarização como alternativa de saída.

Esta é uma validação de escopo, fundamentos e viabilidade de implementação. Não houve ensaio com documentos reais nem demonstração de recuperação textual nesta análise. A eficácia depende da diferença ainda existente entre letra e papel e precisa ser medida em amostras do recorte.

## O que a equipe definiu

- Três integrantes: o responsável por esta solicitação, Rafa e João Victor. Dados formais e representante ainda pendentes.
- Planejamento das issues e pitch sob responsabilidade do solicitante.
- Solução simples, adequada à disciplina.
- Foco em documento antigo parcialmente apagado, como uma certidão de nascimento.
- Exclusão de tratamento de manchas e de outras deteriorações, conforme orientação da professora relatada pela equipe.

As escolhas técnicas e o desenho do protótipo abaixo são recomendações, ainda sujeitos à revisão da equipe. O público-alvo definitivo não foi informado. Pessoas que consultam certidões familiares antigas são uma possibilidade de recorte social a validar, não participantes ou parceiros confirmados.

## Definição operacional de restauração

**Entrada proposta:** uma imagem legível estruturalmente, sem manchas relevantes sobre o texto, com letras desbotadas, fundo relativamente uniforme e resolução que ainda represente seus traços.

**Saída proposta:** uma cópia da imagem com contraste ajustado para facilitar a leitura, acompanhada do original para comparação. Uma saída binária pode ser oferecida separadamente se os experimentos justificarem.

O sistema realça diferenças existentes. Se uma região da letra e o papel tiverem exatamente os mesmos valores na imagem, as técnicas propostas não têm evidência para distinguir os dois. O resultado esperado é realce da imagem, sem gerar palavras, adivinhar nomes ou completar campos.

Para manter o piloto controlado, recomenda-se começar com texto impresso ou datilografado. Uma certidão manuscrita também pode ter seus traços realçados, mas interpretar caligrafia é outro problema. A equipe precisa conferir o tipo de texto das amostras antes de assumir reconhecimento ou transcrição automática.

Ficam fora do primeiro protótipo: remoção de manchas, mofo, marcas de água e texto encoberto, rasgos, reconstrução de letras ausentes, correção de desfoque severo, perspectiva, treinamento de redes neurais e processamento de PDFs multipágina. O uso de uma certidão como exemplo não significa emissão ou alteração de documento oficial.

## Conteúdos da disciplina aplicáveis

| Conteúdo | Papel no projeto | Recomendação e justificativa |
| --- | --- | --- |
| Imagem digital, pixels, resolução e níveis de cinza | Entender a informação que ainda existe na digitalização | Base obrigatória para analisar entrada e limites |
| Conversão de cores para escala de cinza | Representar intensidade e simplificar operações | Começar por cinza, preservando o original. Se tinta e fundo tiverem cores diferentes, verificar se a conversão perde contraste útil |
| Histograma e distribuição de intensidades | Caracterizar baixo contraste e comparar entradas/saídas | Parte central da análise. O histograma global não identifica sozinho quais pixels são letras |
| Transformações de intensidade, brilho e contraste | Ampliar diferenças entre papel e texto | Primeira abordagem, simples e explicável. Ajuste afim ou expansão de faixa serve como referência de comparação |
| Equalização global de histograma | Redistribuir intensidades segundo a distribuição da imagem | Alternativa simples para comparar com o ajuste de contraste, sem assumir que sempre melhora |
| CLAHE | Realce local com limitação de amplificação de contraste | Candidata principal a comparar com o realce global. Não é necessário treinamento de modelo |
| Limiarização e segmentação | Classificar pixels como texto/fundo e produzir preto e branco | Saída opcional. Testar Otsu primeiro. Só incluir limiarização adaptativa se houver necessidade dentro do recorte |
| Filtragem espacial | Reduzir um ruído efetivamente observado | Fora do fluxo padrão. Suavização pode apagar justamente os traços fracos que queremos preservar |
| Morfologia matemática | Alterar formas binárias por erosão/dilatação e combinações | Fora do núcleo. Engrossar traços pode juntar letras e alterar caracteres. Não deve funcionar como reconstrução de conteúdo |
| Fourier e filtragem em frequência | Tratar componentes de frequência em problemas apropriados | Sem necessidade demonstrada para o problema escolhido. Não incluir apenas para aumentar a lista de conteúdos |
| Bordas, classificação e detecção de objetos | Resolver tarefas de localização/reconhecimento | Não são necessárias ao objetivo de realce de texto desbotado |

**Núcleo recomendado para o pitch:** fundamentos de imagem digital e escala de cinza, histograma, transformações de intensidade e equalização global/local. **Complemento experimental:** limiarização para comparar uma representação binária.

## Por que o ajuste de intensidade pode ajudar

No ajuste `g = alpha * f + beta`, `alpha` controla a ampliação das diferenças de intensidade e `beta` desloca os níveis. No rigor matemático, com termo constante diferente de zero a transformação é afim; no material didático ela aparece no conjunto de transformações lineares de intensidade.

Exemplo apenas aritmético, sem representar um experimento: se uma letra escura vale 205 e o papel vale 230, a diferença é 25. Com `alpha = 8` e `beta = -1600`, os valores se tornam 40 e 240, ampliando a diferença para 200. Valores fora da faixa precisam ser limitados, o que pode descartar informação. A transformação também pode amplificar ruído. Por isso, o exemplo explica o princípio, mas não comprova melhoria em certidões reais.

A equalização global oferece outra redistribuição das intensidades. O CLAHE aplica o realce por regiões e limita a amplificação de contraste, embora ainda possa destacar textura do papel. Propomos comparar essas alternativas, não aplicar todas em sequência por padrão.

Na binarização, uma letra fraca pode cair na classe do fundo. Portanto, a versão em cinza realçada deve continuar disponível mesmo se a saída binária parecer mais limpa.

## Solução mínima recomendada

1. Receber uma imagem PNG ou JPEG de cada vez e preservar a original.
2. Gerar uma representação em cinza e seu histograma para análise.
3. Produzir versões comparativas independentes: ajuste global de contraste, equalização global e CLAHE.
4. Comparar a leitura dessas versões e selecionar a abordagem mais simples que atenda ao recorte.
5. Investigar Otsu como saída binária opcional, verificando perda de traços.
6. Exibir original e resultado na mesma escala e permitir baixar a cópia processada.

Essa lista descreve o trabalho proposto. Não existem endpoints de processamento implementados nesta branch. No produto final, a equipe pode manter somente o método selecionado e poucos controles. As versões comparativas e os histogramas podem ficar no experimento, sem tornar a interface complexa.

**Tecnologia candidata:** Python, NumPy e OpenCV, aproveitando a estrutura de API já existente. Matplotlib pode apoiar o experimento. Nenhuma nova dependência foi adicionada nesta validação. React/Vite e FastAPI são estruturas presentes no repositório, sem que sua presença substitua uma decisão da equipe.

OCR não é necessário para realçar a imagem. Pode ser uma ferramenta de avaliação se houver motor adequado e transcrição de referência. Excluí-lo da primeira implementação reduz integração e evita confundir realce visual com reconhecimento de texto.

## Critério científico

Pergunta delimitada: **em quais condições o realce de contraste global ou local melhora a leitura de texto desbotado em documentos antigos digitalizados com fundo relativamente uniforme?**

Objetivo geral proposto: investigar e avaliar técnicas de realce de contraste para melhorar a legibilidade do texto ainda presente nesses documentos.

Objetivos específicos propostos:

1. Caracterizar as imagens e comparar ajuste global, equalização global e CLAHE.
2. Implementar um protótipo simples com a abordagem selecionada, preservando o original.
3. Avaliar a leitura e a legibilidade antes e depois e registrar situações em que o processamento falha.

Não é necessário criar um algoritmo novo. A comparação controlada de técnicas, sua justificativa e a avaliação de limites constituem a investigação pretendida. O protocolo e as três métricas propostas estão em [plano-validacao.md](plano-validacao.md).

## Evidências de alinhamento com as aulas

Materiais fornecidos no projeto foram consultados somente para leitura. As páginas abaixo são páginas do PDF:

- **Aula 02 - PDI - Fundamentos:** páginas 18 a 22, imagem digital, níveis de cinza e conversão RGB/cinza.
- **PDI - TL e histograma:** página 4, histograma; páginas 11 a 16, transformações de intensidade, objetivos e ajuste de contraste/brilho; páginas 23 a 25, exemplos e comparação.
- **Aula Equal. Histograma e Limiarizacao:** páginas 4 a 6, equalização; página 15, CLAHE; páginas 16 a 20, limiarização e critérios estatísticos.
- **Aula Filtros - Dominio_Espaco:** páginas 12 e 13, suavização e detalhes; páginas 20 a 23, mediana e tipos de ruído. Sustentam a avaliação cuidadosa da necessidade de filtrar.

Os notebooks de separação de canais, equalização e filtros do projeto também mostram familiaridade prévia com operações do OpenCV. Esses materiais de aula não foram copiados para este repositório.

## Fontes técnicas primárias

Consultadas em 27/10/2026. As recomendações de escopo e complexidade são uma avaliação deste planejamento, fundamentada nas operações descritas nessas fontes.

- OpenCV, transformações de brilho e contraste: https://docs.opencv.org/4.13.0/d3/dc1/tutorial_basic_linear_transform.html
- OpenCV, equalização global e CLAHE: https://docs.opencv.org/4.13.0/d5/daf/tutorial_py_histogram_equalization.html
- OpenCV, limiarização simples, Otsu e adaptativa: https://docs.opencv.org/4.13.0/d7/d4d/tutorial_py_thresholding.html
- OpenCV, morfologia e efeito sobre a forma dos objetos: https://docs.opencv.org/4.13.0/d9/d61/tutorial_py_morphological_ops.html
