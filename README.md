# REDOC — Restauração Digital de Documentos

Projeto acadêmico de Processamento Digital de Imagens da Unifor, orientado pela professora Lyndainês Santos. Investiga o realce de textos desbotados em documentos digitalizados, preservando o arquivo original. RestauraDoc era o nome provisório do projeto.

O protótipo permite enviar uma imagem, acompanhar as etapas de processamento, comparar versões, consultar histogramas, baixar uma cópia e registrar uma nota de legibilidade.

## 1. Preparar o computador

Instale **Python 3.12 ou superior**, **Node.js 24 LTS** (inclui npm) e **uv**. Git é necessário somente se você for clonar o repositório. Neste computador foram usados Python 3.13 e Node.js 24.

Confira no PowerShell:

```powershell
python --version
node --version
npm.cmd --version
uv --version
```

Se faltar uv, execute `python -m pip install uv` e reabra o terminal. Se ainda não for reconhecido, use `python -m uv` no lugar de `uv` nos comandos seguintes.

## 2. Obter e instalar o projeto

Se ainda não tem a pasta:

```powershell
git clone --branch develop https://github.com/Jotave8714/projeto-final-pdi.git
cd projeto-final-pdi
```

Se já recebeu a pasta, abra-a no VS Code e abra um terminal nela. Execute **uma linha por vez**:

```powershell
cd backend
uv sync --locked
cd ../frontend
npm.cmd ci
```

A instalação precisa de internet e cria o ambiente Python em `backend/.venv`. Repita essa instalação se os arquivos de dependências forem atualizados.

## 3. Iniciar a aplicação

Abra **dois terminais**, ambos inicialmente na pasta principal do projeto.

**Terminal 1 — API:**

```powershell
cd backend
uv run --locked uvicorn app.main:app --reload --host 127.0.0.1 --port 8000
```

**Terminal 2 — interface:**

```powershell
cd frontend
npm.cmd run dev -- --port 5173 --strictPort
```

Mantenha os dois terminais abertos e acesse:

| Endereço | Para que serve |
| --- | --- |
| http://localhost:5173 | Enviar e processar documentos |
| http://localhost:5173/review | Consultar avaliações de legibilidade |
| http://localhost:8000/api/health | Conferir a API: resposta esperada `{"status":"ok"}` |
| http://localhost:8000/docs | Documentação interativa da API |

Para encerrar, pressione **Ctrl+C em cada terminal**. Nas próximas vezes, basta repetir esta seção.

## 4. Processar seu primeiro documento

1. Acesse http://localhost:5173.
2. Selecione ou arraste uma imagem **PNG ou JPEG de até 20 MB**. Para testar, use `dataset/imagens/redoc_01.png`.
3. Escolha **Passo a passo** para acompanhar as prévias e ajustar os parâmetros disponíveis, ou **Resultado final** para executar todas as etapas automaticamente.
4. Compare o original com as versões processadas e consulte os histogramas.
5. Baixe a cópia processada. O arquivo original permanece preservado.
6. Ao concluir, registre opcionalmente uma nota de legibilidade de 1 a 5 e um comentário.

A sequência atual é **cinza → CLAHE → equalização global → contraste → Fourier → Otsu**. Cada etapa recebe a saída da anterior. A API também aceita os métodos individualmente.

Otsu produz preto e branco e pode apagar traços fracos. Fourier busca listras periódicas verticais. A combinação pode melhorar ou piorar uma imagem; informações completamente perdidas não podem ser recuperadas por esse realce.

## 5. Consultar o /review

Abra http://localhost:5173/review **no mesmo navegador e endereço usados para avaliar**.

- O painel mostra quantidade de avaliações, média, distribuição de notas e comentários, com filtros por período e tipo.
- Os dados ficam no **armazenamento local do navegador**, sem banco de dados central. Outro computador, perfil ou endereço não compartilha esses registros. Limpar os dados do navegador pode apagá-los.
- Em **Origem dos dados**, escolha **Formulário** ou **Demonstração**. O resumo e o histórico mostram somente a origem selecionada. O aviso sobre os exemplos fictícios fica no rodapé e deve ser explicado também na apresentação oral.
- Abra **Gerenciar dados de demonstração**, ao final da página. **Carregar exemplos** adiciona 230 avaliações fictícias; **Remover exemplos** exclui somente esses registros.
- Notas do formulário e exemplos permanecem separados. O envio pelo formulário, sozinho, não comprova uma pesquisa controlada ou participantes independentes.

A carga nova contém 230 exemplos com média definida de 4,5/5. Para substituir os 24 exemplos antigos, use **Remover exemplos** e depois **Carregar exemplos**; as notas do formulário são preservadas. As avaliações demonstrativas não constituem evidência de eficácia. A média e a distribuição resumem a mesma medida subjetiva de legibilidade. Os histogramas descrevem intensidades e não demonstram, por si só, ganho de leitura.

## 6. Roteiro de demonstração

1. Inicie os dois servidores e confira `/api/health`.
2. Envie uma imagem de `dataset/imagens/` e mostre o modo passo a passo.
3. Explique as transformações e compare os histogramas inicial e final.
4. Mostre o download e registre uma nota pelo formulário.
5. Abra `/review` no mesmo navegador e consulte a avaliação. Se carregar os dados de demonstração, identifique-os como fictícios.

O dataset contém **12 documentos sintéticos**, com transcrições e catálogo: quatro para ajuste e oito para avaliação. Experimentos nessas imagens devem ser relatados como sintéticos; não comprovam eficácia em documentos históricos reais.

## 7. Resolver problemas comuns

| Problema | Solução |
| --- | --- |
| PowerShell bloqueia `npm.ps1` | Use `npm.cmd`, como nos exemplos. |
| Comando não reconhecido | Instale a ferramenta e reabra o terminal. Para uv instalado via pip, tente `python -m uv`. |
| Interface abre, processamento falha | Confira o terminal da API e abra `/api/health`. A interface encaminha `/api` para a porta 8000. |
| Porta 5173 ou 8000 ocupada | Encerre a instância anterior com Ctrl+C no terminal correspondente e tente novamente. |
| Avaliações não aparecem | Confira navegador, perfil, endereço e filtros. Os registros são locais. |
| Arquivo recusado | Use PNG/JPEG válido de até 20 MB; PDF não é aceito. |
| Instalação falha | Confira internet, versões e pasta atual. Preserve os arquivos de lock. |

## 8. Executar as verificações técnicas

Na pasta `backend`:

```powershell
uv run --locked pytest -q
```

Na pasta `frontend`:

```powershell
npm.cmd run build
npm.cmd run lint
node --experimental-strip-types --test tests/evaluations.test.ts
```

Os testes verificam comportamentos do código. A avaliação de legibilidade requer procedimento, amostras e resultados registrados separadamente. Para a demonstração local, use `npm.cmd run dev`: o proxy da API está configurado no servidor de desenvolvimento.

## Estrutura e documentação

| Pasta | Conteúdo |
| --- | --- |
| `backend/app/` | API FastAPI e processamento com Python, NumPy e OpenCV |
| `backend/tests/` | Testes da API e dos métodos de PDI |
| `frontend/src/` | Interface React/TypeScript, histogramas e avaliações locais |
| `frontend/tests/` | Testes das avaliações e indicadores |
| `dataset/` | Imagens sintéticas, transcrições e catálogo |
| `docs/` | Planejamento e protocolo proposto de avaliação |

- [Contexto acadêmico e decisões](AGENTS.md)
- [Viabilidade e técnicas de PDI](docs/validacao-pdi.md)
- [Plano de trabalho](docs/plano-validacao.md)
- [Protocolo de comparação](docs/protocolo-comparacao.md)

Os documentos de planejamento contêm propostas e descrições históricas. O protocolo propõe métodos independentes, enquanto a interface atual executa uma sequência; essa diferença deve ser resolvida e justificada antes de apresentar uma avaliação como execução desse protocolo.

O escopo exclui reconstrução de conteúdo perdido, reparo de rasgos, remoção de manchas, mofo e marcas de água, além de reconhecimento de caligrafia.

## Contribuições

Use branch própria a partir da `develop` atualizada e Pull Request para revisão. Confirme a branch de destino antes de abrir o PR. Não faça merge direto na `develop` e preserve alterações locais existentes.
