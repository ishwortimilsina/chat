const app = require("express")();
const server = require('http').createServer(app);
const io = require('socket.io')(server);
const _ = require('lodash');
const { generateRandomString } = require("./utils/utils");

const PORT = process.env.PORT || 3001;

const activeUsers = {};
const rooms = {};

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

    // send all currently active contacts in the room to this user
    function sendAllActiveContactsToThisClient(roomId) {
        const otherUsers = [];
        _.forEach(activeUsers, (cont, key) => {
            if (cont.userId !== userId && rooms[roomId].roomies.includes(cont.userId)) {
                otherUsers.push({ userId: cont.userId, userName: cont.userName, isActive: cont.isActive });
            }
        });

        console.log(otherUsers)
        socket.emit('contacts-list', { roomId, contacts: otherUsers });
    }

    // send this client to all other clients in the room
    function sendThisContactActivenessToAllOtherClients(isActive, roomId) {
        const currUser = _.omit(activeUsers[userId], ['socketId', 'rooms']);
        _.forEach(activeUsers, (cont, key) => {
            if (cont.userId !== userId && rooms[roomId].roomies.includes(cont.userId)) {
                io.to(cont.socketId).emit(
                    isActive ? 'new-contact' : 'remove-contact',
                    {
                        roomId,
                        contact: currUser
                    }
                );
            }
        });
    }

    socket.on('create-room', ({ roomName  }) => {
        let roomId = generateRandomString().toLowerCase();
        while (rooms[roomId]) {
            roomId = generateRandomString();
        }

        rooms[roomId] = {
            roomId,
            roomName,
            roomies: [],
            isActive: false
        };
        io.to(socket.id).emit('create-room', {
            roomId,
            success: true
        });
    });

    socket.on('check-room-availability', ({ roomId }) => {
        io.to(socket.id).emit('room-availability', {
            roomId,
            isAvailable: !!rooms[roomId]
        });
    });

    socket.on('join-room', ({ roomId }) => {
        if (!rooms[roomId]) {
            io.to(socket.id).emit('join-room', {
                roomId,
                success: false,
                msg: 'Room does not exist.'
            });
        } else {
            if (!activeUsers[userId].rooms.includes(roomId)) {
                activeUsers[userId].rooms.push(roomId);
            }
            rooms[roomId].roomies.push(userId);
            rooms[roomId].isActive = true;
            io.to(socket.id).emit('join-room', {
                roomId,
                roomName: rooms[roomId].roomName,
                success: true
            });
            sendAllActiveContactsToThisClient(roomId);
            sendThisContactActivenessToAllOtherClients(true, roomId);
        }
    });

    socket.on('leave-room', ({ roomId }) => {
        if (rooms[roomId]) {
            if (!activeUsers[userId].rooms.includes(roomId)) {
                activeUsers[userId].rooms = activeUsers[userId].rooms.filter(id => roomId !== id);
            }
            rooms[roomId].roomies = rooms[roomId].roomies.filter(id => id !== userId);
            if (!rooms[roomId].roomies.length) {
                rooms[roomId].isActive = false;
            }

            sendThisContactActivenessToAllOtherClients(false, roomId);
        }
        io.to(socket.id).emit('leave-room', {
            roomId,
            success: true
        });
    });

    socket.on('send-offer', (data) => {
        console.log(`Sending an offer from ${userId} to ${data.recipientId}.`);

        if (activeUsers[data.recipientId]) {
            io.to(activeUsers[data.recipientId].socketId).emit('receive-offer', {
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

        if (activeUsers[data.offererId]) {
            io.to(activeUsers[data.offererId].socketId).emit('receive-answer', {
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

        if (activeUsers[data.recipientId]) {
            io.to(activeUsers[data.recipientId].socketId).emit('receive-candidate', {
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
        // remove this user from all rooms
        activeUsers[userId].rooms.forEach((roomId) => {
            rooms[roomId].roomies = rooms[roomId].roomies.filter(id => id !== userId);
        });
        // send to all contacts in all rooms that this client was connected
        // that this client is now disconnected
        activeUsers[userId].rooms.forEach((roomId) => {
            sendThisContactActivenessToAllOtherClients(false, roomId);
        });
        delete activeUsers[userId];
    });
});

server.listen(PORT, () => {
    console.log(`Server listening on ${PORT}`);
});