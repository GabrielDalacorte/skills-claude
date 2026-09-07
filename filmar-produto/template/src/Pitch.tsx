/**
 * O ROTEIRO. É aqui que se monta o filme.
 *
 * A ordem é a de um pitch, não a do menu do app:
 *   promessa → problema → produto → prova → entrega → fecho
 *
 * Cada cena de print declara o caminho da câmera (`quadros`), o que ela
 * circula (`marcadores`) e o que a legenda diz (`legendas`). `recorte` é
 * {x, y, w} em FRAÇÃO da foto — canto superior esquerdo e largura; a altura sai
 * da largura porque foto e vídeo são 16:9. Zoom além de ~w:0.22 amolece o tipo,
 * mesmo com print em 3x.
 *
 * Tempos em frames, a 30fps. `duracao` chega em cada cena para ela cuidar do
 * próprio fade de saída.
 */
import React from 'react';
import { AbsoluteFill, Sequence } from 'remotion';
import { cor } from './tema';
import { carregarFontes } from './fontes';
import { Abertura, CenaLista, Fecho } from './cenas/desenhadas';
// import { CenaTela } from './cenas/CenaTela';

carregarFontes();

type Cena = {
  nome: string;
  duracao: number;
  render: (duracao: number) => React.ReactNode;
};

const ROTEIRO: Cena[] = [
  {
    nome: 'Abertura',
    duracao: 165,
    render: (duracao) => (
      <Abertura
        duracao={duracao}
        rotulo="Nome da empresa"
        titulo="Nome do Produto"
        subtitulo="A frase que diz o que ele faz, em duas linhas no máximo, sem adjetivo de venda."
        marca={['Plataforma', 'categoria']}
      />
    ),
  },
  {
    nome: 'Problema',
    duracao: 240,
    render: (duracao) => (
      <CenaLista
        duracao={duracao}
        rotulo="O expediente começa assim"
        manchete={['Uma manchete curta', 'quebrada em linhas', 'por você, não pelo browser.']}
        texto="O parágrafo de apoio: o detalhe concreto que sustenta a manchete. Números daqui saem do produto, nunca da imaginação."
        tituloCartao="A prova"
        itens={[
          ['Primeiro item real', 'tipo'],
          ['Segundo item real', 'tipo'],
          ['Terceiro item real', 'tipo'],
        ]}
      />
    ),
  },

  /*
   * As cenas de print entram aqui, depois de rodar o capturar.py. Modelo real
   * (era a cena de lista do pitch da Bússola): a câmera abre no plano geral,
   * fecha numa linha da tabela, e dois marcadores explicam a linha.
   *
   * {
   *   nome: 'Agentes',
   *   duracao: 240,
   *   render: () => (
   *     <CenaTela
   *       arquivo="02-agentes.png"
   *       quadros={[
   *         { frame: 0, recorte: { x: 0.06, y: 0.055, w: 0.65 } },
   *         { frame: 96, recorte: { x: 0.17, y: 0.215, w: 0.48 } },
   *         { frame: 240, recorte: { x: 0.176, y: 0.222, w: 0.465 } },
   *       ]}
   *       marcadores={[
   *         { caixa: { x: 0.204, y: 0.357, w: 0.042, h: 0.037 },
   *           entra: 104, sai: 206, etiqueta: '06:00, de segunda a sexta' },
   *         { caixa: { x: 0.392, y: 0.379, w: 0.057, h: 0.022 },
   *           entra: 136, sai: 206, etiqueta: 'o conjunto de fontes do agente',
   *           posicaoEtiqueta: 'abaixo', tinta: cor.violeta },
   *       ]}
   *       legendas={[
   *         { numero: '02', rotulo: 'Agentes', entra: 22, sai: 212,
   *           texto: 'Cada agente vigia um conjunto de fontes e entrega no horário combinado.' },
   *       ]}
   *     />
   *   ),
   * },
   */

  {
    nome: 'Fecho',
    duracao: 285,
    render: (duracao) => (
      <Fecho
        duracao={duracao}
        rotulo="Nome do Produto"
        manchete={['A frase que a pessoa', 'repete depois.']}
        numeros={[
          { ate: 17, rotulo: 'do que entra' },
          { ate: 259, rotulo: 'do que é lido' },
          { ate: 50, rotulo: 'do que sai' },
          { texto: '1 PDF', rotulo: 'no e-mail, às 06:00' },
        ]}
        selo="US$ 0,40 por edição"
        notaSelo="custo medido de uma execução real"
        rodape={['Nome da empresa', 'nome do produto']}
      />
    ),
  },
];

export const DURACAO_TOTAL = ROTEIRO.reduce((soma, cena) => soma + cena.duracao, 0);

export const Pitch: React.FC = () => {
  let cursor = 0;
  return (
    <AbsoluteFill style={{ backgroundColor: cor.papel }}>
      {ROTEIRO.map(({ nome, duracao, render }) => {
        const de = cursor;
        cursor += duracao;
        return (
          <Sequence key={nome} name={nome} from={de} durationInFrames={duracao}>
            {render(duracao)}
          </Sequence>
        );
      })}
    </AbsoluteFill>
  );
};
