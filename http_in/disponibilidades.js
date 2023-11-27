const { createAvailability } = require("../controllers/availability");
const { onReceiveText } = require("../http_out/telegram");

const onReceiveDisponibilidade = (bot, targetChat, targetThread, msg) => {
    createAvailability(bot, targetChat, targetThread, msg);
};

const init = (bot, targetChat, targetThread) => {
    onReceiveText(bot, /\/disponibilidade/, (msg) => {
        onReceiveDisponibilidade(bot, targetChat, targetThread, msg);
    });
};

module.exports = {
    init,
    onReceiveDisponibilidade
}