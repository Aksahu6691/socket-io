import express, { json } from "express";
import bodyParser from "body-parser";
import { Server } from "socket.io";
import http from "http";
import { fileURLToPath } from "url";
import path from "path";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const server = http.createServer(app)
const io = new Server(server);

// Basic modules for backend
app.use(json());
app.use(express.static("public"));
app.use(express.urlencoded({ extended: true }));
app.use(bodyParser.json()); // It will give json format data

app.get('/', (req, res) => {
    res.sendFile(__dirname + '/index.html');
});

// Route handlers
app.all("*", (req, res, next) => {
    res.status(404).send(`can't find ${req.originalUrl} on the server`);
});

// $$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$ Socket.io implementation section $$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$
var users = 0;
var roomNo = 1;
var roomFull = 2;

// if you want to create custom socket api then this is the code.
var customSocket = io.of('/custom-api');
customSocket.on('connection', (socket) => {
    console.log('a custom socket connected');
    customSocket.emit('chat', "Hii! Welcome in your new chat room!");
});

// here is default socket api
io.on('connection', (socket) => {
    users++;
    console.log('a user connected', users);

    // ==================== if you want to create multiple rooms or multiple channels then here is code. ======================
    // NOTE: In clint side receive this event as normal like other events receive
    socket.join('roomName');

    // send message to specific room
    socket.to('roomName').emit('eventName', 'Hii, you are connected to a room no. ' + roomNo);

    roomFull++;
    if (roomFull >= 2) {
        roomFull = 0;
        roomNo++;
    }

    // receive message from specific room
    socket.on('roomName', (data) => {
        socket.to('roomName').emit('eventName', data);
    });

    // ======================== message broadcast in custom event=====================================
    socket.emit('newUserConnected', { msg: " Hii, Welcome Dear" });
    socket.broadcast.emit('alreadyConnectedUser', { msg: users + " users connected!" });
    io.emit('allUserConnected', { msg: " This is common message to show all users" });

    // ========================= receive custom event data =========================
    socket.on('customClineSideEvent', (data) => {
        console.log(data);
    });

    // ============================ user is disconnected ============================
    socket.on('disconnect', () => {
        users--; console.log('a user disconnected', users);

        socket.broadcast.emit('alreadyConnectedUser', { msg: users + " users connected!" });
    });
});

// Pre-reserved events
// 1. connection
// 2. disconnect
// 3. message
// 4. reconnect
// 5. ping
// 6. join
// 7. leave

// Error Handle
process.on("uncaughtException", (err) => {
    console.log(err.name, err.message);
    console.log("Uncaught Exception occurred! Shutting down...");
    process.exit(1);
});

// Start backend server on port
server.listen(process.env.PORT, () => {
    console.log(`server is running on port: ${process.env.PORT}`);
});