const { sendMessage, sendPoll, pinChatMessage } = require('../../http_out/telegram');
const { getEvents, addEvents } = require('../../http_out/jsonstorage');
const { clearMemory, updateEvents, inMemEvents, receiveEventName, startMultiple, addOptionName, addOptionDatetime, addOptionLocation, addOptionType } = require('../../controllers/events');
const { generateUUID } = require('../../commons/uuid.js');

jest.mock('../../http_out/jsonstorage.js');
jest.mock('../../commons/uuid.js');
jest.mock('../../http_out/telegram.js');

jest.mock('luxon', () => ({
    DateTime: {
      now: jest.fn(() => jest.requireActual('luxon').DateTime.fromISO('2023-11-15T12:00:00.000Z')),
      fromFormat: jest.fn((a, b) => jest.requireActual('luxon').DateTime.fromFormat(a, b))
    },
}));

const CREATE_ATIVIDADE = 0;
const EVENT_NAME = 4;
const ADD_OPTION_NAME = 5;
const ADD_OPTION_DATETIME = 6;
const ADD_OPTION_LOCATION = 7;
const ADD_OPTION_TYPE = 8;

beforeEach(() => {
  clearMemory({}, 123);
  jest.clearAllMocks();
  getEvents.mockImplementation(() => Promise.resolve(
    {"events":[], "availabilities":[{"id":"7e974c87-60e9-4bfa-8418-8a1b38b0ccca","name":"Próximas atividades","dates":["2023-11-30 10:00","2023-11-30 14:00"],"poll_message_id":141}]}));
});

test('startMultiple', async () => {
    updateEvents({123: { state: CREATE_ATIVIDADE, pure: false }});
    startMultiple({}, 123);
  
    expect(inMemEvents()).toEqual({123: { state: EVENT_NAME, pure: false, create_multi_date: true }});
  
    expect(sendMessage).toHaveBeenCalledTimes(1);
    expect(sendMessage).toHaveBeenCalledWith({}, 123, 'Múltiplas atividades.\nPor favor qual o nome da enquete?');
});

test('multiple event name', async () => {
    updateEvents({123: { state: EVENT_NAME, pure: false, create_multi_date: true }});
    const mockMsg = {
        chat: {
          id: 123
        },
        text: 'Próximas Atividades'
    };
    receiveEventName({}, mockMsg, 1234, 12345);
  
    expect(inMemEvents()).toEqual({123: { 
        state: ADD_OPTION_NAME, 
        pure: false, 
        create_multi_date: true,
        event_name: 'Próximas Atividades',
        optionDateTimes: [],
        optionLocations: [],
        optionTypes: [],
        options: [],
    }});
  
    expect(sendMessage).toHaveBeenCalledTimes(1);
    expect(sendMessage).toHaveBeenCalledWith({}, 123, 'Por favor responda com o nome da próxima atividade (responda \'ok\' quando finalizado).');
});

test('multiple option valid name', async () => {
    updateEvents({123: { 
        state: ADD_OPTION_NAME, 
        pure: false, 
        create_multi_date: true,
        event_name: 'Próximas Atividades',
        optionDateTimes: [],
        optionLocations: [],
        optionTypes: [],
        options: [],
    }});
    const mockMsg = {
        chat: {
          id: 123
        },
        text: 'Ato 1'
    };
    addOptionName({}, mockMsg);
  
    expect(inMemEvents()).toEqual({123: { 
        state: ADD_OPTION_DATETIME, 
        pure: false,
        create_multi_date: true,
        event_name: 'Próximas Atividades',
        optionDateTimes: [],
        optionLocations: [],
        optionTypes: [],
        options: ['Ato 1'],
    }});
  
    expect(sendMessage).toHaveBeenCalledTimes(1);
    expect(sendMessage).toHaveBeenCalledWith({}, 123, 'Opção \'Ato 1\' adicionada. Por favor responda com data e hora da atividade no formato (e.g., \'2023-09-13 15:00\').');
});

test('multiple option invalid name', async () => {
    updateEvents({123: { 
        state: ADD_OPTION_NAME, 
        pure: false, 
        create_multi_date: true,
        event_name: 'Próximas Atividades',
        optionDateTimes: [],
        optionLocations: [],
        optionTypes: [],
        options: [],
    }});
    const mockMsg = {
        chat: {
          id: 123
        },
        text: 'Lorem ipsum dolor sit amet, consectetur adipiscing elit, sed do eiusmod tempor incididunt ut labore et dolore magna aliqua. Interdum velit laoreet id donec ultrices tincidunt arcu. Aliquam id diam maecenas ultricies.'
    };
    addOptionName({}, mockMsg);
  
    expect(inMemEvents()).toEqual({123: { 
        state: ADD_OPTION_NAME, 
        pure: false, 
        create_multi_date: true,
        event_name: 'Próximas Atividades',
        optionDateTimes: [],
        optionLocations: [],
        optionTypes: [],
        options: [],
    }});
  
    expect(sendMessage).toHaveBeenCalledTimes(1);
    expect(sendMessage).toHaveBeenCalledWith({}, 123, 'Texto muito longo. Reescreva com menos de 50 caracteres:');
});

test('multiple option name ok is not allowed without any option', async () => {
    updateEvents({123: { 
        state: ADD_OPTION_NAME, 
        pure: false, 
        create_multi_date: true,
        event_name: 'Próximas Atividades',
        optionDateTimes: [],
        optionLocations: [],
        optionTypes: [],
        options: [],
    }});
    const mockMsg = {
        chat: {
          id: 123
        },
        text: 'ok'
    };
    addOptionName({}, mockMsg);
  
    expect(inMemEvents()).toEqual({123: { 
        state: ADD_OPTION_NAME, 
        pure: false, 
        create_multi_date: true,
        event_name: 'Próximas Atividades',
        optionDateTimes: [],
        optionLocations: [],
        optionTypes: [],
        options: [],
    }});
  
    expect(sendMessage).toHaveBeenCalledTimes(1);
    expect(sendMessage).toHaveBeenCalledWith({}, 123, 'Você não adicionou nenhuma atividade para a enquete. Adicione ao menos uma atividade.');
});

test('multiple option valid datetime', async () => {
    updateEvents({123: { 
        state: ADD_OPTION_DATETIME, 
        pure: false,
        create_multi_date: true,
        event_name: 'Próximas Atividades',
        optionDateTimes: [],
        optionLocations: [],
        optionTypes: [],
        options: ['Ato 1'],
    }});
    const mockMsg = {
        chat: {
          id: 123
        },
        text: '2023-09-13 15:00'
    };
    addOptionDatetime({}, mockMsg);
  
    expect(inMemEvents()).toEqual({123: { 
        state: ADD_OPTION_LOCATION, 
        pure: false,
        create_multi_date: true,
        event_name: 'Próximas Atividades',
        optionDateTimes: ['2023-09-13 15:00'],
        optionLocations: [],
        optionTypes: [],
        options: ['Ato 1'],
    }});
  
    expect(sendMessage).toHaveBeenCalledTimes(1);
    expect(sendMessage).toHaveBeenCalledWith(
        {}, 
        123, 
        'Data e hora \'2023-09-13 15:00\' adicionada. Selecione o local:',
        {"reply_markup": {"keyboard": [["Diadema - Centro", "Diadema - Bairro"], ["Mauá - Centro", "Mauá - Bairro"], ["SA - Centro", "SA - Bairro"], ["SBC - Centro", "SBC - Bairro"], ["SCS - Centro", "SCS - Bairro"], ["Ribeirão Pires - Centro", "Ribeirão Pires - Bairro"], ["RGS - Centro", "RGS - Bairro"], ["São Paulo - Centro", "São Paulo - Bairro"], ["Online"]], "one_time_keyboard": true, "resize_keyboard": true}});
});

test('multiple option invalid datetime', async () => {
    updateEvents({123: { 
        state: ADD_OPTION_DATETIME, 
        pure: false,
        create_multi_date: true,
        event_name: 'Próximas Atividades',
        optionDateTimes: [],
        optionLocations: [],
        optionTypes: [],
        options: ['Ato 1'],
    }});
    const mockMsg = {
        chat: {
          id: 123
        },
        text: '23/02'
    };
    addOptionDatetime({}, mockMsg);
  
    expect(inMemEvents()).toEqual({123: { 
        state: ADD_OPTION_DATETIME, 
        pure: false,
        create_multi_date: true,
        event_name: 'Próximas Atividades',
        optionDateTimes: [],
        optionLocations: [],
        optionTypes: [],
        options: ['Ato 1'],
    }});
  
    expect(sendMessage).toHaveBeenCalledTimes(1);
    expect(sendMessage).toHaveBeenCalledWith(
        {}, 
        123, 
        'O formato válido é \"aaaa-MM-dd HH:mm\". Por favor, insira a data nesse formato.');
});

test('multiple option valid location', async () => {
    updateEvents({123: { 
        state: ADD_OPTION_LOCATION, 
        pure: false,
        create_multi_date: true,
        event_name: 'Próximas Atividades',
        optionDateTimes: ['2023-09-13 15:00'],
        optionLocations: [],
        optionTypes: [],
        options: ['Ato 1'],
    }});
    const mockMsg = {
        chat: {
          id: 123
        },
        text: 'SBC - Bairro'
    };
    addOptionLocation({}, mockMsg);
  
    expect(inMemEvents()).toEqual({123: { 
        state: ADD_OPTION_TYPE, 
        pure: false,
        create_multi_date: true,
        event_name: 'Próximas Atividades',
        optionDateTimes: ['2023-09-13 15:00'],
        optionLocations: ['SBC - Bairro'],
        optionTypes: [],
        options: ['Ato 1'],
    }});
  
    expect(sendMessage).toHaveBeenCalledTimes(1);
    expect(sendMessage).toHaveBeenCalledWith(
        {}, 
        123, 
        'Local \'SBC - Bairro\' adicionado. Selecione o tipo de atividade:',
        {"reply_markup": {"keyboard": [
            ["Reunião interna ord.", "Reunião interna extr."],
            ["Reunião externa"],
            ["Ato regional", "Ato não regional"],
            ["Panfletagem", "Banca", "Lambe"],
            ["Evento nosso", "Evento interno", "Evento externo"],
            ["Live", "Atividade Online"],
            ["Outros"]
        ], "one_time_keyboard": true, "resize_keyboard": true}});
});

test('multiple option invalid location', async () => {
    updateEvents({123: { 
        state: ADD_OPTION_LOCATION, 
        pure: false,
        create_multi_date: true,
        event_name: 'Próximas Atividades',
        optionDateTimes: ['2023-09-13 15:00'],
        optionLocations: [],
        optionTypes: [],
        options: ['Ato 1'],
    }});
    const mockMsg = {
        chat: {
          id: 123
        },
        text: 'SBC'
    };
    addOptionLocation({}, mockMsg);
  
    expect(inMemEvents()).toEqual({123: { 
        state: ADD_OPTION_LOCATION, 
        pure: false,
        create_multi_date: true,
        event_name: 'Próximas Atividades',
        optionDateTimes: ['2023-09-13 15:00'],
        optionLocations: [],
        optionTypes: [],
        options: ['Ato 1'],
    }});
  
    expect(sendMessage).toHaveBeenCalledTimes(1);
    expect(sendMessage).toHaveBeenCalledWith(
        {}, 
        123, 
        'Por favor, escolha um local válido da lista: Diadema - Centro, Diadema - Bairro, Mauá - Centro, Mauá - Bairro, SA - Centro, SA - Bairro, SBC - Centro, SBC - Bairro, SCS - Centro, SCS - Bairro, Ribeirão Pires - Centro, Ribeirão Pires - Bairro, RGS - Centro, RGS - Bairro, São Paulo - Centro, São Paulo - Bairro, Online.');
});

test('multiple option valid type', async () => {
    updateEvents({123: { 
        state: ADD_OPTION_TYPE, 
        pure: false,
        create_multi_date: true,
        event_name: 'Próximas Atividades',
        optionDateTimes: ['2023-09-13 15:00'],
        optionLocations: ['SBC - Bairro'],
        optionTypes: [],
        options: ['Ato 1'],
    }});
    const mockMsg = {
        chat: {
          id: 123
        },
        text: 'Ato regional'
    };
    addOptionType({}, mockMsg);
  
    expect(inMemEvents()).toEqual({123: { 
        state: ADD_OPTION_NAME, 
        pure: false,
        create_multi_date: true,
        event_name: 'Próximas Atividades',
        optionDateTimes: ['2023-09-13 15:00'],
        optionLocations: ['SBC - Bairro'],
        optionTypes: ['Ato regional'],
        options: ['Ato 1'],
    }});
  
    expect(sendMessage).toHaveBeenCalledTimes(1);
    expect(sendMessage).toHaveBeenCalledWith(
        {}, 
        123, 
        'Tipo \'Ato regional\' adicionado. Adicione mais opções ou \'ok\' para finalizar.');
});

test('multiple option invalid type', async () => {
    updateEvents({123: { 
        state: ADD_OPTION_TYPE, 
        pure: false,
        create_multi_date: true,
        event_name: 'Próximas Atividades',
        optionDateTimes: ['2023-09-13 15:00'],
        optionLocations: ['SBC - Bairro'],
        optionTypes: [],
        options: ['Ato 1'],
    }});
    const mockMsg = {
        chat: {
          id: 123
        },
        text: 'Ato'
    };
    addOptionType({}, mockMsg);
  
    expect(inMemEvents()).toEqual({123: { 
        state: ADD_OPTION_TYPE, 
        pure: false,
        create_multi_date: true,
        event_name: 'Próximas Atividades',
        optionDateTimes: ['2023-09-13 15:00'],
        optionLocations: ['SBC - Bairro'],
        optionTypes: [],
        options: ['Ato 1'],
    }});
  
    expect(sendMessage).toHaveBeenCalledTimes(1);
    expect(sendMessage).toHaveBeenCalledWith(
        {}, 
        123, 
        'Por favor, escolha um tipo válido da lista: Reunião interna ord., Reunião interna extr., Reunião externa, Ato regional, Ato não regional, Panfletagem, Banca, Lambe, Evento nosso, Evento interno, Evento externo, Live, Atividade Online, Outros.');
});

test('ok is not sent so new options are asked', async () => {
    updateEvents({123: { 
        state: ADD_OPTION_NAME, 
        pure: false,
        create_multi_date: true,
        event_name: 'Próximas Atividades',
        optionDateTimes: ['2023-09-13 15:00'],
        optionLocations: ['SBC - Bairro'],
        optionTypes: ['Ato regional'],
        options: ['Ato 1'],
    }});
    const mockMsg = {
        chat: {
          id: 123
        },
        text: 'Panfletagem em SA'
    };
    addOptionName({}, mockMsg, 1234, 12345);
  
    expect(inMemEvents()).toEqual({123: { 
        state: ADD_OPTION_DATETIME, 
        pure: false,
        create_multi_date: true,
        event_name: 'Próximas Atividades',
        optionDateTimes: ['2023-09-13 15:00'],
        optionLocations: ['SBC - Bairro'],
        optionTypes: ['Ato regional'],
        options: ['Ato 1','Panfletagem em SA'],
    }});
  
    expect(sendMessage).toHaveBeenCalledTimes(1);
    expect(sendMessage).toHaveBeenCalledWith(
        {}, 
        123, 
        'Opção \'Panfletagem em SA\' adicionada. Por favor responda com data e hora da atividade no formato (e.g., \'2023-09-13 15:00\').');
});

test('ok is sent', async () => {
    updateEvents({123: { 
        state: ADD_OPTION_NAME, 
        pure: false,
        create_multi_date: true,
        event_name: 'Próximas Atividades',
        optionDateTimes: ['2023-09-13 15:00','2023-09-14 15:00'],
        optionLocations: ['SBC - Bairro','SA - Centro'],
        optionTypes: ['Ato regional','Panfletagem'],
        options: ['Ato 1','Panfletagem em SA'],
    }});
    const mockMsg = {
        chat: {
          id: 123
        },
        text: 'ok'
    };

    sendPoll.mockImplementation(() => Promise.resolve({"poll": {"id": "5125448558970928179"}, "message_id": 45}));
    generateUUID.mockImplementation(() => "bbfe62ba-4e15-4775-9182-e06bce900010");

    await addOptionName({}, mockMsg, 1234, 12345);
  
    expect(inMemEvents()).toEqual({});
  
    expect(sendMessage).toHaveBeenCalledTimes(1);
    expect(sendMessage).toHaveBeenCalledWith(
        {}, 
        123, 
        'Você adicionou 2 opções para a enquete múltipla.\nCriando a enquete...');

    expect(sendPoll).toHaveBeenCalledTimes(1);
    expect(sendPoll).toHaveBeenCalledWith(
      {}, 
      1234, 
      'Sua disponibilidade para \'Próximas Atividades\':',
      [
        'Ato 1, quarta-feira (13/09) às 15:00 - SBC - Bairro',
        'Panfletagem em SA, quinta-feira (14/09) às 15:00 - SA - Centro',
        'Ausente em todas'
      ],
      {"allows_multiple_answers": true, "is_anonymous": false, "message_thread_id": 12345});
    
    expect(pinChatMessage).toHaveBeenCalledTimes(1);
    expect(pinChatMessage).toHaveBeenCalledWith({}, 1234, 45);

    expect(addEvents).toHaveBeenCalledTimes(1);
    expect(addEvents).toHaveBeenCalledWith([{
        "date_time": "2023-09-13 15:00", 
        "event_name": "Ato 1", 
        "id": "bbfe62ba-4e15-4775-9182-e06bce900010", 
        "location": "SBC - Bairro",
        "poll_id": "5125448558970928179",
        "poll_message_id": 45, 
        "type": "Ato regional"}, 
        {"date_time": "2023-09-14 15:00", 
        "event_name": "Panfletagem em SA", 
        "id": "bbfe62ba-4e15-4775-9182-e06bce900010", 
        "location": "SA - Centro",
        "poll_id": "5125448558970928179",
        "poll_message_id": 45, 
        "type": "Panfletagem"}]);
});
