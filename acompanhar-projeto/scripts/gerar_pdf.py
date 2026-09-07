r"""
Monta um documento de acompanhamento em PDF a partir de um documento.json.

    <python> gerar_pdf.py documento.json [pasta-das-imagens]

A marca do documento é o PRODUTO, não quem o escreveu: nenhum logo, nenhuma
cor de agência. O que dá identidade é a tipografia editorial (serifa, filete
duplo, versaletes) e a paleta do próprio produto, que vem no JSON. Assim o
documento parece ter saído de dentro do sistema que ele descreve.

Imprime pelo Chrome (Playwright), então o layout é 100% CSS e a paginação é a
do navegador — nada de Word.

FORMATO DO documento.json
-------------------------
{
  "produto": "Bússola Tributária",          // a manchete do cabeçalho
  "assinatura": "AFL Consultores",          // quem assina (topo e rodapé)
  "tipo": "Documento de acompanhamento",    // canto direito do cabeçalho
  "subtitulo": "Onde estamos e o que vem a seguir",
  "data": "4 de setembro de 2026",          // default: hoje, em português
  "abertura": "Parágrafo de abertura, com **negrito** onde importa.",
  "tokens": { "papel": "#f4f5f0", "tinta": "#141a17" },   // opcional, ver PADRAO
  "fontes": { "titulo": "Georgia, serif" },               // opcional
  "fontesArquivos": [                                     // opcional: .woff2 do produto
    { "familia": "Alegreya", "arquivo": "D:/.../alegreya.woff2", "peso": "700" }
  ],
  "partes": [
    { "titulo": "Hoje temos",
      "respiro": false,                     // true = mais ar antes do título
      "blocos": [ ... ],                    // opcional, antes dos itens
      "itens": [
        { "num": "01", "titulo": "A porta de entrada",
          "quebra": false,                  // true = começa em página nova
          "blocos": [ ... ] }
      ] }
  ],
  "rodape": "Uma linha sobre como o documento foi feito.",
  "saida": "D:/.../nome-do-documento.pdf"
}

BLOCOS (uma chave por bloco, na ordem em que você escreveu)
-----------------------------------------------------------
{"p": "parágrafo com **negrito**, _itálico_ e `mono`"}
{"bullets": ["item", "outro item"]}
{"figura": {"img": "01-login.png", "legenda": "O que olhar aqui.",
            "largura": 82,                  // % da coluna — é decisão de PAGINAÇÃO
            "retrato": false}}              // true = imagem em pé (PDF, celular)
{"boxe": {"rotulo": "Limitação de hoje", "tipo": "alerta", "texto": "..."}}
                                            // tipo: info (default) | alerta | ok
{"tabela": {"cabecalho": ["O que falta", "Situação"],
            "linhas": [["Abrir o link", "planejado"]],
            "estreita": true,               // não estica até a margem
            "numericas": [1]}}              // colunas alinhadas à direita
{"quebra": true}                            // quebra de página solta
"""

from __future__ import annotations

import base64
import json
import sys
from datetime import date
from pathlib import Path
from typing import Any

MESES = [
    "janeiro", "fevereiro", "março", "abril", "maio", "junho",
    "julho", "agosto", "setembro", "outubro", "novembro", "dezembro",
]

# Papel de ofício claro e tinta com viés verde: a direção editorial do modelo.
# Qualquer produto pode sobrescrever pelo "tokens" do JSON.
PADRAO = {
    "papel": "#f4f5f0",
    "realce": "#e7eae1",
    "tinta": "#141a17",
    "tinta2": "#454f49",
    "tinta3": "#6b746e",
    "filete": "#c5cbbe",
    "forte": "#141a17",
    "alerta": "#b45309",
    "ok": "#15803d",
}

FONTES_PADRAO = {
    "titulo": 'Georgia, "Times New Roman", serif',
    "corpo": 'Georgia, "Times New Roman", serif',
    "mono": 'Consolas, Menlo, monospace',
}


def esc(texto: Any) -> str:
    return (
        str("" if texto is None else texto)
        .replace("&", "&amp;")
        .replace("<", "&lt;")
        .replace(">", "&gt;")
    )


def rico(texto: Any) -> str:
    """**negrito**, _itálico_ e `mono` no meio do texto."""
    import re

    saida = esc(texto)
    saida = re.sub(r"\*\*(.+?)\*\*", r"<strong>\1</strong>", saida)
    saida = re.sub(r"(?<!\w)_(.+?)_(?!\w)", r"<em>\1</em>", saida)
    saida = re.sub(r"`(.+?)`", r'<code class="mono">\1</code>', saida)
    return saida


def data_uri(caminho: Path) -> str | None:
    if not caminho.exists():
        print(f"  ! imagem não encontrada: {caminho}")
        return None
    ext = caminho.suffix.lstrip(".").lower()
    mime = "image/jpeg" if ext in ("jpg", "jpeg") else f"image/{ext}"
    return f"data:{mime};base64," + base64.b64encode(caminho.read_bytes()).decode()


def css(tokens: dict[str, str], fontes: dict[str, str], faces: str) -> str:
    vars_css = "".join(f"--{k}:{v};" for k, v in tokens.items())
    return f"""
{faces}
:root{{{vars_css}}}
@page{{size:A4}}
*{{box-sizing:border-box}}
body{{margin:0;background:var(--papel);color:var(--tinta);
     font-family:{fontes['corpo']};font-size:11px;line-height:1.5}}
.mono{{font-family:{fontes['mono']}}}
code.mono{{font-size:.92em}}

.masthead{{margin-bottom:6mm}}
.servico{{display:flex;justify-content:space-between;font-size:8px;
         letter-spacing:1.5px;text-transform:uppercase;color:var(--tinta3);padding-bottom:3px}}
h1.marca{{margin:0;font-family:{fontes['titulo']};font-size:40px;font-weight:700;
         letter-spacing:-.5px;line-height:1}}
.r1{{height:3px;background:var(--forte);margin-top:4mm}}
.r2{{height:1px;background:var(--forte);opacity:.55;margin-top:2px}}
.datalinha{{display:flex;justify-content:space-between;padding-top:4px;
           font-size:8.5px;letter-spacing:.6px;color:var(--tinta2)}}

.abertura{{font-size:12.5px;line-height:1.55;max-width:150mm;margin:0 0 6mm}}

h2.parte{{margin:8mm 0 4mm;font-family:{fontes['titulo']};font-size:13px;font-weight:700;
         letter-spacing:2px;text-transform:uppercase;border-bottom:2px solid var(--forte);
         padding-bottom:3px;page-break-after:avoid}}
h2.parte.respiro{{margin-top:14mm}}
h3.item{{margin:6mm 0 1.5mm;font-family:{fontes['titulo']};font-size:15px;font-weight:700;
        line-height:1.2;page-break-after:avoid}}
/* O título não pode ficar sozinho no pé da página, e o texto dele também não:
   a corrente título -> lide -> figura viaja junta. */
h3.item + p{{page-break-after:avoid}}
h3.item .num{{font-family:{fontes['mono']};font-size:11px;color:var(--tinta3);margin-right:6px}}
p{{margin:0 0 2.5mm;max-width:165mm;orphans:2;widows:2}}

/* A largura da imagem é decisão de PAGINAÇÃO, não de estética: a 100% da
   coluna (178mm) uma captura 16:9 fica com ~111mm de altura, o item passa de
   140mm e só cabe UM por página — sobra um quarto de folha em branco no pé.
   A 82% ela cai para ~91mm, o item fecha em ~121mm e dois itens dividem a
   página. Meça no PDF, não no navegador. */
figure{{margin:3mm 0 6mm;page-break-inside:avoid}}
figure img{{margin:0 auto;display:block;border:1px solid var(--filete)}}
.legenda{{font-size:9px;color:var(--tinta3);margin:1.5mm 0 0;font-style:italic;text-align:center}}

.boxe{{background:var(--realce);border-left:3px solid var(--forte);padding:3mm 4mm;
      margin:3mm 0 5mm;page-break-inside:avoid}}
.boxe .rot{{font-family:{fontes['mono']};font-size:8px;letter-spacing:1.4px;
           text-transform:uppercase;color:var(--tinta3);margin-bottom:1.5mm}}
.boxe.alerta{{border-left-color:var(--alerta)}}
.boxe.ok{{border-left-color:var(--ok)}}
.boxe p:last-child{{margin-bottom:0}}

table{{width:100%;border-collapse:collapse;margin:2mm 0 4mm;font-size:10px;
      page-break-inside:avoid}}
th{{text-align:left;font-size:8px;letter-spacing:1px;text-transform:uppercase;
   color:var(--tinta3);border-bottom:1px solid var(--forte);padding:1.5mm 2mm 1.2mm 0}}
td{{padding:1.5mm 2mm 1.5mm 0;border-bottom:.5pt solid var(--filete);vertical-align:top}}
td.num,th.num{{text-align:right;font-variant-numeric:tabular-nums;white-space:nowrap}}
table.estreita{{max-width:110mm}}

ul{{margin:0 0 3mm;padding-left:5mm}}
li{{margin-bottom:1.5mm}}
.quebra{{page-break-before:always}}
.rodape{{margin-top:8mm;border-top:1px solid var(--forte);padding-top:2mm;
        font-size:8.5px;color:var(--tinta3)}}
"""


def faces_css(fontes_arquivos: list[dict[str, str]]) -> str:
    """Embute as .woff2 do produto, se o JSON apontar para elas.

    Fonte que não existe nesta máquina é ignorada em silêncio: o documento cai
    na serifa de sistema e a paginação continua a mesma, em vez de quebrar.
    """
    partes = []
    for face in fontes_arquivos:
        caminho = Path(face["arquivo"])
        if not caminho.exists():
            print(f"  ! fonte não encontrada, usando fallback: {caminho}")
            continue
        b64 = base64.b64encode(caminho.read_bytes()).decode()
        partes.append(
            f"@font-face{{font-family:'{face['familia']}';"
            f"font-weight:{face.get('peso', '400')};font-style:normal;font-display:block;"
            f"src:url(data:font/woff2;base64,{b64}) format('woff2')}}"
        )
    return "\n".join(partes)


def bloco_html(bloco: dict[str, Any], imgdir: Path) -> str:
    if "p" in bloco:
        return f'<p>{rico(bloco["p"])}</p>'

    if "bullets" in bloco:
        itens = "".join(f"<li>{rico(b)}</li>" for b in bloco["bullets"])
        return f"<ul>{itens}</ul>"

    if "figura" in bloco:
        fig = bloco["figura"]
        uri = data_uri(imgdir / fig["img"] if not Path(fig["img"]).is_absolute() else Path(fig["img"]))
        if not uri:
            return ""
        # Retrato (um PDF, uma tela de celular) já é alto: a mesma largura da
        # paisagem estouraria a página inteira.
        largura = fig.get("largura", 68 if fig.get("retrato") else 82)
        legenda = (
            f'<figcaption class="legenda">{rico(fig["legenda"])}</figcaption>'
            if fig.get("legenda")
            else ""
        )
        return (
            f'<figure><img src="{uri}" alt="" style="width:{largura}%">{legenda}</figure>'
        )

    if "boxe" in bloco:
        boxe = bloco["boxe"]
        tipo = boxe.get("tipo", "info")
        rot = f'<div class="rot">{esc(boxe["rotulo"])}</div>' if boxe.get("rotulo") else ""
        corpo = "".join(f"<p>{rico(t)}</p>" for t in _lista(boxe.get("texto")))
        return f'<div class="boxe {tipo}">{rot}{corpo}</div>'

    if "tabela" in bloco:
        tab = bloco["tabela"]
        numericas = set(tab.get("numericas", []))
        # As classes saem montadas ANTES do f-string: aspas e barras dentro de
        # f-string só valem do Python 3.12 em diante, e esta skill roda no venv
        # de qualquer projeto.
        def cel(tag: str, i: int, conteudo: str) -> str:
            classe = ' class="num"' if i in numericas else ""
            return "<" + tag + classe + ">" + conteudo + "</" + tag + ">"

        classe_tab = ' class="estreita"' if tab.get("estreita") else ""
        cabecalho = ""
        if tab.get("cabecalho"):
            celulas = "".join(
                cel("th", i, esc(c)) for i, c in enumerate(tab["cabecalho"])
            )
            cabecalho = f"<thead><tr>{celulas}</tr></thead>"
        corpo = "".join(
            "<tr>" + "".join(cel("td", i, rico(c)) for i, c in enumerate(linha)) + "</tr>"
            for linha in tab.get("linhas", [])
        )
        return f"<table{classe_tab}>{cabecalho}<tbody>{corpo}</tbody></table>"

    if "quebra" in bloco:
        return '<div class="quebra"></div>'

    raise ValueError(f"bloco desconhecido: {bloco}")


def _lista(valor: Any) -> list[Any]:
    if valor is None:
        return []
    return valor if isinstance(valor, list) else [valor]


def montar_html(spec: dict[str, Any], imgdir: Path) -> str:
    tokens = {**PADRAO, **spec.get("tokens", {})}
    fontes = {**FONTES_PADRAO, **spec.get("fontes", {})}
    faces = faces_css(spec.get("fontesArquivos", []))

    hoje = date.today()
    data = spec.get("data") or f"{hoje.day} de {MESES[hoje.month - 1]} de {hoje.year}"

    corpo = []
    for parte in spec.get("partes", []):
        respiro = " respiro" if parte.get("respiro") else ""
        if parte.get("quebra"):
            corpo.append('<div class="quebra"></div>')
        if parte.get("titulo"):
            corpo.append(f'<h2 class="parte{respiro}">{esc(parte["titulo"])}</h2>')
        for bloco in parte.get("blocos", []):
            corpo.append(bloco_html(bloco, imgdir))
        for item in parte.get("itens", []):
            if item.get("quebra"):
                corpo.append('<div class="quebra"></div>')
            num = f'<span class="num">{esc(item["num"])}</span>' if item.get("num") else ""
            corpo.append(f'<h3 class="item">{num}{esc(item["titulo"])}</h3>')
            for bloco in item.get("blocos", []):
                corpo.append(bloco_html(bloco, imgdir))

    rodape = (
        f'<div class="rodape">{rico(spec["rodape"])}</div>' if spec.get("rodape") else ""
    )
    abertura = (
        f'<p class="abertura">{rico(spec["abertura"])}</p>' if spec.get("abertura") else ""
    )

    return f"""<!doctype html><html lang="pt-BR"><head><meta charset="utf-8">
<title>{esc(spec['produto'])} — {esc(spec.get('subtitulo', ''))}</title>
<style>{css(tokens, fontes, faces)}</style></head><body>

<header class="masthead">
  <div class="servico"><span>{esc(spec.get('assinatura', ''))}</span>
    <span>{esc(spec.get('tipo', 'Documento de acompanhamento'))}</span></div>
  <h1 class="marca">{esc(spec['produto'])}</h1>
  <div class="r1"></div><div class="r2"></div>
  <div class="datalinha"><span>{esc(spec.get('subtitulo', ''))}</span>
    <span class="mono">{esc(data)}</span></div>
</header>

{abertura}
{''.join(corpo)}
{rodape}

</body></html>"""


def main(argv: list[str]) -> int:
    if len(argv) < 2:
        print("uso: gerar_pdf.py <documento.json> [pasta-das-imagens]")
        return 2

    spec_file = Path(argv[1])
    spec = json.loads(spec_file.read_text(encoding="utf-8"))
    imgdir = Path(argv[2]) if len(argv) > 2 else spec_file.resolve().parent

    html = montar_html(spec, imgdir)

    destino = Path(spec["saida"])
    destino.parent.mkdir(parents=True, exist_ok=True)

    # O HTML fica junto do JSON (scratchpad), não junto do PDF: só o PDF vai
    # para a pasta do projeto. Ajuda a depurar layout no Chrome de verdade —
    # mas confira a PAGINAÇÃO no PDF, porque o navegador não mostra onde a
    # folha corta.
    lado = spec_file.resolve().with_suffix(".html")
    lado.write_text(html, encoding="utf-8")

    from playwright.sync_api import sync_playwright

    rodape_pag = (
        f'<div style="width:100%;font-family:{spec.get("fontes", {}).get("corpo", "Georgia, serif")};'
        'font-size:8px;color:#6b746e;padding:0 16mm;display:flex;'
        'justify-content:space-between">'
        f'<span>{esc(spec["produto"])}'
        + (f' · {esc(spec["assinatura"])}' if spec.get("assinatura") else "")
        + '</span><span class="pageNumber"></span></div>'
    )

    with sync_playwright() as p:
        nav = p.chromium.launch()
        pg = nav.new_page()
        pg.set_content(html, wait_until="load")
        pg.wait_for_timeout(700)
        pg.pdf(
            path=str(destino),
            format="A4",
            print_background=True,
            margin={"top": "16mm", "bottom": "14mm", "left": "16mm", "right": "16mm"},
            display_header_footer=True,
            header_template="<div></div>",
            footer_template=rodape_pag,
        )
        nav.close()

    kb = destino.stat().st_size // 1024
    print(f"PDF salvo em: {destino}  ({kb} KB)")
    print(f"HTML de depuração: {lado}")
    return 0


if __name__ == "__main__":
    sys.exit(main(sys.argv))
