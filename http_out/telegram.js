const TelegramBot = require('node-telegram-bot-api');

const initializeBot = (token) => {
    return new TelegramBot(token, { polling: true });
}

const sendMessage = (bot, chatId, message, options = undefined) => {
    bot.sendMessage(chatId, message, options);
}

const sendPoll = async (bot, chatId, question, pollOptions, options = undefined) => {
    return bot.sendPoll(chatId, question, pollOptions, options);
}

const stopPoll = (bot, chatId, pollId, options = undefined) => {
    bot.stopPoll(chatId, pollId, options);
}

const pinChatMessage = (bot, chatId, messageId) => {
    bot.pinChatMessage(chatId, messageId, { disable_notification: true });
}

const unpinChatMessage = (bot, chatId, messageId) => {
    bot.unpinChatMessage(chatId, {message_id: messageId});
}

const onReceive = async (bot, event, listener) => {
    return bot.on(event, listener);
}

const onReceiveText = async (bot, regexp, callback) => {
    return bot.onText(regexp, callback);
}

module.exports = {
    sendMessage,
    initializeBot,
    sendPoll,
    stopPoll,
    pinChatMessage,
    unpinChatMessage,
    onReceive,
    onReceiveText
}