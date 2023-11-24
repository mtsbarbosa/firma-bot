const { DateTime } = require("luxon");
const { 
  groupByPollMessageId, 
  filterByPollMessageUndefined,
  markOutdatedEventsGroupedByPollId,
  filterEventsByDaysLimit
} = require("../../logic/events");

const events = [
  { "event_name": "1", "date_time": "2023-11-14 18:30", "poll_message_id": 79},
  { "event_name": "2", "date_time": "2023-11-12 10:00", "poll_message_id": 79},
  { "event_name": "3", "date_time": "2023-11-13 09:15", "poll_message_id": 81},
  { "event_name": "4", "date_time": "2023-11-13 09:15"}
];

test('groupByPollMessageId groups by poll id', () => {
  const grouped = groupByPollMessageId(events);
  expect(grouped).toEqual({
    "79": [
        { "event_name": "1", "date_time": "2023-11-14 18:30", "poll_message_id": 79},
        { "event_name": "2", "date_time": "2023-11-12 10:00", "poll_message_id": 79}],
    "81": [{ "event_name": "3", "date_time": "2023-11-13 09:15", "poll_message_id": 81}]});
});

test('groupByPollMessageId when no events', () => {
  const grouped = groupByPollMessageId([]);
  expect(grouped).toEqual({});
});

test('filterByPollMessageUndefined groups', () => {
    const filteredEvents = filterByPollMessageUndefined([
        { "event_name": "1", "date_time": "2023-11-14 18:30", "poll_message_id": 79},
        { "event_name": "2", "date_time": "2023-11-12 09:45"},
        { "event_name": "3", "date_time": "2023-11-13 09:15", "poll_message_id": 81},
        { "event_name": "4", "date_time": "2023-11-13 09:15"}
      ]);
    expect(filteredEvents).toEqual([
        { "event_name": "2", "date_time": "2023-11-12 09:45"},
        { "event_name": "4", "date_time": "2023-11-13 09:15"}
    ]);
  });
  
  test('groupByPollMessageId when no events', () => {
    const filteredEvents = filterByPollMessageUndefined([]);
    expect(filteredEvents).toEqual([]);
  });

  test('markOutdatedEventsGroupedByPollId when there are events', () => {
    const result = markOutdatedEventsGroupedByPollId(
      DateTime.fromISO('2023-11-15T12:00:00.000Z'),
      {"79": [
        { "event_name": "1", "date_time": "2023-11-14 18:30", "poll_message_id": 79},
        { "event_name": "2", "date_time": "2023-11-12 09:45", "poll_message_id": 79}],
       "81": [
        { "event_name": "3", "date_time": "2023-11-13 09:15", "poll_message_id": 81},
        { "event_name": "4", "date_time": "2023-11-16 09:15", "poll_message_id": 81}
      ]});
    expect(result).toEqual(
      [["79", [
        { "event_name": "1", "date_time": "2023-11-14 18:30", "poll_message_id": 79, "outdated": true},
        { "event_name": "2", "date_time": "2023-11-12 09:45", "poll_message_id": 79, "outdated": true}]],
       ["81", [
        { "event_name": "3", "date_time": "2023-11-13 09:15", "poll_message_id": 81, "outdated": true},
        { "event_name": "4", "date_time": "2023-11-16 09:15", "poll_message_id": 81, "outdated": false}]]]
    );
  });

  test('markOutdatedEventsGroupedByPollId when there are no events', () => {
    const result = markOutdatedEventsGroupedByPollId(
      DateTime.fromISO('2023-11-15T12:00:00.000Z'),
      {});
    expect(result).toEqual([]);
  });

  test('filterEventsByDaysLimit returns events older than two days', () => {
    const filteredEvents = filterEventsByDaysLimit(DateTime.fromISO('2023-11-15T12:00:00.000Z'), [
      { "event_name": "1", "date_time": "2023-11-14 18:30" },
      { "event_name": "2", "date_time": "2023-11-12 10:00" },
      { "event_name": "3", "date_time": "2023-11-13 09:15" },
    ], 2);
    expect(filteredEvents.sort()).toEqual([
      { "event_name": "2", "date_time": "2023-11-12 10:00" },
    ].sort());
  });
  
  test('filterEventsByDaysLimit returns an empty array when no events match the limit', () => {
    const filteredEvents = filterEventsByDaysLimit(DateTime.fromISO('2023-11-15T12:00:00.000Z'), [
      { "event_name": "1", "date_time": "2023-11-14 18:30" },
      { "event_name": "2", "date_time": "2023-11-12 10:00" },
      { "event_name": "3", "date_time": "2023-11-13 09:15" },
    ], 10);
    expect(filteredEvents).toEqual([]);
  });
  
  test('filterEventsByDaysLimit returns all events when limit is zero', () => {
    const events = [
      { "event_name": "1", "date_time": "2023-11-14 18:30" },
      { "event_name": "2", "date_time": "2023-11-12 10:00" },
      { "event_name": "3", "date_time": "2023-11-13 09:15" },
    ];
    const filteredEvents = filterEventsByDaysLimit(DateTime.fromISO('2023-11-15T12:00:00.000Z'), events, 0);
    expect(filteredEvents).toEqual(events);
  });