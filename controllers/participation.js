const { DateTime } = require("luxon");
const { getParticipation, getEvents, upsertParticipation } = require("../http_out/jsonstorage");
const { filterEventsByDaysLimit } = require("../logic/events");
const { sendMessage } = require("../http_out/telegram");

const unvotedByPollId = async (pollIds) => {
    const participation = await getParticipation();
    const members = participation.members.map((full) => {
        const [username = undefined, name, surname = undefined, id] = full.split(':');
        return {username, name, surname, id};
    });

    const votes = participation.votes;
    const usersWhoHaventVoted = {};
  
    for (const pollId of pollIds) {
      if(pollId === undefined) continue;
      usersWhoHaventVoted[pollId] = [];
  
      for (const member of members) {
        if (!votes[pollId]?.[member.id]) {
          // User hasn't voted for the current pollId
          usersWhoHaventVoted[pollId].push(member);
        }
      }
    }
  
    return usersWhoHaventVoted;
};

const askParticipation = async (bot, targetChat, targetThread, daysLimit) => {
    const { events: userEvents, availabilities } = await getEvents();

    const pollsMatchingDays = [...filterEventsByDaysLimit(DateTime.now(), userEvents, daysLimit).map((event) => [event.poll_id, event.poll_message_id]),
                               ...filterEventsByDaysLimit(DateTime.now(), availabilities, daysLimit).map((event) => [event.poll_id, event.poll_message_id])]
    //console.log('pollsMatchingDays', pollsMatchingDays);
    const pollMap = pollsMatchingDays.reduce((acc, [pollId, messageId]) => {
      acc[pollId] = messageId;
      return acc;
    }, {});
    //console.log('pollMap', pollMap);
    const unvoted = await unvotedByPollId(pollsMatchingDays.map((pair) => pair[0]));
    //console.log('unvoted', unvoted);
    const initialText = 'Favor responder à enquete: ';

    Object.keys(unvoted).forEach(pollId => {
        let currentOffset = initialText.length;
        const userOffset = {};
        
        if(unvoted[pollId].length > 0){
            const mentions = unvoted[pollId].map((user, index) => {
                const mention = user.username ? `@${user.username} ` : `${user.name} ${user.surname ? user.surname : ''} `;
                userOffset[user.id] = currentOffset;
                currentOffset = currentOffset + mention.length + 1;
                return mention;
            });

            const entities = unvoted[pollId].reduce((acc, user) => {
                if(user.username.length === 0){
                    const mention = `${user.name} ${user.surname.length > 0 ? user.surname : ''}`;
                    return [...acc,  {
                        type: 'text_mention',
                        user: user.surname.length > 0 ? {
                            id: user.id,
                            first_name: user.name,
                            last_name: user.surname,
                          } : {
                            id: user.id,
                            first_name: user.name
                          },
                        offset: userOffset[user.id],
                        length: mention.length,
                      }];
                }
                return acc;
            }, []);
    
            sendMessage(bot, targetChat, `${initialText}${mentions}`, {
                message_thread_id: targetThread,
                reply_to_message_id: pollMap[pollId],
                entities: entities
            });
        }
      });
}

const removeVotesByKeys = async (keys) => {
  const participation = await getParticipation();
  keys.forEach((key) => delete participation.votes[key]);
  return upsertParticipation(participation);
}

module.exports = {
    unvotedByPollId,
    askParticipation,
    removeVotesByKeys
}