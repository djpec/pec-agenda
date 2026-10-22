# pec Manager

Agenda, orçamentos e contratos em HTML, com a mesma conta Supabase. Publicação: https://agenda.djpec.com/.

## Módulos definitivos

`orcamentos.html` contém o arquivo **ORÇAMENTOS DEFINITIVO.html** e `contratos.html` contém **CONTRATOS.html**. O único acréscimo nos dois arquivos é o bloco demarcado `pec Manager integration`, antes de `</body>`. Os estilos, formulários, cálculos, importação/exportação XML e impressão dos originais permanecem intactos. `tests/originals.json` registra os hashes SHA-256 dos arquivos fornecidos.

Os scripts externos adicionam navegação, histórico, status, conversão para contrato e vínculo com a agenda. O tema da interface e a imagem de fundo não alteram o documento impresso. Uma correção externa resolve a recursão existente no comando de restaurar o contrato.

## Uso

- Entre em **Minha conta**, usando o login já utilizado na Agenda.
- **Salvar no histórico** grava o documento completo, incluindo as imagens do orçamento. Sem conexão, as gravações da conta ficam pendentes até a internet retornar.
- O rascunho aberto é guardado neste navegador. Para acessá-lo em outro dispositivo, salve no histórico e abra o registro lá.
- **Gerar contrato** permite revisar datas reais, horários, valor principal e extras contratados. Os opcionais não são incluídos automaticamente. CPF, endereço do cliente e demais informações ausentes continuam disponíveis para preenchimento.
- **Adicionar à agenda** usa a noite do evento. Horários de 00h a 11h59 pertencem à madrugada seguinte. O contrato utiliza datas reais e faz a conversão para a regra da agenda.
- Orçamento e contrato derivados compartilham o identificador do evento. Adicionar novamente oferece atualizar o mesmo evento, preservando a conclusão.
- **Aparência** sincroniza tema, imagem, sobreposição e desfoque. A remoção do fundo também é sincronizada. Outras abas/dispositivos consultam alterações ao voltar à tela e a cada 20 segundos enquanto visíveis.
- Edições de um registro que mudou em outro dispositivo geram um aviso de conflito. Abra novamente o registro ou salve uma cópia.

## Estrutura e dados

Não há etapa de build. Sirva a pasta por HTTP ou publique no GitHub Pages. O Supabase JS 2.116.0 está fixado em `vendor/`, para evitar mudanças inesperadas e permitir abertura offline dos editores.

As tabelas existentes são `events`, `quotes`, `contracts` e `user_preferences`. Esta versão não exige migração nem altera os eventos existentes. As políticas de acesso por `user_id` continuam em vigor; apenas a chave pública está no cliente. O service worker armazena os arquivos estáticos da aplicação e não armazena respostas de autenticação ou do banco.

Os documentos completos e rascunhos usam IndexedDB, separados por conta. Os registros no Supabase usam o JSON `payload` existente; `_manager` contém status, versão remota e vínculos entre documentos. Os formatos antigos de histórico são adaptados ao abrir.

## Interface e arquitetura

A interface atual é implementada em `ui/`, com componentes e estilos próprios. O painel e a agenda não carregam `manager-ui.css`, `manager-pro.css` ou `backstage.js`.

- `core.js`: ícones SVG, calendário, datas e componentes compartilhados.
- `shell.js`: navegação, temas, cor de destaque e mensagens de confirmação.
- `home.js`: painel com eventos reais, busca, calendário interativo e distribuição mensal.
- `agenda.js`: calendário mensal com eventos nas células, lista, busca entre meses, filtros por status, detalhes por dia, conclusão/reabertura e duplicação.
- `agenda-data.js`: persistência compatível com os dados anteriores, formulário de evento, autenticação e backup; `cloud-fix.js` mantém a proteção da fila offline.
- `documents.js`: biblioteca com busca e filtros de status, edição por etapas e prévia. Os adaptadores `quote-cloud.js` e `contract-cloud.js` continuam responsáveis pelos documentos e conversões.
- `workspace.css`: design independente, temas claro/escuro, layouts responsivos e integração de impressão.

A navegação é lateral e compacta no computador e fica na parte inferior no celular. A edição de eventos abre num painel lateral com seções de identificação, data/horário e observações. A fonte Manrope é local, com licença em `vendor/fonts/`, e funciona offline. Contas novas começam no tema claro; preferências já salvas continuam válidas. A preferência de cor da nova interface é guardada separadamente das versões anteriores.

O formulário começa vazio em instalações novas: não são inseridos eventos demonstrativos. Eventos já salvos, identificadores, datas da noite, conclusão, documentos e vínculos continuam usando os formatos existentes.

## Verificação

Não há build. Sirva o checkout por HTTP:

```sh
python3 -m http.server 8765 --bind 127.0.0.1
```

A suíte atual usa Node.js, `playwright@1.62.1`, Chromium e `pdftotext` (Poppler) para conferir o conteúdo da primeira página do PDF. As dependências de teste podem ser instaladas fora do checkout:

```sh
npm install --prefix /tmp/pec-tools --cache /tmp/pec-npm-cache --no-package-lock playwright@1.62.1
NODE_PATH=/tmp/pec-tools/node_modules PEC_BROWSER=/usr/bin/chromium PEC_TEST_URL=http://127.0.0.1:8765/ node tests/workspace.cjs
NODE_PATH=/tmp/pec-tools/node_modules PEC_BROWSER=/usr/bin/chromium PEC_TEST_URL=http://127.0.0.1:8765/ node tests/workspace-offline.cjs
NODE_PATH=/tmp/pec-tools/node_modules PEC_BROWSER=/usr/bin/chromium PEC_TEST_URL=http://127.0.0.1:8765/ node tests/document-contrast.cjs
```

`PEC_BROWSER` seleciona o executável Chromium. `PEC_QA_DIR` define a pasta dos PDFs e imagens de teste. As chamadas à nuvem na suíte funcional são interceptadas, usam o SDK real e dados fictícios, e não gravam na conta real.

A suíte funcional cobre criação, edição, conclusão/reabertura, duplicação, exclusão, busca entre meses sem distinção de acentos, navegação do calendário pelo teclado, exportação e rejeição de backup inválido, fila offline, login pelo teclado no celular, biblioteca de documentos, imagens, valores por item, extras, conversão com madrugada, vínculo único com a agenda, proteção contra sobrescrita concorrente e PDF com conteúdo na primeira página. Também verifica as quatro telas e os editores em 1440, 390 e 320 px, nos temas claro e escuro. A suíte offline confirma que as quatro telas, os módulos e a fonte estão no precache, que o cache antigo é removido e que é possível criar eventos e salvar documentos sem internet.

A integridade dos modelos atuais é verificada contra `workspace-models.json`, registrado a partir do conteúdo anterior à reconstrução da interface.

Os testes `integration.cjs`, `auth-mobile.cjs` e `studio-ui.cjs` registram interfaces anteriores e permanecem no repositório como histórico. Os hashes em `originals.json` já divergiam dos documentos presentes no checkout inicial; não foram alterados para fazer os testes passarem. As alterações da interface atual nos HTMLs de orçamento e contrato ficam nos links de integração; os modelos de documento permanecem intactos.

A verificação `document-contrast.cjs` garante texto escuro nas folhas de contrato e orçamento, independentemente do tema da interface, mantendo as cores próprias do documento e os destaques claros sobre fundos escuros. Confere prévia e impressão em computador e celular.
