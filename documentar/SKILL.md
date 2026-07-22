---
name: documentar
description: Gera documentação de um item de tarefa do Gabriel (spec de planejamento OU registro de como foi resolvido, com o problema) e salva na pasta do cliente/projeto. Use SEMPRE que ele mandar um ID de item (PER-xxx, CG-xxx, CELO-xxx, AFL-xxx, DALA-xxx) pedindo para "criar uma spec", "documentar", "escrever como resolvi", "registrar o problema e a solução" ou algo do tipo. O ID é a chave: ele quase sempre começa a mensagem citando o ID.
---

# Documentar — Spec & Resolução por item

Recebe um ID de item + o contexto que o Gabriel descrever e grava um documento markdown na pasta do cliente. Dois modos: **Spec** (antes de fazer, planejamento) ou **Resolução** (depois de feito: o problema + como foi resolvido).

## Localização

- **Vault de tarefas** (para achar o item pelo ID): `C:\Users\gabriel.dalacorte\Documents\Dalacorte\Tarefas` — principalmente o `Kanban.md`. (Cofre único `Dalacorte`.)
- **Base dos documentos de cliente** (`DOCS_BASE`): `C:\Users\gabriel.dalacorte\Documents\Dalacorte\Proximas Tarefas e Ajustes`
- **Caminho final do doc:** `{DOCS_BASE}/{Cliente}/{Projeto}/{ID} - {nome do card}/{Tipo} {YYYY-MM-DD}.md`
  - `{ID} - {nome do card}` é a **pasta do card** (o item vira uma pasta própria — cabem Spec, Resolução, prints e anexos dele lá dentro).
  - `{Tipo}` = `Spec` ou `Resolução`.
  - Ex.: `.../PersonalizeIT/Site Institucional/PER-014 - Melhorar as mensagens enviadas no WhatsApp/Resolução 2026-07-21.md`

### Prefixo do ID → empresa → pasta do cliente

| Prefixo | Empresa | Pasta base do cliente |
|---|---|---|
| `PER` | PersonalizeIT | `PersonalizeIT` |
| `CG` | CG Contadores | `CG Contadores` |
| `CELO` | CeloIA | `Pessoal/Empresa Nova/CeloIA` |
| `AFL` | AFL | `AFL` (criar se não existir) |
| `DALA` | Pessoal / Dala | `Pessoal` |

## Fluxo

1. **Pegue o ID** que o Gabriel citou (ex.: `PER-014`). O prefixo já define a empresa e a pasta base.
2. **Ache o item** pelo ID para saber a descrição:
   `grep -n "{ID}" "C:\Users\gabriel.dalacorte\Documents\Dalacorte\Tarefas\Kanban.md"`
   (se não achar no Kanban, grep recursivo em `Tarefas/`). Se não achar o ID, avise e peça a descrição.
3. **Extraia o nome do card** da linha encontrada: tire o prefixo `- [ ] {ID} · ` e **limpe sufixos redundantes** entre parênteses — data (ex.: `(20/07)`) e o próprio nome do projeto (ex.: `(Site Institucional)`). Esse texto limpo é o `{nome do card}`.
   - Ex.: `PER-014 · Melhorar as mensagens enviadas no WhatsApp (Site Institucional)` → nome = `Melhorar as mensagens enviadas no WhatsApp`.
4. **Decida o modo** pelo que ele disser:
   - "vou fazer", "planeja", "cria a spec", "antes de começar" → **Spec**.
   - "resolvi", "consertei", "fiz assim", "como resolvi", "já está pronto" → **Resolução**.
   - Se ambíguo, pergunte curto: "Spec (planejamento) ou Resolução (como foi feito)?".
5. **Defina o Projeto** a partir do que ele falar (ex.: "Site Institucional", "Brunetto", ou um caminho com mais níveis como "Novo Intranet / Desenvolvimento"). Se não deixar claro, pergunte só isso. Não invente.
6. **Monte o caminho e grave:**
   - Pasta: `{DOCS_BASE}/{Cliente}/{Projeto}/{ID} - {nome do card}/` (crie se não existir).
   - Arquivo: `{Tipo} {YYYY-MM-DD}.md` (`Spec` ou `Resolução`; data = hoje, `date +%Y-%m-%d`). Se já existir um do mesmo dia, acrescente ` (2)`, ` (3)`…
   - **Sanitize** nomes de pasta/arquivo para o Windows: os caracteres `\ / : * ? " < > |` não podem aparecer — troque `:` por ` -` e remova os demais.
7. **Confirme** mostrando o caminho completo do arquivo e um resumo do conteúdo. Nada mais.

## Template — Spec (planejamento)

```markdown
# {ID} — {nome do card} · Spec

- **Item:** {ID} — {descrição do card}
- **Cliente / Projeto:** {Cliente} / {Projeto}
- **Data:** {YYYY-MM-DD}

## Problema / Contexto
{o que motiva, dor atual, situação hoje}

## Objetivo
{o que se quer alcançar, em uma frase}

## Escopo
- Inclui: {...}
- Não inclui: {...}

## Requisitos
- [ ] {requisito 1}
- [ ] {requisito 2}

## Plano de implementação
1. {passo}
2. {passo}

## Critérios de aceite
- [ ] {como saber que está pronto}

## Observações / riscos
{dependências, pontos de atenção}
```

## Template — Resolução (o problema + como foi resolvido)

```markdown
# {ID} — {nome do card} · Resolução

- **Item:** {ID} — {descrição do card}
- **Cliente / Projeto:** {Cliente} / {Projeto}
- **Data:** {YYYY-MM-DD}

## Problema
{qual era o problema, sintoma, como aparecia}

## Diagnóstico / Causa
{o que estava por trás}

## Solução aplicada
{o que foi feito, passo a passo}

## Mudanças
- {arquivos, serviços, configs, PRs, migrations tocados}

## Como validar / testar
1. {passo para reproduzir/verificar que resolveu}

## Observações
{efeitos colaterais, follow-ups, o que ficou de fora}
```

## Regras

- O nome da pasta é **sempre** `{ID} - {nome do card}` — NUNCA invente um título curto próprio.
- O texto sai do que o Gabriel descrever — NÃO invente detalhes técnicos que ele não deu; deixe placeholders curtos ou pergunte.
- Preencha o que o próprio card já diz (descrição, empresa) sem perguntar de novo.
- Só peça informação que realmente falta (Projeto/modo). Uma pergunta curta, não um questionário.
- Responder sempre em português.
- Não edite o Kanban nem os arquivos de tarefa aqui — esta skill só gera o documento na pasta do cliente. (Marcar tarefa como feita é a skill `registrar`.)