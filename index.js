require('dotenv').config();
const { initializeBot, onReceive } = require('./http_out/telegram');
const { init : initAtividades, onReceiveAnyText : onReceiveAnyAtividadesText } = require('./http_in/atividades');

const botToken = process.env.BOT_TOKEN;
const targetChat = process.env.POLL_TARGET_CHAT;
const targetThread = process.env.POLL_TARGET_THREAD;

/*
function checkNonResponders() {
    const groupId = 'YOUR_GROUP_ID';

    // Get a list of all users in the group
    const allGroupMembers = getGroupMembers(groupId);

    // Identify users who haven't responded to the poll
    const nonResponders = allGroupMembers.filter((user) => !userResponses[user.id]);

    // Send a report with the list of non-responders
    const reportMessage = `Users who haven't responded to the poll: ${nonResponders.map((user) => user.username).join(', ')}`;
    bot.sendMessage(groupId, reportMessage);
}
*/

const init = (targetChat, targetThread) => {
    const bot = initializeBot(botToken);
    initAtividades(bot, targetChat, targetThread);

    onReceive(bot, 'poll_answer', (pollAnswer) => {
        const userId = pollAnswer.user.id;
        const pollId = pollAnswer.poll_id;
    
        //console.log('pollAnswer', pollAnswer);
        /*
    pollAnswer {
      poll_id: '4920718171029110XXX',
      user: {
        id: 103100XXX,
        is_bot: false,
        first_name: 'MyName',
        last_name: 'MySurname',
        username: 'myusername'
      },
      option_ids: [ 1 ]
    }
        */
    
        // Store the user's response in the database
        /*userResponses[userId] = {
            pollId,
            choice: pollAnswer.option_ids[0], // Store the choice made by the user
        };*/
    });

    onReceive(bot, 'text', (msg) => {
        onReceiveAnyAtividadesText(bot, msg, targetChat, targetThread);
    });
};

init(targetChat, targetThread);

console.log('Bot is running...');
