import express from "express";
import cors from "cors";
import dayjs from "dayjs";

const PORT = 5000;

const server = express();
server.use(express.json());
server.use(cors());

const participants = [];
const messages = [];

function validStr(str) {
    if (typeof str === "string") {
        if (str.length > 0) {
            return true;
        }
    }
    return false;
}

//const mongoClient = new MongoClient(process.env.DATABASE_URL);
//const db = mongoClient.db();

//post /participants

server.post("/participants", (req, res) => {
    const participant = req.body;
    if (validParticipantName(participant)) {
        if (nameUsed(participant)) {
            res.sendStatus(409);
        } else {
            participants.push({ name: participant.name, lastStatus: Date.now() })
            console.log(participants);
            res.sendStatus(201);
        }
    } else {
        res.sendStatus(422);
    }
})

function validParticipantName(participant) {
    let ok;
    ok = validStr(participant.name);
    return ok;
}

function nameUsed(participant) {
    for (let elem of participants) {
        if (elem.name === participant.name) {
            return true;
        }
    }
    return false;
}

//post /participants

server.get("/participants", (req, res) => {
    res.send(participants);
})

//POST /messages
server.post("/messages", (req, res) => {
    const messageBody = req.body;
    const messageHead = req.headers;
    if (validMessage(messageBody, messageHead)) {
        messages.push({
            from: messageHead.user,
            to: messageBody.to,
            text: messageBody.text,
            type: messageBody.type,
            time: `${dayjs().hour()}:${dayjs().minute()}:${dayjs().second()}`
        })
        console.log(messages);
        res.sendStatus(201);
    } else {
        res.sendStatus(422);
    }
})

function validMessage(messageBody, messageHead) {
    const isValidFrom = validUser(messageHead.user);
    const isValidTo = validStr(messageBody.to);
    const isValidText = validStr(messageBody.text);
    const isValidType = validMessageType(messageBody.type);
    return !!((isValidFrom && isValidTo) && (isValidText && isValidType));
}

function validUser(user) {
    return !!(userLogged(user) && validStr(user));
}

function userLogged(user) {
    for (let elem of participants) {
        if (user === elem.name) {
            return true;
        }
    }
    return false;
}

function validMessageType(type) {
    return !!(type === "message" || type === "private_message");
}

//POST /messages

//GET /messages
server.get("/messages", (req, res) => {
    const user = req.header.User;
    const limit = Number(req.query.limit);
    if (userLogged(user)) {
        const messagesToSend = filterSendMessages(user, limit);
        res.status(201).send(messagesToSend);
    } else {
        res.sendStatus(401);
    }
})

function filterSendMessages(user, limit) {
    const messagesToSend = [];
    for (let message in messages) {
        if (message.type === "message") {
            messagesToSend.push(message)
        } else {
            if (message.from === user) {
                messagesToSend.push(message)
            }
            if (message.to === user) {
                messagesToSend.push(message)
            }
        }
    }
    if (typeof limit === "number") {
        return (messagesToSend.slice(-limit));
    } else {
        return messagesToSend;
    }
}

//GET /messages

//POST /status
server.post("/status", (req, res) => {
    const userName = req.header.User;
    if (userLogged(userName)) {
        const user = getParticipant(userName);
        updateStatus(user);
    } else {
        res.sendStatus(404);
    }
})

function updateStatus(user) {
    user = {
        from: user.from,
        to: user.to,
        text: user.text,
        type: user.type,
        time: `${dayjs().hour()}:${dayjs().minute()}:${dayjs().second()}`
    };
}

function getParticipant(name) {
    for (let elem in participants) {
        if (elem.name === name) {
            return elem;
        }
    }
    return null;
}




//POST /status


server.listen(PORT, () => console.log(`Este servidor roda na porta: ${PORT}`));

/*
thunder client:

participante:
{name: 'João', lastStatus: 12313123} // O conteúdo do lastStatus será explicado nos próximos requisitos

mensagem:
{from: 'João', to: 'Todos', text: 'oi galera', type: 'message', time: '20:04:37'}



*/