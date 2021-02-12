const app = require("express")();
const server = require('http').createServer(app);
const io = require('socket.io')(server);

const PORT = process.env.PORT || 3001;

const activeUsers = {};

/**
 * returns are array of the userids that are connected in the chat room
 */
function getAllConnectedChatUserIds() {
    const ids = [];
    const allClientsInChatRoom = io.sockets.adapter.rooms.get('text-chat-room');
    const allConnectedSockets = io.sockets.sockets
    allClientsInChatRoom.forEach((sockId) => {
        const sock = allConnectedSockets.get(sockId);
        sock && ids.push(sock.handshake.query.id);
    });
    return ids;
}

io.on('connection', (socket) => {
    const userId = socket.handshake.query.id;
    console.log(`Client ${userId} with socket id ${socket.id} connected.`);
    
    // join my own room. All other users will send messages to this
    // room if they are sending it to me
    socket.join(userId);
    socket.join('text-chat-room');

    activeUsers[userId] = {
        socketId: socket.id,
        userId,
        userName: socket.handshake.query.name
    };
    
    // send the activeUsers list to this client
    function getAndEmitAvailableUsers() {
        const userIds = getAllConnectedChatUserIds();
        const allActiveUsers = Object.values(activeUsers).filter(cont => cont.userId !== userId);
        allActiveUsers.forEach(cont => {
            cont.isActive = userIds.includes(cont.userId);
            delete cont.socketId;
        });

        socket && socket.emit('contacts-list', { contacts: allActiveUsers });
    }
    getAndEmitAvailableUsers();
    const connectedIdsChecker = setInterval(getAndEmitAvailableUsers, 10000); // try every 10 seconds

    socket.on('send-offer', (data) => {
        console.log(`Sending an offer from ${userId} to ${data.recipientId}.`);

        if (io.sockets.adapter.rooms.get(data.recipientId)) {
            socket.to(data.recipientId).emit('receive-offer', {
                offererId: userId,
                offer: data.offer
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
                answer: data.answer
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
                candidate: data.candidate
            });
        } else {
            console.log(`User id ${data.recipientId} is not connected.`);
        }
    });

    socket.on('leave-chat', (data) => {
        console.log(`${userId} leaving the chat with ${data.recipientId}.`);

        if (io.sockets.adapter.rooms.get(data.recipientId)) {
            socket.to(data.recipientId).emit('receive-leave', {
                leaverId: userId
            });
        } else {
            console.log(`User ${data.recipientId} is not connected.`);
        }
    });

    socket.on('disconnect', () => {
        console.log(`Client ${userId} with socket id ${socket.id} disconnected.`);
        delete activeUsers[userId];
        if (connectedIdsChecker) clearInterval(connectedIdsChecker);
    });
});

server.listen(PORT, () => {
    console.log(`Server listening on ${PORT}`);
});