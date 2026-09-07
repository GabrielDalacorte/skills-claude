r"""
Borra faixas de uma captura — nome de cliente, CNPJ, e-mail, valor.

    <python> mascarar.py tela.png tela-mascarada.png \
        --faixa 530,505,1330,1240 --faixa 2170,505,2575,1240 --sonda 1500

Por que existe: o documento pode ser mostrado A UM cliente, e a tela real
costuma exibir a carteira inteira. A imagem está ali para provar que a tela
existe e como ela se lê — para isso a estrutura basta, o dado não.

O borrão come os fios entre as linhas da tabela, e sem eles a faixa vira um
retângulo sujo no meio dela: parece defeito de captura, não decisão. Com
`--sonda` os fios são detectados numa coluna vazia da PRÓPRIA imagem (fora das
faixas: só fio e fundo) e recolados por cima do borrão, intactos.

Sempre declare o borrão na legenda da figura ("nomes borrados de propósito").
Borrão sem explicação lê como erro.

As coordenadas são em pixels da imagem original (que costuma ser 2x ou 3x o
tamanho da tela): abra o PNG e leia as posições ali, não no navegador.
"""

from __future__ import annotations

import argparse
import sys
from pathlib import Path

try:
    from PIL import Image, ImageFilter
except ImportError:  # pragma: no cover
    print("falta o Pillow: pip install --index-url https://pypi.org/simple/ pillow")
    raise


def faixa(texto: str) -> tuple[int, int, int, int]:
    partes = [int(n) for n in texto.split(",")]
    if len(partes) != 4:
        raise argparse.ArgumentTypeError("faixa = x0,y0,x1,y1")
    return tuple(partes)  # type: ignore[return-value]


def main(argv: list[str]) -> int:
    ap = argparse.ArgumentParser(description="Borra faixas de uma captura.")
    ap.add_argument("entrada", type=Path)
    ap.add_argument("saida", type=Path)
    ap.add_argument(
        "--faixa", type=faixa, action="append", required=True,
        help="x0,y0,x1,y1 em pixels da imagem; pode repetir",
    )
    ap.add_argument("--raio", type=int, default=9, help="força do borrão (default 9)")
    ap.add_argument(
        "--sonda", type=int, default=None,
        help="coluna vazia (só fio e fundo) para devolver os fios da tabela",
    )
    args = ap.parse_args(argv[1:])

    original = Image.open(args.entrada).convert("RGB")
    im = original.copy()
    for caixa in args.faixa:
        im.paste(im.crop(caixa).filter(ImageFilter.GaussianBlur(args.raio)), caixa)

    fios = 0
    if args.sonda is not None:
        topo = min(f[1] for f in args.faixa)
        base = max(f[3] for f in args.faixa)
        px = original.load()
        # O fundo é lido alguns pixels abaixo do topo para não cair justamente
        # sobre um fio; um pixel bem mais escuro que ele é fio.
        fundo = sum(px[args.sonda, min(topo + 6, base - 1)])
        linhas = [y for y in range(topo, base) if sum(px[args.sonda, y]) < fundo - 30]
        for y in linhas:
            for x0, _, x1, _ in args.faixa:
                im.paste(original.crop((x0, y, x1, y + 1)), (x0, y))
        fios = len(linhas)

    args.saida.parent.mkdir(parents=True, exist_ok=True)
    im.save(args.saida)
    print(f"{args.saida}  ({len(args.faixa)} faixa(s), {fios} fio(s) devolvido(s))")
    return 0


if __name__ == "__main__":
    sys.exit(main(sys.argv))
