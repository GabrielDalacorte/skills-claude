---
name: filmar-produto
description: Faz um VÍDEO animado de um sistema web que está RODANDO — fotografa as telas reais via Playwright em 3x e anima por cima com Remotion (React que renderiza vídeo), gerando um .mp4 1080p com câmera, legendas editoriais, marcadores e contadores. Use quando o Gabriel pedir "fazer um vídeo do sistema", "vídeo com animações/Remotion", "vídeo-pitch", "demo animada do produto", "vídeo pra landing page", "teaser do app", "gravar a tela com animação". NÃO é a skill `documentar-tela` (aquela é guia .docx com prints estáticos) nem a `evidenciar-pdf` (PDF de evidências) — esta gera VÍDEO.
---

# Filmar produto — vídeo-pitch com telas reais + Remotion

Objetivo: um `.mp4` que vende o produto usando as telas de verdade. Nasceu do pitch da
Bússola Tributária (`D:\AFL\afl-bussola\bussula-tributaria\video`).

**Não é gravação de tela.** Screencast tem cursor tremido, timing errado e refaz do zero a
cada ajuste. Aqui: o Playwright *fotografa* as telas em 4800×2700, e o Remotion move uma
câmera por cima dessas fotos — zoom, pan e marcadores grudados num botão. Cada ajuste é
uma linha de código e um re-render, não uma nova gravação.

## Pré-requisitos

1. **App rodando.** Descubra a porta (`netstat -ano | grep LISTEN`) ou pergunte a URL.
2. **Credenciais.** Peça, ou procure no `.env` / seed / `dev.ps1`. Se precisar descobrir a
   senha de um usuário de dev, teste as óbvias contra o endpoint de token em vez de
   resetar o banco dele.
3. **Playwright em python.** Quase todo projeto Django do Gabriel já tem no venv
   (`backend\.venv\Scripts\python.exe -c "import playwright"`). Se não tiver:
   `pip install --index-url https://pypi.org/simple/ playwright && playwright install chromium`
   (o `--index-url` público é necessário quando o pip aponta para o CodeArtifact da CG).
4. **Node + ffmpeg.** `ffmpeg` é usado só para conferir frames e gerar a versão leve.

## Fluxo

### 1. Entender o que vender (não pule)

Leia o README do projeto e as telas. Escolha **uma execução/registro real** que sustente o
filme inteiro — com dado de verdade, sem `[simulação]`, sem estado de erro. Anote os
números dela (quantidades, duração, custo); é o que vai virar legenda e contador.

Pergunte ao Gabriel, se ele não disse: **formato** (pitch comercial 60-90s 16:9, demo
técnica 2-3min, teaser vertical 30s) e se a peça é **externa** (cliente/landing) ou interna
— muda o que pode aparecer na tela.

### 2. Capturar as telas

Escreva um `telas.json` (veja `examples/telas.bussola.json`) e rode:

```bash
<python> <esta-pasta>/scripts/capturar.py telas.json <projeto>/video/public/shots
```

Regras que evitam retrabalho:

- **`dsf: 3`** (default). O filme fecha em cima de um card; a 2x isso já borra.
- **Um clique por ação**, na ordem em que o usuário faria. Prefira `clicarBotao`
  (por role/nome) a `clicarTexto`, que acerta o menu por engano.
- Estados que só existem depois de interação (modal, diálogo, grafo ampliado) são
  `acoes` da mesma rota — não rota nova.
- Escolha entidade **com movimento**: tela vazia não vende nada.

### 3. Montar o projeto de vídeo

```bash
cp -r <esta-pasta>/template <projeto>/video   # se ainda não existe
cd <projeto>/video && npm install
```

Depois, **duas coisas que não são opcionais**:

1. **`src/tema.ts`** — copie as cores e fontes do produto (procure `theme.css`,
   `tokens.css`, `tailwind.config`). Se o app auto-hospeda as fontes, copie os `.woff2`
   para `public/fonts/` e liste em `src/fontes.ts`. Paleta genérica denuncia o corte: a
   parte animada tem que parecer a mesma publicação que a tela fotografada.
2. **`src/Pitch.tsx`** — o roteiro. É um array de cenas; cada cena de print declara o
   caminho da câmera (`quadros`), as `legendas` e os `marcadores`.

Ordem que funciona para pitch (não é a ordem do menu do app):
promessa → problema → produto → prova → entrega → fecho.

### 4. Enquadrar

`recorte` é `{x, y, w}` em **fração da foto** — canto superior esquerdo e largura; a altura
sai da largura porque foto e vídeo são 16:9. Para achar os números: abra o PNG com a
ferramenta Read (ela informa a escala) e converta as coordenadas do que você viu.

- Mais de ~`w: 0.22` de zoom começa a amolecer o tipo, mesmo em 3x.
- **Feche o corte antes do que não deve aparecer** (badge "Inativo", card de erro, nome de
  cliente). É mais barato que editar o app.

### 5. Revisar antes de renderizar em cheio

```bash
npx remotion render Pitch out/preview.mp4 --scale=0.5 --concurrency=4 --log=error
```

E confira 12 frames de uma vez, em vez de abrir um a um:

```bash
mkdir -p out/checks && i=1
for f in 60 250 480 700 900 1000 1080 1170 1300 1550 1780 2150; do
  ffmpeg -y -loglevel error -i out/preview.mp4 -vf "select=eq(n\,$f)" -vframes 1 \
    out/checks/$(printf "%03d" $i).png; i=$((i+1))
done
cd out/checks && ffmpeg -y -loglevel error -i %03d.png -vf "scale=640:360,tile=3x4" \
  -frames:v 1 ../sheet.png
```

Abra `sheet.png` com a Read e olhe: texto cortado, legenda cobrindo marcador, faixa de
card indesejado na borda, número errado. Ao amostrar um frame **durante o fade** de um
marcador, a etiqueta some — isso é normal, não é bug.

### 6. Renderizar e entregar

```bash
npm run render   # master, CRF 16
npm run web      # versão leve pra mandar (ffmpeg, CRF 23)
```

Entregue os dois caminhos + a tabela de cenas, e diga o que ficou de fora e por quê.
Para o Gabriel ver na hora: `cmd //c start "" "<caminho do mp4>"`.

## Regras

- **Nada de número inventado.** Toda quantidade na tela sai da execução real que você
  escolheu no passo 1. Se não tiver o dado, não afirme.
- **Nada de mockup.** Se uma parte do produto for simulada, ela não entra no pitch (ou
  entra dito como simulação).
- **Dado de cliente real não entra em peça comercial** — nome, CNPJ, carteira. Deixe a
  tela fora do corte e avise o Gabriel; a decisão é de quem é dono do dado.
- **Estado de erro/pulado do ambiente de dev** (SMTP não configurado, agente pausado) não
  aparece em close. Enquadre por fora e mostre o resultado, que é o que interessa.
- **O ambiente muda debaixo do vídeo.** Registros `[TESTE]` aparecem entre uma captura e
  outra. Se refizer os prints, reconfira os enquadramentos.
- **Sem áudio por padrão.** Não há trilha licenciada; escreva as legendas para o filme
  funcionar mudo (é como ele roda numa landing page). Para pôr trilha depois:
  `<Audio src={staticFile('musica.mp3')} />` dentro do `Pitch`.
- Deixe `telas.json` e frames de conferência no **scratchpad** ou em `video/out/` — fora do
  versionamento do projeto (o template já tem `.gitignore`).
- Escrever legendas e responder em português.

## Armadilhas já pisadas

**`delayRender was called but not cleared`** no fim de um render longo. Não é o seu código:
com muitas abas em paralelo, uma requisição de fonte estoura os 28s padrão. O
`remotion.config.ts` do template já sobe o prazo para 120s. E **não** tente se proteger com
`setTimeout` — no ambiente de render o Remotion controla os timers, e ele nunca dispara.

**Fonte errada só no arquivo final.** Se não esperar as fontes, o Studio mostra certo e o
`.mp4` sai com serifa de fallback. Carregue por `loadFont` do `@remotion/fonts`
(`src/fontes.ts` do template faz isso).

**Legenda cobrindo a etiqueta do marcador.** O cartão de legenda mora no rodapé; etiqueta
`abaixo` de um marcador que fica na metade de baixo da tela cai atrás dele. Use `acima`.

## Referência

- `scripts/capturar.py` — harness de captura; o cabeçalho lista todas as ações do
  `telas.json`.
- `template/` — projeto Remotion completo (câmera, legendas, marcadores, contadores).
- `examples/telas.bussola.json` — o `telas.json` real do pitch da Bússola, com login por
  token e um diálogo aberto por cliques.
