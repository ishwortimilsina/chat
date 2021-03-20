const app = require("express")();
const server = require('http').createServer(app);
const io = require('socket.io')(server);

const PORT = process.env.PORT || 3001;

const { activeUsers } = require('./src/data');
const { handleWebRtcSignaling } = require("./src/webRtcSignaling");
const { handleRooms, removeUserFromAllRooms } = require("./src/rooms");
const { handleMeetStranger, handleMeetStrangerRemoval } = require("./src/meetStranger");

io.on('connection', (socket) => {
    const userId = socket.handshake.query.id;
    console.log(`Client ${userId} with socket id ${socket.id} connected.`);

    socket.join("public");

    activeUsers[userId] = {
        socketId: socket.id,
        userId,
        userName: socket.handshake.query.name,
        rooms: [],
        isActive: true
    };

    handleWebRtcSignaling(userId, socket, io);
    handleRooms(userId, socket, io);
    handleMeetStranger(userId, socket, io);

    socket.on('disconnect', () => {
        console.log(`Client ${userId} with socket id ${socket.id} disconnected.`);
        
        handleMeetStrangerRemoval(userId, socket, io);
        removeUserFromAllRooms(userId);
        
        delete activeUsers[userId];
    });
});

server.listen(PORT, () => {
    console.log(`Server listening on ${PORT}`);
});