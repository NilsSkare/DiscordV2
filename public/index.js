"use strict";

const apiUrl = "/api";
const messagePollingRateMs = 2000;

const sendBtn = document.getElementById("sendBtn");
const messageInput = document.getElementById("messageInput");
const messagesContainer = document.querySelector(".messages");

const curUsername = prompt("Skriv ditt användarnamn:");

// Skapa ett meddelande objekt
function createMessage(username, message) {
    return {
        user: username,
        message: message,
        time: Date.now(),
    };
}

const socket = new WebSocket("/api/connect");
const storedMessages = [];

// Ta fram användnamnets färg
function getUsernameColor(username) {
    let csum = 0;
    for (let i = 0; i < username.length; i++) {
        csum += username.charCodeAt(i);
    }
    let cmod = Math.floor(csum / username.charCodeAt(0)) % 10;
    //console.log(username, csum, cmod);
    switch (cmod) {
        case 0:
            return "#f87777";
        case 1:
            return "#cdb801";
        case 2:
            return "#7c63de";
        case 3:
            return "#7dc000";
        case 4:
            return "#35aa8b";
        case 5:
            return "#8c2caf";
        case 6:
            return "#a65a17";
        case 7:
            return "#235eab";
        case 8:
            return "#c9129e";
        case 9:
            return "#892053";
    }
    return "#ffffff";
}

// Formaterra unixtid till en läsbar sträng
function formatUnixT(time) {
    const curT = Date.now();

    const diff = curT - time;
    const secs = Math.floor(diff / 1000);
    const mins = Math.floor(secs / 60);
    const hours = Math.floor(mins / 60);
    const days = Math.floor(hours / 24);

    if (secs < 60) {
        return "nu";
    } else if (mins < 2) {
        return "en minut sen";
    } else if (mins < 25) {
        return `${mins} minuter sen`;
    } else if (days < 1) {
        const date = new Date(time);
        const formattedTime = date.toLocaleTimeString("sv-SE");
        return `${formattedTime}`;
    }

    const date = new Date(time);
    const formattedDate = date.toLocaleDateString("sv-SE");
    const formattedTime = date.toLocaleTimeString("sv-SE");
    return `${formattedDate} ${formattedTime}`;
}

// Visa upp alla givna meddelanden
// Rensar meddelanden som redan visas
function displayMessages(messages) {
    var messagesContainer = document.querySelector(".messages");
    messagesContainer.innerHTML = "";
    messages.forEach((msg) => {
        var messageDiv = document.createElement("div");
        messageDiv.classList.add("message-div");

        // Alla meddelanden från användaren
        if (msg.user === curUsername) {
            messageDiv.classList.add("my-message");
        }

        // namn + tid ovanför chatbubblan
        var messageHead = document.createElement("div");
        messageHead.classList.add("message-head");
        messageDiv.appendChild(messageHead);

        var messageUsername = document.createElement("span");
        messageUsername.innerHTML = `${msg.user}`;
        messageUsername.style = `color: ${getUsernameColor(msg.user)}`;
        messageHead.appendChild(messageUsername);

        var messageTime = document.createElement("span");
        messageTime.innerHTML = ` ${formatUnixT(msg.time)}`;
        messageTime.classList.add("message-time");
        messageHead.appendChild(messageTime);

        // Chatbubblan
        var messageBody = document.createElement("div");
        messageBody.classList.add("message-body");
        messageBody.innerHTML = msg.message;
        messageDiv.appendChild(messageBody);
        messagesContainer.appendChild(messageDiv);
    });
}

// Skickar meddelandet som är skrivet i textrutan
async function sendFormMessage() {
    const name = curUsername;
    const text = messageInput.value;

    if (!text.trim()) return;

    await sendMessage(createMessage(name, text));
}

// Skickar meddelandet till servern
async function sendMessage(msg) {
    socket.send(JSON.stringify(msg));
}

socket.onopen = () => {
    console.log("Ansluten till servern");
};

socket.onmessage = (event) => {
    var msg = JSON.parse(event.data);
    storedMessages.push(msg);
    displayMessages(storedMessages);
};

socket.onclose = () => {
    console.log("Anslutningen stängdes");
};

socket.onerror = (error) => {
    console.error("WebSocket error:", error);
};

// Skicka meddelandet om man trycker på 'send'
sendBtn.addEventListener("click", async () => {
    try {
        await sendFormMessage();
    } catch (error) {
        console.error(error);
        alert(error.message);
    }
});

// Skicka meddelandet om vi trycker enter i textrutan
messageInput.addEventListener("keydown", async (e) => {
    if (e.key === "Enter" && !e.shiftKey) {
        e.preventDefault();
        try {
            await sendFormMessage();
        } catch (error) {
            console.error(error);
            alert(error.message);
        }
    }
});
