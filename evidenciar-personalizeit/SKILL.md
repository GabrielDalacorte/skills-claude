---
name: evidenciar-personalizeit
description: Gera um PDF de EVIDÊNCIAS com a identidade visual da PersonalizeIT (capa com logo, cores da marca, prints reais do sistema, legendas, tabelas e observações). Use SEMPRE que o Gabriel pedir para "evidenciar com PDF", "gerar um PDF com a evidência", "montar as evidências disso", "criar um PDF com imagens/prints", "documento de comprovação para o cliente" ou algo do tipo — inclusive quando ele só disser "evidencia isso aí em PDF" logo depois de uma entrega. NÃO é a skill `documentar-tela` (aquela é o guia "Como funciona" em .docx), nem a `documentar` (spec/resolução por ID de tarefa, sem prints), nem a `acompanhar-projeto` (documento de status com a marca do PRÓPRIO produto, sem logo de agência).
---

# Evidenciar (PersonalizeIT) — comprovação visual da entrega

Produz um PDF que **prova** que o que foi pedido está funcionando: capa com a logo da
PersonalizeIT, prints reais do sistema rodando, legenda em cada figura e uma seção final
com o que o cliente precisa saber para colocar no ar.

Diferença para as skills irmãs:

| Skill | Entrega | Quando |
|---|---|---|
| `documentar` | spec ou resolução em texto, por ID | planejar ou registrar como resolveu |
| `documentar-tela` | guia "Como funciona" (.docx) | ensinar alguém a usar uma tela |
| `acompanhar-projeto` | PDF de acompanhamento, marca do produto | dizer onde o projeto está e o que vem |
| **`evidenciar-personalizeit`** | **PDF de evidências, marca da PersonalizeIT** | **comprovar que a entrega está feita** |

O tom é de comprovação, não de tutorial: cada seção mostra **o que foi pedido, o que
mudou e o print que prova**.

## Pré-requisitos

1. **Chrome instalado** — os scripts usam `channel: chrome`. Nada de Word/LibreOffice: o
   PDF sai do próprio Chrome, então o layout é 100% CSS.
2. **Dependências** (uma vez só) — Playwright (captura + impressão) e pdf-lib (junta a
   capa com o miolo):
   `cd "<esta-pasta>/scripts" && npm i --registry=https://registry.npmjs.org/`
   (o registry público é obrigatório nesta máquina — o `.npmrc` global aponta para o
   CodeArtifact da CG e dá `E401`).
3. **App rodando** com o código da entrega. Se ainda não subiu, veja "Rodar local" abaixo.
4. **Diretório de trabalho** = o scratchpad da sessão (`shots.json`, `evidencia.json` e os
   `.png` ficam lá). Só o PDF final vai para a pasta do cliente.

## Fluxo

1. **Entenda o que está sendo evidenciado.** Releia o pedido original do cliente — as
   palavras dele viram os títulos das seções. Se o pedido veio de um item (PER-xxx), use
   o ID nas `tags` da capa.
2. **Liste as telas que provam cada item.** Uma evidência boa mostra o *contraste*: a
   permissão concedida sozinha, o usuário que não enxerga, o campo novo preenchido. Print
   de tela genérica não prova nada.
3. **Suba o app** (ver "Rodar local") e monte o `shots.json`.
4. **Capture:** `node <scripts>/capturar.js shots.json evidencias`
5. **Revise CADA png** com a ferramenta Read. Refaça o que saiu cortado, vazio, com menu
   aberto por engano ou com o conteúdo abaixo da dobra (é o erro mais comum — use
   `scrollIn` no container que tem barra de rolagem própria).
6. **Escreva o `evidencia.json`** (schema no cabeçalho de `scripts/gerar_pdf.js`,
   exemplo pronto em `examples/`).
7. **Gere:** `node <scripts>/gerar_pdf.js evidencia.json evidencias`
8. **Confira o PDF** (páginas, nº de figuras) e entregue o caminho + um resumo das seções.
   Ofereça o texto da mensagem para o cliente.

## Rodar local para capturar (sem tocar em produção)

Quase sempre o código ainda não está no ar quando o Gabriel pede a evidência. Subir local
é o caminho — e é seguro, desde que você confira o banco antes:

- **Django:** veja se o `.env` tem uma chave de ambiente (`STATUS=Local`, `DEBUG`, etc.)
  que faz o `settings.py` cair em SQLite. Se o `.env` apontar para um Postgres remoto,
  **pare e pergunte** — nunca rode `migrate` contra a base do cliente.
- **Front:** variável de ambiente vence o `.env` na maioria dos setups Vite, então dá para
  apontar para a API local sem editar arquivo:
  `REACT_APP_BACKEND_URL=http://localhost:8000 npx vite --port 3050`
- **Dados de demonstração:** crie no banco local os usuários/registros que a evidência
  precisa (ex.: um usuário com uma permissão só). Diga no PDF que são dados de teste
  quando os nomes forem fictícios — nunca venda dado inventado como real.

## Fazer a evidência provar de verdade

O que separa um PDF que convence de um que não:

- **Mostre o antes.** Uma seção "por que acontecia" com o print do estado anterior faz o
  depois valer.
- **Prove pelo contraste.** Dois usuários lado a lado — um enxerga, o outro não — vale
  mais que dez prints da tela de configuração.
- **Legenda diz o que olhar**, não o que a tela é. "Usuário sem o cadastro de usuários
  enxergando só o relatório" e não "Tela do menu".
- **Feche com o que o cliente precisa fazer.** Relogar, rodar migration, o que não muda.
  Use `note` com `type: "alerta"` para o que trava a entrega.

## Onde salvar

Pasta do cliente/projeto, ao lado do código. Nome:
`Evidencias_{Assunto}.pdf` (ex.: `Evidencias_Permissoes_Relatorio_e_Site.pdf`).
Se não estiver claro qual é a pasta, proponha uma e confirme.

## Identidade visual

Tudo vem de `assets/brand.json` — cores, fonte e o arquivo da logo. Para mudar a marca,
edite **só esse arquivo**; nenhum hex fica solto no gerador. A logo é embutida no PDF em
base64, então o arquivo final é autocontido.

Para depurar o layout sem abrir o PDF: `KEEP_HTML=1 node gerar_pdf.js ...` salva o HTML
do lado, e dá para abri-lo no Chrome. Para conferir o PDF **de verdade** (paginação,
rodapé, o que caiu em cada página), rasterize as páginas em PNG e abra com o Read —
`pypdfium2` + `pillow` fazem isso em três linhas. Só olhar o HTML esconde tudo que é
específico de impressão.

O rodapé do Chrome vale para o documento inteiro, e sobre a capa escura ele fica
ilegível. Por isso o gerador imprime em duas passadas (`pageRanges` `1` e `2-`) e junta
com o pdf-lib: capa sem rodapé, miolo com rodapé já numerado a partir de "2/N".

## Regras

- **Prints reais, sempre.** Nada de mockup, placeholder ou tela montada em HTML. Se o app
  não subir, avise e pare — não invente a evidência.
- Se alguma tela for de ambiente local com dados fictícios, **diga isso no PDF**.
- Não altere permissão, dado ou configuração em **produção** para tirar print. Se a
  evidência exigir isso, use ambiente local ou peça autorização explícita.
- `shots.json`, `evidencia.json` e os `.png` ficam no scratchpad; só o PDF vai para a
  pasta do projeto.
- **Não commitar** nada — o Gabriel revisa e commita.
- Escrever o PDF e responder em português, em linguagem de cliente: sem nome de arquivo,
  sem nome de variável, sem jargão de código no corpo do documento.
