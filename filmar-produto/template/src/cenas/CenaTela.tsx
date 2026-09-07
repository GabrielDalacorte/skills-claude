/**
 * Uma cena feita de print real: câmera + marcadores + legendas, declarados.
 *
 * A cena não tem código próprio de propósito. O que muda de um plano para o
 * outro é só dado — para onde a câmera vai, o que ela circula e o que a
 * legenda diz —, então o roteiro inteiro cabe em `Pitch.tsx` e ninguém precisa
 * abrir um componente por cena para mudar um tempo.
 */
import React from 'react';
import { AbsoluteFill } from 'remotion';
import { Corte, Legenda, Marcador } from '../componentes/pecas';
import { Caixa, Quadro, Tela } from '../componentes/Tela';

/** Um marcador grudado num pedaço da interface. `caixa` é fração do print. */
export type Marca = {
  caixa: Caixa;
  entra: number;
  sai?: number;
  etiqueta?: string;
  tinta?: string;
  posicaoEtiqueta?: 'acima' | 'abaixo';
};

/** Uma legenda no rodapé. Sem locução, é ela que dá voz ao filme. */
export type Fala = {
  numero?: string;
  rotulo: string;
  texto: React.ReactNode;
  entra: number;
  sai?: number;
  lado?: 'esq' | 'dir';
  largura?: number;
};

export const CenaTela: React.FC<{
  arquivo: string;
  quadros: Quadro[];
  marcadores?: Marca[];
  legendas?: Fala[];
}> = ({ arquivo, quadros, marcadores = [], legendas = [] }) => (
  <AbsoluteFill>
    <Tela arquivo={arquivo} quadros={quadros}>
      {(mapear) =>
        marcadores.map((m, i) => (
          <Marcador
            key={i}
            caixa={mapear(m.caixa)}
            entra={m.entra}
            sai={m.sai}
            etiqueta={m.etiqueta}
            tinta={m.tinta}
            posicaoEtiqueta={m.posicaoEtiqueta}
          />
        ))
      }
    </Tela>
    {legendas.map((l, i) => (
      <Legenda key={i} {...l} />
    ))}
    <Corte />
  </AbsoluteFill>
);
