# Login reservado ao proprietário

A conta autorizada nesta fase é a conta existente e confirmada `contato@djpec.com`. A aplicação usa Supabase Auth; não cria senhas locais ou libera acesso por comparação do e-mail no JavaScript.

## Ativação necessária no Supabase

Não há credencial administrativa do projeto disponível neste ambiente. A migração abaixo foi preparada e testada em PostgreSQL isolado; ainda precisa ser aplicada no projeto remoto.

1. Faça um backup do banco e confirme em **Authentication → Users** que a conta atual do proprietário existe com e-mail confirmado.
2. Abra o SQL Editor do projeto `qmhyeotvbktdilrudwys` e execute o conteúdo completo de [202610270002_restricted_owner_access.sql](../supabase/migrations/202610270002_restricted_owner_access.sql).
3. Em **Authentication**, desative a opção de permitir novos cadastros públicos. A interface não oferece cadastro; a lista de acesso e as políticas no banco também impedem uma conta não autorizada de usar os dados da aplicação, mesmo se ela já existir no Auth.
4. Nas URLs de redirecionamento do Auth, permita `https://agenda.djpec.com/login.html?recuperar=1` para recuperação de senha. Confira o remetente e o envio de e-mail do projeto.
5. Entre em `https://agenda.djpec.com/login.html` com a senha já utilizada pelo proprietário. Não é necessário compartilhar a senha ou qualquer chave secreta com o assistente.

A migração é transacional: se o usuário confirmado não for encontrado, nenhuma alteração é aplicada. Ela não apaga eventos, propostas, contratos, rascunhos ou caches existentes. A lista de acesso admite somente um proprietário nesta fase.

## Comportamento

- Sem sessão válida ou sem autorização no servidor, o painel e os links diretos para agenda, propostas e contratos encaminham ao login.
- As dependências do workspace só carregam depois de `getUser()` e `app_has_access()` confirmarem a permissão. Um JWT inserido manualmente no armazenamento ou um e-mail digitado não libera o acesso.
- Cadastro público não está disponível na UI. Uma conta existente não autorizada também é recusada.
- Sem a migração, indisponibilidade na verificação ou ausência de internet, uma nova abertura do sistema permanece fechada. O proprietário precisa aplicar a configuração acima para entrar. Uma aba já autorizada pode continuar com rascunhos locais quando a conexão cai; gravações remotas seguem as políticas do banco.
- Sair, trocar a conta, restaurar uma página do histórico ou voltar à aba dispara bloqueio/revalidação. A verificação também é renovada enquanto a aba está visível e online.
- O destino após login aceita apenas as telas internas conhecidas, sem redirecionamento para outro domínio.
- O link de recuperação permite atualizar a senha somente para uma sessão validada e autorizada.
- As políticas de RLS são restritivas e mantêm a verificação de propriedade, inclusive se existirem políticas permissivas antigas. Usuários comuns não podem alterar a lista ou truncar as tabelas.

## Limites importantes

GitHub Pages serve arquivos estáticos públicos. A tela de login controla a inicialização da interface; a proteção dos dados depende da migração no Supabase. Isso não transforma HTML/JavaScript, modelos legados ou arquivos já baixados em arquivos privados. Os modelos legados têm configurações fixas anteriores do proprietário; revisar essas configurações e transferi-las para dados privados é parte da preparação comercial.

A implantação desta alteração não presume que a opção de cadastros do Supabase foi alterada, nem que o SQL foi executado remotamente. A assinatura comercial permanece em sua branch separada; este acesso restrito ainda não abre vendas.

## Próximo módulo financeiro confirmado

O escopo solicitado inclui gastos pessoais e profissionais, contas, cartões de crédito, faturas e parcelamentos. Deve distinguir compra no cartão, parcelas previstas, pagamento da fatura e transferências para evitar contar a mesma despesa duas vezes. Os valores deverão usar centavos inteiros, com rateio exato de parcelas e vínculo opcional com eventos. Este documento registra o escopo; esse módulo ainda não foi implementado nesta alteração de acesso.
