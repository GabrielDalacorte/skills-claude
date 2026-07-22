// Núcleo reutilizável do Playwright para a skill "documentar-tela".
// - usa o Chrome do sistema (channel: chrome) para não depender de download;
// - reaproveita a sessão logada (state.json) salva pelo login.js;
// - injeta localStorage antes do load para matar tours/onboarding (driver.js etc).
//
// Config por variáveis de ambiente (todas opcionais):
//   APP_BASE       base URL do app         (default http://localhost:5173)
//   STATE_PATH     arquivo de sessão        (default state.json no cwd)
//   TOUR_KEYS      chaves de localStorage a marcar como 'true', separadas por vírgula
//                  (default main_tour_completed,workflow_tour_completed)
//   VW,VH,DSF      viewport e device scale  (default 1600x900 @2x)
//   HEADED=1       abre o browser visível (default headless)
//   BROWSER_CHANNEL  canal do browser       (default chrome)
const { chromium } = require('playwright');
const fs = require('fs');

const CFG = {
  base: process.env.APP_BASE || 'http://localhost:5173',
  state: process.env.STATE_PATH || 'state.json',
  tourKeys: (process.env.TOUR_KEYS || 'main_tour_completed,workflow_tour_completed')
    .split(',').map((s) => s.trim()).filter(Boolean),
  vw: +(process.env.VW || 1600),
  vh: +(process.env.VH || 900),
  dsf: +(process.env.DSF || 2),
};

async function launch() {
  return chromium.launch({
    channel: process.env.BROWSER_CHANNEL || 'chrome',
    headless: !process.env.HEADED,
  });
}

// Cria um contexto novo (sessão isolada) já com tour desligado e sessão logada.
async function newPage(browser, useState = true) {
  const opts = { viewport: { width: CFG.vw, height: CFG.vh }, deviceScaleFactor: CFG.dsf };
  if (useState && fs.existsSync(CFG.state)) opts.storageState = CFG.state;
  const ctx = await browser.newContext(opts);
  await ctx.addInitScript((keys) => {
    try { keys.forEach((k) => localStorage.setItem(k, 'true')); } catch (e) {}
  }, CFG.tourKeys);
  const page = await ctx.newPage();
  return { ctx, page };
}

// Resolve um caminho relativo contra a base; deixa URLs absolutas como estão.
function url(path) {
  return /^https?:/.test(path) ? path : CFG.base + path;
}

module.exports = { CFG, launch, newPage, url };
