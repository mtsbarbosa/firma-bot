const { DateTime } = require("luxon");
const { generateUUID } = require("../commons/uuid");
const { addAvailability, replaceAvailabilities } = require("../http_out/jsonstorage");
const { sendMessage, sendPoll, pinChatMessage, stopPoll, unpinChatMessage } = require("../http_out/telegram");
const { markOutdatedEvents } = require("../logic/events");

const validateEventDateTimeString = (inputString) => {
  const regex = /^[^=]+=\s*((\d{4}-\d{2}-\d{2}\s\d{2}:\d{2})((\s,\s|,|\s,|,\s)*(\d{4}-\d{2}-\d{2} \d{2}:\d{2})){1,8})$/;

  if (!regex.test(inputString)) {
    return 'O formato da string não é válido. Por favor, siga o formato: NomeEvento = AAAA-MM-DD HH:mm, AAAA-MM-DD HH:mm,... (mínimo 2, máximo 9 opções de data e hora).';
  }

  const dateTimeOptions = inputString.split('=')[1].split(',');
  if (!(dateTimeOptions.length >= 2 && dateTimeOptions.length <= 9)) {
    return 'Você precisa fornecer entre 2 e 9 opções de data e hora após o nome do evento.';
  }

  return true;
};

const createAvailability = async (bot, targetChat, targetThread, msg) => {
    const chatId = msg.chat.id;
    const params = msg.text.split('/disponibilidade ')[1];

    const validationResult = validateEventDateTimeString(params);
    
    if (validationResult === true) {
        const paramParts = params.split('=');
        const name = paramParts[0].trim();
        const dates = paramParts[1].split(',').map((part) => part.trim());
        const availability = {
            id: generateUUID(),
            name,
            dates,
            date_time: DateTime.now().toFormat('yyyy-MM-dd HH:mm')
        }
        const result = await Promise.all([
            sendPoll(
                bot, 
                targetChat, 
                `Suas disponbilidades para '${name}'`,
                [...dates.map((date) => DateTime.fromFormat(date, 'yyyy-MM-dd HH:mm').toFormat("cccc (dd/MM) à's' HH:mm", { locale: 'pt-BR' })), 
                 'Não posso em nenhum'],
                {is_anonymous: false,
                 allows_multiple_answers: true,
                 message_thread_id: targetThread}),
            sendMessage(bot, chatId, 'Criando enquete para disponibilidade...')
        ])
        const poll = result[0];
        return await Promise.all([
            pinChatMessage(bot, targetChat, poll.message_id),
            addAvailability({...availability, poll_message_id: poll.message_id, poll_id: poll.poll.id})]);
    } else {
        return sendMessage(bot, chatId, validationResult);
    }
};

const closeAvailabilities = async (bot, targetChat, targetThread, availiabilities) => {
    const currentDate = DateTime.now();

    const marked = markOutdatedEvents(currentDate, availiabilities);
    marked
      .filter((item) => item.outdated)
      .forEach((availability) => {
        stopPoll(bot, targetChat, availability.poll_message_id, { message_thread_id: targetThread });
        unpinChatMessage(bot, targetChat, availability.poll_message_id);
    });

    return replaceAvailabilities(marked.filter((item) => !item.outdated));
};

module.exports = {
    createAvailability,
    closeAvailabilities
}