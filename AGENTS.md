# RestauraDoc — Contexto acadêmico e orientações do projeto

## Finalidade deste arquivo

Este arquivo é a referência permanente para compreender o trabalho e orientar futuras contribuições. Preserve o contexto acadêmico, o escopo e as decisões aqui registradas. Atualize-o quando a equipe tomar novas decisões, distinguindo propostas de escolhas aprovadas.

O projeto está na fase de planejamento. A prioridade é analisar a ideia, avaliar sua viabilidade, delimitar o problema e discutir e justificar a abordagem antes do desenvolvimento. Não trate tecnologias, bibliotecas, arquitetura ou funcionalidades como previamente escolhidas. A existência de código ou estrutura no repositório, por si só, não confirma essas decisões.

## Contexto da disciplina

- Instituição: Universidade de Fortaleza (Unifor).
- Disciplina: Processamento Digital de Imagens (PDI).
- Professora: Lyndainês Santos.
- Proposta do trabalho: identificar um problema real e propor uma solução com relevância social utilizando imagens e processamento computacional, ambos obrigatórios.

O trabalho deve contemplar três dimensões:

- **Social:** identificar um problema que afete um grupo de pessoas e justificar a contribuição para esse público.
- **Tecnológica:** aplicar processamento de imagens para contribuir com a solução.
- **Científica:** investigar e avaliar a aplicação das técnicas escolhidas.

Não é necessário empregar todas as técnicas estudadas na disciplina. A seleção deve ser coerente com o problema e ter justificativa.

## Ideia e problema

**Nome provisório:** RestauraDoc — Restauração de Documentos Antigos.

O projeto propõe investigar a melhoria da qualidade visual e da legibilidade de documentos antigos digitalizados, especialmente documentos impressos ou datilografados com textos desbotados e baixo contraste.

### Delimitação informada pela equipe em 27/10/2026

- A equipe tem três integrantes: o responsável por esta solicitação, Rafa e João Victor. Nomes completos e matrículas ainda precisam ser informados para a entrega formal.
- O responsável por esta solicitação cuida do planejamento das issues e da apresentação do pitch do dia 29/10/2026, com duração informada de 4 a 5 minutos.
- A equipe quer uma solução de complexidade compatível com um projeto acadêmico.
- O foco é melhorar a leitura do texto de documentos antigos parcialmente apagados, como uma certidão de nascimento, desde que ainda exista sinal visual na digitalização.
- Segundo relato da equipe, a professora orientou restringir o problema. Tratamento de manchas e outras deteriorações não faz parte deste recorte.
- Certidão de nascimento é um exemplo de documento, não confirmação de acesso a amostras, parceria com cartório ou definição de público-alvo.

A análise e as recomendações técnicas estão em [docs/validacao-pdi.md](docs/validacao-pdi.md). As recomendações desse documento continuam propostas para revisão da equipe; não representam técnicas já implementadas ou eficácia experimentalmente comprovada.

O envelhecimento do papel, o desgaste da tinta e problemas de digitalização podem aproximar a tonalidade das letras à do fundo, dificultando a leitura e a consulta. A proposta é realçar as informações que ainda existem na imagem para torná-las mais visíveis.

Neste contexto, “recuperação” ou “restauração” significa melhorar a visibilidade de sinais presentes na imagem, sem pressupor a reconstrução de conteúdo completamente perdido.

## Questão de pesquisa

Como técnicas de Processamento Digital de Imagens podem melhorar a legibilidade de documentos antigos digitalizados que apresentam textos apagados ou baixo contraste?

A investigação deverá avaliar se o processamento produz melhorias perceptíveis e mensuráveis na leitura desses documentos.

## Objetivo geral

Investigar a aplicação de técnicas de Processamento Digital de Imagens para melhorar a legibilidade de documentos antigos digitalizados, impressos ou datilografados, com textos desbotados e baixo contraste, realçando as informações ainda presentes e avaliando os resultados obtidos.

Os objetivos específicos ainda deverão ser discutidos e definidos para a proposta da primeira etapa.

## Público-alvo e contexto de aplicação

O público-alvo definitivo ainda não foi escolhido. Inicialmente, consideram-se pessoas que trabalham com arquivos escolares, bibliotecas e pequenos acervos documentais.

A equipe ainda precisa delimitar o grupo beneficiado e o contexto concreto de aplicação, levantar suas necessidades e reunir evidências ou dados que demonstrem o problema. Esses públicos são possibilidades em análise, não parcerias ou participantes confirmados.

## Relevância social e científica

Documentos antigos podem conter informações históricas, educacionais, administrativas e culturais importantes. A deterioração visual pode dificultar o acesso a essas informações. Melhorar a legibilidade pode contribuir para sua consulta, preservação e acesso, especialmente em pequenos acervos.

A contribuição científica pretendida é investigar a adequação das técnicas selecionadas ao problema, avaliar os resultados com critérios definidos e reconhecer suas limitações. A eficácia da proposta é uma questão a testar, não um resultado já demonstrado.

## Delimitação do escopo

- Foco inicial: documentos antigos digitalizados, impressos ou datilografados, com textos desbotados e baixo contraste.
- Resultado pretendido: uma versão da imagem visualmente mais legível, a partir do realce das informações existentes.
- O projeto não pretende ser um restaurador universal de documentos.
- Não se pretende reconstruir informações completamente perdidas, recuperar documentos rasgados ou solucionar todos os tipos de deterioração.
- Remoção de manchas, mofo, marcas de água, conteúdo encoberto e reparo de rasgos ficam fora do escopo informado pela equipe.
- O escopo exato do protótipo, seu funcionamento e suas funcionalidades ainda precisam ser discutidos e justificados.

## Exigências da Etapa 1

As exigências abaixo foram informadas pela equipe a partir do documento da professora. Em caso de dúvida, conferir o documento original antes de alterar os requisitos.

### Composição da equipe

- Entre 3 e 5 integrantes.
- Nome, matrícula e responsabilidade inicial de cada participante.
- Identificação do representante da equipe.

Integrantes informados: o responsável por esta solicitação, Rafa e João Victor. O primeiro é responsável pelo planejamento das issues e pelo pitch. Nomes completos, matrículas, responsabilidades dos demais integrantes e representante formal ainda precisam ser confirmados. Não inferir esses dados a partir dos perfis do GitHub.

### Identificação do público-alvo

- Descrição do público beneficiado.
- Justificativa da relevância social.
- Evidências ou dados que demonstrem o problema.
- Delimitação do contexto de aplicação.

### Proposta inicial

- Introdução.
- Objetivo geral.
- Pelo menos três objetivos específicos.
- Pelo menos três métricas de avaliação.

A entrega será em PDF, acompanhada de apresentação oral. Nesta etapa, não é obrigatório apresentar um algoritmo implementado, mas é necessário indicar as técnicas que se pretende investigar e justificar sua aplicação. As técnicas e métricas ainda não foram escolhidas.

## Decisões em aberto

- Público-alvo definitivo e contexto de aplicação.
- Nomes completos, matrículas, responsabilidades iniciais dos demais integrantes e representante formal. A composição de três integrantes já foi informada.
- Evidências e dados que sustentem a caracterização do problema social.
- Objetivos específicos.
- Técnicas de processamento a investigar e justificativas para sua seleção.
- Tecnologias e bibliotecas a adotar.
- Arquitetura, funcionamento, funcionalidades e escopo exato do protótipo.
- Origem, seleção e características das imagens de avaliação.
- Procedimentos de teste e critérios de comparação dos resultados.
- Pelo menos três métricas de avaliação e a forma de medi-las.

## Orientações para futuras contribuições

- Priorize uma proposta acadêmica coerente, tecnicamente viável e alinhada às exigências da professora.
- Discuta e justifique as decisões antes de implementar a solução.
- Não transforme sugestões em requisitos ou decisões definitivas sem a escolha da equipe.
- Não prometa recuperar texto que não esteja representado na imagem.
- Não invente dados, referências, resultados experimentais, integrantes ou requisitos da disciplina.
- Nesta solicitação, o trabalho autorizado é documentar o contexto e organizar a branch; não implementar a solução.
- Para alterações, siga o fluxo da equipe: branch própria a partir da `develop` atualizada, envio ao remoto e Pull Request para revisão do arquiteto ou de outro desenvolvedor. Confirme a branch de destino antes de abrir o Pull Request. O encaminhamento para homologação depende de aprovação e do fluxo da equipe.
- Preserve alterações existentes; não sobrescreva trabalho nem utilize comandos destrutivos como `git reset --hard`. Não faça merge diretamente na `develop`.
