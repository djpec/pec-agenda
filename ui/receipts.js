import {$, esc, formatDate, icon} from './core.js';
import './shell.js?v=29';
import {cents, today, uid, validDate} from '../finance/model.mjs';
import {openStore} from '../finance/store.js';

const issuedOn = today();
const money = new Intl.NumberFormat('pt-BR', {style: 'currency', currency: 'BRL'});
const displayDate = value => validDate(value) ? formatDate(value, {day: '2-digit', month: '2-digit', year: 'numeric'}) : '—';
const methods = ['Pix', 'Transferência bancária', 'Dinheiro', 'Cartão', 'Boleto', 'Outro'];
const main = $('#workspace');
main.innerHTML = `
  <section class="ws-heading"><div><h1>Recibos</h1><p>Emita comprovantes de pagamento para seus clientes.</p></div></section>
  <div class="receipt-layout">
    <section class="ws-panel">
      <div class="ws-panel-heading"><h2>Novo recibo</h2></div>
      <form id="receiptForm" class="receipt-form">
        <label class="receipt-wide">Lançamento do Financeiro
          <select name="source"><option value="">Preencher manualmente</option></select>
        </label>
        <p class="receipt-help receipt-wide" id="receiptSourceStatus" role="status">Buscando receitas profissionais recebidas…</p>
        <label class="receipt-wide">Cliente ou razão social <input name="payer" required maxlength="150"></label>
        <label>CPF ou CNPJ do cliente <input name="payerDocument" maxlength="18"></label>
        <label>Valor recebido (R$) <input name="amount" required inputmode="decimal" maxlength="14" placeholder="0,00"></label>
        <label>Data do pagamento <input name="paidOn" type="date" required min="2000-01-01" max="${issuedOn}" value="${issuedOn}"></label>
        <label>Forma de pagamento <select name="method" required><option value="">Selecione</option>${methods.map(method => `<option>${method}</option>`).join('')}</select></label>
        <label class="receipt-wide">Referente a <textarea name="reference" required maxlength="240" rows="2"></textarea></label>
        <label>Nome ou razão social do emitente <input name="issuer" required maxlength="150"></label>
        <label>CPF ou CNPJ do emitente <input name="issuerDocument" maxlength="18"></label>
        <label class="receipt-wide">Imagem da assinatura (opcional)
          <input name="signature" type="file" accept="image/png,image/jpeg" aria-describedby="receiptSignatureHelp">
        </label>
        <p id="receiptSignatureHelp" class="receipt-help receipt-wide">Use PNG ou JPG de até 2 MB. Você também pode salvar o PDF e assinar depois.</p>
        <p id="receiptError" class="receipt-error receipt-wide" role="alert"></p>
        <button id="receiptExport" class="ws-button receipt-wide">${icon('download')} Salvar como PDF</button>
      </form>
    </section>
    <section class="receipt-preview" aria-label="Prévia do recibo">
      <h2>Prévia</h2><div id="receiptPreview"></div>
    </section>
  </div>`;

const form = $('#receiptForm');
const fields = form.elements;
const preview = $('#receiptPreview');
const error = $('#receiptError');
const printSheet = document.createElement('div');
printSheet.id = 'receiptPrintSheet';
document.body.append(printSheet);
const manualId = uid();
let signatureUrl = '';
let entries = [];

function receiptData() {
  const data = Object.fromEntries(new FormData(form));
  const linked = entries.find(entry => entry.id === data.source);
  let amount = 0;
  try { amount = linked?.amount ?? cents(data.amount); } catch {}
  return {
    ...data,
    amount,
    paidOn: linked?.paidOn ?? data.paidOn,
    number: 'REC-' + (linked?.id ?? manualId).replaceAll('-', '').slice(0, 16).toUpperCase(),
    reference: data.reference.trim().replace(/\s+/g, ' '),
    payer: data.payer.trim(),
    issuer: data.issuer.trim()
  };
}

function documentMarkup(data) {
  const value = data.amount > 0 ? money.format(data.amount / 100) : 'R$ —';
  const payer = esc(data.payer || 'Nome do cliente');
  const issuer = esc(data.issuer || 'Nome do emitente');
  const documentLine = value => value.trim() ? `<small>CPF/CNPJ · ${esc(value.trim())}</small>` : '';
  return `<article class="receipt-paper">
    <header class="receipt-paper-header">
      <div class="receipt-masthead">
        <img class="receipt-brand" src="./assets/brand/pec-logo-white.svg" alt="pec" width="76" height="30">
        <div class="receipt-number"><small>Número do recibo</small><strong>${data.number}</strong></div>
      </div>
      <h2>Recibo de pagamento</h2>
      <p class="receipt-issued">Emitido em ${displayDate(issuedOn)}</p>
    </header>
    <div class="receipt-paper-body">
      <div class="receipt-amount"><small>Valor recebido</small><strong>${value}</strong></div>
      <p class="receipt-statement">Confirmo o recebimento do valor acima, pago por <b>${payer}</b>${data.payerDocument.trim() ? ` (CPF/CNPJ ${esc(data.payerDocument.trim())})` : ''}, pelo serviço ou referência abaixo.</p>
      <dl class="receipt-details">
        <div><dt>Data do pagamento</dt><dd>${displayDate(data.paidOn)}</dd></div>
        <div><dt>Forma de pagamento</dt><dd>${esc(data.method || '—')}</dd></div>
        <div class="receipt-wide"><dt>Referente a</dt><dd>${esc(data.reference || 'Descrição do serviço ou pedido')}</dd></div>
      </dl>
      <footer class="receipt-signed">
        <div class="receipt-signature">${signatureUrl ? `<img src="${signatureUrl}" alt="Assinatura do emitente">` : ''}</div>
        <strong>${issuer}</strong>
        ${documentLine(data.issuerDocument)}
        <small>Assinatura do emitente</small>
      </footer>
    </div>
  </article>`;
}

function renderPreview() {
  preview.innerHTML = documentMarkup(receiptData());
}

fields.source.addEventListener('change', () => {
  const entry = entries.find(item => item.id === fields.source.value);
  fields.amount.readOnly = fields.paidOn.readOnly = Boolean(entry);
  if (entry) {
    fields.amount.value = (entry.amount / 100).toFixed(2).replace('.', ',');
    fields.paidOn.value = entry.paidOn;
    fields.reference.value = entry.description;
  }
  renderPreview();
});

form.addEventListener('input', () => {
  error.textContent = '';
  renderPreview();
});

fields.signature.addEventListener('change', async () => {
  const file = fields.signature.files[0];
  if (signatureUrl) URL.revokeObjectURL(signatureUrl);
  signatureUrl = '';
  renderPreview();
  const exportButton = $('#receiptExport');
  exportButton.disabled = Boolean(file);
  if (!file) return;
  let url;
  try {
    if (!['image/png', 'image/jpeg'].includes(file.type) || file.size > 2 * 1024 * 1024) {
      throw Error('Escolha uma imagem PNG ou JPG de até 2 MB.');
    }
    url = URL.createObjectURL(file);
    const image = new Image();
    image.src = url;
    await image.decode();
    if (fields.signature.files[0] !== file) return;
    signatureUrl = url;
    renderPreview();
  } catch (reason) {
    if (fields.signature.files[0] === file) {
      error.textContent = reason.message === 'Escolha uma imagem PNG ou JPG de até 2 MB.'
        ? reason.message : 'Não foi possível abrir a imagem da assinatura.';
      fields.signature.value = '';
    }
  } finally {
    if (url && url !== signatureUrl) URL.revokeObjectURL(url);
    if (!fields.signature.files.length || fields.signature.files[0] === file) exportButton.disabled = false;
  }
});

let titleBeforePrint = null;
form.addEventListener('submit', event => {
  event.preventDefault();
  const data = receiptData();
  if (!data.payer || !data.issuer || !data.reference || !data.amount || !validDate(data.paidOn) || data.paidOn > issuedOn) {
    error.textContent = 'Confira os nomes, a referência, a data e o valor recebido. Digite o valor no formato 1200,50.';
    return;
  }
  printSheet.innerHTML = documentMarkup(data);
  document.body.classList.add('printing-receipt');
  titleBeforePrint ??= document.title;
  document.title = PM.documentFilename('receipt', data.payer);
  window.print();
});

addEventListener('afterprint', () => {
  document.body.classList.remove('printing-receipt');
  printSheet.replaceChildren();
  if (titleBeforePrint !== null) {
    document.title = titleBeforePrint;
    titleBeforePrint = null;
  }
});

renderPreview();
document.documentElement.dataset.workspaceReady = 'true';

async function loadSources() {
  const status = $('#receiptSourceStatus');
  try {
    const store = await openStore();
    if (!store.ready) throw Error();
    entries = store.state.entries
      .filter(entry => entry.kind === 'income' && entry.scope === 'work' && entry.paidOn && entry.paidOn <= issuedOn)
      .sort((first, second) => second.paidOn.localeCompare(first.paidOn));
    for (const entry of entries) {
      fields.source.add(new Option(
        `${displayDate(entry.paidOn)} · ${entry.description} · ${money.format(entry.amount / 100)}`, entry.id
      ));
    }
    status.textContent = entries.length ? '' : 'Nenhuma receita profissional recebida. Você pode preencher manualmente.';
  } catch {
    status.textContent = 'Financeiro indisponível. Você pode preencher manualmente.';
  }
}

loadSources();
