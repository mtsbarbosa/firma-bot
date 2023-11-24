const { DateTime } = require('luxon');
const { onReceiveAskParticipation } = require('../../http_in/atividades');
const { getParticipation, getEvents } = require('../../http_out/jsonstorage');
const { sendMessage } = require('../../http_out/telegram');

jest.mock('../../http_out/jsonstorage.js');

jest.mock('../../http_out/telegram.js', () => {
  return {
    sendMessage: jest.fn()
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
  getParticipation.mockImplementation(() => Promise.resolve(
      {"votes":{},
       "members":[]}));
  getEvents.mockImplementation(() => Promise.resolve(
    {"events":[{"event_name":"ato 2","date_time":"2023-11-12 15:00","location":"São Paulo - Bairro","type":"Ato não regional"},{"poll_message_id":79,"event_name":"reuniao","date_time":"2023-09-13 15:00","location":"Diadema - Centro","type":"Evento externo","outdated":true},{"poll_message_id":79,"event_name":"ato","date_time":"2023-11-13 15:00","location":"RGS - Bairro","type":"Ato regional","outdated":false},{"id":"c6f25ea1-ef2e-409a-ad76-0ea0ca224496","event_name":"ato 3","date_time":"2023-09-14 15:00","location":"Ribeirão Pires - Bairro","type":"Ato regional","poll_message_id":81}]}));
});

test('onReceiveAskParticipation single poll with one non-voter', async () => {
  getParticipation.mockImplementation(() => Promise.resolve(Promise.resolve(
    {votes:{"79":
               {"123":
                 {"user":{"id":123,"is_bot":false,"first_name":"Lenin","username":"lenin1917"},"options":[0]},
                "124":
                 {"user":{"id":124,"is_bot":false,"first_name":"Rosa","last_name":"Luxemburgo","username":""},"options":[1]}},
            "81":
               {"123":
                  {"user":{"id":123,"is_bot":false,"first_name":"Lenin","username":"lenin1917"},"options":[0]}}},
     members:[":Rosa:Luxemburgo:124","lenin1917:Lenin::123"]})));

  const mockMsg = {
    chat: {
      id: 123
    },
    text: '/cobrar_participacao 2'
  };
  await onReceiveAskParticipation({}, '12345', '01234', mockMsg);
  expect(sendMessage).toHaveBeenCalledTimes(1);
  expect(sendMessage).toHaveBeenCalledWith({}, '12345', 'Favor responder à enquete: Rosa Luxemburgo ', {
    entities: [
      {
        length: 15,
        offset: 27,
        type: "text_mention",
        user: {
          first_name: "Rosa",
          id: "124",
          last_name: "Luxemburgo",
        },
      },
    ],
    message_thread_id: "01234",
    reply_to_message_id: "81",
  });
});

test('onReceiveAskParticipation single poll with two non-voters', async () => {
  getParticipation.mockImplementation(() => Promise.resolve(Promise.resolve(
    {votes:{"79":
               {"123":
                 {"user":{"id":123,"is_bot":false,"first_name":"Lenin","username":"lenin1917"},"options":[0]},
                "124":
                 {"user":{"id":124,"is_bot":false,"first_name":"Rosa","last_name":"Luxemburgo","username":""},"options":[1]}}},
     members:[":Rosa:Luxemburgo:124","lenin1917:Lenin::123"]})));

  const mockMsg = {
    chat: {
      id: 123
    },
    text: '/cobrar_participacao 2'
  };
  await onReceiveAskParticipation({}, '12345', '01234', mockMsg);
  expect(sendMessage).toHaveBeenCalledTimes(1);
  expect(sendMessage).toHaveBeenCalledWith({}, '12345', 'Favor responder à enquete: Rosa Luxemburgo ,@lenin1917 ', {
    entities: [
      {
        length: 15,
        offset: 27,
        type: "text_mention",
        user: {
          first_name: "Rosa",
          id: "124",
          last_name: "Luxemburgo",
        },
      },
    ],
    message_thread_id: "01234",
    reply_to_message_id: "81",
  });
});

test('onReceiveAskParticipation two polls with single non-voter', async () => {
  getParticipation.mockImplementation(() => Promise.resolve(Promise.resolve(
    {votes:{"79":
              {"124":
                {"user":{"id":124,"is_bot":false,"first_name":"Rosa","last_name":"Luxemburgo","username":""},"options":[1]}},
            "81":
                {"123":
                  {"user":{"id":123,"is_bot":false,"first_name":"Lenin","username":"lenin1917"},"options":[0]}}},
     members:[":Rosa:Luxemburgo:124","lenin1917:Lenin::123"]})));

  const mockMsg = {
    chat: {
      id: 123
    },
    text: '/cobrar_participacao 2'
  };
  await onReceiveAskParticipation({}, '12345', '01234', mockMsg);
  expect(sendMessage).toHaveBeenCalledTimes(2);

  expect(sendMessage).toHaveBeenNthCalledWith(2, {}, '12345', 'Favor responder à enquete: Rosa Luxemburgo ', {
    entities: [
      {
        length: 15,
        offset: 27,
        type: "text_mention",
        user: {
          first_name: "Rosa",
          id: "124",
          last_name: "Luxemburgo",
        },
      },
    ],
    message_thread_id: "01234",
    reply_to_message_id: "81",
  });

  expect(sendMessage).toHaveBeenNthCalledWith(1, {}, '12345', 'Favor responder à enquete: @lenin1917 ', {
    entities: [],
    message_thread_id: "01234",
    reply_to_message_id: "79",
  });
});

test('onReceiveAskParticipation no poll', async () => {
  getParticipation.mockImplementation(() => Promise.resolve(Promise.resolve(
    {votes:{"79":
              {"124":
                {"user":{"id":124,"is_bot":false,"first_name":"Rosa","last_name":"Luxemburgo","username":""},"options":[1]}},
            "81":
                {"123":
                  {"user":{"id":123,"is_bot":false,"first_name":"Lenin","username":"lenin1917"},"options":[0]}}},
     members:[":Rosa:Luxemburgo:124","lenin1917:Lenin::123"]})));
  getEvents.mockImplementation(() => Promise.resolve({"events":[]}));

  const mockMsg = {
    chat: {
      id: 123
    },
    text: '/cobrar_participacao 2'
  };
  await onReceiveAskParticipation({}, '12345', '01234', mockMsg);
  expect(sendMessage).toHaveBeenCalledTimes(0);
});

test('onReceiveAskParticipation no vote', async () => {
  getParticipation.mockImplementation(() => Promise.resolve(Promise.resolve(
    {votes:{"81":
                {"123":
                  {"user":{"id":123,"is_bot":false,"first_name":"Lenin","username":"lenin1917"},"options":[0]}}},
     members:[":Rosa:Luxemburgo:124","lenin1917:Lenin::123"]})));
  getEvents.mockImplementation(() => Promise.resolve({"events":[{"poll_message_id":79,"event_name":"reuniao","date_time":"2023-09-13 15:00","location":"Diadema - Centro","type":"Evento externo","outdated":true}]}));

  const mockMsg = {
    chat: {
      id: 123
    },
    text: '/cobrar_participacao 2'
  };
  await onReceiveAskParticipation({}, '12345', '01234', mockMsg);
  expect(sendMessage).toHaveBeenCalledTimes(1);
  expect(sendMessage).toHaveBeenCalledWith({}, '12345', 'Favor responder à enquete: Rosa Luxemburgo ,@lenin1917 ', {
    entities: [
      {
        length: 15,
        offset: 27,
        type: "text_mention",
        user: {
          first_name: "Rosa",
          id: "124",
          last_name: "Luxemburgo",
        },
      },
    ],
    message_thread_id: "01234",
    reply_to_message_id: "79",
  });
});