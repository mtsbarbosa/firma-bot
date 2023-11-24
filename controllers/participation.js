const { getParticipation } = require("../http_out/jsonstorage");

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

module.exports = {
    unvotedByPollId
}