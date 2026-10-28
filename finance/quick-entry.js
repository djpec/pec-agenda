import {firstInvoice,split} from './model.mjs';
// Keep the common entry on one compact surface. Extra controls only appear when needed.
export function mountQuickEntry({form,state,input,select,scopeField,categoryField,amountField,dueField}){
 const sources=[...state.accounts.map(a=>['account:'+a.id,a.name]),...state.cards.map(c=>['card:'+c.id,c.name+' · crédito'])];
 const hidden=(name,value)=>`<input type="hidden" name="${name}" value="${value}">`;
 form.querySelector('#financeFields').innerHTML=`<div class="fin-quick-types" aria-label="Tipo de lançamento"><button type="button" data-quick-kind="expense" aria-pressed="true">Despesa</button><button type="button" data-quick-kind="income" aria-pressed="false">Receita</button><button type="button" data-quick-transfer>Transferir</button></div>${hidden('kind','expense')}${hidden('accountId',state.accounts[0]?.id||'')}${hidden('cardId','')}${hidden('repeat','1')}${hidden('installments','1')}
 <div class="fin-quick-description">${input('Descrição','description','text','','required maxlength="180" placeholder="Ex.: Mercado, cachê, equipamento…"')}</div>
 ${amountField('Valor (R$)')}${dueField('Data')}
 ${select('Conta ou cartão','source',sources)}${categoryField()}
 <div class="fin-quick-status">${scopeField()}<label class="fin-paid-switch"><input type="checkbox" name="paid" value="yes"><span class="fin-switch" aria-hidden="true"></span><span id="financePaidLabel">Já pago</span></label></div>
 <div class="fin-quick-repeat"><span class="fin-small-label">Como lançar</span><div class="fin-repeat-options" role="group" aria-label="Repetição"><button type="button" data-repetition="single" aria-pressed="true">Único</button><button type="button" data-repetition="fixed" aria-pressed="false">Fixo mensal</button><button type="button" data-repetition="installments" aria-pressed="false">Parcelado</button></div>${hidden('schedule','single')}</div>
 <div id="financeQuickCount">${input('Quantidade','quantity','number','2','min="2" max="120" step="1" required')}</div><div id="financeQuickDue">${dueField('Primeira fatura','firstDue')}</div><p id="financeQuickSummary" class="fin-quick-summary" role="status"></p>`;
 const f=form.elements;let type='expense',schedule='single',previousSource=f.source.value;
 const money=n=>(n/100).toLocaleString('pt-BR',{style:'currency',currency:'BRL'});
 function update(resetDue=false){
  let card=f.source.value.startsWith('card:');if(type==='income'&&card){f.source.value='account:'+state.accounts[0].id;card=false}
  const id=f.source.value.split(':')[1];f.kind.value=card?'card':type;f.accountId.value=card?'':id;f.cardId.value=card?id:'';
  for(const o of f.source.options)o.disabled=type==='income'&&o.value.startsWith('card:');
  f.paid.disabled=card;if(card)f.paid.checked=false;document.getElementById('financePaidLabel').textContent=card?'Na fatura':type==='income'?'Já recebido':'Já pago';
  document.getElementById('financeTitle').textContent=type==='income'?'Nova receita':card?'Compra no cartão':'Nova despesa';
  document.getElementById('financeQuickCount').hidden=schedule==='single';f.quantity.disabled=schedule==='single';f.quantity.max=schedule==='fixed'?'60':'120';
  f.quantity.closest('.ws-field').querySelector('label').textContent=schedule==='fixed'?'Quantos meses':'Número de parcelas';
  document.getElementById('financeQuickDue').hidden=!card;f.firstDue.disabled=!card;
  if(card&&resetDue){const c=state.cards.find(c=>c.id===id);if(f.date.value)f.firstDue.value=firstInvoice(f.date.value,c)}
  f.repeat.value=schedule==='fixed'?f.quantity.value:'1';f.installments.value=schedule==='installments'?f.quantity.value:'1';f.schedule.value=schedule;
  document.getElementById('financeQuickCount').classList.toggle('is-wide',!card);document.getElementById('financeQuickDue').classList.toggle('is-wide',schedule==='single');
  const n=schedule==='single'?1:Number(f.quantity.value);let note=card?'Confira o vencimento da primeira fatura.':'Pronto para salvar.';
  const raw=f.amount.value.trim();if(/^\d+(?:,\d{1,2})?$/.test(raw)&&n>=1&&n<=120){const [a,b='']=raw.split(','),total=Number(a)*100+Number(b.padEnd(2,'0'));if(total>0){if(schedule==='installments'){try{const parts=split(total,n);note=`${n} parcelas de ${money(parts[0])}${parts.at(-1)!==parts[0]?' a '+money(parts.at(-1)):''} · total ${money(total)}.`}catch{note='Cada parcela precisa ter pelo menos R$ 0,01.'}}else if(schedule==='fixed')note=`${n} lançamentos mensais de ${money(total)}. Os próximos ficam pendentes.`;else note=card?'Compra de '+money(total)+' na fatura.':(f.paid.checked?'Baixa registrada na data informada.':'Pendente até você confirmar a baixa.')}}
  document.getElementById('financeQuickSummary').textContent=note;
 }
 for(const button of form.querySelectorAll('[data-quick-kind]'))button.onclick=()=>{type=button.dataset.quickKind;for(const b of form.querySelectorAll('[data-quick-kind]'))b.setAttribute('aria-pressed',String(b===button));f.category.value=type==='income'?'Cachês':'Outros';update()};
 for(const button of form.querySelectorAll('[data-repetition]'))button.onclick=()=>{schedule=button.dataset.repetition;for(const b of form.querySelectorAll('[data-repetition]'))b.setAttribute('aria-pressed',String(b===button));if(schedule==='fixed'&&Number(f.quantity.value)>60)f.quantity.value='12';update()};
 f.source.onchange=()=>{const changed=f.source.value!==previousSource;previousSource=f.source.value;update(changed)};f.date.onchange=()=>update(true);f.quantity.oninput=()=>update();f.amount.oninput=()=>update();f.paid.onchange=()=>update();f.category.value='Outros';update();
 return form.querySelector('[data-quick-transfer]');
}
