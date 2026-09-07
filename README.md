# skills-claude

Minhas skills do [Claude Code](https://claude.com/claude-code).

Cada pasta é uma skill (`SKILL.md` + arquivos de apoio). Para usar, copie a pasta para
`~/.claude/skills/`.

## Skills

| Skill | O que faz |
|---|---|
| [`documentar`](documentar/) | Gera a documentação de um item de tarefa (Spec de planejamento **ou** Resolução) a partir de um ID (PER-, CG-, CELO-, AFL-, DALA-) e salva na pasta do cliente/projeto. |
| [`registrar`](registrar/) | Secretário de tarefas: registra/anota pendências soltas por empresa, marca como feitas e responde "o que tenho pra hoje/semana". |
| [`documentar-tela`](documentar-tela/) | Gera um `.docx`-guia ("Como funciona") explicando uma feature de um app **rodando**, tirando **prints reais** via Playwright/Chrome. Harness data-driven em `scripts/` + exemplos reais em `examples/`. |
| [`evidenciar-personalizeit`](evidenciar-personalizeit/) | Gera um **PDF de evidências** com a identidade da **PersonalizeIT** (capa com logo, cores da marca) provando que uma entrega está funcionando, com prints reais capturados via Playwright/Chrome. |
| [`acompanhar-projeto`](acompanhar-projeto/) | Gera um **documento de acompanhamento** em PDF — "onde estamos e o que vem a seguir" — com a identidade do **próprio produto** (sem logo de agência): prints reais, itens numerados, boxe de limitação e tabela do que falta. |
| [`filmar-produto`](filmar-produto/) | Faz um **vídeo** (.mp4 1080p) de um app rodando: fotografa as telas em 3x via Playwright e anima por cima com **Remotion** — câmera, legendas, marcadores grudados na interface e contadores. Template de projeto em `template/`. |

## Setup das skills com Playwright

### Node (documentar-tela, evidenciar-personalizeit)

`documentar-tela` e `evidenciar-personalizeit` usam Playwright + o Chrome do sistema. Uma vez por
skill (os browsers são globais, sem re-download pesado):

```bash
cd documentar-tela/scripts && npm i --registry=https://registry.npmjs.org/ playwright
cd evidenciar-personalizeit/scripts && npm i --registry=https://registry.npmjs.org/
```

O `--registry` público é necessário nas máquinas em que o `.npmrc` global aponta para o
CodeArtifact da CG Contadores — sem ele o install quebra com `E401`.

### Python (filmar-produto, acompanhar-projeto)

O `filmar-produto` e o `acompanhar-projeto` capturam por **Playwright de python**, porque quase todo projeto Django
meu já tem no venv (`backend\.venv\Scripts\python.exe -c "import playwright"`). Se não
tiver:

```bash
pip install --index-url https://pypi.org/simple/ playwright && playwright install chromium
```

Mesma história do `--registry` do npm: o `--index-url` público é necessário quando o pip
aponta para o CodeArtifact (ver memória `pip-index-codeartifact`). O `acompanhar-projeto`
também usa `pillow` (só para mascarar dado sensível) e `pypdfium2` (para conferir a
paginação do PDF gerado).

O passo a passo de cada uma está no `SKILL.md` da pasta.
`node_modules/` e artefatos de execução (`state.json`, `*.png`) ficam fora do versionamento.

## filmar-produto — o projeto de vídeo

`filmar-produto/template/` é um projeto [Remotion](https://remotion.dev) completo: copie
para `<projeto>/video`, `npm install`, e o roteiro inteiro vive em `src/Pitch.tsx` — ordem
das cenas, caminho da câmera sobre cada print, marcadores e legendas. Precisa de Node e,
para a versão leve do .mp4, de `ffmpeg`.

Antes de renderizar, dois arquivos não são opcionais: `src/tema.ts` (as cores e fontes do
produto) e `public/shots/` (os PNGs do `capturar.py`). Paleta genérica denuncia o corte
entre a cena animada e a tela real.

## acompanhar-projeto — a marca é o produto

Este é o par do `evidenciar-personalizeit`, e a diferença é de propósito: aqui **não entra
logo nem cor de agência**. A identidade vem da tipografia editorial (serifa, filete duplo,
versaletes) e dos `tokens` de cor que você copia do `theme.css` do próprio app — o
documento tem que parecer ter saído de dentro do sistema que descreve.

O conteúdo é `documento.json` puro (schema no cabeçalho de `scripts/gerar_pdf.py`), e o
exemplo comentado em [`acompanhar-projeto/examples/`](acompanhar-projeto/examples/) é o
documento real da Bússola Tributária.

Uma armadilha vale o aviso: a **largura da figura é decisão de paginação**, não de
estética. Uma captura 16:9 a 82% da coluna faz o item fechar em ~120mm e sobra um quarto
de folha em branco no pé de cada página; a 74% dois itens dividem a folha. Meça no PDF
rasterizado, nunca no navegador.

## evidenciar-personalizeit — identidade visual

Cores, fonte e logo ficam em [`evidenciar-personalizeit/assets/brand.json`](evidenciar-personalizeit/assets/).
Para mudar a marca, edite só esse arquivo — nenhum hex fica solto no gerador. A logo é
embutida no PDF em base64, então o arquivo final é autocontido.
