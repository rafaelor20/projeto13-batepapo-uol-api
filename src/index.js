import express from "express"

const PORT = 5000;

const server = express();
server.use(express.json());

const participants = [];
const messages = [];

//const mongoClient = new MongoClient(process.env.DATABASE_URL);
//const db = mongoClient.db();

server.post("/participants", (req, res) => {
    const participant = req.body;
    if (validSignUp(participant)) {
        if (nameUsed(participant)) {
            res.sendStatus(409);
        } else {
            participants.push({ name: participant.name, lastStatus: Date.now() })
            res.sendStatus(201);
        }
    } else {
        res.sendStatus(422);
    }
})

function validParticipant(participant) {
    let ok = false;
    if (typeof participant.name === "string") {
        if (participant.name.length > 0) {
            ok = true;
        }
    }
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

server.get("/participants", (req, res) => {
    res.send(participants);
})

server.post("/messages", (req, res) => {
    
})

server.listen(PORT, () => console.log(`Este servidor roda na porta: ${PORT}`));

/*
thunder client:

participante:
{name: 'João', lastStatus: 12313123} // O conteúdo do lastStatus será explicado nos próximos requisitos

mensagem:
{from: 'João', to: 'Todos', text: 'oi galera', type: 'message', time: '20:04:37'}



*/