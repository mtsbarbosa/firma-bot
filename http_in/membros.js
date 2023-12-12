const { upsertMembers, removeMembers : storageRemoveMembers, getParticipation } = require("../http_out/jsonstorage");
const { onReceiveText, sendMessage } = require("../http_out/telegram");
const { findCity } = require("../commons/cities");

const addMembers = (bot, msg, match) => {
    const chatId = msg.chat.id;
    const usernames = match[1].split(',');

    const invalidMembers = usernames.filter(member => {
        const [username = '', name, surname = '', id, city] = member.split(':');
        const adaptedCity = findCity(city);

        return !name || !id || !adaptedCity;
    });

    if (invalidMembers.length === 0) {
        upsertMembers(usernames);
  
        sendMessage(bot, chatId, `Added members: ${usernames.length}`);
    } else {
        sendMessage(bot, chatId, `Membros inválidos. Por favor, siga o padrão 'username:nome:sobrenome:id:cidade' para todos os membros (o nome, ID e cidade são obrigatórios):\n\nExemplo válido:\n- :Fulano::123 (sem nome de usuário e sobrenome, apenas com nome, ID e cidade)\n- Usuario:Beltrano:Sobrenome:456:maua (com nome de usuário, nome, sobrenome e ID)\n\nExemplo inválido:\n- NomeSobrenomeCidade (faltando o ID)\n\nCertifique-se de seguir o padrão correto ao adicionar membros.`);
    }
};

const removeMembers = (bot, msg, match) => {
    const chatId = msg.chat.id;
    const usernames = match[1].split(',');
    
    storageRemoveMembers(usernames);
    
    sendMessage(bot, chatId, `Removed members: ${usernames.join(', ')}`);
};

const listMembers = async (bot, msg) => {
    const chatId = msg.chat.id;
    
    let response = 'Lista de membros:\n';
    (await getParticipation()).members.forEach(member => {
        const [username = '', name, surname = '', id, city] = member.split(':');
        const adaptedCity = findCity(city);
        response += `Username: ${username}\nNome: ${name}\nSobrenome: ${surname}\nID: ${id}\nCidade: ${adaptedCity}\n\n`;
    });

    sendMessage(bot, chatId, response);
};

const init = (bot, targetChat, targetThread) => {
    onReceiveText(bot, /\/adiciona_membros (.+)/, (msg, match) => addMembers(bot, msg, match));

    onReceiveText(bot, /\/remove_membros (.+)/, (msg, match) => removeMembers(bot, msg, match));

    onReceiveText(bot, /\/lista_membros/, (msg, match) => listMembers(bot, msg));
}

  module.exports = {
    init,
    addMembers,
    removeMembers,
    listMembers
  }