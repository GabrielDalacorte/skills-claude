// Gera um PDF de evidências com a identidade da PersonalizeIT a partir de um evidencia.json.
//
// Uso:  node gerar_pdf.js <evidencia.json> [pastaDasImagens]
//
// Renderiza HTML e imprime com o Chrome (Playwright). Não depende de Word/LibreOffice.
// A marca (cores, fonte, logo) vem de ../assets/brand.json — edite lá, não aqui.
//
// evidencia.json (só title e output são obrigatórios):
// {
//   "title": "Permissões do Relatório de Tickets",
//   "subtitle": "Evidências da entrega",         // opcional, aceita \n
//   "client": "Supermercado Brunetto",           // aparece na capa e no rodapé
//   "tags": ["PER-102", "PER-103"],              // chips na capa (IDs das tarefas)
//   "dateline": "Setembro de 2026",              // default: mês/ano de hoje
//   "intro": { "heading": "...", "paragraphs": [...], "bullets": [...] },
//   "summary": [["Item", "Situação"], ["...", "..."]],   // 1ª linha = cabeçalho
//   "sections": [{
//      "heading": "1. ...",
//      "level": 1,                                // 1 = nova página (default), 2 = segue na mesma
//      "paragraphs": ["..."],
//      "bullets": ["..."],
//      "steps": ["..."],
//      "note": { "type": "info|ok|alerta", "title": "...", "text": "..." },
//      "figures": [{ "img": "01.png", "caption": "Figura 1 — ..." }]
//   }],
//   "glossary": [["Termo", "definição"]],
//   "output": "D:/.../Evidencias.pdf"
// }
const fs = require('fs');
const path = require('path');
const { chromium } = require('playwright');

const ROOT = path.resolve(__dirname, '..');
const brand = JSON.parse(fs.readFileSync(path.join(ROOT, 'assets', 'brand.json'), 'utf8'));

const specFile = process.argv[2];
if (!specFile) {
  console.error('uso: node gerar_pdf.js <evidencia.json> [pastaDasImagens]');
  process.exit(1);
}
const spec = JSON.parse(fs.readFileSync(specFile, 'utf8'));
const IMGDIR = process.argv[3] || path.dirname(path.resolve(specFile));

const esc = (s) =>
  String(s ?? '').replace(/[&<>]/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;' }[c]));

// **negrito** e `código` no texto dos parágrafos/bullets
const rich = (s) =>
  esc(s)
    .replace(/\*\*(.+?)\*\*/g, '<strong>$1</strong>')
    .replace(/`(.+?)`/g, '<code>$1</code>');

function dataUri(file) {
  const abs = path.isAbsolute(file) ? file : path.join(IMGDIR, file);
  if (!fs.existsSync(abs)) {
    console.warn('  ! imagem não encontrada:', abs);
    return null;
  }
  const ext = path.extname(abs).slice(1).toLowerCase();
  const mime = ext === 'svg' ? 'image/svg+xml' : ext === 'jpg' ? 'image/jpeg' : `image/${ext}`;
  return `data:${mime};base64,${fs.readFileSync(abs).toString('base64')}`;
}

const logo = dataUri(path.join(ROOT, 'assets', brand.logo));

// A fonte da marca é comercial e não é versionada: se os .ttf existirem nesta máquina,
// são embutidos; se não, a stack do brand.json cai no fallback sem quebrar o layout.
function fontFaces() {
  const files = brand.fontFiles || {};
  const nome = (brand.font.match(/"([^"]+)"/) || [null, 'Marca'])[1];
  const faces = Object.entries(files)
    .map(([peso, arq]) => {
      if (!fs.existsSync(arq)) return null;
      const b64 = fs.readFileSync(arq).toString('base64');
      return `@font-face{font-family:"${nome}";font-weight:${peso};font-style:normal;
        src:url(data:font/ttf;base64,${b64}) format("truetype");}`;
    })
    .filter(Boolean);
  if (!faces.length) console.warn(`  ! fonte "${nome}" não encontrada nesta máquina — usando o fallback da stack`);
  return faces.join('\n');
}

function figuras(list = []) {
  return list
    .map((f) => {
      const src = dataUri(f.img);
      if (!src) return '';
      return `<figure class="fig">
        <img src="${src}" alt="">
        ${f.caption ? `<figcaption>${rich(f.caption)}</figcaption>` : ''}
      </figure>`;
    })
    .join('\n');
}

function nota(n) {
  if (!n) return '';
  const tipo = n.type || 'info';
  return `<aside class="nota nota--${esc(tipo)}">
    ${n.title ? `<p class="nota__t">${rich(n.title)}</p>` : ''}
    <p class="nota__x">${rich(n.text || '')}</p>
  </aside>`;
}

function tabela(rows = []) {
  if (!rows.length) return '';
  const [head, ...body] = rows;
  return `<table class="tab">
    <thead><tr>${head.map((c) => `<th>${rich(c)}</th>`).join('')}</tr></thead>
    <tbody>${body
      .map((r) => `<tr>${r.map((c) => `<td>${rich(c)}</td>`).join('')}</tr>`)
      .join('')}</tbody>
  </table>`;
}

function bloco(s) {
  return [
    (s.paragraphs || []).map((p) => `<p>${rich(p)}</p>`).join(''),
    (s.bullets || []).length ? `<ul>${s.bullets.map((b) => `<li>${rich(b)}</li>`).join('')}</ul>` : '',
    (s.steps || []).length ? `<ol>${s.steps.map((b) => `<li>${rich(b)}</li>`).join('')}</ol>` : '',
    s.table ? tabela(s.table) : '',
    nota(s.note),
    figuras(s.figures),
  ].join('\n');
}

const hoje = new Date();
const MESES = ['janeiro', 'fevereiro', 'março', 'abril', 'maio', 'junho',
  'julho', 'agosto', 'setembro', 'outubro', 'novembro', 'dezembro'];
const dateline = spec.dateline || `${MESES[hoje.getMonth()]} de ${hoje.getFullYear()}`;

const secoes = (spec.sections || [])
  .map((s, i) => {
    const lvl = s.level || 1;
    const quebra = lvl === 1 && i > 0 ? ' quebra' : '';
    return `<section class="sec${quebra}">
      <h${lvl === 1 ? 2 : 3}>${rich(s.heading || '')}</h${lvl === 1 ? 2 : 3}>
      ${bloco(s)}
    </section>`;
  })
  .join('\n');

const html = `<!doctype html>
<html lang="pt-BR"><head><meta charset="utf-8">
<title>${esc(spec.title)}</title>
<style>
  ${fontFaces()}

  @page { size: A4; margin: 18mm 16mm 20mm; }
  @page :first { margin: 0; }

  :root {
    --primaria: ${brand.colors.primary};
    --primaria-escura: ${brand.colors.primaryDark};
    --secundaria: ${brand.colors.secondary};
    --texto: ${brand.colors.text};
    --suave: ${brand.colors.muted};
    --linha: ${brand.colors.line};
    --fundo: ${brand.colors.surface};
    --capa-fundo: ${brand.cover.bg};
    --capa-fundo-2: ${brand.cover.bgSoft};
    --capa-texto: ${brand.cover.text};
    --capa-acento: ${brand.cover.accent};
  }

  * { box-sizing: border-box; }
  body {
    margin: 0; color: var(--texto);
    font-family: ${brand.font};
    font-size: 10.5pt; line-height: 1.55;
    -webkit-print-color-adjust: exact; print-color-adjust: exact;
  }

  /* ---------- capa (grafite: a base da marca; laranja só como acento) ---------- */
  .capa {
    position: relative; overflow: hidden;
    height: 297mm; padding: 26mm 24mm 22mm;
    display: flex; flex-direction: column;
    background: var(--capa-fundo);
    color: var(--capa-texto); page-break-after: always;
  }
  /* faixa de acento no topo — o laranja entra aqui, em área mínima */
  .capa::before {
    content: ""; position: absolute; top: 0; left: 0; right: 0; height: 3mm;
    background: var(--capa-acento);
  }
  /* camada de profundidade em grafite-superfície, canto inferior direito */
  .capa::after {
    content: ""; position: absolute; right: -40mm; bottom: -60mm;
    width: 150mm; height: 150mm; border-radius: 50%;
    background: var(--capa-fundo-2);
  }
  .capa > * { position: relative; z-index: 1; }

  .capa__logo { height: 9mm; width: auto; object-fit: contain; align-self: flex-start; }
  .capa__meio { margin-top: auto; }
  .capa__eyebrow {
    font-size: 9pt; letter-spacing: .2em; text-transform: uppercase;
    color: var(--capa-acento); font-weight: 600; margin: 0 0 6mm;
  }
  .capa h1 {
    font-size: 29pt; line-height: 1.18; font-weight: 700;
    margin: 0 0 6mm; max-width: 21ch;
  }
  .capa__regua { width: 24mm; height: 1.2mm; background: var(--capa-acento); margin: 7mm 0; }
  .capa__sub {
    font-size: 12.5pt; margin: 0; white-space: pre-line;
    color: rgba(255,255,255,.82); line-height: 1.5;
  }
  .chips { display: flex; flex-wrap: wrap; gap: 3mm; margin: 0 0 9mm; padding: 0; list-style: none; }
  .chips li {
    border: 1px solid var(--capa-acento); color: var(--capa-acento);
    border-radius: 999px; padding: 1.3mm 4mm; font-size: 8.5pt;
    letter-spacing: .06em; font-weight: 600;
  }
  .capa__pe {
    margin-top: auto; display: flex; justify-content: space-between; align-items: flex-end;
    font-size: 9.5pt; color: rgba(255,255,255,.7);
    border-top: 1px solid rgba(255,255,255,.18); padding-top: 5mm;
  }

  /* ---------- conteúdo ---------- */
  /* título em grafite com régua laranja: o acento entra na régua, não no texto —
     é o que mantém o laranja dentro dos ~10% da composição que o brand book pede */
  h2 {
    font-size: 15pt; color: var(--secundaria); font-weight: 700; margin: 0 0 4.5mm;
    padding-bottom: 2.5mm; border-bottom: 2px solid var(--primaria);
  }
  h3 { font-size: 11.5pt; color: var(--primaria-escura); margin: 7mm 0 3mm; }
  p { margin: 0 0 3.5mm; }
  ul, ol { margin: 0 0 4mm; padding-left: 6mm; }
  li { margin-bottom: 2mm; }
  li::marker { color: var(--primaria); font-weight: 600; }
  strong { color: var(--primaria-escura); }
  code {
    font-family: Consolas, "Courier New", monospace; font-size: 9pt;
    background: var(--fundo); border: 1px solid var(--linha);
    border-radius: 3px; padding: .3mm 1.4mm;
  }
  .sec { margin-bottom: 8mm; }
  .quebra { page-break-before: always; }

  .intro {
    background: var(--fundo); border-left: 3px solid var(--primaria);
    border-radius: 0 3mm 3mm 0; padding: 6mm 7mm; margin-bottom: 8mm;
  }
  .intro h2 { border: 0; padding: 0; margin-bottom: 3mm; color: var(--primaria-escura); }

  .fig {
    margin: 5mm 0 7mm; page-break-inside: avoid; text-align: center;
  }
  .fig img {
    max-width: 100%; border: 1px solid var(--linha); border-radius: 2.5mm;
    box-shadow: 0 1mm 3mm rgba(0,0,0,.09);
  }
  figcaption {
    font-size: 8.5pt; color: var(--suave); margin-top: 2.5mm;
    font-style: italic; text-align: center;
  }

  .tab { width: 100%; border-collapse: collapse; margin: 0 0 5mm; font-size: 9.5pt; }
  .tab th {
    background: var(--primaria); color: #fff; text-align: left;
    padding: 2.5mm 3mm; font-weight: 600;
  }
  .tab td { padding: 2.5mm 3mm; border-bottom: 1px solid var(--linha); vertical-align: top; }
  .tab tr:nth-child(even) td { background: var(--fundo); }

  .nota {
    border-radius: 2.5mm; padding: 4mm 5mm; margin: 4mm 0 5mm;
    page-break-inside: avoid; border-left: 3px solid var(--primaria);
    background: var(--fundo);
  }
  .nota--ok { border-left-color: ${brand.colors.ok}; }
  .nota--alerta { border-left-color: ${brand.colors.warn}; }
  .nota__t { font-weight: 600; color: var(--primaria-escura); margin: 0 0 1.5mm; }
  .nota--ok .nota__t { color: ${brand.colors.ok}; }
  .nota--alerta .nota__t { color: ${brand.colors.warn}; }
  .nota__x { margin: 0; }

  .gloss dt { font-weight: 600; color: var(--primaria-escura); margin-top: 3mm; }
  .gloss dd { margin: 0 0 2mm; }
</style></head>
<body>

<div class="capa">
  ${logo ? `<img class="capa__logo" src="${logo}" alt="">` : ''}
  <div class="capa__meio">
    <p class="capa__eyebrow">Relatório de evidências</p>
    <h1>${esc(spec.title)}</h1>
    <div class="capa__regua"></div>
    ${spec.subtitle ? `<p class="capa__sub">${esc(spec.subtitle)}</p>` : ''}
  </div>
  <div style="margin-top:auto">
    ${(spec.tags || []).length ? `<ul class="chips">${spec.tags.map((t) => `<li>${esc(t)}</li>`).join('')}</ul>` : ''}
    <div class="capa__pe">
      <span>${esc(spec.client || brand.company)}</span>
      <span>${esc(dateline)}</span>
    </div>
  </div>
</div>

${spec.intro ? `<div class="intro">
  <h2>${rich(spec.intro.heading || 'Resumo')}</h2>
  ${bloco(spec.intro)}
</div>` : ''}

${spec.summary ? `<section class="sec"><h2>Resumo da entrega</h2>${tabela(spec.summary)}</section>` : ''}

${secoes}

${(spec.glossary || []).length ? `<section class="sec quebra">
  <h2>Glossário</h2>
  <dl class="gloss">${spec.glossary.map(([t, d]) => `<dt>${rich(t)}</dt><dd>${rich(d)}</dd>`).join('')}</dl>
</section>` : ''}

</body></html>`;

(async () => {
  const out = path.resolve(spec.output);
  fs.mkdirSync(path.dirname(out), { recursive: true });

  const debugHtml = process.env.KEEP_HTML && path.join(path.dirname(out), path.basename(out, '.pdf') + '.html');
  if (debugHtml) fs.writeFileSync(debugHtml, html, 'utf8');

  const browser = await chromium.launch({ channel: process.env.BROWSER_CHANNEL || 'chrome', headless: true });
  const page = await browser.newPage();
  await page.setContent(html, { waitUntil: 'networkidle' });

  const rodape = `
    <div style="width:100%;font-size:7.5pt;color:${brand.colors.muted};
                font-family:${brand.font.replace(/"/g, "'")};
                padding:0 16mm;display:flex;justify-content:space-between;align-items:center;">
      <span>${esc(spec.title)}</span>
      <span>${esc(spec.client || brand.company)} &nbsp;&ndash;&nbsp; <span class="pageNumber"></span>/<span class="totalPages"></span></span>
    </div>`;

  await page.pdf({
    path: out,
    format: 'A4',
    printBackground: true,
    displayHeaderFooter: true,
    headerTemplate: '<div></div>',
    footerTemplate: rodape,
    margin: { top: '18mm', bottom: '20mm', left: '0mm', right: '0mm' },
  });

  await browser.close();
  const kb = (fs.statSync(out).size / 1024).toFixed(0);
  const nFigs = (spec.sections || []).reduce((n, s) => n + (s.figures || []).length, 0);
  console.log(`PDF salvo em: ${out}  (${kb} KB, ${nFigs} figuras)`);
  if (debugHtml) console.log(`HTML de depuração: ${debugHtml}`);
})();
