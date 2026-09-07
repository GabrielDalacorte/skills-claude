/**
 * Peças de motion do filme — todas com a tipografia e as cores do produto.
 *
 * Regra que vale para todas: nada entra por opacidade sozinha. O movimento é
 * de papel — máscara subindo, régua crescendo, carimbo assentando. Fade puro é
 * genérico e faria a peça parecer o template que ela é.
 *
 * Se o produto NÃO for de cara editorial, troque aqui (e só aqui): o vocabulário
 * de movimento tem que ser o do design do app, senão a parte animada parece
 * colada por cima dele.
 */
import React from 'react';
import { Easing, interpolate, spring, useCurrentFrame, useVideoConfig } from 'remotion';
import { cor, eyebrow, fonte } from '../tema';

const SAIDA = Easing.bezier(0.33, 0, 0.1, 1);

/** 0 → 1 de entrada e 1 → 0 de saída, no mesmo número. */
export function janela(frame: number, entra: number, sai?: number, duracao = 14) {
  const dentro = interpolate(frame, [entra, entra + duracao], [0, 1], {
    easing: SAIDA,
    extrapolateLeft: 'clamp',
    extrapolateRight: 'clamp',
  });
  if (sai === undefined) return dentro;
  const fora = interpolate(frame, [sai, sai + 10], [1, 0], {
    extrapolateLeft: 'clamp',
    extrapolateRight: 'clamp',
  });
  return Math.min(dentro, fora);
}

/** Papel do produto — o mesmo #E7EAE1 do app. */
export const Fundo: React.FC<{ children?: React.ReactNode }> = ({ children }) => (
  <div
    style={{
      position: 'absolute',
      inset: 0,
      backgroundColor: cor.papel,
      color: cor.tinta,
      fontFamily: fonte.corpo,
    }}
  >
    {children}
  </div>
);

/** Régua horizontal que cresce da esquerda — a assinatura visual do login. */
export const Regua: React.FC<{
  entra: number;
  largura?: number | string;
  espessura?: number;
  tinta?: string;
  duracao?: number;
}> = ({ entra, largura = '100%', espessura = 3, tinta = cor.tinta, duracao = 26 }) => {
  const frame = useCurrentFrame();
  const p = interpolate(frame, [entra, entra + duracao], [0, 1], {
    easing: SAIDA,
    extrapolateLeft: 'clamp',
    extrapolateRight: 'clamp',
  });
  return (
    <div style={{ width: largura, height: espessura }}>
      <div style={{ width: `${p * 100}%`, height: espessura, backgroundColor: tinta }} />
    </div>
  );
};

/**
 * Linha de texto que sobe por trás de uma máscara. É a entrada de manchete: o
 * tipo aparece inteiro, nunca esmaecido — leitura de jornal, não de slide.
 */
export const LinhaMascarada: React.FC<{
  entra: number;
  children: React.ReactNode;
  estilo?: React.CSSProperties;
  atraso?: number;
}> = ({ entra, children, estilo, atraso = 0 }) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const s = spring({
    frame: frame - entra - atraso,
    fps,
    config: { damping: 200, mass: 0.7, stiffness: 110 },
  });
  return (
    <div style={{ overflow: 'hidden', paddingBottom: '0.12em' }}>
      <div style={{ transform: `translateY(${(1 - s) * 110}%)`, ...estilo }}>{children}</div>
    </div>
  );
};

/** Rótulo mono, caixa alta, espaçado — o eyebrow do app. */
export const Rotulo: React.FC<{
  children: React.ReactNode;
  entra: number;
  tinta?: string;
  tamanho?: number;
}> = ({ children, entra, tinta = cor.tintaFraca, tamanho = 22 }) => {
  const frame = useCurrentFrame();
  const p = janela(frame, entra, undefined, 12);
  return (
    <div
      style={{
        ...eyebrow,
        fontSize: tamanho,
        color: tinta,
        opacity: p,
        transform: `translateX(${(1 - p) * -14}px)`,
      }}
    >
      {children}
    </div>
  );
};

/**
 * Legenda de cena: cartão de papel no rodapé, com número de seção, eyebrow e
 * uma frase. É o que dá voz ao filme sem locução.
 */
export const Legenda: React.FC<{
  numero?: string;
  rotulo: string;
  texto: React.ReactNode;
  entra: number;
  sai?: number;
  lado?: 'esq' | 'dir';
  largura?: number;
}> = ({ numero, rotulo, texto, entra, sai, lado = 'esq', largura = 780 }) => {
  const frame = useCurrentFrame();
  const p = janela(frame, entra, sai, 16);
  if (p <= 0.001) return null;
  return (
    <div
      style={{
        position: 'absolute',
        bottom: 84,
        left: lado === 'esq' ? 84 : undefined,
        right: lado === 'dir' ? 84 : undefined,
        width: largura,
        opacity: p,
        transform: `translateY(${(1 - p) * 26}px)`,
      }}
    >
      <div
        style={{
          backgroundColor: cor.cartao,
          border: `1px solid ${cor.borda}`,
          borderLeft: `4px solid ${cor.tinta}`,
          boxShadow: '0 18px 48px rgba(20,26,23,0.16)',
          padding: '26px 32px 30px',
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: 14, marginBottom: 14 }}>
          {numero ? (
            <span style={{ ...eyebrow, fontSize: 20, color: cor.violeta }}>{numero}</span>
          ) : null}
          <span style={{ ...eyebrow, fontSize: 20, color: cor.tintaFraca }}>{rotulo}</span>
        </div>
        <p
          style={{
            margin: 0,
            fontFamily: fonte.titulo,
            fontSize: 42,
            lineHeight: 1.22,
            color: cor.tinta,
          }}
        >
          {texto}
        </p>
      </div>
    </div>
  );
};

/**
 * Marcador que gruda num pedaço da interface. O traço é DESENHADO (não aparece
 * pronto) porque o olho segue a ponta da caneta — é assim que a atenção chega
 * ao lugar certo antes de a legenda ser lida.
 */
export const Marcador: React.FC<{
  caixa: { left: number; top: number; width: number; height: number };
  entra: number;
  sai?: number;
  etiqueta?: string;
  tinta?: string;
  posicaoEtiqueta?: 'acima' | 'abaixo';
}> = ({ caixa, entra, sai, etiqueta, tinta = cor.azul, posicaoEtiqueta = 'acima' }) => {
  const frame = useCurrentFrame();
  const p = janela(frame, entra, sai, 18);
  if (p <= 0.001) return null;

  const folga = 12;
  const largura = caixa.width + folga * 2;
  const altura = caixa.height + folga * 2;
  const perimetro = 2 * (largura + altura);

  return (
    <div
      style={{
        position: 'absolute',
        left: caixa.left - folga,
        top: caixa.top - folga,
        width: largura,
        height: altura,
        opacity: Math.min(1, p * 1.4),
      }}
    >
      <svg width={largura} height={altura} style={{ position: 'absolute', inset: 0, overflow: 'visible' }}>
        <rect
          x={1.5}
          y={1.5}
          width={largura - 3}
          height={altura - 3}
          rx={10}
          fill={`${tinta}14`}
          stroke={tinta}
          strokeWidth={3}
          strokeDasharray={perimetro}
          strokeDashoffset={perimetro * (1 - p)}
        />
      </svg>
      {etiqueta ? (
        <div
          style={{
            position: 'absolute',
            left: 0,
            bottom: posicaoEtiqueta === 'acima' ? '100%' : undefined,
            top: posicaoEtiqueta === 'abaixo' ? '100%' : undefined,
            marginBottom: posicaoEtiqueta === 'acima' ? 12 : 0,
            marginTop: posicaoEtiqueta === 'abaixo' ? 12 : 0,
            backgroundColor: tinta,
            color: '#ffffff',
            ...eyebrow,
            fontSize: 20,
            padding: '8px 14px',
            whiteSpace: 'nowrap',
            opacity: interpolate(p, [0.55, 1], [0, 1], { extrapolateLeft: 'clamp' }),
          }}
        >
          {etiqueta}
        </div>
      ) : null}
    </div>
  );
};

/** Número que conta — mono e tabular, como toda métrica do app. */
export const Contador: React.FC<{
  ate: number;
  entra: number;
  duracao?: number;
  sufixo?: string;
  estilo?: React.CSSProperties;
}> = ({ ate, entra, duracao = 34, sufixo = '', estilo }) => {
  const frame = useCurrentFrame();
  const v = interpolate(frame, [entra, entra + duracao], [0, ate], {
    easing: SAIDA,
    extrapolateLeft: 'clamp',
    extrapolateRight: 'clamp',
  });
  return (
    <span style={{ fontFamily: fonte.mono, fontVariantNumeric: 'tabular-nums', ...estilo }}>
      {Math.round(v)}
      {sufixo}
    </span>
  );
};

/** Carimbo violeta — o violeta do produto, usado com parcimônia. */
export const Selo: React.FC<{
  children: React.ReactNode;
  entra: number;
  giro?: number;
}> = ({ children, entra, giro = -4 }) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const s = spring({
    frame: frame - entra,
    fps,
    config: { damping: 12, mass: 0.9, stiffness: 140 },
  });
  return (
    <div
      style={{
        display: 'inline-block',
        border: `3px solid ${cor.violeta}`,
        color: cor.violeta,
        ...eyebrow,
        fontSize: 26,
        padding: '14px 22px',
        transform: `rotate(${giro}deg) scale(${interpolate(s, [0, 1], [1.35, 1])})`,
        opacity: Math.min(1, s * 2),
      }}
    >
      {children}
    </div>
  );
};

/** Lampejo de papel no primeiro frame da cena: dá o corte sem piscar preto. */
export const Corte: React.FC<{ em?: number; duracao?: number }> = ({ em = 0, duracao = 5 }) => {
  const frame = useCurrentFrame();
  const p = interpolate(frame, [em, em + duracao], [1, 0], {
    extrapolateLeft: 'clamp',
    extrapolateRight: 'clamp',
  });
  if (p <= 0) return null;
  return <div style={{ position: 'absolute', inset: 0, backgroundColor: cor.papel, opacity: p }} />;
};
