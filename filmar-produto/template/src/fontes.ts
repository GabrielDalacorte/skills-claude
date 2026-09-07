/**
 * Fontes auto-hospedadas do produto — as mesmas .woff2 que o app serve.
 *
 * Copie os arquivos para `public/fonts/` e liste em FACES. Com a lista vazia o
 * vídeo usa os fallbacks de `tema.ts`, que serve para começar mas não para
 * entregar: se o produto tem tipografia própria, o corte entre a cena
 * desenhada e o print fica evidente.
 *
 * Quem espera é o `loadFont` do @remotion/fonts, e não um `delayRender` nosso
 * em volta de `FontFace.load()`. Motivo apurado na marra: no ambiente de
 * render o Remotion controla os timers para o vídeo ser determinístico, então
 * um `setTimeout` de segurança nunca dispara — quando um carregamento
 * pendurava, o render inteiro morria em "delayRender was called but not
 * cleared". O loadFont resolve o ciclo de vida por dentro.
 *
 * Sem esperar as fontes, o Studio mostra certo e só o .mp4 sai com serifa de
 * fallback — o tipo de erro que aparece depois de vinte minutos de render.
 */
import { loadFont } from '@remotion/fonts';
import { staticFile } from 'remotion';

const FACES: { familia: string; arquivo: string; peso: string }[] = [
  // { familia: 'Alegreya', arquivo: 'alegreya-latin.woff2', peso: '700' },
  // { familia: 'Source Sans 3', arquivo: 'source-sans-3-latin.woff2', peso: '400' },
  // { familia: 'JetBrains Mono', arquivo: 'jetbrains-mono-latin.woff2', peso: '400' },
];

let carregando: Promise<unknown> | null = null;

export function carregarFontes() {
  if (!carregando) {
    carregando = Promise.all(
      FACES.map(({ familia, arquivo, peso }) =>
        loadFont({
          family: familia,
          url: staticFile(`fonts/${arquivo}`),
          weight: peso,
          display: 'swap',
        }),
      ),
    );
  }
  return carregando;
}
