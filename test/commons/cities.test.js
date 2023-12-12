const { findCity } = require("../../commons/cities");

test('findCity finds something', () => {
    expect(findCity('sa')).toEqual('Santo André');
    expect(findCity('SA')).toEqual('Santo André');
    expect(findCity('Sa')).toEqual('Santo André');
    expect(findCity('sA')).toEqual('Santo André');
    expect(findCity('Santo André')).toEqual('Santo André');
    expect(findCity('rgs')).toEqual('Rio Grande da Serra');
});