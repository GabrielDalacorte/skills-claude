/**
 * PREENCHER COM OS TOKENS DO PRODUTO.
 *
 * Não é preciosismo: o filme corta o tempo todo entre print real e tela
 * desenhada aqui. Se o fundo não for exatamente o do app, o corte denuncia — a
 * parte animada parece colada por cima do produto em vez de sair dele.
 *
 * Procure `theme.css`, `tokens.css`, `globals.css` ou `tailwind.config` no
 * front e copie os valores. Se o app auto-hospeda as fontes, copie os `.woff2`
 * para `public/fonts/` e liste em `fontes.ts`.
 */

export const cor = {
  /** Fundo das cenas desenhadas. O mesmo do corpo do app. */
  papel: '#f5f5f2',
  /** Fundo de cartão/legenda. */
  cartao: '#ffffff',
  /** Texto principal. Raramente preto puro num produto bem feito. */
  tinta: '#16181a',
  /** Texto secundário, rótulos. */
  tintaFraca: '#5a6066',
  /** Cor de ação — é a dos marcadores. */
  azul: '#0369a1',
  /** Segunda cor de destaque, para o marcador que não é o principal. */
  violeta: '#5b21b6',
  verde: '#15803d',
  ambar: '#b45309',
  borda: '#d8dad5',
  bordaForte: '#a8b0a2',
} as const;

export const fonte = {
  /** Manchetes. Serifa se o produto tiver uma; é o que dá cara editorial. */
  titulo: "Georgia, 'Times New Roman', serif",
  corpo: "system-ui, -apple-system, sans-serif",
  /** Números e rótulos técnicos. Métrica em mono lê como dado, não como arte. */
  mono: "ui-monospace, 'SF Mono', Menlo, monospace",
} as const;

/** Rótulo de eyebrow: mono, caixa alta, muito espaçado. */
export const eyebrow = {
  fontFamily: fonte.mono,
  textTransform: 'uppercase' as const,
  letterSpacing: '0.18em',
  fontWeight: 500,
};
