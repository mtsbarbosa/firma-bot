const { sendMessage, unpinChatMessage, stopPoll } = require('../../http_out/telegram');
const { getEvents, replaceEvents, replaceAvailabilities } = require('../../http_out/jsonstorage');
const { onFechaEnquetes } = require('../../controllers/events');

jest.mock('../../http_out/jsonstorage.js');

jest.mock('../../http_out/telegram.js', () => {
  return {
    sendMessage: jest.fn(),
    unpinChatMessage: jest.fn(),
    stopPoll: jest.fn()
  };
});

jest.mock('luxon', () => ({
    DateTime: {
      now: jest.fn(() => jest.requireActual('luxon').DateTime.fromISO('2023-11-15T12:00:00.000Z')),
      fromFormat: jest.fn((a, b) => jest.requireActual('luxon').DateTime.fromFormat(a, b))
    },
}));

beforeEach(() => {
  jest.clearAllMocks();
  getEvents.mockImplementation(() => Promise.resolve(
    {"events":[], "availabilities":[{"id":"7e974c87-60e9-4bfa-8418-8a1b38b0ccca","name":"Próximas atividades","dates":["2023-11-30 10:00","2023-11-30 14:00"],"poll_message_id":141}]}));
});

test('onFechaEnquetes outdated singles are removed', async () => {
  getEvents.mockImplementation(() => Promise.resolve(
    {"events":[
        { "event_name": "2", "date_time": "2023-11-12 10:00", "poll_message_id": 79},
        { "event_name": "3", "date_time": "2023-11-13 09:15", "poll_message_id": 81},
        { "event_name": "4", "date_time": "2023-11-16 09:15", "poll_message_id": 82}
      ], "availabilities":[{
        "id":"7e974c87-60e9-4bfa-8418-8a1b38b0ccca",
        "name":"Próximas atividades",
        "date_time": "2023-11-16 12:00",
        "dates":["2023-11-30 10:00","2023-11-30 14:00"],
        "poll_message_id":141}]}));
  const mockMsg = {
    chat: {
      id: 123
    },
    text: '/fecha_enquetes'
  };

  await onFechaEnquetes({}, '1234', '01234', mockMsg);
  
  expect(stopPoll).toHaveBeenCalledTimes(2);
  expect(stopPoll).toHaveBeenNthCalledWith(1, {}, '1234', "79", {"message_thread_id": "01234"});
  expect(stopPoll).toHaveBeenNthCalledWith(2, {}, '1234', "81", {"message_thread_id": "01234"});

  expect(unpinChatMessage).toHaveBeenCalledTimes(2);
  expect(unpinChatMessage).toHaveBeenNthCalledWith(1, {}, '1234', "79");
  expect(unpinChatMessage).toHaveBeenNthCalledWith(2, {}, '1234', "81");

  expect(replaceEvents).toHaveBeenCalledTimes(1);
  expect(replaceEvents).toHaveBeenCalledWith([{ "event_name": "4", "date_time": "2023-11-16 09:15", "poll_message_id": 82, "outdated": false}]);
  expect(replaceAvailabilities).toHaveBeenCalledTimes(1);
  expect(replaceAvailabilities).toHaveBeenCalledWith([{
    "id":"7e974c87-60e9-4bfa-8418-8a1b38b0ccca",
    "name":"Próximas atividades",
    "date_time": "2023-11-16 12:00",
    "dates":["2023-11-30 10:00","2023-11-30 14:00"],
    "outdated": false,
    "poll_message_id":141}]);

  expect(sendMessage).toHaveBeenCalledTimes(1);
  expect(sendMessage).toHaveBeenCalledWith({}, 123, 'Enquetes vencidas finalizadas.');
});

test('onFechaEnquetes outdated multiple', async () => {
    getEvents.mockImplementation(() => Promise.resolve(
      {"events":[
          { "event_name": "1", "date_time": "2023-11-12 10:00", "poll_message_id": 79},
          { "event_name": "2", "date_time": "2023-11-12 14:00", "poll_message_id": 79},
          { "event_name": "3", "date_time": "2023-11-13 09:15", "poll_message_id": 81},
          { "event_name": "4", "date_time": "2023-11-16 09:15", "poll_message_id": 81}
        ], "availabilities":[{
          "id":"7e974c87-60e9-4bfa-8418-8a1b38b0ccca",
          "name":"Próximas atividades",
          "date_time": "2023-11-12 12:00",
          "dates":["2023-11-30 10:00","2023-11-30 14:00"],
          "poll_message_id":141}]}));
    const mockMsg = {
      chat: {
        id: 123
      },
      text: '/fecha_enquetes'
    };
  
    await onFechaEnquetes({}, '1234', '01234', mockMsg);
    
    expect(stopPoll).toHaveBeenCalledTimes(2);
    
    expect(unpinChatMessage).toHaveBeenCalledTimes(2);
  
    expect(replaceEvents).toHaveBeenCalledTimes(1);
    expect(replaceEvents).toHaveBeenCalledWith([
        { "event_name": "3", "date_time": "2023-11-13 09:15", "poll_message_id": 81, "outdated": true},
        { "event_name": "4", "date_time": "2023-11-16 09:15", "poll_message_id": 81, "outdated": false}]);
    expect(replaceAvailabilities).toHaveBeenCalledTimes(1);
    expect(replaceAvailabilities).toHaveBeenCalledWith([]);
  
    expect(sendMessage).toHaveBeenCalledTimes(1);
    expect(sendMessage).toHaveBeenCalledWith({}, 123, 'Enquetes vencidas finalizadas.');
});

  test('onFechaEnquetes no events', async () => {
    const mockMsg = {
      chat: {
        id: 123
      },
      text: '/fecha_enquetes'
    };
  
    await onFechaEnquetes({}, '1234', '01234', mockMsg);
    
    expect(stopPoll).toHaveBeenCalledTimes(0);
    expect(unpinChatMessage).toHaveBeenCalledTimes(0);
    expect(replaceEvents).toHaveBeenCalledTimes(1);
    expect(replaceEvents).toHaveBeenCalledWith([]);
  
    expect(sendMessage).toHaveBeenCalledTimes(1);
    expect(sendMessage).toHaveBeenCalledWith({}, 123, 'Enquetes vencidas finalizadas.');
  });

