require('dotenv').config();
const { initializeBot, onReceive, getChatMembers } = require('./http_out/telegram');
const { init : initAtividades, onReceiveAnyText : onReceiveAnyAtividadesText } = require('./http_in/atividades');
const { init : initMembros } = require('./http_in/membros');

const botToken = process.env.BOT_TOKEN;
const targetChat = process.env.POLL_TARGET_CHAT;
const targetThread = process.env.POLL_TARGET_THREAD;

/*
function checkNonResponders() {
    const groupId = 'YOUR_GROUP_ID';

    // Get a list of all users in the group
    const allGroupMembers = getGroupMembers(groupId);

    // Identify users who haven't responded to the poll
    const nonResponders = allGroupMembers.filter((user) => !userResponses[user.id]);

    // Send a report with the list of non-responders
    const reportMessage = `Users who haven't responded to the poll: ${nonResponders.map((user) => user.username).join(', ')}`;
    bot.sendMessage(groupId, reportMessage);
}
*/

const init = (targetChat, targetThread) => {
    const bot = initializeBot(botToken);
    initAtividades(bot, targetChat, targetThread);
    initMembros(bot, targetChat, targetThread);

    onReceive(bot, 'text', (msg) => {
        if(msg.text === '/membros'){
            getChatMembers(bot, targetChat);
        }
        onReceiveAnyAtividadesText(bot, msg, targetChat, targetThread);
    });
};

init(targetChat, targetThread);

console.log('Bot is running...');
