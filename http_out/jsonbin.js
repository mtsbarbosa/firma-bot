const apiKey = process.env.JSON_BIN_API_KEY;
const binId = process.env.JSON_BIN_ID;
const binVersion = "latest";

const getEvents = async () => {
    try {
        const response = await fetch(`https://api.jsonbin.io/v3/b/${binId}/${binVersion}`, {
            method: "GET",
            headers: {
                "X-Access-Key": apiKey,
            },
        });

        if (!response.ok) {
            throw new Error(`HTTP Error: ${response.status}`);
        }

        const data = await response.json();
        console.log('GET', data.record);
        return data.record;
    } catch (error) {
        console.error("Error:", error);
    }
};


const addEvent = async (event) => {
    try {
        const record = await getEvents();
        record.events.push(event);

        const eventData = JSON.stringify(record);

        const response = await fetch(`https://api.jsonbin.io/v3/b/${binId}`, {
            method: "PUT",
            headers: {
                "Content-Type": "application/json",
                "X-Access-Key": apiKey,
            },
            body: eventData,
        });

        if (!response.ok) {
            throw new Error(`HTTP Error: ${response.status}`);
        }

        const data = await response.json();
        console.log('PUT', data);
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

        const response = await fetch(`https://api.jsonbin.io/v3/b/${binId}`, {
            method: "PUT",
            headers: {
                "Content-Type": "application/json",
                "X-Access-Key": apiKey,
            },
            body: eventData,
        });

        if (!response.ok) {
            throw new Error(`HTTP Error: ${response.status}`);
        }

        const data = await response.json();
        console.log('PUT', data);
        return data;
    } catch (error) {
        console.error("Error:", error);
    }
};

const replaceEvents = async (events) => {
    try {
        const eventData = JSON.stringify({events});

        const response = await fetch(`https://api.jsonbin.io/v3/b/${binId}`, {
            method: "PUT",
            headers: {
                "Content-Type": "application/json",
                "X-Access-Key": apiKey,
            },
            body: eventData,
        });

        if (!response.ok) {
            throw new Error(`HTTP Error: ${response.status}`);
        }

        const data = await response.json();
        console.log('PUT', data);
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