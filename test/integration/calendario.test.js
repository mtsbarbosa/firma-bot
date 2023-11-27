const { DateTime } = require('luxon');
const { onReceiveCalendar } = require('../../http_in/atividades');
const { sendMessage } = require('../../http_out/telegram');
const { getEvents } = require('../../http_out/jsonstorage');

jest.mock('../../http_out/jsonstorage.js');

jest.mock('../../http_out/telegram.js', () => {
  return {
    sendMessage: jest.fn()
  };
});

beforeEach(() => {
  jest.clearAllMocks();
  getEvents.mockImplementation(() => Promise.resolve(
    {"events":[], "availabilities":[{"id":"7e974c87-60e9-4bfa-8418-8a1b38b0ccca","name":"Próximas atividades","dates":["2023-11-30 10:00","2023-11-30 14:00"],"poll_message_id":141}]}));
});

test('onReceiveCalendar with events', async () => {
  const mockDateTime = jest.spyOn(DateTime, 'local').mockImplementation(() =>
    DateTime.fromISO('2023-11-15T12:00:00.000Z')
  );
  getEvents.mockImplementation(() => Promise.resolve(
    {"events":[
        {"event_name":"ato 2","date_time":"2023-11-12 15:00","location":"São Paulo - Bairro","type":"Ato não regional"},
        {"poll_message_id":79,"event_name":"reuniao","date_time":"2023-09-13 15:00","location":"Diadema - Centro","type":"Evento externo","outdated":true},
        {"poll_message_id":79,"event_name":"ato","date_time":"2023-11-13 15:00","location":"RGS - Bairro","type":"Ato regional","outdated":false},
        {"id":"c6f25ea1-ef2e-409a-ad76-0ea0ca224496","event_name":"ato 3","date_time":"2023-09-14 15:00","location":"Ribeirão Pires - Bairro","type":"Ato regional","poll_message_id":81}], 
     "availabilities":[]}));

  const mockMsg = {
    chat: {
      id: 123
    },
    text: '/calendario'
  };
  const calendarText = "*CALENDÁRIO*:\n\n🗓️ *SETEMBRO 2023*\n⤵️ semana 37\n➡️ ~reuniao \\- Diadema \\- Centro~\n⏰ ~quarta\\-feira \\(13/09\\) às 15:00~\n\n➡️ ato 3 \\- Ribeirão Pires \\- Bairro\n⏰ quinta\\-feira \\(14/09\\) às 15:00\n\n🗓️ *NOVEMBRO 2023*\n⤵️ semana 45\n➡️ ato 2 \\- São Paulo \\- Bairro\n⏰ domingo \\(12/11\\) às 15:00\n\n⤵️ semana 46\n➡️ ato \\- RGS \\- Bairro\n⏰ segunda\\-feira \\(13/11\\) às 15:00\n\n";

  await onReceiveCalendar({}, mockMsg);
  expect(sendMessage).toHaveBeenCalledTimes(1);
  expect(sendMessage).toHaveBeenCalledWith({}, 123, calendarText, {"parse_mode": "MarkdownV2"});
});

test('onReceiveCalendar without events', async () => {
    const mockDateTime = jest.spyOn(DateTime, 'local').mockImplementation(() =>
      DateTime.fromISO('2023-11-15T12:00:00.000Z')
    );
  
    const mockMsg = {
      chat: {
        id: 123
      },
      text: '/calendario'
    };
    const calendarText = "Sem atividades para mostrar no calendário.";
  
    await onReceiveCalendar({}, mockMsg);
    expect(sendMessage).toHaveBeenCalledTimes(1);
    expect(sendMessage).toHaveBeenCalledWith({}, 123, calendarText);
  });