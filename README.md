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
| [`evidenciar-pdf`](evidenciar-pdf/) | Gera um **PDF de evidências** com a identidade da PersonalizeIT (capa com logo, cores da marca) provando que uma entrega está funcionando, com prints reais capturados via Playwright/Chrome. |
| [`filmar-produto`](filmar-produto/) | Faz um **vídeo** (.mp4 1080p) de um app rodando: fotografa as telas em 3x via Playwright e anima por cima com **Remotion** — câmera, legendas, marcadores grudados na interface e contadores. Template de projeto em `template/`. |

## Setup das skills com Playwright

### Node (documentar-tela, evidenciar-pdf)

`documentar-tela` e `evidenciar-pdf` usam Playwright + o Chrome do sistema. Uma vez por
skill (os browsers são globais, sem re-download pesado):

```bash
cd documentar-tela/scripts && npm i --registry=https://registry.npmjs.org/ playwright
cd evidenciar-pdf/scripts  && npm i --registry=https://registry.npmjs.org/
```

O `--registry` público é necessário nas máquinas em que o `.npmrc` global aponta para o
CodeArtifact da CG Contadores — sem ele o install quebra com `E401`.

### Python (filmar-produto)

O `filmar-produto` captura por **Playwright de python**, porque quase todo projeto Django
meu já tem no venv (`backend\.venv\Scripts\python.exe -c "import playwright"`). Se não
tiver:

```bash
pip install --index-url https://pypi.org/simple/ playwright && playwright install chromium
```

Mesma história do `--registry` do npm: o `--index-url` público é necessário quando o pip
aponta para o CodeArtifact (ver memória `pip-index-codeartifact`).

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

## evidenciar-pdf — identidade visual

Cores, fonte e logo ficam em [`evidenciar-pdf/assets/brand.json`](evidenciar-pdf/assets/).
Para mudar a marca, edite só esse arquivo — nenhum hex fica solto no gerador. A logo é
embutida no PDF em base64, então o arquivo final é autocontido.
