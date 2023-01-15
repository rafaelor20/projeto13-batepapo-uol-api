import express from "express";
import cors from "cors";
import { MongoClient } from "mongodb";
import dayjs from "dayjs";
import dotenv from "dotenv";
import joi from 'joi'
dotenv.config();

const PORT = 5000;

const server = express();
server.use(express.json());
server.use(cors());

const mongoClient = new MongoClient(process.env.DATABASE_URL);
let db;

mongoClient.connect().then(() => {
	db = mongoClient.db(); //Não adicione nenhum nome customizado para o banco de dados
});

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

server.post("/participants", async (req, res) => {
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
    const participantSchema = joi.objecty({
        name: joi.string().required()
    })
    const validation = participantSchema.validate(participant);
    return !validation.error;
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
    const message = {
        from: req.headers.user,
        to: req.body.to,
        text: req.body.text,
        type: req.body.type
    }
    if (validMessage(message)) {
        messages.push({
            from: message.user,
            to: message.to,
            text: message.text,
            type: message.type,
            time: `${dayjs().hour()}:${dayjs().minute()}:${dayjs().second()}`
        })
        res.sendStatus(201);
    } else {
        res.sendStatus(422);
    }
})

function validMessage(message) {
    const messageSchema = joi.object({
        from: joi.string().required(),
        to: joi.string().required(),
        text: joi.string().required(),
        type: joi.string().required(),
    })

    const validation = messageSchema.validate(message);

    return (!validation.error && validMessageType(message.type));
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
    const user = req.headers.user;
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
    for (let i in messages) {
        if (messages[i].type === "message") {
            messagesToSend.push(messages[i])
        } else {
            if (messages[i].from === user) {
                messagesToSend.push(messages[i])
            }
            if (messages[i].to === user) {
                messagesToSend.push(messages[i])
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
    const userName = req.headers.user;
    if (userLogged(userName)) {
        const user = getParticipant(userName);
        updateStatus(user);
        res.sendStatus(200);
    } else {
        res.sendStatus(404);
    }
})

function updateStatus(user) {
    console.log(user)
    user = {
        name: user.name, lastStatus: Date.now()
    };
}

function getParticipant(name) {
    for (let i in participants) {
        if (participants[i].name === name) {
            return participants[i];
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