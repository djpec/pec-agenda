# Agenda para Stories

Na Agenda, **Agenda para Stories** abre uma prévia local em 1080 × 1920 pixels. A semana vai de segunda a domingo e usa a data selecionada na agenda como referência. A arte semanal mostra datas, nomes e locais sem horários; a diária acrescenta os horários cadastrados (inclusive noite toda ou a confirmar). Madrugadas seguem a noite cadastrada, conforme a agenda existente.

O usuário escolhe os eventos, pode mudar nome/local públicos apenas na cópia usada para a arte e pode personalizar o nome do artista. Eventos concluídos não entram. Notas internas nunca são desenhadas. A interface lembra para conferir nomes antes de divulgar. Os registros da agenda não são alterados.

Cinco modelos minimalistas variam paletas neutras e pequenas assinaturas gráficas, sem padrões sobre o texto. A fonte Manrope local usa pesos 300, 400, 500 e 600 para diferenciar títulos, datas e nomes. O espaçamento aumenta em artes com poucos eventos; fotos usam um degradê para preservar a leitura. Outra arte escolhe um modelo diferente do último, armazenado localmente. Fotos JPG/PNG/WebP de até 12 MB são decodificadas no aparelho e não são enviadas ao servidor. Remover foto restaura o modelo gráfico. Até seis eventos por imagem; listas maiores são divididas em páginas com navegação, e cada página é baixada ou compartilhada separadamente.

A geração usa Canvas e exporta PNG. O compartilhamento usa Web Share com arquivo quando suportado, acionado pelo clique do usuário, sem enviar automaticamente a nenhum aplicativo. O Instagram aparecer no menu e oferecer Stories depende do sistema e da versão do aplicativo. Sem suporte ao envio de arquivo, o botão baixa a imagem e orienta a postagem manual. Baixar imagem está sempre disponível com a prévia pronta. O cancelamento do menu de compartilhar não gera erro.

Alterações na agenda enquanto a janela está aberta bloqueiam a exportação até selecionar o período novamente. A prévia é regenerada antes de habilitar os botões. Os módulos, CSS e logo estão no cache offline do service worker.

Validação: `NODE_PATH=/tmp/pec-tools/node_modules node tests/story-share.cjs` (Playwright e Chromium). Verifica filtros de período/concluídos, ausência de horários na semana, horários na diária, modelos diferentes, paginação, arquivo PNG, foto e remoção, compartilhamento simulado de arquivo, dados originais preservados e retorno do foco em 390 e 1440 px. O encaminhamento real do sistema operacional para o Instagram precisa ser conferido no celular.
