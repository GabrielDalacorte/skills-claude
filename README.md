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

## documentar-tela — setup

O harness usa Playwright. Uma vez, instale as dependências (os browsers são globais, sem
re-download pesado):

```bash
cd documentar-tela/scripts && npm i playwright
```

O passo a passo completo está em [`documentar-tela/SKILL.md`](documentar-tela/SKILL.md).
`node_modules/` e artefatos de execução (`state.json`, `*.png`) ficam fora do versionamento.
