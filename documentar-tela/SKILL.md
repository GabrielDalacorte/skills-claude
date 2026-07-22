---
name: documentar-tela
description: Gera um DOCX-guia explicando uma tela/feature de um sistema web que está RODANDO, tirando prints reais da própria aplicação (via Playwright/Chrome) e montando o documento no estilo "Como funciona" (capa + seções numeradas + print + legenda). Use quando o Gabriel pedir para "criar um docx explicando a X", "documentar a feature/tela Y com prints/screenshots", "fazer um guia da tela Z", "explicar o módulo W com telas", "algo como o afl-connect-v3-validacao / Visibilidade_Como_Funciona". NÃO é a skill `documentar` (aquela é spec/resolução por ID de tarefa, sem prints) — esta é o guia VISUAL de uma feature com capturas reais.
---

# Documentar Tela — guia visual (docx) com prints reais

Objetivo: produzir um `.docx` que explica uma feature navegando o app real, tirando os
prints de cada passo e escrevendo o texto ao redor. Nasceu do guia
`D:\AFL\presentations\Visibilidade_Como_Funciona.docx`.

O harness fica em `scripts/` (nesta pasta da skill) e é data-driven: você **explora** a
feature, escreve um `shots.json` (o que capturar) e um `doc.json` (a estrutura do
documento), e os scripts fazem o resto. Fluxos complexos podem ter um script Playwright
avulso — reaproveite `scripts/pw.js` (`require('../..../scripts/pw')`).

## Pré-requisitos (checar rápido, não perguntar o óbvio)

1. **App rodando.** Descubra a porta: `netstat -ano | grep LISTEN` (Vite=5173, etc.) ou
   pergunte a URL. Defina `APP_BASE` se não for `http://localhost:5173`.
2. **Credenciais.** Default = seed **afl-teste**: `admin@aflteste.com.br` / `1611`.
   Outro app? Peça e passe por env (`APP_EMAIL`, `APP_PASS`) + seletores se diferirem.
3. **Chrome instalado** (os scripts usam `channel: chrome`). 
4. **Playwright disponível para os scripts.** Uma vez só:
   `cd "<esta-pasta>/scripts" && npm i playwright` (os browsers são globais, sem
   re-download). Confirme com `npm ls playwright` nessa pasta.
5. **Diretório de trabalho** = o scratchpad da sessão. É onde vão `state.json`,
   `shots.json`, `doc.json` e os `.png`. Rode os `node`/`python` com o cwd no scratchpad
   (a resolução de módulo do Playwright vem da pasta do script, então funciona).

## Fluxo

1. **Entender a feature.** Se não conhecer, faça uma exploração rápida do código do front
   (rotas, componentes, labels pt-BR) — um subagente Explore é ótimo para isso. Liste as
   telas/estados na ordem que o usuário percorre.
2. **Logar:** `node <scripts>/login.js` → gera `state.json` no cwd. (Faça uma vez.)
3. **Achar rotas/seletores/dados reais:** `node <scripts>/probe.js /rota` imprime botões,
   links, inputs, selects (com opções) e o texto da página. Use para descobrir IDs de
   rota (clientes/empresas), nomes de botões e para **escolher uma entidade que tenha
   dados de verdade** (empresa com relatórios, template com widgets) — prints vazios são ruins.
4. **Montar `shots.json`** (veja `examples/shots.visibilidade.json`). Um shot por tela/estado.
   Regras de ouro:
   - Prefira `clickButton` (por role) e `clickHasText` (escopo + texto único, ex. um CNPJ)
     a `clickText` genérico — este último clica no menu de navegação por engano.
   - Selecione uma **empresa-modelo / entidade com dados** antes de capturar canvases/dashboards.
   - Para modais, capture logo após abrir; para dropdowns, capture com ele aberto.
   - `settleMs` maior (5000-7000) em telas que buscam dados (dashboards, previews).
5. **Capturar:** `node <scripts>/shot.js shots.json <pastaSaida>`. Confira o log (OK/FAIL).
6. **Revisar cada PNG** abrindo-o (ferramenta Read na imagem). Refaça os que saíram com
   tour aberto, menu aberto por engano, vazios ou cortados. Ajuste `shots.json` e rode de novo.
7. **Escrever `doc.json`** (veja `examples/doc.visibilidade.json`): capa, `intro` (o que é +
   fluxo em 1 linha), `toc`, `sections` (cada uma com `paragraphs`/`bullets`/`steps` e as
   `figures` apontando os PNGs + legendas curtas), e `glossary`. Texto claro, pt-BR, tom de
   guia — explique o "para quê", não só o "onde clicar".
8. **Gerar:** `python <scripts>/gerar_docx.py doc.json <pastaDosPNGs>`. Saída = campo
   `output` do doc.json.
9. **Validar:** confira que nº de imagens embutidas == nº de figuras e que os headings
   batem (pequeno script python-docx). Entregue o **caminho** + resumo das seções e
   ofereça ajustes (mais/menos prints, tom, PDF, capa com logo).

## Onde salvar o docx

- AFL → `D:\AFL\presentations\{Feature}_Como_Funciona.docx` (junto dos outros guias).
- Outro contexto → pergunte a pasta, ou proponha uma. Nome: `{Feature}_Como_Funciona.docx`.

## Referência das ações do shots.json

`wait`, `waitFor`, `press`, `scrollBottom`/`scrollTop`, `clickButton` (por nome/role),
`clickText` (+`exact`), `clickSelector` (CSS), `clickHasText` (`{selector,text}`), `fill`
(`{selector,value}`), `selectOption` (`{selector,value|label|index}`). Detalhes no cabeçalho
de `scripts/shot.js`.

## Variáveis de ambiente (todas opcionais)

`APP_BASE`, `APP_EMAIL`, `APP_PASS`, `APP_EMAIL_SEL`, `APP_PASS_SEL`, `APP_LOGIN_BTN`,
`APP_LOGIN_PATH`, `STATE_PATH`, `TOUR_KEYS` (chaves de localStorage p/ matar onboarding;
default `main_tour_completed,workflow_tour_completed`), `VW`/`VH`/`DSF`, `HEADED=1`.

## Regras

- Sempre **prints reais** do app rodando — nada de placeholder. Se o app não estiver de pé,
  avise e pare (ou pergunte a URL). 
- Desligue tours/onboarding (o `pw.js` já injeta as `TOUR_KEYS`); se aparecer outro overlay,
  adicione a chave em `TOUR_KEYS`.
- Use dados de verdade nos prints (escolha entidade com movimento).
- Se uma tela do produto for **mockada/simulada**, diga isso no texto (não venda como real).
- Deixe `shots.json`, `doc.json`, scripts avulsos e PNGs no **scratchpad** (não no projeto).
- **Não commitar** nada — o Gabriel revisa e commita. (ver memória `nao-commitar`.)
- Responder e escrever o documento em português.
