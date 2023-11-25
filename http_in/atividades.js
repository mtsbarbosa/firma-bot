const { onReceiveText, onReceive } = require('../http_out/telegram');
const { askParticipation } = require('../controllers/participation');
const { generateCalendar } = require('../controllers/calendar');
const { onFechaEnquetes, startEvent, startSimple, startMultiple, clearMemory, onPollAnswer, nextState } = require('../controllers/events');

const startAtividade = (bot, msg, pure) => {
    const chatId = msg.chat.id;
    startEvent(bot, chatId, pure);
};

const onReceiveCalendar = (bot, msg) => {
    const chatId = msg.chat.id;
    generateCalendar(bot, chatId);
};

const onReceiveAskParticipation = (bot, targetChat, targetThread, msg) => {
    const parts = msg.text.split(" ")
    const daysLimit = new Number(parts[parts.length - 1]);

    return askParticipation(bot, targetChat, targetThread, daysLimit);
}

const init = (bot, targetChat, targetThread) => {
    onReceiveText(bot, /\/atividade$/, (msg) => {
        startAtividade(bot, msg, false);
    });

    onReceiveText(bot, /\/atividade_pura/, (msg) => {
        startAtividade(bot, msg, true);
    });
    
    onReceiveText(bot, /simples/, (msg) => {
        const chatId = msg.chat.id;
        startSimple(bot, chatId);
    });
    
    onReceiveText(bot, /multipla/, (msg) => {
        const chatId = msg.chat.id;
        startMultiple(bot, chatId);
    });
    
    onReceiveText(bot, /\/calendario/, (msg) => onReceiveCalendar(bot, msg));

    onReceiveText(bot, /limpa_memoria/, (msg) => {
        clearMemory();
    });
    
    onReceiveText(bot, /\/fecha_enquetes/, (msg) => onFechaEnquetes(bot, targetChat, targetThread, msg));

    onReceiveText(bot, /\/cobrar_participacao/, (msg) => onReceiveAskParticipation(bot, targetChat, targetThread, msg));

    onReceive(bot, 'poll_answer', (pollAnswer) => {
        onPollAnswer(pollAnswer);
    });
}

const onReceiveAnyText = (bot, msg, targetChat, targetThread) => {
    nextState(bot, msg, targetChat, targetThread);
}

module.exports = {
    init,
    onReceiveAnyText,
    onReceiveAskParticipation,
    onReceiveCalendar
};