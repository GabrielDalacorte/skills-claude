/**
 * Um print do app ocupando a tela inteira, com câmera.
 *
 * O "recorte" é um retângulo em coordenadas normalizadas do print (0..1, canto
 * superior esquerdo + largura). Como print e vídeo são 16:9, a altura sai da
 * largura e não há um segundo número para errar. Uma lista de recortes vira
 * uma travelling: `[{frame: 0, ...}, {frame: 90, ...}]` interpola entre eles
 * com desaceleração — nada de zoom linear, que lê como zoom de PowerPoint.
 *
 * O filho recebe `mapear`, que converte um retângulo do print em pixels da
 * tela ATUAL da câmera. É isso que deixa um marcador grudado num botão mesmo
 * enquanto a câmera anda.
 */
import React from 'react';
import { AbsoluteFill, Easing, Img, interpolate, staticFile, useCurrentFrame } from 'remotion';

export type Recorte = { x: number; y: number; w: number };
export type Quadro = { frame: number; recorte: Recorte };
export type Caixa = { x: number; y: number; w: number; h: number };
export type Mapear = (caixa: Caixa) => {
  left: number;
  top: number;
  width: number;
  height: number;
};

const LARGURA = 1920;
const ALTURA = 1080;
const SUAVE = Easing.bezier(0.33, 0, 0.1, 1);

function interpolarRecorte(frame: number, quadros: Quadro[]): Recorte {
  if (quadros.length === 1) return quadros[0].recorte;

  // Interpola SEGMENTO A SEGMENTO: um único interpolate() sobre a lista toda
  // aplicaria a curva de easing na travessia inteira, e a câmera pararia no
  // meio de cada parada em vez de acomodar em cada uma.
  const ultimo = quadros[quadros.length - 1];
  if (frame >= ultimo.frame) return ultimo.recorte;

  for (let i = 0; i < quadros.length - 1; i++) {
    const a = quadros[i];
    const b = quadros[i + 1];
    if (frame < a.frame) return a.recorte;
    if (frame >= b.frame) continue;
    const t = (v: number, w: number) =>
      interpolate(frame, [a.frame, b.frame], [v, w], {
        easing: SUAVE,
        extrapolateLeft: 'clamp',
        extrapolateRight: 'clamp',
      });
    return {
      x: t(a.recorte.x, b.recorte.x),
      y: t(a.recorte.y, b.recorte.y),
      w: t(a.recorte.w, b.recorte.w),
    };
  }
  return ultimo.recorte;
}

export const Tela: React.FC<{
  arquivo: string;
  quadros: Quadro[];
  children?: (mapear: Mapear) => React.ReactNode;
}> = ({ arquivo, quadros, children }) => {
  const frame = useCurrentFrame();
  const recorte = interpolarRecorte(frame, quadros);

  const escala = 1 / recorte.w;
  const larguraImg = LARGURA * escala;
  const alturaImg = ALTURA * escala;

  const mapear: Mapear = (caixa) => ({
    left: (caixa.x - recorte.x) * larguraImg,
    top: (caixa.y - recorte.y) * alturaImg,
    width: caixa.w * larguraImg,
    height: caixa.h * alturaImg,
  });

  return (
    <AbsoluteFill style={{ overflow: 'hidden', backgroundColor: '#e7eae1' }}>
      <Img
        src={staticFile(`shots/${arquivo}`)}
        style={{
          position: 'absolute',
          left: -recorte.x * larguraImg,
          top: -recorte.y * alturaImg,
          width: larguraImg,
          height: alturaImg,
          // O print é 2x; o navegador ainda assim reamostra a cada zoom.
          imageRendering: 'auto',
        }}
      />
      {children ? children(mapear) : null}
    </AbsoluteFill>
  );
};

/** Recorte que mostra o print inteiro. */
export const INTEIRO: Recorte = { x: 0, y: 0, w: 1 };
