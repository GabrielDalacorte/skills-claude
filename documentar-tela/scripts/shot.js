// Captura screenshots de forma declarativa a partir de um shots.json.
// Uso:  node shot.js <shots.json> [pastaDeSaida]
//
// shots.json = array de "shots". Cada shot:
//   { "name": "01_lista", "url": "/visibilidade/templates",
//     "settleMs": 2500,           // espera após o load (default 2500)
//     "actions": [ ... ],          // ações antes do print (opcional)
//     "waitMs": 1500,              // espera após as ações (default 1500)
//     "fullPage": false,           // print de página inteira (default viewport)
//     "out": "01_lista.png" }      // nome do arquivo (default name+".png")
//
// Ações suportadas (um objeto = uma ação, na ordem):
//   { "wait": 800 }                             espera N ms
//   { "waitFor": ".seletor" }                   espera o seletor aparecer
//   { "press": "Escape" }                       tecla
//   { "scrollBottom": true } / { "scrollTop": true }
//   { "clickButton": "Salvar" }                 clica <button> por nome (role, robusto)
//   { "clickText": "Visão Geral Fiscal", "exact": true }   clica por texto visível
//   { "clickSelector": "button.form-select" }   clica por CSS
//   { "clickHasText": { "selector": "button.w-100", "text": "11.222.333/0001-01" } }
//   { "fill": { "selector": "#busca", "value": "abc" } }
//   { "selectOption": { "selector": "select", "value": "x" } }  // ou "label" ou "index"
// Dica: para não clicar no menu de navegação por engano, prefira clickHasText/clickButton
// a clickText genérico.
const fs = require('fs');
const path = require('path');
const { CFG, launch, newPage, url } = require('./pw');

async function act(page, a) {
  if (a.wait != null) return page.waitForTimeout(a.wait);
  if (a.waitFor) return page.waitForSelector(a.waitFor, { timeout: 15000 }).catch(() => {});
  if (a.press) return page.keyboard.press(a.press).catch(() => {});
  if (a.scrollBottom) return page.evaluate(() => window.scrollTo(0, document.body.scrollHeight));
  if (a.scrollTop) return page.evaluate(() => window.scrollTo(0, 0));
  if (a.clickButton) return page.getByRole('button', { name: a.clickButton }).first().click({ timeout: 15000 });
  if (a.clickText) return page.getByText(a.clickText, a.exact ? { exact: true } : {}).first().click({ timeout: 15000 });
  if (a.clickSelector) return page.locator(a.clickSelector).first().click({ timeout: 15000 });
  if (a.clickHasText) return page.locator(a.clickHasText.selector, { hasText: a.clickHasText.text }).first().click({ timeout: 15000 });
  if (a.fill) return page.fill(a.fill.selector, a.fill.value);
  if (a.selectOption) {
    const s = a.selectOption;
    const arg = s.value != null ? { value: String(s.value) } : s.label != null ? { label: s.label } : { index: s.index || 0 };
    return page.selectOption(s.selector || 'select', arg);
  }
  console.log('  (ação desconhecida)', JSON.stringify(a));
}

(async () => {
  const shotsFile = process.argv[2];
  const outDir = process.argv[3] || '.';
  if (!shotsFile) { console.error('uso: node shot.js <shots.json> [pastaSaida]'); process.exit(1); }
  fs.mkdirSync(outDir, { recursive: true });
  const shots = JSON.parse(fs.readFileSync(shotsFile, 'utf8'));
  const browser = await launch();
  for (const shot of shots) {
    const { ctx, page } = await newPage(browser);
    try {
      await page.goto(url(shot.url), { waitUntil: 'networkidle', timeout: 60000 });
      await page.waitForTimeout(shot.settleMs ?? 2500);
      for (const a of shot.actions || []) await act(page, a);
      await page.waitForTimeout(shot.waitMs ?? 1500);
      const out = path.join(outDir, shot.out || shot.name + '.png');
      await page.screenshot({ path: out, fullPage: !!shot.fullPage });
      console.log('OK  ', shot.name, '->', out, '| url', page.url());
    } catch (e) {
      console.log('FAIL', shot.name, '::', e.message.split('\n')[0]);
    }
    await ctx.close();
  }
  await browser.close();
})();
