const app = require("express")();
const server = require('http').createServer(app);
const io = require('socket.io')(server);

const PORT = process.env.PORT || 3001;

const activeUsers = {};

io.on('connection', (socket) => {
    const userId = socket.handshake.query.id;
    console.log(`Client ${userId} with socket id ${socket.id} connected.`);
    
    // join my own room. All other users will send messages to this
    // room if they are sending it to me
    socket.join(userId);

    activeUsers[userId] = {
        socketId: socket.id,
        userId,
        userName: socket.handshake.query.name,
        isActive: true
    };

    // send all currently active contacts to this user
    function sendAllActiveContactsToThisClient() {
        const otherUsers = Object.values(activeUsers).filter(cont => cont.userId !== userId);
        otherUsers.forEach(cont => delete cont.socketId);
        socket.emit('contacts-list', { contacts: otherUsers });
    }

    // send this client to all other clients
    function sendThisContactActivenessToAllOtherClients(isActive) {
        const currUser = { ...activeUsers[userId] };
        delete currUser.socketId;
        const otherUsers = Object.values(activeUsers).filter(cont => cont.userId !== userId);
        otherUsers.forEach(cont => {
            if (io.sockets.adapter.rooms.get(cont.userId)) {
                socket.to(cont.userId).emit(isActive ? 'new-contact' : 'remove-contact', { contact: currUser });
            }
        });
    }
    sendThisContactActivenessToAllOtherClients(true);
    sendAllActiveContactsToThisClient();

    socket.on('send-offer', (data) => {
        console.log(`Sending an offer from ${userId} to ${data.recipientId}.`);

        if (io.sockets.adapter.rooms.get(data.recipientId)) {
            socket.to(data.recipientId).emit('receive-offer', {
                offererId: userId,
                offer: data.offer,
                type: data.type
            });
        } else {
            console.log(`User ${data.recipientId} is not connected.`);
        }
    });

    socket.on('answer-offer', (data) => {
        console.log(`${userId} answering the offer made by ${data.offererId}.`);

        if (io.sockets.adapter.rooms.get(data.offererId)) {
            socket.to(data.offererId).emit('receive-answer', {
                answererId: userId,
                answer: data.answer,
                type: data.type
            });
        } else {
            console.log(`User ${data.offererId} is not connected.`);
        }
    });

    socket.on('send-candidate', (data) => {
        console.log(`Sending candidate from ${userId} to ${data.recipientId}.`);

        if (io.sockets.adapter.rooms.get(data.recipientId)) {
            socket.to(data.recipientId).emit('receive-candidate', {
                senderId: userId,
                candidate: data.candidate,
                type: data.type
            });
        } else {
            console.log(`User id ${data.recipientId} is not connected.`);
        }
    });

    socket.on('disconnect', () => {
        console.log(`Client ${userId} with socket id ${socket.id} disconnected.`);
        sendThisContactActivenessToAllOtherClients(false);
        delete activeUsers[userId];
    });
});

server.listen(PORT, () => {
    console.log(`Server listening on ${PORT}`);
});