"use strict";

const apiUrl = "/api";
const messagePollingRateMs = 2000;

const sendBtn = document.getElementById("sendBtn");
const nameInput = document.getElementById("nameInput");
const messageInput = document.getElementById("messageInput");
const messagesContainer = document.querySelector(".messages");

// Hämtar alla meddelanden från servern
// Returnerar null om vi inte fick ett svar
async function getMessages() {
    try {
        const response = await fetch(apiUrl + "/messages");
        if (!response.ok) {
              throw new Error(`Response status: ${response.status}`);
        }
        const result = await response.json();
        console.log(result.messages);
        return result.messages;
    }
    catch(error) {
        console.error(error.message);
    }
    return null;
}

// Skapa ett meddelande objekt
function createMessage(username, message) {
    return {
        user: username,
        message: message,
        time: Date.now()
    };
}

// Posta ett meddelande till servern
async function postMessage(msg) {
    try {
        const response = await fetch(apiUrl + "/messages", {
            method: "POST",
            body: JSON.stringify(msg),
            headers: {
                "Content-Type": "application/json",
            }
        });
        if (!response.ok) {
              throw new Error(`Response status: ${response.status}`);
        }
        console.log(`Post message status: ${response.status}`);
    }
    catch(error) {
        console.error(error.message);
    }
}

function getUsernameColor(username) {
    let csum = 0;
    for(let i = 0; i < username.length; i++) {
        csum += username.charCodeAt(i);
    }
    let cmod = Math.floor(csum / username.charCodeAt(0)) % 10;
    console.log(username, csum, cmod);
    switch(cmod) {
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

function formatUnixT(time) {
    const curT = Date.now();

    const diff = curT - time;
    const secs = Math.floor(diff / 1000);
    const mins = Math.floor(secs / 60);
    const hours = Math.floor(mins / 60);
    const days = Math.floor(hours / 24);

    if(secs < 60) {
        return "nu";
    }
    else if(mins < 2) {
        return "en minut sen";
    }
    else if(mins < 25) {
        return `${mins} minuter sen`
    }
    else if(days < 1) {
        const date = new Date(time);
        const formattedTime = date.toLocaleTimeString("sv-SE");
        return `${formattedTime}`;
    }

    const date = new Date(time);
    const formattedDate = date.toLocaleDateString("sv-SE");
    const formattedTime = date.toLocaleTimeString("sv-SE");
    return `${formattedDate} ${formattedTime}`;
}

function displayMessages(allMessages ) {
    var messagesContainer = document.querySelector(".messages");
    messagesContainer.innerHTML = "";
    allMessages .forEach(msg => {
        var messageDiv = document.createElement("div");
        messageDiv.classList.add("message-div");

        
        // Alla meddelanden från användaren
        if(msg.user === nameInput.value){
        messageDiv.classList.add("my-message");}

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

async function sendCurrentMessage() {
  const name = (nameInput.value || "").trim();
  const text = messageInput.value;

  if (!text.trim()) return;

  await postMessage(createMessage(name, text));
  messageInput.value = "";
  await getMessages();
}

sendBtn.addEventListener("click", async () => {
  try {
    await sendCurrentMessage();
  } catch (error) {
    console.error(error);
    alert(error.message);
  }
});

messageInput.addEventListener("keydown", async (e) => {
  if (e.key === "Enter" && !e.shiftKey) {
    e.preventDefault();
    try {
      await sendCurrentMessage();
    } catch (error) {
      console.error(error);
      alert(error.message);
    }
  }
});
async function pollOnlyNewMessages() {
    try {
        const messages = await fetch(apiUrl + "/messages", {
            headers: {
                "X-Poll": "yes"
            }
        });

        if (!messages.ok) {
            throw new Error(`Response status: ${messages.status}`);
        }
        const result = await messages.json();
        console.log(result.messages);
        return result.messages;
    }
    catch (error) {
        console.error(error.message);
    }
    return null;
}

async function pollMessages() {
    const messages = await pollOnlyNewMessages();
    displayMessages(messages);
    pollMessages();
}

getMessages()
    .then(displayMessages)
    .then(pollMessages)
    .catch(console.error);
