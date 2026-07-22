// Faz login no app e salva a sessão em state.json (reusada pelos outros scripts).
// Defaults = seed afl-teste (admin@aflteste.com.br / 1611). Sobrescreva por env:
//   APP_EMAIL, APP_PASS, APP_EMAIL_SEL, APP_PASS_SEL, APP_LOGIN_BTN, APP_LOGIN_PATH
const { CFG, launch, newPage } = require('./pw');

(async () => {
  const email = process.env.APP_EMAIL || 'admin@aflteste.com.br';
  const pass = process.env.APP_PASS || '1611';
  const emailSel = process.env.APP_EMAIL_SEL || '#email';
  const passSel = process.env.APP_PASS_SEL || '#loginPassword';
  const loginBtn = process.env.APP_LOGIN_BTN || 'button:has-text("Login")';
  const loginPath = process.env.APP_LOGIN_PATH || '/login';

  const browser = await launch();
  const { ctx, page } = await newPage(browser, false);
  await page.goto(CFG.base + loginPath, { waitUntil: 'networkidle', timeout: 60000 });
  await page.fill(emailSel, email);
  await page.fill(passSel, pass);
  await page.click(loginBtn);
  await page.waitForURL((u) => !u.toString().includes(loginPath), { timeout: 30000 }).catch(() => {});
  await page.waitForTimeout(3000);
  await ctx.storageState({ path: CFG.state });
  console.log('login OK ->', page.url(), '| state salvo em', CFG.state);
  await browser.close();
})();
