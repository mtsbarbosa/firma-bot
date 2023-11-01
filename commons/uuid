function generateUUID() {
  const hexDigits = '0123456789abcdef';
  let uuid = '';

  for (let i = 0; i < 36; i++) {
    if (i === 8 || i === 13 || i === 18 || i === 23) {
      uuid += '-';
    } else if (i === 14) {
      uuid += '4'; // Set the 14th character to 4
    } else if (i === 19) {
      uuid += hexDigits[(Math.random() * 4) | 8]; // Set the 19th character to 8, 9, A, or B
    } else {
      uuid += hexDigits[Math.floor(Math.random() * 16)];
    }
  }

  return uuid;
}

module.exports = {
    generateUUID
}