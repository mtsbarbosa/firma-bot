const { listMembers, addMembers } = require("../http_in/membros");
const { getParticipation, upsertMembers } = require("../http_out/jsonstorage");
const { sendMessage } = require("../http_out/telegram");

jest.mock('../http_out/telegram.js', () => {
    return {
      sendMessage: jest.fn()
    };
  });

jest.mock('../http_out/jsonstorage.js');

beforeEach(() => {
  jest.clearAllMocks();
  getParticipation.mockImplementation(() => Promise.resolve({
      members: []
  }));
});

test('addMembers should add a single complete member', async () => {
    const mockMsg = {
      chat: {
        id: 123
      }
    };
  
    upsertMembers.mockImplementation(() => Promise.resolve({
      members: []
    }));
  
    await addMembers({}, mockMsg, [null,'user1:John:Doe:123']);

    expect(sendMessage).toHaveBeenCalledTimes(1);
    expect(upsertMembers).toHaveBeenCalledWith(['user1:John:Doe:123']);
  });

  test('addMembers should not add when weird format', async () => {
    const mockMsg = {
      chat: {
        id: 123
      }
    };
  
    upsertMembers.mockImplementation(() => Promise.resolve({
      members: []
    }));
  
    await addMembers({}, mockMsg, [null,'test']);

    expect(sendMessage).toHaveBeenCalledTimes(1);
    expect(upsertMembers).toHaveBeenCalledTimes(0);
  });

  test('addMembers should not add when no id is provided', async () => {
    const mockMsg = {
      chat: {
        id: 123
      }
    };
  
    upsertMembers.mockImplementation(() => Promise.resolve({
      members: []
    }));
  
    await addMembers({}, mockMsg, [null,':test::']);

    expect(sendMessage).toHaveBeenCalledTimes(1);
    expect(upsertMembers).toHaveBeenCalledTimes(0);
  });

  test('addMembers should not add when no name is provided', async () => {
    const mockMsg = {
      chat: {
        id: 123
      }
    };
  
    upsertMembers.mockImplementation(() => Promise.resolve({
      members: []
    }));
  
    await addMembers({}, mockMsg, [null,':::123']);

    expect(sendMessage).toHaveBeenCalledTimes(1);
    expect(upsertMembers).toHaveBeenCalledTimes(0);
  });

  test('addMembers should add a single complete member', async () => {
    const mockMsg = {
      chat: {
        id: 123
      }
    };
  
    upsertMembers.mockImplementation(() => Promise.resolve({
      members: []
    }));
  
    await addMembers({}, mockMsg, [null,'user1:John:Doe:123']);

    expect(sendMessage).toHaveBeenCalledTimes(1);
    expect(upsertMembers).toHaveBeenCalledWith(['user1:John:Doe:123']);
  });

test('listMembers should send a formatted list of members', async () => {
  const mockMsg = {
    chat: {
      id: 123
    }
  };

  getParticipation.mockImplementation(() => Promise.resolve({
    members: ['user1:John:Doe:123', 'user2:Jane:Smith:456']
  }));

  await listMembers({}, mockMsg);
  
  expect(getParticipation).toHaveBeenCalledTimes(1);
  expect(sendMessage).toHaveBeenCalledTimes(1);
  expect(sendMessage).toHaveBeenCalledWith({}, 123, 'Lista de membros:\nUsername: user1\nNome: John\nSobrenome: Doe\nID: 123\n\nUsername: user2\nNome: Jane\nSobrenome: Smith\nID: 456\n\n');
});

test('listMembers should send a single member', async () => {
  const mockMsg = {
    chat: {
      id: 123
    }
  };

  getParticipation.mockImplementation(() => Promise.resolve({
    members: ['user1:John:Doe:123']
  }));

  await listMembers({}, mockMsg);
  
  expect(getParticipation).toHaveBeenCalledTimes(1);
  expect(sendMessage).toHaveBeenCalledTimes(1);
  expect(sendMessage).toHaveBeenCalledWith({}, 123, 'Lista de membros:\nUsername: user1\nNome: John\nSobrenome: Doe\nID: 123\n\n');
});

test('listMembers with no member', async () => {
    const mockMsg = {
      chat: {
        id: 123
      }
    };
  
    await listMembers({}, mockMsg);
    
    expect(getParticipation).toHaveBeenCalledTimes(1);
    expect(sendMessage).toHaveBeenCalledTimes(1);
    expect(sendMessage).toHaveBeenCalledWith({}, 123, 'Lista de membros:\n');
  });