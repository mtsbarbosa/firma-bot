const { DateTime } = require("luxon");
const { getEvents } = require("../http_out/jsonstorage");
const { sendMessage } = require("../http_out/telegram");

const generateCalendar = async (bot, chatId) => {
    const { events: userEvents } = await getEvents();
    if (userEvents.length === 0) {
        sendMessage(bot, chatId, "Sem atividades para mostrar no calendário.");
    } else {
        userEvents.sort((a, b) => (a.date_time > b.date_time) ? 1 : -1);

        let calendarMessage = "*CALENDÁRIO*:\n\n";

        // Group events by month
        const eventsByMonth = userEvents.reduce((acc, event) => {
            const monthKey = DateTime.fromFormat(event.date_time, 'yyyy-MM-dd HH:mm').toFormat('LLLL yyyy', { locale: 'pt-BR' });
            if (!acc[monthKey]) {
                acc[monthKey] = [];
            }
            acc[monthKey].push(event);
            return acc;
        }, {});

        // Iterate over each month and its events
        for (const [month, monthEvents] of Object.entries(eventsByMonth)) {
        // Format month title with emoji
        calendarMessage += `🗓️ *${month.toUpperCase()}*\n`;

        // Group events by week within the month
        const eventsByWeek = monthEvents.reduce((acc, event) => {
            const weekNumber = DateTime.fromFormat(event.date_time, 'yyyy-MM-dd HH:mm').toFormat('W', { locale: 'pt-BR' });
            if (!acc[weekNumber]) {
            acc[weekNumber] = [];
            }
            acc[weekNumber].push(event);
            return acc;
        }, {});

        // Iterate over each week and its events
        for (const [week, weekEvents] of Object.entries(eventsByWeek)) {
            // Format week title
            calendarMessage += `⤵️ semana ${week}\n`;

            // List events within the week
            weekEvents.forEach((event) => {
                const dateTime = DateTime.fromFormat(event.date_time, 'yyyy-MM-dd HH:mm').toFormat("cccc (dd/MM) à's' HH:mm", { locale: 'pt-BR' })
                if(event.outdated){
                    calendarMessage += `➡️ ~${event.event_name} - ${event.location}~\n⏰ ~${dateTime}~\n\n`;
                } else {
                    calendarMessage += `➡️ ${event.event_name} - ${event.location}\n⏰ ${dateTime}\n\n`;
                }
            });
        }
        }

        sendMessage(bot, chatId, calendarMessage.replace(/[-()]/g, '\\$&'), { parse_mode: 'MarkdownV2' });
    }
};

module.exports = {
    generateCalendar
}