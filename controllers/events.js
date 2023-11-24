const { DateTime } = require("luxon");
const { replaceEvents, getEvents } = require("../http_out/jsonstorage");
const { sendMessage, unpinChatMessage, stopPoll } = require("../http_out/telegram");
const { groupByPollMessageId, filterByPollMessageUndefined, markOutdatedEventsGroupedByPollId } = require("../logic/events");

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
    onFechaEnquetes
}