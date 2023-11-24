require('dotenv').config();
const { initializeBot, onReceive } = require('./http_out/telegram');
const { init : initAtividades, onReceiveAnyText : onReceiveAnyAtividadesText } = require('./http_in/atividades');
const { init : initMembros } = require('./http_in/membros');

const botToken = process.env.BOT_TOKEN;
const targetChat = process.env.POLL_TARGET_CHAT;
const targetThread = process.env.POLL_TARGET_THREAD;

const init = (targetChat, targetThread) => {
    const bot = initializeBot(botToken);
    initAtividades(bot, targetChat, targetThread);
    initMembros(bot, targetChat, targetThread);

    onReceive(bot, 'text', (msg) => {
        onReceiveAnyAtividadesText(bot, msg, targetChat, targetThread);
    });
};

init(targetChat, targetThread);

console.log('Bot is running...');
