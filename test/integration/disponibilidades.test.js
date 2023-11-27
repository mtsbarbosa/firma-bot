const { sendMessage, sendPoll, pinChatMessage } = require('../../http_out/telegram');
const { getEvents, addEvents, addAvailability } = require('../../http_out/jsonstorage');
const { generateUUID } = require('../../commons/uuid.js');
const { createAvailability } = require('../../controllers/availability.js');

jest.mock('../../http_out/jsonstorage.js');
jest.mock('../../commons/uuid.js');
jest.mock('../../http_out/telegram.js');

jest.mock('luxon', () => ({
    DateTime: {
      now: jest.fn(() => jest.requireActual('luxon').DateTime.fromISO('2023-11-15T12:00:00.000Z', { zone: 'utc' })),
      fromFormat: jest.fn((a, b) => jest.requireActual('luxon').DateTime.fromFormat(a, b))
    },
}));

beforeEach(() => {
  jest.clearAllMocks();
  getEvents.mockImplementation(() => Promise.resolve(
    {"events":[], "availabilities":[{"id":"7e974c87-60e9-4bfa-8418-8a1b38b0ccca","name":"Próximas atividades","dates":["2023-11-30 10:00","2023-11-30 14:00"],"poll_message_id":141}]}));
});

test('createAvailability with valid input', async () => {
    const mockMsg = {
        chat: {
          id: 123
        },
        text: '/disponibilidade Atividade na estação = 2023-10-04 10:30,2023-10-05 22:30 ,2023-10-04 13:30'
    };

    sendPoll.mockImplementation(() => Promise.resolve({"poll": {"id": "5125448558970928179"}, "message_id": 57}));
    generateUUID.mockImplementation(() => "bbfe62ba-4e15-4775-9182-e06bce900010");

    await createAvailability({}, 1234, 12345, mockMsg);
  
    expect(sendMessage).toHaveBeenCalledTimes(1);
    expect(sendMessage).toHaveBeenCalledWith(
        {}, 
        123, 
        'Criando enquete para disponibilidade...');

    expect(sendPoll).toHaveBeenCalledTimes(1);
    expect(sendPoll).toHaveBeenCalledWith(
      {}, 
      1234, 
      'Suas disponbilidades para \'Atividade na estação\'',
      [
        'quarta-feira (04/10) às 10:30',
        'quinta-feira (05/10) às 22:30',
        'quarta-feira (04/10) às 13:30',
        'Não posso em nenhum'
      ],
      {"allows_multiple_answers": true, "is_anonymous": false, "message_thread_id": 12345});
    
    expect(pinChatMessage).toHaveBeenCalledTimes(1);
    expect(pinChatMessage).toHaveBeenCalledWith({}, 1234, 57);

    expect(addAvailability).toHaveBeenCalledTimes(1);
    expect(addAvailability).toHaveBeenCalledWith({
        "date_time": "2023-11-15 12:00",
        "dates": ["2023-10-04 10:30","2023-10-05 22:30","2023-10-04 13:30"], 
        "name": "Atividade na estação", 
        "id": "bbfe62ba-4e15-4775-9182-e06bce900010",
        "poll_id": "5125448558970928179",
        "poll_message_id": 57});
});

test('createAvailability with invalid input', async () => {
    const mockMsg = {
        chat: {
          id: 123
        },
        text: '/disponibilidade algo'
    };

    sendPoll.mockImplementation(() => Promise.resolve({"id": "5125448558970928179", "message_id": 57}));
    generateUUID.mockImplementation(() => "bbfe62ba-4e15-4775-9182-e06bce900010");

    await createAvailability({}, 1234, 12345, mockMsg);
  
    expect(sendMessage).toHaveBeenCalledTimes(1);
    expect(sendMessage).toHaveBeenCalledWith(
        {}, 
        123, 
        'O formato da string não é válido. Por favor, siga o formato: NomeEvento = AAAA-MM-DD HH:mm, AAAA-MM-DD HH:mm,... (mínimo 2, máximo 9 opções de data e hora).');

    expect(sendPoll).toHaveBeenCalledTimes(0);
    expect(pinChatMessage).toHaveBeenCalledTimes(0);
    expect(addAvailability).toHaveBeenCalledTimes(0);
});

test('createAvailability with low number of dates', async () => {
    const mockMsg = {
        chat: {
          id: 123
        },
        text: '/disponibilidade Atividade na estação = 2023-10-04 10:30'
    };

    sendPoll.mockImplementation(() => Promise.resolve({"id": "5125448558970928179", "message_id": 57}));
    generateUUID.mockImplementation(() => "bbfe62ba-4e15-4775-9182-e06bce900010");

    await createAvailability({}, 1234, 12345, mockMsg);
  
    expect(sendMessage).toHaveBeenCalledTimes(1);
    expect(sendMessage).toHaveBeenCalledWith(
        {}, 
        123, 
        'O formato da string não é válido. Por favor, siga o formato: NomeEvento = AAAA-MM-DD HH:mm, AAAA-MM-DD HH:mm,... (mínimo 2, máximo 9 opções de data e hora).');

    expect(sendPoll).toHaveBeenCalledTimes(0);
    expect(pinChatMessage).toHaveBeenCalledTimes(0);
    expect(addAvailability).toHaveBeenCalledTimes(0);
});

test('createAvailability with high number of dates', async () => {
    const mockMsg = {
        chat: {
          id: 123
        },
        text: '/disponibilidade Atividade na estação = 2023-10-04 10:30,2023-10-04 10:30,2023-10-04 10:30,2023-10-04 10:30,2023-10-04 10:30,2023-10-04 10:30,2023-10-04 10:30,2023-10-04 10:30,2023-10-04 10:30,2023-10-04 10:30'
    };

    sendPoll.mockImplementation(() => Promise.resolve({"id": "5125448558970928179", "message_id": 57}));
    generateUUID.mockImplementation(() => "bbfe62ba-4e15-4775-9182-e06bce900010");

    await createAvailability({}, 1234, 12345, mockMsg);
  
    expect(sendMessage).toHaveBeenCalledTimes(1);
    expect(sendMessage).toHaveBeenCalledWith(
        {}, 
        123, 
        'O formato da string não é válido. Por favor, siga o formato: NomeEvento = AAAA-MM-DD HH:mm, AAAA-MM-DD HH:mm,... (mínimo 2, máximo 9 opções de data e hora).');

    expect(sendPoll).toHaveBeenCalledTimes(0);
    expect(pinChatMessage).toHaveBeenCalledTimes(0);
    expect(addAvailability).toHaveBeenCalledTimes(0);
});
