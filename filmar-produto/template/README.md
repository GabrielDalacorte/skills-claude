# Vídeo-pitch

Telas reais do produto, animadas com [Remotion](https://remotion.dev). Gerado pela skill
`filmar-produto`.

```bash
npm install
npm run studio    # editor ao vivo, com timeline e scrub
npm run preview   # render em metade da escala, para conferir
npm run render    # master, CRF 16 → out/pitch.mp4
npm run web       # versão leve para mandar (precisa de ffmpeg)
```

## Antes de renderizar

1. **`src/tema.ts`** — cores e fontes do produto. Sem isso o corte entre a cena desenhada
   e o print denuncia que a animação foi colada por cima.
2. **`public/fonts/`** + **`src/fontes.ts`** — as `.woff2` do app, se ele auto-hospeda.
3. **`public/shots/`** — os PNGs em 3x do `capturar.py`.
4. **`src/Pitch.tsx`** — o roteiro: ordem, duração, câmera, marcadores e legendas.

## Onde mexer

| Arquivo | O que é |
|---|---|
| `src/Pitch.tsx` | O roteiro. É o único arquivo que muda de vídeo para vídeo. |
| `src/cenas/CenaTela.tsx` | Cena de print: câmera + marcadores + legendas, declarados. |
| `src/cenas/desenhadas.tsx` | Abertura, cena de lista e fecho — sem print. |
| `src/componentes/Tela.tsx` | A câmera sobre a foto (`recorte` em fração da imagem). |
| `src/componentes/pecas.tsx` | Legenda, marcador, contador, carimbo, régua, corte. |
| `src/tema.ts` | Cores e fontes. |

## Duas coisas que economizam um render inteiro

**Os prints são 3x de propósito.** O filme fecha em cima de um card; a 2x esse plano já
entra em upscale e borra o tipo. Zoom além de `w: 0.22` amolece mesmo em 3x.

**Confira 12 frames de uma vez** em vez de abrir um a um — `npm run preview`, depois
`ffmpeg` recortando os frames e um `tile=3x4` para virar uma folha de contato. O passo a
passo está no `SKILL.md` da skill.
