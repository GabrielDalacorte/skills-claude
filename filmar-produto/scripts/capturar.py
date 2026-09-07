r"""
Fotografa as telas de um app web rodando, para o Remotion animar por cima.

    <python> capturar.py telas.json <pasta-de-saida>

Não é gravação de tela: cada tela sai como PNG em 3x (4800x2700 num viewport de
1600x900), porque o filme fecha em cima de um card e a 2x isso já borra.

FORMATO DO telas.json
---------------------
{
  "app": "http://localhost:44535",
  "viewport": { "w": 1600, "h": 900, "dsf": 3 },
  "locale": "pt-BR",
  "timezone": "America/Sao_Paulo",
  "tema": "light",                          // esquema de cor do navegador
  "localStorage": { "app.theme": "light" }, // injetado antes de tudo carregar
  "esconder": [".live-badge"],              // seletores sumidos em TODA tela
  "auth": { ... },                          // ver abaixo; omita se for público
  "telas": [
    { "arquivo": "01-login", "rota": "/login", "esperaMs": 2500 },
    { "arquivo": "02-lista", "rota": "/itens", "esperaMs": 3000,
      "esconder": [".badge-status"], "fullPage": false,
      "acoes": [ { "clicarBotao": "Abrir edição" },
                 { "esperarTexto": "pronta para leitura" },
                 { "esperarMs": 4000 } ] }
  ]
}

AUTENTICAÇÃO
------------
"auth": { "modo": "nenhuma" }

"auth": {                                   // pega o token na API e injeta
  "modo": "token",
  "endpoint": "http://localhost:8000/api/auth/token/",
  "corpo": { "username": "admin", "password": "admin123" },
  "localStorage": { "app.access_token": "$.access",
                    "app.refresh_token": "$.refresh",
                    "app.username": "admin" }
}                                           // "$.campo" = campo da resposta

"auth": {                                   // preenche o formulário de login
  "modo": "formulario",
  "rota": "/login",
  "campos": { "input[name=username]": "admin", "input[type=password]": "admin123" },
  "botao": "Entrar",
  "esperaMs": 4000
}

AÇÕES (uma chave por item, na ordem)
------------------------------------
{"esperarMs": 2000}                 pausa
{"esperarSeletor": ".react-flow"}   espera o elemento existir
{"esperarTexto": "Sua edição"}      espera o texto aparecer
{"clicarBotao": "Ampliar"}          clique por role+nome — PREFIRA ESTE
{"clicarTexto": "Fontes"}           clique por texto (pega o menu por engano)
{"clicarSeletor": "button.abrir"}   clique por CSS
{"preencher": {"seletor": "input[name=q]", "valor": "abc"}}
{"pressionar": "Enter"}
{"rolarAte": "text=Seu resultado"}  rola até o elemento entrar no quadro
{"rolarPx": 900}                    rola N pixels
{"topo": true}                      volta ao topo
"""

from __future__ import annotations

import json
import sys
import urllib.request
from pathlib import Path
from typing import Any

from playwright.sync_api import Page, sync_playwright

ESCONDER_CSS = "{seletores} {{ visibility: hidden !important; }}"


def autenticar(auth: dict[str, Any]) -> dict[str, Any]:
    """Modo token: bate no endpoint e devolve a resposta como dict."""
    req = urllib.request.Request(
        auth["endpoint"],
        data=json.dumps(auth.get("corpo", {})).encode(),
        headers={"Content-Type": "application/json"},
    )
    with urllib.request.urlopen(req, timeout=15) as resp:
        return json.loads(resp.read())


def resolver(valor: Any, resposta: dict[str, Any]) -> str:
    """"$.access" vira resposta["access"]; o resto passa direto."""
    if isinstance(valor, str) and valor.startswith("$."):
        return str(resposta[valor[2:]])
    return str(valor)


def esconder(pagina: Page, seletores: list[str]) -> None:
    """Some com o que não deve entrar no quadro (badge de reconexão, tour).

    `visibility` e não `display`: sumir com o elemento sem mudar o layout, para
    o enquadramento seguir valendo se alguém tirar a regra depois.
    """
    if not seletores:
        return
    pagina.add_style_tag(
        content=ESCONDER_CSS.format(seletores=", ".join(seletores)),
    )


def executar(pagina: Page, acao: dict[str, Any]) -> None:
    if "esperarMs" in acao:
        pagina.wait_for_timeout(acao["esperarMs"])
    elif "esperarSeletor" in acao:
        pagina.wait_for_selector(acao["esperarSeletor"], timeout=30000)
    elif "esperarTexto" in acao:
        pagina.wait_for_selector(f"text={acao['esperarTexto']}", timeout=30000)
    elif "clicarBotao" in acao:
        pagina.get_by_role("button", name=acao["clicarBotao"]).first.click()
    elif "clicarTexto" in acao:
        pagina.get_by_text(acao["clicarTexto"]).first.click()
    elif "clicarSeletor" in acao:
        pagina.locator(acao["clicarSeletor"]).first.click()
    elif "preencher" in acao:
        pagina.fill(acao["preencher"]["seletor"], acao["preencher"]["valor"])
    elif "pressionar" in acao:
        pagina.keyboard.press(acao["pressionar"])
    elif "rolarAte" in acao:
        pagina.locator(acao["rolarAte"]).first.scroll_into_view_if_needed()
        pagina.wait_for_timeout(1200)
    elif "rolarPx" in acao:
        pagina.mouse.wheel(0, acao["rolarPx"])
        pagina.wait_for_timeout(1200)
    elif "topo" in acao:
        pagina.evaluate("window.scrollTo(0, 0)")
        pagina.wait_for_timeout(600)
    else:
        raise ValueError(f"ação desconhecida: {acao}")


def main(argv: list[str]) -> int:
    if len(argv) != 3:
        print(__doc__.strip().splitlines()[2].strip())
        return 2

    conf = json.loads(Path(argv[1]).read_text(encoding="utf-8"))
    saida = Path(argv[2])
    saida.mkdir(parents=True, exist_ok=True)

    app = conf["app"].rstrip("/")
    vp = conf.get("viewport", {})
    auth = conf.get("auth", {"modo": "nenhuma"})
    guardar = dict(conf.get("localStorage", {}))

    if auth.get("modo") == "token":
        resposta = autenticar(auth)
        for chave, valor in auth.get("localStorage", {}).items():
            guardar[chave] = resolver(valor, resposta)

    with sync_playwright() as p:
        navegador = p.chromium.launch()
        ctx = navegador.new_context(
            viewport={"width": vp.get("w", 1600), "height": vp.get("h", 900)},
            device_scale_factor=vp.get("dsf", 3),
            locale=conf.get("locale", "pt-BR"),
            timezone_id=conf.get("timezone", "America/Sao_Paulo"),
            color_scheme=conf.get("tema", "light"),
        )
        if guardar:
            # add_init_script porque o app lê o token ANTES da primeira pintura:
            # setar depois do goto daria um flash na tela de login.
            linhas = "\n".join(
                f"localStorage.setItem({json.dumps(k)}, {json.dumps(v)});"
                for k, v in guardar.items()
            )
            ctx.add_init_script(linhas)

        pagina = ctx.new_page()

        if auth.get("modo") == "formulario":
            pagina.goto(f"{app}{auth.get('rota', '/login')}", wait_until="networkidle")
            for seletor, valor in auth.get("campos", {}).items():
                pagina.fill(seletor, valor)
            if auth.get("botao"):
                pagina.get_by_role("button", name=auth["botao"]).first.click()
            pagina.wait_for_timeout(auth.get("esperaMs", 4000))

        globais = conf.get("esconder", [])

        for tela in conf["telas"]:
            pagina.goto(f"{app}{tela['rota']}", wait_until="networkidle")
            pagina.wait_for_timeout(tela.get("esperaMs", 3000))
            esconder(pagina, globais + tela.get("esconder", []))
            for acao in tela.get("acoes", []):
                executar(pagina, acao)
            # Sem cursor piscando nem anel de foco no print. Não basta soltar o
            # activeElement: depois de um "preencher", o React às vezes devolve
            # o foco, e o anel azul entra no quadro.
            pagina.evaluate(
                "document.querySelectorAll(':focus').forEach((el) => el.blur());"
                "document.activeElement && document.activeElement.blur();"
                "window.getSelection() && window.getSelection().removeAllRanges();"
            )
            destino = saida / f"{tela['arquivo']}.png"
            pagina.screenshot(path=str(destino), full_page=tela.get("fullPage", False))
            print(f"  {destino.name}  ({destino.stat().st_size // 1024} KB)")

        navegador.close()

    print(f"\n{len(conf['telas'])} telas em {saida}")
    return 0


if __name__ == "__main__":
    sys.exit(main(sys.argv))
