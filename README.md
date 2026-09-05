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

## Setup das skills com Playwright

`documentar-tela` e `evidenciar-pdf` usam Playwright + o Chrome do sistema. Uma vez por
skill (os browsers são globais, sem re-download pesado):

```bash
cd documentar-tela/scripts && npm i --registry=https://registry.npmjs.org/ playwright
cd evidenciar-pdf/scripts  && npm i --registry=https://registry.npmjs.org/ playwright
```

O `--registry` público é necessário nas máquinas em que o `.npmrc` global aponta para o
CodeArtifact da CG Contadores — sem ele o install quebra com `E401`.

O passo a passo de cada uma está no `SKILL.md` da pasta.
`node_modules/` e artefatos de execução (`state.json`, `*.png`) ficam fora do versionamento.

## evidenciar-pdf — identidade visual

Cores, fonte e logo ficam em [`evidenciar-pdf/assets/brand.json`](evidenciar-pdf/assets/).
Para mudar a marca, edite só esse arquivo — nenhum hex fica solto no gerador. A logo é
embutida no PDF em base64, então o arquivo final é autocontido.
