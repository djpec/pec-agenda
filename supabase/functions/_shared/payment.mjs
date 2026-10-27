// Server-only Mercado Pago subscription rules. The browser never chooses the price or account.
export const PRICE_CENTS=2990;
export const CURRENCY='BRL';
export function cents(value){const n=Number(value);return Number.isFinite(n)?Math.round(n*100):NaN}
export function monthlyPeriod(date){const d=new Date(date);if(!Number.isFinite(+d))throw new Error('Invalid billing date');const day=d.getUTCDate();d.setUTCDate(1);d.setUTCMonth(d.getUTCMonth()+1);const last=new Date(Date.UTC(d.getUTCFullYear(),d.getUTCMonth()+1,0)).getUTCDate();d.setUTCDate(Math.min(day,last));return d.toISOString()}
export function validateSubscription(s){return s&&cents(s.auto_recurring?.transaction_amount)===PRICE_CENTS&&s.auto_recurring?.currency_id===CURRENCY&&s.auto_recurring?.frequency===1&&s.auto_recurring?.frequency_type==='months'&&typeof s.external_reference==='string'}
export function checkoutURL(value){const u=new URL(value);if(u.protocol!=='https:'||!['www.mercadopago.com.br','www.mercadopago.com','www.mercadopago.com.ar'].includes(u.hostname))throw new Error('Invalid payment redirect');return u.href}
export async function validSignature(secret,signature,requestId,id,now=Date.now()){
 if(!secret||!signature||!requestId||!id)return false;
 const parts=Object.fromEntries(signature.split(',').map(v=>v.trim().split('=')));const ts=parts.ts,expected=parts.v1;
 if(!/^\d+$/.test(ts||'')||!/^[a-f0-9]{64}$/i.test(expected||'')||Math.abs(now-Number(ts)*(ts.length>10?1:1000))>300000)return false;
 const key=await crypto.subtle.importKey('raw',new TextEncoder().encode(secret),{name:'HMAC',hash:'SHA-256'},false,['sign']);
 const data=`id:${String(id).toLowerCase()};request-id:${requestId};ts:${ts};`;
 const hash=new Uint8Array(await crypto.subtle.sign('HMAC',key,new TextEncoder().encode(data)));const actual=Array.from(hash,b=>b.toString(16).padStart(2,'0')).join('');let difference=0;for(let i=0;i<64;i++)difference|=actual.charCodeAt(i)^expected.toLowerCase().charCodeAt(i);return difference===0;
}
export function approvedPayment(invoice,payment,subscription){
 if(!validateSubscription(subscription)||invoice.preapproval_id!==subscription.id||invoice.external_reference!==subscription.external_reference||String(invoice.payment?.id)!==String(payment.id)||cents(invoice.transaction_amount)!==PRICE_CENTS||invoice.currency_id!==CURRENCY||cents(payment.transaction_amount)!==PRICE_CENTS||payment.currency_id!==CURRENCY)throw new Error('Payment does not match the subscription');
 return {payment_id:String(payment.id),authorized_payment_id:String(invoice.id),status:payment.status,amount_cents:PRICE_CENTS,currency:CURRENCY,approved_at:payment.date_approved,covered_until:monthlyPeriod(invoice.debit_date),provider_updated_at:payment.date_last_updated};
}
