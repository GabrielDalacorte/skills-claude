---
name: acompanhar-projeto
description: Gera um DOCUMENTO DE ACOMPANHAMENTO em PDF — "onde estamos e o que vem a seguir" — com a identidade do PRÓPRIO produto (sem logo nem cores de agência), prints reais do sistema rodando, itens numerados, boxes de limitação e tabelas do que falta. Use quando o Gabriel pedir "documento de acompanhamento", "PDF de status do projeto", "onde estamos", "relatório de andamento pro cliente", "um bussola-status", "manda um PDF mostrando o que já está de pé e o que falta". NÃO é a skill `evidenciar-personalizeit` (aquela é PDF de evidências com a marca da PersonalizeIT) nem a `documentar-tela` (guia .docx de como usar uma tela).
---

# Acompanhar projeto — documento de status, sem marca de agência

Produz o PDF que se manda ao dono do produto quando ele pergunta "como está?".
Nasceu do `bussola-status.pdf` da Bússola Tributária.

**A marca do documento é o produto, não quem o escreveu.** Nenhum logo, nenhuma cor de
agência: o que dá identidade é a tipografia editorial (serifa, filete duplo, versaletes) e
a paleta do próprio app, que vem no JSON. O documento tem que parecer ter saído de dentro
do sistema que descreve.

Diferença das irmãs:

| Skill | Entrega | Quando |
|---|---|---|
| `documentar` | spec ou resolução em texto, por ID | planejar ou registrar como resolveu |
| `documentar-tela` | guia "Como funciona" (.docx) | ensinar alguém a usar uma tela |
| `evidenciar-personalizeit` | PDF de evidências, marca da PersonalizeIT | comprovar entrega a um cliente da PersonalizeIT |
| **`acompanhar-projeto`** | **PDF de acompanhamento, marca do produto** | **dizer onde o projeto está e o que vem** |

## Pré-requisitos

1. **App rodando** com o código atual. Descubra a porta (`netstat -ano | grep LISTEN`) ou
   pergunte a URL.
2. **Playwright em python** — quase todo projeto Django do Gabriel já tem no venv
   (`backend\.venv\Scripts\python.exe -c "import playwright"`). Se não:
   `pip install --index-url https://pypi.org/simple/ playwright && playwright install chromium`
   (o `--index-url` público é necessário quando o pip aponta para o CodeArtifact da CG).
3. **Pillow**, só se for mascarar dado sensível: mesma linha de `pip`, pacote `pillow`.
4. **Diretório de trabalho** = o scratchpad da sessão (`documento.json`, os `.png` e o HTML
   de depuração ficam lá). Só o PDF vai para a pasta do projeto.

## Fluxo

### 1. Entender o momento do projeto (é o passo que decide a qualidade)

Leia o README, o histórico recente e — principalmente — **rode/abra o sistema**. Depois
responda três coisas, por escrito, antes de capturar qualquer tela:

- **O que já está de pé** e dá para mostrar em tela.
- **O que ainda falta**, na ordem em que será feito.
- **Qual é a limitação de hoje** que o documento vai declarar.

Esse terceiro é o que separa um documento sério de um relatório de vendas. O modelo da
Bússola declarou que o agente decidia pelo título e pelo resumo, não pelo texto da
notícia — e é justamente por causa dessa frase que o resto do documento é levado a sério.

### 2. Escolher as telas

Uma por item, na ordem em que a pessoa percorreria o produto. Escolha entidade **com
movimento**: tela vazia não mostra nada. Se um número vai aparecer no texto, ele tem que
sair de uma execução/registro que existe no banco — abra e confira.

### 3. Capturar

Use o harness da skill irmã (mesmo formato de `telas.json`, documentado no cabeçalho dele):

```bash
<python> ~/.claude/skills/filmar-produto/scripts/capturar.py telas.json <scratchpad>/telas
```

Para documento use **`"dsf": 2`** — não há zoom de câmera aqui, e 3x só engorda o PDF.
Se a `filmar-produto` não estiver instalada, o script está no repo `skills-claude`.

### 4. Mascarar o que não pode circular

O documento pode ser mostrado **a um cliente**, e a tela real costuma exibir a carteira
inteira:

```bash
<python> <esta-pasta>/scripts/mascarar.py telas/clientes.png telas/clientes-mascarada.png \
    --faixa 530,505,1330,1240 --faixa 2170,505,2575,1240 --sonda 1500
```

O `--sonda` devolve os fios da tabela por cima do borrão — sem eles a faixa vira um
retângulo sujo e parece defeito de captura. **Declare o borrão na legenda** ("nomes
borrados de propósito"); borrão sem explicação lê como erro.

### 5. Escrever o `documento.json`

Schema completo no cabeçalho de `scripts/gerar_pdf.py`; exemplo real e comentado em
`examples/documento.bussola.json`. A estrutura que funciona:

- **Cabeçalho**: `produto` (a manchete), `assinatura`, `tipo`, `subtitulo`.
- **`abertura`**: um parágrafo dizendo o que o produto faz e o que este documento mostra.
- **Parte "Hoje temos"**: itens numerados `01, 02, …`, cada um com lide curto + figura.
- **Parte "O que vamos fazer ainda"**: itens `A, B, C`, com o boxe de limitação, uma
  tabela `o que falta / situação` e o custo ou esforço quando você souber.
- **`tokens`**: copie as cores do `theme.css` do produto.
- **`rodape`**: uma linha dizendo de onde o documento saiu.

Sobre o texto: lide curto explica **para que serve**, não onde clicar. Legenda diz **o que
olhar** ("Os agentes agrupados por recorrência"), não o que a tela é ("Tela de agentes").

**A parte do que falta é TABELA, não prosa.** Aprendido na marra: numa revisão eu reescrevi
essa seção em parágrafos, e as pendências continuavam lá — só que ninguém as via. O dono do
produto abre o documento e procura a tabela. Três colunas funcionam melhor que duas:
`o que falta · depende de · situação`, porque metade das pendências não é trabalho parado —
é decisão de quem paga, ou um dia com a notícia certa, e a coluna do meio diz isso sem
precisar de parágrafo.

### 6. Gerar

```bash
<python> <esta-pasta>/scripts/gerar_pdf.py documento.json <pasta-das-imagens>
```

### 7. Conferir a PAGINAÇÃO — no PDF, não no navegador

Este é o passo que quase todo mundo pula e é onde o documento estraga. Rasterize e olhe:

```python
import pypdfium2 as pdfium
doc = pdfium.PdfDocument('saida.pdf')
for i in range(len(doc)):
    doc[i].render(scale=1.3).to_pil().convert('RGB').save(f'p{i+1:02d}.png')
```

Depois monte uma folha de contato (`ffmpeg -i p%02d.png -vf "scale=700:-1,tile=2x2" folha.png`)
e abra com a ferramenta Read. O que procurar:

- **Um quarto de folha em branco no pé.** É o vício deste layout: um item com figura 16:9 a
  82% da coluna fecha em ~120mm, e dois não cabem. Baixe a `largura` da figura para 74 e
  meça de novo — no exemplo da Bússola isso tirou uma página inteira do documento.
- Título sozinho no fim da página (o CSS já evita, mas confira).
- Tabela partida no meio.
- Figura ilegível por estar pequena demais — aí o caminho é o contrário: suba a largura e
  aceite a página a mais.

Ajuste `largura` por figura e `quebra` por item até a paginação fechar. Só então entregue.

### 8. Entregar

Caminho do PDF + as partes em duas linhas + a limitação que você declarou (ele vai
querer saber que ela está lá). Ofereça o texto da mensagem para o cliente.

## Onde salvar

Pasta do projeto, ao lado do código. Nome: `Acompanhamento_{Produto}.pdf` — ou
`{produto}-status.pdf`, se for continuar uma série que já existe.

## Regras

- **Prints reais, sempre.** Nada de mockup ou tela montada em HTML. Se o app não subir,
  avise e pare — não invente a evidência.
- **Nenhum número sem origem.** Todo valor citado sai de execução/registro que existe. Sem
  o dado, não afirme.
- **Nenhum logo de agência.** Se o pedido for um PDF com a marca da PersonalizeIT, a skill
  é a `evidenciar-personalizeit`.
- **Declare a limitação.** Documento de acompanhamento sem nada a melhorar não é
  acompanhamento, é folheto.
- **Dado de cliente real** (nome, CNPJ, e-mail, honorários) sai borrado e declarado, ou a
  tela fica fora.
- `documento.json`, `telas.json`, os `.png` e o HTML de depuração ficam no **scratchpad**.
- **Não commitar** nada — o Gabriel revisa e commita.
- Escrever o documento e responder em português, em linguagem de dono de produto: sem nome
  de arquivo, sem nome de variável, sem jargão de código no corpo.
