const assert = require('node:assert/strict');
const {execFileSync} = require('node:child_process');
const {chromium} = require('playwright');

const base = process.env.PEC_TEST_URL || 'http://127.0.0.1:8765/';
const png = Buffer.from('iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mP8/x8AAwMCAO+aRb8AAAAASUVORK5CYII=', 'base64');

(async () => {
  const browser = await chromium.launch({
    executablePath: process.env.PEC_BROWSER || '/usr/bin/chromium',
    args: ['--no-sandbox']
  });
  try {
    const context = await browser.newContext({serviceWorkers: 'block'});
    await context.route('https://**.supabase.co/**', route => route.abort());
    const page = await context.newPage();
    await page.goto(base + 'financeiro.html');
    await page.waitForFunction(() => document.documentElement.dataset.workspaceReady === 'true');
    await page.evaluate(async () => {
      const {openLocalStore} = await import('./finance/local-store.js');
      const store = await openLocalStore();
      await store.change(state => {
        const accountId = crypto.randomUUID();
        state.accounts.push({id: accountId, name: 'Conta de teste', opening: 0});
        for (const [description, scope, paidOn] of [
          ['Cachê do evento', 'work', '2026-01-06'],
          ['Receita pendente', 'work', null],
          ['Receita pessoal', 'personal', '2026-01-06']
        ]) {
          state.entries.push({
            id: crypto.randomUUID(), kind: 'income', description, scope, paidOn,
            accountId, date: '2026-01-05', category: 'Cachês', amount: 125025
          });
        }
        return state;
      });
    });
    await page.getByRole('link', {name: 'Recibos', exact: true}).click();
    await page.getByRole('heading', {name: 'Recibos', exact: true}).waitFor();
    assert.equal(await page.locator('.ws-nav [aria-current=page]').innerText(), 'Recibos');
    const source = page.locator('[name=source]');
    await page.waitForFunction(() => document.querySelector('[name=source]').length === 2);
    assert.match(await source.innerText(), /Cachê do evento/);
    assert.doesNotMatch(await source.innerText(), /Receita pendente|Receita pessoal/);
    await source.selectOption({index: 1});
    assert.equal(await page.locator('[name=amount]').inputValue(), '1250,25');
    assert.equal(await page.locator('[name=paidOn]').inputValue(), '2026-01-06');
    assert.equal(await page.locator('[name=reference]').inputValue(), 'Cachê do evento');
    assert(await page.locator('[name=amount]').getAttribute('readonly') !== null);
    await source.selectOption('');
    await page.locator('[name=amount]').fill('0');
    await page.locator('[name=payer]').fill('Empresa & Eventos Ltda.');
    await page.locator('[name=payerDocument]').fill('12.345.678/0001-90');
    await page.locator('[name=issuer]').fill('DJ PEC');
    await page.locator('[name=method]').selectOption('Pix');
    await page.locator('#receiptExport').click();
    await page.getByRole('alert').getByText('Confira os nomes', {exact: false}).waitFor();
    await source.selectOption({index: 1});
    const signature = page.locator('[name=signature]');
    await signature.setInputFiles({name: 'inválida.png', mimeType: 'image/png', buffer: Buffer.from('test')});
    await page.getByRole('alert').getByText('Não foi possível abrir', {exact: false}).waitFor();
    await signature.setInputFiles({name: 'assinatura.png', mimeType: 'image/png', buffer: png});
    await page.locator('#receiptPreview img[alt="Assinatura do emitente"]').waitFor();
    await page.setViewportSize({width: 320, height: 800});
    assert(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth));
    const originalTitle = await page.title();
    await page.evaluate(() => { window.print = () => { window.receiptPrintTitle = document.title; }; });
    await page.locator('#receiptExport').click();
    assert.equal(await page.evaluate(() => window.receiptPrintTitle), 'Recibo - Empresa & Eventos Ltda');
    assert(await page.locator('body').evaluate(body => body.classList.contains('printing-receipt')));
    const pdf = await page.pdf({preferCSSPageSize: true});
    const printable = execFileSync('pdftotext', ['-layout', '-', '-'], {input: pdf, encoding: 'utf8'});
    assert.equal((printable.match(/\f/g) || []).length, 1);
    for (const label of ['Recibo de pagamento', 'Empresa & Eventos Ltda.', '12.345.678/0001-90', '1.250,25', '06/01/2026', 'Cachê do evento', 'Pix', 'DJ PEC']) {
      assert(printable.includes(label), printable);
    }
    assert(!printable.includes('Novo recibo'));
    await page.evaluate(() => dispatchEvent(new Event('afterprint')));
    assert.equal(await page.locator('#receiptPrintSheet').innerHTML(), '');
    assert.equal(await page.title(), originalTitle);
    await source.selectOption('');
    await page.getByLabel('Data de emissão', {exact: true}).fill('2099-11-19');
    await page.getByLabel('Data prevista do pagamento', {exact: true}).fill('2099-11-24');
    await page.locator('[name=payer]').fill('Produções / Eventos: Paraná');
    await page.locator('#receiptExport').click();
    assert.equal(await page.evaluate(() => window.receiptPrintTitle), 'Recibo - Produções Eventos Paraná');
    const futurePdf = execFileSync('pdftotext', ['-layout', '-', '-'], {input: await page.pdf({preferCSSPageSize: true}), encoding: 'utf8'});
    assert.match(futurePdf, /Data de emissão:\s+19\/11\/2099/);
    assert.match(futurePdf, /Data prevista do pagamento/);
    assert.match(futurePdf, /24\/11\/2099/);
    console.log('PASS receipt navigation, intake, signature, mobile layout, and single-page PDF');
  } finally {
    await browser.close();
  }
})().catch(error => { console.error(error); process.exitCode = 1; });
