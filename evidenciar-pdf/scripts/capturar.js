// Captura os prints das evidências a partir de um shots.json.
//
// Uso:  node capturar.js <shots.json> [pastaSaida]
//
// Diferença para o shot.js da skill documentar-tela: aqui cada shot pode ter o SEU
// PRÓPRIO login (`as`), que é o que prova permissão/visibilidade — "o usuário X vê isto,
// o usuário Y não vê aquilo". Também tem `hover` e `scrollIn` (rolar um container que
// tem barra de rolagem própria), que faltaram nas primeiras evidências.
//
// shots.json = { "base": "http://localhost:3050", "login": {...}, "shots": [...] }
//
//   "login": {                                  // como logar (usado pelo campo `as`)
//     "path": "/login",
//     "emailSel": "input[placeholder='Digite seu email']",
//     "passSel":  "input[placeholder='Digite sua senha']",
//     "btn": "button:has-text('Fazer Login')"
//   },
//   "users": { "admin": { "email": "...", "pass": "..." }, "ana": { ... } },
//
//   shots[]: {
//     "name": "02_grupo",
//     "as": "admin",              // chave de `users`; omitido = sessão anônima/state.json
//     "url": "/user/admin/permissions",
//     "settleMs": 2500,
//     "actions": [ ... ],
//     "waitMs": 900,
//     "fullPage": false,
//     "clip": { "x":0, "y":0, "width":800, "height":600 }
//   }
//
// Ações:
//   { "wait": 800 }                            espera N ms
//   { "waitFor": ".sel" }                      espera o seletor
//   { "press": "Escape" }
//   { "hover": "aside" }                       passa o mouse (menu que abre no hover)
//   { "scrollBottom": true } | { "scrollTop": true }
//   { "scrollIn": ".sel" }                     rola ATÉ O FIM um container com scroll próprio
//   { "clickButton": "Salvar" }                por role/nome
//   { "clickText": "Relatórios", "exact": true }
//   { "clickSelector": ".btn" }
//   { "clickHasText": { "selector": "div.cursor-pointer", "text": "Site", "last": true } }
//   { "fill": { "selector": "#q", "value": "abc" } }
//   { "selectOption": { "selector": "select", "value": "x" } }
//   { "expandAll": "aside button" }            clica em todos, re-hoverando entre um e outro
const fs = require('fs');
const path = require('path');
const { chromium } = require('playwright');

const cfgFile = process.argv[2];
const OUT = process.argv[3] || 'evidencias';
if (!cfgFile) {
  console.error('uso: node capturar.js <shots.json> [pastaSaida]');
  process.exit(1);
}
const cfg = JSON.parse(fs.readFileSync(cfgFile, 'utf8'));
const BASE = process.env.APP_BASE || cfg.base || 'http://localhost:5173';
const VW = +(process.env.VW || cfg.vw || 1600);
const VH = +(process.env.VH || cfg.vh || 900);
const DSF = +(process.env.DSF || cfg.dsf || 2);
const TOUR = (process.env.TOUR_KEYS || cfg.tourKeys || 'main_tour_completed,workflow_tour_completed')
  .split(',').map((s) => s.trim()).filter(Boolean);

const url = (p) => (/^https?:/.test(p) ? p : BASE + p);

async function act(page, a) {
  if (a.wait != null) return page.waitForTimeout(a.wait);
  if (a.waitFor) return page.waitForSelector(a.waitFor, { timeout: 15000 }).catch(() => {});
  if (a.press) return page.keyboard.press(a.press).catch(() => {});
  if (a.hover) return page.locator(a.hover).first().hover().catch(() => {});
  if (a.scrollBottom) return page.evaluate(() => window.scrollTo(0, document.body.scrollHeight));
  if (a.scrollTop) return page.evaluate(() => window.scrollTo(0, 0));
  if (a.scrollIn) {
    return page.evaluate((sel) => {
      const el = document.querySelector(sel);
      if (el) el.scrollTop = el.scrollHeight;
    }, a.scrollIn);
  }
  if (a.expandAll) {
    const loc = page.locator(a.expandAll);
    const n = await loc.count();
    for (let i = 0; i < n; i++) {
      await loc.nth(i).click({ timeout: 3000 }).catch(() => {});
      await page.waitForTimeout(200);
      const scope = a.expandAll.split(' ')[0];
      await page.locator(scope).first().hover().catch(() => {});
    }
    return;
  }
  if (a.clickButton) return page.getByRole('button', { name: a.clickButton }).first().click({ timeout: 15000 });
  if (a.clickText) return page.getByText(a.clickText, a.exact ? { exact: true } : {}).first().click({ timeout: 15000 });
  if (a.clickSelector) return page.locator(a.clickSelector).first().click({ timeout: 15000 });
  if (a.clickHasText) {
    const loc = page.locator(a.clickHasText.selector, { hasText: a.clickHasText.text });
    return (a.clickHasText.last ? loc.last() : loc.first()).click({ timeout: 15000 });
  }
  if (a.fill) return page.fill(a.fill.selector, a.fill.value);
  if (a.selectOption) {
    const s = a.selectOption;
    const arg = s.value != null ? { value: String(s.value) }
      : s.label != null ? { label: s.label } : { index: s.index || 0 };
    return page.selectOption(s.selector || 'select', arg);
  }
  console.log('  (ação desconhecida)', JSON.stringify(a));
}

async function logar(page, user) {
  const L = cfg.login || {};
  await page.goto(url(L.path || '/login'), { waitUntil: 'networkidle', timeout: 60000 });
  await page.fill(L.emailSel || '#email', user.email);
  await page.fill(L.passSel || '#password', user.pass);
  await page.click(L.btn || 'button[type=submit]');
  await page.waitForURL((u) => !u.toString().includes(L.path || '/login'), { timeout: 30000 })
    .catch(() => {});
  await page.waitForTimeout(2000);
}

(async () => {
  fs.mkdirSync(OUT, { recursive: true });
  const browser = await chromium.launch({
    channel: process.env.BROWSER_CHANNEL || 'chrome',
    headless: !process.env.HEADED,
  });

  let ok = 0;
  let falhou = 0;
  for (const shot of cfg.shots || []) {
    const opts = { viewport: { width: VW, height: VH }, deviceScaleFactor: DSF };
    // sem `as`, reaproveita a sessão salva (se houver) — igual ao fluxo do documentar-tela
    if (!shot.as && fs.existsSync(cfg.state || 'state.json')) opts.storageState = cfg.state || 'state.json';
    const ctx = await browser.newContext(opts);
    await ctx.addInitScript((keys) => {
      try { keys.forEach((k) => localStorage.setItem(k, 'true')); } catch (e) {}
    }, TOUR);
    const page = await ctx.newPage();

    try {
      if (shot.as) {
        const u = (cfg.users || {})[shot.as];
        if (!u) throw new Error(`usuário "${shot.as}" não está em "users"`);
        await logar(page, u);
      }
      await page.goto(url(shot.url || '/'), { waitUntil: 'networkidle', timeout: 60000 });
      await page.waitForTimeout(shot.settleMs ?? 2500);
      for (const a of shot.actions || []) await act(page, a);
      await page.waitForTimeout(shot.waitMs ?? 900);

      const file = path.join(OUT, (shot.out || shot.name) + '.png');
      await page.screenshot({ path: file, fullPage: !!shot.fullPage, clip: shot.clip });
      console.log('OK  ', shot.name, shot.as ? `(como ${shot.as})` : '');
      ok++;
    } catch (e) {
      console.log('FAIL', shot.name, '|', String(e.message).split('\n')[0]);
      falhou++;
    }
    await ctx.close();
  }

  await browser.close();
  console.log(`\n${ok} capturado(s), ${falhou} falha(s) -> ${path.resolve(OUT)}`);
  if (falhou) process.exitCode = 1;
})();
