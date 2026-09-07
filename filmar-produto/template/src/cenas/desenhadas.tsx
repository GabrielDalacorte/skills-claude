/**
 * As cenas sem print: abertura, uma lista que se prova, e o fecho.
 *
 * Elas emolduram os prints. Se a abertura fosse genérica, o primeiro corte
 * para a tela real seria um susto; com os tokens do produto, o filme inteiro
 * parece a mesma publicação.
 *
 * Todas recebem `duracao` (em frames) e cuidam do próprio fade de saída, então
 * dá para mudar o tempo de uma cena só no roteiro, sem mexer aqui.
 */
import React from 'react';
import { interpolate, useCurrentFrame } from 'remotion';
import { cor, eyebrow, fonte } from '../tema';
import { Contador, Fundo, LinhaMascarada, Regua, Rotulo, Selo, janela } from '../componentes/pecas';

function useSaida(duracao: number, rampa = 25) {
  const frame = useCurrentFrame();
  return interpolate(frame, [duracao - rampa, duracao], [1, 0], {
    extrapolateLeft: 'clamp',
    extrapolateRight: 'clamp',
  });
}

/* ------------------------------------------------------------------ */
/* Abertura — mínimo 150 frames                                        */
/* ------------------------------------------------------------------ */

export const Abertura: React.FC<{
  duracao: number;
  /** Quem assina. Ex.: "AFL Consultores". */
  rotulo: string;
  /** O nome do produto. Uma linha só; é a manchete. */
  titulo: string;
  /** O que ele faz, em uma frase que caiba em duas linhas. */
  subtitulo: string;
  /** Canto direito, opcional: ["Plataforma", "clipping diário"]. */
  marca?: [string, string];
}> = ({ duracao, rotulo, titulo, subtitulo, marca }) => {
  const frame = useCurrentFrame();
  return (
    <Fundo>
      <div
        style={{
          position: 'absolute',
          inset: '0 150px',
          display: 'flex',
          flexDirection: 'column',
          justifyContent: 'center',
          opacity: useSaida(duracao),
        }}
      >
        <Rotulo entra={6} tamanho={24}>
          {rotulo}
        </Rotulo>
        <div style={{ height: 22 }} />
        <LinhaMascarada
          entra={14}
          estilo={{
            fontFamily: fonte.titulo,
            fontSize: 152,
            fontWeight: 700,
            lineHeight: 1.02,
            letterSpacing: '-0.015em',
          }}
        >
          {titulo}
        </LinhaMascarada>
        <div style={{ height: 30 }} />
        <Regua entra={34} espessura={4} />
        <div style={{ height: 30 }} />
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end' }}>
          <LinhaMascarada
            entra={44}
            estilo={{
              fontFamily: fonte.titulo,
              fontSize: 46,
              lineHeight: 1.28,
              maxWidth: 1160,
              color: cor.tinta,
            }}
          >
            {subtitulo}
          </LinhaMascarada>
          {marca ? (
            <div style={{ opacity: janela(frame, 70, undefined, 20), textAlign: 'right' }}>
              <div style={{ ...eyebrow, fontSize: 20, color: cor.tintaFraca }}>{marca[0]}</div>
              <div style={{ fontFamily: fonte.mono, fontSize: 30, color: cor.violeta, marginTop: 8 }}>
                {marca[1]}
              </div>
            </div>
          ) : null}
        </div>
      </div>
    </Fundo>
  );
};

/* ------------------------------------------------------------------ */
/* CenaLista — a manchete e a prova, lado a lado. Mínimo 220 frames.   */
/* ------------------------------------------------------------------ */

/**
 * Serve para a cena do problema ("todo dia N fontes publicam algo que…"): a
 * manchete afirma, e a lista entrando linha a linha prova. Cabem ~17 itens.
 */
export const CenaLista: React.FC<{
  duracao: number;
  rotulo: string;
  /** Uma string por linha — quebra você, não o navegador. */
  manchete: string[];
  texto: string;
  tituloCartao: string;
  /** [nome, etiqueta]. A etiqueta é o detalhe técnico (modo, tipo, status). */
  itens: [string, string][];
}> = ({ duracao, rotulo, manchete, texto, tituloCartao, itens }) => {
  const frame = useCurrentFrame();
  return (
    <Fundo>
      <div
        style={{
          position: 'absolute',
          inset: '96px 120px',
          display: 'grid',
          gridTemplateColumns: '1fr 640px',
          gap: 70,
          alignItems: 'start',
          opacity: useSaida(duracao),
        }}
      >
        <div style={{ paddingTop: 40 }}>
          <Rotulo entra={4} tamanho={22}>
            {rotulo}
          </Rotulo>
          <div style={{ height: 28 }} />
          {manchete.map((linha, i) => (
            <LinhaMascarada
              key={linha}
              entra={12}
              atraso={i * 7}
              estilo={{
                fontFamily: fonte.titulo,
                fontSize: 74,
                fontWeight: 700,
                lineHeight: 1.12,
                letterSpacing: '-0.01em',
              }}
            >
              {linha}
            </LinhaMascarada>
          ))}
          <div style={{ height: 46 }} />
          <div style={{ opacity: janela(frame, 118, undefined, 18), maxWidth: 720 }}>
            <Regua entra={112} espessura={2} tinta={cor.bordaForte} duracao={20} />
            <p
              style={{
                fontFamily: fonte.corpo,
                fontSize: 31,
                lineHeight: 1.45,
                color: cor.tintaFraca,
                marginTop: 24,
              }}
            >
              {texto}
            </p>
          </div>
        </div>

        <div
          style={{
            backgroundColor: cor.cartao,
            border: `1px solid ${cor.borda}`,
            padding: '26px 30px 28px',
            opacity: janela(frame, 18, undefined, 14),
          }}
        >
          <div
            style={{
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'baseline',
              borderBottom: `2px solid ${cor.tinta}`,
              paddingBottom: 14,
              marginBottom: 6,
            }}
          >
            <span style={{ ...eyebrow, fontSize: 19, color: cor.tintaFraca }}>{tituloCartao}</span>
            <span style={{ fontFamily: fonte.mono, fontSize: 30, color: cor.tinta }}>
              <Contador ate={itens.length} entra={26} duracao={itens.length * 6} />
            </span>
          </div>
          {itens.map(([nome, etiqueta], i) => {
            const p = janela(frame, 28 + i * 6, undefined, 9);
            return (
              <div
                key={nome}
                style={{
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'baseline',
                  gap: 20,
                  padding: '5px 0',
                  borderBottom: `1px solid ${cor.borda}`,
                  opacity: p,
                  transform: `translateX(${(1 - p) * 22}px)`,
                }}
              >
                <span style={{ fontFamily: fonte.corpo, fontSize: 24, color: cor.tinta }}>{nome}</span>
                <span style={{ fontFamily: fonte.mono, fontSize: 19, color: cor.tintaFraca }}>
                  {etiqueta}
                </span>
              </div>
            );
          })}
        </div>
      </div>
    </Fundo>
  );
};

/* ------------------------------------------------------------------ */
/* Fecho — mínimo 260 frames                                           */
/* ------------------------------------------------------------------ */

export const Fecho: React.FC<{
  duracao: number;
  rotulo: string;
  /** Uma string por linha. É a frase que a pessoa repete depois. */
  manchete: string[];
  /** Os números da execução real. `ate` conta; `texto` entra pronto. */
  numeros: { ate?: number; texto?: string; rotulo: string }[];
  /** Carimbo, ex.: "US$ 0,40 por edição". */
  selo?: string;
  /** A letra miúda ao lado do carimbo — de onde vem o número. */
  notaSelo?: string;
  rodape?: [string, string];
}> = ({ duracao, rotulo, manchete, numeros, selo, notaSelo, rodape }) => {
  const frame = useCurrentFrame();
  return (
    <Fundo>
      <div
        style={{
          position: 'absolute',
          inset: '0 150px',
          display: 'flex',
          flexDirection: 'column',
          justifyContent: 'center',
          opacity: useSaida(duracao, 35),
        }}
      >
        <Rotulo entra={6} tamanho={22}>
          {rotulo}
        </Rotulo>
        <div style={{ height: 26 }} />
        {manchete.map((linha, i) => (
          <LinhaMascarada
            key={linha}
            entra={14}
            atraso={i * 8}
            estilo={{
              fontFamily: fonte.titulo,
              fontSize: 106,
              fontWeight: 700,
              lineHeight: 1.06,
              letterSpacing: '-0.015em',
            }}
          >
            {linha}
          </LinhaMascarada>
        ))}
        <div style={{ height: 44 }} />
        <Regua entra={70} espessura={3} />
        <div style={{ height: 40 }} />

        <div style={{ display: 'flex', gap: 70 }}>
          {numeros.map((n, i) => (
            <div key={n.rotulo} style={{ opacity: janela(frame, 92 + i * 8, undefined, 14) }}>
              <div
                style={{
                  fontFamily: fonte.mono,
                  fontSize: 62,
                  fontVariantNumeric: 'tabular-nums',
                  color: cor.tinta,
                }}
              >
                {n.ate !== undefined ? (
                  <Contador ate={n.ate} entra={96 + i * 8} duracao={28} />
                ) : (
                  n.texto
                )}
              </div>
              <div style={{ ...eyebrow, fontSize: 19, color: cor.tintaFraca, marginTop: 10 }}>
                {n.rotulo}
              </div>
            </div>
          ))}
        </div>

        {selo ? (
          <>
            <div style={{ height: 56 }} />
            <div style={{ display: 'flex', alignItems: 'center', gap: 34 }}>
              <Selo entra={150}>{selo}</Selo>
              {notaSelo ? (
                <span
                  style={{
                    fontFamily: fonte.mono,
                    fontSize: 24,
                    color: cor.tintaFraca,
                    opacity: janela(frame, 162, undefined, 16),
                  }}
                >
                  {notaSelo}
                </span>
              ) : null}
            </div>
          </>
        ) : null}

        {rodape ? (
          <div
            style={{
              position: 'absolute',
              bottom: -10,
              left: 0,
              right: 0,
              display: 'flex',
              justifyContent: 'space-between',
              opacity: janela(frame, 190, undefined, 18),
            }}
          >
            <span style={{ ...eyebrow, fontSize: 21, color: cor.tinta }}>{rodape[0]}</span>
            <span style={{ fontFamily: fonte.mono, fontSize: 21, color: cor.violeta }}>
              {rodape[1]}
            </span>
          </div>
        ) : null}
      </div>
    </Fundo>
  );
};
