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

**Estado atual do código:** protótipo com API em FastAPI e interface em React, TypeScript e Vite. O código contém processamento em escala de cinza com CLAHE, equalização global, ajuste de contraste, filtro de Fourier e Otsu. A interface permite acompanhar as etapas ou gerar o resultado final e baixar uma imagem PNG. A presença dessas implementações não comprova melhoria de legibilidade. As decisões acadêmicas e o protocolo de avaliação seguem os status registrados na documentação.

## Executar localmente no Windows

Os comandos abaixo são para PowerShell e consideram o repositório em `C:\Projetos\projeto-final-pdi`. Ajuste o caminho se a pasta estiver em outro local. Use dois terminais, um para a API e outro para a interface.

### 1. Preparar as ferramentas

| Ferramenta | Requisito | Uso |
| --- | --- | --- |
| Node.js e npm | Node.js 20.19+ na linha 20, ou 22.12+ | Instalar e executar o frontend, conforme o requisito do Vite no lockfile |
| uv | Instalado e disponível no `PATH` | Gerenciar o ambiente Python e executar o backend |
| Python | 3.12 ou superior | Executar a API e o processamento de imagens |

Para instalar Node.js LTS e uv com o Windows Package Manager, execute os comandos correspondentes às ferramentas que faltam.

```powershell
winget install --id OpenJS.NodeJS.LTS -e
winget install --id astral-sh.uv -e
```

Após a instalação, feche e reabra o VS Code inteiro ou o aplicativo de terminal para carregar o novo `PATH`. Confira as ferramentas.

```powershell
node --version
npm.cmd --version
uv --version
```

Se precisar instalar o Python, o próprio uv pode fazer isso.

```powershell
uv python install 3.12
```

Os exemplos usam `npm.cmd`, disponível com o Node.js no Windows, para evitar o bloqueio do script `npm.ps1` pela política de execução do PowerShell.

### 2. Iniciar o backend no primeiro terminal

```powershell
cd C:\Projetos\projeto-final-pdi\backend
uv sync
uv run uvicorn app.main:app --reload --port 8000
```

`uv sync` instala as dependências de `pyproject.toml` usando `uv.lock` e prepara o ambiente virtual em `backend/.venv`. O comando `uv run` usa esse ambiente automaticamente.

Mantenha o terminal aberto. Quando aparecer `Uvicorn running on http://127.0.0.1:8000`, a API estará disponível.

| Endereço | O que verificar |
| --- | --- |
| http://localhost:8000/api/health | Deve retornar `{"status":"ok"}` |
| http://localhost:8000/docs | Documentação interativa da API, incluindo `POST /api/process` |

### 3. Iniciar o frontend no segundo terminal

```powershell
cd C:\Projetos\projeto-final-pdi\frontend
npm.cmd ci
npm.cmd run dev -- --port 5173 --strictPort
```

`npm.cmd ci` instala as dependências conforme `frontend/package-lock.json`. Abra **http://localhost:5173** e mantenha os dois terminais em execução.

O Vite encaminha as chamadas de `/api` para `http://localhost:8000`, conforme `frontend/vite.config.ts`. Esses comandos usam as portas esperadas pela configuração atual. A opção `--strictPort` informa um erro se a porta 5173 estiver ocupada.

### 4. Usar a interface

1. Envie uma imagem PNG ou JPEG de até 20 MB.
2. Escolha acompanhar o passo a passo ou gerar o resultado final.
3. No passo a passo, confira as prévias e ajuste os parâmetros disponíveis antes de avançar.
4. Compare as imagens exibidas e baixe o resultado em PNG.

A sequência atual é CLAHE, equalização global, ajuste de contraste, Fourier e Otsu. Otsu permanece experimental e pode eliminar traços fracos. A avaliação científica da legibilidade depende dos experimentos previstos no protocolo.

Para encerrar, pressione `Ctrl+C` em cada terminal. Nas próximas execuções, basta iniciar os dois servidores com os mesmos comandos `uv run` e `npm.cmd run dev`. Execute `uv sync` ou `npm.cmd ci` novamente após mudanças nas respectivas dependências.

### Problemas comuns

#### O PowerShell informa que `uv` não é reconhecido

Se a instalação acabou de terminar, recarregue o `PATH` no terminal atual.

```powershell
$env:Path = [Environment]::GetEnvironmentVariable("Path", "Machine") + ";" + [Environment]::GetEnvironmentVariable("Path", "User")
uv --version
```

Em seguida, repita os comandos do backend. Também é possível fechar e reabrir o VS Code inteiro para carregar a alteração.

#### O PowerShell bloqueia `npm.ps1`

Use `npm.cmd` como nos exemplos acima, inclusive para instalar dependências e executar os scripts.

#### A porta 8000 ou 5173 está ocupada

Confira se o serviço já está em execução em outro terminal. Encerre a execução anterior com `Ctrl+C` antes de iniciar novamente. Manter as portas documentadas permite usar o proxy e a origem CORS configurados no projeto.

#### A interface abre, mas o processamento falha

Confira se http://localhost:8000/api/health responde e consulte o erro no terminal do backend. Execute o frontend pelo servidor Vite e use http://localhost:5173. Verifique também o formato PNG/JPEG e o limite de 20 MB do arquivo enviado.

## Verificações de desenvolvimento

Para executar os testes do backend, use um terminal na pasta `backend`.

```powershell
uv run pytest -q
```

Para verificar a compilação do frontend, use um terminal na pasta `frontend`.

```powershell
npm.cmd run build
```

O build gera os arquivos em `frontend/dist`. A execução local integrada descrita acima usa `npm.cmd run dev`, que fornece o proxy para a API.

## Escopo excluído

Remoção de manchas, mofo, marcas de água, conteúdo encoberto, reparo de rasgos, reconstrução de letras ou campos perdidos e reconhecimento de caligrafia. O projeto realça apenas o sinal que ainda existe na imagem.

## Fluxo de contribuição

Branch própria a partir da `develop` atualizada, Pull Request para revisão do arquiteto ou de outro desenvolvedor e confirmação da branch de destino antes de abrir o PR. Não há merge direto na `develop`; a homologação depende de aprovação. Detalhes em [AGENTS.md](AGENTS.md).
