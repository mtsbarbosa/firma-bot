# firma-bot
Um bot para facilitar a administração e organização de coletivos e organizações no telegram usando node, sendo facilmente colocado no ar usando ferramentas gratuitas.
⚠️ Importante: Não colocar dados sensíveis ou sigilosos nele.

## Instalação
- Crie uma conta no github para sua organização, de preferência com senha segura e autenticação de duas etapas.
- Logado nela, faça um fork desse repositório `firma-bot`
- Crie uma conta para sua organização na página [json storage](https://www.jsonstorage.net/)
  - Nela, no botão `+ Create`, crie dois Items: `firma-events, firma-events-staging`
  - O conteúdo (content) inicial deles deve ser `{"events":[],"availabilities":[]}`, adicione esse conteúdo e salve.
  - Crie mais dois items `firma-participation, firma-participation-staging`
  - O conteúdo (content) inicial deles deve ser `{"votes":{},"members":[]}`, adicione-o e salve.
  - No menu esquerdo, vá em Api Keys e clique em Create
  - Dê o nome de telegram-bot e copie seu valor gerado, salvando como json storage api key em algum lugar seguro
  - Volte no menu Items, entre em cada um dos 4 items e copie seu uuid da url do browser e salve, identificando-os por item
    - Exemplo:
    - firma-events => aea1585e-f756-480e-842d-d734d8836e1b
    - firma-events-staging => 6ed40d1a-ad33-48e4-9614-4d87d29e2e2a
    - firma-participation => 6caacc5e-5c6a-48b3-a766-02f891ed380f
    - firma-participation-staging => c0bed114-64c1-4bdf-a0d8-e77a89b20331
  - Copie também o id da sua conta, para isso, entre em qualquer item e lá em baixo, na sessão Get JSON tem um uuid logo entre `/json/` e o uuid do item em si, deixe salvo
- Crie uma conta para sua organização na página [fly.io](https://fly.io) usando a opção Need an Account > Sign up with Github e usando a conta github da sua organização.
- Instale o fly.io cli seguindo as instruções [aqui](https://fly.io/docs/hands-on/install-flyctl/)
- Instale o git seguindo as instruções [aqui](https://git-scm.com/book/pt-br/v2/Come%C3%A7ando-Instalando-o-Git)
- Usando o terminal
- Faça um clone do seu repositório ex: `git clone https://github.com/minha-organizacao/firma-bot`
- Entre na pasta firma-bot no terminal
- Execute `fly tokens create deploy -x 999999h` e copie o token gerado
- Vá no seu repositório clonado do github, clique em Settings > Secrets and variables > Actions
- Crie um novo secret chamado `FLY_API_TOKEN` com o valor copiado do terminal e salve
- No terminal ainda, execute estes comandos:
```
git commit -m "initial deployment" --allow-empty
git push
```
- Isso fará um deployment inicial para o fly.io criando o app em seu dashboard
- Entre no telegram e inicie uma conversa com o usuário / bot `@BotFather`
  - Envie `/newbot`
  - escolha um nome para seu bot até que seja único
  - ele irá gerar um token, copie e salve como bot-token
  - repita o processo e gere um outro bot de teste
- No seu supergrupo (precisa ser supergrupo!) principal adicione o bot (não o de teste) como Admin com todos os direitos.
- Entre no tópico onde as enquetes serão mostradas, copie da url os números que viráo após `#` incluindo sinais de negativo e underline, deixe salvo como topico principal
- Crie um supergrupo de teste, adicione o bot como admin
- Crie um tópico para mostrar enquetes, também copie da url seus números e deixe salvo como topico de teste
- No dashboard do fly.io, procure o app firma-bot e entre nele
- No menu esquerdo, procure Secrets
- Adicione os Secrets:
  - BOT_TOKEN => cole o valor (não-teste) enviado pelo BotFather
  - JSON_STORAGE_API_KEY => cole a ApiKey gerada em Api Keys do json storage que você salvou
  - JSON_STORAGE_ACCOUNT_ID => cole o id da conta que salvamos
  - JSON_STORAGE_KEY => cole o id do item `firma-events`
  - JSON_PARTICIPATION_KEY => cole o id do item `firma-participation`
  - POLL_TARGET_CHAT => use o número copiado da url do tópico, mas somente a parte antes do underline `_` incluindo `-` se houver e não usando o `#`,  exemplo `-10032329`
  - POLL_TARGET_THREAD => use o número após o underline, exemplo `34`
- No terminal, execute estes comandos:
```
git commit -m "initial deployment" --allow-empty
git push
```
- Crie um grupo separado de administração do seu bot (não precisa ser supergrupo), coloque somente você ou membros administrativos da organização e adicione-o como admin
- Crie um grupo de teste também adicionando o bot de teste
- No grupo de administração principal, teste seu bot `/calendario` se ele responder deu tudo certo!

## Testando localmente
- Se você é desenvolvedor e deseja adicionar features no seu bot, ou se você somente quer testar seu bot sem usar o principal siga os passos abaixo
- No seu repositório gere um arquivo `.env` na raíz com o conteúdo:
```
## staging jsonstorage.net
JSON_STORAGE_ACCOUNT_ID=
JSON_STORAGE_KEY=
JSON_PARTICIPATION_KEY=
JSON_STORAGE_API_KEY=

# TELEGRAM STAGING
BOT_TOKEN=
POLL_TARGET_CHAT=
POLL_TARGET_THREAD=
```
- Depois do igual `=` coloque os valores para teste copiados, usando os items com final staging e informações dos bots e grupos de teste
- Salve
- inicie seu servidor com `npm run start`
- Use seus grupos de teste

## Comandos disponíveis
- `/adiciona_membros username:nome:sobrenome:id` => adiciona em participation um membro votante, id e nome são obrigatórios e as informações devem bater exatamente como os membros do seu grupo
- `/atividade` => cria atividades com enquetes vinculadas, que serão enviadas no chat e thread configurados nos environments, a votação dessa enquete é monitorada no storage item participation
  - existe a atividade simples que cria uma enquete com um evento só, com as opções Presente e Ausente
  - existe a atividade múltipla que cria uma enquete com multiplos eventos e uma última opção de Ausente em todos
  - as enquetes são automaticamente fixadas 
- `/atividade_pura` => cria atividades no calendário sem enviar enquetes
- `/calendario` => exibe um calendário com as atividades ativas
- `/cobrar_participacao` => olhando os membros adicionados pelo comando `adiciona_membro` no storage participation e as enquetes criadas pelo comando `/atividade` e salvos como votes, avalia quem não votou da lista de membros e cobra sua participação na enquete marcando-os.
- `/fecha_enquetes` => finaliza votação e desafixa as enquetes das atividades que são mais antigas que hoje. Se for uma atividade múltipla, a enquete só é finalizada e o evento removido do storage depois que todas as atividades sejam mais antigas que hoje. Marca essas atividades vencidas, mas não removidas como outdated para uso do calendário.
- `/limpa_memoria` => limpa os eventos atuais, quando, por exemplo, desistimos de criar uma atividade no meio de sua criação para evitar problemas
- `/lista_membros` => lista todos os membros
- `/remove_membro id` => remove membro pelo id, para alterar um membro deve-se remover e adicionar novamente
