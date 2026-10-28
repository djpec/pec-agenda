# Financeiro · Agenda do Artista

Primeira versão: receitas e despesas pessoais/profissionais, contas com saldo inicial positivo ou negativo, transferências, categorias, baixas, repetições mensais finitas, cartões, compras parceladas, faturas e pagamento de fatura. Acesso em `financeiro.html`, pelo menu Financeiro.

## Ativação na nuvem (quando o login for retomado)

1. Confirme que a conta verificada `contato@djpec.com` existe em Authentication. A senha é a da conta existente; nunca foi criada nem definida pelo desenvolvimento. Se necessário, use a recuperação de senha no login. Verifique a URL de recuperação e envio de e-mails conforme `ACESSO-RESTRITO.md`.
2. Aplique primeiro `supabase/migrations/202610270002_restricted_owner_access.sql` no SQL Editor do projeto `qmhyeotvbktdilrudwys`, se ainda não aplicou.
3. Execute `supabase/migrations/202610280001_finance_workspace.sql` no mesmo SQL Editor.
4. Entre no sistema e abra Financeiro. Cadastre uma conta com o saldo anterior aos lançamentos que serão cadastrados. Cadastre os cartões por apelido (nunca número, código de segurança ou senha).

O código não aplica SQL remotamente. No modo de nuvem, a primeira migração libera o proprietário; a segunda cria o armazenamento financeiro. Sem elas, esse modo bloqueia o acesso/gravações. O modo local temporário descrito abaixo dispensa as migrações. Não há cadastros ou transações de demonstração em produção.

## Regras dos valores

- Todos os valores são guardados em centavos inteiros. Digite `1200,50`, sem separadores de milhar. Parcelas recebem a diferença de centavos nas primeiras parcelas; a soma sempre é o total da compra.
- Receitas e despesas em conta podem ficar pendentes ou baixadas. Uma baixa usa a data informada para lançamentos já pagos e a data de hoje no botão Pagar/Receber. Desfazer baixa retira o efeito no saldo. Repetições futuras ficam pendentes.
- Saldo atual = saldo inicial + receitas baixadas − despesas baixadas − pagamentos de fatura ± transferências baixadas. Considera movimentações até hoje e todas as contas/usos. Saldo inicial é uma posição de abertura, não uma receita.
- Recebido no mês usa a data da baixa. Despesas do mês usa o vencimento das despesas e de cada parcela de cartão, pagas ou não. Assim receitas e despesas têm critérios diferentes, descritos na tela.
- Transferências e pagamentos de fatura movimentam saldo, sem entrar novamente nas despesas. Cartões e faturas exibem o valor completo, independentemente do filtro pessoal/profissional. Limite disponível é uma estimativa: limite menos parcelas não quitadas, incluindo meses futuros; sem integração com bancos.
- Primeira fatura: compras até o fechamento (inclusive) ficam nesse ciclo. Se o vencimento ocorre antes ou no dia do fechamento, vence no mês seguinte ao fechamento. Confira e ajuste o primeiro vencimento conforme seu banco. Dias inexistentes são ajustados ao último dia do mês; as próximas parcelas preservam o dia do primeiro vencimento informado.
- Pagar fatura quita o valor em aberto pela conta escolhida. Excluir uma compra exclui suas parcelas juntas. Se houver pagamento que excederia o novo total da fatura, a exclusão é bloqueada: desfaça o pagamento primeiro, excluindo seu lançamento.
- No modo de nuvem, todas as mudanças só são confirmadas após gravação na nuvem. Falha, tempo esgotado ou conflito entre aparelhos bloqueia novas gravações até atualizar. Nada é silenciosamente substituído por um estado antigo. O cache local é por UUID da conta e permite consulta se a conexão cair numa sessão aberta; novas aberturas continuam exigindo verificação online do login.

## Limites desta versão

Não há conexão com bancos, importação de extratos, juros/estornos, pagamentos parciais, conciliação ou vínculo automático entre contratos/eventos e receitas. Há edição de receitas e despesas em conta; para corrigir compras de cartão, transferências e pagamentos de fatura, exclua e recadastre. As repetições são geradas de uma vez, não por agendamento automático (até 60 meses); cartão até 120 parcelas. Até 100 contas/cartões e 20.000 lançamentos por conta. A exportação gera um backup JSON para guardar; a restauração pela interface valida o arquivo e solicita confirmação antes de substituir os dados.

O armazenamento é um documento financeiro por conta, atualizado atomicamente com revisão. A função SQL deriva o proprietário de `auth.uid()`, exige a liberação de acesso e não aceita UUID de outra pessoa. A tabela não permite gravações diretas por clientes. Isso atende ao uso individual desta fase; antes de liberar assinantes, evoluir autorização, relatórios e estrutura conforme escala.

## Uso temporário sem login

Com `ArtistAuth.accessRequired=false`, o financeiro funciona localmente, mesmo que haja uma sessão antiga no navegador. Usa um banco IndexedDB separado (`agenda-artista-finance`); não copia nem altera o financeiro da nuvem, contratos ou propostas. Não exige configuração do Supabase para esse modo. A barra de status informa onde os dados estão salvos.

O salvamento local é transacional: só confirma depois de concluir a gravação. Revisões impedem que duas abas sobrescrevam mudanças umas das outras. Se outra aba alterar os dados, clique em Atualizar antes de continuar. Se o armazenamento ficar indisponível ou cheio, as gravações são bloqueadas e o estado anterior é preservado.

Receitas e despesas em conta podem ser editadas (descrição, valor, categoria, uso, conta, vencimento, baixa e data da baixa). Uma repetição editada não altera as demais. Compras de cartão, transferências e pagamentos de fatura continuam sendo corrigidos por exclusão e novo lançamento.

Exporte backups regularmente; limpar os dados do site, desinstalar o navegador ou usar navegação anônima pode apagar o armazenamento. Os arquivos JSON contêm dados financeiros e devem ser guardados em local privado. Não há sincronização automática entre aparelhos neste modo.

A restauração aceita o formato atual e os backups JSON antigos exportados pelo módulo. Primeiro valida o arquivo (até 10 MB), contas, cartões, lançamentos, referências e valores em centavos. Depois mostra a quantidade de registros e solicita confirmação para substituir **apenas o financeiro do destino**. Há um botão para baixar os dados atuais antes da substituição. Cancelar ou importar um arquivo inválido não altera o financeiro. A restauração não mescla estados de dois aparelhos.
