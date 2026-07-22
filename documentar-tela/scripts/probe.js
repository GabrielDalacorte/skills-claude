// Sonda uma página do app logado e imprime seletores úteis para montar o roteiro.
// Uso:  node probe.js <caminho-ou-url>  [seletorParaClicarAntes]
// Ex.:  node probe.js /visibilidade/templates
// Imprime: URL final, botões, links internos, inputs, selects (com opções) e o texto inicial.
const { launch, newPage, url } = require('./pw');

(async () => {
  const path = process.argv[2] || '/';
  const browser = await launch();
  const { page } = await newPage(browser);
  await page.goto(url(path), { waitUntil: 'networkidle', timeout: 60000 }).catch((e) => console.log('goto:', e.message));
  await page.waitForTimeout(2500);
  if (process.argv[3]) {
    await page.locator(process.argv[3]).first().click().catch((e) => console.log('preclick:', e.message));
    await page.waitForTimeout(2500);
  }
  console.log('URL:', page.url());
  const buttons = await page.$$eval('button', (els) => [...new Set(els.map((e) => e.innerText.replace(/\s+/g, ' ').trim()).filter(Boolean))]).catch(() => []);
  console.log('BUTTONS:', JSON.stringify(buttons));
  const links = await page.$$eval('a[href]', (els) => [...new Set(els.map((e) => e.getAttribute('href')))].filter((h) => h && h.length > 1 && !/^https?:/.test(h))).catch(() => []);
  console.log('LINKS:', JSON.stringify(links));
  const inputs = await page.$$eval('input,textarea', (els) => els.map((e) => ({ type: e.type, id: e.id, name: e.name, ph: e.placeholder }))).catch(() => []);
  console.log('INPUTS:', JSON.stringify(inputs));
  const selects = await page.$$eval('select', (els) => els.map((e) => ({ id: e.id, opts: [...e.options].map((o) => ({ v: o.value, t: o.textContent.trim() })) }))).catch(() => []);
  console.log('SELECTS:', JSON.stringify(selects));
  const body = await page.evaluate(() => document.body.innerText.slice(0, 1800)).catch(() => '');
  console.log('BODY:\n' + body);
  await browser.close();
})();
