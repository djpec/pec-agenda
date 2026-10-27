# Plano mensal de R$ 29,90

A versão comercial está em `feat/subscriptions-29-90`. A cobrança precisa de uma conta de recebimento, migração do banco e publicação das funções. O site atual não deve ser tratado como uma assinatura comercial ativa antes dessas etapas.

## O que foi preparado

- Plano único de **2990 centavos, BRL, renovação mensal**; valor fixo no servidor e no banco.
- `conta.html`: cadastro do negócio, nome, dados de contratação, contatos, logo, situação do plano, contratação e cancelamento da renovação.
- Integração inicial com **Mercado Pago** por checkout hospedado; o site não recebe dados de cartão. A escolha do provedor ainda precisa ser confirmada pelo proprietário.
- Pagamentos aprovados verificáveis por API concedem o período pago. Autorização de recorrência ou retorno do checkout não concedem acesso.
- Webhook com assinatura HMAC, validade temporal e vínculo entre assinatura, cobrança, cliente, valor e moeda.
- Pagamentos idempotentes; revisões antigas não desfazem reembolso posterior. Cancelamento mantém o período pago. Assinaturas antigas continuam vinculadas ao cliente para tratar notificações tardias.
- Migração com RLS por proprietário, mesmo se houver políticas permissivas antigas; tabelas de pagamento não podem ser alteradas pelo navegador.
- Agenda, fila de sincronização e exclusões com cache por conta. Dados antigos são atribuídos apenas ao usuário que os sincronizou ou ao modo local.
- Cadastro comercial usado em novos documentos. Documentos anteriores conservam seus próprios dados e a identidade salva. Os modelos originais continuam intactos.

## Antes de ativar em produção

1. Confirmar o provedor. Para Mercado Pago, concluir o cadastro comercial e a verificação da conta. Obter credenciais de teste primeiro. Não compartilhar tokens em conversas ou colocá-los no repositório.
2. Fazer backup do Supabase e exportar a agenda atual. Conferir quais políticas e privilégios existem nas tabelas `events`, `quotes`, `contracts` e `user_preferences`. Os testes desta branch usam PostgreSQL isolado; não inspecionaram o banco remoto real.
3. Vincular o projeto existente com a CLI Supabase. Revisar e aplicar `supabase/migrations/202610270001_subscription_foundation.sql`. A migração mantém **a exigência de pagamento desativada** para preservar o acesso existente durante a instalação.
4. Cadastrar a conta do proprietário no banco, usando seu UUID de Auth (não um e-mail em código público):

   ```sql
   insert into billing_private.owner_access(user_id) values ('UUID-DO-PROPRIETARIO');
   ```

5. Instalar secrets das funções pelo painel/CLI. Exemplo com arquivo local **fora do repositório**, protegido e contendo os valores reais:

   ```sh
   supabase secrets set --env-file /caminho/privado/pec-billing.env
   supabase functions deploy billing
   supabase functions deploy billing-webhook
   ```

   `APP_URL` deve corresponder exatamente ao domínio público; a API aceita esse Origin. O handler valida a sessão com Supabase Auth. O endpoint de webhook não usa JWT: valida a assinatura do provedor.
6. No painel Mercado Pago, configurar a URL `https://SEU-PROJETO.supabase.co/functions/v1/billing-webhook` para os eventos `subscription_preapproval`, `subscription_authorized_payment` e `payment`. Habilitar a assinatura secreta e configurar o mesmo segredo nas funções. O webhook usa o identificador `data.id` da query, `x-request-id` e `x-signature`.
7. Em ambiente de teste, executar: contratação, autorização sem pagamento, pagamento aprovado, renovação, falha de cobrança, cancelamento, reembolso, chargeback, repetição/reordenação de eventos e nova assinatura após cancelamento. Verificar o formato real das respostas e das notificações da conta Mercado Pago antes de habilitar cobranças reais. Não considerar os mocks como homologação do provedor.
8. Publicar a branch somente após a configuração. Ajustar URLs de confirmação de e-mail no Supabase Auth, serviço de envio de e-mails, recuperação de senha, domínio e os dados reais do vendedor para suporte, termos de uso e política de privacidade. Estes documentos jurídicos não são inventados pela aplicação.
9. Conferir o acesso do proprietário e ativar a exigência de pagamento:

   ```sql
   update billing_private.settings set enforce_subscriptions=true where singleton;
   ```

   Usuários sem período pago não podem criar/alterar registros na nuvem. Leitura, exportação e exclusão dos próprios dados permanecem possíveis. Os rascunhos locais são preservados, inclusive durante falhas de conexão; a proteção comercial autoritativa fica no banco.

## Operação

- Acompanhar falhas e reenvios de webhooks no provedor e logs das funções (sem tokens, dados de cartão ou payloads com dados pessoais em logs).
- A UI permite atualizar o estado registrado no banco; não inventa confirmação por redirecionamento. Se uma notificação não chegar, reenviar pelo provedor e conferir os registros de pagamento.
- Antes de abrir vendas, configurar backups e testar restauração, recuperação de conta, limites de tamanho de logos/documentos e uso do plano Supabase. Não prometer armazenamento ou uso ilimitado sem dimensionamento.
- Preço de R$ 29,90 não desconta automaticamente taxas do gateway, tributos ou custos de infraestrutura. O titular precisa configurar as obrigações fiscais aplicáveis.

## Verificações reproduzíveis

Dependências de QA ficam fora da aplicação estática:

```sh
npm install --prefix /tmp/pec-tools --cache /tmp/pec-npm-cache playwright@1.62.1 @electric-sql/pglite
node --test tests/billing-rules.mjs
NODE_PATH=/tmp/pec-tools/node_modules node tests/subscription-rls.cjs
NODE_PATH=/tmp/pec-tools/node_modules PEC_BROWSER=/usr/bin/chromium PEC_TEST_URL=http://127.0.0.1:8768/ node tests/subscription-ui.cjs
NODE_PATH=/tmp/pec-tools/node_modules PEC_BROWSER=/usr/bin/chromium PEC_TEST_URL=http://127.0.0.1:8768/ node tests/workspace.cjs
```

Os testes não criam cobranças reais nem alteram contas no Supabase remoto.
