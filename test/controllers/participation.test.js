
const { unvotedByPollId } = require("../../controllers/participation");
const { getParticipation } = require("../../http_out/jsonstorage");

jest.mock('../../http_out/jsonstorage.js');

beforeEach(() => {
    jest.clearAllMocks();
    getParticipation.mockImplementation(() => Promise.resolve(
        {"votes":{},
         "members":[]}));
});

test('unvotedByPollId single non voter is found', async () => {
    getParticipation.mockImplementation(() => Promise.resolve(Promise.resolve(
        {votes:{"000":
                   {"123":
                     {"user":{"id":123,"is_bot":false,"first_name":"Lenin","username":"lenin1917"},"options":[0]}}},
         members:[":Rosa:Luxemburgo:124","lenin1917:Lenin::123"]})));

    const unvoted = await unvotedByPollId(['000']);

    expect(getParticipation).toHaveBeenCalledTimes(1);
    expect(unvoted).toEqual({
        "000":[
            {"id": "124",
             "name": "Rosa",
             "surname": "Luxemburgo",
             "username": ""}]});
});

test('unvotedByPollId multiple voters are found', async () => {
    getParticipation.mockImplementation(() => Promise.resolve(Promise.resolve(
        {votes:{},
         members:[":Rosa:Luxemburgo:124","lenin1917:Lenin::123"]})));

    const unvoted = await unvotedByPollId(['000']);

    expect(getParticipation).toHaveBeenCalledTimes(1);
    expect(unvoted).toEqual({
        "000":[
            {"id": "124",
             "name": "Rosa",
             "surname": "Luxemburgo",
             "username": ""},
            {"id": "123",
             "name": "Lenin",
             "surname": "",
             "username": "lenin1917"}]});
});

test('unvotedByPollId single voter is found for multiple polls', async () => {
    getParticipation.mockImplementation(() => Promise.resolve(Promise.resolve(
        {votes:{"001":
                   {"123":
                     {"user":{"id":123,"is_bot":false,"first_name":"Lenin","username":"lenin1917"},"options":[0]}},
                "000":
                     {"124":
                       {"user":{"id":124},"options":[1]}}},
         members:[":Rosa:Luxemburgo:124","lenin1917:Lenin::123"]})));

    const unvoted = await unvotedByPollId(['000','001']);

    expect(getParticipation).toHaveBeenCalledTimes(1);
    expect(unvoted).toEqual({
        "000":[
            {"id": "123",
             "name": "Lenin",
             "surname": "",
             "username": "lenin1917"}],
        "001":[
            {"id": "124",
                "name": "Rosa",
                "surname": "Luxemburgo",
                "username": ""},
            ]});
});