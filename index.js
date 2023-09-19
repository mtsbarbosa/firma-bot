require('dotenv').config()
const TelegramBot = require('node-telegram-bot-api');
const { DateTime } = require('luxon');
const { getEvents, addEvent, addEvents, replaceEvents } = require('./jsonstorage-http-out');

const botToken = process.env.BOT_TOKEN;

const bot = new TelegramBot(botToken, { polling: true });

const events = [];

const DATE = 0;
const EVENT_NAME = 1;
const CREATE_POLL = 2;
const MULTI_DATE = 3;
const ADD_OPTION_NAME = 4;
const ADD_OPTION_DATETIME = 5;
const CALENDAR_REQUEST = 6;

const createEventMessage = "Você quer uma atividade simples ou multipla?";
const addOptionNameMessage = "Por favor responda com o nome da próxima opção (responda 'ok' quando finalizado).";

const startConversation = (msg) => {
    const chatId = msg.chat.id;
    bot.sendMessage(chatId, createEventMessage);
    events[chatId] = { state: CREATE_POLL };
};

const receiveDateTime = (msg) => {
    const chatId = msg.chat.id;
    events[chatId].date_time = msg.text;
    bot.sendMessage(chatId, `Ótimo! Você selecionou a data e hora da atividade: ${events[chatId].date_time}\nAgora, responda com o nome da atividade:`);
    events[chatId].state = EVENT_NAME;
};

const receiveEventName = (msg) => {
    const chatId = msg.chat.id;
    events[chatId].event_name = msg.text;
    if (events[chatId].create_multi_date) {
        bot.sendMessage(chatId, addOptionNameMessage);
        events[chatId].state = ADD_OPTION_NAME;
        events[chatId].options = [];
        events[chatId].optionDateTimes = [];
    } else {
        bot.sendMessage(chatId, `Nome do evento: ${events[chatId].event_name}\nCriando a enquete...`);
        createSimpleEvent(chatId);
    }
};

const addOptionName = (msg) => {
    const chatId = msg.chat.id;
    if (msg.text.toLowerCase() === 'ok') {
        if (events[chatId].options.length === 0) {
            bot.sendMessage(chatId, "Você não adicionou nenhuma opção para a enquete. Adicione ao menos uma opção.");
        } else {
            bot.sendMessage(chatId, `Você adicionou ${events[chatId].options.length} opções para a enquete múltipla.\nCriando a enquete...`);
            createMultiDateEvent(chatId);
        }
    } else {
        events[chatId].options.push(msg.text);
        bot.sendMessage(chatId, `Opção '${msg.text}' adicionada. Por favor responda com data e hora da atividade no formato (e.g., '2023-09-13 15:00').`);
        events[chatId].state = ADD_OPTION_DATETIME;
    }
};

const addOptionDatetime = (msg) => {
    const chatId = msg.chat.id;
    if (msg.text.toLowerCase() === 'ok') {
        bot.sendMessage(chatId, `Você adicionou todas as opções para tarefas múltiplas.\nCriando a enquete...`);
        createMultiDateEvent(chatId);
    } else {
        events[chatId].optionDateTimes.push(msg.text);
        bot.sendMessage(chatId, `Data e hora '${msg.text}' adicionada. Adicione mais opções ou 'ok' para finalizar.`);
        events[chatId].state = ADD_OPTION_NAME;
    }
};

const createSimpleEvent = (chatId) => {
    const poll_question = `Presença na atividade: '${events[chatId].event_name}' em ${events[chatId].date_time}?`;
    const options = ["Presente", "Ausente"];
    bot.sendPoll(chatId, poll_question, options, { is_anonymous: false })
        .then((poll) => {
            addEvent({
                event_name: events[chatId].event_name, 
                date_time: events[chatId].date_time,
                poll_message_id: poll.message_id
            });
            delete events[chatId];
        });
};

const createMultiDateEvent = (chatId) => {
    const poll_question = `Sua disponibilidade para as atividades: '${events[chatId].event_name}' nestas datas:`;
    const newEvents = [];
    const options = events[chatId].options.map((option, index) => {
        const dateTime = events[chatId].optionDateTimes[index];
        newEvents.push({event_name: option, date_time: dateTime});
        return `${option} em ${dateTime}`;
    });
    options.push('Ausente em todas');
    bot.sendPoll(chatId, poll_question, options, { is_anonymous: false, allows_multiple_answers: true })
        .then((poll) => {
            const newEventsComplete = newEvents.map((event) => {
                event.poll_message_id = poll.message_id;
                return event;
            })
            addEvents(newEventsComplete);
            delete events[chatId];
        });
};

/*const generateCalendar = async (chatId) => {
    const {events: userEvents} = await getEvents();
    if (userEvents.length === 0) {
        bot.sendMessage(chatId, "Sem atividades para mostrar no calendário.");
    } else {
        userEvents.sort((a, b) => (a.date_time > b.date_time) ? 1 : -1);
        let calendarMessage = "Calendário de atividades:\n\n";
        userEvents.forEach((event) => {
            calendarMessage += `Atividade: ${event.event_name}\nData e hora: ${event.date_time}\n\n`;
        });
        bot.sendMessage(chatId, calendarMessage);
    }
    delete events[chatId]
};*/
const generateCalendar = async (chatId) => {
    const { events: userEvents } = await getEvents();
    if (userEvents.length === 0) {
        bot.sendMessage(chatId, "Sem atividades para mostrar no calendário.");
    } else {
        userEvents.sort((a, b) => (a.date_time > b.date_time) ? 1 : -1);

        let calendarMessage = "Calendário de atividades:\n\n";

        // Group events by month
        const eventsByMonth = userEvents.reduce((acc, event) => {
            console.log('event', event);
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
            calendarMessage += `⤵️ *semana ${week}*\n`;

            // List events within the week
            weekEvents.forEach((event) => {
            calendarMessage += `➡️ ${event.event_name}\nData e hora: ${event.date_time}\n\n`;
            });
        }
        }

        bot.sendMessage(chatId, calendarMessage, { parse_mode: 'Markdown' });
    }
    delete events[chatId];
};

bot.onText(/\/atividade/, (msg) => {
    startConversation(msg);
});

bot.onText(/simples/, (msg) => {
    const chatId = msg.chat.id;
    events[chatId].create_multi_date = false;
    bot.sendMessage(chatId, "Atividade simples.\nPor favor responda com a data no formato (e.g., '2023-09-13 15:00').");
    events[chatId].state = DATE;
});

bot.onText(/multipla/, (msg) => {
    const chatId = msg.chat.id;
    events[chatId].create_multi_date = true;
    bot.sendMessage(chatId, "Múltiplas atividades.\nPor favor qual o nome da enquete?");
    events[chatId].state = EVENT_NAME;
});

bot.onText(/\/calendario/, (msg) => {
    const chatId = msg.chat.id;
    events[chatId] = { state: CALENDAR_REQUEST };
    generateCalendar(chatId);
});

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

bot.onText(/\/fecha_enquetes/, async (msg) => {
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
            bot.stopPoll(chatId, pollId);
        }
    });

    // Convert the updated events back to an array
    const updatedEvents = [].concat(...updatedEventsMap.values());

    // Replace the events
    replaceEvents(updatedEvents);

    bot.sendMessage(chatId, "Feito.");
});

bot.on('poll_answer', (pollAnswer) => {
    const userId = pollAnswer.user.id;
    const pollId = pollAnswer.poll_id;

    console.log('pollAnswer', pollAnswer);
    /*
pollAnswer {
  poll_id: '4920718171029110XXX',
  user: {
    id: 103100XXX,
    is_bot: false,
    first_name: 'MyName',
    last_name: 'MySurname',
    username: 'myusername'
  },
  option_ids: [ 1 ]
}
    */

    // Store the user's response in the database
    /*userResponses[userId] = {
        pollId,
        choice: pollAnswer.option_ids[0], // Store the choice made by the user
    };*/
});

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

bot.on('text', (msg) => {
    const chatId = msg.chat.id;

    if (events[chatId] && events[chatId].state === DATE) {
        receiveDateTime(msg);
    } else if (events[chatId] && events[chatId].state === EVENT_NAME) {
        receiveEventName(msg);
    } else if (events[chatId] && events[chatId].state === ADD_OPTION_NAME) {
        addOptionName(msg);
    } else if (events[chatId] && events[chatId].state === ADD_OPTION_DATETIME) {
        addOptionDatetime(msg);
    }
});

console.log('Bot is running...');
