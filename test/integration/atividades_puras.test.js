const { sendMessage, unpinChatMessage, stopPoll, sendPoll, pinChatMessage } = require('../../http_out/telegram');
const { getEvents, replaceEvents, addEvent, addEvents } = require('../../http_out/jsonstorage');
const { onFechaEnquetes, startEvent, startSimple, clearMemory, updateEvents, inMemEvents, receiveDateTime, receiveLocation, receiveType, receiveEventName, addOptionName } = require('../../controllers/events');
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

const EVENT_NAME = 4;
const ADD_OPTION_NAME = 5;

beforeEach(() => {
  clearMemory({}, 123);
  jest.clearAllMocks();
  getEvents.mockImplementation(() => Promise.resolve(
    {"events":[], "availabilities":[{"id":"7e974c87-60e9-4bfa-8418-8a1b38b0ccca","name":"Próximas atividades","dates":["2023-11-30 10:00","2023-11-30 14:00"],"poll_message_id":141}]}));
});

test('simple valid name and pure event is created', async () => {
    updateEvents({123: { 
        state: EVENT_NAME, 
        pure: true, 
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
    
    generateUUID.mockImplementation(() => "bbfe62ba-4e15-4775-9182-e06bce900010");

    await receiveEventName({}, mockMsg, 1234, 12345);
  
    expect(inMemEvents()).toEqual({});
  
    expect(sendMessage).toHaveBeenCalledTimes(1);
    expect(sendMessage).toHaveBeenCalledWith({}, 123, 'Evento Atividade 1 adicionado!');

    expect(sendPoll).toHaveBeenCalledTimes(0);
    expect(pinChatMessage).toHaveBeenCalledTimes(0);

    expect(addEvent).toHaveBeenCalledTimes(1);
    expect(addEvent).toHaveBeenCalledWith({
        "date_time": "2023-09-13 15:00",
        "event_name": "Atividade 1",
        "id": "bbfe62ba-4e15-4775-9182-e06bce900010",
        "location": "SCS - Centro",
        "type": "Panfletagem",
        "created_at": "2023-11-15 12:00"
    });
});

test('ok is sent for multiple pure event', async () => {
    updateEvents({123: { 
        state: ADD_OPTION_NAME, 
        pure: true,
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

    generateUUID.mockImplementation(() => "bbfe62ba-4e15-4775-9182-e06bce900010");

    await addOptionName({}, mockMsg, 1234, 12345);
  
    expect(inMemEvents()).toEqual({});
  
    expect(sendMessage).toHaveBeenCalledTimes(1);
    expect(sendMessage).toHaveBeenCalledWith(
        {}, 
        123, 
        'Você adicionou 2 atividades.');

    expect(sendPoll).toHaveBeenCalledTimes(0);
    expect(pinChatMessage).toHaveBeenCalledTimes(0);

    expect(addEvents).toHaveBeenCalledTimes(1);
    expect(addEvents).toHaveBeenCalledWith([{"date_time": "2023-09-13 15:00", "event_name": "Ato 1", "id": "bbfe62ba-4e15-4775-9182-e06bce900010", "location": "SBC - Bairro", "type": "Ato regional", "created_at": "2023-11-15 12:00"}, {"date_time": "2023-09-14 15:00", "event_name": "Panfletagem em SA", "id": "bbfe62ba-4e15-4775-9182-e06bce900010", "location": "SA - Centro", "type": "Panfletagem", "created_at": "2023-11-15 12:00"}]);
});