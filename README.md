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

## Verificação

Instale `playwright@1.62.1` para executar os testes. Sirva o projeto, por exemplo, com `python3 -m http.server 8765` e rode em outro terminal:

```sh
PEC_TEST_URL=http://127.0.0.1:8765/ node tests/integration.cjs
```

Se necessário, `PEC_BROWSER` aponta para o executável Chromium. `PEC_QA_DIR` define o diretório de imagens e resultados de teste. O teste usa o SDK real com todas as chamadas ao Supabase interceptadas e dados fictícios, sem gravar dados de teste na conta real.

Verificações realizadas: integridade dos HTMLs; persistência de imagens e status; valores por item; conversão com madrugada, duração e extras; vínculo único com a agenda; sincronização de tema e remoção de fundo entre dois navegadores; fila offline; proteção contra sobrescrita concorrente; Início e diálogo da Agenda. PDFs originais e integrados foram comparados por texto, dimensões e pixels em A4 e Carta paisagem (orçamentos), além de A4 (contrato). A paginação de origem é preservada, inclusive eventuais transbordamentos do modelo original.
