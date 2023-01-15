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
}).catch(() => {
    console.log('db está zoado!')
});


function userLogged(userName, participants) {
    for (let elem of participants) {
        if (userName === elem.name) {
            return true;
        }
    }
    return false;
}

//post /participants

server.post("/participants", async (req, res) => {
    const participant = req.body;
    const participants = await db.collection("participants").find().toArray();
    if (validParticipantName(participant)) {
        if (nameUsed(participant, participants)) {
            res.sendStatus(409);
        } else {
            db.collection("participants").insertOne({
                name: participant.name,
                lastStatus: Date.now()
            });
            loginMessage(participant);
            res.sendStatus(201);
        }
    } else {
        res.sendStatus(422);
    }
})

function validParticipantName(participant) {
    const participantSchema = joi.object({
        name: joi.string().required()
    })
    const validation = participantSchema.validate(participant);
    return !validation.error;
}

function nameUsed(participant, participants) {
    if (participants.length >= 0) {
        for (let elem of participants) {
            if (elem.name === participant.name) {
                return true;
            }
        }
        return false;
    };
    return false;
}

function loginMessage(participant) {
    db.collection("messages").insertOne({
        from: participant.name,
        to: 'Todos',
        text: 'entra na sala...',
        type: 'status',
        time: `${dayjs().hour()}:${dayjs().minute()}:${dayjs().second()}`
    })
}

//post /participants

server.get("/participants", async (req, res) => {
    const participants = await db.collection("participants").find().toArray();
    res.send(participants);
})

//POST /messages
server.post("/messages", async (req, res) => {
    const message = {
        from: req.headers.user,
        to: req.body.to,
        text: req.body.text,
        type: req.body.type
    };
    const participants = await db.collection("participants").find().toArray();
    if (validMessage(message)) {
        if (userLogged(message.from, participants)) {
            db.collection("messages").insertOne({
                from: message.from,
                to: message.to,
                text: message.text,
                type: message.type,
                time: `${dayjs().hour()}:${dayjs().minute()}:${dayjs().second()}`
            })
            res.sendStatus(201);
        } else {
            res.sendStatus(422);
        }
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

function validMessageType(type) {
    return !!(type === "message" || type === "private_message");
}

//POST /messages

//GET /messages
server.get("/messages", async (req, res) => {
    const user = req.headers.user;
    const limit = Number(req.query.limit);
    const messages = await db.collection("messages").find().toArray();
    const participants = await db.collection("participants").find().toArray();
    if (userLogged(user, participants)) {
        const messagesToSend = filterSendMessages(user, limit, messages);
        res.status(201).send(messagesToSend);
    } else {
        res.sendStatus(401);
    }
})

function filterSendMessages(user, limit, messages) {
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
server.post("/status", async (req, res) => {
    const userName = req.headers.user;
    const participants = await db.collection("participants").find().toArray();
    if (userLogged(userName, participants)) {
        const user = getParticipant(userName, participants);
        updateStatus(user);
        res.sendStatus(200);
    } else {
        res.sendStatus(404);
    }
})

function updateStatus(user) {
    const updatedUser = {
        name: user.name,
        lastStatus: Date.now()
    }
    db.collection('participants').updateOne({
        _id: user._id
        },
        {
            $set: updatedUser
        });
}

function getParticipant(name, participants) {
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