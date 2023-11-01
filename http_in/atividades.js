const { DateTime } = require('luxon');
const { getEvents, addEvent, addEvents, replaceEvents } = require('../http_out/jsonstorage');
const { sendMessage, sendPoll, stopPoll, onReceiveText, pinChatMessage, unpinChatMessage } = require('../http_out/telegram');

const events = [];

const DATE = 0;
const EVENT_NAME = 1;
const CREATE_POLL = 2;
const LOCATION = 3;
const TYPE = 4;
const ADD_OPTION_NAME = 5;
const ADD_OPTION_DATETIME = 6;
const ADD_OPTION_LOCATION = 7;
const ADD_OPTION_TYPE = 8;
const CALENDAR_REQUEST = 9;

const createEventMessage = "Você quer uma atividade simples ou multipla?";
const addOptionNameMessage = "Por favor responda com o nome da próxima opção (responda 'ok' quando finalizado).";

const startConversation = (bot, msg) => {
    const chatId = msg.chat.id;
    sendMessage(bot, chatId, createEventMessage);
    events[chatId] = { state: CREATE_POLL };
};

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
    events[chatId].date_time = msg.text;
    sendMessage(bot, chatId, `Ótimo! Você selecionou a data e hora da atividade: ${events[chatId].date_time}\nAgora, selecione o local da atividade:`,
                {reply_markup: createLocationKeyboard});
    events[chatId].state = LOCATION;
};

const receiveEventName = (bot, msg, targetChat, targetThread) => {
    const chatId = msg.chat.id;
    events[chatId].event_name = msg.text;
    if (events[chatId].create_multi_date) {
        sendMessage(bot, chatId, addOptionNameMessage);
        events[chatId].state = ADD_OPTION_NAME;
        events[chatId].options = [];
        events[chatId].optionDateTimes = [];
        events[chatId].optionLocations = [];
        events[chatId].optionTypes = [];
    } else {
        sendMessage(bot, chatId, `Nome do evento: ${events[chatId].event_name}\nCriando a enquete...`);
        createSimpleEvent(chatId, targetChat, targetThread);
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
    events[chatId].location = msg.text;
    sendMessage(bot, chatId, `Ótimo! Você selecionou o local: ${events[chatId].location}\nAgora, selecione o tipo da atividade:`,
        {reply_markup: createTypeKeyboard}
    );

    events[chatId].state = TYPE;
};

const receiveType = (bot, msg) => {
    const chatId = msg.chat.id;
    events[chatId].type = msg.text;
    sendMessage(bot, chatId, `Ótimo! Você selecionou o tipo da atividade: ${events[chatId].type}\nAgora, responda com o nome da atividade:`);
    events[chatId].state = EVENT_NAME;
};

const addOptionName = (bot, msg, targetChat, targetThread) => {
    const chatId = msg.chat.id;
    if (msg.text.toLowerCase() === 'ok') {
        if (events[chatId].options.length === 0) {
            sendMessage(bot, chatId, "Você não adicionou nenhuma opção para a enquete. Adicione ao menos uma opção.");
        } else {
            sendMessage(bot, chatId, `Você adicionou ${events[chatId].options.length} opções para a enquete múltipla.\nCriando a enquete...`);
            createMultiDateEvent(chatId, targetChat, targetThread);
        }
    } else {
        events[chatId].options.push(msg.text);
        sendMessage(bot, chatId, `Opção '${msg.text}' adicionada. Por favor responda com data e hora da atividade no formato (e.g., '2023-09-13 15:00').`);
        events[chatId].state = ADD_OPTION_DATETIME;
    }
};

const addOptionDatetime = (bot, msg) => {
    const chatId = msg.chat.id;
    events[chatId].optionDateTimes.push(msg.text);
    sendMessage(bot, 
        chatId, `Data e hora '${msg.text}' adicionada. Selecione o local:`,
        {reply_markup: createLocationKeyboard});
    events[chatId].state = ADD_OPTION_LOCATION;
};

const addOptionLocation = (bot, msg) => {
    const chatId = msg.chat.id;
    events[chatId].optionLocations.push(msg.text);
    sendMessage(bot, 
                chatId, `Local '${msg.text}' adicionado. Selecione o tipo de atividade:`,
                {reply_markup: createTypeKeyboard});
    events[chatId].state = ADD_OPTION_TYPE;
};

const addOptionType = (bot, msg) => {
    const chatId = msg.chat.id;
    events[chatId].optionTypes.push(msg.text);
    sendMessage(bot, chatId, `Tipo '${msg.text}' adicionado. Adicione mais opções ou 'ok' para finalizar.`)
    events[chatId].state = ADD_OPTION_NAME;
};

const createSimpleEvent = (bot, chatId, targetChat, targetThread) => {
    const dateTime = DateTime.fromFormat(events[chatId].date_time, 'yyyy-MM-dd HH:mm').toFormat("cccc (dd/MM) à's' HH:mm", { locale: 'pt-BR' })
    const poll_question = `${events[chatId].event_name}, ${dateTime} - ${events[chatId].location}`;
    const options = ["Presente", "Ausente"];
    sendPoll(bot, targetChat, poll_question, options,
        { is_anonymous: false, 
          message_thread_id: targetThread })
    .then((poll) => {
        addEvent({
            event_name: events[chatId].event_name, 
            date_time: events[chatId].date_time,
            location: events[chatId].location,
            type: events[chatId].type,
            poll_message_id: poll.message_id
        });
        pinChatMessage(bot, targetChat, poll.message_id);
        delete events[chatId];
    });
};

const createMultiDateEvent = (bot, chatId, targetChat, targetThread) => {
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
    sendPoll(bot, targetChat, poll_question, options, 
        {is_anonymous: false,
         allows_multiple_answers: true,
         message_thread_id: targetThread})
    .then((poll) => {
        const newEventsComplete = newEvents.map((event) => {
            event.poll_message_id = poll.message_id;
            return event;
        });
        addEvents(newEventsComplete);
        pinChatMessage(bot, targetChat, poll.message_id);
        delete events[chatId];
    });
};

const generateCalendar = async (bot, chatId) => {
    const { events: userEvents } = await getEvents();
    if (userEvents.length === 0) {
        sendMessage(bot, chatId, "Sem atividades para mostrar no calendário.");
    } else {
        userEvents.sort((a, b) => (a.date_time > b.date_time) ? 1 : -1);

        let calendarMessage = "*CALENDÁRIO*:\n\n";

        // Group events by month
        const eventsByMonth = userEvents.reduce((acc, event) => {
            const monthKey = DateTime.fromFormat(event.date_time, 'yyyy-MM-dd HH:mm').toFormat('LLLL yyyy', { locale: 'pt-BR' });
            if (!acc[monthKey]) {
                acc[monthKey] = [];
            }
            acc[monthKey].push(event);
            return acc;
        }, {});

        // Iterate over each month and its events
        for (const [month, monthEvents] of Object.entries(eventsByMonth)) {
        // Format month title with emoji
        calendarMessage += `🗓️ *${month.toUpperCase()}*\n`;

        // Group events by week within the month
        const eventsByWeek = monthEvents.reduce((acc, event) => {
            const weekNumber = DateTime.fromFormat(event.date_time, 'yyyy-MM-dd HH:mm').toFormat('W', { locale: 'pt-BR' });
            if (!acc[weekNumber]) {
            acc[weekNumber] = [];
            }
            acc[weekNumber].push(event);
            return acc;
        }, {});

        // Iterate over each week and its events
        for (const [week, weekEvents] of Object.entries(eventsByWeek)) {
            // Format week title
            calendarMessage += `⤵️ semana ${week}\n`;

            // List events within the week
            weekEvents.forEach((event) => {
                const dateTime = DateTime.fromFormat(event.date_time, 'yyyy-MM-dd HH:mm').toFormat("cccc (dd/MM) à's' HH:mm", { locale: 'pt-BR' })
            calendarMessage += `➡️ ${event.event_name} - ${event.location}\n⏰ ${dateTime}\n\n`;
            });
        }
        }

        sendMessage(bot, chatId, calendarMessage, { parse_mode: 'Markdown' });
    }
    delete events[chatId];
};

const groupByPollMessageId = (events) => {
    return events.reduce((result, item) => {
        const { poll_message_id, ...rest } = item;
        if (!result[poll_message_id]) {
          result[poll_message_id] = [];
        }
        result[poll_message_id].push({ poll_message_id, ...rest });
        return result;
      }, {});
};

const init = (bot, targetChat, targetThread) => {
    onReceiveText(bot, /\/atividade/, (msg) => {
        startConversation(bot, msg);
    });
    
    onReceiveText(bot, /simples/, (msg) => {
        const chatId = msg.chat.id;
        events[chatId].create_multi_date = false;
        sendMessage(bot, chatId, "Atividade simples.\nPor favor responda com a data no formato (e.g., '2023-09-13 15:00').");
        events[chatId].state = DATE;
    });
    
    onReceiveText(bot, /multipla/, (msg) => {
        const chatId = msg.chat.id;
        events[chatId].create_multi_date = true;
        sendMessage(bot, chatId, "Múltiplas atividades.\nPor favor qual o nome da enquete?");
        events[chatId].state = EVENT_NAME;
    });
    
    onReceiveText(bot, /\/calendario/, (msg) => {
        const chatId = msg.chat.id;
        events[chatId] = { state: CALENDAR_REQUEST };
        generateCalendar(bot, chatId);
    });
    
    onReceiveText(bot, /\/fecha_enquetes/, async (msg) => {
        const chatId = msg.chat.id;
        const currentDate = DateTime.now();
    
        const { events: fetchedEvents } = await getEvents();
        const groupedEvents = groupByPollMessageId(fetchedEvents);
    
        // Create a Map to store non-outdated events
        const updatedEventsMap = new Map();
    
        Object.entries(groupedEvents).forEach(([pollId, events]) => {
            const allEventsOutdated = events.every(event => {
                if (!event.date_time) return false;
                const eventDate = DateTime.fromFormat(event.date_time, 'yyyy-MM-dd HH:mm');
                return eventDate <= currentDate;
            });
            
            if (!allEventsOutdated) {
                updatedEventsMap.set(pollId, events);
            }else{
                stopPoll(bot, targetChat, pollId, {message_thread_id: targetThread});
                unpinChatMessage(bot, targetChat, pollId);
            }
        });
    
        // Convert the updated events back to an array
        const updatedEvents = [].concat(...updatedEventsMap.values());
    
        // Replace the events
        replaceEvents(updatedEvents);
    
        sendMessage(bot, chatId, "Enquetes vencidas finalizadas.");
    });
    
    onReceiveText(bot, /\/fecha_enquetes/, async (msg) => {
        const chatId = msg.chat.id;
        const currentDate = DateTime.now();
    
        const { events: fetchedEvents } = await getEvents();
        const groupedEvents = groupByPollMessageId(fetchedEvents);
    
        // Create a Map to store non-outdated events
        const updatedEventsMap = new Map();
    
        Object.entries(groupedEvents).forEach(([pollId, events]) => {
            const allEventsOutdated = events.every(event => {
                if (!event.date_time) return false;
                const eventDate = DateTime.fromFormat(event.date_time, 'yyyy-MM-dd HH:mm');
                return eventDate <= currentDate;
            });
            
            if (!allEventsOutdated) {
                updatedEventsMap.set(pollId, events);
            }else{
                stopPoll(bot, targetChat, pollId, {message_thread_id: targetThread});
                unpinChatMessage(bot, targetChat, pollId);
            }
        });
    
        // Convert the updated events back to an array
        const updatedEvents = [].concat(...updatedEventsMap.values());
    
        // Replace the events
        replaceEvents(updatedEvents);
    
        sendMessage(bot, chatId, "Enquetes vencidas finalizadas.");
    });

}

const onReceiveAnyText = (bot, msg, targetChat, targetThread) => {
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

module.exports = {
    init,
    onReceiveAnyText
};