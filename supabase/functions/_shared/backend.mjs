import{PRICE_CENTS,CURRENCY,checkoutURL,validSignature,validateSubscription,approvedPayment}from'./payment.mjs';
export function createBackend(env,fetcher=fetch){
 const get=name=>env(name)||'';const app=new URL(get('APP_URL')||'https://agenda.djpec.com');
 const headers={'Content-Type':'application/json','Cache-Control':'no-store'};
 const response=(status,data,cors={})=>new Response(JSON.stringify(data),{status,headers:{...headers,...cors}});
 async function db(path,method='GET',data,merge=false){const key=get('SUPABASE_SERVICE_ROLE_KEY');if(!key)throw new Error('Backend not configured');const r=await fetcher(get('SUPABASE_URL')+'/rest/v1/'+path,{method,headers:{apikey:key,Authorization:'Bearer '+key,'Content-Type':'application/json',Prefer:(merge?'resolution=merge-duplicates,':'')+'return=representation'},body:data===undefined?undefined:JSON.stringify(data)});if(!r.ok)throw new Error('Database unavailable');return r.status===204?null:r.json()}
 async function mp(path,method='GET',data,reference){const token=get('MERCADOPAGO_ACCESS_TOKEN');if(!token)throw new Error('Payments not configured');const r=await fetcher('https://api.mercadopago.com'+path,{method,headers:{Authorization:'Bearer '+token,'Content-Type':'application/json',...(reference?{'X-Idempotency-Key':reference}:{})},body:data===undefined?undefined:JSON.stringify(data)});if(!r.ok)throw new Error('Payment provider unavailable');return r.json()}
 async function user(req){const authorization=req.headers.get('authorization');if(!/^Bearer \S+$/i.test(authorization||''))return null;const r=await fetcher(get('SUPABASE_URL')+'/auth/v1/user',{headers:{apikey:get('SUPABASE_ANON_KEY'),Authorization:authorization}});if(!r.ok)return null;const u=await r.json();return u.id&&u.email&&u.email_confirmed_at?u:null}
 async function subscription(id){return(await db('billing_subscriptions?user_id=eq.'+encodeURIComponent(id)+'&select=*'))?.[0]}
 async function syncSubscription(s){
  if(!validateSubscription(s))throw new Error('Unexpected plan');
  let mapping=(await db('billing_provider_subscriptions?provider_id=eq.'+encodeURIComponent(s.id)+'&select=*'))?.[0];
  const current=(await db('billing_subscriptions?external_reference=eq.'+encodeURIComponent(s.external_reference)+'&select=*'))?.[0];
  if(mapping&&mapping.external_reference!==s.external_reference)throw new Error('Subscription mismatch');
  if(!mapping){if(!current||current.provider_id&&current.provider_id!==s.id)return null;mapping={provider_id:s.id,external_reference:s.external_reference,user_id:current.user_id};await db('billing_provider_subscriptions?on_conflict=provider_id','POST',mapping,true)}
  if(!['pending','authorized','paused','cancelled'].includes(s.status))throw new Error('Unexpected subscription status');
  const modified=new Date(s.last_modified||s.date_created);if(!Number.isFinite(+modified))throw new Error('Missing provider revision');
  if(current){const filters=new URLSearchParams({user_id:'eq.'+mapping.user_id,external_reference:'eq.'+s.external_reference,or:`(provider_updated_at.is.null,provider_updated_at.${s.status==='cancelled'?'lte':'lt'}.${modified.toISOString()})`});await db('billing_subscriptions?'+filters,'PATCH',{provider_id:s.id,status:s.status,provider_updated_at:modified.toISOString(),updated_at:new Date().toISOString()})}
  return mapping;
 }
 async function checkout(account){
  const claim=await db('rpc/billing_begin_checkout','POST',{account:account.id});
  if(claim.active)return{status:409,message:'Sua assinatura já está ativa.'};if(claim.existing)return{status:409,message:'Você já possui uma assinatura. Consulte o pagamento na sua conta Mercado Pago.'};if(claim.busy)return{status:409,message:'Sua assinatura está sendo preparada. Aguarde alguns instantes e tente novamente.'};if(claim.url)return{status:200,url:checkoutURL(claim.url)};
  const s=await mp('/preapproval','POST',{reason:'pec Manager · Plano mensal',external_reference:claim.reference,payer_email:account.email,auto_recurring:{frequency:1,frequency_type:'months',transaction_amount:PRICE_CENTS/100,currency_id:CURRENCY},back_url:app.origin+'/conta.html?pagamento=retorno',status:'pending'},claim.reference);
  if(!s.id||!validateSubscription(s))throw new Error('Unexpected checkout');const url=checkoutURL(s.init_point);
  await db('billing_provider_subscriptions?on_conflict=provider_id','POST',{provider_id:s.id,external_reference:claim.reference,user_id:account.id},true);
  await db('billing_subscriptions?user_id=eq.'+account.id+'&external_reference=eq.'+claim.reference,'PATCH',{provider_id:s.id,checkout_url:url,checkout_lock_until:null,updated_at:new Date().toISOString()});return{status:200,url};
 }
 async function cancel(account){const row=await subscription(account.id);if(!row?.provider_id)return{status:409,message:'Nenhuma assinatura encontrada.'};const remote=await mp('/preapproval/'+encodeURIComponent(row.provider_id));if(remote.external_reference!==row.external_reference)throw new Error('Subscription mismatch');if(remote.status!=='cancelled')await mp('/preapproval/'+encodeURIComponent(row.provider_id),'PUT',{status:'cancelled'});await syncSubscription(await mp('/preapproval/'+encodeURIComponent(row.provider_id)));return{status:200,message:'Renovação cancelada. O período já pago permanece disponível.'}}
 return{
  async api(req){const origin=req.headers.get('origin'),cors=origin===app.origin?{'Access-Control-Allow-Origin':origin,'Vary':'Origin','Access-Control-Allow-Headers':'authorization, apikey, content-type, x-client-info','Access-Control-Allow-Methods':'POST, OPTIONS'}:{};if(origin!==app.origin)return response(403,{message:'Origem não permitida.'});if(req.method==='OPTIONS')return new Response(null,{status:204,headers:cors});if(req.method!=='POST')return response(405,{message:'Método não permitido.'},cors);
   try{const account=await user(req);if(!account)return response(401,{message:'Entre com uma conta confirmada para continuar.'},cors);const body=await req.json();if(!get('MERCADOPAGO_ACCESS_TOKEN'))return response(503,{message:'As assinaturas ainda não estão disponíveis. Tente novamente mais tarde.'},cors);if(body.action==='checkout'){const{status,...data}=await checkout(account);return response(status,data,cors)}if(body.action==='cancel'){const{status,...data}=await cancel(account);return response(status,data,cors)}return response(400,{message:'Ação inválida.'},cors)}catch{return response(502,{message:'Não foi possível concluir agora. Tente novamente em alguns instantes.'},cors)}
  },
  async webhook(req){if(req.method!=='POST')return response(405,{});try{
   const url=new URL(req.url),id=url.searchParams.get('data.id');if(!await validSignature(get('MERCADOPAGO_WEBHOOK_SECRET'),req.headers.get('x-signature'),req.headers.get('x-request-id'),id))return response(401,{});
   const event=await req.json();if(String(event.data?.id)!==id)return response(400,{});
   if(event.type==='subscription_preapproval'){await syncSubscription(await mp('/preapproval/'+encodeURIComponent(id)));return response(200,{received:true})}
   if(event.type==='subscription_authorized_payment'){
    const invoice=await mp('/authorized_payments/'+encodeURIComponent(id));if(!invoice.payment?.id)return response(200,{received:true});const remote=await mp('/preapproval/'+encodeURIComponent(invoice.preapproval_id)),row=await syncSubscription(remote);if(!row)return response(200,{received:true});
    const payment=await mp('/v1/payments/'+encodeURIComponent(invoice.payment.id));if(!payment.date_approved)return response(200,{received:true});const record=approvedPayment(invoice,payment,remote);await db('rpc/billing_apply_payment','POST',{account:row.user_id,record});return response(200,{received:true});
   }
   if(event.type==='payment'){
    const records=await db('billing_payments?payment_id=eq.'+encodeURIComponent(id)+'&select=*');if(!records?.length)return response(200,{received:true});const record=records[0],payment=await mp('/v1/payments/'+encodeURIComponent(id));if(centsAmount(payment.transaction_amount)!==PRICE_CENTS||payment.currency_id!==CURRENCY)throw new Error('Payment mismatch');await db('rpc/billing_apply_payment','POST',{account:record.user_id,record:{...record,status:payment.status,provider_updated_at:payment.date_last_updated}});return response(200,{received:true});
   }
   return response(200,{received:true});
  }catch{return response(503,{received:false})}}
 };
}
const centsAmount=value=>Math.round(Number(value)*100);
