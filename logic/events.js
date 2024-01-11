const { DateTime } = require("luxon");

const groupByPollMessageId = (events) => {
    return events.reduce((result, item) => {
        const { poll_message_id, ...rest } = item;
        if(poll_message_id !== undefined){
            if (!result[poll_message_id]) {
                result[poll_message_id] = [];
            }
            result[poll_message_id].push({ poll_message_id, ...rest });
        }
        return result;
      }, {});
};

const filterByPollMessageUndefined = (events) => {
    return events.filter((item) => item.poll_message_id === undefined, {});
};

const markOutdatedEventsGroupedByPollId = (now, groupedEvents) => {
    const mappedEvents = Object.entries(groupedEvents).map(([pollId, events]) => {
        const updatedEvents = events.map((event) => {
          if (!event.date_time) return event;
          const eventDate = DateTime.fromFormat(event.date_time, 'yyyy-MM-dd HH:mm');
          event.outdated = eventDate <= now;
          return event;
        });
      
        return [pollId, updatedEvents];
    });
    return mappedEvents;
};

const markOutdatedEvents = (now, events) => {
    const mappedEvents = events.map((event) => {
        if (!event.date_time) return event;
        const eventDate = DateTime.fromFormat(event.date_time, 'yyyy-MM-dd HH:mm');
        event.outdated = eventDate <= now;
        return event;
    });
    return mappedEvents;
};

const filterEventsByDaysLimit = (now, events, daysLimit) => {
    const minDate = now.minus({ days: daysLimit });
    console.log('minDate', minDate);
    const filteredEvents = events.filter(event => {
      const eventDate = DateTime.fromFormat(event.date_time, 'yyyy-MM-dd HH:mm', { zone: 'utc' });
      console.log('minDate', minDate);
      console.log('dates compare', eventDate < minDate);
      return eventDate < minDate;
    });
  
    return filteredEvents;
};

module.exports = {
    groupByPollMessageId,
    filterByPollMessageUndefined,
    markOutdatedEventsGroupedByPollId,
    markOutdatedEvents,
    filterEventsByDaysLimit
}