# Datas disponíveis para WhatsApp

Na Agenda, o botão **Datas disponíveis** abre seleção de até 12 meses, filtros por dia da semana e uma prévia editável. O link do WhatsApp contém apenas a mensagem: o usuário escolhe o destinatário e confirma o envio. Não há envio automático nem acesso à lista de contatos.

- Dia sem evento: disponível. Evento de noite toda: data indisponível, sem liberação manual para envio. Outros eventos: depende do horário, fora da mensagem até o proprietário revisar e liberar o encaixe. Eventos concluídos não bloqueiam. Um show às 23h não torna o dia inteiro indisponível.
- A agenda representa a noite do evento: um horário entre 00h e 11h59 é a madrugada seguinte à data cadastrada. Esses eventos e os eventos de noite toda deixam também o dia seguinte como “depende do horário”. Não são inferidos duração, deslocamento ou intervalos livres exatos.
- Só entram hoje e datas futuras. A lista usa todos os eventos disponíveis neste aparelho, independentemente da busca e dos filtros visuais da agenda.
- Na revisão, os compromissos mostram nome, local e horário apenas ao proprietário. O campo **Incluir esta data na mensagem** libera cada data individualmente como dependente do horário. Uma data com evento nunca é convertida automaticamente em totalmente livre.
- É possível escolher dias da semana individualmente ou usar Todos, Sex a dom, Qua a dom e Qua a sáb. Feriados e vésperas podem ser incluídos mesmo fora desses dias.
- Ao clicar numa data, o painel mostra os compromissos e uma única caixa para incluir ou excluir a data da mensagem. Datas sem evento entram como disponíveis; datas com evento entram como dependentes do horário somente quando marcadas. Datas de noite toda permanecem indisponíveis e não têm caixa de liberação. Isso não modifica os eventos.
- O texto não inclui nomes de clientes, locais de eventos, observações nem horários reservados. Os horários são mostrados apenas na revisão do proprietário. A mensagem curta sempre mostra as linhas Disponíveis e Depende do horário, indicando quando não há datas em uma categoria, e encerra com a frase sobre avaliar encaixes quando houver datas liberadas nessa categoria.
- Se os eventos mudarem enquanto a janela estiver aberta, o compartilhamento é bloqueado até gerar e revisar novamente. Ajustes manuais e liberações de encaixe são descartados nessa atualização para não esconder novos compromissos. Mudanças de nome ou local do evento também exigem nova revisão.

## Cidade, feriados e limites

A configuração inicial solicitada pelo proprietário é **somente Foz do Iguaçu/PR**. Cidade, UF, dias de trabalho, opções de feriado/véspera e datas adicionais ficam em `pec-availability-preferences-v1` neste navegador, pois o login está temporariamente pausado. Não há sincronização de perfil entre aparelhos.

O calendário é calculado localmente para 2000–2199. Inclui os feriados nacionais fixos, incluindo 20 de novembro a partir de 2024. Para Foz do Iguaçu/PR, aplica as regras recorrentes de 10 de junho (aniversário), 24 de junho (São João Batista), Sexta-feira da Paixão e Corpus Christi, calculadas a partir da Páscoa. A véspera considera o dia anterior, inclusive na mudança de mês e ano.

**Não há consulta automática aos decretos anuais da Prefeitura.** As regras recorrentes não substituem a conferência do calendário oficial local. Pontos facultativos, Carnaval, emendas e outros dias especiais não são tratados silenciosamente como feriados gerais. A interface informa essa limitação e permite adicionar datas próprias. Antes de tomar decisões comerciais, revise os feriados aplicáveis ao seu trabalho e os atos anuais da cidade.

Em **Configurar cidade e feriados**, use `DD/MM - Nome` para uma data recorrente ou `DD/MM/AAAA - Nome` para uma data específica, até 50 linhas. Outras cidades recebem os feriados nacionais e as datas adicionais informadas, sem inventar feriados municipais.

Os dados de contratos, propostas, agenda e financeiro não são alterados por essa ferramenta. Nenhuma API externa, chave de serviço ou migração de banco é exigida.
