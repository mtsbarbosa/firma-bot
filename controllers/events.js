const { DateTime } = require("luxon");
const { generateUUID } = require('../commons/uuid');
const { isValidDateTimeFormat } = require('../commons/date');
const { replaceEvents, getEvents, upsertVotes, addEvent, addEvents } = require("../http_out/jsonstorage");
const { sendMessage, unpinChatMessage, stopPoll, pinChatMessage, sendPoll } = require("../http_out/telegram");
const { groupByPollMessageId, filterByPollMessageUndefined, markOutdatedEventsGroupedByPollId } = require("../logic/events");

let events = {};

const CREATE_ATIVIDADE = 0;
const DATE = 1;
const LOCATION = 2;
const TYPE = 3;
const EVENT_NAME = 4;
const ADD_OPTION_NAME = 5;
const ADD_OPTION_DATETIME = 6;
const ADD_OPTION_LOCATION = 7;
const ADD_OPTION_TYPE = 8;

const startEvent = (bot, chatId, pure) => {
   sendMessage(bot, chatId, "Você quer uma atividade simples ou multipla?");
   events[chatId] = { state: CREATE_ATIVIDADE, pure };
};

const startSimple = (bot, chatId) => {
    events[chatId].create_multi_date = false;
    sendMessage(bot, chatId, "Atividade simples.\nPor favor responda com a data no formato (e.g., '2023-09-13 15:00').");
    events[chatId].state = DATE;
}

const startMultiple = (bot, chatId) => {
    events[chatId].create_multi_date = true;
    sendMessage(bot, chatId, "Múltiplas atividades.\nPor favor qual o nome da enquete?");
    events[chatId].state = EVENT_NAME;
}

const updateEvents = (_events) => {
    events = _events;
}

const inMemEvents = () => {
    return events;
}

const clearMemory = (bot, chatId) => {
    events = {};
    sendMessage(bot, chatId, "Memória limpa.");
}

const onPollAnswer = (pollAnswer) => {
    upsertVotes(pollAnswer);
}

const createLocationKeyboard = {
    keyboard: [
        ["Diadema - Centro", "Diadema - Bairro"],
        ["Mauá - Centro", "Mauá - Bairro"],
        ["SA - Centro", "SA - Bairro"],
        ["SBC - Centro", "SBC - Bairro"],
        ["SCS - Centro", "SCS - Bairro"],
        ["Ribeirão Pires - Centro", "Ribeirão Pires - Bairro"],
        ["RGS - Centro", "RGS - Bairro"],
        ["São Paulo - Centro", "São Paulo - Bairro"],
        ["Online"]
    ],
    resize_keyboard: true,
    one_time_keyboard: true,
};

const receiveDateTime = (bot, msg) => {
    const chatId = msg.chat.id;

    if(!isValidDateTimeFormat(msg.text)){
        sendMessage(bot, chatId, 'O formato válido é "aaaa-MM-dd HH:mm". Por favor, insira a data nesse formato.');
        return;
    }

    events[chatId].date_time = msg.text;
    sendMessage(bot, chatId, `Ótimo! Você selecionou a data e hora da atividade: ${events[chatId].date_time}\nAgora, selecione o local da atividade:`,
                {reply_markup: createLocationKeyboard});
    events[chatId].state = LOCATION;
};

const receiveEventName = (bot, msg, targetChat, targetThread) => {
    const chatId = msg.chat.id;
    events[chatId].event_name = msg.text;

    if (events[chatId].create_multi_date) {
        sendMessage(bot, chatId, "Por favor responda com o nome da próxima atividade (responda 'ok' quando finalizado).");
        events[chatId].state = ADD_OPTION_NAME;
        events[chatId].options = [];
        events[chatId].optionDateTimes = [];
        events[chatId].optionLocations = [];
        events[chatId].optionTypes = [];
    } else {
        if(events[chatId].pure){
            sendMessage(bot, chatId, `Evento ${events[chatId].event_name} adicionado!`);
        }else{
            sendMessage(bot, chatId, `Nome do evento: ${events[chatId].event_name}\nCriando a enquete...`);
        }
        return createSimpleEvent(bot, chatId, targetChat, targetThread);
    }
};

const createTypeKeyboard = {
    keyboard: [
        ["Reunião interna ord.", "Reunião interna extr."],
        ["Reunião externa"],
        ["Ato regional", "Ato não regional"],
        ["Panfletagem", "Banca", "Lambe"],
        ["Evento nosso", "Evento interno", "Evento externo"],
        ["Live", "Atividade Online"],
        ["Outros"]
    ],
    resize_keyboard: true,
    one_time_keyboard: true,
};

const receiveLocation = (bot, msg) => {
    const chatId = msg.chat.id;

    const locationNames = createLocationKeyboard.keyboard.flat();
    
    if(!locationNames.includes(msg.text)){
        sendMessage(bot, chatId, `Por favor, escolha um local válido da lista: ${locationNames.join(', ')}.`);
        return;
    }

    events[chatId].location = msg.text;
    sendMessage(bot, chatId, `Ótimo! Você selecionou o local: ${events[chatId].location}\nAgora, selecione o tipo da atividade:`,
        {reply_markup: createTypeKeyboard}
    );

    events[chatId].state = TYPE;
};

const receiveType = (bot, msg) => {
    const chatId = msg.chat.id;

    const possibleTypes = createTypeKeyboard.keyboard.flat();

    if(!possibleTypes.includes(msg.text)){
        sendMessage(bot, chatId, `Por favor, escolha um tipo válido da lista: ${possibleTypes.join(', ')}.`);
        return;
    }

    events[chatId].type = msg.text;
    sendMessage(bot, chatId, `Ótimo! Você selecionou o tipo da atividade: ${events[chatId].type}\nAgora, responda com o nome da atividade:`);
    events[chatId].state = EVENT_NAME;
};

const addOptionName = (bot, msg, targetChat, targetThread) => {
    const chatId = msg.chat.id;
    if (msg.text.toLowerCase() === 'ok') {
        if (events[chatId].options.length === 0) {
            return sendMessage(bot, chatId, "Você não adicionou nenhuma atividade para a enquete. Adicione ao menos uma atividade.");
        } else {
            if(events[chatId].pure){
                sendMessage(bot, chatId, `Você adicionou ${events[chatId].options.length} atividades.`);
            } else {
                sendMessage(bot, chatId, `Você adicionou ${events[chatId].options.length} opções para a enquete múltipla.\nCriando a enquete...`);
            }
            return createMultiDateEvent(bot, chatId, targetChat, targetThread);
        }
    } else {
        if (msg.text.length >= 50) {
            return sendMessage(bot, chatId, "Texto muito longo. Reescreva com menos de 50 caracteres:");
        } else {
            events[chatId].options.push(msg.text);
            sendMessage(bot, chatId, `Opção '${msg.text}' adicionada. Por favor responda com data e hora da atividade no formato (e.g., '2023-09-13 15:00').`);
            events[chatId].state = ADD_OPTION_DATETIME;
            return;
        }
    }
};

const addOptionDatetime = (bot, msg) => {
    const chatId = msg.chat.id;

    if(!isValidDateTimeFormat(msg.text)){
        sendMessage(bot, chatId, 'O formato válido é "aaaa-MM-dd HH:mm". Por favor, insira a data nesse formato.');
        return;
    }

    events[chatId].optionDateTimes.push(msg.text);
    sendMessage(bot, 
        chatId, `Data e hora '${msg.text}' adicionada. Selecione o local:`,
        {reply_markup: createLocationKeyboard});
    events[chatId].state = ADD_OPTION_LOCATION;
};

const addOptionLocation = (bot, msg) => {
    const chatId = msg.chat.id;

    const locationNames = createLocationKeyboard.keyboard.flat();
    
    if(!locationNames.includes(msg.text)){
        sendMessage(bot, chatId, `Por favor, escolha um local válido da lista: ${locationNames.join(', ')}.`);
        return;
    }

    events[chatId].optionLocations.push(msg.text);
    sendMessage(bot, 
                chatId, `Local '${msg.text}' adicionado. Selecione o tipo de atividade:`,
                {reply_markup: createTypeKeyboard});
    events[chatId].state = ADD_OPTION_TYPE;
};

const addOptionType = (bot, msg) => {
    const chatId = msg.chat.id;

    const possibleTypes = createTypeKeyboard.keyboard.flat();

    if(!possibleTypes.includes(msg.text)){
        sendMessage(bot, chatId, `Por favor, escolha um tipo válido da lista: ${possibleTypes.join(', ')}.`);
        return;
    }

    events[chatId].optionTypes.push(msg.text);
    sendMessage(bot, chatId, `Tipo '${msg.text}' adicionado. Adicione mais opções ou 'ok' para finalizar.`)
    events[chatId].state = ADD_OPTION_NAME;
};

const createSimpleEvent = async (bot, chatId, targetChat, targetThread) => {
    const dateTime = DateTime.fromFormat(events[chatId].date_time, 'yyyy-MM-dd HH:mm').toFormat("cccc (dd/MM) à's' HH:mm", { locale: 'pt-BR' })
    const poll_question = `${events[chatId].event_name}, ${dateTime} - ${events[chatId].location}`;
    const options = ["Presente", "Ausente"];

    const addAtividade = (pollId) => {
        addEvent({
            id: generateUUID(),
            event_name: events[chatId].event_name, 
            date_time: events[chatId].date_time,
            location: events[chatId].location,
            type: events[chatId].type,
            poll_message_id: pollId
        });
        delete events[chatId];
    };

    if(events[chatId].pure){
        return addAtividade(undefined);
    }else{
        try{
            const poll = await sendPoll(bot, targetChat, poll_question, options,
                { is_anonymous: false, 
                message_thread_id: targetThread });
            return await Promise.all([
                addAtividade(poll.message_id),
                pinChatMessage(bot, targetChat, poll.message_id)]);
        }catch(e){
            console.log('error polling => ', e)
        }
    }
};

const createMultiDateEvent = async (bot, chatId, targetChat, targetThread) => {
    const poll_question = `Sua disponibilidade para '${events[chatId].event_name}':`;
    const newEvents = [];
    const options = events[chatId].options.map((option, index) => {
        const dateTime = events[chatId].optionDateTimes[index];
        const dateTimeFormatted = DateTime.fromFormat(dateTime, 'yyyy-MM-dd HH:mm').toFormat("cccc (dd/MM) à's' HH:mm", { locale: 'pt-BR' })
        const location = events[chatId].optionLocations[index];
        const type = events[chatId].optionTypes[index];
        newEvents.push({
            event_name: option, 
            date_time: dateTime,
            location,
            type
        });
        return `${option}, ${dateTimeFormatted} - ${location}`;
    });
    options.push('Ausente em todas');

    const addAtividades = (pollId) => {
        const newEventsComplete = newEvents.map((event) => {
            event.poll_message_id = pollId;
            event.id = generateUUID();
            return event;
        });
        addEvents(newEventsComplete);
        delete events[chatId];
    };

    if(events[chatId].pure){
        return addAtividades(undefined);
    }else{
        try{
            const poll = await sendPoll(bot, targetChat, poll_question, options, 
                {is_anonymous: false,
                 allows_multiple_answers: true,
                 message_thread_id: targetThread});
            return await Promise.all([
                addAtividades(poll.message_id),
                pinChatMessage(bot, targetChat, poll.message_id)]);
        }catch(e){
            console.log('error polling => ', e);
        }
    }
};

const nextState = (bot, msg, targetChat, targetThread) => {
    const chatId = msg.chat.id;

    if (events[chatId] && events[chatId].state === DATE) {
        receiveDateTime(bot, msg);
    } else if (events[chatId] && events[chatId].state === EVENT_NAME) {
        receiveEventName(bot, msg, targetChat, targetThread);
    } else if (events[chatId] && events[chatId].state === LOCATION) {
        receiveLocation(bot, msg);
    } else if (events[chatId] && events[chatId].state === TYPE) {
        receiveType(bot, msg);
    } else if (events[chatId] && events[chatId].state === ADD_OPTION_NAME) {
        addOptionName(bot, msg, targetChat, targetThread);
    } else if (events[chatId] && events[chatId].state === ADD_OPTION_DATETIME) {
        addOptionDatetime(bot, msg);
    } else if (events[chatId] && events[chatId].state === ADD_OPTION_LOCATION) {
        addOptionLocation(bot, msg);
    } else if (events[chatId] && events[chatId].state === ADD_OPTION_TYPE) {
        addOptionType(bot, msg);
    }
}

const onFechaEnquetes = async (bot, targetChat, targetThread, msg) => {
    const chatId = msg.chat.id;
    const currentDate = DateTime.now();

    const { events: fetchedEvents } = await getEvents();
    const groupedEvents = groupByPollMessageId(fetchedEvents);
    const undefinedPollEvents = filterByPollMessageUndefined(fetchedEvents);

    const markedGroupedEvents = markOutdatedEventsGroupedByPollId(currentDate, groupedEvents);

    markedGroupedEvents.forEach(([pollId, events]) => {
        const allEventsOutdated = events.every(event => event.outdated);
        if(allEventsOutdated){
            stopPoll(bot, targetChat, pollId, { message_thread_id: targetThread });
            unpinChatMessage(bot, targetChat, pollId);
        }
    });

    const updatedEventsMap = markedGroupedEvents.reduce((map, [pollId, events]) => {
        const someEventsNotOutdated = events.some(event => !event.outdated);
        if (someEventsNotOutdated) {
          map.set(pollId, events);
        }
        return map;
    }, new Map());

    const futureUndefinedPollEvents = undefinedPollEvents.filter((event) => {
        if(event.date_time){
            const eventDate = DateTime.fromFormat(event.date_time, 'yyyy-MM-dd HH:mm');
            return eventDate > currentDate;
        }
        return false;
    });

    // Convert the updated events back to an array
    const updatedEvents = futureUndefinedPollEvents.concat(...updatedEventsMap.values());

    // Replace the events
    replaceEvents(updatedEvents);

    sendMessage(bot, chatId, "Enquetes vencidas finalizadas.");
}

module.exports = {
    onFechaEnquetes,
    startEvent,
    startSimple,
    startMultiple,
    clearMemory,
    onPollAnswer,
    nextState,
    inMemEvents,
    updateEvents,
    receiveDateTime,
    receiveLocation,
    receiveEventName,
    receiveType,
    addOptionName,
    addOptionLocation,
    addOptionDatetime,
    addOptionType
}