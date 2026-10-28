# Financeiro · Agenda do Artista

Primeira versão: receitas e despesas pessoais/profissionais, contas com saldo inicial positivo ou negativo, transferências, categorias, baixas, repetições mensais finitas, cartões, compras parceladas, faturas e pagamento de fatura. Acesso em `financeiro.html`, pelo menu Financeiro.

## Ativação no Supabase

1. Confirme que a conta verificada `contato@djpec.com` existe em Authentication. A senha é a da conta existente; nunca foi criada nem definida pelo desenvolvimento. Se necessário, use a recuperação de senha no login. Verifique a URL de recuperação e envio de e-mails conforme `ACESSO-RESTRITO.md`.
2. Aplique primeiro `supabase/migrations/202610270002_restricted_owner_access.sql` no SQL Editor do projeto `qmhyeotvbktdilrudwys`, se ainda não aplicou.
3. Execute `supabase/migrations/202610280001_finance_workspace.sql` no mesmo SQL Editor.
4. Entre no sistema e abra Financeiro. Cadastre uma conta com o saldo anterior aos lançamentos que serão cadastrados. Cadastre os cartões por apelido (nunca número, código de segurança ou senha).

O código não aplica SQL remotamente. Sem a primeira migração, o login permanece fechado. Sem a segunda, o financeiro avisa que não conseguiu conectar e bloqueia gravações. Não há cadastros ou transações de demonstração em produção.

## Regras dos valores

- Todos os valores são guardados em centavos inteiros. Digite `1200,50`, sem separadores de milhar. Parcelas recebem a diferença de centavos nas primeiras parcelas; a soma sempre é o total da compra.
- Receitas e despesas em conta podem ficar pendentes ou baixadas. Uma baixa usa a data informada para lançamentos já pagos e a data de hoje no botão Pagar/Receber. Desfazer baixa retira o efeito no saldo. Repetições futuras ficam pendentes.
- Saldo atual = saldo inicial + receitas baixadas − despesas baixadas − pagamentos de fatura ± transferências baixadas. Considera movimentações até hoje e todas as contas/usos. Saldo inicial é uma posição de abertura, não uma receita.
- Recebido no mês usa a data da baixa. Despesas do mês usa o vencimento das despesas e de cada parcela de cartão, pagas ou não. Assim receitas e despesas têm critérios diferentes, descritos na tela.
- Transferências e pagamentos de fatura movimentam saldo, sem entrar novamente nas despesas. Cartões e faturas exibem o valor completo, independentemente do filtro pessoal/profissional. Limite disponível é uma estimativa: limite menos parcelas não quitadas, incluindo meses futuros; sem integração com bancos.
- Primeira fatura: compras até o fechamento (inclusive) ficam nesse ciclo. Se o vencimento ocorre antes ou no dia do fechamento, vence no mês seguinte ao fechamento. Confira e ajuste o primeiro vencimento conforme seu banco. Dias inexistentes são ajustados ao último dia do mês; as próximas parcelas preservam o dia do primeiro vencimento informado.
- Pagar fatura quita o valor em aberto pela conta escolhida. Excluir uma compra exclui suas parcelas juntas. Se houver pagamento que excederia o novo total da fatura, a exclusão é bloqueada: desfaça o pagamento primeiro, excluindo seu lançamento.
- Todas as mudanças só são confirmadas após gravação na nuvem. Falha, tempo esgotado ou conflito entre aparelhos bloqueia novas gravações até atualizar. Nada é silenciosamente substituído por um estado antigo. O cache local é por UUID da conta e permite consulta se a conexão cair numa sessão aberta; novas aberturas continuam exigindo verificação online do login.

## Limites desta versão

Não há conexão com bancos, importação de extratos, juros/estornos, pagamentos parciais, conciliação, edição de lançamentos ou vínculo automático entre contratos/eventos e receitas. Para corrigir um lançamento, exclua e recadastre. As repetições são geradas de uma vez, não por agendamento automático (até 60 meses); cartão até 120 parcelas. Até 100 contas/cartões e 20.000 lançamentos por conta. A exportação gera um backup JSON para guardar; restauração pela interface ainda não disponível.

O armazenamento é um documento financeiro por conta, atualizado atomicamente com revisão. A função SQL deriva o proprietário de `auth.uid()`, exige a liberação de acesso e não aceita UUID de outra pessoa. A tabela não permite gravações diretas por clientes. Isso atende ao uso individual desta fase; antes de liberar assinantes, evoluir autorização, relatórios e estrutura conforme escala.
