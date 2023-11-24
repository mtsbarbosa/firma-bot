const binAccountId = process.env.JSON_STORAGE_ACCOUNT_ID;
const binId = process.env.JSON_STORAGE_KEY;
const participationBinId = process.env.JSON_PARTICIPATION_KEY;
const apiKey = process.env.JSON_STORAGE_API_KEY;

const getBin = async (binId) => {
    try {
        const response = await fetch(`https://api.jsonstorage.net/v1/json/${binAccountId}/${binId}?apiKey=${apiKey}`, {
            method: "GET"
        });

        if (!response.ok) {
            throw new Error(`HTTP Error: ${response.status}`);
        }

        const data = await response.json();
        return data;
    } catch (error) {
        console.error("Error:", error);
    }
};

const getEvents = () => {
    return getBin(binId);
};

const getParticipation = () => {
    return getBin(participationBinId);
};


const addEvent = async (event) => {
    try {
        const record = await getEvents();
        record.events.push(event);

        const eventData = JSON.stringify(record);

        const response = await fetch(`https://api.jsonstorage.net/v1/json/${binAccountId}/${binId}?apiKey=${apiKey}`, {
            method: "PUT",
            headers: {
                "Content-Type": "application/json"
            },
            body: eventData,
        });

        if (!response.ok) {
            throw new Error(`HTTP Error: ${response.status}`);
        }

        const data = await response.json();
        return data;
    } catch (error) {
        console.error("Error:", error);
    }
};

const upsertParticipation = async (record) => {
    try {
        const eventData = JSON.stringify(record);

        const response = await fetch(`https://api.jsonstorage.net/v1/json/${binAccountId}/${participationBinId}?apiKey=${apiKey}`, {
            method: "PUT",
            headers: {
                "Content-Type": "application/json"
            },
            body: eventData,
        });

        if (!response.ok) {
            throw new Error(`HTTP Error: ${response.status}`);
        }

        const data = await response.json();
        return data;
    } catch (error) {
        console.error("Error:", error);
    }
};

const upsertVotes = async (vote) => {
    const record = await getParticipation();
    if(!record.votes[vote.poll_id]){
        record.votes[vote.poll_id] = {};
    }
    record.votes[vote.poll_id][vote.user.id.toString()] = {user: vote.user, options: vote.option_ids};
    return upsertParticipation(record);
}

const addEvents = async (events) => {
    try {
        const record = await getEvents();
        const updateEvents = record.events.concat(events);
        record.events = updateEvents;
        const eventData = JSON.stringify(record);

        const response = await fetch(`https://api.jsonstorage.net/v1/json/${binAccountId}/${binId}?apiKey=${apiKey}`, {
            method: "PUT",
            headers: {
                "Content-Type": "application/json"
            },
            body: eventData,
        });

        if (!response.ok) {
            throw new Error(`HTTP Error: ${response.status}`);
        }

        const data = await response.json();
        return data;
    } catch (error) {
        console.error("Error:", error);
    }
};

const replaceEvents = async (events) => {
    try {
        const eventData = JSON.stringify({events});

        const response = await fetch(`https://api.jsonstorage.net/v1/json/${binAccountId}/${binId}?apiKey=${apiKey}`, {
            method: "PUT",
            headers: {
                "Content-Type": "application/json"
            },
            body: eventData,
        });

        if (!response.ok) {
            throw new Error(`HTTP Error: ${response.status}`);
        }

        const data = await response.json();
        return data;
    } catch (error) {
        console.error("Error:", error);
    }
};

const upsertMembers = async (newMembers) => {
    const record = await getParticipation();
    for (const username of newMembers) {
        // Add the username to the members array if it doesn't already exist
        if (!record.members.includes(username)) {
            record.members.push(username);
        }
    }
    return upsertParticipation(record);
}

const removeMembers = async (membersToRemove) => {
    const record = await getParticipation();
    record.members = record.members.filter((member) => !membersToRemove.includes(member.split(':')[3]));
    return upsertParticipation(record);
}

module.exports = {
    addEvent,
    addEvents,
    getEvents,
    replaceEvents,
    getParticipation,
    upsertMembers,
    upsertVotes,
    removeMembers
}