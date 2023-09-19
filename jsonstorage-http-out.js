const binAccountId = process.env.JSON_STORAGE_ACCOUNT_ID;
const binId = process.env.JSON_STORAGE_KEY;
const apiKey = process.env.JSON_STORAGE_API_KEY;

const getEvents = async () => {
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

module.exports = {
    addEvent,
    addEvents,
    getEvents,
    replaceEvents
}