const isValidDateTimeFormat = (dateString) => {
    const regex = /^\d{4}-\d{2}-\d{2} \d{2}:\d{2}$/;
    return regex.test(dateString);
}

module.exports = {
    isValidDateTimeFormat
}