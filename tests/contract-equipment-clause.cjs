const assert = require('node:assert/strict');
const {execFileSync} = require('node:child_process');
const {chromium} = require('playwright');

(async () => {
  const browser = await chromium.launch({
    executablePath: process.env.PEC_BROWSER || '/usr/bin/chromium',
    args: ['--no-sandbox']
  });
  try {
    const context = await browser.newContext({serviceWorkers: 'block', viewport: {width: 1440, height: 1000}});
    await context.route('https://**.supabase.co/**', route => route.abort());
    const page = await context.newPage();
    const ready = () => page.waitForFunction(() => document.documentElement.dataset.workspaceReady === 'true');
    await page.goto((process.env.PEC_TEST_URL || 'http://127.0.0.1:8765/') + 'contratos.html');
    await ready();
    await page.locator('#wsNewDocument').click();
    await page.locator('#wsDocumentSteps button').getByText('Cláusulas', {exact: true}).click();

    const toggle = page.getByRole('checkbox', {name: 'Segurança e responsabilidade pelos equipamentos'});
    const section = page.locator('.page-security');
    const rider = page.locator('#outEquipmentClause');
    const assertContinuous = async () => {
      const numbers = await page.locator('.paper .clause h3').evaluateAll(headings =>
        headings.filter(heading => !heading.closest('.hidden'))
          .map(heading => Number(heading.textContent.match(/Cláusula (\d+)ª/)[1]))
      );
      assert.deepEqual(numbers, numbers.map((_, index) => index + 1));
    };
    const pdfPages = async () => {
      const pdf = await page.pdf({preferCSSPageSize: true});
      return execFileSync('pdftotext', ['-layout', '-', '-'], {input: pdf, encoding: 'utf8'})
        .split('\f').slice(0, -1);
    };

    assert.equal(await toggle.isChecked(), false);
    assert.equal(await section.isVisible(), false);
    assert.doesNotMatch(await rider.textContent(), /cláusula específica/);
    await assertContinuous();
    const without = await pdfPages();
    assert(without.some(text => /reserva, cancelamento e remarcação/i.test(text)));
    assert(!without.some(text => /danos e desaparecimento|proteção dos equipamentos/i.test(text)));
    assert(without.every(text => text.trim()), 'PDF contains a blank page');

    await toggle.locator('..').click();
    assert(await toggle.isChecked());
    assert(await section.isVisible());
    assert.match(await rider.textContent(), /cláusula específica/);
    await assertContinuous();
    const withClause = await pdfPages();
    assert(withClause.some(text => /danos e desaparecimento/i.test(text)));
    assert(withClause.length > without.length);
    assert(withClause.every(text => text.trim()), 'PDF contains a blank page');

    await page.locator('#wsSaveDocument').click();
    await page.waitForFunction(() => PM.document.records.length === 1 && !PM.document.dirty);
    const recordId = await page.evaluate(() => PM.document.records[0].id);
    await page.reload();
    await ready();
    assert(await page.locator('#clauseEquipmentSecurity').isChecked());
    await page.locator('#wsNewDocument').click();
    assert.equal(await page.locator('#clauseEquipmentSecurity').isChecked(), false);
    await page.evaluate(id => PM.document.loadRow(id), recordId);
    assert(await page.locator('#clauseEquipmentSecurity').isChecked());
    await page.evaluate(() => PM.document.use({clientName: 'Contrato anterior'}));
    assert(await page.locator('#clauseEquipmentSecurity').isChecked());
    await page.evaluate(() => PM.document.use({clientName: 'Contrato novo', clauseEquipmentSecurity: false}));
    assert.equal(await page.locator('#clauseEquipmentSecurity').isChecked(), false);

    console.log('PASS optional equipment clause, consecutive numbering, both PDF variants, and saved contracts');
  } finally {
    await browser.close();
  }
})().catch(error => { console.error(error); process.exitCode = 1; });
