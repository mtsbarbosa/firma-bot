const { sendMessage, sendPoll, pinChatMessage } = require('../../http_out/telegram');
const { getEvents, addEvent } = require('../../http_out/jsonstorage');
const { startEvent, startSimple, clearMemory, updateEvents, inMemEvents, receiveDateTime, receiveLocation, receiveType, receiveEventName } = require('../../controllers/events');
const { generateUUID } = require('../../commons/uuid.js');

jest.mock('../../http_out/jsonstorage.js');
jest.mock('../../commons/uuid.js');
jest.mock('../../http_out/telegram.js');

jest.mock('luxon', () => ({
    DateTime: {
      now: jest.fn(() => jest.requireActual('luxon').DateTime.fromISO('2023-11-15T12:00:00.000Z', { zone: 'utc' })),
      fromFormat: jest.fn((a, b) => jest.requireActual('luxon').DateTime.fromFormat(a, b))
    },
}));

const CREATE_ATIVIDADE = 0;
const DATE = 1;
const LOCATION = 2;
const TYPE = 3;
const EVENT_NAME = 4;

beforeEach(() => {
  clearMemory({}, 123);
  jest.clearAllMocks();
  getEvents.mockImplementation(() => Promise.resolve(
    {"events":[], "availabilities":[{"id":"7e974c87-60e9-4bfa-8418-8a1b38b0ccca","name":"Próximas atividades","dates":["2023-11-30 10:00","2023-11-30 14:00"],"poll_message_id":141}]}));
});

test('startEvent', async () => {
  startEvent({}, 123, false);

  expect(inMemEvents()).toEqual({123: { state: CREATE_ATIVIDADE, pure: false }});

  expect(sendMessage).toHaveBeenCalledTimes(1);
  expect(sendMessage).toHaveBeenCalledWith({}, 123, 'Você quer uma atividade simples ou multipla?');
});

test('startSimple', async () => {
    updateEvents({123: { state: CREATE_ATIVIDADE, pure: false }});
    startSimple({}, 123);
  
    expect(inMemEvents()).toEqual({123: { state: DATE, pure: false, create_multi_date: false }});
  
    expect(sendMessage).toHaveBeenCalledTimes(1);
    expect(sendMessage).toHaveBeenCalledWith({}, 123, 'Atividade simples.\nPor favor responda com a data no formato (e.g., \'2023-09-13 15:00\').');
});

test('simple valid date', async () => {
    updateEvents({123: { state: DATE, pure: false, create_multi_date: false }});
    const mockMsg = {
        chat: {
          id: 123
        },
        text: '2023-09-13 15:00'
    };
    receiveDateTime({}, mockMsg);
  
    expect(inMemEvents()).toEqual({123: { 
        state: LOCATION, 
        pure: false, 
        create_multi_date: false, 
        date_time: '2023-09-13 15:00'}});
  
    expect(sendMessage).toHaveBeenCalledTimes(1);
    expect(sendMessage).toHaveBeenCalledWith({}, 123, 'Ótimo! Você selecionou a data e hora da atividade: 2023-09-13 15:00\nAgora, selecione o local da atividade:',
      {"reply_markup": {"keyboard": [["Diadema - Centro", "Diadema - Bairro"], ["Mauá - Centro", "Mauá - Bairro"], ["SA - Centro", "SA - Bairro"], ["SBC - Centro", "SBC - Bairro"], ["SCS - Centro", "SCS - Bairro"], ["Ribeirão Pires - Centro", "Ribeirão Pires - Bairro"], ["RGS - Centro", "RGS - Bairro"], ["São Paulo - Centro", "São Paulo - Bairro"], ["Online"]], "one_time_keyboard": true, "resize_keyboard": true}}
    );
});

test('simple invalid date', async () => {
    updateEvents({123: { state: DATE, pure: false, create_multi_date: false }});
    const mockMsg = {
        chat: {
          id: 123
        },
        text: '05/10'
    };
    receiveDateTime({}, mockMsg);
  
    expect(inMemEvents()).toEqual({123: { state: DATE, pure: false, create_multi_date: false }});
  
    expect(sendMessage).toHaveBeenCalledTimes(1);
    expect(sendMessage).toHaveBeenCalledWith({}, 123, 'O formato válido é "aaaa-MM-dd HH:mm". Por favor, insira a data nesse formato.');
});

test('simple valid location', async () => {
    updateEvents({123: { 
        state: LOCATION, 
        pure: false, 
        create_multi_date: false, 
        date_time: '2023-09-13 15:00'}});
    const mockMsg = {
        chat: {
          id: 123
        },
        text: 'SCS - Centro'
    };
    receiveLocation({}, mockMsg);
  
    expect(inMemEvents()).toEqual({123: { 
        state: TYPE, 
        pure: false, 
        create_multi_date: false, 
        date_time: '2023-09-13 15:00',
        location: 'SCS - Centro'}});
  
    expect(sendMessage).toHaveBeenCalledTimes(1);
    expect(sendMessage).toHaveBeenCalledWith({}, 123, 'Ótimo! Você selecionou o local: SCS - Centro\nAgora, selecione o tipo da atividade:',
      {"reply_markup": {"keyboard": [
            ["Reunião interna ord.", "Reunião interna extr."],
            ["Reunião externa"],
            ["Ato regional", "Ato não regional"],
            ["Panfletagem", "Banca", "Lambe"],
            ["Evento nosso", "Evento interno", "Evento externo"],
            ["Live", "Atividade Online"],
            ["Outros"]
        ], "one_time_keyboard": true, "resize_keyboard": true}}
    );
});

test('simple invalid location', async () => {
    updateEvents({123: { 
        state: LOCATION, 
        pure: false, 
        create_multi_date: false, 
        date_time: '2023-09-13 15:00'}});
    const mockMsg = {
        chat: {
          id: 123
        },
        text: 'SCS'
    };
    receiveLocation({}, mockMsg);
  
    expect(inMemEvents()).toEqual({123: { 
        state: LOCATION, 
        pure: false, 
        create_multi_date: false, 
        date_time: '2023-09-13 15:00'}});
  
    expect(sendMessage).toHaveBeenCalledTimes(1);
    expect(sendMessage).toHaveBeenCalledWith({}, 123, 'Por favor, escolha um local válido da lista: Diadema - Centro, Diadema - Bairro, Mauá - Centro, Mauá - Bairro, SA - Centro, SA - Bairro, SBC - Centro, SBC - Bairro, SCS - Centro, SCS - Bairro, Ribeirão Pires - Centro, Ribeirão Pires - Bairro, RGS - Centro, RGS - Bairro, São Paulo - Centro, São Paulo - Bairro, Online.');
});

test('simple valid type', async () => {
    updateEvents({123: { 
        state: TYPE, 
        pure: false, 
        create_multi_date: false, 
        date_time: '2023-09-13 15:00',
        location: 'SCS - Centro'}});
    const mockMsg = {
        chat: {
          id: 123
        },
        text: 'Panfletagem'
    };
    receiveType({}, mockMsg);
  
    expect(inMemEvents()).toEqual({123: { 
        state: EVENT_NAME, 
        pure: false, 
        create_multi_date: false, 
        date_time: '2023-09-13 15:00',
        location: 'SCS - Centro',
        type: 'Panfletagem'}});
  
    expect(sendMessage).toHaveBeenCalledTimes(1);
    expect(sendMessage).toHaveBeenCalledWith({}, 123, 'Ótimo! Você selecionou o tipo da atividade: Panfletagem\nAgora, responda com o nome da atividade:');
});

test('simple invalid type', async () => {
    updateEvents({123: { 
        state: TYPE, 
        pure: false, 
        create_multi_date: false, 
        date_time: '2023-09-13 15:00',
        location: 'SCS - Centro'}});
    const mockMsg = {
        chat: {
          id: 123
        },
        text: 'algo'
    };
    receiveType({}, mockMsg);
  
    expect(inMemEvents()).toEqual({123: { 
        state: TYPE, 
        pure: false, 
        create_multi_date: false, 
        date_time: '2023-09-13 15:00',
        location: 'SCS - Centro'}});
  
    expect(sendMessage).toHaveBeenCalledTimes(1);
    expect(sendMessage).toHaveBeenCalledWith({}, 123, 'Por favor, escolha um tipo válido da lista: Reunião interna ord., Reunião interna extr., Reunião externa, Ato regional, Ato não regional, Panfletagem, Banca, Lambe, Evento nosso, Evento interno, Evento externo, Live, Atividade Online, Outros.');
});

test('simple valid name and event is created', async () => {
    updateEvents({123: { 
        state: EVENT_NAME, 
        pure: false, 
        create_multi_date: false, 
        date_time: '2023-09-13 15:00',
        location: 'SCS - Centro',
        type: 'Panfletagem'}});
    const mockMsg = {
        chat: {
          id: 123
        },
        text: 'Atividade 1'
    };

    sendPoll.mockImplementation(() => Promise.resolve({"poll": {"id": "5125448558970928179"}, "message_id": 45}));
    generateUUID.mockImplementation(() => "bbfe62ba-4e15-4775-9182-e06bce900010");

    await receiveEventName({}, mockMsg, 1234, 12345);
  
    expect(inMemEvents()).toEqual({});
  
    expect(sendMessage).toHaveBeenCalledTimes(1);
    expect(sendMessage).toHaveBeenCalledWith({}, 123, 'Nome do evento: Atividade 1\nCriando a enquete...');

    expect(sendPoll).toHaveBeenCalledTimes(1);
    expect(sendPoll).toHaveBeenCalledWith(
      {}, 
      1234, 
      'Atividade 1, quarta-feira (13/09) às 15:00 - SCS - Centro',
      ['Presente', 'Ausente'],
      {"is_anonymous": false, "message_thread_id": 12345});
    
    expect(pinChatMessage).toHaveBeenCalledTimes(1);
    expect(pinChatMessage).toHaveBeenCalledWith({}, 1234, 45);

    expect(addEvent).toHaveBeenCalledTimes(1);
    expect(addEvent).toHaveBeenCalledWith({
        "date_time": "2023-09-13 15:00",
        "event_name": "Atividade 1",
        "id": "bbfe62ba-4e15-4775-9182-e06bce900010",
        "location": "SCS - Centro",
        "poll_id": "5125448558970928179",
        "poll_message_id": 45,
        "type": "Panfletagem",
        "created_at": "2023-11-15 12:00",
        "total_options": 2,
    });
});

