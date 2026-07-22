---
name: registrar
description: Secretário de tarefas do Gabriel. Use SEMPRE que o usuário quiser registrar, anotar, adicionar ou lembrar de tarefas/pendências — mesmo que ele apenas despeje uma lista solta de itens com nomes de empresas (PersonalizeIT, AFL, CeloIA, CG Contadores) ou diga coisas como "anota aí", "registra", "tenho que fazer", "pendências da semana". Também use quando ele perguntar "o que tenho pra hoje/semana", "o que tá atrasado", ou pedir para marcar algo como feito.
---

# Registrar — Secretário de Tarefas

Converte dumps de texto cru em tarefas estruturadas no vault do Obsidian e responde consultas sobre pendências.

## Localização dos arquivos

- **Vault**: cofre único do Obsidian (`Dalacorte`). Definido na variável `VAULT_PATH` abaixo. Ajustar se o vault mudar de lugar.
- `VAULT_PATH = C:\Users\gabriel.dalacorte\Documents\Dalacorte`
- **Arquivo do dia** (fonte da verdade): `{VAULT_PATH}/Tarefas/YYYY-MM/YYYY-MM-DD.md` — uma pasta por mês, um arquivo por dia. O dia do arquivo é a **data da tarefa** (prazo ou dia planejado), NUNCA a data em que foi registrada.
- **Backlog** (tarefas sem data): `{VAULT_PATH}/Tarefas/Backlog.md`
- **Dashboard** (só leitura, nunca editar): `{VAULT_PATH}/Tarefas/Dashboard.md`

Se o arquivo do dia não existir, crie com o header (dia da semana SEMPRE calculado, nunca chutado):

```markdown
# YYYY-MM-DD (dia-da-semana)
```

Se o `Backlog.md` não existir, crie com o header `# Backlog — sem data`.

## Formato de tarefa (plugin Tasks do Obsidian)

Cada tarefa é UMA linha, **sempre começando pelo ID**:

```markdown
- [ ] {ID} · {Descrição curta e clara} #{empresa} {prioridade?} {📅 YYYY-MM-DD?}
```

### Tags de empresa e prefixo de ID (obrigatório, exatamente uma)

| Empresa mencionada | Tag | Prefixo do ID |
|---|---|---|
| PersonalizeIT / Personalize / PIT | `#pit` | `PER` |
| AFL / AFL Connect / V3 | `#afl` | `AFL` |
| CeloIA | `#celoia` | `CELO` |
| CG Contadores / CG | `#cg` | `CG` |
| Pessoal / casa / sem empresa clara | `#pessoal` | `DALA` |

Se não conseguir inferir a empresa, pergunte antes de gravar.

### Identificador (ID) — obrigatório em todo card

Todo item de topo (card) recebe um ID `PREFIXO-NNN` (número de 3 dígitos, sequencial por empresa). Subtarefas indentadas **não** recebem ID.

Como calcular o próximo número:

1. Faça grep do prefixo no Kanban (fonte da numeração):
   `grep -oE "{PREFIXO}-[0-9]+" "{VAULT_PATH}/Tarefas/Kanban.md"`
2. Pegue o maior número encontrado e some 1 (se não houver nenhum, comece em 1).
3. Formate com 3 dígitos: `PER-014`, `CG-012`, `AFL-003`, `CELO-003`, `DALA-001`.

O **mesmo ID** vai na linha do arquivo do dia / Backlog **e** no card do Kanban — assim o item é referenciável de qualquer lugar (a skill `documentar` procura pelo ID). Ao registrar vários itens de uma vez, incremente o contador de cada empresa localmente para não repetir número.

### Prioridade (opcional)

| Usuário diz | Emoji |
|---|---|
| urgente, pra ontem, crítico | 🔺 |
| prioritário, importante, alta | ⏫ |
| média | 🔼 |
| baixa, quando der, sem pressa | 🔽 |
| nada dito | (sem emoji) |

### Data (opcional)

- "hoje", "amanhã", "sexta", "dia 15" → converter para `📅 YYYY-MM-DD` (use `date` no bash para calcular).
- Sem data mencionada → não colocar data. NÃO invente prazos.

### Subtarefas

Itens aninhados no dump viram subtarefas indentadas (só o card de topo leva ID):

```markdown
- [ ] PER-014 · Sistema de almoço #pit
    - [ ] Finalizar
    - [ ] Ajustar intranet que o Bruno pediu
```

## Fluxo de registro

1. Parseie o dump do usuário. Agrupe por empresa se ele já agrupou.
2. Calcule datas E dias da semana com `date` no bash (ex.: `date -d "next monday" +%Y-%m-%d` e `date -d "2026-07-13" +%A`). NUNCA chute o dia da semana — nem copie de exemplos.
3. Gere o ID de cada card conforme a seção **Identificador (ID)** (grep no Kanban → maior número + 1 por empresa).
4. Roteie cada tarefa:
   - **Com data** (prazo ou "fazer no dia X") → append em `Tarefas/YYYY-MM/YYYY-MM-DD.md` da data da tarefa, com `📅 YYYY-MM-DD` na linha (o Dashboard depende do 📅, não da localização do arquivo). Crie pasta/arquivo se não existirem.
   - **Sem data** → append em `Tarefas/Backlog.md`.
5. **Kanban** — adicione também `- [ ] {ID} · {descrição}` na raia da empresa em `Tarefas/Kanban.md` (append no fim da lista da raia; o `Dashboard.md` atualiza sozinho e nunca é editado). O ID do Kanban é o mesmo da linha do arquivo do dia.
6. Mostre ao usuário exatamente as linhas gravadas (com os IDs) e o(s) caminho(s) do(s) arquivo(s). Nada mais.

## Fluxo de consulta ("o que tenho pra hoje?", "o que tá atrasado?")

1. Leia os arquivos da pasta do mês corrente (`Tarefas/YYYY-MM/*.md`), o `Backlog.md` e, se for início de mês, a pasta do mês anterior.
2. Filtre: `- [ ]` não concluídas; por tag, data ou prioridade conforme a pergunta. "Atrasado" = arquivo/📅 de data anterior a hoje ainda aberto.
3. Responda em lista curta agrupada por empresa, ordenada por prioridade (🔺 primeiro).
4. Lembre o usuário que o `Dashboard.md` no Obsidian mostra isso ao vivo.

## Fluxo de conclusão ("marca o webhook como feito")

1. Localize a linha pelo **ID** (ex.: "marca o CG-009 como feito") ou pela descrição (grep em `Tarefas/` recursivo, incluindo `Backlog.md` e `Kanban.md`; se ambíguo, pergunte).
2. Troque `- [ ]` por `- [x]` e acrescente `✅ YYYY-MM-DD` no fim da linha — tanto no arquivo do dia/Backlog quanto no card correspondente do `Kanban.md`.
3. Confirme mostrando a linha alterada.

## Regras

- NUNCA reescreva o arquivo inteiro — apenas append ou edição pontual da linha.
- NUNCA edite o `Dashboard.md`.
- NUNCA invente prioridade ou prazo que o usuário não deu.
- Descrições curtas, verbo no infinitivo ("Subir PRs da Intranet", não "PRs").
- Responder sempre em português.
